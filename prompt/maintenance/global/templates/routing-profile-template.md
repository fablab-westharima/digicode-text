# Routing Profile — template (grammar is common, every value is the consumer's)

Copy this file to `prompt/maintenance/local/docs/routing-profile.md` and replace the `{{...}}` slots
with **this project's** values. Rule 22 §Routing decision is the policy owner and owns this grammar;
this file's *values* have exactly one owner, and it is the copy under `local/docs/`.

**Nothing in this file is a Project_Template default.** Model names, effort values, which target is
Human-only, which is experimental, and what a transport supports are consumer decisions
(rule 22 §Routing decision §Consumer responsibility). The template ships the grammar and the
validator, never a mapping.

**Not a mandatory cold-start read.** It is read when a routing decision is actually made — by
`scripts/routing-scenarios.py`, and by a session at the moment it dispatches. A session that never
dispatches never opens it. But routing without it is not permitted to proceed on a default: a
missing or unparseable profile is `INSTRUMENT_ERROR`, never "no routing constraints" (fail closed —
2026-08-25 user ruling).

---

## The block

The profile is the fenced ```` ```routing-profile ```` block below. Everything outside it is prose
for the human reader; the validator reads only the block.

```routing-profile
# fields: TARGET | id | role | lanes | status | dispatchable | authority | effort_scale | baseline_effort | effort_fixed
#
#   id              consumer-chosen dispatch-target id. Unique. It is NOT a model name in the rule's
#                   eyes — it is the handle a delegation packet's ROUTE_TARGET names.
#   role            one of rule 22 §Roles and authority's roles (ROLE_VOCABULARY in the rule's
#                   ```routing-decision``` block). A target is not a fifth role; it names which of
#                   the existing four it acts as.
#   lanes           `+`-separated rule 22 lane names, or `*` for any. Vocabulary: the rule's
#                   LANE_VOCABULARY, which selftest holds equal to §Lane definitions in both
#                   directions.
#   status          ACTIVE | EXPERIMENTAL | DISABLED. EXPERIMENTAL may not be chosen by default
#                   routing; it needs an explicit selection.
#   dispatchable    yes | no. `no` = present in the roster but never dispatched to (an advisory or
#                   Human-operated route). Distinct from DISABLED, which is retired.
#   authority       NONE | HUMAN_GO_REQUIRED. HUMAN_GO_REQUIRED = the AI never selects this target
#                   on its own; it STOPs and asks (rule 22 §Human-only routing).
#   effort_scale    the values THIS transport supports, in ascending order, `/`-separated —
#                   or NONE for a transport with no effort concept. The template fixes no scale:
#                   the names, the count and the order are the consumer's.
#   baseline_effort one value from effort_scale (or NONE when the scale is NONE). Anything other
#                   than this is a routing decision that must be authorised.
#   effort_fixed    yes | no. `yes` = neither raising nor lowering is permitted without a Human GO
#                   (rule 22 §No autonomous downgrade where fixed).
#
# NOTE | id | free text — attribution, degraded-mode fallbacks, billing notes. Never parsed as policy.

TARGET | {{TARGET_ID}} | {{ROLE}} | {{LANES}} | {{STATUS}} | {{DISPATCHABLE}} | {{AUTHORITY}} | {{EFFORT_SCALE}} | {{BASELINE_EFFORT}} | {{EFFORT_FIXED}}
```

## What the validator checks about this file

`python3 scripts/routing-scenarios.py --profile <path>` refuses (exit 2) rather than passing when:

- the file or the block is absent, empty, or unparseable;
- a row has the wrong field count, or an unknown `status` / `dispatchable` / `authority` / `role` /
  lane value;
- two rows share an id;
- `baseline_effort` is not a member of `effort_scale` (or the two disagree about `NONE`);
- `effort_scale` repeats a value, which would make "above" and "below" undecidable.

It does **not** check that the mapping is a good one. See §LIMITS in rule 22 §Routing decision.

## Harness's own model and effort are NOT in this file

The conductor's own model and reasoning effort are Human-declared per session (rule 22 §Conductor
switching, §Session mode, pre-flight step 1). They are not a dispatch target, no routing decision
outputs them, and a worker's escalation never moves them. That separation is executed: the routing
decision returns `HUMAN_OWNED_ROUTE` for the harness itself, and `worker_effort_escalated` is an
INVARIANT_KEY.
