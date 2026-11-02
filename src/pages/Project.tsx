import {useCallback,useEffect,useState} from 'react';
import {Link,useLocation,useParams} from 'react-router-dom';
import {offerDb} from '@/lib/offers';
import {supabase} from '@/integrations/supabase/client';
import type {BusinessOrder} from '@/lib/commerce-api';
import OrderWorkspace from '@/components/checkout/OrderWorkspace';
export default function Project(){
 const {orderId,step='resumo'}=useParams(),{pathname}=useLocation(),admin=pathname.startsWith('/admin/');
 const [order,setOrder]=useState<BusinessOrder|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 const load=useCallback(async()=>{try{const {data:{user}}=await supabase.auth.getUser();if(!user)throw Error('Entre na mesma conta utilizada na contratação para acessar o projeto.');if(admin&&(!user.email_confirmed_at||user.email?.toLowerCase()!=='neifranchi@gmail.com'))throw Error('Acesso restrito à administração.');if(!orderId||!/^[a-f0-9-]{36}$/i.test(orderId))throw Error('Pedido inválido.');let q=offerDb.from('business_orders').select('*').eq('id',orderId);if(!admin)q=q.eq('user_id',user.id);const {data,error:e}=await q.maybeSingle();if(e||!data)throw Error('Não foi possível localizar este pedido na sua conta.');setOrder(data as BusinessOrder);setError('')}catch(e){setError(e instanceof Error?e.message:'Não foi possível carregar o projeto.')}finally{setLoading(false)}},[orderId,admin]);
 useEffect(()=>{setOrder(null);setLoading(true);void load()},[load]);
 if(loading||error||!order)return <main className="container max-w-3xl py-12 space-y-4"><Link to={admin?'/admin?tab=orders':'/meus-pedidos'} className="text-primary underline">Voltar aos pedidos</Link><p role="status">{loading?'Carregando seu projeto…':error}</p>{!loading&&<Link to="/auth" className="text-primary underline">Entrar na conta</Link>}</main>;
 return <OrderWorkspace order={order} admin={admin} step={step} onUpdated={load}/>;
}
