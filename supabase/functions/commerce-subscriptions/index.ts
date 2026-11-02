import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {allowed,cors,reply,database,identity} from '../_shared/commerce-runtime.ts';
import {subscriptionSummary} from '../_shared/subscription-summary.ts';
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors(req)});
 if(req.method!=='POST'||!allowed(req))return reply(req,{error:'Origem ou método inválido.'},403);
 try{
  const db=database(),user=await identity(req,db);
  if(!user)return reply(req,{error:'Entre na sua conta para continuar.'},401);
  // Ownership is server-derived. Caller-supplied email, customer or subscription IDs are never used.
  const {data:orders,error}=await db.from('business_orders').select('id,stripe_subscription_id').eq('user_id',user.id).eq('payment_status','paid').in('stage',['ready','active']).limit(100);
  if(error)throw error;
  const key=Deno.env.get('STRIPE_SECRET_KEY');
  const subscriptions=await Promise.all((orders||[]).filter(o=>o.stripe_subscription_id).map(async order=>{
   try{
    if(!key)throw Error('Billing unavailable');
    const res=await fetch('https://api.stripe.com/v1/subscriptions/'+encodeURIComponent(order.stripe_subscription_id!),{headers:{Authorization:'Bearer '+key,'Stripe-Version':'2025-08-27.basil'},signal:AbortSignal.timeout(10000)});
    if(!res.ok)throw Error('Billing unavailable');
    const sub=await res.json();
    if(sub.id!==order.stripe_subscription_id)throw Error('Subscription mismatch');
    return {orderId:order.id,...subscriptionSummary(sub),unavailable:false};
   }catch{return {orderId:order.id,unavailable:true};}
  }));
  return reply(req,{subscriptions});
 }catch{return reply(req,{error:'Não foi possível consultar sua assinatura. Tente novamente.'},503);}
});
