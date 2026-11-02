const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild'),Module=require('node:module');
const compile=(code)=>{const m=new Module(path.join(process.cwd(),'.subscription-test.cjs'),module);m.paths=module.paths;m.filename=path.join(process.cwd(),'.subscription-test.cjs');m._compile(code,m.filename);return m.exports};
const summary=compile(esbuild.transformSync(fs.readFileSync('supabase/functions/_shared/subscription-summary.ts','utf8'),{loader:'ts',format:'cjs'}).code).subscriptionSummary;
assert.equal(summary({status:'active',created:123,items:{data:[]}}).currentPeriodEnd,null,'Never fabricate expiry from creation date');
assert.equal(summary({status:'active',current_period_end:2000,items:{data:[{current_period_end:3000}]}}).currentPeriodEnd,new Date(3000000).toISOString());
assert.equal(summary({status:'active',items:{data:[{current_period_end:4000},{current_period_end:3000}]},cancel_at:2500}).currentPeriodEnd,new Date(2500000).toISOString());
assert.equal(summary({status:'canceled',ended_at:2000}).endedAt,new Date(2000000).toISOString());
const {JSDOM}=require('/tmp/agendai-project-qa/node_modules/jsdom'),dom=new JSDOM('<div id="root"></div>');
for(const k of ['window','document','navigator','HTMLElement','MutationObserver'])Object.defineProperty(global,k,{configurable:true,value:dom.window[k]});
global.IS_REACT_ACT_ENVIRONMENT=true;
const React=require('react'),{act}=React,{createRoot}=require('react-dom/client'),{MemoryRouter}=require('react-router-dom');
let response={subscriptions:[]},fail=false;
global.__billing=async()=>{if(fail)throw Error('offline');return response};
const mock=path.join(process.cwd(),'.subscription-test-mock.ts');
fs.writeFileSync(mock,"export const commerce=(...args)=>globalThis.__billing(...args); export const stageLabel={ready:'Plataforma disponível',active:'Plataforma disponível · mensalidade iniciada'};");
let built;try{built=esbuild.buildSync({entryPoints:['src/components/subscription/ManagedSubscriptions.tsx'],bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic',alias:{'@':path.join(process.cwd(),'src'),'@/lib/commerce-api':mock},external:['react','react-dom','react-router-dom']}).outputFiles[0].text}finally{fs.unlinkSync(mock)}
const {ManagedSubscriptions}=compile(built),root=createRoot(document.getElementById('root'));
const base={id:'order1',plan_type:'pro',payment_status:'paid',stage:'ready',subscription_status:'not_started',business_name:'Teste'};
async function render(order){await act(async()=>root.render(React.createElement(MemoryRouter,null,React.createElement(ManagedSubscriptions,{key:JSON.stringify(order)+fail,orders:[order]}))));await act(async()=>new Promise(r=>setTimeout(r,0)))}
(async()=>{
 await render(base);assert(document.body.textContent.includes('Plano Gestão'));assert(document.body.textContent.includes('A definir após o início da mensalidade'));
 response={subscriptions:[{orderId:'order1',status:'active',currentPeriodEnd:'2026-12-02T15:00:00Z'}]};
 await render({...base,stage:'active',subscription_status:'active',stripe_subscription_id:'sub_fixture'});
 assert(document.body.textContent.includes('02/12/2026'));assert(document.body.textContent.includes('renovação automática'));
 fail=true;await render({...base,stripe_subscription_id:'sub_fixture'});assert(document.body.textContent.includes('Não foi possível confirmar a validade'));assert(document.body.textContent.includes('Consultar novamente'));
 await act(async()=>root.unmount());console.log('PASS: real item periods, cancellation cutoff, no invented expiry, delivered plan card, pre-subscription and billing-error states.');
})().catch(e=>{console.error(e);process.exitCode=1});
