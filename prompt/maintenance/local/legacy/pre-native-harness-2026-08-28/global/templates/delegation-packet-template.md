# Delegation Packet Contract

Copy this template for every technical delegation. Replace every `{{...}}` slot; do not delete a
field. Rule 22 is the source of truth. Project-specific values belong in injection slots, not in this
global template.

```text
LANE: {{LANE_OR_SEQUENCE}}
LANE_SEQUENCE: {{ORDERED_LANES_OR_SINGLE_LANE}}
AUTHORITY_MODE: DELEGATED
INTEGRATION_OWNER: {{INTEGRATION_OWNER}}
PACKET_ID: {{PACKET_ID}}
ROUTE_TARGET: {{DISPATCH_TARGET_ID}}
ROUTE_EFFORT: {{EFFORT_VALUE_OR_NONE}}
EFFORT_REASON: {{BASELINE_OR_AUTHORISED_REASON}}
EFFORT_EVIDENCE: {{NONE_OR_TASK_REFERENCE}}
ROUTE_AUTHORITY_REF: {{NONE_OR_HUMAN_GO_REFERENCE}}
AUTO_ADVANCE: {{YES_OR_NO}}
CONFLICT_SURFACE: {{MANDATORY_OR_OPTIONAL}}

DELEGATED_SCOPE_ACTIVE:
- id: {{PACKET_ID}}
- scope: {{ENUMERATED_TECHNICAL_SCOPE}}
- owner: {{WORKER_THREAD}}
- parent_shadow_execution: FORBIDDEN

# Mission
{{MISSION_AND_DECISION_IT_FEEDS}}

# Scope
{{FILES_AREAS_AND_SETTLED_CONSTRAINTS}}

# OUT_OF_SCOPE
{{WHAT_THIS_PACKET_DOES_NOT_COVER}}

# Acceptance
{{VERBATIM_COMMANDS_CRITERIA_AND_EVIDENCE_TYPES}}

# STOP_IF
{{CRITICAL_STOP_CONDITIONS_VERBATIM}}

# KNOWN_SANDBOX_NOISE
{{PROJECT_SPECIFIC_KNOWN_SANDBOX_NOISE}}

# FINDING_HANDLING
A finding outside this packet's scope is REPORTED, never adopted, never quietly fixed, and never
used to widen this packet from inside. Classify it per rule 24 (BLOCKER / ADJACENT_DEFECT /
HARDENING, decided by whether it blocks THIS packet's acceptance — never by severity), then:
  BLOCKER          -> return now: VERDICT: HOLD, REASON: BLOCKED
  ADJACENT_DEFECT  -> finish the packet, report it: VERDICT: ESCALATE, REASON: OUT_OF_SCOPE_FINDING
  HARDENING        -> finish the packet, report it: VERDICT: ESCALATE, REASON: OUT_OF_SCOPE_FINDING
A decision the packet does not cover is VERDICT: HOLD, REASON: NEEDS_DECISION. A result the
instrument produced rather than the subject is VERDICT: ERROR, REASON: INVALID_MEASUREMENT.

# RESULT_CAPSULE_FORMAT
RESULT CAPSULE
VERDICT: PASS | HOLD | ESCALATE | ERROR
REASON: NONE | BLOCKED | NEEDS_DECISION | OUT_OF_SCOPE_FINDING | INVALID_MEASUREMENT
REPORT: <path>
COMMIT_CANDIDATE: NONE (integration owner commits)
TEST_CMD: <exact command>
TEST_RC: <number or N/A + reason>
TESTS: <passed/total with unit or N/A + reason>
SELFTEST: <passed/total with unit or N/A + reason>
MUTATION: <killed/total with unit or N/A + reason>
CHANGED_FILES:
- <path or NONE>
CLAIMS:
- C1 -> <report section / path:line / artifact / command+RC / hash>
CONFLICT_SURFACE: NONE | <literal conflict>
HUMAN_DECISION_REQUIRED: NO | <reason>
NEXT_RECOMMENDED_LANE: <lane>
```

Contract rules:

1. `AUTO_ADVANCE: YES` requires `CONFLICT_SURFACE: MANDATORY`; otherwise the packet is invalid.
2. Critical stop conditions — including project R1–R6 when applicable — are inherited **verbatim**.
   Never AI-summarize them: compression can erase precedence, authority, or stop semantics.
3. `KNOWN_SANDBOX_NOISE` is a per-project injection slot. State the exact expected set and the
   behavior for exact match versus deviation; never generalize it to permission to ignore failures.
4. `CLAIMS` is a reference index, not a prose summary. Prefer report sections, path:line, artifacts,
   exact command/RC, and hashes.
5. `CONFLICT_SURFACE: MANDATORY` means the worker must compare the packet, observed repository state,
   tests, evidence, settled decisions, and authority boundaries, then report `NONE` or the literal
   conflict. It never means resolving a conflict without authority.
6. `OUT_OF_SCOPE` is written even when it feels obvious. A worker cannot avoid what it was never
   told it must not do, and "it was related, so I fixed it" is the shape the widening side takes
   (rule 24). Enumerate the neighbours you expect it to be tempted by, not the whole repository.
7. `REASON` is mandatory whenever `VERDICT` is not `PASS`. `HOLD` alone does not say whether the
   integration owner may re-dispatch, must decide, or must go to the Human — and `HOLD: BLOCKED`
   is never on its own a hand-back of the technical work (rule 22 §Worker completion and return
   states).
8. The five `ROUTE_*` / `EFFORT_*` fields record the **routing decision** this dispatch made
   (rule 22 §Routing decision). `ROUTE_TARGET` is a dispatch-target id resolved in the project's
   routing profile — never a model name written here, because the mapping has exactly one owner.
   `EFFORT_REASON` and `EFFORT_EVIDENCE` are written **even at baseline** (`BASELINE` / `NONE`):
   made optional, "the author forgot" and "the author chose baseline" become the same record.
   Above baseline, the reason comes from the rule's closed set and the evidence must reference
   *this* task — a reference to the dispatch itself satisfies nothing. `ROUTE_AUTHORITY_REF` quotes
   the Human GO when the target is `HUMAN_GO_REQUIRED`, and is `NONE` otherwise. A packet whose
   route does not resolve is refused, never dispatched at whatever the environment was set to.
9. A lane sequence executes in order. With `AUTO_ADVANCE: YES`, advance without returning between
   lanes unless `STOP_IF` fires or a conflict/decision outside the packet is found.
