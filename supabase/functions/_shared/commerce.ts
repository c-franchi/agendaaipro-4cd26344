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
export function paymentMatches(order:{id:string;user_id:string;setup_cents:number;monthly_cents:number;setup_due_cents?:number|null;monthly_due_cents?:number|null;setup_session_id:string|null;subscription_session_id:string|null},session:{id:string;metadata?:Record<string,string>|null;currency:string|null;amount_total:number|null;payment_status:string;mode:string},kind:'setup'|'subscription'){
 if(session.mode==='setup')return kind==='setup'&&(order.setup_due_cents??order.setup_cents)===0&&session.metadata?.checkout_flow==='card-setup-v1'&&session.metadata.billing_version===BILLING_VERSION&&session.metadata.order_id===order.id&&session.metadata.user_id===order.user_id&&session.metadata.kind==='setup'&&session.id===order.setup_session_id&&(session.currency===null||session.currency==='brl')&&(session.amount_total===null||session.amount_total===0)&&session.payment_status==='no_payment_required';
 return session.metadata?.billing_version===BILLING_VERSION&&session.metadata.order_id===order.id&&session.metadata.user_id===order.user_id&&session.metadata.kind===kind&&session.currency==='brl'&&session.amount_total===(kind==='setup'?(order.setup_due_cents??order.setup_cents):(order.monthly_due_cents??order.monthly_cents))&&(session.payment_status==='paid'||(session.payment_status==='no_payment_required'&&session.amount_total===0))&&session.mode===(kind==='setup'?'payment':'subscription')&&session.id===(kind==='setup'?order.setup_session_id:order.subscription_session_id);
}
export function setupAuthorizationMatches(order:{id:string;user_id:string},customer:string|null,intent:{status:string;customer:string|null;payment_method:string|null;usage:string|null;metadata:Record<string,string>}){
 return Boolean(customer&&intent.status==='succeeded'&&intent.customer===customer&&intent.payment_method&&intent.usage==='off_session'&&intent.metadata.billing_version===BILLING_VERSION&&intent.metadata.order_id===order.id&&intent.metadata.user_id===order.user_id&&intent.metadata.checkout_flow==='card-setup-v1');
}
export function checkoutParams(order:{id:string;user_id:string;plan_type:CommercialPlan;email:string;setup_cents:number;setup_due_cents?:number|null;monthly_cents:number;stripe_customer_id?:string|null},kind:'setup'|'subscription',origin:string){
 const p=catalog[order.plan_type];
 const freeSetup=kind==='setup'&&(order.setup_due_cents??order.setup_cents)===0;
 const metadata={billing_version:BILLING_VERSION,order_id:order.id,user_id:order.user_id,kind,...(freeSetup?{checkout_flow:'card-setup-v1'}:{})};
 return {
  mode:freeSetup?'setup' as const:kind==='setup'?'payment' as const:'subscription' as const,
  payment_method_types:['card' as const],
  ...(order.stripe_customer_id?{customer:order.stripe_customer_id}:{customer_email:order.email,...(kind==='setup'&&!freeSetup?{customer_creation:'always' as const}:{})}),
  client_reference_id:order.id,
  ...(freeSetup?{currency:'brl',setup_intent_data:{metadata},custom_text:{submit:{message:`Implementação gratuita por voucher. Cadastre seu cartão para concluir. Nenhuma implementação será cobrada. Mensalidade do plano: R$ ${(order.monthly_cents/100).toFixed(2).replace('.',',')}, contratada somente após a entrega aprovada; eventuais descontos mensais serão apresentados antes da contratação.`}}}:{line_items:[{quantity:1,price_data:{currency:'brl',unit_amount:kind==='setup'?order.setup_cents:order.monthly_cents,...(kind==='subscription'?{recurring:{interval:'month' as const}}:{}),product_data:{name:`AgendaAÍ ${p.name} — ${kind==='setup'?'implementação única':'mensalidade'}`}}}]}),
  success_url:`${origin}/payment-success?order=${order.id}`,
  cancel_url:`${origin}/meus-pedidos?cancelled=1`,
  metadata,
  ...(kind==='setup'&&!freeSetup?{payment_intent_data:{setup_future_usage:'off_session' as const}}:{}),
  ...(kind==='subscription'?{subscription_data:{metadata:{billing_version:BILLING_VERSION,order_id:order.id}}}:{}),
 };
}
