# Rule: Commit Workflow — Atomic Commits, Plan / Atomic / Post-Commit Docs

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★
**Scope:** common
**Last reviewed:** 2026-04-26
**Related cases:** All 14 P4 Phases, especially Phase 1.5 / 6 / 9 / D / C / A / B; old-rule-30 (--commit-dirty incident); BUG-038 (diagnostic revert cycle)

---

## TL;DR

1. **Three-commit Phase pattern**: planning doc → atomic fix → post-commit docs. Don't conflate.
2. **Auth / payment / security: 1 bug = 1 commit** (so a single revert restores safety).
3. **Data / refactor / multi-bug: integrate into 1 atomic commit** (so partial state doesn't break invariants).
4. **`git status` clean before deploy.** No `--commit-dirty=true`. Use `scripts/deploy-*.sh` (which enforces this).
5. **Don't amend pushed commits.** New commit instead. Diagnostic revert cycle is fine — leave the trail.

---

## Why this exists

P4 ran 14 Phases over 3 days. The patterns that worked vs. didn't:

**Worked:**
- Phase 1.5 (Stripe migration): 2 commits (migration + Square removal). Independent rollback.
- Phase 6 (security): 3 commits (KV migration + PBKDF2 + hotfix). When 600k caused lockout, hotfix could revert in seconds.
- Phase 7 (i18n, 4-bug integrated): 1 atomic commit (`4e97b21`). Partial deploy would have left translations inconsistent.
- D Phase (BUG-003 子バグ): split into 2 commits — `ef4ec56` for type-only changes (BUG-030/033), `34816fb` for Passkey (BUG-031). Auth-critical isolation.
- B Phase (rebuild): 1 atomic commit `e4860ae` net -2186 lines + KNOWN_BROKEN allowlist removal in **same commit** so safety net never lapsed.

**Didn't work / was risky:**
- old-rule-30 incident (2026-04-10): `--commit-dirty=true` allowed deploys with uncommitted changes; production drifted from git for weeks.
- Phase 9 BUG-038 isolation: required diagnostic revert cycle (`0ef15eb` → `4749246` revert → `af577a2` reapply). Worked, but only because we left the trail in git log.

The pattern crystallized: **commit shape mirrors blast-radius shape.**

---

## When to apply

- Every Phase / fix.
- Before every push.
- When unsure whether to combine or split a change.

---

## How to apply

### The 3-commit Phase pattern

For any Phase touching multiple files:

1. **Planning doc commit** (separate, before any code change)
   - `prompt/maintenance/<NN>_<date>_<phase-name>.md` describing the plan
   - The user reviews this and approves before code starts
   - Example: `717b8ba docs(plan): P4 B Phase 10-B 統合計画書 (37.md)`

2. **Atomic fix commit** (the actual change)
   - All bugs in scope, all related tests, all docs *that the code references*
   - Static checks all green at this commit
   - Example: `e4860ae fix(data): P4 B Phase 10-B — BUG-029 33 dead blocks 削除 + KNOWN_BROKEN 7 件解消`

3. **Post-commit docs** (after production verification)
   - Move BUG file from `発見バグ/` to `修正済みバグ/`
   - Update both index.md files
   - Update `改定log.md`
   - Update `16_次セッション引き継ぎ指示書.md` for next session
   - Example: `0350619 docs(bugs): P4 B Phase 10-B 完了 — BUG-029 修正済みへ + 🎉 active bug = 0 達成`

This gives you a 3-step undo: revert post-commit docs (cosmetic), revert atomic fix (functional rollback), revert plan (admit the plan was wrong).

### When to merge bugs into one atomic commit (integrated)

| Bugs share | Action |
|---|---|
| File set | Integrate (one commit changes all those files coherently) |
| Invariant (e.g., 5-language i18n) | Integrate (partial state is broken) |
| Theme (e.g., dead-code Phase) | Integrate, even across files |
| Discovery context (e.g., i18n batch) | Integrate |

Example: Phase 7 = BUG-008 + 009 + 015 + 036, all i18n, one commit. Phase 4 = 4 dead-code bugs + 25 cascade-deletion sites, one commit. Phase B = BUG-029 + 7 KNOWN_BROKEN entries + allowlist removal, one commit.

### When to split into independent commits

| Property | Action |
|---|---|
| Auth / payment / crypto | Split (rollback granularity matters) |
| Independent failure modes | Split |
| User wants to verify each separately | Split |

Example: D Phase split BUG-031 (Passkey, auth-critical) from BUG-030/033 (type-only). If Passkey verification failed, revert `34816fb` only; keep `ef4ec56`.

### Commit message format (DigiCode convention)

```
<type>(<scope>): <one-line summary>

<optional body, multi-line>

<optional refs to BUG IDs / changelog / commits>
```

Types used:
- `fix(<area>)` — bug fix
- `feat(<area>)` — new feature
- `docs(<area>)` — docs / planning
- `chore(<area>)` — non-functional cleanup
- `build(<area>)` — build / deps / CI

Areas seen: `frontend`, `backend`, `data`, `i18n`, `bugs`, `plan`, `handover`, `maint`.

### Commit attribution under orchestration (2026-08-13)

The parent session makes **all** commits (rule 22 parent-fixed duties — delegates never run git). Attribution:

- Parent's own work / Claude subagent work: the harness's default Claude trailer.
- Different-vendor lane implemented the change: add a co-author trailer for that lane. The exact trailer text is roster data, not rule text — it lives in CLAUDE.md §Team structure, the canonical actor↔trailer mapping.

### Diagnostic revert cycle (for pre-existing bug isolation)

When uncertain whether a regression came from this Phase or pre-existed:

1. `git revert <Phase commit>` → push.
2. Verify in production. Symptom persists?
   - **Yes** → pre-existing. `git revert <revert commit>` → push (reapply Phase).
   - **No** → this Phase caused it. Investigate.
3. **Don't squash** the revert/re-apply. Leave the trail. Cite it in BUG file.

(Real case: Phase 9 → BUG-038 found pre-existing.)

### Orphaned artifacts: delete in declaration commit

After a service cutover (e.g., host process → Docker container), old config dirs, old binaries, and old source trees become orphaned. **Do not delete them immediately after cutover.** Retain them through the soak period (rollback window). Delete them in the declaration / post-commit-docs commit — the final commit after production is confirmed healthy for the soak duration. Reason: if rollback is needed during soak, the orphaned artifacts are harmless but may be referenced in rollback scripts.

Example: 45.md Phase 2 cutover left `/opt/digicode-compile/{libs,templates,api,config}` (50.5 MB) on ML30. Deleted in Phase 4 declaration commit after 30+ min soak verified.

### Never use `stash` / `checkout` / `reset` to *read* something

Those commands move the working tree. Reading is not a reason to move it, and under orchestration the tree may be holding another lane's uncommitted output.

- To see a previous state, use commands that do not touch the tree: `git show <ref>:<path>`, `git diff`, `git cat-file`, or a copy in a scratch directory.
- **The danger is not the common case.** `stash push` followed by a successful `pop` leaves no trace of the risk it took; the loss only appears when the `pop` conflicts, and by then the delegate's work is inside a stash entry. (Origin: LaserEditor case 94 — a read-only comparison was done with `stash push`/`pop` over a tree carrying another lane's uncommitted implementation, while a safe scratch snapshot of the same diff had *already been taken*.)
- If a tree-moving command is genuinely required, verify the restore by checksum rather than by the absence of an error.

### A new persistent directory carries a `.gitignore` decision, in the same commit that creates it

The moment you introduce a directory that will hold generated or runtime data — uploads, ingest queues, caches, exports, logs, test-harness results — decide whether git tracks it, and write that decision down then. Do not wait for `git status` to tell you.

- **Look at how the existing siblings are handled.** If every other `data/*` path is already ignored, the new one is not the exception; the precedent is right there and cheaper to copy than to rediscover.
- **Sweep for the same shape when you find one.** The session that filed this had a second unignored results directory from earlier the same day.
- The stake is not tidiness. Where runtime data can include user- or participant-derived content, an untracked-but-uncommitted directory is one `git add -A` away from becoming a published one — and on a public repo that is not recoverable by deleting the file later.

(Origin: LaserEditor case 91 — `data/ingest/` was created and used in a real run; `?? data/ingest/` in `git status` was the first notice, and the repo's own gate forbids tracking participant-derived data.)

### Pre-push checklist

```bash
# 1. Status clean (or only the intended changes staged)
git status

# 2. Static checks (frontend + backend + i18n)
# (See common/04-testing-strategy.md)

# 3. Diff sanity-check (don't commit accidental scratch files)
git diff --staged

# 4. Commit message conforms
# 5. Push
git push
```

### What NOT to deploy with

- `--commit-dirty=true` — never. The flag's existence enables drift between git and prod.
- `git commit --amend` on already-pushed commits — never (unless explicitly authorized).
- `git push --force` to main/master — never warn-then-execute; ask first.
- Skipping pre-commit hooks (`--no-verify`) — never unless user explicitly says so.

---

## Anti-patterns

### ❌ Mega-commit "Phase 9 done"

```
Bad: 53 files / +1664 / -1606 with one message.
Good: split: (a) sed-replaceable Msg pattern, (b) Mutator interface refactors, (c) test fixture updates.
```

(BUG-007's actual commit was big because the change is uniform — sed-replaceable, low risk per site. But if it had been heterogeneous, splitting was right.)

### ❌ Combining post-commit docs with the fix

```
Bad: one commit = code change + index.md update + 改定log + 16.md.
Good: separate post-commit-docs commit. Then if the fix has to roll back, the docs roll back too — atomically.
```

### ❌ Amending after push

```
Bad: pushed → realized typo in message → git commit --amend → git push --force.
Good: pushed → realized typo → make a follow-up commit ("docs: fix typo in commit message") OR live with it.
```

### ❌ Squashing a diagnostic revert cycle

The revert / reapply trail in git log is *informative*. It tells future Claude "this Phase was suspected, then cleared." Don't hide it.

---

## Related rules

- `common/02-design-principles.md` — planning doc commit goes here
- `common/04-testing-strategy.md` — pre-push static checks
- `common/12-collaboration.md` — wait for "implementation start" before atomic fix commit
- `digicode/05-deploy.md` — DigiCode-specific deploy commands enforce git-clean
- `reference/phase-patterns.md` — full table of P4 commit shapes by Phase
