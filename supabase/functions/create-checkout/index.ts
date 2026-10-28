import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import {isUuid,checkoutParams} from '../_shared/commerce.ts';
import {allowed,cors,reply,database,identity} from '../_shared/commerce-runtime.ts';
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors(req)});
 if(req.method!=='POST'||!allowed(req))return reply(req,{error:'Origem ou método inválido.'},403);
 try{
  const body=await req.json();
  const enabled=Deno.env.get('STRIPE_CHECKOUT_ENABLED')==='true';
  const key=Deno.env.get('STRIPE_SECRET_KEY'),webhook=Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if(body.action==='status')return reply(req,{enabled:Boolean(enabled&&key&&webhook),recurringEnabled:Boolean(enabled&&key&&webhook&&Deno.env.get('STRIPE_RECURRING_ENABLED')==='true'),message:enabled&&key&&webhook?'Disponível após aprovação do pedido.':'Cartão em preparação. Aguardamos a liberação da Stripe e a configuração final.'});
  const db=database(),user=await identity(req,db);if(!user)return reply(req,{error:'Entre na sua conta para pagar.'},401);
  if(!enabled||!key||!webhook)return reply(req,{error:'O pagamento por cartão ainda não está liberado. Seu pedido pode ser acompanhado normalmente.'},503);
  if(!isUuid(body.orderId)||!['setup','subscription'].includes(body.kind))return reply(req,{error:'Pedido ou cobrança inválidos.'},400);
  const {data:order,error}=await db.from('business_orders').select('*').eq('id',body.orderId).eq('user_id',user.id).single();
  if(error||!order)return reply(req,{error:'Pedido não encontrado.'},404);
  const kind=body.kind as 'setup'|'subscription';
  if(kind==='setup'&&(order.stage!=='awaiting_payment'||order.payment_status!=='pending'))return reply(req,{error:'O pedido precisa ter o escopo aprovado antes do pagamento.'},409);
  if(kind==='subscription'&&(Deno.env.get('STRIPE_RECURRING_ENABLED')!=='true'||order.stage!=='ready'||order.payment_status!=='paid'||order.stripe_subscription_id))return reply(req,{error:'A mensalidade só pode ser iniciada após a disponibilização da plataforma.'},409);
  const stripe=new Stripe(key,{apiVersion:'2025-08-27.basil'});
  const account=await stripe.accounts.retrieve();
  const live=key.startsWith('sk_live_')||key.startsWith('rk_live_');
  if(live&&(!account.charges_enabled||!Deno.env.get('STRIPE_EXPECTED_ACCOUNT_ID')||account.id!==Deno.env.get('STRIPE_EXPECTED_ACCOUNT_ID')))return reply(req,{error:'A conta Stripe ainda precisa ser validada para receber pagamentos.'},503);
  const column=kind==='setup'?'setup_session_id':'subscription_session_id';
  const previousId=order[column];
  if(previousId){const existing=await stripe.checkout.sessions.retrieve(previousId);if(existing.status==='open'&&existing.url)return reply(req,{url:existing.url});if(existing.status==='complete')return reply(req,{error:'Pagamento em confirmação. Atualize Meus pedidos.'},409);}
  const params=checkoutParams(order,kind,req.headers.get('origin')!);
  const session=await stripe.checkout.sessions.create(params,{idempotencyKey:`commerce-v3:${order.id}:${kind}:${previousId||'first'}`});
  const {error:saveError}=await db.from('business_orders').update({[column]:session.id,livemode:session.livemode,updated_at:new Date().toISOString()}).eq('id',order.id).eq('user_id',user.id).eq('stage',order.stage).select('id').single();
  if(saveError){await stripe.checkout.sessions.expire(session.id).catch(()=>{});throw saveError;}
  return reply(req,{url:session.url});
 }catch{return reply(req,{error:'Não foi possível abrir o pagamento. Nenhuma confirmação foi registrada. Tente novamente.'},503)}
});
