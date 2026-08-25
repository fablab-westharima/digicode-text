# Rule: Coding — Type Safety, Naming, Comments, Fix-at-Source

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★
**Scope:** common
**Last reviewed:** 2026-04-26
**Related memory:** `quality_over_tokens`
**Related cases:** BUG-007 (any 1592 → 0), BUG-010 (`@ts-ignore` → `@ts-expect-error`), BUG-030 (fix-at-source 24 sites in 5 lines)

---

## TL;DR

1. **No `any`.** Use real types. If a 3rd-party type is wrong, use `as unknown as T` or `eslint-disable` with a one-line reason.
2. **`@ts-expect-error`, never `@ts-ignore`.** The former tells you when the workaround is no longer needed.
3. **Comments only when WHY is non-obvious.** Don't narrate WHAT the code does — well-named identifiers do that.
4. **Fix at source.** When 24 call sites have the same type error, fix the type definition (5 lines), not the call sites (24 sites). Discriminated unions / interfaces are the epicenter — check there first.
5. **Don't reference the current task in comments.** ("Used by X", "added for Y flow") — those rot. PR description is the place.

---

## Why this exists

- **BUG-007:** 1592 ESLint `no-explicit-any` violations, 95% (`(Blockly.Msg as any).KEY`) caused by old block templates. The Blockly type *already* had an index signature — every cast was unnecessary technical debt that propagated.
- **BUG-030:** 24 `c.json(body, status)` TS2769 errors. Fixing each call site = 24 edits. Fixing the type definition (`ClassApiResult.status: number → ContentfulStatusCode`) at `utils/classApi.ts:5` = **all 24 errors gone**. Discriminated union narrowing did the work.
- **BUG-010:** 3 `@ts-ignore` for Chrome 138 PNA API. Replaced with `@ts-expect-error -- remove when TypeScript adds targetAddressSpace to RequestInit`. When TypeScript ships the fix, this *errors out* and forces cleanup. `@ts-ignore` would silently rot.
- **Comment rot:** comments like `// added for Step 5.5 student flow` become misleading after refactoring. Even worse: file-level commit metadata in JSDoc.

---

## When to apply

- Any code change.
- Reviewing existing code in passing.
- Deciding whether to add a comment.

---

## How to apply

### Type safety

Default: write the real type.

```typescript
// Bad
function handleEvent(event: any) { ... }

// Good
function handleEvent(event: MouseEvent) { ... }
```

When 3rd-party types are wrong:

```typescript
// Library type lies about return:
const value = lib.getValue() as unknown as RealType;  // explicit cast, locally scoped

// Library API has no public type at all:
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Blockly internal API: Workspace.isDisposed() not in public type
const isDisposed = (workspace as any).isDisposed();
```

The reason in the eslint-disable comment is mandatory — it's a future-you (or another Claude) reading.

For `@ts-ignore` situations:

```typescript
// Bad
// @ts-ignore - Chrome 138 thing
fetch(url, { targetAddressSpace: 'local' });

// Good
// @ts-expect-error -- Chrome 138+ Private Network Access. Remove when TypeScript adds targetAddressSpace to RequestInit.
fetch(url, { targetAddressSpace: 'local' });
```

### Fix at source

When a type error appears in many call sites, **inspect the type origin first**.

```typescript
// 24 call sites have:
return c.json(apiResult.body, apiResult.status);
// TS2769: 'number' not assignable to 'ContentfulStatusCode'

// Bad: cast at every call site
return c.json(apiResult.body, apiResult.status as ContentfulStatusCode);  // x24

// Good: narrow the type at the source (5 lines in utils/classApi.ts)
export type ClassApiResult =
  | { ok: true; status: ContentfulStatusCode; body: unknown }  // was: number
  | { ok: false; status: ContentfulStatusCode; error: string }; // was: number

// And one cast where Response.status (Fetch API) crosses the boundary:
return { ok: true, status: res.status as ContentfulStatusCode, body };
```

When you see a discriminated union or interface that touches many sites, that's the candidate epicenter. Confirm with `grep` before deciding the strategy.

### Bulk replace — count immediately after, in the same turn

Fix-at-source often means one `replace_all` / `sed` across a file. The edit tool reports how many it changed, not how many it *should* have changed, so an over-broad pattern lands silently and the diff looks like exactly what you asked for.

**Count the affected identifier straight after the replacement, before doing anything else.** (Origin: LaserEditor S015 — a `.split` replacement across the admin bundle reached an unrelated import screen and produced duplicate DOM ids; a `grep -c` run immediately after returned 2 where 1 was expected, and the whole thing was reverted and redone inside the same turn. Detection cost: one command. Had it shipped, the symptom would have been a screen that silently stopped working, days later, with no connection to this edit.)

- Scope the pattern as narrowly as the language allows — whole tokens, with their call parens or leading dot plus a following boundary (see rule 01 Step 3b: substring matches invent members of a set).
- After the replace: `grep -c` the new form and the old form. New count = expected, old count = 0. Any surprise is a collateral hit, not a rounding error.
- Where the replaced thing has an identity that must stay unique (DOM ids, route names, keys), count *uniqueness*, not occurrences.

### Comments

Default: no comment.

Add a comment **only when removing it would confuse a future reader**. Reasons that qualify:
- Hidden constraint (e.g., "must run before middleware X because Y")
- Subtle invariant (e.g., "this Map is keyed by lowercased email")
- Workaround for a specific bug (cite the BUG ID or commit)
- Surprising behavior

Reasons that don't qualify:
- Restating what the code does
- Marking the current task ("for Phase X", "added for issue Y")
- "TODO: handle edge case" without specifying what

```typescript
// Bad: restates code
// Filter users by active status
const active = users.filter(u => u.active);

// Bad: task-marked, will rot
// Added for Phase 7 i18n cleanup
const t = useTranslation();

// Good: hidden constraint
// Must run before localeMiddleware — sets c.req.raw.headers used by it.
app.use('*', cors({ ... }));

// Good: subtle invariant
// Keyed by lowercased email. Login lookup must lowercase first.
const sessions = new Map<string, Session>();

// Good: workaround citation
// BUG-021 hotfix: Workers crypto.subtle caps PBKDF2 at 100k iterations.
const DEFAULT_ITERATIONS = 100_000;
```

### Naming

- Functions: verb-led (`getUserPlan`, not `userPlan`).
- Booleans: `is`/`has`/`can` prefix (`isAdmin`, `canUseAi`).
- Avoid abbreviations except very common ones (`url`, `id`, `db` ok; `usrMgr` not).
- Match existing conventions in the file. Don't introduce new style locally.

### Commit / PR description vs. comments

Use commit message and PR description for *why we made this change*. Use code comments for *why this code is the way it is*. They're different things.

---

## Anti-patterns

### ❌ `any` for laziness

```typescript
// Bad
function handler(c: any) { ... }
// → loses generic type narrowing on c.env / c.get later

// Good
function handler(c: Context<{ Bindings: Bindings; Variables: Variables }>) { ... }
```

(This was BUG-033 副次発見: `c: any` × 3 in classes.ts/submissions.ts.)

### ❌ Comments that describe the *wrong code*

```typescript
// Bad: comment says one thing, code does another
// Filter only public products
const products = items.filter(i => i.status === 'active');  // not "public" — "active"

// Good
const products = items.filter(i => i.status === 'active');
```

If you can't write a comment that matches the code, the code probably needs rewriting (or the comment is wrong).

### ❌ Deleting `_unused` prefix renames

If you removed code that took an unused arg `_x`, don't rename remaining uses of `x` to `_x` "for consistency". Either it's used or it isn't — eslint flags both.

### ❌ Re-export shims for moved types

```typescript
// Bad: kept in old location for "backwards compatibility"
// types/old.ts
export type { User } from './user';  // 0 callers in this file actually

// Good: delete the re-export, fix all imports to point to ./user directly.
```

This was the spirit of Phase 4 (BUG-006 etc.). The re-exports become dead surface.

---

## Orchestration: this rule travels with every implementation delegation

(2026-08-13, rule 22.) A delegated implementer (Codex via MCP, implementer subagent) cannot read this directory. This rule's conventions reach it through exactly two channels, both parent-maintained:

1. **AGENTS.md** (standing conventions — generated from this rule's TL;DR via `global/templates/AGENTS-template.md`; regenerate in the same commit when this rule changes).
2. **The delegation packet** (per-task: this rule's TL;DR plus any domain rules the task touches).

Dispatch transfers the enumerated technical scope to the delegate until its result/capsule closes.
During that window the parent performs **no same-scope shadow execution**: no duplicate
investigation, grep/source survey, diagnosis, implementation, tests, reproduction, verification, or
falsification. Waiting permits user communication, orchestration metadata, work outside the active
scope, and preparation of the next packet's form — never duplicate technical work. The parent may
perform rule 22's bounded deliverable review after receipt and verifies conformance through the
evidence contract; delegation does not outsource conventions or integration authority.

## Related rules

- `common/01-investigation.md` — confirm scope before fixing
- `common/06-dead-code-removal.md` — when to delete unused code
- `common/11-dependency-upgrade.md` — `@ts-expect-error` shines here
- `digicode/11-workers-constraints.md` — concrete `@ts-expect-error` use cases
