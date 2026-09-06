# 08 — `07_revised-conclusion.md` integration falsification

- Packet: `S009-L6-integration-falsification`
- Lane: `FALSIFICATION`
- Authority: delegated; integration owner = Claude Code harness session S009
- Target: the Harness-authored integration, not the five workers' evidence
- Verification labels: repository/source comparison is `[static]`; arithmetic over already-generated artifacts and Git inventory commands are `[synthetic]`. The probe was not regenerated. `API-smoke`, `visual`, and `real-fire` were not run.

## F1. Claim-by-claim table over all of `07_…md`

### Method and denominator

I enumerated **91 factual claim units / 91 assessed**. A claim unit is one independently falsifiable proposition; a metric vector sharing one source and one interpretation is one unit, while a later causal interpretation of that vector is a separate unit. Headings, quotations explicitly attributed to another file, questions put to the Human, and pure normative labels such as severity icons are not separately counted unless the integration asserts their truth. Every prose paragraph, table row, and absence row in `07` was covered. Status totals are **SUPPORTED 59 / OVERSTATED 20 / UNSUPPORTED 6 / CONTRADICTED 6 = 91**.

Abbreviations below are relative to `prompt/maintenance/local/investigations/2026-08-27_task-scoped-brief/`: `01`–`07` mean the correspondingly numbered report; `M` means `probe/artifacts/measurements.json`; `16` means `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`.

| ID | `07` line(s) | factual claim unit | verdict | primary evidence / reason |
|---|---:|---|---|---|
| C001 | 3–5 | `07` is Harness integration and `01`–`04`, `06`, artifacts outrank it | SUPPORTED | `01:3-7`, `02:3-7`, `03:1-6`, `04:3-7`, `06:3-6` identify independent packets/lanes; the priority statement is also the target's declared evidence contract. |
| C002 | 7 | this is the pre-Human falsification version | SUPPORTED | `16:208` requires Harness integration/report to be a verification target; `07:218` records the active falsification. |
| C003 | 13,23 | v1 has exactly five corrections, exactly two “central” | OVERSTATED | Five table rows are observable, but “central” is an unmeasured editorial classification; `06:E7` records ten candidate defects, not this two-item partition (`06:256-294`). |
| C004 | 17 | L3 is 27,202–27,458 B, 3.45–3.48× the estimate, 26.5–26.7% of current full | SUPPORTED | `06:245-246`; v1 estimate at `05:113-117`. |
| C005 | 18 | fixture delta vector is Harness −35.39%, three product fixtures −5.16%, unknown +13.69%, falsification +13.71% | SUPPORTED | `06:215-219`. |
| C006 | 18 | “削減は 1 件だけ” / “小さくなる is false for 5/6” | CONTRADICTED | The same table has **4/6 payloads smaller** (Harness plus all three product fixtures), `06:217-219`. `06:292-294` only says 5/6 fail **if the threshold is substantial reduction**; `07` dropped that condition. |
| C007 | 19 | 96-item catalog excludes evidence-map facts, so `INDEX_COUNT:96` can remain green while those facts disappear | SUPPORTED | `06:262-266`; complete-current-owner fact denominator is not obtained at `06:224,240-241`. |
| C008 | 20 | candidate CORE12 conflicts with L4 ALWAYS19 | SUPPORTED | `04:219-223,331-345`; `06:267-270`. |
| C009 | 21 | v1 mixed FALSIFICATION route and lane; fixture fell back | SUPPORTED | v1 route at `05:145-155`; `06:36-39,279-281`. |
| C010 | 23 | T2 and T3 are the two central refutations | OVERSTATED | T3 is supported, but T2 as written is contradicted by 4/6 negative byte deltas (C006); “central” has no primary-evidence criterion. |
| C011 | 29–34 | Human chose menu order 1→2 because product design risks another context-delivery problem | SUPPORTED | `16:25-35`. |
| C012 | 38 | current full artifact is 102,782 B / 96 of 96 inline | SUPPORTED | `06:210-223`. |
| C013 | 39 | Harness fixture is 66,403 B / −35.39% / 32 of 96 inline | SUPPORTED | `06:154,217-223`. |
| C014 | 40 | Product fixture is 97,477 B / −5.16% / 75 of 96 | SUPPORTED | `06:155,217-223`. |
| C015 | 41 | Registry fixture has the same vector | SUPPORTED | `06:156,217-223`. |
| C016 | 42 | Compiler fixture has the same byte/inline vector | SUPPORTED | `06:157,217-223`; one expected item is INDEX-only, a limit omitted in this table. |
| C017 | 43 | unknown fallback is 116,855 B / +13.69% / 96 of 96 | SUPPORTED | `06:158,217-223`. |
| C018 | 44 | FALSIFICATION fallback is 116,873 B / +13.71% / 96 of 96 | SUPPORTED | `06:159,217-223`. |
| C019 | 46 | the cause is not classifier performance but current-truth dependency structure | CONTRADICTED | Probe policy deliberately made `PRODUCT_ARCH` a broad conservative closure (`06:31-35`), and all three fixtures therefore share 75 items (`06:165-167`). The measurement cannot separate owner dependency from hand-authored route membership. |
| C020 | 47–48 | frozen expected-set cardinalities are Product 63 / Registry 46 / Compiler 39 | SUPPORTED | `06:90-123`; frozen-before-generation qualification at `06:61-77`. |
| C021 | 49–50 | Managed Environment design crosses the named baton set and multiple rulings | SUPPORTED | `02:188-199`, especially `02:197`; the proposition is an inference in the source, not a measured dependency graph. |
| C022 | 51 | product architecture genuinely needs most current truth | OVERSTATED | 63/96 is a hand-derived expected set (`06:94-100`), not an externally checked ground truth; complete-current-owner truth is NOT OBTAINED (`06:224,240-241`). F2 independently derives 55 under the comparable CORE12 rule, or 62 after adding L4's seven disputed safety items. |
| C023 | 53–54 | unconditional L3 costs about 27 kB and reduces the benefit of inline removal | SUPPORTED | `06:245-246`; all fixtures contain an INDEX (`06:222`). “all route” applies to this probe design, not every possible design. |
| C024 | 56–57 | the S008→S009 task-scope assumption does not hold against this measurement | OVERSTATED | It does not hold for the **probe's six broad routes and chosen representation**. `06:31-50,282-288` states the hand-authored policy, undefined FULL_BRIEF, and unowned metadata limits; no alternative route table was measured. |
| C025 | 58–59 | only Harness establishes reduction | CONTRADICTED | Four fixtures are smaller in bytes (`06:217-219`). No “meaningful reduction” threshold was declared, so excluding three −5.16% results is post-hoc. |
| C026 | 61–62 | measurement exposed a v1 reversal that v1 would not have told the Human | SUPPORTED | v1 estimated L3 and claimed reduction room (`05:21,113-117`); `06:245-246,292-294` reverses/limits those claims. |
| C027 | 68 | measurements support safety improvement separately from reduction | OVERSTATED | `06:188-191` limits controls to injected shapes and says arbitrary Objectives are unvalidated; `06:201-206` limits semantic coverage to a fixed CORE12 guard. This supports local detection, not general safety. |
| C028 | 72 | frozen expected visibility is 301/301, with 300 inline, 1 index-only, 0 absent | SUPPORTED | `06:161-167,258-261`. Limited to the frozen 96-ID catalog. |
| C029 | 72 | no-owner becomes visible as 0 inline / 96 INDEX | SUPPORTED | `06:181,258-261`. It is an injected shape, not arbitrary-objective validation (`06:188-191`). |
| C030 | 72 | controls are 8/8 negative RED and 1/1 positive GREEN | SUPPORTED | `06:176-191,307-308`. The integration table drops the suite's detection-scope limit. |
| C031 | 73 | 6,879 B = 23.77% is replaceable by ID references | OVERSTATED | Measured gross duplicated line weight is supported, but “replaceable” is inferred and **not net saving**; reference bytes were not designed (`04:157-175`). |
| C032 | 74 | current brief has zero GEN, and a probe GEN mismatch control went RED | SUPPORTED | current zero at `01:70-80`; control at `06:182`. The RED proves the implemented equality check only. |
| C033 | 76 | all three levers work independently of size | CONTRADICTED | Duplication removal is itself a size lever. L3 visibility and GEN validation can be discussed separately from byte reduction, but the grouped statement is false as written; D5 explicitly measures byte weight (`04:157-164`). |
| C034 | 76–78 | the objective's result is visibility + deduplication + freshness, not brief reduction | UNSUPPORTED | This is an integration/adoption judgment. Primary evidence supports bounded candidates, with limits (`02:265-276`, `04:164-175`, `06:301-303`); rule 24 reserves acceptance and next-phase framing to the Human (`24:227-242`). |
| C035 | 86–89 | L2 says 12/82/2 and L4 says 19/77/0 | SUPPORTED | `02:13-17`; `04:219-223`. |
| C036 | 91 | L4's seven additions are B4/B25/B43/B44/B52/S3-04/S3-47 | SUPPORTED | `04:331-343`; `06:267-270`. |
| C037 | 92–94 | L4 used symmetrical application; B52 duplicates S3-43's boundary | SUPPORTED | `04:333-345`; owner texts at `16:124,203`. |
| C038 | 95–101 | the lanes diverge over whether a twin-bearing item is itself ALWAYS | SUPPORTED | L2 explicitly treats B52 as scoped because S3-43 carries the clause (`02:120`); L4 explicitly rejects that logic (`04:341`). |
| C039 | 102 | this is a definition problem, not a measurement problem | OVERSTATED | It is also a schema/dependency and failure-model problem: L2 defines classification over **item absence alone** (`02:13-16`), while L4 classifies duplicated obligations symmetrically (`04:221,331-345`). The instruments exposed a mismatch in unit, not merely a choice of definition. |
| C040 | 102–104 | L4 is the safe reading because a twin deletion was measured | OVERSTATED | Control 8 replaced S3-43 and was killed by a newly added literal signature, not by dependency/twin delivery (`06:193-206`). It does not establish that classifying both twins ALWAYS is safer than an edge or a semantic obligation group. |
| C041 | 106–109 | the correct fix is dependency edges rather than CORE19 | UNSUPPORTED | L2 names missing edges as a risk (`02:197,201-202`); no primary evidence verifies this design, and `07:109,212` admits it is unverified. Calling it “correct” adopts an untested design. |
| C042 | 109 | Human adjudication and later verification are required | SUPPORTED | unsettled classifications and unverified edge are recorded at `06:267-278`; rule 24 reserves scope/phase decisions (`24:227-242`). |
| C043 | 113–114 | evidence-map donor pins, closed outputs, loop/queue can fall outside catalog while count stays green | SUPPORTED | `06:262-266`; evidence-map content at `evidence-map:14-104`. |
| C044 | 115 | S007 read order exists only in evidence-map | CONTRADICTED | The same critical order is deliberately duplicated in current router `16:46-48`. Evidence-map also carries it, but it is not “ここにしか無い.” |
| C045 | 117–119 | three catalog options exist; Human decides; Harness prefers itemization; cost unmeasured | SUPPORTED | Cost absence at `06:224,240-241`; Human authority at rule 24 `227-242`. The three-option set and preference are Harness proposals, not evidence conclusions. |
| C046 | 123–127 | control 8 RED depended on fixed CORE signatures, not L3 alone | SUPPORTED | `06:48-50,193-206,271-274`. |
| C047 | 129 | literal signature guard breaks under legitimate rewording | SUPPORTED | `06:201-206,271-274`; baton-54 precedent is cited by `02:229-239`. |
| C048 | 130 | no executable general semantic-sufficiency guard exists | SUPPORTED | `02:218-241`; baton 54 body summarized at `02:231-239`. This is current-model scope, not a proof of impossibility forever. |
| C049 | 138 | route/lane collision is a measured defect | SUPPORTED | `06:279-281`. |
| C050 | 139 | FULL_BRIEF representation is undefined | SUPPORTED | `06:42-44,282-285`. |
| C051 | 140 | tags/dependencies lack owner and GEN, creating a fourth truth surface | SUPPORTED | `06:286-288`. |
| C052 | 141 | positional S3 IDs are unstable | SUPPORTED | `06:29-30,289-291`. |
| C053 | 142 | product route compression yields identical 75/96 | SUPPORTED | `06:165-167,275-278`; this is a property of the probe route table, not current truth. |
| C054 | 143 | fallback is 2/6 and about 13.7% larger | SUPPORTED | `06:232-239`; exact deltas at `06:217-219`. |
| C055 | 149–160 | baton25 literal “no derivation” claim is false; derivation is bootstrap-era; current inputs remain unverified; no adoptable number; re-ruling is Human's | SUPPORTED | `03:30-78,149-197`; cross-check `04:177-203`. |
| C056 | 162 | read-load under-reports effective payload by 728 estimated tokens (1.2%) | SUPPORTED | `03:165-177`. “1.2%” is arithmetic relative to 62,570, not a tokenizer measurement. |
| C057 | 166 | effective effort is medium in 2,095/2,095 records, 1,020/1,020 IDs, 8 files | SUPPORTED | `03:288-315`. Conditioned at the timestamp in C9. |
| C058 | 167–168 | canonical model matching strips `[1m]`; per-model wins over top-level | SUPPORTED | `03:239-286`. Historical launch arguments were not obtained (`03:280-286`). |
| C059 | 169 | the Human edit is exactly per-model medium→xhigh | SUPPORTED | `03:317-327`. It is a proposal to the Human, not an adopted setting. |
| C060 | 170–171 | effort index is 0.76→1.6 (~2.11×), actual latency/token/billing unmeasured, rollback needs new transcript | SUPPORTED | `03:324-335`. |
| C061 | 173 | all S000–S009 work was medium | OVERSTATED | C9 measured a live corpus of 8 top-level files at one timestamp, not an explicit conditioned denominator for every named session S000–S009 (`03:290-315`); historical launch arguments were not obtained (`03:280-286`). Current baton only asserts S000–S008 (`16:115`). |
| C062 | 179–181 | rule/template demand verbatim critical stops and five selected STOP_IF lines are paraphrased | SUPPORTED | rule 22 `174-181`; template `75-79`; D5 `04:144-166`. Unit is physical packet line. |
| C063 | 183 | delegate deliverable defects = 0 | CONTRADICTED | L4 refutes L2's 12-item set by seven omissions (`04:219-345`), and L3 reports its own out-of-scope broad search conflict (`03:337-347`). No cross-delegate “defects 0” audit exists. |
| C064 | 184 | parent packet contract failures = 5/5 | SUPPORTED | Accurate under D5's explicitly defined five physical STOP_IF lines (`04:146-166`). It is not the denominator of all parent defects or all critical-condition occurrences. |
| C065 | 186–187 | this is the third replay of DT-7/DT-8 | UNSUPPORTED | Analogy is plausible but no primary evidence defines or counts “replay” criteria. D5 establishes five literal conflicts, not case identity. |
| C066 | 188 | absence of an executable packet-contract guard caused the violations | UNSUPPORTED | D5 reports the conflict and limitations (`04:166-175`), but performs no causal experiment or repository-wide proof that guard absence was the cause. |
| C067 | 189 | an independent dispatched lane caught the contract conflict | SUPPORTED | L4 is a delegated VERIFICATION packet (`04:1-7`) and reports the conflict (`04:166,347-350`). |
| C068 | 197 | product size problem not solved; menu premise collapsed; sequencing belongs to Human | OVERSTATED | −5.16% is probe-policy-conditioned (C019); 4/6 are smaller (C006). Human owns order/start (`16:33-35`). |
| C069 | 198 | accept objective result as visibility + dedup + GEN | OVERSTATED | Bounded effects exist, but controls do not validate arbitrary objectives and duplication is gross upper-bound (`06:188-206`; `04:164-175`). Acceptance is Human-only (`24:227-242`). |
| C070 | 199 | safe side is 19 and correct answer is dependency edges | UNSUPPORTED | “19” is disputed (`04:331-345`); edge design is unverified (`07:109,212`). Human may choose, but Harness cannot label one untested answer correct. |
| C071 | 200 | govern evidence-map facts; Harness recommends itemization; cost unmeasured | OVERSTATED | The hole is supported (`06:262-266`), but recommendation is uncosted and misses that at least the S007 read order already has a router twin (`16:46-48`). Human decides owner changes (`24:227-242`). |
| C072 | 201 | baton25 ground conflict goes to Human; Harness does not overturn | SUPPORTED | `03:73-78,191-197`; rule 24 `244-246`. |
| C073 | 202 | effort-setting change is only presented, not made | SUPPORTED | `03:3,324-327,337-341`; Human-only boundary at `16:207`. |
| C074 | 203 | allowance inputs/roster declaration are proposals and values unchanged | SUPPORTED | `03:149-197`. |
| C075 | 204 | maintain 128 KiB because fallback needs a guardrail | OVERSTATED | Probe shows fallback below the current cap (`06:247`) and Human alone changes thresholds (`16:203,206`), but it does not compare maintaining 128 KiB against lowering or redesigning the threshold. |
| C076 | 205 | probe should become a measurement-only baton | UNSUPPORTED | `06:19-22` proves measurement-only/unwired status, not that batonization is necessary. Making a deferred item current/altering owner state is Human authority (`24:233-242,248-254`). |
| C077 | 206 | objective stops at design/verification and has no implementation GO | SUPPORTED | `16:203-205`; packet scope and OUT_OF_SCOPE also state no implementation. |
| C078 | 212 | dependency-edge verification was not run | SUPPORTED | `06:31-35,286-288`; no edge implementation exists. |
| C079 | 213 | evidence-map itemization cost was not measured | SUPPORTED | `06:224,240-241`. |
| C080 | 214 | ALWAYS19 rebuild was not run; probe uses 12 | SUPPORTED | `06:267-270`. |
| C081 | 215 | prototype-output vs packet duplication was not obtained | SUPPORTED | `06:251-254`. |
| C082 | 216 | wired probe read-load change was not obtained | SUPPORTED | `06:247-250`. |
| C083 | 217 | current full brief false facts were not obtained | SUPPORTED | `06:225,239`. |
| C084 | 218 | falsification of `07` is in progress | SUPPORTED | This packet and report are that falsification; it is a process-state statement. |
| C085 | 11–23 | the correction table completely characterizes v1's material errors | OVERSTATED | `06:E7` contains additional representation, unowned metadata, unstable-ID, and semantic-guard defects (`06:256-294`); five rows are a selected list, not a demonstrated complete list. |
| C086 | 66–78 | the three listed levers are all effects measured by the same experiment | OVERSTATED | L3/GEN are fixture controls (`06:E4-E5`), while packet duplication came from a temporally different 3-packet measurement with its own limits (`04:168-175`). |
| C087 | 111–120 | all named evidence-map facts form one uniformly absent owner-fact class | OVERSTATED | Several are outside catalog (`06:262-266`), but the S007 reading order is duplicated in `16:46-48`; fact-level denominator was NOT OBTAINED (`06:224,240-241`). |
| C088 | 147–160 | baton25's adjudicated conclusion is “unharmed” | OVERSTATED | The no-change authority boundary survives, but the stated factual ground is false (`03:73-78`); whether the Human would have made the same decision on corrected ground is explicitly not measured. |
| C089 | 164–173 | effort mechanism/corpus establishes the generation condition for every past finding | OVERSTATED | It establishes the observed corpus condition, not a finding-by-finding birthdate-conditioned mapping; eight files and 1,020 request IDs are not enumerated against all findings (`03:288-315`). |
| C090 | 177–189 | §6 is a complete self-indictment of parent-only defects | OVERSTATED | It correctly reports one five-line contract class, but falsely reports delegate defects 0 (C063), omits D5's line-unit/upper-bound constraints, and asserts untested causation (C066). |
| C091 | 193–206 | §7 is only a neutral list of Human questions | OVERSTATED | Rows 2–4, 8–9 contain Harness recommendations or asserted “correct” designs. Proposals are allowed, but they are not neutral facts and must preserve uncertainty/authority (`24:227-242`). |

### F1 result

The table breaks four load-bearing integration moves: the 5/6 “not smaller” summary, the dependency-not-route causation, the “only evidence-map” reading-order claim, and delegate-defects-zero. It also finds 25 cases where a valid narrow measurement was generalized past its denominator or its stated limitation.

## F2. Attack on §1 — headline and independent Product Architecture expected set

### 1. The 5.16% result is route-table-conditioned

`06:E1` explicitly says `PRODUCT_ARCH` intentionally combines Compiler, Registry, and Device Knowledge and uses the broad membership as a **conservative dependency closure**, and calls that probe policy rather than owner truth (`06:31-35`). The three product fixtures then inline the same 75/96 (`06:165-167`). Byte identity therefore proves a property of the probe's membership table and common rendering, not a property of current truth.

I estimated route sensitivity without regenerating the probe. From the already-generated Product fixture, I identified the 12 IDs that `measurements.json` says are inline but outside the frozen Product expected set: `B-06/B-14/B-16/B-22/B-26/B-30/B-31/B-33/B-37/B-54/S3-09/S3-30`. I counted each existing rendered `### ID` block's bytes and subtracted them from the existing 97,477 B artifact:

```text
rendered unnecessary blocks = 8,965 B
97,477 B - 8,965 B = 88,512 B
88,512 B - 102,782 B = -14,270 B = -13.88%
```

This is a static counterfactual over the existing artifact, not a regenerated fixture: it preserves the same L0 and 27 kB INDEX and simply asks what the already-rendered candidate would weigh if route membership equalled its own frozen 63-ID expected set. The observed saving moves from 5.16% to 13.88% solely by changing membership. That falsifies §1's statement that the result is caused by current-truth dependencies rather than classification/policy.

### 2. Independent expected-set re-derivation

I used two explicit rules against all 96 owner items: (a) retain L2's CORE12 for direct comparability; (b) include an objective-scoped item only when its owner trigger/ruling directly constrains `Managed Environment & Device Knowledge Architecture Design` or a named dependency in `16:191` (platform/board/toolchain/compiler, shared Web path, registry/device knowledge, compatibility, target user, or a named reference/evidence limitation). I did not include a whole neighbouring subsystem merely because the objective is broad.

Result: **55 items = CORE12 + 43 directly triggered product items**. Relative to E2's 63, I excluded eight whose owner triggers do not make them necessary for this objective as named:

| ID | why E2 inclusion is not independently compelled |
|---|---|
| `S3-13` | server-side LSP backend policy; Managed/Device architecture need only respect Web completeness, not design LSP backend |
| `S3-14` | Monaco first-candidate ruling; editor selection is not a dependency of registry/device knowledge design |
| `S3-18` | Desktop advanced-LSP candidate; same separation |
| `S3-19` | Helper feasibility/adoption; no owner trigger connects it to the named objective |
| `S3-32` | historical S007 competitive-evidence state; direct evidence limitations are carried by B45/B47/B48 instead |
| `B-27` | Helper adoption trigger; no Helper decision is in the objective |
| `B-36` | debugger product-scope trigger; debugger is absent from `16:191`'s named architecture surface |
| `B-38` | Human re-ruling of S005 grounds; the architecture lane must not reopen it and the current rulings themselves remain available |

The eight existing rendered blocks weigh 6,679 B. Starting from the 63-item counterfactual gives **81,833 B**, or **−20,949 B / −20.38%** versus current full. This is a sensitivity estimate, not a safe architecture recommendation.

L4's seven disputed ALWAYS additions must then be handled. Adding them to the comparable 55 gives **62**, nearly E2's 63 but with materially different membership. That does **not** validate 63: it shows cardinality can stay similar while the safety obligations change. It also exposes the unresolved unit problem—duplicated boundary twins may be represented once plus an edge, rather than both full bodies. My independent answer is therefore:

- **63 is not a defensible measured ground truth.** It contains eight weakly triggered items under an explicit direct-trigger rule.
- A comparable direct set is **55/96**.
- A conservative “add all L4 disputed items as bodies” variant is **62/96**, but that inherits the unresolved duplicate/edge question and is not independently verified.
- The causal conclusion “product objectives genuinely need most current truth” is at best a hypothesis over a plausible 55–62 item band, not what the 75-item/97,477 B measurement establishes.

What would settle it: freeze a fact-level gold set with per-item owner-trigger citations under a declared actor/lane/phase/action tuple, have an independent lane derive it before seeing routing output, adjudicate disagreements, and then measure at least two alternative route tables against that same gold set.

## F3. Attack on §2 — “safety improves independently of size”

The narrow result stands: for six frozen fixtures inside the predefined 96-ID universe, visibility was 301/301; eight injected negative shapes were detected; one unmutated control was green (`06:161-191`). The generalized safety claim does not.

`06:E4` says explicitly that controls 6/7 show fallback rather than correct semantic classification and that the suite “does not validate arbitrary Objectives” (`06:188-191`). `06:E5` says control 8 validates an extra fixed CORE12 literal guard, not the candidate claim that ID presence prevents semantic loss (`06:201-206`). §2's table carries neither limitation. §3 later carries the control-8 limitation, but does not repair §2's headline or the “採用価値あり” row; an executive reader can accept §2 before reaching the caveat.

The three levers also do not share one “independent of size” property:

- L3/fallback visibility: detection effect can be separated from size, but only for cataloged IDs and injected shapes.
- GEN: detects cross-owner inequality, not equal-but-stale or partial staleness (`02:161-173`).
- Duplication removal: is literally a byte-size lever; 6,879 B is a gross upper-bound proxy, not net saving (`04:164-175`).

Verdict: **§2 is OVERSTATED**. Safe wording would be limited to “the probe improved observability for its fixed catalog and injected failures; general semantic completeness, arbitrary Objective classification, freshness, and net deduplication saving remain unvalidated.”

## F4. Attack on §3① — 12 vs 19 and the dependency-edge “resolution”

### Resolution or deferral

It is a deferral wearing resolution language. `07` first selects L4 as “safe,” then declares a third unverified design “correct,” then admits Human adjudication and future verification are required (`07:102-109`). A resolved disagreement has a settled unit, acceptance criterion, and evidence. Here all three are absent.

The deeper mismatch is that L2 defines ALWAYS by whether **that item's absence alone** can mislead (`02:13-16`), whereas L4 symmetrically labels both duplicate formulations ALWAYS (`04:331-345`). If a twin remains, an item's absence-alone test and an obligation-level test yield different answers. Dependency edges may be one design response, but no evidence shows they are the correct or only response.

### Independent spot-check — 7 classifications

| item | L2 | L4 | independent result |
|---|---|---|---|
| B-04 | scoped | ALWAYS | **AMBIGUOUS by unit**: routing applies every dispatch, but S3-04 retains the same GO boundary. L4 classifies the obligation; L2 classifies individual absence. |
| B-25 | scoped | ALWAYS | **OBJECTIVE_SCOPED as an item under L2's absence-alone rule** because S3-46 carries the absolute threshold boundary; read-allowance provenance is scoped. |
| B-43 | scoped | ALWAYS | **AMBIGUOUS**: every-session preflight is universal, but S3-47 duplicates the no-edit-without-GO clause and historical effort facts are scoped. Composite item needs splitting or an edge. |
| B-44 | scoped | ALWAYS | **OBJECTIVE_SCOPED**: account/payment/contact/PII restrictions trigger competitor real-use work, not every Objective. General secret discipline does not turn all external-action details into universal payload. L2 is stronger here. |
| B-52 | scoped | ALWAYS | **OBJECTIVE_SCOPED as an item under absence-alone** because S3-43 owns the same 128-KiB/current-truth prohibition. L4's symmetric rule changes the unit. |
| S3-04 | scoped | ALWAYS | **AMBIGUOUS by unit**: global routing fail-closed matters every dispatch, but B-04 duplicates much of it; mapping provenance remains scoped. |
| S3-47 | scoped | ALWAYS | **AMBIGUOUS/composite**: the no-setting-change clause is universal, while mismatch history is Harness-specific; B-43 is its twin. |

Neither lane is wholly right under one consistent item-level rule. L2 is inconsistent because some original CORE12 items also have twins; L4 over-promotes composite and trigger-scoped rows. The result supports an explicit semantic-obligation model or item splitting as alternatives worth testing, but does not adopt either.

## F5. Attack on §6 — parent's self-indictment

Rule 22 requires critical stop conditions to be inherited verbatim (`22-model-orchestration.md:174-181`); template contract rule 2 repeats the same requirement (`delegation-packet-template.md:75-79`). D5 defines its unit as physical packet lines and selects L1 one line, L2 two, L3 two (`04:144-166`). Under that exact unit, **5/5 paraphrased and 0/5 verbatim is accurate**.

I independently read the three journal packet texts. They contain **12 STOP_IF bullets total (4 per packet)**. D5's five lines are the subset containing inherited project-critical prohibitions: L1 P76; L2 P93/P94; L3 P77/P78. Thus:

- denominator 5 is correct for **D5's selected physical inherited-stop lines**;
- it is not the denominator of all STOP_IF bullets (12), all critical propositions (some lines combine several), all repeated critical conditions in OUT_OF_SCOPE, or all parent defects;
- “five contract violations” should retain the unit “5 physical STOP_IF lines”; otherwise one line/one violation is an unstated counting convention.

The self-indictment is therefore **accurate on its narrow 5/5 metric but understated/incorrect overall**. It falsely says delegate defects are zero despite L4 refuting L2's classification set, and it asserts without a causal test that absence of an executable guard caused the failures. It also drops D5's temporal, system-context-denominator, manual-judgment, and gross-upper-bound limits (`04:168-175`).

## F6. Primary-evidence findings missing, softened, or dropped from `07`

| dropped/softened finding | primary evidence | consequence |
|---|---|---|
| 4/6 fixtures are byte-smaller; “5/6 not smaller” needs an unstated substantial-reduction threshold | `06:217-219,292-294` | breaks §0/§1 headline wording |
| product byte identity is caused by deliberately broad hand-authored route membership | `06:31-35,165-167` | breaks dependency-only causation |
| arbitrary Objectives were not validated; controls 6/7 test fallback, not semantic classification | `06:188-191` | §2 drops the main generalization limit |
| complete-current-owner truth rate is NOT OBTAINED; evidence-map fact denominator is zero | `06:224,240-241` | 301/301 is not current-truth completeness |
| current brief false-fact rate is NOT OBTAINED | `06:225,239` | fixture false-fact comparison lacks a before-side value |
| wrong-route normal rate is 1/6; unnecessary inline counts are 12/29/37 and FALSIFICATION 67 | `06:232-239,275-281` | classification quality is materially weaker than visibility result |
| all fixtures use NO_REPO_ACCESS, execution phase, investigative action | `06:40-41` | actor/phase/action generalization is untested |
| probe metadata is an unowned fourth truth surface and cannot detect wrong tag/missing edge/new non-item fact | `06:286-288`; `02:188-202` | proposed safety mechanism adds a silent failure surface |
| GEN is disagreement detection, not freshness proof | `02:161-173` | “freshness validation” framing is too strong |
| task obligations depend on `(Objective, actor, lane, phase, action)`, not Objective alone | `02:125-127,197-199` | route key is underspecified |
| mechanically safe export is broken to “reviewed risk reduction” by semantic-sufficiency limits | `02:229-276` | `07` softens the strongest L2 verdict into adoption-value language |
| evidence-map read order is already duplicated in router | `16:46-48` | `07:115`'s “only here” statement is false |
| exact-line/shingle duplication instruments undercount; semantic enumeration is judgment-dependent; 6,879 B is gross upper bound | `04:168-175` | §2 presents the proxy as a replaceable byte amount |
| dispatch-time brief bytes were NOT OBTAINED and comparison artifacts differ in time/dirty state | `04:43,142,174` | duplication/size values are not one synchronized state |
| `context-brief.sh` source overrides are path-containment fail-open; absent gitleaks continues; `--out` copy failure is fail-open | `01:28-32,34-49` | existing architecture safety risks disappear from Human summary |
| current brief stamps no owner GEN | `01:70-80` | supports GEN lever, but omission is not clearly separated from proof of general freshness |
| current brief includes fixed instructions/placeholders/history-like grounds, not bare truth | `01:82-92` | size baseline contains non-truth delivery that could be designed separately |
| WARNING cannot distinguish structural growth from stale/inapplicable threshold inputs | `03:199-213` | §5 describes missing inputs but drops the causal ambiguity |
| historical session launch arguments were not obtained | `03:280-286` | breaks “all S000–S009” certainty |
| L3 investigation's broad search accidentally entered other project transcript trees | `03:337-347` | delegate-defects-zero is false and scope conflict is omitted |
| probe had three invalid early runs and a parser defect before final measurement | `06:54-59` | instrument maturity/measurement history omitted |
| generation time is six local single-process wall-clock runs, not an SLO | `06:226-230` | correctly not used as recommendation, but missing from “all findings” integration |

## F7. Attack on §7 recommendation rows and Harness authority

Rule 24 reserves objective acceptance, scope expansion, making deferred work current, settled-decision reopening, and moving phases to the Human (`24-objective-control.md:227-246`). Rule 22 leaves adoption of delegated reasoning with the integrator only inside already-authorized scope and never changes settled decisions (`22-model-orchestration.md:384-401`). A Harness may make a proposal; it may not present an unverified proposal as “correct,” accept the objective, or move phase.

| row | evidence support | authority finding |
|---:|---|---|
| 1 | **BROKEN as written.** −5.16% is route-policy-conditioned and 4/6 fixtures are smaller. The measurement supports “this broad route did not substantially shrink three fixtures,” with “substantial” still undefined. | Correctly leaves sequencing/start to Human, but calls a disputed interpretation “fact.” |
| 2 | **PARTIAL.** Fixed-catalog visibility, gross duplication, and GEN mismatch detection are supported with limits; arbitrary Objective safety, net saving, and freshness are not. | Asking Human to accept is correct. Harness must not call the reframed objective result already established. |
| 3 | **BROKEN.** 12/19 is unresolved and “edge is correct” is unverified. | Choosing a design or changing the semantic unit is a Human design decision here; Harness may submit alternatives only. |
| 4 | **PARTIAL.** Evidence-map catalog hole stands, but read order has a router twin and itemization cost is unmeasured. | Recommendation ⓐ is permissible as a proposal; owner/catalog expansion requires Human decision. |
| 5 | **SUPPORTED.** Literal ground is refuted and current no-change boundary survives. | Correctly reserved to Human; Harness cannot reopen the settled ruling. |
| 6 | **SUPPORTED.** Exact edit/effect direction/rollback are evidenced; actual cost/latency unknown. | Correctly Human-only and unchanged. |
| 7 | **SUPPORTED WITH LIMITS.** Formula identifies Human inputs; `C/P/G` also require non-Human platform/transport evidence. | Correctly proposal-only; no value can be adopted yet. |
| 8 | **PARTIAL.** Some fallback guardrail is supported; maintaining specifically 128 KiB versus another threshold design is not compared. | Threshold choice is Human-only. “維持推奨” is allowed only as a qualified proposal, not evidence conclusion. |
| 9 | **UNSUPPORTED.** Measurement-only/unwired status does not prove batonization is useful or safe; maintenance/owner cost is absent. | Making a new deferred/current-truth item is Human-controlled. Harness can propose, not adopt. |
| 10 | **SUPPORTED.** Objective is design/verification; no implementation GO exists (`16:203-205`). | This is scope confirmation, not a decision by Harness. |

Nine rows may carry a Harness position if clearly marked **proposal with limits**. Rows 1 and 3 currently cross that line: row 1 promotes a broken inference to fact, and row 3 labels an unverified design “correct.” Row 9 proposes a new governance obligation without evidence of its maintenance cost; it must remain an optional Human question.

## F8. Scope-expansion / production-change verification

Commands run after reading the evidence and before writing this report:

```text
git status --short
?? prompt/maintenance/local/investigations/2026-08-27_task-scoped-brief/
?? prompt/maintenance/local/plans/active/10_task-scoped-context-brief-read-architecture.md
STATUS_RC=0

git diff --name-only
(no output)
DIFF_RC=0

git diff --name-only --cached
(no output)
CACHED_DIFF_RC=0

git diff --name-only -- prompt/maintenance/global | wc -l
0

git diff --name-only -- CLAUDE.md prompt/maintenance/local/handover scripts .claude | wc -l
0

git status --short --untracked-files=all (classified counts)
UNTRACKED_PROBE_PATHS=10
UNTRACKED_INVESTIGATION_FILES_01_TO_07=7
```

Observed `[static]`: no tracked or staged file differs from HEAD; no tracked `prompt/maintenance/global/**`, owner, `CLAUDE.md`, `scripts/**`, or `.claude/**` delta exists. The untracked probe/report directory and active plan match the packet's declared concurrent evidence. The probe is unwired and declares itself measurement-only (`06:10-22`). I did not regenerate it, change a threshold, read the donor, or modify any file other than this report.

After this report is written, the expected status expands only within the already-untracked investigation directory; F8's final verification must identify this report as the sole L6 write.

## F9. VERDICT

| load-bearing conclusion in `07` | verdict | breaking evidence / required limits |
|---|---|---|
| task-scoping does not solve product-design size | **BROKEN** | 4/6 are smaller; the three 5.16% results share a deliberately broad route table. Existing-artifact subtraction moves Product to 88,512 B / −13.88% at its own 63 expected items, or 81,833 B / −20.38% under my comparable 55-item direct set. No “substantial” threshold or alternate route table was tested. |
| fixed-catalog complement visibility improves omission observability | **STANDS WITH LIMITS** | 301/301 only for frozen expected occurrences in 96 IDs; evidence-map facts scanned 0, arbitrary Objectives unvalidated, ID/stub does not preserve semantics. |
| safety improves independently of size | **BROKEN** | controls validate injected shapes only; GEN is not freshness proof; deduplication is itself a size lever. |
| 6,879 B packet duplication is removable | **STANDS WITH LIMITS** | gross duplicated physical-line proxy over 3 packet texts, not net saving or full transport; reference cost and prototype comparison NOT OBTAINED. |
| GEN is a useful low-cost freshness lever | **STANDS WITH LIMITS** | mismatch detection stands; equal-but-stale/common-mode/partial staleness remain invisible. Call it consistency, not freshness proof. |
| ALWAYS disagreement is resolved by safe-side 19 plus correct dependency edges | **BROKEN** | classification units differ, independent spot-check finds composite/trigger ambiguities, and edge design is explicitly unverified. This is unresolved. |
| evidence-map is a catalog hole | **STANDS WITH LIMITS** | donor pins/outputs/loop/queue hole stands; S007 read order is not unique to evidence-map because `16:46-48` duplicates it; fact denominator remains NOT OBTAINED. |
| ID presence does not guarantee prohibition semantics | **STANDS** | directly supported by `06:E5` and baton-54 precedent. |
| baton25 literal ground is refuted; no adoptable new allowance exists | **STANDS** | supported independently by L3/L4. Human must decide whether corrected ground changes the ruling. |
| effective effort is medium and per-model override is the cause | **STANDS WITH LIMITS** | live corpus/mechanism support it; “all S000–S009 findings” exceeds the conditioned 8-file corpus and unobserved historical launch arguments. |
| parent packet contract failed 5/5 | **STANDS WITH LIMITS** | accurate for five selected physical STOP_IF lines; not all STOP_IF bullets/conditions/parent defects. Claimed delegate defects 0 and asserted causal mechanism are broken. |
| §7 is a Human decision package | **STANDS WITH LIMITS** | Human authority is mostly preserved, but rows 1/3 state broken or unverified Harness conclusions and row 9 lacks evidence. |

**Safe to put in front of the Human as written: NO.** It contains four direct contradictions, including its headline metric interpretation, and presents route-table artifacts and unverified design choices as current-truth conclusions.

### Strongest successful attack

The strongest attack is the combination of C006/C019: the integration turns “three deliberately coarsened fixtures share a 75-item route and save 5.16%” into “current truth genuinely forces that size, and 5/6 are not smaller.” The source says the route was hand-authored as conservative probe policy, while its own byte table says four fixtures are smaller. The generated artifact itself shows the result moves by 8,965 B when only the route's admitted unnecessary inline blocks are removed. That is not a missing caveat; it reverses the claimed cause and weakens the headline conclusion.

### Rungs not run

- `API-smoke`, `visual`, `real-fire`: not applicable to a document/artifact falsification; no application exists.
- fixture regeneration/probe rebuild: forbidden by packet and not run.
- repository mutation harness: not run; no production/checker code changed. The report's full-table detection-power check is recorded in the final verification.
- donor access, network, production action, threshold/setting mutation: not run/never performed.

### Final verification record

- `[synthetic]` report structure validator: `CLAIMS=91/91 HEADINGS=9/9 RECOMMENDATIONS=10/10 SPOTCHECKS=7/7 VALIDATOR_RC=0`.
- `[synthetic]` detection-power control, performed as an in-memory stream transformation without editing the report: original `91` rows / RC 0; `sed '/^| C091 /d'` confirmed `MUTATION_CHANGED=1`, produced `90` rows / validator RC 1; rereading the unchanged original returned `91` rows / RC 0. **Killed 1/1.**
- `[synthetic]` `bash scripts/selftest.sh; rc=$?` -> `RESULT: 78 passed / 0 failed`, `SELFTEST_RC=0`.
- `[static]` final scope scan before this verification record: all 8 investigation reports, 10 probe paths, and the active plan were untracked; `TRACKED_DIFFS=0`, `STAGED_DIFFS=0`, `GLOBAL_TRACKED_DIFFS=0`, `OWNER_TRACKED_DIFFS=0`. This lane's sole repository write is this `08` report.
- `[static]` pre-final-record SHA-256 of this report was `39813f79039df179cdc2b5121fe6bc1c8a21f12775aa5567c52b6229dd0e7da6`; the final hash is intentionally remeasured in the result capsule evidence rather than copied forward as if unchanged.
