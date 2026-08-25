#!/usr/bin/env python3
"""Routing scenario harness — executes the routing decision that rule 22 states, against scenarios
whose expected outcome is written down independently of it, and against a profile that owns every
value the decision needs.

Why this exists (Project_Template Phase 6, 2026-08-25): before this, which target a delegation went
to and at what reasoning effort was a *setting*, not a decision. Inventory measured the consequence:
`effort` had no owner anywhere in the common layer — three scattered mentions, no baseline, no
authority, no evidence duty, and one rule hard-coding a consumer's effort value as a standing
instruction to self-upgrade. The role->model mapping meanwhile existed in two places at once.

What it proves:
  * the ordered decision in rule 22 produces the expected verdict for each recorded scenario,
    including the ones that must be allowed (false-positive control) and the ones that must be
    refused (false-negative control);
  * the facts the decision runs on are RESOLVED FROM THE PROFILE, not asserted by the caller —
    a scenario names a target and an effort, and this harness looks them up. The mapping is never
    re-implemented here, so the profile stays the single owner (rule 22 §Routing decision);
  * eight facts can never change a verdict — short task, spare quota, an expensive target being
    available, a cheaper one being available, a slow worker, the AI preferring it, the transport
    accepting the value, and a worker escalation being in flight;
  * every row of the decision is load-bearing: deleting it changes at least one scenario's verdict;
  * a missing or unparseable profile REFUSES rather than degrading to "no routing constraints".

What it does NOT prove: that the mapping is a good one, that a higher effort produces better work,
that the evidence is true, or that the transport behaves as the profile says. Format validation is
not truth validation — rule 22 §Routing decision §LIMITS states the full list.

This shares the parsing shape of scripts/objective-scenarios.py and scripts/delegation-scenarios.py
deliberately; factoring the three into one module is a refactor of Phase 4/5 artifacts guarded by
B60/B63 and mutation families M9/M10, and that is a separate objective (baton, not taken here).

Usage:
  python3 scripts/routing-scenarios.py
  python3 scripts/routing-scenarios.py --profile prompt/maintenance/local/docs/routing-profile.md
  python3 scripts/routing-scenarios.py --control empty-table   # must refuse (exit 2)
  python3 scripts/routing-scenarios.py --control drop-row=7    # must fail (exit 1)
  python3 scripts/routing-scenarios.py --control no-profile    # must refuse (exit 2)
Exit: 0 = accepted / 1 = an expectation failed / 2 = INSTRUMENT_ERROR (nothing measured).
"""

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULE = "prompt/maintenance/global/rules/common/22-model-orchestration.md"
PROFILE = "scripts/fixtures/routing-profile.md"
FIXTURE = "scripts/fixtures/routing-scenarios.tsv"
FENCE = "```routing-decision"
PROFILE_FENCE = "```routing-profile"

VOCAB_KEYS = ("ROLE_VOCABULARY", "STATUS_VOCABULARY", "AUTHORITY_VOCABULARY",
              "REASON_VOCABULARY", "LANE_VOCABULARY")

# Same active-text policy as the other harnesses: only an explicit obsolescence marker in a HEADING
# demotes what follows; fenced blocks stay normative, because the decision table IS a fenced block
# (ruling 2026-08-25, active text).
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


def fenced_block(text, fence, where):
    lines = text.splitlines()
    for i, line in enumerate(lines):
        if line.strip() == fence:
            for j in range(i + 1, len(lines)):
                if lines[j].startswith("```"):
                    return lines[i + 1:j]
            raise InstrumentError("unterminated %s block in %s" % (fence, where))
    raise InstrumentError("no %s block in active text of %s" % (fence, where))


# --------------------------------------------------------------------------- the decision
def parse_decision(text):
    """Return (rows, invariant_keys, vocabularies) from the ```routing-decision block."""
    block = fenced_block(text, FENCE, RULE)
    rows, invariants, vocab = [], [], {}
    for raw in block:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        head = parts[0]
        if head in VOCAB_KEYS:
            values = [p for p in parts[1:] if p]
            if not values:
                raise InstrumentError("%s declares no values" % head)
            if len(set(values)) != len(values):
                raise InstrumentError("%s repeats a value" % head)
            vocab[head] = values
            continue
        if head == "INVARIANT_KEY":
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
        rows.append(dict(order=int(order), conditions=parse_conditions(conds, raw),
                         verdict=verdict, authority=authority, raw=line))
    rows.sort(key=lambda r: r["order"])
    if [r["order"] for r in rows] != list(range(1, len(rows) + 1)):
        raise InstrumentError("decision rows are not numbered 1..N without gaps")
    # A routing table that fails OPEN hands out whatever the environment happened to be set to for
    # every case nobody thought of. The default row must be the refusal.
    if rows and rows[-1]["conditions"] == [] and rows[-1]["verdict"] != "REJECT_UNROUTED":
        raise InstrumentError("the default row is %s, not REJECT_UNROUTED — the table fails open"
                              % rows[-1]["verdict"])
    for key in VOCAB_KEYS:
        if key not in vocab:
            raise InstrumentError("the decision block declares no %s" % key)
    return rows, invariants, vocab


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


# --------------------------------------------------------------------------- the profile
def parse_profile(text, vocab, where):
    """Return {id: target dict}. Every structural defect here is an InstrumentError: a profile that
    cannot be trusted is not a small problem, it is no measurement (fail closed)."""
    block = fenced_block(text, PROFILE_FENCE, where)
    targets = {}
    for raw in block:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if parts[0] == "NOTE":
            continue
        if parts[0] != "TARGET":
            raise InstrumentError("unknown profile record %r in %s" % (parts[0], where))
        if len(parts) != 10:
            raise InstrumentError("profile TARGET row wants 10 fields, got %d: %r"
                                  % (len(parts), raw))
        _, tid, role, lanes, status, dispatchable, authority, scale, baseline, fixed = parts
        if not tid:
            raise InstrumentError("profile TARGET row with an empty id: %r" % raw)
        if tid in targets:
            raise InstrumentError("profile declares target %r twice" % tid)
        if role not in vocab["ROLE_VOCABULARY"]:
            raise InstrumentError("target %s: role %r is not in ROLE_VOCABULARY" % (tid, role))
        if lanes != "*":
            for lane in lanes.split("+"):
                if lane not in vocab["LANE_VOCABULARY"]:
                    raise InstrumentError("target %s: lane %r is not in LANE_VOCABULARY"
                                          % (tid, lane))
        if status not in vocab["STATUS_VOCABULARY"]:
            raise InstrumentError("target %s: status %r is not in STATUS_VOCABULARY" % (tid, status))
        if authority not in vocab["AUTHORITY_VOCABULARY"]:
            raise InstrumentError("target %s: authority %r is not in AUTHORITY_VOCABULARY"
                                  % (tid, authority))
        if dispatchable not in ("yes", "no"):
            raise InstrumentError("target %s: dispatchable %r is not yes/no" % (tid, dispatchable))
        if fixed not in ("yes", "no"):
            raise InstrumentError("target %s: effort_fixed %r is not yes/no" % (tid, fixed))
        if scale == "NONE":
            values = []
            if baseline != "NONE":
                raise InstrumentError("target %s: effort_scale NONE but baseline_effort %r"
                                      % (tid, baseline))
        else:
            values = [v.strip() for v in scale.split("/") if v.strip()]
            if not values:
                raise InstrumentError("target %s: effort_scale is empty" % tid)
            if len(set(values)) != len(values):
                raise InstrumentError("target %s: effort_scale repeats a value — above and below "
                                      "would be undecidable" % tid)
            if baseline not in values:
                raise InstrumentError("target %s: baseline_effort %r is not in effort_scale %r"
                                      % (tid, baseline, values))
        targets[tid] = dict(id=tid, role=role, lanes=lanes, status=status,
                            dispatchable=dispatchable, authority=authority,
                            scale=values, baseline=baseline, fixed=fixed)
    if not targets:
        raise InstrumentError("profile %s declares no TARGET rows" % where)
    return targets


# --------------------------------------------------------------------------- resolution
def resolve(request, targets, vocab):
    """Turn what a packet may assert into the facts the decision runs on, reading the profile for
    everything the packet is not entitled to claim about itself."""
    facts = {}
    facts["subject"] = request.get("subject", "dispatch")
    # Fail closed on selection: an unstated selection is treated as DEFAULT, which is the stricter
    # reading for an EXPERIMENTAL target.
    facts["selection"] = request.get("selection", "DEFAULT")
    facts["human_go_reference"] = request.get("human_go", "no")

    reason = request.get("reason", "")
    facts["reason_valid"] = ("yes" if reason in vocab["REASON_VOCABULARY"] and reason != "BASELINE"
                             else "no")
    evidence = request.get("evidence", "NONE")
    facts["evidence_present"] = "no" if evidence in ("", "NONE") else "yes"

    tid = request.get("target", "")
    target = targets.get(tid)
    if target is None:
        facts["target_known"] = "no"
        return facts
    facts["target_known"] = "yes"
    facts["target_status"] = target["status"]
    facts["dispatchable"] = target["dispatchable"]
    facts["authority"] = target["authority"]
    facts["effort_fixed"] = target["fixed"]

    if "effort" not in request:
        # A packet that declared no ROUTE_EFFORT leaves the effort facts UNSET on purpose: with no
        # value to classify there is no baseline relation, and the decision falls to its default.
        return facts
    effort = request["effort"]
    if not target["scale"]:
        facts["effort_supported"] = "yes" if effort == "NONE" else "no"
        if effort == "NONE":
            facts["effort_relation"] = "BASELINE"
        return facts
    if effort not in target["scale"]:
        facts["effort_supported"] = "no"
        return facts
    facts["effort_supported"] = "yes"
    i, b = target["scale"].index(effort), target["scale"].index(target["baseline"])
    facts["effort_relation"] = "BASELINE" if i == b else ("ABOVE" if i > b else "BELOW")
    return facts


def parse_scenarios(text):
    scenarios = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("\t") if p.strip() != ""]
        if len(parts) != 4:
            raise InstrumentError("malformed scenario line (want 4 tab-separated fields): %r" % raw)
        sid, title, spec, expected = parts
        request = {}
        for piece in spec.split(","):
            piece = piece.strip()
            if not piece:
                continue
            if "=" not in piece:
                raise InstrumentError("malformed request field %r in scenario %s" % (piece, sid))
            k, v = piece.split("=", 1)
            request[k.strip()] = v.strip()
        scenarios.append(dict(id=sid, title=title, request=request, expected=expected))
    return scenarios


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--profile", default=PROFILE,
                    help="routing profile the scenarios resolve against (default: the fixture). "
                         "The recorded scenarios name FIXTURE target ids, so pointing this at a real "
                         "profile is not a meaningful run — use --validate-profile for that")
    ap.add_argument("--validate-profile", default=None, metavar="PATH",
                    help="structure-check a real routing profile and stop: parse it against the "
                         "rule's vocabularies and report, without running the fixture scenarios. "
                         "This is the check a session runs before dispatching. Exit 0 = usable, "
                         "2 = refused (absent, unparseable, or internally inconsistent)")
    ap.add_argument("--control", default=None,
                    help="empty-table | drop-row=N | no-profile — negative controls; none may pass")
    args = ap.parse_args()

    try:
        with open(os.path.join(ROOT, RULE), encoding="utf-8") as fh:
            rule_text = active_text(fh.read())
        rows, invariants, vocab = parse_decision(rule_text)

        if args.validate_profile:
            with open(os.path.join(ROOT, args.validate_profile), encoding="utf-8") as fh:
                only = parse_profile(fh.read(), vocab, args.validate_profile)
            print("Routing profile structure check — %s" % args.validate_profile)
            print("  targets parsed               %d" % len(only))
            for t in sorted(only.values(), key=lambda x: x["id"]):
                print("    %-18s role=%-17s status=%-12s dispatchable=%-3s authority=%-18s "
                      "scale=%-12s baseline=%-5s fixed=%s"
                      % (t["id"], t["role"], t["status"], t["dispatchable"], t["authority"],
                         "/".join(t["scale"]) or "NONE", t["baseline"], t["fixed"]))
            print("")
            print("LIMITS — this proves the profile PARSES and is internally consistent against the")
            print("  rule's vocabularies. It says nothing about whether the mapping is correct, and")
            print("  a scale of NONE records an absent measurement, not an absent capability.")
            print("RESULT: ACCEPTED (targets=%d)" % len(only))
            return 0

        profile_path = args.profile
        if args.control == "no-profile":
            profile_path = "scripts/fixtures/__absent-routing-profile__.md"
        with open(os.path.join(ROOT, profile_path), encoding="utf-8") as fh:
            targets = parse_profile(fh.read(), vocab, profile_path)

        with open(os.path.join(ROOT, FIXTURE), encoding="utf-8") as fh:
            scenarios = parse_scenarios(fh.read())
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
    if not rows or not scenarios or not invariants or not targets:
        print("INSTRUMENT_ERROR: nothing measured — rows %d / scenarios %d / invariants %d / targets %d"
              % (len(rows), len(scenarios), len(invariants), len(targets)))
        return 2

    known = set(invariants)
    for row in rows:
        for key, _op, _val in row["conditions"]:
            known.add(key)

    failures = []
    resolved = {}

    # (1) every scenario reaches its expected verdict, on facts resolved from the profile.
    for sc in scenarios:
        facts = resolve(sc["request"], targets, vocab)
        # A request key the decision has never heard of is a silent no-op; say so instead.
        extra = sorted(k for k in sc["request"]
                       if k in known and k not in facts)
        for k in extra:
            facts[k] = sc["request"][k]
        unknown = sorted(k for k in facts if k not in known)
        if unknown and not args.control:
            failures.append("%s: fact key(s) no decision row or invariant knows about: %s"
                            % (sc["id"], ", ".join(unknown)))
            continue
        resolved[sc["id"]] = facts
        try:
            got = evaluate(rows, facts)["verdict"]
        except InstrumentError as exc:
            failures.append("%s: %s" % (sc["id"], exc))
            continue
        if got != sc["expected"]:
            failures.append("%s (%s): expected %s, decision gave %s"
                            % (sc["id"], sc["title"], sc["expected"], got))

    # (2) both directions must be represented. A routing harness whose scenarios are all refusals
    #     proves only that it can say no; one whose scenarios are all dispatches proves only that it
    #     can say yes.
    allowed = [s for s in scenarios if s["expected"] == "DISPATCH_ALLOWED"]
    refused = [s for s in scenarios if s["expected"].startswith("REJECT_")]
    human = [s for s in scenarios if s["expected"] in ("HUMAN_GO_REQUIRED", "HUMAN_OWNED_ROUTE")]
    if not args.control:
        if not allowed:
            failures.append("no scenario expects DISPATCH_ALLOWED — false-positive control absent")
        if not refused:
            failures.append("no scenario expects a refusal — false-negative control absent")
        if not human:
            failures.append("no scenario expects a Human-authority verdict — the authority half is "
                            "unmeasured")

    # (3) invariance: a fact declared INVARIANT_KEY may not move any scenario's verdict.
    inv_checked = 0
    for key in invariants:
        for sc in scenarios:
            base = resolved.get(sc["id"])
            if base is None:
                continue
            verdicts = set()
            for value in ("yes", "no", "high", "low"):
                facts = dict(base)
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
                facts = resolved.get(sc["id"])
                if facts is None:
                    continue
                try:
                    before = evaluate(rows, facts)["verdict"]
                    after = evaluate(reduced, facts)["verdict"]
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

    # (5) the profile may not carry an effort vocabulary the RULE fixed: values are the consumer's.
    if not args.control and "EFFORT_VOCABULARY" in rule_text:
        failures.append("the rule declares an EFFORT_VOCABULARY — effort values are the consumer's, "
                        "and fixing a set here would make a constant nobody derived into a gate")

    print("Routing scenario harness — rule %s" % RULE)
    print("  profile                      %s" % profile_path)
    print("  targets parsed               %d" % len(targets))
    print("  decision rows parsed         %d" % len(rows))
    print("  vocabularies declared        %d (%s)"
          % (len(vocab), ", ".join("%s=%d" % (k, len(v)) for k, v in sorted(vocab.items()))))
    print("  invariant keys               %d (%s)" % (len(invariants), ", ".join(invariants)))
    print("  scenarios evaluated          %d/%d" % (len(scenarios), len(scenarios)))
    print("  must-dispatch scenarios      %d" % len(allowed))
    print("  must-refuse scenarios        %d" % len(refused))
    print("  Human-authority scenarios    %d" % len(human))
    print("  invariance evaluations       %d" % inv_checked)
    print("  rows exercised by a scenario %d/%d" % (len(rows) - len(uncovered), len(rows)))
    for f in failures:
        print("  ✗ %s" % f)
    print("")
    print("LIMITS — a green run here proves the POLICY's routing decision produces the recorded")
    print("  verdicts on facts RESOLVED FROM THE PROFILE, and that a short task, spare quota, an")
    print("  available expensive or cheaper target, a slow worker, the AI's own preference, the")
    print("  transport accepting the value, and a worker escalation in flight cannot move them.")
    print("  It does NOT prove the mapping is a good one, that higher effort produces better work,")
    print("  that the evidence is TRUE (format validation is not truth validation), or that the")
    print("  transport behaves as the profile says. It observes no session.")
    if failures:
        print("RESULT: FAILED (scenarios=%d invariance=%d failures=%d)"
              % (len(scenarios), inv_checked, len(failures)))
        return 1
    print("RESULT: ACCEPTED (targets=%d scenarios=%d/%d dispatch=%d refuse=%d human=%d "
          "invariance=%d/%d rows=%d/%d failures=0)"
          % (len(targets), len(scenarios), len(scenarios), len(allowed), len(refused), len(human),
             inv_checked, inv_checked, len(rows), len(rows)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
