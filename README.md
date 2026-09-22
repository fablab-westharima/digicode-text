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
- PlatformIO Core が必要。既定の実行ファイルは `~/.local/bin/pio`(`PIO_BIN` で変更可)。`PORT`(既定 3100)、`COMPILE_TIMEOUT_MS`(既定 90000)も環境変数で変えられる。環境変数の一覧は下の「Docker image」と `compiler/server.mjs` の冒頭。
- フロントエンドを変更したら `npm run build:web` を再実行する。`/assets/` は `web/dist` の生成物だけを配信する。

### Cloudflare Pages への配布

`npm run deploy:pages` で、`COMPILER_BASE_URL`(既定 `https://text-compile.fablab-westharima.jp`)を埋めて `build:web` し、`web/index.html` と `web/dist` を `/` と `/assets/` の形に並べて `wrangler pages deploy` で Pages project `digicode-text`(`PAGES_PROJECT` で変更可)へ上げる。`wrangler` は PATH にある login 済みのものを使う。画面からの `/boards`・`/compile` は埋めた compile サーバーへ飛ぶ(利用者が設定で入れた URL のほうが強い)。

### サーバー API

`POST /compile`(`{env, source, libraries, projectId, projectRevision}` → RP2040 は UF2 バイト列、ESP 系は flash set JSON、失敗は 422 + ログ)、`GET /boards`、`GET /libraries/search`、`GET /libraries/details`(`board` を付けるとそのボードの非互換行が付く)、`GET /libraries/incompat`、`GET /health`、`GET /`。

`/compile` は内部 queue で直列化され、1 要求ごとに新しい一時ディレクトリへ `platformio.ini` とソースを作って build し、終了後に削除する。共有するのは PlatformIO のツールチェーンとパッケージキャッシュだけ。

build のたびに stdout へ 1 行の JSON(JSON Lines)が出る。`{t, env, target, ok, stage, ms, bytes, libs, running, waiting}` で、`env` は要求されたボード id、`target` は実際に build した PlatformIO env、`running`/`waiting` はその build が始まった時点の同時 build 数と待ち数。ソースコードは出さない。

### Docker image

repo 直下の `Dockerfile` が compile サーバーの image を作る。PlatformIO Core・platform・toolchain・framework をすべて焼き込み、build 中に全ボードの hello を 1 回建てて(`compiler/tools/docker-warmup.mjs`)、1 台でも建たなければ image build を失敗させる。だから動いているコンテナは compile のためにネットワークへ出ない。

```
docker build --platform linux/amd64 -t digicode-compiler:repo .
```

環境変数(`compiler/server.mjs` の冒頭にも同じ一覧がある):

| 名前 | 既定 | image の既定 | 意味 |
|---|---|---|---|
| `BIND_HOST` | `127.0.0.1` | `0.0.0.0` | listen するアドレス。published port は loopback のリスナーには届かない |
| `PORT` | `3100` | `3100` | listen するポート |
| `PIO_BIN` | `~/.local/bin/pio` | `/opt/pio-venv/bin/pio` | `pio` の実行ファイル |
| `COMPILE_TIMEOUT_MS` | `90000` | — | 1 回の `pio run` を打ち切るまで |
| `MAX_CONCURRENT_BUILDS` | コア数の半分(最低 1) | — | 同時 build 数。`pio run` は 1 件で全コアを使うので、コアの少ない VPS では 1 |
| `ALLOWED_ORIGINS` | 空(CORS ヘッダ無し) | 設定しない | 許すオリジンをカンマ区切りで。`*` は使わない。同一オリジンで配るなら空のまま |
| `PIO_CORE_DIR_ESP8266` | 空(共通の core dir) | `/opt/platformio-esp8266` | ESP8266 の build にだけ使う PlatformIO core dir |

run 例(別オリジンの Web から呼ぶ場合):

```
docker run -d --name digicode-compiler \
  -p 127.0.0.1:3100:3100 \
  -e ALLOWED_ORIGINS=https://example.com \
  -e MAX_CONCURRENT_BUILDS=1 \
  --memory 2g --restart unless-stopped \
  --log-opt max-size=10m --log-opt max-file=5 \
  digicode-compiler:repo
```

ネットワーク無しで建つことの確認は `--network none` で。このときは `-p` が効かないので、コンテナの内側から叩く。

```
docker run -d --network none --name dc-verify digicode-compiler:repo
docker exec dc-verify node -e "fetch('http://127.0.0.1:3100/health').then(r=>r.json()).then(console.log)"
```

### 正本(ここだけを直す)

- **ボード**: `compiler/server.mjs` の `BOARDS`。ボード選択肢・プロジェクト検証・AI へ渡すボード事実はすべて `GET /boards` 経由でここから生成される。他の場所にボード一覧を書かない。
- **ピン表**: `compiler/tools/generate-board-pins.mjs` が、このマシンの PlatformIO install の variant ヘッダーを読んで `compiler/boards/<env>.pins.json` を書く。実行時はコミット済み JSON しか読まない。`--check` で古くなっていないか確認できる。
- **ライブラリ非互換表**: `compiler/library-incompat.mjs`。行はハーネスで実際に失敗を見たものだけ、根拠ケース名を添えて書く。バージョンは持たず、行を消すには通るハーネスケースが要る。行は `platforms`・`boards` のどちらでも書ける(両方は任意だが、少なくとも片方は要る)。`platforms` は `BOARDS` の `platform` 値であって `family` ではない(ESP32 と ESP8266 は別)。`boards` は `BOARDS` のキー(ボード id)で、同じ platform の他のボードでは build できているものにだけ使う。
- **書き込み前の接続手順**: `compiler/flash-guides.mjs`。`BOARDS` の `flashGuide` の中身はここだけにあり、`GET /boards` 経由で `web/flash-guide.js` のモーダルが描く。`steps[].figure` は `web/figures/<id>.svg`(色を持たない線画。配色とアニメーションは `app.css` の `.flash-figure`)。
- **画面の場所を AI に伝える文**: `web/product-facts.js`。各文は指している要素の id を持ち、`tests/flash-guide.spec.js` が DOM と照合する。何が起きるか(製品の決まり)は `web/ai-context.js` の `PRODUCT_INFO`。
- **PlatformIO プロジェクト**: `compiler/pio-rp2040`(`xiao_rp2040`・`pico`・`pico_w` の 3 env)、`compiler/pio-esp32`(`esp32_devkitc_v4`・`m5stack_atom`・`m5stack_stickc_plus2` の 3 env。ATOM Lite と ATOM Matrix は一覧では別の 2 台だが、build 設定に差が無いので `m5stack_atom` env を共有する。platform が持たないボード定義はこの project の `boards/` に置く)、`compiler/pio-esp32s3`(`xiao_esp32s3`・`m5stack_cores3`・`m5stamp_s3a`・`m5stack_atoms3` の 4 env。CoreS3 と CoreS3-SE、ATOMS3 と ATOMS3 Lite はそれぞれ一覧では別の 2 台だが、build 設定に差が無いので `m5stack_cores3` env と `m5stack_atoms3` env を共有する)、`compiler/pio-esp32c5`(`xiao_esp32c5`・`esp32_c5_devkitc_1`・`espr_developer_c5`・`m5stamp_c5` の 4 env。platform が持たないボード定義はこの project の `boards/` に置く)、`compiler/pio-esp32p4`(`m5stamp_p4` の 1 env。platform が持たないボード定義は `boards/`、core に無い variant は `variants/` に置き、env の `board_build.variants_dir` でそこを指す)、`compiler/pio-esp32c3`、`compiler/pio-esp8266`。チップの系統ごとに 1 ディレクトリで、platform の指定はその中で閉じる(教訓 1)。ESP 系が共有する build スクリプトは `compiler/pio-esp/`(`portable_paths.py`、`package_firmware.py`)。global な lib_deps は持たない。

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
