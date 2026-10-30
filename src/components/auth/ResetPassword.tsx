import {Eye,EyeOff} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { completePasswordReset, passwordProblem } from '@/lib/password-recovery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import logo from '@/assets/logo-simple.png';

export default function ResetPassword({invalidLink,onExit}:{invalidLink:boolean;onExit:()=>void}) {
 const [state,setState]=useState<'checking'|'ready'|'invalid'|'done'>(invalidLink?'invalid':'checking');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [showPassword,setShowPassword]=useState(false),[showConfirmation,setShowConfirmation]=useState(false);
 const mismatch=confirmation.length>0&&password!==confirmation;
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[signedOut,setSignedOut]=useState(true);
 useEffect(()=>{
  let cancelled=false;
  if(invalidLink){setState('invalid');return}
  supabase.auth.getUser().then(({data,error})=>{if(cancelled)return;if(error||!data.user)setState('invalid');else{setEmail(data.user.email||'');setState('ready')}}).catch(()=>{if(!cancelled)setState('invalid')});
  return()=>{cancelled=true};
 },[invalidLink]);
 async function submit(event:React.FormEvent){
  event.preventDefault();if(busy)return;
  const problem=passwordProblem(password,confirmation);if(problem){setError(problem);return}
  setBusy(true);setError('');
  try{const result=await completePasswordReset(supabase.auth,password,confirmation);setSignedOut(result.signedOut);setPassword('');setConfirmation('');setState('done')}
  catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar a senha. Tente novamente.')}
  finally{setBusy(false)}
 }
 return <main className="min-h-screen flex items-center justify-center bg-background p-4"><section className="glass-card p-8 rounded-2xl w-full max-w-md relative z-10"><img src={logo} alt="AgendaAÍ Pro" className="h-14 mx-auto mb-6"/><h1 className="text-2xl font-bold text-center mb-4">{state==='done'?'Senha atualizada':'Definir nova senha'}</h1>
 {state==='checking'&&<p role="status">Validando seu link de recuperação…</p>}
 {state==='invalid'&&<><p role="alert" className="text-muted-foreground mb-6">Este link expirou, já foi utilizado ou não é válido. Volte ao login e solicite outro em “Esqueci minha senha”.</p><Button className="w-full" onClick={onExit}>Voltar ao login</Button></>}
 {state==='ready'&&<form onSubmit={submit} className="space-y-4"><p className="text-sm text-muted-foreground">Escolha uma nova senha para {email||'sua conta'}. O acesso pelo link não altera sua senha automaticamente.</p><div className="space-y-2"><Label htmlFor="new-password">Nova senha</Label><div className="relative"><Input className="pr-12" id="new-password" type={showPassword?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={128} disabled={busy} value={password} onChange={e=>{setPassword(e.target.value);setError('')}}/><button type="button" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Ocultar senha':'Mostrar senha'} aria-pressed={showPassword} disabled={busy}>{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div><div className="space-y-2"><Label htmlFor="confirm-password">Confirmar nova senha</Label><div className="relative"><Input className="pr-12" id="confirm-password" type={showConfirmation?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={128} disabled={busy} value={confirmation} onChange={e=>{setConfirmation(e.target.value);setError('')}} aria-invalid={mismatch} aria-describedby={mismatch?'password-mismatch':undefined}/><button type="button" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center" onClick={()=>setShowConfirmation(v=>!v)} aria-label={showConfirmation?'Ocultar confirmação da senha':'Mostrar confirmação da senha'} aria-pressed={showConfirmation} disabled={busy}>{showConfirmation?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div>{mismatch&&<p id="password-mismatch" role="status" className="text-sm text-destructive">As senhas estão diferentes. Digite a mesma senha nos dois campos.</p>}<p className="text-xs text-muted-foreground">Use de 8 a 128 caracteres.</p>{error&&<p role="alert" className="text-destructive">{error}</p>}<Button className="w-full" variant="hero" type="submit" disabled={busy}>{busy?'Salvando…':'Salvar nova senha'}</Button></form>}
 {state==='done'&&<><p role="status" className="mb-6">Sua nova senha foi salva. {signedOut?'Entre novamente com seu e-mail e a nova senha.':'Sua sessão continua aberta. Saia da conta antes de testar a nova senha.'}</p><Button className="w-full" onClick={onExit}>{signedOut?'Ir para o login':'Continuar'}</Button></>}
 </section></main>;
}
