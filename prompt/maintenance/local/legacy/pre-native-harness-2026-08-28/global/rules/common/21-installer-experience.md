# Rule: Installer Experience — Walk the Steps, Pick the Lightest Path

> **Origin: LaserEditor S012 (2026-08-13).** Registered there as 設計原則 第3原則「導入者体験の原則」 and first applied the same day (auth-key → login-URL conversion). Preserved with its incident history per the template's real-example policy.

**Severity:** ★★★★ (a technically-working feature packaged behind a heavy or fragile onboarding path fails at distribution — the failure surfaces at the worst place: on a non-technical user's machine, unattended)
**Scope:** common
**Last reviewed:** 2026-08-13
**Related cases:** LaserEditor case 81 (script-install residue lock), case 83 (assumption-built mocks); LaserEditor Windows guide design premises (project doc)

---

## TL;DR

1. **When packaging an already-proven feature for installers/operators** (setup wizard, install script, handbook, admin UI): **write out the installer's actual steps first, end to end, before choosing the method.**
2. Pick the method with the **lowest hands/understanding/custody burden for the installer** — not the one that is technically easiest to build. Fall back to the next candidate only on measured grounds.
3. **Walk your own document**: final acceptance is reproducing the whole flow from a clean state following only the written guide. Where reality diverges, fix the document (or the product), not the walker.
4. This rule does **NOT** apply during feasibility work — there, proving the thing works comes first.

---

## Why this exists

LaserEditor S012: the publish wizard was built around Tailscale auth keys — technically clean, mock-tested green. Writing out the installer's real steps exposed the true cost: console login → keys page → understand three flag choices → copy a shown-once secret → custody burden afterwards. The keyless login-URL flow (click a link, sign in with Google) removed every one of those steps; a live probe confirmed feasibility in minutes, and the fresh-install time fell to 1m45s with zero typing.

Same session, the guide walk-through caught what no test could: the token lived in a dotfile invisible in Finder; browsers silently reused stale tokens after reinstalls; a paste flow lost to a file-picker flow. Each fix came from walking the written steps as the installer would.

Counter-example (case 81, user field experience): a Windows manual had staff install Docker via PowerShell. A stalled run force-quit mid-install left registry residue that locked every later attempt ("already installed"). The BIOS/virtualization precondition surfaced only as "install succeeds, engine never starts". The method was chosen for author convenience, not installer safety.

---

## When to apply

- Turning a proven capability into: an install script, a setup wizard, a handbook/guide, an admin-facing UI flow.
- Choosing between authentication/authorization schemes an operator must perform.
- Writing any document a non-author will follow unattended.

## How to apply

1. **Enumerate the installer's real steps** for each candidate method — every click, every page, every secret they must see, carry, or store. The written list is the comparison artifact; "fewer/lighter steps" is judged on it, not on implementation effort.
2. **Prefer methods that remove whole categories of burden** (no key issuance at all beats a well-documented key issuance).
3. **Probe feasibility live before committing** (one real run of the candidate mechanism — pairs with rule 04's real-fire gate and case 83).
4. **Design for the failed walker**: what happens when they stall mid-way and retry? Steps must be idempotent or the retry path explicitly fenced (case 81: partial-install residue must be impossible or the retry loop closed off).
5. **Acceptance = walking the document**: from a clean machine/state, follow only the written words to the finish line. Fix divergences on the document/product side. Prefer a walker who didn't write it.

### A value that passes validation is not a value the person can enter

Walking your own document has two layers, and fixing the first hides the second. The first is whether the value you hand over is *accepted*; the second is whether the person can **reach the field to put it in**. Check both, on the real screen.

- Every value you ask someone to enter: confirm the receiving side's validation (length, character set, format) **in the implementation**, not by guessing.
- Then confirm where that field actually is. If the screen's primary affordance is something else — a file picker, an SSO button — and your path lives behind a disclosure triangle or a secondary link, **the instruction must say how to get there**.
**And the environment itself has to be alive when you hand it over.** Three layers, each of which hid behind the one before it: the value is accepted (④), the field can be reached (⑤), and **the server or build you are pointing at is running and actually contains the feature** (⑥). Before sending someone a URL: confirm it responds *at that moment*, and **name which server / build / image has the change**. "I implemented it" and "it runs there right now" are different claims. (Origin: LaserEditor case 88 defense ⑥ — a walkthrough pointed at a dev server the session had already stopped, and the production container next to it was a registry image that could not contain the new feature at all; the user got a connection refused on one port and an auth gate on the other.)

- (Origin: LaserEditor cases 88 and its S016 follow-up — a 6-character admin token was rejected by an 8-character front-end gate, so the token was lengthened; the next session photographed the same screen and found the primary path was "choose a token file", with direct entry collapsed inside `▶ or enter a token directly`. The corrected value still left the user unable to find the box. Same gate, second layer.)

### An acceptance condition that depends on the person NOT doing something is a broken design

If the run only proves what you wanted when the other person refrains from acting — not refreshing, not clicking, not opening the folder — the design is wrong, not the person.

- **Curiosity is the expected behaviour.** Someone handed a thing to watch will check it; writing "please do not press ↻" in bold at the top does not change that, and it should not have to.
- **Re-shape the experiment so their action cannot invalidate it.** Usually there is a version where you supply the stimulus yourself and they only observe — which is also cheaper for them.
- **When a run is invalidated, say the reaction was natural and do not put the cost on them.** They also spent something real (LaserEditor case 95: a sheet of paper, and the run had to be repeated).

### "It is in the source" is not "it is in the artefact you ship"

Between the repository and the running product there are build boundaries, and each one can drop things silently.

- Verify a shipped feature along the whole chain — **build context → COPY/bundle step → built image or package → the live endpoint** — not by reading the source tree.
- **When one fix does not make it work, look for a second independent cause before re-testing.** (Origin: LaserEditor case 92 — a download endpoint worked from the source tree and returned 500 from the distributed image; the `Dockerfile` did not copy the directory *and* `.dockerignore` was allowlist-shaped and excluded it. Repairing either alone still failed.)

## Anti-patterns

- "The script way is one line, the GUI way needs screenshots" — installer burden is measured on the installer's side, including failure modes, not line count.
- Publishing a guide never walked from clean state.
- A prompt that says "enter the token" without saying where the token physically lives on that machine.
- Treating feasibility-stage shortcuts (scp a file, paste a key) as distribution steps.

## Related rules

- `common/02-design-principles.md` — plan-before-code; this rule is its packaging-stage counterpart.
- `common/04-testing-strategy.md` §Real-fire acceptance gate — the live-probe and walk-through are real-fire instances.
- `common/17-no-self-imposed-scope.md` — the installer-step enumeration is a scope map; hiding heavy steps in "obvious" prose is self-imposed scope on the reader.
