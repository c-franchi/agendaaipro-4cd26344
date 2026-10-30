import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {allowed,cors,database,identity,administrator,reply} from '../_shared/commerce-runtime.ts';
import {isUuid} from '../_shared/commerce.ts';
import {notifyOrder,testOrderEmail} from '../_shared/order-notifications.ts';
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors(req)});
 const bearer=req.headers.get('authorization')?.replace(/^Bearer /i,''),serviceKey=Deno.env.get('ORDER_NOTIFICATIONS_CRON_SECRET');
 const internal=Boolean(serviceKey&&bearer===serviceKey);
 if(req.method!=='POST'||(!internal&&!allowed(req)))return reply(req,{error:'Origem ou método inválido'},403);
 const test=async()=>{try{return reply(req,await testOrderEmail())}catch(e){return reply(req,{error:e instanceof Error?e.message:'Teste de e-mail indisponível'},503)}};
 try{const db=database(),body=await req.json();
 if(internal&&body.action==='test')return test();
 if(internal&&body.action==='drain'){
  const {data,error}=await db.from('order_notifications').select('order_id').in('status',['pending','sending']).lt('attempts',5).order('created_at').limit(50);if(error)throw error;
  let sent=0,pending=0;for(const orderId of [...new Set((data||[]).map(r=>r.order_id))].slice(0,5)){const result=await notifyOrder(db,orderId);sent+=result.sent;pending+=result.pending;}return reply(req,{sent,pending});
 }
 const user=await identity(req,db);if(!user)return reply(req,{error:'Entre na sua conta'},401);
 if(body.action==='test'){if(!administrator(user))return reply(req,{error:'Acesso restrito'},403);return test();}
 if(!isUuid(body.orderId))return reply(req,{error:'Pedido inválido'},400);const {data:order}=await db.from('business_orders').select('user_id').eq('id',body.orderId).single();if(!order||(order.user_id!==user.id&&!administrator(user)))return reply(req,{error:'Pedido não encontrado'},404);
 if(body.retry===true&&administrator(user)){const {error}=await db.from('order_notifications').update({status:'pending',attempts:0,last_attempt:null,error:null}).eq('order_id',body.orderId).eq('status','failed');if(error)throw error;}
 return reply(req,await notifyOrder(db,body.orderId));
 }catch{return reply(req,{error:'Notificações pendentes. O acompanhamento continua salvo.'},503)}
});
