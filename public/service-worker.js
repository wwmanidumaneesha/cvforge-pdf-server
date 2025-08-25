// Simple offline caching for core assets
const CACHE = 'cvforge-v1';
const ASSETS = [
  '/', '/index.html',
  '/assets/css/style.css',
  '/assets/js/utils.js',
  '/assets/js/templates.js',
  '/assets/js/ats.js',
  '/assets/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});