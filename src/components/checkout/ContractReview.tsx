import {useEffect,useState} from 'react';
import {offerDb} from '@/lib/offers';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import ContractDocument,{saveContract,type ContractDoc} from './ContractDocument';
export default function ContractReview({orderId,code,onReady}:{orderId:string;code:string;onReady:(v:boolean)=>void}){
 const [doc,setDoc]=useState<ContractDoc|null>(null),[fingerprint,setFingerprint]=useState(''),[accepted,setAccepted]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{setDoc(null);setAccepted(false);onReady(false)},[orderId,code]);
 async function review(){setBusy(true);setError('');onReady(false);try{const {data,error:e}=await offerDb.rpc('commerce_order_contract',{p_order:orderId,p_code:code});if(e)throw Error(e.message);setDoc(data.document);setFingerprint(data.fingerprint);setAccepted(false)}catch(e){setError(e instanceof Error?e.message:'Não foi possível abrir o contrato')}finally{setBusy(false)}}
 async function accept(){setBusy(true);setError('');try{const {error:e}=await offerDb.rpc('commerce_order_contract',{p_order:orderId,p_code:code,p_accept:true,p_fingerprint:fingerprint});if(e)throw Error(e.message);onReady(true)}catch(e){setError(e instanceof Error?e.message:'Não foi possível registrar o aceite')}finally{setBusy(false)}}
 return <div className="rounded-lg border p-3 space-y-3"><Button variant="outline" disabled={busy} onClick={()=>void review()}>Conferir contrato e valores para este pagamento</Button>{doc&&<><div className="max-h-80 overflow-y-auto border rounded p-3" tabIndex={0}><ContractDocument doc={doc}/></div><Button variant="ghost" onClick={()=>saveContract(doc)}>Baixar contrato</Button><label className="flex gap-2 text-sm"><Checkbox checked={accepted} onCheckedChange={v=>{setAccepted(v===true);onReady(false)}}/>Li e aceito este contrato e o resumo da cobrança.</label><Button disabled={busy||!accepted} onClick={()=>void accept()}>Registrar meu aceite</Button></>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</div>
}
