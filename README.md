# digicode-text

ブラウザで通常のテキストコード(`main.cpp`)を編集し、ローカルの専用 compiler(Node + PlatformIO)でマイコン向けに build して、そのままブラウザからボードへ書き込む Web アプリケーション。ブロックエディタではなく、既存 DigiCode(Blockly 版)とは独立した新規プロジェクトで fork ではない。repo は PUBLIC、license は AGPL-3.0(`LICENSE`)。

---

## 利用者向け

### 基本の流れ

1. サイドバーの「ボード」でビルド対象のボードを選ぶ。
2. エディタで `main.cpp` を編集する(Monaco Editor、C++)。
3. 「Build」を押すと、ローカルの compiler がそのコード・ボード・ライブラリ設定でコンパイルする。
4. 成功したら「書き込み」ボタンでボードへ書き込む(RP2040 系は「UF2 ダウンロード」も出る)。
5. 下部パネルの「シリアル」タブで接続すると、ボードの出力が読める(115200 baud)。

コード・ボード・ライブラリを変更すると、直前の Build 成果物は無効になり書き込みボタンは消える。

### 対応ボードと書き込み方法

ボードの定義は `compiler/server.mjs` の `BOARDS` にだけ書かれており、画面・検証・AI へ渡す事実はすべて `GET /boards` の応答から生成される。

| ボード | platform / core | 成果物 | 書き込み |
| --- | --- | --- | --- |
| XIAO RP2040 | maxgerhardt community platform + earlephilhower arduino-pico | `firmware.uf2` | BOOTSEL ドライブへ書き込み |
| Raspberry Pi Pico | 同上 | `firmware.uf2` | BOOTSEL ドライブへ書き込み |
| XIAO ESP32C3 | espressif32@7.0.1 + Arduino ESP32 | flash set(JSON) | esptool-js でブラウザから書き込み |
| Wio Node (ESP8266) | espressif8266@4.2.1 + Arduino ESP8266 | flash set(JSON) | esptool-js でブラウザから書き込み |

- **RP2040 系**: BOOTSEL を押したまま USB を接続すると RPI-RP2 ドライブが現れる(Mac では「NO NAME」と表示されることがある)。「書き込み」を押してそのドライブを選ぶと、File System Access API でそのフォルダへ `firmware.uf2` を書き込む。`INFO_UF2.TXT` の無いフォルダは拒否する。書き込み終了と同時にボードは再起動する。ブラウザがドライブ書き込みに対応しない場合は「UF2 ダウンロード」で保存して手でコピーする。
- **ESP 系**: 「書き込み」を押してブラウザのダイアログで USB 接続したボードのポートを選ぶ。esptool-js が 115200 baud で接続し、その Build が出力した flash set のイメージ・アドレス・flash 設定だけを使って書き込み、完了後に hard reset する。アドレスを README や画面に固定で持たない。
- **Wio Node のみ**: Grove の USB シリアルで接続し、書き込み前に FUNC を押したまま RST を押して書き込みモードへ入れる。完了後に RST を押す。

「ボード」ビューには、core の variant ヘッダーから生成したピン表と、ボードベンダー wiki / シリコンベンダーのデータシートから採った注意点(出所 URL 付き)が出る。AI にも同じ内容を渡している。

### AI 開発支援(BYOK)

右の AI パネルから、現在のコードについて質問したり、変更を依頼したりできる。API キーは利用者自身のものを使う。

- 提供元は **OpenAI / Claude / Gemini** の 3 つ。API 方式は Responses / Chat Completions / Messages / Generate Content の 4 つで、候補モデルを選ぶと自動で設定される(モデル ID と方式の自由入力は「詳細設定」)。
- キーはブラウザから提供元の API へ直接送られる。**この repo の Node サーバーは AI 要求・会話・キーを一切中継しない。** キーは提供元ごとにこのブラウザへ保存でき(暗号化保管ではない)、「保存せず使う」ならページ内だけで使う。「既定にする」は提供元とモデルだけを保存し、キーは保存しない。
- AI に渡すのは、現在の `main.cpp`、選択中のボードの事実(表示名・framework・core 系列・書き込み手順 1 文・Serial の可否・ピン表・出所付きの注意点・そのボードで使えないライブラリ)、設定済みの直接依存と版、製品の対応情報、必要なら一致する Build 失敗ログ。送信内容は「AI に送る内容を確認」で確認できる。
- 回答は説明、または `main.cpp` 全文の変更候補として返る。「コード変更時」で自動適用か、差分を確認して適用かを選ぶ。適用は Undo 1 回で戻せる。AI が Build・依存追加・ボード変更・書き込みを自動実行することはない。
- 回答本文に外部ツールの書き込み手順(16 進アドレスと `.bin`、`esptool` / `write_flash` / `espflash` / `esp-web-tools` など)が含まれていた場合、その本文は表示せず、この製品の書き込み手順に差し替える。

### ライブラリ

- 「ライブラリ」ビューで PlatformIO Registry を検索し、提供者・正式名・Registry ID を確認して具体的なバージョンを選び、プロジェクトに追加する。1 プロジェクト 32 件まで。Git URL・パス・ZIP は受け付けない。
- バージョンは Registry が返す版一覧との完全一致でのみ通る。`latest` や `^7.4` は Build 前に拒否され、実在する版の候補が示される。
- 追加は設定であって取得ではない。実パッケージは Build 時に取得する。`WiFi.h` など core 付属のヘッダーは追加不要。
- **そのボードでは使えないライブラリ**は、compile ハーネスで実際に build 失敗を確認した行だけを `compiler/library-incompat.mjs` に持つ。検索結果では既定で伏せられ(「このボードで使えないライブラリも表示」で表示、「使えません」バッジ付き)、追加済み一覧・Build 結果パネル・AI へ渡すボード事実にも、理由と代替ライブラリが同じ文で出る。

### 画面

- 左のアクティビティバー: エクスプローラ(プロジェクトと `main.cpp`)/ ライブラリ / ボード / AI / 設定 / ヘルプ。同じボタンをもう一度押すとサイドバーを畳む。
- 下部パネル: 「ビルド結果」と「シリアル」のタブ。開閉と高さ調整ができ(ドラッグまたは上下矢印キー)、ログはコピーできる。シリアルタブを表示しただけでは接続しない。
- 右の AI パネル、下端のステータスバー(ボード・Build 状態・Serial 状態・モデル・カーソル位置)。
- テーマは simurai の DuoTone 由来の 4 配色(Dark 紫×金 / Sea 青×緑 / Space 青紫×橙 / Earth 茶×橙)。「設定」で切り替え、「レイアウトを初期化」で幅・高さ・表示状態を戻せる。
- プロジェクトは名前付きで、コード・ボード・ライブラリをこのブラウザに自動保存する。同期・バックアップではない。「ファイル」メニューから 1 プロジェクトを JSON へ書き出し・読み込みできる(読み込みは常に新しい ID で追加)。

### ブラウザ要件

Web Serial と File System Access に対応した Chromium 系(Chrome / Edge)。ローカルの `http://127.0.0.1:3100` を使う。保存内容は同じブラウザ・同じ origin の中にだけある。

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
- **PlatformIO プロジェクト**: `compiler/pio-rp2040`(`xiao_rp2040` と `pico` の 2 env)、`compiler/pio-esp32c3`、`compiler/pio-esp8266`。ESP 系が共有する build スクリプトは `compiler/pio-esp/`(`portable_paths.py`、`package_firmware.py`)。global な lib_deps は持たない。

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
