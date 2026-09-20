# digicode-text

ブラウザで通常のテキストコード(`main.cpp`)を編集し、ローカルの専用 compiler(Node + PlatformIO)でマイコン向けに build して、そのままブラウザからボードへ書き込む Web アプリケーション。ブロックエディタではなく、既存 DigiCode(Blockly 版)とは独立した新規プロジェクトで fork ではない。repo は PUBLIC、license は AGPL-3.0(`LICENSE`)。

---

## 開発者向け

### 前提と起動

```
npm ci                 # 依存はすべて project 内。実行時 CDN は使わない
npm run build:web      # esbuild で web/app.js と Monaco worker を web/dist へ
npm start              # = node compiler/server.mjs → http://127.0.0.1:3100
```

- Node は 20 系で動かしている(`package.json` に `engines` 指定は無い)。サーバー本体は Node 標準機能のみ、依存ゼロ。
- PlatformIO Core が必要。既定の実行ファイルは `~/.local/bin/pio`(`PIO_BIN` で変更可)。`PORT`、`COMPILE_TIMEOUT_MS` も環境変数で変えられる。
- フロントエンドを変更したら `npm run build:web` を再実行する。`/assets/` は `web/dist` の生成物だけを配信する。

### サーバー API

`POST /compile`(`{env, source, libraries, projectId, projectRevision}` → RP2040 は UF2 バイト列、ESP 系は flash set JSON、失敗は 422 + ログ)、`GET /boards`、`GET /libraries/search`、`GET /libraries/details`(`board` を付けるとそのボードの非互換行が付く)、`GET /libraries/incompat`、`GET /health`、`GET /`。

`/compile` は内部 queue で直列化され、1 要求ごとに新しい一時ディレクトリへ `platformio.ini` とソースを作って build し、終了後に削除する。共有するのは PlatformIO のツールチェーンとパッケージキャッシュだけ。

### 正本(ここだけを直す)

- **ボード**: `compiler/server.mjs` の `BOARDS`。ボード選択肢・プロジェクト検証・AI へ渡すボード事実はすべて `GET /boards` 経由でここから生成される。他の場所にボード一覧を書かない。
- **ピン表**: `compiler/tools/generate-board-pins.mjs` が、このマシンの PlatformIO install の variant ヘッダーを読んで `compiler/boards/<env>.pins.json` を書く。実行時はコミット済み JSON しか読まない。`--check` で古くなっていないか確認できる。
- **ライブラリ非互換表**: `compiler/library-incompat.mjs`。行はハーネスで実際に失敗を見たものだけ、根拠ケース名を添えて書く。バージョンは持たず、行を消すには通るハーネスケースが要る。`platforms` は `BOARDS` の `platform` 値であって `family` ではない(ESP32 と ESP8266 は別)。
- **書き込み前の接続手順**: `compiler/flash-guides.mjs`。`BOARDS` の `flashGuide` の中身はここだけにあり、`GET /boards` 経由で `web/flash-guide.js` のモーダルが描く。`steps[].figure` は `web/figures/<id>.svg`(色を持たない線画。配色とアニメーションは `app.css` の `.flash-figure`)。
- **画面の場所を AI に伝える文**: `web/product-facts.js`。各文は指している要素の id を持ち、`tests/flash-guide.spec.js` が DOM と照合する。何が起きるか(製品の決まり)は `web/ai-context.js` の `PRODUCT_INFO`。
- **PlatformIO プロジェクト**: `compiler/pio-rp2040`(`xiao_rp2040` と `pico` の 2 env)、`compiler/pio-esp32`(`esp32_devkitc_v4`)、`compiler/pio-esp32s3`(`xiao_esp32s3`)、`compiler/pio-esp32c3`、`compiler/pio-esp8266`。チップの系統ごとに 1 ディレクトリで、platform の指定はその中で閉じる(教訓 1)。ESP 系が共有する build スクリプトは `compiler/pio-esp/`(`portable_paths.py`、`package_firmware.py`)。global な lib_deps は持たない。

### テスト

```
node --test compiler/board-pins.test.mjs compiler/library-incompat.test.mjs \
             compiler/library-search.test.mjs compiler/registry.test.mjs
npm run test:browser              # Playwright (channel: chrome), サーバー起動が前提
npm run test:browser -- tests/ai.spec.js
```

Playwright は独立したブラウザコンテキストで動き、普段の Chrome の保存内容には触れない。AI のテストはダミーキーで、外部 HTTP を遮断する。

### compile ハーネス

`tests/usecases/` に board ごとの実際のスケッチを置き、`node tests/usecases/run.mjs` で compiler サーバーへ投げて、どの組み合わせが本当に build できるかを実測する。結果は `tests/usecases/results/<timestamp>/`(git 管理外)に board 別サマリと 1 ケース 1 JSON で出る。実行方法・ケースの書き方・結果の読み方は `tests/usecases/README.md`。

### license 表示

- この repo: AGPL-3.0(`LICENSE`)。
- 配色: simurai の DuoTone syntax themes 由来、MIT(`web/themes/LICENSE-duotone.txt`)。
- アクティビティバーのアイコン: Lucide、ISC(`web/themes/LICENSE-lucide.txt`)。

### セキュリティ

repo は PUBLIC。secret / credential / token / 個人情報 / 非公開 URL を書かない。commit・push の前に gitleaks の staged scan が走る(`.claude/hooks/pre-commit-gate.sh`)。USB・実機操作は利用者の明示操作でのみ行われ、AI もサーバーも自動で実行しない。

---

進め方は `CLAUDE.md`。2026-08 の調査・設計・裁定は `prompt/maintenance/local/legacy/` にメモとして残している。
