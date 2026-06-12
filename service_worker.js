const CACHE_NAME = 'snowball-game-v1';

// 초기에 무조건 캐싱할 핵심 파일 목록
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('설치 중: 핵심 에셋 캐싱');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 캐시 우선(Cache-First) 로딩 전략
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // 캐시에 있으면 즉시 반환
                }
                
                // 캐시에 없으면 다운로드 후 캐시에 동적 저장
                return fetch(event.request).then(
                    (networkResponse) => {
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            }).catch(() => {
                console.log("오프라인 상태이며 캐시에 없는 리소스입니다:", event.request.url);
            })
    );
});
