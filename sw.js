// ============================================
// Service Worker - 오프라인 캐싱 및 PWA 지원
// ============================================

const CACHE_NAME = 'accounting-app-v3';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 설치 이벤트 - 캐시에 리소스 저장
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 열기 완료');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // 즉시 활성화
                return self.skipWaiting();
            })
    );
});

// 활성화 이벤트 - 이전 캐시 삭제
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // 모든 클라이언트에서 즉시 제어
            return self.clients.claim();
        })
    );
});

// fetch 이벤트 - 캐시 우선, 네트워크 대체 전략
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에서 찾으면 반환
                if (response) {
                    return response;
                }
                
                // 캐시에 없으면 네트워크 요청
                return fetch(event.request).then((response) => {
                    // 유효하지 않은 응답은 캐시하지 않음
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // 응답 복제 (스트림은 한 번만 읽을 수 있음)
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // 오프라인 대체 페이지 (필요시)
                console.log('오프라인 상태');
            })
    );
});

// 백그라운드 동기화 지원 (향후 확장용)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('백그라운드 동기화 수행');
    }
});
