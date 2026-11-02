import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {commerce,type BusinessOrder,stageLabel} from '@/lib/commerce-api';
import {PLANS} from '@/lib/constants';
type Billing={orderId:string;status?:string;currentPeriodEnd?:string|null;cancelAtPeriodEnd?:boolean;endedAt?:string|null;unavailable?:boolean};
const statusLabel:Record<string,string>={active:'Ativa',trialing:'Em período de teste',past_due:'Pagamento pendente',unpaid:'Pagamento pendente',canceled:'Cancelada',cancelled:'Cancelada',incomplete:'Ativação pendente',incomplete_expired:'Ativação expirada',paused:'Pausada',not_started:'Mensalidade não iniciada'};
const date=(value?:string|null)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}):null;
export function ManagedSubscriptions({orders}:{orders:BusinessOrder[]}){
 const [billing,setBilling]=useState<Billing[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let alive=true;setLoading(true);setError(false);
  commerce<{subscriptions:Billing[]}>('commerce-subscriptions',{}).then(data=>{if(alive)setBilling(data.subscriptions||[])}).catch(()=>{if(alive)setError(true)}).finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false};
 },[retry]);
 const delivered=orders.filter(o=>o.payment_status==='paid'&&['ready','active'].includes(o.stage));
 return <div className="space-y-4">
 {delivered.length===0&&<p className="text-sm text-muted-foreground">Sua plataforma está em preparação. A mensalidade será iniciada após a entrega.</p>}
 {(delivered.length?delivered:orders.filter(o=>o.stage!=='cancelled').slice(0,1)).map(order=>{
  const info=billing.find(b=>b.orderId===order.id),started=Boolean(order.stripe_subscription_id);
  const status=info?.status||order.subscription_status;
  const canceled=['canceled','cancelled','incomplete_expired'].includes(status);
  const until=date(canceled?info?.endedAt||info?.currentPeriodEnd:info?.currentPeriodEnd);
  return <section key={order.id} className="min-w-0 space-y-3 rounded-lg border border-border p-4" aria-label={'Plano '+PLANS[order.plan_type].name}>
   <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold text-primary">Plano {PLANS[order.plan_type].name}</h3><Badge variant="outline">{statusLabel[status]||'Situação em atualização'}</Badge></div>
   <p className="text-sm break-words">{order.business_name||order.name}</p>
   <dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Plataforma</dt><dd>{stageLabel[order.stage]||'Em acompanhamento'}</dd></div>
   <div><dt className="text-muted-foreground">{canceled?'Encerramento':'Validade do período atual'}</dt><dd className="font-medium">{!started?'A definir após o início da mensalidade':loading?'Consultando validade…':until||'Não foi possível confirmar a validade agora'}</dd></div>
   </dl>
   {started&&!canceled&&until&&<p className="text-xs text-muted-foreground">{info?.cancelAtPeriodEnd?'Renovação cancelada. O período termina na data acima.':'Assinatura com renovação automática. A data representa o período atual, não uma contratação vitalícia.'}</p>}
   {!started&&<p className="text-xs text-muted-foreground">O pagamento da implementação não inicia a assinatura mensal.</p>}
   {order.website_url&&['ready','active'].includes(order.stage)&&order.payment_status==='paid'&&<Button asChild variant="outline" className="w-full"><a href={order.website_url} target="_blank" rel="noopener noreferrer">Acessar minha plataforma</a></Button>}
   <Button asChild className="w-full"><Link to={'/meus-pedidos/'+order.id+'/resumo'}>Detalhes do plano e pagamento</Link></Button>
  </section>;
 })}
 {(error||billing.some(b=>b.unavailable))&&<div role="status" className="space-y-2"><p className="text-xs text-muted-foreground">A consulta de validade está indisponível. Seus pedidos continuam disponíveis.</p><Button variant="outline" size="sm" onClick={()=>setRetry(v=>v+1)} disabled={loading}>Consultar novamente</Button></div>}
 <Button asChild variant="ghost" className="w-full"><Link to="/meus-pedidos">Meus pedidos e plataformas</Link></Button>
 </div>;
}
