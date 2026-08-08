const CACHE='la-plage-youpiii-v14';
const ASSETS=['/','/index.html','/styles.css','/v10.css?v=10','/v11-cannes.css?v=11','/v12-crowd.css?v=12','/v13-clarity.css?v=13','/app-v10.js?v=10','/v11-cannes.js?v=11','/v12-crowd.js?v=12','/v13-clarity.js?v=13','/v14-cannes-only.js?v=14','/manifest.webmanifest','/icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  if(u.pathname.startsWith('/api/'))return;
  e.respondWith(fetch(e.request).then(r=>{
    const c=r.clone();
    caches.open(CACHE).then(cache=>cache.put(e.request,c));
    return r;
  }).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html'))));
});
