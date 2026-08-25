# Reference: Memory Index — When to Consult Each Memory File

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Audience:** Claude (this is your lookup table for memory entries)
**Last reviewed:** 2026-04-26

This file maps each memory entry in `~/.claude/.../memory/` to:
- What it captures
- Which rule it relates to (rules win in conflict)
- When to consult it

Memory entries decay; rules are durable. Check the rule first; consult memory when the rule references it explicitly or when you need a session-specific historical observation.

---

## How to use this file

1. **Don't read every memory entry every session.** Use this index.
2. **When a rule references `memory:foo`,** check this index for which file and what to expect.
3. **When you suspect a memory has decayed,** verify against current code; if stale, update or delete.
4. **Memory's age matters.** Entries with `originSessionId` from months back may describe code that's since changed.

---

## Feedback memory (23 entries — behavioral guidance)

| memory file | TL;DR | Rules using this |
|---|---|---|
| `feedback_atomic_compound_actions.md` | UI: 1-click actions, not 2-step | `common/12-collaboration.md` |
| `feedback_catalog_driven_validation.md` | AI catalog audit ships at MVP | `common/08-data-validation.md` |
| `feedback_deploy_verify.md` | Production check, not just build | `common/04-testing-strategy.md` |
| `feedback_docs_maintenance_tradeoff.md` | Don't write rapidly-aging info in docs | (no rule, advisory) |
| `feedback_evidence_based_runtime_research.md` | Pre-deploy spec verification | `common/09-runtime-research.md` |
| `feedback_i18next_explicit_variants.md` | nonExplicitSupportedLngs: false for 5-letter codes | `common/07-i18n.md`, `reference/known-pitfalls.md` |
| `feedback_internal_admin_i18n.md` | Internal admin pages: i18n optional | (no rule yet; design heuristic) |
| `feedback_investigation_incomplete_assumption.md` | Bug file = lower bound, full grep | `common/01-investigation.md` ⭐ |
| `feedback_local_vs_prod_testing_policy.md` | Production-first; local for risky only | `common/04-testing-strategy.md` |
| `feedback_model_switching.md` | (origin-era record: single-model operation; superseded 2026-08 by multi-model Orchestrated Reasoning — roles/routes in `common/22-model-orchestration.md`, roster in CLAUDE.md §Team structure) | `common/22-model-orchestration.md` |
| `feedback_nimble_nvs_conflict.md` | NimBLE+Preferences NVS mutex | `digicode/01-architecture.md` (advisory) |
| `feedback_onboarding_complexity.md` | DigiCode setup is too complex | (project context, no rule) |
| `feedback_otto_elimination_policy.md` | OTTO residue: fix on the spot | `digicode/02-brand-terms.md` ⭐ |
| `feedback_quality_over_tokens.md` | $200 plan: quality > token budget | `common/01-investigation.md`, `README.md` |
| `feedback_reactive_vs_systematic.md` | Audit pattern, not 1-bug-1-fix | `common/01-investigation.md`, `common/08-data-validation.md` |
| `feedback_regex_extraction_patterns.md` | Enumerate variants before regex | `common/08-data-validation.md` |
| `feedback_setstate_bailout_flag_stuck_antipattern.md` | setState bailout + flag stuck | `common/10-state-machine.md` ⭐, `digicode/10-frontend-state.md` |
| `feedback_shared_store_sideeffect.md` | Closed dialogs reacting to shared store | `digicode/10-frontend-state.md` |
| `feedback_step_by_step_acceptance_test.md` | One-scenario-at-a-time UAT | `common/04-testing-strategy.md`, `common/12-collaboration.md` ⭐ |
| `feedback_ui_placement_implies_relation.md` | Sidebar/menu adjacency = relation | `common/12-collaboration.md` |
| `feedback_util_i18n_labels_injection.md` | Util i18n: caller injects labels | `common/07-i18n.md` ⭐ |
| `feedback_wait_for_go.md` | Don't code without explicit go-ahead | `common/12-collaboration.md` ⭐ |
| `feedback_wifi_ota_drawbacks.md` | WiFi OTA UX limitations (advisory) | (no rule, design context) |

⭐ = rule directly extends this memory entry.

---

## Project memory (12 entries — project state / context)

| memory file | TL;DR | When to consult |
|---|---|---|
| `project_admin_feature_flags.md` | Admin + Feature Flags shipped 2026-04-06 | Working on AdminPage / feature flags |
| `project_audit_allowlist_pattern.md` | KNOWN_BROKEN allowlist for in-flight rebuilds | `common/08-data-validation.md`; allowlist still active until 37.md complete |
| `project_ble_device_name.md` | BLE device name customization (FW done, UI WIP) | Working on BLE / device name |
| `project_bonjour_elimination.md` | Bonjour bundle deferred (decision 2026-03-29) | DigiCode Finder / Windows install |
| `project_guest_access.md` | Guest mode (no login, file save) shipped | Working on auth / save flows |
| `project_ota_positioning.md` | BLE OTA = beginner; WiFi OTA = intermediate+ | Doc / UI categorization |
| `project_otto_hardware.md` | OTTO HW design: M5StampS3A + breakout | Hardware / firmware compatibility |
| `project_payment_platform.md` | Stripe (domestic) → Managed Payments (international) | Working on Stripe / billing |
| `project_phase5_post_check_hardware_pending.md` | 3 hardware checks deferred from Phase 5 | Hardware in hand → run checks; tracked as BUG-044 |
| `project_sample_xml_bug.md` | Pre-2026-04-19 sample XML bug deferred | Probably resolved by 37.md rebuild; verify |
| `project_server_migration.md` | Optirex → ML30 server migration done 2026-03 | Reference for ML30 setup |
| `project_sidebar_restructure.md` | Sidebar restructure 2026-03-26〜27 | Sidebar / menu work |
| `project_sidebar_ui_updates_0331.md` | Sidebar UI tweaks 2026-03-31 | UI tweaks |
| `project_stripe_webhook_legacy_api_2018.md` | Past 2018-02-28 incident (resolved Phase 1.5) | Stripe historical context |

---

## Reference memory (4 entries — durable lookups)

| memory file | TL;DR |
|---|---|
| `reference_arduino_compile_server_build.md` | ML30 uses `build:.` flow; Dockerfile changes need git pull + docker compose up --build -d |
| `reference_blockly_mode_switch.md` | Mode switch carries blocks via savedXmlRef (intentional) |
| `reference_cf_pages_auto_deploy.md` | git push main → CF Pages auto-deploy in 2-3 min |
| `reference_ml30_ssh_access.md` | `ssh ml30` works directly (~/.ssh/config configured) |

---

## User memory

| memory file | TL;DR |
|---|---|
| `user_profile.md` | Mechanical engineer, hardware design primary; DigiCode + custom hardware dual-axis business; runs FabLab 西播磨 |

---

## When memory contradicts a rule

The rule wins.

But also:
1. Check the rule's `Last reviewed:` date — if older than the memory, the memory might be the more current observation.
2. If the rule is stale, update the rule (and note in `改定log.md`).
3. If the memory is stale, update or delete the memory.

---

## When to add a new memory entry

Memory is appropriate for:
- "User said X today" (preference, correction, or validation)
- "Discovered Y about the runtime / library / project state"
- "Pattern Z worked / failed in this session"

When the same memory pattern appears in 3+ sessions / 2+ Phases, consider promoting to a rule (this rules system was promoted from ~20 such patterns).

When in doubt, write the memory; rules can be promoted later.

---

## When to delete memory

- Code or behavior described no longer exists
- The rule version is now canonical
- The user explicitly asks to forget

Don't delete just because something is "old" — point-in-time records can be valuable archeology if a regression appears.
