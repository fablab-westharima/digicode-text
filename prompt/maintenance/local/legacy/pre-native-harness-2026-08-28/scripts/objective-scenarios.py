#!/usr/bin/env python3
"""Objective-control scenario harness — executes the decision procedure that rule 24 states,
against scenarios whose expected outcome is written down independently of it.

Why this exists (Project_Template Phase 4, 2026-08-25): the objective-control policy is a set
of propositions about when an agent must STOP, what a finding may be promoted into, and who
owns the decision. A policy proves nothing by being present — the harness's own settled ruling
is that a guard is unverified until something makes it red (Phase 3, scripts/mutation-harness.py).
So the ordered decision in rule 24 is not prose to be read and agreed with: it is parsed from
the rule file and EXECUTED here, and every scenario the project claims the policy handles is
run through it.

What it proves:
  * the ordered decision in rule 24 produces the expected verdict for each recorded scenario;
  * two facts can never change a verdict — lane consensus and severity — measured by evaluating
    every scenario twice with the fact set both ways and requiring an identical verdict;
  * every row of the decision is load-bearing: deleting it changes at least one scenario's
    verdict, so no row is decoration and no row is unmeasured.

What it does NOT prove: that a future session actually stops. This reads documents and
evaluates a table; runtime compliance is observed in later sessions, never gated here.

Usage:
  python3 scripts/objective-scenarios.py
  python3 scripts/objective-scenarios.py --control empty-table   # must refuse (exit 2)
  python3 scripts/objective-scenarios.py --control drop-row=3    # must fail (exit 1)
Exit: 0 = accepted / 1 = an expectation failed / 2 = INSTRUMENT_ERROR (nothing measured).
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULE = "prompt/maintenance/global/rules/common/24-objective-control.md"
FIXTURE = "scripts/fixtures/objective-scenarios.tsv"

# Same policy as scripts/mutation-harness.py and selftest.sh active_text(): only an explicit
# obsolescence marker in a HEADING demotes what follows. Fenced blocks stay normative here —
# the decision table IS a fenced block, exactly like rule 22's packet grammar (ruling
# 2026-08-25, active text). Demoting the section that holds the table must therefore make this
# harness refuse, not silently keep executing a rule the document has retired.
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


# ------------------------------------------------------------------ parsing the rule's table
def parse_decision(text):
    """Return (rows, invariant_keys) parsed from the ```objective-decision block."""
    block = None
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.strip() == "```objective-decision":
            for j in range(i + 1, len(lines)):
                if lines[j].startswith("```"):
                    block = lines[i + 1 : j]
                    break
            break
    if block is None:
        raise InstrumentError("no ```objective-decision block in active text of %s" % RULE)

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


# ------------------------------------------------------------------------- parsing scenarios
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


# --------------------------------------------------------------------------------------- run
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
    verdict_checked = len(scenarios)

    # (2) invariance: a fact declared INVARIANT_KEY may not move any scenario's verdict.
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

    # (3) row coverage: deleting any row must change at least one scenario's verdict. A row no
    #     scenario exercises is an unmeasured clause, which is the shape this project refuses
    #     (M=0 refuses to pass, scripts/mutation-harness.py).
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

    print("Objective-control scenario harness — rule %s" % RULE)
    print("  decision rows parsed        %d" % len(rows))
    print("  invariant keys              %d (%s)" % (len(invariants), ", ".join(invariants)))
    print("  scenarios evaluated         %d/%d" % (verdict_checked, len(scenarios)))
    print("  invariance evaluations      %d" % inv_checked)
    print("  rows exercised by a scenario %d/%d" % (len(rows) - len(uncovered), len(rows)))
    for f in failures:
        print("  ✗ %s" % f)
    print("")
    print("LIMITS — a green run here proves the POLICY's decision procedure produces the recorded")
    print("  verdicts, and that consensus and severity cannot move them. It does not observe any")
    print("  session's behaviour: runtime compliance requires future-session evidence.")
    if failures:
        print("RESULT: FAILED (scenarios=%d invariance=%d failures=%d)"
              % (len(scenarios), inv_checked, len(failures)))
        return 1
    print("RESULT: ACCEPTED (scenarios=%d/%d invariance=%d/%d rows=%d/%d failures=0)"
          % (verdict_checked, len(scenarios), inv_checked, inv_checked, len(rows), len(rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
