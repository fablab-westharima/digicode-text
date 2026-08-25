#!/bin/bash
# Template selftest — run after editing hooks, settings.json, or template structure (OPERATIONS.md §4).
# Exit 0 = all pass. Works both in the template repo and in bootstrapped projects.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
pass=0; fail=0
ok() { echo "  ✅ $1"; pass=$((pass+1)); }
ng() { echo "  ❌ $1"; fail=$((fail+1)); }

# ---------------------------------------------------------------------------------------
# active_text / agrep — presence in ACTIVE NORMATIVE TEXT, not presence anywhere.
#
# Measured (S012 mutation harness, family M3): four presence guards stayed green after the
# obligation they name was moved verbatim under an explicit obsolescence heading. The words
# were still in the file; the rule was gone. A guard that cannot tell those apart certifies
# a document it no longer protects.
#
# The policy is deliberately NARROW, and the narrowness is measured too. In this repository
# HTML comments and fenced code blocks are legitimate normative addresses — the AGENTS
# generator's machine-readable marker lives in a leading comment, and the delegation packet's
# field grammar IS a fenced block (S012 inventory: 100 predicates / 132 match lines / 0
# predicates whose only home is an obsolete section). Invalidating text by FORM would turn
# correct documents red, which is case PT-29 inverted. So only an explicit obsolescence
# marker in a HEADING demotes what follows, until a heading of the same or higher level.
#
# LIMITS: this reads structure, not meaning. A clause neutralised in prose ("this no longer
# applies") is still counted as active. It measures active normative TEXT — never runtime
# compliance.
active_text() {
  awk '
    /^#+ / {
      lvl = index($0, " ") - 1
      if (inactive && lvl <= inactive_lvl) inactive = 0
      if (tolower($0) ~ /anti-pattern|obsolete|superseded|deprecated/ || $0 ~ /❌/) {
        inactive = 1; inactive_lvl = lvl
      }
      if (inactive) next
    }
    !inactive
  ' "$1"
}
agrep()  { local f="$1"; shift; active_text "$f" | grep -q  -- "$@"; }
agrepE() { local f="$1"; shift; active_text "$f" | grep -qE -- "$@"; }

echo "[1] settings.json"
if jq -e '.hooks.SessionStart and .hooks.PreToolUse' .claude/settings.json >/dev/null 2>&1; then
  ok "valid JSON with SessionStart + PreToolUse hooks"
else
  ng "settings.json invalid or hooks missing"
fi

echo "[2] hook files"
for h in .claude/hooks/session-start.sh .claude/hooks/pre-commit-gate.sh; do
  [ -x "$h" ] && ok "$h is executable" || ng "$h missing or not executable"
done
[ -f .claude/commands/close.md ] && ok "/close command present" || ng ".claude/commands/close.md missing"

echo "[3] session-start hook"
out="$(echo '{}' | CLAUDE_PROJECT_DIR="$ROOT" bash .claude/hooks/session-start.sh)"
if printf '%s' "$out" | python3 -c '
import json, sys
d = json.load(sys.stdin)
assert "16_" in d["hookSpecificOutput"]["additionalContext"]
' 2>/dev/null; then
  ok "injects handover (16.md) as valid hook JSON"
else
  ng "session-start output invalid or missing handover"
fi
out2="$(echo '{}' | CLAUDE_PROJECT_DIR=/nonexistent-harness bash .claude/hooks/session-start.sh)"
[ -z "$out2" ] && ok "degrades silently when harness files absent" || ng "degradation path emitted output"

echo "[4] pre-commit gate"
o="$(echo '{"tool_input":{"command":"ls -la"}}' | CLAUDE_PROJECT_DIR="$ROOT" bash .claude/hooks/pre-commit-gate.sh)"
[ -z "$o" ] && ok "non-git command passes silently" || ng "non-git command produced output"
if command -v gitleaks >/dev/null 2>&1; then
  if git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
    o="$(echo '{"tool_input":{"command":"git commit -m x"}}' | CLAUDE_PROJECT_DIR="$ROOT" bash .claude/hooks/pre-commit-gate.sh)"
    printf '%s' "$o" | grep -q "クリーン" && ok "clean staged tree → allow" || ng "clean staged tree was not allowed: $o"
  fi
  T="$(mktemp -d)"
  (
    cd "$T" && git init -q && git config user.email selftest@local && git config user.name selftest
    echo base > base.txt && git add base.txt && git commit -qm init
    # dummy token assembled at runtime so this script itself never matches secret-scan patterns
    p1='ghp_'; p2='A9x2Qm7Lk3Np8Rt5Vw1Yz4Bc6Df0Gh2Jk4M'
    printf 'token = "%s%s"\n' "$p1" "$p2" > creds.txt && git add creds.txt
  )
  o="$(echo '{"tool_input":{"command":"git commit -m x"}}' | CLAUDE_PROJECT_DIR="$T" bash "$ROOT/.claude/hooks/pre-commit-gate.sh")"
  if printf '%s' "$o" | python3 -c '
import json, sys
d = json.load(sys.stdin)
assert d["hookSpecificOutput"]["permissionDecision"] == "deny"
' 2>/dev/null; then
    ok "planted dummy secret → commit denied"
  else
    ng "planted dummy secret was NOT denied"
  fi
  rm -rf "$T"
else
  echo "  ⚠️  gitleaks not installed — scan paths skipped (brew install gitleaks)"
fi

echo "[5] template structure"
n="$(grep -rl 'Origin: DigiCode (2024–2026)' prompt/maintenance/global/rules 2>/dev/null | wc -l | tr -d ' ')"
[ "$n" -ge 26 ] && ok "origin banners present ($n files)" || ng "origin banners: $n files (< 26)"
jmh=prompt/maintenance/global/rules/common/judgment-mistakes-history.md
if grep -q '^## Part 1' "$jmh" && grep -q '^## Part 2' "$jmh"; then
  ok "judgment-mistakes two-tier structure intact"
else
  ng "judgment-mistakes Part 1/2 structure missing"
fi
[ -f prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md ] && ok "handover skeleton present" || ng "handover 16.md missing"
[ -d prompt/maintenance/local/handover/sessions ] && ok "sessions/ directory present (per-session history)" || ng "handover/sessions/ missing"

echo "[6] harness invariants"
# Each check below corresponds to a drift that prose alone failed to prevent (measured S002, 2026-08-14).
# The reader of this harness is a model: it follows edges rather than browsing, fires only on enumerated
# antecedents, and takes the cheapest path. These checks enforce exactly those three properties.
tree=prompt/maintenance/global/rules/README.md

# B1 — every rule file has a trigger row in the decision tree. Being named in the file-layout diagram
# is not reachability: a model looks up a trigger, it does not browse a directory listing. (Scoping
# this check to the tree section rather than the whole README is deliberate — matching the whole file
# produces false greens via substring collision, which is how "local/README.md is reachable" was
# mis-measured in S002 before this check existed.)
if [ -f "$tree" ]; then
  rows="$(awk '/^#+ Decision tree/{c=1;next} c&&/^## /{exit} c' "$tree")"
  miss=""
  for f in prompt/maintenance/global/rules/common/*.md prompt/maintenance/global/rules/reference/*.md; do
    [ -e "$f" ] || continue
    b="$(basename "$f")"
    printf '%s' "$rows" | grep -q "$b" || miss="$miss $b"
  done
  [ -z "$miss" ] && ok "B1 every rules file has a decision-tree trigger row" \
                 || ng "B1 no decision-tree row:$miss"

  # B2 — governance docs need that row too. OPERATIONS.md had zero inbound references and was
  # therefore never read while its subject (how rules travel between repos) was being changed.
  miss=""
  while IFS='|' read -r gpath gpat; do
    [ -e "$gpath" ] || continue   # absent in a bootstrapped project → not applicable
    printf '%s' "$rows" | grep -q "$gpat" || miss="$miss $gpath"
  done <<'GOVEOF'
OPERATIONS.md|OPERATIONS.md
scripts/selftest.sh|selftest.sh
scripts/baseline.sh|baseline.sh
scripts/handover-diff.sh|handover-diff.sh
scripts/context-brief.sh|context-brief.sh
scripts/mutation-harness.py|mutation-harness.py
scripts/usage-report.sh|usage-report.sh
.claude/commands/close.md|close.md
prompt/maintenance/local/README.md|local/README.md
prompt/maintenance/global/RULES_SNAPSHOT|RULES_SNAPSHOT
GOVEOF
  [ -z "$miss" ] && ok "B2 governance docs reachable from the decision tree" \
                 || ng "B2 governance docs with no inbound edge:$miss"
fi

# B3 — the AGENTS.md generator carries what its feeder rules mandate (rule 22 §AGENTS.md maintenance).
# Reaching one project's instance but not the generator silently omits it from every future bootstrap.
tpl=prompt/maintenance/global/templates/AGENTS-template.md
if [ -f "$tpl" ]; then
  if agrep "$tpl" 'Ask before removing or reshaping' && agrep "$tpl" 'real-fire'; then
    ok "B3 AGENTS generator carries rule 22 §3b + rule 04 verification labels"
  else
    ng "B3 AGENTS-template.md missing feeder-rule content (rule 22 §AGENTS.md maintenance)"
  fi
  if [ -f AGENTS.md ]; then
    if agrep AGENTS.md 'Ask before removing or reshaping' && agrep AGENTS.md 'real-fire'; then
      ok "B3i AGENTS.md instance is in sync with the generator"
    else
      ng "B3i AGENTS.md instance is stale vs the generator"
    fi
  fi

  # B14 — the strategic axis has to be armed. CLAUDE.md §4 calls itself "THE most important section
  # for keeping the AI on-target across sessions" and cites an origin project where the AI forgot its
  # founding purpose five separate times. In this repo it sat as unfilled {{PLACEHOLDER}} through four
  # sessions while its own author drifted off-mission twice and had to be told — the countermeasure
  # existed and was never loaded. A section that is the anchor for judgment, and is empty, is worse
  # than absent: it reads as present.
  if [ -f CLAUDE.md ]; then
    s4="$(awk '/^## 4\./{c=1;next} c&&/^## /{exit} c' CLAUDE.md)"
    if [ -z "$s4" ]; then
      ng "CLAUDE.md has no §4 strategic axis — nothing re-states the purpose at the moment work is chosen"
    elif printf '%s' "$s4" | grep -q '{{'; then
      ng "CLAUDE.md §4 still holds template placeholders — the anchor for judgment is unarmed, and a session with no purpose to re-ask drifts into whatever looks like good work ($(printf '%s' "$s4" | grep -o '{{[A-Z_]*' | tr '\n' ' '))"
    else
      ok "CLAUDE.md §4 strategic axis is filled in for this project"
    fi
  fi

  # B15 / B16 — the delegate must not silently revert to an implementation-only agent.
  #
  # The orchestration this project wants is Orchestrated Reasoning: the delegate investigates, plans
  # investigations, reviews designs, verifies and falsifies, and implementation is one lane of six.
  # That shape decays in one specific direction — back to "the parent thinks, the delegate types" —
  # because implementation is the familiar default and nothing about the decayed file looks wrong.
  #
  # KNOWN GAP, stated rather than implied (the plan says so itself, §20): these are string checks.
  # They prove the lanes are *named* and the implementation premise is *scoped in the text*. They
  # cannot prove a delegation actually used a lane, that a review lane returned anything but "LGTM",
  # or that the parent read the plan it got back. The behavioural side is measured, not enforced —
  # rule 22 §Success criteria, whose first question is "does every LANE this month say IMPLEMENTATION".
  for f in prompt/maintenance/global/templates/AGENTS-template.md AGENTS.md; do
    [ -f "$f" ] || continue
    miss=""
    for lane in INVESTIGATION INVESTIGATION_PLANNING DESIGN_REVIEW IMPLEMENTATION VERIFICATION FALSIFICATION; do
      agrep "$f" "$lane" || miss="$miss $lane"
    done
    if [ -z "$miss" ]; then
      ok "B15 $(basename "$f") defines all six delegate lanes (6/6)"
    else
      ng "B15 $(basename "$f") is missing delegate lane(s):$miss — a delegate with no named lane defaults to implementation, and the reasoning lanes never happen (rule 22 §Lane definitions)"
    fi

    # The implementation premise must be scoped to its lane, not stated over the whole file.
    prem="$(grep -n 'settled upstream\|already made upstream\|already settled' "$f" || true)"
    if [ -z "$prem" ]; then
      ok "B16 $(basename "$f") states no unscoped implementation-only premise"
    elif printf '%s' "$prem" | grep -qv 'IMPLEMENTATION'; then
      ng "B16 $(basename "$f"): \"design decisions are already settled\" appears without being scoped to the IMPLEMENTATION lane — carried into the reasoning lanes it turns an independent intelligence back into a typist (rule 22 §Lane definitions): $(printf '%s' "$prem" | grep -v IMPLEMENTATION | cut -c1-70 | head -1)"
    else
      ok "B16 $(basename "$f") scopes the implementation premise to its own lane"
    fi
  done

  # B17 — parent-only authority must be visible to the delegate, in the delegate's own file.
  # The reasoning lanes gain authority over analysis and none over state; a delegate that may argue
  # the parent out of a conclusion still may not change what the project is committed to.
  if [ -f prompt/maintenance/global/templates/AGENTS-template.md ]; then
    fb="$(awk '/^## Forbidden/{c=1;next} c&&/^## /{exit} c' prompt/maintenance/global/templates/AGENTS-template.md)"
    missp=""
    while IFS='|' read -r label pat; do
      printf '%s' "$fb" | grep -qiE "$pat" || missp="$missp $label"
    done <<'POWEOF'
scope|scope
settled-decision|settled decision
commit|[Cc]ommitting|commit
release/production|release|production
irreversible|irreversible
final-report|report(ing)? to the user|final report
POWEOF
    [ -z "$missp" ] && ok "AGENTS generator lists the parent-only powers in Forbidden" \
                    || ng "AGENTS generator's Forbidden section omits parent-only power(s):$missp — a delegate cannot avoid what it was never told it must not do (rule 22 §Parent-fixed duties)"
  fi

  # B13 — AGENTS.md is per-project and must never be inherited. It names this repo's structure, gates
  # and forbidden actions, so a copy carried into another project instructs a delegate about somewhere
  # else — and unlike a stale rule, nothing about it looks wrong on the page. This became reachable
  # the moment the template grew its own instance (2026-08-16): every fork of this repo now starts
  # holding a file that says "Project_Template", and prose telling people to regenerate it is the
  # weakest instrument available (README §Writing for the reader, principle 3).
  #
  # Ground truth is the repo directory, with CLAUDE.md's own project heading accepted as an
  # alternative so a project whose display name differs from its directory is not a false red.
  if [ -f AGENTS.md ]; then
    a_name="$(sed -n 's/^# \(.*\) — Agent Instructions[[:space:]]*$/\1/p' AGENTS.md | head -1)"
    c_name="$(sed -n 's/^# \(.*\) — Claude Code Instructions[[:space:]]*$/\1/p' CLAUDE.md 2>/dev/null | head -1)"
    d_name="$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)")"
    if [ -z "$a_name" ]; then
      ng "AGENTS.md has no '# <project> — Agent Instructions' heading, so nothing can tell which project it was generated for"
    elif [ "$a_name" = "$d_name" ] || { [ -n "$c_name" ] && [ "$a_name" = "$c_name" ]; }; then
      ok "AGENTS.md is generated for this project ($a_name)"
    else
      ng "AGENTS.md names '$a_name' but this repo is '$d_name'${c_name:+ (CLAUDE.md says '$c_name')} — it was inherited from another project and describes that project's structure, gates and forbidden actions. Regenerate it from prompt/maintenance/global/templates/AGENTS-template.md (rule 22 §AGENTS.md maintenance)"
    fi
  fi

  # B6 — the feeder-rule trigger, mechanised. Enumerating the feeders in rule 22 was not enough:
  # the author of that table edited rule 03 an hour later and never asked whether the generator
  # needed it. A date comparison cannot decide the answer (rule 22: judge on content, not dates) —
  # it only forces the question to be asked, and the header's "Last sync" line is where the answer
  # is recorded, including "reviewed, no change needed".
  #
  # This check can only fire AFTER the commit it objects to exists — it compares commit timestamps,
  # so a selftest run before committing is structurally blind to it. Measured 2026-08-15: a feeder
  # edit was reported green pre-commit and went red on the next run. Treat a green here as "the last
  # commit was fine", not "the commit I am about to make is fine".
  #
  # KNOWN GAP: comparison is at commit granularity, so a feeder rule and the generator landing in
  # the SAME commit are indistinguishable from a deliberate joint update — which is precisely how
  # the rule-03 miss above slipped through. This catches the cross-commit shape (a rule changes,
  # the generator is never touched again — the LaserEditor incident) and nothing finer.
  if git rev-parse --git-dir >/dev/null 2>&1; then
    tpl_t="$(git log -1 --format=%ct -- "$tpl" 2>/dev/null || echo 0)"
    newest=0; newest_f=""
    for fr in 03-coding 04-testing-strategy 05-commit-workflow 07-i18n \
              17-no-self-imposed-scope 22-model-orchestration; do
      p="prompt/maintenance/global/rules/common/${fr}.md"
      [ -f "$p" ] || continue
      t="$(git log -1 --format=%ct -- "$p" 2>/dev/null || echo 0)"
      [ "${t:-0}" -gt "$newest" ] && { newest="$t"; newest_f="$fr"; }
    done
    if [ "$newest" -gt "${tpl_t:-0}" ]; then
      ng "feeder rule $newest_f changed after AGENTS-template.md — decide whether it belongs in the delegate's budget, then record the judgment in the template header"
    else
      ok "AGENTS generator reviewed at or after the newest feeder-rule change"
    fi
  fi
fi

# B4 — unconditional read cost is paid every session, forever. Computed by scripts/read-load.sh,
# which owns both the counting convention and the budget constant (see that file for why).
if [ -x scripts/read-load.sh ] || [ -f scripts/read-load.sh ]; then
  # RC captured on its own line, never through the $(...) that also carries stdout (case 82).
  # read-load.sh exits 2 when the count's premise (CLAUDE.md §0 says "Core only") is not in force —
  # without this branch a bootstrapped project reports the template's number as its own.
  rl_err="$(mktemp)"
  rl_out="$(bash scripts/read-load.sh 2>"$rl_err")"; rl_rc=$?
  # Three fields since 2026-08-15: the unit travels with the number, so no consumer can restate it
  # from memory. A number whose unit lives somewhere else is how a line count came to be reported as
  # "読み込み負荷" for three sessions (case PT-10).
  read -r total budget unit <<<"$rl_out"
  # B4 measures the INSTRUMENT, not the size (user ruling 2026-08-24, Phase 1 N-2). Until then this
  # check failed when the set was large, which put "the set grew" in the same class as "the harness
  # is broken" — and made deleting handover content the cheapest way to clear it. Size now lives in
  # B4s and cannot fail anything. What can fail here: a broken premise (RC 2), an incompletely
  # measured set (RC 3), a missing unit, or a denominator the output does not state.
  rl_meas="$(printf '%s' "$rl_out" | sed -n 's/.*inputs measured \([0-9]*\/[0-9]*\).*/\1/p' | head -1)"
  if [ "$rl_rc" -eq 2 ]; then
    ng "read-load premise not in force — $(sed -n '2,4p' "$rl_err" | sed 's/^ *- *//' | paste -sd'; ' - )"
  elif [ "$rl_rc" -eq 3 ]; then
    ng "read-load measured an incomplete mandatory set — $(sed -n '1,4p' "$rl_err" | sed 's/^ *- *//' | paste -sd'; ' - )"
  elif [ "$rl_rc" -ne 0 ]; then
    ng "read-load.sh exited $rl_rc — its number was not obtained, which is not the same as a small number"
  elif [ -z "${unit:-}" ]; then
    ng "read-load.sh emits no unit — its number cannot be quoted without restating the unit from memory (PT-10)"
  elif [ -z "$rl_meas" ]; then
    ng "read-load.sh states no measured/expected denominator — a partial count would be indistinguishable from a small one"
  elif [ "${rl_meas%/*}" != "${rl_meas#*/}" ]; then
    ng "read-load measured ${rl_meas} mandatory inputs and still printed a total"
  else
    ok "read-load instrument healthy — inputs measured ${rl_meas}, unit '${unit}' emitted, RC=0"
  fi
  rm -f "$rl_err"

  # B4s — the size signal must be OBSERVABLE. It must never be a gate: this check has no branch that
  # fails because the number is large, by construction, so the cheapest way to move it stays
  # "restructure", never "delete something a cold start needs". The only failure here is a status
  # that cannot be read at all — a signal nobody can see is the same as no signal.
  rl_status="$(printf '%s' "$rl_out" | sed -n 's/^BUDGET_STATUS: \([A-Z_]*\).*/\1/p' | head -1)"
  rl_basis="$(printf '%s' "$rl_out" | sed -n 's/.*basis=\([A-Za-z_]*\).*/\1/p' | head -1)"
  if [ "$rl_rc" -ne 0 ]; then
    : # the instrument already failed in B4; a status from a failed run would be a fabricated reading
  elif [ -z "$rl_status" ]; then
    ng "B4s: read-load.sh emits no BUDGET_STATUS — size has no signal, so the only way it could be noticed again is as a gate"
  elif ! printf '%s' "$rl_status" | grep -qE '^(OK|WARNING|REVIEW_REQUIRED)$'; then
    ng "B4s: BUDGET_STATUS '$rl_status' is outside the closed set OK|WARNING|REVIEW_REQUIRED"
  elif [ -z "$rl_basis" ]; then
    ng "B4s: BUDGET_STATUS states no calibration basis — a threshold with no recorded calibration state becomes folklore"
  else
    ok "BUDGET_STATUS observable: ${rl_status} (basis=${rl_basis}; size fails no gate — B4s has no size branch)"
  fi

  # B8 — the read plan has to be reachable. read-load.sh emits, per file, the line at which its
  # mandatory section ends, so that reading only that part is one `Read limit:N` call. That emission
  # is worth nothing if nothing routes a cold start to it: a model follows edges, and a mechanism
  # with no inbound edge is operationally absent (README §Writing for the reader, principle 1 —
  # measured five times before this check existed). Measured 2026-08-15: this session read README in
  # full (290 lines) where the budget assumes §Core (85), +7,730 tokens = +23.6% over the whole set,
  # because the boundary was unknowable at the moment of opening. Self-locating it does not work
  # either — `grep -n '^## '` answers 67 for Part 1, a heading inside a fenced example; the real end
  # is 151.
  s0="$(awk '/^## 0\./{c=1;next} c&&/^## /{exit} c' CLAUDE.md 2>/dev/null)"
  if printf '%s' "$s0" | grep -q 'read-load.sh'; then
    ok "CLAUDE.md §0 routes the cold start to the read plan (§Core end-lines)"
  else
    ng "CLAUDE.md §0 does not name scripts/read-load.sh — the §Core boundaries it emits are unreachable, and a cold start pays full-file cost for every Core-only file"
  fi

  # B12 — a measured count in §0 has no owner and no update trigger, so it drifts and is then read as
  # fact. Measured three times on this harness, and the third is the interesting one: the corollary
  # against this ("name the command instead") already existed, a session repaired the offending line
  # — and repaired it by writing the freshly measured number back into the prose, which the next case
  # filing invalidated. Consumer state on 2026-08-16: §0 claims judgment-mistakes Part 1 is 159 lines
  # where it is 176, 11% understated and growing by one line per case.
  #
  # The check is the corollary verbatim rather than a ban on numbers: a count may appear, but only on
  # a line that also names the command that produces it — which is what makes it citable as history
  # instead of assertable as state. (This file's own §0 cites "148 行" as a past measurement and
  # passes, because that same line says the truth comes from scripts/read-load.sh.)
  bad0="$(printf '%s\n' "$s0" | grep -nE '[0-9]+ *(行|lines)' | grep -v 'read-load' || true)"
  if [ -z "$bad0" ]; then
    ok "CLAUDE.md §0 states no line count without naming the command that measures it"
  else
    ng "CLAUDE.md §0 asserts a measured count with no command beside it — it has no update trigger and will drift: $(printf '%s' "$bad0" | cut -c1-90 | paste -sd' / ' -)"
  fi

  # B9 — the metric has to see everything the session is actually made to read. The SessionStart hook
  # injects files into context before the reader can decide anything; those are unconditional cost by
  # definition. Measured 2026-08-15: bugs/active/index.md was injected every session and counted by
  # nothing (467 tokens here, unbounded in a project with open bugs). Checked behaviourally — the
  # hook's paths must appear in read-load.sh's emitted plan, not merely somewhere in its source, so a
  # path that is listed but silently skipped still fails.
  injected="$(grep -oE '"\$ROOT/[^"]+"' .claude/hooks/session-start.sh 2>/dev/null \
              | tr -d '"' | sed 's|^\$ROOT/||' | sort -u)"
  miss=""
  for p in $injected; do
    [ -f "$p" ] || continue
    printf '%s' "$rl_out" | grep -qF "$p" || miss="$miss $p"
  done
  if [ -z "$injected" ]; then
    ng "could not read the SessionStart hook's injected paths — B9 measured nothing"
  elif [ -z "$miss" ]; then
    ok "every hook-injected file is counted by read-load.sh"
  else
    ng "injected into every session but not counted by read-load.sh:$miss"
  fi

  # B53 — the mandatory-read CONTRACT and the measured set have to be the same set.
  #
  # B9 covers one source of the obligation (the hook). The other two are prose: CLAUDE.md §0's
  # numbered list, and 16.md §5's mandatory-docs line. Measured 2026-08-24: §5 had instructed "this
  # file -> newest under sessions/" while the roster contained no session file at all, so the cold
  # start was told to read something the gauge did not count — the reported load was the load of
  # everything except the item that grows at every close. An obligation with no counterpart in the
  # instrument is not a small cost, it is an unmeasured one.
  #
  # Only the numbered items are read as obligations: §0 also names files as pointers (the layout
  # standard, the rules index corollary), and counting those would make the check fail for being
  # well cross-referenced. Item 6 is conditional by construction and carries no path.
  contract="$(printf '%s\n' "$s0" | grep -E '^[0-9]+\. ' \
              | grep -oE 'prompt/maintenance/[^`]+\.md' | sort -u)"
  c_tot=0; c_miss=""
  for p in $contract; do
    c_tot=$((c_tot + 1))
    printf '%s' "$rl_out" | grep -qF "$p" || c_miss="$c_miss $p"
  done
  # 16.md §5 names the newest session file as a mandatory read; the plan must contain one.
  sess_claimed=0
  # Matched on meaning, not on one phrasing: any mandatory-read line naming the NEWEST file under
  # sessions/ is the obligation, however it is worded. The first version of this predicate hard-coded
  # the sentence that happened to be in the handover, and went red the first time the handover was
  # rewritten while the obligation itself had not changed at all.
  printf '%s\n' "$s0" | grep -qE 'newest[^|]*sessions' && sess_claimed=1
  sess_measured=0
  printf '%s' "$rl_out" | grep -qE 'handover/sessions/S[0-9]+_' && sess_measured=1
  if [ "$c_tot" -eq 0 ]; then
    ng "B53: parsed 0 mandatory paths out of CLAUDE.md §0 — the contract was not read, which is not the same as a contract that is satisfied"
  elif [ -n "$c_miss" ]; then
    ng "B53: named as a mandatory read in CLAUDE.md §0 but absent from read-load's measured set:$c_miss"
  elif [ "$sess_claimed" -eq 1 ] && [ "$sess_measured" -eq 0 ]; then
    ng "B53: 16.md §5 makes the newest sessions/ file a mandatory read and read-load measures no session file — the reported load excludes the item that grows every close"
  elif [ "$sess_claimed" -eq 0 ] && [ "$sess_measured" -eq 1 ]; then
    ng "B53: read-load measures a session file that the mandatory-docs line no longer requires — the set is being paid for without being owed"
  else
    ok "B53 mandatory contract == measured set: ${c_tot}/${c_tot} CLAUDE.md §0 paths in the read plan; newest-session obligation claimed=${sess_claimed} measured=${sess_measured}"
  fi

  # B11 — the handover overwrite has to be able to notice what it dropped. 16.md is rewritten whole at
  # every close, so a requirement can leave the project without appearing in anyone's diff. Measured
  # on a consumer project: a canonical requirement became a §2 row asking "include X? (default no)",
  # its work row was gone at the next close, and git records no user decision for the exclusion —
  # while the same commit recorded the user's ruling that X was in scope. A decision-tree row makes
  # the rule findable (B1/B2); this makes the *procedure* carry it, because close.md is what a
  # session actually executes at that moment (rule 17 §Step 4.6).
  if [ -f .claude/commands/close.md ] && [ -f scripts/handover-diff.sh ]; then
    if agrep .claude/commands/close.md 'handover-diff.sh'; then
      ok "B11 close protocol runs the handover diff before overwriting 16.md"
    else
      ng "B11 close.md does not run scripts/handover-diff.sh — a §2/§3 row can leave the project with no diff anyone reads (rule 17 §Step 4.6)"
    fi
  fi

  # B10 — a consumer must render the unit it was given, not one it remembers. This is also the
  # shipment guard: read-load.sh, baseline.sh and selftest.sh travel together (16.md §3), and an old
  # baseline.sh paired with a new read-load.sh would print tokens under the label 行 — wrong, and
  # silent. Empty unit is treated as failure precisely so that pairing cannot pass.
  if [ -f scripts/baseline.sh ]; then
    bl_row="$(bash scripts/baseline.sh 2>/dev/null | grep -F 'unconditional read')"
    if [ -z "${unit:-}" ] || [ -z "$bl_row" ]; then
      ng "baseline.sh has no read-load row, or read-load.sh emitted no unit for it to carry"
    elif printf '%s' "$bl_row" | grep -qF "$unit"; then
      ok "baseline §5 read-load row carries the unit read-load.sh emitted"
    else
      ng "baseline.sh's read-load row does not carry the unit '$unit' — it is restating a unit from memory (PT-10)"
    fi
  fi
fi

# B5 — a baseline row without a command gets transcribed, because transcription is then cheaper
# than measuring. Carrying the command in the row inverts that cost (measured: LaserEditor 16.md).
h=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
if [ -f "$h" ] && [ -f scripts/baseline.sh ]; then
  if ! grep -q 'baseline.sh' "$h"; then
    ng "16.md §5 does not point at scripts/baseline.sh — its rows will be transcribed"
  elif ! bash scripts/baseline.sh >/dev/null 2>&1; then
    ng "scripts/baseline.sh fails — the handover points at a broken generator"
  else
    ok "baseline is generated by a command, not transcribed (scripts/baseline.sh exit 0)"
    # Having a generator was treated as covering the whole table, so once this branch was reached the
    # check stopped looking at rows entirely. Measured 2026-08-15 by planting the row
    # `| 完全にでっち上げた指標 | 42 件で健全 |` into §5: 21 passed / 0 failed. §5 legitimately holds
    # rows the generator cannot emit — this project's selftest row is one, because selftest calls
    # baseline and the reverse direction would recurse — and those rows are exactly the hand-maintained
    # ones, i.e. the ones that get transcribed. So: a row is covered either by being generated, or by
    # carrying its own command. Nothing is covered by the generator merely existing.
    # The generated labels arrive by FILE, not by -v: BSD awk rejects a newline inside a -v assignment
    # ("awk: newline in string"), exits 2, and prints nothing — which reads as "no violations".
    # Measured 2026-08-15 on this check's own first draft: the planted row went undetected and the
    # suite reported 22 passed / 0 failed. Hence also the denominator below — a crash and a clean
    # sweep are indistinguishable unless the check says how many rows it looked at (rule 04
    # §An invariant reported as one number cannot distinguish "no violations" from "nothing measured").
    gen_f="$(mktemp)"
    bash scripts/baseline.sh 2>/dev/null | awk -F'|' '
      /^\|/ { l = $2; gsub(/^[ \t]+|[ \t]+$/, "", l); gsub(/\*/, "", l)
              if (l != "" && l !~ /^[-: ]+$/ && l != "Item") print l }' > "$gen_f"
    b5="$(awk -v gf="$gen_f" '
      BEGIN { while ((getline l < gf) > 0) known[l] = 1 }
      /^## §5/ { c = 1; next }
      c && /^#/ { exit }
      c && /^\|/ {
        if ($0 ~ /^\|[-|: ]+$/) next
        split($0, f, "|"); l = f[2]
        gsub(/^[ \t]+|[ \t]+$/, "", l); gsub(/\*/, "", l)
        if (l == "" || l == "Item") next
        scanned++
        if (l in known)  { covered++; next }        # generated: the generator IS its command
        if ($0 ~ /`/)    { covered++; next }        # hand-maintained but carries its command
        naked = naked " \"" l "\""
      }
      END { printf "%d %d%s\n", scanned + 0, covered + 0, naked }' "$h")"
    read -r b5_scanned b5_covered b5_naked <<<"$b5"
    rm -f "$gen_f"
    if [ "${b5_scanned:-0}" -eq 0 ]; then
      ng "§5 row-coverage check scanned 0 rows — it measured nothing, and nothing-measured prints the same as no-violations"
    elif [ "${b5_covered:-0}" -eq "${b5_scanned}" ]; then
      ok "§5 rows generated or carrying their own command: ${b5_covered}/${b5_scanned}"
    else
      ng "§5 row(s) neither generated nor carrying a command:${b5_naked:-} (${b5_covered}/${b5_scanned} covered) — they will be transcribed next session"
    fi
  fi
elif [ -f "$h" ]; then
  # No generator in this project yet: fall back to requiring a command in every row.
  bad="$(awk '
    /^## §5/{c=1; next}
    c && /^#/{exit}
    c && /^\|/ {
      if ($0 ~ /^\|[-|: ]+$/) next          # separator row
      if ($0 ~ /項目/ || $0 ~ /^\| Item \|/) next   # header row (either language generation)
      if ($0 !~ /`/) n++
    }
    END{print n+0}' "$h")"
  [ "$bad" -eq 0 ] && ok "baseline rows carry their measurement command" \
                   || ng "$bad baseline row(s) in 16.md §5 carry no command — they will be transcribed"
fi

# B7 — a command that cannot run is not a measurement. Four shapes were measured on the consumer
# project, all producing silence rather than an error the reader would notice (cases 96 and 99):
#   (a) an unquoted glob passed to a command      -> zsh aborts with "no matches found"
#   (b) ${PIPESTATUS[0]}                          -> zsh has no PIPESTATUS; RC comes back empty
#   (c) `for x in <glob>` over a possibly-empty dir -> nomatch kills the loop, the consumer of the
#       loop reads zero lines, and an invariant counted over that input reports 0 violations —
#       which is the exact shape of a pass. That one is the dangerous member of the family: nothing
#       measured and everything correct look identical.
#   (d) `for x in $VAR` over a space-separated list -> zsh runs the loop once, on the joined string.
#       Measured 2026-08-15 (case 99): 15 items were to be checked, the loop ran on one nonexistent
#       15-way-concatenated name, and the output read "NOT-FOUND: 1" — a plausible partial failure,
#       not a visible breakage. This shape was named as a known gap in B7 the day before it was hit;
#       naming a gap is not closing one, which is why it is a pattern here and not a caution.
# (a), (b) and (d) are decidable from the text; (c) is not, and rule 04 §invariant reporting carries
# it. All four share one defense the checker cannot supply: print the denominator (see rule 04).
# B5 proves a row *has* a command; it cannot
# prove the command ran, and the gap is real: measured 2026-08-15 (LaserEditor S018 finding F-3), a
# §5 row read `ls tsconfig.json eslint.config.* package.json`, which zsh aborts with "no matches
# found" before listing anything. The row's conclusion happened to be right; its evidence was empty.
#
# Executing the rows here is not an option — §5 commands legitimately reach production (one of them
# is `ssh ml30 …`), and a check that touches production to prove a document is worse than the defect.
# So this catches the one statically-decidable class: an unquoted glob passed to a command, which
# aborts under zsh (the interactive shell these sessions run) while passing under bash.
#
# KNOWN GAP, stated rather than implied (PT-6): B5 checks form, B7 checks portability, and neither
# checks execution. A row whose command runs but measures the wrong thing still passes both. The only
# real defense there is rule 13's requirement that the number come from a command you just ran.
if [ -f "$h" ]; then
  glob_bad="$(awk '
    /^## §5/{c=1; next}
    c && /^#/{exit}
    c && /^\|/ {
      line=$0
      while (match(line, /`[^`]+`/)) {
        cmd = substr(line, RSTART+1, RLENGTH-2)
        line = substr(line, RSTART+RLENGTH)
        # strip quoted spans; what remains is unquoted shell text
        # order matters: PIPESTATUS lives inside ${...}, so test it BEFORE stripping braces.
        # (Found by running this check against a synthetic row: the brace-strip silently ate the
        # very pattern being looked for — the same shape of hole this check exists to catch.)
        if (cmd ~ /PIPESTATUS/) { n++ }                       # zsh has no PIPESTATUS -> empty RC
        if (cmd ~ /for +[A-Za-z_][A-Za-z0-9_]* +in +[^;]*[*?]/) { n++ }   # nomatch kills the loop
        # (d) `for x in $VAR` — zsh does not word-split unquoted scalars (SH_WORD_SPLIT off by
        # default), so a space-separated list runs the loop ONCE, with the whole string as one item.
        # Command substitution IS split in zsh, so `$(...)` is deliberately not matched here.
        if (cmd ~ /for +[A-Za-z_][A-Za-z0-9_]* +in +\$\{?[A-Za-z_]/) { n++ }
        gsub(/"[^"]*"/, "", cmd); gsub(/\047[^\047]*\047/, "", cmd)
        gsub(/\$\{[^}]*\}/, "", cmd); gsub(/\$[?*@#!$0-9]/, "", cmd)   # $? and $* are not globs
        if (cmd ~ /[*?]/ && cmd !~ /find |grep |awk |sed |^ *#/) { n++ }
      }
    }
    END{print n+0}' "$h")"
  [ "${glob_bad:-0}" -eq 0 ] && ok "baseline commands carry no silently-empty shape (glob / PIPESTATUS / for-over-glob / for-over-\$VAR)" \
                             || ng "$glob_bad baseline command(s) go silently empty under zsh (unquoted glob / PIPESTATUS / for-over-glob / for-over-\$VAR) — use find or an array, quote the pattern, and take RC on its own line"
fi

# B18 — rule 22's four-role authority split and two execution modes must remain reachable as
# machinery, not collapse back into one parent/delegate relationship. (Measured origin: S004.)
r22=prompt/maintenance/global/rules/common/22-model-orchestration.md
if [ -f "$r22" ] && agrep "$r22" 'AUTHORITY_MODE' \
   && agrep "$r22" 'HUMAN_DIRECT' \
   && agrep "$r22" '^### Roles and authority' \
   && agrepE "$r22" 'never adopts its own work|✗ its own work'; then
  ok "B18 rule 22 carries four-role authority and mode machinery (1 rule scanned)"
else
  ng "B18 rule 22 lost AUTHORITY_MODE / HUMAN_DIRECT / Roles and authority / no-self-adoption machinery (1 rule scanned)"
fi

# B19 — commit authority is integration-owner-only in every mode. A mode qualifier on the
# prohibition silently grants an executor state authority. (Measured origin: S004 design audit.)
b19_scanned=0; b19_bad=""
for f in prompt/maintenance/global/templates/AGENTS-template.md AGENTS.md; do
  [ -f "$f" ] || continue
  b19_scanned=$((b19_scanned+1))
  grep -q 'AUTHORITY_MODE: DELEGATED | HUMAN_DIRECT' "$f" || b19_bad="$b19_bad $f:authority-mode-block"
  committing="$(awk '/^## Forbidden/{c=1;next} c&&/^## /{exit} c&&/[Cc]ommitting/{print}' "$f")"
  if [ -z "$committing" ]; then
    b19_bad="$b19_bad $f:no-Committing-line"
  elif printf '%s' "$committing" | grep -qE 'HUMAN_DIRECT|DELEGATED|AUTHORITY_MODE'; then
    b19_bad="$b19_bad $f:mode-qualified-Committing-line"
  fi
done
[ "$b19_scanned" -eq 2 ] && [ -z "$b19_bad" ] \
  && ok "B19 commit prohibition is mode-unconditional (2/2 authority files scanned)" \
  || ng "B19 authority/commit invariant violations:$b19_bad ($b19_scanned/2 files scanned)"

# B20 — roster names belong only to provenance or environment prerequisites, never common spec.
# This guards a consumer/model choice becoming a transferable requirement. (Measured origin: S004.)
b20_files=0; b20_bad=""
for f in prompt/maintenance/global/rules/common/*.md; do
  [ -e "$f" ] || continue
  b="$(basename "$f")"
  [ "$b" = judgment-mistakes-history.md ] && continue
  b20_files=$((b20_files+1))
  if [ "$b" = 22-model-orchestration.md ]; then
    env_line="$(grep -n '^## Environment prerequisites' "$f" | head -1 | cut -d: -f1)"
    hits="$(awk -v env="${env_line:-999999}" '
      $0 ~ /[Ff]able|[Oo]pus|[Ss]onnet|[Tt]erra|GPT-5|[Ll]una/ &&
      NR < env && $0 !~ /[Oo]rigin|[Mm]easured|case [0-9]|Last reviewed|前 review/ {print FILENAME ":" FNR ":" $0}' "$f")"
  else
    hits="$(awk '$0 ~ /[Ff]able|[Oo]pus|[Ss]onnet|[Tt]erra|GPT-5|[Ll]una/ &&
      $0 !~ /[Oo]rigin|[Mm]easured|case [0-9]|Last reviewed|前 review/ {print FILENAME ":" FNR ":" $0}' "$f")"
  fi
  [ -z "$hits" ] || b20_bad="$b20_bad$(printf '\n%s' "$hits")"
done
[ -z "$b20_bad" ] && ok "B20 model-lineage names stay out of common spec ($b20_files files scanned)" \
                    || ng "B20 model-lineage name promoted to common spec:$b20_bad ($b20_files files scanned)"

# B21 — the Route B exporter must show both useful output and an observable fail-closed branch.
# A success branch is disqualified if the same instrument cannot distinguish missing input. (S004.)
b21_out="$(mktemp)"
bash scripts/context-brief.sh --rules 22 > "$b21_out" 2>/dev/null
b21_rc=$?
b21_head="$(git rev-parse --short HEAD 2>/dev/null)"
# The count comes from the exporter's own BRIEF-MISSING field, never from grepping the payload:
# the brief embeds current-state documents verbatim, so a handover that merely discusses the sentinel
# would be counted as a failed acquisition. Measured 2026-08-24 — that is exactly what happened, and
# it arrived as a red gate at close on a brief whose every value had in fact been obtained. This is
# the registered "sentinel anchoring" defect (16.md §2 row 17), closed at its consuming trigger.
b21_not="$(sed -n 's/^BRIEF-MISSING: \([0-9]*\)$/\1/p' "$b21_out" | head -1)"
[ -n "$b21_not" ] || b21_not=-1
b21_purpose="$(awk '/^PURPOSE$/{c=1;next} c&&/^[A-Z][A-Z ]+$/{exit} c&&NF{n++} END{print n+0}' "$b21_out")"
b21_good=1
grep -q '^BRIEF-SCHEMA: v1$' "$b21_out" || b21_good=0
grep -q "$b21_head" "$b21_out" || b21_good=0
[ "$b21_purpose" -gt 0 ] || b21_good=0
if [ "$b21_rc" -eq 0 ]; then [ "$b21_not" -eq 0 ] || b21_good=0
elif [ "$b21_rc" -eq 3 ]; then [ "$b21_not" -gt 0 ] || b21_good=0
else b21_good=0
fi
CONTEXT_BRIEF_HANDOVER=/nonexistent-brief-test bash scripts/context-brief.sh --rules 22 > "$b21_out.fail" 2>/dev/null
b21_fail_rc=$?
b21_fail_not="$(sed -n 's/^BRIEF-MISSING: \([0-9]*\)$/\1/p' "$b21_out.fail" | head -1)"
[ -n "$b21_fail_not" ] || b21_fail_not=-1
[ "$b21_fail_rc" -eq 3 ] && [ "$b21_fail_not" -gt 0 ] || b21_good=0
[ "$b21_good" -eq 1 ] \
  && ok "B21 context brief success/fail-closed branches observable (normal RC=$b21_rc, $b21_not missing; control RC=$b21_fail_rc, $b21_fail_not missing)" \
  || ng "B21 context brief contract failed (normal RC=$b21_rc, purpose-lines=$b21_purpose, missing=$b21_not; control RC=$b21_fail_rc, missing=$b21_fail_not)"
rm -f "$b21_out" "$b21_out.fail"

# B22 — close must retain the mode-boundary finding and condition route-mix interpretation on
# eligible work, or silence becomes a false measure of health. (Measured origin: S004.)
if [ -f .claude/commands/close.md ] && agrep .claude/commands/close.md 'AUTHORITY_MODE' \
   && agrep .claude/commands/close.md 'eligible-task denominator'; then
  ok "B22 close records authority mode against eligible-task denominator (1 file scanned)"
else
  ng "B22 close lost AUTHORITY_MODE or eligible-task denominator (1 file scanned)"
fi

# B23 — registered consumer terms may occur in provenance/examples, never as fork-wide common
# requirements. This is a semantic boundary signal, not a permanent word ban. (Measured origin: S004.)
terms_file=scripts/spec-boundary-terms.txt
b23_terms=0; b23_files=0; b23_hits=0; b23_allowed=0; b23_violations=0; b23_bad=""
if [ -s "$terms_file" ]; then
  b23_list="$(mktemp)"
  awk 'NF && $0 !~ /^[[:space:]]*#/ {print tolower($0)}' "$terms_file" > "$b23_list"
  b23_terms="$(wc -l < "$b23_list" | tr -d ' ')"
  b23_paths="$(mktemp)"
  find prompt/maintenance/global .claude/commands .claude/hooks -type f 2>/dev/null \
    | grep -v 'judgment-mistakes-history.md$' | grep -v 'RULES_SNAPSHOT$' > "$b23_paths"
  find scripts -maxdepth 1 -type f -name '*.sh' 2>/dev/null >> "$b23_paths"
  find scripts -maxdepth 1 -type f -name '*.py' 2>/dev/null >> "$b23_paths"
  b23_files="$(wc -l < "$b23_paths" | tr -d ' ')"
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    while IFS= read -r term; do
      [ -n "$term" ] || continue
      found="$(grep -inF -- "$term" "$f" || true)"
      [ -n "$found" ] || continue
      while IFS= read -r hit; do
        [ -n "$hit" ] || continue
        b23_hits=$((b23_hits+1))
        if printf '%s' "$hit" | grep -qE '[Oo]rigin|[Mm]easured|case [0-9]|e\.g\.|[Ee]xample|fixture|provenance|harvested|migration|deployment record|S[0-9]{3}|Session [0-9]'; then
          b23_allowed=$((b23_allowed+1))
        else
          b23_violations=$((b23_violations+1))
          b23_bad="$b23_bad$(printf '\n%s:%s' "$f" "$hit")"
        fi
      done <<B23HITS
$found
B23HITS
    done < "$b23_list"
  done < "$b23_paths"
  rm -f "$b23_list" "$b23_paths"
fi
if [ "$b23_terms" -eq 0 ]; then
  ok "B23 0 terms registered — mechanism idle (0 terms / 0 files / 0 hits / 0 allowed / 0 violations)"
elif [ "$b23_violations" -eq 0 ]; then
  ok "B23 fork-neutrality (${b23_terms} terms / ${b23_files} files / ${b23_hits} hits / ${b23_allowed} allowed / 0 violations)"
else
  ng "B23 consumer-term promoted to common spec (candidates):$b23_bad (${b23_terms} terms / ${b23_files} files / ${b23_hits} hits / ${b23_allowed} allowed / ${b23_violations} violations)"
fi

# B24 — rule 13 sanctions TWO baseline paths: a generator, or §5 rows each carrying their own
# measurement command. The brief must reach STATUS-complete on BOTH — measured 2026-08-17 on the
# first consumer: a fully rule-compliant path-② repo could never leave INCOMPLETE, and the gap was
# generic (the branch tests only file existence). The command column must never reach the brief:
# consumer §5 commands name hosts and access paths (S006).
if [ -f scripts/context-brief.sh ]; then
  b24_dir="$(mktemp -d)"
  cat > "$b24_dir/handover.md" <<'B24EOF'
## §1. state
one line of state.
## §2. tasks
| # | Task |
|---|---|
| 1 | t |
## §3. settled
- a decision.
## §5. start procedure and baseline
| item | measured (last close) | command |
|---|---|---|
| tests | 12 passed / 0 failed | B24CANARY_ssh_root_at_host_probe |
B24EOF
  CONTEXT_BRIEF_HANDOVER="$b24_dir/handover.md" CONTEXT_BRIEF_BASELINE="$b24_dir/nonexistent" \
    bash scripts/context-brief.sh > "$b24_dir/brief" 2>/dev/null
  b24_rc=$?
  b24_good=1
  [ "$b24_rc" -eq 0 ] || b24_good=0
  grep -q '12 passed / 0 failed' "$b24_dir/brief" || b24_good=0
  grep -q 'claims, not fresh measurement' "$b24_dir/brief" || b24_good=0
  grep -q 'B24CANARY' "$b24_dir/brief" && b24_good=0
  grep -q 'NOT OBTAINED: baseline' "$b24_dir/brief" && b24_good=0
  # control: neither generator nor §5 table — fail-closed must survive the new branch
  cat > "$b24_dir/handover-nob.md" <<'B24EOF'
## §1. state
s
## §2. tasks
t
## §3. settled
d
B24EOF
  CONTEXT_BRIEF_HANDOVER="$b24_dir/handover-nob.md" CONTEXT_BRIEF_BASELINE="$b24_dir/nonexistent" \
    bash scripts/context-brief.sh > "$b24_dir/brief-ctl" 2>/dev/null
  b24_ctl_rc=$?
  b24_ctl_not="$(grep -c 'NOT OBTAINED: baseline' "$b24_dir/brief-ctl" || true)"
  [ "$b24_ctl_rc" -eq 3 ] && [ "$b24_ctl_not" -gt 0 ] || b24_good=0
  if [ "$b24_good" -eq 1 ]; then
    ok "B24 rule-13-path-② brief complete, command column withheld (fixture RC=$b24_rc; control RC=$b24_ctl_rc, $b24_ctl_not missing)"
  else
    ng "B24 path-② brief contract failed (fixture RC=$b24_rc; control RC=$b24_ctl_rc, $b24_ctl_not missing; brief kept at $b24_dir/brief)"
  fi
  [ "$b24_good" -eq 1 ] && rm -rf "$b24_dir"
fi

# B25 — the S005-fix directive's authority/state wiring (2026-08-17 user ruling) must stay in the
# texts that enforce it: gate-red HOLD precedence + authority citation + no-residual-authority
# (rule 22), pre-entry reconcile + state-claim artifact duty (close.md), completion-word condition
# (rule 04). Each guard phrase is load-bearing: its absence means the wiring was edited away.
b25_missing=""
agrep prompt/maintenance/global/rules/common/22-model-orchestration.md 'takes precedence over any standing continuation' || b25_missing="$b25_missing R1:gate-red-HOLD"
agrep prompt/maintenance/global/rules/common/22-model-orchestration.md 'cite your authority before leaving the enumerated scope' || b25_missing="$b25_missing R5:authority-citation"
agrep prompt/maintenance/global/rules/common/22-model-orchestration.md 'No residual authority' || b25_missing="$b25_missing R6:no-residual"
agrep .claude/commands/close.md 'Pre-entry reconcile' || b25_missing="$b25_missing R2:reconcile"
agrep .claude/commands/close.md 'backed by its verification command' || b25_missing="$b25_missing R4:state-artifact"
agrep prompt/maintenance/global/rules/common/04-testing-strategy.md 'Completion words are state transitions' || b25_missing="$b25_missing R3:completion-words"
if [ -z "$b25_missing" ]; then
  ok "B25 authority/state wiring present (6/6 guard phrases: R1-R6 minus R8-backlog)"
else
  ng "B25 authority/state wiring missing:$b25_missing"
fi

# B26 — the session-mode machinery and the route-line delegation-consideration duty (2026-08-18
# user directive) must stay in rule 22 and close.md. Mode names reference roster TIERS (T1),
# never model names — B20 enforces the naming side; this enforces presence. Each guard phrase is
# load-bearing: its absence means the machinery was edited away.
b26_missing=""
agrep "$r22" 'PRIMARY_MODEL_MODE'                       || b26_missing="$b26_missing mode-header"
agrep "$r22" 'T1-solo'                                  || b26_missing="$b26_missing T1-solo"
agrep "$r22" 'T1-conserve'                              || b26_missing="$b26_missing T1-conserve"
agrep "$r22" 'non-T1'                                   || b26_missing="$b26_missing non-T1"
agrep "$r22" 'Undeclared = `T1-solo`'                   || b26_missing="$b26_missing undeclared-default"
agrep "$r22" 'never solo-adopted'                       || b26_missing="$b26_missing non-T1-no-solo-adoption"
agrep "$r22" 'reference roster tiers, never model names' || b26_missing="$b26_missing roster-tier-naming"
agrep "$r22" 'no delegation (<reason, 1 line>)'         || b26_missing="$b26_missing route-line-lane-record"
agrep .claude/commands/close.md 'PRIMARY_MODEL_MODE'    || b26_missing="$b26_missing close-mode-record"
if [ -z "$b26_missing" ]; then
  ok "B26 session-mode + route-line lane-record machinery present (9/9 guard phrases)"
else
  ng "B26 session-mode machinery missing:$b26_missing"
fi

# B27 — the human-side protocol (session-start mode declaration; external-advisor output enters
# via brief attachment + harness-vocabulary grounding) must stay in OPERATIONS.md §7. Template
# repo only — OPERATIONS.md does not travel, so a bootstrapped project skips this check.
if [ -f OPERATIONS.md ]; then
  b27_missing=""
  agrep OPERATIONS.md '人間側プロトコル'      || b27_missing="$b27_missing protocol-section"
  agrep OPERATIONS.md 'PRIMARY_MODEL_MODE'   || b27_missing="$b27_missing mode-declaration"
  agrep OPERATIONS.md '未宣言は `T1-solo` 既定' || b27_missing="$b27_missing undeclared-default"
  agrep OPERATIONS.md '接地確認'              || b27_missing="$b27_missing vocabulary-grounding"
  agrep OPERATIONS.md 'context-brief.sh'     || b27_missing="$b27_missing brief-attachment"
  if [ -z "$b27_missing" ]; then
    ok "B27 human-side protocol present in OPERATIONS.md (5/5 guard phrases)"
  else
    ng "B27 human-side protocol missing:$b27_missing"
  fi
fi

# B28 — the usage-report contract: dedupe by message.id (an API call emits several transcript
# lines with the same id — summing lines would multi-count every number), per-actor rows for
# parent / subagent / codex, unit emitted by the instrument, and an observable fail-closed branch
# (a missing transcript prints NOT OBTAINED and exits 3, never zeros). Fixture-run because the
# live transcript's numbers are unknowable in advance; the fixture's are exact, so a dedupe
# regression changes a digit this check names.
if [ -f scripts/usage-report.sh ]; then
  b28_dir="$(mktemp -d)"
  mkdir -p "$b28_dir/proj/sess/subagents" "$b28_dir/codex/2026/01/01"
  cat > "$b28_dir/proj/sess.jsonl" <<'B28EOF'
{"timestamp":"2026-01-01T00:00:00Z","type":"assistant","message":{"id":"m1","model":"claude-test-a","usage":{"input_tokens":10,"cache_creation_input_tokens":100,"cache_read_input_tokens":200,"output_tokens":5},"content":[{"type":"tool_use","name":"mcp__codex__codex"}]}}
{"timestamp":"2026-01-01T00:00:01Z","type":"assistant","message":{"id":"m1","model":"claude-test-a","usage":{"input_tokens":10,"cache_creation_input_tokens":100,"cache_read_input_tokens":200,"output_tokens":5},"content":[{"type":"text","text":"x"}]}}
{"timestamp":"2026-01-01T00:00:02Z","type":"assistant","message":{"id":"m2","model":"claude-test-a","usage":{"input_tokens":1,"cache_creation_input_tokens":2,"cache_read_input_tokens":3,"output_tokens":4},"content":[]}}
B28EOF
  cat > "$b28_dir/proj/sess/subagents/agent-t1.jsonl" <<'B28EOF'
{"timestamp":"2026-01-01T00:00:03Z","type":"assistant","message":{"id":"s1","model":"claude-test-b","usage":{"input_tokens":6,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":7},"content":[]}}
B28EOF
  printf '{"agentType":"probe"}\n' > "$b28_dir/proj/sess/subagents/agent-t1.meta.json"
  cat > "$b28_dir/codex/2026/01/01/rollout-fixture.jsonl" <<'B28EOF'
{"timestamp":"2026-01-01T00:00:04Z","type":"session_meta","payload":{"cwd":"/b28-fixture-repo","model":"gpt-test"}}
{"timestamp":"2026-01-01T00:00:05Z","type":"event_msg","payload":{"type":"token_count","info":{"total_token_usage":{"input_tokens":50,"cached_input_tokens":20,"cache_write_input_tokens":0,"output_tokens":9,"reasoning_output_tokens":2,"total_tokens":59}}}}
B28EOF
  b28_out="$(UR_PROJ_DIR="$b28_dir/proj" UR_SESSION="$b28_dir/proj/sess.jsonl" \
             UR_CODEX_DIR="$b28_dir/codex" UR_REPO="/b28-fixture-repo" \
             bash scripts/usage-report.sh 2>/dev/null)"
  b28_rc=$?
  b28_good=1
  [ "$b28_rc" -eq 0 ]                                                        || b28_good=0
  printf '%s' "$b28_out" | grep -q 'unit: tokens'                            || b28_good=0
  printf '%s' "$b28_out" | grep -qF '| parent | claude-test-a | 2 | 11 | 102 | 203 | 9 |' || b28_good=0
  printf '%s' "$b28_out" | grep -q 'subagent:probe'                          || b28_good=0
  printf '%s' "$b28_out" | grep -q 'claude-test-b'                           || b28_good=0
  printf '%s' "$b28_out" | grep -q 'gpt-test'                                || b28_good=0
  printf '%s' "$b28_out" | grep -qF '50 (cached 20)'                         || b28_good=0
  printf '%s' "$b28_out" | grep -q 'codex tool calls = 1'                    || b28_good=0
  # control: missing transcript dir → fail-closed, never zeros
  b28_ctl="$(UR_PROJ_DIR="$b28_dir/nonexistent" UR_SESSION= bash scripts/usage-report.sh 2>/dev/null)"
  b28_ctl_rc=$?
  [ "$b28_ctl_rc" -eq 3 ]                                  || b28_good=0
  printf '%s' "$b28_ctl" | grep -q 'NOT OBTAINED'          || b28_good=0
  grep -q 'usage-report.sh' .claude/commands/close.md      || b28_good=0
  if [ "$b28_good" -eq 1 ]; then
    ok "B28 usage-report contract (fixture RC=$b28_rc dedupe/rows/unit ok; control RC=$b28_ctl_rc NOT OBTAINED; close.md wired)"
    rm -rf "$b28_dir"
  else
    ng "B28 usage-report contract failed (fixture RC=$b28_rc; control RC=$b28_ctl_rc; fixture kept at $b28_dir)"
  fi
fi

# B29 — the close-boundary gate/push separation (case 110, LaserEditor S025: a piped selftest RC
# fused with commit+push let a red gate reach origin) must stay in close.md step 7 and in the
# JMH Part 1 index.
b29_missing=""
agrep .claude/commands/close.md 'never share a command batch' || b29_missing="$b29_missing close-step7-clause"
agrep "$jmh" '| 110 | LaserEditor S025'                       || b29_missing="$b29_missing jmh-index-row"
if [ -z "$b29_missing" ]; then
  ok "B29 gate/push separation wired (close.md step 7 + JMH case 110 row)"
else
  ng "B29 gate/push separation missing:$b29_missing"
fi

# B30 — the session-role machinery (2026-08-18 relay directive T2): SESSION_ROLE must stay in
# rule 22 (both roles, the PRIMARY no-self-acceptance boundary, the REVIEWER write boundary,
# adjudication candidates, the undeclared default) and close.md must record the declared role.
# Verifier / executor / transition-executor separation at session scale — S005-audit principle.
b30_missing=""
agrep "$r22" '^### Session role'                            || b30_missing="$b30_missing role-section"
agrep "$r22" 'undeclared = `PRIMARY`'                       || b30_missing="$b30_missing undeclared-default"
agrep "$r22" 'declare acceptance of its own deliverables'   || b30_missing="$b30_missing primary-no-self-acceptance"
agrep "$r22" 'modify or commit repo-body files'             || b30_missing="$b30_missing reviewer-write-boundary"
agrep "$r22" '裁定候補 (adjudication candidates)'           || b30_missing="$b30_missing adjudication-candidates"
agrep .claude/commands/close.md 'SESSION_ROLE'              || b30_missing="$b30_missing close-role-record"
if [ -z "$b30_missing" ]; then
  ok "B30 session-role machinery present (6/6 guard phrases)"
else
  ng "B30 session-role machinery missing:$b30_missing"
fi

# B31 — the review-report baton (relay directive T3): location + filename + five required
# sections + the 16.md baton-row shape + the next-PRIMARY read duty must stay defined in rule 22;
# the template file must carry the five sections; local/README must register the folder; the
# decision tree must carry the REVIEWER inbound edge (a document with no edge is operationally
# absent — README §Writing for the reader, principle 1).
rrt=prompt/maintenance/global/templates/review-report-template.md
b31_missing=""
agrep "$r22" '^### Review-report baton'                     || b31_missing="$b31_missing baton-section"
agrep "$r22" 'YYYY-MM-DD_review-'                           || b31_missing="$b31_missing filename-pattern"
agrep "$r22" 'Review complete — fixes pending'              || b31_missing="$b31_missing baton-row-shape"
agrep "$r22" '§0-mandatory-read standing'                   || b31_missing="$b31_missing next-primary-read-duty"
if [ -f "$rrt" ]; then
  for s in 'Target commit range' 'Claim-verify table' 'Findings' 'Adjudication candidates' 'Independent re-measurements'; do
    agrep "$rrt" "$s" || b31_missing="$b31_missing template-section:$s"
  done
else
  b31_missing="$b31_missing template-file"
fi
# local/README.md is the local layer and does not travel by sync (OPERATIONS.md §1) — a consumer
# runs this synced check against its own un-synced local/README, so the row is enforced only in
# the template repo (same template-marker guard as B27). Consumers register the folder when their
# first REVIEWER session needs it; the rule-22 baton section travels and names the location.
if [ -f OPERATIONS.md ]; then
  agrep prompt/maintenance/local/README.md 'review-report-template' || b31_missing="$b31_missing local-readme-row"
fi
agrep prompt/maintenance/global/rules/README.md 'SESSION_ROLE: REVIEWER' || b31_missing="$b31_missing decision-tree-edge"
if [ -f OPERATIONS.md ]; then
  b31_scope="rule 22 + template 5 sections + local/README + tree edge"
else
  b31_scope="rule 22 + template 5 sections + tree edge; local/README row not checked (consumer-side)"
fi
if [ -z "$b31_missing" ]; then
  ok "B31 review-report baton wired ($b31_scope)"
else
  ng "B31 review-report baton missing:$b31_missing"
fi

# B32 — the AGENTS generator (and instance, where present) must carry the Session-roles section
# (relay directive T4): a delegate-lineage model launched as session PRIMARY/REVIEWER receives
# R1-R6 and the write boundary only through its own file. Checked generator-first for the same
# reason as B3: reaching one instance but not the generator omits it from every future bootstrap.
b32_missing=""
b32_files_scanned=1
for gf in "$tpl"; do
  agrep "$gf" '^## Session roles'                              || b32_missing="$b32_missing generator:section"
  agrep "$gf" 'SESSION_ROLE: PRIMARY | REVIEWER'               || b32_missing="$b32_missing generator:header"
  agrep "$gf" 'never declare acceptance of your own deliverables' || b32_missing="$b32_missing generator:no-self-acceptance"
  agrep "$gf" 'overrides any continuation order'               || b32_missing="$b32_missing generator:R1-gate-red-HOLD"
  agrep "$gf" 'Close begins with a reconcile'                  || b32_missing="$b32_missing generator:R2-reconcile"
  agrep "$gf" 'Completion words are state transitions'         || b32_missing="$b32_missing generator:R3-completion-words"
  agrep "$gf" 'A state claim requires its artifact'            || b32_missing="$b32_missing generator:R4-state-artifact"
  agrep "$gf" 'Cite your authority before leaving the enumerated scope' || b32_missing="$b32_missing generator:R5-citation"
  agrep "$gf" 'No residual authority'                          || b32_missing="$b32_missing generator:R6-no-residual"
  agrep "$gf" 'Forbidden set below is unchanged by any session role' || b32_missing="$b32_missing generator:forbidden-unchanged"
done
if [ -f AGENTS.md ]; then
  b32_files_scanned=2
  agrep AGENTS.md '^## Session roles' || b32_missing="$b32_missing instance:section"
  agrep AGENTS.md 'No residual authority' || b32_missing="$b32_missing instance:R6-no-residual"
fi
if [ -z "$b32_missing" ]; then
  ok "B32 AGENTS session-roles section present ($b32_files_scanned/$b32_files_scanned files scanned)"
else
  ng "B32 AGENTS session-roles section missing:$b32_missing"
fi

# B33 — S034 delegation exclusivity is one three-part boundary: worker-exclusive technical scope,
# bounded review of submitted artifacts, and five exception-only parent reproduction triggers.
b33_missing=""
agrep "$r22" '^### Delegation exclusivity: the worker owns the technical scope' || b33_missing="$b33_missing exclusivity"
agrep "$r22" '^### Bounded deliverable review is not shadow execution'          || b33_missing="$b33_missing bounded-review"
agrep "$r22" 'Parent same-scope technical reproduction is permitted only'     || b33_missing="$b33_missing exception-trigger"
agrep "$r22" 'Independent workers.*materially conflict'                       || b33_missing="$b33_missing exception-1"
agrep "$r22" 'Evidence is missing, contradictory, or damaged'                 || b33_missing="$b33_missing exception-2"
agrep "$r22" 'Human-only or parent-only authority boundary'                   || b33_missing="$b33_missing exception-3"
agrep "$r22" 'After `HOLD` or `ESCALATE`'                                     || b33_missing="$b33_missing exception-4"
agrep "$r22" 'explicitly requests parent independent verification'            || b33_missing="$b33_missing exception-5"
agrep "$r22" '"Just in case" is not a'                                      || b33_missing="$b33_missing stress-judgment"
if [ -z "$b33_missing" ]; then
  ok "B33 rule 22 worker exclusivity + bounded review + exception triggers present (9/9 guards)"
else
  ng "B33 rule 22 Harness/Worker boundary missing:$b33_missing"
fi

# B34 — implementation conventions travel with an explicit no-shadow dispatch window.
b34_missing=""
agrep prompt/maintenance/global/rules/common/03-coding.md 'no same-scope shadow execution' || b34_missing="$b34_missing no-shadow"
agrep prompt/maintenance/global/rules/common/03-coding.md 'Waiting permits user communication' || b34_missing="$b34_missing waiting-allowlist"
if [ -z "$b34_missing" ]; then
  ok "B34 rule 03 no-parent-shadow orchestration present (2/2 guards)"
else
  ng "B34 rule 03 orchestration missing:$b34_missing"
fi

# B35 — no-trust-and-skip survives, but routine parent per-claim reproduction does not.
b35_missing=""
for evidence in 'E1 — worker raw evidence' 'E2 — independent Codex verification' 'E3 — parent reproduction'; do
  agrep prompt/maintenance/global/rules/common/04-testing-strategy.md "$evidence" || b35_missing="$b35_missing $evidence"
done
agrep prompt/maintenance/global/rules/common/04-testing-strategy.md 'No-trust-and-skip remains forbidden' || b35_missing="$b35_missing no-trust-skip"
agrep prompt/maintenance/global/rules/common/04-testing-strategy.md 'Routine parent per-claim' || b35_missing="$b35_missing routine-parent-abolition"
agrep prompt/maintenance/global/rules/common/04-testing-strategy.md 'project-wide close gates' || b35_missing="$b35_missing global-gates"
if [ -z "$b35_missing" ]; then
  ok "B35 rule 04 E1/E2/E3 evidence system and routine-parent abolition present (6/6 guards)"
else
  ng "B35 rule 04 delegated evidence contract missing:$b35_missing"
fi

# B36 — the cold-start roster names the Harness and primary worker, and §6 blocks all four decay paths.
b36_missing=""
agrep CLAUDE.md 'Harness / Integration Conductor' || b36_missing="$b36_missing harness-role"
agrep CLAUDE.md 'Primary technical execution system' || b36_missing="$b36_missing primary-worker"
agrep CLAUDE.md 'Shadow-executing delegated technical scope' || b36_missing="$b36_missing shadow"
agrep CLAUDE.md 'delegate wait time for duplicate investigation' || b36_missing="$b36_missing wait-time"
agrep CLAUDE.md "adopt/reject ownership as a duty to reproduce" || b36_missing="$b36_missing adopt-reject"
agrep CLAUDE.md 'long session weakened start-of-session salience' || b36_missing="$b36_missing salience"
if [ -z "$b36_missing" ]; then
  ok "B36 CLAUDE.md Harness/primary-worker roster + four no-reversion guards present (6/6)"
else
  ng "B36 CLAUDE.md Harness/Worker cold-start wiring missing:$b36_missing"
fi

# B37 — the packet contract carries every required field and the AUTO_ADVANCE implication.
packet=prompt/maintenance/global/templates/delegation-packet-template.md
b37_missing=""
if [ -f "$packet" ]; then
  # The fields must be IN THE CONTRACT BLOCK, not merely somewhere in the document.
  # Measured (S012 mutation harness, family M5): deleting `CONFLICT_SURFACE: {{...}}` from the
  # packet body left B37 green, because the field name still occurred in the prose rules below
  # it. A worker copies the block; a field discussed but not in the block is not in the packet.
  # The header region is the block up to its first `# ` section marker; the section markers
  # are the `# NAME` lines inside the block. A field is present only as a DECLARATION in its
  # own region. Measured (S012, M5): deleting `CONFLICT_SURFACE: {{...}}` left B37 green
  # twice — first because the name still occurred in the prose below the block, then because
  # the RESULT CAPSULE sub-format inside the same block re-uses the same field name.
  b37_head="$(awk '/^```/{f=!f; next} f && /^# /{exit} f' "$packet")"
  b37_secs="$(awk '/^```/{f=!f; next} f && /^# /{print}' "$packet")"
  b37_fields=0
  for field in LANE_SEQUENCE AUTO_ADVANCE CONFLICT_SURFACE; do
    b37_fields=$((b37_fields+1))
    printf '%s\n' "$b37_head" | grep -q "^${field}:" || b37_missing="$b37_missing $field"
  done
  for field in STOP_IF KNOWN_SANDBOX_NOISE RESULT_CAPSULE_FORMAT; do
    b37_fields=$((b37_fields+1))
    printf '%s\n' "$b37_secs" | grep -qx "# ${field}" || b37_missing="$b37_missing $field"
  done
  [ -n "$b37_head" ] || b37_missing="$b37_missing contract-block-empty"
  agrep "$packet" '`AUTO_ADVANCE: YES` requires `CONFLICT_SURFACE: MANDATORY`' || b37_missing="$b37_missing auto-advance-implication"
  agrep "$packet" 'inherited \*\*verbatim\*\*' || b37_missing="$b37_missing verbatim-stops"
else
  b37_missing="$b37_missing template-file"
fi
if [ -z "$b37_missing" ]; then
  ok "B37 delegation packet contract present (${b37_fields}/6 fields inside the fenced contract block + implication + verbatim STOP inheritance)"
else
  ng "B37 delegation packet contract missing:$b37_missing"
fi

# B38 — the generator must carry the shared worker contract and a generic project-injection slot.
# Source-project test ids, paths, and hosts must not become template defaults.
b38_missing=""
agrep "$tpl" 'GENERATED derived cache' || b38_missing="$b38_missing generator:generated-marker"
agrep "$tpl" '^### Lane sequences, worker ownership, and RESULT CAPSULE' || b38_missing="$b38_missing generator:worker-section"
agrep "$tpl" 'A PASS → B RED → A correction → B RED 0' || b38_missing="$b38_missing generator:A-B-route"
agrep "$tpl" 'copy first and mutate the copy' || b38_missing="$b38_missing generator:mutation-restore"
agrep "$tpl" 'KNOWN_SANDBOX_NOISE.*exact and project-specific' || b38_missing="$b38_missing generator:exact-noise-contract"
agrep "$tpl" '{{KNOWN_SANDBOX_NOISE}}' || b38_missing="$b38_missing generator:noise-slot"
if grep -qE 't205|t206|t250|t251|t259|t265|t278|t279|t282|ML30|laser-editor' "$tpl"; then
  b38_missing="$b38_missing generator:source-project-noise-leak"
fi
if [ -z "$b38_missing" ]; then
  ok "B38 AGENTS generator worker contract + generic noise injection present (6/6 guards; 10 source tokens absent)"
else
  ng "B38 AGENTS generator worker contract missing or non-generic:$b38_missing"
fi

# B39 — shadow-audit v3 behaviour: both error directions, executed on fixtures.
#
# Rewritten for Phase 5 (2026-08-25). v2's rule was "any parent tool call in the window is a
# violation, except one hard-coded command", and this check asserted its numbers, so the check was
# green while the instrument was wrong in BOTH directions. Measured on identical transcripts:
#   negative.jsonl (a status poll, a Read of the handover, git log, a human escalation, a read
#     outside the scope) -> v2 FAIL/5, v3 PASS/0. Every one of those is a parent duty rule 22
#     §Delegation exclusivity and rule 24 §Harness and worker name explicitly.
#   subagent.jsonl (the parent runs the worker's test, greps the worker's file) -> v2 PASS/0,
#     because v2 opened a window only on the MCP lane; v3 FAIL/2.
# So this check now pins BOTH controls plus the three fail-closed refusals, with counts, not just
# verdicts: a verdict-only assertion cannot tell a correct PASS from an empty one (case PT-28).
b39_dir=scripts/fixtures/shadow-audit
b39_tmp="$(mktemp -d)"
b39_good=1
b39_run() { python3 scripts/shadow_audit.py "$b39_dir/$1.jsonl" 2>"$b39_tmp/$1.err"; }

# false-positive control: permitted parent duties inside the window must NOT be flagged.
b39_neg="$(b39_run negative)"; b39_neg_rc=$?
[ "$b39_neg_rc" -eq 0 ] || b39_good=0
printf '%s' "$b39_neg" | grep -q 'verdict: PASS'            || b39_good=0
printf '%s' "$b39_neg" | grep -q 'shadow_execution: 0'      || b39_good=0
printf '%s' "$b39_neg" | grep -q 'governance: 3'            || b39_good=0
printf '%s' "$b39_neg" | grep -q 'out_of_delegated_scope: 2' || b39_good=0
printf '%s' "$b39_neg" | grep -q 'parent_actions_in_window: 5' || b39_good=0
grep -q 'TaskOutput' "$b39_dir/negative.jsonl"              || b39_good=0
grep -q '16_次セッション引き継ぎ指示書' "$b39_dir/negative.jsonl" || b39_good=0

# false-negative control: the four forbidden shapes must all be flagged.
b39_pos="$(b39_run positive)"; b39_pos_rc=$?
[ "$b39_pos_rc" -eq 1 ] || b39_good=0
printf '%s' "$b39_pos" | grep -q 'verdict: FAIL'          || b39_good=0
printf '%s' "$b39_pos" | grep -q 'shadow_execution: 4'    || b39_good=0
printf '%s' "$b39_pos" | grep -q 'governance: 0'          || b39_good=0
# a test run naming no path at all is the shape a target-based rule cannot see
grep -q 'python3 -m pytest -q' "$b39_dir/positive.jsonl"   || b39_good=0
grep -qE '"name": ?"ToolSearch"' "$b39_dir/positive.jsonl" || b39_good=0

# the false negative v2 could not see at all: a delegation dispatched to a subagent.
b39_sub="$(b39_run subagent)"; b39_sub_rc=$?
[ "$b39_sub_rc" -eq 1 ] || b39_good=0
printf '%s' "$b39_sub" | grep -q 'delegated_windows: 1'  || b39_good=0
printf '%s' "$b39_sub" | grep -q 'shadow_execution: 2'   || b39_good=0
printf '%s' "$b39_sub" | grep -q 'governance: 1'         || b39_good=0
grep -qE '"name": ?"Agent"' "$b39_dir/subagent.jsonl"      || b39_good=0

# a recorded EXCEPTION_TRIGGER is the one sanctioned way back into the delegated scope.
b39_exc="$(b39_run exception)"; b39_exc_rc=$?
[ "$b39_exc_rc" -eq 0 ] || b39_good=0
printf '%s' "$b39_exc" | grep -q 'exception_reproduction: 1' || b39_good=0
printf '%s' "$b39_exc" | grep -q 'verdict: PASS'            || b39_good=0

# fail-closed 1: a packet that declares no scope makes overlap unanswerable — refuse, never PASS.
b39_und="$(b39_run scope-undeclared)"; b39_und_rc=$?
[ "$b39_und_rc" -eq 2 ] || b39_good=0
printf '%s' "$b39_und" | grep -q 'scope_declared_windows: 0'  || b39_good=0
printf '%s' "$b39_und" | grep -q 'verdict: INSTRUMENT_ERROR'  || b39_good=0

# fail-closed 2: a dispatch whose receipt never arrives may not swallow the actions after it.
b39_err="$(b39_run instrument-error)"; b39_err_rc=$?
[ "$b39_err_rc" -eq 2 ] || b39_good=0
printf '%s' "$b39_err" | grep -q 'verdict: INSTRUMENT_ERROR' || b39_good=0

if [ "$b39_good" -eq 1 ]; then
  ok "B39 shadow-audit v3 behaviour (FP control: negative PASS gov=3/oos=2/shadow=0; FN controls: positive FAIL/4 incl a path-less test run, subagent FAIL/2; exception PASS/1; fail-closed: undeclared scope + missing receipt both INSTRUMENT_ERROR)"
  rm -rf "$b39_tmp"
else
  ng "B39 shadow-audit v3 behaviour failed (negative RC=$b39_neg_rc; positive RC=$b39_pos_rc; subagent RC=$b39_sub_rc; exception RC=$b39_exc_rc; undeclared RC=$b39_und_rc; error RC=$b39_err_rc; stderr at $b39_tmp)"
fi

# B50 — read-load's detection power, executed rather than asserted.
#
# Check ids B40-B49 are deliberately skipped: the reference implementation this harness harvests from
# already uses them for different checks, and a later harvest would collide on the identifier.
#
# A gauge that only ever runs against a healthy repo has never shown that it CAN report bad news, and
# this one used to fail toward green — a missing mandatory file made the number smaller and left RC 0
# (rule 04 §Show the test has detection power; case PT-4 "make every check go red right after writing
# it"). The four negatives below are also this check's positive control: a read-load.sh replaced by a
# stub that always prints a plausible line and exits 0 would pass the positive case and fail all four,
# so the set cannot be satisfied by an instrument that measures nothing.
echo "[7] read-load fail-closed controls"
b50_mk() {
  local d="$1" s
  mkdir -p "$d/scripts" "$d/prompt/maintenance/global/rules/common" \
           "$d/prompt/maintenance/local/handover/sessions" "$d/prompt/maintenance/local/bugs/active"
  cp scripts/read-load.sh "$d/scripts/read-load.sh"
  cp CLAUDE.md "$d/CLAUDE.md"
  cp prompt/maintenance/global/rules/README.md "$d/prompt/maintenance/global/rules/README.md"
  for f in 13-session-recovery.md 17-no-self-imposed-scope.md judgment-mistakes-history.md; do
    cp "prompt/maintenance/global/rules/common/$f" "$d/prompt/maintenance/global/rules/common/$f"
  done
  cp prompt/maintenance/local/handover/16_*.md "$d/prompt/maintenance/local/handover/"
  cp prompt/maintenance/local/bugs/active/index.md "$d/prompt/maintenance/local/bugs/active/index.md"
  s="$(ls -1 prompt/maintenance/local/handover/sessions 2>/dev/null | grep -E '^S[0-9]+_.*\.md$' | sort | tail -1)"
  [ -n "$s" ] && cp "prompt/maintenance/local/handover/sessions/$s" "$d/prompt/maintenance/local/handover/sessions/"
}
b50_run() {   # $1 = tree; sets b50_rc / b50_out / b50_err
  b50_out="$(bash "$1/scripts/read-load.sh" 2>"$b50_tmp/err")"
  b50_rc=$?
  b50_err="$(cat "$b50_tmp/err")"
}
b50_tmp="$(mktemp -d)"; b50_bad=""
# 1. positive control — a complete set measures completely and says so.
b50_mk "$b50_tmp/pos"
b50_run "$b50_tmp/pos"
[ "$b50_rc" -eq 0 ] || b50_bad="$b50_bad positive-rc=$b50_rc"
printf '%s' "$b50_out" | head -1 | grep -qE '^[0-9]+ [0-9]+ [a-z]+$' || b50_bad="$b50_bad positive-line1-shape"
printf '%s' "$b50_out" | grep -q 'inputs measured 7/7' || b50_bad="$b50_bad positive-denominator"
# 2. every mandatory input absent — the greenest possible repo must be the loudest failure.
mkdir -p "$b50_tmp/none/scripts"; cp scripts/read-load.sh "$b50_tmp/none/scripts/"
b50_run "$b50_tmp/none"
[ "$b50_rc" -eq 3 ] || b50_bad="$b50_bad allmissing-rc=$b50_rc"
[ -z "$b50_out" ] || b50_bad="$b50_bad allmissing-stdout-not-empty"
printf '%s' "$b50_err" | grep -q 'INSTRUMENT_ERROR: measured 0/7' || b50_bad="$b50_bad allmissing-detail"
# 3. exactly one input absent — the case that used to shrink the total and stay green.
b50_mk "$b50_tmp/one"; rm -f "$b50_tmp/one/prompt/maintenance/local/bugs/active/index.md"
b50_run "$b50_tmp/one"
[ "$b50_rc" -eq 3 ] || b50_bad="$b50_bad onemissing-rc=$b50_rc"
[ -z "$b50_out" ] || b50_bad="$b50_bad onemissing-stdout-not-empty"
printf '%s' "$b50_err" | grep -q 'measured 6/7' || b50_bad="$b50_bad onemissing-denominator"
printf '%s' "$b50_err" | grep -q 'bugs/active/index.md (not found)' || b50_bad="$b50_bad onemissing-path"
# 4. input present but empty — "present" is not "measured".
b50_mk "$b50_tmp/empty"; : > "$b50_tmp/empty/prompt/maintenance/local/bugs/active/index.md"
b50_run "$b50_tmp/empty"
[ "$b50_rc" -eq 3 ] || b50_bad="$b50_bad emptyfile-rc=$b50_rc"
printf '%s' "$b50_err" | grep -q 'measured empty' || b50_bad="$b50_bad emptyfile-detail"
# 5. session history is present and must NOT be counted — the roster carries no session entry since
#    the 2026-08-25 ruling (N-alpha), and "not in the contract" has to mean "not in the total". A tree
#    with one more session file than another must report the same number; if it does not, something
#    is resolving history dynamically again and the set's size is back to being decided by how long
#    the previous author wrote. The 2026-08-24..25 version of this control asserted the opposite
#    (an unresolvable newest-session entry must fail closed) and was correct while the entry existed.
b50_mk "$b50_tmp/sess2"
cp "$b50_tmp/sess2/prompt/maintenance/local/handover/sessions/"S*.md \
   "$b50_tmp/sess2/prompt/maintenance/local/handover/sessions/S999_zzz_extra.md" 2>/dev/null
b50_run "$b50_tmp/sess2"; b50_two="$b50_out"; b50_two_rc="$b50_rc"
[ "$b50_two_rc" -eq 0 ] || b50_bad="$b50_bad extrasession-rc=$b50_two_rc"
printf '%s' "$b50_two" | grep -q 'handover/sessions/' && b50_bad="$b50_bad extrasession-counted"
[ "$(printf '%s' "$b50_two" | head -1)" = "$(printf '%s' "$(b50_run "$b50_tmp/pos"; printf '%s' "$b50_out")" | head -1)" ] \
  || b50_bad="$b50_bad extrasession-total-moved"
if [ -z "$b50_bad" ]; then
  ok "B50 read-load fail-closed: positive 7/7 RC=0 with a 3-field line 1; 3 known-negatives (all absent / one absent / present-but-empty) each RC=3 with empty stdout and a measured/expected detail line; and one invariance control — an extra sessions/ file changes neither the total nor the plan (history is not in the roster)"
  rm -rf "$b50_tmp"
else
  ng "B50 read-load fail-closed controls failed:$b50_bad (trees kept at $b50_tmp)"
fi

# B51 — handover-diff's detection power, executed against throwaway repositories.
#
# The failure this guards is specific and arrives exactly when the handover's shape is being changed:
# if the parser stops matching the PREVIOUS version's rows, every removal becomes invisible and the
# script prints "nothing left unaccounted" — a clean sweep it did not perform. The zero-denominator
# case below is that shape. The alpha-id case is the other half: rows whose id is not purely numeric
# used to be unparsed, so a project that numbered its batons H1/PF3 had no removal detection at all.
echo "[8] handover-diff controls"
b51_repo() {   # $1 = dir, $2 = prev body, $3 = curr body
  local d="$1"
  mkdir -p "$d/scripts" "$d/prompt/maintenance/local/handover"
  cp scripts/handover-diff.sh "$d/scripts/handover-diff.sh"
  ( cd "$d" && git init -q . && git config user.email t@example.invalid && git config user.name t )
  printf '%s' "$2" > "$d/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md"
  ( cd "$d" && git add -A && git commit -qm v1 )
  printf '%s' "$3" > "$d/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md"
  ( cd "$d" && git add -A && git commit -qm v2 )
}
b51_hdr='# h

## §2. Remaining tasks

| # | Task | Owner |
|---|---|---|
'
b51_tmp="$(mktemp -d)"; b51_bad=""
# 1. positive control — a dropped row is reported as GONE, and the run succeeds.
b51_repo "$b51_tmp/pos" \
  "$b51_hdr| 1 | inventory the receiver management state before any write | User |
| 2 | rotate the publishing credential and record the ruling | User |
" \
  "$b51_hdr| 1 | inventory the receiver management state before any write | User |
"
b51_out="$(cd "$b51_tmp/pos" && bash scripts/handover-diff.sh 2>&1)"; b51_rc=$?
[ "$b51_rc" -eq 0 ] || b51_bad="$b51_bad positive-rc=$b51_rc"
printf '%s' "$b51_out" | grep -q 'GONE (1)' || b51_bad="$b51_bad positive-not-detected"
printf '%s' "$b51_out" | grep -q 'entries parsed: 2 before' || b51_bad="$b51_bad positive-denominator"
printf '%s' "$b51_out" | grep -q 'relocated' || b51_bad="$b51_bad positive-classes"
# 2. zero-denominator — the previous version parses to nothing, so no removal could ever be seen.
b51_repo "$b51_tmp/zero" \
  "# h

## §2. Remaining tasks

(prose only — no rows the parser recognises)
" \
  "# h

## §2. Remaining tasks

(prose only — still nothing)
"
b51_out="$(cd "$b51_tmp/zero" && bash scripts/handover-diff.sh 2>&1)"; b51_rc=$?
[ "$b51_rc" -eq 2 ] || b51_bad="$b51_bad zerodenom-rc=$b51_rc(expected 2)"
printf '%s' "$b51_out" | grep -q 'INSTRUMENT_ERROR' || b51_bad="$b51_bad zerodenom-detail"
printf '%s' "$b51_out" | grep -q 'GONE (0)' && b51_bad="$b51_bad zerodenom-claimed-clean-sweep"
# 3. alpha-prefixed ids are entries — the removal of H2 must be seen.
b51_repo "$b51_tmp/alpha" \
  "$b51_hdr| H1 | inventory the receiver management state before any write | User |
| H2 | rotate the publishing credential and record the ruling | User |
" \
  "$b51_hdr| H1 | inventory the receiver management state before any write | User |
"
b51_out="$(cd "$b51_tmp/alpha" && bash scripts/handover-diff.sh 2>&1)"; b51_rc=$?
[ "$b51_rc" -eq 0 ] || b51_bad="$b51_bad alpha-rc=$b51_rc"
printf '%s' "$b51_out" | grep -q 'GONE (1)' || b51_bad="$b51_bad alpha-id-row-not-parsed"
if [ -z "$b51_bad" ]; then
  ok "B51 handover-diff: positive GONE 1/2 with the 4 classification names; zero-denominator previous version RC=2 INSTRUMENT_ERROR and no clean-sweep claim; alpha-prefixed id row detected"
  rm -rf "$b51_tmp"
else
  ng "B51 handover-diff controls failed:$b51_bad (repos kept at $b51_tmp)"
fi

# B52 — the current-state file must say which generation it is.
#
# The SessionStart hook injects a frozen copy of 16.md; a session that later re-reads the file from
# disk then holds two versions of the same "current" state with nothing to order them by, and the
# stale one reads exactly like the fresh one. GEN is the ordering token, and it is checked against
# the newest sessions/ file rather than merely being present — a marker nobody is forced to advance
# is a marker that stops advancing (a presence check would pass forever on GEN: S001-close).
echo "[9] current-state generation marker"
b52_h=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
if [ -f "$b52_h" ]; then
  b52_gen="$(grep -oE '^> \*\*GEN: S[0-9]+-close\*\*' "$b52_h" | head -1 | grep -oE 'S[0-9]+' | tr -d 'S')"
  b52_newest="$(ls -1 prompt/maintenance/local/handover/sessions 2>/dev/null \
                | grep -E '^S[0-9]+_.*\.md$' | sort | tail -1 | grep -oE '^S[0-9]+' | tr -d 'S')"
  if [ -z "$b52_gen" ]; then
    ng "B52: 16.md carries no \`GEN: S{NNN}-close\` line — the hook's frozen copy and a mid-session re-read cannot be told apart"
  elif ! grep -q 'GEN' .claude/commands/close.md; then
    ng "B52: close.md does not set the GEN line — a marker with no advancing step is stale by the next close"
  elif [ -z "$b52_newest" ]; then
    ng "B52: no sessions/S*.md to check GEN against — B52 measured nothing"
  elif [ "$((10#$b52_gen))" -ne "$((10#$b52_newest))" ]; then
    ng "B52: 16.md GEN is S${b52_gen}-close but the newest session file is S${b52_newest} — the handover is claiming a generation it is not"
  else
    ok "B52 current-state generation marker: 16.md GEN S${b52_gen}-close matches newest session S${b52_newest}, and close.md step 3 sets it"
  fi
fi

# B54 — CLAUDE.md may not own a current fact.
#
# This file is injected into every session before anyone decides anything, and it has no update
# trigger of its own, so a fact copied here outlives its owner while still reading as authoritative.
# Measured here: a `case index 45` line survived three closes at an actual of 48, and the discipline
# note that replaced the number still left a headed slot for the current task. The 2026-08-25 ruling
# made §2/§3 pointer-only BY CONSTRUCTION — so this is a violation scan with a stated denominator,
# not a phrase-presence check. Patterns are shapes that can only be assertions of current state; a
# historical example quoted inside a prohibition is deliberately not one of them.
echo "[10] CLAUDE.md pointer-only"
b54_bad=""; b54_scanned=0
for sec in 2 3; do
  b54_body="$(awk -v s="^## ${sec}\\\\." '$0 ~ s {c=1; next} c && /^## [0-9]+\./ {exit} c' CLAUDE.md)"
  if [ -z "$b54_body" ]; then b54_bad="$b54_bad §${sec}:section-not-found"; continue; fi
  b54_scanned=$((b54_scanned + 1))
  hit="$(printf '%s\n' "$b54_body" | grep -nE '✅|`[0-9a-f]{7}`|Session [0-9]+ close|GEN: S|NEXT ACTION|PRIMARY_OBJECTIVE|completed 20[0-9][0-9]-' || true)"
  [ -z "$hit" ] || b54_bad="$b54_bad §${sec}:$(printf '%s' "$hit" | cut -c1-60 | paste -sd'|' -)"
done
if [ "$b54_scanned" -ne 2 ]; then
  ng "B54: scanned $b54_scanned/2 CLAUDE.md sections — it measured nothing, which is not a pass ($b54_bad)"
elif [ -n "$b54_bad" ]; then
  ng "B54: CLAUDE.md asserts current state where it may only point ($b54_scanned/2 sections scanned):$b54_bad"
else
  ok "B54 CLAUDE.md pointer-only: 2/2 sections scanned, 0 current-state assertions (no ✅, commit id, session number, generation, objective or completion date)"
fi

# B55 — the canonical current-state owner must actually carry every current-state responsibility.
#
# This is what licenses a single-owner architecture: if one file owns current state, a cold start
# that reads it must be able to answer every question without opening historical evidence. The
# objective is parsed against a CLOSED GRAMMAR rather than looked for, because "PRIMARY_OBJECTIVE"
# appearing somewhere proves nothing about whether the field has a legal value — and UNSET is a legal
# value, not an error (2026-08-25 ruling).
echo "[11] current-state owner completeness"
b55_h=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
if [ -f "$b55_h" ]; then
  b55_n=0; b55_miss=""
  # Line-joined: a predicate that only matches when the author happened to wrap at the right column
  # measures typography, not the document's grammar.
  b55_flat="$(tr '\n' ' ' < "$b55_h")"
  b55_req() {  # $1 = label, $2 = ERE (matched against the line-joined document)
    if printf '%s' "$b55_flat" | grep -qE "$2"; then b55_n=$((b55_n + 1)); else b55_miss="$b55_miss $1"; fi
  }
  b55_req objective        '\*\*PRIMARY_OBJECTIVE:\*\* `(UNSET|ACTIVE|ACCEPTED|BLOCKED|STOPPED) — '
  b55_req go-stop          'GO / STOP boundary'
  b55_req baton-trigger    '\| *# *\| *Baton *\| *Status *\| *Trigger'
  b55_req status-grammar   'OPEN \(actionable once its trigger fires\) \| HOLD .* \| DEFERRED'
  b55_req supersedes       '\*Supersedes\*:'
  b55_req generation       '> \*\*GEN: S[0-9]+-close\*\*'
  b55_req baseline-command '\| Item \| Measured \| Command \|'
  b55_req contract-pointer 'read contract is owned by \*\*`CLAUDE.md` §0\*\*'
  b55_req history-boundary 'historical evidence, never current authority'
  if [ "$b55_n" -eq 9 ]; then
    ok "B55 current-state owner carries 9/9 responsibilities (objective parsed against its closed grammar; UNSET is legal)"
  else
    ng "B55: the canonical current-state owner is missing ${b55_miss# } (${b55_n}/9 responsibilities present) — a cold start would have to reconstruct it from historical evidence"
  fi
fi

# B56 — the close procedure has to be internally navigable, and carry the Phase 2 obligations.
#
# Not a phrase-presence check: it resolves every internal "step N" reference against the steps that
# actually exist. A step inserted or renumbered without updating its cross-references leaves a
# procedure that points at the wrong obligation, and that is invisible to any grep for content.
echo "[12] close procedure integrity"
b56_c=.claude/commands/close.md
if [ -f "$b56_c" ]; then
  b56_steps="$(grep -oE '^[0-9]+\. \*\*' "$b56_c" | grep -oE '^[0-9]+' | sort -n)"
  b56_count="$(printf '%s\n' "$b56_steps" | grep -c '[0-9]')"
  b56_max="$(printf '%s\n' "$b56_steps" | tail -1)"
  b56_bad=""
  # contiguous 0..max
  b56_expect="$(seq 0 "${b56_max:-0}")"
  [ "$(printf '%s\n' "$b56_steps")" = "$(printf '%s\n' "$b56_expect")" ] || b56_bad="$b56_bad numbering-not-contiguous"
  # every internal reference resolves
  b56_refs="$(grep -oE 'step [0-9]+' "$b56_c" | grep -oE '[0-9]+' | sort -nu)"
  b56_refn=0
  for r in $b56_refs; do
    b56_refn=$((b56_refn + 1))
    printf '%s\n' "$b56_steps" | grep -qx "$r" || b56_bad="$b56_bad dangling-ref:step-$r"
  done
  [ "$b56_refn" -gt 0 ] || b56_bad="$b56_bad no-refs-parsed"
  # Phase 2 obligations
  grep -q 'the tree changed after step 1' "$b56_c" || b56_bad="$b56_bad tree-scope-trigger"
  grep -q 'CLAUDE.md consistency' "$b56_c"         || b56_bad="$b56_bad claudemd-step"
  grep -q 'classified LOST' "$b56_c"               || b56_bad="$b56_bad lost-blocks-close"
  grep -q 'FINAL tree' "$b56_c"                    || b56_bad="$b56_bad final-tree"
  grep -q '5-tuples' "$b56_c"                      || b56_bad="$b56_bad settled-5tuple"
  if [ -z "$b56_bad" ]; then
    ok "B56 close procedure integrity: steps 0-${b56_max} contiguous (${b56_count} steps), ${b56_refn}/${b56_refn} internal step references resolve, 5/5 Phase-2 obligations present"
  else
    ng "B56 close procedure integrity failed:$b56_bad"
  fi
fi

# B57 — the judgment-mistakes index has to stay a ROUTER, not become a second body.
#
# The file's own section heading has said "one line each" since the origin edition, and nothing
# enforced it. Measured 2026-08-25: the median index row had gone 223 -> 544 bytes in ten days
# (the 223 figure is recorded inside case PT-10's own body, which flagged the drift and was not
# followed by any mechanism), 48 of 81 rows were over 400 bytes, and the index alone was 31.2% of
# the whole unconditional read set while being, by contract, a table of pointers.
#
# What this check enforces is the RESPONSIBILITY SPLIT, not a size:
#   index = decide whether to open the case, and find its body
#   body  = the narrative, the evidence, the defense prescription
# so the predicate is "does a row carry the body's job", not "is a row long". A hard byte cap was
# deliberately NOT adopted (user ruling N-gamma, 2026-08-25): a number chosen today would become a
# correctness gate nobody derived, which is the shape rule 04 §A gauge reports its unit warns about.
# The distribution is printed as an advisory instead, so the next drift is visible without a
# threshold pretending to be a contract.
#
# LIMITS: this reads STRUCTURE, never meaning. A row can be a body without containing the word
# "defense", and a short row can be useless for deciding whether to open a case. Green here means
# the index has not drifted back into the shapes that were measured, not that it routes well.
echo "[B57] judgment-mistakes index is a router"
b57_j="prompt/maintenance/global/rules/common/judgment-mistakes-history.md"
if [ ! -f "$b57_j" ]; then
  ng "B57: $b57_j not found — the index could not be measured (absent is not clean)"
else
  # Part 1 only, fenced blocks skipped exactly as read-load.sh's portion() does.
  b57_p1="$(awk '
    /^```/            { fence = !fence; next }
    fence             { next }
    index($0, "## Part 1") == 1 { inc = 1; next }
    inc && /^## /     { exit }
    inc               { print }
  ' "$b57_j")"
  # A markdown-escaped pipe (\|) inside a cell is content, not a column separator; awk does not know
  # that, so it is neutralised before any field parsing. Without this the one row that quotes a shell
  # pipeline reads as a malformed row — a false red on a correct index.
  b57_rows="$(printf '%s\n' "$b57_p1" | grep -E '^\| ' | grep -v '^| case ' | grep -v '^|---' \
              | sed 's/\\|/@PIPE@/g')"
  b57_n="$(printf '%s' "$b57_rows" | grep -c . )"
  b57_bad=""
  # (1) zero-denominator refusal — an empty parse prints the same thing as a perfect index.
  if [ "$b57_n" -lt 1 ]; then
    ng "B57: parsed 0 index rows out of $b57_j Part 1 — nothing was measured, which is not a pass"
  else
    # (2) shape: 4 fields, id present, summary present.
    b57_malformed="$(printf '%s\n' "$b57_rows" | awk -F'|' '
      { id=$2; sm=$5; gsub(/^[ \t]+|[ \t]+$/,"",id); gsub(/^[ \t]+|[ \t]+$/,"",sm)
        if (NF != 6 || id == "" || sm == "") print NR }' | tr '\n' ' ')"
    [ -n "$b57_malformed" ] && b57_bad="$b57_bad malformed-rows:${b57_malformed% }"
    # (3) duplicate case id — two rows claiming the same case make the router ambiguous.
    b57_ids="$(printf '%s\n' "$b57_rows" | awk -F'|' '{ id=$2; gsub(/^[ \t]+|[ \t]+$/,"",id); print id }')"
    b57_dup="$(printf '%s\n' "$b57_ids" | sort | uniq -d | tr '\n' ' ')"
    [ -n "$b57_dup" ] && b57_bad="$b57_bad duplicate-ids:${b57_dup% }"
    # (4) the body's job may not sit in the index: a defense prescription is Part 2's.
    b57_defense="$(printf '%s\n' "$b57_rows" | grep -cE 'defense *[=:]')"
    [ "$b57_defense" -gt 0 ] && b57_bad="$b57_bad rows-carrying-a-defense-clause:$b57_defense"
    # (5) reachability: every id must resolve to a Part 2 heading. An index entry whose body cannot
    #     be found is a router pointing at nothing, and it is exactly what the shortening could
    #     have produced if a row had been trimmed without its body existing first.
    b57_p2="$(awk 'f; /^## Part 2/ { f = 1 }' "$b57_j" | grep -E '^#{2,4} ')"
    b57_unreach=""; b57_checked=0
    while IFS= read -r id; do
      [ -z "$id" ] && continue
      b57_checked=$((b57_checked + 1))
      case "$id" in
        PT-*)  printf '%s\n' "$b57_p2" | grep -qE "(^|[^A-Za-z0-9-])${id}([^0-9]|$)" || b57_unreach="$b57_unreach $id" ;;
        初期1) printf '%s\n' "$b57_p2" | grep -q 'PIO cache miss'  || b57_unreach="$b57_unreach $id" ;;
        初期2) printf '%s\n' "$b57_p2" | grep -q 'smoke truncate'  || b57_unreach="$b57_unreach $id" ;;
        初期3) printf '%s\n' "$b57_p2" | grep -q 'transitive dep'  || b57_unreach="$b57_unreach $id" ;;
        1|2|3|4|5|6) printf '%s\n' "$b57_p2" | grep -q '第84回 1-6 件目' || b57_unreach="$b57_unreach $id" ;;
        *)     printf '%s\n' "$b57_p2" | grep -qE "(^|[^0-9])${id} *件目|case *${id}([^0-9]|$)" || b57_unreach="$b57_unreach $id" ;;
      esac
    done <<EOF
$b57_ids
EOF
    [ "$b57_checked" -eq "$b57_n" ] || b57_bad="$b57_bad reachability-scanned:$b57_checked/$b57_n"
    [ -n "$b57_unreach" ] && b57_bad="$b57_bad unreachable-bodies:${b57_unreach# }"
    # (6) advisory distribution — printed, never gated (ruling N-gamma).
    b57_med="$(printf '%s\n' "$b57_rows" | awk '{ print length($0) }' | sort -n | awk '{ a[NR] = $1 } END { print a[int((NR+1)/2)] }')"
    b57_max="$(printf '%s\n' "$b57_rows" | awk '{ if (length($0) > m) m = length($0) } END { print m }')"
    if [ -z "$b57_bad" ]; then
      ok "B57 judgment-mistakes index is a router: ${b57_n} rows parsed, ${b57_checked}/${b57_n} resolve to a Part 2 body, 0 duplicate ids, 0 malformed rows, 0 rows carrying a defense clause (advisory, not gated: median ${b57_med} chars / max ${b57_max})"
    else
      ng "B57 judgment-mistakes index has drifted back toward a body (${b57_n} rows scanned):$b57_bad"
    fi
  fi
fi

# B58 — a cold start must recover WITHOUT session history, executed against a tree that has none.
#
# B55 asks whether the canonical current-state file carries the responsibilities. That is necessary
# and not sufficient: it runs in a repository where the session files are sitting right there, so it
# cannot distinguish "16.md is complete" from "16.md is complete enough because the reader could also
# have opened S012". The 2026-08-25 ruling (N-alpha) removed session history from the unconditional
# set on exactly that claim, so the claim is executed here rather than asserted: a throwaway tree with
# sessions/ EMPTY must still measure completely and still answer all eight cold-start questions.
#
# The negative control matters more than the positive one. A parse that cannot fail would report a
# perfect recovery from an empty file, which is the shape of case PT-28 (a check whose 0 means
# "nothing was opened"). So the same parse is run against a 16.md with its current-position section
# deleted, and it must come back short.
echo "[B58] cold start without session history"
b58_h=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
if [ ! -f "$b58_h" ]; then
  ng "B58: $b58_h not found — the recovery claim could not be executed"
else
  b58_tmp="$(mktemp -d)"; b58_bad=""
  mkdir -p "$b58_tmp/t/scripts" "$b58_tmp/t/prompt/maintenance/global/rules/common" \
           "$b58_tmp/t/prompt/maintenance/local/handover/sessions" \
           "$b58_tmp/t/prompt/maintenance/local/bugs/active"
  cp scripts/read-load.sh "$b58_tmp/t/scripts/"
  cp CLAUDE.md "$b58_tmp/t/"
  cp prompt/maintenance/global/rules/README.md "$b58_tmp/t/prompt/maintenance/global/rules/"
  for f in 13-session-recovery.md 17-no-self-imposed-scope.md judgment-mistakes-history.md; do
    cp "prompt/maintenance/global/rules/common/$f" "$b58_tmp/t/prompt/maintenance/global/rules/common/$f"
  done
  cp "$b58_h" "$b58_tmp/t/prompt/maintenance/local/handover/"
  cp prompt/maintenance/local/bugs/active/index.md "$b58_tmp/t/prompt/maintenance/local/bugs/active/"
  # sessions/ exists and is EMPTY on purpose: the directory being there rules out "it passed because
  # nothing resolved a path", leaving only "no session file was needed".
  b58_out="$(cd "$b58_tmp/t" && bash scripts/read-load.sh 2>&1)"; b58_rc=$?
  [ "$b58_rc" -eq 0 ] || b58_bad="$b58_bad readload-rc=$b58_rc"
  printf '%s' "$b58_out" | grep -q 'inputs measured 7/7' || b58_bad="$b58_bad readload-denominator"
  # the eight facts a cold start acts on, parsed from the copy that has no history beside it
  b58_ask() {   # $1 = tree's handover, $2 = label, $3 = ERE ; sets b58_n / b58_miss
    if printf '%s' "$(tr '\n' ' ' < "$1")" | grep -qE "$3"; then b58_n=$((b58_n + 1))
    else b58_miss="$b58_miss $2"; fi
  }
  b58_eight() {   # $1 = handover file -> b58_n out of 8
    b58_n=0; b58_miss=""
    b58_ask "$1" objective  '\*\*PRIMARY_OBJECTIVE:\*\* `(UNSET|ACTIVE|ACCEPTED|BLOCKED|STOPPED) — '
    b58_ask "$1" go-stop    'GO / STOP boundary'
    b58_ask "$1" baton      '\| *# *\| *Baton *\| *Status *\| *Trigger'
    b58_ask "$1" statuses   'OPEN \(actionable once its trigger fires\) \| HOLD .* \| DEFERRED'
    b58_ask "$1" settled    '## §3\. Settled decisions'
    b58_ask "$1" supersedes '\*Supersedes\*:'
    b58_ask "$1" baseline   '\| Item \| Measured \| Command \|'
    b58_ask "$1" generation '> \*\*GEN: S[0-9]+-close\*\*'
  }
  b58_eight "$b58_tmp/t/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md"
  b58_pos="$b58_n"; b58_posmiss="$b58_miss"
  [ "$b58_pos" -eq 8 ] || b58_bad="$b58_bad recovered:${b58_pos}/8(missing${b58_posmiss})"
  # negative control — the same parse over a mutilated handover must NOT report 8/8.
  awk '/^## §1\. Current position/{skip=1} skip && /^## §2\./{skip=0} !skip' \
      "$b58_h" > "$b58_tmp/mutilated.md"
  b58_eight "$b58_tmp/mutilated.md"
  [ "$b58_n" -lt 8 ] || b58_bad="$b58_bad negative-control-still-8/8"
  b58_neg="$b58_n"
  if [ -z "$b58_bad" ]; then
    ok "B58 cold start without session history: read-load 7/7 RC=0 over a tree whose sessions/ is empty, and 8/8 cold-start facts parsed from the handover alone (negative control: ${b58_neg}/8 with §1 removed)"
    rm -rf "$b58_tmp"
  else
    ng "B58 cold start without session history failed:$b58_bad (tree kept at $b58_tmp)"
  fi
fi

# B59 — the objective-control policy has to carry its contract in ACTIVE normative text.
#
# Phase 4 added a policy whose whole job is to stop work that looks productive. A policy like that
# decays in a particular way: the prose survives and the closed sets quietly lose a member, so the
# document still reads correctly while the clause that would have fired is gone. Each predicate
# below names one obligation the policy cannot lose, and every one of them is executed against a
# mutation in scripts/mutation-harness.py (family M9) rather than asserted here.
#
# LIMITS: this reads the DOCUMENT. Whether a session obeyed the policy is runtime evidence and
# is not observable from here — see the LIMITS block of scripts/objective-scenarios.py.
echo "[B59] objective-control policy contract"
b59_r=prompt/maintenance/global/rules/common/24-objective-control.md
if [ ! -f "$b59_r" ]; then
  ng "B59: $b59_r not found — the objective-control policy has no owner"
else
  b59_bad=""; b59_n=0; b59_total=0
  b59_req() {  # $1 = label, $2 = fixed string that must be present in ACTIVE text
    b59_total=$((b59_total + 1))
    if agrep "$b59_r" "$2"; then b59_n=$((b59_n + 1)); else b59_bad="$b59_bad missing:$1"; fi
  }
  b59_reqE() { # $1 = label, $2 = ERE (used where the anchor contains markdown emphasis)
    b59_total=$((b59_total + 1))
    if agrepE "$b59_r" "$2"; then b59_n=$((b59_n + 1)); else b59_bad="$b59_bad missing:$1"; fi
  }
  # the three closed sets, each parsed as a set rather than looked for as a word
  b59_states="$(active_text "$b59_r" | awk '/^PRIMARY_OBJECTIVE states \(closed set/{f=1;next} f && /^```/{exit} f' \
                | grep -oE '^  [A-Z]+ ' | tr -d ' ' | sort)"
  b59_nstates="$(printf '%s\n' "$b59_states" | grep -c '[A-Z]')"
  [ "$b59_nstates" -eq 5 ] || b59_bad="$b59_bad state-set:${b59_nstates}/5"
  b59_outcomes="$(active_text "$b59_r" | awk '/^ATTEMPT_OUTCOME: <one of>/{f=1;next} f && /^```/{exit} f' \
                  | grep -cE '^  [a-z-]+ ')"
  [ "$b59_outcomes" -eq 7 ] || b59_bad="$b59_bad attempt-outcome-set:${b59_outcomes}/7"
  for c in BLOCKER ADJACENT_DEFECT HARDENING; do b59_reqE "class-$c" "\\| \\*\\*$c\\*\\* \\|"; done
  # the propositions that do the stopping
  b59_req human-authority   'Human authority is supreme. AI consensus is not human approval.'
  b59_req stop-duty         'is not a reason to continue'
  b59_req red-not-authority 'RED is evidence, not authorization'
  b59_req severity-clause   'Severity does not classify'
  b59_req expansion-gate    'why the current objective cannot be completed without it'
  b59_req post-acceptance   'needs an explicit human GO'
  b59_req close-not-scope   'The close protocol is not scope expansion'
  b59_req defer-is-recorded 'Deferral under this rule is never'
  # no invented cross-project constant: the soft trigger is the one this project already derived
  b59_req derived-threshold '2+ failed attempts on the same symptom'
  # the executable form, and the ownership boundary that keeps current state out of the rule
  b59_req decision-block    '```objective-decision'
  agrep "$b59_r" 'the project'"'"'s handover file' || b59_bad="$b59_bad owner-pointer"
  active_text "$b59_r" | grep -qE '\*\*PRIMARY_OBJECTIVE:\*\* `' && b59_bad="$b59_bad rule-carries-a-current-value"
  # reachability: a rule with no inbound edge in the decision tree is a rule nobody opens (B14 family)
  grep -q '24-objective-control.md' prompt/maintenance/global/rules/README.md || b59_bad="$b59_bad no-decision-tree-row"
  if [ -z "$b59_bad" ] && [ "$b59_n" -eq "$b59_total" ]; then
    ok "B59 objective-control policy contract: ${b59_n}/${b59_total} propositions in active text, closed sets 5/5 states + 3/3 classes + ${b59_outcomes}/7 attempt outcomes, decision block present, owner is the handover, reachable from the decision tree"
  else
    ng "B59 objective-control policy contract failed (${b59_n}/${b59_total} propositions):$b59_bad"
  fi
fi

# B60 — the policy's decision is EXECUTED, not read.
#
# Phase 3's ruling: a guard check is unverified until a mutation makes it red. The same standard
# applies to a policy — "the rule says to stop" is a claim about a document. scripts/objective-
# scenarios.py parses the ordered decision out of rule 24 and runs the recorded scenarios through
# it, so this check is the policy's detection power, and its two negative controls are what stop
# a harness that would report a perfect run over an empty table (case PT-28's shape).
echo "[B60] objective-control scenarios execute"
if [ ! -f scripts/objective-scenarios.py ]; then
  ng "B60: scripts/objective-scenarios.py missing — the policy's decision is unexecuted"
else
  b60_out="$(python3 scripts/objective-scenarios.py 2>&1)"; b60_rc=$?
  b60_bad=""
  [ "$b60_rc" -eq 0 ] || b60_bad="$b60_bad rc=$b60_rc"
  b60_res="$(printf '%s\n' "$b60_out" | grep '^RESULT:')"
  printf '%s' "$b60_res" | grep -q '^RESULT: ACCEPTED' || b60_bad="$b60_bad not-accepted"
  printf '%s' "$b60_res" | grep -qE 'scenarios=([1-9][0-9]*)/\1 ' || b60_bad="$b60_bad scenario-denominator"
  printf '%s' "$b60_res" | grep -qE 'rows=([1-9][0-9]*)/\1 ' || b60_bad="$b60_bad row-coverage"
  # negative control 1: with no decision rows the harness must REFUSE (2), never report success.
  python3 scripts/objective-scenarios.py --control empty-table >/dev/null 2>&1
  [ $? -eq 2 ] || b60_bad="$b60_bad empty-table-control-did-not-refuse"
  # negative control 2: deleting the acceptance row must break the scenarios that depend on it.
  python3 scripts/objective-scenarios.py --control drop-row=3 >/dev/null 2>&1
  [ $? -eq 1 ] || b60_bad="$b60_bad drop-row-control-still-passed"
  if [ -z "$b60_bad" ]; then
    ok "B60 objective-control scenarios execute: ${b60_res#RESULT: } (controls: empty-table refuses at exit 2, drop-row=3 fails at exit 1)"
  else
    ng "B60 objective-control scenarios failed:$b60_bad"
  fi
fi

# B61 — the objective state set is cross-checked in BOTH directions, and against the handover.
#
# Original form (Phase 4): parse the closed set out of rule 24, then check that the value the
# HANDOVER currently carries is a member. Measured 2026-08-25 (Phase 5): that makes detection power
# conditional on which state the handover happens to hold. Mutation M9-B61-state-renamed renames
# ACTIVE in the definition block; it was killed at the Phase 4 close because the handover said
# ACTIVE, and it SURVIVED the moment commit 7aacbcb moved the handover to ACCEPTED — reproduced on
# the untouched HEAD tree, so the check had lost the mutation without anything about it changing.
# One value can only ever vouch for one member of a closed set.
#
# The fix is the B53 shape: the rule declares the set TWICE — once as definitions, once as the
# transition table that says who may move it — and those two enumerations must agree in BOTH
# directions. A member renamed, added or dropped in either half now reports the direction it was
# seen from, whatever the handover holds. The handover-membership check stays, because it is a
# different question (is the current value legal) and it caught a different class of drift.
echo "[B61] objective state set agrees with itself and with the handover"
b61_r=prompt/maintenance/global/rules/common/24-objective-control.md
b61_h=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
if [ ! -f "$b61_r" ] || [ ! -f "$b61_h" ]; then
  ng "B61: rule 24 or the handover is missing — the objective state has no cross-check"
else
  # (1) the definitions half: the closed-set block
  b61_set="$(active_text "$b61_r" | awk '/^PRIMARY_OBJECTIVE states \(closed set/{f=1;next} f && /^```/{exit} f' \
             | grep -oE '^  [A-Z]+ ' | tr -d ' ' | sort -u)"
  b61_n="$(printf '%s\n' "$b61_set" | grep -c '[A-Z]')"
  # (2) the transitions half: column 1 of every row of the "who may move it" table
  b61_tr="$(active_text "$b61_r" | awk -F'|' '/→/ && /^\|/ {print $2}' | grep -oE '[A-Z][A-Z_]+' | sort -u)"
  b61_tn="$(printf '%s\n' "$b61_tr" | grep -c '[A-Z]')"
  b61_val="$(tr '\n' ' ' < "$b61_h" | grep -oE '\*\*PRIMARY_OBJECTIVE:\*\* `[A-Z]+' | head -1 | grep -oE '[A-Z]+$')"
  b61_bad=""
  # zero-denominator refusal: two empty parses agree perfectly (case PT-28's shape)
  [ "$b61_n" -ge 2 ] || b61_bad="$b61_bad definitions-parsed-${b61_n}-states"
  [ "$b61_tn" -ge 2 ] || b61_bad="$b61_bad transitions-parsed-${b61_tn}-states"
  # bidirectional set comparison — each direction names what it saw
  b61_only_def="$(comm -23 <(printf '%s\n' "$b61_set" | grep '[A-Z]') <(printf '%s\n' "$b61_tr" | grep '[A-Z]') | tr '\n' ',' | sed 's/,$//')"
  b61_only_tr="$(comm -13 <(printf '%s\n' "$b61_set" | grep '[A-Z]') <(printf '%s\n' "$b61_tr" | grep '[A-Z]') | tr '\n' ',' | sed 's/,$//')"
  [ -z "$b61_only_def" ] || b61_bad="$b61_bad defined-but-unreachable:$b61_only_def"
  [ -z "$b61_only_tr" ]  || b61_bad="$b61_bad in-transitions-but-undefined:$b61_only_tr"
  # the handover's current value must be a legal member — a different question, kept
  [ -n "$b61_val" ] || b61_bad="$b61_bad handover-carries-no-state"
  if [ -n "$b61_val" ] && ! printf '%s\n' "$b61_set" | grep -qx "$b61_val"; then
    b61_bad="$b61_bad handover-state-$b61_val-not-in-the-policy-set"
  fi
  # UNSET must stay legal: it is the state a session between objectives is in (2026-08-25 ruling).
  printf '%s\n' "$b61_set" | grep -qx UNSET || b61_bad="$b61_bad UNSET-dropped-from-the-set"
  if [ -z "$b61_bad" ]; then
    ok "B61 objective state set: definitions ${b61_n} = transitions ${b61_tn}, agreeing in both directions; handover carries ${b61_val}, a legal member (UNSET legal)"
  else
    ng "B61 objective state / policy disagreement:$b61_bad"
  fi
fi

# B62 — the delegation-action policy has to carry its contract in ACTIVE normative text.
#
# Phase 5 (2026-08-25). The delegation boundary already existed as prose (B33) and as a runtime
# auditor, and both halves were wrong in opposite directions because nothing executed the
# CLASSIFICATION — only the prohibition. Measured that day on identical transcripts: a status poll
# plus a Read of the handover produced verdict FAIL, while a subagent delegation with the parent
# running the worker's tests and editing the worker's file produced PASS. Each predicate below names
# one piece of the classification that cannot be lost, and family M10 in scripts/mutation-harness.py
# executes them rather than trusting this list.
#
# LIMITS: this reads the DOCUMENT. Whether a session obeyed it is runtime evidence — B39.
echo "[B62] delegation-action policy contract"
b62_r=prompt/maintenance/global/rules/common/22-model-orchestration.md
if [ ! -f "$b62_r" ]; then
  ng "B62: $b62_r not found — the delegation boundary has no owner"
else
  b62_bad=""; b62_n=0; b62_total=0
  b62_req() {
    b62_total=$((b62_total + 1))
    if agrep "$b62_r" "$2"; then b62_n=$((b62_n + 1)); else b62_bad="$b62_bad missing:$1"; fi
  }
  b62_req classification-section '^### Delegation action classification'
  b62_req decision-block         '```delegation-decision'
  b62_req verifier-section       '^### Verifier lane vs shadow execution'
  b62_req exception-grammar      '^EXCEPTION_TRIGGER:'
  b62_req return-states          '^### Worker completion and return states'
  b62_req finding-owner          '^### A finding outside the packet'
  # the discriminator itself: naming a tool call as the test is the defect Phase 5 removed
  b62_req discriminator          'never .did the parent use a tool'
  # rule 24 keeps ownership of the finding classes; this rule may not grow a second copy
  b62_req rule24-owns-classes    'Rule 24 owns the classification and this rule does not restate it'
  # the parent is not exempt from its own classification
  b62_req parent-not-exempt      'parent is not an authority to move an adjacent defect'
  # the eight verdict classes, parsed as a set out of the class table
  b62_classes=0
  for c in HARNESS_GOVERNANCE BOUNDED_REVIEW INDEPENDENT_VERIFICATION EXCEPTION_REPRODUCTION \
           OUT_OF_DELEGATED_SCOPE ALLOWED_CLOSE_WORK RETURN_BLOCKER SHADOW_EXECUTION; do
    if active_text "$b62_r" | grep -q "\`$c\`"; then b62_classes=$((b62_classes + 1)); fi
  done
  [ "$b62_classes" -eq 8 ] || b62_bad="$b62_bad verdict-classes:${b62_classes}/8"
  # the decision rows and invariant keys, counted inside the fenced block only
  b62_block="$(active_text "$b62_r" | awk '/^```delegation-decision$/{f=1;next} f && /^```/{exit} f')"
  b62_rows="$(printf '%s\n' "$b62_block" | grep -cE '^[0-9]+ \|')"
  b62_inv="$(printf '%s\n' "$b62_block" | grep -c '^INVARIANT_KEY |')"
  [ "$b62_rows" -ge 5 ] || b62_bad="$b62_bad decision-rows:${b62_rows}"
  [ "$b62_inv" -eq 4 ] || b62_bad="$b62_bad invariant-keys:${b62_inv}/4"
  # the default row must be the prohibition: a fail-open default hands out permission for every
  # case nobody thought of, which is the shape of the false negative this phase measured.
  printf '%s\n' "$b62_block" | grep -qE '^[0-9]+ \| \* +\| SHADOW_EXECUTION' \
    || b62_bad="$b62_bad default-row-not-shadow"
  # the four invariants by name — each is a rationalization already met in this rule's history
  for k in parent_used_a_tool worker_is_waiting action_is_cheap substitutes_worker_output; do
    printf '%s\n' "$b62_block" | grep -q "^INVARIANT_KEY | $k" || b62_bad="$b62_bad invariant:$k"
  done
  # reachability: the decision tree has to send a reader here, not only to the older sections
  grep -q 'Delegation action classification' prompt/maintenance/global/rules/README.md \
    || b62_bad="$b62_bad no-decision-tree-row"
  if [ -z "$b62_bad" ] && [ "$b62_n" -eq "$b62_total" ]; then
    ok "B62 delegation-action policy contract: ${b62_n}/${b62_total} propositions in active text, ${b62_classes}/8 verdict classes, ${b62_rows} decision rows with a fail-closed default, ${b62_inv}/4 invariant keys, reachable from the decision tree"
  else
    ng "B62 delegation-action policy contract failed (${b62_n}/${b62_total} propositions):$b62_bad"
  fi
fi

# B63 — the delegation classification is EXECUTED, not read.
#
# Same standard as B60 applies it to rule 24: "the rule says the parent may poll status" is a claim
# about a document. scripts/delegation-scenarios.py parses the ordered decision out of rule 22 and
# runs the recorded scenarios through it, and it refuses at a zero denominator or when either
# direction of control is missing — a table with only violations proves only that it can say no.
echo "[B63] delegation-action scenarios execute"
if [ ! -f scripts/delegation-scenarios.py ]; then
  ng "B63: scripts/delegation-scenarios.py missing — the delegation classification is unexecuted"
else
  b63_out="$(python3 scripts/delegation-scenarios.py 2>&1)"; b63_rc=$?
  b63_bad=""
  [ "$b63_rc" -eq 0 ] || b63_bad="$b63_bad rc=$b63_rc"
  b63_res="$(printf '%s\n' "$b63_out" | grep '^RESULT:')"
  printf '%s' "$b63_res" | grep -q '^RESULT: ACCEPTED' || b63_bad="$b63_bad not-accepted"
  printf '%s' "$b63_res" | grep -qE 'scenarios=([1-9][0-9]*)/\1 ' || b63_bad="$b63_bad scenario-denominator"
  printf '%s' "$b63_res" | grep -qE 'rows=([1-9][0-9]*)/\1 ' || b63_bad="$b63_bad row-coverage"
  # both directions of control must be non-empty, with printed denominators
  printf '%s' "$b63_res" | grep -qE 'must-flag=[1-9]' || b63_bad="$b63_bad no-false-negative-control"
  printf '%s' "$b63_res" | grep -qE 'must-not-flag=[1-9]' || b63_bad="$b63_bad no-false-positive-control"
  # negative control 1: with no decision rows the harness must REFUSE (2), never report success.
  python3 scripts/delegation-scenarios.py --control empty-table >/dev/null 2>&1
  [ $? -eq 2 ] || b63_bad="$b63_bad empty-table-control-did-not-refuse"
  # negative control 2: deleting the governance row must redden the scenarios that depend on it —
  # that row is the whole false-positive fix, so it may never be decoration.
  python3 scripts/delegation-scenarios.py --control drop-row=5 >/dev/null 2>&1
  [ $? -eq 1 ] || b63_bad="$b63_bad drop-row-control-still-passed"
  if [ -z "$b63_bad" ]; then
    ok "B63 delegation-action scenarios execute: ${b63_res#RESULT: } (controls: empty-table refuses at exit 2, drop-row=5 fails at exit 1)"
  else
    ng "B63 delegation-action scenarios failed:$b63_bad"
  fi
fi

# B64 — the routing policy contract (Phase 6, 2026-08-25).
#
# Before this, `effort` had no owner in the common layer: three scattered mentions, no baseline, no
# authority, no evidence duty — and rule 02 carried a consumer's effort value as a standing
# instruction to self-upgrade at every audit checkpoint. The role->model mapping meanwhile lived in
# two files at once. Each predicate below names one piece of the routing decision that cannot be
# lost; family M11 in scripts/mutation-harness.py executes them rather than trusting this list.
#
# LIMITS: this reads the DOCUMENT. Whether a session routed this way is not observed by any
# instrument in this repository — stated in rule 22 §Routing decision §LIMITS, not hidden.
echo "[B64] routing policy contract"
b64_r=prompt/maintenance/global/rules/common/22-model-orchestration.md
if [ ! -f "$b64_r" ]; then
  ng "B64: $b64_r not found — routing has no policy owner"
else
  b64_bad=""; b64_n=0; b64_total=0
  b64_req() {
    b64_total=$((b64_total + 1))
    if agrep "$b64_r" "$2"; then b64_n=$((b64_n + 1)); else b64_bad="$b64_bad missing:$1"; fi
  }
  b64_req routing-section     '^### Routing decision'
  b64_req decision-block      '```routing-decision'
  b64_req profile-is-owner    'the profile owns .*every value'
  b64_req fail-closed-profile 'no routing constraints'
  b64_req no-new-role         'It introduces no new role'
  b64_req both-directions     'Below baseline\*\* is equally forbidden'
  b64_req human-only          '#### Human-only routing'
  b64_req capability-vs-policy '#### Transport capability is not policy compliance'
  b64_req harness-independence '#### The harness.s own effort is not routed'
  b64_req packet-fields       'ROUTE_AUTHORITY_REF'
  b64_req limits              '#### LIMITS'
  # the eleven verdicts, parsed as a set out of the decision block
  b64_block="$(active_text "$b64_r" | awk '/^```routing-decision$/{f=1;next} f && /^```/{exit} f')"
  b64_verdicts=0
  for v in HUMAN_OWNED_ROUTE REJECT_UNKNOWN_TARGET REJECT_NOT_DISPATCHABLE REJECT_EXPERIMENTAL_DEFAULT \
           HUMAN_GO_REQUIRED REJECT_UNSUPPORTED_EFFORT REJECT_FIXED_ROUTE_DEVIATION \
           REJECT_UNAUTHORIZED_DOWNGRADE REJECT_ESCALATION_REASON_INVALID \
           REJECT_ESCALATION_WITHOUT_EVIDENCE DISPATCH_ALLOWED REJECT_UNROUTED; do
    printf '%s\n' "$b64_block" | grep -q "$v" && b64_verdicts=$((b64_verdicts + 1))
  done
  [ "$b64_verdicts" -eq 12 ] || b64_bad="$b64_bad verdicts:${b64_verdicts}/12"
  b64_rows="$(printf '%s\n' "$b64_block" | grep -cE '^ *[0-9]+ \|')"
  b64_inv="$(printf '%s\n' "$b64_block" | grep -c '^INVARIANT_KEY |')"
  b64_vocab="$(printf '%s\n' "$b64_block" | grep -cE '^[A-Z_]+_VOCABULARY +\|')"
  [ "$b64_rows" -ge 10 ] || b64_bad="$b64_bad decision-rows:${b64_rows}"
  [ "$b64_inv" -eq 8 ] || b64_bad="$b64_bad invariant-keys:${b64_inv}/8"
  [ "$b64_vocab" -eq 5 ] || b64_bad="$b64_bad vocabularies:${b64_vocab}/5"
  # fail-closed default: a routing table that fails OPEN dispatches at whatever the environment
  # happened to be set to, for every case nobody thought of.
  printf '%s\n' "$b64_block" | grep -qE '^ *[0-9]+ \| \* +\| REJECT_UNROUTED' \
    || b64_bad="$b64_bad default-row-not-reject"
  # the eight invariants by name — each is a rationalization this rule has already met
  for k in task_is_short quota_available expensive_target_available cheaper_target_available \
           worker_is_slow ai_prefers_it transport_accepted worker_effort_escalated; do
    printf '%s\n' "$b64_block" | grep -q "^INVARIANT_KEY | $k" || b64_bad="$b64_bad invariant:$k"
  done
  # NEUTRALITY: the rule may declare role/lane/status/authority/reason vocabularies, and may NOT
  # declare an effort vocabulary. Effort values are the consumer's; fixing a set here would make a
  # constant nobody derived into a correctness gate (PT-10's shape).
  printf '%s\n' "$b64_block" | grep -q 'EFFORT_VOCABULARY' && b64_bad="$b64_bad effort-values-fixed-in-rule"
  # LANE_VOCABULARY must equal the lane set in §Lane definitions, in BOTH directions — a vocabulary
  # that silently drifts from the table it claims to mirror is worse than no vocabulary (B61 shape).
  b64_lv="$(printf '%s\n' "$b64_block" | sed -n 's/^LANE_VOCABULARY *|//p' | tr '|' '\n' | tr -d ' ' | grep -v '^$' | sort)"
  b64_lt="$(active_text "$b64_r" | awk '/^### Lane definitions/{f=1;next} f && /^### /{exit} f' \
            | sed -n 's/^| `\([A-Z_]*\)`.*/\1/p' | sort -u)"
  [ -n "$b64_lv" ] && [ -n "$b64_lt" ] && [ "$b64_lv" = "$b64_lt" ] \
    || b64_bad="$b64_bad lane-vocabulary-diverged-from-lane-table"
  # reachability: a mechanism nothing routes a reader to fires only for whoever edits it
  grep -q 'Routing decision' prompt/maintenance/global/rules/README.md \
    || b64_bad="$b64_bad no-decision-tree-row"
  # the grammar template has to exist, or the profile has no contract to be measured against
  [ -f prompt/maintenance/global/templates/routing-profile-template.md ] \
    || b64_bad="$b64_bad no-profile-grammar-template"
  if [ -z "$b64_bad" ] && [ "$b64_n" -eq "$b64_total" ]; then
    ok "B64 routing policy contract: ${b64_n}/${b64_total} propositions in active text, ${b64_verdicts}/12 verdicts, ${b64_rows} decision rows with a fail-closed default, ${b64_inv}/8 invariant keys, ${b64_vocab}/5 vocabularies, lane vocabulary == lane table both ways, no effort values fixed, reachable from the decision tree"
  else
    ng "B64 routing policy contract failed (${b64_n}/${b64_total} propositions):$b64_bad"
  fi
fi

# B65 — the routing decision is EXECUTED, not read.
#
# Same standard as B60/B63. scripts/routing-scenarios.py parses the ordered decision out of rule 22,
# RESOLVES every target/effort fact from the profile rather than letting the scenario assert it, and
# refuses at a zero denominator or when either direction of control is missing.
echo "[B65] routing scenarios execute"
if [ ! -f scripts/routing-scenarios.py ]; then
  ng "B65: scripts/routing-scenarios.py missing — the routing decision is unexecuted"
else
  b65_out="$(python3 scripts/routing-scenarios.py 2>&1)"; b65_rc=$?
  b65_bad=""
  [ "$b65_rc" -eq 0 ] || b65_bad="$b65_bad rc=$b65_rc"
  b65_res="$(printf '%s\n' "$b65_out" | grep '^RESULT:')"
  printf '%s' "$b65_res" | grep -q '^RESULT: ACCEPTED' || b65_bad="$b65_bad not-accepted"
  printf '%s' "$b65_res" | grep -qE 'scenarios=([1-9][0-9]*)/\1 ' || b65_bad="$b65_bad scenario-denominator"
  printf '%s' "$b65_res" | grep -qE 'rows=([1-9][0-9]*)/\1 ' || b65_bad="$b65_bad row-coverage"
  printf '%s' "$b65_res" | grep -qE 'dispatch=[1-9]' || b65_bad="$b65_bad no-false-positive-control"
  printf '%s' "$b65_res" | grep -qE 'refuse=[1-9]'   || b65_bad="$b65_bad no-false-negative-control"
  printf '%s' "$b65_res" | grep -qE 'human=[1-9]'    || b65_bad="$b65_bad authority-half-unmeasured"
  # control 1: no decision rows must REFUSE (2), never report success.
  python3 scripts/routing-scenarios.py --control empty-table >/dev/null 2>&1
  [ $? -eq 2 ] || b65_bad="$b65_bad empty-table-control-did-not-refuse"
  # control 2: an absent profile must REFUSE — routing may never degrade to "no constraints".
  python3 scripts/routing-scenarios.py --control no-profile >/dev/null 2>&1
  [ $? -eq 2 ] || b65_bad="$b65_bad absent-profile-did-not-fail-closed"
  # control 3: deleting the Human-only row must redden — it is the whole authority half.
  python3 scripts/routing-scenarios.py --control drop-row=6 >/dev/null 2>&1
  [ $? -eq 1 ] || b65_bad="$b65_bad drop-row-control-still-passed"
  # the project's own profile must at least parse against the rule's vocabularies
  python3 scripts/routing-scenarios.py --validate-profile prompt/maintenance/local/docs/routing-profile.md >/dev/null 2>&1
  [ $? -eq 0 ] || b65_bad="$b65_bad project-profile-does-not-validate"
  if [ -z "$b65_bad" ]; then
    ok "B65 routing scenarios execute: ${b65_res#RESULT: } (controls: empty-table and absent-profile each refuse at exit 2, drop-row=6 fails at exit 1; project profile validates)"
  else
    ng "B65 routing scenarios failed:$b65_bad"
  fi
fi

# B66 — the routing mapping has exactly ONE owner, and the packet records the decision.
#
# Measured 2026-08-25 (Phase 6 inventory): the role->model mapping existed in CLAUDE.md §7 AND in
# rule 22 §Environment prerequisites, so a roster change had two places to be wrong in and both kept
# reading as authoritative (ruling N-6). B20 already keeps model names out of common SPEC; this
# check is the other half — that no common-layer file carries the mapping at all, and that the
# packet carries the per-dispatch decision instead of a global default being rewritten.
echo "[B66] routing mapping single owner + packet routing fields"
b66_bad=""; b66_scanned=0
b66_pkt=prompt/maintenance/global/templates/delegation-packet-template.md
for f in ROUTE_TARGET ROUTE_EFFORT EFFORT_REASON EFFORT_EVIDENCE ROUTE_AUTHORITY_REF; do
  agrep "$b66_pkt" "^$f:" || b66_bad="$b66_bad packet-field:$f"
done
agrep "$b66_pkt" 'written \*\*even at baseline\*\*' || b66_bad="$b66_bad baseline-explicit-rule"
agrep "$b66_pkt" 'never a model name written here' || b66_bad="$b66_bad packet-carries-no-model-name"
# no common-layer file may carry a model->role mapping. The value owner is the local profile.
for f in CLAUDE.md prompt/maintenance/global/rules/common/22-model-orchestration.md \
         prompt/maintenance/global/templates/delegation-packet-template.md \
         prompt/maintenance/global/templates/routing-profile-template.md \
         prompt/maintenance/global/templates/AGENTS-template.md; do
  [ -f "$f" ] || { b66_bad="$b66_bad absent:$f"; continue; }
  b66_scanned=$((b66_scanned + 1))
  hits="$(active_text "$f" | grep -nE 'claude-(opus|fable|sonnet|haiku)-[0-9]|effort (max|xhigh|high|medium|low)\b' \
          | grep -viE 'origin|measured|case [0-9]|example|e\.g\.' || true)"
  [ -z "$hits" ] || b66_bad="$b66_bad mapping-value-in:$f"
done
# and the single owner has to be named, and to exist
agrep CLAUDE.md 'routing-profile.md' || b66_bad="$b66_bad claude-md-does-not-point-at-owner"
agrep prompt/maintenance/global/rules/common/22-model-orchestration.md 'this rule carries no mapping' \
  || b66_bad="$b66_bad rule22-does-not-disclaim-the-mapping"
[ -f prompt/maintenance/local/docs/routing-profile.md ] || b66_bad="$b66_bad no-project-profile"
if [ -z "$b66_bad" ]; then
  ok "B66 routing mapping single owner (${b66_scanned}/5 common-layer files carry no mapping value; CLAUDE.md and rule 22 both point at local/docs/routing-profile.md) + 5/5 packet routing fields"
else
  ng "B66 routing ownership/packet contract failed:$b66_bad"
fi

# --------------------------------------------------------------------------------------
# B67 — rule 15's placement contract, executed. Until Phase 7 it was written in three
# places (CLAUDE.md §0, rule 15 §Forbidden locations, local/README.md) and enforced in
# none: a file created directly under local/ passed all 74 checks green, and what caught
# it was /close step 6's index reconciliation — a human-ordered step, not a gate
# (16.md §2 baton #35). The scan derives its allow-set from the rule's own §Layer
# definitions block, so this check cannot pass while the guard and the contract disagree.
# Both denominators are printed, and the must-not-flag control carries content — the
# nearest PERMITTED shape to the violation, not an empty tree (rule 04 §absence, PT-34).
echo "[B67] rule 15 placement contract is executable"
b67_bad=""
b67_scan=scripts/placement-scan.sh
b67_rule=prompt/maintenance/global/rules/common/15-docs-organization.md
if [ ! -x "$b67_scan" ] && [ ! -f "$b67_scan" ]; then
  ng "B67: $b67_scan absent — rule 15 has a contract and no executable companion"
elif ! agrep "$b67_rule" 'This section is executable'; then
  ng "B67: $b67_rule no longer claims an executable companion (rule and guard must not disagree silently)"
elif ! agrep "$b67_rule" 'Forbidden locations'; then
  ng "B67: rule 15 §Forbidden locations is not active text — the contract this check enforces is gone or demoted"
else
  # ① the live repository must be clean, and must have actually scanned something
  b67_out="$(bash "$b67_scan" 2>&1)"; b67_rc=$?
  b67_cat="$(printf '%s' "$b67_out" | sed -n 's/.*CATEGORIES=\([0-9]*\).*/\1/p' | head -1)"
  b67_scanned="$(printf '%s' "$b67_out" | sed -n 's/.*SCANNED=\([0-9]*\).*/\1/p' | head -1)"
  [ "$b67_rc" -eq 0 ] || b67_bad="$b67_bad live-tree-rc=$b67_rc"
  [ "${b67_cat:-0}" -ge 2 ] || b67_bad="$b67_bad categories-parsed=${b67_cat:-0}"
  [ "${b67_scanned:-0}" -ge 1 ] || b67_bad="$b67_bad scanned-nothing"
  # controls, on a synthetic tree — the fixture carries the permitted shape as well as
  # the forbidden one, so must-flag and must-not-flag each have a denominator
  b67_d="$(mktemp -d)"
  mkdir -p "$b67_d/prompt/maintenance/global" \
           "$b67_d/prompt/maintenance/local/investigations" \
           "$b67_d/$(dirname "$b67_rule")"
  cp "$b67_rule" "$b67_d/$b67_rule"
  cp CLAUDE.md "$b67_d/CLAUDE.md" 2>/dev/null
  cp prompt/maintenance/local/README.md "$b67_d/prompt/maintenance/local/README.md" 2>/dev/null
  b67_run() { ( cd "$b67_d" && bash "$OLDPWD/$b67_scan" >/dev/null 2>&1 ); }
  b67_mustnot=0; b67_mustflag=0
  # must-not-flag 1/2: the legal tree
  b67_run; [ $? -eq 0 ] && b67_mustnot=$((b67_mustnot+1)) || b67_bad="$b67_bad ctl-legal-tree-flagged"
  # must-not-flag 2/2: a legally placed NEW file — the permitted shape nearest the violation
  echo x > "$b67_d/prompt/maintenance/local/investigations/2026-01-01_control.md"
  b67_run; [ $? -eq 0 ] && b67_mustnot=$((b67_mustnot+1)) || b67_bad="$b67_bad ctl-legal-new-file-flagged"
  # must-flag 1/3: a file directly under a layer root
  echo x > "$b67_d/prompt/maintenance/local/OOPS.md"
  b67_run; [ $? -eq 1 ] && b67_mustflag=$((b67_mustflag+1)) || b67_bad="$b67_bad ctl-layer-root-file-passed"
  rm -f "$b67_d/prompt/maintenance/local/OOPS.md"
  # must-flag 2/3: an undeclared top-level category
  mkdir -p "$b67_d/prompt/maintenance/local/newcat"; echo x > "$b67_d/prompt/maintenance/local/newcat/x.md"
  b67_run; [ $? -eq 1 ] && b67_mustflag=$((b67_mustflag+1)) || b67_bad="$b67_bad ctl-undeclared-category-passed"
  rm -rf "$b67_d/prompt/maintenance/local/newcat"
  # must-flag 3/3: the navigational exception is not a blanket pass for any README
  : > "$b67_d/CLAUDE.md"
  b67_run; [ $? -eq 1 ] && b67_mustflag=$((b67_mustflag+1)) || b67_bad="$b67_bad ctl-uncited-readme-passed"
  cp CLAUDE.md "$b67_d/CLAUDE.md" 2>/dev/null
  # instrument error: the premise (a parseable contract) is absent -> refuse, never scan empty
  sed 's/^### Layer definitions/### Removed/' "$b67_rule" > "$b67_d/$b67_rule"
  b67_run; [ $? -eq 2 ] || b67_bad="$b67_bad ctl-unparseable-contract-did-not-refuse"
  rm -rf "$b67_d"
  if [ -z "$b67_bad" ]; then
    ok "B67 rule 15 placement contract executable: live tree clean (categories=${b67_cat} derived from the rule, scanned=${b67_scanned}, violations=0); controls must-flag ${b67_mustflag}/3 must-not-flag ${b67_mustnot}/2, and an unparseable contract refuses at exit 2"
  else
    ng "B67 placement contract failed:$b67_bad"
  fi
fi

echo
echo "RESULT: ${pass} passed / ${fail} failed"
[ "$fail" -eq 0 ]
