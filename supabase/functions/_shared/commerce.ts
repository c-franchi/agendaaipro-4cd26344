export const BILLING_VERSION='2026-10-28-v3';
export const catalog={
 essencial:{name:'Agenda',setupCents:25000,monthlyCents:3990,modulePlan:'agenda'},
 pro:{name:'Gestão e Vendas',setupCents:35000,monthlyCents:6990,modulePlan:'gestao'},
 premium:{name:'Premium',setupCents:69000,monthlyCents:9990,modulePlan:'premium'},
} as const;
export type CommercialPlan=keyof typeof catalog;
export const isPlan=(v:unknown):v is CommercialPlan=>typeof v==='string'&&Object.prototype.hasOwnProperty.call(catalog,v);
export const isUuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
export function validSiteUrl(value:unknown):value is string{try{if(typeof value!=='string'||value.length>300)return false;const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/'&&!['localhost','127.0.0.1'].includes(u.hostname)}catch{return false}}
export function paymentMatches(order:{id:string;user_id:string;setup_cents:number;monthly_cents:number;setup_session_id:string|null;subscription_session_id:string|null},session:{id:string;metadata?:Record<string,string>|null;currency:string|null;amount_total:number|null;payment_status:string;mode:string},kind:'setup'|'subscription'){
 return session.metadata?.billing_version===BILLING_VERSION&&session.metadata.order_id===order.id&&session.metadata.user_id===order.user_id&&session.metadata.kind===kind&&session.currency==='brl'&&session.amount_total===(kind==='setup'?order.setup_cents:order.monthly_cents)&&session.payment_status==='paid'&&session.mode===(kind==='setup'?'payment':'subscription')&&session.id===(kind==='setup'?order.setup_session_id:order.subscription_session_id);
}
export function checkoutParams(order:{id:string;user_id:string;plan_type:CommercialPlan;email:string;setup_cents:number;monthly_cents:number;stripe_customer_id?:string|null},kind:'setup'|'subscription',origin:string){
 const p=catalog[order.plan_type];
 return {
  mode:kind==='setup'?'payment' as const:'subscription' as const,
  payment_method_types:['card' as const],
  ...(order.stripe_customer_id?{customer:order.stripe_customer_id}:{customer_email:order.email,...(kind==='setup'?{customer_creation:'always' as const}:{})}),
  client_reference_id:order.id,
  line_items:[{quantity:1,price_data:{currency:'brl',unit_amount:kind==='setup'?order.setup_cents:order.monthly_cents,...(kind==='subscription'?{recurring:{interval:'month' as const}}:{}),product_data:{name:`AgendaAÍ ${p.name} — ${kind==='setup'?'implementação única':'mensalidade'}`}}}],
  success_url:`${origin}/payment-success?order=${order.id}`,
  cancel_url:`${origin}/meus-pedidos?cancelled=1`,
  metadata:{billing_version:BILLING_VERSION,order_id:order.id,user_id:order.user_id,kind},
  ...(kind==='subscription'?{subscription_data:{metadata:{billing_version:BILLING_VERSION,order_id:order.id}}}:{}),
 };
}
