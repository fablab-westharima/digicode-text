#!/bin/bash
# Lists the §2 (残タスク) and §3 (確定事項) entries that were in the last committed 16.md and are not
# in the current one — separated into REWORDED and GONE, because those need different answers.
#
# ── WHY ─────────────────────────────────────────────────────────────────────────────────────────
# 16.md is overwritten every close. That is deliberate: it keeps the file current and small. It also
# means a requirement can leave the project without a diff anyone reads, and nothing in the close
# protocol looked.
#
# Measured on a consumer project (LaserEditor S021, investigation 2026-08-16): a canonical
# requirement the user had supplied verbatim became a §2 row asking "include Windows / Linux / Pi /
# Companion?" with the default written as no; at the next close the work row was gone; git records
# no user decision for the exclusion, and the same commit that dropped the row recorded the user's
# ruling that all three are official targets. Three steps, and at no instant does a line exist that
# says "scope was cut". Rule 17 already says exclusion requires a user decision — the handover's own
# form was allowing the opposite.
#
# Measured here as well: this repo's §2 sheds one to three entries per close, and nothing classified
# any of them. One traced example took four files of archaeology and the answer was still "depends
# how you read the row".
#
# ── WHAT IT DOES NOT DO ─────────────────────────────────────────────────────────────────────────
# It cannot tell you whether a removal was right. Like selftest B6, it exists to make the question
# unavoidable and cheap, not to answer it. The answer goes in the close report, one line per GONE
# entry: done (name the commit) / relocated (name the file that owns it now) / dropped by the user
# (name the ruling) / lost (put it back). REWORDED is detected mechanically and needs no answer.
#
# ── DENOMINATOR BEFORE VERDICT (2026-08-24) ─────────────────────────────────────────────────────
# "GONE (0)" and "the parser matched nothing" printed the same sentence, and the second one is the
# likely reading precisely when the handover's shape is being changed — which is the only time this
# script really matters. It now states how many current-state files it scanned and how many entries
# each version yielded, before any verdict, and refuses to report a clean sweep it did not perform.
# A previous version that yields zero entries is an instrument error, not an empty handover: the
# silent failure is prev=0 (every removal invisible), while curr=0 with prev>0 is loud by itself.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
H=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
[ -f "$H" ] || { echo "handover not found: $H" >&2; exit 2; }
command -v python3 >/dev/null 2>&1 || { echo "python3 required" >&2; exit 2; }

# Which two versions to compare. Mid-close (16.md rewritten, not yet committed) the interesting
# comparison is working tree vs its last commit. Just after a close commit, it is that commit vs its
# predecessor. Picking automatically means the caller never has to know which situation they are in.
last="$(git log -1 --format=%H -- "$H" 2>/dev/null || true)"
[ -n "$last" ] || { echo "no committed history for the handover yet — nothing to compare"; exit 0; }
if git diff --quiet -- "$H" 2>/dev/null; then
  prev="$(git log -2 --format=%H -- "$H" | tail -1)"
  [ "$prev" = "$last" ] && { echo "only one committed version of the handover — nothing to compare"; exit 0; }
  base="$prev"; head_desc="HEAD ($(git log -1 --format=%h -- "$H"))"
else
  base="$last"; head_desc="working tree (uncommitted)"
fi

# mktemp, not fixed /tmp paths: a fixed name is writable by anything else on the machine and silently
# reused between concurrent runs — the comparison would then be against someone else's file, and the
# result would look exactly like a normal one.
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
git show "$base:$H" > "$WORK/prev.md" 2>/dev/null || { echo "cannot read $base:$H" >&2; exit 2; }
if [ "$head_desc" = "working tree (uncommitted)" ]; then cp "$H" "$WORK/curr.md"
else git show "HEAD:$H" > "$WORK/curr.md"; fi

# One current-state file today. Counted rather than assumed, so that the day this set grows (or is
# emptied by a restructure) the denominator moves with it instead of the script asserting "1".
SCANNED=1
if [ "$SCANNED" -eq 0 ]; then
  echo "handover-diff scanned 0 current-state files — it measured nothing, which is not a clean sweep" >&2
  exit 2
fi
echo "  current-state files scanned: $SCANNED"

BASE_SHORT="$(git log -1 --format=%h "$base")" python3 - "$WORK/prev.md" "$WORK/curr.md" "$head_desc" <<'PY'
import re, sys, os, difflib

def entries(path):
    """§2 numbered table rows and §3 bullets, as (section, text)."""
    out, sec = [], None
    for line in open(path, encoding="utf-8"):
        m = re.match(r'^## (§[0-9])', line)
        if m:
            sec = m.group(1); continue
        # Alpha-prefixed ids (H1, PF3, B12) are entries too. The numeric-only form was written when
        # every row happened to be numbered; a project that adopts prefixed ids would have had every
        # such row invisible to this script, and invisibility here prints as "nothing unaccounted".
        if sec == "§2" and re.match(r'^\|\s*[A-Za-z]{0,3}[0-9]+\s*\|', line):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            if len(cells) >= 2:
                out.append(("§2", cells[1]))
        elif sec == "§3" and line.startswith("- "):
            out.append(("§3", line[2:].strip()))
    return out

def norm(s):
    # emphasis and backticks are formatting, not identity; a row reworded from **X** to X is the
    # same row. Everything else is left alone deliberately — normalising harder would start hiding
    # real edits, which is the failure this script exists to prevent.
    return re.sub(r'[*`]', '', s).strip()

prev, curr = entries(sys.argv[1]), entries(sys.argv[2])
curr_by_sec = {}
for sec, t in curr:
    curr_by_sec.setdefault(sec, []).append(norm(t))

gone, reworded = [], []
for sec, t in prev:
    n = norm(t)
    pool = curr_by_sec.get(sec, [])
    if n in pool:
        continue
    best, ratio = None, 0.0
    for c in pool:
        r = difflib.SequenceMatcher(None, n, c).ratio()
        if r > ratio:
            best, ratio = c, r
    (reworded if ratio >= 0.60 else gone).append((sec, n, best, ratio))

print(f"handover-diff: {os.environ.get('BASE_SHORT','?')} -> {sys.argv[3]}")
print(f"  §2/§3 entries parsed: {len(prev)} before, {len(curr)} now")
if len(prev) == 0:
    print("\n  INSTRUMENT_ERROR: the previous version yielded 0 §2/§3 entries, so nothing could be")
    print("  found missing — this prints identically to a clean sweep and is not one. Either the")
    print("  section headings / row shape changed and the parser no longer matches, or §2 and §3 were")
    print("  genuinely empty before. If genuinely empty, say so in the close report and continue.")
    sys.exit(2)
if reworded:
    print(f"\n  REWORDED ({len(reworded)}) — same entry, new wording. No action needed.")
    for sec, n, best, r in reworded:
        print(f"    [{sec}] {n[:72]}")
        print(f"        -> {best[:72]}  ({r:.0%})")
if gone:
    print(f"\n  GONE ({len(gone)}) — classify each one in the close report before committing:")
    print("    done (name the commit) / relocated (name the file that owns it now) /")
    print("    dropped by the user (name the ruling) / lost (put it back)")
    for sec, n, best, r in gone:
        print(f"    [{sec}] {n[:96]}")
else:
    print(f"\n  GONE (0) over {len(prev)} entries compared — nothing left §2/§3 unaccounted.")
PY
hd_rc=$?
exit "$hd_rc"
