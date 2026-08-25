# Rule: Reference-Implementation Survey — Compare ALL Same-Class Items Before Designing

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★ (surveying only the one item you touch, when a reference implementation covers the whole family, produces from-scratch designs that diverge from the proven approach and get reworked repeatedly)
**Scope:** common
**Last reviewed:** 2026-06-08 (Session 160 — established after DigiBiped TURN was redesigned 3× because only WALK had been compared to the OttoDIYLib reference; the reference's turn() held the answer the whole time)
**Related memory:** `reactive_vs_systematic`, `quality_over_tokens`
**Related cases:** `judgment-mistakes-history.md` case 25 (TURN 3× redesign + 6 cutovers/day), case 24 (F-5 局所修正), case 19/20 (cluster audit)

---

## TL;DR

1. **When modifying a feature that has a reference implementation (upstream lib, prior art, a sibling that already works), compare ALL same-class items against the reference verbatim BEFORE designing — not only the one item you are touching.**
2. **Build a comparison table (reference vs current, one row per item) and finish it before any implementation GO.** No "I'll design this one from first principles" while the reference has a proven approach.
3. **Surveying only the convenient subset is a self-imposed scope (rule 17).** The default survey scope is the whole family the reference covers.

---

## Why this exists

DigiCode Session 160: the robot motion library (DigiBiped) has a reference implementation (OttoDIYLib) for the same motion family. WALK had been compared to OTTO's walk and matched. But TURN was designed **from first principles** without ever extracting OTTO's `turn()`. The result: three full redesigns shipped to hardware — foot-phase flip → hip pivot {30,0} → finally walk-gait-arc — before the answer was found. When OTTO's `turn()` was finally fetched verbatim, it revealed the proven approach immediately: turn = the walk gait + an asymmetric hip amplitude + the same foot offset {0,0,4,-4}. DigiBiped's turn had been missing that foot offset the whole time. One survey up front would have replaced three hardware iterations.

The cost of the survey is minutes (fetch + extract + tabulate). The cost of skipping it was three image builds + three ML30 cutovers + three real-machine test rounds.

---

## When to apply

- Modifying or designing any member of a feature family where a reference implementation (or a working sibling) exists for the family: motion sets, protocol handlers, codec tables, parser rules, state machines, generator emit patterns.
- A sibling of the thing you are changing has already been studied/validated against the reference.
- You find yourself about to "design X from first principles" when X has a counterpart in the reference.

---

## How to apply

1. **Identify the reference** — the upstream library, prior art, or the already-working sibling.
2. **Enumerate ALL same-class items** — every motion, every handler, every rule in the family, not just the one in front of you.
3. **Verbatim-extract the reference's parameters/logic for EACH item** — actual values/code, not recollection (`推察禁止`). Fetch the source.
4. **Build the comparison table**: one row per item, columns = reference params / current params / physics-or-semantics match-mismatch / fix needed.
5. **Only then design.** No implementation GO before the table is complete and reviewed.
6. **Original values, not copies.** Understanding the reference's *principle* is the goal; if the reference is under an incompatible license, derive original values (see the project's reference-comparison rule, e.g. `digicode/21-otto-physics-comparison.md`).

---

### Quality grade is part of the requirement — see the reference before choosing candidates

When the requirement names a quality bar ("something like the assets that ship with X"), the reference is the **artefact**, not its category. Licence and availability rank candidates *within* the set that clears the bar; they never select the bar.

- Ask for or find the actual reference sample (screenshot, file) and look at it **before** shortlisting.
- Assets of the same nominal kind have different use grades — a UI glyph set, an illustration set, and an engraving line-art set are not substitutes at any quantity.
- **Look at one original before writing a bulk transform**, and render-inspect the output afterwards. (Origin: LaserEditor case 76 — a UI icon set was delivered against a request for engraving-grade illustration and rejected wholesale; the re-take then colour-replaced 196 SVGs without opening one, whose originals were white-on-black, producing 196 black squares. The render inspection caught that before delivery — the inspection loop worked; the shortlist did not.)

## Anti-patterns

### ❌ Surveying one item, designing the rest from scratch

```
WALK compared to reference → matched. ✅
TURN designed from first principles (reference's turn() never fetched).
   → foot-flip attempt → pivot attempt → walk-gait attempt = 3 reworks.
Reference's turn() (fetched at attempt 3) had the answer at attempt 0.
```

### ❌ Implementation GO before the comparison table is complete

A partial survey ("I checked the one I care about") is not a survey. The table covers the family; the GO waits for the table.

---

## Related rules

- `common/17-no-self-imposed-scope.md` — surveying only a subset is a self-imposed scope; the default is the whole family.
- `common/01-investigation.md` — the same exhaustiveness applied to call sites rather than to reference implementations; its Step 3b (the denominator is built, not grepped) is how you avoid a survey that only *looks* complete.
- `common/20-deploy-batching.md` — a complete survey is what makes batched deploys possible (you fix all members at once).
- `common/judgment-mistakes-history.md` case 25 — the source incident; case 24 (local-fix impact survey) and case 19/20 (cluster audit) are the same "survey the family, not the instance" discipline.
- Project reference-comparison rules (e.g. `digicode/21-otto-physics-comparison.md`) — the concrete application for a specific reference library.
