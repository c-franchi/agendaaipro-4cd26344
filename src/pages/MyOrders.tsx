import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '@/integrations/supabase/client';
import OrdersList from '@/components/checkout/OrdersList';
import {Button} from '@/components/ui/button';
export default function MyOrders(){const [session,setSession]=useState<boolean|null>(null);useEffect(()=>{supabase.auth.getUser().then(({data})=>setSession(Boolean(data.user))).catch(()=>setSession(false))},[]);return <main className="container max-w-3xl py-8 space-y-6"><Link to="/meu-perfil" className="text-primary underline">Minha conta</Link><h1 className="text-3xl font-bold">Sua plataforma AgendaAÍ</h1>{session===null?<p role="status">Verificando acesso…</p>:session?<OrdersList/>:<><p>Entre na sua conta para acompanhar os pedidos.</p><Button asChild><Link to="/auth">Entrar</Link></Button></>}</main>}
