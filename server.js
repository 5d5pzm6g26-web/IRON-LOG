// ============================================================================
// server.js
// ES Modules (type="module") は file:// で直接開くとブラウザのCORS制限に
// 引っかかり読み込みに失敗します（画面が真っ白/操作不能に見える原因）。
// このスクリプトは依存パッケージ0で index.html 等を配信するだけの
// 最小限のローカル開発サーバーです。Node.js 18〜24 で動作確認済みの
// 標準モジュールのみを使用しています。
//
// 使い方:
//   node server.js
//   → http://localhost:8080 をブラウザで開く
//
// ポートを変えたい場合:
//   PORT=3000 node server.js
// ============================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = process.env.PORT || 8080;

// ES Modules を正しく実行させるには .js に対して
// Content-Type: text/javascript を返す必要がある
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    // ディレクトリトラバーサル対策
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(ROOT, safePath);

    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found: ' + urlPath);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`IRON LOG を配信中: http://localhost:${PORT}`);
    console.log('終了するには Ctrl+C を押してください。');
});
