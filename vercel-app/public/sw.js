const CACHE="robeflow-shell-v1";
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(["/","/login"]))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(response=>response||caches.match("/"))));});
