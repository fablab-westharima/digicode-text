# 04_Compiler Shared / Separate probe の再検証

**checker:** Codex `gpt-5.6-sol` · packet `DT6-D2-compiler-probe-verification` · `LANE: VERIFICATION`
**verdict:** 🔴 **`ERROR / INVALID_MEASUREMENT`** — 最終セットにも、主張した次元を測れていない箇所が残る
**監査基準:** rule 04 §absence / §detection power / §instrument dimension / §gauge unit

**書込は `/tmp/dt6-d2-compiler.9ptTIy` のみ。** repo 3 件はすべて最終 `git status --porcelain` 0 行、
残存 `dt6-d2` container 0 件。**production 接触 0。**

---

## 1. 検証表(V1–V10, F-I〜F-M)

| id | claim | 元 evidence | 再検査方法 | 結果 | 誤差方向 / 影響 |
|---|---|---|---|---|---|
| V1 | template 注入なしで full user-source を compile できる | real-fire | `06:54,146,191,491,575` 全読 `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | runner 欠落により外側が HTTP 200 だけ見た可能性は sharing を良く見せる。API 内部は RC を正しく扱う |
| V2 | multi-file compile / link 成立 | real-fire | `06:146-223` 全 file 書込 + `02:53-59` の別 translation unit 必須 fixture `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | fixture 1 構成を一般互換性と読むと sharing を良く見せる |
| V3 | Classic 4 artifact 不変(**absence**) | real-fire + synthetic control | `03:9` + control 監査。**raw artifact / comparator source は不存在** `[static]` | `NOT_INDEPENDENTLY_CHECKED` | firmware は mutation control あり。**bootloader / partitions / bootApp0 には個別 control なし** → sharing を良く見せる |
| V4a | workspace / result / build cache isolation | real-fire + static | `03:55-103`, `06:319-352,403-445,548-564` `[static]` | `NOT_INDEPENDENTLY_CHECKED` | **known-bad workspace/cache を計器に与えた対照なし**。汚染を見逃せば sharing を良く見せる |
| V4b | Text dependency が Classic へ漏れない | real-fire + synthetic control | marker が Text-only firmware で PRESENT、Classic 2 点で absent、計 9 firmware scan + 別 `buildTextLibDeps()` `[static]` | `EVIDENCE_REVIEWED_OK` | **V4 中で最も強い absence evidence。positive control あり**。Classic 2 artifact への標本限定はやや良く見せ得る |
| V4c | Text-only board が Classic に露出しない | real-fire + static | 独立 `TEXT_BOARDS` と Classic `FQBN_TO_PIO` 非 import を source 確認 `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | Classic endpoint が Text FQBN を拒否する live control はない |
| V4d | lock namespace 分離 / 同 workspace 直列化 | real-fire + static | 別 key overlap と同 key 直列化の両 arm + `withLock()` 実装 `[static]` | `EVIDENCE_REVIEWED_OK` | **単一 process のみ**。複数 process へ一般化すると sharing を良く見せる |
| V5 | file/line/column/severity/message 診断 | real-fire + static | `02:71-91` + parser `06:468-489` `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | 1 GCC syntax fixture・2 診断。「診断 semantics 全般」と読むと良く見せる |
| V6 | 4 artifact 生成 | real-fire | 同 image で firmware/bootloader/partitions を生成。**boot-side 3 点の size/hash を独立一致** `[command+RC=0]` | `INDEPENDENTLY_REPRODUCED` | 実機 flash を含むと良く見せるが、原文は未verify と明記済み |
| V7 | 未使用でも全 `lib_deps` が解決対象 | real-fire + static | **known-bad RC=1 / control RC=0** `[command+RC]` + donor `buildLibDeps()` 57 件 | `INDEPENDENTLY_REPRODUCED` | 🔴 **中核根拠。独立再現。** 原記録の「file:// 9」は実際は **file 8 + git URL 1 + symlink 1** |
| V8 | `gin66/FastAccelStepper@^0.32` が解決不能 | real-fire | `^0.32` / `^0.34` 両 arm で `pio pkg install` `[command+RC]` | `NOT_OBTAINED` | **network 失敗のため方向判定不能** |
| V9 | shared build cache の利得は小さい →「不利」反論を **refute** | real-fire benchmark | 同 image 内で**順序を両方向に反転して 12 build** `[command+RC=0]` | `PARTIALLY_CONTRADICTED` | 🔴 元記録の 0.5 秒限定は**再現せず**。1 fixture・shared→dedicated 固定順・shared toolchain 維持が sharing を悪く見せる |
| V10a | 追加は server +3 行 / 新規 593 行 / image **+0 MB [測]** | static + synthetic | 保存コード 32+39+120+402=593 行・20,000 bytes。**image 未 build / mount 実行を確認** `[static]` | `PARTIALLY_CONTRADICTED` | **`+0 MB [測]` は無効測定** → sharing を良く見せる |
| V10b | workspace 約 23 MB / 12 個 251 MB | real-fire disk gauge | 原記録・fixture denominator を監査。独立再測定なし | `NOT_INDEPENDENTLY_CHECKED` | fixture は **297–971 B**。実 project コストを過小評価し B1 を良く見せる |
| F-I | Worker は path 透過 / CORS origin 1 箇所 | synthetic isolated + static | donor `index.ts:25-35,63-82` 独立全読 `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | 「137 行だから新設容易」は**行数を complexity の proxy** にし separation を良く見せる |
| F-J | `.ino` preprocessing 成立 | real-fire | fixture 記述と因果を監査。独立 compile は未実施 | `EVIDENCE_REVIEWED_OK` | 1 fixture 限定 |
| F-K | Text 300 KB 台 / Classic 1.35 MB | real-fire | 独立 fixture は **290,128 bytes**。原 source が異なるため原数値は独立確認不能 | `NOT_INDEPENDENTLY_CHECKED` | 小 fixture により Text 側余裕を大きく見せる |
| F-L | Classic は SSE + 15 秒 heartbeat / Text probe は sync POST のみ | static + real-fire timing | donor `server.ts:109-160` + `06:54-65` `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | Text 実 build 分布未測定は原文も明記 |
| F-M | frontend 16 boards / 10 FQBN / experimental true 0 | static | donor `boardStore.ts` の 16 `fqbn`、distinct 10、`experimental:true` 0 を**全件**確認 `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | error なし |

---

## 2. 隔離再現コマンドと観測

cwd `/tmp/dt6-d2-compiler.9ptTIy`

### V7 — known-bad arm と control arm

```bash
PLATFORMIO_SETTING_ENABLE_TELEMETRY=no pio run
```

| arm | RC | 観測 |
|---|---|---|
| 未使用 source + 存在しない `file://` 依存 | **1** | compile 前に `FileNotFoundError` |
| 同 project から `lib_deps` を除去(control) | **0** | `SUCCESS Took 1.52 seconds` |

🔴 **これが Compiler 分離裁定の中核根拠であり、独立再現された。**

### V8 — registry 解決(両 arm)

```bash
PLATFORMIO_CORE_DIR=…/registry-core         pio pkg install --global --library 'gin66/FastAccelStepper@^0.32'
PLATFORMIO_CORE_DIR=…/registry-control-core pio pkg install --global --library 'gin66/FastAccelStepper@^0.34'
```

両方 **RC=1、`HTTPClientError`**。→ **version 不在と通信不能を分離できず `NOT_OBTAINED`。**
donor source に pin があることのみ `[static]` で確認(`compile.ts:185`)。**反証も得ていない。**

### V9 — cache benchmark、順序反転込み 12 build

```bash
docker run --rm -v /tmp/dt6-d2-compiler.9ptTIy:/probe \
  digicollc/digicode-compile-server:latest bash -lc \
  'set -e; for spec in shared-a:… shared-b:… shared-c:… dedicated-a:… dedicated-b:… dedicated-c:…; do
     DT_CASE=${spec%%:*}; DT_CACHE=${spec#*:}; cd /probe/$DT_CASE; DT_CACHE_DIR=$DT_CACHE pio run; done'
# 同コマンドを dedicated-r1..r3 → shared-r1..r3 の順でも実行
```

| 順序 | shared | dedicated |
|---|---|---|
| shared-first | 12.85 / 7.36 / 7.01 s | 13.62 / 6.95 / 7.02 s |
| **dedicated-first(反転)** | **13.69 / 7.30 / 7.09 s** | **15.08 / 8.10 / 8.26 s** |

両 batch とも RC=0。**12/12 build で実際の `pio run` 成功行と各時間を取得。**

→ **独立測定では shared 優位が −0.01〜1.39 秒。反転 arm では warm 後にも 0.80–1.39 秒 残った。**
元記録の「初回約 0.5 秒だけ」は再現しない。

### 独立確認できたコスト数値

| 数値 | 原記録 | 独立測定 | 判定 |
|---|---|---|---|
| image size | 3.42 GB | `docker image inspect` → **3,421,778,810 bytes** | 一致 |
| baked cache | 493 MB | fresh image の `du -sm` → **493 MiB** | 一致 |
| dedicated cache | 24 MB | **23 MiB** | 単位 / rounding 差の範囲 |

観測合計: **17/17 の control outcome を取得**(V7 2 arm + V9 12 build + boot-side artifact hash 3 件)。
V8 のみ 0/1。

---

## 3. positive control が無い absence(rule 04 §absence)

### V3

- firmware SHA 比較には **source mutation control がある**
- 🔴 **bootloader / partitions / bootApp0 の各比較には個別 mutation control がない**
- `compare.py` 自体が保存されていないため、**4 field が本当に同じ比較経路を通ることも確認できない**
- 分母は **1 Classic request configuration × 3 builds × 4 artifact kinds**。Classic 全体ではない
  (10 FQBN × 3 template 相当の 30 環境中 1 環境)

### V4

| 対象 | control |
|---|---|
| dependency marker | **あり** |
| lock(同 key 直列 / 別 key 並行) | **あり(両 arm)** |
| workspace root | **なし** |
| Classic project contents / mtime | **なし** |
| result-cache collision | **なし** |
| shared object-cache contamination | **なし** |
| Board flag の Text 側到達 | あり |
| 「Classic 側へ露出しない」ことの検出 | **なし** |

**付随する absence:**「production contact 0」も network capture / log の positive control が無く、
dirty / SHA は **repository write absence しか測っていない**。

---

## 4. 🔴 実測を判定した runner が保存されていない

`run-text.py` / `run-concurrent.py` / `compare.py` / cache benchmark script / raw logs / artifacts は
いずれも残っておらず、`06_probe-implementation.md` にあるのは **API 実装のみ**。

**API 内部の RC 処理は正しい** `[static]`:

- `06:575` で `execP` を使用し、nonzero RC は catch へ入って `success:false` になる
- `cmd | tail` / `$?` / pipeline は**無い**(case 82 / 110 のパイプ問題は該当しない)
- RC=0 でも `firmware.bin` が無ければ failure

🔴 **しかし外側の route は compile failure も HTTP 200 で返す。**
したがって測定 runner が JSON の `success` を見ず HTTP status だけ見ていれば **silent green** になる。
**その runner は保存されておらず監査不能である。**

---

## 5. 誤差方向の分析(DT-2 型の検査)

**全体では一方向ではない。**

**sharing を悪く見せる方向:**

- cache benchmark が shared→dedicated 固定順
- 1 board・1 dependency・小 fixture だけで cache 価値を一般化
- shared toolchain / package は維持したまま「Option C でも損しない」と読める表現
- Worker 137 行を「新設容易」の proxy にしたこと

**sharing を良く見せる方向:**

- `+0 MB` という未 build image の無効測定
- Classic 1/30 相当の環境から「regression risk 0」へ一般化
- V3 / V4 absence の known-bad control 不足
- 23 MB/workspace を小 fixture から一般化
- HTTP 200 / `success:false` 契約を検査する runner が保存されていないこと

🔴 **ただし Human ruling へ直接入った V9 周辺だけを見ると、欠陥・proxy は一貫して
shared cache を悪く見せる方向である。**

---

## 6. cost / architecture 判断へ使われた数値の独立確認状況

| 数値群 | 判断への用途 | 独立確認 |
|---|---|---|
| `57 lib_deps / registry 47 / non-registry 10` | global universe の危険性 | total 57・registry 47 を source 確認。**内訳は file 8 + git 1 + symlink 1 で、原文の file 9 は誤り** |
| `47 中 1 件のみ解決不能`、失敗 91 秒、registry versions 20 件 | fresh Local Compiler 障害 | `NOT_OBTAINED`(network 不通) |
| `.pio/libdeps` 69 directories | global dependency 実体化コスト | `NOT_INDEPENDENTLY_CHECKED` |
| existing +3 lines / 新規 593 lines | B1 実装コスト | **593 行・20,000 source bytes 確認。** 実際の isolated diff は未保存で +3 は evidence review のみ |
| image `+0 MB` | shared image 追加コスト | **`CONTRADICTED`。image 未 build のため無効** |
| image `3.42 GB` | toolchain 二重保有コスト | **独立確認(3,421,778,810 bytes)** |
| baked cache `493 MB` | shared cache 資産 | **独立確認(493 MiB)** |
| shared `9.1/5.3/5.8 s` / dedicated `9.6/5.4/5.3 s` | cache 共有の価値 | 原数値は未確認。**独立 12 build では差 −0.01〜1.39 秒** |
| dedicated cache `24 MB` | separate cache コスト | **独立測定 23 MiB** |
| workspace `23 MB each` / 12 = `251 MB` | cleanup / TTL | `NOT_INDEPENDENTLY_CHECKED`。小 fixture proxy |
| Classic workspace `444 MB` / cache `493→781 MB (+288)` | runtime disk growth | `NOT_INDEPENDENTLY_CHECKED` |
| source `297–971 B` | sampling denominator | 静的確認。**実運用規模ではない** |
| Text compile `4.9–9.2 s` / Classic cold `301 s` | timeout / SSE | `NOT_INDEPENDENTLY_CHECKED` |
| cache MISS `2,666 ms` / HIT `1 ms` | result cache 効果 | `NOT_INDEPENDENTLY_CHECKED` |
| request/response `389 B / 1,846,857 B`、Text `431–1,335 B / 454,984–465,548 B` | Cloud body / response cost | `NOT_INDEPENDENTLY_CHECKED` |
| firmware `301,296–325,088 B` / Classic `1,350,288 B` / slot `1.9 MB` | flash headroom | exact firmware は未確認。**bootloader 23,472 B / partitions 3,072 B / boot_app0 8,192 B と 3 SHA は独立一致** |
| parallel max 2、各 5.4–36.3 秒 | lock / failure isolation | 記録 review のみ。**負荷 / capacity には使えない** |
| Worker 137 lines / CORS 変更 1 箇所 / heartbeat 15 秒 | Worker / SSE 設計 | source 確認。**行数は工数ではない** |
| 16 boards / 10 FQBN / experimental 0 | registry 面積 | **source 全件確認** |

---

## 7. Human ruling への影響

| ruling | original evidence | corrected evidence | impact | 再裁定 |
|---|---|---|---|---|
| 「cache を失うので不利」は measurement で refuted | shared advantage は初回約 0.5 秒、以降同等 | 独立測定では **0.80–1.39 秒の shared advantage が warm 後にも残る arm あり**。標本は双方とも 1 fixture | **「refuted」は強すぎる。**正しくは「この小 fixture では dedicated cache も 1 build 後に近い」 | **No** — 根拠 1 本を狭める訂正。他の global dependency / registry grounds は残る |
| B1 Text 追加は image `+0 MB [測]` | image に手を加えず build 成功 | **image を build しておらず、mount した tree を測定。**保存 source だけで 20,000 bytes | B1 の配布 artifact コストを過小評価。sharing を有利に見せた | **No** — むしろ ruling 方向と**反対側**の誤差 |
| non-registry 内訳は file 9 + symlink 1 | 10 件が local 系に見える | **file 8 + git URL 1 + symlink 1** | external source 依存を 1 件過小表示 | **No** — global dependency risk を**わずかに強める** |

**V8 の registry 不在は今回確認できなかったが、反証も得ていない。**

---

## 8. 読者が測ったと思いやすいが、実際には測っていないもの

- Text code を含む built / shipped Docker image の size・contents
- Classic 全 10 FQBN × 3 template 相当の regression matrix
- production pin `^0.32` のままの fresh Classic 成功
- cache 価値の board / library / platform 横断分布、cold 頻度、実利用 traffic での待ち時間
- 実運用 project size での compile time、workspace size、diagnostic coverage
- **cache 汚染を故意に起こした known-bad control**
- multi-process / multi-container lock
- Text-only FQBN を Classic endpoint へ送った拒否実測
- real Cloudflare edge の body / timeout、**production 非接触を証明する network trace**
- firmware の実機 flash / boot / runtime 動作
- crash / OOM / 無限 loop による同一 process 巻き添え
- Text 専用 image の実 size
- **測定 runner の exit-code 処理**(保存 API コードに pipe 問題は無いが、runner 自体が残っていない)
