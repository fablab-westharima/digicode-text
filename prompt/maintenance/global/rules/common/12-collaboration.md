# Rule: Collaboration — wait-for-go, Plan Review, Step-by-Step UAT

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★
**Scope:** common
**Last reviewed:** 2026-08-25 (Project_Template Phase 7 case promotion — an authentication failure is a write, not a free look, under §Destructive real-fire (case 123); a limitation you declared is a claim, under §The conversion duty is not limited to the user's observations (case 128, the self-applied form of case 43 which that section already owns). 前 review 2026-07-21 (Nagaoka-Clay3DP S014→S015 harvest — added energy-path 3-point decomposition for physical-action declarations; local rule 03 v2 + case 44. Prior 2026-07-20: added blanket-GO exception for session close: close instruction includes commit+push, no mid-close interactive confirmation; origin S012 lesson. Same day: added Observation-to-measurement conversion duty — never close a reply to user doubt about real-system behavior with a design-rationale explanation; convert to a registered verification item; case 43))
**Related memory:** `wait_for_go`, `step_by_step_acceptance_test`, `atomic_compound_actions`, `ui_placement_implies_relation`, `model_switching`
**Related cases:** old-rule-32 (2026-04-14 incident), 35.md S5 P2 step-by-step protocol, BUG-031/038 (3-Scenario / 4-Scenario UAT), Phase 4-A 議論経過

---

## TL;DR

1. **Don't code without "implementation start" / "go ahead" / explicit OK from the user.** Design discussions are for proposals, not for jumping into implementation.
2. **Submit a design proposal (per `common/02-design-principles.md` 10-step) before code change.** Wait for the user's review.
3. **For risky / multi-step / multi-scenario verification: split into one scenario at a time.** Don't dump 9 scenarios; user gets confused, you lose isolation.
4. **Don't ask the user to share secrets** (JWT, API keys, passwords). For curl tests they own: tell them what to run and what HTTP-status-and-body to report back.
5. **Compound actions on UI: 1 click, not 2.** Delete-and-save = one button, not delete-then-save-button. (`atomic_compound_actions`)
6. **UI placement implies relation.** Don't put unrelated things adjacent in sidebars/menus. (`ui_placement_implies_relation`)
7. **Parent-led orchestration.** Delegation to another model lane (different-vendor MCP lane / Claude subagents) is gated by wait-for-go exactly like the parent's own edits, and parent-only duties (user communication, case filing, handover, baseline measurement, commits, adoption decisions) are never delegated. See §Model operation and `22-model-orchestration.md`.

---

## Why this exists

- **2026-04-14 incident:** Claude was about to start Step 5.5 implementation. The user asked, "Have you done the code/DB analysis? Is the plan ready?" Claude honestly said the skeleton was settled but 5 details were unresolved. User responded: **"Improvised implementation invites plan failure. From here on, prepare thoroughly before starting."** This birthed `02-design-principles.md` (and old-rule-32).
- **35.md S5 Phase 2:** Claude submitted 9 verification scenarios at once. User: "When you list a lot at once, I don't know where to start. Step by step, fix small bugs as we go." Memory `step_by_step_acceptance_test` was created.
- **BUG-031 / BUG-038 / C Phase Step 9:** Each used 3-4 scenario step-by-step UAT. Each isolated a single variable per scenario. Each found the actual cause within 4 scenarios.
- **S5-A2 (atomic compound actions):** Claude proposed "delete API key" link + "save" button. User merged into 1 click. Memory `atomic_compound_actions` born.
- **S5-A2 (UI placement):** Claude proposed AI Settings under Plan & Billing menu. User: "That implies it's a plan/billing thing." Moved to user-settings cluster. Memory `ui_placement_implies_relation` born.

---

## When to apply

- Always, when working with the user on a task.
- Especially when:
  - About to make code changes (`wait-for-go` applies)
  - Planning verification scenarios (one-at-a-time applies)
  - Touching secrets / API keys (don't ask, don't see)
  - Designing UI (placement / atomicity matter)

---

## How to apply

### wait-for-go

The user must give an explicit **green light** before any code change. Phrases that count:
- "Implementation start" / "go ahead" / "OK" / "進めて"
- "Implementation start with this plan"
- "OK, fix it"

Phrases that do *not* count:
- "Looks reasonable" (not a green light, just acknowledgment)
- "I see your point" (discussion continuation)
- Silence or no response (always ask)

**Blanket-GO exception — session close (2026-07-20 user directive, origin: Nagaoka-Clay3DP S012→S013):** a close instruction (`/close` or equivalent) IS the green light for the entire close protocol, **including commit + push**. Closing silently and completely takes priority: interactive confirmation questions mid-close are forbidden. The only stop condition is a pre-commit gate failure (gitleaks etc.) — then stop and report. Non-close items (template harvest candidates, observations, proposals) go in a separate report **after** the close report, not as mid-close questions. This exception applies to the close protocol only — it does not weaken wait-for-go anywhere else. Details: `.claude/commands/close.md`.

### Physical-action declarations: energy-path 3-point decomposition

(2026-07-21 user-approved harvest; origin: Nagaoka-Clay3DP S014 — local rule 03 v2 + case 44.)

When declaring, requesting GO for, or reporting any physical action (motor motion, pressure application, heating, spindle/laser power — anything that moves energy into the real world), decompose the machine's energy path into three points and state each explicitly:

1. **Source / supply** — the upstream stored or generated energy (compressor line, mains, battery, gas): ON/OFF plus how it is managed (direct gauge reading vs. time-managed vs. remotely unreadable).
2. **Regulator / converter output** — what actually reaches the actuator (regulator output pressure, driver current, converter voltage): applied or not, and the effective maximum.
3. **Command** — the software instruction and its value.

A bare "no pressure" / "power off" / "OFF" is forbidden — always name WHICH of the three points. The failure mode this kills: the command is 0 and the report says "no pressure" while the supply line is charged — the dangerous energy sits upstream of the software's view. Corollary (case 44): a declaration claiming "same configuration as run X" must be drafted by measuring the referenced artifact (plan/gcode/cfg) at draft time, never from memory; pre-generated declaration text gets its reference values re-measured immediately before presentation.

Origin instantiation (pneumatic clay printer): ① compressor line pressure ② ITV regulator output ③ `SET_PRESSURE` command. Generalizes to any energy domain.

### Destructive real-fire: the blast radius decides, not the feature's purpose

Verifying a destructive feature does not license destroying data you did not create.

- If the real-fire's blast radius includes **anything you did not create**, either (a) design the run so only your own fixtures are in range, or (b) get the user's confirmation first. One of the two, every time.
- "The whole point of this button is to delete everything" is not a reason to fire it unasked — **when** it fires is the user's call. That is precisely why the feature has a confirmation step; do not route around your own guard.
- Disclosing afterwards is not consent. Deleted is deleted.

(Origin: LaserEditor case 71 — an "empty the trash" button was real-fired against production and removed 43 historical designs, when a single self-made fixture would have verified it. No complaint followed, but nothing was recoverable either.)

**A failed authentication attempt is a write, not a free look.** Probing for the right credential feels like read-only reconnaissance and is not: it moves counters in a defense mechanism you did not build, on an asset you do not own.

- **The moment one identity works, fix it and stop.** "Let me also try the others, just in case" is the whole failure — there is nothing to learn once you are in.
- **Count authentication failures as operations with side effects, and change information source after a few** rather than continuing the sweep.
- **Read the defense mechanism's persistence spec before choosing a remedy.** Whether a block lives in memory or in a database decides whether a restart clears it, and that is the difference between a minute and hours.

(Origin: LaserEditor case 123 — after succeeding with `root` plus a dedicated key, three more users × two more keys were tried; six failures in two minutes triggered `fail2ban`, whose ban was persisted to sqlite and re-applied on boot, so it survived two reboots. Recovery needed the human's console access and took about 4.5 hours, with acceptance work stopped throughout.)

### Observation-to-measurement conversion duty (観察→実測変換の義務)

(2026-07-20 user directive; origin: Nagaoka-Clay3DP S012–S013, case 43.)

When the user voices doubt or unease about **real-system behavior** (実機・本番環境) — "why does it resume from there?", "it feels like it should be flowing here" — **do NOT close the reply with a design-rationale explanation.**

- The explanation may be offered **as a hypothesis**.
- It MUST be converted into a **verification item** ("the measurement that would confirm this explanation") and registered on the project's pending-verification list (plan open items / handover task table).
- **User acceptance of the explanation does not waive the registration.** Acceptance is agreement with the reasoning, not verification of the implementation.
- Consuming the registered items is included in the next real-environment session's declaration.

Why this exists: the side that knows the design can retrofit a coherent explanation onto ANY observation, so in discussion the explanation always wins. But explanation-correctness and implementation-correctness are different things, and the user's unease carries real observation that resists verbalization. **The more plausible the explanation, the more dangerous it is as a license to skip measurement.** Origin incident: across two days the user's field observations repeatedly pointed at a latent ramp defect ("why does it resume from there?" / "it feels like it should be extruding here"); each observation was answered with an internally consistent "as designed" explanation — itself resting on a wrong desk trace — the user conceded with lingering doubt, no measurement was made, and the defect survived until the first real run.

### The conversion duty is not limited to the user's observations — yours count too

The rule above fires on *the user* voicing doubt. The same failure happens with no user involved: **you measure something about the environment, understand it, act on it in the moment, and never write it down.** The finding then expires with the session, and a later session — possibly tomorrow's you — walks into it as if it were new.

- **An environment constraint you had to measure is a finding, not a step.** Which port a process actually holds, which hostname resolves where, which binary is absent from the image, why a service answers when it should not: register it where the next reader will be standing, not only in the reasoning that used it.
- **The tell is "I confirmed X, therefore I can proceed."** The confirmation is the artefact; proceeding is what you do with it. Write it before you spend it.
- **Cost is not proportional to effort.** The measurement can take one command and still be the thing that invalidates a later acceptance.
- **A limitation you declared is a claim, and it closes the matter the same way a design-rationale explanation does.** Writing "the meaning of X does not change — known limitation" and moving it into the report converts a possible defect into an accepted property, by your own hand and with no measurement. So: **the moment you write "this is a limitation", ask once whether it is truly a limitation or simply not fixed yet** — and hold the wording of the limitation against the wording of the ruling it has to coexist with, out loud. Anything you shipped as a limitation is **the first suspect** when the same symptom appears again. (Origin: LaserEditor case 128 — a re-ingest gate was declared an unchanged limitation and reported as such; that gate was the very thing breaking the human's ruling that a submission could be retried any number of times, silently skipping identical resubmissions. The same shape as the rule above, self-applied: there the explanation wins the discussion, here it wins it against yourself.)

(Origin: LaserEditor case 97 — a session measured that `:8000` had two listeners and that the destination depended on which spelling was used (`127.0.0.1` vs `localhost`/`::1`), confirmed it three ways, and recorded it nowhere. The next day's production update walked the procedure unaware of that constraint and reported a "23-second downtime" measured through a probe that could not tell the two apps apart. The day after, a third session rediscovered the whole thing from scratch and had to withdraw the verified number.)

### A registered item needs an owner and a date, or it decays

The conversion duty above creates items. Items that name no moment for consuming them are not consumed — and unlike a missing item, a registered one *looks* handled, which is worse.

- **Give every registered item the cheapest moment at which it can be resolved, and put that moment in the item.** For a real-environment measurement that is the next session at the machine. For anything the user alone can answer, it is **before the work that depends on it** — and for delegated work, before the delegation, because after the packet goes out the answer costs a re-run instead of a sentence. (Origin: LaserEditor S015 — "the user wasn't satisfied with something in the S1 UAT" sat as one line in a plan across three implementation stages before anyone asked; the cold start that finally surfaced it correctly identified that the cheapest asking point had already passed twice.)
- **A "the user seemed unhappy" item is a question, not a defect.** Do not schedule remediation for it, and do not let it silently expand scope. Ask.
- **When the answer turns out to be a scope statement, record it as settled and close the item.** The S015 answer was 「細かいことを言えば終わりがなく、他にやることもある中でデザインばかりに時間を割けない。及第点なので先に進む」 — that is the project lead exercising scope, which rule 17 reserves to them. Converting it into a polish backlog is the same violation as deferring work they wanted, pointed the other way. Note that this cuts against the grain of rule 17's usual direction, and is exactly why it must come from the user's words and be recorded verbatim rather than inferred from tone.

### Design proposal format

When submitting before implementation:

```markdown
## Plan: <task name>

### Scope
- File A: <change>
- File B: <change>
- ...

### Out of scope
- ...

### Risks
- ... (what could break, blast radius)

### Test plan
- Static: typecheck / eslint / vitest / prebuild / audit-i18n
- Local (if high-risk): wrangler dev with N scenarios
- Production smoke: golden path

### Self-check (judgment-mistakes-history.md 参照)

#### 過去の失敗パターン該当チェック
- パターン A (即断、真因が見えた瞬間に確定して追加検証なし): [該当 / 非該当 + 理由]
- パターン B (scope の自己確証、「これだけで足りる」根拠を自分で確かめずに結論): [該当 / 非該当 + 理由]
- パターン C (サンプリングを全体評価扱い、n=N で全体を語る): [該当 / 非該当 + 理由]
- パターン D (log 末尾/冒頭のみで真因確定、truncate / 中略 のある output で判断): [該当 / 非該当 + 理由]

#### 実証ベース / サンプリング / 推察ラベル
- [判断 1]: 実証ベース (grep 結果 / 全件確認 / N=?)
- [判断 2]: サンプリング (n=?、母数=?)
- [判断 3]: 推察 (根拠=?)

#### 推察判断の追加調査要否
- [推察判断] に対して、追加調査せずに進める根拠 / 追加調査するなら何を

### Decisions for user
- Choice A vs Choice B (recommend A because ...)
- ...

### Estimate: <h>
```

**Why this self-check:** Same-session repeat of the same judgment-mistake pattern was observed multiple times (e.g., 第82回 BUG-077 で smoke truncate 誤判断 + transitive dep 全件確認漏れの 2 連続)。LLM は学習で内面化しないため、毎ターン強制的に過去パターンを参照する仕組みで「忘れにくくする」。詳細は `common/judgment-mistakes-history.md` 参照。

**Format vs. substance (2026-08-13):** the proposal format above is a reference shape, not a fill-in obligation. What is mandatory is the *substance*: full scope surfaced (no self-imposed exclusions), risks and test plan stated, and the self-check actually performed — meaning each pattern was checked and the recommendation either moved or survived on new evidence (rule 14). Free-form prose that demonstrably covers these is acceptable; a perfectly formatted table whose recommendation never moved is not (case 18).

After submitting: pause. Wait for user to engage with each decision. **Don't push** "should I start now?" — let the user lead.

### Step-by-step UAT protocol

For verification involving the user:

1. **Plan all scenarios up front, but submit only Scenario 1.**
   ```
   Plan:
   - Scenario 1: fresh state, single block placement
   - Scenario 1-b: fresh + setup/loop nesting
   - Scenario 2: after F5 reload (guest)
   - Scenario 3: after login
   ```

2. **Run Scenario 1, wait for result.**
   ```
   Please run:
   1. Open production URL in private window
   2. Place a single servo block in the workspace
   3. Click "コードを表示"
   Expected: code appears in the dialog
   Please report what you see.
   ```

3. **Diagnose if failure**, fix, deploy, **then run Scenario 2**.

4. **Each scenario isolates ONE variable** different from the previous. (BUG-038: scenarios 1, 1-b, 2, 3 differed by exactly one factor each. Scenario 3 = login, which was the trigger.)

### Don't see secrets

Forbidden: asking the user to paste JWT_SECRET / API key / password / authentication token / GitHub PAT.

**Instead, ask the user to run commands and report results:**

```
Please run:
  curl -s -X POST https://esp32-blockly-backend.kazunari-takeda.workers.dev/api/admin/foo \
    -H "Authorization: Bearer $(<your token>)" -H "Content-Type: application/json" \
    -d '{"key":"value"}'
And report:
- HTTP status code
- Response body (excluding any token/secret fields)
```

When the user reports `200` + body shape, that's enough.

If you absolutely must verify a token is set in the environment: ask the user to run `npx wrangler secret list` and report which keys are present, **without values**.

### Compound action atomicity (UI)

Don't split actions that should logically be one operation:

```tsx
// Bad: two-step
<button onClick={deleteKey}>Delete</button>
<button onClick={saveSettings}>Save</button>

// Good: one-step
<button onClick={() => { deleteKey(); saveSettings(); }}>Delete and save</button>
// Or: just label "Delete" but the implementation also persists.
```

Label should be short ("Delete API key" is enough; "Delete API key and save" is verbose). The atomicity is in the implementation, not the label.

### UI placement signaling

When adding a sidebar / menu item:
1. **Identify which cluster it belongs to** (admin / security / user-settings / session / billing / etc.).
2. **Place adjacent to other items in that cluster.**
3. **Don't place adjacent to unrelated items** — adjacency implies relation.

Example: AI Settings is "user personalization", not "billing." Place after "Change Password," not under "Plan & Billing."

If you propose a placement, justify the cluster choice in your plan.

**Choose the cluster by who touches it and when — never by where there is room.** (Origin: LaserEditor S017 case 90.)

1. **"There was vertical space in that column" is not a placement reason.** Neither is "this needs the smallest diff". Layout convenience answers a different question than information architecture does.
2. **A shared word is not a shared cluster.** A one-time setup diagnostic and the screen staff operate during an event carried the same product word in their titles; the people, the frequency and the moment were all different. Ask who opens this, how often, and at what point in the project's life — if those answers differ from the neighbours', it is the wrong cluster.
3. **If no cluster fits, create one — with exactly the one real item in it.** Creating a section is the correct move; creating empty future slots or unimplemented menu entries is not.
4. **"We are not polishing the UI" is not a reason to skip the structural decision.** Polish (how it looks) and information architecture (where things live) are different work. The second one is incurred by every feature you add, whether or not the first is in scope.

The measured cost of getting this wrong is not cosmetic: the user's words were 「こんなことするから UI が荒れる」 — placement errors accumulate into a product nobody can navigate, and each one is cheap to prevent and expensive to unwind.

### Model operation (parent-led orchestration — details in rule 22)

The project runs **Orchestrated Reasoning** (2026-08-17 user specification; supersedes the 2026-08-13 delegate-execution shape, which itself superseded the single-model section and an earlier fixed two-model design/implement split): both lineages reason independently across six lanes (investigation, planning, design review, implementation, verification, falsification), review each other's plans and interpretations, and the parent integrates — the parent is *not* "the one who thinks" handing code to "the one who types". Lanes, the plan-review round-trip, the code-defect review asymmetry, delegation packets, and the environment setup live in `22-model-orchestration.md` — this section holds only the collaboration invariants that survive any model configuration:

- **wait-for-go gates delegation.** Starting a delegated implementation before the user's GO is the same violation as coding without GO.
- **Parent-only duties are never delegated:** user communication and GO interpretation, case filing, handover, baseline measurement, commits, and adopt/reject of review findings.
- **A delegate's report is a claim to verify, not a result to transcribe** (rule 04 §Delegated verification claims; rule 13 §Dual-check architecture).

> Note for future maintainers: keep this section configuration-neutral. Roster and lane specifics belong in rule 22's environment-prerequisites section; when the orchestration shape changes, update rule 22 and leave these invariants intact.

### After-task offers (selective)

When work has a natural future follow-up (one-shot or recurring), make a brief one-line offer:

```
Want me to /schedule an agent in 2 weeks to remove the OTTO migration code per the sunset date?
```

**Don't offer for:** routine bug fixes, refactors with tests, docs, plain feature merges, when user signals closure ("nothing else to do").
**Do offer for:** flag/gate cleanups, soak windows / metric checks, long-running jobs needing follow-up, recurring sweeps.

Don't stack multiple offers on consecutive turns.

**Ending the session is never one of these offers.** When to stop is the user's alone. Report the work and stop there — do not append "shall I `/close`?" to completion reports, and never on consecutive ones. The in-session recording discipline (file the case, update the plan, in the session where it happened) is satisfied by *doing it now*, silently; it does not require the session to end, so it is not a reason to steer toward closing. (Origin: LaserEditor case 65 — closing was offered five-plus times across a long session while the user kept adding improvements that materially raised quality; "why are you the one declaring the end?" The harm is pressure on the user, and it comes from confusing a natural break in the work with the end of the session.)

---

## Anti-patterns

### ❌ Implementing during a design discussion

```
User: "What if we did X?"
Bad: [implements X]
Good: "I think X has these tradeoffs: ... Want me to detail it as a plan?"
```

### ❌ Asking for the user's secret

```
Bad: "Please share your JWT_SECRET so I can test the login flow."
Good: "Please run `curl ...` with your auth header set, and tell me the HTTP status and response shape (without the token value)."
```

### ❌ 9 scenarios in one prompt

```
Bad: "Please verify the following 9 scenarios: 1) ... 2) ... ... 9) ..."
Good: "Scenario 1: [single concrete test]. Run it and tell me what you see."
```

### ❌ Two-step compound action

```
Bad: <Link onClick={delete} /> + <Button onClick={save}>Save</Button>
Good: <Button onClick={() => { delete(); save(); }}>Delete</Button>
```

### ❌ Misleading UI placement

```
Bad: "AI Settings" placed under "Plan & Billing" submenu.
Good: "AI Settings" in user-settings cluster (after Change Password), distinct from billing.
```

---

## Related rules

- `common/02-design-principles.md` — the 10-step plan that gets reviewed
- `common/04-testing-strategy.md` — the step-by-step UAT comes from there
- `common/05-commit-workflow.md` — commits happen *after* go-ahead
- `digicode/06-secrets.md` — DigiCode-specific list of secrets to never view
- `reference/memory-index.md` — cross-references to memory entries on this topic
