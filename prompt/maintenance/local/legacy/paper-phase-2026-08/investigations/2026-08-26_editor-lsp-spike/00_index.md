# 00_index — Editor / LSP Technical Spike

**PRIMARY_OBJECTIVE:** DigiCode Text の Text Editor 方式、C/C++ semantic analysis 方式、
`.ino` vs `main.cpp` 判断に必要な技術的事実を、OSS 調査と isolated 実測によって取得する。

**実施:** 2026-08-26 (Session 003) / **HUMAN GO:** 2026-08-26 (この objective の範囲のみ)
**donor SHA (probe 前後で不変を実測):** `DigiCode` = `bb35c3b8025610299bf952c2c45eda2196a07401` /
`digicode-compile-api` = `3376746f1e5a4ca039e0cade279741f16612fccf` — **両方 dirty 0**
**donor / production への変更・commit・push・deploy・接続:** **0 件**
**digicode-text repo への production 実装:** **0 件** (この evidence 群と plan のみ)

> **検証の型 (rule 04):** 中核は **real-fire**。native clangd と arduino-language-server を
> 実際に起動して LSP で叩き、Monaco / CodeMirror を実ブラウザ (Chrome for Testing 148) で起動し、
> COOP/COEP/DIP を実ヘッダで配って測った。license は**本文または一次 API**で確認した。
> **実機書き込み・production 接続・負荷試験・Safari/Firefox 実測は 1 件も行っていない。**

---

## この調査が出した答え (1 行ずつ)

| 問い | 答え |
|---|---|
| Editor は Monaco か CodeMirror か | **決めない。** 同一機能で実測すると **brotli 900 KiB vs 145 KiB / 起動 1,087 ms vs 262 ms**。semantic 機能は**両者とも同一**に動いた。差は size・起動・diagnostics の owner 分離 |
| ブラウザ内 clangd (WASM) は成立するか | **成立する。が、DigiCode Text の用途では未解決の設計問題が残る** — その WASM ビルドは **wasm32-wasi sysroot** を見ており、**`Arduino.h` も ESP32 core も入っていない** |
| server-side LSP は成立するか | **成立した。** multi-file の定義・参照・シンボル・補完がミリ秒台で返り、Monaco / CodeMirror 双方から動いた |
| COOP / COEP / SharedArrayBuffer は本当に要るか | **browser WASM 方式では必須。** ただし **`Document-Isolation-Policy` で回避できることを実測した** |
| 広告と構造的に衝突するか | **COOP/COEP では衝突する (Google 公式が GPT 非対応と明記)。DIP なら親に広告を置いたまま iframe だけ隔離でき、実測で広告リソースも読み込まれた。server-side LSP なら論点自体が発生しない** |
| `.ino` と `main.cpp` はどちらが適するか | **決めない。** 技術的には `main.cpp` が明確に軽い (層が 1 つ少ない / 初回診断 ≈12 倍速い / find references が動く / 依存バイナリ 1/3)。`.ino` の価値は生態系にある。**決定は Human** |
| Compiler 診断を Editor に繋げるか | **繋がった。** S002 が実証した `file:line:column:severity:message` をそのまま流して、ファイルを開き・行へ飛び・marker を出すところまで実測 |
| AI は安全に multi-file 編集できるか | **できる構造がある。** 両エディタとも公開状態遷移 API 経由で複数ファイルを編集でき、**人間が 1 操作で undo できた** |

## Acceptance (裁定 §22) — 14 条件の判定

| # | 条件 | 判定 | 根拠 |
|---|---|---|---|
| 1 | Editor/LSP OSS 候補を現在情報で比較 | ✅ | `02` — license は本文 / GitHub API / npm registry の一次情報。S001 の二次情報を **2 点訂正** |
| 2 | 最有力候補を isolated 環境で実際に動かす | ✅ | `06` — Monaco と CodeMirror を実ブラウザで起動し、実 clangd に WebSocket で接続 |
| 3 | multi-file C++ で semantic navigation を実測 | ✅ | `06` §3 / `03` §2 — 定義 0.7 ms・参照 3 箇所/3 ファイル・シンボル・補完 100 件 |
| 4 | `.ino` で実測 | ✅ | `05` §1〜§3 — Arduino プリプロセッサ出力の実 diff、素の clangd の失敗、ALS の全機能実測 |
| 5 | `main.cpp` で実測 | ✅ | `05` §4 / `03` §2 — ESP8266 (PlatformIO) と ESP32 (arduino-cli 実フラグ) の 2 系統 |
| 6 | compile diagnostic → file/line 表示を実測 | ✅ | `06` §4 — 両エディタでファイルを開き・行へ飛び・marker を設定。**Compiler は未変更** |
| 7 | AI multi-file editing との integration surface を確認 | ✅ | `06` §5 — 2 ファイル同時編集 + undo で全ファイルのバイト長が復元することまで実測 |
| 8 | Browser-side / Server-side / Hybrid を比較 | ✅ | `03` §1〜§4 — 16 軸の比較表 |
| 9 | COOP / COEP / SharedArrayBuffer の実要否を確認 | ✅ | `04` §1〜§2 — negative control 付き。Worker + `Atomics.wait` + 共有メモリ書込みまで確認 |
| 10 | 広告との技術的衝突を確認 | ✅ | `04` §3〜§5 — 実測 + Google 公式記述 |
| 11 | Storage への影響を整理 | ✅ | `07` — 方式ごとに自然な Storage model と、方式非依存で要るものを分離 |
| 12 | `.ino` vs `main.cpp` を比較可能にする | ✅ | `05` §5 — 裁定 §19 指定の 11 軸すべて + 実測値の対照表 |
| 13 | remaining unknown を明示 | ✅ | `08` §4 — `NOT OBTAINED` として列挙 |
| 14 | Human が Architecture Decision できる材料を揃える | ✅ | `08` §1〜§3 — Architecture options / Human 判断事項 / next-objective candidates |

## 読む順序

| ファイル | 中身 |
|---|---|
| **`01_probe-environment-and-commands.md`** | 隔離の担保 · 実測環境 · fixture · 再現コマンド · **自分の probe に見つけた欠陥 4 件** |
| **`02_oss-landscape.md`** | Editor / LSP クライアント / semantic 解析器の一次情報比較 · **実測 bundle size** · license 注意 · **S001 からの訂正 2 件** |
| **`03_semantic-analysis-architectures.md`** | 系統 A (browser WASM) / B (server LSP) / C (hybrid) の実測と **16 軸比較表** |
| **`04_isolation-and-advertising.md`** | COOP/COEP/DIP/SharedArrayBuffer の実測 · **広告との両立可否** |
| **`05_ino-vs-maincpp.md`** | Arduino プリプロセッサの実出力 · ALS 実測 · **裁定 §19 の比較表** |
| **`06_editor-probe-and-ai-integration.md`** | Monaco / CodeMirror の実ブラウザ実測 · compile 診断 jump · **AI 統合面** |
| **`07_storage-impact.md`** | 方式ごとに自然な Storage model |
| **`08_options-findings-and-next.md`** | **Architecture options · findings · risks · remaining unknowns · Human 判断事項 · next-objective candidates** |

## この調査が決めていないこと (裁定 §21)

production Editor · Monaco 正式採用 · CodeMirror 正式採用 · clangd 方式正式採用 ·
server LSP 正式採用 · `.ino` 正式採用 · `main.cpp` 正式採用 · Storage 方式 · AdSense 採用 ·
donation 方式 · Compiler architecture 変更 · production implementation — **すべて Human。**
