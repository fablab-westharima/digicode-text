# Reference: Migration History — Sunset Dates Registry

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Audience:** Claude (when working with migration / shim / compat code, check sunset dates here)
**Last reviewed:** 2026-04-26

---

## TL;DR

Every migration / shim / compat code in DigiCode has a sunset date. This file is the registry. When the date arrives, the cleanup happens.

For reasons, see `common/06-dead-code-removal.md` (sunset-date discipline) and `digicode/02-brand-terms.md` (OTTO elimination context).

---

## Active migrations (with sunset dates)

| Sunset | Code | Location | Removal procedure |
|---|---|---|---|
| **2027-04-21** | OTTO localStorage migration: `modeMap` | `variants/ota/frontend/src/stores/robotModeStore.ts:148` | Delete `migrate` function + `modeMap` OTTO entries; bump version 1 → 2; users with old state get fresh state |
| **2027-04-21** | OTTO localStorage migration: 15 pin renames | `variants/ota/frontend/src/stores/pinPresetStore.ts:460` | Delete `version < 8` block entirely; bump version 8 → 9; users with old state get fresh state |
| **2027-04-21** | OTTO localStorage migration: 4 servo presets | `variants/ota/frontend/src/components/servo/ServoTrimDialog.tsx:113` | Delete `PRESET_MIGRATION` map; `loadServoConfig` falls back to `humanoid-basic` for unknown keys |
| **No date set yet** | Stripe API version dual-shape helper | `esp32-blockly-backend/src/routes/webhooks.ts` (`extractInvoiceSubscriptionId`) | Optional removal once 2018-02-28 endpoint fully retired (no current ETA — keep as runtime safety) |
| **No date set yet** | PBKDF2 100k → argon2id migration | `esp32-blockly-backend/src/utils/password.ts` | BUG-043; medium priority; will require lazy upgrade hook similar to BUG-021 pattern |
| **No date set yet** | JWT_SECRET single-secret → graceful rotation | (not yet implemented) | BUG-049; add `JWT_SECRET_PREVIOUS` Workers Secret; modify `verifyAccessToken` to try both; remove old secret after access-token TTL elapsed |

---

## Sunset 2027-04-21 (OTTO migration cleanup) — detailed plan

**Context:** OTTO complete elimination shipped 2026-04-21 (19.md). Migration code added then to convert old localStorage state for inactive users. After 1 year, all active users will have opened the app at least once → migration completed → code can be deleted.

**Acceptable UX impact:** users *inactive* for 12+ months will lose:
- Robot mode preference (defaults to `robots_humanoid`)
- Pin preset configuration (defaults to per-board defaults)
- Servo trim presets (defaults to `humanoid-basic`)

These users are extremely rare and the impact is recoverable in seconds (re-set preferences). Per CLAUDE.md old-rule-30 type judgment: acceptable.

### When 2027-04-21 arrives

1. **Verify schedule:** check this file's date matches calendar.
2. **Check if BUG-047 exists in `発見バグ/`** — that's the tracking issue.
3. **3 file edits:**
   - `robotModeStore.ts`: delete migration function + `modeMap` entries; bump version
   - `pinPresetStore.ts`: delete `version < 8` block; bump version 8 → 9
   - `ServoTrimDialog.tsx`: delete `PRESET_MIGRATION` map; simplify `loadServoConfig`
4. **Static checks all green** (typecheck / eslint / vitest / prebuild / audit-i18n).
5. **Test in production** with a fresh-state user (private window or localStorage clear).
6. **Move BUG-047 to `修正済みバグ/`**; remove this row from this file's table.
7. **Update `digicode/02-brand-terms.md`** to note OTTO migration is now fully cleaned up.

---

## How to add a new entry

When you write code that should eventually be removed:

1. Choose a date or condition that triggers removal:
   - **Time-based:** `YYYY-MM-DD` (typically 1 year out for user-impacting cleanups)
   - **Condition-based:** "Once X is fully retired" / "After Y users have migrated"
2. Add a comment near the code:
   ```typescript
   // sunset: 2027-04-21 (1 year after OTTO elimination 2026-04-21).
   //   At sunset: delete this migration code, bump version to N+1, treat unmigrated state as fresh.
   //   Reasoning: 1 year is enough for all active users to open the app at least once.
   ```
3. Add a row to the table above with:
   - Sunset date / "No date set yet" with condition
   - Code description
   - File + line
   - Removal procedure
4. Optionally: add a `発見バグ/` entry for tracking (BUG-047 is the OTTO sunset example).
5. Optionally: schedule a Claude background agent (`/schedule`) for ~1 month before the sunset to remind / prepare.

---

## How removal feels in practice

When a migration's sunset arrives:

- Files affected: typically 1-3 small ones
- Lines removed: typically 30-60
- Tests required: static checks + production smoke (login, key feature)
- User-visible impact: limited to inactive users (ones who haven't opened the app since the migration was added)
- Time: ~1 hour from removal commit to verification

Compare to letting it linger:
- Confusion for future Claude / dev (".. why is this here?")
- Bundle weight (small but real)
- Implicit perma-versioning of localStorage shape (each version supported is a tax)

The discipline is small; the payoff compounds.

---

## Related rules

- `common/06-dead-code-removal.md` — sunset-date discipline (parent rule)
- `digicode/02-brand-terms.md` — OTTO elimination policy
- `digicode/10-frontend-state.md` — Zustand persist + migrate patterns
- `reference/known-pitfalls.md` — Stripe / argon2id migration context
