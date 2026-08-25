#!/usr/bin/env bash
# placement-scan.sh — executable form of rule 15 §Forbidden locations.
#
# WHY THIS EXISTS. The root-forbidden discipline was written in three places
# (CLAUDE.md §0, rule 15 §Forbidden locations, local/README.md) and enforced in none.
# Measured 2026-08-25: a file created directly under `local/` passed all 74 selftest
# checks green, and the violation was caught by `/close` step 6's index reconciliation
# — a human-ordered step, not a gate. (16.md §2 baton #35; promoted in Phase 7.)
#
# WHAT IT DOES NOT DO. It does not decide the policy. The allowed category set is
# PARSED OUT OF THE RULE'S OWN §Layer definitions block, so this script cannot drift
# from the contract without the parse failing — the same design as
# routing-scenarios.py resolving its facts from the profile instead of asserting them.
# If the block cannot be parsed, the scan REFUSES (exit 2) rather than scanning against
# an empty allow-set, which would report a clean sweep (rule 04 §An invariant reported
# as one number).
#
# Usage:
#   placement-scan.sh [--root <meta-docs root>] [--rule <rule 15 path>]
#                     [--instructions <top-level instruction file>]
#
# Exit codes:  0 = no violations   1 = violations found   2 = INSTRUMENT_ERROR
# Output:      CATEGORIES=<n> SCANNED=<n> VIOLATIONS=<n>  then one line per violation.
#              Every count is printed, including the denominators, so "VIOLATIONS=0"
#              can be told apart from "nothing was scanned".

set -u

ROOT="prompt/maintenance"
RULE="prompt/maintenance/global/rules/common/15-docs-organization.md"
INSTRUCTIONS="CLAUDE.md"

while [ $# -gt 0 ]; do
  case "$1" in
    --root)         ROOT="$2"; shift 2 ;;
    --rule)         RULE="$2"; shift 2 ;;
    --instructions) INSTRUCTIONS="$2"; shift 2 ;;
    *) echo "INSTRUMENT_ERROR: unknown argument '$1'" >&2; exit 2 ;;
  esac
done

[ -d "$ROOT" ] || { echo "INSTRUMENT_ERROR: meta-docs root not found: $ROOT" >&2; exit 2; }
[ -f "$RULE" ] || { echo "INSTRUMENT_ERROR: rule 15 not found: $RULE" >&2; exit 2; }

# --- the contract, parsed from the rule (never hard-coded here) -------------------
# §Layer definitions draws the tree with `── name/` entries. Take the FIRST path
# component of each, drop the two layer names, and what remains is the category set.
CATS="$(
  awk '/^### Layer definitions/{f=1} f' "$RULE" \
    | awk '/^### /{n++} n<2' \
    | grep -oE '── [a-zA-Z][A-Za-z0-9_.<>{}-]*/' \
    | sed 's/^── //; s|/$||' \
    | grep -vxE 'global|local' \
    | sort -u
)"
NCAT="$(printf '%s\n' "$CATS" | grep -c '[a-zA-Z]')"

if [ "$NCAT" -lt 2 ]; then
  echo "INSTRUMENT_ERROR: could not parse the category set out of $RULE §Layer definitions (CATEGORIES=$NCAT) — refusing to scan against an empty allow-set" >&2
  exit 2
fi

# The one exception rule 15 states: a top-level NAVIGATIONAL file. It is permitted only
# when the project's own instruction file designates it, so an arbitrary README dropped
# at a layer root does not inherit the exception.
nav_ok() { # $1 = path relative to the repo
  case "$(basename "$1")" in
    README.md) [ -f "$INSTRUCTIONS" ] && grep -qF "$1" "$INSTRUCTIONS" ;;
    *) return 1 ;;
  esac
}

SCANNED=0
VIOL=0
LINES=""

add() { VIOL=$((VIOL + 1)); LINES="$LINES
  VIOLATION $1"; }

# ① files at the meta-docs root, ② files directly under a layer root
for d in "$ROOT" "$ROOT/global" "$ROOT/local"; do
  [ -d "$d" ] || continue
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    SCANNED=$((SCANNED + 1))
    if nav_ok "$f"; then continue; fi
    add "file-at-layer-root: $f (rule 15 §Forbidden locations — every file lives in a category-named subfolder)"
  done <<EOF
$(find "$d" -maxdepth 1 -type f ! -name '.*' 2>/dev/null | sort)
EOF
done

# ③ top-level subfolders that the rule does not declare
for L in global local; do
  [ -d "$ROOT/$L" ] || continue
  while IFS= read -r sub; do
    [ -n "$sub" ] || continue
    b="$(basename "$sub")"
    SCANNED=$((SCANNED + 1))
    printf '%s\n' "$CATS" | grep -qxF "$b" || \
      add "undeclared-category: $sub (rule 15 §Forbidden locations — inventing a new top-level subfolder requires updating the rule first)"
  done <<EOF
$(find "$ROOT/$L" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | sort)
EOF
done

echo "CATEGORIES=$NCAT SCANNED=$SCANNED VIOLATIONS=$VIOL"
[ "$VIOL" -eq 0 ] || printf '%s\n' "$LINES" | sed '/^$/d'
[ "$VIOL" -eq 0 ]
