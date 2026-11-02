const CACHE='vat-review-v15';
const FILES=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-192.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// صفحه (index.html): اول شبکه (بدون کش HTTP)، اگر آفلاین یا کند بود از کش
function netFirst(req){
  return new Promise(resolve=>{
    let done=false;
    const fallback=()=>caches.match('./index.html').then(r=>r||caches.match(req,{ignoreSearch:true}));
    const t=setTimeout(()=>{if(!done){done=true;fallback().then(r=>r&&resolve(r))}},5000);
    fetch(req,{cache:'no-store'}).then(res=>{
      clearTimeout(t);
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy)).catch(()=>{})}
      if(!done||res.ok){done=true;resolve(res)}
    }).catch(()=>{clearTimeout(t);done=true;fallback().then(r=>resolve(r||Response.error()))});
  });
}
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return;
  if(r.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/')){e.respondWith(netFirst(r));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(x=>x||fetch(r).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(r,copy)).catch(()=>{});return res;
  })));
});
