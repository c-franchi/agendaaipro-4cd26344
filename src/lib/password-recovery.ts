import type { SupabaseClient } from '@supabase/supabase-js';

type AuthClient = Pick<SupabaseClient['auth'], 'getUser' | 'updateUser' | 'signOut'>;
export function recoveryLocation(location: {search:string;hash:string}) {
  const query=new URLSearchParams(location.search),fragment=new URLSearchParams(location.hash.replace(/^#/,''));
  return {requested:query.get('mode')==='reset'||fragment.get('type')==='recovery',invalid:Boolean(query.get('error')||query.get('error_code')||fragment.get('error')||fragment.get('error_code'))};
}
// Capture intent before the SDK consumes the URL fragment; never retain tokens.
export const initialRecovery=typeof window==='undefined'?{requested:false,invalid:false}:recoveryLocation(window.location);
export function passwordProblem(password:string,confirmation:string):string|null {
  if(password.length<8||password.length>128)return 'Use uma senha entre 8 e 128 caracteres.';
  if(password!==confirmation)return 'As senhas estão diferentes. Digite a mesma senha nos dois campos.';
  return null;
}
export async function completePasswordReset(auth:AuthClient,password:string,confirmation:string) {
  const problem=passwordProblem(password,confirmation);if(problem)throw Error(problem);
  const {data,error}=await auth.getUser();
  if(error||!data.user)throw Error('Seu link expirou ou a sessão não é válida. Solicite um novo link.');
  const result=await auth.updateUser({password});
  if(result.error){const code=(result.error as {code?:string}).code;throw Error(code==='same_password'?'A nova senha deve ser diferente da senha atual.':code==='weak_password'?'A senha é muito fraca. Use uma combinação mais forte de letras, números e símbolos.':'Não foi possível atualizar a senha. Confira os requisitos ou solicite um novo link de recuperação.');}
  // End the recovery session so the user explicitly signs in with the new password.
  const signedOut=await auth.signOut({scope:'local'});
  return {signedOut:!signedOut.error};
}
