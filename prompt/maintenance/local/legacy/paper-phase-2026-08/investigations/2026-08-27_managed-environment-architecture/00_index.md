# 00 — index: Managed Environment & Device Knowledge Architecture Design (S010, 2026-08-27)

**Objective:** `Managed Environment & Device Knowledge Architecture Design` — an **Architecture Design
Objective**, not a production implementation GO. Plan register:
`local/plans/active/11_managed-environment-device-knowledge-architecture.md`.

**Ground this objective stands on** (baton 39 requires this to be declared at open): NOT the refuted
P8 ranking ("Registry is what comes next"), but S007-supported ⑥ (AI library hallucination in embedded
code generation is real) + ⑦ (managed/verified environment mechanisms have prior implementations) +
the Human-supplied structural account of Classic's per-addition cost (`16.md` §3, 2026-08-27).

---

## 🔴 Read order

| # | File | What it is | Read it |
|---|---|---|---|
| 1 | `01_classic-per-addition-cost.md` | **L1 INVESTIGATION** — donor measured from source: the real per-addition surface, where cost concentrates, the coupling map with denominators, **what is already data-driven**, industrial-IoT implementation depth, the auto Web UI's actual schema | for any Classic-cost or donor-asset question |
| 2 | `02_hypothesis-falsification.md` | **L3 FALSIFICATION** — seven attacks on the central hypothesis, run **before** any design. Verdicts + **"what survives"** | 🔴 **before believing any cost claim** |
| 3 | `03_prior-art-models.md` | **L2b INVESTIGATION** — ESPHome / Home Assistant / Particle / Viam / Arduino / PlatformIO / Embedder: actual field lists, Verified lifecycles, canonical-vs-instance boundary, reproducibility artifacts. Fresh Particle coverage **10/977 = 1.02 %** | for any schema, vocabulary or prior-art question |
| 4 | `05_integration-falsification.md` | **L4 FALSIFICATION** — audit of the integration: **36 of 71 claims failed (50.7 %)** | 🔴 **read this before `04` or `06`** |
| 5 | `06_corrected-architecture.md` | **CURRENT** — the corrected architecture. Identical to the Human-facing report at `~/Downloads/DigiCode_Text_Managed_Environment_Device_Knowledge_Architecture_Design_Report_2026-08-27.md` | 🔴 this is the design of record |
| — | `04_integrated-architecture.md` | **SUPERSEDED** pre-falsification draft, kept as the audit trail only | only to check a correction |

**Why the order matters:** `04` is corrected by `05`. Opening `04` alone carries away 36 claims that
did not survive — the same hazard as S007's `08` vs `09` (case DT-6), which is why the order is
written here and a banner sits at the top of `04`.

## Lanes dispatched

| Lane | Packet | Type | Verdict |
|---|---|---|---|
| L1 | `S010-L1-classic-cost` | INVESTIGATION | PASS |
| L2 | `S010-L2-prior-art` | INVESTIGATION | **ERROR / INVALID_MEASUREMENT** — the read-only sandbox had no network (`curl` RC=6, DNS). A correct fail-closed return; recorded rather than discarded |
| L2b | `S010-L2b-prior-art` | INVESTIGATION | PASS (network-enabled redispatch) |
| L3 | `S010-L3-hypothesis-falsification` | FALSIFICATION | PASS · the hypothesis is REFUTED in its universal form |
| L4 | `S010-L4-integration-falsification` | FALSIFICATION | PASS · 36/71 defects · `HUMAN_DECISION_REQUIRED: YES` |

**No second wave was dispatched.** The three first-wave lanes did not disagree, and the residual
evidence gaps (L3/A1 total cost, L3/A5 AI throughput) are gaps a *measurement* closes, not another
lane — dispatching one would have been "we could check a bit more", which the 2026-08-27 Human
directive excludes as a reason to add lanes.

## Donor pins verified this session

`DigiCode bb35c3b8025610299bf952c2c45eda2196a07401` · `digicode-compile-api
3376746f1e5a4ca039e0cade279741f16612fccf` · `DigiCode-Helper fa95dfd67ee83d881f93be7641cc9cef171165a2`
— 3/3 match, `git status --short` entries 0 in all three. Read-only throughout; no donor `prompt/`
directory was opened.

## Standing caveat

Everything here measures the **donor**, **public prior art**, and **this document set**. **Nothing
here measures the proposed architecture**, which does not exist: no schema is implemented, no
validator runs, no ERA is computed, no compile has been made against it. Every claim about Option C's
behaviour is a design claim with a falsification test attached, and `06` labels them as such.
