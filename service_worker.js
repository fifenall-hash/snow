const CACHE_NAME = 'snowball-game-v1';

// 초기에 무조건 캐싱할 핵심 파일 목록
const URLS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. 서비스 워커 설치 (캐시 초기화)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('설치 중: 핵심 에셋 캐싱');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
    // 즉시 활성화
    self.skipWaiting();
});

// 2. 구버전 캐시 정리 (버전 업데이트 시)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('오래된 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. 네트워크 요청 가로채기 (캐시-우선 전략 및 동적 캐싱)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 파일이 있으면 캐시에서 즉시 반환
                if (response) {
                    return response;
                }
                
                // 캐시에 없으면 네트워크(서버)에서 다운로드
                return fetch(event.request).then(
                    (networkResponse) => {
                        // 유효한 응답이 아니면 그냥 반환
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // 다운로드 받은 새 파일을 캐시에 동적으로 복사해둠 (다음번 로딩을 위해)
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            }).catch(() => {
                // 오프라인 상태이고 캐시에도 없는 경우의 에러 처리
                console.log("오프라인 상태이며 캐시에 없는 리소스입니다:", event.request.url);
            })
    );
});