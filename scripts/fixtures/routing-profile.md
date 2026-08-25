# Fixture routing profile — synthetic, NOT a roster

Consumed by `scripts/routing-scenarios.py` so the scenarios have a real profile to resolve against.

**Every id and every effort value here is synthetic.** `T-*` targets and the `E1 < E2 < E3` scale
name no vendor, no model and no real reasoning-effort tier — importing a reference implementation's
values is exactly what the Phase 6 directive forbids, and a fixture is the easiest place for them to
sneak in. The scale exists only to give "above / at / below baseline" something to be measured
against; a consumer's real profile lives at `prompt/maintenance/local/docs/routing-profile.md`.

```routing-profile
# fields: TARGET | id | role | lanes | status | dispatchable | authority | effort_scale | baseline_effort | effort_fixed

TARGET | T-PRIMARY    | executor         | INVESTIGATION+IMPLEMENTATION+VERIFICATION | ACTIVE       | yes | NONE               | E1/E2/E3 | E2   | no
TARGET | T-VERIFY     | executor         | VERIFICATION+FALSIFICATION                | ACTIVE       | yes | NONE               | E1/E2/E3 | E2   | no
TARGET | T-ECONOMY    | executor         | IMPLEMENTATION                            | EXPERIMENTAL | yes | NONE               | E1/E2    | E1   | no
TARGET | T-RESTRICTED | orchestrator     | DESIGN_REVIEW                             | ACTIVE       | yes | HUMAN_GO_REQUIRED  | E2/E3    | E3   | no
TARGET | T-FIXED      | executor         | IMPLEMENTATION                            | ACTIVE       | yes | NONE               | E1/E2/E3 | E2   | yes
TARGET | T-RETIRED    | executor         | IMPLEMENTATION                            | DISABLED     | yes | NONE               | NONE     | NONE | no
TARGET | T-ADVISORY   | orchestrator     | DESIGN_REVIEW                             | ACTIVE       | no  | NONE               | NONE     | NONE | no
TARGET | T-NOEFFORT   | integration-owner| IMPLEMENTATION                            | ACTIVE       | yes | NONE               | NONE     | NONE | no

NOTE | FIXTURE | Synthetic. Never copy into a project profile.
```

A note on `T-RETIRED`: it is `DISABLED` while still flagged `dispatchable: yes`. That is
deliberate — a retired target whose flag nobody flipped is the realistic failure, and it is what
makes the DISABLED row and the not-dispatchable row separately measurable. `T-ADVISORY` covers
the other half: ACTIVE, but never dispatched to.
