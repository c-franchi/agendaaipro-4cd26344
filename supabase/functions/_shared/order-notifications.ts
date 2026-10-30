import {database,ADMIN_EMAIL} from './commerce-runtime.ts';
const entities:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>entities[c]);

export async function testOrderEmail(){
 const key=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('EMAIL_FROM');
 if(!key||!from||!/^AgendaAÍ Pro <notificacoes@agendaaipro\.com\.br>$/.test(from.trim()))throw Error('Configure EMAIL_FROM como AgendaAÍ Pro <notificacoes@agendaaipro.com.br> e a chave da mesma conta Resend.');
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({from,to:[ADMIN_EMAIL],reply_to:ADMIN_EMAIL,subject:'TESTE · notificações AgendaAÍ Pro',text:'Este é um teste autorizado da configuração de e-mails do AgendaAÍ Pro. Não representa pedido, pagamento ou assinatura. Os avisos reais terão um link para o acompanhamento do pedido.',html:'<!doctype html><html lang="pt-BR"><body><h1>Teste de notificações AgendaAÍ Pro</h1><p>Este teste verifica a configuração do remetente. Não representa pedido, pagamento ou assinatura.</p></body></html>'})});
 if(!response.ok)throw Error(`Provedor recusou o teste (HTTP ${response.status}). Confira a chave e o domínio verificado.`);const result=await response.json();return {providerId:result.id,status:'accepted',message:'Teste aceito pelo provedor; confira a caixa de entrada e spam.'};
}

export async function notifyOrder(db:ReturnType<typeof database>,orderId:string){
 const {data:jobs,error}=await db.rpc('commerce_claim_notifications',{p_order:orderId});if(error)throw error;
 if(!jobs?.length){const {count}=await db.from('order_notifications').select('id',{head:true,count:'exact'}).eq('order_id',orderId).neq('status','sent');return {sent:0,pending:count||0};}
 const {data:order,error:orderError}=await db.from('business_orders').select('email,id').eq('id',orderId).single();if(orderError)throw orderError;
 let sent=0,pending=0;
 for(const job of jobs){try{
 const key=Deno.env.get('RESEND_API_KEY'),from=Deno.env.get('EMAIL_FROM');
 if(!key||!from)throw Error('Email not configured');
 let attachments:unknown[]=[];
 if(job.event_key?.startsWith('contract:')){const {data:copy,error:copyError}=await db.from('order_contract_acceptances').select('snapshot,accepted_at,fingerprint,id,user_id').eq('id',job.event_key.slice(9)).eq('order_id',orderId).single();if(copyError||!copy)throw Error('Cópia do contrato indisponível');const doc=copy.snapshot;const content=[doc.title,'Versão '+doc.version,doc.provider,'Contratante: '+doc.customer.name+' · '+doc.customer.email,doc.modules,'Resumo comercial: '+JSON.stringify(doc.quote),...doc.clauses.map((c:{title:string;body:string})=>c.title+'\n'+c.body),'Aceite: '+copy.accepted_at,'Conta: '+copy.user_id,'Registro: '+copy.id,'SHA-256: '+copy.fingerprint].join('\n\n');attachments=[{filename:'contrato-agendai.txt',content:btoa(String.fromCharCode(...new TextEncoder().encode(content)))}];}
 const url=job.audience==='operator'?`https://agendaaipro.com.br/admin?tab=orders&order=${order.id}`:`https://agendaaipro.com.br/meus-pedidos?order=${order.id}`;
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`order:${job.id}`},signal:AbortSignal.timeout(15000),body:JSON.stringify({from,reply_to:ADMIN_EMAIL,attachments,to:[job.audience==='operator'?(Deno.env.get('NOTIFICATION_EMAIL')||ADMIN_EMAIL):order.email],subject:job.subject,text:`${job.body}\n\nPedido #${order.id.slice(0,8)}\nAcompanhe: ${url}`,html:`<!doctype html><html lang="pt-BR"><body><h1>${escape(job.subject)}</h1><p>${escape(job.body).replace(/\n/g,'<br>')}</p><p>Pedido #${order.id.slice(0,8)}</p><p><a href="${url}">Abrir acompanhamento</a></p></body></html>`})});
 if(!response.ok)throw Error(`Email provider HTTP ${response.status}`);const result=await response.json();
 const {error:update}=await db.from('order_notifications').update({status:'sent',provider_id:result.id,sent_at:new Date().toISOString(),error:null}).eq('id',job.id);if(update)throw update;sent++;
 }catch(e){pending++;await db.from('order_notifications').update({status:job.attempts>=5||/HTTP (400|401|403|404|422)/.test(e instanceof Error?e.message:'')?'failed':'pending',error:e instanceof Error?e.message:'Email failed'}).eq('id',job.id);}}
 const {count}=await db.from('order_notifications').select('id',{head:true,count:'exact'}).eq('order_id',orderId).neq('status','sent');return {sent,pending:count??pending};
}
