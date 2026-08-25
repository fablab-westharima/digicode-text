#!/bin/bash
# Sanctioned, allowlisted Route B export surface for an actor with no repository access.
# Testing-only path overrides: CONTEXT_BRIEF_CLAUDEMD, CONTEXT_BRIEF_HANDOVER, CONTEXT_BRIEF_BASELINE.
# This script reads only CLAUDE.md, handover §1-§3, scripts/baseline.sh (or, when no generator
# exists, the handover §5 baseline-table rows — item and value cells only; the measurement-command
# column never leaves the repository, because consumer §5 commands name hosts and access paths),
# requested common-rule TL;DRs, repository metadata, and the transcript-directory file count. It
# never reads local/bugs, local/handover/sessions, judgment-mistakes Part 2/case bodies, .env
# files, or credentials.
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLAUDEMD="${CONTEXT_BRIEF_CLAUDEMD:-$ROOT/CLAUDE.md}"
HANDOVER="${CONTEXT_BRIEF_HANDOVER:-$ROOT/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md}"
MAX_BYTES="${BRIEF_MAX_BYTES:-65536}"
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
extract_section '## §2' "$HANDOVER" "CURRENT STATE §2" "$TMP/state2"

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
transcript_dir="${HOME:-}/.claude/projects/$sanitized_cwd"
if [ -d "$transcript_dir" ]; then
  transcript_count="$(find "$transcript_dir" -type f -name '*.jsonl' -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')"
  transcript_line="Session transcripts: $transcript_dir (${transcript_count:-0} *.jsonl files)"
else
  transcript_line="NOT OBTAINED: session-transcript directory (source: $transcript_dir)"
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
  printf '\nCURRENT STATE\n'; cat "$TMP/state1"; cat "$TMP/state2"
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
