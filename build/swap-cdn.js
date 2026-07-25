#!/usr/bin/env node
/*
 * build/swap-cdn.js
 * 公開用の index.html を生成するスクリプト。
 *  - 元の index.html（CDN版）は書き換えません（あなたが管理し続けるファイル）。
 *  - CDNのTailwind <script> 2つを、ビルド済み <link rel="stylesheet" href="./tailwind.css"> に差し替え、
 *    生成物を dist/ に出力します。
 *
 * 使い方: node build/swap-cdn.js
 * 前提: 先に tailwind.css が生成済みであること（ワークフローが順に実行します）。
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcHtml = path.join(root, 'index.html');
const distDir = path.join(root, 'dist');

let html = fs.readFileSync(srcHtml, 'utf8');

// 1) Tailwind CDN 本体の <script src="https://cdn.tailwindcss.com"></script> を削除
html = html.replace(
  /\s*<!--\s*Tailwind CSS\s*-->\s*/i, '\n    <!-- Tailwind CSS (built) -->\n    <link rel="stylesheet" href="./tailwind.css">\n'
);
html = html.replace(
  /\s*<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']>\s*<\/script>/i, ''
);

// 2) tailwind.config = {...} を含む設定用 <script>...</script> ブロックを丸ごと削除
//    （"tailwind.config" を含む inline script だけを対象にする）
html = html.replace(
  /<script>(?:(?!<\/script>)[\s\S])*?tailwind\.config[\s\S]*?<\/script>/i, ''
);

// 3) 出力
fs.mkdirSync(distDir, { recursive: true });

// tailwind.css を dist にコピー
const cssSrc = path.join(root, 'tailwind.css');
if (!fs.existsSync(cssSrc)) {
  console.error('ERROR: tailwind.css が見つかりません。先に tailwind のビルドを実行してください。');
  process.exit(1);
}
fs.copyFileSync(cssSrc, path.join(distDir, 'tailwind.css'));

// index.html を dist に出力
fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

// 簡易チェック: CDNが残っていないこと
if (/cdn\.tailwindcss\.com/.test(html)) {
  console.error('WARNING: 生成後の index.html にまだ Tailwind CDN 参照が残っています。');
  process.exit(1);
}

console.log('OK: dist/index.html と dist/tailwind.css を生成しました。');
