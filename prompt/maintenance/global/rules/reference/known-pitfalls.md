# Reference: Known Pitfalls — Library / Runtime Traps

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Audience:** Claude (lookup before adopting / upgrading anything in this list)
**Last reviewed:** 2026-04-26

---

## TL;DR

This is a flat lookup of "if you're touching X, here's a known gotcha." Read the relevant entry before designing the fix.

---

## Cloudflare Workers

### `crypto.subtle.deriveBits` PBKDF2 iteration cap

**Cap:** 100,000 max
**Public docs say:** ❌ undocumented
**Symptom:** `NotSupportedError: Pbkdf2 failed: iteration counts above 100000 are not supported (requested N).`
**Action:** use 100,000; for OWASP 2023 (600k) compliance, migrate to argon2id (`@noble/hashes/argon2`) — BUG-043
**Reference case:** BUG-021 (production lockout 2026-04-24, 3-5 min downtime)

### `ScheduledEvent` → `ScheduledController` rename

**Where:** `@cloudflare/workers-types ^4.20251121.0`
**Symptom:** `ExportedHandlerScheduledHandler<Env>` signature mismatch
**Action:** rename `_event: ScheduledEvent` → `_controller: ScheduledController`; remove generic on `ExecutionContext`
**Reference case:** BUG-033

### `TextEncoder().encode()` returns `Uint8Array<ArrayBufferLike>`

**Where:** TypeScript 5.7+ stdlib
**Symptom:** `Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'Uint8Array<ArrayBuffer>'`
**Action:** repack with `new Uint8Array(new TextEncoder().encode(s))`
**Reference case:** BUG-031 (SimpleWebAuthn v13 strict typing)

### CPU time / memory limits

**Cap:** Free 10ms / Paid 30s CPU; 128 MB memory
**Action:** for long-running work (e.g., batch translations), use Durable Objects or break into chunks; don't just pray

---

## i18next

### `nonExplicitSupportedLngs: true` reverse-direction reduce

**Where:** i18next config
**Symptom:** `pt-PT` / `zh-TW` selected by user, UI displays in English (fallbackLng)
**Cause:** When `supportedLngs` lists explicit 5-letter codes, `nonExplicitSupportedLngs: true` triggers an undocumented variant→main reduce. `pt-PT` reduces internally to `pt`, which isn't in `supportedLngs`, fallback fires.
**Action:** set `nonExplicitSupportedLngs: false` (or omit; default is false). 1-line fix.
**Reference case:** BUG-036; memory `i18next_explicit_variants`

### `load: 'currentOnly'` vs `'all'`

**Setting:** keep `currentOnly` for explicit 5-letter codes; `all` may try to load parent codes (e.g., `pt`) and fail
**Reference case:** BUG-036 design context

---

## React / Hooks

### setState bailout (same-value no-op)

**Cause:** `setState(currentValue)` is a React optimization — no re-render, no `useEffect` re-fire.
**Symptom:** state machine flag stuck because the effect that resets it doesn't re-fire
**Action:** add an early-return guard in the handler before flag-set: `if (newValue === currentValue) return;`
**Reference case:** BUG-038; memory `setstate_bailout_flag_stuck_antipattern`

### Duplicate event sources (events fire on same value)

**Sources:**
- i18next `languageChanged` (e.g., login preferred-lang re-apply)
- Blockly workspace `change` (UI events fire constantly)
- `matchMedia` `change` (re-fire on layout-thrash)
- `WebSocket.onmessage` (server may resend)
- Redux/Zustand subscription (action without state change still fires)

**Action:** treat duplicate events as the norm; guard with bailout check

### `useRef<T>(initial)` vs `useState(() => initial)`

**Pitfall:** `useRef<T>(initial)` evaluates `initial` on every render (constructor), `useState(() => initial)` evaluates lazily once.
**Symptom:** `useRef<number>(Date.now())` — current time captured on first render, but the constructor runs on every render → spurious work
**Action:** use `useRef<T | null>(null)` + `useEffect(() => { ref.current = initial(); }, [])` for lazy init
**Reference case:** BUG-012 SerialPlotter:57 fix in Phase 8

### Nested component definition

**Pitfall:** defining a component inside another component (`const Inner = () => ...`)
**Symptom:** new function reference per render → child unmounts/remounts → state loss
**Action:** define at module level or inline JSX
**Reference case:** BUG-012 EditorToolbar:40 fix in Phase 8

### `tsc` ESLint v9 unused directives

**Pitfall:** ESLint v9 may merge / remove rules; `// eslint-disable-next-line <rule>` may become unused
**Symptom:** "Unused eslint-disable directive" warning
**Action:** remove the directive when the underlying rule is no longer flagging
**Reference case:** BUG-012 DeviceSelectDialog:152, 319 in Phase 8

---

## Stripe

### Account API version pinned at first-API-call time

**Pitfall:** Stripe pins your account default API version to the version at your first API call. Years later, your SDK and webhook may all be on different versions.
**Symptom:** SDK type says `Invoice.parent.subscription_details.subscription`; runtime delivers 2018-format payload with `Invoice.subscription`; silent fail
**Action:** check 3 versions (SDK target, webhook endpoint, account default); align them via webhook recreation + account update
**Reference case:** BUG-032/034; memory `project_stripe_webhook_legacy_api_2018`

### Webhook endpoint API version is immutable

**Pitfall:** existing endpoints can't have their API version changed
**Action:** recreate the endpoint with desired version; update Workers Secret to new signing secret; verify; delete old
**Reference case:** Phase 1.5 (`charismatic-breeze` → `whimsical-serenity`)

### `Invoice.subscription` removed in modern Stripe API

**Pitfall:** SDK v22+ types don't expose `Invoice.subscription`
**Action:** use `Invoice.parent?.subscription_details?.subscription` for modern; defensive helper for legacy compat
**Reference case:** BUG-032

---

## SimpleWebAuthn

### v13: `@simplewebauthn/types` package gone

**Pitfall:** package was merged into `@simplewebauthn/server`
**Symptom:** `Cannot find module '@simplewebauthn/types'`
**Action:** import types from `@simplewebauthn/server` directly
**Reference case:** BUG-031

### v13: `credential.id` rename `Uint8Array` → `Base64URLString` (string)

**Pitfall:** `verifyRegistrationResponse({ credential: { id: ..., publicKey: ..., counter: ... } })` — `id` field type changed
**Symptom:** runtime works (v13 internally coerces from Uint8Array) but is scheduled for removal
**Action:** convert credential ID to string (Base64URLString) at the call site
**Reference case:** BUG-031 (the *real* latent bug; bug file pointed at the wrong line)

### v13: `generateRefreshToken(payload, secret)` — actually 0-arg

**Pitfall:** legacy code passed `(payload, secret)` to `generateRefreshToken`; JS silently dropped extras; runtime worked anyway
**Action:** use `generateRefreshToken()` with no arguments (it's an opaque hex generator)
**Reference case:** BUG-031 (was thought to be the latent bug; turned out to be a non-issue)

---

## SQLite / D1

### `ALTER TABLE DROP COLUMN` fails on UNIQUE-constrained columns

**Pitfall:** SQLite limitation
**Symptom:** migration fails with constraint error
**Action:** use table-recreate pattern: CREATE NEW + INSERT SELECT + DROP OLD + RENAME
**Reference case:** Phase 1.5 D1 migration 0022 (Square column drop)

### D1 `--remote` migrations don't auto-apply

**Pitfall:** Cloudflare D1 has no auto-apply mechanism; `--local` and `--remote` are independent
**Action:** always run `--local` then `--remote`; verify with `wrangler d1 execute --remote --command "SELECT name FROM d1_migrations"`
**Reference case:** old-rule-16 (2025-12-13 password_reset_tokens missing in production)

### D1 migration tracker can drift from actual schema

**Pitfall:** if you ran migration SQL via `wrangler d1 execute --remote --command "..."` instead of `migrations apply`, the tracker won't update
**Action:** before applying a new migration, verify the tracker matches reality; manually insert if needed
**Reference case:** Phase 1.5 (0020/0021 had to be inserted into tracker before 0022 ran)

---

## Blockly

### Mode switch carries blocks via `savedXmlRef`

**Behavior (intentional):** when the user switches modes (e.g., humanoid → wheel), the workspace XML is preserved across the switch via a ref.
**Action:** if you write code that relies on a "fresh" workspace after mode switch, you'll be surprised. The blocks carry over by design.
**Reference case:** memory `reference_blockly_mode_switch`

### Blockly `Msg` already has index signature

**Pitfall:** old block templates use `(Blockly.Msg as any).BLOCKS_FOO_TITLE`
**Reality:** `Blockly.Msg` is `{ [key: string]: string }` — index signature, no cast needed
**Action:** `Blockly.Msg.BLOCKS_FOO_TITLE` directly
**Reference case:** BUG-007 (95% of 1592 `as any` removed by sed-replace)

### `FieldDropdown` arg variants — regex must enumerate

**Pitfall:** regex extraction tools that catch only `FieldDropdown([['a','b']])` miss:
- `FieldDropdown(funcRef)` — function reference
- `FieldDropdown(CONST_REF)` — constant reference
- `FieldDropdown([...]) as any` — type cast
- multi-line array literal
**Action:** before writing the regex, enumerate all forms in code; design for the broadest match; audit `hits == sites`
**Reference case:** Round 3 disaster (9 blocks / 11 fields silently dropped from catalog)

### `as unknown as Blockly.Field` cast not handled by regex

**Pitfall:** Phase 9 (BUG-007) introduced this cast for `FieldDropdown` results; existing `audit-ai-catalog.ts` regex didn't handle the `as unknown as ...` form
**Action:** regex `(?:\s+as\s+[^,]+?)?` to handle compound type assertions
**Reference case:** Phase 9 副次発見

---

## NimBLE / Preferences

### NimBLE-Arduino + Preferences NVS mutex contention

**Symptom:** initialize BLE, then access Preferences (NVS) → hangs / crashes
**Cause:** BLE stack and Preferences both lock the NVS mutex; race condition
**Action:** initialize Preferences before BLE; or move Preferences-equivalent data to RTC RAM / EEPROM
**Reference case:** memory `feedback_nimble_nvs_conflict`

### NimBLEOta `0x8021` PROGRESS Characteristic — not implemented

**Pitfall:** README / docs reference `BLE_OTA_PROGRESS_UUID = 0x8021`
**Reality:** commented out in `NimBLEOta.cpp` (TODO)
**Action:** use `0x8020` (RECV_FW) and `0x8022` (COMMAND); don't depend on `0x8021`
**Reference case:** old-rule-23

---

## Web Serial API

### `navigator.serial.requestPort()` requires user gesture

**Pitfall:** call inside an `async` chain after `await` → SecurityError
**Symptom:** `Must be handling a user gesture to show a permission request.`
**Action:** call `requestPort()` immediately on click; THEN do the async work
**Reference case:** old-rule-22

### baudrate 460800 / 230400 unstable on some serial drivers

**Symptom:** `Invalid head of packet (0x65)` / `Read timeout exceeded`
**Action:** stick with 115200; esptool-js v0.5.7 skips `changeBaud()` when baudrate == romBaudrate
**Reference case:** USB write history

---

## ESP32

### HTTP server timeout dependency on user program

**Pitfall:** ESP32's `loop()`-based HTTP server takes 1-20s to respond depending on user program (delay() heavy = slow)
**Symptom:** OTA write / device check times out
**Action:** set HTTP timeouts to 30s+ in OTA / health-check code (frontend + Finder)
**Reference case:** old-rule-29 (2025-12-29 fixes: 5s → 30s OTA / 3s → 30s checkDeviceOnline / 2s → 30s Finder)

---

## Tauri / Rust

### `tokio::spawn` inside `block_on` — task cancelled

**Pitfall:** `block_on(async { tokio::spawn(...) })` — the spawned task is cancelled when `block_on` exits
**Action:** use `tauri::async_runtime::spawn()` or await directly inside `block_on`
**Reference case:** old-rule-26 (DigiCode Finder mDNS bug)

---

## Cross-domain Cookies

### `SameSite=Lax` blocks cross-site Cookies

**Pitfall:** `code.fablab-westharima.jp` (frontend) → `kazunari-takeda.workers.dev` (backend) is cross-site
**Symptom:** Cookies don't send despite `credentials: 'include'`
**Action:** `SameSite=None; Secure; HttpOnly` on the Cookie; `credentials: 'include'` on fetch; CORS `allowCredentials: true`
**Reference case:** old-rule-24 (2FA trusted-device cookie)

---

## When you find a new one

Add it here. Cite the BUG ID / commit / Phase. The pattern of update:

```markdown
### <Specific symptom or symbol>

**Cap / Where / etc.:** <values>
**Symptom:** <what you see>
**Cause:** <why>
**Action:** <one-line fix>
**Reference case:** BUG-XXX / Phase X / memory:foo
```

---

## awk / shell (the harness's own tooling)

Both entries below were hit while writing checks *for this harness*, which is where they matter: a
defective check reports the state of nothing as the state of everything.

### `awk -v` mangles the value before your program sees it

Two distinct failures, both silent, both measured on this repo:

- **Escape expansion.** `awk -v m='## Core \(mandatory read\)'` arrives as a regex capture group, so a
  literal-marker comparison stops matching and the file is measured full-length with no error. Use
  `index($0, m) == 1` rather than a regex, and never hand `-v` a string containing backslashes.
- **Newlines are rejected outright.** BSD awk (macOS default) answers a multi-line `-v` value with
  `awk: newline in string …` and **exits 2 having printed nothing**. A checker written as
  `naked="$(awk -v list="$multiline" … )"` then produces an empty result, which is exactly what "no
  violations" looks like — measured 2026-08-15, a planted bad row went undetected and the suite
  reported 22 passed / 0 failed. Pass lists by **file** and read them in `BEGIN` with
  `while ((getline l < f) > 0)`.

Defense that covers both without knowing the cause: **have the check print its denominator** and fail
when it is zero (`scanned 0 rows` is a red, not a green — rule 04 §invariant reporting). A crash and a
clean sweep are indistinguishable from the outside otherwise.

### `wc -m` depends on the locale; byte-derived character counts do not

`wc -m` needs a UTF-8 locale to be present, which is an unstated premise in any script that travels.
Count bytes with `LC_ALL=C wc -c` and derive characters by subtracting UTF-8 continuation bytes
(`LC_ALL=C tr -dc '\200-\277' | LC_ALL=C wc -c`). Used by `scripts/read-load.sh`.

### zsh is the shell these sessions actually run

`ls *.nomatch` aborts the whole command with "no matches found" before anything runs; there is no
`PIPESTATUS`; `for x in $VAR` does **not** word-split (a space-separated list runs the loop once, on
the joined string) though `$(...)` does. Prefer `find`, quote patterns, and take `RC=$?` on its own
line. Mechanised as selftest B7 for handover baseline rows; the same shapes bite anywhere.

---

## Related rules

- `common/04-testing-strategy.md` — detection power, denominators, and the instrument-vs-dimension family
- `common/09-runtime-research.md` — pre-deploy spec verification (parent rule)
- `common/11-dependency-upgrade.md` — SDK upgrades (Stripe / SimpleWebAuthn examples)
- `digicode/11-workers-constraints.md` — DigiCode-specific constraint registry
- `reference/memory-index.md` — memory entries with deeper context
