import {useLayoutEffect} from 'react';
import {useLocation,useNavigationType} from 'react-router-dom';

// Sections can mount after the route changes. Resolve the fragment after rendering,
// and stop observing as soon as its target is available.
export default function RouteScroll(){
 const {pathname,hash,key}=useLocation();
 const navigation=useNavigationType();
 useLayoutEffect(()=>{
  if(!hash){if(navigation!=='POP')window.scrollTo({top:0,left:0,behavior:'auto'});return;}
  let id:string;try{id=decodeURIComponent(hash.slice(1))}catch{return;}
  let frame=0,observer:MutationObserver|undefined;
  const reveal=()=>{const target=document.getElementById(id);if(!target)return false;observer?.disconnect();frame=requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));return true;};
  if(!reveal()){observer=new MutationObserver(()=>reveal());observer.observe(document.body,{childList:true,subtree:true});}
  const timeout=window.setTimeout(()=>observer?.disconnect(),5000);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();clearTimeout(timeout);};
 },[pathname,hash,key,navigation]);
 return null;
}
