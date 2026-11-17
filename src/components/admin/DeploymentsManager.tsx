import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {Checkbox} from '@/components/ui/checkbox';
import {Badge} from '@/components/ui/badge';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {toast} from 'sonner';
import {ArrowLeft,ExternalLink,Plus} from 'lucide-react';
import {FEATURE_LABELS,PLAN_LABELS,STATUS_LABELS,HOMOLOGATION_LABELS,allowedFeatures} from '@/lib/plan-features';
import type {Tables} from '@/integrations/supabase/types';

type Template=Tables<'system_templates'>;type Install=Tables<'system_installations'>;type Item=Tables<'installation_checklist_items'>;
type Order={id:string;name:string;email:string;module_plan:string;plan_type:string;business_name:string|null;stage:string;created_at:string};
const sel='flex h-11 w-full rounded-md border border-input bg-background px-3 text-base sm:text-sm';
const list=(s:string)=>s.split(',').map(x=>x.trim()).filter(Boolean);
const err=(e:unknown)=>toast.error((e as {message?:string})?.message||'Não foi possível salvar.');

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block space-y-1 text-sm"><span className="text-muted-foreground">{label}</span>{children}</label>}

function TemplateForm({t,onDone}:{t:Partial<Template>;onDone:()=>void}){
 const [f,setF]=useState({...t,images:(t.images||[]).join(', '),features:(t.features||[]).join(', ')} as Record<string,any>);
 const set=(k:string)=>(e:{target:{value:string}})=>setF({...f,[k]:e.target.value});
 async function save(){const row={name:f.name,description:f.description||null,hosting_platform:f.hosting_platform||'Lovable',source_project_url:f.source_project_url||null,github_repo:f.github_repo||null,current_version:f.current_version||'0.1',images:list(f.images),features:list(f.features),compatible_plans:f.compatible_plans||[],duplication_instructions:f.duplication_instructions||null,homologation_status:f.homologation_status||'em_homologacao'};
  const {error}=t.id?await supabase.from('system_templates').update(row).eq('id',t.id):await supabase.from('system_templates').insert(row);
  if(error)return err(error);
  if(t.id&&t.current_version!==row.current_version)await supabase.from('system_template_versions').insert({template_id:t.id,version:row.current_version});
  toast.success('Modelo salvo');onDone()}
 const plans:string[]=f.compatible_plans||[];
 return <div className="glass-card space-y-3 rounded-xl p-4">
  <Field label="Nome"><Input value={f.name||''} onChange={set('name')}/></Field>
  <Field label="Descrição"><Textarea value={f.description||''} onChange={set('description')}/></Field>
  <div className="grid gap-3 sm:grid-cols-2"><Field label="Plataforma de hospedagem"><Input value={f.hosting_platform||''} onChange={set('hosting_platform')}/></Field><Field label="Versão"><Input value={f.current_version||''} onChange={set('current_version')}/></Field>
  <Field label="Link do projeto original"><Input value={f.source_project_url||''} onChange={set('source_project_url')}/></Field><Field label="Repositório GitHub (opcional)"><Input value={f.github_repo||''} onChange={set('github_repo')}/></Field></div>
  <Field label="Imagens demonstrativas (links separados por vírgula)"><Input value={f.images} onChange={set('images')}/></Field>
  <Field label="Funcionalidades (separadas por vírgula)"><Input value={f.features} onChange={set('features')}/></Field>
  <div className="text-sm"><span className="text-muted-foreground">Planos compatíveis</span><div className="mt-1 flex flex-wrap gap-4">{Object.keys(PLAN_LABELS).map(p=><label key={p} className="flex min-h-11 items-center gap-2"><Checkbox checked={plans.includes(p)} onCheckedChange={v=>setF({...f,compatible_plans:v?[...plans,p]:plans.filter(x=>x!==p)})}/>{PLAN_LABELS[p]}</label>)}</div></div>
  <Field label="Instruções de duplicação manual"><Textarea rows={4} value={f.duplication_instructions||''} onChange={set('duplication_instructions')}/></Field>
  <Field label="Status de homologação"><select className={sel} value={f.homologation_status||'em_homologacao'} onChange={set('homologation_status')}>{Object.entries(HOMOLOGATION_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
  <div className="flex gap-2"><Button className="min-h-11 flex-1" onClick={save} disabled={!f.name}>Salvar modelo</Button><Button variant="outline" className="min-h-11" onClick={onDone}>Cancelar</Button></div>
 </div>}

function InstallationDetail({inst,template,order,onBack}:{inst:Install;template?:Template;order?:Order;onBack:()=>void}){
 const [f,setF]=useState<Install>(inst),[items,setItems]=useState<Item[]>([]),[assets,setAssets]=useState<{id:string;filename:string;kind:string;status:string}[]>([]),[brief,setBrief]=useState<Record<string,unknown>|null>(null);
 const allowed=allowedFeatures(f.contracted_plan);
 useEffect(()=>{supabase.from('installation_checklist_items').select('*').eq('installation_id',inst.id).order('position').then(({data})=>setItems(data||[]));
  supabase.from('order_assets').select('id,filename,kind,status').eq('order_id',inst.order_id).eq('active',true).then(({data})=>setAssets(data||[]));
  supabase.from('order_workspaces').select('brief').eq('order_id',inst.order_id).maybeSingle().then(({data})=>setBrief((data?.brief as Record<string,unknown>)||null));},[inst.id,inst.order_id]);
 const set=(k:keyof Install)=>(e:{target:{value:string}})=>setF({...f,[k]:e.target.value||null});
 async function save(){const {id,created_at,updated_at,created_by,buyer_user_id,contracted_plan,order_id,...rest}=f;const {data,error}=await supabase.from('system_installations').update(rest).eq('id',id).select().single();if(error)return err(error);setF(data);toast.success('Instalação salva')}
 async function saveItem(it:Item,patch:Partial<Item>){const {data,error}=await supabase.from('installation_checklist_items').update(patch).eq('id',it.id).select().single();if(error)return err(error);setItems(items.map(x=>x.id===it.id?data:x))}
 const done=items.filter(i=>i.done).length;
 return <div className="space-y-4">
  <Button variant="ghost" className="min-h-11 px-2" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4"/>Implantações</Button>
  <div className="glass-card space-y-1 rounded-xl p-4"><h3 className="font-semibold">{f.establishment_name||order?.business_name||'Estabelecimento'}</h3><p className="text-sm text-muted-foreground">Pedido #{f.order_id.slice(0,8)} · {order?.name} · {order?.email}</p><p className="text-sm">Modelo: {template?.name} · Plano contratado: <strong>{PLAN_LABELS[f.contracted_plan]||f.contracted_plan}</strong></p></div>
  <details className="glass-card rounded-xl p-4"><summary className="cursor-pointer text-sm font-medium">Dados e materiais enviados pelo comprador ({assets.length})</summary>
   {brief&&Object.keys(brief).length>0?<dl className="mt-3 space-y-1 text-sm break-words">{Object.entries(brief).map(([k,v])=><div key={k}><dt className="inline font-medium">{k}: </dt><dd className="inline">{typeof v==='string'?v:JSON.stringify(v)}</dd></div>)}</dl>:<p className="mt-3 text-sm text-muted-foreground">Nenhum dado de briefing enviado ainda.</p>}
   <ul className="mt-3 space-y-1 text-sm">{assets.map(a=><li key={a.id}>• {a.filename} <span className="text-muted-foreground">({a.kind} · {a.status})</span></li>)}</ul>
   <a className="mt-3 inline-block text-sm text-primary underline" href={`/admin/pedidos/${f.order_id}`}>Abrir pedido completo (materiais, mensagens e aprovação)</a></details>
  {template?.duplication_instructions&&<details className="glass-card rounded-xl p-4"><summary className="cursor-pointer text-sm font-medium">Instruções de duplicação manual</summary><p className="mt-2 whitespace-pre-wrap text-sm">{template.duplication_instructions}</p>{template.source_project_url&&<a className="mt-2 inline-flex items-center gap-1 text-sm text-primary" target="_blank" rel="noreferrer" href={template.source_project_url}>Projeto original <ExternalLink className="h-3 w-3"/></a>}</details>}
  <div className="glass-card space-y-3 rounded-xl p-4"><h4 className="font-medium">Registro da instalação</h4>
   <div className="grid gap-3 sm:grid-cols-2">
    <Field label="Nome do estabelecimento"><Input value={f.establishment_name||''} onChange={set('establishment_name')}/></Field>
    <Field label="Domínio / subdomínio"><Input value={f.domain||''} onChange={set('domain')}/></Field>
    <Field label="Link de edição"><Input value={f.edit_url||''} onChange={set('edit_url')}/></Field>
    <Field label="Link de pré-visualização"><Input value={f.preview_url||''} onChange={set('preview_url')}/></Field>
    <Field label="Identificador da instalação"><Input value={f.external_installation_id||''} onChange={set('external_installation_id')}/></Field>
    <Field label="Versão do modelo usada"><Input value={f.template_version||''} onChange={set('template_version')}/></Field>
   </div>
   <div className="text-sm"><span className="text-muted-foreground">Recursos efetivamente habilitados (apenas registro, não altera o sistema entregue)</span>
    <div className="mt-1 grid grid-cols-2 gap-1">{Object.keys(FEATURE_LABELS).map(k=>{const ok=allowed.includes(k);return <label key={k} className={`flex min-h-11 items-center gap-2 ${ok?'':'opacity-40'}`}><Checkbox disabled={!ok} checked={f.enabled_features.includes(k)} onCheckedChange={v=>setF({...f,enabled_features:v?[...f.enabled_features,k]:f.enabled_features.filter(x=>x!==k)})}/>{FEATURE_LABELS[k]}{!ok&&<span className="text-xs">(fora do plano)</span>}</label>})}</div></div>
   <Field label="Materiais recebidos"><Textarea value={f.materials_notes||''} onChange={set('materials_notes')}/></Field>
   <Field label="Pendências"><Textarea value={f.pending_notes||''} onChange={set('pending_notes')}/></Field>
   <div className="grid gap-3 sm:grid-cols-2"><Field label="Estado da implantação"><select className={sel} value={f.status} onChange={set('status')}>{Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></Field>
   <Field label="Data de entrega"><Input type="date" value={f.delivered_at?f.delivered_at.slice(0,10):''} onChange={e=>setF({...f,delivered_at:e.target.value?new Date(e.target.value).toISOString():null})}/></Field></div>
   <Button className="min-h-11 w-full" onClick={save}>Salvar instalação</Button>
   <p className="text-xs text-muted-foreground">Prévia para o cliente, aprovação e liberação do acesso continuam na página do pedido.</p>
  </div>
  <div className="glass-card space-y-2 rounded-xl p-4"><h4 className="font-medium">Checklist de personalização · {done}/{items.length}</h4>
   {items.map(it=><ChecklistRow key={it.id} it={it} onSave={p=>saveItem(it,p)}/>)}</div>
 </div>}

function ChecklistRow({it,onSave}:{it:Item;onSave:(p:Partial<Item>)=>void}){
 const [notes,setNotes]=useState(it.notes||''),[ev,setEv]=useState(it.evidence_url||'');
 return <details className="rounded-lg border p-3"><summary className="flex min-h-9 cursor-pointer items-center gap-2 text-sm"><Checkbox checked={it.done} onClick={e=>e.stopPropagation()} onCheckedChange={v=>onSave({done:!!v})}/><span className={it.done?'line-through text-muted-foreground':''}>{it.label}</span></summary>
  <div className="mt-2 space-y-2"><Textarea placeholder="Observações" value={notes} onChange={e=>setNotes(e.target.value)}/><Input placeholder="Link da evidência (print, vídeo)" value={ev} onChange={e=>setEv(e.target.value)}/><Button size="sm" variant="outline" className="min-h-10" onClick={()=>onSave({notes:notes||null,evidence_url:ev||null})}>Salvar etapa</Button></div></details>}

export function DeploymentsManager(){
 const [templates,setTemplates]=useState<Template[]>([]),[insts,setInsts]=useState<Install[]>([]),[orders,setOrders]=useState<Order[]>([]);
 const [editing,setEditing]=useState<Partial<Template>|null>(null),[open,setOpen]=useState<Install|null>(null);
 const [q,setQ]=useState(''),[status,setStatus]=useState(''),[tStatus,setTStatus]=useState('');
 const params=new URLSearchParams(window.location.search);
 const [prep,setPrep]=useState({order:params.get('order')||'',template:''});
 const load=useCallback(async()=>{const [t,i,o]=await Promise.all([supabase.from('system_templates').select('*').order('created_at'),supabase.from('system_installations').select('*').order('updated_at',{ascending:false}),supabase.from('business_orders').select('id,name,email,module_plan,plan_type,business_name,stage,created_at').order('created_at',{ascending:false})]);setTemplates(t.data||[]);setInsts(i.data||[]);setOrders((o.data as Order[])||[])},[]);
 useEffect(()=>{load()},[load]);
 const om=useMemo(()=>Object.fromEntries(orders.map(o=>[o.id,o])),[orders]),tm=useMemo(()=>Object.fromEntries(templates.map(t=>[t.id,t])),[templates]);
 const selOrder=om[prep.order];
 const compatible=templates.filter(t=>!selOrder||t.compatible_plans.includes(selOrder.module_plan?.toLowerCase()));
 async function prepare(){const {data,error}=await supabase.from('system_installations').insert({order_id:prep.order,template_id:prep.template,contracted_plan:'',enabled_features:[]}).select().single();if(error)return err(error);toast.success('Instalação preparada');setPrep({order:'',template:''});await load();setOpen(data)}
 const filtered=insts.filter(i=>{const o=om[i.order_id];const s=`${i.establishment_name} ${i.domain} ${o?.name} ${o?.email} ${i.order_id}`.toLowerCase();return (!status||i.status===status)&&(!q||s.includes(q.toLowerCase()))});
 if(open)return <InstallationDetail inst={open} template={tm[open.template_id]} order={om[open.order_id]} onBack={()=>{setOpen(null);load()}}/>;
 return <Tabs defaultValue="installs" className="space-y-4">
  <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="installs" className="min-h-11">Implantações</TabsTrigger><TabsTrigger value="templates" className="min-h-11">Modelos</TabsTrigger></TabsList>
  <TabsContent value="installs" className="space-y-4">
   <div className="glass-card space-y-3 rounded-xl p-4"><h3 className="font-semibold">Preparar instalação</h3><p className="text-xs text-muted-foreground">A cópia do modelo é criada manualmente na plataforma. Aqui você registra e acompanha.</p>
    <Field label="Pedido"><select className={sel} value={prep.order} onChange={e=>setPrep({order:e.target.value,template:''})}><option value="">Selecione o pedido</option>{orders.map(o=><option key={o.id} value={o.id}>#{o.id.slice(0,8)} · {o.business_name||o.name} · {PLAN_LABELS[o.module_plan]||o.module_plan}</option>)}</select></Field>
    <Field label="Sistema-modelo"><select className={sel} value={prep.template} onChange={e=>setPrep({...prep,template:e.target.value})}><option value="">Selecione o modelo</option>{compatible.map(t=><option key={t.id} value={t.id}>{t.name} · v{t.current_version}</option>)}</select></Field>
    {selOrder&&insts.some(i=>i.order_id===selOrder.id)&&<p className="text-xs text-primary">Este pedido já tem instalação registrada.</p>}
    <Button className="min-h-11 w-full" disabled={!prep.order||!prep.template} onClick={prepare}><Plus className="mr-1 h-4 w-4"/>Iniciar implantação</Button></div>
   <div className="flex flex-col gap-2 sm:flex-row"><Input placeholder="Buscar cliente, estabelecimento, domínio" value={q} onChange={e=>setQ(e.target.value)}/><select className={sel+' sm:w-60'} value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos os estados</option>{Object.entries(STATUS_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
   {filtered.length===0&&<p className="text-sm text-muted-foreground">Nenhuma implantação encontrada.</p>}
   {filtered.map(i=>{const o=om[i.order_id];return <button key={i.id} onClick={()=>setOpen(i)} className="glass-card block w-full space-y-1 rounded-xl p-4 text-left"><div className="flex items-start justify-between gap-2"><span className="font-medium">{i.establishment_name||o?.business_name||'Sem nome'}</span><Badge variant="secondary">{STATUS_LABELS[i.status]}</Badge></div><p className="text-xs text-muted-foreground">{o?.name} · #{i.order_id.slice(0,8)} · {PLAN_LABELS[i.contracted_plan]||i.contracted_plan} · {tm[i.template_id]?.name}</p>{i.domain&&<p className="text-xs">{i.domain}</p>}</button>})}
  </TabsContent>
  <TabsContent value="templates" className="space-y-4">
   {editing?<TemplateForm t={editing} onDone={()=>{setEditing(null);load()}}/>:<>
    <div className="flex flex-col gap-2 sm:flex-row"><Button className="min-h-11" onClick={()=>setEditing({compatible_plans:[]})}><Plus className="mr-1 h-4 w-4"/>Novo modelo</Button><select className={sel+' sm:w-60'} value={tStatus} onChange={e=>setTStatus(e.target.value)}><option value="">Toda homologação</option>{Object.entries(HOMOLOGATION_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
    {templates.filter(t=>!tStatus||t.homologation_status===tStatus).map(t=><div key={t.id} className="glass-card space-y-2 rounded-xl p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{t.name}</h3><Badge variant="outline">{HOMOLOGATION_LABELS[t.homologation_status]}</Badge></div><p className="text-sm text-muted-foreground">{t.description}</p><p className="text-xs">{t.hosting_platform} · v{t.current_version} · Planos: {t.compatible_plans.map(p=>PLAN_LABELS[p]).join(', ')||'nenhum'}</p>{t.images.length>0&&<div className="flex gap-2 overflow-x-auto">{t.images.map(src=><img key={src} src={src} alt="" className="h-20 rounded-md object-cover"/>)}</div>}<Button variant="outline" className="min-h-11 w-full" onClick={()=>setEditing(t)}>Editar</Button></div>)}
   </>}
  </TabsContent>
 </Tabs>}
