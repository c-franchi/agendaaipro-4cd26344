import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.90.1';
export const ADMIN_EMAIL='neifranchi@gmail.com';
export const allowedOrigins=['https://agendaaipro.com.br','https://www.agendaaipro.com.br','https://agendaaipro.lovable.app','https://id-preview--010c13fb-66ac-402e-8b8b-d9a589c2d67d.lovable.app'];
export function cors(req:Request){const origin=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':allowedOrigins.includes(origin)?origin:allowedOrigins[0],'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'}}
export const reply=(req:Request,data:unknown,status=200)=>Response.json(data,{status,headers:{...cors(req),'cache-control':'no-store'}});
export function allowed(req:Request){return allowedOrigins.includes(req.headers.get('origin')||'')}
export const database=()=>createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
export async function identity(req:Request,db:ReturnType<typeof database>){const token=req.headers.get('authorization')?.replace(/^Bearer /i,'');if(!token)return null;const {data,error}=await db.auth.getUser(token);return error?null:data.user}
export const administrator=(u:{email?:string;email_confirmed_at?:string}|null)=>Boolean(u?.email_confirmed_at&&u.email?.toLowerCase()===ADMIN_EMAIL);
export async function audit(db:ReturnType<typeof database>,orderId:string,actor:string,event:string,details:unknown={}){const {error}=await db.from('business_order_audit').insert({order_id:orderId,actor_id:actor,event,details});if(error)throw error}
