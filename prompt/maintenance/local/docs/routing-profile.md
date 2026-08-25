# Routing Profile — digicode-text (this project's values)

**Grammar owner:** `global/templates/routing-profile-template.md` + rule 22 §Routing decision.
**Value owner: this file, and only this file.** `CLAUDE.md` §7 and rule 22 §Environment
prerequisites name roles and duties; neither carries a mapping value.

**Updated: 2026-08-25 (S000 bootstrap).** Not a mandatory cold-start read — opened when a dispatch
is actually being routed. Absent or unparseable → the routing validator refuses (exit 2); it never
degrades to "no routing constraints".

**Bootstrap status: every value below is an ABSENCE OF MEASUREMENT, deliberately** (2026-08-25 user
ruling). See §Why every `effort_scale` here is `NONE`.

---

```routing-profile
# fields: TARGET | id | role | lanes | status | dispatchable | authority | effort_scale | baseline_effort | effort_fixed
# Grammar and the meaning of every field: global/templates/routing-profile-template.md

TARGET | ALT-ORCHESTRATOR | orchestrator | INVESTIGATION+INVESTIGATION_PLANNING+DESIGN_REVIEW | ACTIVE | yes | NONE | NONE | NONE | no
TARGET | SIX-LANE-DELEGATE | executor | * | ACTIVE | yes | NONE | NONE | NONE | no
TARGET | CLAUDE-SUBAGENT | executor | INVESTIGATION+IMPLEMENTATION+DESIGN_REVIEW+VERIFICATION | ACTIVE | yes | NONE | NONE | NONE | no

NOTE | HARNESS_SELF | The conductor is not a dispatch target. Its model and reasoning effort are Human-declared per session (rule 22 §Conductor switching / §Session mode / pre-flight 1); no routing decision outputs them. WHO HOLDS IT IS UNDECLARED for this project — declared per session by the Human, never inferred from another project's roster.
NOTE | ALT-ORCHESTRATOR | Holder UNDECLARED. No repo access is the defining constraint of this role — brief via scripts/context-brief.sh; conclusions re-enter as claims; produces no commits.
NOTE | SIX-LANE-DELEGATE | Holder UNDECLARED. Never adopts its own work. A = investigation / implementation / correction / tests; B = separate-thread verification / falsification. Commit attribution must be written here before this target is first dispatched to.
NOTE | CLAUDE-SUBAGENT | Holder UNDECLARED. Cannot supply a different reasoning lineage — use a different-vendor lane where independence is required.
NOTE | BOOTSTRAP | These three target ids are the ROSTER SHAPE inherited from the template's grammar, not an assignment of models. No model name, effort value, billing arrangement or harness configuration was carried over from Project_Template or from any other project: those are that project's decisions, and copying them here would make this file claim a mapping nobody decided (case PT-1's shape). Writing real holders and real scales is GO-gated — 16.md §1 GO/STOP boundary, baton 4.
```

## Why every `effort_scale` here is `NONE`

**Because this project has not measured one, and has not been given one.** `NONE` is not a claim
that these transports have no effort control — it is the absence of a measurement, recorded as an
absence. Under the routing decision that makes the conservative outcome the automatic one: any
dispatch requesting an effort value against these targets returns `REJECT_UNSUPPORTED_EFFORT`, and
no escalation is routable until someone measures the transport's supported values **and writes them
here**.

Writing a plausible-looking scale instead would be case PT-1's shape — rule text authored from
secondary sources and then acted on. The scale is a measurement; this file records measurements.

The same reasoning covers the `NOTE | … | Holder UNDECLARED` lines. A holder inherited from the
template would be a mapping this project never decided, reading as authoritative from the first
cold start onward.

## What must change before an escalation can be routed on any target above

1. The Human declares who holds each target for this project (16.md baton 4).
2. Measure the target transport's actually-supported values (from the transport's own
   configuration or logs — **never by asking the delegate**, rule 22 pre-flight 6 / case 93).
3. Write them into `effort_scale`, ascending, and choose `baseline_effort`.
4. Re-run `python3 scripts/routing-scenarios.py --profile prompt/maintenance/local/docs/routing-profile.md`
   — it will refuse if the scale and the baseline disagree.
