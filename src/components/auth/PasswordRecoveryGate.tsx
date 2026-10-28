import {useEffect,useState,type ReactNode} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {supabase} from '@/integrations/supabase/client';
import {initialRecovery,recoveryLocation} from '@/lib/password-recovery';
import ResetPassword from './ResetPassword';

export default function PasswordRecoveryGate({children}:{children:ReactNode}) {
 const location=useLocation(),navigate=useNavigate();
 const intent=recoveryLocation(location);
 const [recovering,setRecovering]=useState(initialRecovery.requested);
 const [invalid,setInvalid]=useState(initialRecovery.invalid&&initialRecovery.requested);
 useEffect(()=>{
  const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{
   if(event==='PASSWORD_RECOVERY') {setInvalid(false);setRecovering(true);}
  });
  return()=>subscription.unsubscribe();
 },[]);
 const exit=()=>{setRecovering(false);setInvalid(false);navigate('/auth',{replace:true})};
 // Keep normal login/checkout/profile routes unmounted while recovery is active.
 if(recovering||intent.requested)return <ResetPassword invalidLink={invalid||intent.invalid} onExit={exit}/>;
 return children;
}
