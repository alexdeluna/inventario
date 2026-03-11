const CACHE_NAME = 'inv-v1';
const assets = [
 '/',
 '/index.html',
 '/visual.css',
 '/app.js'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

