# DigiCode Text — Evidence Index

このファイルは主要なproject evidenceへのnavigationだけを持ちます。

current instruction、current Objective、Human ruling、orchestration ruleのownerではありません。
測定値や結論本文はここへ複製せず、各investigationを一次参照してください。

## Product / technical evidence

| Session | 主題 | Evidence |
|---|---|---|
| S001 | DigiCode Donor Inventory / Audit | `../investigations/2026-08-26_donor-audit/` |
| S002 | Compiler Shared / Separate probe | `../investigations/2026-08-26_compiler-shared-probe/` |
| S003a | Editor / LSP Technical Spike | `../investigations/2026-08-26_editor-lsp-spike/` |
| S003b | Local LSP Helper Feasibility | `../investigations/2026-08-26_local-helper-feasibility/` |
| S005 | Product Value Revalidation | `../investigations/2026-08-26_product-value-revalidation/` |
| S007 | Practical IoT Competitive & DigiCode Capability Revalidation | `../investigations/2026-08-26_practical-iot-revalidation/` |
| S010 | Managed Environment & Device Knowledge Architecture Design | `../investigations/2026-08-27_managed-environment-architecture/` |

## Historical Harness investigations

以下もevidenceとして保存しますが、現在のClaude Code運用設計として自動適用しません。

| Session | 主題 | Evidence |
|---|---|---|
| S006 | Full Orchestration Re-Audit | `../investigations/2026-08-26_orchestration-re-audit/` |
| S008 | Handover / Context-Brief / Read-Load Architecture | `../investigations/2026-08-27_handover-architecture/` |
| S009 | Task-Scoped Context Brief / Read Architecture | `../investigations/2026-08-27_task-scoped-brief/` |

## Important reading order

### S007

`00_index.md`
→ `09_integration-falsification.md`
→ `08_conclusion-and-next.md`

`08`の統合は`09`の反証を受けています。訂正前の統合だけを単独でcurrent conclusionとして扱わないでください。

### S009

現行結論を確認する場合は、少なくとも:

`08`
→ `09`

の順序関係を維持してください。

`05`および`07`はsupersededな統合としてhistorical evidenceに残っています。

### S010

`00_index.md`
→ `01` / `02` / `03`
→ `05_integration-falsification.md`
→ `06_corrected-architecture.md`

`04`は訂正前のSUPERSEDED版です。

S010のHuman acceptanceは未取得です。
設計結果をproduction implementation GOとして扱わないでください。

## Session history

過去の作業経緯は:

`../handover/sessions/`

索引は:

`../handover/改定log.md`

に保存されています。

session historyに書かれた「next」「GO待ち」「model」「lane」「Harness」等は当時の記録であり、現在の作業指示ではありません。
