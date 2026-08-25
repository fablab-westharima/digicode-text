# Reference: Phase Patterns — 14 P4 Phase Commit Shapes & Lessons

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Audience:** Claude (lookup table for "how do Phases usually go in DigiCode?")
**Last reviewed:** 2026-04-26
**Source:** P4 全 14 Phase 完走 (2026-04-23 → 25), `40-A_classification_report.md`

---

## TL;DR

The 14 P4 Phases each had a distinct commit shape and outcome. Patterns that worked vs. didn't:

- **Worked:** plan-doc → atomic-fix → post-commit-docs (3-commit Phase pattern)
- **Worked:** auth/payment in isolated commits (1 bug = 1 commit)
- **Worked:** integrated commit for data systems (5-language i18n, dead-code cascade)
- **Worked:** `KNOWN_BROKEN` allowlist removed atomically with rebuild
- **Worked:** diagnostic revert cycle for pre-existing bug isolation
- **Didn't:** trusting bug file's `related_files` as scope (8 of 42 bugs exceeded it)
- **Didn't:** local Node.js test as sufficient verification (BUG-021 lockout)

This file is the play-by-play for future Phases to model on.

---

## Phase summary table

| Phase | Bugs | Commit shape | Net Δ | Key takeaway |
|---|---|---|---|---|
| 1 | 001, 003 | 1 commit each | small | typecheck activation reveals 4 child bugs (030/031/032/033) |
| 1.5 | 032, 034 + Square removal | 2 commits | -777 lines (removal) | 3-version triple alignment (Stripe SDK / endpoint / account) |
| 2 | 025, 027 | 1 integrated commit + regex bug self-fix | +500 lines | shipping audit at MVP (catalog-driven validation) |
| 3 | 013, 014, 017, 019 | 1 integrated commit | -88 lines | retryHelper extraction; rule-6 violation incident → memory `local_vs_prod_testing_policy` |
| 4 | 006, 010, 016, 018 | 1 integrated commit + 25 cascade | -347 lines | dead-code cascade is normal; → BUG-035 副次 |
| 5 | 004, 005 | 1 integrated commit | flat | React Hooks 5-Group classification; ServoTrim TDZ surfaced; → BUG-036 副次 |
| 6 | 020, 021 | 3 commits (KV migration + PBKDF2 + hotfix) | small | 1 bug 1 commit for auth/security; lockout incident → memory `evidence_based_runtime_research` |
| 7 | 008, 009 (X-scope), 015, 036 | 1 integrated commit | small | scope-narrow X-case for 009; → BUG-009b + BUG-037 副次 |
| 8 | 011, 012, 022, 023, 009b | 2 commits (`424ce31` 009b refactor + `78497e6` polish) | mostly negative | bug-file 乖離 4 件; flag-base state machine refactor |
| 9 | 007 | 3 commits (apply + diagnostic revert + reapply) | +1664 / -1606 | 1592→0 any cleanup; diagnostic cycle for BUG-038 isolation; → BUG-038 副次 |
| D | 030, 031, 033 | 2 commits (030/033 unified + 031 isolated) | small | fix-at-source pattern (5 lines fix 24 sites); auth-critical isolation |
| C | 035 | 1 commit | -488 lines | EditorToolbar.tsx caller-zero discovered; → BUG-039/040/041 副次 |
| C extension | 041 | 1 commit | -144 lines | pre-existing bug solved via MobileWarning removal (option C) |
| A | 024, 037, 039, 040 | 6 commits (A-0 / A-ext / A-ext supplement / A-1 / A-2 / 38.md plan) | +2700 translations | bug file 1-3 lines → 2,235 reality (1000× scope); classifier patch |
| B | 029 | 3 commits (37.md plan + atomic + post-commit-docs) | -2186 lines | atomic delete with allowlist removal; data quality complete |

---

## Pattern analysis

### Pattern A: 3-commit Phase

When a Phase has both a planning document AND code change:

```
1. <plan-doc>      docs(plan): NN_<date>_<phase-name>.md
2. <atomic-fix>    fix(<area>): one-line summary, all bugs in scope
3. <post-commit>   docs(bugs): move BUG to 修正済みバグ + index updates + 改定log + 16.md
```

**Used by:** Phase 1.5, Phase 7, Phase D (split), Phase A, Phase B, Phase 40 (this one)

Plan-doc commit allows the user to review before code change. Post-commit-docs separates "production state changed" from "bookkeeping updated" so each can roll back independently.

### Pattern B: 1-commit integrated

When a Phase has many small bugs but no separate planning doc (the plan is captured in the BUG files):

```
1. <atomic-fix>    fix(<area>): all bugs integrated; cascade in same commit
```

**Used by:** Phase 2, Phase 3, Phase 4, Phase 5, Phase 7, Phase 8 commit 2, Phase C, Phase C extension

Common for: data integrity Phases (where partial state is broken), dead-code Phases (where cascade is the point).

### Pattern C: 1-bug-1-commit isolated

When a bug is auth-critical or payment-critical, isolate it for fast rollback:

```
1. <isolated fix>   fix(auth): only this bug, isolated from other bugs
```

**Used by:** Phase 6 (KV + PBKDF2 + hotfix as 3 separate commits), Phase D BUG-031 (Passkey isolated from BUG-030/033)

Trade-off: more commits to push, more deploys, but rollback granularity matches blast radius.

### Pattern D: Diagnostic revert cycle

When you suspect a Phase but aren't sure (could be pre-existing):

```
1. <Phase commit>   fix(...): the change being investigated
2. <revert>         Revert "<Phase commit>"
3. test in production — symptom persists?
   YES: pre-existing bug.
4. <re-apply>       Revert "Revert ..."
5. note in BUG file that the cycle ran; the Phase is innocent.
```

**Used by:** Phase 9 (BUG-007 → BUG-038 isolation), commits `0ef15eb` → `4749246` → `af577a2`

Don't squash the cycle. The trail in git log is informative.

### Pattern E: Atomic safety-net removal

When a `KNOWN_BROKEN` allowlist exists and a rebuild is shipping:

```
1. <atomic commit>: rebuild + remove the corresponding allowlist entries (in same commit)
```

**Used by:** Phase B `e4860ae` removed `KNOWN_BROKEN_SAMPLES` and `KNOWN_BROKEN_TUTORIALS` along with the rebuilds. Audit safety net never lapsed.

Don't separate the rebuild and the allowlist removal — race condition risk.

---

## Phase-by-Phase notes

### Phase 1 (CI 基盤)

- Bug 001: typecheck not even running on frontend, 2 errors
- Bug 003: typecheck not even running on backend (no `tsc` package!)
- Activating typecheck on backend revealed **36 errors → split into BUG-030/031/032/033** (BUG-003's children)

**Lesson:** activating type checks costs cleanup work. Plan for the children before activation.

### Phase 1.5 (Stripe migration, urgent insertion)

- Discovered Stripe account API version pinned at 2018-02-28 for 8 years
- 3-version triple alignment (SDK target / webhook endpoint / account default)
- Required webhook recreation (`charismatic-breeze` → `whimsical-serenity`)
- Defensive helper kept post-migration as runtime safety
- D1 migration 0022 (Square column drop) used SQLite table-recreate pattern

**Lesson:** versioned-service work needs all 3 layers in scope from the start.

### Phase 2 (audit infrastructure)

- BUG-025 + BUG-027: audit tools didn't exist or had limitations
- New `audit-data-consistency.ts`, expanded `audit-ai-catalog.ts`
- Self-discovered regex bug during implementation; fixed in same commit
- `KNOWN_BROKEN` allowlist for 22 in-flight rebuild items

**Lesson:** ship the audit at MVP, not after data corruption.

### Phase 3 (AI client cleanup)

- BUG-013/014/017/019: dead method, stale model defaults, mismatched placeholders, duplicate retry logic
- `retryHelper.ts` extraction (71 lines) — DRY win
- 16.md handover doc had a rule-6 violation; pulled out → memory `local_vs_prod_testing_policy` born

**Lesson:** dead code from "future migration" comments rots if the migration ships without revisiting.

### Phase 4 (dead code)

- BUG-006/010/016/018: 38 unused vars, @ts-ignore→@ts-expect-error, unused props, redundant mapping
- 25 cascade deletions from removing `MobileToolbarControls` and `DesktopToolbarControls` (-284 lines from those alone)
- Verification surfaced "mobile/tablet support" residue → BUG-035 born

**Lesson:** big-component deletes cascade into many imports. Process in same commit.

### Phase 5 (React Hooks)

- BUG-004/005: 12 `set-state-in-effect` + 14 `exhaustive-deps`
- 5-Group classification (Props→State sync / useState init / DOM query / function dep individual fix / etc.)
- ServoTrimDialog TDZ bug surfaced during dep audit; fixed via declaration-order move
- Production verification surfaced pt-PT/zh-TW i18n fallback → BUG-036 born

**Lesson:** Hook rules require per-instance semantic judgment, not blanket fixes.

### Phase 6 (security)

- BUG-020: rate limiter migrated from in-memory Map to Cloudflare KV
- BUG-021: PBKDF2 10k → 100k with prefix-format hash + lazy upgrade
- **Production lockout** when initial deploy used 600k (Workers cap = 100k)
- Hotfix in 4 minutes; 2FA users locked out 3-5 min total
- Memory `evidence_based_runtime_research` born here

**Lesson:** crypto / security code must verify runtime caps before deploy, not just public-spec recommendations.

### Phase 7 (i18n integrated)

- BUG-008/009/015/036: 4 i18n bugs in one Phase
- BUG-009 scope narrowed (X-case): only alert/confirm 14 sites; log 75 lines deferred to BUG-009b
- BUG-036 fixed with 1-line `nonExplicitSupportedLngs: false`
- BUG-009b + BUG-037 born from secondary discovery during scope review

**Lesson:** i18n integrated commits work because partial state breaks the user experience for one language.

### Phase 8 (polish + state refactor)

- BUG-009b: `compileLogMeta` flag-base refactor (59 callsites + 230 translations)
- BUG-011/012/022/023: misc lint, OTTO migration sunset comments, innerHTML → textNode
- bug file 乖離 4 件 (誤 2 + 追加 3 + 不在 1) — old-rule-32 in action

**Lesson:** state machine refactors require all callsites + i18n + verification in same Phase.

### Phase 9 (any 1592)

- BUG-007: 1592 → 0 in 11 categories
- Discovery: 95% were `(Blockly.Msg as any).KEY` — Blockly type already had index signature, casts always unnecessary
- Production verification revealed BUG-038 (pre-existing); diagnostic revert cycle confirmed
- BUG-038 fix shipped same week with `1fdf1a1`

**Lesson:** scope-checking the bug file beats taking it at face value (BUG-007's "block: any" hypothesis was wrong).

### D Phase (BUG-003 children)

- BUG-030: fix-at-source — `utils/classApi.ts:5` lines fixed all 24 callsites
- BUG-031: pre-research found L384 was real latent (bug file said L409 was)
- BUG-033: c: any グレップ found 2 unmentioned callsites
- 030/033 unified commit; 031 isolated commit (auth-critical)

**Lesson:** discriminated union / interface = the epicenter, not callsites. Look upstream first.

### C Phase (mobile residue)

- BUG-035: bug file said 100+ lines; reality 488 (EditorToolbar.tsx 229 lines caller-zero)
- BUG-039/040/041 born during step-by-step verification

**Lesson:** caller-zero detection is a high-value sweep at Phase start.

### C Phase extension (MobileWarning)

- BUG-041: pre-existing, surfaced by step 9 verification
- 3 options compared (overlay / localStorage / removal); user chose C (removal)
- Same commit as the MobileWarning code removal — cascade BUG cleanup

**Lesson:** "remove the feature" is a valid fix when the feature isn't load-bearing.

### A Phase (i18n integrated)

- BUG-024/037/039/040 + 38.md plan
- BUG-039 scope: bug file said 1-3 lines, reality 2,235 translations (1000× scope)
- A-ext supplement caught 153 more after user reported "angle / forward / Red" still English
- Local `wrangler dev` 5-language verification before deploy → no production incident

**Lesson:** key-existence ≠ value-translated. Audit values, not just keys.

### B Phase (data rebuild)

- BUG-029: 33 dead orphan blocks + 7 KNOWN_BROKEN refactors
- Atomic commit including allowlist removal — safety net never lapsed
- net -2186 lines

**Lesson:** rebuild + allowlist-removal in same commit; otherwise gap = silent broken state.

---

## Future Phase planning

When designing a new Phase:

1. **Pattern A** (3-commit): planning doc + atomic fix + post-commit docs. Default for major Phases.
2. **Pattern B** (1-commit integrated): use for data integrity / cascade dead-code.
3. **Pattern C** (isolated commits): use for auth / payment / crypto.
4. **Pattern D** (diagnostic revert): keep in toolkit when uncertain.
5. **Pattern E** (atomic safety-net removal): use when allowlist exists.

Set the pattern in your plan; commit it that way.

---

## Related rules

- `common/05-commit-workflow.md` — primary commit-shape source
- `common/02-design-principles.md` — planning before code
- `common/01-investigation.md` — bug-file = lower bound (consistent with table above)
- `reference/known-pitfalls.md` — specific traps surfaced in these Phases
