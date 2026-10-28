import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import {BILLING_VERSION,isUuid,paymentMatches} from '../_shared/commerce.ts';
import {database} from '../_shared/commerce-runtime.ts';
const id=(v:unknown):string|null=>typeof v==='string'?v:v&&typeof v==='object'&&'id' in v?String(v.id):null;
serve(async req=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const key=Deno.env.get('STRIPE_SECRET_KEY'),secret=Deno.env.get('STRIPE_WEBHOOK_SECRET');
 if(!key||!secret)return new Response('Webhook not configured',{status:503});
 const signature=req.headers.get('stripe-signature');if(!signature)return new Response('Missing signature',{status:400});
 const stripe=new Stripe(key,{apiVersion:'2025-08-27.basil'});
 let event:Stripe.Event;
 try{event=await stripe.webhooks.constructEventAsync(await req.text(),signature,secret,undefined,Stripe.createSubtleCryptoProvider())}catch{return new Response('Invalid signature',{status:400})}
 const live=key.startsWith('sk_live_')||key.startsWith('rk_live_');
 if(event.livemode!==live)return new Response('Environment mismatch',{status:400});
 try{
  const db=database();
  if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
   const session=event.data.object as Stripe.Checkout.Session;
   if(session.metadata?.billing_version!==BILLING_VERSION)return Response.json({ignored:true});
   if(session.payment_status!=='paid')return Response.json({pending:true});
   const orderId=session.metadata.order_id,kind=session.metadata.kind;
   if(!isUuid(orderId)||!['setup','subscription'].includes(kind))throw Error('Invalid metadata');
   const {data:order,error}=await db.from('business_orders').select('*').eq('id',orderId).single();
   if(error||!order||!paymentMatches(order,session,kind as 'setup'|'subscription'))throw Error('Payment mismatch');
   // Stripe can deliver a refund event before the checkout event. Read current
   // payment truth before fulfillment so an already-refunded order is never queued.
   if(kind==='setup'){
    const intentId=id(session.payment_intent);if(!intentId)throw Error('Missing payment intent');
    const intent=await stripe.paymentIntents.retrieve(intentId,{expand:['latest_charge']});
    if(intent.status!=='succeeded'||intent.amount_received!==order.setup_cents||intent.currency!=='brl')throw Error('Payment intent mismatch');
    const charge=typeof intent.latest_charge==='string'?await stripe.charges.retrieve(intent.latest_charge):intent.latest_charge;
    if(!charge||charge.amount!==order.setup_cents||charge.currency!=='brl')throw Error('Missing charge');
    if(charge.amount_refunded>=charge.amount){
     const {error:refundError}=await db.rpc('commerce_refund',{p_intent:intentId,p_event:event.id,p_full:true,p_order:order.id});
     if(refundError)throw refundError;
     return Response.json({received:true,refunded:true});
    }
   }
   const {error:recordError}=await db.rpc('commerce_record_payment',{p_order:orderId,p_event:event.id,p_kind:kind,p_session:session.id,p_amount:session.amount_total,p_currency:session.currency,p_live:session.livemode,p_customer:id(session.customer),p_intent:id(session.payment_intent),p_subscription:id(session.subscription)});
   if(recordError)throw recordError;
  }else if(event.type==='charge.refunded'){
   const charge=event.data.object as Stripe.Charge;
   const intent=id(charge.payment_intent);if(intent){const {error}=await db.rpc('commerce_refund',{p_intent:intent,p_event:event.id,p_full:charge.amount_refunded>=charge.amount});if(error)throw error;}
  }else if(['customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed'].includes(event.type)){
   const object=event.data.object as unknown as {id:string;subscription?:unknown;parent?:{subscription_details?:{subscription?:unknown}}};
   const subscriptionId=event.type.startsWith('customer.subscription')?object.id:id(object.parent?.subscription_details?.subscription||object.subscription);
   if(subscriptionId){
    const {data:order,error}=await db.from('business_orders').select('id').eq('stripe_subscription_id',subscriptionId).maybeSingle();if(error)throw error;
    if(order){const current=await stripe.subscriptions.retrieve(subscriptionId);const {error:updateError}=await db.from('business_orders').update({subscription_status:current.status,billing_event_created:event.created,updated_at:new Date().toISOString()}).eq('id',order.id).lte('billing_event_created',event.created);if(updateError)throw updateError;}
   }
  }
  return Response.json({received:true});
 }catch{console.error('commerce_webhook_failed',event.id);return new Response('Processing failed; retry required',{status:500})}
});
