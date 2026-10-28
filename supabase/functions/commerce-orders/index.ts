import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {catalog,isPlan,isUuid,validSiteUrl,BILLING_VERSION} from '../_shared/commerce.ts';
import {allowed,cors,reply,database,identity,administrator} from '../_shared/commerce-runtime.ts';
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors(req)});
 if(req.method!=='POST'||!allowed(req))return reply(req,{error:'Origem ou método inválido.'},403);
 try{
  const db=database(),user=await identity(req,db);if(!user)return reply(req,{error:'Entre na sua conta para continuar.'},401);
  const body=await req.json();const admin=administrator(user);
  if(body.action==='list'){
   let query=db.from('business_orders').select('*').order('created_at',{ascending:false}).limit(100);
   if(!admin)query=query.eq('user_id',user.id);
   const {data,error}=await query;if(error)throw error;return reply(req,{orders:data});
  }
  if(body.action==='request'){
   if(!isPlan(body.planType)||!isUuid(body.requestKey)||body.acceptedTerms!==BILLING_VERSION)return reply(req,{error:'Selecione o plano e aceite as condições da contratação.'},400);
   const name=typeof body.name==='string'?body.name.trim():'';if(name.length<2||name.length>100||!user.email)return reply(req,{error:'Informe seu nome (2 a 100 caracteres).'},400);
   const {data:previous}=await db.from('business_orders').select('*').eq('request_key',body.requestKey).maybeSingle();
   if(previous){if(previous.user_id!==user.id||previous.plan_type!==body.planType)return reply(req,{error:'Solicitação já utilizada.'},409);return reply(req,{order:previous});}
   const p=catalog[body.planType as keyof typeof catalog];
   const {data,error}=await db.from('business_orders').insert({request_key:body.requestKey,user_id:user.id,name,email:user.email.toLowerCase(),plan_type:body.planType,module_plan:p.modulePlan,setup_cents:p.setupCents,monthly_cents:p.monthlyCents,scope_note:`Condições ${BILLING_VERSION} aceitas; confirmação de escopo pendente.`}).select('*').single();
   if(error){if(error.code==='23505')return reply(req,{error:'Solicitação em processamento. Consulte Meus pedidos.'},409);throw error}
   return reply(req,{order:data},201);
  }
  if(!admin)return reply(req,{error:'Apenas a administração pode aprovar e liberar plataformas.'},403);
  if(!isUuid(body.orderId)||!['approve','start','ready'].includes(body.action)||typeof body.note!=='string'||body.note.trim().length<3||body.note.length>1000)return reply(req,{error:'Confira o pedido e informe uma observação de 3 a 1000 caracteres.'},400);
  if(body.action==='ready'&&(!validSiteUrl(body.websiteUrl)||!/^[-a-z0-9]{3,80}$/.test(body.installationId||'')||body.modulesConfigured!==true))return reply(req,{error:'Informe o domínio HTTPS e a instalação. Confirme a configuração dos módulos contratados.'},400);
  const {error}=await db.rpc('commerce_transition',{p_order:body.orderId,p_actor:user.id,p_action:body.action,p_note:body.note.trim(),p_url:body.websiteUrl||null,p_installation:body.installationId||null});
  if(error)return reply(req,{error:'Este pedido não permite essa mudança. Atualize a lista e confira o pagamento.'},409);
  return reply(req,{ok:true});
 }catch{return reply(req,{error:'Não foi possível processar o pedido. Tente novamente.'},503)}
});
