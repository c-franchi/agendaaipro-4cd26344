import {serve} from 'https://deno.land/std@0.190.0/http/server.ts';
import {cors,reply} from '../_shared/commerce-runtime.ts';
serve(async req=>req.method==='OPTIONS'?new Response(null,{headers:cors(req)}):reply(req,{error:'Utilize Meus pedidos para aplicar o voucher. A implementação e a mensalidade são independentes.'},410));
