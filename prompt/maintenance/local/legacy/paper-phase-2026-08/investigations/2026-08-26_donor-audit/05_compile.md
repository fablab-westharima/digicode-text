# 05_compile — Compile クラスタ (Phase 2)

**donor:** `digicode-compile-api` @ `3376746f1e5a4ca039e0cade279741f16612fccf` (branch `main`, clean) — **READ ONLY**
**関連:** `DigiCode` @ `bb35c3b` の `compile-proxy-worker/` (未読、追加調査必要)
**調査方法:** ソース静的読解 (`src/*.ts`, `Dockerfile`, `README.md`, `templates/`)。**実行・build・compile は未実施** → 型ラベル: **static のみ**

---

## 1. 実装の骨格

```
[client] → POST /api/compile        (JSON, 同期)
        → POST /api/compile/sse     (SSE 進捗)
   1. FQBN → PlatformIO target 解決      src/boards.ts
   2. .ino テンプレート読込 (image に焼込) templates/
   3. ユーザ fragment を注入              src/inject.ts
   4. PROJECTS_DIR に project 実体化      src/projectStore.ts
   5. `pio run` (共有 build_cache_dir)    src/compile.ts
   6. firmware.bin (+ ESP32 fullPackage 用 bootloader/partitions/boot_app0) 読出
   7. 応答
```

endpoint は **3 本のみ**: `GET /health` (server.ts:72) / `POST /api/compile` (:83) / `POST /api/compile/sse` (:124)。

## 2. 🔴 最重要 — API は「任意ソース」を受け取らない

`POST /api/compile` の body は `{fqbn, template, fragments:{includes, globals, setupCode, loopCode}}`。
`src/inject.ts` は固定テンプレートに対し **4 箇所を正規表現で差し替える**だけ:

1. `includes` … テンプレート内**最後の `#include` 行の直後**に追記
2. `globals` … `void userSetup()` の直前に挿入
3. `setupCode` … `void userSetup() { ... }` の**本体を置換**
4. `loopCode` … `void userLoop() { ... }` の**本体を置換**

置換後のコメントは `// Blockly から生成されたセットアップコード` を**サーバ側で埋め込む** (`inject.ts:63,71`)。すなわち **API の契約そのものが Blockly 前提**であり、legacy `arduino-compile-server/src/index.js:119-165` の移植 (byte-stability 目的で正規表現も逐語移植) と明記されている (`inject.ts:11-26`)。

**DigiCode Text への含意 (🔴 Compiler 共用判断の中核)**

- Text 版が扱いたいもの — 任意の `.ino`/`.cpp`/`.h`、`src/`・`include/` を含む**複数ファイル**プロジェクト — を、この API は**受け取る口を持たない**。
- テンプレートは接続方式で 3 択に固定 (`templateNameFor`: usb→`DigiCodeUSB` / ble→`DigiCodeBLE` / ota→`DigiCodeOTA`、`inject.ts:79-90`)。テンプレート本体には WiFi 複数保存・OTA・HTTP サーバ・Preferences・シリアルコマンドなど**製品ロジックが大量に含まれる** (`templates/DigiCodeOTA.ino`)。Text のユーザが書いた `void setup()` をそのまま走らせる構造ではない。
- したがって「共用」は *同じサーバを指すだけ* では成立せず、**Compile API 側に新しい入力経路 (multi-file / full-source) を足す**ことを意味する。これは Classic 本番 API への変更であり、**裁定 §13 が言う "Classic への悪影響" の有無を、追加ではなく改変の観点でも評価する必要がある**。
  - 緩和材料: 追加は**新 endpoint の追加 (additive)** として設計できる可能性がある。既存 3 endpoint と `injectUserCode` に触れずに `POST /api/compile/project` 系を足せるなら、Classic 側の挙動は不変にできる。**これは仮説であり未検証** → next-objective candidate。

## 3. Board 対応の実態

- `FQBN_TO_PIO` は **10 エントリ / 全て ESP32 系** (`esp32`, `esp32s3`, `esp32c3`, `esp32c6`, M5Stack core/stick_c_plus/atom_lite/atom_matrix/stamp_pico/atoms3)。`boards.ts:66-`
- **pioarduino は既に採用済み・統一済み**。全 ESP32 target が pioarduino fork (`platform-espressif32` tag `54.03.21` = Arduino v3.2.1 / ESP-IDF v5.4.2) 経由 (BUG-059 X2, 2026-04-30、`boards.ts:19-53`)。→ **企画書 §21「PlatformIO / pioarduino は調査後に決定」は、donor 側では既に決着している。**
- **RP2040 は 2026-05-05 に全削除**。`raspberrypi` platform install も Dockerfile から除去。「DigiCode is ESP32-only」と明記 (`Dockerfile:69-76`)。
- 🟡 **Board 追加の運用が `SSH でファイル編集 + コンテナ再起動 (rebuild 不要)`** と記されている (`boards.ts:12-15`)。軽量ではあるが、**本番サーバ上の直接編集が正規手順**ということでもあり、Text 側が「軽く Board を足す」運用をここに乗せると Classic と同じファイルを触る。共用判断の重要材料。
- board 固有の回避が既に複数ある: M5Stack Basic/Gray/Fire を `m5stack-fire` に寄せる (variant `m5stack_core_esp32` が pioarduino に無く `pins_arduino.h` 不在で失敗)、M5StickC Plus も同種の variant 不整合 — `boards.ts:74-`。**「Board 1 行追加」で済まない実例が donor 側に既に存在する。**

## 4. 実行環境 / 制約

| 項目 | 実測値 | 証拠 |
|---|---|---|
| ベースイメージ | `node:20` (Debian bookworm、slim から変更。理由: pioarduino の Python 依存の whack-a-mole 回避、+800MB 許容) | `Dockerfile:9-20` |
| PlatformIO Core | **6.1.19** (pip pin) | `Dockerfile:52` |
| Python 依存 | `pyyaml` / `jsonschema` / `click<8.2` / `esptool` を明示 pin。`click<8.2` は `get_metavar()` シグネチャ変更回避 | `Dockerfile:40-57` |
| vendored libs | image に焼込 (`LIBS_DIR=/opt/digicode-compile/libs`): `Adafruit_NeoPixel` / `DigiBiped` / `DigiMorpher` / `DigiMotion` / `DigiRover` / `ESP32Servo` / `NimBLE-Arduino` / `NimBLEOta` | `Dockerfile:60-63`, `libs/` |
| テンプレート | 4 本を image に焼込 (`BasicArduino` / `DigiCodeOTA` / `DigiCodeUSB` / `DigiCodeBLE`) | `Dockerfile:66` |
| timeout | `COMPILE_TIMEOUT_MS` 既定 **180,000ms** | `compile.ts:112` |
| 結果 cache | SHA-256 key の disk blob cache (`CACHE_DIR` 既定 `/opt/digicode-compile/cache`)。`?no-cache=true` で bypass 可 | `compile.ts:36,87-112`, `cache.ts` |
| build cache | `build_cache_dir = /root/.platformio/build-cache` を **image に焼き込み** (VOLUME ではない)。warmup で事前投入 | `compile.ts:307,383-394` |
| 同時実行制御 | `projectLock.ts` = **プロセス内・key 単位の直列キュー**。分散ロックでも並列度制御でもない | `projectLock.ts:10` |
| 実測性能 (README 記載、**未再現**) | 初回 cold 50-190s / warm rebuild 約 9.6s / cache HIT 約 1ms | `README.md` |
| artifact | `firmware.bin` base64。ESP32 fullPackage 時のみ `bootloader.bin` / `partitions.bin` / `boot_app0.bin` を併せて返す | `cache.ts:15-17,103-137` |

## 5. verdict (暫定)

| 対象 | verdict | 根拠 |
|---|---|---|
| Docker image / toolchain 基盤 (PIO 6.1.19 + pioarduino + Python pin + warmup cache) | **そのまま流用可能**の第一候補 | Text でも同じ ESP32 toolchain が要る。既に pioarduino 統一済み |
| vendored libs | **改修流用** | `DigiBiped`/`DigiMorpher`/`DigiMotion`/`DigiRover` は競技ロボット向け。Text の対象範囲次第で要否が変わる |
| `POST /api/compile` の fragment 契約 | **Text では不採用 / 新規実装必要** | 任意複数ファイルを受け取れない。Blockly 前提が API 契約に埋まっている |
| `.ino` テンプレート 4 種 | **Text では不採用候補** | 製品ロジックを内包し、ユーザの `setup()/loop()` を前提としない |
| `boards.ts` の FQBN→PIO マップ | **そのまま流用可能** | Text でも同じ写像が要る。ただし本番編集運用は要再設計 |
| cache / projectLock / projectStore | **改修流用** | cache key の入力が fragment 前提。multi-file 化で key 設計が変わる |
| `compile-proxy-worker` | **追加調査必要** | 未読 |

## 6. remaining unknown / risk

- 🔴 **未読**: `DigiCode/compile-proxy-worker/` (Cloudflare Worker、13 ファイル)。Cloud Compile の経路と認証がここにある可能性。
- 🔴 **未検証**: 「新 endpoint の追加なら Classic に無影響」という緩和仮説。`server.ts` / `compile.ts` の共有状態 (cache key、project key、lock key) を読み切る必要がある。
- 🟡 **未検証**: README 記載の性能値・image サイズ。**実 build も実 compile も行っていない** (static のみ)。
- 🟡 image に焼いた `build-cache` は VOLUME ではないため、**image 更新でキャッシュが失われる**設計。Text 側の Board 追加頻度が上がると再 warmup コストが効く可能性。
- 🟢 `templates/DigiCodeOTA.ino` に AP パスワードの既定値がリテラルで入っている。**donor 側の事情であり、digicode-text へ持ち込まないこと** (このファイルを流用対象から外す理由の一つ)。

---

# 追補 (Phase 2 続き) — 共有状態と Cloud 経路

**追加証拠:** `digicode-compile-api@3376746` の `src/{cache,projectStore,compile}.ts` / `DigiCode@bb35c3b` の `compile-proxy-worker/src/index.ts` / `variants/ota/frontend/src/services/compileService.ts`

## 7. 🔴 lib_deps が全ビルド共通 — Classic 悪影響の実証済み経路

`compile.ts:218-229` の警告が、裁定 §13 の問いに直接答える:

> ⚠️ lib_deps entries are build-active: **every entry here is compiled for every ESP32 build** under `lib_ldf_mode = chain`, regardless of which boards use it. Do NOT add libs as placeholders for future boards — `heltecautomation/Heltec ESP32 Dev-Boards` was a placeholder here until 55.md Phase 2 (R1, 2026-05-04) and its **headers/macros polluted 16/20 boards' fresh compiles** (root cause A of 54.md §1.2).

**つまり「Library を 1 本足す」は Classic の全ビルドに影響する構造であり、実際に事故が起きた記録がある。** 同種の実例がもう 1 件: `miguelbalboa/MFRC522` と `arozcan/MFRC522-I2C-Library` が同名クラスを持ち、**ユーザソースが `#include` していなくてもリンク段で衝突**した (BUG-059 X2 round 5)。対処が `lib_ldf_mode = chain` の明示 (`compile.ts:400-410`)。

さらに `ESP32Servo360` は `#error` 内のスマートクォートで **全 ESP32 ビルドが落ちる**ため削除された (`compile.ts:239-245`)。

→ **「Text 側で Board / Library を軽く増やす」を現行 lib_deps に乗せると、Classic の全ビルドが被弾する。** これは推測ではなく donor が自ら記録した既往症。

**ただし分離の余地はある (未検証):** `platformio.ini` は `buildIni(target)` により**リクエストごとに生成**され (`compile.ts:310-415`)、`lib_deps` はその関数の出力にすぎない。Text 用の target 記述子が独自の lib_deps 集合を返せば、ini レベルでは分離できる**可能性**がある。共有が残るのは image に導入済みの platform/framework パッケージ群と `BUILD_CACHE_DIR`。

## 8. 共有状態のキー設計 (additive 経路の成立可能性)

| 状態 | キー | Text 追加時の衝突可能性 |
|---|---|---|
| 永続 project dir | `projectKey(pioBoard, templateName)` = `${board}_${template}` (`projectStore.ts:36-38`) | **衝突する。** Text 用に別 template 名 / 別 namespace を使えば回避可能 |
| 排他制御 | `projectLock` = **プロセス内・key 単位の直列キュー** (`projectLock.ts:10`) | 同 key なら直列化。別 key なら並列。**分散ロックではない** — 複数プロセス/コンテナ運用時は保護されない (🟡 未検証) |
| 結果 cache | SHA-256(`v3` + platform + board + template + injectedSource + extraBuildFlags + **libDepsHash**) (`cache.ts:35-60`) | prefix と libDepsHash が入るので**汚染しにくい**。設計が既に「lib 構成が変われば別エントリ」になっている |
| build object cache | `/root/.platformio/build-cache` **全体で共有**、image に焼込 (VOLUME ではない) (`compile.ts:297-307`) | 共有。Text 追加分がキャッシュを膨らませる。image 更新で消える |
| ソース書き込み | `writeMainIno()` が **`src/main.ino` 1 ファイルを上書き** (`projectStore.ts:70-75`) | **multi-file は現状不可能。** Text 経路には別の materializer が要る |

**暫定所見 (未検証、確定禁止):** additive な Text 専用経路は *構造的には* 置ける余地がある — ini 生成が関数化されており、cache key に lib 構成が含まれ、project key が引数化されているため。**成立を妨げる最大要因は lib_deps の全ビルド共通性ではなく、`src/main.ino` 単一ファイル前提と fragment 契約**。次 objective で `server.ts` / `compile.ts` の呼び出し経路を最後まで追う必要がある。

## 9. Cloud Compile 経路 (`compile-proxy-worker`)

Cloudflare Worker 1 ファイル (`src/index.ts`)。責任範囲は **CORS + primary/backup failover のみ**。

- primary = `https://compile.digital-fab.jp` (Cloudflare Tunnel 経由)、backup = Railway 上のインスタンス。primary が 5xx か到達不能なら backup へ。両方失敗で 503。
- **auth なし・rate limit なし・request size 制限なし・timeout 設定なし。** body をそのまま `fetch` で転送するだけ。
  - → 🟢 **compile 経路に auth / subscription の coupling が無い**。「auth なし」を掲げる DigiCode Text にとって好都合。
  - → 🟡 逆に言えば、許可 origin からの無制限中継。Text を足すなら濫用対策は**新規実装が必要**。
- 🔴 **`ALLOWED_ORIGINS` が 4 つにハードコード** (`code.fablab-westharima.jp` / `digicode-frontend.pages.dev` / `localhost:5173` / `localhost:3000`)。**digicode-text の origin は含まれない** → 別 URL で運用する Text は、この Worker を通す限り **CORS で弾かれる**。通すには **Classic 本番 Worker の変更が必要**。これは裁定 §17 の禁止事項に触れるので、Donor Audit では**変更せず finding として記録**する。
- frontend 側 (`compileService.ts`) も primary/fallback を持ち、既定は **SSE 経路** (`/api/compile/sse`)。`POST /api/compile` は CI smoke / orchestrator 用途。バージョン確認だけ backend worker (`esp32-blockly-backend...workers.dev/api/health/compile-server-latest`) を経由。

## 10. 追加の verdict

| 対象 | verdict | 根拠 |
|---|---|---|
| `compile-proxy-worker` の failover + CORS 構造 | **改修流用** (Text 用に別 Worker を立てるのが素直) | 実装は 130 行程度で薄い。Classic の Worker を書き換えるのは禁止事項に触れる |
| lib_deps 設計 (単一グローバル集合) | **新規実装が必要** | Text の「軽く増やす」と構造的に両立しない |
| cache key 設計 (`v3` + libDepsHash) | **そのまま流用可能** | 設計思想が既に正しい |
| `projectStore` の単一 `main.ino` | **新規実装が必要** | multi-file 不可 |
| Local Docker 配布 (`docker-compose.local.yml` + `digicode-installer`) | **追加調査必要** | installer repo 未読 |
