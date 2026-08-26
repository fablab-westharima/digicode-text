# 03_editor-lsp-technical-spike — Text Editor 方式 / C・C++ semantic analysis 方式 / `.ino` vs `main.cpp` 判断のための技術調査

<!-- 配置: local/plans/active/ (rule 15 / local/README.md §plans)。完走したら plans/completed/ へ移動。
     この計画は「OSS 調査 + isolated probe」であって production 実装ではない。 -->

| 項目 | 内容 |
|---|---|
| 起案日 | 2026-08-26 |
| 起案契機 | 2026-08-26 Human 裁定 + HUMAN GO「PRIMARY_OBJECTIVE = Editor / LSP Technical Spike」 |
| 起案者 | Claude Code (Opus 5) |
| ステータス | 進行中 |
| 先行依存 | S001 Donor Audit `investigations/2026-08-26_donor-audit/09_editor-lsp-survey.md`(二次情報のみ)・`10_…md`(COOP/COEP × 広告)・S002 Compiler probe(`.ino`/`main.cpp` は Compiler 側制約ではない = baton 23) |
| 解錠する baton | 23(`.ino` vs `main.cpp`)。参照して満たさない: 13 / 15 / 18 / 19 / 21 |
| 後継計画 | Architecture Decision(Human)。**本計画は判断材料を出すだけで、Editor / LSP / `.ino` / `main.cpp` / Storage / 広告のいずれも決めない** |

## ⚡ 30秒で把握

DigiCode Text の Editor を **一から独自実装しない**という原則の下で、
① Editor 本体 OSS、② C/C++ semantic analysis の実現方式(browser-side WASM / server-side LSP / hybrid)、
③ `.ino` と `main.cpp` のどちらが標準 Project 形式として適切かを判断するための**事実**を、
OSS の一次情報調査と **isolated 環境での実測**によって取得する。

**やらないこと**: production Editor 実装 · production 依存への組込み · deploy · Cloudflare / DNS 変更 ·
DigiCode donor 変更 · production Compiler 変更 · Monaco / CodeMirror / clangd / server LSP / `.ino` /
`main.cpp` / Storage / AdSense / donation の**採用決定**。

完了したら **STOP して Human へ報告**(裁定 §21 / §24、rule 24)。probe 中に生じた
「ついでに実装したくなったもの」は finding / risk / proposal / next-objective-candidate へ回し、着手しない。

## 1. 経緯 + 動機

S001 が確定させた前提:

- **Editor は donor 資産がゼロ**。Classic は Blockly のみでテキストエディタ資産を持たない → 最初から OSS 選定。
- clangd-in-WASM は **cross-origin isolation (COOP/COEP) を要求する可能性**があり、Google Publisher Tag は
  COEP ページを現状サポートしない → **editor 方式 / storage 方式 / 収益モデルは 3 つで 1 つの決定**(baton 19)。
- 09 の license / 保守状況・サイズはすべて**二次情報**であり、本文を読んでいない(baton 15)。

S002 が確定させた前提:

- **`.ino` も `main.cpp` も Compiler 側では成立する**(PlatformIO が `.ino` を前処理:`Arduino.h` 自動 include、
  プロトタイプ自動生成)。→ **判断は Editor / LSP / UX 側へ移った**(baton 23)。
- multi-file error から `file:line:column:severity:message` を構造化取得できる(Editor へ渡す前提が実測済み)。

本計画はこの二つの未決を、**推測ではなく実測**で埋める。

## 2. probe 環境(production から隔離)

| 要素 | 実体 | 隔離の担保 |
|---|---|---|
| probe 作業場所 | セッション scratchpad(repo 外) | digicode-text repo に production 依存を作らない。成果は evidence として investigations/ にのみ記録 |
| Editor probe | 使い捨て local project + `localhost` 静的サーバ | 外部へ publish しない。port は localhost bind |
| language server | isolated に取得した clangd バイナリ / arduino-language-server | production ではなくローカル一時実行 |
| donor repo | `~/github_project/DigiCode` · `~/github_project/digicode-compile-api` | **READ ONLY**。開始時と終了時に SHA / dirty を実測して不変を示す |
| production | Cloud Compiler / Cloudflare Worker / DNS / deploy | **一切接続しない** |

## 3. Acceptance(裁定 §22 の 14 条件)

1. Editor / LSP OSS 候補を現在情報で比較
2. 最有力候補を isolated 環境で実際に動かす
3. multi-file C++ で semantic navigation を実測
4. `.ino` で実測
5. `main.cpp` で実測
6. compile diagnostic → file/line 表示を実測
7. AI multi-file editing との integration surface を確認
8. Browser-side / Server-side / Hybrid を比較
9. COOP / COEP / SharedArrayBuffer の実要否を確認
10. 広告との技術的衝突を確認
11. Storage への影響を整理
12. `.ino` vs `main.cpp` を比較可能にする
13. remaining unknown を明示
14. Human が Architecture Decision できる材料を揃える

## 4. 検証の型(rule 04)

| 型 | 適用範囲 |
|---|---|
| **real-fire(実行して測る)** | Editor 起動 · multi-file navigation · `.ino` / `main.cpp` の LSP 応答 · diagnostics 表示 · SharedArrayBuffer / COOP・COEP の実要否 · サイズ / 起動時間 |
| **primary source(公式仕様・license 本文・リポジトリ本体)** | license 条件 · 広告仕様の COEP 制約 · browser API 対応 |
| **secondary source** | 保守状況の一部・第三者記事 — 型を明示して分離する |
| **NOT OBTAINED** | 測れなかったものは推測で埋めず、この語で明示する(裁定 §18) |

**絶対条件**: 「動いた」は存在確認ではなく **実際の応答内容**で示す(rule 04 §instrument)。
「SharedArrayBuffer が要る/要らない」は、**COOP/COEP を外した状態で実際に壊れるか**を positive control として示す
(検出器が一度も失敗を返さないなら、成功は証拠にならない — rule 04 §absence)。
license は**本文を読む**(baton 15 / case DT-1:名前や評判からの推定は禁止)。

## 5. 成果物

`local/investigations/2026-08-26_editor-lsp-spike/` に、環境 / コマンド / 検証型 / 成功・失敗 /
実測値 / OSS 比較 / `.ino` vs `main.cpp` 比較表 / Architecture options / remaining unknowns /
Human 判断事項 / next-objective candidates を永続化する。
