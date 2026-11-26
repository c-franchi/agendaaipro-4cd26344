import {notifyOrder} from '../_shared/order-notifications.ts';
import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';
import {BILLING_VERSION,isUuid,paymentMatches,setupAuthorizationMatches} from '../_shared/commerce.ts';
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
   if(session.payment_status!=='paid'&&!(session.payment_status==='no_payment_required'&&(session.amount_total===0||session.mode==='setup')))return Response.json({pending:true});
   const orderId=session.metadata.order_id,kind=session.metadata.kind;
   if(!isUuid(orderId)||!['setup','subscription'].includes(kind))throw Error('Invalid metadata');
   const {data:order,error}=await db.from('business_orders').select('*').eq('id',orderId).single();
   if(error||!order)throw Error('Unknown order');
   if(kind==='setup'&&session.mode==='payment'&&session.amount_total===0){if(order.payment_status==='paid'||order.payment_status==='refunded')return Response.json({received:true,legacy:true});throw Error('Card authorization required for free setup');}
   if(!paymentMatches(order,session,kind as 'setup'|'subscription'))throw Error('Payment mismatch');
   const cardSetup=session.mode==='setup';
   let savedCustomer:string|null=null,savedPaymentMethod:string|null=null;
   if(cardSetup){
    const current=await stripe.checkout.sessions.retrieve(session.id);
    if(current.status!=='complete'||current.livemode!==live||!paymentMatches(order,current,'setup')||id(current.customer)!==id(session.customer)||id(current.setup_intent)!==id(session.setup_intent))throw Error('Card checkout incomplete');
    const intentId=id(current.setup_intent),customer=id(current.customer);if(!intentId)throw Error('Missing setup intent');
    const intent=await stripe.setupIntents.retrieve(intentId);
    if(!setupAuthorizationMatches(order,customer,{status:intent.status,customer:id(intent.customer),payment_method:id(intent.payment_method),usage:intent.usage,metadata:intent.metadata}))throw Error('Card authorization mismatch');
    const paymentMethod=id(intent.payment_method);if(!customer||!paymentMethod)throw Error('Missing saved card');
    savedCustomer=customer;savedPaymentMethod=paymentMethod;
   }
   // Stripe can deliver a refund event before the checkout event. Read current
   // payment truth before fulfillment so an already-refunded order is never queued.
   const {data:reservation,error:reservationError}=await db.from('commerce_voucher_reservations').select('*').eq('order_id',order.id).eq('kind',kind).neq('state','released').maybeSingle();
   if(reservationError)throw reservationError;
   if(reservation){
    if(cardSetup){if(reservation.session_id!==session.id||session.metadata.voucher_reservation!==reservation.id||session.metadata.voucher_code!==reservation.code||reservation.due_cents!==0||reservation.base_cents!==order.setup_cents||reservation.discount_cents!==reservation.base_cents)throw Error('Free voucher mismatch');}
    else{const current=await stripe.checkout.sessions.retrieve(session.id,{expand:['discounts.coupon']});
     const coupon=current.discounts?.[0]?.coupon;
     if(reservation.session_id!==session.id||session.metadata.voucher_reservation!==reservation.id||id(coupon)!==reservation.coupon_id||current.total_details?.amount_discount!==reservation.discount_cents)throw Error('Voucher mismatch');}
   }else if(session.metadata.voucher_reservation)throw Error('Unknown voucher');
   if(kind==='subscription'){
    const subId=id(session.subscription);if(!subId)throw Error('Missing subscription');
    const sub=await stripe.subscriptions.retrieve(subId,{expand:['discounts']});
    if(!['active','trialing'].includes(sub.status)||sub.currency!=='brl'||id(sub.customer)!==id(session.customer)||sub.items.data.length!==1||sub.items.data[0].price.unit_amount!==order.monthly_cents||sub.items.data[0].price.recurring?.interval!=='month')throw Error('Subscription mismatch');
   }
   if(kind==='setup'&&(session.amount_total??0)>0){
    const intentId=id(session.payment_intent);if(!intentId)throw Error('Missing payment intent');
    const intent=await stripe.paymentIntents.retrieve(intentId,{expand:['latest_charge']});
    if(intent.status!=='succeeded'||intent.amount_received!==(order.setup_due_cents??order.setup_cents)||intent.currency!=='brl')throw Error('Payment intent mismatch');
    const charge=typeof intent.latest_charge==='string'?await stripe.charges.retrieve(intent.latest_charge):intent.latest_charge;
    if(!charge||charge.amount!==(order.setup_due_cents??order.setup_cents)||charge.currency!=='brl')throw Error('Missing charge');
    if(charge.amount_refunded>=charge.amount){
     const {error:refundError}=await db.rpc('commerce_refund',{p_intent:intentId,p_event:event.id,p_full:true,p_order:order.id});
     if(refundError)throw refundError;
     return Response.json({received:true,refunded:true});
    }
   }
   // Only pending orders may change the default card; replay must not overwrite
   // a card the customer has subsequently changed. No charge is made here.
   if(savedCustomer&&savedPaymentMethod&&order.payment_status==='pending')await stripe.customers.update(savedCustomer,{invoice_settings:{default_payment_method:savedPaymentMethod}});
   const {error:recordError}=await db.rpc('commerce_record_payment',{p_order:orderId,p_event:event.id,p_kind:kind,p_session:session.id,p_amount:cardSetup?0:session.amount_total,p_currency:cardSetup?'brl':session.currency,p_live:session.livemode,p_customer:id(session.customer),p_intent:id(session.payment_intent),p_subscription:id(session.subscription)});
   if(recordError)throw recordError;
   if(kind==='setup'){const {error:affError}=await db.rpc('affiliate_record_commission',{p_order:orderId,p_event:event.id,p_kind:'setup',p_amount:session.amount_total??0});if(affError)throw affError;}
   await notifyOrder(db,orderId).catch(()=>console.error('order_email_queued',orderId));
  }else if(event.type==='checkout.session.expired'){
   const session=event.data.object as Stripe.Checkout.Session;
   if(session.metadata?.billing_version===BILLING_VERSION&&isUuid(session.metadata.order_id)){
    const current=await stripe.checkout.sessions.retrieve(session.id);
    if(current.status==='expired'){
     const {error}=await db.rpc('commerce_release_voucher',{p_session:session.id});if(error)throw error;
    }
   }
  }else if(event.type==='charge.refunded'){
   const charge=event.data.object as Stripe.Charge;
   const intent=id(charge.payment_intent);if(intent){const {error}=await db.rpc('commerce_refund',{p_intent:intent,p_event:event.id,p_full:charge.amount_refunded>=charge.amount});if(error)throw error;}
  }else if(['customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed'].includes(event.type)){
   const object=event.data.object as unknown as {id:string;subscription?:unknown;parent?:{subscription_details?:{subscription?:unknown}}};
   const subscriptionId=event.type.startsWith('customer.subscription')?object.id:id(object.parent?.subscription_details?.subscription||object.subscription);
   if(subscriptionId){
    const {data:order,error}=await db.from('business_orders').select('id').eq('stripe_subscription_id',subscriptionId).maybeSingle();if(error)throw error;
    if(order){const current=await stripe.subscriptions.retrieve(subscriptionId);const {error:updateError}=await db.from('business_orders').update({subscription_status:current.status,billing_event_created:event.created,updated_at:new Date().toISOString()}).eq('id',order.id).lte('billing_event_created',event.created);if(updateError)throw updateError;if(event.type==='invoice.paid'){const {error:affError}=await db.rpc('affiliate_record_commission',{p_order:order.id,p_event:event.id,p_kind:'monthly',p_amount:Number((object as {amount_paid?:number}).amount_paid??0)});if(affError)throw affError;}await notifyOrder(db,order.id).catch(()=>console.error('order_email_queued',order.id));}
   }
  }
  return Response.json({received:true});
 }catch{console.error('commerce_webhook_failed',event.id);return new Response('Processing failed; retry required',{status:500})}
});
