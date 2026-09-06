# 02_compiler-shared-separate-probe — Compiler Shared / Separate 判断のための実証調査

<!-- 配置: local/plans/active/ (rule 15 / local/README.md §plans)。完走したら plans/completed/ へ移動。
     この計画は「調査 + isolated probe」であって production 実装ではない。 -->

| 項目 | 内容 |
|---|---|
| 起案日 | 2026-08-26 |
| 起案契機 | 2026-08-26 Human 裁定 + HUMAN GO「PRIMARY_OBJECTIVE = Compiler Shared / Separate 判断に必要な実証調査」 |
| 起案者 | Claude Code (Opus 5) |
| ステータス | 🎉 全 Acceptance 10/10 達成 (2026-08-26)。**Human 受理待ち** |
| 先行依存 | S001 Donor Audit (`investigations/2026-08-26_donor-audit/`)、特に F-1 / F-2 / F-3 / F-6 と P-1 |
| 後継計画 | Architecture Decision (候補 N-3)。**本計画は判断材料を出すだけで、Shared / Separate を決めない** |

## ⚡ 30秒で把握

**既存 Classic の compile 経路・fragment 契約・template 処理・成果物を一切変えずに**、DigiCode Text 用の
full-source / multi-file compile 経路を同一 Compiler infrastructure 上へ **additive** に成立させられるかを、
isolated 環境で**実測**する。

**やらないこと**: Compiler を共用/分離すると決めること · production (DigiCode / compile-api / Docker image /
Cloud Compiler / Cloudflare Worker / Board·Library 本番登録 / DNS / deploy) への一切の変更 ·
DigiCode Text の production 実装 · Editor / LSP の実装 · registry の全面再設計。

完了したら **STOP して Human へ報告**。probe 中に生じた「実装したくなったもの」は finding / proposal /
next-objective-candidate へ回し、着手しない (裁定 §18、rule 24)。

## 1. 経緯 + 動機

S001 Donor Audit が static evidence で確定させた前提:

- 現行 `POST /api/compile` の契約は `{fqbn, template, fragments:{includes,globals,setupCode,loopCode}}` で、
  **任意 multi-file / full-source を受け取る口が無い** (F-1)
- `projectStore.writeMainIno()` は `src/main.ino` **1 ファイルのみ**を書く
- `lib_deps` は全ビルド共通で、**Classic 全ビルドを壊した実績が 3 件記録されている** (F-2)
- RP2040 削除の真因は Blockly ではなく Compiler 側 (F-3)
- `compile-proxy-worker` の `ALLOWED_ORIGINS` は 4 つにハードコードで digicode-text を含まない (F-6)
- 「新 endpoint の追加なら Classic に無影響」は **仮説であり未検証** (P-1)

本計画はこの最後の一点 — **未検証の仮説** — を実測に変える。

## 2. probe 環境 (production から隔離)

| 要素 | 実体 | 隔離の担保 |
|---|---|---|
| 対象コード | `digicode-compile-api` の isolated clone (repo 外 scratch) | clone 直後に `git remote remove origin` → **push 先が構造的に存在しない** |
| 実行環境 | 使い捨てコンテナ `dt-probe-api` (image `digicollc/digicode-compile-server:latest`) | 既存の停止済みコンテナ `goofy_hugle` には触れない。port は 3001 ではなく **127.0.0.1:3999** に bind |
| donor repo | `~/github_project/DigiCode` / `~/github_project/digicode-compile-api` | **READ ONLY**。probe 開始時と終了時に SHA と dirty を実測して不変を示す |
| production | Cloud Compiler / Cloudflare Worker / ML30 / DNS | **一切接続しない**。Worker は donor コードを上流 fetch を stub 化して isolated 実行 |

## 3. Acceptance (裁定 §16 の 10 条件)

1. isolated 環境で full-source compile 成功
2. isolated 環境で multi-file compile 成功
3. Classic existing path を維持できること
4. Text / Classic workspace collision を避けられること
5. dependency を Classic 全体へ汚染せず Text 側へ与えられること
6. Board visibility / registry を分離できるかの事実取得
7. multi-file error で filename / line を取得
8. artifact 生成経路を確認
9. Cloud / Local 共用に関する残 unknown を明確化
10. Shared / Separate それぞれの実際の変更範囲を比較可能にする

## 4. 検証の型 (rule 04)

| 型 | 適用範囲 |
|---|---|
| **real-fire (実 compile)** | Text A/A2/B2/B3/C、Classic BEFORE/AFTER、error semantics、concurrency |
| **static (ソース読解)** | Cloudflare Worker、Board registry、frontend 結合 |
| **未verify** | 実機書き込み、production 実挙動、負荷特性 — **本計画では取得しない**と明示する |

**絶対条件**: 「Classic を壊していない」は *存在確認* ではなく **artifact のバイト比較**で示す。
「Text の依存が Classic に漏れない」は marker 文字列の **positive control 込み**で示す
(検出器が一度も PRESENT を返さないなら、absent は証拠にならない — rule 04 §absence)。

## 5. 成果物

`local/investigations/2026-08-26_compiler-shared-probe/` に evidence / commands / test type /
success·failure / remaining unknown / Option A·B·C 比較 / Human 判断事項 / next-objective candidates を永続化する。
