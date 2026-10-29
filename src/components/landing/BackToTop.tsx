import {useEffect,useState} from 'react';
import {ArrowUp} from 'lucide-react';
import {Button} from '@/components/ui/button';
export default function BackToTop(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const update=()=>setVisible(window.scrollY>400);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
 return visible?<Button type="button" size="icon" aria-label="Voltar ao início da página" title="Voltar ao início" className="fixed right-4 bottom-5 z-40 rounded-full shadow-lg" onClick={()=>{window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}><ArrowUp className="h-5 w-5"/></Button>:null;
}
