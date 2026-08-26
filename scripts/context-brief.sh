#!/bin/bash
# Sanctioned, allowlisted Route B export surface for an actor with no repository access.
# Testing-only path overrides: CONTEXT_BRIEF_CLAUDEMD, CONTEXT_BRIEF_HANDOVER, CONTEXT_BRIEF_BASELINE.
# This script reads only CLAUDE.md, the declared current-state OWNER SET (handover §1-§3 + the
# baton-body owner + the evidence/provenance/loop map — see CURRENT-STATE OWNER SET below),
# scripts/baseline.sh (or, when no generator
# exists, the handover §5 baseline-table rows — item and value cells only; the measurement-command
# column never leaves the repository, because consumer §5 commands name hosts and access paths),
# requested common-rule TL;DRs, repository metadata, and the transcript-directory file count. It
# never reads local/bugs, local/handover/sessions, judgment-mistakes Part 2/case bodies, .env
# files, or credentials.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDEMD="${CONTEXT_BRIEF_CLAUDEMD:-$ROOT/CLAUDE.md}"
HANDOVER="${CONTEXT_BRIEF_HANDOVER:-$ROOT/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md}"
# ── CURRENT-STATE OWNER SET (2026-08-27, S008) ──────────────────────────────────────────────────
# At S008 current state stopped being one file: 16.md is the router and carries every baton STUB,
# the baton BODIES moved to batons.md, and the evidence / provenance / loop map moved to
# evidence-map.md. The recipient of this brief has NO repository access, so a brief carrying only
# the router would be a brief that got smaller by losing current truth — the exact failure the
# handover architecture work was forbidden to produce. **Completeness is this file's job; size is
# read-load.sh's.** So every owner is exported, and the brief is NOT expected to shrink because of
# the split. Measured 2026-08-27: it went 77,190 -> 90,100 bytes across this change, because it now
# carries the loop position and the template-feedback queue it had been silently omitting.
#
# **If an owner is added to the handover and not added here, this brief silently ships an incomplete
# current state, and NOTHING CHECKS THAT.** B70 compares generations and owner reachability across
# CLAUDE.md and the hook; it never reads this file. An earlier version of this very comment claimed
# B70 covered it — a script comment asserting a guard that does not exist is worse than no comment,
# because the next author stops looking. The obligation is carried by baton 53 and by nothing
# executable. `BRIEF-MISSING` only counts owners that ARE listed here and could not be read.
BATONS="${CONTEXT_BRIEF_BATONS:-$ROOT/prompt/maintenance/local/handover/batons.md}"
EVIDENCE_MAP="${CONTEXT_BRIEF_EVIDENCE_MAP:-$ROOT/prompt/maintenance/local/handover/evidence-map.md}"
# Cap: 96 KiB (98304). Raised from 64 KiB (65536) on 2026-08-27 by an explicit Human GO, on measured
# grounds, not to make one document fit: at the S007 close the brief was 65,141 bytes against a 65,536
# cap — 395 bytes of headroom — so the next close was going to cross it whoever wrote it, and the two
# repairs that do not need a threshold change are both forbidden here (deleting current truth to move
# a size signal, and restructuring the handover mid-close). 96 KiB is PROVISIONAL. It is not a ruling
# that the cap may be raised again whenever it is reached: the standing repair is the handover /
# context-brief / read-load topic split held as a separate maintenance objective candidate (16.md §1
# menu, baton 25). Raising this value again needs its own Human GO (16.md §1: changing a gate's class
# or threshold).
MAX_BYTES="${BRIEF_MAX_BYTES:-98304}"
task=""
recipient=""
rules=""
out=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --task|--recipient|--rules|--out)
      [ "$#" -ge 2 ] || { echo "context-brief: $1 requires a value" >&2; exit 2; }
      case "$1" in
        --task) task="$2" ;;
        --recipient) recipient="$2" ;;
        --rules) rules="$2" ;;
        --out) out="$2" ;;
      esac
      shift 2
      ;;
    *) echo "context-brief: unknown argument: $1" >&2; exit 2 ;;
  esac
done

case "$MAX_BYTES" in
  ''|*[!0-9]*) echo "context-brief: BRIEF_MAX_BYTES must be a non-negative integer" >&2; exit 2 ;;
esac

TMP="$(mktemp -d "${TMPDIR:-/tmp}/context-brief.XXXXXX")" || exit 2
trap 'rm -rf "$TMP"' EXIT HUP INT TERM
body="$TMP/body"
brief="$TMP/brief"
incomplete=0
# The exporter counts its OWN unobtained values. Consumers must read this count, never re-derive it
# by grepping the payload for the sentinel: this brief embeds current-state documents verbatim, so a
# handover that merely *discusses* NOT OBTAINED would be read as the exporter having failed to obtain
# something. Measured 2026-08-24 (third firing of the registered sentinel-anchoring defect, this time
# as a red gate at close): the string appeared inside a settled-decision line of 16.md. The name of
# the quantity is "values this run could not obtain"; a substring search measures something else.
missing_n=0

not_obtained() {
  printf 'NOT OBTAINED: %s (source: %s)\n' "$1" "$2"
  incomplete=1; missing_n=$((missing_n+1))
}

extract_section() {
  cb_start="$1"
  cb_source="$2"
  cb_label="$3"
  cb_dest="$4"
  if [ -f "$cb_source" ]; then
    awk -v start="$cb_start" '
      index($0, start) == 1 { found=1; print; next }
      found && /^## / { exit }
      found { print }
    ' "$cb_source" > "$cb_dest"
  else
    : > "$cb_dest"
  fi
  if [ ! -s "$cb_dest" ]; then
    not_obtained "$cb_label" "$cb_source" > "$cb_dest"
  fi
}

extract_section '## 4.' "$CLAUDEMD" "PURPOSE" "$TMP/purpose"
extract_section '## §3' "$HANDOVER" "SETTLED DECISIONS" "$TMP/settled"
extract_section '## §1' "$HANDOVER" "CURRENT STATE §1" "$TMP/state1"
# §2 is exported from the BODY owner, not from the router. The router's §2 carries one-line stubs
# whose only job is to keep a repo-reading session safe without opening the bodies; a recipient who
# receives the bodies gains nothing from the summaries and pays for them twice. Measured 2026-08-27:
# exporting both put the brief at 93,937 bytes (95.6% of cap) with ~13 KB of it being the same 45
# batons said twice. Exporting the bodies alone loses no fact — every Status / Trigger / Owner / Sev
# cell is verbatim in the body row. If the body owner is missing, extract_section emits NOT OBTAINED
# and BRIEF-MISSING rises, so this is fail-closed rather than a silent §2-shaped hole.
extract_section '## Baton bodies' "$BATONS" "CURRENT STATE §2 (baton bodies — the router's stubs are repo-side routing, not exported)" "$TMP/state2"
extract_section '## §A' "$EVIDENCE_MAP" "CURRENT STATE evidence/provenance map" "$TMP/state3a"
extract_section '## §B' "$EVIDENCE_MAP" "CURRENT STATE loop position + template feedback" "$TMP/state3b"

BASELINE_GEN="${CONTEXT_BRIEF_BASELINE:-$ROOT/scripts/baseline.sh}"
if [ -f "$BASELINE_GEN" ]; then
  bash "$BASELINE_GEN" > "$TMP/baseline" 2>/dev/null
  baseline_rc=$?
  if [ "$baseline_rc" -ne 0 ] || [ ! -s "$TMP/baseline" ]; then
    not_obtained "baseline output" "$BASELINE_GEN" > "$TMP/baseline"
  fi
else
  # rule 13 path ②: no generator — the handover §5 table (each row carrying its own measurement
  # command) is the project's sanctioned baseline representation. Export item and value cells
  # only; commands stay repo-side. Values are last-close claims, labeled — fail-closed guards
  # absence, not epistemic status, so an obtained claim does not set INCOMPLETE.
  awk '/^## §5/{found=1; next} found && /^## /{exit} found && /^\|/' "$HANDOVER" > "$TMP/b2rows" 2>/dev/null
  if [ -s "$TMP/b2rows" ]; then
    {
      printf '%s\n' 'Source: rule 13 path 2 (no generator) — handover §5 rows, values at last close. These are claims, not fresh measurement; the integration owner re-measures repo-side before anything lands.'
      awk -F'|' '{printf "|%s|%s|\n", $2, $3}' "$TMP/b2rows"
    } > "$TMP/baseline"
  else
    printf '%s\n' "NOT OBTAINED: baseline (no generator at $BASELINE_GEN, no handover §5 baseline table)" > "$TMP/baseline"
    incomplete=1; missing_n=$((missing_n+1))
  fi
fi

repo_path="$ROOT"
sanitized_cwd="-$(printf '%s' "${ROOT#/}" | tr '/_' '--')"
transcript_root="${HOME:-}/.claude/projects"
transcript_dir="$transcript_root/$sanitized_cwd"
# EMPTY is not MISSING (rule 04 §EMPTY vs MISSING before reading a count). A corpus of zero
# transcripts is a MEASUREMENT; a corpus whose location cannot be determined is not. Conflating
# them made this exporter fail closed on the one state every newly bootstrapped project is in —
# no session has ever run in that working directory, so the per-project directory does not exist
# yet and cannot be made to exist by anything the project itself does. Measured 2026-08-25 on the
# first real consumer bootstrap (digicode-text): selftest B24 went RED at bootstrap for a reason
# that had nothing to do with the contract B24 tests, and the only way to green it was to create
# the directory by hand — fabricating an instrument's input.
#
# The discriminator is the ROOT, not the project directory: the root is what proves the harness
# looked in the right place at all.
#   root absent            -> NOT OBTAINED. The state directory itself is not where we think it
#                             is, so a count of 0 would be a claim about a path we cannot vouch for.
#   root present, dir absent -> 0 transcripts, MEASURED. No session has run in this working
#                             directory. This is the correct and expected state of a new project.
#   dir present            -> count the files.
if [ -d "$transcript_dir" ]; then
  transcript_count="$(find "$transcript_dir" -type f -name '*.jsonl' -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')"
  transcript_line="Session transcripts: $transcript_dir (${transcript_count:-0} *.jsonl files)"
elif [ -d "$transcript_root" ]; then
  transcript_line="Session transcripts: $transcript_dir (0 *.jsonl files — the directory does not exist yet, i.e. no session has run in this working directory. Measured empty, not unobtainable.)"
else
  transcript_line="NOT OBTAINED: session-transcript root (source: $transcript_root)"
  incomplete=1; missing_n=$((missing_n+1))
fi

: > "$TMP/rules"
if [ -n "$rules" ]; then
  old_ifs="$IFS"
  IFS=','
  for nn in $rules; do
    IFS="$old_ifs"
    nn="$(printf '%s' "$nn" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    matches="$(find "$ROOT/prompt/maintenance/global/rules/common" -maxdepth 1 -type f -name "${nn}-*.md" 2>/dev/null)"
    match_count="$(printf '%s\n' "$matches" | awk 'NF{n++} END{print n+0}')"
    rule_tmp="$TMP/rule-$nn"
    if [ "$match_count" -eq 1 ]; then
      awk '/^## TL;DR/{found=1; print; next} found&&/^## /{exit} found{print}' "$matches" > "$rule_tmp"
    else
      : > "$rule_tmp"
    fi
    printf '### Rule %s\n' "$nn" >> "$TMP/rules"
    if [ ! -s "$rule_tmp" ]; then
      not_obtained "rule $nn TL;DR" "$ROOT/prompt/maintenance/global/rules/common/${nn}-*.md" >> "$TMP/rules"
    else
      cat "$rule_tmp" >> "$TMP/rules"
    fi
    IFS=','
  done
  IFS="$old_ifs"
else
  printf '%s\n' 'No rule TL;DRs requested.' > "$TMP/rules"
fi

repo_name="$(basename "$ROOT")"
branch="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)" || branch=""
head_short="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null)" || head_short=""
head_full="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null)" || head_full=""
git -C "$ROOT" status --porcelain > "$TMP/status" 2>/dev/null
status_rc=$?
dirty_count="$(wc -l < "$TMP/status" | tr -d ' ')"
if [ -z "$branch" ] || [ -z "$head_short" ] || [ -z "$head_full" ] || [ "$status_rc" -ne 0 ]; then
  incomplete=1; missing_n=$((missing_n+1))
fi
generated_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
secret_warning=""
command -v gitleaks >/dev/null 2>&1 || secret_warning="WARNING: secret scan unavailable"

{
  printf '%s\n' 'BRIEF-SCHEMA: v1' 'IDENTITY'
  printf 'Repository: %s\nBranch: %s\nHEAD: %s (%s)\nDirty count: %s uncommitted changes\n' \
    "${repo_name:-NOT OBTAINED}" "${branch:-NOT OBTAINED}" "${head_short:-NOT OBTAINED}" \
    "${head_full:-NOT OBTAINED}" "${dirty_count:-NOT OBTAINED}"
  if [ "${dirty_count:-0}" -gt 0 ] 2>/dev/null; then
    git -C "$ROOT" diff > "$TMP/diff" 2>/dev/null
    diff_rc=$?
    if [ "$diff_rc" -ne 0 ]; then
      diff_digest="NOT OBTAINED"
      incomplete=1; missing_n=$((missing_n+1))
    elif command -v sha256sum >/dev/null 2>&1; then
      diff_digest="$(sha256sum "$TMP/diff" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
      diff_digest="$(shasum -a 256 "$TMP/diff" | awk '{print $1}')"
    else
      diff_digest="NOT OBTAINED"
      incomplete=1; missing_n=$((missing_n+1))
    fi
    printf 'DIRTY TREE (%s uncommitted changes) — HEAD freshness does NOT cover them; diff digest: %s\n' "$dirty_count" "$diff_digest"
  fi
  printf 'Generated at: %s\nValid at this HEAD only — regenerate after any commit.\n' "$generated_at"
  printf 'BRIEF-MISSING: %s\n' "$missing_n"
  [ "$incomplete" -eq 0 ] || printf '%s\n' 'STATUS: INCOMPLETE'
  [ -z "$secret_warning" ] || printf '%s\n' "$secret_warning"
  printf '\nPURPOSE\n'; cat "$TMP/purpose"
  printf '\nTASK\n'
  if [ -n "$task" ]; then printf '%s\n' "$task"; else printf '%s\n' 'TASK: NOT PROVIDED — the human fills this before handoff.'; fi
  printf '\nSETTLED DECISIONS\n'; cat "$TMP/settled"
  printf '\nCURRENT STATE\n'; cat "$TMP/state1"; cat "$TMP/state2"; cat "$TMP/state3a"; cat "$TMP/state3b"
  printf '\nBASELINE\n'; cat "$TMP/baseline"
  printf '\nAVAILABLE DATA CORPORA\nRepository: %s\n%s\n' "$repo_path" "$transcript_line"
  printf '%s\n' 'Enumerate additions here — an externally-briefed reasoner scopes to what it is told exists.'
  printf '\nRECIPIENT AUTHORITY\n'
  if [ -n "$recipient" ]; then printf '%s\n' "$recipient"; else printf '%s\n' 'RECIPIENT: NOT PROVIDED'; fi
  printf '%s\n' 'Your conclusions re-enter the repository as claims and are re-measured by the integration owner before anything lands. If information you need is not in this brief, ask — never fill the gap with an assumption. Same-lineage agreement is never different-lineage verification.'
  printf '\nRULE TL;DRS\n'; cat "$TMP/rules"
  printf '\nKNOWN UNCERTAINTIES\n%s\n' 'PLACEHOLDER: the human records known uncertainties here before handoff.'
} > "$brief"

brief_bytes="$(LC_ALL=C wc -c < "$brief" | tr -d ' ')"
if [ "$brief_bytes" -gt "$MAX_BYTES" ]; then
  echo "context-brief: brief is $brief_bytes bytes; cap is $MAX_BYTES bytes; emitted nothing" >&2
  exit 5
fi

if command -v gitleaks >/dev/null 2>&1; then
  scan_dir="$TMP/scan"
  mkdir "$scan_dir"
  cp "$brief" "$scan_dir/brief.txt"
  gitleaks detect --no-git --source "$scan_dir" >/dev/null 2>&1
  scan_rc=$?
  if [ "$scan_rc" -ne 0 ]; then
    echo "context-brief: secret scan found a candidate; emitted nothing" >&2
    exit 4
  fi
fi

if [ -n "$out" ]; then
  cp "$brief" "$out"
else
  cat "$brief"
fi
[ "$incomplete" -eq 0 ] && exit 0
exit 3
