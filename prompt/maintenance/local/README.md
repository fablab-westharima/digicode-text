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

🔴 **2026-08-29: HumanによりS010は分割受理され、BLOCKEDは解除されました。**

* 反証系の結論(中心仮説のREFUTED、S007の旧根拠反証)と実測値は**受理**
* **Option Cの採用は受理されていません** — Option Cは**PoCの作業仮説**であり、R-1/R-2/R-7はPoCが実地検証する
* D-1〜D-8は決定済み、次段階はPoC(実装段階)

裁定本文のownerは `docs/human-decisions.md` です。旧Plan 11はlegacyへ退役済みで、そのまま再実行しません。

PoCへ進む場合も、scopeと着手にはHuman GOが必要です。
