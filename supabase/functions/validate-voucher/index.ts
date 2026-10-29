import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {allowed,cors,reply,database,identity} from '../_shared/commerce-runtime.ts';
import {isUuid} from '../_shared/commerce.ts';
serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors(req)});
 if(req.method!=='POST'||!allowed(req))return reply(req,{error:'Origem inválida.'},403);
 try{const db=database(),user=await identity(req,db);if(!user)return reply(req,{error:'Entre para aplicar um voucher.'},401);
 const b=await req.json();if(!isUuid(b.orderId)||!['setup','subscription'].includes(b.kind)||typeof b.code!=='string'||b.code.length>80||!b.code.trim())return reply(req,{error:'Informe pedido, cobrança e código válidos.'},400);
 const {data,error}=await db.rpc('commerce_reserve_voucher',{p_order:b.orderId,p_user:user.id,p_kind:b.kind,p_code:b.code,p_preview:true});
 if(error)return reply(req,{error:error.message},400);
 return reply(req,{code:data.code,baseCents:data.base_cents,discountCents:data.discount_cents,dueCents:data.due_cents,months:data.months});
 }catch{return reply(req,{error:'Não foi possível validar o voucher.'},503)}
});
