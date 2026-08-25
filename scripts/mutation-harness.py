#!/usr/bin/env python3
"""Mutation harness — proves the harness's guard checks go RED when the contract they
guard is actually broken.

Why this exists (measured, Project_Template S012, 2026-08-25): an inventory of
scripts/selftest.sh found 100 literal-phrase guard predicates, 84 of which rest on a
SINGLE line of a single file. Those checks had never been shown to be able to report bad
news — rule 04 §Show the test has detection power, and case PT-4 ("make every check go red
right after writing it"). A guard that has only ever run against a healthy repository is
an unverified guard, and a presence check in particular can stay green while the
obligation it names has been moved into a superseded section, deleted from its canonical
owner while a pointer survives, or dropped from the contract block it belongs to.

What it does NOT prove: that anyone obeyed a rule at runtime. See LIMITS at the bottom of
the emitted report — selftest green is a statement about documents, never about behaviour.

Discipline this harness itself follows:
  * The real working tree is NEVER mutated. Every mutation is applied to a copy
    (case 112: a mutation applied to the real file was rolled back with git and took an
    uncommitted fix with it).
  * A mutation is only counted once it is PROVEN to have changed the target (case PT-12:
    a mutation that failed to create the condition was read as "the check has no detection
    power"). A mutation that changed nothing is INVALID, never a kill.
  * Kills are measured as a green->red TRANSITION against the copy's own baseline, not
    against an assumed all-green. One check (B24) is environment-dependent and is red in
    any copy, so an absolute red set would manufacture kills.
  * Every count is printed with its denominator, and M=0 or targets=0 REFUSES to pass
    (rule 04 §An invariant reported as one number cannot distinguish "no violations" from
    "nothing measured"; case PT-28).

Usage:
  python3 scripts/mutation-harness.py                 # full run
  python3 scripts/mutation-harness.py --control rubber-stamp
  python3 scripts/mutation-harness.py --control zero-target
Exit: 0 = accepted (M>0, S=0, controls consistent) / 1 = survivors or refused / 2 =
INSTRUMENT_ERROR (nothing measured, baseline unusable, tree contaminated).
"""

import argparse
import hashlib
import os
import re
import shutil
import subprocess
import sys
import types
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SELFTEST = "scripts/selftest.sh"

# Contexts this repository treats as NON-normative. Deliberately narrow: measured on this
# repo (S012 inventory, 100 predicates / 132 match lines), HTML comments and fenced code
# blocks are legitimate normative addresses here — the AGENTS generator's machine-readable
# marker lives in a leading comment, and the delegation packet's field grammar IS a fenced
# block. Invalidating them by form would turn correct documents red (the PT-29 shape,
# inverted). Only an explicit obsolescence marker demotes text.
INACTIVE_HEADING = re.compile(
    r"^#{1,6} .*(anti-pattern|obsolete|superseded|deprecated|❌)", re.IGNORECASE
)


# --------------------------------------------------------------------------- mutations
# Each entry: id, family, check (the selftest id expected to turn RED), files it touches,
# and an op that returns the mutated text. `predicate` names the guard predicate broken,
# so the report can state a predicate denominator, not only a check denominator.
def op_replace(old, new, count=None):
    def f(text):
        n = text.count(old)
        if n == 0:
            return None, "anchor absent"
        if count is not None and n != count:
            return None, "anchor count %d != expected %d" % (n, count)
        return text.replace(old, new), "replaced %d occurrence(s)" % n

    return f


def op_delete_line(sub):
    def f(text):
        lines = text.split("\n")
        keep = [l for l in lines if sub not in l]
        n = len(lines) - len(keep)
        if n == 0:
            return None, "no line contains the anchor"
        return "\n".join(keep), "deleted %d line(s)" % n

    return f


def op_demote(sub, heading="## Superseded (kept for history — not a current rule)"):
    """M3: move the line carrying the obligation under an explicit obsolescence heading,
    appended at the end of the file. The words survive verbatim; only their normative
    standing is destroyed."""

    def f(text):
        lines = text.split("\n")
        moved = [l for l in lines if sub in l]
        if not moved:
            return None, "no line contains the anchor"
        keep = [l for l in lines if sub not in l]
        out = "\n".join(keep).rstrip("\n")
        out += "\n\n" + heading + "\n\n" + "\n".join(moved) + "\n"
        return out, "demoted %d line(s) under an obsolescence heading" % len(moved)

    return f


def op_strip_index_rows(text):
    """Remove every Part 1 index row. A router with no entries prints the same thing as a
    perfect one unless the check refuses at a zero denominator (case PT-28)."""
    out, removed, in_p1, fence = [], 0, False, False
    for line in text.split("\n"):
        if line.startswith("```"):
            fence = not fence
        if not fence:
            if line.startswith("## Part 1"):
                in_p1 = True
            elif in_p1 and line.startswith("## "):
                in_p1 = False
        if (in_p1 and line.startswith("| ")
                and not line.startswith("| case ") and not line.startswith("|---")):
            removed += 1
            continue
        out.append(line)
    if removed == 0:
        return None, "no index rows found"
    return "\n".join(out), "removed %d index rows" % removed


def op_noop(text):
    return text, "deliberate no-op"


JMH = "prompt/maintenance/global/rules/common/judgment-mistakes-history.md"
RULE24 = "prompt/maintenance/global/rules/common/24-objective-control.md"
SCEN = "scripts/fixtures/objective-scenarios.tsv"
RULES_README = "prompt/maintenance/global/rules/README.md"
RULE22 = "prompt/maintenance/global/rules/common/22-model-orchestration.md"
DSCEN = "scripts/fixtures/delegation-scenarios.tsv"
SHADOW = "scripts/shadow_audit.py"
RSCEN = "scripts/fixtures/routing-scenarios.tsv"
RPROF = "scripts/fixtures/routing-profile.md"
PKT = "prompt/maintenance/global/templates/delegation-packet-template.md"
CLAUDEMD = "CLAUDE.md"
RULE15 = "prompt/maintenance/global/rules/common/15-docs-organization.md"
PSCAN = "scripts/placement-scan.sh"

MUTATIONS = [
    # ---- M11 routing discipline: the route stops being a decision and goes back to a setting ----
    # Phase 7 (2026-08-25). This family exists because rule 15's placement contract spent the whole
    # life of the repository written in three places and enforced in none: a file created directly
    # under local/ passed all 74 checks green (16.md baton #35). A placement guard fails in two
    # directions, so both are here — the contract going quiet, and the SCAN going permissive while
    # the contract still reads as enforced. Mutation 3 is the one that matters most: it edits only
    # the RULE, and B67 has to redden, which is what proves the scan derives its allow-set from the
    # rule instead of carrying a private copy.
    dict(id="M12-B67-forbidden-section-demoted", family="M12", check="B67",
         predicate="rule 15 §Forbidden locations is normative (active text)",
         file=RULE15, op=op_demote("### Forbidden locations")),
    dict(id="M12-B67-executable-claim-removed", family="M12", check="B67",
         predicate="rule 15 names its executable companion @ §Forbidden locations",
         file=RULE15, op=op_delete_line("**This section is executable.**")),
    dict(id="M12-B67-category-dropped-from-rule", family="M12", check="B67",
         predicate="the allow-set is derived from rule 15 §Layer definitions, not copied into the scan",
         file=RULE15, op=op_delete_line("── templates/")),
    dict(id="M12-B67-scan-scope-narrowed", family="M12", check="B67",
         predicate="the scan reaches the layer roots, not only the meta-docs root @ placement-scan.sh",
         file=PSCAN,
         op=op_replace('for d in "$ROOT" "$ROOT/global" "$ROOT/local"; do',
                       'for d in "$ROOT"; do', 1)),
    dict(id="M12-B67-nav-exception-made-blanket", family="M12", check="B67",
         predicate="the navigational exception requires the instruction file to cite the path @ placement-scan.sh",
         file=PSCAN,
         op=op_replace('README.md) [ -f "$INSTRUCTIONS" ] && grep -qF "$1" "$INSTRUCTIONS" ;;',
                       'README.md) return 0 ;;', 1)),
    dict(id="M12-B67-empty-allowset-no-longer-refuses", family="M12", check="B67",
         predicate="an unparseable contract refuses instead of scanning an empty allow-set @ placement-scan.sh",
         file=PSCAN,
         op=op_replace('if [ "$NCAT" -lt 2 ]; then', 'if [ "$NCAT" -lt 0 ]; then', 1)),

    # Phase 6 (2026-08-25). This family exists because routing fails in the quietest way any of these
    # policies can: nothing is deleted, a table keeps every row, and the dispatch simply happens at
    # whatever the environment was already set to. Measured at Phase 6 inventory: `effort` had no
    # owner in the common layer at all — three scattered mentions, no baseline, no authority, no
    # evidence duty — while one rule carried a consumer's effort value as a standing instruction to
    # self-upgrade, and the role->model mapping existed in two files at once. Each mutation below is
    # one of those shapes, and B64 / B65 / B66 have to report it.
    dict(id="M11-B64-routing-section-demoted", family="M11", check="B64",
         predicate="the routing decision is normative @ rule 22 (active text)",
         file=RULE22, op=op_demote("### Routing decision")),
    dict(id="M11-B64-default-row-opened", family="M11", check="B64",
         predicate="the routing table's default row fails closed @ rule 22",
         file=RULE22,
         op=op_replace("15 | *                                                                | REJECT_UNROUTED                   | forbidden",
                       "15 | *                                                                | DISPATCH_ALLOWED                  | harness", 1)),
    dict(id="M11-B64-invariant-dropped", family="M11", check="B64",
         predicate="INVARIANT_KEY set of the routing decision @ rule 22",
         file=RULE22, op=op_delete_line("INVARIANT_KEY | ai_prefers_it")),
    dict(id="M11-B64-downgrade-clause-weakened", family="M11", check="B64",
         predicate="an unauthorised downgrade is refused as firmly as an upgrade @ rule 22",
         file=RULE22, op=op_delete_line("**Below baseline** is equally forbidden")),
    dict(id="M11-B64-effort-values-fixed-in-rule", family="M11", check="B64",
         predicate="effort values stay the consumer's @ rule 22 (no EFFORT_VOCABULARY)",
         file=RULE22,
         op=op_replace("AUTHORITY_VOCABULARY | NONE | HUMAN_GO_REQUIRED",
                       "AUTHORITY_VOCABULARY | NONE | HUMAN_GO_REQUIRED\nEFFORT_VOCABULARY    | low | medium | high", 1)),
    dict(id="M11-B64-lane-vocabulary-diverged", family="M11", check="B64",
         predicate="LANE_VOCABULARY equals the lane table in both directions @ rule 22",
         file=RULE22,
         op=op_replace("LANE_VOCABULARY      | INVESTIGATION | INVESTIGATION_PLANNING | DESIGN_REVIEW | IMPLEMENTATION | VERIFICATION | FALSIFICATION",
                       "LANE_VOCABULARY      | INVESTIGATION | INVESTIGATION_PLANNING | DESIGN_REVIEW | IMPLEMENTATION | VERIFICATION", 1)),
    dict(id="M11-B64-capability-vs-policy-demoted", family="M11", check="B64",
         predicate="transport capability is not policy compliance @ rule 22 (active text)",
         file=RULE22, op=op_demote("#### Transport capability is not policy compliance")),
    dict(id="M11-B65-human-only-row-removed", family="M11", check="B65",
         predicate="a Human-only target without a GO stops @ rule 22 ordered decision",
         file=RULE22,
         op=op_delete_line(" 6 | authority=HUMAN_GO_REQUIRED, human_go_reference=no")),
    dict(id="M11-B65-evidence-row-removed", family="M11", check="B65",
         predicate="an escalation without evidence is refused @ rule 22 ordered decision",
         file=RULE22,
         op=op_delete_line("12 | effort_relation=ABOVE, evidence_present=no")),
    dict(id="M11-B65-reason-row-removed", family="M11", check="B65",
         predicate="an escalation with an invalid reason is refused @ rule 22 ordered decision",
         file=RULE22,
         op=op_delete_line("11 | effort_relation=ABOVE, reason_valid=no")),
    dict(id="M11-B65-unsupported-effort-row-removed", family="M11", check="B65",
         predicate="an unsupported effort is a capability mismatch @ rule 22 ordered decision",
         file=RULE22, op=op_delete_line(" 7 | effort_supported=no")),
    dict(id="M11-B65-experimental-default-row-removed", family="M11", check="B65",
         predicate="an experimental target may not be reached by default @ rule 22",
         file=RULE22,
         op=op_delete_line(" 5 | target_status=EXPERIMENTAL, selection=DEFAULT")),
    dict(id="M11-B65-non-dispatchable-row-removed", family="M11", check="B65",
         predicate="a non-dispatchable target is refused @ rule 22 ordered decision",
         file=RULE22, op=op_delete_line(" 4 | dispatchable=no")),
    dict(id="M11-B65-harness-self-row-removed", family="M11", check="B65",
         predicate="the harness's own route is Human-owned @ rule 22 ordered decision",
         file=RULE22, op=op_delete_line(" 1 | subject=harness_self")),
    dict(id="M11-B65-decision-block-unparseable", family="M11", check="B65",
         predicate="the routing decision is executable @ rule 22",
         file=RULE22, op=op_replace("```routing-decision", "```text", 1)),
    dict(id="M11-B65-profile-baseline-moved", family="M11", check="B65",
         predicate="baseline_effort is the profile's, and moving it moves every relation @ fixture profile",
         file=RPROF,
         op=op_replace("| E1/E2/E3 | E2   | no\nTARGET | T-VERIFY", "| E1/E2/E3 | E3   | no\nTARGET | T-VERIFY", 1)),
    dict(id="M11-B65-profile-target-removed", family="M11", check="B65",
         predicate="every ROUTE_TARGET resolves in the profile @ fixture profile",
         file=RPROF, op=op_delete_line("TARGET | T-VERIFY")),
    dict(id="M11-B65-scenario-expectation-flipped", family="M11", check="B65",
         predicate="recorded scenario expectations @ routing-scenarios fixture",
         file=RSCEN,
         op=op_replace("selection=EXPLICIT, human_go=no\tHUMAN_GO_REQUIRED",
                       "selection=EXPLICIT, human_go=no\tDISPATCH_ALLOWED", 1)),
    dict(id="M11-B66-packet-field-removed", family="M11", check="B66",
         predicate="the packet records the per-dispatch routing decision @ packet contract",
         file=PKT, op=op_delete_line("EFFORT_EVIDENCE: {{NONE_OR_TASK_REFERENCE}}")),
    dict(id="M11-B66-mapping-restored-in-claude-md", family="M11", check="B66",
         predicate="the role->model mapping has exactly one owner @ CLAUDE.md",
         file=CLAUDEMD,
         op=op_replace("| Scope, settled decisions, GO for irreversible operations, UAT, roster changes | User |",
                       "| Scope, settled decisions, GO for irreversible operations, UAT, roster changes | User |\n| Harness | claude-fable-5, effort high |", 1)),
    # ---- M10 delegation classification: the boundary loses one of its two directions -----------
    # Phase 5 (2026-08-25). This family exists because the delegation boundary had been wrong in
    # BOTH directions at once while every check guarding it was green: v2's auditor flagged a status
    # poll and a read of the handover (parent duties, named by rule 22 and rule 24) and could not see
    # a subagent delegation at all. A classification fails silently — the prose stays, one row of the
    # table opens, one branch of the instrument fails open — so each mutation below is one of those
    # shapes, and B62 / B63 / B39 have to report it.
    dict(id="M10-B62-classification-demoted", family="M10", check="B62",
         predicate="delegation action classification is normative @ rule 22 (active text)",
         file=RULE22, op=op_demote("### Delegation action classification")),
    dict(id="M10-B62-discriminator-weakened", family="M10", check="B62",
         predicate="the discriminator is not 'did the parent use a tool' @ rule 22",
         file=RULE22,
         op=op_replace("discriminator is never *did the parent use a tool*.",
                       "discriminator is usually *did the parent use a tool*.", 1)),
    dict(id="M10-B62-invariant-dropped", family="M10", check="B62",
         predicate="INVARIANT_KEY set of the delegation decision @ rule 22",
         file=RULE22, op=op_delete_line("INVARIANT_KEY | action_is_cheap")),
    dict(id="M10-B62-default-row-opened", family="M10", check="B62",
         predicate="the prohibition table's default row fails closed @ rule 22",
         file=RULE22,
         op=op_replace("9 | *                                                                               | SHADOW_EXECUTION            | forbidden",
                       "9 | *                                                                               | OUT_OF_DELEGATED_SCOPE      | harness", 1)),
    dict(id="M10-B62-return-states-demoted", family="M10", check="B62",
         predicate="worker return states carry a reason @ rule 22 (active text)",
         file=RULE22, op=op_demote("### Worker completion and return states")),
    dict(id="M10-B62-finding-owner-demoted", family="M10", check="B62",
         predicate="a finding outside the packet is returned by whoever finds it @ rule 22",
         file=RULE22, op=op_demote("### A finding outside the packet")),
    dict(id="M10-B63-governance-row-removed", family="M10", check="B63",
         predicate="parent governance is a permitted class @ rule 22 ordered decision",
         file=RULE22,
         op=op_delete_line("5 | purpose=governance, overlaps_delegated_scope=no")),
    dict(id="M10-B63-decision-block-unparseable", family="M10", check="B63",
         predicate="the delegation decision is executable @ rule 22",
         file=RULE22, op=op_replace("```delegation-decision", "```text", 1)),
    dict(id="M10-B63-scenario-expectation-flipped", family="M10", check="B63",
         predicate="recorded scenario expectations @ delegation-scenarios fixture",
         file=DSCEN,
         op=op_replace("overlaps_delegated_scope=yes, action_is_cheap=yes\tSHADOW_EXECUTION",
                       "overlaps_delegated_scope=yes, action_is_cheap=yes\tHARNESS_GOVERNANCE", 1)),
    dict(id="M10-B39-agent-not-a-dispatch", family="M10", check="B39",
         predicate="a subagent delegation opens a window @ shadow_audit v3",
         file=SHADOW,
         op=op_replace('DISPATCH_TOOLS = {"mcp__codex__codex", "mcp__codex__codex-reply", "Agent"}',
                       'DISPATCH_TOOLS = {"mcp__codex__codex", "mcp__codex__codex-reply"}', 1)),
    dict(id="M10-B39-pathless-bash-fails-open", family="M10", check="B39",
         predicate="a path-less command inside the window fails closed @ shadow_audit v3",
         file=SHADOW,
         op=op_replace('            return ("SHADOW_EXECUTION",\n'
                       '                    "command names no path and is not governance',
                       '            return ("GOVERNANCE",\n'
                       '                    "command names no path and is not governance', 1)),
    dict(id="M10-B39-undeclared-scope-passes", family="M10", check="B39",
         predicate="a window with no declared scope refuses @ shadow_audit v3",
         file=SHADOW, op=op_replace("    if errors or undeclared:", "    if errors:", 1)),
    dict(id="M10-B39-exception-marker-ignored", family="M10", check="B39",
         predicate="a recorded EXCEPTION_TRIGGER is honoured @ shadow_audit v3",
         file=SHADOW,
         op=op_replace('EXCEPTION_RE = re.compile(r"^\\s*EXCEPTION_TRIGGER:\\s*$", re.M)',
                       'EXCEPTION_RE = re.compile(r"^\\s*NEVER_MATCHES_ANYTHING_AT_ALL:\\s*$", re.M)', 1)),
    # ---- M9 objective control: the policy that stops work loses the clause that stops it ----
    # Phase 4 (2026-08-25). This family exists because an objective-control policy fails in a way
    # that reads as healthy: the prose stays, a closed set loses a member, an ordered decision keeps
    # its rows and changes one verdict. Nothing looks deleted. Each mutation below is one of those
    # shapes, and B59/B60/B61 have to report it.
    dict(id="M9-B59-state-dropped", family="M9", check="B59",
         predicate="PRIMARY_OBJECTIVE closed state set @ rule 24",
         file=RULE24, op=op_delete_line("  BLOCKED   — progress requires")),
    dict(id="M9-B59-attempt-outcome-dropped", family="M9", check="B59",
         predicate="ATTEMPT_OUTCOME closed set @ rule 24",
         file=RULE24, op=op_delete_line("  no-progress  ")),
    dict(id="M9-B59-authority-demoted", family="M9", check="B59",
         predicate="human authority over AI consensus @ rule 24 (active text)",
         file=RULE24,
         op=op_demote("Human authority is supreme. AI consensus is not human approval.")),
    dict(id="M9-B59-stop-duty-weakened", family="M9", check="B59",
         predicate="STOP duty: technical possibility is not a reason @ rule 24",
         file=RULE24,
         op=op_replace("is not a reason to continue", "is a weak reason to continue", 2)),
    dict(id="M9-B59-close-work-misclassified", family="M9", check="B59",
         predicate="required close work is not hardening @ rule 24",
         file=RULE24,
         op=op_replace("The close protocol is not scope expansion",
                       "The close protocol may be treated as optional follow-up work", 1)),
    dict(id="M9-B59-tree-row-removed", family="M9", check="B59",
         predicate="inbound decision-tree edge @ rules README",
         file=RULES_README, op=op_delete_line("24-objective-control.md")),
    dict(id="M9-B60-acceptance-row-flipped", family="M9", check="B60",
         predicate="ACCEPTED stops the work @ rule 24 ordered decision",
         file=RULE24,
         op=op_replace("3 | objective_state=ACCEPTED                                      | STOP_OBJECTIVE_DONE      | user",
                       "3 | objective_state=ACCEPTED                                      | ADJACENT_DEFECT_RECORD   | harness", 1)),
    dict(id="M9-B60-no-progress-threshold-raised", family="M9", check="B60",
         predicate="repeated no-progress surfaces @ rule 24 ordered decision",
         file=RULE24, op=op_replace("no_progress_attempts>=2", "no_progress_attempts>=9", 1)),
    dict(id="M9-B60-severity-becomes-a-condition", family="M9", check="B60",
         predicate="severity may not change a verdict (declared INVARIANT_KEY)",
         file=RULE24,
         op=op_replace("6 | blocks_acceptance=yes                                         | BLOCKER_FIX_IN_SCOPE     | harness",
                       "6 | blocks_acceptance=yes                                         | BLOCKER_FIX_IN_SCOPE     | harness\n"
                       "6.5 | severity=high                                               | BLOCKER_FIX_IN_SCOPE     | harness", 1)),
    dict(id="M9-B60-consensus-becomes-authority", family="M9", check="B60",
         predicate="lane consensus may not change a verdict (declared INVARIANT_KEY)",
         file=RULE24,
         op=op_replace("1 | conflicts_with_settled_decision=yes                           | STOP_HUMAN_DECISION      | user",
                       "1 | ai_consensus_for_more_work=yes                                | BLOCKER_FIX_IN_SCOPE     | harness", 1)),
    dict(id="M9-B60-decision-block-unparseable", family="M9", check="B60",
         predicate="the ordered decision is executable @ rule 24",
         file=RULE24, op=op_replace("```objective-decision", "```text", 1)),
    dict(id="M9-B60-scenario-expectation-flipped", family="M9", check="B60",
         predicate="recorded scenario expectations @ objective-scenarios fixture",
         file=SCEN,
         op=op_replace("improves_beyond_acceptance=yes, blocks_acceptance=no\tSTOP_OBJECTIVE_DONE",
                       "improves_beyond_acceptance=yes, blocks_acceptance=no\tHARDENING_STOP_UNLESS_GO", 1)),
    # B61's two directions. Until Phase 5 this check compared the rule's set against the ONE value
    # the handover happened to carry, so exactly one member of a closed set was ever vouched for:
    # the first mutation below was killed at the Phase 4 close and SURVIVED once commit 7aacbcb moved
    # the objective to ACCEPTED, with nothing about the check changing. Both halves are mutated now.
    dict(id="M9-B61-definition-renamed", family="M9", check="B61",
         predicate="state set: definitions half vs the transition table (direction 1)",
         file=RULE24,
         op=op_replace("  ACTIVE    — an objective is declared", "  RUNNING   — an objective is declared", 1)),
    dict(id="M9-B61-transition-renamed", family="M9", check="B61",
         predicate="state set: transition table vs the definitions half (direction 2)",
         file=RULE24,
         op=op_replace("| UNSET → ACTIVE | the **user** (declaring the objective) |",
                       "| UNSET → RUNNING | the **user** (declaring the objective) |", 1)),
    # ---- M8 index-as-router: the judgment-mistakes index drifts back into being a body ------
    # B57 replaced a contract that had been written down and never enforced ("one line each"),
    # under which the median row had grown 223 -> 544 bytes in ten days. Each mutation below is one
    # of the shapes that drift actually takes, plus the zero-denominator refusal.
    dict(id="M8-B57-duplicate-id", family="M8", check="B57",
         predicate="unique case id @ judgment-mistakes index",
         file=JMH,
         op=op_replace("| PT-32 | Project_Template S012", "| PT-31 | Project_Template S012", 1)),
    dict(id="M8-B57-empty-summary", family="M8", check="B57",
         predicate="every row carries a summary @ judgment-mistakes index",
         file=JMH,
         op=op_replace(
             "| PT-21 | Project_Template S006 (2026-08-18) | **environment incident** + PT-20 family exposure | 5 uncommitted evidence files vanished — cause UNKNOWN; recovered from the session's Write history |",
             "| PT-21 | Project_Template S006 (2026-08-18) | **environment incident** + PT-20 family exposure |  |", 1)),
    dict(id="M8-B57-body-pointer-broken", family="M8", check="B57",
         predicate="every index id resolves to a Part 2 body",
         file=JMH,
         op=op_replace("### PT-30 — the mutation fired, the reader did not",
                       "### The mutation fired, the reader did not", 1)),
    dict(id="M8-B57-defense-in-index", family="M8", check="B57",
         predicate="the defense prescription belongs to the body, not the index",
         file=JMH,
         op=op_replace(
             "| PT-27 | Project_Template S009+ (2026-08-19) | PT-13 family, **user's-goal version** | the user's declared goal was met hours earlier and every report still ended in a GO question |",
             "| PT-27 | Project_Template S009+ (2026-08-19) | PT-13 family, **user's-goal version** | the user's declared goal was met hours earlier and every report still ended in a GO question. defense = the moment the user's stated goal completes, say so first, and split the remainder into needs-you-now / eventually / never |", 1)),
    dict(id="M8-B57-zero-rows", family="M8", check="B57",
         predicate="zero-denominator refusal @ judgment-mistakes index",
         file=JMH,
         op=op_strip_index_rows),

    # ---- M7 one-sided contract: the mandatory-read contract and its instrument diverge ----
    # B53 is the only bidirectional guard in the harness, and it exists because the two halves of
    # the read contract live in different files and nothing else notices when they disagree. The
    # 2026-08-25 ruling (N-alpha) made session history conditional, which required BOTH halves to
    # move together; these two mutations move exactly one half each, in opposite directions, and
    # the check has to report the direction it saw.
    dict(id="M7-B53-contract-only", family="M7", check="B53",
         predicate="session obligation @ CLAUDE.md §0 (claimed but not measured)",
         file="CLAUDE.md",
         op=op_replace(
             "6. Task-specific rules from",
             "6. **The newest file under `prompt/maintenance/local/handover/sessions/`** "
             "— unconditional again\n7. Task-specific rules from", 1)),
    dict(id="M7-B53-roster-only", family="M7", check="B53",
         predicate="session entry @ read-load.sh ROSTER (measured but not owed)",
         file="scripts/read-load.sh",
         op=op_replace(
             'ROSTER=(\n  "CLAUDE.md|outside the hook',
             'SESSION_ENTRY="$(ls -1 "$L/handover/sessions"/S*.md 2>/dev/null | sort | tail -1)"\n'
             'ROSTER=(\n  "$SESSION_ENTRY|newest session file"\n  "CLAUDE.md|outside the hook', 1)),

    # ---- M1 rename: the token carrying the obligation stops meaning what it meant -----
    dict(id="M1-B18-authority-mode", family="M1", check="B18",
         predicate="AUTHORITY_MODE @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_replace("AUTHORITY_MODE", "AUTHORITY_NOTE")),
    dict(id="M1-B26-mode-header", family="M1", check="B26",
         predicate="PRIMARY_MODEL_MODE @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_replace("PRIMARY_MODEL_MODE", "PRIMARY_MODEL_TAG")),
    dict(id="M1-B33-exclusivity-heading", family="M1", check="B33",
         predicate="### Delegation exclusivity heading @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_replace("### Delegation exclusivity: the worker owns the technical scope",
                       "### Notes on delegation", 1)),
    dict(id="M1-B36-harness-role", family="M1", check="B36",
         predicate="Harness / Integration Conductor @ CLAUDE.md",
         file="CLAUDE.md",
         op=op_replace("Harness / Integration Conductor", "Session Coordinator")),
    dict(id="M1-B37-capsule-field", family="M1", check="B37",
         predicate="RESULT_CAPSULE_FORMAT @ delegation packet",
         file="prompt/maintenance/global/templates/delegation-packet-template.md",
         op=op_replace("RESULT_CAPSULE_FORMAT", "RESULT_FORMAT")),

    # ---- M2 removal: the obligation is deleted from its canonical owner ---------------
    dict(id="M2-B3-feeder-clause", family="M2", check="B3",
         predicate="Ask before removing or reshaping @ AGENTS generator",
         file="prompt/maintenance/global/templates/AGENTS-template.md",
         op=op_delete_line("Ask before removing or reshaping")),
    dict(id="M2-B22-eligible-denominator", family="M2", check="B22",
         predicate="eligible-task denominator @ close.md",
         file=".claude/commands/close.md",
         op=op_replace("state the eligible-task denominator alongside the mix",
                       "state the mix", 1)),
    dict(id="M2-B25-no-residual", family="M2", check="B25",
         predicate="No residual authority @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_replace("**No residual authority**", "**Authority notes**", 1)),
    dict(id="M2-B27-grounding", family="M2", check="B27",
         predicate="接地確認 @ OPERATIONS.md",
         file="OPERATIONS.md",
         op=op_replace("接地確認", "確認")),
    dict(id="M2-B29-batch-clause", family="M2", check="B29",
         predicate="never share a command batch @ close.md",
         file=".claude/commands/close.md",
         op=op_replace("A gate and the push never share a command batch",
                       "A gate and the push are run carefully", 1)),
    dict(id="M2-B30-reviewer-write-boundary", family="M2", check="B30",
         predicate="modify or commit repo-body files @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_replace("**modify or commit repo-body files**", "**edit files**", 1)),
    dict(id="M2-B34-no-shadow", family="M2", check="B34",
         predicate="no same-scope shadow execution @ rule 03",
         file="prompt/maintenance/global/rules/common/03-coding.md",
         op=op_replace("**no same-scope shadow execution**", "**no duplicate work**", 1)),
    dict(id="M2-B35-no-trust-skip", family="M2", check="B35",
         predicate="No-trust-and-skip remains forbidden @ rule 04",
         file="prompt/maintenance/global/rules/common/04-testing-strategy.md",
         op=op_replace("No-trust-and-skip remains forbidden",
                       "Verification remains expected", 1)),

    # ---- M3 invalid-context relocation: words kept, normative standing destroyed ------
    dict(id="M3-B25-completion-words-demoted", family="M3", check="B25",
         predicate="Completion words are state transitions @ rule 04",
         file="prompt/maintenance/global/rules/common/04-testing-strategy.md",
         op=op_demote("### Completion words are state transitions")),
    dict(id="M3-B33-reproduction-trigger-demoted", family="M3", check="B33",
         predicate="Parent same-scope technical reproduction @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_demote("Parent same-scope technical reproduction is permitted only",
                      heading="## Anti-patterns (what this rule does NOT say)")),
    dict(id="M3-B36-shadow-clause-demoted", family="M3", check="B36",
         predicate="Shadow-executing delegated technical scope @ CLAUDE.md",
         file="CLAUDE.md",
         op=op_demote("- Shadow-executing delegated technical scope")),
    dict(id="M3-B32-no-self-acceptance-demoted", family="M3", check="B32",
         predicate="never declare acceptance of your own deliverables @ AGENTS generator",
         file="prompt/maintenance/global/templates/AGENTS-template.md",
         op=op_demote("never declare acceptance of your own deliverables")),

    # M3 coverage for the rest of the presence family. The active-text conversion is a
    # class fix, so every converted check carries its own executed evidence rather than the
    # four that happened to be sampled first (pattern C: a sample reported as a population).
    dict(id="M3-B3-feeder-demoted", family="M3", check="B3",
         predicate="Ask before removing or reshaping @ AGENTS generator",
         file="prompt/maintenance/global/templates/AGENTS-template.md",
         op=op_demote("Ask before removing or reshaping")),
    dict(id="M3-B11-diff-demoted", family="M3", check="B11",
         predicate="handover-diff.sh @ close.md",
         file=".claude/commands/close.md",
         op=op_demote("scripts/handover-diff.sh")),
    dict(id="M3-B15-lanes-demoted", family="M3", check="B15",
         predicate="6-lane roster @ AGENTS generator",
         file="prompt/maintenance/global/templates/AGENTS-template.md",
         op=op_demote("FALSIFICATION")),
    dict(id="M3-B18-authority-demoted", family="M3", check="B18",
         predicate="AUTHORITY_MODE @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_demote("AUTHORITY_MODE")),
    dict(id="M3-B22-denominator-demoted", family="M3", check="B22",
         predicate="eligible-task denominator @ close.md",
         file=".claude/commands/close.md",
         op=op_demote("eligible-task denominator")),
    dict(id="M3-B26-undeclared-default-demoted", family="M3", check="B26",
         predicate="Undeclared = `T1-solo` @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_demote("Undeclared = `T1-solo`")),
    dict(id="M3-B27-grounding-demoted", family="M3", check="B27",
         predicate="接地確認 @ OPERATIONS.md",
         file="OPERATIONS.md",
         op=op_demote("接地確認")),
    dict(id="M3-B29-batch-clause-demoted", family="M3", check="B29",
         predicate="never share a command batch @ close.md",
         file=".claude/commands/close.md",
         op=op_demote("never share a command batch")),
    dict(id="M3-B30-write-boundary-demoted", family="M3", check="B30",
         predicate="modify or commit repo-body files @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_demote("modify or commit repo-body files")),
    dict(id="M3-B31-baton-row-demoted", family="M3", check="B31",
         predicate="Review complete — fixes pending @ rule 22",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_demote("Review complete — fixes pending")),
    dict(id="M3-B34-no-shadow-demoted", family="M3", check="B34",
         predicate="no same-scope shadow execution @ rule 03",
         file="prompt/maintenance/global/rules/common/03-coding.md",
         op=op_demote("no same-scope shadow execution")),
    dict(id="M3-B35-no-trust-skip-demoted", family="M3", check="B35",
         predicate="No-trust-and-skip remains forbidden @ rule 04",
         file="prompt/maintenance/global/rules/common/04-testing-strategy.md",
         op=op_demote("No-trust-and-skip remains forbidden")),
    dict(id="M3-B37-verbatim-stops-demoted", family="M3", check="B37",
         predicate="inherited **verbatim** @ delegation packet",
         file="prompt/maintenance/global/templates/delegation-packet-template.md",
         op=op_demote("inherited **verbatim**")),
    dict(id="M3-B38-mutation-clause-demoted", family="M3", check="B38",
         predicate="copy first and mutate the copy @ AGENTS generator",
         file="prompt/maintenance/global/templates/AGENTS-template.md",
         op=op_demote("copy first and mutate the copy")),

    # ---- M4 owner removal, pointer survives -------------------------------------------
    dict(id="M4-B11-close-owner-removed", family="M4", check="B11",
         predicate="handover-diff.sh @ close.md (owner) — decision-tree row survives",
         file=".claude/commands/close.md",
         op=op_replace("`bash scripts/handover-diff.sh`", "`the handover diff tool`")),
    dict(id="M4-B31-baton-owner-removed", family="M4", check="B31",
         predicate="### Review-report baton @ rule 22 (owner) — local/README pointer survives",
         file="prompt/maintenance/global/rules/common/22-model-orchestration.md",
         op=op_replace("### Review-report baton — the relay's hand-off format",
                       "### Notes on relays", 1)),

    # ---- M5 expected-count break -------------------------------------------------------
    dict(id="M5-B15-lane-dropped", family="M5", check="B15",
         predicate="6-lane denominator @ AGENTS generator",
         file="prompt/maintenance/global/templates/AGENTS-template.md",
         op=op_replace("FALSIFICATION", "REFUTATION")),
    dict(id="M5-B31-section-dropped", family="M5", check="B31",
         predicate="5-section denominator @ review-report template",
         file="prompt/maintenance/global/templates/review-report-template.md",
         op=op_replace("## §5. Independent re-measurements", "## §5. Notes", 1)),
    dict(id="M5-B37-field-dropped", family="M5", check="B37",
         predicate="CONFLICT_SURFACE field @ delegation packet contract block",
         file="prompt/maintenance/global/templates/delegation-packet-template.md",
         op=op_delete_line("CONFLICT_SURFACE: {{MANDATORY_OR_OPTIONAL}}")),
    dict(id="M5-B55-supersedes-dropped", family="M5", check="B55",
         predicate="9/9 current-state responsibilities @ 16.md",
         file="prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md",
         op=op_replace("*Supersedes*:", "*Replaces*:")),
    dict(id="M5-B54-state-injected", family="M5", check="B54",
         predicate="2/2 pointer-only sections @ CLAUDE.md",
         file="CLAUDE.md",
         op=op_replace("Plan register: `local/plans/active/`",
                       "✅ Phase 2 completed 2026-08-25 (f581918).\n\nPlan register: `local/plans/active/`", 1)),

    # ---- M6 wrong target: the phrase survives, in the wrong file ------------------------
    dict(id="M6-B34-moved-to-other-rule", family="M6", check="B34",
         predicate="no same-scope shadow execution — owner file identity",
         file="prompt/maintenance/global/rules/common/03-coding.md",
         also="prompt/maintenance/global/rules/common/06-dead-code-removal.md",
         op=op_replace("**no same-scope shadow execution**", "**no duplicate work**", 1),
         also_op=lambda t: (t + "\n\nDuring a delegation the parent performs **no same-scope shadow execution**.\n",
                            "phrase planted in a non-owner rule")),
    dict(id="M6-B35-moved-to-other-rule", family="M6", check="B35",
         predicate="E3 — parent reproduction — owner file identity",
         file="prompt/maintenance/global/rules/common/04-testing-strategy.md",
         also="prompt/maintenance/global/rules/common/01-investigation.md",
         op=op_replace("- **E3 — parent reproduction:**", "- **Parent re-run:**", 1),
         also_op=lambda t: (t + "\n\n- **E3 — parent reproduction:** exception-only.\n",
                            "phrase planted in a non-owner rule")),

    # M4 for the harness's OWN inbound edge: a mechanism nothing routes to is operationally
    # absent (README §Writing for the reader, principle 1), so the edge is a contract too.
    dict(id="M4-B2-harness-edge-removed", family="M4", check="B2",
         predicate="mutation-harness.py row @ decision tree (inbound edge)",
         file="prompt/maintenance/global/rules/README.md",
         op=op_delete_line("`scripts/mutation-harness.py`")),

    # ---- control: a mutation that changes nothing must never be counted as a kill ------
    dict(id="CTL-noop", family="CONTROL", check="B18",
         predicate="(no predicate — deliberate no-op control)",
         file="CLAUDE.md", op=op_noop, expect="INVALID"),
]


# --------------------------------------------------------------------------- machinery
def sh(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str),
                          capture_output=True, text=True)


def manifest(tree):
    """sha256 of every tracked-ish file, .git excluded — used to prove a mutation touched
    only what it declared."""
    out = {}
    for dirpath, dirnames, filenames in os.walk(tree):
        dirnames[:] = [d for d in dirnames if d != ".git"]
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, tree)
            try:
                with open(p, "rb") as fh:
                    out[rel] = hashlib.sha256(fh.read()).hexdigest()
            except OSError:
                out[rel] = "UNREADABLE"
    return out


def run_selftest(tree):
    r = sh(["bash", SELFTEST], tree)
    # Ids are emitted in three shapes: "B18 ", "B54: " and "B4s:" — a parser that
    # accepts only the first silently reads a red check as unlabelled and reports a
    # false SURVIVOR. Measured on this harness's own first run (S012): B54 and B55
    # were red by hand and came back "newly red: none" (case PT-12 — when a mutation
    # does not fire, prove the mutation before blaming the check; here the mutation
    # was sound and the READER was broken).
    ID = r"(B[0-9]+[a-z]?)[: ]"
    red = set(re.findall(r"^  ❌ " + ID, r.stdout, re.M))
    unlabelled = len(re.findall(r"^  ❌ (?!" + ID + ")", r.stdout, re.M))
    unlab_ok = len(re.findall(r"^  ✅ (?!" + ID + ")", r.stdout, re.M))
    m = re.search(r"RESULT: (\d+) passed / (\d+) failed", r.stdout)
    return types.SimpleNamespace(
        rc=r.returncode, red=red, unlabelled_red=unlabelled,
        unlabelled_ok=unlab_ok,
        passed=int(m.group(1)) if m else -1,
        failed=int(m.group(2)) if m else -1, out=r.stdout)


def apply_op(tree, relpath, op):
    full = os.path.join(tree, relpath)
    if not os.path.exists(full):
        return False, "target file absent: %s" % relpath
    before = open(full, encoding="utf-8").read()
    new, note = op(before)
    if new is None:
        return False, note
    if new == before:
        return False, "edit produced an identical file (%s)" % note
    open(full, "w", encoding="utf-8").write(new)
    return True, note


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--control", choices=["rubber-stamp", "zero-target"])
    ap.add_argument("--keep", action="store_true", help="keep the working trees")
    args = ap.parse_args()

    catalog = [] if args.control == "zero-target" else MUTATIONS

    print("MUTATION HARNESS — scripts/mutation-harness.py")
    print("repo: %s" % ROOT)
    if args.control:
        print("CONTROL RUN: %s" % args.control)
    print()

    work = tempfile.mkdtemp(prefix="mutharness-")
    pristine = os.path.join(work, "pristine")
    live = os.path.join(work, "Project_Template")
    shutil.copytree(ROOT, pristine, symlinks=True,
                    ignore=shutil.ignore_patterns(".git"))
    shutil.copytree(ROOT, live, symlinks=True)

    if args.control == "rubber-stamp":
        # Replace the instrument with a validator that passes everything. Every mutation must
        # then SURVIVE, and this harness must refuse to report success.
        #
        # The stub is written into BOTH trees on purpose. Stamping only the live tree made the
        # control pass for the wrong reason (measured on its first run, S012): the manifest read
        # scripts/selftest.sh as a collateral edit, every mutation came back INVALID, and the
        # run refused at M=0 — a refusal that says nothing about whether an always-pass
        # validator can manufacture kills. A control that cannot fail the way it claims to test
        # is the shape of PT-2.
        stub = ("#!/bin/bash\necho '  ✅ everything is fine'\n"
                "echo\necho 'RESULT: 64 passed / 0 failed'\nexit 0\n")
        for tree in (live, pristine):
            with open(os.path.join(tree, SELFTEST), "w", encoding="utf-8") as fh:
                fh.write(stub)

    base = run_selftest(live)
    if base.passed <= 0:
        print("INSTRUMENT_ERROR: baseline selftest in the working copy reported "
              "%d passed / %d failed — nothing can be measured against it."
              % (base.passed, base.failed))
        return 2
    checks_scanned = base.passed + base.failed
    print("baseline (unmutated copy): %d passed / %d failed, RC=%d"
          % (base.passed, base.failed, base.rc))
    print("baseline red set (excluded from kill accounting): %s"
          % (", ".join(sorted(base.red)) or "none"))
    if base.unlabelled_red:
        print("baseline red lines carrying no check id: %d" % base.unlabelled_red)
    print()

    target_checks = sorted({m["check"] for m in catalog if m["family"] != "CONTROL"})
    target_predicates = sorted({m["predicate"] for m in catalog if m["family"] != "CONTROL"})
    print("DENOMINATORS")
    print("  checks scanned (selftest emits)      : %d" % checks_scanned)
    print("  mutation target checks               : %d  (%s)"
          % (len(target_checks), ", ".join(target_checks)))
    print("  mutation target predicates           : %d" % len(target_predicates))
    print("  mutations in catalog                 : %d" % len(catalog))
    print()

    if not catalog or not target_checks:
        print("REFUSED: mutation target set is empty. A harness with nothing to mutate "
              "prints the same thing as a harness that killed everything "
              "(zero-denominator refusal).")
        print("\nRESULT: targets=%d mutations=0 — PASS is not available."
              % len(target_checks))
        shutil.rmtree(work, ignore_errors=True)
        return 1

    pris = manifest(pristine)
    executed = killed = survived = invalid = 0
    rows = []

    for mut in catalog:
        touched = [mut["file"]] + ([mut["also"]] if mut.get("also") else [])
        okmain, note = apply_op(live, mut["file"], mut["op"])
        note_extra = ""
        if okmain and mut.get("also_op"):
            ok2, note2 = apply_op(live, mut["also"], mut["also_op"])
            note_extra = "; also: " + note2
            okmain = okmain and ok2

        if not okmain:
            invalid += 1
            rows.append((mut["id"], mut["family"], mut["check"], "INVALID_MUTATION",
                         note + note_extra))
            for t in touched:
                shutil.copy2(os.path.join(pristine, t), os.path.join(live, t))
            continue

        # §5: prove the mutation changed the declared targets and NOTHING else.
        now = manifest(live)
        changed = sorted(k for k in set(now) | set(pris)
                         if pris.get(k) != now.get(k))
        stray = [c for c in changed if c not in touched]
        if stray:
            for t in touched:
                shutil.copy2(os.path.join(pristine, t), os.path.join(live, t))
            invalid += 1
            rows.append((mut["id"], mut["family"], mut["check"], "INVALID_MUTATION",
                         "collateral edit outside the declared targets: %s" % stray[:3]))
            continue
        if sorted(changed) != sorted(touched):
            missing = [t for t in touched if t not in changed]
            for t in touched:
                shutil.copy2(os.path.join(pristine, t), os.path.join(live, t))
            invalid += 1
            rows.append((mut["id"], mut["family"], mut["check"], "INVALID_MUTATION",
                         "declared target(s) unchanged: %s" % missing))
            continue

        executed += 1
        res = run_selftest(live)
        newly_red = res.red - base.red
        if mut["check"] in newly_red:
            killed += 1
            verdict = "KILLED"
            detail = "%s went green->red%s" % (
                mut["check"],
                " (collateral: %s)" % ", ".join(sorted(newly_red - {mut["check"]}))
                if newly_red - {mut["check"]} else "")
        else:
            survived += 1
            verdict = "SURVIVED"
            detail = "%s stayed green (newly red: %s)" % (
                mut["check"], ", ".join(sorted(newly_red)) or "none")
        rows.append((mut["id"], mut["family"], mut["check"], verdict,
                     note + note_extra + " — " + detail))

        for t in touched:
            shutil.copy2(os.path.join(pristine, t), os.path.join(live, t))
        after = manifest(live)
        drift = [k for k in touched if after.get(k) != pris.get(k)]
        if drift:
            print("INSTRUMENT_ERROR: restore failed for %s" % drift)
            return 2

    # every mutation restored: the working copy must be byte-identical to pristine
    final = manifest(live)
    contaminated = sorted(k for k in set(final) | set(pris)
                          if pris.get(k) != final.get(k))
    print("%-34s %-4s %-5s %-16s %s" % ("mutation", "fam", "check", "verdict", "detail"))
    print("-" * 118)
    for r in rows:
        print("%-34s %-4s %-5s %-16s %s" % (r[0], r[1], r[2], r[3], r[4][:150]))
    print()

    print("SURVIVAL ACCOUNTING (denominators printed; INVALID is never a kill)")
    print("  targeted checks        N = %d" % len(target_checks))
    print("  mutations executed     M = %d" % executed)
    print("  mutations killed       K = %d" % killed)
    print("  mutations survived     S = %d" % survived)
    print("  invalid mutations      I = %d" % invalid)
    print("  catalog entries            %d (M + I = %d)" % (len(catalog), executed + invalid))
    print("  working copy contamination after restore: %s"
          % (contaminated or "none (byte-identical to pristine)"))
    print()

    ok = True
    if executed == 0:
        print("REFUSED: M = 0. No mutation was executed, so no detection power was shown.")
        ok = False
    if survived:
        print("NOT ACCEPTED: %d survivor(s). A survivor is classified before anything is "
              "changed: did the mutation actually break the contract, is the matcher "
              "looking at the canonical owner, is the check presence-only?" % survived)
        ok = False
    if contaminated:
        print("INSTRUMENT_ERROR: the working copy did not restore cleanly: %s"
              % contaminated[:5])
        shutil.rmtree(work, ignore_errors=True) if not args.keep else None
        return 2

    ctl_rows = [r for r in rows if r[1] == "CONTROL"]
    for r in ctl_rows:
        expected = next(m.get("expect") for m in catalog if m["id"] == r[0])
        if expected == "INVALID" and r[3] != "INVALID_MUTATION":
            print("CONTROL FAILED: %s was expected to be INVALID_MUTATION, got %s — a "
                  "no-op is being counted as real work." % (r[0], r[3]))
            ok = False

    if args.control == "rubber-stamp":
        # inverted acceptance: the stub must make everything survive
        if survived == executed and executed > 0:
            print("CONTROL PASSED (rubber-stamp): the always-pass validator killed 0/%d "
                  "mutations and this harness refused to report success." % executed)
            print("\nRESULT: rubber-stamp control behaved correctly.")
            shutil.rmtree(work, ignore_errors=True) if not args.keep else None
            return 0
        print("CONTROL FAILED (rubber-stamp): an always-pass validator produced K=%d — "
              "kills are being manufactured somewhere other than the instrument." % killed)
        shutil.rmtree(work, ignore_errors=True) if not args.keep else None
        return 1

    print("LIMITS — what a green run here does and does not prove")
    print("  proves : each targeted check reports RED when the guarded contract is broken")
    print("           in the mutated way (phrase presence, active normative text,")
    print("           structural conformance, owner identity, expected counts).")
    print("  does NOT prove: runtime compliance. No mutation here can observe whether a")
    print("           session actually obeyed a rule. selftest green is a statement about")
    print("           documents; behaviour is measured, not gated (rule 22 §Success criteria).")
    print("  not covered: checks with no mutation in the catalog; and result lines that")
    print("           carry no check id (%d of %d in the baseline run) cannot be"
          % (base.unlabelled_ok + base.unlabelled_red, checks_scanned))
    print("           addressed by this harness at all.")
    print()
    print("RESULT: %s (N=%d M=%d K=%d S=%d I=%d)"
          % ("ACCEPTED" if ok else "NOT ACCEPTED",
             len(target_checks), executed, killed, survived, invalid))
    if not args.keep:
        shutil.rmtree(work, ignore_errors=True)
    else:
        print("trees kept at %s" % work)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
