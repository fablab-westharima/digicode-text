#!/bin/bash
# Prints "<total> <budget> tokens" on line 1, then the cold start's read plan.
#
# ── UNIT ────────────────────────────────────────────────────────────────────────────────────────
# Tokens, estimated. Until 2026-08-15 (S004) this script counted LINES, and every consumer quoted
# that number as "読み込み負荷" / "残り N" — a proxy reported as the quantity it stands for (case
# PT-10). Measured on this corpus at the moment the unit was questioned:
#
#   per-line token cost ranges 23.6 (CLAUDE.md) … 78.4 (judgment-mistakes Part 1) = 3.32x spread,
#   so the line count mis-priced the mandatory set by that factor. The case index is 6.7% of the
#   lines and 25.1% of the real cost — the most expensive item in the set looked like the cheapest.
#   Lines are also blind to the largest single lever available: translating the case index changes
#   the line count by 0 and the token count by about -28%.
#
# Bytes would be a 1.14x proxy and cost one character to adopt. An estimate is 1.0x and costs six
# lines of arithmetic, so the estimate wins. Lines and bytes are still printed — as display columns,
# never as the gate.
#
# ── ESTIMATOR ───────────────────────────────────────────────────────────────────────────────────
#   tokens = ascii_chars / 2.862 + nonascii_units / 0.788
#   nonascii_units = (bytes - chars) / 2, i.e. one unit per 3-byte UTF-8 character. This is a WEIGHT,
#   not a character count (a 4-byte emoji contributes 1.5) — defined exactly as the calibration
#   defined it, because a fit is only valid under the definition it was fitted with.
#
#   Calibrated 2026-08-15 against this harness's own session transcript. Claude Code records
#   usage.cache_creation_input_tokens per assistant turn, which is exactly the context growth since
#   the previous turn; subtracting that turn's output_tokens leaves the tool-result payload, whose
#   bytes are known. Two payloads fitted the two constants (one near-pure-ASCII, one 31% nonascii)
#   and a THIRD was held out: predicted 13,268 tokens, actual 13,264 — -0.03%.
#
#   MODEL-SPECIFIC, and that is the estimator's own gap: the constants were fitted on Opus 5. Fable 5
#   and GPT-5.6 will differ, and the error is not symmetric — a denser tokenizer makes this script
#   report *less* than the reader pays. Recalibrate when the roster changes (rule 22): read
#   ~/.claude/projects/<sanitized-cwd>/<session>.jsonl, take one turn's cache_creation_input_tokens,
#   subtract the previous turn's output_tokens, and solve against a payload whose bytes you know.
#
# ── THREE CLASSES, KEPT APART ───────────────────────────────────────────────────────────────────
# This script can report three different kinds of bad news, and fusing them is how a harness comes to
# treat "the set is large" and "the set was not measured" as the same event:
#
#   1. INPUT COMPLETENESS / INSTRUMENT VALIDITY — a mandatory input was missing, unreadable or
#      measured empty. Exit 3, nothing on stdout. A partial measurement is not a smaller number, it
#      is no number (see ── FAIL-CLOSED below).
#   2. PREMISE (correctness) — the count assumes Core-only reading and CLAUDE.md §0 does not say so.
#      Exit 2 (see ── PREMISE CHECK at the foot of this file).
#   3. SIZE / CALIBRATION — reported as BUDGET_STATUS. **This one never fails anything.**
#
# Why 3 is not a gate (user ruling 2026-08-24, Phase 1 N-2). While size sat in the same class as
# correctness, the cheapest way to clear a red gate was to delete handover content — and the content
# a handover sheds first is exactly what the next cold start cannot reconstruct. A number that can
# only be made green by forgetting something is not protecting the resource it names. Size is now a
# signal about STRUCTURE (duplication, a fact filed under the wrong owner, a set that has outgrown
# its shape), never an instruction to read less. Deleting current truth to move this status is
# forbidden; so is compressing a mandatory incident to fit.
#
# ── THE TWO SIGNAL POINTS ───────────────────────────────────────────────────────────────────────
# Both derive from ONE equation — this project's own, measured 2026-08-15 and re-derived 2026-08-24.
# No number here is imported from another project: a consumer's thresholds encode a consumer's
# context window and a consumer's roster, and copying them would rebuild this same problem under a
# different constant.
#
#   200,000   smallest context window the model roster must survive (rule 22)
#   - 31,200  Claude Code's own system prompt + tool schemas — not controllable from here
#   -    579  MEMORY.md (auto-memory index) — controllable, but not this harness's file
#   ────────
#    168,221  actually available to this repository inside the smallest window.
#
#   READ_ALLOWANCE  48,000  = 168,221 - 120,000 reserved for the session's real work (60% of the
#                             window — roughly one implementation cycle; the S004 cold start alone
#                             reached 94k of context by the time its report was written). Crossing it
#                             means the set no longer fits the space reserved for it. WARNING.
#   READ_REVIEW     68,000  = 168,221 - 100,000, i.e. the point at which reading alone consumes half
#                             the smallest window before any work begins. Crossing it means the
#                             SHAPE is wrong, not the wording. REVIEW_REQUIRED.
#
# 48,000 is the same number this file has always carried and the same derivation; what changed is its
# class — it was a FAIL, it is now the first signal point. BUDGET_STATUS_BASIS records that these are
# adopted provisionally with a review date, so that a threshold cannot quietly become folklore: the
# calibration state is a field, not a memory.
#
# Raising either point is a user decision, not a drafting convenience. If the set legitimately needs
# more room, say so and re-derive — do not delete incidents to fit (README §Writing for the reader,
# principle 5).
#
# ── FAIL-CLOSED ─────────────────────────────────────────────────────────────────────────────────
# Every roster entry is required. Until 2026-08-24 a missing one was skipped with `[ -f "$f" ] ||
# continue`, so the total fell and the exit code stayed 0 — the instrument failed TOWARD GREEN, and
# the greenest possible reading was a checkout with no mandatory files in it at all. A zero is
# evidence only after every required input was readable and produced a non-empty measurement; the
# denominator (MEASURED/EXPECTED) now travels with the number so a consumer can see what was counted.
#
# Convention: a file may declare "## Core (mandatory read)" (or "## Part 1") as its FIRST "## "
# section; only the file start through the end of that section counts. Bodies stay full length —
# incidents are never deleted, they move behind a trigger match.
#
# Single source of truth: selftest.sh (B4) and baseline.sh (handover §5) both call this, which is
# also what keeps them from calling each other (they did once — mutual recursion, 2 min hang).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"

READ_ALLOWANCE=48000     # tokens — first signal point (derivation above). NOT a gate.
READ_REVIEW=68000        # tokens — structural review point (derivation above). NOT a gate.
BUDGET_STATUS_BASIS=ADOPTED_PROVISIONAL   # review 2026-09-30 — see ── THE TWO SIGNAL POINTS
READ_BUDGET=$READ_ALLOWANCE               # line 1 field 2, kept for the existing 3-field contract

R=prompt/maintenance/global/rules
L=prompt/maintenance/local

# The mandatory portion of a file, on stdout. Fenced blocks are skipped when looking for the section
# end: a "## " inside a fence is sample text (without that, judgment-mistakes Part 1 measured 66
# lines instead of 151). index() rather than a regex, because awk expands escapes in -v assignments,
# so '\(' would arrive as a capture group and the marker would silently stop matching — the file then
# counts full length with no error shown.
portion() {
  local f="$1" m=''
  [ -f "$f" ] || return 0
  if   grep -q '^## Core (mandatory read)' "$f"; then m='## Core (mandatory read)'
  elif grep -q '^## Part 1' "$f";                then m='## Part 1'
  else cat "$f"; return 0; fi
  awk -v m="$m" '
    /^```/            { fence = !fence; print; next }
    fence             { print; next }
    index($0, m) == 1 { inc = 1; print; next }
    inc && /^## /     { exit }
                      { print }
  ' "$f"
}

has_marker() { grep -qE '^## (Core \(mandatory read\)|Part 1)' "$1" 2>/dev/null; }

# Byte and character counts are taken locale-independently: LC_ALL=C for bytes, and the character
# count is derived by subtracting UTF-8 continuation bytes (0x80-0xBF). `wc -m` would need a UTF-8
# locale to be present, which is exactly the kind of unstated premise this file exists to not repeat.
# ── WHY NO SESSION FILE IS IN THE ROSTER ────────────────────────────────────────────────────────
# It was in it, from 2026-08-24 to 2026-08-25, and both moves were correct at the time.
#
# Before 2026-08-24 the handover told the cold start to read the newest session file and this roster
# did not contain it: the reported number was the load of everything EXCEPT the item that grew at
# every close. That is an unmeasured obligation, and it was fixed by adding the file here.
#
# On 2026-08-25 the OBLIGATION itself was withdrawn (user ruling N-α, re-deciding N-1): session files
# are historical evidence, read on a named trigger, never unconditionally. So the entry leaves this
# roster because it left the contract — not to make the total smaller. Measured before the ruling:
# 13/13 session files span 341..10,294 tok, so the unconditional set's size was set by how long the
# previous author wrote and by nothing else; and every one of the eight current-state facts a cold
# start acts on was restored from 16.md alone.
#
# The invariant across both moves is the one selftest B53 enforces IN BOTH DIRECTIONS: what
# CLAUDE.md §0 calls mandatory and what this script measures are the same set. Putting a session
# file back here without restoring the obligation is red, and so is the reverse.
ROSTER=(
  "CLAUDE.md|outside the hook; auto-loaded into context every session"
  "$R/README.md|§Core only"
  "$R/common/13-session-recovery.md|"
  "$R/common/17-no-self-imposed-scope.md|§Core only"
  "$R/common/judgment-mistakes-history.md|§Part 1 only"
  "$L/handover/16_次セッション引き継ぎ指示書.md|injected by the SessionStart hook"
  "$L/bugs/active/index.md|injected by the SessionStart hook"
)

plan=''
total=0
EXPECTED=${#ROSTER[@]}
MEASURED=0
missing=''
for entry in "${ROSTER[@]}"; do
  f="${entry%%|*}"; note="${entry#*|}"
  # An entry whose path is empty or whitespace is a malformed roster, not an absent file. Both are
  # unmeasured; both must be visible in the denominator rather than reducing the total in silence.
  if [ -z "$(printf '%s' "$f" | tr -d '[:space:]')" ]; then
    missing="$missing
  - <blank roster entry>"
    continue
  fi
  if [ ! -f "$f" ]; then
    missing="$missing
  - $f (not found)"
    continue
  fi
  lines=$(portion "$f" | wc -l | tr -d ' ')
  bytes=$(portion "$f" | LC_ALL=C wc -c | tr -d ' ')
  cont=$(portion "$f" | LC_ALL=C tr -dc '\200-\277' | LC_ALL=C wc -c | tr -d ' ')
  chars=$((bytes - cont)); na=$((cont / 2)); ascii=$((chars - na))
  tok=$(awk -v a="$ascii" -v n="$na" 'BEGIN{ printf "%d", int(a/2.862 + n/0.788 + 0.5) }')
  # Present-but-empty is not a measurement. A mandatory file that yields nothing is a defect in the
  # set, and counting it as 0 would make that defect look like thrift.
  if [ "${bytes:-0}" -le 0 ] || [ "${tok:-0}" -le 0 ]; then
    missing="$missing
  - $f (measured empty)"
    continue
  fi
  MEASURED=$((MEASURED + 1))
  total=$((total + tok))

  # The range, emitted so that reading only the mandatory part is ONE call. Measured 2026-08-15:
  # this session paid 290 lines for README's 85-line §Core (+7,730 tokens, +23.6% over the whole
  # set) because nothing told it where §Core ended and Read has no section mode. Self-locating the
  # boundary does not work either — `grep -n '^## '` reports line 67 for Part 1, which is a heading
  # inside a fenced example; the real end is 151. Printing it makes the correct read the cheap one.
  if has_marker "$f"; then how="Read limit:$lines"; else how="full"; fi
  [ -n "$note" ] && how="$how ($note)"
  plan="$plan$(printf '| `%s` | %s | %s | %s |' "$f" "$how" "$lines" "$tok")
"
done

# Nothing has reached stdout yet, and nothing will if the set was not fully measured. stdout's line 1
# is a machine contract (selftest B4, baseline.sh §5) — a partial run must not be able to satisfy it.
if [ "$MEASURED" -ne "$EXPECTED" ]; then
  printf 'INSTRUMENT_ERROR: measured %s/%s mandatory inputs%s\n' "$MEASURED" "$EXPECTED" "$missing" >&2
  exit 3
fi

if   [ "$total" -ge "$READ_REVIEW" ];    then BUDGET_STATUS=REVIEW_REQUIRED
elif [ "$total" -ge "$READ_ALLOWANCE" ]; then BUDGET_STATUS=WARNING
else                                          BUDGET_STATUS=OK
fi

echo "$total $READ_BUDGET tokens"
echo
printf 'Unconditional read %s tok / allowance %s tok (%s%%); inputs measured %s/%s. **Unit is tokens (estimated) — not lines.**\n' \
  "$total" "$READ_ALLOWANCE" "$(awk -v t="$total" -v b="$READ_ALLOWANCE" 'BEGIN{printf "%d", t*100/b}')" \
  "$MEASURED" "$EXPECTED"
printf 'BUDGET_STATUS: %s (OK < %s <= WARNING < %s <= REVIEW_REQUIRED) basis=%s review=2026-09-30\n' \
  "$BUDGET_STATUS" "$READ_ALLOWANCE" "$READ_REVIEW" "$BUDGET_STATUS_BASIS"
echo 'BUDGET_STATUS is a signal about STRUCTURE, never an instruction to read less: it may not be moved by deleting current truth, a mandatory incident, a prohibition or a user ruling. Size fails no gate here — only a missing input (exit 3) or a broken premise (exit 2) does.'
echo 'Estimator calibrated on Opus 5 (hold-out error 0.03%). The number moves with the roster — see the scripts/read-load.sh header.'
echo
echo '| file | read range | lines | tokens |'
echo '|---|---|---|---|'
printf '%s' "$plan"

# --- premise check ------------------------------------------------------------------------------
# The count above is only true if the project's cold-start list actually tells the reader to stop at
# the Core section. That instruction lives in CLAUDE.md §0 — which is project-specific and therefore
# does NOT travel with this script. Measured 2026-08-14: LaserEditor received this script by sync and
# reported 786/850 green while its §0 instructed full reads of README and rule 17 — real load 1,189,
# i.e. 40% over budget reported as green. A metric that cannot see its own premise reports the
# template's virtue as the consumer's. Stdout keeps its shape (callers read line 1); the violation
# goes to stderr and exit 2, which selftest B4 surfaces.
#
# KNOWN GAP, stated rather than implied (PT-6/PT-9): this checks that §0 *says* Core-only. It cannot
# check that the reader *stopped* there — measured 2026-08-15, this very session read README in full
# while §0 said §Core, because the range was unknown at the moment of opening. That gap is what the
# `Read limit:N` column above closes, and selftest B8 keeps the column reachable. Filed as PT-11.
sec0="$(awk '/^## 0\./{c=1;next} c&&/^## /{exit} c' CLAUDE.md 2>/dev/null)"
bad=""
for f in "$R/README.md" "$R/common/17-no-self-imposed-scope.md" "$R/common/judgment-mistakes-history.md"; do
  [ -f "$f" ] || continue
  has_marker "$f" || continue   # counts full length anyway
  b="$(basename "$f")"
  line="$(printf '%s\n' "$sec0" | grep -F "$b" | head -1)"
  if [ -z "$line" ]; then
    bad="$bad
  - $b: not listed in CLAUDE.md §0 (this file is counted at its Core portion only)"
  elif ! printf '%s' "$line" | grep -qE 'Core|Part 1'; then
    bad="$bad
  - $b: §0 instructs a full read (counted at Core only — the number contradicts its premise)"
  fi
done
if [ -n "$bad" ]; then
  printf 'read-load premise violated — the count assumes Core-only reading, but CLAUDE.md §0 does not say so:%s\n' "$bad" >&2
  exit 2
fi
