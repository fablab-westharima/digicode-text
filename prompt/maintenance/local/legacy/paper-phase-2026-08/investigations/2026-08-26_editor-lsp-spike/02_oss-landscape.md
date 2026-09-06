# 02_OSS landscape — 2026-08 時点、採用判断に必要な精度で

**検証の型:** license は **本文または GitHub の license 判定 + npm registry** = **primary source**。
保守状況は GitHub / npm API の実データ = **primary**。**採用は決めない** (裁定 §21)。
S001 `09_editor-lsp-survey.md` は「二次情報のみ」と自己申告していた。**本書はそれを一次情報に格上げし、2 点を訂正する** (§5)。

---

## 1. Editor 本体

| 候補 | license (実測) | 最新 (実測) | 保守 (実測) | 位置づけ |
|---|---|---|---|---|
| **Monaco Editor** | **MIT** (npm + GitHub 判定一致) | `0.56.0` (2026-07-20) | `microsoft/monaco-editor` 最終 push **2026-08-25** / ★46,588 | VS Code のエンジン。LSP 周辺の実装例が最も厚い |
| **CodeMirror 6** | **MIT** (`@codemirror/*` 各パッケージ) | `state 6.7.1` (2026-07-05) / `view 6.43.9` (**2026-08-16**) | パッケージ単位で活発。メタ repo `codemirror/dev` は **archived** だが**これは実体ではない** | 軽量・モジュール式 |
| **Eclipse Theia** | **EPL-2.0** (GitHub 判定) | — | 最終 push **2026-08-26** / ★21,654 | IDE フレームワーク一式。「部品として挿す」のではなく「Theia の上に載る」 |
| **code-server** | **MIT** | — | 最終 push 2026-08-24 / ★79,068 | **サーバ常駐前提** |
| **OpenVSCode Server** | **MIT** | — | 最終 push **2026-03-26** / ★6,158 | 上記より更新間隔が長い |
| `@codingame/monaco-vscode-api` | **MIT** | `36.2.1` (**2026-08-25**) | 最終 push 2026-08-25 / ★502 | Monaco に VS Code のサービス層を持ち込む層。**clangd-in-browser が依存している層** |

### 🔴 実測した bundle size (同一機能・同一バンドラ・同一 minify)

「Monaco は 5-10MB」「CodeMirror は 300KB」は出典元の記載であって比較になっていない。
**同じ機能セット (file tree / tabs / multi-model / LSP diagnostics / definition / references / completion / compile 診断)
を実装し、esbuild 0.28.2 で minify した実測値**が以下。

| | ファイル数 | raw | gzip | brotli |
|---|---|---|---|---|
| **Monaco** | 2 (js + css) | **4,644,009 B (4.43 MiB)** | **1,189,087 B (1,161 KiB)** | **921,838 B (900 KiB)** |
| **CodeMirror 6** | 1 | **541,759 B (0.52 MiB)** | **175,367 B (171 KiB)** | **148,317 B (145 KiB)** |
| 比 | | **8.6×** | **6.8×** | **6.2×** |

> **この数値の限界を明示する**: Monaco 側は esbuild の IIFE 出力で、**通常 Monaco が別途配る
> `editor.worker` を含んでいない**。実運用の Monaco はこれに worker が加わるので、**上記は Monaco の下限**である。
> CodeMirror 側は worker を使わないので、この差は縮まらず広がる方向。

### 実ブラウザでの起動 (Chrome for Testing 148、localhost・非圧縮配信)

| | DOM load | **editor ready** | 転送バイト | リクエスト数 |
|---|---|---|---|---|
| Monaco | 1,030 ms | **1,087 ms** | 4,646,879 B | 3 |
| CodeMirror 6 | 203 ms | **262 ms** | 544,580 B | 2 |

**両者とも `app_error: null`、致命的な console error なし。**

## 2. LSP クライアント層

| 候補 | license | 最新 | 備考 |
|---|---|---|---|
| **`monaco-languageclient`** (TypeFox) | **MIT** | `10.7.0` (2026-02-04) | repo 最終 push **2026-07-31** / ★1,361。Monaco を VS Code API 互換にしてから LSP を繋ぐ |
| **`@codemirror/lsp-client`** | **MIT** | **`6.2.5` (2026-06-09)** | 🔴 **CodeMirror 作者 Marijn Haverbeke 本人が author / 唯一の maintainer = 一次公式パッケージ。** 初版 2025-08-05、11 バージョン |
| `codemirror-languageserver` (Furqan Software) | **BSD-3-Clause** | `1.22.1` (2026-08-09) | コミュニティ製。公式が出た今も更新継続 |
| `vscode-languageclient` (Microsoft) | MIT | `10.1.0` (2026-07-01) | VS Code 拡張向け。ブラウザ直挿しの想定ではない |

> **S001 の記述「CodeMirror の LSP はコミュニティ製パッケージ経由」は 2026-08 時点で古い。**
> 公式 `@codemirror/lsp-client` が存在し、`jumpToDefinition` / `findReferences` /
> `serverCompletion` / `languageServerSupport` を提供する。**本 spike はこれを実際に動かした** (`06`)。

## 3. C/C++ semantic analysis 側

| 候補 | license (実測) | 最新 / 保守 | 実測した性質 |
|---|---|---|---|
| **clangd (LLVM 本体)** | **Apache-2.0 with LLVM Exceptions** (LICENSE.TXT 本文で確認) | 本環境は Apple clangd 17.0.0 | `03` で全面実測。31 の capability を広告し、うち definition / references / workspaceSymbol / completion / documentSymbol を実際に確認 |
| **`guyutongxue/clangd-in-browser`** | **MIT** (LICENSE 本文 = MIT 全文 / GitHub 判定も MIT) | 最終 push **2025-12-31** (「upgrade to llvm 22」) / ★75 / archived=false | 🔴 **`private: true`, `version: 0.0.0` の実験デモであってライブラリではない。** 依存は `@codingame/monaco-vscode-* ~8.0.4` 固定で、**現行 36.2.1 から 28 メジャー遅れ** |
| **`arduino/arduino-language-server`** | **AGPL-3.0** (同梱 LICENSE.txt 本文が GNU AFFERO GPL v3) | 安定版 **0.7.7 (2025-03-19)**、`0.8.0-rc.1` は **prerelease (2026-07-27)** / ★202 | `03` で全面実測。Arduino IDE 2 の補完を支えている実体 |
| **`arduino/arduino-cli`** | **GPL-3.0** | 最終 push 2026-08-24 / ★4,997 | arduino-language-server の**必須外部依存**。本環境 1.3.1 |
| **`espressif/llvm-project`** (esp-clang / esp-clangd) | LLVM 派生 (Apache-2.0 w/ LLVM Exceptions 想定、**本文未読**) | `esp-21.1.3_20260408` (**2026-04-15**) | **Xtensa target を持つ clangd を配布**。macOS x86_64 版 `clangd` = **12,662,520 B**。**本 spike では導入していない** |

### 🔴 clangd-in-browser の実測サイズ (デモの実配信を計測)

`https://clangd.guyutongxue.site/` の実 HTTP を計測した。

| 資産 | 非圧縮 | 実配信 (gzip) |
|---|---|---|
| **`wasm/clangd.wasm`** | **126,550,863 B (120.7 MiB)** | **25,728,226 B (24.5 MiB)** |
| `assets/main-*.js` | 7,371,040 B | — |
| その他 JS / CSS / wasm (24 点) | 約 14.1 MB | — |
| **クロール合計** | **147,988,646 B (141.1 MiB)** | — |

`content-encoding: gzip` / `cache-control: max-age=600`。本機からの `clangd.wasm` 取得は **2.94 s** (gzip) / 13.70 s (非圧縮)。

**デモの実レスポンスヘッダ:**

```
cross-origin-embedder-policy: require-corp
cross-origin-opener-policy: same-origin
```

= COOP/COEP は README の記述であるだけでなく、**実運用でも実際に使われている**。

### clangd-in-browser のビルド前提 (`build.sh` 実読)

emsdk 4.0.22 / WASI SDK 29 / LLVM 21.1.0 を **2 段階ビルド**。リンクフラグに
`-pthread` · `-s PTHREAD_POOL_SIZE='Math.max(navigator.hardwareConcurrency, 8)'` ·
`-s INITIAL_MEMORY=2GB` · `-s MAXIMUM_MEMORY=4GB` · `--embed-file <wasi-sysroot>/include@/usr/include`。

> 🔴 **決定的:** `--target=wasm32-wasi` + **WASI sysroot を wasm に埋め込む**構成である
> (`src/main.worker.ts` の `flags` 実読: `-isystem/usr/include/c++/v1`, `-isystem/usr/include/wasm32-wasi` …)。
> つまりこの WASM clangd が見ている世界は **wasm32-wasi + libc++** であって、
> **`Arduino.h` も ESP32 core も存在しない**。DigiCode Text で使うには
> **Arduino core / board 別ヘッダ群を別途ブラウザ FS へ載せる**必要があり、それは
> ①追加のダウンロード量 ②board ごとの版管理 ③ライブラリ追加ごとの再配布、を丸ごと連れてくる。
> **この点は S001 の調査に無く、本 spike が初めて特定した。**

### multi-file 対応 (`src/config.ts` / `main.worker.ts` 実読)

`FILE_PATH = "/home/web_user/main.cpp"` の**単一ファイルデモ**。ただし実体は
Emscripten の in-memory FS (`clangd.FS.writeFile`) + `.clangd` 設定ファイルであり、
**ファイルを増やすこと自体に構造的障害は無い** (clangd 側は普通のワークスペースとして扱う)。
**「multi-file 不可」ではなく「multi-file 未実装のデモ」**である。ただし §上記の sysroot 問題は残る。

## 4. Arduino 系 Web IDE / その他

| 対象 | 実測 |
|---|---|
| Arduino Cloud Editor | **OSS ではない** (Arduino の商用サービス)。移植元にならない |
| Arduino IDE 2 | AGPL-3.0。実体は **Theia + arduino-language-server**。**LSP 部分だけを取り出すのが現実的**で、器ごとは §1 の Theia 評価と同じ |
| PlatformIO IDE | VS Code 拡張。ブラウザ組込みの対象ではない。**ただし `pio run -t compiledb` が `compile_commands.json` を吐く**ことは本 spike で実測済み (86 entries / 0.84 s) — **server-side LSP 構成の要になる** |

## 5. S001 からの訂正 (2 件)

| # | S001 の記述 | 実測による訂正 |
|---|---|---|
| C-1 | 「CodeMirror 6 … LSP はコミュニティ製パッケージ経由で、Monaco より初期配線が要る」 | **公式 `@codemirror/lsp-client` (MIT, 作者本人) が存在する。** 本 spike では CodeMirror 側の配線のほうが短く、起動も 4.1× 速かった |
| C-2 | 「Monaco 非圧縮 約 5-10MB / CodeMirror コア 約 300KB」(出典記載) | **同一機能で実測すると 4.43 MiB vs 0.52 MiB (raw)、900 KiB vs 145 KiB (brotli)。** 桁は合っているが、比較可能な数字はこちら |

## 6. license 上の注意 (baton 15 / case DT-1 を適用)

digicode-text は **AGPL-3.0 の PUBLIC リポジトリ**。以下は**採用時に本文を読む**前提での注意点であり、
**本 spike は正式採用を決めない**。

| 候補 | 形態 | 注意点 |
|---|---|---|
| Monaco / CodeMirror / monaco-languageclient / `@codemirror/lsp-client` | **MIT**、browser bundle として配布 | AGPL-3.0 プロジェクトへの取り込みに障害なし。**notice 保持義務**は残る (bundle に license ヘッダを残すか NOTICE を配る) |
| clangd (WASM としてブラウザ配布する場合) | **Apache-2.0 w/ LLVM Exceptions** | 🔴 **再配布**になるので notice / 帰属表示の義務が発生する。LLVM Exception は「バイナリ配布時に Apache-2.0 の帰属条項を課さない」旨を含むが、**本文の該当条項を読んでから判断すること** (現時点で該当節は未精読 = `NOT OBTAINED`) |
| clangd-in-browser | **MIT** | 取り込み自体は容易。ただし**実験デモであり、fork して自前保守する前提**になる (§3) |
| **arduino-language-server** | **AGPL-3.0**、**server component として稼働** | digicode-text も AGPL-3.0 なのでライセンス的な整合は良い。🔴 ただし **AGPL は「ネットワーク越しに使わせた時点で改変版のソース提供義務」が発生する**。改変せず配布物のまま起動する運用なら義務は軽いが、**改変した瞬間に義務が確定する**。本 spike の実測では `references` 未実装など**改変したくなる欠落が実在する** (`03`) |
| **arduino-cli** | **GPL-3.0**、別プロセスとして起動 | AGPL-3.0 との組み合わせは GPL-3.0 §13 の想定内。**同一バイナリへのリンクではなく別プロセス起動**という形態を保つこと。Docker image に同梱して配布する場合は GPL の配布義務が立つ |
| Eclipse Theia | **EPL-2.0** | 🔴 **EPL-2.0 と AGPL-3.0 の組み合わせは要精査。** EPL-2.0 は secondary license として GPL-2.0 を選べる条項を持つが、**AGPL-3.0 との関係は本文を読まないと判断できない** = `NOT OBTAINED`。採用検討の入口で法務判断が要る |
| esp-clang / esp-clangd | LLVM 派生 | **本文未読** = `NOT OBTAINED` |

> **case DT-1 の適用:** 上表は**外部 OSS**についてのもので、いずれも当社保有コードではない。
> したがって「license 条件を読む」が唯一の判断路である。逆に **DigiCode donor 内の自社コードに
> `PROPRIETARY = 持ち込み不可` を機械適用してはならない** — 本 spike では donor 側 Editor 資産が
> そもそも存在しないため、この論点は発生していない。
