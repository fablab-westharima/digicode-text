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
