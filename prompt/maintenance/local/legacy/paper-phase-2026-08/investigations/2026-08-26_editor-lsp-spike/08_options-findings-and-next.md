# 08_Architecture options · findings · risks · unknowns · Human 判断事項

**この文書は材料を並べる。決定はしない** (裁定 §21 / §24、16.md §3 の 2026-08-26 裁定)。
数値の出所は `01`〜`07`。ここでは再掲せず参照する。

---

## 1. Architecture options — Human が選ぶための 4 案

**推奨順ではない。** 実測がどの案をどう支えるかだけを書く。

### Option 1: Server-side LSP (native clangd) + 軽量エディタ

```
Browser: CodeMirror 6 または Monaco
   ↕ WebSocket (LSP)
DigiCode Text service: clangd + compile_commands.json (PlatformIO 生成)
   ↕
Text 専用 Compiler (S002 の裁定どおり)
```

| | |
|---|---|
| **実測で裏付いていること** | **本 spike で一通り動いた。** 定義 0.69 ms / 参照 3 箇所 53 ms / 補完 100 件 16 ms / 初回診断 1.5 s。Monaco・CodeMirror の両方から同じ結果 |
| **初期 download** | エディタのみ = **145 KiB (CodeMirror, brotli) 〜 900 KiB (Monaco, brotli)** |
| **cross-origin isolation** | **不要** → 広告・外部スクリプト・埋め込みに一切の制約なし |
| **🔴 代償** | **clangd 1 セッション ≈261 MiB RSS。** 匿名・無料・常時接続とは相性が悪い。cleanup / rate limit が設計必須項目になる |
| S002 資産との関係 | **Docker・workspace 管理・build orchestration の donor 知見がそのまま効く** |

### Option 2: Hybrid — 構文はブラウザ / semantic はオンデマンドのサーバ / 診断は Compiler

```
Browser: CodeMirror 6 (syntax / 括弧 / 単語補完) ← 常時
   ↕ 必要時のみ WebSocket (LSP)
オンデマンド clangd (無操作 N 分で停止)
   ↕
Text 専用 Compiler (エラー診断はここから)
```

| | |
|---|---|
| **実測が支える点** | clangd は**アイドル時 CPU 0.0%、メモリ 261 MiB** = **同時接続数ではなく同時セッション保持数がコストを決める**。`initialize` 35 ms / 初回診断 1.1〜1.5 s なのでオンデマンド起動のレイテンシは許容範囲に見える |
| **サーバが落ちても** | 編集は続く。semantic だけ degrade する |
| **cross-origin isolation** | **不要** |
| **🔴 未取得** | index を毎回作り直す場合の実コスト、起動/停止ポリシーの実挙動 = **NOT OBTAINED** |

### Option 3: Browser-side clangd WASM

```
Browser (Document-Isolation-Policy iframe)
 ├─ Monaco (clangd-in-browser は Monaco 前提)
 ├─ Web Worker
 └─ clangd.wasm + Arduino/board ヘッダ群
親ページ (非隔離): 広告・アフィリエイト・donation
```

| | |
|---|---|
| **実測が支える点** | **DIP により「親に広告・iframe だけ隔離」が成立することを Chrome 148 で実測した。** SharedArrayBuffer / Worker / `Atomics.wait` / 共有メモリ書込みまで確認 |
| **サーバコスト** | **ゼロ。** コードがサーバへ出ない = プライバシー主張が最も強い。オフライン可 |
| **🔴 代償 1: download** | `clangd.wasm` **実配信 24.5 MiB (gzip)** + **Arduino / board 別ヘッダ群** |
| **🔴 代償 2: sysroot** | 公開ビルドは **wasm32-wasi sysroot 焼き込み**で、`Arduino.h` も ESP32 core も入っていない。**board ごとのヘッダ配布機構を新規に作ることになる**。ESP32 core だけで **12 種類の SoC 別ライブラリ集**が実在する |
| **🔴 代償 3: browser** | **DIP は Chromium 前提** (Safari は Negative、Firefox は Positive)。製品の browser matrix をここで固定する |
| **🔴 代償 4: 保守** | `clangd-in-browser` は **`private: true` / `version: 0.0.0` の実験デモ**、単独メンテナ、依存が **28 メジャー遅れ**。採用 = **fork して LLVM のクロスビルドを自前で回し続ける** |

### Option 4: `.ino` を第一形式にする場合の追加構成

上記のどの Option でも、**`.ino` を標準にするなら前処理層が別に要る**。

| | |
|---|---|
| 唯一の既存解 | **arduino-language-server (AGPL-3.0) + arduino-cli (GPL-3.0)** |
| **実測で動いた** | `.ino` → `.cpp` 定義ジャンプ 3.0 ms · **暗黙プロトタイプ経由の定義ジャンプ 1.1 ms (`.ino:27` = 本物の定義行)** · documentSymbol 65 ms · **cross-file 補完 (編集直後も正常)** · 診断が全ファイルの実 URI に写像 |
| **🔴 実測で動かなかった** | **find references が未実装** (`referencesProvider: ABSENT`、呼ぶとハング)。go to implementation も未実装 |
| **🔴 実測した脆さ** | クライアントが `hierarchicalDocumentSymbolSupport` を宣言しないと **`panic: not implemented` でプロセスが死ぬ**。1 ユーザ 1 プロセス構成ではセッション全滅 |
| **🔴 コスト** | 初回診断 **18.2〜18.7 s** (内部でスケッチをビルドする)。`main.cpp` 経路の **≈12 倍** |
| 依存 | バイナリ **3 本** (arduino-cli + clangd + ALS)。`main.cpp` 経路は clangd **1 本** |

---

## 2. Findings (severity 付き)

| # | Finding | Sev | 型 |
|---|---|---|---|
| F-1 | **Editor 層は semantic 機能の差を生まない。** Monaco と CodeMirror は同じ clangd に対して同じ定義・参照・補完を返した。差は size・起動・diagnostics owner 分離 | 🟡 | real-fire |
| F-2 | **同一機能での実測サイズ差は brotli で 6.2 倍 (900 KiB vs 145 KiB)、起動で 4.1 倍 (1,087 ms vs 262 ms)。** しかも Monaco 側の値は `editor.worker` を含まない**下限** | 🟡 | real-fire |
| F-3 | **Monaco の diagnostics は owner 名前空間で分離される。** Compiler 診断と LSP 診断が同じファイル上で共存した。CodeMirror の `@codemirror/lint` は単一集合で、束ねる実装が要る | 🟡 | real-fire |
| F-4 | 🔴 **browser-side clangd WASM の公開ビルドは wasm32-wasi sysroot を焼き込んでおり、`Arduino.h` も ESP32 core も存在しない。** size でも隔離でもなく、これが Option 3 の実装コストを支配する | 🔴 | primary source (ソース + ビルドスクリプト実読) |
| F-5 | 🔴 **COOP/COEP では、親が隔離されていない限り iframe は隔離されない。`allow="cross-origin-isolated"` を付けても変わらなかった。** = 「広告は親、エディタは iframe」は COOP/COEP では成立しない | 🔴 | real-fire (negative control 付き) |
| F-6 | 🔴 **`Document-Isolation-Policy` なら成立する。** 非隔離の親 + DIP iframe で、iframe は `crossOriginIsolated: true` / SAB 使用可 / Worker の `Atomics.wait` まで動き、**親の third-party script と image は読み込まれた** | 🔴 | real-fire |
| F-7 | **Google 公式が「GPT は COEP を付けたページを未サポート」と明記している。** 推測ではない | 🔴 | primary source |
| F-8 | 🔴 **素の clangd は `.ino` を認識しない。** `Could not build CompilerInvocation`、**シンボル 0**。`.ino` を採るなら前処理層は必須 | 🔴 | real-fire |
| F-9 | **Arduino プリプロセッサがしているのは 3 つだけ** — `#include <Arduino.h>` 挿入 / 全関数プロトタイプ生成 / `#line` 写像。**`.ino` → `main.cpp` の機械変換は実装可能**であり、逆は不要 | 🟡 | real-fire (実出力の diff) |
| F-10 | 🔴 **`.ino` 経路では `.ino` 以外のスケッチファイルも build ディレクトリへコピーされ、`compile_commands.json` はコピー側を指す。** URI 変換層は `.ino` 専用ではなく全ファイルに要る | 🔴 | real-fire |
| F-11 | 🔴 **arduino-language-server 0.7.7 は find references / go to implementation を実装していない** (`referencesProvider: ABSENT`)。呼ぶとエラーではなくハングする | 🔴 | real-fire |
| F-12 | 🔴 **同 0.7.7 は、クライアントが `hierarchicalDocumentSymbolSupport` を宣言しないと `panic: not implemented` でプロセス終了する。** LSP 仕様上この宣言は任意 | 🔴 | real-fire (対照実験で特定) |
| F-13 | **`.ino` 経路の初回診断は 18.2〜18.7 s、`main.cpp` 経路は 1.5 s。約 12 倍。** ALS は内部でスケッチをビルドしてから診断する | 🔴 | real-fire (3 回反復) |
| F-14 | **PlatformIO / arduino-cli の `compile_commands.json` は GCC のフラグを含み、clangd に素で渡すと偽エラーが出る** (ESP8266 で 5 件、ESP32 で 7 件)。`.clangd` の `CompileFlags.Remove` + `--query-driver` で**どちらも 1 件まで落ちた** | 🟡 | real-fire |
| F-15 | 🔴 **残る偽エラーは target triple 不一致に起因する。** 本環境の clang は `aarch64` / `arm` / `x86` しか登録しておらず、**Xtensa (ESP8266/ESP32/S 系) も RISC-V (C 系) も AVR も無い**。**RP2040 (ARM) だけは target が合う** | 🔴 | real-fire |
| F-16 | **解決手段は実在する** — Espressif が Xtensa target を持つ `clangd` を配布している (`esp-21.1.3_20260408`, macOS x86_64 で 12.7 MB)。**本 spike では導入していない** | 🟡 | primary source |
| F-17 | 🔴 **clangd は 5 ファイル / 100 行のプロジェクトでも 1 セッション ≈261 MiB RSS。** アイドル時 CPU は 0.0%。**メモリが律速** | 🔴 | real-fire |
| F-18 | **Compiler 診断 → ファイル/行 jump は両エディタで成立した。** S002 の出力形式をそのまま流し、未オープンのファイルも開いて marker を出した。**Compiler は未変更** | 🟢 | real-fire |
| F-19 | **AI multi-file 編集は両エディタとも公開 API 経由で成立し、undo で全ファイルが復元した。** LSP の `textDocument.uri` = エディタの file model 識別子という 1 対 1 対応が、AI・Compiler 診断・LSP 診断を同じ座標系に乗せる | 🟡 | real-fire |
| F-20 | **`@codemirror/lsp-client` は CodeMirror 作者本人が author / maintainer の一次公式パッケージ** (MIT, 6.2.5, 2026-06-09)。**S001 の「CodeMirror の LSP はコミュニティ製」は 2026-08 時点で古い** | 🟡 | primary source |
| F-21 | **`clangd-in-browser` は `private: true` / `version: 0.0.0` の実験デモであり、ライブラリではない。** 依存が現行から **28 メジャー遅れ** | 🟡 | primary source |
| F-22 | **`arduino-cli` は GPL-3.0、`arduino-language-server` は AGPL-3.0** (同梱 LICENSE 本文で確認)。digicode-text の AGPL-3.0 と整合はするが、**改変時・配布時の義務が増える** | 🟡 | primary source (本文) |
| F-24 | **`.ino` 経路の cross-file 補完は編集直後でも正常に動く。** 新しい行を打ち込んだ直後に、別ファイルで定義された構造体のメンバが正しく返った。ALS の `textDocumentSync` は Incremental を広告しており、増分同期経路に問題はない | 🟢 | real-fire (切り分け後) |
| F-23 | **server-side LSP を選ぶと「広告と semantic 解析の緊張」は発生しない。** この論点は browser-side WASM を選んだ場合にだけ生じる制約である | 🟢 | 実測からの帰結 |

## 3. Risks

| # | Risk | Sev |
|---|---|---|
| R-1 | **Option 3 を選ぶと、LLVM のクロスビルドと board 別 sysroot 配布を自前で保守し続けることになる。** 保守できなくなった時点で製品の中核機能が止まる | 🔴 |
| R-2 | **Option 1 / 2 を選ぶと、匿名・無料・広告モデルのまま 1 セッション ≈261 MiB を負担する。** 濫用耐性 (rate limit / quota / cleanup) が製品要件に入り込む | 🔴 |
| R-3 | **`.ino` を標準にすると、find references という基本 UX が既存 OSS では手に入らない** (F-11)。実装するなら AGPL の arduino-language-server を fork することになり、義務が確定する | 🔴 |
| R-4 | **DIP に依存すると browser matrix が Chromium に固定される。** Safari は WebKit standards-positions で Negative | 🟡 |
| R-5 | **Xtensa target の不一致を放置すると、ユーザに偽の赤線を見せ続けることになる** (F-15)。初学者向け製品ではこれは致命的に紛らわしい | 🔴 |
| R-6 | **arduino-language-server の安定版は 2025-03-19 で止まり、main は unstable と明記されている。** 依存すると Arduino 側の保守速度に縛られる | 🟡 |
| R-7 | **Monaco を選ぶと、実運用 bundle は本 spike の測定値より必ず大きくなる** (worker 未計上)。初期表示を重視するなら実測し直しが要る | 🟡 |

## 4. Remaining unknowns — 推測で埋めない (裁定 §18)

| 項目 | 状態 |
|---|---|
| Espressif clang fork (esp-clangd) を使った場合の診断精度 (偽エラー 0 に到達するか) | **NOT OBTAINED** |
| clangd WASM の実 startup 時間・実メモリ使用量 | **NOT OBTAINED** (wasm 取得 2.94 s のみ実測) |
| clangd WASM に Arduino / ESP32 ヘッダを載せた場合の実サイズと実挙動 | **NOT OBTAINED** |
| 10,000 行級 / 数十ファイル規模での挙動 (両方式) | **NOT OBTAINED** (fixture は 100 行 / 5 ファイル) |
| project load / browser reload 後の再開時間 | **NOT OBTAINED** |
| 同時 N 接続時の実スケーリング・実メモリ合計 | **NOT OBTAINED** |
| オンデマンド起動 (Option 2) の index 再構築コスト | **NOT OBTAINED** |
| `arduino-language-server 0.8.0-rc.1` で F-11 / F-12 が解消しているか | **NOT OBTAINED** (本 spike は安定版 0.7.7 で測った) |
| Theia (EPL-2.0) と AGPL-3.0 の法的関係 | **NOT OBTAINED** (本文未読) |
| LLVM Exception の再配布時 notice 義務の具体条項 | **NOT OBTAINED** (本文の該当節未精読) |
| Safari / Firefox での実動作 | **NOT OBTAINED** (裁定 §17 により成立条件外) |
| Windows / Linux 実機での再現 | **NOT OBTAINED** (本 spike は macOS x86_64 のみ) |
| CodeMirror の diff / merge UI (`@codemirror/merge`) | **NOT OBTAINED** (未導入) |
| GPT / AdSense の実広告配信を DIP 親ページで動かした実測 | **NOT OBTAINED** (third-party script と image の読み込みまでは実測) |

## 5. 🔴 Human 判断事項 — この spike が返す問い

| # | 問い | 材料 |
|---|---|---|
| H-1 | **semantic analysis は A (browser WASM) / B (server LSP) / C (hybrid) のどれか** | `03` §4 の 16 軸比較。実測は B と C を強く支え、A は sysroot 問題 (F-4) と保守 (R-1) を持つ |
| H-2 | **Editor は Monaco か CodeMirror か** | F-1 / F-2 / F-3。semantic は同じ。size・起動は CodeMirror、diagnostics owner 分離と diff 内蔵は Monaco |
| H-3 | **標準 Project 形式は `.ino` か `main.cpp` か** | `05` §5 の 11 軸 + §6 の実測対照。技術は `main.cpp`、生態系は `.ino`。**F-9 が第三の形 (内部 `main.cpp` / 取り込み時に変換) を可能にする** |
| H-4 | **browser matrix を Chromium に固定するか** | A を選ぶ場合のみ発生 (R-4)。B / C なら発生しない |
| H-5 | **広告を製品に入れるか** | 本 spike の答えは「**方式によって不可能にはならない**」。B / C なら無制約、A でも DIP で両立する (F-6) |
| H-6 | **Xtensa target 問題をどう解くか** | ①Espressif clang fork を採る ②偽エラーを抑制表示する ③RP2040 (ARM) を第一 board にする — **どれも Human 判断** (F-15 / F-16 / R-5) |
| H-7 | **匿名・無料での server-side LSP をどう成立させるか** | F-17 (261 MiB/セッション) + S002 の workspace ≈23 MB。rate limit / cleanup / セッション上限は **baton 21 が既に挙げている項目**であり、ここで初めて数字が付いた |

## 6. next-objective candidates — **menu であって queue ではない**

**列挙は着手権限ではない** (16.md §2 の baton 定義、裁定 §23)。

| # | 候補 | これを開く条件 |
|---|---|---|
| N-1 | **Architecture Decision** — H-1〜H-7 を Human が裁定する | 本 spike の受理 |
| N-2 | **Espressif clang fork での診断精度検証** (F-15 / F-16 の決着) | H-6 の方向が決まる、または B/C 系が選ばれる |
| N-3 | **規模スケール検証** — 10,000 行 / 数十ファイル / 同時 N 接続 | 方式が 1 つに絞られる |
| N-4 | **`.ino` → `main.cpp` 機械変換の実証** (F-9) | H-3 が「内部 `main.cpp`」方向に振れる |
| N-5 | **Storage architecture 設計** | 方式決定後 (`07` が方式ごとの自然形を出してある) |
| N-6 | **arduino-language-server 0.8.0-rc.1 の再測定** | H-3 が `.ino` 方向に振れる |
| N-7 | **Text Compiler architecture** (baton 21) — 本 spike とは独立に開ける | Human が開く |
| N-8 | **AI multi-file 編集の設計** (`06` §5 の surface を前提に) | Editor 方式決定後 |

## 7. 本 spike が S001 / S002 に対して更新したこと

| 対象 | 更新内容 |
|---|---|
| S001 `09_editor-lsp-survey.md` §2 | CodeMirror の LSP は**公式パッケージが存在する** (F-20) |
| 同 §2 | Monaco / CodeMirror のサイズは**同一機能で実測すると 6.2 倍差 (brotli)** (F-2) |
| 同 §3 経路 A | 「WASM サイズ・multi-file / `compile_commands.json` の扱いは未確認」→ **サイズを実測 (24.5 MiB gzip)、`compile_commands.json` は使わず `.clangd` 方式、multi-file は未実装だが構造的障害なし、そして sysroot が真の障害** (F-4) |
| 同 §3 経路 A | 「clangd を WASM で動かす」と「AdSense を出す」は同一ドキュメントでは両立しない → **同一ドキュメントでは依然そのとおり。ただし DIP で別ドキュメントに分ければ両立し、それを実測した** (F-5 / F-6) |
| 同 §4 | 「経路 B は arduino-language-server がその前処理を持つ」→ **持っている。動いた。ただし find references が無く、capability 宣言しだいで panic する** (F-11 / F-12) |
| S002 baton 23 | 「`.ino` vs `main.cpp` は Editor / LSP 側で決まる」→ **その材料を `05` が全部出した。決定は Human** |
| 16.md §1 「Editor / LSP は donor 資産ゼロ」 | **変わらず。** 本 spike も donor 側に Editor 資産を見つけていない |
