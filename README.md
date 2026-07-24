# IRON LOG

## 重要：起動方法について

このプロジェクトの JavaScript は **ES Modules**（`<script type="module">`）で
構成されています。ES Modules はブラウザの仕様上、`index.html` を
ダブルクリックして `file:///.../index.html` として直接開くと
**CORS制限によりモジュールの読み込みに失敗します**。

これが起きると、画面のCSSは表示されるものの、カレンダーが空欄のまま、
ボタンを押しても何も起きない、テンキーが出てこない…といった
「見た目も操作性も違う」状態になります（JSが1行も実行されていないため）。

### 正しい起動方法

このリポジトリには依存パッケージ0のローカルサーバー `server.js` を同梱しています。
Node.js 18〜24 で動作します。

```bash
node server.js
```

起動したら、ブラウザで以下を開いてください。

```
http://localhost:8080
```

ポートを変更したい場合:

```bash
PORT=3000 node server.js
```

### その他の起動方法（お好みで）

- VS Code の「Live Server」拡張機能で `index.html` を開く
- `npx serve .`
- GitHub Pages / Vercel / Netlify 等にデプロイして公開する（最終的な公開目標に対して一番自然な形です）

いずれの方法でも、**http:// 経由でアクセスする**ことが必須です。

## ディレクトリ構成

```
iron-log/
├─ index.html          画面構造（元コードとマークアップは完全一致）
├─ server.js           ローカル確認用の簡易サーバー（本番デプロイには不要）
├─ css/
│  └─ style.css        元の <style> ブロックを分離
└─ js/
   ├─ app.js               エントリーポイント（初期化 + windowへの関数公開）
   ├─ constants.js          定数・初期データ
   ├─ utils.js              汎用ヘルパー
   ├─ state.js              アプリの状態(appState)
   ├─ dataManager.js        LocalStorage 保存/読込
   ├─ uiManager.js          画面遷移・モーダル・トースト
   ├─ calendarManager.js    カレンダー画面
   ├─ workoutManager.js     トレーニング記録画面（最重要画面）
   ├─ timerManager.js       インターバルタイマー
   ├─ statisticsManager.js  成長分析グラフ
   └─ settingsManager.js    設定画面
```
