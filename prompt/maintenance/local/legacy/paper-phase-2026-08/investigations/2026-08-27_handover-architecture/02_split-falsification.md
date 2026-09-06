# 16.md topic split falsification

**Packet:** `S008-B-falsify-split`  
**Lane:** `FALSIFICATION`  
**Authority:** `DELEGATED` — this report is evidence for the integration owner, not an adoption decision.  
**Tree inspected:** working tree at `99d629c` before this report was written.  
**Scope boundary observed:** no DigiCode donor repository or donor governance file was opened; no file outside this report was modified.

## Verdict under attack

The proposition does not survive the attack in its present form. A topic split can lower the number emitted by `read-load.sh` while making restoration worse, because every current mechanism discovers one fixed path and no mechanism proves that a model followed the router to all required owners. If all current truth that is presently unconditional remains unconditional and is actually counted, the payload is conserved and the new owner/router metadata makes it larger. The plan therefore has not yet shown both claimed outcomes at once.

The strongest break is not generic “documentation drift.” It is a new representational state that one file cannot have: a fact can exist in **no** topic file because each topic owner treats the other as canonical. `local/README.md:59` predicts this exact inter-file silence, while the current guards still bind to one literal `16.md` path.

## A. Concrete failure scenarios

Severity order is impact on authority/restoration, not implementation difficulty. Each scenario identifies current truth, the failing mechanism, and the binding guard line that does not see it.

### A1 — CRITICAL: the Opus 5 solo prohibition is never read

**Truth at risk.** `16.md:224` says: “**Opus 5 solo 禁止を維持する** … **Human が改めて解除しない限り solo へ戻さない**.” The same boundary is also present in the GO/STOP table at `16.md:105` and in the earlier ruling at `16.md:213`.

**Mechanism.** The hook resolves only `HANDOVER="$ROOT/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md"` (`session-start.sh:14`) and calls `clipped(..., 200)` only for that file (`session-start.sh:31`). After 16.md becomes a route map, no topic owner is injected. Worse, the injected directive tells the reader: “The current handover (16.md) is inlined below … Treat it as read” (`session-start.sh:37`). `CLAUDE.md:17` likewise names only 16.md as the mandatory current-state read. A cheapest-path reader can therefore accept the router as the whole state and never open the orchestration owner. This replays PT-13 and DT-3: the edge is described, but the action is not forced.

**Why the guards stay green.** B9 extracts only hook paths with `grep -oE '"\$ROOT/[^"]+"'` (`selftest.sh:397`) and passes when those paths occur in `read-load` output (`selftest.sh:402-407`). A topic owner absent from the hook is absent from B9's denominator. B53 parses only numbered paths in `CLAUDE.md` §0 (`selftest.sh:424-429`), so an owner mentioned only inside the router is also absent from that denominator. B8 proves only that §0 contains the string `read-load.sh` (`selftest.sh:366-370`), not that any router edge was followed. B58's eight questions do not include the solo prohibition (`selftest.sh:1661-1670`).

### A2 — CRITICAL: a next-objective candidate is misread as work authority

**Truth at risk.** `16.md:23` says `PRIMARY_OBJECTIVE: UNSET`. Lines 25-30 say the first candidate is `Managed Environment & Device Knowledge Architecture Design` but “**着手権限ではない**”; lines 32-39 say there are two different menus and “**どちらも着手権限ではない**.” The settled rule at `16.md:184` is: “**A Human GO authorises one declared PRIMARY_OBJECTIVE and nothing beyond it**.”

**Mechanism.** A topic router naturally sends an architecture task to “product + architecture rulings.” If `PRIMARY_OBJECTIVE: UNSET` and the no-authority qualifier live in “session control,” while the candidate name and design expectation live in “product,” the reader reaches the tempting action before the disqualifying state. The rules index explicitly says the reader uses a trigger to “pick the relevant rules” (`rules/README.md:17-18`); PT-13 says the model takes the cheapest path. The split increases the number of plausible stopping points from zero inside one file to one per topic edge.

**Why the guards stay green.** B55/B58 require only a legal objective token and the phrase `GO / STOP boundary` (`selftest.sh:1481-1489`, `1663-1670`). They do not prove that the candidate and its “not authority” qualifier are co-read or consistent. B54 actively prevents a fallback copy in `CLAUDE.md`; its binding scan only rejects a few current-state shapes in §§2-3 (`selftest.sh:1403-1416`). Thus the correct single-owner fallback is removed while no multi-owner reachability check replaces it.

### A3 — CRITICAL: production implementation begins from a direction ruling

**Truth at risk.** `16.md:41` says “**production 実装へ自動的に進まない**” and enumerates Web/Desktop/Helper/Monaco/LSP/Tauri/Text Compiler/Board pack/installer/Registry/Device Knowledge. The settled ruling repeats: “**この裁定を受けても production 実装へ自動的に進まない**” and “**次の PRIMARY_OBJECTIVE は Human が改めて指定する**” (`16.md:196`).

**Mechanism.** “Session control” can assume the prohibition is a product ruling; “product + architecture rulings” can assume work authority belongs to session control. If one copy is deliberately de-duplicated during the split, either owner can omit it. A reader routed to architecture sees Monaco/Desktop/Registry directions without the stop. This is both a wrong-owner read and a no-owner risk.

**Why the guards stay green.** `handover-diff.sh` parses only numbered table rows in §2 and bullets in §3 of one `H` (`handover-diff.sh:37,74-90`). It does not parse the §1 copy at all, and after a migration classifies the §3 bullet as “relocated” it does not inspect the destination. B58 asks whether a settled heading and a `*Supersedes*` token exist (`selftest.sh:1667-1669`), not whether this prohibition exists. `close.md` step 4 only checks contradictions between CLAUDE.md and the rewritten handover (`close.md:22-24`); it does not reconcile topic owners with each other.

### A4 — CRITICAL: the current product-value state is reconstructed from the wrong half

**Truth at risk.** The S005 ruling says “**製品の中核価値が確定した**” but ends with “**S006: この裁定を支えた evidence が反証された — baton 38**” (`16.md:200`). Baton 38 says the evidence was refuted and “**再裁定要否は Human のもの**” (`16.md:155`). The later Human ruling gives the current evidence state: `legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED` (`16.md:218`).

**Mechanism.** A “product rulings” owner contains the attractive fixed value; a “batons” owner contains the open re-ruling question; a “runtime/evidence state” owner contains the final evidence qualification. Any one of the three reads internally coherently. A product design session that follows only the product owner returns “value settled”; one that follows only evidence returns “not resolved” and may wrongly overturn a Human ruling. The truth is the relation among all three.

**Why the guards stay green.** B58's `settled` predicate is only the heading regex and its `supersedes` predicate is only the existence of `*Supersedes*:` (`selftest.sh:1667-1669`). B4 validates only read-load completeness/unit/RC (`selftest.sh:321-335`). Neither checks cross-owner semantic constraints. `handover-diff` compares entries independently and uses similarity ≥0.60 to call a change REWORDED (`handover-diff.sh:103-126`); it cannot assert that the ruling, baton, and evidence-state edge remain joined.

### A5 — HIGH: S007 evidence is read in the known-wrong order

**Truth at risk.** `16.md:96-97` says: “**S007 の evidence を読む順序は逆である。** `08`(統合)は `09`(統合への反証)に **13 件訂正されている**。`09` を先に読まないと、訂正前の主張を current truth として持ち帰る.”

**Mechanism.** The evidence-directory pointer looks like “runtime/evidence state,” while the conclusion it qualifies looks like “product architecture.” A task router can send the reader directly to the conclusion or the product owner without firing the evidence-order edge. This is exactly PT-36/DT-3's shape: a correct instruction exists, but its trigger does not reach the moment of use.

**Why the guards stay green.** B8's binding condition is only `CLAUDE.md §0` containing `read-load.sh` (`selftest.sh:366-370`); it does not test topic routing or evidence order. B53 compares sets of file paths, not ordered event edges (`selftest.sh:424-449`). B54 checks only CLAUDE.md §§2-3 for six current-state text shapes (`selftest.sh:1403-1416`). No named guard asks “did 09 precede 08?”

### A6 — HIGH: router GEN advances while a topic owner's GEN stays stale

**Truth at risk.** `16.md:13` defines GEN as the ordering token: “**the higher generation is current, and if the two differ the disk is right**,” set at close and checked against the newest session. A stale product owner could, for example, retain the pre-S007 account and omit the Human correction at `16.md:219` about why industrial IoT work stopped.

**Mechanism.** `close.md` still says “**Full 16.md rewrite**” and sets the GEN in 16.md (`close.md:16`); it does not enumerate topic owners. A closer advances router GEN to S008 and creates S008 history while the product owner remains S007. Each file looks internally coherent. The optional-capability obligation says every topic generation must match the router (`local/README.md:58`), but the executable close path does not currently fire that instruction.

**Why the guards stay green.** B52 hard-codes `b52_h=.../16_次セッション引き継ぎ指示書.md` (`selftest.sh:1375`) and compares only that GEN to the newest session (`selftest.sh:1377-1389`). B58 copies only that same `b58_h` into its no-history fixture (`selftest.sh:1635,1649`). The local README sentence is not an executable check. This is the project's recorded “described trigger does not fire” class, DT-3.

### A7 — HIGH: a baton-ruling pair loses its qualification between owners

**Truth at risk.** Baton 51 says “**Device knowledge を追加すれば対応範囲が増える**” is a Human expectation, “**実証済み product value ではない**,” and schema is not settled (`16.md:168`). The matching ruling says the structural change is a hypothesis and “**実証済み product value として扱わない**” (`16.md:220`).

**Mechanism.** During migration, the baton owner can omit the qualification because it is a Human product ruling; the product owner can omit it because it is an unfinished hypothesis tracked by a baton. A router can still point to both perfectly valid files. The fact now exists in no file—an impossible state when a single canonical file contains both rows.

**Why the guards stay green.** `handover-diff` can only say that the old §2 row and §3 bullet left 16.md; its classification contract allows “relocated (name the file that owns it now)” (`handover-diff.sh:129-136`) but does not open or verify that destination. B55 merely counts nine syntactic responsibilities in one file (`selftest.sh:1471-1493`). B58's negative control deletes §1 and proves its parser drops from 8/8 (`selftest.sh:1675-1682`); it never deletes one side of a baton-ruling relation.

### A8 — HIGH: Route B context brief becomes small by becoming incomplete

**Truth at risk.** At minimum the GO/STOP prohibition “**Opus 5 solo で PRIMARY_OBJECTIVE を完結すること**” (`16.md:105`) and the S007 evidence state (`16.md:218`) must reach an actor receiving the sanctioned brief.

**Mechanism.** `context-brief.sh` has one `HANDOVER` path (`context-brief.sh:14`) and extracts only exact headings `## §1`, `## §2`, `## §3` from that path (`context-brief.sh:87-90`). If the router omits those headings, the exporter emits `NOT OBTAINED`; if the router retains tiny stub sections, it succeeds but exports only pointers. If the exporter is changed to concatenate all topic owners, the payload returns and gains owner metadata. Therefore a dramatic brief shrink is evidence of omitted truth unless a new semantic-equivalence check proves otherwise.

**Why the guards stay green.** B4/B8/B9/B52/B53/B54/B58 do not inspect the brief. The current context-brief selftest validates success/fail-closed branches against the present single-file shape, not preservation across a split. `close.md` step 1 runs baseline/usage and step 3 rewrites 16.md; neither compares the pre/post brief's current-truth inventory (`close.md:12-18`).

### A9 — HIGH: future removals from a topic owner are invisible to handover-diff

**Truth at risk.** Baton 4 records that routing-profile values were measured but writing is still Human-GO-gated (`16.md:127`). A future close could silently drop that qualifier from a harness-state owner.

**Mechanism.** The current diff tool binds `H` to 16.md (`handover-diff.sh:37`), sets `SCANNED=1` (`handover-diff.sh:62-69`), and obtains both versions only for that path (`handover-diff.sh:44-60`). After a split, an unchanged router yields `GONE (0)` even if a whole topic owner loses a ruling. The README requires the tool to scan all topics (`local/README.md:58`), but until the implementation and its mutation controls are changed, the existing guard proves the old architecture only.

**Why the guards stay green.** B51's positive and negative fixtures exercise one `handover-diff.sh` input repository and one handover path; its success message is about dropped rows and a zero denominator in that single shape (`selftest.sh:1360-1364`). B9/B53 concern read-set paths, not version-to-version removals. `close.md:18` trusts the denominator the tool prints; a hard-coded `1` is internally consistent and therefore accepted.

### A10 — HIGH: the close updates a subset atomically and still looks complete

**Truth at risk.** The S007 ruling says the next objective name is `Managed Environment & Device Knowledge Architecture Design` and that the menu is not work authority (`16.md:223`). The next Human change may update the objective state, candidate, related batons, and product rulings together.

**Mechanism.** `local/README.md:58` requires all topic files to update in the same commit, but the actual close sequence names only: rewrite 16.md (`close.md:16`), reconcile CLAUDE.md (`close.md:22`), create a session file/index (`close.md:26`), then indexes (`close.md:28`). There is no topic-owner inventory to iterate and no failure if one owner was untouched. A fresh router plus three fresh topics and one old topic can all be committed atomically.

**Why the guards stay green.** B52 checks only router GEN; B54 checks only CLAUDE.md; B58 checks only the router fixture. B4 accepts any measured roster for which all listed inputs were measured (`selftest.sh:321-335`); it cannot know an owner was left out of the roster. The binding close line “The evidence is the FINAL tree” (`close.md:34`) proves timing, not multi-owner coverage.

### A11 — MEDIUM-HIGH: multi-domain facts increase wrong-owner reads

**Truth at risk.** The auto Web UI ruling says it is not C++ parsing, needs a Text input adapter, keeps `registration records → schema → renderer → transport / packaging` as a reuse candidate, and must not center value on uniqueness (`16.md:222`). This one fact is simultaneously product value, architecture, donor capability, and evidence correction.

**Mechanism.** Topic names are not disjoint predicates. A request about “reuse donor auto UI” can plausibly route to product, architecture, or runtime/evidence. The single-file design has no wrong-current-owner choice: once 16.md is read, the fact is present. The split creates three correct-looking owners and a routing classification problem whose error rate is not measured.

**Why the guards stay green.** The rules decision tree routes by trigger to a file (`rules/README.md:24-31`) but contains no current-state topic-owner table. B8 proves a read plan is reachable, not that the selected owner is the right one. B53 proves listed paths equal measured paths, not that the topic classifier selects every required path for a task.

## B. Arithmetic attack on “the split reduces unconditional read cost”

### B1. Measured baseline and denominators

`bash scripts/read-load.sh` measured **7/7 mandatory inputs**, RC=0:

| Quantity | Measured | Denominator / meaning |
|---|---:|---|
| Unconditional read | **65,868 estimated tokens** | 48,000-token allowance = **137%** |
| Excess | **17,868 estimated tokens** | **37.2% of the 48,000-token allowance** |
| 16.md | **30,488 estimated tokens** | **46.3% of the 65,868-token mandatory set** |
| 16.md bytes | **80,427 bytes** | full 279-line file |
| Hook's first-200-line slice | **57,995 bytes / 21,914 estimated tokens** | 200/279 lines; the hook truncates at 200 |
| Current context brief, clean pre-report tree | **77,190 bytes** | `bash scripts/context-brief.sh \| wc -c`, successful exporter run before this report made the tree dirty |
| Current context brief, final report tree | **77,343 bytes** | same command; one dirty change adds the exporter's dirty-tree metadata/digest |
| 16.md §§1-3 inside that brief | **70,225 bytes / 26,749 estimated tokens** | **91.0% of the 77,190-byte clean-tree brief** |
| Brief cap use, clean tree | **77,190 / 98,304 bytes = 78.5%** | current provisional cap |

The token estimator is the repository's own Opus-5-calibrated proxy (`read-load.sh:19-35`), not a tokenizer run for this delegate model. The script reports the unit and its calibration limit; all percentages above use its emitted 65,868-token denominator.

Measured current 16.md section costs:

| Segment | Lines | Bytes | Estimated tokens |
|---|---:|---:|---:|
| header + ownership + GEN (1-14) | 14 | 1,409 | 507 |
| §0 | 6 | 710 | 250 |
| §1 | 92 | 11,527 | 4,241 |
| §2 | 58 | 30,180 | 11,540 |
| §3 | 56 | 28,518 | 10,967 |
| §4 | 26 | 3,242 | 1,244 |
| §5 | 27 | 4,841 | 1,738 |

Rounding is performed per measurement here, so the section-token sum may differ by one token from the full-file estimate.

### B2. Fixed-path hook: two ways to “win,” neither proves the proposition

1. **Keep only the router on the fixed hook path.** The injected payload shrinks, but the topic owners are not injected. If they are also absent from `CLAUDE.md` §0 and the `read-load` roster, the reported unconditional number falls by their entire content while restoration loses that content. B9 and B53 pass because their denominators are generated from the same fixed hook/contract omissions. This is a measurement-contract shrink, not a safe read-cost reduction.
2. **Make every topic owner truly unconditional.** Add every owner to the hook/contract/roster or inline their contents. The 30,488-token truth payload is conserved. The split does not reduce unconditional cost.

The hook's 200-line clipping creates another trap. Today it injects 21,914 estimated tokens and stops in §3; the reader must obtain the remainder to satisfy the full-read contract. A small router would fit wholly inside the clip, strengthening the misleading “Treat it as read” message. Inlining every topic instead restores the cost.

### B3. Per-file overhead gives a lower-bound increase

I measured the smallest reusable current owner shell from existing lines—title, canonical-ownership comment, and GEN—as **1,071 bytes / 378 estimated tokens / 8 lines**. This deliberately excludes the new route pointers, topic definition, cross-owner invariant IDs, and close instructions, so it is a lower bound.

For the proposed four topics plus 16.md as router, one current file becomes five files: **four extra owner shells**.

```text
preserved truth payload                         30,488 tok
4 extra shells × 378 tok                         1,512 tok
lower-bound split current-state payload         32,000 tok

whole unconditional set: 65,868 + 1,512        67,380 tok
67,380 / 48,000 allowance                        140.4%
```

Using the full current 14-line header proxy would add 4 × 507 = 2,028 tokens instead. Neither calculation includes router edge text, owner manifests, generation cross-check data, or duplicated Human-ruling qualifiers.

### B4. “Conditional” topics are likely read anyway

The mandatory-safe set in section D includes purpose/current authority, objective + GO/STOP, all batons and triggers, all Human rulings/prohibitions, generation, and current baseline. Those categories already span the four suggested topics. A cautious reader reconstructing “current state” therefore opens all four, even if the router calls some conditional.

For a session that needs all topics, route-map indirection costs more than the single file:

```text
single owner:       P = 30,488 tok
four topics+router: P + at least 1,512 tok = 32,000 tok
delta:              +1,512 tok (+5.0% of current 16.md cost)
```

For a session that needs most topics, the break-even claim requires measured topic-use frequencies and a conditioned denominator: which sessions existed after each topic was created, which tasks required each owner, and whether the reader actually stopped. No such runtime measurement exists. Calling these reads conditional merely from the file layout is PT-11/PT-14's error: inspecting the instruction instead of the reader behavior.

### B5. The context brief does not safely shrink under the current exporter

The current brief is dominated by 16.md §§1-3: **70,225 / 77,190 bytes = 91.0%**. `context-brief.sh:87-90` extracts those exact sections from one exact path.

- If the exporter remains unchanged, it exports router stubs or `NOT OBTAINED`; size falls because current truth is missing.
- If the exporter is updated to concatenate equivalent topic content, the 70,225-byte payload remains. Four extra measured minimum shells add up to **4,284 bytes** as a conservative metadata proxy, yielding up to 81,474 bytes before new route/cross-owner text. The exact exporter overhead depends on the eventual format, but zero or negative overhead is not credible.
- If only a task-specific subset is exported, the brief is no longer a generic current-state brief. It needs a task-to-owner classifier with wrong-owner/no-owner controls, which does not exist.

Thus the current script provides no arithmetic path where the brief both shrinks and preserves all current truth. A small byte count alone is not evidence for the “without loss” half of the claim.

## C. Wrong-owner read and no-owner read

### C1. Worked wrong-owner example

Question to a fresh session: “Design the next managed device-knowledge architecture.”

1. The router selects **product + architecture rulings** and exposes `16.md:223`: the next candidate name and a long list of planned concepts/reference implementations.
2. It does not select **batons**, where `16.md:168` says the pivotal claim—adding Device knowledge increases supported scope—is a Human expectation, **not proven product value**, and the schema is not settled.
3. It also misses **session control**, where `PRIMARY_OBJECTIVE: UNSET` and “着手権限ではない” live (`16.md:23-30`).

The selected owner is not nonsensical; it is the most plausible owner. That is why this is worse than a broken link. The session can produce a coherent architecture under authority it does not have, treating an unproven hypothesis as a settled premise.

### C2. Worked no-owner example

Two real copies currently make the safety relation visible in one read:

- §1: “**production 実装へ自動的に進まない**” (`16.md:41`).
- §3: “**この裁定を受けても production 実装へ自動的に進まない**” and wait for a newly declared objective (`16.md:196`).

During de-duplication, the session-control owner can say “this is a settled product ruling, so product owns it”; the product owner can say “work authorization is session control, so control owns it.” The router points to both valid files, but the prohibition is in neither. No stale-file or duplicate-owner check can detect an absent relation unless a pre-split fact inventory is compared against the union of all destinations.

The single-file architecture can have a missing fact, but it cannot have this **inter-owner mutual-assumption state**: there is only one candidate owner, and `handover-diff` compares that owner directly. The split adds both a topic-classification error surface and a union-completeness error surface.

## D. Items that must remain unconditional

This section is derived independently from the cheaper alternative in F. It does not make Human rulings conditional to improve the arithmetic.

1. **Purpose and current-authority identity:** §0, the canonical-owner/router generation, and the history/current-authority boundary (`16.md:3-19,107-112`). Harm if missed: wrong project, donor treated as project, or historical “next” used as current authority.
2. **`PRIMARY_OBJECTIVE` state and authority qualifiers:** `UNSET`, both candidate menus, the fact that neither is authority, and “one GO = one declared objective” (`16.md:23-41,184`). Harm: unauthorized investigation or implementation.
3. **The complete GO/STOP boundary:** everything waiting on GO, every action that always needs its own GO, and every forbidden-without-ruling item (`16.md:99-105`). Harm: donor/production mutation, gate-threshold changes, licence/visibility changes, paid/account activity, or scope expansion.
4. **All batons, statuses, owners, and triggers (§2):** `local/README.md:37` explicitly lists Human batons, OPEN/HOLD, and deferred triggers as non-trimmable. Harm: a pending Human decision disappears, a HOLD is acted on, or a trigger is silently forgotten. A task-specific conditional read is unsafe because a baton often supplies the limitation on a ruling in another topic (batons 38, 39, 47, 48, 51, 52).
5. **All Human rulings and their rejected/supersedes relations (§3):** the Human instruction for this packet is decisive—if conditionality increases the chance of missing a Human ruling, it is not allowed. The whole §3 therefore remains unconditional unless the Human changes that instruction. Particularly load-bearing subsets are:
   - independent-project/public-repo/secrets/donor-governance/Project_Template boundaries (`16.md:177-185`);
   - dedicated Compiler, AI/LSP roles, Web/Helper/Desktop boundaries, Monaco, `main.cpp`, platform targets, and no automatic production work (`16.md:186-196`);
   - product value/definition, Web value, no Blockly return, Verified/Custom, Human review before promotion, real compile/evidence over AI self-report, and risk-based—not count-based—QA (`16.md:200-208`);
   - **Opus 5 solo prohibited**, with `codex tool calls = 0` making an objective unmet, and the reinforced S007 form that only Human can lift (`16.md:213,224`);
   - S007 final evidence state, the Human's correction about why industrial IoT work stopped, Device Knowledge as an unproven expectation, Home Assistant intent, auto-Web-UI correction, and the renamed next candidate (`16.md:218-223`);
   - provisional 96 KiB threshold, no repeated increase without GO, and no deletion of current truth to move the signal (`16.md:225`).
6. **Cross-evidence ordering instructions that change interpretation:** especially “read 09 before 08” (`16.md:96-97`). Harm: a superseded integration claim becomes current truth.
7. **Current baseline and commands (§5):** generation, absence of application code, current plans/cases/session state, read-load status class, and commands that re-measure them (`16.md:253-279`). Harm: stale claims are transcribed or an instrument is never run. Values should be remeasured, but the obligation and command owner must be present before work.

Potentially conditional without violating this list are historical objective-output inventories and evidence-directory navigation that have a reliable trigger, plus §4 loop/template-feedback detail. Their safe conditionality must be demonstrated; it cannot be assumed from headings.

## E. Minimum executable conditions for withdrawing the objections

Each criterion has an explicit pass/fail rule. The eventual names of new helper scripts are not prescribed, but an equivalent executable check must exist; prose-only compliance is a fail because DT-3/PT-36 show that described triggers do not fire.

| ID | Objection withdrawn only if | Command / inspection and pass rule |
|---|---|---|
| E1 | Every pre-split current-truth item has exactly one canonical destination or an explicitly declared multi-owner invariant. | Generate a pre-split inventory covering §1 facts, every parsed §2/§3 entry, §5 responsibilities, GEN, and authority boundary. Compare it with the union of post-split owners. **PASS:** source count = mapped count; missing=0; ambiguous=0; every duplicate is an identified invariant rather than accidental copy. Human/integration-owner inspection must sign off every mapping row. |
| E2 | The unconditional owner set is explicit and identical in hook, CLAUDE.md contract, read-load roster, context brief, and router. | Run `bash scripts/read-load.sh` plus a purpose-built set-diff command. **PASS:** all five sets print denominators and are equal both directions; zero sets are an error; RC=0. A mutation removing each owner from each set must make one named test red. |
| E3 | Every unconditional owner is actually delivered or read at cold start. | Execute `.claude/hooks/session-start.sh` in a fixture and run a fresh-session replay with no prior context. **PASS:** the emitted/observed owner list equals E2 and the fresh actor answers the fact questionnaire in E7. Merely finding paths in source is fail. |
| E4 | All owner generations equal the router and newest session, and stale-owner detection has power. | Run an extended selftest. **PASS:** `N/N` owners carry the same GEN as router and newest session; mutate each owner's GEN one at a time; the named generation test fails `N/N`; restore and confirm green. |
| E5 | `handover-diff` scans every owner in both versions and detects loss from each. | Run `bash scripts/handover-diff.sh`. **PASS:** `SCANNED=N`, `DISTINCT=N`, and parsed-entry counts per owner are non-zero where expected. Delete one uniquely identified test entry from each owner copy; exactly that removal is `GONE`; an absent/malformed owner produces non-zero `INSTRUMENT_ERROR`, never `GONE (0)`. |
| E6 | Close cannot land a partially updated owner set. | Execute close logic in a throwaway copy with one owner left at the previous GEN/content. **PASS:** close gate exits non-zero before commit; control with all owners updated in the same candidate commit exits zero. Inspection: close.md must enumerate the owner manifest rather than literal filenames maintained separately. |
| E7 | Cold-start semantic restoration is at least as strong as the single-file baseline. | In a tree with `sessions/` empty, ask a parser **and a fresh model** about: objective/authority, GO/STOP, baton statuses/triggers, settled+superseded rulings, all prohibitions, Opus-solo rule, S007 evidence state/order, baseline, GEN, and current authority. **PASS:** all expected answers and their qualifiers are present; wrong-owner/no-owner count=0. Negative controls remove one item from every topic in turn and must fail the corresponding question. |
| E8 | Cross-owner relations are executable invariants. | Maintain explicit IDs for at least the real pairs 38↔S005 value↔S007 evidence state, 51↔Device-Knowledge hypothesis, and §1↔§3 production prohibition. **PASS:** a command resolves both ends and qualifier equality; deleting or changing either end fails. Phrase-presence alone is fail. |
| E9 | Router selection has positive and negative controls for multi-domain tasks. | Run a scenario table containing architecture, delegation, evidence-reading, donor adoption, gate-threshold, and close tasks. **PASS:** expected required-owner set matches for every row; at least one single-owner and one multi-owner row exist; empty router/table refuses; dropping a route causes a named failure. Then compare with a fresh-model run because a parser cannot prove reader behavior. |
| E10 | Context brief preserves the same current-truth inventory. | Run `bash scripts/context-brief.sh` before/after against a normalized fact manifest. **PASS:** missing=0, extra authority claims=0, all E7 facts present, RC=0. A smaller byte count is reported only after this equality passes. Mutating each owner to absent/empty must make the exporter non-zero or the manifest check red. |
| E11 | Arithmetic uses actual reads, not only declared conditionality. | Instrument a conditioned sample of fresh sessions after the split. **PASS:** report sessions measured/eligible, per-owner open rate, order, and actual token cost; router-only sessions and all-topic sessions are both present. The median/maximum comparison against 65,868 tokens states the tokenizer/proxy. “The docs say conditional” is fail. |
| E12 | The claimed reductions are both material and non-lossy. | After E1-E11 pass, run the two acceptance commands. **PASS:** `bash scripts/read-load.sh` reports a lower total with all required owners measured, and `bash scripts/context-brief.sh \| wc -c` reports a lower byte count with E10 equality green. If either reduction comes from a missing owner, verdict is invalid measurement. |

Until these criteria exist, the optional-capability obligations at `local/README.md:58-59` are necessary but not sufficient.

## F. Cheaper alternative that survives this attack

### F1. Defensible interim: tier the single owner before multiplying owners

Keep 16.md as the sole current owner and add executable section boundaries/`Read limit` behavior within it. Preserve as unconditional the entire D list. Place only genuinely triggered navigation/history material behind conditional boundaries, and make the hook/read-load instrument understand the same boundary. This avoids wrong-owner/no-owner and cross-file GEN classes while measuring whether the available conditional content is large enough to justify a later split.

Two conservative candidate regions in the current file are the closed-objective/evidence-directory navigation block (`16.md:43-98`) and §4 loop/template-feedback state (`16.md:227-252`). Measured together:

```text
82 lines / 10,392 bytes / 3,869 estimated tokens
65,868 - 3,869 = 61,999 estimated tokens
61,999 / 48,000 = 129.2% of allowance
```

This is only an estimate of the maximum safe interim reduction; the final boundary needs E7-style controls because some evidence-order pointers may need to stay unconditional. It does **not** clear the warning. Its value is lower structural risk and a direct measurement of real topic demand before adding owners.

The context brief would not automatically shrink, because it currently exports all of §§1-3. That is honest: reducing cold-start reads and reducing Route B's self-contained brief are different objectives until semantic equality is proven.

### F2. Narrowing hook injection: useful only against duplicate delivery

The hook currently inlines the first **200 lines = 57,995 bytes / 21,914 estimated tokens**. Replacing that body with a tiny pointer could reduce hook payload, but it does not reduce the mandatory full-file read of 30,488 tokens; it merely transfers responsibility to a trigger known to be fallible. A safer variant is to have the hook deliver exactly the executable unconditional slice and explicitly identify the remaining line ranges, with a mutation/replay proving the rest is read when triggered. This can reduce accidental duplicate delivery, but `read-load.sh` currently counts 16.md once, so it must not be advertised as a 21,914-token reduction in the reported 65,868-token metric.

### F3. Translation: not enough and risky for Human wording

`read-load.sh:12-13` records an approximately **-28%** token change from translating the case index with zero line change. Applying that ratio optimistically to all 30,488 tokens of 16.md would save about **8,537 tokens**, leaving roughly **57,331 / 48,000 = 119.4%**. This is an analogy, not a measurement of 16.md; actual translation length/tokenization differs. More importantly, translating Human rulings risks changing their qualifiers. Keeping Japanese verbatim plus English summaries increases tokens. Translation can be piloted on non-ruling navigation prose with semantic review, but it is not a safe substitute for the current-state architecture decision.

### F4. Moving §3 to a conditional append-only rulings file is rejected

It would remove **10,967 estimated tokens** from the nominal unconditional handover, but section D and the Human instruction make all rulings unconditional. A rulings file can be append-only and still be missed. This option gains its arithmetic by violating the safety premise and is not defensible.

### F5. Bottom line on alternatives

The single-file tiering intervention gives a smaller measured benefit with materially fewer new failure classes and should be tested first if the objective is immediate risk reduction. It is not a full budget repair. The topic split may still be the eventual right structure, but only if the parent treats E1-E12 as the acceptance contract. The current proposition—safe preservation plus lower unconditional and brief cost merely from splitting by topic—is falsified.

## Verification record and limits

### Commands run and observed

- `[synthetic]` `bash scripts/read-load.sh` → RC=0; 65,868/48,000 estimated tokens, 137%, 7/7 inputs, `WARNING`; 16.md 30,488 tokens.
- `[synthetic]` `bash scripts/context-brief.sh | wc -c` → clean pre-report tree `77190` bytes; final report tree `77343` bytes because the exporter includes dirty-tree metadata/digest; pipeline RC=0 in both runs.
- `[synthetic]` `bash scripts/handover-diff.sh` → RC=0; 1 current-state file scanned; 61 entries before / 69 now; 1 REWORDED; 0 GONE over 61 compared.
- `[synthetic]` `bash scripts/selftest.sh; echo RC=$?` → `RESULT: 75 passed / 0 failed`; `RC=0`.
- `[static]` section/token probe using the exact estimator equation from `read-load.sh` → 16.md 80,427 bytes / 30,488 estimated tokens; §§1-3 70,225 bytes / 26,749 estimated tokens; first 200 lines 57,995 bytes / 21,914 estimated tokens; minimum owner-shell proxy 1,071 bytes / 378 estimated tokens.
- `[static]` full reads/targeted line reads of every packet-scoped document and script; guard binding lines are cited above.

### Rungs not run

- No production, donor, network, browser, hardware, API-smoke, visual, or real-fire operation was relevant or run.
- No split, migration, mutation of repository guards, or fresh external model cold-start replay was performed; those are acceptance criteria, not evidence currently available.
- The token figures are the repository's Opus-5-calibrated estimate, not a GPT-5.6 tokenizer measurement.

## Out-of-scope finding

**ADJACENT_DEFECT (does not block this packet):** `.claude/hooks/session-start.sh:6` still describes 16.md as “`≤100 lines by convention`,” while `local/README.md:31-37` says that hard limit was abolished by the 2026-08-25 Human ruling. This report does not modify the hook. It is relevant evidence that prose adjacent to the executable hook can remain stale even under the single-owner architecture; a split would multiply such surfaces.

## Conflict surface

The literal conflict is between the attacked proposition's unconditional-cost reduction and the Human instruction that any item whose conditionality increases the chance of missing a Human ruling must remain unconditional. With §2/§3 and the other D items unconditional, content is conserved and measured lower-bound overhead is +1,512 estimated tokens. Making those topic owners conditional is the only large reduction identified, and it violates the stated safety condition.
