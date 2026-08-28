# Rule: Deploy Batching — One Deploy Per Target, Not One Per Fix

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★ (a per-fix deploy loop multiplies expensive deploy cost by the number of problems found, and each deploy is an irreversible outward-facing action)
**Scope:** common
**Last reviewed:** 2026-06-08 (Session 160 — established after 6 ML30 cutovers in one day, ~5 of which were avoidable with up-front problem-surveying + batching)
**Related memory:** `reactive_vs_systematic`, `deploy_verify`
**Related cases:** `judgment-mistakes-history.md` case 25 (6 cutovers/day), case 24

---

## TL;DR

1. **Batch all changes to the same deploy target into ONE deploy.** Find every problem first, fix them together, deploy once.
2. **No "fix 1 → deploy → test → find problem 2 → deploy → ..." loop** when problems 2..N were discoverable in the same test round.
3. **Treat each deploy as a costly batch boundary**, not a per-change step — especially for expensive deploys (image build + cutover, multi-minute pipelines).

---

## Why this exists

DigiCode Session 160 performed **six ML30 cutovers in one day** (direction-reversal, amplitude, turn-flip, turn-pivot, turn-walk-gait, homeBlocking). Each cutover is an image build (~25 min) + cache eviction + smoke. At least five were avoidable:

- The three turn cutovers (flip → pivot → walk-gait) were one feature iterated on hardware; a reference survey (`rule 19`) up front collapses them to one.
- The remaining fixes were independent problems that a single real-machine test round had already surfaced (or would have, if the test plan had enumerated them) — they could have shipped in one batch.

The deploy itself is not the work; it is the *checkpoint* around the work. Treating it as a per-fix step turned ~1 day of fixes into ~6 build/cutover/test cycles.

---

## When to apply

- Any change that requires a deploy, especially expensive ones (image build + server cutover, CI pipelines, ML30 cutover).
- After a real-machine / integration / smoke test round surfaces one or more problems.
- Whenever you are tempted to deploy a single fix and immediately test for the next problem.

---

## How to apply

1. **Collect ALL problems from a test round before fixing any.** Run the full test plan; write down every failure.
2. **Root-cause all of them** (apply `rule 19` reference survey where a reference exists — this often reveals that several symptoms share one cause or one family).
3. **Implement all fixes** in one working session.
4. **Deploy once.** One commit (or one coherent commit set), one build, one cutover.
5. **Re-test the batch.** New problems found here start a *new* batch — but only after the current batch is fully tested.

The only justification for a mid-batch deploy is a genuinely independent, urgent fix that cannot wait for the batch (e.g. a production outage). "I found the next problem" is not that.

## A push can be a deploy you didn't mean to make (auto-follow targets)

Some deploy targets follow a registry tag automatically and immediately. When a target auto-deploys on every new image of a watched tag, **the push that builds that image IS the deploy** — there is no separate "deploy step" you control.

DigiCode case (Session 164/165): the Railway backup compile server auto-follows the `latest` image tag (user-confirmed: kept on auto-follow, not pinned). The primary (ML30) is a manual Procedure A cutover. So:

- A `compile-api` push to `main` triggers GH Actions → builds + pushes `latest` → **Railway pulls the new image within minutes**, while ML30 still serves the old image until a manual cutover.
- Between the GH Actions completion and the ML30 cutover, the two origins behind the load balancer run **different versions** — a silent version-inversion window (newer on the failover origin than on the primary). Cloud failover has no version gate, so a user can be served the newer origin's binary with no warning.

Operating rule for auto-follow targets:

> **A push to an auto-followed deploy source is a commitment to complete that target's coordinated cutover the same day.** If you cannot do the manual cutover today, **do not push today.** The auto-follow origin goes new the moment you push; the version-inversion window stays open until you finish the manual side.

Do not treat "I'll push now and cut over later" as safe when any origin auto-follows. Either pin the auto-follow origin to the same tag the manual cutover uses (removing the inversion), or batch the push to the same day as the cutover.

---

## Anti-patterns

### ❌ Per-fix deploy loop

```
real-machine test → problem A → fix A → build+cutover (25min) → test
   → problem B (was visible in the same test round) → fix B → build+cutover
   → problem C → ... → N deploys for N problems found in one round.
```

### ❌ Iterating one feature on hardware via repeated deploys

```
turn doesn't work → guess fix 1 → cutover → still wrong → guess fix 2 → cutover ...
Better: survey the reference (rule 19) → derive the correct design once → one cutover.
```

---

## Related rules

- `common/19-reference-implementation-survey.md` — the survey that lets you find all problems / the correct design before deploying, enabling the batch.
- `common/judgment-mistakes-history.md` case 25 — the 6-cutover incident.
- Project deploy rules (e.g. `digicode/05-deploy.md`, `digicode/22-ml30-cutover-minimum.md`) — the concrete deploy mechanics and per-target cutover budgets.
