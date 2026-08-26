# 01_probe 環境と実行コマンド — 再現手順

**実施:** 2026-08-26 (Session 003) / **PRIMARY_OBJECTIVE:** Editor / LSP Technical Spike
**この文書の役割:** 以降の全ファイルが引く数値が「どこで、どのバージョンで、どのコマンドで」出たかを一箇所に固定する。
数値を引用する側は再掲せず、ここを指す。

---

## 1. 隔離の担保 (裁定 §8)

| 対象 | 状態 | 実測 |
|---|---|---|
| `DigiCode` (donor) | **READ ONLY・未変更** | spike 開始時・終了時とも `bb35c3b8025610299bf952c2c45eda2196a07401` / dirty 0 |
| `digicode-compile-api` (donor) | **READ ONLY・未変更** | spike 開始時・終了時とも `3376746f1e5a4ca039e0cade279741f16612fccf` / dirty 0 |
| donor の `prompt/` | **一度も開いていない** | — |
| production (Cloud Compiler / Cloudflare / DNS / deploy) | **一切接続していない** | 本 spike の外部通信は OSS の公開ページ取得と `clangd.guyutongxue.site` デモの取得のみ |
| digicode-text repo | **production 依存を作っていない** | probe 一式は repo 外 scratchpad。repo に入るのはこの evidence 群と plan のみ |
| probe が立てた service | `127.0.0.1` bind のみ (`:8096` 静的 / `:8097` LSP bridge / `:8098` `:8099` isolation 実験) | 全て使い捨て |

**probe 置き場:** セッション scratchpad (`.../scratchpad/{fixtures,probe,editor,coi,tools,oss}/`)。repo 外。

## 2. 実測環境

| 要素 | バージョン (実測) |
|---|---|
| OS / arch | Darwin 24.6.0 / `x86_64` |
| Node.js | v20.20.2 |
| **clangd (native)** | **Apple clangd 17.0.0 (clang-1700.6.4.2) mac+xpc** — `/usr/bin/clangd` |
| clang registered targets | **`aarch64` / `arm` / `x86` のみ。Xtensa・RISC-V・AVR は無い** (`clang --print-targets`) |
| arduino-cli | 1.3.1 (Homebrew, 2025-08-27) |
| arduino-cli cores | `arduino:avr 1.8.7` / `arduino:mbed_nano 4.5.0` / **`esp32:esp32 3.3.8`** / `esp8266:esp8266 3.1.2` / `rp2040:rp2040 5.4.3` |
| PlatformIO Core | 6.1.19 (platform: `espressif8266 4.2.1`, `native`) |
| **arduino-language-server** | **0.7.7** (2025-03-19 リリース、macOS_64bit、展開後 **20,837,120 B**) |
| ブラウザ | **Google Chrome for Testing 148.0.7778.96** (Playwright chromium-1223 同梱、`playwright-core 1.62.1` で駆動) |
| バンドラ | esbuild 0.28.2 |

> **⚠️ この環境の制約は結論に効く。** Apple clang には Xtensa target が無い (上表)。したがって
> ESP8266 / ESP32 (classic / S 系) 向けの **診断精度の上限はこの環境では測れない**。
> 上限を測るには Espressif の clang fork (`espressif/llvm-project`, `clangd-esp-21.1.3_20260408-x86_64-apple-darwin` = **12,662,520 B**) が要る。
> 本 spike ではその fork を**導入していない** → 該当項目は `NOT OBTAINED` として明示する。

## 3. fixture (裁定 §9 / §10 / §11)

裁定 §9 が指定した構成を、**同一プログラムの 3 形態**として用意した。中身が同じでなければ比較にならない。

| fixture | 構成 | 用途 |
|---|---|---|
| `fixtures/cpp/` | `src/{main,sensor,network}.cpp` + `include/{sensor,network}.h` + `platformio.ini` | **§11 `main.cpp` probe** (PlatformIO / ESP8266) |
| `fixtures/cpp32/` | 同上 + ESP32 実フラグの `compile_commands.json` | **§11 `main.cpp` probe** (ESP32 ツールチェーン) |
| `fixtures/ino/SensorNode/` | `SensorNode.ino` + `{sensor,network}.h` + `{sensor,network}.cpp` | **§10 `.ino` probe** |

`.ino` には **意図的に** ①`#include <Arduino.h>` を書かない ②`setup()` の中から
**後方で定義される `reportBoot()`** を呼ぶ、の 2 点を入れてある。②は Arduino の暗黙プロトタイプ生成が
無ければ C++ として通らない。**この 2 点が `.ino` の本質**であり、これを含まない fixture では
`.ino` と `main.cpp` の差は測れない。

**対照実験 (この fixture が本当に `.ino` 固有か):**

```
clang++ -fsyntax-only -x c++ SensorNode.ino -I.
→ fatal error: 'Arduino.h' file not found
```

素の C++ コンパイラは通らない = fixture は正しく `.ino` 依存になっている。

## 4. 主要コマンド

```bash
# compile database (main.cpp / PlatformIO / ESP8266)
pio run -t compiledb                      # → compile_commands.json, 86 entries, 0.84 s

# compile database + 前処理済みスケッチ (.ino / arduino-cli / ESP32)
arduino-cli compile -b esp32:esp32:esp32 --only-compilation-database \
  --build-path <build> .                  # → compile_commands.json 61 entries + sketch/SensorNode.ino.cpp

# native clangd を LSP で直接叩く (probe/probe_cpp.js — 自作の最小 LSP stdio クライアント)
node probe_cpp.js <root> /usr/bin/clangd --query-driver=<toolchain-bin>/*

# arduino-language-server
node probe_als3.js <sketch-root> <als-binary> esp32:esp32:esp32

# ブラウザ実測 (Monaco / CodeMirror + 実 clangd を WebSocket 経由)
node bridge.js        # ws://127.0.0.1:8097  <-> clangd stdio
node serve.js         # http://127.0.0.1:8096/{monaco,cm}
node browser_editor.js {monaco|cm}

# cross-origin isolation / 広告両立の実測
node coi/server.js ; node coi/server2.js ; node probe/coi_probe.js ; node probe/sab_probe.js
```

## 5. 検証の型 (rule 04) — この spike で何が何級か

| 型 | 対象 |
|---|---|
| **real-fire** | clangd / arduino-language-server の実起動と実応答 · Monaco / CodeMirror の実ブラウザ起動 · multi-file navigation · compile diagnostics → file/line jump · AI multi-file 編集 · COOP/COEP/DIP と SharedArrayBuffer · bundle size · clangd の RSS |
| **primary source** | 各 OSS の license 本文・GitHub API の license 判定・npm registry のバージョンと license · Google 公式の GPT × COEP 記述 · chromestatus の DIP 対応状況 · `clangd.guyutongxue.site` の実 HTTP ヘッダと実転送バイト数 |
| **secondary source** | 記事・第三者解説 — 本 spike の結論には使っていない |
| **NOT OBTAINED** | Espressif clang fork での診断精度上限 · 実機書き込み · 負荷試験 · 同時接続時の実スケーリング · Windows / Linux 実機での再現 · Safari / Firefox 実測 |

## 6. 自分の probe に見つけた欠陥 (先に出す)

測定器の欠陥を結論に混ぜないため、**自分で見つけて直したもの**をここに記録する (rule 04 / PT-4 系)。

| # | 欠陥 | 影響 | 対処 |
|---|---|---|---|
| P-1 | `sab_probe` の Worker ソースを持つ `<script>` タグが、それを読む inline script より**後ろ**にあった | Worker + `Atomics.wait` の検証が `TypeError` で**測れていなかった**のに、他項目は緑に見えた | タグ順を直して再実測。`04` の値は修正後のもの |
| P-2 | CodeMirror 側の AI 編集レンジ計算が Monaco 側と**意味が違った** (Monaco = 0 幅挿入 / CM = 行置換) | CM の編集結果が壊れて見え、**CodeMirror の欠陥に読めた** | 1-based column を両者で揃えて再実測。結果は Monaco と一致 |
| P-3 | arduino-language-server の probe を**前の probe の ALS プロセスが生きたまま**起動していた | `documentSymbol` などが TIMEOUT し、**ALS の欠陥に見えた**。単独実行では正常に応答した | 全 ALS プロセスを落としてから再実測。`03` の ALS 数値は clean 状態のもの |
| P-4 | `fixtures/cpp32` の go-to-definition が `fixtures/ino/` 側の同名ヘッダを指した | clangd の background index が scratch 内の同名ファイルを拾った **probe 環境の副作用** | 結論には使わない。`references` は正しく `cpp32` 内 3 箇所を返しており、そちらを採る |
| P-5 | ALS へ `didChange` を送ったあと、**補完位置を編集前のテキストから計算していた** | `-32602` が返り、「`.ino` は編集するたびに補完が壊れる」という**存在しない欠陥**に読めた | 実際の編集シナリオ (新しい行を打ち込んで、打った位置で補完) で再測定。**正常に動いた** (`05` §3-2) |

**P-3 と P-5 は特に重要**: 一度目の測定は「ALS は references も documentSymbol も返さない」と読めた。
**単独実行で `documentSymbol` は正常に返った** (`["lastPublishMs","setup","loop","reportBoot"]`)。
P-5 も同じ形で、切り分けなければ「編集のたびに補完が壊れる」と書いていた。
**どちらも測定器の欠陥であって、対象の欠陥ではなかった。**
潰さずに出していれば、OSS の評価を 2 段階不当に下げ、それが Human の Architecture 判断に入っていた。
