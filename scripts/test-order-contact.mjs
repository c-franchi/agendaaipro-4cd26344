import assert from 'node:assert/strict';import ts from 'typescript';import {readFileSync} from 'node:fs';
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};new Function('exports','module',compile(readFileSync(new URL('../supabase/functions/_shared/order-contact.ts',import.meta.url),'utf8')))(mod.exports,mod);
const b={phone:'(16) 99999-1234',businessType:'Depilação',businessName:'Estúdio QA',message:'Preciso de agenda e estoque.'};assert.deepEqual(mod.exports.orderContact(b),{phone:'16999991234',business_type:b.businessType,business_name:b.businessName,request_message:b.message});
for(const patch of [{phone:''},{businessType:''},{message:'a'.repeat(1001)},{phone:'123'},{businessType:3}])assert.throws(()=>mod.exports.orderContact({...b,...patch}));
assert.equal(mod.exports.orderContact({...b,businessType:'Minha área personalizada'}).business_type,'Minha área personalizada');
let handler;const sent=[];const env={RESEND_API_KEY:'fixture',ADMIN_EMAIL:'operator@example.com'};const runtime={allowed:()=>true,cors:()=>({})};
new Function('require','exports','module','Deno','fetch',compile(readFileSync(new URL('../supabase/functions/send-lead-email/index.ts',import.meta.url),'utf8')))(id=>id.includes('http/server')?{serve:h=>handler=h}:runtime,{}, {exports:{}},{env:{get:k=>env[k]}},async(_url,opts)=>{sent.push(JSON.parse(opts.body));return Response.json({id:'fixture'})});
const body={name:'QA <script>',email:'fixture@example.com',phone:b.phone,business_type:b.businessType,message:'Plano Agenda\n<unsafe>',source:'offer_v2_essencial'};
const request=body=>new Request('https://fixture.example',{method:'POST',body:JSON.stringify(body)});
assert.equal((await handler(request(body))).status,200);assert.equal(sent.length,2);
for(const mail of sent){assert.ok(mail.html.includes('offer_v2_essencial'));assert.ok(mail.html.includes('Plano Agenda'));assert.ok(mail.html.includes('&lt;unsafe&gt;'));assert.ok(!mail.html.includes('<script>'));}
assert.equal((await handler(request({...body,email:'invalid'}))).status,400);assert.equal(sent.length,2);
console.log('PASS: complete order contact, custom area, invalid fields, full notification/receipt and escaped HTML; no real emails sent.');
