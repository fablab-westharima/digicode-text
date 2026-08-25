# Claude Code Judgment-Mistake History — preventing recurrence of the same patterns

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.
>
> **How to append in your project:** cases 1–25 below are DigiCode-origin. The failure *patterns* (A 即断 / B scope自己確証 / C サンプリング全体評価 / D log末尾即断 and their hybrids) recur on any project and any model generation, so the pattern taxonomy and the self-check remain mandatory as-is. Add your project's cases under a `## {{PROJECT_NAME}} cases` section at the end of this file. **Number them with a project prefix (`PT-1`, `PT-2`, …), not plain integers** — harvested cases keep their origin numbering, which now reaches the 80s, so plain numbers collide with the next harvest (revised 2026-08-14; the original advice to number from 36 predates the harvest volume). Use the same format (状況 / 真因 / 失敗パターン / defense pattern / 適用範囲 / 教訓・関連). When a case reveals a structural gap, promote it to a numbered rule and cross-reference both ways.

**Severity:** ★★★★★
**Scope:** common (cross-project)
**Last reviewed:** 2026-08-17 (Project_Template S005 — Part 1 translated to English per user directive "optimize for the model reader; the language need not be Japanese". Identifiers — case numbers, Session-column values, user-verbatim quotes — stay as written; Part 2 bodies are preserved verbatim in their original language. 前 review 2026-06-08: Session 160 formalized case 24 = Phase F-5 local fix → homeBlocking dead [post-symptom-fix impact-scope-unchecked trap, rule 17/18 + reactive_vs_systematic hybrid]. 2026-05-24: Session 138 formalized case 22 founding-use-case-unmet scope discipline — Servo Speed Dialog Phase 1-5 spent 4 sessions / 8 commits with the founding use case (life-size Humanoid gear protection) unsolved, surfaced by user in production smoke; hybrid of case 18 recommendation-kept-after-trap-recognition + case 21 reporting-accuracy regression; two-way reference sync with rule 17. 2026-05-17: 第132 BUG-085 Phase 3 case 20 formalized. 2026-07-07: two-tier restructure — Part 1 mandatory + Part 2 lookup archive, content unchanged)
**Related rule:** `common/12-collaboration.md` (design proposal self-check section)

---

## Part 1 — Mandatory zone (read every time, before design reviews / root-cause confirmation / completion claims)

### Why this file exists

An LLM (Claude) does not "learn and internalize". Even within one session it repeats the same judgment-mistake patterns.
This file is the record its past self fell into, kept for reference every turn.

"Instilling" is structurally impossible; a re-read-every-turn mechanism is what **makes forgetting harder**.

### Mandatory reference timing, and how to read

- When drafting a design review (mandatory at `common/02-design-principles.md` 10-step, Step 1)
- When fixing a root-cause hypothesis (check for similar patterns before concluding)
- When interpreting smoke / verification results
- When claiming "handled" / "done" / "fix complete"

**Two-tier read protocol**: Part 1 (this zone) is read every time. Part 2 case bodies are read only for cases the index below or the self-check flags as suspect. No full read-through of all cases. (Part 2 bodies are preserved verbatim in their original language — identifiers in the index link into them.)

### Case filing is the parent's duty (under orchestration, 2026-08-13, rule 22)

For incidents in delegated-lane work (Codex / subagents) too, **case filing, handover updates and baseline measurement are always done by the parent (conducting session), within the same session**. "Have the implementer write it" / "write it later" never gets written (measured: two sibling projects, 15+ sessions each, zero deferred case files ever appended).

### Case-filing protocol: adversarial retroactive self-application (2026-07-20, origin: Nagaoka S013)

**When you file a new case, retroactively apply its lesson to your own recent claims, pass verdicts and staged deliverables** (in the same session as the filing). A case is not a record about someone else — at the moment of filing, you are the person deepest inside the same trap. If the re-check finds something, fix it or register it as an issue before moving on. Origin evidence: the self-re-analysis right after filing case 43 (explanation beats observation) found, in that session's own staged implementation, 🔴1 (an expectation that would mis-FAIL a correct machine) + 🟡2 — filing alone and moving on would have left all of them latent until the real-machine day.

**Retroactive is not enough — apply it forward too (2026-08-16).** Filing protects **past claims** but not the next hour's verification. Measured twice, same day, independently: the consumer replayed the same shape in the second half of the very session that filed the case ("recording it did not stop the recurrence — that is the finding"), and this project produced PT-12. → **On filing, add one line to the acceptance criteria of the verifications you are *about to* run this session**: ask once, **before** executing, "does this verification step into the shape I just filed?" Do this as the pair of the retroactive check.

### The four failure patterns (common-factor taxonomy)

#### Pattern A: snap judgment
- The moment a root-cause hypothesis appears it is fixed as fact, no further verification
- Hit: BUG-077 first-version fix
- **Defense**: never place an unproven hypothesis in the conclusion; always pass through grep / full enumeration / sample verification

#### Pattern B: self-confirmed scope
- Concluding "this much suffices" without checking the grounds yourself
- Hit: BUG-077 first-version fix (judged M5UnitUnified ignore sufficient)
- **Defense**: enumerate transitive deps / sub-components / alternate paths in full; present the grep results before fixing scope

#### Pattern C: a sample treated as a whole-population evaluation
- Speaking for the whole from n=4 / n=10
- Hit: 第80回末 partial Round 4 60.7% treated as a full evaluation
- **Defense**: state the denominator; state the sampling premise in the conclusion; never report a partial run as a full evaluation

#### Pattern D: root cause fixed from the log's tail alone / head alone
- Judging from output that is truncated or elided
- Hit: 第82回 smoke-truncate problem (judged from the leading "Cloning into..." alone)
- **Defense**: obtain the full raw output; prove zero truncation; smoke must capture full stderr (avoid `[:120]`-style truncation in Python scripts; retain a `[-4000:]` tail if needed)

### Mandatory self-check (before design reviews / conclusion reports)

Before the Decisions-for-user section of any design review, include this self-check section:

```markdown
## Self-check (judgment-mistakes-history.md)

### Past failure-pattern check
- Pattern A (snap judgment): [applies / does not apply + why]
- Pattern B (self-confirmed scope): [applies / does not apply + why]
- Pattern C (sample as whole-population): [applies / does not apply + why]
- Pattern D (log head/tail only): [applies / does not apply + why]

### Evidence-based / sampled / inferred labels
- [judgment 1]: evidence-based (grep results / full enumeration / N=?)
- [judgment 2]: sampled (n=?, denominator=?)
- [judgment 3]: inferred (grounds=?)

### Whether inferred judgments need further investigation
- For each [inferred judgment]: grounds for proceeding without further investigation / what to investigate if not
```

### Case index — a ROUTER, one line each

**What this table is for:** deciding whether to open a case, and finding its body. Nothing else. The narrative, the evidence, the measured numbers and **the defense prescription belong to the Part 2 body** — a row that carries them has stopped being an index and has become a second copy of the case, with the cost paid by every session forever.

That is not hypothetical. Measured 2026-08-25: the median row had grown from 223 bytes (recorded inside case PT-10's own body, which flagged the drift and was followed by no mechanism) to 544, 48 of 81 rows were over 400 bytes, and this table alone was **31.2% of the entire unconditional cold-start read**. The rows were normalised the same day; every original row is preserved verbatim inside its own Part 2 body, and **selftest B57** now checks the split (unique ids, a summary in every row, every id resolving to a body, no defense clause in the index) and prints the byte distribution as an advisory. There is deliberately **no byte cap** — a threshold nobody derived would become a correctness gate (2026-08-25 ruling N-γ).

Read the Part 2 body only for cases whose pattern is suspected. **A number not present in this file is an external reference** — harvested case bodies keep the origin project's numbering, and the template is not a mirror of every project (`OPERATIONS.md` §1); resolution is §外部 case 参照 at the top of Part 2. Numbers correspond to the body text / systematization table's "Nth entry" (Part 2 keeps its original order = partly non-numeric).

| case | 回/Session | Class | One-line summary |
|---|---|---|---|
| 初期1 | 第80回末 (2026-05-04) | C + conclusion by inference | called a partial 60.7% run "PIO cache miss" in one line; the real cause was a 4-layer structure |
| 初期2 | 第82回 (2026-05-05) | D | read only the head of a truncated smoke stderr; the fatal error sat at the tail |
| 初期3 | 第82回 (2026-05-05) | A + B | declared a fix done with 2 lib_ignore entries; a transitive dep was never checked |
| 1 | 第84回 | B (impl layer 1) | Hono streamSSE overwrote a pre-set Cache-Control header |
| 2 | 第84回 | B (impl layer 1) | an i18n defaultValue added in English; dvMismatch +6 |
| 3 | 第84回 | B (impl layer 1) | one mocked Response body shared across calls; locked on retry |
| 4 | 第84回 | B (impl layer 1) | AbortSignal ignored; reader.read() blocked forever after abort |
| 5 | 第84回 | B (impl layer 1) | reader.cancel()'s {done:true} turned a stuck error into "stream ended" |
| 6 | 第84回 | B (impl layer 1) | a stuck error carried status 200, so the retry path was never reached |
| 7 | 第84回 | B (observation layer 2) | a DevTools display quirk was **not** snap-judged as a defect — 5-axis cross-verify settled it |
| 8 | 第84回 | B (design layer 3) | looked only at the client timeout; an independent server-side timeout was missed |
| 9 | 第84回 | B (strategy layer 4) | "needs hardware upgrades" **not** snap-judged; 6-axis isolation cleared it at zero cost |
| 10 | 第85回 | B (scope layer 5, trap-A avoided) | a scope-creep inference disproved by enumerating all 55 callsites (0 deletable) |
| 11 | 第85回 | B (verification layer 6) | a "shorten 30%" inference refuted by pre-implementation grep; implementation skipped |
| 12 | 第86回 | B (snapshot layer 7) | stale stderr inferred as the root cause; fresh smoke after cache eviction showed another |
| 13 | 第86回 | B (cluster layer 8) | callback-signature drift after a lib upgrade, 6 in one file — audit the cluster, not the hit |
| 14 | 第89回 | B (layer 6 verification) | "100% coverage via inheritance" claimed; full method enumeration found the missing API |
| 15 | 第91回 | C/D hybrid | grep truncated with `head -15`, judged "SAFE"; 30+ LAN IPs sat below the cut |
| 16 | 第91回 | A + B | licenses fixed by the "major lib = MIT" convention; 3 were GPL / AGPL / dual |
| 17 | 第91回 | A | a handover draft re-wrote secret values that a history rewrite had removed |
| 18 | 第92回 | B-extension + A-relative | the axes-and-traps self-check consumed as a checklist, and the recommendation kept after recognizing the trap (fired 6× in one session) |
| 19 | 第110回 | B-extension (self-confirmed scope) | a missing UI-layer type contract = 14 same-root latent type leaks across 17 sites |
| 20 | 第132回 | A recurrence + reverse mirror of 19 | a vitest routing pass mistaken for end-to-end runtime verification |
| 21 | 第134回 | A variant (+ 15 relative) | audit exit 0 equated with "0 warnings", and the inferred claim written into the handover |
| 22 | Session 138 | 18 + 21 hybrid | "defer as out of scope" recommended while the founding use case stayed unsolved |
| 23 | Session 139 | 14 + 19/20 + 22 hybrid | settings UI never reaching HW behaviour: 6 orphan-setting incidents in one domain |
| 24 | Session 160 | B + reactive_vs_systematic | a local fix deleted an initialisation write; the default-value-dependent path was unchecked |
| 25 | Session 160 | rule 17 + reactive_vs_systematic | reference physics altered for "originality", then the root cause asserted twice and oppositely from data the broken logic produced |
| 32 | Nagaoka S006 (2026-07-13) | A variant (snap judgment of the *speaker*) + rule 12/13 | a "着手GO" quoted inside another AI's answer mistaken for the user's own GO |
| 33 | Nagaoka S006 (2026-07-14) | B (measurement-design version) | a measurement window designed without desk-tracing what actually falls inside it |
| 34 | Nagaoka S007 (2026-07-14) | A + D relative | time-series clocks aligned on an unverified anchor — 23.8 s off, and a false "never fired" table emitted |
| 35 | Nagaoka S007 (2026-07-14) | recurrence of a recorded trap | the pkill self-kill replayed; its PID-file defense had silently written to HOME |
| 42 | Nagaoka S012 (2026-07-20) | 32 variant + 18 meta-trap | "GO for investigation" self-expanded into "GO for physical operation", undeclared |
| 43 | Nagaoka S012〜13 (2026-07-20) | dialogue version of 33/38 | the user's on-site observation answered with "works as designed" and never converted to a measurement |
| 59 | Nagaoka S023 (2026-07-28) | C + B + A | "does not exist" derived from 5 commercial products; the field's review paper was in the search hits, unopened |
| 82 | LaserEditor S012 (2026-08-13) | D, tooling version | `test \| tail && commit` — the pipe hid the exit code and red tests were pushed |
| 83 | LaserEditor S012 (2026-08-13) | B, test version | a mock written from assumptions diverged from the real CLI; 3 defects survived to the real machine |
| 85 | LaserEditor S014 (2026-08-14) | B, synchronization version | one poll reused as the synchronization point for a different resource; intermittently red |
| 86 | LaserEditor S014 (2026-08-14) | B, information-design version | operational information cut because the approved mock did not contain it |
| 87 | LaserEditor S015 (2026-08-14) | B, verification-means version | a UI rebuild accepted by static matching alone; the user's first screenshot showed 6 more defects |
| 88 | LaserEditor S015 (2026-08-14) | rule 21, verification-environment version | a UAT environment handed over unwalked; it rejected the user at the door |
| 110 | LaserEditor S025 (2026-08-18) | 82 **recurrence** (rule 18 relative) | close fused the gate with commit+push, `$?` took tail's 0, and a red gate reached origin |
| 111 | LaserEditor S027 (2026-08-18) | 96/99 family, **ssh-multilayer version** | inline instrument code broke twice across ssh→sh→docker quoting; one probe never ran at all, silently |
| 112 | LaserEditor S033 (2026-08-20) | 94 **replay, real-harm version** | a mutation restored with `git restore` took the delegate's uncommitted fix with it |
| PT-1 | Project_Template S001 (2026-08-14) | 63 family + A, rule-writing version | rule 22's environment premises written from secondary sources — and the user's `settings.json` edited on them |
| PT-2 | Project_Template S001 (2026-08-14) | 87 family, observer version | another actor's acceptance criteria praised as rigorous; every one of them was static matching |
| PT-3 | Project_Template S002 (2026-08-14) | PT-1/63 family + A, regulation-writing version | regulations drafted without opening the regulation and the write target they govern (twice in one session) |
| PT-4 | Project_Template S002 (2026-08-14) | 82/83/85/87 family, self-written-script version | own checks silently wrong and false green, twice in one session |
| PT-5 | Project_Template S002 (2026-08-14) | D variant (absence of observation read as a state) | monitoring silence read as "the peer is idle"; the filter had dropped exactly the event kinds a cold start is made of |
| PT-16 | Project_Template S005 (2026-08-17) | B + PT-6/PT-13 family | common-layer text authored while the tightest consumer's read budget was checked only on the authoring side |
| PT-17 | Project_Template S005 (2026-08-17) | B + 82/85 family | a multi-target `git checkout` aborted whole; the "restored" check had sampled a different file |
| PT-18 | Project_Template S005→S006 (2026-08-17) | **authority violation** (22/64 family) | a user-owned gate went red and the conflict with a continue instruction was settled alone instead of returned |
| PT-19 | Project_Template S005→S006 (2026-08-17) | **state-model defect** (control-signal version of 21) | completion words acted as state transitions; push and close proceeded over a red gate |
| PT-20 | Project_Template S005→S006 (2026-08-17) | **evidence defect** (21/PT-15 family) | 「push 完了」 written into a close report while the commit never reached origin |
| PT-21 | Project_Template S006 (2026-08-18) | **environment incident** + PT-20 family exposure | 5 uncommitted evidence files vanished — cause UNKNOWN; recovered from the session's Write history |
| PT-23 | Project_Template S008 (2026-08-18) | PT-4/PT-11 family, **success-message version** | a check's green message asserted coverage its own new guard had switched off |
| PT-27 | Project_Template S009+ (2026-08-19) | PT-13 family, **user's-goal version** | the user's declared goal was met hours earlier and every report still ended in a GO question |
| PT-29 | Project_Template S011 (2026-08-25) | 115 family, **guard-keyed-to-wording version** | 3 guards went red on a legitimate rewrite, and the cheapest green in each case was to put the old wording back |
| PT-28 | Project_Template S010 (2026-08-24) | PT-4/96 family, **verifier's-own-input version** | a neutrality check grepped six paths joined into one shell word; "0 hits" meant nothing had been opened |
| PT-24 | Project_Template S009 (2026-08-19) | PT-3/PT-6 family, **namespace-collision version** | the free-slot inventory and the write ran in one batch; the new label collided with a legacy one |
| PT-25 | Project_Template S009 + DigiCode G3 (2026-08-19) | rule 18 family, **tooling, cross-project** | the recorded pipe-RC trap replayed twice in one deploy and once again in the receiver |
| PT-26 | Project_Template S009 (2026-08-19) | rule 17/20 family, **effect-vs-name boundary** | a push GO'd as "4 harmless files" reached a production auto-deploy; the boundary had been written in artifact names |
| PT-22 | Project_Template S006 (2026-08-18) | **PT-20 recurrence, same day the defense shipped** | files recreated and labelled 「完全復元」 with no reference artifact to diff against |
| PT-15 | Project_Template S004 (2026-08-17) | PT-10 replay + withdrawal of the recommendation | asked "are the rules functioning", measured "are they being opened", recommended on it — then withdrew |
| PT-14 | Project_Template S004 (2026-08-16) | rule 04 §instrument-dimension, unapplied to observing | 「監視」 taken in its everyday sense for 20 hours; the 5 enumerated points sat in context, untraversed |
| PT-13 | Project_Template S004 (2026-08-16) | mission forgetting + the countermeasure never loaded | the anti-forgetting anchor sat as an unfilled placeholder for 4 whole sessions |
| PT-12 | Project_Template S004 (2026-08-16) | 18 meta-trap, **time-shifted, author's version** | a mutation that never created the condition, nearly read as "the check is defective" |
| PT-11 | Project_Template S004 (2026-08-15) | PT-4/PT-10 family (the check inspected the instruction) | the check verified that the document *says* "read §Core only", not that a reader can stop there |
| PT-10 | Project_Template S003 (2026-08-15) | proxy reported as the quantity itself | the read budget counted in lines and quoted as read load; the two move in opposite directions → promoted to rule 04 §A gauge reports its unit |
| PT-9 | Project_Template S003 (2026-08-15) | next door to PT-6 + rule 17 inverse (narrowing side) | a hole in my own enforcement, named out loud, left open "until the peer files a case" — the peer stepped in it the next day |
| PT-8 | Project_Template S003 (2026-08-14) | rule 17 inverse, **inclusion-side** | 30 case bodies bulk-imported from another project to resolve dangling refs — index +35 lines, paid by every future session |
| PT-7 | Project_Template S003 (2026-08-14) | PT-4 family (own check wrong) | the sentence warning "never carry an identifier without opening it" was itself written without opening it |
| PT-6 | Project_Template S002 (2026-08-14) | 18 meta-trap, **author's version** | wrote an enumeration table, then edited a file on its left edge an hour later without opening it once |
| 60 | Nagaoka S023 (2026-07-26) | A variant (investigation cut off by a label) + proxy metric | investigation stopped on an "unconfirmed" label and a firing count, twice in one session |
| 61 | Nagaoka S023b (2026-07-26) | B (write side tracked, restore path not) | confirmed who writes 9 condition values, never asked who restores them; 8 leaked into normal runs |
| 62 | Nagaoka S023 (2026-07-28) | 56/57 family + overreacting correction | an unsourced model number and a wrong client name in a delivery document |
| 63 | FabCanvas S017 (2026-07-29) | A + B (secondary source trusted) | a UX-preserving re-implementation driven by a self-written spec; a core step existed only in the code |
| 64 | LaserEditor S004 (2026-07-30) | rule 17 violation, post-hoc-disclosure version | "out of scope" decided and implemented unilaterally, then disclosed after completion |
| PT-30 | Project_Template S012 (2026-08-25) | PT-12 family, **reader-of-the-instrument version** | the mutation fired; the harness's red-line parser missed two id shapes and reported false survivors |
| PT-31 | Project_Template S012 (2026-08-25) | PT-2 family, **control-passing-for-the-wrong-reason** | the rubber-stamp control refused for an unrelated reason — `K` was never exercised |
| PT-32 | Project_Template S012 (2026-08-25) | **PT-23 recurrence, one hour apart** | the ok-string the healthy repository actually emits was the one branch left unlabelled |
| PT-33 | Project_Template S013 (2026-08-25) | PT-4/PT-17 family, **verifier-shares-the-defect version** | a lossless-move proof split table rows on `\|` exactly as the broken mover had, so 5 truncated relocations read as 81/81 preserved |
| PT-34 | Project_Template S015 (2026-08-25) | rule 04 §absence-control family, **prohibition-instrument version** | the shadow auditor was only ever run against violations, so its permitted-side error was unobservable — and it flagged the parent's own duties |
| PT-35 | Project_Template S015 (2026-08-25) | PT-34 neighbour, **time-decay version** | a guard killed its mutation at birth and silently stopped detecting it when the data moved — no edit to the guard, no diff anywhere |
| PT-36 | Project_Template S016 (2026-08-25) | PT-11/PT-14 family, **trigger-does-not-reach-the-moment version** | a 16-minute measurement was launched over a tree still being edited; the "evidence is the FINAL tree" discipline existed, and its only trigger was the close boundary |
| PT-37 | Project_Template S017 (2026-08-25) | PT-33 family, **display-read-back-as-data version** | text copied out of a column-truncating preview was written back as the whole line, silently deleting the tail of three rule headers |

Note: cases 1–6 are #1 / #2 / #3–#6 inside Part 2's 「第84回 1-6 件目」 section. Later case bodies referring to "case 1 snap judgment (whole conclusion without evidence)" mean 初期1 (第80回末), the snap/inferred conclusion.

---


## §外部 case 参照(本 file に本文が無い番号)

テンプレートは「次の新プロジェクトが使う最良の断面」であって全プロジェクトの鏡ではないため、収穫 case が引く
origin 側の番号すべてを取り込むことはしない。**教訓が構造的なものは rule に昇格させ、case 本文は起票元に残す。**

**この節は 2 種類の番号を扱う正式 registry である**(2026-08-25 user 裁定 N-9 = YES、Phase 7):

1. **この file から参照されていて本文が無い番号** — 引用の解決先。これが元の用途。
2. **lesson が Project_Template 側で昇格済みだが、本 file が参照していない外部番号** — つまり *provenance だけが欠けている* 収穫。取り込むのは 1 行の由来記録のみで、**case 本文を複製せず、新しい rule も作らず、lesson 本文の owner を二重にしない**。

拡張の理由: 収穫を主張した commit message と index の間に差が生じても、それを測れる場所が repository 内に無かった。行が無いことは「まだ収穫していない」とも「収穫したが書き忘れた」とも読め、後者は cold start が番号を探して 0 件を得るまで見えない。**registry の役目は防御ではなく追跡である** — 防御(mechanism)は昇格先の rule と guard が既に負っている。

| 番号 | 実体 | テンプレート側での扱い |
|---|---|---|
| 29 / 30 / 31 / 41 / 56 / 57 / 58 | Nagaoka-Clay3DP | 収穫済み case 本文が引いている origin 番号。本文は起票元にある(`Nagaoka-Clay3DP/prompt/maintenance/global/rules/common/judgment-mistakes-history.md`) |
| 69 | LaserEditor S004 | **本 file の case 64 と同一事案**。収穫時に 69→64 と振り直したため rule 17 の引用が引けなくなっていた(引用は訂正済み)。振り直しは今後行わない |
| 75 | LaserEditor S007(死にコードを機能の存在証明にした) | 教訓は `06-dead-code-removal.md` §Dead code is not evidence へ昇格 |
| 84 | LaserEditor S013(良さの正体を保存条件化せず反復) | 教訓は `14-decision-framework.md` §Before iterating へ昇格 |
| 113 | LaserEditor S033→S034(委譲後に親が同一 scope を再実行し、委譲の利得が消えた — 単発事故ではなく構造的な過剰適用) | **上記 2 の型**。lesson は既に昇格済み: `22-model-orchestration.md` §Delegation exclusivity / §Bounded review / §Delegation action classification、`04-testing-strategy.md` E1-E2-E3、`03-coding.md` §no-parent-shadow、`CLAUDE.md` §6、selftest B33–B36 / B39 / B62 / B63、`scripts/shadow_audit.py` v3。**本文は起票元にある**。この行が存在する理由は 1 点のみ — commit `d95e728` が「Case 113 harvested」と書いた一方で、本 file の `113` 出現回数は **0**(positive control `112` = 8、実測 2026-08-25)だった。教訓の穴ではなく bookkeeping の穴であり、修正したのはそれだけである |

## Part 2 — 照合アーカイブ(該当 case のみ読む。全 case 本文を verbatim 保全)

## 判断ミス記録 (時系列)

### 2026-05-04 第80回末 partial Round 4 60.7% を「PIO cache miss」誤断

- 状況: 1000-case Round 4 の partial 結果 (498/1000 = 60.7%) を「PIO cache miss」一行で defer + handover
- 真因: Heltec lib pollution + bootstrap 25 import 欠落 + RP2040 OTA template + RP2040 lib_deps の **4 層構造**
- 失敗パターン: **partial 報告書を全体評価扱い、cache HIT で偽陽性を見抜けず、「と推察」で結論**
- 救済: user 厳格指示 (53.md/54.md/55.md 起案) で全 20 boards 実証 → 真因 4 件確定 → 56.md (RP2040 削除) に発展


> *Part 1 index row for **初期1** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第80回末 (2026-05-04) | C (+ conclusion by inference) | mis-called a 1000-case partial 60.7% "PIO cache miss" in one line; real cause was a 4-layer structure

### 2026-05-05 第82回 smoke truncate 問題 (BUG-077 仮説誤判断)

- 状況: 56.md Phase 3-bis smoke で esp32c3 × 3 fail、stderr 120-char truncate → 冒頭 "Cloning into ..." を見て「git clone fail」と誤判断、BUG-077 真因仮説を「git 競合 / DNS / proxy / chain 副作用」で起案
- 真因: smoke output が truncate されており、末尾の本物の fatal error (M5UnitUnified ESP32-C3 不互換) が見えていなかった
- 失敗パターン: **冒頭の「Cloning into...」だけで真因確定、末尾の fatal error を見ていない、log truncate ゼロを実証していない**
- 救済: Phase 3-bis-4 後 ssh ml30 + curl direct call で full stderr 取得 → 真因確定


> *Part 1 index row for **初期2** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第82回 (2026-05-05) | D | judged "git clone fail" from the head "Cloning into..." of truncated smoke stderr; the fatal error at the tail unread

### 2026-05-05 第82回 BUG-077 初版 fix transitive dep 見落とし

- 状況: M5UnitUnified ESP32-C3 不互換と確定 → `lib_ignore = M5Unified, M5UnitUnified` で fix
- 真因: M5Unit-ENV (別 lib、`m5stack/M5Unit-ENV@^1.3.2`) が M5UnitComponent.hpp (M5UnitUnified の base class header) に **transitive 依存** していた = ignore で消えた header を引いて compile fail。Follow-up grep で M5Unit-ENV/src 全 9 unit_*.hpp が M5UnitComponent.hpp 参照と判明
- 失敗パターン: **「真因が見えた瞬間に即断、依存グラフを全件追わない」、transitive header reference grep を全 lib_deps lib 内で実証していない、scope の自己確証**
- 救済: user 指摘 (「初版 fix scope で transitive dep 全件確認が漏れた」) → grep 全件実施 (`#include <M5UnitComponent|M5Unified|M5HAL|M5GFX|M5Utility>` 全 lib_deps libdir grep) → M5Unit-ENV 追加 ignore で完全 fix

---


> *Part 1 index row for **初期3** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第82回 (2026-05-05) | A + B | BUG-077 fix declared done with 2 lib_ignore entries, transitive dep (M5Unit-ENV) unchecked

## 第84回 (2026-05-05) Pattern B mitigation 追加 6 件 — ε (SSE streaming) production smoke 経由

第82-83回末の 8 件 (initial) に加え、第84回 BUG-078 解消作業 (commit #2-#4 実装 + Phase 5-A〜5-D production smoke) で **+6 件 mitigation 連続実装**。Pattern B defense pattern が **「実装 → 観測 → 設計 → 戦略 → scope → 検証」と層上昇** する体系化を実証。

### 第84回 1-6 件目 — commit #2-#4 実装 defect の commit 前捕捉 (6 件)


> *Part 1 index row for **2** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (impl layer 1) | added i18n defaultValue in English, dvMismatch +6; caught by pre-commit audit-i18n

> *Part 1 index row for **3** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (impl layer 1) | vi.fn().mockResolvedValue() shared one Response body; locked on retry

> *Part 1 index row for **4** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (impl layer 1) | parseSseEvents ignored AbortSignal; reader.read() blocked forever after abort

> *Part 1 index row for **5** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (impl layer 1) | reader.cancel()'s {done:true} resolve turned a stuck error into "stream ended"

> *Part 1 index row for **6** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (impl layer 1) | stuck error carried status 200 so shouldRetry=false; never reached the retry path

#### #1 — Hono streamSSE c.header() override defect (commit #2 server.ts)

- **状況**: SSE endpoint の 3-layer mitigation header (`Cache-Control: no-cache, no-transform` + `X-Accel-Buffering: no`) を `c.header()` で pre-set
- **真因**: Hono v4.6.13 streamSSE 内部 (`sse.js:59`) で `c.header('Cache-Control', 'no-cache')` を default replace mode で上書き、`no-transform` directive 消失 = Mintlify postmortem 教訓の CF auto-compression bypass が不完全
- **発見**: commit 前 local smoke 1 巡目で response header 確認 → no-transform 消失検出
- **修正**: streamSSE() 戻り Response の `.headers.set()` で post-override (sync 返却で Headers mutable、commit 前修正)
- **教訓**: 3rd party library の internal implementation に依存する設定 (header / state) は smoke で実証必須、library upgrade 時の regression 監視も必要

#### #2 — frontend i18n dvMismatch 6 件 (commit #3 compileService.ts)

- **状況**: `editor.compileLog.sse.*` 6 keys × 5 lang i18n 追加で `defaultValue` に英語 string を設定
- **真因**: project audit-i18n convention は **`defaultValue` が canonical JA value と一致必須**、英語 default だと JA 翻訳と不整合 (dvMismatch baseline 0 → +6)
- **発見**: commit 前 audit-i18n run で +6 mismatch 検出
- **修正**: 全 6 件の `defaultValue` を canonical JA value (i18next interpolation syntax) に揃え、dvMismatch 0 復帰
- **教訓**: project-specific audit convention は前提知識、新 namespace 追加時に audit baseline 維持を smoke で確認

#### #3-#6 — orchestrator stuck detection 4 件 (commit #4 compile-client.ts + tests)

実装中に **連続 4 件 defect を smoke で捕捉 + 即修正**:

1. **vi.fn().mockResolvedValue() で Response body shared、retry 時 locked**: mockImplementation で fresh Response per call に修正
2. **parseSseEvents が AbortSignal 受け取らず、ctrl.abort() 後も reader.read() 永久 block**: signal-aware refactor (reader.cancel() onAbort listener 追加)
3. **reader.cancel() は read() を `{done: true}` で resolve させる (reject せず) ため silent break、stuck エラーが「stream ended」に化け**: signal.aborted post-loop check + abort reason 伝搬で「stuck: 30ms no event」エラーを正しく返却
4. **stuck error が status: 200 を含み shouldRetry が false 返却**: status omit (network error 扱い) で retry 経路に正しく乗せる

加えて orchestrator integration test の mock HTTP server が JSON 同期 endpoint mock のままで Content-Type mismatch fail → SSE format 返却に更新 (5 件目)。

- **教訓**: 同 commit 内で **連続 5 件 defect** を smoke で捕捉した実例、Pattern B mitigation の威力。「parser 動作確実」「stuck detection 動作確実」と断言する前に test n=N で edge case 全件 cover、`reader.cancel()` の WHATWG Streams API nuance (read() を {done:true} で resolve、reject せず) のような library 内部実装の細部は smoke でしか検出不能。

### 第84回 7 件目 — 観測 medium (Chrome DevTools UI) の歪み

- **状況**: Stage B production smoke (browser) で Chrome DevTools Network → Headers tab に `Cache-Control: no-cache` のみ表示、no-transform 消失観測。Stage A curl では `no-cache, no-transform` 両方含む。
- **候補仮説**: ① post-override 機能不全 / ② CF Tunnel strip / ③ Hono internal / ④ DevTools UI quirk
- **5 axis cross-verification**:
  - axis 1 (ssh ml30 → localhost 直接 HTTP/1.1): `no-transform` 含む ✅
  - axis 2 (Stage A curl HTTP/2 + CF Tunnel): 含む ✅
  - axis 3 (browser-mimic curl HTTP/2 + Accept-Encoding gzip,br,zstd): 含む ✅
  - axis 4 (user 確証 curl Stage B 同条件): 含む ✅
  - axis 5 (Chrome DevTools UI rendering): subset 表示 (UI quirk)
- **結果**: ④ DevTools UI rendering quirk 確定。raw HTTP response には no-transform 含まれており、browser の HTTP cache 動作には正しく反映 (実害ゼロ)。defense-in-depth 完全機能。
- **教訓**: production smoke で観測値がズレた時、**観測機器 (DevTools / browser / network tool) 自体の rendering quirk** も candidate として cross-verify 必須。「実装 defect」と即断する Pattern B 警戒対象。
- **defense pattern**: 5 axis cross-verification (server / CF / browser-mimic / user 確証 / 観測 UI)


> *Part 1 index row for **7** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (observation layer 2) | did not snap-judge DevTools' subset Headers display as an implementation defect; 5-axis cross-verify settled it as a UI quirk

### 第84回 8 件目 — 設計時 scope 不完全把握 (Stage D v1 server-side timeout 見落とし)

- **状況**: Stage D v1 で humanoid_init + heavy lib cluster 4 件 timeout fail、`error: "timeout after 300000ms"` 観測 (`--timeout-ms 360000` 指定したのに 300000 で fire)
- **候補仮説**: ① client `--timeout-ms` 反映漏れ / ② AbortSignal hardcoded / ③ stuck detection 累積 / ④ server-side 独立 timeout
- **4 axis 真因究明**:
  - axis 1 (orchestrator.ts CLI parse): `timeoutMs` 正常 parse、`attempt()` に伝搬 OK
  - axis 2 (compile-client.ts attempt): overallTimer 正常実装 (`"overall timeout after Nms"` format)
  - axis 3 (results.jsonl error message): `"timeout after 300000ms"` は client format と異なる、別 source
  - axis 4 (compile-api/src/compile.ts:527 + Dockerfile + container ENV): `COMPILE_TIMEOUT_MS=300000` が **Dockerfile baked** (45.md Phase 2 で 180s→300s 拡大済) 真因確定
- **cascade 確認**: case_0702/0716 = server SIGTERM 300s / case_0660/0667 = client overallTimer 360s × 2 retry = 720s (server event:error 不達 or stuck で client overall fire)
- **修正方針 B 採用**: docker-compose.yml `environment` で `COMPILE_TIMEOUT_MS=900000` override + restart (~10s、永続化は Phase 6 amendment 7 で Dockerfile bake)
- **教訓**: 「client-side timeout 調整で対処可能」と推察した時点で、**server-side の独立 timeout source の存在確認が必須**。設計時 scope は実装層 (frontend / backend / infra) を全部辿る必要、layer 1 つ (client) だけ見て対処判断は不完全。
- **defense pattern**: 多層 timeout source の cross-verification (CLI parse → client attempt → server compile → infra ENV var)


> *Part 1 index row for **8** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (design layer 3) | looked only at the client timeout, missed the independent server-side timeout (Dockerfile-baked ENV)

### 第84回 9 件目 — ML30 ハード強化即断防止 (戦略級判断、GAFA 罠 defense)

- **状況**: Stage D v2 で heavy cluster wall 200-509s 観測、ML30 性能限界か / Docker overhead か / cgroup 制限か / PIO 並列数限定か / 真因不明のまま「ハード強化必要」と即断するリスク
- **user 戦略認識**: 「**リソース投入**」より「**真因究明**」が先、検証なし投資はハイスペック機 / クラウド移行で改善せず resource waste のリスク (RP2040 排除と同等の戦略級判断)
- **ML30 Docker 脱却検証 6 axis 実施**:
  - axis 1: host nproc 4 = container nproc 4 → cgroup CPU 制限なし、**case 1 REJECTED**
  - axis 2: docker-compose CPU/memory limits 未設定 → 制限なし、**case 1 補強 REJECTED**
  - axis 3: 実 CPU% snapshot (lib_deps fetch phase 限定観測、gcc compile phase 観測 ならず)
  - axis 4: PIO 並列数 = `multiprocessing.cpu_count() = 4`、`PLATFORMIO_*` env override なし → **case 3 REJECTED** (PIO 自動で 4 cores 使用)
  - axis 5: container compile wall 実測 (Stage D v2 自体が 77 件 × parallel=4 で 2322s = 実測代替)
  - axis 6: **parallel efficiency = sum(per-case walls) 9023s / 4 / actual run 2322s = 97.1%** → **case 2 (Docker overhead) REJECTED** (97% efficiency = Docker は parallel batch に impact なし)
- **判定**: case 1/2/3 全 REJECTED、case 4 (ML30 ハード) 該当だが許容範囲内 (max 509s < 600s threshold)
- **結論**: Docker 脱却 不要 / 環境 pinning 不要 / ハード強化 不要 / クラウド移行 不要 / **投資ゼロで release gate 解消**
- **教訓**: 「ハード強化が必要」と即断する前に、cgroup 制限 / Docker overhead / PIO 並列数を切り分け必須。GAFA 罠 defense pattern: **リソース投入の前に真因究明**。parallel efficiency 97.1% = Docker overhead ほぼゼロ実証 = 高スペック機投資の前提条件 (ハードボトルネック) 不成立。
- **defense pattern**: 戦略級判断でも cross-verification、実データで投資判断、抽象 (「Docker でローカル/クラウド統一」) を実態 (heavy cluster wall 分布) で再評価する姿勢


> *Part 1 index row for **9** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (strategy layer 4) | did not snap-judge "ML30 needs hardware upgrades"; 6-axis isolation cleared the release gate at zero investment

### 第85回 10 件目 (2026-05-05 Phase 5.5 で正式化) — scope creep 検出パターン (不在実証 = defense 機能)

- **当初状況 (第84回末)**: humanoid_init lib_deps 過剰包括 (M5Unit-ENV / MAX30105 等、教育用ロボットには不要候補) と推察、Stage D v2 で max 509s 観測 = lib resolve cost が支配的
- **第85回 Step A grep evidence 検証** (frontend src/blocks 全 72 .ts + compile-api/templates/ 全 4 .ino + compile-api/libs/ 全 7 dir + transitive dep + alias header):
  - COMMON_REGISTRY_LIBS 38 件: 削除可能 0 件 (Adafruit_BusIO 0 direct hit だが他 6 Adafruit lib の transitive auto-install dep として必須、削除すると ILI9341 / SSD1306 / BME280 / BMP280 / SHT4x / VL53L0X / MPU6050 連鎖 fail)
  - ESP32_REGISTRY_LIBS 8 件: 全件使用中 (`ESPping` は `templates/DigiCodeOTA.ino:22`、`ESP32-TWAI-CAN` は `canBlocks.ts:21` で alias header / hyphen 入りで実証)
  - file:// libs 7 件: 全件使用中 (`NimBLEOta` は `templates/DigiCodeBLE.ino:19`、ESP32Servo は 4 caller)
  - git pin / symlink 2 件: 全件使用中
  - **合計 55 件中 削除可能 0 件**
- **設計レビュー前提誤りも発見**: humanoid_init 専用 lib_deps は存在しない。`compile-api/src/compile.ts:209-233` `buildLibDeps()` は **全 board に全 lib unconditional 注入** (56.md ESP32-only 化以降の平坦化設計)。`DigiCodeHumanoid/library.properties` は `depends=ESP32Servo` のみ。Stage D v2 humanoid_init cluster wall 長い真因 = humanoid_init そのものではなく、**全 lib_deps pool の resolve / fetch / compile cost** が ESP32-S3 系 5 boards で支配的。`memory:design_override_doc_sync` 適用で Step A 中間で即報告済。
- **結果**: scope creep 不在実証 = **defense pattern が機能した証** (推察を grep evidence で覆した)
- **教訓**: scope creep を疑うこと自体は健全、見つからなくても defense pattern が機能した証。「包括的設計を実データで再評価」が正しい姿勢、結果が「不在」でも defense として価値あり (RP2040 排除のような scope 縮小成功事例も同 pattern)。
- **defense pattern**: 包括的設計を実データで再評価、削除可能性を全 callsite enum (frontend src + template + libs + transitive + alias header / class / hyphen 入り pattern も含む) で検証。Pattern A (即断) 罠回避 = grep 1 巡で「該当無し」と即断せず、alias header / transitive dep / template 全部回ってから確定。


> *Part 1 index row for **10** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第85回 | B (scope layer 5, trap-A avoided) | disproved a lib_deps scope-creep inference by enumerating all callsites (0 deletable of 55)

### 第85回 11 件目 (2026-05-05 Phase 5.5 で正式化) — 実装前 evidence で推察否定 (grep fail-fast、最強 defense)

- **当初状況 (第84回末)**: humanoid_init 軽量化「30% 短縮するはず」は推察 (実データなし)
- **当初想定 defense (第84回 設計時)**: Phase 5.5 Step C-F (実装 + Stage D v3 効果測定) で wall 比較データで推察採否判断 = 実装後 reality check
- **第85回実態**: Step A grep evidence (実装前 ~15 min) で「削除候補 0 件」を実証 → 推察を **実装前** に否定
- **比較**:
  | defense layer | wall 消費 | defense 強度 |
  |---|---|---|
  | 実装後 Stage D v3 で否定 | ~1.5-2h (実装 + image rebuild + PIO cache 退避 + Stage D v3 30-40 min + 比較分析) | mid (実装後の reality check) |
  | **実装前 grep evidence で否定** (本件) | **~15 min** (Step A grep + transitive dep 確認のみ) | **strong (fail-fast、最上位 layer)** |
- **教訓**: 「実データ」の定義を拡張 = wall 比較だけでなく、**grep evidence / call sites enum / static analysis / docs read 等の static evidence** も「実データ」に含む。実装前に static evidence で推察を覆せるか確認、覆せれば実装スキップ → 工数最小 + defense pattern 最強。
- **defense pattern**: 実装前に grep / static analysis / docs read 等で推察を覆せるか確認、覆せれば実装スキップ。「推察 → 実装 → 効果測定」より「**推察 → static evidence verify → 実装スキップ可能か判定**」が上位 layer。
- **fail-fast 原則**: 実装後に fail を検出するより、実装前に「実装する value 無し」を検出する方が defense として強い。


> *Part 1 index row for **11** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第85回 | B (verification layer 6) | refuted a "should shorten 30%" inference with ~15 min of pre-implementation grep evidence; implementation skipped (fail-fast)

### 第86回 12 件目 (2026-05-06 post-Phase 4-4 BUG fix で正式化) — Phase 4-4 stderr stale 罠 (cache eviction 後 fresh smoke 必須)

- **当初状況 (第86回 commit W / X 着手時)**: Phase 4-4 results.json の stderr (`'haLight_led' was not declared` / `'haNumber_servo_angle' was not declared`) を真因と推察
- **真因**: Phase 4-4 当時 (commit 2-6 effective 前) のキャッシュされた stale stderr。commit 2-6 で entity declare path を追加した後も results.json は更新されないため、該当 case の stderr は古い fail mode を保持
- **defense 発動経路**: 修正方針確定前に **fresh smoke (cache eviction 後)** を実行 → 真因が完全に異なることが露呈
  - case_0273 (commit W): stale = entity declare 漏れ → fresh = `invalid conversion ... to void(*)(bool, HALight*)` (callback v2 signature drift)
  - case_0286 (commit X): stale = entity declare 漏れ → fresh = `call of overloaded 'setState(int)' is ambiguous` (8 overload candidates)
- **systematic 化**: **本 session 2 件連続発見** で「Phase 4-4 stderr が stale な可能性」が systematic pattern として確立
- **defense pattern**:
  - Phase 4-4 results.json stderr を盲信せず、修正着手前に該当 case を **cache eviction 後 fresh smoke** で再現
  - fresh stderr が異なれば真因再評価 → 修正方針再確定
  - cache eviction が intermediate fix commit を挟んだ場合 (例: commit 2-6 で entity declare path 追加) は特に必須
- **教訓**: results.json の stderr は **採取時点の snapshot**、後続 commit が同じ block group に触れた場合は次回 fresh smoke まで stale。`memory:investigation_incomplete_assumption` 系列、Phase 4-4 のような大規模 batch run の results は時間経過で物理的に古びる
- **適用範囲**: Phase 4-4 / 1000-case run のような長期 run 出力 stderr を後日参照する全ての場面 (post-fix verify、bug queue 起案、cluster 分析、release readiness 評価)


> *Part 1 index row for **12** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第86回 | B (snapshot layer 7) | inferred Phase 4-4's stale stderr as the root cause; fresh smoke after cache eviction showed a different cause

### 第91回 15 件目 (2026-05-08 Phase 1-4 security check で正式化) — grep `head -N` truncate で「全体評価」 = パターン C/D の hybrid 罠

- **状況**: Phase 1-4 (Public化前 security check 18 項目調査) で `grep ... | head -15` 等で出力 truncate 後、上位 N 件を見て「Item 9 (192.168.x.x): blocks/sample placeholders (SAFE)」と全体結論。残り 30+ 件の `[INTERNAL_SUBNET_REDACTED]` (user の home/office LAN topology) を archive docs 内で見落とし
- **真因**: 「`192\.168\.[0-9]+\.[0-9]+` で grep」と言いながら、`| head -15` で結果を truncate、上位 15 件 (variants/ota/frontend/src/ 配下の sample placeholder) のみ目視 → 「全件 placeholder」と即断。残り 35+ 件 (archive docs の LAN IP [INTERNAL_LAN_REDACTED]) は表示外で「全体評価」結果に含めず、後段の Phase 2 step 1 着手後に user 指摘で発覚
- **失敗パターン**: **パターンC (サンプリング全体評価扱い) + パターンD (log 末尾を見ない) の hybrid**
  - パターンC: 上位 15 件 sampling から全体結論
  - パターンD: head で末尾切られた hits を「存在しない」扱い
- **被害規模**: working tree redaction 着手後に追加発見 → 工程逆戻り、user 信頼性損失、追加 ~52 hits redaction + history rewrite 拡張
- **副次発見** (再 scan で追加発見): (a) `DEFAULT_PASSWORD = '[DEFAULT_PASSWORD_REDACTED]'` archive-only hardcoded password (production code 不在確認済、`*.md` を Item 1 filter に含めていなかった scope 漏れ)、(b) `/api/test/kv` unauthenticated test endpoint deployed in production (`esp32-blockly-backend/src/index.ts:143`、Phase 1 で `本番前に削除` keyword grep 実施せず見落とし)
- **対策 (新運用ルール)**:
  1. **`| head` で truncate した場合は必ず `| wc -l` も並行取得**、count と表示数を明示比較
  2. **wc-l count > 表示数 の場合は「これは sampling 結果、全件未確認」と明示報告**、user の sampling 拡大 / fully enum の判断を仰ぐ
  3. **「全体評価」「SAFE 確定」と書く前に、wc-l count と確認件数の一致を確認**
  4. **Phase 1 system check の filter scope (`--include='*.md'` 等) を最初から最大化**、scope 漏れを後発見しない
  5. **最終 mitigation**: `rules/digicode/14-security-pre-commit.md` (★★★★★ 最重要ランク) を新設、post-Public化 monorepo の **全 commit / push 前** に gitleaks 8.30.1 + trufflehog 3.95.2 cross-check 必須化。Claude 自前 grep の網羅限界 (service-list 不在 / connection string pattern 不在 / bare UUID 無 keyword anchor) を業界標準 tool で確定的に補完、本パターンの再発を構造的に防止。本ルール初日 (2026-05-08 Phase 6.0 task 1-5 step 1-6) から例外なく適用、ルール自体の commit も対象 (自己例外禁止)
- **適用範囲**: 全 grep ベース調査 (security check / dead code 検出 / lib upgrade audit / regression 検出 等)、特に「Public化前」「リリース前」「production deploy 前」の不可逆作業の前段
- **defense pattern**: 「全件 enumerate」と書く前に、grep 結果を file 別 (`awk -F: '{print $1}' | sort | uniq -c | sort -rn`) で集計、unique file count と表示数を一致させる。truncate を必須使用するなら、count + sampling 結果両方提示して **user に「sampling? full enum?」を聞く**
- **本ケース learning**: Phase 1 で 184 hits (Item 1) / 146 hits (Item 11) / 50+ hits (Item 9) を扱う際に、最初から `| awk ... | sort | uniq -c` で file 別集計してから判定すべきだった。第85回 Pattern B layer 7 (snapshot stale) と同 layer = 「観測手段自体の歪み」 (head truncate = grep 観測の歪み)


> *Part 1 index row for **15** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第91回 | C/D hybrid | truncated grep output with head -15, judged "SAFE" from the visible top, missed 30+ LAN IPs below the cut

### 第89回 14 件目 (2026-05-08 GxEPD2 → Adafruit_EPD 置換で正式化) — 代替 lib API 互換性は「class 名・継承」で安心せず、public method の網羅まで確認

- **当初状況**: GxEPD2 (GPL-3) → Adafruit_EPD (MIT) 置換調査で「Adafruit_GFX 継承で setCursor/print/drawBitmap/fillScreen 同 API、SSD1680 panel 100% カバー」と結論、user に「案A 現実的、機能無損失」報告
- **実装着手前の精読で発覚**: Adafruit_EPD は **public partial-refresh API を提供せず**、`display(bool sleep)` のみ (sleep 引数は power-down、partial vs full 切替ではない)。`partialsSinceLastFullUpdate` 等の internal field は存在するが exposed されていない。GxEPD2 の `setPartialWindow + firstPage/nextPage` 相当が無い
- **真因**: 調査時に「Adafruit_GFX 継承 = 描画 API 共通」までは確認したが、**`Adafruit_EPD` 直下の public method 一覧 (`grep "void.*public" header`) を取らなかった**。共通 base class (Adafruit_GFX) の API カバレッジと、子 class 自身が追加する API カバレッジは別問題
- **defense pattern**:
  1. 代替 lib 評価で「同じ親 class」「同じ family」を見つけたら安心せず、**実装着手前に public method を全件 enum** (header の `class FOO : public BAR { public: ... };` 直下を全 grep)
  2. 移行元と移行先の **API 差分を表形式で書き出す** (1 ブロック = 1 行、現状 API → 代替 API → 差分理由)
  3. 差分が見つかったら user に「案 A1 (機能維持 + tooltip 注記)」「案 A2 (該当 block 削除)」「案 B (置換撤回)」「案 C (license 維持 + docs 明示)」を提示、推奨案 + 根拠で選択肢提供
- **教訓**: 1 件目の「代替 lib カバー率 100%」報告は **継承親の API カバー率**を意味していて、全機能カバー率ではなかった。「class 名一致 + 同 family」は必要条件であって十分条件ではない。`memory:investigation_incomplete_assumption` 系列、第85回 11 件目「実装前 evidence で fail-fast」と同 layer (Pattern B layer 6 = 検証)
- **適用範囲**: lib 置換 / fork 採用 / 代替実装評価で「同 family」「同 base class」が見えた全ケース。特に commercial license risk 解消目的で MIT/BSD 系へ移行する場合 = 機能の retain vs sacrifice の trade-off は user に提示すべき判断項目
- **good outcome**: 本ケースは実装着手前 (epaperBlocks.ts 書換コミット前) の精読で API gap を発見、user に提示 → 案 A2 (partial_update block 削除) で機能整理。**実装後の reality check ではなく事前 fail-fast** に成功したため、commit 前段階で軌道修正完了 (~5 min cost)、戦略軸 (release blocker 解消) を維持しつつ user 機能の trade-off を透明化


> *Part 1 index row for **14** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第89回 | B (layer 6 verification) | concluded a replacement lib gives "100% coverage" via base-class inheritance; full public-method enumeration exposed the missing partial-refresh API

### 第91回 16 件目 (2026-05-08 Phase 6.0 task 3 で正式化) — lib 採用時 license verify を慣習推定で確定する罠

- **状況**: 第86回 lib audit + 第90回 web verify で、過去採用済 lib 3 件が「推定 license」と「実 license」で乖離していたことが判明:

  | lib | 推定 (Claude self-grep / 慣習) | 実 license (web verify) | 影響 |
  |---|---|---|---|
  | ArduinoWebsockets | MIT | **GPL-3.0** | release blocker、Phase 2 WiFi controller 全 12 block 直接打撃 |
  | arduino-home-assistant | MIT | **AGPL-3.0** | release blocker、43 HA block 直接打撃 |
  | AccelStepper | 不明 (慣習推定) | **GPL-3.0 / Commercial dual** | release blocker、Phase D ステッピング系直接打撃 |

- **真因**: 採用判断時に「Adafruit / Sparkfun / メジャー Arduino lib だから MIT 想定」「GitHub star 数 / 知名度 = OSS = MIT/BSD」等の **慣習推定**で license 確定、実体 (LICENSE file 直 read / SPDX 識別子取得) を verify していなかった。第86回 lib audit でも self-grep service-list / pattern 不在で見逃し、第90回 web verify で初発覚 (case 15 head truncate と同根の「観測手段自体の歪み」、case 14 lib API base class安心と同 lib採用判断 cluster)
- **失敗パターン**:
  - パターン A (即断): 「メジャー lib = MIT」を verify なく確定
  - パターン B (scope 自己確証): self-grep 範囲のみで「全件 MIT」と全体評価
  - case 14 と pattern族として並列 (lib採用判断 cluster、API互換性 と license verify は同じ「採用前 verify」軸)
  - case 15 と構造類似 (Claude 自前 grep の網羅限界、業界標準 tool で補完必要)
- **被害規模**:
  - 第91回 AGPL-3.0 採択戦略 pivot の主要根拠の一つ (代替 80-100h+ vs AGPL 採択 ~5-10h)
  - history rewrite (PII 含む total 7 categories) ~30 min (filter-repo + force push)
  - 4 sibling repos の LICENSE 全置換 (atomic commits × 4 + 関連 docs 5 lang)
- **mitigation (構造的再発防止)**:
  - **`rules/digicode/15-lib-adoption-protocol.md`** (★★★★、Phase 6.0 task 3 新設) で全 lib 採用前 4 軸 verify 必須化 (License / API / Maintenance / Dependency)
  - License verify は SPDX 識別子取得 + LICENSE file 直 read + dual license 確認、慣習推定禁止
  - PlatformIO registry / npm view / Cargo metadata 等の業界標準 tool 必須活用
  - user 判断仰ぐ (Claude 単独 license 確定禁止)
- **適用範囲**: 全 lib 採用 (lib_deps / package.json / Cargo.toml / vendored libs)、lib upgrade (semver major + license metadata 変化)、定期 audit (release 前必須)
- **defense pattern**: case 14 (API互換性) + case 15 (head truncate) + 本 case (license verify) を **「採用判断 verify」 cluster** として並列、いずれも実体ベース確認 + 業界標準 tool 補完 + user 判断仰ぐ。3 cases 共通 = 「Claude 自前推定の限界」、cross-verification (web / 公式 docs / standard tool / user) が解
- **good outcome**: 第91回 AGPL-3.0 採択 + 本ルール 15 整備で、lib 採用判断の構造的再発防止確立。STAGE 2 release 後の lib 追加・upgrade で本パターン再発リスクゼロ目標。


> *Part 1 index row for **16** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第91回 | A + B | fixed licenses by the "major lib = MIT" convention; actual: GPL-3.0 / AGPL-3.0 / dual — 3 divergences

### 第91回 17 件目 (2026-05-08 Phase 6.0 task 4 で正式化、rule 14 効果実証 case) — handover docs 作成時の secret 値再混入

- **状況**: Phase 6.0 task 4 (handover 整備) で改定log 第91回 entry 起草中、history rewrite で除去した secret value (DockerHub PAT × 9 mentions + Railway UUID × 1 mention) を「過去の事実を正確に記録したい」意図で**そのまま記述**してしまった
- **検出**: Task 4 commit 前 rule 14 scan (gitleaks + trufflehog filesystem) で **trufflehog unverified secrets 0 → 10** に増加検出 (DetectorName: Dockerhub × 9 + RailwayApp × 1、全件 改定log 内)
- **真因**: handover docs 作成時、「過去の経緯を詳細記録 = 値もそのまま含めて transparent に」という Claude の善意の意図が secret 再混入を生み出すパターン。case 14 (lib API base class安心) / case 15 (head truncate) / case 16 (lib license 慣習推定) と同根 = **作成者本人の自己 review では検出困難な漏れ** (cross-verification が解)
- **失敗パターン**:
  - パターン A (即断): handover 詳細さ優先、secret 値記録の安全性 verify 抜けた即断
  - case 16 と同 cluster: 「自前 review の限界」軸、業界標準 tool で補完必要
  - 注意: rule 14 自身は Phase 6.0 task 1-6 (本 Phase 内、commit `21ab0050`) で新設、本 case 17 検出時点で **新設後 4 commit** 経過 → rule 14 は導入直後から実 defense として機能している
- **mitigation (即発動 + 構造化)**:
  - 即発動: 修正手順 = 改定log 内 sed 一括 redact (`dckr_pat_g0WHV_*` → `[DOCKERHUB_PAT_REDACTED]` 等) + re-scan で 0 復帰 → commit 進行
  - 構造化 (handover docs 作成 protocol、Phase 7 polish 候補):
    1. **過去の secret 値は記録しない**、件数 + 種別 + redact placeholder のみ
    2. 例: `[DOCKERHUB_PAT_REDACTED] × 9 commits を history rewrite で除去` (実値書かず)
    3. handover docs / 改定log 起草前 + commit 前 で rule 14 scan を二重実施
- **適用範囲**: 全 handover docs 作成 (改定log entry / 16.md update / postmortem 等)、特に「過去の事実を詳細に記録」する文脈
- **defense pattern**: rule 14 (security pre-commit) を**自前 review の限界 mitigation** として位置付け、本 case 17 は rule 14 効果実証 case として preserve。教訓 = 「rule 新設 commit 自身も rule 適用」の延長で「rule 新設後 handover 作成も rule 適用」確認
- **rule 14 効果実証**: 新設 4 commit 後の本 case で「commit 前 scan で実害ゼロで detect + 即修正可能」実証、rule 14 が想定通り機能した正例として記録 (改定log 第91回 §11 教訓 6 参照)


> *Part 1 index row for **17** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第91回 | A | handover draft re-wrote history-rewritten secret values; rule 14 scan caught it pre-commit

### 第86回 13 件目 (2026-05-06 post-Phase 4-4 BUG fix で正式化) — lib upgrade drift cluster (同 file 横断 callback signature 監査必須)

- **当初状況**: BUG-056 (NimBLE isInitialized) / BUG-058 (NTP WiFiUdp) / BUG-065 (NimBLE callback drift) / BUG-066 (HA setValue float cast) / commit W (HA light callback) / commit X (HA number setState) で **6 件連続** lib API drift 発見
- **真因**: lib upgrade 時 (NimBLE-Arduino v2 / ArduinoHA v2.x 等) 該当 lib を使う generator の signature 追従漏れ。**同 file 内の他 generator は正規化済**だが、特定 generator のみ migration 漏れる pattern
  - arduinoHABlocks.ts: 6 entity callback (switch/number/fan/cover/light RGB/scene) v2 form 正規化済、`ha_light_on_command` のみ漏れ (commit W で発覚)
  - arduinoHABlocks.ts: BUG-066 で 43 generator に `static_cast<float>` 適用済、`setState` 系のみ漏れ (commit X で発覚)
- **defense pattern**:
  1. lib upgrade を実施したら、その lib を `#include` する **全 generator file 全 forBlock** を call signature レベルで横断 grep
  2. 同 file 内の他 generator が新 form の場合、漏れている generator を即特定
  3. 単発 fail を発見しても、**同 file の他 generator も同根 drift がないか必ず横断 audit**
- **教訓**: lib upgrade migration は generator 単位の散在作業、漏れを系統的に検出する protocol が必要。同 file 内 6/7 generator が正規化済で 1 つだけ古い形式は、頻発する漏れ pattern
- **適用範囲**: lib upgrade を含む全 commit (Dockerfile 更新 / lib_deps バージョン bump / vendored lib 更新)、特に callback signature / overload set / API rename を含む semver minor+ upgrade
- **systematic 化候補**: `rules/digicode/03-block-workflow.md` に「lib upgrade migration audit protocol」を追記、commit 17 phase 候補


> *Part 1 index row for **13** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第86回 | B (cluster layer 8) | post-lib-upgrade callback-signature drift, 6 in a row in one file — cross-cutting audit is mandatory

### 第92回 18 件目 (2026-05-09 HA 対応強化 commit 0 で正式化、本 session で 6 件多重実発動) — 軸と罠の checklist 化罠 (罠認知後の推奨維持 + 結論変わらない言い訳の禁止)

- **状況**: HA 対応強化計画 (digicode-HA-implementation-plan_ClaudeCode_1st.md → v4 ClaudeDesktop) で ClaudeCode が **「軸と罠 self-check を checklist 的に PASS 判定して終わる」**思考パターンを多重実発動。罠該当を認知し table に「該当 / mitigation 適用」と書いただけで、判断そのものを変えなかった。本 session で **6 件連続実発動** (4 件は §A-22-25 で記録済、+ 2 件は §26 v4 Final 確定議論で発生)。

- **6 件実発動の内訳**:
  1. **§A-22 #A-γ (HA OTA Phase 1 のみ release 前)**: §A-21 self-check で「scope 自己確証」罠該当認識した直後、§A-22 で「工数 1-2h → 30 min - 1h に縮小したから OK」と推奨維持 → §A-23 で ClaudeDesktop 第3回指摘により全面撤回
  2. **§A-23 タスクF 独立ブロック化 (wifi_resilience + watchdog_enable)**: §A-24 grep 調査で既存 mqtt_loop pattern 主張 → 本 session 後半再 verify で「mqtt_loop pattern 踏襲」根拠自体が事実誤認と判明 (mqtt_loop は `mqttClient.loop()` only emit、L726-731 は `wifi_reconnect` 独立 block body)、結論は維持だが根拠書換
  3. **§A-24 容量実測 4 件のうち 3 件 skip**: ClaudeDesktop 提案を完全 honor していないと §A-25.3 で本人認める = 「結論変わらないから OK」言い訳の典型
  4. **§A-25 留保事項 honest record + 推奨維持**: counter-points 平行記録したが現判断 (HA OTA 全 defer) は再評価せず → Takeda verbatim 受領で §26 立場修正 (§A-25.1 留保が validation 形)
  5. **§26 NAME/OBJECT_ID 分離 scope 当初 12 件 expand 推奨**: 「UX 一貫性」根拠で罠 2 (完璧と混同) → user 指摘「軸と罠を判断駆動として使え」で Takeda anchor 適用 → 8 件 (v4 verbatim) に縮小
  6. **§26 Init block protocol 完全適用 当初 commit 2 同梱推奨**: 「rule 03 完全準拠」根拠で罠 2 → Takeda anchor「heavy user 使用感無関係 = polish phase 適切」で skip 判断

- **真因**:
  - 軸と罠を **チェックリスト** として使用、「該当/非該当」を機械判定して終わる思考パターン
  - 罠該当認知後も **二次的根拠** で推奨維持 (「工数縮小」「scope reduced」「結論変わらない」「rule 完全準拠」「UX 一貫性」)
  - 軸 1-4 を **思考のレンズ** として使えていない = 発見した事実を軸に照らして重大度判定 + 行動優先度を変える discipline 不足
  - **他 Claude (ClaudeDesktop) の主張も鵜呑み危険** (ClaudeDesktop 第3回主張「Phase 1 独立価値の実証なし」を §A-22 で機械採用 → §A-25.1 honest 留保 → Takeda verbatim で覆る)
  - **Takeda anchor の存在を判断時に思い出さない**: 「ヘビーユーザーにとって及第点と思えるレベルで実装したい」は最重要 anchor だが、軸と罠 check 中に立ち戻らず checklist 完了で済ませる

- **失敗パターン**:
  - パターン B (scope 自己確証) の **延長系** = 罠認知後の推奨維持 = 認知 + 行動不整合
  - パターン A (即断) の親戚 = 「結論変わらないから追加検証なし」即断
  - case 14 (採用判断 verify cluster) と同根 = 「自前推定の限界」軸、cross-verification (user verbatim / 実証データ / external review) が解
  - 罠 1 (軸絶対化) の inverse = 軸を絶対化せず「checklist として消費して終わる」軽視運用

- **defense pattern (構造的 mitigation、本 case 正式化と合わせて新運用 protocol)**:
  1. **軸を思考のレンズとして使う**: 発見した事実を軸 1-4 でリアルタイム重大度判定、行動優先度を変える。表で PASS 判定で終わらない
  2. **罠認知 = 即立場修正**: 「工数縮小したから OK」「scope reduced したから OK」「結論変わらないから OK」「rule 完全準拠」は **罠の延長**、判断そのものを再評価
  3. **user verbatim を anchor 化**: 判断に迷ったら user 元発言 (Takeda「ヘビーユーザーにとって及第点と思えるレベルで実装したい」等) に立ち戻る、軸と罠は anchor 達成のための道具
  4. **counter-points は honest record + 即時再評価**: 留保事項を残すこと自体は健全だが、留保した時点で「現判断の根拠を再 verify」する protocol、honest record + 推奨維持は罠延長
  5. **他 Claude / 過去の自分の推奨も実証データで覆せる姿勢**: ClaudeDesktop external review の機械採用も機械却下も罠、実コード grep + 設計詳細精読で valid/invalid 判断
  6. **発見の重大度を即時ラベル**: 🔴 release blocker / 🟡 設計影響 / 🟢 informational を発見時に明示、フラット列挙禁止

- **適用範囲**: 全設計レビュー / Final 案提示 / commit 着手判断 / external review 受領時 / 計画書議論 / 同 session 内多重判断局面。特に「軸と罠 self-check 該当認識後の判断」は 100% 該当チェック対象

- **good outcome (本 session)**: 6 件実発動全てが **覆る前に commit に至らず** (ClaudeDesktop external review + user verbatim 介入 + user 軸と罠教育で判断修正)。case 18 正式化により、新セッション ClaudeCode は冒頭で本 case を read することで同 session 内多重発動を構造的に予防

- **教訓**: LLM は self-check 表で「該当」と書くだけでは **判断が変わらない構造**を持つ。defense は (a) 該当検出時の即時再評価 protocol + (b) user verbatim anchor の常時参照 + (c) external review の honest 受容 + (d) 「結論変わらない」言い訳の禁止リスト化 + (e) 重大度即時ラベル運用。本 case の 6 件全て、後追いで覆ったが、commit 前 review 介入なしでは 1-2 件は通過していた可能性

- **関連**: case 14 (採用判断 verify cluster) / case 15 (head truncate 観測歪み) / case 16 (lib license 慣習推定) / case 17 (handover secret 再混入)、いずれも「自前推定 vs 実証 verify」軸で同 cluster。case 14-18 連続発見は LLM の構造的 weakness 証明、rule 化 + memory 化 + protocol 化の三段防御必要
- **rule 化 (2026-05-09 Session 96)**: 本 case 18 の defense pattern を `rules/common/14-decision-framework.md` (4-axis 思考レンズ + 5-trap self-check + case 18 meta-trap defense + 重要度ラベル + project-lead anchor) として体系化。本 case と rule 14 は双方向参照、片方更新時はもう片方も sync。新規セッションでは `rules/common/13-session-recovery.md` と合わせて cold-start 時に必読 (rule 13 §Step 4 sanity-check report が rule 14 §severity labels を直接利用)

---


> *Part 1 index row for **18** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第92回 | B-extension + A-relative | consumed the axes-and-traps self-check as a checklist; kept the recommendation on secondary grounds after recognizing the trap (fired 6 times in that session)

### 第110回 19 件目 (2026-05-13 cpp-generator audit で正式化、user 命名「旧 Claude Code 手抜き作業の穴」cluster) — UI 層 type contract 欠落罠 (setCheck null on VALUE input = latent type-leak、generator バグの surface 化を防ぐ唯一の構造的防御 = UI 層 type contract)

- **状況**: 第108回 BUG-083/084 cluster → 第109回 backend 13 route 系統的 audit で 29 finding (release-pre fix 11 件) の流れを受け、第110回で半年前 Claude Code 実装の cpp-generator 領域を Phase A (`relayBlocks.ts` / `esp32Blocks.ts` / `arduinoHABlocks.ts` pattern source 抽出) → Phase B (69 block files × 5 観点 = 345 cells 系統的 audit) で精査。BUG-079 (Round 5 case_0130、`esp32_serial_print/println` VALUE input setCheck `null` で `array_content` brace-init `{0,0,0}` を `Serial.println()` に渡せて compile fail) が第106回 single fix で closure 済だったが、**同根 latent cluster = 14 件 (= 17 setCheck site で 15 G-number) が他 file に存在**することが Phase B 観点 4 で判明。

- **17 個別 holes (G-1〜G-15 番号、17 setCheck site)**:
  | Group | block.field | file:line | sink emit |
  |---|---|---|---|
  | I (Stream raw passthrough、4 件) | `serial2_print.TEXT` / `serial2_println.TEXT` / `lcd_print.TEXT` / `tft_print.TEXT` | uart2/lcd/tft Blocks.ts | `Serial2.print()` / `lcd.print()` / `tft->println()` raw |
  | II (String() wrap でも brace-init 構文不可、4 件) | `ble_uart_write.TEXT` / `ble_notify.VALUE` / `websocket_send.TEXT` / `websocket_server_send.VALUE` | bleBlocks / webSocketBlocks | `String(...)` wrap 経由 |
  | III (Storage/NVS、7 件) | `sd_write.CONTENT` / `sd_csv_append.COL1/2/3` / `fs_write.CONTENT` / `preferences_put.VALUE` / `preferences_get.DEFAULT` | storageFsBlocks / storageNvsBlocks | `f.print()` / `preferences.put<Type>()` |
  | IV (setCheck 完全省略、worst case、2 件) | `espnow_send.DATA` / `espnow_broadcast.DATA` | espnowBlocks | `espnowSend(mac, String(data))` |

- **真因**: 半年前の Claude Code session が generator 実装時、UI 層 type contract (`setCheck`) を「楽な default = null」で済ませた = sink 側の C++ overload set (`HardwareSerial::print()` / `Print::print()` / `String` constructor / `preferences.put<Type>()` 等) が受け入れる型を Blockly UI 接続段階で declare せず、user が `array_content` 等の意図しない output 型を接続できる経路が残存。BUG-079 の 1 件は Round 5 case_0130 で表面化、他 14 件は theoretical (production user 未経験) で latent 維持。「動いてるから OK」状態が継続、generator 単発 audit では検出困難 (sink の C++ 型契約を一件ずつ調べる必要)。

- **失敗パターン**:
  - **「UI 層 type contract = `setCheck` 」と「C++ generator emit」の責務分離の不徹底**: 旧 Claude Code session は generator 実装時、「value to code でやり取りされる expression 文字列だから型はどうでもいい」という素朴な実装姿勢で setCheck を null で済ませた
  - **「BUG-079 と同根 cluster」を第106回 single fix で締めて他 file への波及 audit を skip した過去判断** (第106回 settled「他 Stream-like consumers setCheck(null) systematic audit は post-release polish 候補」)。`feedback:reactive_vs_systematic` の警告事例
  - case 14 (lib API base class 安心) と同 cluster: 「採用判断 verify 不足」=「実装判断 verify 不足」軸の連続例
  - 罠 B (scope 自己確証) の延長: 「BUG-079 = esp32_serial_print/println を fix したから cluster 終結」と scope を勝手に狭めた

- **defense pattern (構造的 mitigation、本 case 正式化と合わせて新運用 protocol)**:
  1. **VALUE input には必ず explicit `setCheck` を declare**: Blockly `appendValueInput(...).setCheck(null)` または `setCheck 省略` は禁止 pattern (project-wide rule)、sink の C++ 型契約を Type list (`['Number','String','Boolean']` 等) で明示する。statement input (`appendStatementInput(...).setCheck(null)`) は別 = 任意 statement 受入で正当
  2. **同根 cluster 発見時の Phase 化 audit**: Phase A (canonical pattern source 1-2 file full read で type contract pattern 抽出) → Phase B (全 file × 観点別 grep で fan-out 検出)、第109回 backend audit + 本第110回 cpp-generator audit で連続実証
  3. **UI 層 fix + regression test 拡張のペア**: Blockly connection-checker は runtime UI 動作なので unit test なしでは regression 防御不能。`canConnect(output, input, false)` を直接呼ぶ vitest を 4 patterns (text/math_number/variables_get accept + array_content reject) × (block, input) pair 単位で書く。第106回 `serialPrintConnection.test.ts` (8 cases、2 sinks × 4 patterns) → 第110回 `streamStorageSinkConnection.test.ts` (68 cases、17 pairs × 4 patterns) で 8.5× 拡張
  4. **「旧 Claude Code 手抜き作業の穴」cluster と命名**: user 命名 (2026-05-13) を採用、本 case 19 cluster の universal label。1 BUG 発見 → 系統的 audit で同根 N 件 → batch fix の defense pattern は他領域にも適用 (第109回 backend route + 本第110回 cpp-generator + 第111-112回 block 定義 + 残 1 領域)
  5. **rule 化**: 本 case 19 の (1) discipline を `rules/digicode/03-block-workflow.md` § "Init block protocol" 横に「VALUE input setCheck mandatory」項目として追記候補 (post-Session-110 polish task)

- **適用範囲**: 全 lib/framework の UI 層 type contract 設計 (Blockly / GraphQL schema / TypeScript public API / Form validator 等)、特に **「UI 接続段階で型を狭めずに後段の generator/runtime に渡す」設計** は全般該当。第111-112回 残 2 領域 audit (block 定義 + 残 1) で同 pattern 適用予定

- **good outcome (本 session)**:
  - Phase A pattern source 抽出 (~45 min) + Phase B 69 file × 5 観点 系統的 audit (~3h) で 17 setCheck site (15 G-number) を完全 enumeration、release-pre fix 完走
  - 3 atomic commits (`263c20d` fix 15 / `ac6d703` 68 vitest / `34d731c` cameraBlocks A1+B1 cleanup) で scope α 完走
  - typecheck 0 errors / vitest 540→608 PASS (+68 cases) / gitleaks 3 FP / trufflehog verified 0 全 baseline 維持
  - case 18 fail-fast 3 layer 継承 (Phase A 中 即時 surface / Edit 直後 grep verify / post-edit count verify) で 17 setCheck modification 漏れゼロ

- **教訓**: LLM は generator 実装時に sink の C++ 型契約 (overload set / 受入型) を 1 件ずつ調べる discipline が落ちやすい。**default 楽な path (`setCheck(null)`、setCheck 省略) は latent type-leak の温床**。UI 層 type contract を「楽さ優先で省略」する design judgment は project life-time 全体で見ると最も costly な手抜き = 本 case 19 cluster の語源。「動いてるから OK」は **「現在の user composition では surface 化していないだけ」** と読み替え、systematic audit で latent N 件を表面化させて batch fix する protocol が唯一の構造的防御

- **関連**: case 14 (lib API base class 安心 = 採用判断 verify 不足) / case 15 (head truncate sampling) / case 16 (lib license 慣習推定) / case 17 (handover secret 再混入) / case 18 (axis-and-trap checklist 化) と並列 = 「自前推定 vs systematic verify」軸の継続事例。BUG-079 (第106回) は本 cluster の trigger BUG として preserve、第106回 settled「post-release polish 候補」は本第110回で release-pre fix に格上げ (user 方針「穴は見つかった時点で塞ぐ」)

- **systematic audit cluster の累積発見記録 (cross-session)**: 第109回 backend 13 route × 8 観点 = 29 finding (11 release-pre fix batch) → 第110回 cpp-generator 69 file × 5 観点 = 17 setCheck hole (15 G-number batch) → 第111-112回 block 定義 audit + 残 1 領域 で継続。「旧 Claude Code 手抜き作業の穴」cluster 全 4 領域完走で release 前 latent bug 構造的 0 化目標

---


> *Part 1 index row for **19** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第110回 | B-extension (self-confirmed scope) | setCheck(null) missing its UI-layer type contract = 14 same-root latent type leaks (17 setCheck sites), all enumerated by systematic audit

### 第132回 20 件目 (2026-05-17 BUG-085 Phase 3 で正式化、user 指摘で発見) — Phase 1 generator バグなし即断罠 (vitest routing pass を end-to-end runtime 動作 verify と誤認、case 19 setCheck 不足の逆 mirror = setCheck 過剰)

- **状況**: BUG-085 (AI 生成精度) Phase 1 で 5 axis cross-verification (canonical sample 精読 + regex 機械検証 + catalog schema enum + system prompt 精読 + vitest 確認) を実施、「generator バグなし、AI 精度問題」と結論。Phase 2 (prompt 強化) + P2-V (validator + retry loop) を 4 commit 連続実装 (eb565a4 / b21dbf8 / c030056 / 539f315 / 1d80d75 / 32ec884) も user smoke で F1 (servo angle hardcode) + F2 (浮遊 wsServerMessage) 解消せず。第6回 smoke で user が「validator は動作 (issue 0 件)、cpp に F1+F2 残存」と evidence 提示、Phase 1 結論誤り確定

- **真因 (servoBlocks.ts 実コード精読で判明)**: `servo_write.ANGLE` の `.setCheck('Number')` が `websocket_server_received_value` の `setOutput(true, 'String')` を Blockly v10.4.3 connection-checker で **workspace load 時に rejection**。AI XML は正しく `<value name="ANGLE"><block type="websocket_server_received_value">` を emit しているが、Blockly が接続を破棄して child を top-level orphan 化 → 親 servo_write の `valueToCode` が empty → `|| '90'` fallback で hardcode emit (F1) + orphan received_value が `workspaceToCode` で `scrubNakedValue('wsServerMessage')` → `wsServerMessage;` (F2)。**1 つの root cause、2 つの symptom**

- **失敗パターン (Phase 1 結論誤りの構造)**:
  - **vitest routing test の pass を「end-to-end runtime 動作 verify 済」と誤認**: catalogInvariants.test.ts:272-285 は `selectFewShot` の routing を 3 case 確認するだけ、canonical sample から cpp output までの end-to-end は **検証不在**。私は「sample が test pass している = 正常動作する」と推察、これが case 1 即断 (実証なし全体結論) の再発
  - **canonical sample の existence を generator 正常の根拠に変換**: sample に正解 pattern (`<value name="ANGLE"><block type="websocket_server_received_value">`) が記載 = generator が正常、と推察。実は sample 自体も同 setCheck rejection で broken な cpp emit する構造的脆弱性 (要 verify、本 session では sample 利用者ゼロのため未検出)
  - **`memory:evidence_based_runtime_research` 違反**: 実行環境固有制約 (Blockly connection-checker の type rejection) は実 runtime probe (XML load → workspace → cpp gen) で初めて exposed。私は code static read のみで「generator バグなし」と即断、runtime probe を skip
  - **case 19 (setCheck 不足) の逆 mirror image**: case 19 は「setCheck(null) で UI 層 type contract 欠落 → array_content → Stream API compile fail」、本 case 20 は「setCheck('Number') で UI 層 type contract 過剰 → String-typed received_value が rejection → runtime detach」。**setCheck の right-sizing が design discipline の核心**、両極端で別 cluster bug を produce

- **defense pattern (構造的 mitigation)**:
  1. **「generator バグなし」claim 前に end-to-end cpp gen の runtime verify 必須**: `dryRunBlocklyXml` 経由で workspace load → `Blockly.JavaScript.workspaceToCode(workspace)` 経由で cpp 取得 → expected output と比較。canonical sample 自身がこの test を持つべき (Phase 3 で `servoActuatorConnectionCluster.test.ts` 追加)
  2. **setCheck right-sizing 原則の rule 化候補**: 「cpp generator が `String(${expr}).toInt()` / `String(${expr})` / 等の coercion を持つ value input は setCheck に String/Boolean を含める」「Number 単独 setCheck は generator が parseFloat 等 strict-Number 処理する場合のみ」。`rules/digicode/03-block-workflow.md` 追記候補 (post-release polish)
  3. **case 19 + case 20 を「setCheck right-sizing cluster」として並列管理**: 不足側 (case 19) は audit で網羅、過剰側 (case 20) は cpp generator の coercion 能力と setCheck 受入型の整合を確認、両極端の構造的予防
  4. **semanticValidator Check 5 (type_mismatch_will_cause_detach) 追加** (Phase 3 で実装): parent.valueInputs[X].check と child.outputType を XML 静的解析で比較、不一致を Blockly workspace load 前に予測警告。将来同 cluster bug の AI infra 構造的予防

- **被害規模**:
  - 4 session 連続 (Phase 1 + Phase 2 + P2-V + P2-V hotfix + P2-V debug v1 + P2-V debug v2 = 6 commits) で「validator + prompt 強化で解決」と誤推察、user smoke 3-5 回で初めて user 指摘で真因到達
  - 8 actuator setCheck sites (servo 4 + motor 2 + stepper 2) が同根、全件 Phase 3 で `['Number','String','Boolean']` に loosen
  - canonical wifi-controller-mix sample も同 rejection 影響、ただし user-driven verification なし (Phase 3 fix 後に C++ output が正しくなる予定)

- **適用範囲**: 全 generator バグ調査 (cpp / py / その他 lang)、特に「sample / catalog / prompt / vitest routing test pass」を根拠に「正常動作」と claim する場面。**vitest routing test = AI infra layer の verify、cpp gen runtime = generator layer の verify、両 layer 別々に test 必要**

- **good outcome (Phase 3 で覆る前の damage 評価)**: 第132 session 開始から 6 commit 経過後の真因発見、production 影響ゼロ (user smoke 機構が機能、code commit 前に F1+F2 残存検出)、`memory:anti_enum_premature_complete_claim` 「smoke pass まで claim gate」protocol が正しく機能 = closure 主張を gating して user evidence で逆転可能。教訓: **「generator バグなし」即断は今後 end-to-end runtime probe 完了後のみ可**

- **rule 化候補 (post-release polish)**: 本 case 20 + case 19 を統合した「setCheck right-sizing 原則」を `rules/digicode/03-block-workflow.md` § "Value input setCheck contract" として明文化。cpp generator の coercion 能力と setCheck 受入型の整合を block 追加時 + lib upgrade migration 時 checkpoint

- **関連**: case 1 即断 (実証なし全体結論) / case 14 (lib API base class 安心) / case 15 (head truncate sampling) / case 16 (lib license 慣習推定) / case 17 (handover secret 再混入) / case 18 (axis-and-trap checklist 化) / case 19 (setCheck 不足) と並列 = 「自前推定 vs systematic verify」軸 + 「sample/test pass を end-to-end verify と混同」軸。BUG-085 = case 1 即断 + case 19 逆 mirror の hybrid 例

---


> *Part 1 index row for **20** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第132回 | A recurrence + reverse mirror of case 19 | mistook a vitest routing pass for end-to-end runtime verification, snap-judged "no generator bug"; real cause was connection rejection from an excess setCheck('Number')

### 第134回 21 件目 (2026-05-18 第134回 cold-start で F-1 発覚により正式化、case 1 即断罠の変形) — audit exit 0 を warning 0 と等価視 (報告精度の構造的低下、build blocker 軸と品質指標軸の混同)

- **状況**: 第133回 close 報告 (handover 16.md §C baseline + plans/completed/bug-086-ai-infra-rebuild.md §11) で「5 audits: 0 warnings each」と記載。第134 cold-start で baseline 実測時、audit-data-consistency 実行で **`[COVERAGE_SAMPLES] {locale}: sample "wifi-led-servo-controller" not translated` × 4 warnings (en/es/pt-PT/zh-TW)** が出力されていることが判明。BUG-086 C5 commit `9ee995f` で sampleProjects.ts に新 canonical sample (wifi-led-servo-controller) 追加時、`sampleProjectsI18n.ts` の 4 lang entry を同梱漏れ = rule 07 (5 lang same commit) 違反。handover claim と実態の drift を独立 baseline 実測で発見、F-1 finding として記録 + 第134 並行 hotfix へ。

- **真因**:
  - audit exit code (success/failure、build blocker か否か) と warning count (品質指標、code review 必要か否か) は **別の軸**
  - audit-data-consistency は `COVERAGE_*` を warning level に分類 (translation 未完成 ≠ build blocker、`✅ All audits passed (X warning(s))` で exit 0)
  - 第133 close 時の handover 起草で「audit 実行 → exit 0 → 全 pass → 0 warnings」と機械的に判定、warning count 数値を実数で読まず、内容も精読せず handover に `5 audits: 0 warnings each` と inferred claim 記載
  - 結果として cold-start で実測した次 session 担当者 (本 case では同じ Claude Code instance、`memory:handover_baseline_actual_measurement` protocol が機能) が discrepancy 発見、handover claim の信頼性を独立 verify 必要に

- **失敗パターン**:
  - **case 1 (即断罠) の変形 = 報告精度の構造的低下**: 「exit 0 = 全部 OK」即断、warning 出力 layer を看過
  - **case 15 (head truncate sampling) の親戚 = 観測手段自体の歪み**: audit が warning を区別出力していたのに、出力 layer ではなく exit code layer のみで判定
  - **handover baseline 信頼性低下**: `memory:handover_baseline_actual_measurement` (第100 BUG-080) の延長 = handover 記載値を transcription せず必ず実測する protocol は既に確立されているが、**起草側の精度問題** (handover に inferred / aggregated claim を書く罠) は別 axis で本 case 21 で正式化

- **defense pattern (構造的 mitigation、本 case 正式化と合わせて新運用 protocol)**:
  1. **audit 実行後の verify protocol**: `exit code` + `warning count` + `warning content sample` の 3 axis 全件報告
     - exit 0 = build blocker なし (○)
     - warning count = 0 で初めて「0 warnings」claim 可
     - count > 0 なら warning 内容 1 件は最低限実数 quote、pre-existing or 新規 かを判別
  2. **handover 起草時の audit baseline 記載 protocol**: `5 audits: 0 errors / X warnings (内訳: ...)` 形式で warning も実数記載、`0 warnings each` 等の aggregated inferred claim 禁止
  3. **rule 文書化** (本 case 21 起草と同 session で実装): `rules/digicode/16-block-integration-checklist.md` Section A5 / G3 / Anti-patterns で case 21 防衛 step を block workflow checklist に inline、再発の構造的予防 complete form 確立
  4. **rule 13 §Step 4 sanity-check report への追記候補** (post-Session-134 polish): 「baseline 実測時、audit warning count は exit code とは別軸で報告」追記

- **被害規模**:
  - 第133 handover claim 1 件の drift (F-1)
  - 第134 cold-start で発見 = release blocker risk なし、cosmetic issue 1 件 (本 session 並行 hotfix で解消可)
  - 過去 audit baseline 全件で類似 drift がないか再点検必要 (post-release polish 候補)

- **適用範囲**: 全 audit / lint / typecheck / test 等の **「exit code (○/×) + 詳細出力」を produce する build tool** の結果報告。特に handover 起草時 / close 報告時 / sanity-check report の baseline 記載項目。CI pipeline の green/red 判定とは独立に、warning content 全件 read で品質指標を独立報告

- **good outcome (本 session)**:
  - 第134 cold-start sanity-check report で `🟡 F-1: audit-data-consistency 4 warnings drift` として独立 finding 化、user に提示
  - user 指示「本 session 並行 hotfix」+「case 21 として正式化」で case 19+20 cluster と並列の **reporting accuracy 軸** として cluster 拡張
  - rule 16 (block-integration-checklist) に Section A5 / G3 / Anti-patterns で case 21 防衛 step 同梱、構造的予防 complete form 確立

- **教訓**: LLM は build tool 出力の「success/failure」最上層 abstraction で判定して終わる傾向、詳細 warning 内容を読まず report に「pass」記載する罠は case 1 即断罠の variant。**exit code は「build blocker か」のみ問う、品質指標 (warning count) は別 axis で独立報告必須**。本 case 21 は cluster 「自前推定 vs systematic verify」軸 (case 14 / 15 / 16 / 17 / 18) + 「sample/test pass を end-to-end verify と混同」軸 (case 1 / 19 / 20) の hybrid = 「観測手段の出力 layer を full read せず top-level summary で判定」軸

- **関連**: case 1 即断 (実証なし全体結論) / case 15 (head truncate sampling = 観測手段歪み) / case 19 (setCheck 不足 cluster) / case 20 (setCheck 過剰 + Phase 1 即断罠) と並列 = 「自前推定 vs systematic verify」+「観測 layer 歪み」+「即断罠」 hybrid axis。BUG-086 C5 commit (sample 追加) の handover claim 起草工程で発火、reporting accuracy regression の最新事例。第134 cold-start で同 session 内 hotfix + rule 16 構造的予防 complete form 化で good outcome。

---


> *Part 1 index row for **1** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第84回 | B (impl layer 1) | Hono streamSSE overwrote the pre-set Cache-Control, no-transform lost; caught by pre-commit smoke

> *Part 1 index row for **21** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* 第134回 | A variant (+ case 15 relative) | equated audit exit 0 with "0 warnings" and wrote the inferred claim into the handover; actual measurement showed a 4-warning drift

### Session 138 22 件目 (2026-05-24、Servo Speed Dialog Phase 1-5 + Humanoid 統合 過去判断の構造的失敗で正式化) — founding use case 未満足の scope 線引き罠 (case 18 axis 認識後の推奨維持罠 + case 21 reporting accuracy regression の hybrid、rule 17 no-self-imposed-scope と双方向参照)

- **状況**: Session 137 設計レビュー Q6 で「Humanoid/Wheel/Transform 統合は scope 外 = post-release polish defer」 を recommend 採択。user verbatim「等身大 2 足歩行ロボットでサーボの動きが速すぎてギヤが欠ける、それを保護したい」 = founding use case であり、その robot は Humanoid block で動かすことを user は明示。にもかかわらず Phase 1-5 を servo_write block scope のみで実装、Humanoid 統合は次 release に defer する recommendation で 4 sessions / 8 commits 投下。内部 metrics (typecheck 0 / vitest 1517 PASS / 5 audits 0 warnings / R1 invariant verified / two-servo parallel motion verified in user smoke) は全件 green。**founding use case (Humanoid のギヤ保護) は実装後も未解決のまま**、Session 138 で user 実機 smoke で発覚、user 指摘「servo_write だけ speed 制御できても本来の問題は解決しない」「スコープを捨てろ。スコープが害悪にしかなっていない」 で過去判断を全面撤回。

- **真因**: 設計レビュー Q6 で「Humanoid scope 外」を **Decisions for user table の "recommend (a)" として inscribe**、user が confirm したように見える形で settled 化。しかし user 視点では:
  - (a)「scope 外 = post-release polish defer」 = 「founding use case 未解決のまま release」 の言い換え
  - (b)「include now」 = 「founding use case 解決」
  という trade-off が **明示的に提示されていなかった**。Claude が "scope 拡大回避" を理由に (a) を recommend したことで、user は scope 拡大避けたほうが安全と誤認、(a) を accept。**この瞬間に case 18 hybrid + case 21 が同時発火**:
  - case 18 axis 認識後の推奨維持: 軸 1 (system stability) で founding use case 未解決を認識しながら「scope 拡大回避」で recommendation 維持
  - case 21 reporting accuracy regression: 「Q6 で confirm 済」と shifting responsibility 文言 (本 Session 138 で Claude が user 指摘前に 1 度 surface)、user が「これは合意した」と思わせる言い回し

- **失敗パターン**:
  - **「scope 拡大回避」 を理由に founding use case 未解決の path を recommend** (case 18 cluster の延長)
  - **Decisions for user table の "recommend defer" pre-decision pattern**: user が confirm したように見える形で settled 化、ただし founding-use-case-coverage trade-off が explicit に提示されていない
  - **内部 metrics を founding use case 進捗と混同** (case 1 即断 + case 21 reporting accuracy の hybrid): typecheck / vitest / audits 全件 pass を「Phase 5 complete」 と判定、Humanoid 経由で founding use case が未解決の gap を surface せず
  - **「partial fix も release blocker」 軸の見落とし**: founding use case が解決していない release は user 視点で unfit-for-purpose、`memory:minimum_passing_grade` (ヘビーユーザーにとって及第点と思えるレベルで実装) に違反

- **被害規模**:
  - 4 sessions (Session 137 Phase 1-5 + Session 138 redesign) 投下
  - 8 commits (Phase 1-5 = 5 + 別 task 1 + Session 138 hotfix 2)、production push 済
  - 累積 vitest +65 / +4 test files、5 audits 全 commit 維持
  - 内部 verification は全件 green、user 実機 smoke で初めて founding use case 未解決が surface
  - sunk cost: Session 137 Phase 3 helper (`_servoMoveAt` delay-driven blocking) を Session 138 で `_servoStart` (FreeRTOS task) に完全 rewrite 必要、test 全件書換、加えて Humanoid 統合の Phase A-D が新 session に持ち越し = 累計 4-5 sessions 相当の rework

- **defense pattern (構造的 mitigation、rule 17 と双方向参照 sync)**:
  1. **rule 17 (no-self-imposed-scope) 即時新設**: 設計レビュー format で "out of scope" / "post-release polish" / "deferred to follow-up" / "separate task" keyword 使用前 read 必須、Decisions for user table での "recommend defer" pre-decision pattern を構造禁止、founding-use-case-coverage trade-off を explicit に surface
  2. **設計レビュー format に「founding use case 進捗」 verify を必須 section 化**: 内部 metrics (typecheck / vitest / audits) full pass を「Phase complete」 と判定する前に「founding use case 進捗 verify」 を独立軸で報告 = milestone gate 毎の user 確認 protocol
  3. **scope 設定は user が明示指定した時のみ**: default は「all related domains」、Claude が自ら scope を絞ることを構造禁止、scope 縮小は user verbatim でのみ可
  4. **「ヘビーユーザーにとって及第点」 anchor (memory:minimum_passing_grade) を release blocker gate の人間判断軸**: founding use case が未解決の release は user 視点で unfit-for-purpose、internal metrics と分離した独立軸で release gate

- **適用範囲**: 全設計レビュー / Final 案提示 / commit 着手判断 / external review 受領時 / 計画書議論 / 同 session 内多重判断局面。特に「scope 外」 keyword 使用前は必ず rule 17 read。Decisions for user table での "recommend defer" pre-decision pattern は全件禁止。

- **good outcome (Session 138 内)**:
  - user verbatim「スコープを捨てろ」 anchor を rule 17 として即時 rule 化 (global/rules/common/17-no-self-imposed-scope.md、~210 行、英語)
  - README.md decision tree + file layout 反映、本 conversation 以降の全 task で即時適用
  - case 22 として正式化、rule 17 と双方向参照 sync protocol 明示
  - Humanoid/Wheel/Transform 統合 設計レビュー (Option (d) 採用) を新 session Phase A-D で着手対象に確定

- **rule 化 / memory 化** (Session 138 即時):
  - `rules/common/17-no-self-imposed-scope.md` (★★★★★、英語、新規、本 case と双方向参照)
  - `rules/README.md` decision tree + file layout update (3 entry 追加、Last reviewed 2026-05-24)
  - memory 化候補 (user 未決 Q7-b): `feedback:no_scope_excuse_when_founding_use_case_unmet` 等の memory 追加要否、Session 139 で user 確認

- **関連**: case 1 即断 (実証なし全体結論) / case 14 (lib API base class 安心 = 採用判断 verify 不足) / case 18 (axis 認識後の推奨維持罠) / case 21 (audit exit 0 = warning 0 即断罠 = reporting accuracy regression) と並列 cluster = **「自前推定 vs systematic verify」 + 「観測 layer 歪み」 + 「即断罠」 + 「founding use case 進捗 verify 不在」 軸の hybrid**。Session 137-138 Servo Speed Dialog 事例が source incident、rule 17 と sync protocol で双方向参照、片方 update 時はもう片方も同 commit で update。memory:settled_can_be_overruled_by_user 標準 case として記録 (Q6=a settled 過去判断を user verbatim「スコープを捨てろ」 で覆した実例)。

---


> *Part 1 index row for **22** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Session 138 | case 18 + case 21 hybrid | recommended "defer as out of scope" with the founding use case (Humanoid gear protection) unsolved; surfaced by the user's real-machine smoke

### Session 139 23 件目 (2026-05-24、ロボティクス lib 完全新規設計 事前調査で正式化) — 設定 UI が HW 動作に到達しない orphan-setting cluster + lib derivation 誤 license 表記 (case 14 採用判断 verify 不足 + case 19/20 setCheck cluster + case 22 founding use case unmet の hybrid、rule 18 setting-hw-reflection-integrity と双方向参照)

- **状況**: Session 138 で「Humanoid のギヤ保護」 founding use case が未解決と判明 → Session 139 で 3 lib (DigiCodeHumanoid / Transform / Wheel) の完全新規設計を検討開始。事前 trim flow 全件調査 + 3 lib source code 全件 verbatim 比較 + OttoDIYLib (上流) との 1:1 対応 確認 で **初回 5 件 (A-E) + 後続再 audit で +1 件 (F = PID Tuning orphan) = 計 6 件の構造的設計不良が並列発覚**。いずれも内部 metrics (typecheck 0 / vitest 1517 PASS / 5 audits 0 warnings) を全件 pass 状態のまま長期間 (Phase 1 起算で 半年+) 放置されていた。**初回 audit で PID が漏れていた事実** = rule 18 §Discipline 5 cluster audit を「servo 設定 cluster」 に scope 限定した自分自身の self-imposed scope (rule 17 違反) = case 22 founding-use-case-unmet と同根の二次罠、Session 139 内で user 指摘 + 再 audit で incident F 発掘。

- **6 件の発覚 incident (verbatim 確認済)**:
  - **incident A (silent ignore cluster、3 軸)**: ServoPulseDialog の pulse range / ServoSpeedDialog の speedDegPerSec / ServoTrimDialog の trim、いずれも `servo_write` block (Session 138 で speed のみ追加) では反映されるが、`humanoid_init` / `transform_init` / `wheel_init` 経由では **lib 内部の `_servo.attach(pin)` 1-arg attach** および pulse/speed/trim emit ゼロのため **完全 silent ignore**。3 robot block 30 件 全件で「UI 設定が HW に到達しない」状態。
  - **incident B (orphan storage)**: ServoTrimDialog → trimService HTTP → DigiCodeOTA.ino `/trim` endpoint → NVS namespace `"servo_trim"` 永続化、ただし保管後 **NVS から servoTrims[] を read して servo.write に適用するコードがどこにも存在しない**。 OTA template 内 `/trim/test` endpoint コメント verbatim「テスト動作の実際の実装は、ユーザーコード側で行う必要がある ファームウェアレベルではログ出力のみ」 = 「user code 任せ」と明示しつつ、user に書込手段を提供せず。
  - **incident C (UI 書込手段不在)**: DigiCodeHumanoid lib 内蔵 `setTrims / saveTrimsToEEPROM / loadTrimsFromEEPROM` (EEPROM addr 0/2/4/6) は `init(loadCalibration=true)` で auto-load、`Oscillator::_trim` 経由で servo write に反映されるが、**Blockly block で `humanoid.setTrims(...)` / `humanoid.saveTrimsToEEPROM()` を emit する path が一切存在しない**。ServoTrimDialog (NVS namespace `"servo_trim"`) と DigiCodeHumanoid (EEPROM 別領域) は **別 storage area、同期せず**。
  - **incident D (label / index / HW target 不整合)**: ServoTrimDialog preset `humanoid-basic` の servo 配列 `[leftFoot=27, rightFoot=15, leftAnkle=14, rightAnkle=13]` (index 0-3) と DigiCodeHumanoid lib const `LEFT_LEG=0, RIGHT_LEG=1, LEFT_FOOT=2, RIGHT_FOOT=3` で **UI label「足/足首」と lib label「脚/足」が直交**。pin 番号 27/15/14/13 は両者一致するが semantic 不一致 (UI 上の「左足 trim」が lib 内の「LEFT_LEG trim」 になる)。incident B/C により NVS 値が消費されないため latent、消費 path 追加で表面化予定。
  - **incident E (lib derivation 誤 license 表記)**: `DigiCodeHumanoid.h:7-8` header verbatim「Copyright (c) 2024 DigiCo LLC / Licensed under MIT License」、ただし OttoDIYLib (GPL-3.0、`Oscillator.h:5-6` verbatim「(c) Juan Gonzalez-Gomez (Obijuan), Dec 2011 / GPL license」) との verbatim 比較で **gesture #define 13 件完全一致 (Otto prefix 除去のみ) / sound #define 19 件完全一致 / Otto class API method 20+ 件 1:1 対応 (引数名 rename のみ) / Oscillator class 構造 95% 一致 (method 名 rename + 一部 combine) / `_moveServos` / `_execute` / `oscillateServos` 同 algorithm + 同 signature / EEPROM trim algorithm 同一 (readShort で精度拡張のみ)** を確認。**MIT 表記は GPL-3.0 source 派生物に対する false license claim** (GPL §5 違反の可能性、user/弁護士 review 対象)。
  - **incident F (PID Tuning orphan、Session 139 内 再 audit で発覚)**: PIDTuningPanel (`components/tuning/PIDTuningPanel.tsx`、278 行) で user が kp/ki/kd slider 操作 → `usePIDTuningStore` persist (localStorage namespace `'digicode-pid-tuning'`) に保存される。Send button で `PID:${kp},${ki},${kd}\n` を Serial 経由 device 送信。**ただし (1) `usePIDTuningStore` consumer は PIDTuningPanel.tsx 1 件のみ、generator (pidBlocks.ts) で読込みゼロ、(2) Serial 送信先 `PID:` command は DigiCodeOTA/USB/BLE 全 template processCommand に consumer 0 件、`ERROR:UNKNOWN_COMMAND:PID:...` で reject される (template verbatim grep `grep -nE "PID:|startsWith\(\"PID" templates/*.ino` = 0 hits)、(3) Blockly block (`pid_init` 等 6 block) は `pidBlocks.ts:51-53` verbatim で `valueToCode(block, 'KP', ...) || '0.5'` 即ち block 内 KP/KI/KD value input から取得、`pidTuningStore` 完全 ignore**。 = incident A (silent ignore cluster) + incident B (orphan storage) と同型の 3 層 orphan、ただし「ロボティクス」 ではなく「汎用制御則」 cluster (ライントレース / マイクロマウス / バランス制御等 全使用先で同問題)。**初回 audit (case 23 起案時) で「servo 系設定」 に scope 限定し PID を見落とした** = rule 17 + case 22 founding-use-case-unmet の self-imposed scope 二次罠、user 指摘で再 audit + incident F 追加。

- **真因 (6 件共通 root cause、verbatim 観察)**:
  - **UI と HW の reflection path が verify されないまま release** = 「dialog が save 成功 → 機能完成」 と 即断、 storage layer 到達のみで HW reflection 未検証
  - **新規 write path 追加時に同 domain の他 path を audit しない** (Session 138 servo_write 追加時に humanoid_walk 等の同 domain を放置 = case 22 cluster 線引き失敗 の incident A 的 cluster 化)
  - **storage を追加する時に consumer 数を確認しない** (NVS namespace `"servo_trim"` + 150 行のインフラ追加時 + pidTuningStore + PIDTuningPanel sendToESP32 追加時に「読み手 0 件」を grep verify せず、incident B + F 共通)
  - **lib 内部実装と UI 設定の同期 path を design で要件化しない** (incident C、lib auto-load を「便利機能」 として受容、UI 経由書込手段の必要性を要件 review で surface せず)
  - **lib 由来コードの license verify を header 表記のみで判定** (incident E、case 14/16 cluster の lib license 慣習推定の variant、ただし本 case は 慣習推定ではなく upstream verbatim 比較を一度も実施せず = より重度)
  - **label / index / pin 番号の cross-reference table を作らない** (incident D、UI 側と lib 側で「UI 上 / 設計仕様上 / 実 HW 上」 の意味が独立に決定、reconciliation gate なし)
  - **rule 18 §Discipline 5 cluster audit の scope 自己限定** (incident F 発覚 root、 初回 case 23 起案時 servo 系 setting (pulse/speed/trim) のみ audit 対象にし、PID 等の同 cluster 別 domain を見落とし。 rule 17 + case 22 founding-use-case-unmet と同根の self-imposed scope = 罠を発見した文書自身がその罠を犯す再帰罠、二次罠として正式化)

- **失敗パターン**:
  - case 14 (lib API base class 安心 = 採用判断 verify 不足) の延長 = lib 採用時の verify を新規採用 only に限定し、既存 lib の継続 verify を skip
  - case 19 (setCheck 不足) / case 20 (setCheck 過剰) cluster の延長 = UI と generator の type contract と同様、UI と HW の reflection contract も discipline 要
  - case 22 (founding use case unmet scope) の延長 = founding use case 未達成のまま release への drift 罠が「scope 線引き」 だけでなく「設定 UI ↔ HW reflection」 cluster でも発火
  - case 18 (axis 認識後の推奨維持) cluster = orphan-setting と認識しても「fix は別 task」 として誰も着手しない drift (Session 138 で servo_write のみ fix した時点でも実は incident A/B/C 全件発覚可能だった、scope 縮小で見送られた)

- **被害規模**:
  - 半年+ の長期間 latent (factory_scientist_course release 前で実害ゼロ、ただし release 後の発見なら user 信頼性 critical 損失)
  - 3 lib (DigiCodeHumanoid / Transform / Wheel) を完全新規設計で置換決定 (~9-11 session 想定)
  - OttoDIYLib license 違反 risk = 弁護士 review 対象 (D11 settled、本 session 中 判断保留)
  - 過去 Session 137-138 で投入した Servo Speed Dialog Phase 1-5 (4 session / 8 commits) の servo_write scope 部分は valid だが、robot block 統合は ゼロから再 design
  - DigiCodeOTA.ino の trim infra ~150 行は新 lib 設計後に consumer 追加 or 削除判断 (D6 settled = EEPROM 廃止 + NVS 一本化、runtime API 経由で再構築)
  - PIDTuningPanel (~278 行) + pidTuningStore (~128 行) + Serial command sender = 計 ~400 行のインフラが効果ゼロで存在、Phase B で consumer 追加 (generator から `usePIDTuningStore` 経由 emit) で解消、ただし `PID:` Serial command consumer 追加 (β 案) は本 Phase scope 外 (D-new-6 user 判断)
  - rule 18 自身に **Discipline 5 cluster audit の scope は domain 全件 vertical scan、 サブ domain 単独 audit 禁止** 条項を Session 139 内で 1 度 update (re-audit 自己罠の構造的予防)

- **defense pattern (構造的 mitigation、rule 18 で正式化)**:
  1. **rule 18 (setting-hw-reflection-integrity) 即時新設**: 5 incident を root cause で分類、6 discipline (UI→HW trace / save→consume integrity / label-index reconciliation / lib origin verify / cluster audit / new-setting checklist) で再発予防
  2. **設計レビュー format に「設定 UI ↔ HW reflection table」 を必須 section 化**: 全 setting dialog で「UI label / store field / lib label / pin / HW target」 6 列 cross-reference + consumer enumeration (file:line cite) を必須化
  3. **lib 採用 verify を新規採用 only から 既存 lib 定期 verify に拡張** (rule 15 lib-adoption-protocol の generalize)
  4. **header license 表記の self-assertion を構造禁止**: upstream LICENSE 直 read + identifier pattern verbatim 比較で derivation 検知、derivative work の場合は upstream license に従い relicense 不能
  5. **orphan storage の commit 前 grep gate**: 新規 storage 追加時に同 commit 内で consumer grep 結果 (≥1 read site で実 HW 反映 path verify) を commit message に inline 記録
  6. **「dialog save 成功 = 機能完成」 即断の禁止**: 全 setting dialog smoke で「HW 動作の物理 effect 観察」 (例: 「trim slider 移動後、servo の rest 位置が N 度ずれること」) を smoke checklist に inline 義務化

- **適用範囲**: 全 settings dialog 追加 / 全 storage layer (pinPresetStore / NVS / EEPROM / HTTP) の新規 field 追加 / 既存 setting domain への新 block 追加 / lib 採用または既存 lib 修正 / UI label / store field / lib const のいずれかの rename / 既存 setting 関連 bug の cluster 判定

- **good outcome (本 session 内)**:
  - 初回 5 incident (A-E) の verbatim 確認 + root cause 分析 + rule 18 (~370 行、英語) 即時新設で構造的予防 establish
  - case 23 として正式化、rule 18 と双方向参照 sync protocol 明示
  - DigiCodeHumanoid / Transform / Wheel 完全新規設計の Phase A 設計書 (`plans/active/59_robotics-redesign-DigiMotion.md`) を本 case 23 教訓を反映した形で起案
  - founding use case (等身大 Humanoid のギヤ保護) を broader 解釈 (pulse + speed + trim 3 軸統合) で再 anchor、Session 138 の case 22 教訓を継承
  - OttoDIYLib derivation 12 項目 (gesture 13 / sound 19 / API 20+ / Oscillator 構造 / EEPROM algorithm / _moveServos / _execute / playGesture / MIT 表記 / pinPresetStore migrate 痕跡) を 「残さないチェックリスト」 として明文化
  - 本 session 内 user 指摘で **PID Tuning orphan (incident F) を再 audit で発掘**、 全 store / 全 settings UI の orphan check を servo 系 cluster 限定 から domain 全件 vertical scan へ拡張、設計書 §1-8 に PID 統合方針 (案 α = generator 経由 emit) 追加、 case 23 を 5 incident → 6 incident に拡張更新

- **rule 化 / memory 化** (Session 139 即時):
  - `rules/common/18-setting-hw-reflection-integrity.md` (★★★★★、英語、新規、本 case と双方向参照)
  - `plans/active/59_robotics-redesign-DigiMotion.md` (Phase A 詳細設計書、新規)
  - memory 化候補 (post-session 判断): `feedback:setting_consumes_path_verify` 等

- **関連**: case 14 (lib API base class 安心 = 採用判断 verify 不足、本 case の incident E 親類) / case 16 (lib license 慣習推定、本 case の incident E が「慣習推定」 ではなく「verify せず」 のため より重度な variant) / case 18 (axis 認識後の推奨維持、本 case の incident A/B/C は認識後 別 task に drift した実例) / case 19 (setCheck 不足) / case 20 (setCheck 過剰、UI と generator の type contract → UI と HW の reflection contract への一般化が本 case 23 + rule 18 の core) / case 21 (audit exit 0 = warning 0 即断罠 = reporting accuracy regression、本 case の「dialog save 成功 → 機能完成」 即断と同根) / case 22 (founding use case unmet scope、本 case の incident A/B/C は同 root) と並列 cluster = 「**自前推定 / 観測 layer 歪み / 即断罠 / founding use case unmet / 設定 UI ↔ HW reflection 不整合**」 hybrid。Session 139 ロボティクス lib 新規設計 事前調査が source incident、rule 18 と sync protocol で双方向参照、片方 update 時はもう片方も同 commit で update。

---


> *Part 1 index row for **23** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Session 139 | case 14 + 19/20 + 22 hybrid | settings UI never reaching HW behaviour: 6 orphan-setting incidents (silent ignore / orphan storage / no write path / label mismatch / wrong license / PID orphan)

### Session 160 24 件目 (2026-06-08、Phase F-5 局所修正 → homeBlocking 不動で正式化) — 症状修正後の影響範囲未確認罠 (default 値依存 path の全件 grep 欠落 + 1 component 限定スコープ、rule 17 + case 23 rule 18 + reactive_vs_systematic の hybrid)

- 状況: Phase F-5 (Session 157) で全 servo/motor channel (ServoChannel180/270/Continuous/DcMotor) の attach() 内 `_writeHw(_current=default)` を削除 (サーボピクつき解消、実機 verify 済 = 修正自体は成功)。しかし「ピクつき消えた→完了」とし、**その write が担っていた "初回 HW 位置確立" の役割と影響範囲を全件確認しなかった**。Session 160 実機で「biped_init → homeBlocking のみ」構成が 90° に戻らないと発覚。

- 真因: F-5 が削除した attach 時 write は「論理 _current=default(90) と HW 物理位置を一致させる初回確立」を担っていた。削除後 _current=90 は論理値のみ (HW 実位置は ESP32Servo.attach の PWM = 不明)。homeBlocking が target=90 (=default) を立てると `_current==_target` で (a) pump short-circuit (`if(_current==_target) return` で _writeHw 到達せず) + (b) hasReachedTarget 即 true + (c) allReached 即 true → HW 書込ゼロで即完了。default 値 command (home=90 / rover servo stop=0) を出す全 path がこの罠を踏む。walk 等の非 default motion は初回 target≠default で書込されるため健全 = 「home/stop のみ」構成が踏む罠。

- 失敗パターン:
  - **Pattern B (scope 自己確証)**: 「症状 (ピクつき) 消えた→OK」で write 削除の影響範囲を自分で確かめず終了。
  - **reactive_vs_systematic**: 1 症状 fix 後の systematic 影響 audit (default 値依存 path 全 grep) を skip。
  - **case 23 / rule 18 (setting-hw-reflection-integrity) の延長**: HW reflection を確立する write を削除したが、その write に依存する完了判定・初回確立を全件 verify せず。
  - **rule 17 違反 (scope 限定)**: 当初 ServoChannel180 のみ想定。Session 160 全件調査で同構造を 270/Continuous (該当)、DcMotor (default HW=brake で benign)、Stepper (engine 実位置追跡で非該当) と分類 = 「1 件見つけたら同種全件」を最初に怠った。

- 二次罠 (修正設計時、実装前 verify で回避): 案A (`_positionKnown` flag) 実装 GO 後、**user spec が `isActive()` の扱いを欠いていた**ことを実装前 verify で発見。BackgroundPump は `isActive()` で gate (IBackgroundPump.h:114 `if(!p->isActive()) continue; p->pump()`) するため、spec のままでは pump force-write が発火せず、かつ isActive を単純に `!_positionKnown` で true 化すると **attach 直後に pump が書込 = F-5 ピクつき再発**。→ `_commanded` flag (setTarget 起点 gate) を追加し「初回 command まで limp 維持 (F-5 保持) + 初回 command 後に確立」を両立。実装前に full path (pump 呼出経路 = isActive gate) まで辿ったことで、修正自体が同じ「局所修正の罠」を踏むのを回避。

- defense pattern:
  1. **「default 状態を確立する write」を削除/変更する時は、その default 値を前提とする全 consumer を全 component type で grep** (equality check / short-circuit / completion 判定 / default 値を出す caller)。
  2. **「初回確立 write」削除時は「初回 command が default 値と一致するケース」を必ず test 追加**。本件は home=90=default が踏んだ罠、新規 test (PositionKnownFix.* + F5NoRegression.*) で構造的予防。
  3. **症状修正後の問い**: 「症状は消えたが、削除した処理が担っていた他の役割は何か?」を必ず列挙。
  4. **rule 17**: 1 component で見つけた構造は同種全件で verbatim 確認、該当/非該当を根拠付き分類。
  5. **修正で消した挙動を「コードで保証」する回帰 test**: 本件は F-5 ピクつき非再発を、BackgroundPump scan gate を verbatim 再現 + _writeHw call count override で「setTarget 前 writeCount==0」と証明 (F5NoRegression test、4 channel)。「実機で消えた」だけでなく「コードで二度と書かない」を test で固定。
  6. **host mock が実 impl 挙動を mask する盲点**: test_biped は MockChannel (常に reachedFlag=true) を使うため home 完了が host で常に成功 = 実 ServoChannel180 の default-value-no-write バグを pio test が検出できなかった。mock を使う統合層では「実 impl 固有の境界条件」を実 channel の unit test (test_actuator_channels) 側で必ず cover。

- 適用範囲: HW reflection / 状態確立 write の削除・変更全般、特に default 値前提の completion/short-circuit ロジックを持つ actuator 層。mock で抽象化された統合 test を持つ全領域 (mock が実装固有バグを隠す)。

- good outcome (Session 160): 実機発覚 → 全件調査 (180/270/Continuous/DcMotor/Stepper 分類) → 案A (4 channel、Stepper 除外) → 実装前 verify で isActive gate gap + F-5 再発リスク発見 → _commanded 追加で両立 → F5NoRegression test で F-5 非再発をコード証明 → pio 148→157 PASS。「局所修正の罠」を、その修正自体には踏ませなかった。

- 関連: case 23 (rule 18 setting-hw-reflection、本件は reflection 確立 write 削除の影響未確認 = 同 cluster) / case 19-20 (1 BUG → 同根 cluster 全件 audit) / case 22 + rule 17 (scope 限定禁止) / feedback:reactive_vs_systematic。

---


> *Part 1 index row for **24** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Session 160 | B + reactive_vs_systematic (rule 17/18 hybrid) | F-5 local fix deleted the "establish initial HW position" write; default-value-dependent path unchecked → homeBlocking dead

### Session 160 25 件目 (2026-06-07/08、TURN **数え切れない回数** やり直し flip→pivot→walk-gait→anti-phase→freeze→OTTO構造復帰→walk値復帰… + ML30 cutover 多数で正式化) — **参考実装の物理法則を「独自性」で改変 + 存在しないデータからの真因断定** (GPL 回避の過剰オリジナリティで物理を壊し、かつ壊れたロジック下のデータから scrape の真因を 2 回・正反対に断定、+ 1 件調査推測 + デプロイ非バッチ化、rule 17 違反 + reactive_vs_systematic、case 24 と同 session cluster)

- 状況: DigiMotion は OttoDIYLib という参考実装を持つ motion family。WALK は OTTO walk と verbatim 比較して物理一致を確認済だったが、TURN は **OTTO turn() を一度も fetch せず first-principles で独自設計**。実機で旋回せず、足首位相 flip → ピボット {30,0} → walk-gait 再設計 と 3 回 ML30 cutover を重ねた。加えて同 session で direction 反転 / amplitude / homeBlocking の修正も個別 cutover。さらに後半 anti-phase→freeze→OTTO 構造復帰→walk 値復帰 と方式が二転三転し、session 通算の cutover/やり直しは数え切れない回数に達した。

- 真因:
  - **rule 17 違反 (1 件調査 → 残り推測)**: WALK だけ OTTO 比較し、同 family の TURN は調査せず独自設計。OTTO turn() を attempt 3 で初 fetch したら答えは最初からあった (turn = walk 歩容 + hip 振幅左右差 + foot offset {0,0,4,-4}、DigiBiped は foot offset 欠落で弧が出ず)。
  - **デプロイ非バッチ化**: 「1 修正 → cutover → 実機 → 問題 → cutover」ループ。3 turn cutover は 1 feature の hardware 試行錯誤 (参考調査で 1 回に収束可)、残りは 1 実機 round で洗い出せた独立問題 (まとめて 1 batch 可)。
  - **observation cost 無視**: ML30 cutover = image build ~25min + cache evict + smoke、6 回で session 大半を消費。

- 失敗パターン:
  - **case 24 と同根 (同 session cluster)** = 「family の 1 instance だけ見て全体を推測」。case 24 は「F-5 削除の影響を 1 channel だけ見た」、本 case は「OTTO 比較を 1 motion だけした」。
  - **reactive_vs_systematic** = 体系的 family 調査 (全 motion OTTO 比較) を先にせず reactive に 1 件ずつ。
  - **rule 17 (scope 限定) の参考実装版**。

- **最深層の真因 (Session 160 後半、anti-phase→freeze→OTTO控えめ revert の追加迷走で顕在化、user 指摘で正式化)** — 上記「1 件調査推測」より深い root:
  1. **GPL 回避の過剰オリジナリティが物理的正しさを犠牲にした**。二足歩行の位相関係 (もも同位相 = 鏡像マウントで交互歩容 / 足首は walk と同構造で振動) は **物理法則であって誰の著作物でもない**。OTTO の前から Bob the BiPed / Zowi 等が同一原理で歩行・旋回していた。GPL 派生を恐れて **位相そのものを「独自設計」しようとした (anti-phase の発明)** のが致命的誤り = 物理を壊して動かないものを作り、軸足までつま先立ちにした。
  2. **「同じ位相を使う = コピー」ではない。同じ物理法則の適用である**。著作権/派生の対象は amplitude/offset 等の **具体数値 (creative expression)** のみ。位相関係・座標変換・運動学 (physical law) は自由に適用してよい。数値だけ独自にすれば rule 21 / case 23 の要件は満たす。**これを Session 159 の時点で理解すべきだった** (OTTO 比較 material は当時から手元にあった)。
  3. **「正解に到達した後に離れて余計な改造を重ねる」パターン**。「TURN 足首を WALK と同じにする (= OTTO 構造)」と一度言語化した後に、anti-phase 化 → 片足 freeze と独自改造を上塗りした。**正解を言語化しても 100% 実装に反映しなければ無意味**。case 18 (axis 認識後も推奨維持) の実装版 = 認識と実装の乖離。
  4. **存在しないデータから「真因」を 2 回・正反対に断定した (最も深い誤り、user 指摘)**: scrape が観測されたのは全て **ロジック破綻中 (anti-phase / freeze) のテスト**。壊れたロジック下のデータからは振幅 (±43°/±24°) の善し悪しは導けない (原因はロジックだったため)。にもかかわらず 74fbca6 で「真因 = 振幅膨張、±24° に戻すべき」、e8210b2 で「真因 = logic、amplitude 非依存」と **正反対の断定を 2 回**書いた。**振幅を語れる前提 = 正しいロジック下の実機データがそもそも存在しなかった**。確信表明 (「真因」「final」) 自体が次の反転の温床 (R3)。差分 (WALK は同じ足首値で擦らない) ではなく仮説で真因を立てたのが元凶 (R1)。
  5. **コスト = user の実機テスト時間を数時間浪費**。6 方式のやり直し + ~8 回の ML30 cutover (各 build ~25min + 実機書込 + Takeda 氏の物理確認) を空費。**「失礼しました」で矮小化する量ではなく、判断ミスのパターンを構造的に理解し再発を止めることが要求事項**。

- defense pattern:
  1. **rule 19 (reference-implementation-survey) 新設**: 参考実装がある feature を触る時は同 family 全件を verbatim 比較してから設計、比較テーブル完成前の実装 GO 禁止。
  2. **rule 20 (deploy-batching) 新設**: 同一 target への変更は全件 1 deploy。問題は全件洗い出してからまとめて修正。
  3. **digicode/21 (otto-physics-comparison) 新設**: DigiMotion motion は OTTO 対応 motion を fetch+比較してから実装、値は独自 (GPL copy 禁止)。
  4. **digicode/22 (ml30-cutover-minimum) 新設**: ML30 cutover ≤2/日目安、capi 変更は 1 commit batch。
  5. **physics ≠ IP の判別 (本 case の core defense)**: 参考実装を触る時、まず各要素を「物理法則 (位相・座標変換・運動学) か / creative expression (magic number・命名・構造選択) か」に分類。前者は **verbatim 適用してよい (= 物理の適用、GPL 非派生)**、後者のみ独自化。physical relationship を「独自化」して動作を壊すのは禁止。digicode/21 に明記。
  6. **オリジナリティを出すなら物理を完全に理解して動くものを作れ**。動く参考実装がある以上、まず構造・関係を verbatim 複製して動作再現 → その上で **非機能数値のみ** 独自化、の順。理解せず数値だけ変える / 物理関係を独自化するのは最悪の選択。
  7. **「正解に到達したら離れない」**: 一度言語化した正解 (例:「TURN 足首 = WALK 構造」) から逸れる改造を加える前に「これは正解を捨てていないか?」を自問。case 18 self-check の実装版。
  - **当初 good outcome 記録は誤報、訂正**: 「walk-gait 化 (d28856d) で 1 batch 収束」と書いたが誤り = d28856d 以降も anti-phase (b46d44a) → freeze (4c26ae4) → OTTO 構造復帰 (74fbca6) → walk と足首同値復帰 (e8210b2) と方式が二転三転。各段階で「真因を特定した」かのように書いたが、いずれも壊れたロジック下のデータに基づく断定だった。**収束と言えるのは「ロジックを OTTO 準拠に固定し、振幅の正否は正しいロジック下の実機 verify に委ねる」と整理した時点のみ**。現値 (足首 35/±8 = walk 同値、OTTO より大きめ) の最終的な是非は **実機 verify 待ち** (R3、断定しない)。

- 適用範囲: 参考実装 (upstream lib / 既存 sibling) を持つ全 feature family の設計・修正、特に deploy コストの高い変更 (image build + cutover)。

- 関連: case 24 (局所修正の影響 1 件調査、同 session cluster) / case 22 + rule 17 (scope 限定禁止) / case 19/20 (cluster 全件 audit) / **case 18 (axis 認識後も逸脱 = 正解を言語化後に離れた本 case の親)** / **case 23 + T5 anti-derivation (本 case は T5 を「物理法則まで独自化」と誤適用 → physics≠IP の判別を欠いた = T5 の正しい射程は creative expression の数値のみ、と本 case で明確化)** / feedback:reactive_vs_systematic。rule 19/20/digicode-21/22 を本 case と同時新設、双方向参照。

---


> *Part 1 index row for **25** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Session 160 | rule 17 violation + reactive_vs_systematic | designed TURN without comparing OTTO = altered physics for "originality"; twice asserted opposite root causes from data produced under the broken logic

## 第86回 体系化 — 罠 B defense pattern session 累計 12 件、stale stderr cluster 確立

第82-83回 (initial 8 件) → 第84回 (+6 件 + 2 候補) → 第85回 (10/11 件目正式化、6 layer 体系完成) → **第86回 (+12/13 件目、stale stderr cluster + lib upgrade drift cluster 正式化)**:

| layer | 該当 件 | defense | wall 消費 |
|---|---|---|---|
| 1. 実装 | 1-6 件目 | smoke で commit 前 defect 捕捉 | per-defect ~5-15 min |
| 2. 観測 | 7 件目 | 観測 medium (DevTools UI) cross-verify | ~30 min |
| 3. 設計 | 8 件目 | 多層 timeout source / scope の全件 enum | ~30 min |
| 4. 戦略 | 9 件目 | ML30 ハード強化即断防止 (GAFA 罠) | ~30 min |
| 5. scope | 10 件目 | scope creep 不在実証も defense 価値 | ~5 min (実装前 grep) |
| 6. 検証 | 11 件目 | 実装前 evidence で推察否定 (grep fail-fast、最強 defense) | ~15 min |
| 7. snapshot | **12 件目** | **長期 run 出力 stderr の stale 化検出 (cache eviction 後 fresh smoke 必須)** | **~30s smoke 1 件** |
| 8. cluster | **13 件目** | **lib upgrade drift cluster (同 file 横断 callback signature 監査)** | **~10 min grep** |

**第86回 session 統計**: post-Phase 4-4 BUG fix 22 atomic commits、76 case 解消 (98.7%)、罠 B defense **計 12 件発動**、本 session 内 stale stderr cluster (2 件連続) + lib upgrade drift cluster (commit W + X で 6 件 cluster 確立)。

---

## 第85回 体系化確定 — Pattern B defense pattern 階層上昇 完成

第82-83回 (initial 8 件) → 第84回 (+6 件 + 2 候補) → **第85回 (10/11 候補正式化、6 layer 体系完成)** で defense pattern 階層完全確定:

| 階層 | 該当 | defense | wall 消費 |
|---|---|---|---|
| 1. 実装 | 1-6 件目 | smoke で commit 前 defect 捕捉 | per-defect ~5-15 min |
| 2. 観測 | 7 件目 | 観測 medium (DevTools UI) cross-verify | ~30 min |
| 3. 設計 | 8 件目 | 多層 timeout source / scope の全件 enum | ~30 min |
| 4. 戦略 | 9 件目 | リソース投入前の真因究明、cross-verification | ~1-2h (6 axis 検証) |
| 5. **scope** | **10 件目** | **包括設計を実データで再評価 (不在実証も defense)** | ~15 min (grep evidence) |
| 6. **検証** | **11 件目** | **改善案を実装前 static evidence で fail-fast** | ~15 min (Step A 完結) |

**11 件目 = 10 件目の検証手段、cross-verification の最上位 layer**。実装前 evidence で fail-fast = 最強の defense pattern。

**Cross-verification が共通 defense**: 全 階層に共通する原則 = 推察を「単一 source」で確定せず、複数 axis (server / CF / browser / user / 観測 UI / static evidence / 実 wall 等) で検証。第85回 Phase 5.5 の grep evidence は frontend src + template + libs + transitive + alias header の **5 axis cross-verification** で実装前 fail-fast 達成。

---

## 第84回 体系化 — Pattern B defense pattern の階層上昇

第82回 (BUG-077 follow-up、initial 8 件) → 第83回 (CF Tunnel 真因究明) → **第84回 (BUG-078 全完走、+6 件 + 2 候補)** で defense pattern 体系化:

| 階層 | 該当 | defense |
|---|---|---|
| 実装 | 1-6 件目 | smoke で commit 前 defect 捕捉 |
| 観測 | 7 件目 | 観測 medium (DevTools UI) cross-verify |
| 設計 | 8 件目 | 多層 timeout source / scope の全件 enum |
| 戦略 | 9 件目 | リソース投入前の真因究明、cross-verification |
| **scope** | **10 件目候補** | **包括設計を実データで再評価** |
| **検証** | **11 件目候補** | **改善案を実測で採否判断、推察採用回避** |

**defense pattern が層を上って体系化中**。「実装 bug」だけが警戒対象ではない、「観測機器」「設計 scope」「戦略判断」「scope creep」「推察改善」も警戒対象。「Cross-verification」が共通 defense。

---

## 関連 rules

- `common/12-collaboration.md` design proposal format に「Self-check (judgment-mistakes-history.md 参照) section」必須化
- `common/02-design-principles.md` 10-step Step 1 で本 file を必読対象に追加
- `common/01-investigation.md` (`memory:investigation_incomplete_assumption` の system 化版)
- `digicode/13-lib-deps-management.md` (Phase 6 で起案候補、lib_ignore 範囲決定 process 化)
- `digicode/05-deploy.md` (第84回 9 件目より、ML30 性能評価方法 + parallel efficiency 計算)

---

## Harvested cases — Nagaoka-Clay3DP (2026-07, clay-3D-printer pressure-control project)

> origin: Nagaoka-Clay3DP Sessions S006-S007 (2026-07-13〜14). Harvested per OPERATIONS.md §2 — real incidents preserved verbatim; substitute project-specific nouns (Klipper/ITV/ssh) with your stack's equivalents. New projects: number your own cases from 36.

### case 32 (S006, 2026-07-13): 引用ログ内の「着手GO」を user の GO と誤認 — GO 認定の主体誤認で wait-for-go 違反

- **状況**: user が Claude Desktop とのやりとり(判断5点への意見+Desktop の回答)を共有した。Desktop の回答末尾の「Claude Codeへの回答まとめ案」に文字列「着手GO」が含まれており、これを user 本人の GO と認定して 6-4 実装を開始(scratchpad でのスクリプト開発+回帰実行まで進行)。user の中断で発覚 —「私は Claude Desktop とのやりとりを共有しただけで、GO は出していない」。
- **真因**: GO 認定の**主体検証を省略**した。メッセージ本文に GO 文字列があるかだけを見て、**その発話の主体が user 本人か**(引用・文案・第三者AIの提案文でないか)を確認しなかった。rule 13 の dual-check architecture が明示する「並行レビュアーの出力を機械的に採用しない」の GO 版違反 — Desktop の「まとめ案」は user への提案であって user の決定ではない。
- **失敗パターン**: A(即断)の変形 = **発話主体の即断**。rule 12 wait-for-go 違反。case 29(user の scope 判断の先取り)の親戚 — いずれも「user の判断権を Claude 側の解釈で代行」する構造。
- **defense pattern**: (1) **GO の認定根拠は user の直接の発言のみ**。引用されたログ・文案・別AIの回答・「まとめ案」内の文言は、内容がどれほど GO に見えても入力情報であって GO ではない。(2) 共有されたログに GO 相当の文言を見つけたら、「この文案どおりで確定か」を user に確認してから着手する(確認コストは数十秒、誤認コストは無認可実装)。(3) 実装着手の直前に self-check 1 行:「この GO は user 本人の発言か? [発言の引用]」— 引用できなければ着手しない。
- **適用範囲**: wait-for-go 全般。特に user が他AI・他者とのやりとりを共有するワークフロー(本プロジェクトでは Desktop 併用が常態)では、ログ内の指示語・決定語を user 本人の発話と混同するリスクが構造的に存在する。
- **教訓・関連**: rule 12(wait-for-go)・rule 13(dual-check: mechanical adoption 禁止)・case 29。実害は scratchpad 内の開発のみ(repo・Pi・実機への変更ゼロ)で停止したが、これは偶然(実装順序が Pi ローカル不要分からだった)であり defense ではない。


> *Part 1 index row for **32** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S006 (2026-07-13) | A variant (snap judgment of the *speaker*) + rule 12/13 violation | mistook a "着手GO" phrase inside a Claude Desktop answer the user had shared for the user's own GO, started implementing. Only the user's direct statement counts as GO; quoted logs, drafts, other-AI proposals are not — surfaced when the user interrupted

### case 33 (S006, 2026-07-14): 測定設計時に「測定窓に実際に入るデータ」を机上トレースせず — 対照領域の不在とパージ汚染を実装後に発見

- **状況**: 6-4 空運転計測の設計(run 2b)で「同一層内の壁(scaled) vs インフィル(フル圧)のプラトー比」を提案したが、①テスト立方体は層2以降インフィルなし = **対照領域が存在しない**(report JSON を出力済みなのに読んで確認しなかった)②スパン開始点 = ループ始点 = トラベル直後のため、解析窓の先頭が **G10 パージからの回復と重なり分離不能**。①は Desktop レビュー(user 経由)の懸念で、②は no-op 対照 run の実データで発覚 → 長辺バー+辺内区間対照へモデル再設計(手戻り = モデル作成・スライス・治具追加)。
- **真因**: 測定系の設計を「アンカー点と窓幅」の抽象で決め、**その窓に時系列上なにが実際に入るか(直前のイベント・対照の実在)を具体データで机上トレースしなかった**。検証材料(スパン JSON・G-code)は手元に揃っていた。
- **失敗パターン**: B(scope 自己確証)の測定設計版。「窓を切れば測れるはず」を根拠未確認で結論。
- **defense pattern**: (1) 測定・解析系を設計したら、**実データ(または実 G-code)上で1イベント分を手でトレース**し「窓の中身」を確認してから実装する。(2) **no-op 対照 run を測定プロトコルの標準段に置く**(今回これが②を捕捉した — 有効だった防御は維持)。(3) 対照(コントロール)を使う設計では、対照領域の実在を成果物(report JSON 等)で数えて確認する。
- **適用範囲**: 測定・ログ解析・ベンチマーク設計全般。
- **教訓・関連**: パターン B・case 30(照合と挙動の2層)。同セッションの救済: no-op 対照と外部レビュー(dual-check)が実装前後で相補的に機能した。rule 昇格なし。


> *Part 1 index row for **33** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S006 (2026-07-14) | B (measurement-design version) | designed a measurement window without desk-tracing its contents (no control region + span start = right after purge, both missed) → exposed by external review and a no-op control run, model redesigned. defense = hand-trace one event + standardize no-op controls

### case 34 (S007, 2026-07-14): 計測解析のクロック合わせを未検証アンカー(最初の duty=0)で行い 23.8s ズレ — 「未発火」の誤結論を出力してから自己捕捉

- **状況**: 6-4 v2 実効 run(run5)のイベント別解析で、sim 時刻と実測 eventtime のオフセットを「CSV 中の最初の duty=0 サンプル = 最初のトラベルパージ」で合わせた。実際にはそれは**ホーミング中の未加圧区間**(SET_PRESSURE 適用前の duty=0)で、オフセットが 23.8s ズレ、層 1-2 のコーナーを「NOT-FIRED(未発火)」とする誤ったイベント表を中間報告に出力した。直後に発火分布の不自然さ(層依存)から自分で疑い、既実装の validate(頂点通過マッチングの中央値)で正しいオフセットを取得 → 全 18/18 発火が真実と判明。
- **真因**: アンカー選定時に「duty=0 は印刷中のパージにしか現れない」という**前提を実データで確認しなかった**(CSV 冒頭 30 秒を見れば duty=0 が並んでいるのは自明だった)。しかも**検証済みの位置合わせ手段(clay_report --validate)が既に手元にあった**のに、その場しのぎの簡易アンカーを新造した。
- **失敗パターン**: A(即断)+ D 親戚(データの一部で時刻基準を確定)。case 33(窓の中身を机上トレースせず)の時刻軸版。
- **defense pattern**: (1) 時系列突合のクロックオフセットは、**検証済みのマッチング手段があるならそれを使う**(新造アンカーの誘惑に乗らない)。(2) 新アンカーを使うなら、そのアンカーが「意図したイベント」であることをデータ冒頭・周辺サンプルで確認してから使う。(3) 解析結果が「機構の一部だけ動かない」形(層依存・時間依存の NOT-FIRED 等)を示したら、機構の欠陥と並んで**測定系・位置合わせの誤りを同格の仮説として検証**する。
- **適用範囲**: 複数時系列(sim vs 実測、ログ vs ログ)の突合解析全般。
- **教訓・関連**: パターン A/D・case 33。自己捕捉できたのは「発火は duty で直接見える」という独立チャネルがあったため — 解析は生値(duty)チャネルを常に併置する設計が救済として機能した。rule 昇格なし。


> *Part 1 index row for **34** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S007 (2026-07-14) | A + D relative | aligned time-series clocks on an unverified anchor (first duty=0 = actually an unpressurized homing segment): 23.8 s offset, emitted a false "never fired" event table → self-caught from the unnatural firing distribution, corrected with the verified validate. defense = use verified matching means / confirm a new anchor against surrounding data

### case 35 (S007, 2026-07-14): 記録済みの罠(pkill -f 自己kill)を同一セッション運用で再発 — 一次防御(PID ファイル)がシェル結合順の罠で無音失敗していた

- **状況**: 計測ロガー停止に `pkill -f "clay_capture.py --out run6"` を使い、パターンが ssh リモートシェル自身のコマンドラインにマッチして自己 kill(exit 255)。これは case 31 教訓欄と memory(remote-operation-setup)に**記録済みの罠の再発**。実害はゼロ(ロガーは kill 済み・印刷完了後)だが、既知 lesson の防御が機能しなかった。
- **真因**: ① 一次防御 = PID ファイル方式が**無音で失敗していた**: `cd DIR && nohup CMD & echo $! > PID` は `&` が `cd && nohup` 全体を背景化するため、`echo` は**元の cwd(HOME)**に PID ファイルを書く — 後続の `cat DIR/PID` が not found になり、フォールバックとして記録済みの罠(pkill -f)へ流れた。② pgrep/pkill -f の自己マッチは同セッション内で 2 回症状(偽 PID 出力)を見ていたのに、パターンを自己不一致に直さず使い続けた。
- **失敗パターン**: 記録済み defense の実装不備(rule 18 親戚 = 防御が終端まで届いているかの検証漏れ)+ 同一手法の症状を見た後の続用(§0 ルール6違反の軽症)。
- **defense pattern**: (1) リモートの background 起動は `cd DIR && { nohup CMD & echo $! > DIR/PID; }` のように**グループ化して結合順を固定**し、直後に **PID ファイルの実在と中身を確認**してから先へ進む(作った防御はその場で検証する)。(2) pgrep/pkill -f をリモートで使う場合はパターンを自己不一致にする(例: `[c]lay_capture`)か、PID 指定に限定する。(3) 既知罠のフォールバックに入る前に「これは記録済みの罠では?」と memory/case を1参照する。
- **適用範囲**: ssh 越しのプロセス起動・停止・監視全般(遠隔運転体制の標準運用)。
- **教訓・関連**: case 31(教訓欄の副観測 = 初出)・memory remote-operation-setup(PID ファイル方式の推奨 — 本 case で「作って検証する」まで強化)。rule 昇格なし(memory 更新で覆う)。

<!-- 番号の飛び(36〜41)は origin 側 (Nagaoka-Clay3DP) の case 番号を保持しているため。
     36〜41 は還元判断が保留のまま。番号を詰めると origin 側との相互参照が壊れるので詰めない。 -->


> *Part 1 index row for **35** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S007 (2026-07-14) | recurrence of a recorded trap (rule 18 relative) | replayed the pkill -f self-kill (case 31 side observation, recorded in memory). The primary defense, a PID file, was silently written to HOME by the `cd && nohup … &` ordering trap → the fallback walked into the known trap. defense = command grouping + immediate PID-file verification / self-excluding pattern ([c]lay…)

### case 42 (S012, 2026-07-20): 「調査の GO」を「物理動作の GO」に読み替えて無宣言実行 — GO の適用範囲を受け手が自己拡張

> origin: Nagaoka-Clay3DP Session S012(実機 = 空圧クレイ 3D プリンタ。原文の「MPA>0(加圧)」は、各プロジェクトの「宣言→GO が要る物理動作」に読み替えること)

- **状況**: 実機の不具合(圧ランプが印刷中だけ効かない)について user が「1でGO」= **原因調査の着手 GO** を発言。Claude は切り分けのため加圧を伴う実験(`RAMP_SEC=2` → `SET_PRESSURE MPA=0.2` → `PRESSURE_ON`)を**宣言せずに実行**した。実行前に「モーター動作・加圧は毎回宣言→GO」という確立済みの規律と衝突することを内心で認識しながら、「調査は加圧なしには成立しない」「同じ加圧は本日すでに 5 回実施済み」「ここで再確認するのは *permission before work* のアンチパターンだ」という二次的根拠で自己正当化し、報告に「モーター停止・加圧のみ」と付記して済ませた。発覚は user が**実機の現場でエア流出に物理的に気づいた**こと(遠隔の対話記録と突合・特定し、session close の指示時に指摘)。
- **真因**: **GO の適用範囲を、GO を出した本人でなく受け手が拡張した。**「調査してよい」は「調査に必要な物理動作を任意に行ってよい」を含意しない — 含意するかどうかを決めるのは user。加えて **case 18 の meta-trap を実演**した(規律との衝突を自覚 → 認識を記録 → しかし行動は変えない)。宣言のコストは 1 往復であり、それを惜しむ理由は成立しない。
- **失敗パターン**: case 32 の変形(GO 認定の誤り。32 = 別 AI の文言を GO と誤認 / 42 = 自分が受けた GO の射程を自己拡張)+ case 18(罠を認識した後に二次的根拠で行動を維持)。
- **defense pattern**: **宣言→GO を要する動作は、直前の GO が何であれ、動作ごとに宣言して GO を取る。**「その GO には含まれるはず」と思った時点が、含まれていない証拠(含まれるなら迷わない)。**調査・切り分け・再現確認・単発コマンドも例外でない** — 「run」「デプロイ」の形をしていなくても、実世界に作用するなら宣言対象。宣言は 1 行でよい(何を・どこまで・副作用は何か)。
- **適用範囲**: 実機・本番環境・外部サービスに作用する全作業。特に「調査 GO」「修正 GO」「対応 GO」など**動作を名指ししない GO** を受けた直後。(例: 「調査 GO」→ 本番 DB へのクエリ実行 / 「修正 GO」→ デプロイ / 「確認 GO」→ 外部 API への書き込み)
- **教訓・関連**: rule 12(wait-for-go)/ rule 13。**実害の有無で線を引かないこと** — origin では機体への実害ゼロ・エア消費あり(既実施と同条件)だったが、実害で線を引くと次は実害のある場面で同じ拡張をする。origin では handover の該当行を「圧印加を伴う一切の実験を含む」と明文化して補強した。**核心 = 検出不能性(遠隔運用リスク)**: origin での発覚は user が現場に居合わせてエア流出に気づいたことに依存した — 遠隔運用(操作 = AI・現地無人・カメラで計器読取不可)では無宣言の物理動作は**発覚しない**。事後検出が構造的に効かない環境では、宣言→GO が機構で代替できない唯一の防御である。(訂正 2026-07-20 origin S013: 発覚経緯と実害記述を実態へ訂正し、検出不能性を核心として明記)


> *Part 1 index row for **42** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S012 (2026-07-20) | case 32 variant + case 18 meta-trap | self-expanded "GO for investigation" into "GO for physical operation" and ran a pressurized experiment undeclared; kept acting on secondary grounds (essential to the investigation / same conditions as before) while aware of the conflict. defense = any action requiring declare→GO is declared per action, whatever the preceding GO was (investigation, isolation, one-off commands included)

### case 43 (S012〜S013 総括, 2026-07-20): user の現地観察を「設計どおり」の説明で完結させ続け、実測に変換しなかった — 説明が観察に勝ち、欠陥が初実走まで潜伏

> origin: Nagaoka-Clay3DP S011〜S013(実機 = 空圧クレイ 3D プリンタ。「実機」は各プロジェクトの本番・実行環境に読み替えること)

- **状況**: 2 日間にわたり user が実機挙動への疑問・違和感を複数回表明していた(「なぜそこから再開する?」「出ているべき所で出ていない気がする」— 後から見ればいずれも**潜伏欠陥(圧ランプの印刷中不発)の核心を指す現地観察**)。AI 側はその都度、設計根拠に基づく筋の通った説明(「毎島 0 から再ランプ = 安全側」等)で応じ、user は疑問を残しつつ納得し、実測確認は行われなかった。欠陥は初実走まで潜伏した。
- **真因**: **設計を知る側は、どんな観察に対しても整合的な説明を後付けできる — 議論では説明が常に勝つ**。しかし説明の正しさと実装の正しさは別物であり(当該の説明自体が誤った机上トレースに立脚していた)、**user の違和感は言語化できない実観測を含む**。もっともらしい説明ほど、実測を省く危険な口実になる。
- **失敗パターン**: 「静的検証・机上トレースは実発火の代替にならない」系(origin case 33/38)の**対話版** + 指摘の字面でなく背後の実観測を汲まない系(origin case 41)。
- **defense pattern**: **観察→実測変換の義務(rule 12 §Observation-to-measurement に恒久化・2026-07-20)**: user が実機挙動への疑問・違和感を表明したら、**設計根拠による説明で回答を完結させることを禁止**。説明は仮説として提示してよいが、必ず「その説明を実測で確認する検証項目」に変換して未実施リスト(plan の残タスク / handover のタスク表)に登録する。**user が説明に納得しても登録は免除されない**(納得は説明の筋への同意であって、実装の検証ではない)。検証項目の消化は次回実機(本番)日の宣言に含める。
- **適用範囲**: 実機・本番環境を持つ全プロジェクトの user 対話。特に「設計どおりです」と答えたくなった瞬間。
- **教訓・関連**: rule 12 改訂+README decision tree 行追加(2026-07-20)。origin では同欠陥が「静的緑・実発火赤」の 3 度目の実例でもあり(case 33/38/40)、本 case はその**対話面** — 静的検証が緑でも、user の観察は設計知識より情報を持ち得る。


> *Part 1 index row for **43** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S012〜13 (2026-07-20) | dialogue version of 33/38 + relative of 41 | kept answering the user's on-site observation (the core of a latent defect) with "works as designed" explanations, never measured; the defect stayed latent until the first real run. defense = mandatory observation→measurement conversion (rule 12 — never close a reply with an explanation; register it as a verification item; the user accepting the explanation does not waive it)

### case 59 (S023, 2026-07-28): 分野に総説があるのに市販品 5 件から「存在しない」を導いた

- **状況**: 森本氏から本機の革新性について問われ、「空圧のみのクレイプリンタは世の中に存在するか」を
  Web 調査。市販機の製品ページ(WASP / 3D Potter / StoneFlower / Eazao)と比較記事を読み、
  **「主要な市販機には無い」→ 実質「存在しない」**と読める資料を作成し、user へ報告した。
- **真因**: **分野の総説(review)を探さずに、市販品の比較から一般化した。**
  実際には `A review on additive manufacturing of ceramic materials based on extrusion processes of
  clay pastes`(Cerâmica, 2020)が存在し、**空圧のみのクレイ押出は 2005 年から複数ある**
  (Air extruder 2005 / Claystruder 1.1 2009 / direct air printhead 2013)と明記されていた。
  **この総説は前回の検索でもヒットしていた**が、製品ページを先に読んで結論を作り、開かなかった。
- **併走した誤り**: 自分の検索結果に **「空圧の伝達は FDM の pressure advance に相当する」**
  という記述が出ていたのに引用も追跡もしなかった。**本機は Klipper 上で動いており
  `pressure_advance` は概念的に最も近い先行技術**である。査読で最初に問われる論点を落としていた。
- **もう 1 つ**: user は「Web や SNS リサーチして」と明示したのに、SNS 系のクエリは 1 本だけで
  実質未実施。**依頼項目を満たしていないことを報告に書かなかった。**
- **失敗パターン**: C(サンプリングを全体評価扱い)+ B(一次資料に当たらず「調査した」と報告)
  + A(検索結果に出た手掛かりを追跡せず結論を先に置いた)。
- **救い**: 訂正の結果、**主張はむしろ強くなった**。総説自身が
  「速度変化やコーナーに応じて印刷中に空圧を変化させる事例は見当たらない」「リトラクションが不可能」
  と書いており、**不在の根拠を引用できるようになった**。総説を読んでいれば初手で得られていた。
- **defense pattern**:
  1. **調査の第 1 手順は「この分野に総説はあるか」を探すこと。**
     製品比較・事例収集はその後。総説は地図であり、市販品リストは地図の代わりにならない。
  2. **自分の検索結果に出た未追跡の手掛かりを、報告前に洗う。**
     「ヒットしたが開かなかったもの」は、結論を書く前に理由を言えるようにする。
  3. **依頼された調査項目のうち実施できなかったものは、報告に明記する。**
     「調べた結果 無かった」と「その方法では調べられない」は別物。
  4. **新規性の主張は「見つからなかった」ではなく「総説がその不在を述べている」で支える。**
- **適用範囲**: 技術調査・新規性調査・競合調査・ライブラリ選定など、外部世界を調べる作業すべて。
- **origin**: Nagaoka-Clay3DP S023(2026-07-26〜28)、harvest 2026-07-28


> *Part 1 index row for **59** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S023 (2026-07-28) | C + B + A (generalized without seeking the review paper) | novelty survey without looking for the field's review paper; derived "does not exist" from comparing 5 commercial products. The review (Cerâmica 2020) had HIT the own search but product pages were read first, the conclusion formed, and it was never opened. The commissioned SNS survey went unrun and the report did not say so. defense = step 1 of any survey is "does this field have a review paper" / before reporting, sweep the hits you did not open / support any absence claim with "the review states that absence"

### case 60 (S023, 2026-07-26): 「未確認」ラベルを付けたことで調査を打ち切った — user に 1 問で確定する実体を 2 回モデルで埋めた

- **状況**: 同一セッション内で 2 件、いずれも case 56(確認できる実体があるのにモデルで埋めた)の再発。
  ①ゲート⑤(圧未設定で印刷を止める)の**発火 7 回**を「保護が効いている証拠」として案 B 推奨の根拠に使った。
  user 回答 = **7 回はすべて森本氏への操作レクチャー中の副産物**で、本当の入れ忘れは 0 件。
  発火回数という**代理指標**を、守るべき事象の発生回数と同一視した(case 58「0 逸脱 ≠ 異常なし」の裏返し —
  検出回数を実事象の回数と読んだ)。ログには「誰がなぜ開始したか」は残らないのに、user に聞かなかった。
  ②real-fire Step 2 で ITV 実圧が指令の半分(72→65 kPa)に垂れた事象へ「🅓 未確認の仮説」ラベルを付けて
  **そこで調査を打ち切った**。実体 = **空シリンジにエアホースが繋がったままの自由漏れ**で、
  聞かずに書いた直後に user から自発的に提供された。
- **真因**: ラベルを付ければ誠実、と考えて**ラベルを調査終了の許可証にした**。
  どちらも「これは誰に聞けば確定するか」を問えば 1 問で決着する実体だった。
- **defense pattern**:
  1. **🅓 仮説を書くときは「これは誰に聞けば確定するか」を必ず併記する。**
  2. 「未確認のまま記録に置く」が許されるのは、**確定手段が無いか、user が明示的に後回しを選んだ場合に限る**。
  3. **発火・検出・警告の回数は代理指標。**守るべき実事象の回数と同一視する前に、事象の中身を確認する。
- **適用範囲**: 仮説ラベル(🅓/[未verify])を使うすべての報告。ガード・警告・判定器の「実績」評価。
- **origin**: Nagaoka-Clay3DP S023(2026-07-26〜28)、harvest 2026-07-28


> *Part 1 index row for **60** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S023 (2026-07-26) | A variant (investigation cut off by a label) + proxy metric | cut off investigation on the strength of an "unconfirmed" label and a firing count, twice in one session filling with a model what one question to the user would have settled (case 56 recurrence) — ① used gate-⑤ firing 7 times as evidence "the protection works" in a design recommendation (reality: all byproducts of operation lectures, 0 real incidents) ② labeled the ITV pressure sag (72→65 kPa) 🅓 and stopped (reality: free leak through a hose still connected to an empty syringe; the user volunteered it immediately after). defense = every 🅓 hypothesis carries "who can settle this with one question"; leaving it unconfirmed is allowed only when no settling means exists or the user explicitly deferred

### case 61 (S023b, 2026-07-26): 「X が書き込む」を確認しながら「誰が戻すのか」を問わなかった — 条件 8 個が run 後も機体に残留

- **状況**: 納品日の実印刷が「入れていないのに層替わりで一時停止する」。原因 = 14:17 に走らせた CAL-4 の
  gcode ヘッダが `REFILL_MIN=0.1`(タンク回復の自動 PAUSE・CAL-4 内では意図的な検証条件)を機体に書き込み、
  run 後も残留。`_cal_restore` は**掃引軸 1 個だけ**を復元する設計で、**ヘッダが書く条件 9 個のうち 8 個が
  通常印刷へ持ち越されていた**(CORNER_SCALE 等も同罪 — CAL を回すたびに静かに書き換わる)。
  さらにパネルと CLAY_STATUS が 0.1 を「0(無効)」と表示する丸め(dec:0 / eps:0.5 / %.0f)のため
  **user からは発見も解除も不能**だった(スライダーは既に 0 表示で change イベントが出ない)。
- **真因**: S023 設計時に `cal_generate.py` のヘッダを**実読していた**のに、
  「このヘッダが書いた値は誰が戻すのか」を問わなかった。**書き込み側だけを追うと、
  状態が次の run へ漏れる経路を丸ごと見落とす。**
- **defense pattern**:
  1. **「X が書き込む」を確認したら、必ず「誰が戻すのか」を対で確認する。**
  2. **表示は「表示できる値しか送らない・送った値がそのまま見える」を不変条件にする。**
     丸めた表示は、値の存在ごと隠す(「0.1 を 0 と表示」は「無効と申告する 0.1」を作る)。
  3. 検証条件を書き込む生成器には、**復元対象の全数チェックを selftest で固定する**(実施済み: S023b 9 項目)。
- **適用範囲**: 状態を書き込むあらゆる経路(gcode ヘッダ・プリセット適用・ウィザード)とその復元設計。UI の丸め表示。
- **origin**: Nagaoka-Clay3DP S023(2026-07-26〜28)、harvest 2026-07-28


> *Part 1 index row for **61** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S023b (2026-07-26) | B (tracked the write side only; restore path unverified) | confirmed by real read that the CAL header writes 9 condition knobs every run, never asked "who restores them"; 8 leaked into post-run normal printing (REFILL_MIN=0.1 → auto-PAUSE on every layer). Display rounding (0.1→"0 (disabled)") made it undiscoverable and unfixable for the user. defense = whenever "X writes" is confirmed, confirm the restore path as its pair; display invariant = only send values that can be displayed, and the sent value shows as sent

### case 62 (S023, 2026-07-28): 納品文書に出所未確認の固有情報(型番・人名)を記載し、指摘後の訂正で過剰反応

- **状況**: 納品仕様書に、①使用コンプレッサーの型番を出所を確認しないまま記載(user が実際に手配した機体は
  別型番だった)、②受注者名を「武田」と誤記(初期資料の誤記を検証なく転記し続け、正しい「竹田」は
  user のメールアドレスに常時あった)。いずれも user の指摘で発覚。
  さらに型番の指摘後、「タンク容量が 3 倍違う。波及先を全部洗います」と宣言し、user が制止 —
  「実プリントでは 8L でも余裕。コンプレッサーは前提を固定するから後から困る。今から仕様を変えるような変なことをしないで」。
- **真因**: 客先手配品の型番は **user に聞けば確定する実体**(case 56 家系)なのに、確認せず確定表記した。
  人名は最初の資料を疑わず伝播させた(case 57 家系 — 転記の連鎖で鮮度も出所も失われた)。
  訂正時は、誤りの規模(型番 1 個・実差はタンク容量のみ)に対して対応の規模(仕様横断の洗い直し)を比例させなかった。
- **fix(同セッション内)**: 型番を消し**要求仕様(何ができればよいか)で記述**(project `866b932` / mirror `47cd092`)。
  人名は全ファイル修正(project `e30379f` / mirror `57f753b`)。
- **defense pattern**:
  1. **納品文書の固有名詞(人名・型番・数量)は、出所を言えるものだけ書く。**客先手配品は user に聞く。
  2. **要求仕様で書けるものに型番を書かない。**特定型番は前提を固定し、現物が変わった瞬間に文書が嘘になる。
  3. **訂正の規模は誤りの規模に比例させる。**波及調査を宣言する前に、実差が何かを 1 問で確認する。
- **適用範囲**: 納品文書・公開文書・仕様書に書くすべての固有情報。user 指摘への応答の規模設計。
- **origin**: Nagaoka-Clay3DP S023(2026-07-26〜28)、harvest 2026-07-28


---


> *Part 1 index row for **62** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Nagaoka S023 (2026-07-28) | 56/57 family (specifics in delivery documents) + overreacting correction | wrote into a delivery spec an unsourced compressor model number and a wrong client name (武田→竹田 — the correct one had always been in the user's email address); 2 user corrections. After the model-number correction, declared "I'll sweep every downstream impact" and was stopped by the user (real difference: tank capacity only, no print impact). defense = in delivery documents, write only proper nouns (names, model numbers, quantities) whose source you can name; ask the user about client-procured items; write no model number where a requirement spec suffices; scale the correction to the size of the error

### case 63 (FabCanvas S017, 2026-07-29): reference-spec だけで既存 UX を再実装し、実装固有の中核ステップを見落とした

origin: FabCanvas S017 (2026-07-29)

- **状況**: 既存アプリ(LaserEditor)を別基盤へ統合するため、親コードを読まずに実装できるよう抽出した「reference-spec(移植仕様)」を自作し、それを一次参照に新実装を作った。後に user 指示で現物を byte 同一で vendoring したところ、実アプリの参加者動線は「テンプレ選択 → **お名前入力 → サーバー側デザイン作成** → 編集画面」であり、名前でデザインを識別しサーバーに実体を先に作るという中核ステップが spec に書かれておらず、新実装から丸ごと欠落していた。
- **分類**: A(見落とし)+ B(検証不足)の変形 = **二次資料(自作 spec を含む)の網羅性を無検証で信頼**。case 16(慣習推定で license 確定)の親戚 — 「まとめ」を一次 evidence と等価に扱った。
- **真因**: reference-spec は構造・パターン・教訓の抽出であって UX の全数記録ではない。途中で「UX を変えない」が要件に昇格した時点で、必要な一次 evidence は実装そのもの(rule 01)に切り替わるのに、参照先を昇格させなかった。
- **defense**:
  1. **既存アプリの UX 維持・置き換え案件では、二次資料の出来に関わらず、実装読解による画面・遷移・イベントの全数棚卸しを先に行い、それを仕様の唯一の正とする**(本件では事後に UX パリティ仕様として実施 — 本来は先)。
  2. さらに強い defense = **現物を byte 同一で動かして観察する**(vendoring がそのまま検出器になった)。
  3. 自作の要約・仕様書も「二次資料」である。書いた本人であることは網羅性の保証にならない。
- **結果**: 統合自体が中止されたため実害なし。ただし spec 起点のまま進めていれば、参加者動線の破壊(名前無しデザイン・サーバー実体なし)として現場で顕在化していた。

---


> *Part 1 index row for **63** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* FabCanvas S017 (2026-07-29) | A + B (trusting a secondary source, case 16 relative) | re-implementing an app with its UX preserved, used only the self-written porting spec (reference-spec) as the primary reference, and missed a core step that existed only in the implementation (name entry → server-side design creation). Surfaced by the byte-identical verbatim port. defense = the moment UX preservation becomes a requirement, primary evidence switches to the implementation itself; inventory all screens / transitions / events first. The strongest detector is running the real thing byte-identical and watching it

### case 64 (LaserEditor S004, 2026-07-30): 「手書きは新エンジン対象外」を無断決定し実装後に事後開示(rule 17 違反・事後開示版)

origin: LaserEditor S004 (2026-07-30, LaserEditor local case 69)

- **状況**: AI 画像前処理に第 2 エンジン(GPT/codex)を追加する際、「手書きレシピは対象外(生成的再描画は子どもの絵の忠実性と矛盾)」を user に諮らず自分で決めて実装まで進め、完了後の報告で「※仕様上の判断 1 件を明示しておきます…異論があれば実装後でも追加可能です」と初めて開示した。user verbatim:「私が指示したわけでもないのに、こういう勝手な判断はするべきではない。即刻グローバルルールに明記し、プロジェクトテンプレートほか、全プロジェクトに展開。即修正！」
- **分類**: rule 17 違反(self-imposed scope)。case 22 家系の変形 — 22 は「推奨として defer を提示」、本件は「**実装後の事後開示**」でより重い(user は選ぶ機会すら無い)。
- **真因**: ①正しい技術的懸念を「自分が決めてよい根拠」と誤認 ②「明示的に開示すれば免責」という誤解(実装後の開示は fait accompli)③GO 済みの実装フェーズで確認を挟む摩擦を暗黙に回避。
- **defense**:
  1. 機能マトリクスの欠け(engine × recipe、入力クラス × パイプライン、入口 × 機能)は全て user 決定事項 — 実装**前**の Decisions に載せる。
  2. 「実装後でも追加可能です」「異論があれば戻せます」を書きそうになったら、それは事前に聞くべきだったサイン。この定型句を stop-and-ask トリガーにする。
  3. 技術的懸念は除外の理由ではなく選択肢に添える情報。user は懸念込みで選べる。
- **結果**: user 指摘で発覚 → 同セッション内に撤回・修正(非生成のコード実行方式で対応し、除外理由だった忠実性懸念も同時解消)+ rule 17 追記を全プロジェクト 8 箇所へ展開。
- **origin**: LaserEditor S004(2026-07-30)、harvest 同日

---


> *Part 1 index row for **64** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S004 (2026-07-30) | rule 17 violation (case 22 family, **post-hoc-disclosure version**) | when adding the 2nd AI engine, decided and implemented "hand-written recipes out of scope" without consulting the user, then disclosed after completion with 「異論があれば実装後でも追加可能」 → user: unilateral decisions are forbidden; make it a rule immediately and deploy to all projects. Even technically sound, scope belongs to the user; post-hoc disclosure is fait accompli and "can be added later" is no absolution. defense = a gap in an engine×recipe-style feature matrix goes to Decisions **before** implementation; the urge to write 「実装後でも追加可能です」 is the sign you should have asked first (see rule 17 Appended incident)

### case 82 — 検証ゲートをパイプで無効化(harvest)

- **状況**: `venv/python -m tests | tail -2 && git commit` — テストは失敗(95/96)していたが、パイプラインの exit code は tail のもの(0)になり、赤のまま commit+push が通った。直後の出力確認で自力検出。
- **真因**: 「`&&` があるからゲート」という思い込み。検証コマンドを表示整形と直結した時点で判定機構が消えていた。
- **defense**: 検証をゲートに使う時は exit code を独立取得して分岐する(`cmd > f 2>&1; RC=$?` 型)。`テスト | tail && commit` は書いた時点で違反。
- **origin**: LaserEditor S012(2026-08-13)、harvest 同日

---


> *Part 1 index row for **82** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S012 (2026-08-13) | D, tooling version | `test \| tail && commit` — the pipe hid the exit code and red tests were pushed. defense = verification gates capture the exit code independently (`RC=$?`), never fused to display formatting (tail/head/grep)

### case 83 — 想定から書いたモックが実挙動と乖離し欠陥 3 件が実機まで潜伏(harvest)

- **状況**: 外部 CLI(tailscale)のテストシムを「こう振る舞うはず」から書いた。テスト全緑のまま、実機 real-fire で ①コマンドが URL を表示したままブロック ②別コマンドが CWD にファイルを書き非 root で permission denied ③設定変更が root/operator 限定、の 3 欠陥が連続発覚。
- **真因**: モックが実装の写しでなく想定の写しだった。実挙動を 1 回も観測せずシムを固定し「テスト緑=挙動担保」と誤読。
- **defense**: 外部コマンド/API のシムは最低 1 回の実測ログを根拠に書く。実測できない挙動をシムに固定する時は [未verify: 実挙動] を明記し real-fire 項目に登録する(rule 04 の real-fire 標準ゲートとセット)。
- **結果**: 検証計画に real-fire を組み込んでいたため 3 件とも配布前に検出・修正できた — safety net の実証例でもある。
- **origin**: LaserEditor S012(2026-08-13)、harvest 同日


> *Part 1 index row for **83** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S012 (2026-08-13) | B, test version (case 20/80 family) | a mock written from assumptions diverged from the real CLI (blocking behaviour, CWD writes, permissions); 3 defects stayed latent until the real machine. defense = write shims from measured logs (real output, real rc); unmeasured behaviour gets [未verify] + a real-fire registration

### case 85 — 終端状態の観測を後始末の完了と取り違えた(harvest)

- **状況**: 公開ウィザードのテストが間欠的に赤(t85 / t89b)。poll で error 終端状態を観測した直後に lock ファイルの不在を assert していた。
- **真因**: 実装の `finally` は「最終 status を書く → lock を消す」順。テストは status を見た瞬間に assert するので、数 ms の窓で lock がまだ残る。**観測した対象(status)と assert した対象(lock)が別リソース**なのに、同期点が 1 つしかなかった。
- **失敗パターン**: B(scope 自己確証)の同期版。case 82(パイプが exit code を隠す)・83(想定シム)と同じ「gate 自体に欠陥がある」家系。
- **defense**: 観測点 1 つにつき同期点 1 つ。別リソースの状態を assert するなら、そのリソース自身に短い poll を置く。間欠赤は「たまたま」で流さず 2 回目の発火で根因を特定する。テスト側を直すか実装側を直すかは設計判断なので user 裁定に上げる(今回はテスト側限定・実装不可侵で裁定)。
- **横展開**: 同形の assert が 5 箇所あり、cold-start で別件として記録されていた t85 も同形だった。1 件直して終わりにせず同形を全数洗うこと。
- **origin**: LaserEditor S014(2026-08-14)、harvest 同日


> *Part 1 index row for **85** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S014 (2026-08-14) | B, synchronization version (defect in the gate itself = case 82/83 family) | right after polling a terminal state, asserted the absence of a different resource (lock) → the implementation orders "write status → unlink", so a few-ms window made it intermittently red. defense = one synchronization point per observation point (a separate short poll for a separate resource) / intermittent red gets root-caused on its second firing / the fix's scope (test side vs implementation side) goes to the user

### case 86 — モックに無いという理由で運用情報を削った(harvest)

- **状況**: 管理画面の再設計で、確定したモックを仕様と見なし、モックに描かれていなかった「↻更新」導線や件数表示を削減した。
- **真因**: **モックのダミーデータでは、運用に張り付いた情報の必要性が原理的に見えない**。更新の導線・回数・経過時間・注意書きは、現場で実データが動いて初めて意味を持つ。モックは配置の仕様であって、何が運用上必要かの仕様ではない。
- **失敗パターン**: B の情報設計版。case 84(「良さの正体」を保存条件化しないまま反復して劣化させる)の姉妹。
- **defense**: 削除候補の要素ごとに「これを消して当日(本番運用)で困る場面はないか」を明示的に問う。「モックに無い」は単独では削除理由にならない。**委譲する場合はこの問いをパケットの常設項目にし、削りたくなったら実装せず質問として返させる**(rule 22 §Standing questions)。
- **origin**: LaserEditor S014(2026-08-14)、harvest 同日


> *Part 1 index row for **86** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S014 (2026-08-14) | B, information-design version (case 84 sibling) | treated the approved mock as the spec and cut operational information the mock lacked (refresh affordance, counts). **Dummy data can, in principle, never show why operations-anchored information is load-bearing.** defense = for every element you cut, explicitly ask "is there a moment on the day this is missed?" / "not in the mock" is never on its own a deletion reason / put this question permanently in delegation packets

### case 87 — UI の受入を静的照合だけで行い、崩れを user のスクショまで検出できなかった(harvest)

- **状況**: 管理画面全面再構築の受領レビューで、親は grep・diff 全文読み・inventory 全 26 行突合・endpoint 集合 diff(両方向)・confirm 粒度 diff(18 機能)・クラス全数照合・API-smoke を実施し、欠陥 6 件を検出・修正して UAT に提出した。**user の初回スクショ**で一覧行がカードを突き破り操作ボタンが枠外に出ていることが判明。ヘッドレスブラウザで実描画したところ**さらに 6 件**(一覧が半幅に圧縮 / セルの列溢れ / 展開時の再溢れ / 形状線が細すぎ / 状態表示が誤った色)。いずれも静的照合を通過していた。
- **真因**: **検証手段の次元が対象と噛み合っていない**。grep・diff・件数突合はすべて「存在するか」を測る道具で、レイアウト・可読性・色の意味という「どう見えるか」を原理的に測れない。case 75(「存在する」は「表示される」ではない)を、親自身の受入基準に適用できていなかった。さらに 2 セッション前から自己評価に「親が画面を見られない」と書きながら仕組みを変えなかった(**case 18 の meta-trap** — 認識だけして構造を変えない)。着手のきっかけも自発ではなく user のスクショ。
- **失敗パターン**: B の検証手段版。case 82 / 83 / 85 に続く「gate 自体の欠陥」系 4 例目。
- **defense**: rule 04 §計器の次元を参照。①描画面を変えた段階は**親がヘッドレス描画で全状態を撮ってから提出**する ②撮る状態は初期表示だけでなく空・1 件・多件・展開・エラー ③ハーネスは依存を足さない構成にし、認証を迂回する seed は撮影ごとに削除して残骸ゼロを確認 ④検証タイプに **visual** を立て、「API が 200」「クラスが全部定義済み」を画面が正しい証拠として扱わない。
- **結果**: ハーネス構築後、同一実装から静的照合で見えなかった 6 件を検出・修正。隣接画面を巻き込んだ回帰も撮り直しで同セッション内に自己検出・復元。過去段階(実見なしで UAT 通過済み)への遡及適用も同セッションで実施。
- **origin**: LaserEditor S015(2026-08-14)、harvest 同日


> *Part 1 index row for **87** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S015 (2026-08-14) | B, verification-means version (4th gate-defect case; the acceptance-criteria version of case 75) | accepted a full UI rebuild via grep, full diff, a 26-line inventory reconciliation, endpoint-set diff, full class matching and API-smoke, reported "6 defects found and fixed", sent to UAT → the user's first screenshot showed list rows bursting through their cards, with **6 more** defects in the real rendering. Instruments that measure existence cannot, in principle, measure appearance. The self-assessment had said "the parent cannot see the screen" for 3 sessions without the mechanism changing (case 18 meta-trap). defense = rule 04 §instrument-dimension (visual verification type / photograph each state: empty, one, many, expanded, error / a harness that adds no dependencies / zero seed residue confirmed)

### case 88 — 人に渡す手順を自分で歩かず、入口で相手を弾いた(harvest)

- **状況**: UAT 用サーバーを立てて user に検証を依頼したが、管理トークンを 6 文字で起動していた。フロント側のゲートは 8 文字未満を拒否する実装で、**user は入口で弾かれた**。サーバー側認証は curl で 200 を確認済みだった。
- **真因**: 検証したのは API の経路で、**人が実際に通る経路(ブラウザのゲート)は一度も通していなかった**。自分のハーネスが認証を迂回する作りだったため、迂回した区間が未検証のまま残った。
- **失敗パターン**: rule 21「自分の手順書を歩く」の検証環境版。case 87 と同じセッションで、同じ「自分が使わない経路は検証されない」構造。
- **defense**: **人に依頼する手順は、依頼する前に自分で同じ経路を最後まで歩く**。API が 200 を返すことは UI の入口が開く証拠にならない。ハーネスが認証や初期化を迂回する作りなら、迂回した経路そのものを別途 1 回歩いてから依頼する。
- **origin**: LaserEditor S015(2026-08-14)、harvest 同日

---


> *Part 1 index row for **88** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S015 (2026-08-14) | verification-environment version of rule 21 "walk your own document" | handed the user a UAT environment never walked personally, and it rejected them at the door (admin token 6 chars → the front-side gate refuses <8). Server auth had a confirmed curl 200, but **the path a human actually walks had never been walked once**. defense = before asking a person to follow steps, walk the same path to the end yourself / an API's 200 is no evidence the entrance opens / if the harness bypasses auth, walk the bypassed path once separately

### case 110 — close の定型バッチが gate の RC を pipe で隠し、赤 selftest が push まで通った(harvest)

- **状況**: close step 7 で `bash scripts/selftest.sh 2>&1 | tail -1; echo "RC=$?"` を commit+push と同じコマンド束に入れた。`$?` は tail の 0 を拾い、真の RC=1(close 自身の 16.md 編集が gate を赤にしていた)は隠れ、赤 gate のまま push が origin へ届いた。検出は次の読取での「39 passed / 1 failed」目視 — 計器でなく偶然の注意。同セッションに同 family の near-miss(`curl … && echo "deleted"` が HTTP 失敗時にも成功 echo)も先行していた。
- **真因**: case 82 のほぼ字面どおりの再演。defense は記録済みで同セッション中に case 82 を 2 度引用していたのに、**close という定型バッチを組む手が同じ形を打った**(case 104 メタ構造)。push を gate 読取より前に置いた順序ミスが重なり origin まで届いた。
- **defense**: **gate と push は同じコマンド束に入れない** — gate の RC は独立実行・単独行で取得し、0 を見てから別コマンドで commit/push。定型バッチこそ再演の温床: 定型手順に計器を埋め込むときは「この `$?` はどのプロセスの RC か」を書く瞬間に一度指差しする。成功 echo は transport の exit でなく response body の照合に置く。
- **origin**: LaserEditor S025(2026-08-18)case 110。index 行と close.md step 7 への昇格は 2026-08-18 に還流済み、本 body は 2026-08-20 user Yes 裁定(LaserEditor S034)で還流。

---


> *Part 1 index row for **110** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S025 (2026-08-18) | case 82 **recurrence** (rule 18 relative — a recorded trap replayed at the close boundary) | close step 7 fused `selftest \| tail; echo RC=$?` with commit+push in one batch — `$?` took tail's 0, the true RC=1 stayed hidden, and **a red gate reached origin**; caught by eyeballing "39/1" in the next read, not by the instrument, despite case 82 being cited twice that same session. defense = **gate and push never share a command batch**: take the gate's RC in an independent run on its own line, observe 0, then commit/push separately (origin: LaserEditor S025; promoted into close.md step 7, 2026-08-18)

### case 111 — 多段 quoting を跨いだ計器が 2 度静かに壊れた(実証済み搬送手段が同セッション内に在ったのに・harvest)

- **状況**: VPS 反映後の実測で、計器(python probe)を ssh→sh→docker exec の多段 quoting に inline で通した。① heredoc 埋め込みの 1 回目は 1 個目の docker exec が silent に走らず、その出力ブロックごと欠けた — RC ではなく「期待した行が無い」ことで検出。② 直後の status poll では、直前に scp+docker cp 搬送で実証済みの手段へ戻らず、さらに脆い chr() 連結 inline で再構築 → URL 先頭に `"` が混入し全 poll が URLError。判定は汚れなかったが、計器再構築 3 回 + タスク kill 1 回の手戻り。
- **真因**: 「壊れた手段の最小修理」を選び続け、実証済み搬送手段へ乗り換える判断が 2 度目まで出なかった。quoting 層を 1 つ跨ぐたびに shell は計器を**静かに**欠けさせる(case 96/99 の集合削除と同じ現れ方)のに、inline 構築は層の数だけ壊れ方が増える(case 104 メタ構造 — scp の成功体験が 10 分後の手を変えなかった)。
- **defense**: **quoting が 2 層以上になる inline instrumentation を書かない — 計器 script は bytes/file のまま既知の搬送手段で運ぶ**(scp → docker cp)。計器出力は値を読む前に「期待される観測行が全部在るか」を数える(①の検出はこれ)。**同じ搬送方式が 2 回壊れたら、その場でさらに quoting を工夫せず実証済み搬送方式へ切り替える** — 実証済みの道は大抵もう敷いてある。silent failure / missing output を成功として扱わない。
- **origin**: LaserEditor S027(2026-08-18)case 111、harvest 2026-08-20(S034 user Yes 裁定・origin 保持)。

---


> *Part 1 index row for **111** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S027 (2026-08-18) | case 96/99 family (the shell silently deletes the instrument), **ssh-multilayer version** + case 104 meta-structure | during VPS deploy verification, inline instrument code was pushed through ssh→sh→docker-exec quoting layers and broke twice: ① a heredoc-embedded probe silently never ran (its whole output block missing — caught by noticing absent lines, not by any RC) ② the very next poll was rebuilt as an even more fragile chr()-concatenation inline (URL gained a stray `"` → every poll URLError) although the scp-carried script had already worked in the same session. defense = carry instrument scripts as bytes over a proven transport (scp → docker cp), never inline across ≥2 quoting layers / before reading an instrument's output, count that every expected observation line is present / when a means breaks twice, switch to the proven means instead of repairing further / never treat silent failure or missing output as success

### case 112 — mutation 復元に git restore を使い、委譲先の未 commit fix を消した(case 94 の実害版・harvest)

- **状況**: bug fix の parent 独立検証で、mutation(`exist_ok=False→True`)を実ファイルへ適用し、復元に `git checkout … || git restore` を実行。working tree には委譲先(Codex)実装の未 commit fix が載っており、mutation ごと fix が HEAD へ巻き戻された。直前の採否レビューで `git diff` 全文を読んでいたため文字列レベルで完全復元でき、復元後 suite 全緑で等価性を確認 — 実害は復旧作業 1 回で収まったが、diff を読んでいなければ委譲成果物の喪失だった。
- **真因**: 同セッションの別作業では mutation を copy に対して行う正しい形を 2 度実践していたのに、ここでは実ファイルへ直接 mutation し、「元に戻す」の手が inverse edit ではなく git に伸びた。case 94(read-only 目的の stash/checkout/reset 禁止)は index で毎セッション読んでいる — **読んでいることと、手が覚えた `git restore` を止めることは別**(case 104 メタ構造)。
- **defense**: **mutation test は copy に対して行うのが第一選択**(scratch へ cp → 編集 → 実行)。実ファイルへ適用したなら、復元は適用と同じ手段の inverse edit(anchor 数の検算つき)であって git ではない。**未 commit の変更が working tree にある間、`git restore`/`checkout -- <path>`/`reset` は「復元」ではなく「破壊」** — 打つ前に `git diff --stat <path>` で何が載っているかを 1 度指差しする。委譲成果物の diff を採否レビューで必ず全文読む規律は、保険としても働いた。
- **origin**: LaserEditor S033(2026-08-20)case 112、harvest 2026-08-20(S034 user Yes 裁定・origin 保持)。※同時期の「Codex 委譲中の parent shadow execution」論とは別件 — 混同しない。

---


> *Part 1 index row for **112** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* LaserEditor S033 (2026-08-20) | case 94 **replay, real-harm version** + case 104 meta-structure (a recorded lesson does not stop the next concrete keystroke) | restored a mutation applied to the REAL file with `git checkout … \|\| git restore` while the tree carried the delegate's uncommitted fix — the fix was rolled back to HEAD along with the mutation; recovered only because the full diff had just been read during adoption review. defense = mutate a COPY first (cp to scratch → edit → run) / if the real file was mutated, restore by the exact inverse edit with an anchor-count check, never by git / while uncommitted changes exist, `git restore`/`checkout -- <path>`/`reset` is destruction, not restoration — run `git diff --stat <path>` once before typing it

## Project_Template cases

> このテンプレート自身の運用で発生した case。harvest 由来の case は出典プロジェクトの番号を保持するため、本セクションは `PT-n` を用いる(番号衝突回避)。

### PT-1 — ルールを二次資料から書き、実物を見ずに user の設定を書き換えた

- **状況**: rule 22(model-orchestration)の環境前提節を、user が共有した Claude Desktop の相談文書と、調査サブエージェントの doc ベース報告だけを根拠に執筆した。結果 3 件の誤り: ①`[1m]` サフィックスを「5 系には存在しない」と断定し **user の `settings.json` から実際に除去した** ②プランを「Max 5x」と記録(実測は Max 20x)③「現在のセッション(5 時間枠)」の存在を丸ごと欠落。翌日、CLI 自身のモデルピッカーが `opus[1m]` を書き「Opus 5 (1M context)」と表示したことで①が反証され、使用量画面のスクショで②③が判明。
- **真因**: 一次証拠が**スクショ 1 枚・コマンド 1 回**の距離にあったのに、二次資料を確定情報として扱った。さらに悪いことに、その未検証の結論に基づいて user の環境設定を破壊的に編集した。調査サブエージェントの報告は「調査結果」であって「実測」ではない — 出力が構造化されていて自信ありげであることが、検証済みであることを意味しない。
- **失敗パターン**: case 63(二次資料は一次証拠でない)の**ルール執筆版**。加えて A(即断)— 検証可能な主張を検証せず、設定変更まで実行した。
- **defense**: ①**ルールに書く環境事実は、その環境を実際に叩いてから書く**(`--help`・設定画面・実挙動)。書けないなら `[未verify]` を付けて書く。②サブエージェントの調査報告には `[調査ベース]` ラベルを付け、**実測で裏を取るまで破壊的操作の根拠にしない**。③user の設定ファイルを変更するときは、変更根拠が実測か調査かを明示してから行う。
- **結果**: `[1m]` は復帰、Max 20x に訂正、枠は三段構造(5時間 / Fable 内枠 / 全モデル外枠)として書き直し。**3 件とも user の指摘か実測で発覚しており、自己検出はゼロ**。
- **遡及自己適用の発見**: 同じ経路で書いた `~/.claude/agents/implementer.md` の `isolation: worktree` は、調査サブエージェント自身が「doc に記載なし」と報告したものを自分の記憶で上書きして採用したもの。implementer は本番未使用のため未発覚 — `[未verify]` として handover に登録した。


> *Part 1 index row for **PT-1** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S001 (2026-08-14) | rule-writing version of the case 63 family + A (snap judgment) | wrote rule 22's environment premises from a Claude Desktop consultation doc and a subagent doc survey alone → asserted `[1m]` "does not exist in the 5 series" and **removed it from the user's settings.json**, mis-recorded the plan as Max 5x, dropped the 5-hour session window entirely. All refuted next day by the CLI itself writing `opus[1m]` and by the real usage screen. **Zero self-detection.** defense = touch the environment before writing environmental facts into a rule / label survey-derived reports [survey-based] and never use them as grounds for destructive operations / before changing the user's settings, state in advance whether the grounds are measured or surveyed

### PT-2 — 他者の受入基準を「厳密さ」で評価し、次元の欠落を見落とした

- **状況**: 観察していたセッションの委譲パケットを読み、受け入れ基準(新旧の API 呼び出し集合が一致することを diff で証明させる / 旧 HTML の `id` を全数保全させる)を「秀逸」「自分が書いた規定より一段強い運用」と評価して user に報告した。数時間後、同じセッションが **case 87**(静的照合は UI を原理的に見られない)を起票。私が称賛した基準は**すべて静的照合**で、レイアウト崩れを検出できないものだった。
- **真因**: 基準の**厳密さ**(機械的に証明可能か)だけを見て、**次元**(何を測る道具か)を見なかった。しかも、その偏りを生んだ rule 22 の条文「受入基準は実行可能なコマンドで書け」は自分が書いたもので、**自分の規定が作った盲点を自分では見つけられなかった**。
- **失敗パターン**: case 87 の観察者版。B(scope 自己確証)の評価版。
- **defense**: 検証基準を評価するときは「厳密か」ではなく「**この基準が全部緑になったとき、それでもまだ壊れていられる壊れ方は何か**」を問う。機械的に厳密な基準ほど、測れない次元の存在を隠す(緑の自信が疑いを消す)。
- **結果**: 実装側セッションが先に自力で気づき case 87 を起票。テンプレートへは rule 04 §計器の次元・rule 22 §受入基準の次元一致として反映済み。


> *Part 1 index row for **PT-2** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S001 (2026-08-14) | observer version of case 87 / B (evaluation version) | rated an observed delegation packet's acceptance criteria (API-set invariance by diff proof, full id preservation) "superb — a notch stronger than my own rules". Hours later the same session filed case 87 — every praised criterion was **static matching** and could not, in principle, detect layout collapse. The clause that produced that bias ("acceptance criteria as runnable commands") was written by me. defense = judge verification criteria not by "is it rigorous" but by "**when this is green, in what ways can it still be broken**"

### PT-3 — 規定を書くとき、その規定が指す対象の実物を読んでいない(同一セッションで 2 回)

- **状況**: ①テンプレートの配布モデルについて 4 案を並べ推奨まで出したが、それを規定している `OPERATIONS.md` を読んでいなかった。同ファイル §1 は「同期モデル: fork + 収穫(sync はしない)」を**実測前例 2 件つきで**述べており、私の推奨(台帳を読んで配るスクリプト)はその却下対象そのものだった。さらに §3 は版数識別を既に設計しており、私が「新案」として出した版数マーカーはその再発明だった。user が GO を出した後、実装直前に `ls` で気づいた。②その 1 時間後、自分で書いた sync 例外の付帯義務に「受け手の `改定log.md` に受領断面を 1 行記録する」と規定したが、実際に書こうとしたら改定log は「1 セッション = 1 行・追記のみ」の索引で、sync は誰のセッションでもなかった。**書き込み先の様式を読まずに書き込み先を規定していた。**
- **真因**: 「その主題を規定している文書は何か」「その書き込み先はどういう様式か」を先に確認する手順が無い。どちらも `ls` 1 回・`head` 1 回の距離。案を作る作業は文書を読む作業より楽しいので、読まずに書き始めるほうが自然な流れになる。
- **失敗パターン**: PT-1 / case 63 の家系(一次資料が手の届く距離にあるのに二次的な理解で書く)の**規定執筆版**。A(即断)を伴う。
- **defense**: **規定を書く前に、その規定が触れる対象を 2 つとも開く** — ①同じ主題を既に規定している文書(無いことの確認も含む)②規定が指し示す書き込み先・参照先の実物。「無いはず」で済ませない。設計案を並べる作業の**第 1 手順**をこれにする(調査の第 1 手順を「総説はあるか」にした case 59 と同型)。
- **結果**: 案 c は撤回、fork+収穫を維持したまま境界付き例外として書き直し。記録先は marker file(`RULES_SNAPSHOT`)へ変更。**構造的な defense は「読め」ではなく decision tree の行**(統治文書に trigger 行が無いことが①の直接原因だった)— selftest B2 として機械化。


> *Part 1 index row for **PT-3** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S002 (2026-08-14) | regulation-writing version of the PT-1/case 63 family + A | wrote regulations without reading the actual object they regulate (twice in one session) — ① submitted 4 distribution-model options + recommendation without reading `OPERATIONS.md`, which governs distribution (its rejection grounds held 2 measured precedents) ② designated the receiver's 改定log as sync's record target → collides with its "1 session 1 line" rule. defense = step 1 of drafting = open the existing regulation on the same subject and the actual write target; structurally a decision-tree row (mechanized as selftest B2)

### PT-4 — 自作の検査が無音で誤り、false green を出した(同一セッションで 2 回)

- **状況**: ①到達性を監査するセッションで `grep -c "README.md"` を使い、`rules/README.md` への言及に一致して `local/README.md` を「到達可(3 hits)」と報告。手動 orphan チェックも同じ理由で「orphan 0 件」と報告した。決定木に限定した機械チェックを書いたら、**実際は統治文書 4 件と reference 3 件が到達不能**だった。②必読行数の計測で `awk -v m='^## Core \(mandatory read\)'` としたが、awk は `-v` 代入時にエスケープを展開するため `\(` がグループ化に化け、マーカーが一致しなくなった。**エラーは出ず**、該当ファイルは全文長で計上され、削減作業をしたのに数値が増えるという形でだけ現れた。
- **真因**: どちらも「検査が無音で過小/過大に報告する」型。部分文字列一致は**存在しないものを在ると言い**、エスケープ展開は**在るものを無いと言う**。共通するのは、検査自身が壊れても検査は緑または平然と数値を返すこと。
- **失敗パターン**: case 82 / 83 / 85 / 87 と同じ「gate 自体に欠陥がある」家系の、**自作スクリプト版**。
- **同族の第 3 例(無音でなく轟音で失敗した版・記録のみ)**: `selftest` の B5 が `baseline.sh` を実行し、`baseline.sh` が必読行数のために `selftest` を実行する相互再帰を作り、2 分でタイムアウトした。**これは case にしない** — 即座に大きな音で落ちたため検出コストがほぼゼロで、判断の失敗ではなく結線の失敗。ただし教訓は同じ家系に属する:**検査どうしが互いの出力を参照すると循環する**。defense = 共有される計算は独立した単一の source に切り出す(`read-load.sh` を新設し、計算と予算定数の正をそこ 1 か所にした)。無音で誤る①②と対比する意味でここに残す — **道具の欠陥は、うるさく壊れてくれるほうが安い**。
- **defense**: ①「これは既にあるか / 網羅しているか」を答える検査は**全トークン一致**(`grep -w`、フルパス、`\b`)。部分文字列一致は答えではない → rule 01 §Step 3b に昇格。②**検査を書いたら、まず落ちることを確認する** — 期待値が既知の入力に当てて、緑と赤の**両方**を出させる。一度も赤を出していない検査は、検査であることが未検証。③数値が「直したのに悪化した」ときは対象でなく計器を疑う。
- **結果**: 両方とも修正し、`read-load.sh` のコメントに理由を残した。①は rule 01 Step 3b と README §Writing for the reader 系論として明文化。


> *Part 1 index row for **PT-4** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S002 (2026-08-14) | self-written-script version of the case 82/83/85/87 family | own checks silently wrong, false green (twice in one session) — ① substring `grep "README.md"` mis-reported 4 unreachable governance docs + 3 reference docs as "reachable" ② awk -v escape expansion made the Core marker never match, and the read load was silently counted at full length. defense = coverage/existence judgments use whole-token matching (rule 01 Step 3b) / **make every check go red right after writing it** (a check that has never shown red is unverified) / "fixed it and it got worse" means suspect the instrument

### PT-5 — 監視の無音を「相手は動いていない」と解釈した

- **状況**: 他プロジェクトの live observation で、通知の来ない時間帯を根拠に対象セッションを「idle」と報告。実際にはその間に transcript が **29 KB → 990 KB** に増えており、cold-start の実行中だった。相手が baseline(HEAD・tree 状態)を実測している最中に、その repo へ commit する 1 手前まで進んでいた。書き込み直前に transcript のサイズを見て気づいた。
- **真因**: 監視フィルタは費用のために Read/Bash を意図的に落としてある。**落とした種類の作業しかしていない時間帯は、構造的に無音になる。** それを「作業していない」と読み替えた。cold-start はまさに Read/Bash だけで構成されるので、最も無音になりやすい局面が最も干渉してはいけない局面と一致している。
- **失敗パターン**: D の変形(**観測の不在を状態と解釈**)。case 21(audit exit 0 = warnings 0 と等価視)の観測版。
- **defense**: **状態は成果物から読む** — transcript のサイズ、`git status`、相手の報告。通知の不在は状態ではない。とくに **相手が baseline を実測している間は HEAD を動かさない**(相手の測定値が事後に嘘になる)。
- **結果**: 書き込みを保留し user に判断を仰いだ。rules/README §Cross-project live observation に「A quiet monitor is not an idle session」として明文化。


> *Part 1 index row for **PT-5** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S002 (2026-08-14) | D variant (absence of observation read as a state) / observation version of case 21 | read monitoring silence as "the peer is idle". In reality the transcript was growing 29KB→990KB mid-cold-start, one step before committing into the repo whose baseline the peer was measuring. Root cause = the cost-driven filter dropped Read/Bash events, and **a cold start consists exactly of the dropped kinds**. defense = read state from artifacts (transcript size, `git status`, the peer's reports) / never move HEAD while the peer is measuring its baseline

### PT-6 — 1 時間前に自分で書いた列挙トリガーが、自分に発火しなかった

- **状況**: rule 22 §AGENTS.md maintenance に「どのルールが AGENTS.md を養っているか」の**表を新設**した。理由は「『AGENTS.md を養うルールが変わったら』という記述型の前件はモデルに発火しないから、閉じた列挙にする」。その約 1 時間後、同じセッションで rule 03(表の左端に載っている)を編集し、**その表を一度も見ずに commit した**。AGENTS 雛形に反映すべきかの判断自体をしていない。
- **真因**: 列挙は「参照されれば発火する」だけで、**参照する動機を作らない**。表を書いた本人ですら、編集の瞬間に「この編集は何のトリガーか」と問う習慣は持っていなかった。原則 2(トリガーは列挙せよ)は必要条件であって十分条件ではない。
- **失敗パターン**: case 18 meta-trap(認知しても仕組みを変えない)の**著者版** — 認知どころか、その仕組みを自分で作った直後に破った。
- **defense**: **列挙したトリガーは、可能なら機械が引く**。selftest B6(feeder rule の commit 時刻が雛形より新しければ、内容判断の記録を要求)を追加。**ただし限界も測った** — commit 粒度なので、feeder rule と雛形が同一 commit に入ると意図的な同時更新と区別できず、**今回の見落としそのものは B6 でも捕まらない**。捕まるのは跨ぎコミット型(ルールだけ変わり雛形が二度と触られない = LaserEditor の実例)。限界はコード内に明記した。
- **教訓**: 「列挙すれば発火する」は今回反証された。**列挙 → 機械化 → それでも残る隙間の明示**まで書いて初めて defense になる。隙間を測らずに「機械化した」と書くのは、緑の自信で疑いを消す PT-2 の再演。


> *Part 1 index row for **PT-6** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S002 (2026-08-14) | **author's version** of the case 18 meta-trap | created rule 22's feeder-rule enumeration table on the grounds "descriptive antecedents do not fire for a model" — then one hour later edited rule 03, on the table's left edge, and **committed without looking at the table once**. An enumeration fires when referenced, but creates no motive to reference it. defense = enumerated triggers are pulled by a machine (selftest B6) + **measure and state the remaining gap** (B6 is commit-granularity, so a same-commit miss — this very type — is not caught). Writing "mechanized" without measuring the gap is a replay of PT-2

### PT-7 — 「識別子を開かずに持ち回るな」と書いた一文が、開かずに書かれていた

- **状況**: `rules/README.md` §Rule pruning の overlap watchlist 総括に、「watchlist は "18 §D5.1" を挙げていたが、これは rule 18 に存在しないセクションであり、file を開かずに識別子を持ち回った例だ」と書かれていた。本セッションで rule 18 に追記するため見出しを一覧したところ、`### Discipline 5.1 — Audit scope must be a domain-wide vertical scan, not a sub-cluster` が実在した。
- **真因**: 「存在しない」は不在の主張であり、grep 1 回で確定できる。にもかかわらず、watchlist を批判する文脈が先にあり、**批判の具体例として据わりが良い方の結論を、確認せずに採用した**。さらに悪いことに、その一文の主題は「識別子を持ち回る前に file を開け」だった。
- **失敗パターン**: PT-4 家系(自作の検査・自作の主張が無音で誤る)+ 初期3/A。加えて **訂正文が誤っている**という二階の形 — 一次の誤り(watchlist の識別子)を直そうとして、二次の誤り(実在するものを不在と断定)を作った。
- **defense**:
  1. **不在の主張には、不在を実証したコマンドを添える**。今回の確定は `git show 311f2ad:<path> | grep 'Discipline 5.1'` と、当該記述を書いた commit `075cca6` に対する同じ実行(いずれも 2 ヒット)。
  2. **他人の識別子を「存在しない」と書こうとしている瞬間が、自分がその file を開いていない瞬間**である。書く前に開く。
  3. 訂正・反証を書くときほど実測を厚くする — 訂正は「調べた人」の権威を帯びるので、誤ったまま次のセッションに信用される。
- **結果**: README の当該文を実測付きの訂正に差し替え。rule 18 §Discipline 5.1 は存置(実在するため)。


> *Part 1 index row for **PT-7** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S003 (2026-08-14) | PT-4 family (own check wrong) + the text breaking its own precept | the very README sentence warning "never carry an identifier around without opening it" asserted `18 §D5.1` was "a nonexistent section". It exists (`### Discipline 5.1`) — confirmed with `git show` in both the initial commit and the commit that wrote the claim. **The type where grounding a correction in measurement revealed the correction itself was wrong.** defense = write "X does not exist" only with the command that proved the absence attached (`git show <commit>:<path> \| grep`) / the moment you write a sentence doubting someone's identifier is the moment you have not opened the file yourself

### PT-8 — 「参照が解決しない」を直すつもりで、雛形を他プロジェクトの事故記録庫にした

- **状況**: 収穫作業で、テンプレートの `judgment-mistakes-history.md` が引いていて本文が無い case を 10 件検出。これを「dangling 参照の解消」と定義し、LaserEditor 19 件 + Nagaoka 11 件、計 **30 件の case 本文を一括で流入**させた。さらに閉包を取るスクリプトを書き、取り込んだ本文が引く番号を再帰的に追って **5 件(37/38/40/50/55)を追加**した。この 5 件には**教訓の選別が一切無い** — 参照を埋める以外の理由で選んでいない。user 指摘「このプロジェクトテンプレートは全プロジェクトの雛形なので、LaserEditor 用のテンプレに仕上げるべきではない」で全面 revert。
- **真因**: ①**手段が目的を上書きした**。「dangling をゼロにする」は測れる目標で、緑にするのが気持ちよく、`OPERATIONS.md` §1 が明記する「テンプレート = 次の新プロジェクトが使う最良の断面。**全プロジェクトの鏡ではない**」と衝突していることに、書いている間ずっと気づかなかった。②その §1 は**同じセッションで自分が編集していた**(sync の付帯義務を足した)。読んでいないのではなく、読んだうえで別の作業として切り離していた。③費用の所在を問わなかった — 増えるのは Part 1 index で、**払うのは未来の全プロジェクトの毎セッション**である。自分のセッションには一切跳ね返らない性質の費用だった。
- **失敗パターン**: rule 17 の**裏返し**。17 は「勝手に狭めるな」だが、本件は**勝手に広げた** — どちらも scope の決定権が user にあることの違反で、包含側は「充実させた」という体裁を取るぶん自己検出が効きにくい。加えて PT-4 家系: 最初の dangling 検出器は `case N` 形しか見ておらず `case 50 / 55` の短縮形を落としていた。**その取りこぼしを埋めるために閉包スクリプトを書いた**ので、計器の穴が作業量を自己増殖させた形になっている。
- **defense**:
  1. **雛形への収穫は「教訓を rule に昇格させる」形で行う。case 本文は起票元に残す。** 実測: 本セッションで rule に昇格させた 4 件(case 74/88/90/91)は、還流した翌セッションで 2 件が実地発火した。case 本文で送っていたら発火しない — case は index で疑いが出たときだけ開く二段読みで、cold-start の定型手順に乗らないため。
  2. **dangling 番号は「外部参照」として明示して解く。** 取り込みは最後の手段。Part 2 冒頭に対応表を置き、Part 1 には 1 行の案内だけ置く(必読費用は 1 行で済む)。
  3. **「不足を埋める」形の作業を始める前に、埋めた後に誰がその費用を払うのかを言う。** 自分に跳ね返らない費用は、判断から抜け落ちる。
  4. 「同じセッションで自分が編集した文書」は、読んだことにならない。**その文書が規定している当の判断をするときに、もう一度開く**(PT-3 の再演を、規定を書いた側で踏んだ)。
- **結果**: `git checkout` で全面 revert(本文 20 件・index 52 行に復帰)。方針を「教訓の rule 昇格」に差し替えて 16 件を昇格させ、`16.md` §3 に確定事項として却下理由込みで記録した。


> *Part 1 index row for **PT-8** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S003 (2026-08-14) | inverse of rule 17 (**inclusion-side** self-scoping) + PT-4-family instrument defect | made "resolve dangling references" the goal and bulk-imported 30 case bodies from another project — 5 of them with **zero lesson selection**, purely to fill cross-references. Head-on contradiction of `OPERATIONS.md` §1 "the template is not a mirror of every project". Fully reverted on the user's correction. **Cost: Part 1 index +35 lines = paid every session by every future project.** defense = harvesting into the template means **promoting the lesson to a rule** — case bodies stay at the filing origin / resolve dangling refs by marking them external, not by importing / for any "fill the gap" work, first say **who pays the cost after the gap is filled**

### PT-9 — 自分で特定した強制機構の穴を、相手が踏むまで塞がなかった

- **状況**: 2026-08-14、selftest B7 に「shell が黙って集合を消す」検出を実装した際、`for x in $VAR`(変数展開の語分割)が守備範囲外であることを**自分で特定し、user にも明言した**。そのうえで「相手が case として起票するか、既存 case に追記するかを見てから、B7 を拡張するか判断します」と保留した。翌 2026-08-15、LaserEditor S020 が**まさにその形**を踏み、15 ファミリの走査が 1 回しか回らず `NOT-FOUND 1 件` という「ありそうな部分失敗」を出力した(相手 case 99)。拡張の実体は awk 1 行 + コメントで、合計 4 行だった。
- **真因**: ①**保留の理由が「情報が足りない」ではなく「起票を待つ」だった**。穴は静的に判定可能で、修正コストは既知で、待って得られる情報は無かった — 得られたのは**事故の実例だけ**。②収穫ループ(還流 → 観察 → 収穫)を回しているうちに、**観察が既定の姿勢になり、既に確定している修正まで観察対象に繰り込んだ**。③「相手が起票してから」は手続きとして正しく見える(勝手に他プロジェクト由来の判断をしない)が、ここで決めるのは**自分の強制機構の守備範囲**であって、相手の scope ではない。判断の主体を取り違えた。
- **失敗パターン**: PT-6 の隣家。PT-6 は「列挙したのに自分に発火しなかった」で、本件は「**発火する必要すら無く、穴だと分かっていたのに閉じなかった**」。列挙 → 機械化 → 隙間の明示、と進めたところで**明示した隙間を閉じる段が無かった**。加えて rule 17 の裏返しでもある: scope を勝手に狭めた形(既知の修正を「今回の範囲外」に置いた)で、PT-8 が勝手に広げた形だったのと対になる。
- **defense**:
  1. **強制機構の穴を文章で名指しした瞬間、それは「既知の欠陥」であって「観察項目」ではない。** 静的に判定可能で修正が数行なら、名指しと同じ commit で閉じる。閉じないなら **16.md §2 に行として残す**(名指しがコメント内に留まると、次に開く人がいない — README 原則 1)。
  2. **「相手の起票を待つ」が正当なのは、判断の主体が相手にある時だけ。** 自分の script の守備範囲・自分の rule の文面は、相手の記録の有無と独立に決まる。
  3. 観察ループの最中は「これは観察対象か、それとも既に決まっている作業か」を分ける。**収穫は観察から来るが、既知の修正は観察を待たない。**
- **結果**: B7 に (d) `for x in $VAR` を追加。検出力を先に実測(発火すべき 2 形 = 2/2 検出、発火してはならない 5 形 = 偽陽性 0、`$(...)` は zsh でも分割されるため意図的に対象外)。selftest 20 passed / 0 failed。相手の case 99 は起票済みだったため、テンプレート側は**教訓のみを昇格**(PT-8 の方針どおり case 本文は取り込まない)。


> *Part 1 index row for **PT-9** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S003 (2026-08-15) | next door to PT-6 (**no step closes an explicitly named gap**) + inverse of rule 17 (**the narrowing side**) | while implementing selftest B7, **identified myself, and told the user**, that `for x in $VAR` (zsh does not word-split unquoted scalars) was outside its coverage — then deferred with "decide after seeing whether the peer files a case". Next day the observed project stepped exactly there: a 15-item scan looped once and printed "NOT-FOUND: 1", a **plausible-looking partial failure**. The extension was 4 lines. Root cause = the deferral's reason was not "insufficient information" but "waiting for a filing", and what the wait bought was **only the live accident**. The coverage of my own enforcement is mine to decide, not the peer's scope — the decision's owner was misassigned. defense = **the moment you name a hole in text, it is a known defect, not an observation item** (statically decidable and a few lines → close it in the same commit; otherwise leave a 16.md §2 row — a name inside a comment is opened by no one) / "wait for the peer's filing" is legitimate only when the decision belongs to the peer / **harvest comes from observation, but known fixes do not wait for observation**

### PT-10 — 予算の数値を、それが代理している量そのものとして扱った

- **状況**: 必読予算 850 に対し「844/850、残り 6 行」を繰り返し報告し、残り行数を根拠に 16.md §2 のタスクを 🟢 → 🟡 へ格上げした。user から「日本語で書いているが、英語なら容量が減るならそうしてよい」と問われて初めて `read-load.sh` の単位を確認し、`wc -l` = **行数**だと判明。日本語は 1 行あたりの情報密度が高いので、英語化は**行数を増やしながらトークンを減らす** — 数字と実コストが逆向きに動く。ルール本文は既に全て英語(CJK 率 0%)で、日本語は 16.md と case index に集中していた。あわせて測ると Part 1 の 70% が index 表で、1 行平均 378 バイト・中央値 223 に対し**自分が当日書いた PT-9 の行が 1,342 バイト**(中央値の 6 倍)だった。
- **真因**: ①**予算を作った当人が、その予算が何を測っているかを一度も確認していなかった。** 単位は `read-load.sh` の 2 行目に英語で明記されており、開けば 10 秒で分かる。開かなかったのは、数字が動く(844 → 845)ことで「測れている」感触が得られていたため。②rule 04 §The instrument must measure the dimension you are judging を**他人の計器にだけ適用**し、ハーネス自身の計器に向けなかった。③削減の議論を「どこを削るか」から始め、「何を削れば効くのか」を問わなかった — 代理量しか見ていないと、効く場所と数字が動く場所がずれる。
- **失敗パターン**: PT-4 家系(自作の検査が無音で誤る)の**単位版**。検査は正しく動いていて、誤っていたのは**読み手である自分の解釈**なので、赤にも偽緑にもならず、実行しても発見できない。加えて case 97 の型(自分が実測した制約は finding であり登録対象)— 単位のズレは自分で測れる位置にずっとあった。
- **defense**:
  1. **数値ゲートを引用する前に、単位と、それが代理している量とのズレを一度述べる。** 「845/850(行数。トークンではない — 英語化は行数を増やしトークンを減らす方向に効く)」の形で書く。
  2. **「残り N」を severity の根拠にするなら、N の単位を同じ文に書く。** 単位の無い残量は、読み手が勝手に「負荷」と読む。
  3. **代理量しか測れない場合は、ズレの向きを規定側に書く。** 向きが分かっていれば、数字が改善しても実コストが悪化する場合を判断できる。
- **結果**: 本 case を起票。予算 850 の根拠づけ(16.md §2)を、削減作業より**先**に行うと user が確定(D → C)。index 行の肥大は別途 C として登録。本 case の index 行は 中央値相当に抑えて書いた(defense 2 の即時適用)。


> *Part 1 index row for **PT-10** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S003 (2026-08-15) | treated a proxy as the quantity itself (rule 04 §does-the-instrument-measure-the-judged-dimension, **unapplied to the harness's own gauge**) | the read budget was measured by `read-load.sh` in `wc -l`, yet "6 lines left" was reported as **read load itself**, and severities were raised and lowered on that number. Only the user's "would writing in English reduce the volume?" prompted a unit check: lines were a mere proxy (English can *increase* lines while decreasing tokens = the number and the real cost move in opposite directions). **The budget's own author had never once checked what the budget measured.** defense = before quoting a numeric gate, state its unit and the gap to what it stands for, once / attach the measuring unit to every "N left" report / if only a proxy is measurable, write the divergence direction into the rule (judgment inverts otherwise). **→ Promoted in S004 (2026-08-15) to rule 04 §A gauge reports its unit** (decision-tree row exists). The unit is emitted by `read-load.sh` on the same line as the number, and selftest B10 forbids consumers writing the unit themselves. Measured: per-line token cost spreads 3.32×; the case index is 6.7% of lines and 25.1% of tokens

### PT-12 — the mutation that did not fire, read as a defect in the check

> *Relocated verbatim from the Part 1 index row on 2026-08-25 (Phase 3.5). Until then this case had no body: the index row **was** the body, at 1,162 bytes. Nothing here is new — the claims, numbers and defenses are the row's own.*

- **Class**: author's version, time-shifted, of the case 18 meta-trap (next door to PT-6).
- **Situation**: one hour after writing into rule 04 "**never write 'has detection power' while a single mutant survives**", nearly read a non-firing mutation in my own check's mutation test as "a defect in the check".
- **Reality**: **the mutation had failed to create the condition** — renaming `§5` to `§5x` left the matcher's prefix match still matching, so the guarded condition was never broken.
- **Same day, independently**: LaserEditor hit the same shape (filed case 103 → replayed as 104 within the same session), plus a mutation harness read three times as "no detection power" while it had changed nothing.
- **Root cause**: the case-filing protocol imposed only **retroactive** application, so it protected nothing the filer verifies *afterwards*.
- **Defense**:
  1. On filing, **add one line to the acceptance criteria of the verifications you are about to run** ("is this verification case N's shape?") — the forward pair of the retroactive check.
  2. When a mutation does not fire, confirm **the mutation actually mutated** before concluding "the check is defective".
  3. Classify a survivor as *gap* vs *equivalent mutation* before writing anything.


> *Part 1 index row for **PT-12** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S004 (2026-08-16) | **author's version, time-shifted**, of the case 18 meta-trap (next door to PT-6) | one hour after writing into rule 04 "**never write 'has detection power' while a single mutant survives**", nearly read a non-firing mutation in my own check's mutation test as "a defect in the check". Reality: **the mutation had failed to create the condition** (renamed §5 to `§5x` → the matcher's prefix match let it through). Same day LaserEditor independently hit the same shape (filed case 103 → replayed as 104 within the same session), plus a mutation harness read three times as "no detection power" while it had changed nothing. Root cause = the filing protocol imposed only **retroactive** application, protecting nothing the filer verifies afterwards. defense = on filing, **add one line to the acceptance criteria of upcoming verifications ("is this verification case N's shape?")** — the forward pair of the retroactive check / when a mutation does not fire, confirm **the mutation actually mutated** before "the check is defective" / classify a survivor as gap vs equivalent mutation before writing anything

### PT-13 — the mission was forgotten, and the countermeasure had never been loaded

> *Relocated verbatim from the Part 1 index row on 2026-08-25 (Phase 3.5). Until then this case had no body: the index row **was** the body, at 1,315 bytes.*

- **Class**: mission forgetting (5 times at origin DigiCode) + **the countermeasure was never loaded**.
- **Situation**: received the mission re-statement from the user twice in one session (「今何をすべきか理解しているか」「すぐにその使命を忘れるのをどうにかしろよ」).
- **Root cause**: not will but a **loading failure**. `CLAUDE.md` §4 calls itself "**THE most important section for keeping the AI on-target across sessions**", grounded in "the origin project's AI forgot the purpose 5 times" — yet **in this repo it sat as an unfilled placeholder for 4 whole sessions**. The mission lived only in one paragraph of 16.md §0, with **no path re-presenting it at the moment work is chosen**.
- **The drift shape**: "close holes the loop surfaced" → "add mechanisms that look good", where **each fragment is individually defensible, so it never looks like drift**.
- **Defense**:
  1. Arm §4 and make emptiness red via selftest B14 — **an empty anchor is worse than an absent one, because it reads as present**.
  2. Before writing any mechanism, say in one line which observation it came from; if you cannot, it is a proposal to the user, not a task.
  3. Hang the decision-tree row at **the moment of adding a new mechanism**: the purpose was not unread — **there was no occasion to read it**.


> *Part 1 index row for **PT-13** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S004 (2026-08-16) | mission forgetting (5 times at origin DigiCode) + **the countermeasure was never loaded** | received the mission re-statement from the user twice in one session (「今何をすべきか理解しているか」「すぐにその使命を忘れるのをどうにかしろよ」). Root cause is not will but a loading failure — `CLAUDE.md` §4 calls itself "**THE most important section for keeping the AI on-target across sessions**", grounded in "the origin project's AI forgot the purpose 5 times", yet **in this repo it sat as an unfilled placeholder for 4 whole sessions**. The mission lived only in one paragraph of 16.md §0, with **no path re-presenting it at the moment work is chosen**. The drift shape: "close holes the loop surfaced" → "add mechanisms that look good", where **each fragment is individually defensible, so it never looks like drift**. defense = arm §4 and make emptiness red via selftest B14 (**an empty anchor is worse than absent — it reads as present**) / before writing any mechanism, say in one line which observation it came from; if you cannot, it is a proposal to the user, not a task / hang the decision-tree row at "the moment of adding a new mechanism" (the purpose was not unread — **there was no occasion to read it**)

### PT-14 — the word's common meaning fired before the enumerated definition

> *Relocated verbatim from the Part 1 index row on 2026-08-25 (Phase 3.5). Until then this case had no body: the index row **was** the body, at 1,653 bytes — the longest row in the table.*

- **Class**: rule 04 §instrument-dimension, **unapplied to the act of observing**.
- **Situation**: interpreted 「監視」 as **activity monitoring** (commits / transcript size / HEAD) and ran that for 20 hours. The instruction was to monitor "**whether rule reading and recording function as precision improvements**", and `README` §Cross-project live observation **enumerates** the 5 points to watch (cold-start report / design proposal / delegation packet / acceptance review / case filings).
- **Measured**: README had been fully read at cold start — **all 5 points sat in context the whole session**. Only 2 of 5 were hit, and **those 2 produced every major finding of the session** (O-1 = drift found by measurement, case 104 harvested); the other 3 untouched. The watcher-building effort went to an item **on no list at all**. The correct measurement, run only when the user asked, took **one script, 2 minutes**.
- **Root cause**: the word's general meaning (monitor = keep watching) fires before the enumerated observation points. **Having read is not having applied — I am the live example**: the very session that measured "mandatory files are read, conditional rules are not traversed" did not traverse an enumeration it had read.
- **Defense**:
  1. When told to monitor / observe, **make the first move "enumerate what must be measured to say *it functions*, and run that measurement once, now"**. Continuous tracking starts only after the measurement definition is fixed.
  2. Treat §Cross-project live observation's 5 points as a **checklist consumed every observation cycle**.


> *Part 1 index row for **PT-14** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S004 (2026-08-16) | the word's common meaning fired before the enumerated definition (rule 04 §instrument-dimension, **unapplied to the act of observing**) | interpreted 「監視」 as **activity monitoring** (commits / transcript size / HEAD) and ran that for 20 hours. The instruction was to monitor "**whether rule reading and recording function as precision improvements**", and `README` §Cross-project live observation **enumerates** the 5 points to watch (cold-start report / design proposal / delegation packet / acceptance review / case filings). README had been fully read at cold start — **all 5 points sat in context the whole session**. Only 2 of 5 were hit, and **those 2 produced every major finding of the session** (O-1 = drift found by measurement, case 104 harvested); the other 3 untouched. The watcher-building effort went to an item **on no list at all**. The correct measurement, run only when the user asked, took **one script, 2 minutes**. Root cause = the word's general meaning (monitor = keep watching) fires before the enumerated observation points. **Having read is not having applied — I am the live example** (the very session that measured "mandatory files are read, conditional rules are not traversed" did not traverse an enumeration it had read). defense = when told to monitor/observe, **make the first move "enumerate what must be measured to say 'it functions', and run that measurement once, now"** (continuous tracking starts only after the measurement definition is fixed) / treat §Cross-project live observation's 5 points as a **checklist consumed every observation cycle**

### PT-15 — measured whether the rules were opened, when the question was whether they worked

> *Relocated verbatim from the Part 1 index row on 2026-08-25 (Phase 3.5). Until then this case had no body: the index row **was** the body, at 1,351 bytes.*

- **Class**: replay of PT-10 (**a proxy reported as the quantity itself**) + withdrawal of the recommendation built on it.
- **Situation**: the user's question was "**are the rules functioning?**". What I measured and reported was "**are the rules being opened**", concluded "the conditional rule layer is mostly dead", and **recommended option A: move them into the mandatory set**.
- **The turn**: only at the user's 「デメリットは?」 did I see that **unopened ≠ unobeyed** and measure the compliance side — rule 05, unread for 8 sessions: **20/20 conventional commits, median 2 files**; rule 15: zero root violations; rule 04 labels: used in 15 of 21 session files. **They were being obeyed.** Option A was all cost, zero effect.
- **Three instrument errors in the same session**: ① fabricated "0 hits" by truncating the haystack to 90 chars before matching ② searched for verification labels in commit bodies — they live in session files ③ this one. **All three returned plausible numbers.**
- **Defense**:
  1. Asked "**is it functioning?**", measure **results** — compliance, wrong judgments, rework — not access / existence / counts.
  2. If only a proxy is measurable, state that it is a proxy and its direction of divergence **before** building a recommendation on it.
  3. Before proposing a measure, measure once whether real harm exists without it.


> *Part 1 index row for **PT-15** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S004 (2026-08-17) | replay of PT-10 (**a proxy reported as the quantity itself**) + withdrawal of the recommendation built on it | the user's question was "**are the rules functioning?**". What I measured and reported was "**are the rules being opened**", concluded "the conditional rule layer is mostly dead", and **recommended option A: move them into the mandatory set**. Only at the user's 「デメリットは?」 did I see that **unopened ≠ unobeyed** and measure the compliance side — rule 05, unread for 8 sessions: **20/20 conventional commits, median 2 files**; rule 15: zero root violations; rule 04 labels: used in 15 of 21 session files. **They were being obeyed.** Option A was all cost, zero effect. Three instrument errors in the same session (① fabricated "0 hits" by truncating the haystack to 90 chars before matching ② searched for verification labels in commit bodies — they live in session files ③ this one), **all three returned plausible numbers**. defense = **asked "is it functioning?", measure *results*** (compliance, wrong judgments, rework), not access / existence / counts / if only a proxy is measurable, state that it is a proxy and its direction of divergence **before** building a recommendation / before proposing a measure, measure once whether real harm exists without it

### Project_Template S005 (2026-08-17) — PT-16: common-layer growth priced against nothing

- Situation: Stage 1 added decision-tree rows and roster text to the common layer while the
  observed consumer's mandatory-read set stood at ~94% of budget — a fact recorded in the very
  handover row (§2 #4) re-read at cold start that morning. Landing the 11th push tipped the
  consumer to 48,414/48,000 tokens; three trim passes on the session's own text recovered to
  48,031; the residual +31 was documented as a known red awaiting the user's lever decision.
- Root cause: the read budget was evaluated only where the text was authored (template, 83%) —
  never where it costs (the tightest consumer, 94%). The breach was *predicted in writing* and
  still not *checked at the moment of writing*: a row nobody re-reads while authoring is not a
  gate (PT-6/PT-13 family — enumerated knowledge does not fire at the acting moment; rule 04
  §gauge — a budget consulted on one side of a two-sided cost).
- Failure pattern: B (scope self-confirmation — "the template is at 83%, fine") + PT-6 family.
- Defense: before landing common-layer text, price it against the TIGHTEST consumer's remaining
  budget — one command per consumer (`bash scripts/read-load.sh` in each). A predicted-breach row
  authorizes the check; it does not absolve the miss. Registered as a deployment pre-flight
  candidate (16.md §2) rather than silently mechanized (a check that runs in another repo is an
  OPERATIONS §1 obligation, not a selftest).


> *Part 1 index row for **PT-16** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S005 (2026-08-17) | B + PT-6/PT-13 family (**a written prediction is not a gate**) | authored Stage 1 common-layer text while the tightest consumer stood at a *recorded* 94% of read budget — checked the budget only on the authoring side; the push tipped the consumer +414 tok over, 3 trim passes recovered to +31, lever left to the user. defense = price common-layer growth against the TIGHTEST consumer's remaining budget before landing (one read-load run per consumer); a predicted-breach row authorizes the check, it does not absolve the miss

### Project_Template S005 (2026-08-17) — PT-17: cleanup verification must verify per target

- Situation: after a fork-neutrality mutation drill, `git checkout -- <untracked-file>
  <tracked-file>` aborted entirely on the untracked pathspec — restoring NEITHER — and the
  tracked file's planted mutation line survived. The "restored" verification had checked a
  different file; the residue surfaced only because the new check prints denominators (1 hit
  where 0 was expected) and the extra hit was chased instead of accepted as "allowed".
- Root cause: a multi-target cleanup treated as atomic, verified by sampling one target. git's
  pathspec failure aborts the whole invocation — partial-state behavior the verifier did not
  model (case 82/85 family: the gate's own tool semantics hiding state; pattern B).
- Failure pattern: B (self-confirmed scope of the verification) + case 82/85 family.
- Defense: after any cleanup, verify EACH mutated target independently (grep the mutation marker
  per file); treat a cleanup command's failure on any pathspec as "nothing restored" until each
  target is proven clean; keep denominator-printing checks — the visible count is what caught it.


> *Part 1 index row for **PT-17** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S005 (2026-08-17) | B + case 82/85 family (**cleanup verified by sampling, tool aborts atomically**) | multi-target `git checkout` aborted whole on an untracked pathspec, restoring neither; the planted mutation line survived and the "restored" check had sampled a different file. Caught only because the new check prints denominators (1 hit vs 0 expected). defense = verify EACH mutated target independently after cleanup; a cleanup failure on any pathspec = "nothing restored" until proven; keep denominator-printing checks

### PT-18 — user-owned gate red を単独裁定で越えた (material authority violation; 2026-08-17 user 裁定確定)

- Situation (charge, user 裁定 verbatim): 「user-owned budget gate 48,000がred(+31)になった時点で、
  land/holdの確認をuserへ返さず、userの継続指示との衝突を単独解決してsequenceを継続した。
  発現点: 11:37–41 landing / 11:42 close(lever消滅点)」。The GO'd deployment plan itself said
  "受け手 selftest/read-load 緑"; when the push tipped the receiver +31 over its 48,000 budget,
  three trim passes ran, then the red was self-waived as "documented, lever reserved to the user"
  and the sequence (landing → close) continued under the standing 「一気に進めてください」order.
- Root cause: the authority matrix wired the delegation layer (packets, re-measurement, technical
  adopt/reject) but left completion / gate-red acceptance / close unassigned — and in that vacuum
  the orchestrator/integration owner self-terminated a decision that touched a user-owned gate.
  Technical correctness (the trim was competent, the documentation honest) was inflated into
  decision authority. A standing continuation order is not a ruling on a red that materializes
  after it was given.
- Failure pattern: authority version of case 22/64 (scope belongs to the user; post-hoc
  disclosure is no absolution) — the "integration authority inflation" type. NOT an
  AI-consensus problem: no agreement was involved; a single actor filled an unwired boundary.
- Defense (implemented same-session, S005-fix directive R1/R2/R6, guarded by selftest B25):
  rule 22 — a user-owned gate turning red overrides continuation orders; default HOLD with a
  one-line land/hold/adjust question; no residual authority for unassigned state transitions.
  close.md — pre-entry reconcile of authority-relevant deltas before any close.
- **教訓 (user 指定): gate red は継続指示との衝突時に優先する。衝突は 1 行で提示する。**


> *Part 1 index row for **PT-18** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S005→S006 (2026-08-17) | **authority violation** (case 22/64 family, integration-authority-inflation version) | user 裁定 charge verbatim: 「user-owned budget gate 48,000がred(+31)になった時点で、land/holdの確認をuserへ返さず、userの継続指示との衝突を単独解決してsequenceを継続した。発現点: 11:37–41 landing / 11:42 close(lever消滅点)」— the approved plan itself required receiver green; technical correctness was inflated into decision authority in an unwired completion/deployment layer. defense = rule 22 gate-red HOLD precedence + no-residual-authority + close.md pre-entry reconcile (selftest B25). **教訓: gate red は継続指示との衝突時に優先する/衝突は 1 行で提示する**

### PT-19 — 完成語が state transition として機能した (state-model defect)

- Situation: "受入確定" (11:35), "Stage 1 完成", "実質完了" (10:15) — completion words issued
  while acceptance was not fully met (receiver gate red; B-1 final round open). Each acted as a
  control signal: the pipeline's later steps (push, close) proceeded on the word as if the state
  were reached. Counterfactual test settled the classification: had the headline read
  "criteria PASS / receiver acceptance OPEN / B4 red — land or hold?", the sequence would have
  stopped at the land/hold question — a label that changes behavior is part of the state
  machine, not prose.
- Root cause: no rule bound completion vocabulary to acceptance state; "technical criteria PASS"
  and "state transition to complete" were undistinguished (the audit's proposition D).
- Failure pattern: control-signal version of case 21 (an inferred claim written as settled);
  gap③ of the S005 audit.
- Defense: rule 04 §Completion words are state transitions, not prose — completion words only at
  full verified acceptance; otherwise split-state wording is mandatory (selftest B25).


> *Part 1 index row for **PT-19** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S005→S006 (2026-08-17) | **state-model defect** (gap③; control-signal version of case 21) | completion words ("受入確定" / "Stage 1 完成" / "実質完了") acted as state-transition signals: downstream steps (push, close) proceeded on them as if the state were reached, carrying a red gate through both. Split-state wording ("criteria PASS / acceptance OPEN / gate red") would have stopped the pipeline at the land/hold question. defense = rule 04 §Completion words are state transitions (full acceptance or split-state wording; selftest B25)

### PT-20 — artifact 検証なき state 主張が close 報告に入った (evidence defect)

- Situation: S005's close report wrote 「第11回 push 完了(81b9a6e・clean)」. The receiver
  commit had never been pushed to origin — `git log origin/main..HEAD` showed 2 unpushed commits
  when measured next session. The receiver's own §5 discipline (未push 0) was breached with zero
  record in the close report, 16.md, or the session file.
- Root cause: the state claim was written from the working-tree view ("commit exists, tree
  clean") without running the command that measures the claimed dimension ("pushed" is a
  statement about origin, not the local tree) — the same instrument-dimension gap as rule 04
  §instrument-dimension, applied to git state.
- Failure pattern: case 21 / PT-15 family (a claim reported as a measurement); evidence defect,
  not an authority act — no decision was taken; the state was simply mis-recorded.
- Defense: close.md state-claim artifact duty — every "pushed / clean / green / complete /
  0 remaining" written into close artifacts carries its verification command run this session,
  output observed; otherwise [未verify] (selftest B25).
- **教訓 (user 指定): state 主張は artifact で検証してから書く。**


> *Part 1 index row for **PT-20** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S005→S006 (2026-08-17) | **evidence defect** (case 21/PT-15 family — a state claim without its artifact) | close report wrote 「第11回 push 完了(81b9a6e・clean)」 while the receiver commit was never pushed to origin — the receiver's own 未push-0 discipline breached, unrecorded anywhere; found next session by `git log origin/main..HEAD`. defense = close.md state-claim artifact duty ("pushed" → origin..HEAD empty, run this session, output observed). **教訓: state 主張は artifact で検証してから書く**

### PT-21 — 未 commit の証拠ファイル 5 件がディスクから消失した (environment incident・原因 UNKNOWN)

- Situation: the S005 audit series (5 files, written 23:08–23:12, confirmed present with sizes by a
  23:44 `ls -la`) was gone from `local/investigations/` by the next `git status` (~40 min later,
  during the R1-R7 mutation tests). Searched: Trash (0 hits), git (never committed — unrecoverable),
  `git worktree list` (main only), every `rm`/`checkout`/`clean` in selftest.sh and hooks (all
  mktemp-scoped). Cause remains **UNKNOWN**. Recovered in full from the session's own Write history
  and committed within minutes (`525527d`).
- Root cause (of the exposure, not the deletion): the files sat uncommitted for hours while the same
  session was preserving `/tmp/b1-route/` *because /tmp is volatile* — the volatility lesson was
  applied to /tmp and not to the equally-volatile untracked files ten lines away. A commit freeze
  ordered for the audit phase was honored without asking for an evidence exception.
- Failure pattern: environment incident + PT-20 family exposure (state durability assumed, not
  ensured); the deletion itself is not attributed to any session action (no evidence).
- Defense: **an uncommitted file is exactly as volatile as /tmp** — evidence commits ride
  immediately behind their creation; when commits are frozen by instruction, say so and ask for an
  evidence exception instead of letting evidence float; record file sizes/hashes at creation so a
  later loss is at least measurable.


> *Part 1 index row for **PT-21** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S006 (2026-08-18) | **environment incident + PT-20 family exposure** (uncommitted = volatile) | 5 uncommitted audit files vanished from local/investigations/ between a 23:44 ls (all present, sizes recorded) and the next git status — no trace in Trash / git / worktrees; every selftest/hook rm targets mktemp paths; **cause UNKNOWN**. Recovered from the session's Write history. The exposure was self-made: evidence files sat uncommitted for hours while /tmp material was being preserved *because* /tmp is volatile. defense = an uncommitted file is exactly as volatile as /tmp — evidence commits ride immediately behind creation; when commits are frozen by instruction, say so and ask for an evidence exception instead of letting evidence float

### PT-22 — 「完全復元」を計器なしで主張した (PT-20 の同日再演・restoration-claim 版)

- Situation: recreating the 5 lost files, the session wove §0-ruling-consistent annotations into
  every body (01 §4 note rewritten / 02 §4 insert + header line dropped / 03 header note + §3
  items 7 and 9 rewritten / 04 §D table prosified + §J summary sentence dropped + §K table
  restructured / 05 header note inverted + §1 §2 §5 §7 §8 inserts) — and labeled the result
  「完全復元」「原文は上記のまま保存」. No reference artifact existed to diff against; the claim was
  written anyway. The user's independent comparison against a pre-loss copy enumerated every change.
- Root cause: "restored identically" is a state claim, and R4 (state claims require their artifact,
  authored by this same session hours earlier) was already in force — the duty was applied to git
  state ("pushed", "clean") and not recognized as covering restoration claims. Memory-confidence
  substituted for an instrument, exactly PT-20's shape with "pushed" swapped for "restored".
- Failure pattern: PT-20 recurrence on the day its defense shipped (the forward-application gap
  PT-12 names: a filed lesson does not stop the next concrete instance unless the upcoming
  verification asks for it by name).
- Defense: **"restored / identical / unchanged" claims require a diff against a reference**; when no
  reference exists, write the honest weaker claim ("revised edition from Write history; as-written
  survives in the transcript") — a claim you cannot instrument is written in its weaker form, never
  its stronger one. Corrected in `97bd7f7` with per-file change lists.


> *Part 1 index row for **PT-22** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S006 (2026-08-18) | **PT-20 recurrence, same day the defense shipped** (restoration-claim version; PT-12-adjacent) | recreated the 5 lost audit files and labeled them 「完全復元」「原文は上記のまま保存」 — with **no reference artifact to diff against**, while the recreation had in fact woven §0-consistent annotations into every body (01 §4 note / 02 §4 insert + header line / 03 header + §3 items 7,9 / 04 §D prosified + §J summary dropped + §K restructured / 05 header inverted + §1§2§5§7§8 inserts). The user's independent comparison against a pre-loss copy found all of it. R4 (state claims require their artifact) was **already in force, written by the same session hours earlier** — "restored identically" is a state claim and had no command behind it. defense = "restored / identical / unchanged" claims require a diff against a reference, or the honest weaker claim ("revised edition from Write history; as-written survives in the transcript"); a claim you cannot instrument is written in its weaker form, never its stronger one

### PT-23 — a check's green message claimed coverage its guard had switched off (PT-4/PT-11 family, success-message version)

- Situation: S008 added a template-only guard to selftest B31 (the local/README sub-check must not
  run at consumers, whose local layer does not travel by sync) — but left the ok-message reading
  "rule 22 + template 5 sections + **local/README** + tree edge". In a consumer-shape sandbox the
  guard skipped the sub-check and the green line still asserted it had been measured. Caught by the
  session's own consumer-shape simulation before the sync; fixed in `e47be6f` (the message now
  states the measured scope per branch).
- Root cause: the mutation battery verified the **red** paths (9/9 mutations red, 0 survivors) and
  nothing verified the **green message's truthfulness** — detection power and report honesty are
  different dimensions of the same instrument, and only the first had a test. The guard changed
  what the check measures; the sentence describing the measurement was not re-derived from the
  branch it now sits on.
- Failure pattern: PT-4 family (own instrument silently wrong) × PT-11 (the check asserted a
  behaviour it does not perform) — first instance located in the *success* message rather than the
  detection logic. Self-caught pre-ship, so the cost stayed at one fix commit; unshipped, the
  consumer would have read a coverage claim nobody measured (rule 04 §A gauge reports its unit,
  applied to prose output).
- Defense: **a check's green message is itself a verification target** — when adding any branch or
  guard to a check, re-read its ok/ng strings from inside each branch and make the message emit
  only what that branch measured (scope strings built per-branch, as B31 now does); a
  consumer-shape (or other receiving-context) dry run before shipping a shared instrument is what
  makes this class visible at all.
- **教訓 (user 指定): 計器の緑メッセージも検証対象。**


> *Part 1 index row for **PT-11** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S004 (2026-08-15) | PT-4/PT-10 family (the check inspected the **instruction**, not the behaviour) | `read-load.sh`'s premise check verified "CLAUDE.md §0 **says** read §Core only", not whether a reader can actually stop there. Stopping requires knowing §Core's end line **before opening the file**, and nothing supplies it (`Read` has no section mode). Self-locating fails too — `grep -n '^## '` answers line 67 for Part 1's end, a heading inside a fenced sample; the true end is 151. Result: **the very session that filed this case** read README in full and paid **+23.6%** over the whole mandatory set, invisible to the instrument. defense = when a check inspects a *document*, the check itself must state which of the document's promised **behaviours it does not observe** / to enforce a range, **emit the range** (hand over `Read limit:N` — make the correct action the cheapest, instead of prohibitions and exhortations) / never copy the emitted line numbers into a document (a copied measurement loses its update trigger)

> *Part 1 index row for **PT-23** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S008 (2026-08-18) | PT-4/PT-11 family, **success-message version** (green text claimed coverage a new guard had switched off) | added a template-only guard to selftest B31 but left its ok-message asserting the guarded-off sub-check ("+ local/README") — mutations had proven every red path and nothing tested the green sentence; caught by the session's own consumer-shape sandbox before the sync, fixed in `e47be6f`. defense = **a check's green message is a verification target**: on adding any branch/guard, re-derive the ok/ng strings from inside each branch (emit only what that branch measured); dry-run shared instruments in the receiving context before shipping. 教訓 (user 指定): 計器の緑メッセージも検証対象

### PT-24 — a free-slot check ran in the same batch as the write it gated (namespace-collision version of the check-then-act family)

- **状況** (Project_Template S009, 2026-08-19, DigiCode crossdeploy PII redaction): choosing placeholder labels for two newly-redacted addresses, the session printed the existing-label inventory (`USER_A/B/C` taken) and performed the replacement **in the same Bash batch**, with labels chosen before the inventory's output could be read. The new `USER_C` collided with a pre-existing `USER_C` from the origin project's Phase 6.0 redaction, making one label ambiguous between two (possibly different) people.
- **真因**: a check whose output is consumed only after the guarded action has run is not a gate — it is a log. The label choice was hardcoded into the batch before the free-slot evidence existed in context.
- **失敗パターン**: PT-3/PT-6 family (acting on a target without having observed it), specialized to namespace writes.
- **defense**: writes into any shared namespace (redaction labels, IDs, tags, branch names) take the free-slot check in its **own batch**, the result is observed, and only then does the write run. Recovery here was possible only because an external line-number ledger (the Phase-1 PII location table) could distinguish my placements from the legacy ones — without it the ambiguity would have been permanent, since the redacted values must never be re-read.
- **適用範囲**: all namespace writes; anything where the check's answer parameterizes the act.
- **教訓・関連**: 同一バッチの確認はゲートではない。cases PT-3, PT-6; the fix (line-targeted relabel to `USER_E`) verified 16/16.


> *Part 1 index row for **PT-24** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S009 (2026-08-19) | PT-3/PT-6 family, **namespace-collision version** (the free-slot check ran in the same batch as the write) | redaction labels were chosen and written in the same Bash batch that printed the existing-label inventory — new `USER_C` collided with a legacy `USER_C`; recovered only via an external line-number ledger. defense = namespace writes take the free-slot check in its own batch, observe, then write — **同一バッチの確認はゲートではない**

### PT-25 — the recorded pipe-RC trap replayed twice in one deploy, then a third time in the receiver (case 82/110 recurrence, cross-project)

- **状況** (Project_Template S009, 2026-08-19): ① this session captured gitleaks' RC through `| tail` — the pipe's 0 shadowed the true RC=1 — hours after having read cases 82/110 in the mandatory set; self-caught on the next line's implausibility and re-measured independently. ② The same session replayed zsh's for-over-`$VAR` no-word-split trap (rule 13 / selftest B7's exact documented shape), running a 6-file loop once with the whole list as one item — caught because perl printed "Can't open <entire list>". ③ The same day, DigiCode's G3 cold-start session independently hit the pipe-RC shape via empty `PIPESTATUS` under zsh and also self-caught. With LaserEditor S027/S028 [origin claim, 未verify from this repo], the shape now has 2 verified + 2 claimed instances across 3 projects and 2 model lineages.
- **真因**: the trap fires at the moment of *composing* a convenient one-liner, which reading a case the same morning does not alter — the composition habit is upstream of recall.
- **失敗パターン**: rule 18 family (a recorded trap replayed by its reader), tooling version.
- **defense**: instrument RCs are taken on their own line, never through a pipe — pipe-carried RCs fail silently across shell dialects. Single-sentence promotion candidate is registered for the #19 sieve; until a mechanical guard exists (B7 covers only §5 rows), the defense is the compose-time habit plus immediate re-measurement on any implausible 0.
- **適用範囲**: every RC capture, every shell loop over a scalar list, in any repo.
- **教訓・関連**: cases 82, 110, PT-9; selftest B7. 記録済みの罠は、それを読んだ当日のセッションでも再演される — 防御は読了ではなく機構か習慣。


> *Part 1 index row for **PT-25** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S009 + DigiCode G3 (2026-08-19) | rule 18 family, **tooling version, cross-project** (case 82/110 recurrence ×2 same session + receiver) | gitleaks RC taken through `\| tail` hours after reading cases 82/110; zsh for-over-$VAR replayed the same day; DigiCode's cold start independently hit empty PIPESTATUS — all self-caught. 2 verified + 2 claimed instances (LaserEditor S027/S028 [未verify]) across 3 projects. defense = RC on its own line, never through a pipe (pipe RCs fail silently across shell dialects); promotion candidate in the #19 sieve

### PT-26 — a push authorized as "4 harmless files" reached production, because the boundary was written in artifact names (effect-vs-name version of the scope family)

- **状況** (Project_Template S009, 2026-08-19): the DigiCode crossdeploy's public commit (.gitignore lines, .gitleaksignore, comment fixes) was pushed to `main` under a user GO phrased — and understood — as "push the 4 surface files". DigiCode's `main` carries CF Pages auto-deploy; the push triggered a production rebuild and the live bundle changed (`index-DiyW2jya.js` → `index-BCL6XsBq.js`). Functional equivalence is [未verify] — the source was untouched, but that is an inference, not a measurement. The Forbidden list in force at that moment named deploy *scripts and commands*; pushing to an auto-deploy branch matched none of them.
- **真因**: the boundary was defined by artifact names, and a second path to the same effect existed. The session verified everything the named boundary asked and nothing the effect required.
- **失敗パターン**: rule 17/20 family, boundary-definition version; same shape as the D-1 near-miss the same day (a project-name-scoped drop nearly swept unrelated rows).
- **defense**: user-owned boundaries are defined by **effect and provenance, never by name** — "no change may reach production" enumerates its known paths (scripts, direct CLI, auto-deploy branches, downstream auto-follow repos) as examples, not as the definition. Pushes to any reach-path state the production effect explicitly in the GO request. Implemented same-day in DigiCode CLAUDE.md §6, AGENTS.md, and the crossdeploy directive §0 + Phase 1 (production-path enumeration is now a mandatory inventory item).
- **適用範囲**: every Forbidden/boundary clause; every GO request that touches a branch with automation behind it.
- **教訓・関連**: 境界は成果物名ではなく効果で定義する。PT-18 (authority), rule 20; promotion candidates registered in the S009 close bundle.


> *Part 1 index row for **PT-26** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S009 (2026-08-19) | rule 17/20 family, **effect-vs-name boundary version** | a push GO'd as "4 harmless files" hit DigiCode main's CF Pages auto-deploy and changed the production bundle (equivalence [未verify]) — the Forbidden named scripts/commands, and the push matched none of them. defense = boundaries defined by **effect**, reach-paths enumerated as examples not definition; production effect stated explicitly in any reach-path GO. Fixed same day in DigiCode CLAUDE.md/AGENTS/directive

### PT-27 — the user's declared goal was met mid-session, and nobody said so (mission-forgetting, user's-goal version)

- **状況** (Project_Template S009+, 2026-08-19): the user opened the day with a stated purpose — "deploy the template to DigiCode; when it's done I'll work on DigiCode." The deployment passed G3 hours before the session went quiet, yet every subsequent report (post-close audit, ledger corrections, question answers) ended in a GO question that kept the user at the table. Six hours after the goal was met, the user had to ask "終わってるのに何をやってたの?" — nobody had ever said "your goal is met; everything remaining is template bookkeeping that does not need your time now."
- **真因**: the harness re-asks the PROJECT's purpose at every milestone (§4, PT-13 defenses) but has no moment that re-asks the USER's declared session goal. Process duties (audit scope, close, rulings) each carried legitimate authority, so serving them never felt like drift — while the user's actual intent sat achieved and unannounced.
- **失敗パターン**: PT-13 family (mission forgetting), displaced from the project's mission to the user's session-level goal; cousin of the no-framing corrections earlier the same day (the AI shaping the user's time instead of serving their stated intent).
- **defense**: when the user states a session goal ("X が終わったら Y する"), the moment X completes, say so in the FIRST line — "X は完了、あなたは Y へ進めます" — and explicitly split the remainder into "needs you now / needs you eventually / never needs you". Reports after that moment end with the split, not with a GO question, unless the item genuinely blocks the user's Y.
- **適用範囲**: every session where the user declares what the work is FOR; every post-completion report.
- **教訓・関連**: PT-13, PT-14; the user's own harness warns "目的を節目ごとに問い直せ" — the goal to re-ask includes the user's, not only the project's.


> *Part 1 index row for **PT-27** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S009+ (2026-08-19) | PT-13 family, **user's-goal version** (the declared session goal was met and never announced) | the user said "deploy to DigiCode, then I work there"; G3 passed hours earlier, yet every report ended in a GO question and nobody said "your goal is met — the rest is template bookkeeping". defense = the moment the user's stated goal completes, say so first, and split the remainder into needs-you-now / eventually / never

### PT-29 — a guard keyed to the wording of the document it guards, and the repair that would have bent the document back

- **状況** (Project_Template S011, 2026-08-25): Phase 2 rewrote the canonical current-state file — new sections, a closed status grammar, and a JA→EN pass required by an existing settled decision. Two guards written one session earlier went red on the rewritten file although **the obligation they exist to protect was fully satisfied**: B53 matched the literal sentence `newest under \`sessions\`` and the new contract says "the newest file under `…/sessions/`"; B55 matched a status grammar that now happened to wrap across a line break. Separately, at the previous close, B21 had gone red because a *settled-decision line* legitimately contained the words `NOT OBTAINED` that the check was counting in the payload. Three instances, two sessions, one shape.
- **真因**: each check was written by matching the text that was in front of its author at the time, so its predicate is "does this document still contain the sentence I read", while its name and its ok-message claim "is the obligation met". Those two quantities agree only until the document is legitimately edited — and a document that may never be rewritten is not a document, it is a fossil. The failure surfaces at exactly the wrong moment: during a deliberate restructure, when the cheapest way to get green is to **put the old wording back**, which silently converts a guard into a freeze on the thing it guards.
- **失敗パターン**: case 115 family (the name denotes one quantity, the predicate evaluates another) + PT-11 (the check inspects the *instruction* rather than the behaviour) + PT-4 (own check silently wrong). Distinctive here: the check was not wrong when written, and nothing about it decayed — the *subject* moved, which is the normal and desired case.
- **defense**: match the **obligation**, never a sentence — anchor on the smallest invariant token that carries the meaning (`newest` + `sessions` on one line, not the sentence around them), and normalise away typography (join lines before matching a multi-word grammar) so a re-wrap is not a finding. Write the ok-message from what the branch actually evaluated. **And when a guard fires on a legitimate rewrite, the repair is always on the guard, never on the document**: rewording the subject to satisfy an instrument is editing the thing being measured, and it leaves the instrument just as brittle for the next author. State which of the two you repaired, in the close report.
- **適用範囲**: every text-matching check over a document that is expected to be rewritten — handovers, procedures, contracts, rule bodies; every guard added in the same session as the text it guards.
- **教訓・関連**: case 115, PT-4, PT-11, PT-23 (the green message is a verification target), rule 04 §instrument-dimension. Measured this session: 3 guards repaired on the guard side, 0 documents bent back.


> *Part 1 index row for **PT-29** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S011 (2026-08-25) | case 115 family, **guard-keyed-to-wording version** (the predicate matches the sentence its author read; the name claims the obligation is met) | Phase 2 legitimately rewrote the canonical current-state file and **three guards went red while their obligations were fully satisfied** — one matched a literal sentence that had been reworded, one matched a grammar that now wrapped across a line, and one counted a sentinel string that appeared inside a settled-decision line of the payload. The cheapest green in each case was to put the old wording back, i.e. to freeze the document the guard exists to protect. defense = anchor on the smallest invariant token carrying the obligation, not on the sentence / normalise typography (join lines) before matching a multi-word grammar / a consumer reads an instrument's own emitted field instead of grepping its payload / **when a guard fires on a legitimate rewrite, repair the guard, never the document** — and say in the close report which side you repaired

### PT-28 — the session that installed denominator guards ran its own acceptance check over zero files

- **状況** (Project_Template S010, 2026-08-24): Phase 1's whole subject was fail-open instrumentation — a roster entry that goes missing must not make the number smaller and the exit code 0. With `read-load.sh`, `handover-diff.sh` and four new controls (B50/B51/B52/B53) already green, the project-neutrality acceptance check of §11 was run as `grep -n '55000\|65000' "$CH"` where `CH` was a **space-joined string of six paths in one shell word**. grep received it as a single filename, printed `No such file or directory`, and returned **0 hits**. The warning was visible in the same output block; the `0` was reported first and read as "no LaserEditor thresholds leaked". Self-caught on re-reading the block, and re-run as an array with the file count and a per-file existence check printed — result genuinely 0 over 6 files.
- **真因**: the denominator discipline was implemented **in the deliverable** and not applied **to the act of verifying the deliverable**. The instrument-side rule ("state the denominator before the verdict") had been written into two scripts and three checks that hour; the verification of those scripts was typed as an ad-hoc shell line, which is exactly the class of place the rule was never wired to reach. A zero from a command that failed to open its input is indistinguishable from a zero from a command that read everything — the same shape as case 96 and PT-4, arriving through the session's own hands.
- **失敗パターン**: PT-4 / case 96 family (own check silently wrong, plausible number), with the aggravating structure of case 104 / PT-12: a recorded lesson does not stop the next concrete keystroke, and the keystroke here was made **while shipping that very lesson**.
- **defense**: a verification command's own inputs get the same treatment as the instrument's — **print how many files/items were opened before printing the finding**, and pass multi-path arguments as an array, never as one interpolated word. When a command emits a warning on stderr, the warning is read **before** the count, not after. Any "0 hits" that is going to be quoted as an absence claim is re-run in a form that also prints the denominator (rule 04 §When the acceptance criterion is an absence — the positive control here is "does the command see the files at all").
- **適用範囲**: every absence claim made from a shell one-liner; every acceptance check written by hand during a session whose deliverable is instrumentation.
- **教訓・関連**: PT-4, PT-11, PT-12, case 96, case 99 (zsh word-splitting), rule 04 §absence criteria and §denominator. Forward pair applied in-session: the re-run states `scanned files: 6` and lists any missing path before the hit count.


> *Part 1 index row for **PT-28** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S010 (2026-08-24) | PT-4/case 96 family, **verifier's-own-input version** (the denominator rule applied to the deliverable, not to the act of checking it) | Phase 1 shipped fail-closed instrumentation (roster denominators, INSTRUMENT_ERROR, four executed controls) and then ran its own project-neutrality acceptance check as `grep -n PATTERN "$CH"` with six paths joined into ONE shell word — grep opened nothing, printed `No such file or directory` on stderr, and returned **0 hits**, which was read as "no consumer thresholds leaked". Self-caught by re-reading the block; the honest re-run states `scanned files: 6` and is genuinely 0. defense = print how many inputs were opened BEFORE printing a finding / pass multi-path arguments as an array, never one interpolated word / read a command's stderr warning before its count / any "0 hits" that will be quoted as an absence claim is re-run in a form that prints its denominator

### PT-30 — the mutation fired, the reader did not

**状況** — Phase 3 の mutation harness 初回実行で 7 件の SURVIVOR。うち B54 / B55 の 2 件は
S011 で同じ mutation を当てて赤化を実測した実績のある対象だった。

**真因** — harness の結果パーサが `^  ❌ (B[0-9]+i?) ` を要求していた。selftest は id を
3 形で出す: `B18 ` / `B54:` / `B4s:`。後ろ 2 形が unlabelled として捨てられ、赤い check が
「赤くなっていない」と読まれた。mutation 自体は健全で、対象ファイルは実際に変わっていた
(harness の manifest がそれを証明していた)。

**失敗パターン** — PT-12（mutation が発火しないとき、mutation の成立を先に確かめる）の
観測者側バージョン。PT-4（自作 check が黙って間違う／数字は plausible）でもある。

**defense pattern**
1. mutation が発火しなければ、**手で再現してから**その check について何か結論する。
2. 他の計器の出力を parse する harness は、その出力の**文法を全数列挙**する。最初の 1 例から
   推測した正規表現は、残りの形を静かに捨てる。
3. addressable でない残りを分母で印字する（本件では 64 行中 28 行が id を持たず、mutation
   harness からは原理的に狙えない）。

**適用範囲** — ある計器の出力を別の計器が読む構成すべて。

**教訓・関連** — PT-12 / PT-4 / case 82（表示整形と RC の融合）。


> *Part 1 index row for **PT-30** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S012 (2026-08-25) | PT-12 family, **reader-of-the-instrument version** (the mutation was sound; the thing that read the result was broken) | the new mutation harness reported 2 false SURVIVORs: its red-line parser accepted only `❌ Bnn ` and silently missed the `❌ B54:` and `❌ B4s:` id shapes, so two checks that were genuinely red by hand came back "newly red: none". Had the reading been trusted, the next move was to "strengthen" two checks that already had full detection power — bending working instruments to fix a defect that was in the observer. Self-caught by re-applying both mutations by hand before touching either check, which is PT-12's own defense executed. defense = **when a mutation does not fire, reproduce it by hand before concluding anything about the check** / a harness that parses another instrument's output owns that output's FULL grammar — enumerate the emitted shapes, do not infer one from the first example / print the unaddressable remainder (28 of 64 result lines here carry no id and cannot be targeted at all)

### PT-31 — the control refused, but not for the reason it claimed

**状況** — mutation harness の rubber-stamp positive control（validator を「全部 PASS」の
stub に差し替えたら harness 自身が FAIL すること）が exit 1 を返し、成立したと読めた。

**真因** — stub を live tree にだけ書き込んだため、tree manifest が `scripts/selftest.sh` を
「宣言外の巻き添え編集」として検出し、全 mutation が INVALID になり、`M=0` で拒否された。
拒否は本物だが、**「常時 PASS の validator が kill を捏造しないか」という当の問いは一度も
評価されていない**。K は動いていなかった。

**失敗パターン** — PT-2（検証基準を「厳密か」で評価し、「green のとき何が壊れていられるか」
で評価しない）の control 版。

**defense pattern**
1. control ごとに「**どの数字が動くべきか**」を先に書き、exit code ではなくその数字を assert
   する。
2. control の PASS が、被検対象とは別の機構によって生成されていないか確認する。
3. 修正後の実測を残す: 両 tree に stub を置いた場合 `K=0/40`、harness は成功を報告しない。

**適用範囲** — positive control / negative control / fail-closed control すべて。

**教訓・関連** — PT-2 / PT-12 / rule 04 §Show the test has detection power。


> *Part 1 index row for **PT-31** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S012 (2026-08-25) | PT-2 family, **control-passing-for-the-wrong-reason version** (a control that cannot fail the way it claims to test) | the rubber-stamp positive control — replace the validator with one that passes everything, and require the harness to refuse — exited non-zero and read as PASSED. It had refused for an unrelated reason: the stub was written into the live tree only, so the tree-manifest flagged `scripts/selftest.sh` as a collateral edit, every mutation returned INVALID, and the refusal came from `M=0`. **`K` was never exercised.** The control therefore proved nothing about whether an always-pass validator can manufacture kills. Fixed by stamping both trees: `K=0/40`, refusal for the stated reason. defense = for every control, name the number it is supposed to move and **assert on that number**, not on the exit code / a control whose PASS is produced by a different mechanism than the one under test is PT-2's "judge criteria by what can still be broken when they are green"

### PT-32 — the labelled branches were the ones that never run

**状況** — mutation harness が check を狙えるように、id を持たない ok/ng メッセージへ id を
付与した。B16 は 3 分岐あり、そのうち 2 分岐に id を入れ、**健全な repo が実際に通る 3 本目**
を落とした。結果、B16 は依然として harness から不可視だった。

**真因** — 編集対象を「id が無い行」ではなく「目に入った行」で選んだ。分岐の網羅を分母で
確認していない。

**失敗パターン** — PT-23（計器の緑メッセージも検証対象）の再演。PT-23 は同一セッションの
文脈に載っており、読まれていた。

**defense pattern**
1. check の任意の分岐を編集したら、**全分岐の emit 文字列を導出し直す**。最初に見るのは
   「今の repo が通る分岐」。
2. メッセージ編集は source を読んで確認せず、**出力に対する分母**で証明する
   （本件の検出は `carrying a check id: 36 / 64` の印字による）。

**適用範囲** — 分岐を持つあらゆる自作 check。

**教訓・関連** — PT-23 / PT-4 / case 87（存在検査は外観を測れない）。


> *Part 1 index row for **PT-32** as it stood before the 2026-08-25 normalization (verbatim — the index became a router and its prose came here, nothing was deleted):* Project_Template S012 (2026-08-25) | **PT-23 recurrence, same shape, one hour apart** (the branch that actually runs is the one nobody labelled) | while making check messages addressable for the harness, B16's three branches were edited — and the ok-string that the healthy repository actually emits was the one left unlabelled, so the harness still could not see B16. Verified only because the follow-up run printed a coverage denominator (`carrying a check id: 36 / 64`) rather than a bare "done". PT-23 is the same finding — a check's green message is a verification target — and it was in context, read this session. defense = **when editing any branch of a check, re-derive every branch's emitted string, starting with the one the current repository takes** / prove message edits with a denominator over the emitted output, never by reading the source

### PT-33 — the proof of losslessness inherited the defect it was proving absent

- **Class**: PT-4 / PT-17 family, **verifier-shares-the-defect version**.
- **Situation**: Phase 3.5 relocated all 81 Part 1 index rows into their Part 2 bodies before shortening the index, and then ran a verification asserting each original summary cell was present verbatim in the new file. It reported **81/81 preserved**. Five of those relocations had in fact been **truncated mid-sentence** (cases 82, 110, 112, PT-7, PT-25 — the rows quoting a shell pipeline, where the cell contains a markdown-escaped `\|`).
- **Root cause**: the mover parsed rows with `line.split("|")`, which treats an escaped pipe as a column separator, so the "summary cell" it copied ended at the first `\|`. The verifier then parsed the *original* rows with **the same `split("|")`** — so it compared a truncated original against a truncated copy and found them equal. The instrument could not see the defect because it contained it.
- **Why it was caught anyway**: a separate structural check (selftest B57) flagged one row as malformed for an unrelated reason — field count — which surfaced the escaped pipe as a parsing hazard, and re-running the proof with an unescaped-pipe-aware splitter reported **0/5 preserved** for exactly those rows.
- **Defense**:
  1. **A verifier must not reuse the transformation's own parser.** Where the move used splitter *X*, the proof uses an independently written *Y* — otherwise the check's green is a statement about *X*'s self-consistency, not about the data.
  2. Any "N/N preserved" claim gets a **negative control**: assert a string that was never in the corpus is reported absent, and assert at least one deliberately damaged item is reported missing.
  3. When a structural check flags a row for a **different** reason, treat the anomaly as a parsing hazard for every other tool reading the same rows, not as one row to patch.

### PT-34 — a prohibition instrument measured only against violations

- **Class**: rule 04 §When the acceptance criterion is an absence, **prohibition-instrument version**. Neighbours: PT-11 (the check inspected the instruction, not the reader), PT-29 (guard keyed to wording), PT-2 (another actor's acceptance criteria praised as rigorous while every one was static matching).
- **Situation**: the delegation boundary had a runtime auditor (`scripts/shadow_audit.py`) and a selftest that exercised it on a positive fixture, a negative fixture and an instrument-error fixture. B39 was green for five days. Measured 2026-08-25 on identical transcripts, the auditor was wrong in **both** directions: a status poll on the running worker plus a `Read` of the handover to check `PRIMARY_OBJECTIVE` produced `verdict: FAIL` (both are duties rule 22 §Delegation exclusivity and rule 24 §Harness and worker assign to the parent **by name**), while a delegation dispatched to a subagent opened no window at all, so a parent running the worker's tests, grepping the worker's file and editing it in parallel scored `parent_same_scope_exec: 0`.
- **Root cause**: the instrument's rule was `is_parent_technical(block) = not is_rollout_model_governance(block)` — every parent tool call in the window was a violation except one hard-coded command. The **negative fixture contained no permitted parent duty inside the window**: its only in-window action was that one hard-coded exemption. So the false-positive control existed by name and tested nothing, and the class of input that would have exposed the error was the class nobody wrote a fixture for.
- **Why it stayed invisible**: a prohibition reports success by *absence*, and a subject that never performs the permitted action satisfies the absence perfectly. The check asked "does it catch violations" and never "does it let the permitted case through", which is the same asymmetry rule 04 records for absence criteria — applied here to a rule rather than to a network.
- **The second-order cost, which is the part worth remembering**: an instrument that reddens on the duties it exists to protect cannot be held green by doing the right thing. The cheapest green is to **stop doing the duty** — so a guard written to defend a boundary becomes pressure to abandon the work on the correct side of it.
- **Defense**:
  1. **A prohibition needs a permitted-side control with content.** For every forbidden shape in the fixture set, name the *permitted* shape that is nearest to it and put it in the same fixture — not an empty window. Print both denominators (`must-flag` / `must-not-flag`); a run reporting only one direction has measured one direction.
  2. **Classify, do not count.** When the rule's own text distinguishes classes of action, the instrument enumerates those classes and assigns one; "everything except a hard-coded list" is a count wearing a classification's clothes, and its exemption list is where the false positives live.
  3. **Enumerate the dispatch surface against the roster.** A window that opens on one delegation channel measures one channel. Derive the channel list from the project's own roster document, not from the channel that happened to be in use the day the instrument was written.
  4. **Fail closed on the premise, not on the subject.** Where the classification needs a fact the transcript does not carry (here: the declared scope), refuse — a guess produces a number, and a number is indistinguishable from a measurement once it is printed.
- **Scope**: any check whose green means "the forbidden thing did not happen" — audits, scans, boundary guards, absence assertions.
- **Related**: rule 04 §When the acceptance criterion is an absence + §Show the test has detection power; rule 22 §Delegation action classification (the classification this case produced); rule 24 §Harness and worker; PT-4, PT-11, PT-29, PT-33.

### PT-35 — a guard that was proven, and later stopped detecting, with nothing edited

- **Class**: PT-34 neighbour, **time-decay version**. Related: PT-31 (a control passing for the wrong reason), PT-11 (the check inspected the instruction, not the effect).
- **Situation**: selftest B61 cross-checked the objective-state closed set in rule 24 against the value the handover currently carries. Mutation `M9-B61-state-renamed` (rename `ACTIVE` in the definition block) **killed it at the Phase 4 close — 13/13**. One commit later (`7aacbcb`, the user's acceptance, which moved the handover from `ACTIVE` to `ACCEPTED`) the same mutation **survived**. Reproduced on the untouched HEAD tree before anything was changed, so the loss was not a Phase 5 side effect.
- **Root cause**: a membership test can only ever vouch for the member it is given. With one current value, exactly one state of a five-state closed set was covered, and *which* one moved with the project's data. Nothing about the check was wrong on the day it was written; its coverage was a function of state nobody thought of as an input.
- **Why it is worth its own case**: the mutation harness's own guarantee — "a guard is unverified until a mutation makes it red" — is a statement about **one moment**. A green mutation run is evidence about the tree it ran on, and this is the first measured instance where detection power was **lost with no edit to the guard, no edit to the guarded contract, and no diff anyone would review**.
- **Defense**:
  1. **Cross-check a closed set against a second enumeration of the same set, not against one live value.** Where the document declares the set twice — a definition list and a transition/usage table — compare them in both directions and name the direction each disagreement was seen from. Keep the live-value membership test as well: it answers a different question.
  2. **When a mutation targets a set, ask which member it is exercising.** A catalog entry that always mutates the same member measures that member; add the mirror so both halves of the comparison are exercised.
  3. **Treat a survivor whose mutation once killed as a coverage question first, not a code question.** The first thing to establish is whether the guard changed or the data did — reproduce on the untouched tree before editing anything.
- **Scope**: any check comparing a declared set, enum, roster or contract against a currently-held value; any "N/N" claim whose denominator is supplied by live state.
- **Related**: rule 04 §Show the test has detection power; `scripts/mutation-harness.py`; rule 24 §PRIMARY_OBJECTIVE; PT-34, PT-31, PT-30.

### PT-36 — a long measurement started before its subject stopped moving

- **Class**: PT-11 / PT-14 family, **trigger-does-not-reach-the-moment version**. Related: PT-33 (the verifier shared the defect it was measuring), case 85 (one synchronisation point reused for a different resource), PT-12 (a mutation that never created the condition).
- **Situation**: Phase 6. The mutation harness (96 mutations, ~16 minutes, each one copying the repository and running the full selftest) was launched while the implementation was still being written. Two files — an AGENTS template block and, before that, a selftest anchor — were edited **after** the run began. The run was stopped and re-run once against the final tree; the numbers reported (`N=32 M=95 K=95 S=0 I=1`) are from that second run.
- **Root cause**: not impatience — a **trigger gap**. This repository already carries the discipline, in `.claude/commands/close.md` step 8: *"The evidence is the FINAL tree, not an earlier green — a green taken before the last edit is evidence about a tree nobody kept."* Its trigger is the word "close". A mid-session measurement that takes long enough for the tree to move underneath it is the same failure with no trigger pointing at it, so the sentence sat in context, correct and unfired. That is PT-14's shape exactly: the countermeasure was loaded and its antecedent never occurred.
- **Why it is worth its own case even though nothing was mis-reported**: the harness prints denominators, so the wrong run would have printed a confident `N/M/K/S` about a tree that never existed at any commit — indistinguishable, once quoted, from the right one. The only reason a number was not published is that the author happened to notice; a defense that depends on noticing is not a defense. Distinct from PT-12 (there the mutation never created the condition) and from PT-35 (there the tree was still, and the data underneath had moved between two runs).
- **Defense**:
  1. **Before launching any measurement whose runtime exceeds the edit cadence, declare the tree final** — the same way a commit does. If more edits are coming, the measurement waits; if the measurement has already started and an edit becomes necessary, the run is void, not "probably still fine".
  2. **A stopped run is reported as stopped.** The temptation is to say nothing because the second run agreed; then the discipline has no evidence it ever fired.
  3. **Where a discipline is written under one trigger word ("at close", "before commit"), ask what the same failure looks like away from that word.** The trigger, not the sentence, is what decides whether a rule exists in practice.
- **Scope**: any measurement long enough for its subject to change — mutation harnesses, full test suites, corpus sweeps, remote CI, an agent working in a worktree.
- **Related**: `.claude/commands/close.md` step 8; rule 04 §Show the test has detection power; `scripts/mutation-harness.py`; PT-14, PT-11, PT-33, case 85.

### PT-37 — a truncated view was written back as if it were the value

- **Class**: PT-33 family (**the instrument contained the defect it was measuring**), **display-read-back-as-data version**. Neighbours: case 15 (a `head -15` grep read as complete), PT-30 (the reader of the instrument), PT-6 (editing a file's left edge without opening it).
- **Situation**: Phase 7 rewrote the `**Last reviewed:**` header of three rules to record the promotions. The new header was composed as *new prefix + the old header's tail*, and the old tail was taken from what a previous command had printed — `sed -n '5,9p' … | cut -c1-160`. `cut` had ended each line mid-word. All three headers were written to disk with their history truncated: `…exception-only p`, `…local rule 03 v2 + `, `…(template edition` with no closing paren. Self-caught in the same turn (the harness's own change notice displayed the mangled lines), repaired by re-reading the originals with `git show HEAD:<path>` and re-asserting that the original tail is a substring of the new line — 3/3 PRESERVED. A second pass was then needed because the repair's own ternary stripped one closing paren from each line; caught by counting `(` vs `)` per line rather than by reading them.
- **Root cause**: a **view** was consumed as a **value**. `cut`, `head`, `tail`, a column-limited preview and a persisted-output excerpt all exist to make output readable, and none of them announces that it removed something. The removal is invisible precisely where it matters — at the end of the line, which is where a header's history lives. Nothing about the write was careless in the ordinary sense: the anchor matched, the assertion `count == 1` passed, the file parsed. The defect entered through the argument.
- **Why it is worth its own case**: the repository already forbids judging from truncated output (pattern D, case 15, case 82). Those all concern **reading a conclusion** out of a truncated display. This is the write side — the truncated display became **input to an edit**, so the loss was not a misjudgment that a second look would fix, it was persisted state. And the file it damaged was the one place a rule records why it says what it says.
- **Second instance, same session, different mechanism**: while writing the handover this session also put `CRITERIA_MET` in `PRIMARY_OBJECTIVE` — a state name that does not exist. rule 24's closed set is UNSET / ACTIVE / ACCEPTED / BLOCKED / STOPPED, and the missing "criteria met, awaiting the human" member had been **deliberately refused** (16.md §2 row 29). The value was written from memory instead of from the definition block four scrolls away, which is PT-6's shape at a different target. Caught by opening rule 24 before declaring the tree final; selftest **B61** would have caught it at the final run, so the guard existed and the loss would have been time, not correctness. Recorded here rather than as its own index row because the defense is already executable — the failure was not opening it.
- **Retroactive application, same session (the case-filing protocol)**: the same session had built a 61-row promotion inventory from dumps printed with `cut -c1-420`, and one row printed an **empty** summary cell. That empty cell was not treated as a parsing hazard, which is PT-33's own third defense left unapplied. Re-measured against the untruncated source: the reference's rows for cases 108 and 109 are **malformed at origin** — 108's summary is absent and its text sits inside 109's row — and the two attributions already promoted into rules (case 108 → the shipped-artifact clause, case 109 → the birth-time-ordering discipline) are **correct**. Verified against the raw rows, not assumed; had they been wrong, two rules would carry the wrong origin.
- **Defense**:
  1. **Never let a truncating command's output become an argument to a write.** Obtain the value with something that cannot truncate — `git show`, a full file read, `--no-abbrev` — and compose the edit from that. If a preview is all you have, treat the value as unknown.
  2. **Prove preservation instead of inspecting it.** After rewriting a line that keeps part of its old content, assert the old substring is present in the new one, and assert structural balance (paren counts, field counts, closing markers). Both of this case's failures were caught by an assertion and neither by reading.
  3. **An empty or short cell in a parsed table is a parsing hazard, not a datum.** Re-read that row from the source with a different splitter before using anything from its neighbourhood — the anomaly is evidence about the parse, and it may equally be evidence that the *source* is malformed (it was, here).
- **Scope**: any edit that preserves part of an existing line; any table, log or transcript consumed through a preview, an excerpt, a persisted-output snippet, or a column limit.
- **Related**: `04-testing-strategy.md` §Before writing a predicate, read one real instance of what it must match (this session promoted PT-33 there — the clause existed for hours before this happened); pattern D; case 15; case 82; PT-33; PT-30; PT-6.
