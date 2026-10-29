export function validateMedia(file:{size:number;type:string},kind:'image'|'video'){
 const types=kind==='image'?['image/jpeg','image/png','image/webp']:['video/mp4','video/webm'];
 if(!types.includes(file.type))return kind==='image'?'Use uma imagem JPG, PNG ou WebP.':'Use um vídeo MP4 ou WebM.';
 if(file.size<=0||file.size>(kind==='image'?5:100)*1024*1024)return kind==='image'?'A imagem deve ter até 5 MB.':'O vídeo deve ter até 100 MB.';
 return null;
}
export function videoSource(raw:string):{kind:'embed'|'file';url:string}|null{
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)return null;
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be'].includes(u.hostname)){
 const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.pathname.startsWith('/embed/')?u.pathname.split('/')[2]:u.searchParams.get('v');
 if(id&&/^[a-zA-Z0-9_-]{11}$/.test(id))return {kind:'embed',url:`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`};return null;
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(u.hostname)){const id=u.pathname.split('/').filter(Boolean).pop();if(id&&/^\d+$/.test(id))return {kind:'embed',url:`https://player.vimeo.com/video/${id}?autoplay=1`};return null;}
 if(/\.(mp4|webm)$/i.test(u.pathname))return {kind:'file',url:u.href};return null;
 }catch{return null;}
}
