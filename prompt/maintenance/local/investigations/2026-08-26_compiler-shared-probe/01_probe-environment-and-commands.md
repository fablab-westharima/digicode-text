# 01_probe environment / isolation / deviations / commands

**PRIMARY_OBJECTIVE:** Compiler Shared / Separate 判断に必要な実証調査
**実施:** 2026-08-26 (Session 002) / **検証の型:** 実 compile (real-fire) + isolated 実行 + static 読解

---

## 1. production 非接触の担保

裁定 §3 が変更を禁じた対象と、本 probe が実際に何をしたか。

| 禁止対象 | 本 probe の扱い | 実測による裏づけ |
|---|---|---|
| DigiCode production / donor repo | **READ ONLY**。probe 開始前と全 probe 完了後に SHA と dirty を実測 | `DigiCode` = `bb35c3b8025610299bf952c2c45eda2196a07401` dirty=**0**、`digicode-compile-api` = `3376746f1e5a4ca039e0cade279741f16612fccf` dirty=**0** branch=`main` — **開始時と終了時で同一** |
| production Docker image | image は **pull も build も rebuild も tag 付けもしていない**。既存 image から使い捨てコンテナを起動しただけ | image id `sha256:f48e8bb4fa29…` created `2026-05-26T09:28:00Z` (不変) |
| Local Compiler production 環境 | 既存の停止済みコンテナ `goofy_hugle` (port 3001) に**一切触れていない** (start / restart / exec / rm いずれもなし) | probe は別名コンテナ `dt-probe-api`、bind は **127.0.0.1:3999** |
| production Cloud Compiler / Cloudflare Worker / DNS / deploy | **ネットワーク接続なし**。Worker は donor のコードを isolated に実行し、上流 `fetch` は stub に差し替えた | harness の応答 body は stub 由来 (`{"upstream": …}`)。実 `compile.digital-fab.jp` へは 1 リクエストも出していない |
| Board / Library 本番登録 | 追加は **probe 専用 registry と probe 専用 test lib のみ**。donor の `boards.ts` / `compile.ts` の lib 一覧は変更していない | 後述 D-1 を除き差分 0 |
| Classic endpoint / template / fragment 契約 | **1 行も変更していない**。`inject.ts` / `projectStore.ts` / `cache.ts` / `boards.ts` / `projectLock.ts` は差分 0 | `git diff --numstat` = 上記 5 ファイルすべて出力なし |

**isolated clone の押し出し防止:** clone 直後に `git remote remove origin` を実行済み。
`git remote -v` の出力は空 = **push 先が構造的に存在しない**。

## 2. probe 環境の構成

```
~/github_project/digicode-compile-api  (donor, READ ONLY)
        │ git clone (ローカルパスから)
        ▼
scratchpad/probe/api-clone   branch = probe/text-compile-path   origin = (なし)
        │ bind mount  src/ → /opt/digicode-compile/api/src
        ▼
コンテナ dt-probe-api   image digicollc/digicode-compile-server:latest
        PORT=3999 (127.0.0.1 のみ)   /probe = scratchpad/probe/work
```

image に既に入っていたもの (`docker run --rm` で実測):

| 要素 | 実測値 |
|---|---|
| PlatformIO Core | 6.1.19 |
| platform | `espressif32` (pioarduino fork、tag `54.03.21`) — **1 つのみ** |
| packages | `framework-arduinoespressif32` / `-libs` / `tool-esptoolpy` / `tool-scons` / `toolchain-riscv32-esp` / `toolchain-xtensa-esp-elf` / `tl-install` |
| baked build cache | `/root/.platformio/build-cache` = **493 MB** |
| vendored libs | 8 本 (`Adafruit_NeoPixel` `DigiBiped` `DigiMorpher` `DigiMotion` `DigiRover` `ESP32Servo` `NimBLE-Arduino` `NimBLEOta`) |
| templates | 4 本 (`BasicArduino` `DigiCodeOTA` `DigiCodeUSB` `DigiCodeBLE`) |
| `COMPILE_TIMEOUT_MS` | 900,000 (image に焼込) |

## 3. 環境 deviation — 隠さず記録する

### D-1: `gin66/FastAccelStepper@^0.32` を `^0.34` に読み替えた (isolated clone のみ)

**発見の経緯:** 最初の Classic compile が **91 秒で失敗**した。
`UnknownPackageError: Could not find the package with 'gin66/FastAccelStepper @ ^0.32' requirements`

**切り分け (環境要因ではないことの確認):**

- コンテナから registry へ到達可能 — `api.registry.platformio.org` HTTP **200**、`github.com` HTTP **200**
- 当該パッケージ自体は存在する (id 7445)
- しかし registry が持つ 20 バージョンは `1.2.7 … 1.0.0, 0.34.0, 0.33.14 … 0.33.6, 0.31.8, 0.30.15, 0.28.4, 0.23.5` — **`0.32.x` が 1 つも無い**

**全件確認:** Classic の `lib_deps` 57 エントリ (registry 47 / 非 registry 10) を PIO 自身の
`PackageSpec` + `semantic_version` で突き合わせた結果 → **解決不能は 47 件中 1 件のみ**。

→ この 1 点だけを isolated clone 上で `^0.34` に変更し、**BEFORE / AFTER の両方に同一適用**した。
比較の対象は「D-1 適用済み Classic の前」と「D-1 適用済み Classic の後」であり、回帰判定は成立する。

**これは donor 側の finding であって本 probe が直すものではない** (裁定 §3・§18) → `05_…md` F-A。

### D-2: fixture の初版が `LED_BUILTIN` を使い、esp32dev で未定義だった

probe A の初回実行が `'LED_BUILTIN' was not declared in this scope` で失敗。**probe 対象の欠陥ではなく
fixture 側の誤り**。ピン番号リテラルへ修正して再実行した。初回の失敗自体は「診断が file:line:column
付きで返る」ことの最初の実証にもなっている。

## 4. 実行したコマンド (再現手順)

```bash
# 1. isolated clone (push 先を持たない)
git clone ~/github_project/digicode-compile-api api-clone
cd api-clone && git remote remove origin && git checkout -b probe/text-compile-path

# 2. 使い捨てコンテナ (production の 3001 ではなく 127.0.0.1:3999)
docker run -d --name dt-probe-api -p 127.0.0.1:3999:3999 -e PORT=3999 \
  -v "$PROBE/api-clone/src:/opt/digicode-compile/api/src" \
  -v "$PROBE/work:/probe" \
  digicollc/digicode-compile-server:latest sleep infinity
docker exec -d dt-probe-api bash -lc 'cd /opt/digicode-compile/api && PORT=3999 npm start'

# 3. Classic 基準線 (cache を通さない実 compile)
curl -X POST 'http://127.0.0.1:3999/api/compile?no-cache=true&fullPackage=true' \
     -H 'Content-Type: application/json' --data-binary @classic-request.json

# 4. Text 経路 (追加した endpoint)
python3 run-text.py {A|A2|B2|B3|C|ERR|TEXTLIB|TEXTBOARD|TRAVERSAL} --full --no-cache

# 5. 並行実行
python3 run-concurrent.py {mixed|text-parallel|text-same-workspace}

# 6. 回帰判定 (バイト比較 + 依存漏洩スキャン)
python3 compare.py

# 7. Worker を isolated 実行 (上流 fetch は stub)
docker exec dt-probe-api npx tsx /probe/worker-run/harness.ts
```

`npx tsc --noEmit` は probe コードを含めて **RC=0**。

## 5. 後片付け

コンテナ `dt-probe-api` と scratchpad は本 objective の evidence であり、報告後に Human が
不要と判断した時点で破棄してよい。**donor repo と production には残置物が無い**
(donor の dirty=0 が上記のとおり実測済み)。
