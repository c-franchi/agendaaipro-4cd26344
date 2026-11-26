import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
const sharedModule={exports:{}};
new Function('exports','module',compile(readFileSync('supabase/functions/_shared/commerce.ts','utf8')))(sharedModule.exports,sharedModule);
const shared=sharedModule.exports;
const owner='11111111-1111-4111-8111-111111111111',orderId='22222222-2222-4222-8222-222222222222';
let order,reservation,session,intent,user,events,customerCalls,defaultCalls,checkoutCalls,expireCalls,couponCalls,params;
const reset=()=>{
 order={id:orderId,user_id:owner,email:'fixture@example.com',plan_type:'pro',setup_cents:35000,setup_due_cents:0,monthly_cents:6990,stage:'awaiting_payment',payment_status:'pending',requested_setup_code:'FREE100',setup_session_id:null,subscription_session_id:null,subscription_status:'not_started'};
 reservation={id:'reservation_fixture',order_id:orderId,kind:'setup',code:'FREE100',base_cents:35000,discount_cents:35000,due_cents:0,state:'reserved',session_id:null};
 intent={id:'seti_fixture',status:'succeeded',customer:'cus_fixture',payment_method:'pm_fixture',usage:'off_session',metadata:{billing_version:shared.BILLING_VERSION,order_id:orderId,user_id:owner,checkout_flow:'card-setup-v1'}};
 session=null;user={id:owner};events=new Set();customerCalls=0;defaultCalls=0;checkoutCalls=0;expireCalls=0;couponCalls=0;
};reset();
const db={from(table){let patch=null;const filters=[];const result=()=>{
 const data=table==='business_orders'?order:table==='commerce_voucher_reservations'?(reservation.state==='released'?null:reservation):{id:'contract_fixture',order_id:orderId,user_id:owner,version:'fixture-v1',snapshot:{quote:{setupCode:'FREE100',setupDueCents:0}}};
 if(data&&filters.some(([k,v])=>data[k]!==v))return {data:null,error:Error('not found')};
 if(data&&patch)Object.assign(data,patch);return {data,error:null};
};return {select(){return this},order(){return this},limit(){return this},eq(k,v){filters.push([k,v]);return this},neq(){return this},update(p){patch=p;return this},single:async()=>result(),maybeSingle:async()=>result(),then(resolve,reject){return Promise.resolve(result()).then(resolve,reject)}};},async rpc(name,p){
 if(name==='commerce_reserve_voucher'){reservation={...reservation,id:'reservation_retry',state:'reserved',session_id:null};order.setup_due_cents=0;return {data:reservation,error:null};}
 if(name==='commerce_record_payment'){
  assert.equal(p.p_amount,0);assert.equal(p.p_currency,'brl');assert.equal(p.p_customer,'cus_fixture');assert.equal(p.p_intent,null);assert.equal(p.p_subscription,null);
  if(!events.has(p.p_event)){events.add(p.p_event);order.stage='queued';order.payment_status='paid';order.stripe_customer_id=p.p_customer;reservation.state='consumed';}
 }
 return {data:true,error:null};
}};
class FakeStripe{
 static createSubtleCryptoProvider(){return {};}
 accounts={retrieve:async()=>({id:'acct_fixture',charges_enabled:true})};
 customers={create:async()=>{customerCalls++;return {id:'cus_fixture'}},update:async(id,p)=>{assert.equal(id,'cus_fixture');assert.equal(p.invoice_settings.default_payment_method,'pm_fixture');defaultCalls++;return {};}};
 coupons={create:async()=>{couponCalls++;throw Error('Free setup must not create a coupon');}};
 setupIntents={retrieve:async()=>intent};
 checkout={sessions:{retrieve:async()=>session,expire:async()=>{expireCalls++;session={...session,status:'expired'};return session;},create:async(p)=>{
  checkoutCalls++;params=p;session={id:'cs_fixture',status:'open',mode:p.mode,amount_total:null,currency:null,payment_status:'no_payment_required',livemode:false,metadata:{...p.metadata},customer:p.customer,setup_intent:'seti_fixture',payment_intent:null,subscription:null,url:'https://checkout.stripe.com/c/pay/fixture'};return session;
 }}};
 webhooks={constructEventAsync:async(payload,signature)=>{if(signature!=='fixture_signature')throw Error('Invalid signature');return JSON.parse(payload);}};
}
const env={STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',STRIPE_CHECKOUT_ENABLED:'true',STRIPE_RECURRING_ENABLED:'true'};
function load(path){let handler;const req=id=>id.includes('http/server')?{serve:f=>{handler=f}}:id.includes('stripe@')?{__esModule:true,default:FakeStripe}:id.endsWith('/commerce.ts')?shared:id.includes('order-notifications')?{notifyOrder:async()=>{}}:{allowed:()=>true,cors:()=>({}),reply:(_req,data,status=200)=>Response.json(data,{status}),database:()=>db,identity:async()=>user};new Function('require','exports','module','Deno',compile(readFileSync(path,'utf8')))(req,{}, {exports:{}},{env:{get:k=>env[k]}});return handler;}
const checkout=load('supabase/functions/create-checkout/index.ts'),webhook=load('supabase/functions/stripe-commerce-webhook/index.ts');
const request=()=>new Request('https://fixture.example/create-checkout',{method:'POST',headers:{origin:'https://agendaaipro.com.br','content-type':'application/json'},body:JSON.stringify({orderId,kind:'setup',voucherCode:'FREE100'})});
const complete=(signature='fixture_signature')=>webhook(new Request('https://fixture.example/webhook',{method:'POST',headers:{'stripe-signature':signature},body:JSON.stringify({id:'evt_fixture',type:'checkout.session.completed',livemode:false,data:{object:session}})}));
assert.equal((await checkout(request())).status,200);
assert.equal(params.mode,'setup');assert.equal(params.customer,'cus_fixture');assert.equal(params.line_items,undefined);assert.equal(params.discounts,undefined);assert.equal(params.subscription_data,undefined);assert.equal(params.setup_intent_data.usage,undefined);assert.equal(params.setup_intent_data.metadata.checkout_flow,'card-setup-v1');assert.equal(couponCalls,0);
assert.equal((await checkout(request())).status,200);assert.equal(checkoutCalls,1);assert.equal(customerCalls,1);
session.status='complete';assert.equal((await complete()).status,200);assert.equal(order.stage,'queued');assert.equal(order.payment_status,'paid');assert.equal(order.subscription_status,'not_started');assert.equal(reservation.state,'consumed');assert.equal(defaultCalls,1);
assert.equal((await complete()).status,200);assert.equal(events.size,1);assert.equal(defaultCalls,1);
for(const invalid of [{status:'requires_action'},{payment_method:null},{customer:'cus_other'},{usage:'on_session'},{metadata:{...intent.metadata,user_id:'other'}}]){
 reset();await checkout(request());session.status='complete';intent={...intent,...invalid};assert.equal((await complete()).status,500);assert.equal(order.payment_status,'pending');assert.equal(events.size,0);
}
reset();await checkout(request());assert.equal((await complete()).status,500);assert.equal(order.stage,'awaiting_payment');
reset();await checkout(request());session.status='complete';reservation.discount_cents=34999;assert.equal((await complete()).status,500);assert.equal(events.size,0);assert.equal(defaultCalls,0);
reset();await checkout(request());session.status='complete';assert.equal((await complete('invalid')).status,400);assert.equal(events.size,0);
reset();user=null;assert.equal((await checkout(request())).status,401);assert.equal(checkoutCalls,0);
reset();order.setup_session_id='cs_old';reservation.session_id='cs_old';session={id:'cs_old',status:'open',mode:'payment',amount_total:0,url:'https://checkout.stripe.com/c/pay/old',metadata:{voucher_code:'FREE100'}};
assert.equal((await checkout(request())).status,200);assert.equal(expireCalls,1);assert.equal(params.mode,'setup');assert.equal(reservation.state,'reserved');assert.equal(order.setup_due_cents,0);
reset();order.setup_session_id='cs_completed';session={id:'cs_completed',status:'complete'};
assert.equal((await checkout(request())).status,409);assert.equal(expireCalls,0);assert.equal(checkoutCalls,0);
reset();await checkout(request());session={...session,mode:'payment',amount_total:0,status:'complete'};
assert.equal((await complete()).status,500);assert.equal(order.payment_status,'pending');assert.equal(events.size,0);
order.payment_status='paid';order.stage='queued';const settled=JSON.stringify(order);
assert.equal((await complete()).status,200);assert.equal(JSON.stringify(order),settled);assert.equal(defaultCalls,0);
// Other plans use the same card flow, never a charge or premature subscription.
for(const plan of ['essencial','pro','premium']){const p=shared.checkoutParams({...order,plan_type:plan,setup_due_cents:0},'setup','https://agendaaipro.com.br');assert.equal(p.mode,'setup');assert.equal(p.line_items,undefined);assert.equal(p.subscription_data,undefined);}
assert.equal(shared.checkoutParams({...order,setup_due_cents:35000},'setup','https://agendaaipro.com.br').payment_intent_data.setup_future_usage,'off_session');
console.log('PASS: zero implementation collects and validates card; automatic fulfillment; no setup charge/subscription; all plans; retry/legacy replacement; signature/ownership/intent/voucher failures; no live Stripe requests.');