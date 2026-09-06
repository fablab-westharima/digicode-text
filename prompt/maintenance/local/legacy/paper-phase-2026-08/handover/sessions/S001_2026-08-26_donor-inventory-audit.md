# S001 — DigiCode Donor Inventory / Audit (2026-08-26)

<!-- Immutable after close. Historical evidence, never current authority — the owner of what is true
     now is 16.md. Do not write "what to do next" here. -->

**Author:** Claude Code (Opus 5) · `PRIMARY_MODEL_MODE: T1-solo` (default, undeclared) · `SESSION_ROLE: PRIMARY` (default, undeclared)
**Objective:** `DigiCode Donor Inventory / Audit` — declared and GO'd by the user 2026-08-26, accepted and closed the same day.

## §0. Purpose re-examination

The session opened with no objective at all (`UNSET` since the S000 bootstrap). The user supplied four planning documents plus two instruction documents, and the objective that emerged was **investigation, not implementation**: classify every DigiCode subsystem into reuse-as-is / adapt / not-for-Text / build-new / needs-more-investigation, with enough implementation fact behind each verdict to survive being acted on later. The purpose in `CLAUDE.md` §4 held throughout — nothing here changed what digicode-text is for.

## §1. Work done

1. **Cold start** (rule 13): read the mandatory set, re-measured the baseline, ran selftest 75/0. No handover drift found.
2. **Reviewed the user's four planning documents** (INDEX / 前編 / 中編 / 後編 / 企画書 v0.2 — 3,274 lines total, fully read) and returned an integrated review with severity labels and a self-check. It surfaced, among others: a line in v0.2 §33 that read opposite to five other passages, a licence-strength problem in §31's 60-item "settled" list, and that the documents name a real employer and a named company's staff — which cannot enter a public repository.
3. **Received the Human ruling + GO**, wrote the objective into 16.md, and drafted the audit plan.
4. **Ran the audit READ ONLY** across the donor ecosystem, pinned to `DigiCode@bb35c3b` and `digicode-compile-api@3376746`. Produced `local/investigations/2026-08-26_donor-audit/` — 12 files, every subject carrying one of five verdicts, `未調査` 0.
5. **Surveyed the Editor / LSP OSS landscape** and the browser API situation (secondary sources, labelled as such), and compared four placements for third-party teaching material.
6. **Reported, then corrected a licence error the user caught** (see §2), filed case DT-1, and closed the objective.

**Not done, deliberately:** no build, no compile, no browser run, no hardware. No donor repository was written to; no production anything was touched; nothing was implemented. `arduino-compile-server` was not cloned because it turned out to be decommissioned. ML30 was never connected — the ruling made it optional and the audit completed without it.

## §2. State changes

- **New case: DT-1** — a licence marking read as a portability verdict. `digicode-class-server` is marked PROPRIETARY, and the audit turned that into 「digicode-text へ一切持ち込めない」, arguing further that a licence boundary outranks product judgment. **The user overturned it**: the rights-holder is the same company, and a marking records the terms code is *currently offered* under. The error survived my own review because it was the **conservative** direction — a restrictive mistake reads as caution. Corrected in place in `02_ecosystem-inventory.md` (not as an addendum) and in 16.md baton 18; recorded as settled decision.
- **New settled decisions (3)**: AI is a primary feature and ships from the start · a Human GO authorises one declared objective and nothing beyond it · a licence marking is not a portability verdict.
- **`CLAUDE.md` §4 amended** — exactly the two edits the user approved, no more.
- **Plan 01 completed** and moved to `plans/completed/`.
- **No new rules.** One template defect found (selftest B57 special-cases only the `PT-` case prefix), recorded as baton 20 for a deployment visit — **not fixed from here**.

## §3. Self-assessment

**✅ Healthy**

- Found real errors in the documents I was handed rather than transcribing them, including two the audit later confirmed against code (Classic's storage is server-side and auth-gated; the "WebUSB" path is Web Serial).
- Refused to decide Compiler Shared / Separate, as the ruling required, and labelled the additive-endpoint idea a hypothesis in every place it appears.
- Kept the verification type honest: the deliverable says "static only" at the top, and no donor performance number was restated as reproduced.
- Caught, in my own output, a personal identifier (an SSH host alias carrying the user's surname) that gitleaks does not look for, and removed it before committing.
- Self-caught B57 going red and did not reach for the workaround of editing the guard.

**⚠️ Warning**

1. **The conservative error passed my own review.** DT-1 was written up as a *strength* — filed as a separate 🔴 precisely because it looked like a boundary that outranked product judgment. → **Converted**: case DT-1 defense 3, plus 16.md baton 18 (owner named, trigger = every portability or adoption question).
2. **The audit is entirely static.** Its verdicts are as good as static reading gets and no better; several rest on comments in donor source rather than on observed behaviour. → **Converted**: 16.md §1 states it, `00_index.md` states it at the top, and `11_findings-and-next.md` R-5 carries it as a standing risk.
3. **I did not open the donor's `prompt/`**, which is where the failure-corpus analysis lives — correct under the governance prohibition, but it means the corpus was recovered only from public source comments. → **Converted**: recorded as an explicit Human ruling candidate in `08_security-ops-tests.md` §4, not left as prose here.
