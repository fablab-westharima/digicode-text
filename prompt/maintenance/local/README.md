# local/ — DigiCode Text maintenance evidence

このディレクトリは、DigiCode Text 固有の調査記録・計画・バグ・セッション履歴・設計evidenceを保存する場所です。

Claude Codeの共通行動規則や旧orchestration systemのactive ownerではありません。

## 主な保存先

- `investigations/` — 調査・測定・設計evidence
- `plans/active/` — 現在Humanが明示的に進行を認めているplanがある場合のみ使用
- `plans/completed/` — 完了済みplanの履歴
- `bugs/` — project固有のbug記録
- `handover/sessions/` — 過去sessionの履歴
- `handover/改定log.md` — session履歴の索引
- `docs/evidence-index.md` — 主要evidenceへの最小navigation
- `legacy/` — 退役済み構造・旧運用資料のhistorical archive

## Historical material

過去のinvestigation、session log、completed plan、legacy文書には、当時使用していたHarness、Codex lane、Opus/Fable routing、hook、`/close`、rule番号等への記述が残っています。

それらは「当時どう作業したか」を示すhistorical evidenceであり、現在のClaude Code運用指示として扱いません。

過去資料に記載された作業を、現在のObjectiveとして自動再開しないでください。

## S010

S010 Managed Environment & Device Knowledge Architecture Design の設計evidenceは:

`investigations/2026-08-27_managed-environment-architecture/`

に保存されています。

Human acceptanceは取得されていません。
旧Plan 11はlegacyへ退役済みです。

将来このテーマを再開する場合は、legacy planをそのまま再実行せず、その時点のHuman指示から新しいObjectiveを確定してください。
