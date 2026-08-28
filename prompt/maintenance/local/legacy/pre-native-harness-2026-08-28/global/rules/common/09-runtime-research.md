# Rule: Runtime Research — Pre-Deploy Spec Verification, Node.js ≠ Edge

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★★
**Scope:** common
**Last reviewed:** 2026-04-26
**Related memory:** `evidence_based_runtime_research`
**Related cases:** BUG-021 (PBKDF2 lockout, 3-5 min downtime), BUG-031 (SimpleWebAuthn v13 actual API change), BUG-032 (Stripe Invoice.subscription removal), BUG-034 (Stripe API pinned to 2018)

---

## TL;DR

1. **Local Node.js success ≠ production runtime success.** Edge runtimes (Cloudflare Workers, Deno Deploy, Vercel Edge) have *implementation caps* not in public spec.
2. **Before crypto/auth/runtime-API code: verify the runtime actually supports your parameters.** Public docs / GitHub issues / Cloudflare community first. Then write code.
3. **Don't trust a 3rd-party SDK's bundled defaults match your wire-format expectation.** Stripe SDK v22 typed for `2024-09-30.acacia`; webhook endpoint pinned at `2018-02-28`. Runtime drift is silent.
4. **The 3 numbers to know:** OWASP / library *recommended*, the *runtime cap*, the *project's chosen* value. Track all three.

---

## Why this exists

- **BUG-021 production lockout (2026-04-24, ~3-5 min downtime, all 2FA users):** Code used PBKDF2 iterations = 600,000 (OWASP 2023 recommended). Local Node.js `crypto.pbkdf2Sync` succeeded. Cloudflare Workers `crypto.subtle.deriveBits` **caps PBKDF2 iterations at 100,000** — undocumented in Workers public docs. Deploy succeeded; runtime threw `NotSupportedError`. Hotfix `d7b9ee8` reduced to 100k.
  - User feedback after: "Don't rely on the handover doc alone — pull evidence from public docs / Web yourself."
  - Memory `evidence_based_runtime_research` was created here.
- **BUG-031 SimpleWebAuthn v13 (Phase D):** bug file pointed at line 409 (`generateRefreshToken`) as the latent bug. Web research of the actual v13 CHANGELOG revealed the **real** issue was line 384: `credential.id` rename `Uint8Array → Base64URLString`. v13's internal coercion masked it (and was due to be removed). Without the CHANGELOG check, the project would have shipped the rename break.
- **BUG-032/BUG-034 Stripe pinning (Phase 1.5):** Stripe SDK v22 typed for the new API; webhook endpoint pinned at 2018-02-28 because the ACCOUNT API version had been pinned at first-API-call time and never updated. Wire format mismatch silently worked because runtime delivered 2018 payloads while types expected current. Migration required webhook-endpoint recreation (the API version is immutable on existing endpoints).

Pattern: when a stack involves SDK + runtime + service + webhook, version drift accumulates silently. Pre-deploy verification is the only insurance.

---

## When to apply

- Adding code that calls `crypto.subtle.*` or other Web Crypto.
- Adding code with explicit numeric parameters (iterations, key length, timeout).
- Upgrading an SDK that talks to an external service via webhook.
- Using anything Edge-specific: Cloudflare KV / Durable Objects / R2 / D1 / Workers Bindings.
- Authenticating, signing, encrypting.
- Anything where local-only test would deceive you.

---

## How to apply

### Step 1 — Identify the 3 numbers

For numeric parameters (iterations, sizes, timeouts):

| Source | Example: PBKDF2 iterations |
|---|---|
| **OWASP / library recommended** | OWASP 2023: 600,000 |
| **Runtime cap** | Cloudflare Workers: 100,000 |
| **Project chosen** | DigiCode: 100,000 (Workers cap) |

Track all three in a comment near the constant:

```typescript
// PBKDF2 iterations.
// OWASP 2023 recommends 600,000.
// Cloudflare Workers crypto.subtle caps at 100,000 (BUG-021 hotfix d7b9ee8).
// Future migration to argon2id (@noble/hashes) for OWASP 2023 compliance — BUG-043.
const DEFAULT_ITERATIONS = 100_000;
```

### Step 2 — Pre-deploy: official-source verification

For runtime-sensitive code, search **before writing**:

```
1. Cloudflare Workers official docs:
   - https://developers.cloudflare.com/workers/runtime-apis/web-crypto/
   - Limits page: https://developers.cloudflare.com/workers/platform/limits/
2. GitHub issues on the cloudflare/workerd repo:
   - https://github.com/cloudflare/workerd/issues
3. Cloudflare Community / Stack Overflow:
   - "Cloudflare Workers PBKDF2 iterations"
4. MDN for Web Platform standard fallback:
   - https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits
```

Document findings in the BUG file or commit message. "Verified PBKDF2 100k cap via Cloudflare Community thread #12345" is enough.

### Step 3 — Pre-deploy: local emulation test

Use the runtime's emulator, not generic Node.js:

```bash
# Cloudflare Workers — miniflare via wrangler dev
cd esp32-blockly-backend
npx wrangler dev --local

# Run scenarios that exercise the new code with curl
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'

# Cleanup
lsof -ti:8787 | xargs kill -9
```

For 5-language i18n: test with `Accept-Language` header for each:

```bash
for lang in ja en es pt-PT zh-TW zh-CN pt-BR; do
  curl -s -H "Accept-Language: $lang" http://localhost:8787/api/auth/login -d '{}' | jq -c '.error'
done
```

(Real case: A Phase A-2 BUG-024 — verified 5-language + prefix-match before deploy. Avoided BUG-021-style lockout.)

### Step 4 — Document the runtime cap if newly discovered

If you discover a cap not in public docs, add it to:

- `digicode/11-workers-constraints.md` (DigiCode-specific known caps)
- `reference/known-pitfalls.md` (general runtime traps)
- Commit message + BUG file

So the next Claude / dev doesn't re-discover it.

### Step 5 — SDK / webhook drift checks

When upgrading an SDK that talks to an external service:

| Check | Tool / Method |
|---|---|
| What API version does the SDK target by default? | Read `node_modules/<sdk>/.../apiVersion.js` or `package.json` defaults |
| What version does my webhook endpoint receive? | External service's dashboard (Stripe Workbench, etc.) |
| Are they aligned? | If not, plan migration: usually webhook needs recreation |
| What deprecations / removals are between them? | SDK CHANGELOG.md and the service's API upgrade docs |
| Defensive coding for transition period? | Helper function handling both old + new payload shapes |

Real example from BUG-034:
```typescript
// Defensive: handles both 2018-02-28 and 2026-03-25.dahlia payload shapes.
// Kept after migration as runtime safety; rollback path remains open.
function extractInvoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  // dahlia path
  const modern = invoice.parent?.subscription_details?.subscription;
  if (modern) return typeof modern === 'string' ? modern : modern.id;
  // 2018-02-28 path (SDK type doesn't expose it; cast safely)
  const legacy = (invoice as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  if (legacy) return typeof legacy === 'string' ? legacy : legacy.id;
  return undefined;
}
```

### Step 6 — Crypto / auth changes get production smoke test

After deploy:

1. Static checks ✅
2. Local `wrangler dev` ✅
3. Production deploy
4. **Immediate** smoke test on production:
   - One auth flow end-to-end
   - One crypto operation (e.g., login → password verify → token issued)
5. If symptoms → revert in 30 seconds (memory `local_vs_prod_testing_policy`'s "high risk" tier)

Don't deploy crypto changes Friday night.

---

## Anti-patterns

### ❌ "Public docs say it works"

```
Bad: OWASP says 600k → set 600k → deploy.
Good: OWASP says 600k → check Cloudflare Workers cap = 100k → set 100k → document why.
```

### ❌ Local Node `crypto` test as the only verification

```
Bad: const hash = crypto.pbkdf2Sync(...600000...) → "looks fine in Node" → deploy.
Good: Use wrangler dev with miniflare → test the *Workers* crypto.subtle path → deploy.
```

### ❌ Trusting SDK type without verifying wire format

```
Bad: SDK type says invoice.parent.subscription_details.subscription → use it → silent fail in prod.
Good: Verify webhook endpoint API version matches SDK target → migrate one or both → defensive helper for transition.
```

### ❌ Not noting the cap when you find it

```
Bad: "Discovered PBKDF2 caps at 100k. Working around it." → forget → next Claude redoes the discovery.
Good: BUG file + reference/known-pitfalls.md + comment near the constant.
```

---

## Known runtime caps (DigiCode-relevant, current as of 2026-04-26)

| Runtime | API | Cap |
|---|---|---|
| Cloudflare Workers | `crypto.subtle.deriveBits` PBKDF2 iterations | 100,000 max |
| Cloudflare Workers | CPU time per request (paid plan) | 30 s |
| Cloudflare Workers | Memory | 128 MB |
| Cloudflare Workers | KV `put` / `delete` ops/sec | 1,000/s/namespace |
| Cloudflare Workers | KV value size | 25 MB |
| Cloudflare Workers | D1 single statement size | (verify when needed) |
| Cloudflare D1 | Total DB size | 10 GB hard limit |
| Cloudflare Pages | Build time | 20 min |

When you encounter a new one, add it here AND to `digicode/11-workers-constraints.md`.

---

## Related rules

- `common/04-testing-strategy.md` — high-risk-tier triage decides when this rule fires
- `common/11-dependency-upgrade.md` — SDK upgrade workflow includes Step 5 here
- `digicode/11-workers-constraints.md` — full DigiCode known-cap registry
- `reference/known-pitfalls.md` — quick lookup of past traps
