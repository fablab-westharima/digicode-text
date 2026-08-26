# 改定log — digicode-text セッション履歴の索引

<!-- 運用規定 (2026-07-07 分散化):
     - 本ファイルは【索引】。1 セッション = 1 行、末尾に追記のみ(過去行の書き換え禁止)
     - セッションの本文は handover/sessions/S{NNN}_{YYYY-MM-DD}_{slug}.md に書く
       (フォーマット = global/templates/session-log-template.md、close 後は不変)
     - 単一ファイルへの本文蓄積は禁止 — 起源プロジェクトでは単一の改定log が 4,600 行超となり、
       3 分割アーカイブという追加メンテ機構が必要になった(実測)。per-session 分散なら
       アーカイブ運用そのものが不要で、「最新 entry を読む」= 小さい 1 ファイルで済む
     - /close 手順 4 が「sessions/ に新ファイル + 本索引に 1 行」を実行する -->

| S | 日付 | 1行サマリ | ファイル |
|---|---|---|---|
| 000 | 2026-08-25 | Project_Template から bootstrap(consumer 初期化・DigiCode 混入 0・製品実装なし) | [S000](sessions/S000_2026-08-25_bootstrap.md) |
| 001 | 2026-08-26 | DigiCode Donor Inventory / Audit(READ ONLY・donor 変更 0・実装なし)。case DT-1 起票。目的は受理され close、次目的は UNSET | [S001](sessions/S001_2026-08-26_donor-inventory-audit.md) |
| 002 | 2026-08-26 | Compiler Shared/Separate 実証 probe(Acceptance 10/10 受理・Classic artifact バイト一致・donor 変更 0)。Human 裁定「Text 専用 Compiler を第一方針」。新規 rule/case なし、次目的は UNSET | [S002](sessions/S002_2026-08-26_compiler-shared-separate-probe.md) |
| 003 | 2026-08-26 | Editor/LSP Technical Spike(Acceptance 14/14)+ Local LSP Helper Feasibility(17/17)を連続実行、両方 Human 受理。donor 3 repo 変更 0・実装なし。Human 裁定「AI 主機能 / LSP は必須でない・Web 主軸・Desktop 正式視野・Monaco 第一候補・内部標準 main.cpp」。case DT-2 起票、次目的は UNSET | [S003](sessions/S003_2026-08-26_editor-lsp-and-local-helper.md) |
| 004 | 2026-08-26 | handover 準拠監査 + read-load maintenance。増加の 91% は §3 裁定 + §2 baton = 正常成長と判定。§1 実測リスト/baton 5 本/§5 の三重正本を owner へ正規化(read-load 52,853→51,139 tok)。**allowance は変更せず** — roster UNDECLARED のため導出不能(PT-1 の形)。cold-start 復元テスト 24/24。新規 rule/case なし(DT-2 に同日再発を追記)、次目的は UNSET | [S004](sessions/S004_2026-08-26_handover-compliance-and-read-load.md) |
| 005 | 2026-08-26 | Product Value Revalidation(Acceptance 15/15、Human 受理)。2026 年の既存環境と一次情報で比較し、反証仮説「既存 IDE の完全 offline bundle で足りる」を検証 → 成立しない理由は技術ではなく依存の推移閉包・配布の合法性・更新・維持責任の所在。**Go(条件付き)**。中核価値を「検証済み MCU 環境の継続管理と、Compiler・AI が同じ正本を読むこと」に確定。直接競合 Codey Online を発見。real-fire 0・production 変更 0・新規 rule/case なし。baton 4 本新設(34–37)、25/31 を 🔴→🟡、§3 の LOST 1 件を復旧。次目的は UNSET、第一候補は Managed Environment Registry Design | [S005](sessions/S005_2026-08-26_product-value-revalidation.md) |
| 006 | 2026-08-26 | Full Orchestration Re-Audit(Acceptance 12/12)。S001–S005 の 82 claim を **6 レーン**(Codex 5 + subagent 1)で独立再監査 — 独立再現・一次情報確認 14 / 反証 9 / 部分反証 21 / 独立確認できず 17、Codex packet 2 本が `ERROR / INVALID_MEASUREMENT`。**parent の自己監査 4 結論のうち 3 つが Codex に部分反証**(うち「構造が委譲を禁じていた」は false)。solo は規則違反ではなかったが、開始時 route 行の不記録(6 中 5)・direction-change の mandatory consult 不履行・**rule 04 の誤読を 4 セッション再利用**が違反。原因の一部は規則の外(harness 側の注入指示)。Human 裁定は **1 件も変更せず**、evidence の訂正と分離して返却。**production 変更 0 / repo 書込 0**(donor 3 SHA 一致)。新規 case 3(DT-3/4/5)、新規 baton 6(38–43)、既存 baton 訂正 7、新規 ruling 1(Opus 5 solo 禁止)、Template feedback +3。次目的は Human が指定済み(未着手) | [S006](sessions/S006_2026-08-26_full-orchestration-re-audit.md) |
