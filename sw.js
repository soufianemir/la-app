const CACHE='la-plage-youpiii-v16';
const ASSETS=[
  '/',
  '/index.html',
  '/styles.css',
  '/v10.css?v=10',
  '/v11-cannes.css?v=11',
  '/v12-crowd.css?v=12',
  '/v13-clarity.css?v=13',
  '/v16.css?v=16',
  '/app-v10.js?v=10',
  '/v11-cannes.js?v=11',
  '/v12-crowd.js?v=12',
  '/v14-cannes-only.js?v=14',
  '/v16-ui.js?v=16',
  '/manifest.webmanifest',
  '/icon.svg'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('activate',event=>event.waitUntil(
  Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
  ])
));

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin) return;
  if(url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request).then(response=>{
      if(response && response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      }
      return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('/index.html')))
  );
});
