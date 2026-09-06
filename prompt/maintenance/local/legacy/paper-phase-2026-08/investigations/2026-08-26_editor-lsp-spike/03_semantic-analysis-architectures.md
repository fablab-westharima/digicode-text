# 03_C/C++ semantic analysis — 3 系統の実測比較

**Acceptance 1 / 2 / 3 / 8 に対応。検証の型は各節に明記する。**
数値の出所・環境・fixture は `01` が持つ。ここでは再掲しない。

---

## 1. 系統 A: Browser-side semantic analysis (clangd WASM)

**検証の型: primary source (ソース実読 + 実配信計測) + real-fire (隔離要件の実測)。
`clangd-in-browser` を repo に取り込んでビルドはしていない。**

| 確認項目 (裁定 §7-A) | 実測 |
|---|---|
| clangd 相当をブラウザ内で動かせるか | **動く。** 実運用デモが存在する (`clangd.guyutongxue.site`)。ビルド手順も公開されている |
| **download size** | 🔴 **`clangd.wasm` = 実配信 25,728,226 B (24.5 MiB, gzip) / 非圧縮 126,550,863 B (120.7 MiB)**。JS/CSS を含むクロール合計は非圧縮 141.1 MiB |
| **startup** | 本機からの `clangd.wasm` 取得だけで **2.94 s** (gzip)。WASM のインスタンス化・起動時間は **NOT OBTAINED** |
| **memory** | ビルドフラグが `INITIAL_MEMORY=2GB` / `MAXIMUM_MEMORY=4GB` を指定 (実読)。**実測値は NOT OBTAINED** |
| **SharedArrayBuffer 要否** | 🔴 **必須。** ビルドが `-pthread` + `PTHREAD_POOL_SIZE=max(hardwareConcurrency,8)`。README も "clangd is a multi-thread program, so we need `SharedArrayBuffer`" と明記 |
| **COOP / COEP 要否** | 🔴 **cross-origin isolation が必須。** デモの実レスポンスが `COEP: require-corp` + `COOP: same-origin`。**代替として DIP が使える** (`04`) |
| **multi-file** | デモは**単一ファイル** (`FILE_PATH = "/home/web_user/main.cpp"`)。ただし実体は Emscripten FS + `.clangd` なので**構造的障害は無い**。「未実装」であって「不可」ではない |
| **`compile_commands.json`** | 使っていない。代わりに `.clangd` に `CompileFlags.Add` を書き込む方式 (実読) |
| diagnostics / definition / references / completion | clangd 本体の機能なので**原理的には全部ある**。デモ UI では diagnostics と completion を確認できる。**multi-file での definition/references は NOT OBTAINED** |
| IndexedDB / OPFS 連携 | デモには無い。**設計しだい** (`07` §2) |

### 🔴 A の最大の障害は size でも隔離でもなく sysroot

`src/main.worker.ts` の実読で、この WASM clangd が使うフラグは:

```
--target=wasm32-wasi
-isystem/usr/include/c++/v1
-isystem/usr/include/wasm32-wasi/c++/v1
-isystem/usr/include
-isystem/usr/include/wasm32-wasi
```

で、`build.sh` は `--embed-file <wasi-sysroot>/include@/usr/include` で **WASI の sysroot を wasm に焼き込んでいる**。

**つまりこの clangd が知っている世界は wasm32-wasi + libc++ であり、`Arduino.h` も ESP32 core も
そこには存在しない。** DigiCode Text で使うには **Arduino core / board 別ヘッダ群をブラウザ側 FS に載せる**
必要がある。その帰結:

- ダウンロード量が **24.5 MiB (wasm) + board ごとのヘッダ群**になる。
  参考: ESP32 core 3.3.8 のヘッダ群は本機で実在しており、**board / SoC 変種ごとに別ライブラリ集**を持つ
  (`esp32-libs` `esp32c3-libs` `esp32c6-libs` `esp32s2-libs` `esp32s3-libs` `esp32p4-libs` … 実測 12 種)。
- **board を切り替えるたびにヘッダ集合が変わる。**
- **ユーザがライブラリを追加するたびに、そのヘッダをブラウザ側へ届ける仕組みが要る。**

これは S001 の調査に無かった論点で、**A の実装コストを支配する。**

### A の保守リスク

`clangd-in-browser` は `private: true` / `version: 0.0.0` の**実験デモ**。★75、単独メンテナ、
最終 push 2025-12-31。依存が `@codingame/monaco-vscode-* ~8.0.4` 固定で**現行 36.2.1 から 28 メジャー遅れ**。
**採用するなら fork して自前保守する前提**になる。しかも上記 sysroot 対応のために
**LLVM の 2 段階クロスビルドを自分で回し続ける**ことになる (emsdk + WASI SDK + LLVM のバージョン整合)。

---

## 2. 系統 B: Server-side LSP

**検証の型: real-fire。実際に clangd / arduino-language-server を起動し、実応答を測った。**

### 2-1. native clangd + PlatformIO (`main.cpp` 経路)

`fixtures/cpp/` (ESP8266 / PlatformIO)、`pio run -t compiledb` が生成した **86 entries** の
`compile_commands.json` をそのまま与えた。

| | 素のまま | **`.clangd` で GCC 専用フラグを除去 + `--query-driver`** |
|---|---|---|
| `initialize` | 51.1 ms | 34.6 ms |
| **first diagnostics** | 1,600 ms | **1,137 ms** |
| **診断の中身** | 🔴 **偽エラー 5 件** — `-mlongcalls` / `-mtext-section-literals` / `-free` / `-fipa-pta` を clang が拒否、さらに `'sys/config.h' file not found` | 🟡 **偽エラー 1 件** — `argument to 'section' attribute is not valid for this target: mach-o section specifier…` |
| go to definition | 2.2 ms | **0.73 ms** |
| find references | 1.3 ms | **0.47 ms** |
| workspace symbol | 0.95 ms | **0.50 ms** |
| completion | 46.7 ms → 100 件 | **10.6 ms** → 100 件 |
| document symbol | 36.0 ms | **8.7 ms** |

### 2-2. native clangd + ESP32 実フラグ (`main.cpp` 経路、board を揃えた比較)

`fixtures/cpp32/`。arduino-cli が ESP32 用に実際に使ったコマンドラインをそのまま流用した
(`xtensa-esp32-elf-g++` + `-DARDUINO_ARCH_ESP32` 等、実測)。

| | 素のまま | **`.clangd` チューニング後** |
|---|---|---|
| first diagnostics | 1,445 ms | 1,521 ms |
| **診断の中身** | 🔴 **偽エラー 7 件** — `-mlongcalls` / `-mdisable-hardware-atomics` / `-mfix-esp32-psram-cache-issue` / `-mfix-esp32-psram-cache-strategy=memw` / `-fstrict-volatile-bitfields` / `-fno-tree-switch-conversion` + `'riscv/rv_utils.h' file not found` | 🟡 **偽エラー 1 件** — `__block attribute not allowed, only allowed on local variables` |
| go to definition | 0.68 ms → `src/sensor.cpp:12` | 0.69 ms |
| **find references** | 127 ms → **3 箇所 / 3 ファイル** (`include/sensor.h:14`, `src/main.cpp:20`, `src/sensor.cpp:12`) | 53 ms → 同じ 3 箇所 |
| workspace symbol | 0.58 ms → `Sensor` / `SensorReading` / `g_sensor` | 0.55 ms |
| completion | 69 ms → **100 件**。`SensorReading` `Sensor` `Network` に加え `ARDUINO_ARCH_ESP32` 等の **board define も候補に出た** | 16 ms → 100 件 |

### 🔴 B の精度上限は「target が合っているか」で決まる

残った偽エラーはどちらも **ホスト (darwin/x86) の target 特性がヘッダに漏れたもの**である。
`clang --print-targets` は本環境で **`aarch64` / `arm` / `x86` しか登録していない** (`01` §2)。
つまり **Xtensa (ESP8266 / ESP32 / ESP32-S) は upstream の Apple clang では target を合わせられない。**

| SoC | アーキ | 本環境の clang で target 一致するか |
|---|---|---|
| ESP8266 / ESP32 / ESP32-S2 / ESP32-S3 | Xtensa | ❌ **不可** |
| ESP32-C3 / C6 / H2 / P4 | RISC-V | ❌ (Apple clang は RISC-V を登録していない。upstream LLVM には存在する) |
| RP2040 / RP2350 | ARM Cortex-M | 🟢 **可能** (`arm` / `thumb` 登録あり) |
| Arduino UNO 等 | AVR | ❌ (Apple clang は AVR を登録していない。upstream LLVM には存在する) |

**解決手段は実在する**: Espressif が **Xtensa target を持つ clangd** を配布している
(`espressif/llvm-project` `esp-21.1.3_20260408`, macOS x86_64 の `clangd` = 12,662,520 B)。
**本 spike ではこれを導入していないので、「偽エラー 0 に到達するか」は `NOT OBTAINED`。**
ただし「残り 1 件が target 由来である」ことは**測れている**ので、方向は特定できている。

### 2-3. 🔴 サーバ側リソース (process per user の単価)

`fixtures/cpp` (5 ファイル / 100 行) を開いた clangd 1 プロセス:

| | 実測 |
|---|---|
| **RSS** | **267,140 KB ≈ 261 MiB** (t+2s から t+30s まで一定) |
| clangd 自身の `$/memoryUsage` 合計 | 28,548,020 B ≈ 27 MiB |
| CPU (アイドル時) | **0.0 %** |
| index cache (ディスク) | **20 KB / 5 ファイル** |

**= 1 ユーザ 1 プロセスなら 100 行のプロジェクトでも ≈261 MiB。**
10 同時接続で ≈2.6 GB。これは「auth なし・無料」モデルの単価に直結する。
アイドル時 CPU が 0% なのは救いで、**メモリが律速**であることを意味する。

> S002 が測った **Text workspace ≈23 MB / workspace** と合わせて読むこと。
> **cleanup policy と rate limit は Editor 方式の付随物ではなく、B を選んだ時点で必須要素になる。**

### 2-4. arduino-language-server (`.ino` 経路)

**→ `05` が全面的に扱う。** B の一部だが、`.ino` 判断そのものなので分離した。

---

## 3. 系統 C: Hybrid / reduced semantic model

**検証の型: 本 spike で得た A / B の実測からの構成的推論。C そのものは実装していない。**

裁定 §7-C の「A/B の二択に限定しない」に応えて、実測から成立する形を 3 つ挙げる。
**どれも採用提案ではなく、Human が比較できるようにするための選択肢である。**

### C-1. 構文はブラウザ / semantic はサーバ / 診断は Compiler

| 層 | 担当 | 根拠となる実測 |
|---|---|---|
| syntax highlighting · 括弧 · 折りたたみ · 単語補完 | ブラウザ (`@codemirror/lang-cpp` または Monaco 内蔵) | CodeMirror 全部込みで **145 KiB (brotli)** (`02` §1) |
| go to definition / references / symbol / cross-file completion | **サーバ clangd** | 定義 0.7 ms / 参照 0.5〜127 ms (§2) — **応答は十分速い。重いのは常駐コスト** |
| エラー診断 | **既存 Compiler** (S002 実測済み、変更不要) | `06` §4 で file/line jump を実測 |

🟢 **サーバが落ちていても編集は続く。** semantic 機能だけが degrade する。
🟢 **ブラウザ側は 145 KiB のまま**で、cross-origin isolation が不要 = **広告に一切の制約なし**。
🔴 semantic を使う瞬間だけサーバが要る = **「いつ起動して、いつ落とすか」が設計問題になる。**

### C-2. semantic をオンデマンド起動にする (C-1 の運用形)

§2-3 の実測が示すのは「**アイドル時 CPU 0%、メモリ 261 MiB**」。
つまり **同時に「解析中」のユーザ数ではなく、同時に「セッションを持っている」ユーザ数がコストを決める。**
→ 「go to definition を押した時に起動し、N 分無操作で落とす」構成が数字の上で合理的になる。
**起動コストは native clangd で `initialize` 35 ms + 初回診断 1.1〜1.5 s** (§2-1/2-2) なので、
**オンデマンド起動のレイテンシは許容範囲に見える。ただし index を毎回作り直す場合のコストは NOT OBTAINED。**

### C-3. ブラウザ WASM + サーバ fallback

A をブラウザで動かし、動かない環境 (Safari / Firefox / 低スペック端末) ではサーバへ落とす。
🔴 **両方を作って両方を保守することになる。** A の sysroot 問題 (§1) が消えないので、
本 spike の実測からは**最もコストが高い**構成に見える。

---

## 4. 3 系統の比較表 (裁定 §20)

**◎ / ○ / △ / × は本 spike の実測に基づく相対評価であって、採用の推奨ではない。**

| 軸 | **A. browser WASM** | **B. server LSP** | **C. hybrid (C-1/C-2)** |
|---|---|---|---|
| UX (semantic の質) | ◎ 原理的に clangd 相当 | ◎ **実測で clangd 相当を確認** | ◎ semantic はサーバ = B と同じ |
| semantic 精度 | sysroot を自前で用意する前提。**実測なし** | **実測: 定義/参照/シンボル/補完すべて正常。偽エラーは target 起因で残 1 件** | B と同じ |
| **初期 download** | × **24.5 MiB (wasm) + Arduino ヘッダ群** | ◎ **145 KiB〜900 KiB (エディタのみ)** | ◎ 同左 |
| startup | △ wasm 取得 2.94 s + 起動 (未計測) | ◎ `initialize` 25〜35 ms / 初回診断 1.1〜1.5 s | ◎ 同左 |
| **runtime cost (サーバ)** | ◎ **ゼロ** | × **≈261 MiB / セッション** | ○ オンデマンドなら実効値は下がる (未計測) |
| Cloud cost | ◎ 配信のみ | × メモリ律速。匿名無料と相性が悪い | ○ |
| Local Docker | ○ 静的配信のみで完結 | ◎ **最も自然** (S002 の Docker 知見がそのまま効く) | ◎ |
| 学校 / 社内 LAN 共有 | ◎ 各端末で完結 | ◎ 1 台のサーバを共有できる | ◎ |
| browser 互換 | × **cross-origin isolation 必須 → Chromium 前提** (`04`) | ◎ **制約なし** | ◎ **制約なし** |
| storage 結合 | OPFS が自然。オフライン可 | サーバ workspace 必須 + cleanup | ブラウザ正本 + 一時同期 |
| **広告結合** | × **COEP と GPT は非互換 (Google 公式)。DIP なら回避可 (実測)** | ◎ **無関係** | ◎ **無関係** |
| AI 統合 | ○ (Editor API 側は方式非依存、`06` §5) | ○ 同左 | ○ 同左 |
| **保守** | × **LLVM クロスビルド + sysroot 配布を自前で回し続ける** | ○ clangd はバイナリを配るだけ | ○ |
| security / privacy | ◎ **コードがサーバへ出ない** | △ ユーザのコードがサーバに実体化する | ○ semantic 要求時のみ送る |
| offline / local 動作 | ◎ | × | △ 編集は可、semantic は不可 |
| 実装複雑度 | × sysroot 配布機構が丸ごと追加 | ○ **本 spike で実際に一通り動いた** | ○ B + degrade 制御 |

---

## 5. この節が Human に渡す事実 (判断はしない)

1. **B は本 spike で実際に全機能が動いた。** multi-file の定義・参照・シンボル・補完が、
   Monaco / CodeMirror の両方から、ミリ秒台で返った。
2. **A は「動く」ことは公開デモで確認できるが、DigiCode Text の用途 (Arduino / ESP32) では
   sysroot をどう配るかという未解決の設計問題が丸ごと残る。** これは size や隔離より重い。
3. **B の弱点は精度でも速度でもなく、セッションあたり ≈261 MiB という常駐コストである。**
4. **C は A の欠点 (size / 隔離 / sysroot / 保守) を全部避けたうえで、B の長所を残す。**
   ただし本 spike は C を実装していないので、C の評価は A/B の実測からの構成的推論である。
