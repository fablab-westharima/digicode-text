# Rule: Dependency Upgrade — CHANGELOG First, API-Rename Full-Grep

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★
**Scope:** common
**Last reviewed:** 2026-04-26
**Related cases:** BUG-031 (SimpleWebAuthn v13 — credential.id rename Uint8Array → Base64URLString), BUG-032 (Stripe v22 — Invoice.subscription removal), BUG-033 (Cloudflare types — ScheduledEvent → ScheduledController), BUG-034 (Stripe API version pinned at 2018)

---

## TL;DR

1. **Read the CHANGELOG before bumping.** Yours, the SDK's, and any service's API-versioning page.
2. **Every API rename → full-codebase grep.** The compiler may not catch shape-equivalent renames; the runtime may silent-coerce until it doesn't.
3. **For services with versioned APIs (Stripe, Twilio): track 3 versions** — what your account default is, what your webhook endpoints are pinned to, what the SDK targets. Migrate them in lockstep.
4. **A bug file's "the latent issue is at line N" is a hypothesis.** Confirm by reading the official CHANGELOG yourself before fixing.

---

## Why this exists

### BUG-031 (Phase D, SimpleWebAuthn v13)

Bug file: "the latent runtime bug is at line 409 (`generateRefreshToken(2-arg call)`)."

Web research of v13 CHANGELOG: line 409 was actually fine — JS silently dropped extra arguments. The **real** API-violation was at **line 384**: `credential.id` had been renamed `Uint8Array → Base64URLString` in v13. The library's internal coercion masked this at runtime, but was scheduled for removal in a future minor.

If we'd trusted the bug file, we'd have shipped a fix that didn't address the real issue, and v13.x.next would have broken Passkey login silently.

### BUG-032 / BUG-034 (Phase 1.5, Stripe)

Stripe SDK v22 typed for `2024-09-30.acacia`+. Webhook endpoint pinned at `2018-02-28`. Account default API version pinned at `2018-02-28` (set on first API call ~8 years ago, never updated). Three layers, three different versions.

- Type-check error in webhook handler: `Invoice.subscription` doesn't exist on `Stripe.Invoice` (SDK v22 type)
- Runtime: webhook delivers 2018-format payload with `subscription` present
- Code reads `invoice.subscription` via `(invoice as unknown as { ... }).subscription` cast
- Silent fail mode: code expects modern `invoice.parent.subscription_details.subscription` path, doesn't find it, returns undefined, no event processed

Migration required:
1. Recreate webhook endpoint (existing endpoint's API version is immutable)
2. Update account default API version
3. Defensive helper handling both shapes (rollback safety)
4. D1 migration to drop residual Square columns (caught in same Phase since Stripe ↔ Square decision was bundled)

### BUG-033 (Phase D, Cloudflare types)

`@cloudflare/workers-types ^4.20251121.0` renamed:
- `ScheduledEvent` → `ScheduledController` (matches `ExportedHandlerScheduledHandler<Env>` signature)
- Various other internals

Bug file mentioned 4 errors. Full grep found 6 (2 unmentioned `c: any` sites in classes.ts/submissions.ts). All resolved together.

---

## When to apply

- Bumping any direct dependency.
- Bumping a transitive dependency that affects type definitions.
- Updating an external service's account-level API version.
- Recreating a webhook endpoint.
- Migrating between major versions.

---

## How to apply

### Step 1 — Locate the source of truth for breaking changes

| Source | Where |
|---|---|
| Library's CHANGELOG.md | usually in repo root or `node_modules/<pkg>/CHANGELOG.md` |
| Library's GitHub Releases | https://github.com/<org>/<repo>/releases |
| Service's API upgrades page | e.g., https://docs.stripe.com/upgrades |
| Account-level API setting | service's dashboard (Stripe Workbench, etc.) |
| Webhook endpoint pinning | service's dashboard, individual endpoint detail |
| Cloudflare runtime versioning | https://developers.cloudflare.com/workers/configuration/compatibility-dates/ |

### Step 2 — Enumerate breaking changes

Scan the CHANGELOG for the version range you're crossing. Categorize:

| Category | Action |
|---|---|
| **Type-only** (rename, signature tweak) | Full grep for old name; rename all sites; expect type errors before |
| **Runtime + Type** (rename of a value used in payload/wire) | Full grep + verify payload format alignment |
| **Removal** | Find replacement; defensive helper if both shapes will coexist during transition |
| **Default change** (e.g., default model, default timeout) | Decide explicit value; add comment noting old default |
| **Behavior change** without API change | Reproduce locally; write a regression test if possible |

### Step 3 — Full-codebase grep

```bash
# For each renamed/removed symbol
grep -rn "<old-name>" src/ esp32-blockly-backend/src/ scripts/ \
  --include="*.ts" --include="*.tsx" --include="*.js"

# For SDK type names that are commonly referenced
grep -rn "Stripe\.Invoice\.subscription\|invoice\.subscription" esp32-blockly-backend/src/

# For Webhook payload field names
grep -rn "subscription_details" esp32-blockly-backend/src/

# For deprecated API surface
grep -rn "<DeprecatedClass>\|<deprecatedFunction>" .
```

Document hits in a table with line numbers and decisions.

### Step 4 — Versioned-service triple alignment

For Stripe, Twilio, etc., check all three:

```
SDK targeted API version
   ↑
   |  Should be aligned
   ↓
Webhook endpoint API version
   ↑
   |  Should be aligned
   ↓
Account default API version
```

When they're not aligned (the typical state when first picking up a project):

1. Plan migration order:
   - Update **code** to the SDK's target version, with defensive helpers for the old format
   - **Deploy**
   - Update **webhook endpoint** (or recreate, if the version is immutable)
   - Update **account default**
   - Optionally: remove defensive helpers in a follow-up

2. Or if all three need to move atomically: do all in one Phase (Phase 1.5 example), keep defensive helpers as permanent rollback safety.

### Step 5 — Defensive helper for transition periods

```typescript
// Handles both 2018-02-28 and 2026-03-25.dahlia payload shapes.
// Kept after migration as runtime safety; rollback path remains open.
function extractInvoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  // Modern path
  const modern = invoice.parent?.subscription_details?.subscription;
  if (modern) return typeof modern === 'string' ? modern : modern.id;
  // Legacy path (SDK type doesn't expose; cast safely)
  const legacy = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (legacy) return typeof legacy === 'string' ? legacy : legacy.id;
  return undefined;
}
```

`as unknown as { ... }` instead of `as any` keeps the cast scope-limited and explicit.

### Step 6 — Write the migration record

In the BUG file or commit message:

```
- SDK upgrade: Stripe v22.0.0 → v22.0.1
- API version: account default 2018-02-28 → 2026-03-25.dahlia
- Webhook endpoint: charismatic-breeze (2018-02-28) → whimsical-serenity (2026-03-25.dahlia)
- Code changes:
  - extractInvoiceSubscriptionId helper (handles both shapes)
  - apiVersion explicitly pinned at construction
- Rollback: revert account default in dashboard; defensive helper continues working without code change
```

This is the contract for future you: how to undo.

### Step 7 — Production smoke test (auth/payment-critical)

After deploy:
- Stripe CLI test mode: `stripe trigger invoice.payment_failed` etc.
- Real auth: log in, log out, refresh token, run a purchase test (test mode if possible)
- Watch service dashboard for delivery success rate

---

## Anti-patterns

### ❌ "It type-checks → it works"

```
Bad: SDK v13 type-checks → ship.
Good: SDK v13 type-checks + CHANGELOG read + payload-format verified + grep for renames + production smoke test → ship.
```

### ❌ Trusting the bug file's "this line is the latent issue"

```
Bad: bug file says line 409 → fix line 409 → ship.
Good: bug file says line 409 → read CHANGELOG → discover line 384 is the actual API violation → fix line 384 (line 409 turns out to be a non-issue) → ship.
```

(Real case: BUG-031.)

### ❌ Updating just one of three versioned layers

```
Bad: bump SDK → deploy → webhook endpoint still pinned old → silent fail.
Good: align SDK + endpoint + account default; defensive helper as transition safety.
```

### ❌ "Only the obvious file uses this symbol"

```
Bad: grep one file, see usage, fix it, ship.
Good: grep all dirs (src/, scripts/, esp32-blockly-backend/, tests, examples), document all hits, fix all in one Phase.
```

(Phase D BUG-033: 4 documented hits, grep found 6.)

---

## Related rules

- `common/01-investigation.md` — full-codebase grep methodology
- `common/03-coding.md` — `as unknown as T` pattern for defensive casts
- `common/04-testing-strategy.md` — high-risk-tier triage; payment changes need pre-deploy local test
- `common/05-commit-workflow.md` — auth/payment changes get isolated commits
- `common/09-runtime-research.md` — pre-deploy spec verification for runtime APIs
- `digicode/11-workers-constraints.md` — known Cloudflare runtime caps (overlaps with this rule)
