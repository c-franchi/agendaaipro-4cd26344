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
  if(body.action==='status')return reply(req,{voucherVersion:'2026-10-30',enabled:Boolean(enabled&&key&&webhook),recurringEnabled:Boolean(enabled&&key&&webhook&&Deno.env.get('STRIPE_RECURRING_ENABLED')==='true'),message:enabled&&key&&webhook?'Implementação disponível na contratação; mensalidade após a entrega.':'Pagamento aguarda a configuração final. Você pode registrar a solicitação sem cobrança.'});
  const db=database(),user=await identity(req,db);if(!user)return reply(req,{error:'Entre na sua conta para pagar.'},401);
  if(!enabled||!key||!webhook)return reply(req,{error:'O pagamento por cartão ainda não está liberado. Seu pedido pode ser acompanhado normalmente.'},503);
  if(!isUuid(body.orderId)||!['setup','subscription'].includes(body.kind))return reply(req,{error:'Pedido ou cobrança inválidos.'},400);
  const {data:order,error}=await db.from('business_orders').select('*').eq('id',body.orderId).eq('user_id',user.id).single();
  if(error||!order)return reply(req,{error:'Pedido não encontrado.'},404);
  const kind=body.kind as 'setup'|'subscription';
  if(kind==='setup'&&(order.stage!=='awaiting_payment'||order.payment_status!=='pending'))return reply(req,{error:'O pedido precisa ter o escopo aprovado antes do pagamento.'},409);
  if(kind==='subscription'&&(Deno.env.get('STRIPE_RECURRING_ENABLED')!=='true'||order.stage!=='ready'||order.payment_status!=='paid'||order.stripe_subscription_id))return reply(req,{error:'A mensalidade só pode ser iniciada após a disponibilização da plataforma.'},409);
  let contract:any=null;
  if(kind==='setup'){
   const {data,error:consentError}=await db.from('order_contract_acceptances').select('*').eq('order_id',order.id).eq('user_id',user.id).order('accepted_at',{ascending:false}).limit(1).maybeSingle();
   if(consentError)throw consentError;contract=data;
   const code=typeof body.voucherCode==='string'?body.voucherCode.trim().toUpperCase():order.requested_setup_code||'';
   if(!contract||contract.snapshot?.quote?.setupCode!==code)return reply(req,{error:'Confira e aceite o contrato e os valores deste pagamento em Meus pedidos antes de continuar.'},409);
  }
  const stripe=new Stripe(key,{apiVersion:'2025-08-27.basil'});
  const account=await stripe.accounts.retrieve();
  const live=key.startsWith('sk_live_')||key.startsWith('rk_live_');
  if(live&&(!account.charges_enabled||!Deno.env.get('STRIPE_EXPECTED_ACCOUNT_ID')||account.id!==Deno.env.get('STRIPE_EXPECTED_ACCOUNT_ID')))return reply(req,{error:'A conta Stripe ainda precisa ser validada para receber pagamentos.'},503);
  const column=kind==='setup'?'setup_session_id':'subscription_session_id';
  const previousId=order[column];
  if(previousId){const existing=await stripe.checkout.sessions.retrieve(previousId);if(existing.status==='open'&&existing.url){if(kind==='setup'&&existing.amount_total!==contract.snapshot.quote.setupDueCents)return reply(req,{error:'O valor do checkout difere do contrato aceito. Aguarde a expiração e confira o contrato novamente.'},409);if((existing.metadata?.voucher_code||'')!==(typeof body.voucherCode==='string'?body.voucherCode.trim().toUpperCase():''))return reply(req,{error:'Este checkout já foi aberto com outra condição. Aguarde sua expiração para trocar o voucher.'},409);return reply(req,{url:existing.url});}if(existing.status==='complete')return reply(req,{error:'Pagamento em confirmação. Atualize Meus pedidos.'},409);if(existing.status!=='expired')throw Error('Unknown checkout state');const {error:releaseError}=await db.from('commerce_voucher_reservations').update({state:'released'}).eq('order_id',order.id).eq('kind',kind).eq('session_id',previousId).eq('state','reserved');if(releaseError)throw releaseError;const {error:clearError}=await db.from('business_orders').update({[kind==='setup'?'setup_due_cents':'monthly_due_cents']:null}).eq('id',order.id).eq(column,previousId);if(clearError)throw clearError;}
  let reservation:any=null;
  const code=typeof body.voucherCode==='string'?body.voucherCode.trim().toUpperCase():(kind==='setup'?order.requested_setup_code:order.requested_monthly_code)||'';
  if(code.length>80)return reply(req,{error:'Código inválido.'},400);
  const {data:held,error:heldError}=await db.from('commerce_voucher_reservations').select('*').eq('order_id',order.id).eq('kind',kind).neq('state','released').maybeSingle();
  if(heldError)throw heldError;
  if(held){if(code!==held.code)return reply(req,{error:'Use o mesmo voucher desta tentativa ou aguarde a expiração.'},409);reservation=held;}
  else if(code){
   // Previous session was verified expired above. It is now safe to clear its pointer.
   const {data,error}=await db.rpc('commerce_reserve_voucher',{p_order:order.id,p_user:user.id,p_kind:kind,p_code:code});
   if(error)return reply(req,{error:error.message},400);reservation=data;
  }

  if(kind==='setup'&&(reservation?.due_cents??order.setup_cents)!==contract.snapshot.quote.setupDueCents)return reply(req,{error:'As condições do voucher mudaram. Confira e aceite o contrato atualizado em Meus pedidos.'},409);
  const params:any=checkoutParams(order,kind,req.headers.get('origin')!);
  if(contract){params.metadata.contract_acceptance_id=contract.id;params.metadata.contract_version=contract.version;}
  if(reservation){
   const coupon=await stripe.coupons.create({amount_off:reservation.discount_cents,currency:'brl',duration:kind==='subscription'&&reservation.months===0?'forever':kind==='setup'||reservation.months===1?'once':'repeating',...(kind==='subscription'&&reservation.months>1?{duration_in_months:reservation.months}:{}),name:`Voucher ${reservation.code}`},{idempotencyKey:`commerce-voucher:${reservation.id}`});
   params.discounts=[{coupon:coupon.id}];params.metadata.voucher_reservation=reservation.id;params.metadata.voucher_code=reservation.code;
   const {error}=await db.from('commerce_voucher_reservations').update({coupon_id:coupon.id}).eq('id',reservation.id);if(error)throw error;
  }
  const session=await stripe.checkout.sessions.create(params,{idempotencyKey:`commerce-v3:${order.id}:${kind}:${reservation?.id||previousId||'first'}`});
  if(reservation){const {error}=await db.from('commerce_voucher_reservations').update({session_id:session.id}).eq('id',reservation.id);if(error)throw error;}
  const {error:saveError}=await db.from('business_orders').update({[column]:session.id,livemode:session.livemode,updated_at:new Date().toISOString()}).eq('id',order.id).eq('user_id',user.id).eq('stage',order.stage).select('id').single();
  if(saveError){await stripe.checkout.sessions.expire(session.id).catch(()=>{});throw saveError;}
  return reply(req,{url:session.url});
 }catch{return reply(req,{error:'Não foi possível abrir o pagamento. Nenhuma confirmação foi registrada. Tente novamente.'},503)}
});
