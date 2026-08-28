#!/usr/bin/env python3
"""Delegation-action scenario harness — executes the classification that rule 22 states, against
scenarios whose expected outcome is written down independently of it.

Why this exists (Project_Template Phase 5, 2026-08-25): the delegation boundary was prose plus a
runtime auditor, and the auditor's own rule was "any parent tool call inside the window is a
violation, except one hard-coded command". Measured that day: a status poll plus a read of the
handover to check PRIMARY_OBJECTIVE produced verdict FAIL, while a subagent delegation with the
parent running the worker's tests and editing the worker's file in parallel produced PASS. Both
halves of the boundary were wrong, in opposite directions, and neither was visible because nothing
executed the *classification* — only the prohibition.

What it proves:
  * the ordered decision in rule 22 produces the expected verdict for each recorded scenario,
    including the scenarios that must NOT be shadow (false-positive control) and the ones that
    must (false-negative control);
  * four facts can never change a verdict — tool use, delegate wait time, cheapness, and whether
    a duplicate run would have been adopted — measured by evaluating every scenario with the fact
    set both ways and requiring an identical verdict;
  * every row of the decision is load-bearing: deleting it changes at least one scenario's verdict.

What it does NOT prove: that a session actually behaved this way. This reads a document and
evaluates a table. Runtime evidence is scripts/shadow_audit.py, and its own limits are stated there.

This duplicates the parsing shape of scripts/objective-scenarios.py deliberately: factoring the two
into a shared module is a refactor of a Phase 4 artifact guarded by B60 and mutation family M9, and
that is a separate objective (recorded as a baton, not taken here).

Usage:
  python3 scripts/delegation-scenarios.py
  python3 scripts/delegation-scenarios.py --control empty-table   # must refuse (exit 2)
  python3 scripts/delegation-scenarios.py --control drop-row=5    # must fail (exit 1)
Exit: 0 = accepted / 1 = an expectation failed / 2 = INSTRUMENT_ERROR (nothing measured).
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULE = "prompt/maintenance/global/rules/common/22-model-orchestration.md"
FIXTURE = "scripts/fixtures/delegation-scenarios.tsv"
FENCE = "```delegation-decision"

# Same active-text policy as scripts/mutation-harness.py, selftest.sh and objective-scenarios.py:
# only an explicit obsolescence marker in a HEADING demotes what follows; fenced blocks stay
# normative, because the decision table IS a fenced block (ruling 2026-08-25, active text).
INACTIVE_HEADING = re.compile(
    r"^#{1,6} .*(anti-pattern|obsolete|superseded|deprecated|❌)", re.IGNORECASE
)


class InstrumentError(Exception):
    pass


def active_text(text):
    out, inactive, lvl = [], False, 0
    for line in text.splitlines():
        if line.startswith("#"):
            here = len(line) - len(line.lstrip("#"))
            if inactive and here <= lvl:
                inactive = False
            if INACTIVE_HEADING.match(line):
                inactive, lvl = True, here
            if inactive:
                continue
        if not inactive:
            out.append(line)
    return "\n".join(out)


def parse_decision(text):
    """Return (rows, invariant_keys) parsed from the ```delegation-decision block."""
    block = None
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.strip() == FENCE:
            for j in range(i + 1, len(lines)):
                if lines[j].startswith("```"):
                    block = lines[i + 1 : j]
                    break
            break
    if block is None:
        raise InstrumentError("no %s block in active text of %s" % (FENCE, RULE))

    rows, invariants = [], []
    for raw in block:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if parts[0] == "INVARIANT_KEY":
            if len(parts) < 2 or not parts[1]:
                raise InstrumentError("malformed INVARIANT_KEY line: %r" % raw)
            invariants.append(parts[1])
            continue
        if len(parts) != 4:
            raise InstrumentError("malformed decision row (want 4 fields): %r" % raw)
        order, conds, verdict, authority = parts
        if not order.isdigit():
            raise InstrumentError("decision row does not start with an order number: %r" % raw)
        if not verdict or not authority:
            raise InstrumentError("decision row missing verdict or authority: %r" % raw)
        rows.append(
            dict(order=int(order), conditions=parse_conditions(conds, raw),
                 verdict=verdict, authority=authority, raw=line)
        )
    rows.sort(key=lambda r: r["order"])
    if [r["order"] for r in rows] != list(range(1, len(rows) + 1)):
        raise InstrumentError("decision rows are not numbered 1..N without gaps")
    # The default row must be the prohibition: a fail-open default in a prohibition table hands out
    # permission for every case nobody thought of, which is exactly how the FN half was measured.
    if rows and rows[-1]["conditions"] == [] and rows[-1]["verdict"] != "SHADOW_EXECUTION":
        raise InstrumentError("the default row is %s, not SHADOW_EXECUTION — the table fails open"
                              % rows[-1]["verdict"])
    return rows, invariants


def parse_conditions(spec, raw):
    if spec == "*":
        return []
    conds = []
    for piece in spec.split(","):
        piece = piece.strip()
        m = re.match(r"^([a-z_]+)(>=|=)(.+)$", piece)
        if not m:
            raise InstrumentError("malformed condition %r in row %r" % (piece, raw))
        key, op, val = m.group(1), m.group(2), m.group(3).strip()
        if op == ">=":
            if not val.isdigit():
                raise InstrumentError("non-numeric >= comparand in row %r" % raw)
            conds.append((key, ">=", int(val)))
        else:
            conds.append((key, "=", val))
    return conds


def evaluate(rows, facts):
    for row in rows:
        hit = True
        for key, op, val in row["conditions"]:
            got = facts.get(key)
            if op == "=":
                if got != val:
                    hit = False
                    break
            else:
                try:
                    n = int(got)
                except (TypeError, ValueError):
                    hit = False
                    break
                if n < val:
                    hit = False
                    break
        if hit:
            return row
    raise InstrumentError("no row matched facts %r — the decision has no default row" % facts)


def parse_scenarios(text):
    scenarios = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("\t") if p.strip() != ""]
        if len(parts) != 4:
            raise InstrumentError("malformed scenario line (want 4 tab-separated fields): %r" % raw)
        sid, title, factspec, expected = parts
        facts = {}
        for piece in factspec.split(","):
            piece = piece.strip()
            if not piece:
                continue
            if "=" not in piece:
                raise InstrumentError("malformed fact %r in scenario %s" % (piece, sid))
            k, v = piece.split("=", 1)
            facts[k.strip()] = v.strip()
        scenarios.append(dict(id=sid, title=title, facts=facts, expected=expected))
    return scenarios


def known_keys(rows, invariants):
    keys = set(invariants)
    for row in rows:
        for key, _op, _val in row["conditions"]:
            keys.add(key)
    return keys


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--control", default=None,
                    help="empty-table | drop-row=N — negative controls; both must NOT pass")
    args = ap.parse_args()

    try:
        with open(os.path.join(ROOT, RULE), encoding="utf-8") as fh:
            rule_text = active_text(fh.read())
        with open(os.path.join(ROOT, FIXTURE), encoding="utf-8") as fh:
            fixture_text = fh.read()
        rows, invariants = parse_decision(rule_text)
        scenarios = parse_scenarios(fixture_text)
    except InstrumentError as exc:
        print("INSTRUMENT_ERROR: %s" % exc)
        return 2
    except OSError as exc:
        print("INSTRUMENT_ERROR: %s" % exc)
        return 2

    if args.control == "empty-table":
        rows = []
    elif args.control and args.control.startswith("drop-row="):
        n = int(args.control.split("=", 1)[1])
        rows = [r for r in rows if r["order"] != n]

    # Zero-denominator refusal: an empty parse prints the same "0 failures" a perfect run does.
    if not rows or not scenarios or not invariants:
        print("INSTRUMENT_ERROR: nothing measured — decision rows %d / scenarios %d / invariant keys %d"
              % (len(rows), len(scenarios), len(invariants)))
        return 2

    allowed = known_keys(rows, invariants)
    failures = []

    # (1) every scenario reaches its expected verdict.
    for sc in scenarios:
        unknown = sorted(set(sc["facts"]) - allowed)
        if unknown and not args.control:
            failures.append("%s: fact key(s) no decision row or invariant knows about: %s"
                            % (sc["id"], ", ".join(unknown)))
            continue
        try:
            got = evaluate(rows, sc["facts"])["verdict"]
        except InstrumentError as exc:
            failures.append("%s: %s" % (sc["id"], exc))
            continue
        if got != sc["expected"]:
            failures.append("%s (%s): expected %s, decision gave %s"
                            % (sc["id"], sc["title"], sc["expected"], got))

    # (2) both controls must be non-empty. A classification harness whose scenarios are all
    #     violations proves only that it can say no; one whose scenarios are all permitted proves
    #     only that it can say yes. Both directions are required, with printed denominators.
    shadow_expected = [s for s in scenarios if s["expected"] == "SHADOW_EXECUTION"]
    permitted_expected = [s for s in scenarios if s["expected"] != "SHADOW_EXECUTION"]
    if not args.control:
        if not shadow_expected:
            failures.append("no scenario expects SHADOW_EXECUTION — false-negative control absent")
        if not permitted_expected:
            failures.append("no scenario expects a permitted class — false-positive control absent")

    # (3) invariance: a fact declared INVARIANT_KEY may not move any scenario's verdict.
    inv_checked = 0
    for key in invariants:
        for sc in scenarios:
            verdicts = set()
            for value in ("yes", "no", "high", "low"):
                facts = dict(sc["facts"])
                facts[key] = value
                try:
                    verdicts.add(evaluate(rows, facts)["verdict"])
                except InstrumentError as exc:
                    failures.append("%s/%s: %s" % (sc["id"], key, exc))
                    verdicts.add("ERROR")
            inv_checked += 1
            if len(verdicts) > 1:
                failures.append("%s: %r changed the verdict (%s) — it is declared invariant"
                                % (sc["id"], key, ", ".join(sorted(verdicts))))

    # (4) row coverage: deleting any row must change at least one scenario's verdict.
    uncovered = []
    if not args.control:
        for row in rows:
            reduced = [r for r in rows if r["order"] != row["order"]]
            moved = False
            for sc in scenarios:
                try:
                    before = evaluate(rows, sc["facts"])["verdict"]
                    after = evaluate(reduced, sc["facts"])["verdict"]
                except InstrumentError:
                    moved = True   # losing the default row is itself a detected change
                    break
                if before != after:
                    moved = True
                    break
            if not moved:
                uncovered.append(row["order"])
        if uncovered:
            failures.append("decision rows exercised by no scenario: %s"
                            % ", ".join(str(o) for o in uncovered))

    print("Delegation-action scenario harness — rule %s" % RULE)
    print("  decision rows parsed         %d" % len(rows))
    print("  invariant keys               %d (%s)" % (len(invariants), ", ".join(invariants)))
    print("  scenarios evaluated          %d/%d" % (len(scenarios), len(scenarios)))
    print("  must-flag scenarios          %d (expect SHADOW_EXECUTION)" % len(shadow_expected))
    print("  must-not-flag scenarios      %d (expect a permitted class)" % len(permitted_expected))
    print("  invariance evaluations       %d" % inv_checked)
    print("  rows exercised by a scenario %d/%d" % (len(rows) - len(uncovered), len(rows)))
    for f in failures:
        print("  ✗ %s" % f)
    print("")
    print("LIMITS — a green run here proves the POLICY's classification produces the recorded")
    print("  verdicts, and that tool use, wait time, cheapness and would-not-have-been-adopted")
    print("  cannot move them. It observes no session: runtime evidence is scripts/shadow_audit.py,")
    print("  and neither instrument can see reasoning that never reached a tool call.")
    if failures:
        print("RESULT: FAILED (scenarios=%d invariance=%d failures=%d)"
              % (len(scenarios), inv_checked, len(failures)))
        return 1
    print("RESULT: ACCEPTED (scenarios=%d/%d must-flag=%d must-not-flag=%d invariance=%d/%d rows=%d/%d failures=0)"
          % (len(scenarios), len(scenarios), len(shadow_expected), len(permitted_expected),
             inv_checked, inv_checked, len(rows), len(rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
