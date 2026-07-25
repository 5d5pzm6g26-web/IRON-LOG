// IRON LOG Service Worker（最小構成）
// 目的: PWAとしてホーム画面に追加し、全画面(standalone)で起動できるようにする。
// 方針: オフライン完全対応は狙わないため、キャッシュは最小限。
//        基本はネットワーク優先で、取得できたものだけ控えめにキャッシュする。
//        （CDN依存のTailwind/FontAwesome/Chart.jsと衝突しないようにするため）

const CACHE = 'ironlog-v1';

// インストール時: アプリ本体(index.html)だけ先読みキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([
      './',
      './index.html',
      './manifest.json',
      './icons/icon-192.png',
      './icons/icon-512.png'
    ])).catch(() => {})
  );
  self.skipWaiting();
});

// 有効化時: 古いバージョンのキャッシュを掃除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 取得時: ネットワーク優先。失敗したらキャッシュにフォールバック。
// （新しい内容を常に取りに行くので「更新したのに古い画面が出る」を避けやすい）
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // 同一オリジンの取得成功分だけ控えめにキャッシュ更新
        try {
          const url = new URL(req.url);
          if (url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
          }
        } catch (e) {}
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
