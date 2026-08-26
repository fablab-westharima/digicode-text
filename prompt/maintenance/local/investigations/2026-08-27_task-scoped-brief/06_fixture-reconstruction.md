# 06 — Task-scoped brief fixture reconstruction

**Packet:** `S009-L5-fixture-reconstruction`  
**Lane:** `VERIFICATION`  
**Authority:** delegated; integration owner = Claude Code harness session S009  
**Measurement state:** EXPECTED sets below were frozen at `2026-08-27T12:24:00+09:00`, before the probe existed and before any generated fixture output was observed.

## E1. Prototype

The prototype is confined to
`prompt/maintenance/local/investigations/2026-08-27_task-scoped-brief/probe/`:

- `generator.py` reads `16_…md`, `batons.md`, `evidence-map.md`, and `CLAUDE.md`; constructs L0/L1/L2/L3;
  validates owner reachability, three-way GEN equality, the 96-item population, the known CORE body
  signatures and the existing 128-KiB cap; and refuses writes outside `probe/`.
- `run_measurements.py` owns the six frozen fixtures, creates and confirms mutations only in
  `probe/work/`, runs the controls, writes generated briefs plus `measurements.json` under
  `probe/artifacts/`, and removes the throwaway copies after the run.
- Both source files begin with the required non-production declaration: **measurement instrument
  only**, **not a production implementation**, **no authentication**, **no error-handling
  guarantees**, and **no maintenance contract**. Nothing in `scripts/`, `.claude/`, `CLAUDE.md`, a
  hook or selftest references the probe. No live owner or production file was modified. `[static]`

Design decisions forced by underspecified candidate §3, all made before the first valid generation:

1. The item universe is exactly the candidate's 96: 48 positional `S3-NN` rulings from `16.md` §3
   and 48 `B-NN` baton rows. Baton inline bodies come from `batons.md`; baton INDEX stubs come from
   the router. `evidence-map.md` has no items in this universe.
2. Because the owners do not carry `S3-NN` IDs, S3 IDs are assigned by bullet order. This is
   deterministic at this HEAD but not stable across insertion/reordering.
3. The candidate supplies neither tags nor dependency edges. The probe freezes hand-authored broad
   route memberships; `PRODUCT_ARCH` intentionally covers Compiler, Registry and Device Knowledge
   together, and its route membership is used as a conservative dependency closure. Residual
   non-CORE items receive the broad `EVIDENCE` tag so no item is silently untagged. This is probe
   policy, not owner truth.
4. `route` is treated as the Objective domain (`HARNESS`, `PRODUCT_ARCH`, `EVIDENCE`) and `lane` as
   an orthogonal overlay. `VERIFICATION` adds B-40/B-54/S3-30; `FALSIFICATION` adds the measured
   attack-surface IDs. A FALSIFICATION lane without a recognizable domain therefore falls back full.
   This exposes the candidate's simultaneous use of `FALSIFICATION` as both a route and a lane.
5. All fixtures model `NO_REPO_ACCESS`, execution phase, investigative action. The packet gave no
   actor/phase/action values per fixture. Accordingly L0 and L1 bodies are inline.
6. `FULL_BRIEF` is implemented as all 96 item bodies inline plus the 96-entry L3 INDEX, preserving
   the proposed layered shape and making fallback loud. It is **not** byte-equivalent to the current
   `scripts/context-brief.sh` export; candidate §3.4 does not define which meaning is intended.
7. L0 contains purpose, GO/STOP, provenance, all three owner GEN values, owner manifest, status,
   route/reason, the not-authority notice and the candidate CORE12 bodies. L3 is rendered as a
   separate section although §3.2 also counts it inside “L0”; this avoids double delivery.
8. Control 8 requires more than ID presence. The probe uses literal semantic signatures for the
   known CORE12 bodies. This deliberately detects the named mutation but is a brittle fixed-set
   guard, not a proof of semantic completeness.
9. A control fallback is reported RED because the abnormal input was detected; the normal unknown
   fixture's same fail-closed fallback is counted as a successful fallback, not a failed generation.

The first attempted run failed before reading owners because the probe's repo-root index was wrong
(RC 1). The second failed on an English-only CORE signature against Japanese owner text (RC 1).
The third reached controls but stopped on a non-unique mutation anchor (RC 1). Those are instrument
errors and no value from them is used. A later run exposed escaped Markdown pipes being split as
table delimiters, which changed B-04/B-52 syntax; the parser was corrected and the final complete
run below produced false facts 0/6 fixtures. `[synthetic]`

## E2. The six fixtures' EXPECTED fact sets — frozen before generation

The order was: (1) read the candidate and the three live owners plus `CLAUDE.md`; (2) hand-derive the
sets below from owner triggers and rulings; (3) write this section; only after that may the generator
be created or run. At this point no generator output existed. IDs use `S3-NN` for the 48 §3 rulings
and `B-NN` for the 48 baton rows. Every set includes the 12-item objective-independent core:

`CORE12 = {S3-01,S3-02,S3-03,S3-06,S3-08,S3-20,S3-31,S3-38,S3-43,S3-46,S3-48,B-19}`.

The sets below are the facts needed for safe work, not predictions of what the candidate router will
select. An ID in L3 only will count as `DEGRADED`, not as inline recovery. Non-item L0 obligations
(purpose, GO/STOP boundary, provenance/GEN, owner manifest, route/fallback status and the
not-authority notice) are expected for all six fixtures and are checked separately from these item
sets.

The membership of these six sets was frozen before generation. The displayed cardinalities were
mechanically re-counted afterward to correct arithmetic labels only; no member was added or removed.

### Fixture 1 — Harness Maintenance

Objective: `Task-Scoped Context Brief / Read Architecture Maintenance`.

Expected 28 IDs:
`{CORE12,S3-04,S3-30,S3-39,S3-44,S3-45,S3-47,B-04,B-20,B-24,B-25,B-42,B-43,B-52,B-53,B-54,B-55}`.

Ground: routing values, read allowance/effort, cap history and current cap prohibition, the explicit
task-scoped-export ruling, probe-only status, current-owner topology, and known loss-detector blind
spots are all direct inputs to this maintenance objective.

### Fixture 2 — Product Architecture

Objective: `Managed Environment & Device Knowledge Architecture Design`.

Expected 63 IDs:
`{CORE12,S3-05,S3-07,S3-10,S3-11,S3-12,S3-13,S3-14,S3-15,S3-16,S3-17,S3-18,S3-19,S3-21,S3-22,S3-23,S3-24,S3-25,S3-26,S3-27,S3-28,S3-29,S3-32,S3-33,S3-34,S3-35,S3-36,S3-37,S3-40,S3-41,S3-42,B-02,B-03,B-13,B-15,B-18,B-21,B-27,B-28,B-29,B-32,B-34,B-35,B-36,B-38,B-39,B-40,B-45,B-47,B-48,B-50,B-51}`.

Ground: this is a broad cross-cutting architecture objective; the owner explicitly says it crosses
Compiler, Registry, Web/Desktop/Helper, compatibility, target-user, evidence-ground and instrument
validity constraints. Competitive items are limited to the load-bearing candidate/ground items, not
the whole competitor-audit population.

### Fixture 3 — Registry / Device Knowledge

Objective: `Registry / Device Knowledge`.

Expected 46 IDs:
`{CORE12,S3-05,S3-07,S3-10,S3-15,S3-21,S3-22,S3-23,S3-24,S3-25,S3-26,S3-27,S3-28,S3-29,S3-34,S3-35,S3-36,S3-37,B-02,B-03,B-13,B-15,B-18,B-21,B-29,B-32,B-35,B-38,B-39,B-40,B-45,B-47,B-48,B-50,B-51}`.

Ground: Registry lifecycle, managed-environment value, compatibility, Compiler/AI shared truth,
Device Knowledge and auto-UI input shape are direct. Desktop-only distribution, competitor market
coverage and unrelated harness mechanics are not required.

### Fixture 4 — Compiler

Objective: `Compiler`.

Expected 39 IDs:
`{CORE12,S3-05,S3-07,S3-10,S3-11,S3-12,S3-13,S3-15,S3-16,S3-21,S3-22,S3-23,S3-25,S3-29,B-02,B-03,B-13,B-15,B-18,B-21,B-24,B-28,B-29,B-32,B-34,B-35,B-40,B-48}`.

Ground: the dedicated-Compiler ruling, retained donor-technique boundary, build/source format,
managed-registry dependency truth, cloud-vs-local Desktop inversion, no-LSP Web completeness and
known invalid measurements are direct. Registry governance and Device Knowledge schema are not
needed merely to design Compiler boundaries.

### Fixture 5 — Generic unknown task

Objective: `Generic unknown task` (deliberately unclassifiable).

Expected 96 IDs: every `S3-01`–`S3-48` and every live baton ID
`{B-02,B-03,B-04,B-05,B-06,B-07,B-13,B-14,B-15,B-16,B-17,B-18,B-19,B-20,B-21,B-22,B-24,B-25,B-26,B-27,B-28,B-29,B-30,B-31,B-32,B-33,B-34,B-35,B-36,B-37,B-38,B-39,B-40,B-41,B-42,B-43,B-44,B-45,B-46,B-47,B-48,B-49,B-50,B-51,B-52,B-53,B-54,B-55}`.

Ground: §3.4 requires `FULL_BRIEF` for unresolved/unknown routing. With no semantic basis for
narrowing, a competent actor must receive the entire current-truth item population.

### Fixture 6 — FALSIFICATION task

Objective: `FALSIFICATION task — attack the task-scoped brief's load-bearing complement-visibility conclusion`.

Expected 29 IDs:
`{CORE12,S3-04,S3-30,S3-39,S3-44,S3-45,S3-47,B-04,B-19,B-20,B-24,B-25,B-40,B-42,B-43,B-52,B-53,B-54,B-55}`.

Ground: the attack needs the same context-brief/read-architecture surface as fixture 1 plus the
positive-control/remeasurement limitation (`B-40`) and the evidence-before-conclusion rule. It does
not need unrelated product facts merely because its lane is adversarial.

## E3. Per-fixture reconstruction table

All token values are **estimates = UTF-8 bytes / 4**, not tokenizer measurements. `Recovered` means
expected and inline. `DEGRADED` means expected but L3 INDEX-only. The complete per-ID lists and
SHA-256 values are in `probe/artifacts/measurements.json`. `[synthetic]`

| fixture | expected facts | recovered inline | DEGRADED (index-only) | misses | false facts | wrong owner | unnecessary inline | bytes | estimated tokens (B/4) | route | fallback? |
|---|---:|---:|---|---:|---:|---:|---:|---:|---:|---|---|
| Harness Maintenance | 28 | 28 | 0 | 0 | 0 | 0 | 4 | 66,403 B | 16,600.75 est tok | `HARNESS` | no |
| Product Architecture | 63 | 63 | 0 | 0 | 0 | 0 | 12 | 97,477 B | 24,369.25 est tok | `PRODUCT_ARCH` | no |
| Registry / Device Knowledge | 46 | 46 | 0 | 0 | 0 | 0 | 29 | 97,477 B | 24,369.25 est tok | `PRODUCT_ARCH` | no |
| Compiler | 39 | 38 | **1: B-24** | 0 | 0 | 0 | 37 | 97,477 B | 24,369.25 est tok | `PRODUCT_ARCH` | no |
| Generic unknown task | 96 | 96 | 0 | 0 | 0 | 0 | 0 | 116,855 B | 29,213.75 est tok | `FULL_BRIEF` | **yes** — unresolved |
| FALSIFICATION task | 29 | 29 | 0 | 0 | 0 | 0 | 67 | 116,873 B | 29,218.25 est tok | `FULL_BRIEF` | **yes** — no domain match |

Denominators: expected facts = 301 item occurrences across six fixtures; inline recovery = 300/301;
DEGRADED = 1/301; misses = 0/301. Visibility recovery (inline + index-only) = **301/301**. False facts
= 0 asserted source items across 449 inline item occurrences. Wrong-owner paths = 0 across 449 inline
item occurrences. Unnecessary facts are judged against the frozen fixture expectations; full lists
are in the JSON artifact. The three `PRODUCT_ARCH` fixtures are byte-identical in size and inline
75/96 items each, demonstrating that the six-route compression does not task-scope within that
domain.

## E4. Negative and positive controls

Every negative control used a fresh four-file copy beneath `probe/work/`; helpers asserted the
mutation anchor existed, the content changed, and the old form no longer remained where an all-match
mutation was intended. The directory was deleted only after results were written. No live owner was
mutated. `[synthetic]`

| control | result | what caught it |
|---|---|---|
| Positive: unmutated copy | **GREEN** | 96 unique items; CORE signatures; three owner pointers; GEN equality; expected `HARNESS` route |
| 1. Delete critical Human ruling S3-08 | **RED** | `RULING_SET:47/48` |
| 2. Force wrong route/owner selection | **RED** | expected route check: `HARNESS != EVIDENCE` |
| 3. Force no owner | **RED** | `ERROR_NO_OWNER`, **0 inline / 96 INDEX** — abnormality remained visible |
| 4. Stale baton-owner GEN | **RED** | three-way GEN mismatch: `S007-stale` vs two `S008-close` |
| 5. Break baton owner pointer | **RED** | `OWNER_POINTER_BROKEN:local/handover/batons.md` |
| 6. Ambiguous Objective (`Compiler` + `Context Brief`) | **RED** | multi-domain ambiguity caused loud `FALLBACK_FULL` |
| 7. Product task mislabeled with harness vocabulary | **RED** | `HARNESS + PRODUCT_ARCH` ambiguity caused loud `FALLBACK_FULL` |
| 8. Replace S3-43 prohibition body, keep positional ID | **RED** | `ALWAYS_SEMANTIC_GUARD` found all four required clauses absent |

Detection denominator: positive controls GREEN = 1/1; negative controls RED = **8/8**; negative
controls GREEN = 0/8. Controls 2 and 3 include explicit route fault injection; controls 6 and 7
show detection/fallback, not correct semantic classification. This control suite therefore has
detection power for the injected shapes but does not validate arbitrary Objectives.

## E5. Control 8 — prohibition removed, ID retained

The throwaway router retained 48 §3 bullets, so the 43rd positional item still generated ID
`S3-43`. Its full 128-KiB / no-further-raise / no-current-truth-deletion body was replaced with
`See S3-31.` The ordinary population and ID checks remained satisfiable, but the added fixed CORE
signature guard went **RED** on missing `128 KiB`, `上げてはならない`, `current truth`, and `削る`.
Thus this probe did **not** reproduce B71's green result for the chosen known CORE item. `[synthetic]`

The limitation is load-bearing: this is not a general semantic checker. It knows literal signatures
for the candidate's 12 predeclared CORE items only. The independent L4 result in `04_…md` D8(b)
classifies 19 ALWAYS items; a newly classified prohibition has no signature until a human adds one.
L3 by itself would still show only the ID and stub and cannot prove that the body retained its
prohibition. Control 8 therefore validates the extra fixed guard, **not** the candidate's general
claim that an ID makes semantic loss impossible.

## E6. Before/after comparison

The before artifact was generated once with `bash scripts/context-brief.sh` (RC 0) into the probe
directory: 102,782 B. Current full brief estimated tokens = 102,782/4 = 25,695.50 est tok. The
current artifact contains one occurrence each of the router current-position section, baton-body
section and evidence-map section: 3/3 current-state owner contents. `[synthetic]`

| metric | current full brief | Harness | Product Arch | Registry | Compiler | Unknown | FALSIFICATION |
|---|---:|---:|---:|---:|---:|---:|---:|
| brief bytes | 102,782 B | 66,403 B | 97,477 B | 97,477 B | 97,477 B | 116,855 B | 116,873 B |
| delta vs full | — | -36,379 B (-35.39%) | -5,305 B (-5.16%) | -5,305 B (-5.16%) | -5,305 B (-5.16%) | +14,073 B (+13.69%) | +14,091 B (+13.71%) |
| estimated tokens = B/4 | 25,695.50 | 16,600.75 | 24,369.25 | 24,369.25 | 24,369.25 | 29,213.75 | 29,218.25 |
| current-state owner count read | 3 owners | 3 | 3 | 3 | 3 | 3 | 3 |
| item-body owner count selected | 2 owners | 2 | 2 | 2 | 2 | 2 | 2 |
| item delivery inline / index-only / absent | 96 / 0 / 0 | 32 / 64 / 0 | 75 / 21 / 0 | 75 / 21 / 0 | 75 / 21 / 0 | 96 / 0 / 0 | 96 / 0 / 0 |
| frozen-expected cold-start visibility | full owner export | 28/28 | 63/63 | 46/46 | 39/39 (38+1 degraded) | 96/96 | 29/29 |
| complete current-owner truth | 3/3 owner bodies | **NO** — evidence-map body 0/1; fact denominator NOT OBTAINED | same | same | same | same | same |
| false facts | NOT OBTAINED for current export | 0 | 0 | 0 | 0 | 0 | 0 |
| generation time | NOT OBTAINED in this lane | 85.394 ms | 89.475 ms | 84.369 ms | 85.339 ms | 85.804 ms | 85.751 ms |

Generation-time denominator = six single-process fixture generations; mean 86.022 ms, median
85.573 ms, min 84.369 ms, max 89.475 ms. These are wall-clock probe times on this host, not a
latency service-level measurement.

Rate denominators over the six fixtures:

- wrong-owner rate = **0/6 fixtures (0%)**; wrong-owner means at least one inline item points to the
  wrong source owner. Auxiliary wrong-route rate = **1/6 fixtures (16.67%)**, the FALSIFICATION
  fixture's fallback instead of expected `HARNESS` domain.
- no-owner rate = **0/6 fixtures (0%)** in normal runs. The injected no-owner control was 1/1 RED.
- fallback rate = **2/6 fixtures (33.33%)**: unknown and FALSIFICATION.
- false-fact fixture rate = **0/6 fixtures (0%)**.
- frozen-expected visible-completeness rate = **6/6 fixtures (100%)**, but complete-current-owner
  truth rate is **NOT OBTAINED** because the catalog scans 0 evidence-map facts.

Other required comparison rows:

- **L3 cost:** 27,202–27,458 B across six outputs, not the candidate's inferred ~7.7 KiB. The measured
  INDEX is about 3.45–3.48 times that estimate and by itself is 26.47–26.71% of the current full brief.
- **Cap:** all 6/6 outputs are below 131,072 B; maximum = 116,873 B. No cap was changed.
- **Read-load:** `bash scripts/read-load.sh` RC 0 measured 62,570 estimated tokens / 48,000 estimated-token
  allowance, inputs 7/7, `WARNING`. Because the probe is deliberately unwired, after-install
  operational read-load change is **NOT OBTAINED**; the current value is unchanged.
- **Brief↔packet duplication:** cited, not re-measured, from `04_duplication-and-crosscheck.md` D5:
  three packets / 28,942 B total; `CITABLE` gross duplicated line weight 6,879 B / 28,942 B = 23.77%,
  `MUST_DUPLICATE` 473 B and `PACKET_NATIVE` 21,590 B. This is a gross upper-bound proxy, not net
  saving. Duplication against the new prototype outputs is **NOT OBTAINED**.

## E7. Findings about the candidate architecture

1. **The narrow L3 claim held for the catalog:** across 301 frozen expected item occurrences,
   300 were inline, one (Compiler B-24) was INDEX-only, and zero were absent. The no-owner control
   made the abnormal state visible as 0 inline / 96 INDEX. Within this fixed 96-ID universe, silent
   absence was converted to visible index-only delivery.
2. **The catalog is not the complement of current truth.** The 96 items cover only `16.md` §2/§3.
   `evidence-map.md` owns donor pins, evidence read order, closed-output paths, loop position and the
   feedback queue; none is an item (scanned denominator = 0). The current full artifact contains
   those sections; all six task outputs contain only its GEN/path manifest, not its facts. Therefore
   an entire owner's facts can be silently outside L3 while `INDEX_COUNT: 96` remains green.
3. **The CORE set is already disputed.** Candidate `02/05` uses ALWAYS 12. Concurrent independent
   `04_…md` D8(b) reclassified the same 96 as ALWAYS 19 / OBJECTIVE_SCOPED 77 / AMBIGUOUS 0. The seven
   additions are B-04, B-25, B-43, B-44, B-52, S3-04 and S3-47. Until adjudicated, the L0 single
   failure point has no settled membership; this probe implemented the candidate's 12, not L4's 19.
4. **ID visibility is not semantic visibility.** Control 8 went RED only because the probe added a
   literal signature contract absent from the candidate. L3 would accept an ID plus hollow stub.
   The guard is brittle under legitimate rewording and has no coverage for unanticipated critical
   facts or the seven disputed additions.
5. **The route compression barely reduces product exports.** Product Architecture, Registry and
   Compiler all delivered the same 75/96 items and 97,477 B. Relative to their frozen expectations,
   unnecessary inline facts were 12, 29 and 37. Compiler's measurement-only B-24 was nevertheless
   degraded because no dependency edge was specified.
6. **FALSIFICATION is underspecified twice.** §3.3 lists it as a route while also calling lane an
   orthogonal axis. With no product/harness domain noun, the fixture fell back full, producing
   67 unnecessary facts and a payload 13.71% larger than current full.
7. **`FULL_BRIEF` has no defined representation.** “All 96 bodies + INDEX” preserved the new schema
   but grew beyond current full and still omitted evidence-map facts. “Invoke the current full brief”
   would preserve truth but drop the new L3 structure unless wrapped, likely increasing size again.
   Candidate §3.4 must pick and specify one.
8. **Tags and dependencies have no owner or GEN.** The probe's embedded metadata is a fourth truth
   surface with no maintenance contract. The proposed fail-full rule for untagged items cannot see a
   wrong tag, a missing dependency edge, or a newly added non-item owner fact.
9. **Positional S3 IDs are unstable.** A new ruling inserted above S3-43 changes every later ID while
   keeping a 48-entry index. Stable IDs must live in an owner or an explicitly governed catalog for
   references to survive edits.
10. **The size premise was materially wrong.** L3 measured 27.2–27.5 kB, about 3.5x the inferred
    7.7-KiB estimate. “It got smaller” fails for 5/6 fixtures if the useful threshold is substantial
    reduction: three product variants save only 5.16%, and two fallback paths grow 13.7%.

Verification labels: source/catalog/header checks `[static]`; fixture generation, byte counts,
expected reconstruction and controls `[synthetic]`. `API-smoke`, `visual`, and `real-fire` were not
run: no application or external API exists in this packet. The repository-wide mutation harness was
not run; this packet's isolated controls are the relevant mutation evidence.

## E8. One-line verdict on the design claim

**LIMITED YES for the predefined 96-ID catalog (301/301 expected occurrences visible, including 1 degraded); NO for “all current truth,” because evidence-map facts are outside the INDEX and ID/stub presence alone does not preserve prohibition semantics.**

## Verification record

- `[synthetic]` `python3 prompt/maintenance/local/investigations/2026-08-27_task-scoped-brief/probe/run_measurements.py`
  → RC 0; fixtures 6/6 generated; positive control GREEN 1/1; negative controls RED 8/8.
- `[synthetic]` `bash scripts/context-brief.sh > …/probe/artifacts/current-full-brief.md` → RC 0;
  `wc -c` = 102,782 B.
- `[synthetic]` `bash scripts/read-load.sh` → RC 0; inputs 7/7; 62,570 estimated tokens /
  48,000 estimated-token allowance; `WARNING`.
- `[synthetic]` `bash scripts/selftest.sh` → RC 0; **78 passed / 0 failed**.
- `[static]` forbidden-reference scan over `scripts`, `.claude`, and `CLAUDE.md` → 0 references to
  the probe. `git diff --name-only` over those paths, the three live owners and `global/` → empty.
- `[static]` final `git status --short` showed only the expected untracked concurrent investigation
  directory and `plans/active/10_task-scoped-context-brief-read-architecture.md`; no unexplained
  tracked delta was observed.
- Not run: application tests (no application code), API-smoke, visual, real-fire, production mutation
  harness, effort remeasurement, or brief↔packet duplication remeasurement.
