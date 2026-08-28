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
# ── THE OWNER SET, NOT ONE FILE (2026-08-27, S008) ──────────────────────────────
# Current state stopped being one file at S008: 16.md is the router and carries every baton STUB,
# while the baton BODIES live in local/handover/batons.md and the evidence/provenance/loop map lives
# in local/handover/evidence-map.md. local/README.md §OPTIONAL CAPABILITY obligation ② requires this
# script to scan ALL of them, and the reason is measured, not decorative: comparing 16.md alone the
# day the bodies moved reported 30+ §2 entries GONE, every one of which was sitting in the new owner.
# A removal audit that cannot see the destination reports a relocation as a loss — and, the other way
# round, would report a real loss as a relocation the moment anyone stopped checking.
#
# So the comparison is over the UNION of the declared owners. An entry is GONE only when it is in no
# current owner. Per-owner denominators are printed as well, because a union total can stay constant
# while one owner is silently emptied.
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
# The declared current-state owner set. Adding an owner here is what makes it auditable; a topic
# owner that is not listed is invisible to the removal audit, which prints as "nothing unaccounted".
# Format: <path>|<entry mode>. Modes: handover = §2 rows + §3 bullets; batons = every numbered table
# row is a §2 entry; none = the file holds no §2/§3 entries (existence and non-emptiness are still
# checked, so deleting it is loud).
OWNERS=(
  "prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md|handover"
  "prompt/maintenance/local/handover/batons.md|batons"
  "prompt/maintenance/local/handover/evidence-map.md|none"
)
[ -f "$H" ] || { echo "handover not found: $H" >&2; exit 2; }
command -v python3 >/dev/null 2>&1 || { echo "python3 required" >&2; exit 2; }

SCANNED=0
for o in "${OWNERS[@]}"; do
  f="${o%%|*}"
  if [ ! -s "$f" ]; then
    echo "handover-diff: declared current-state owner missing or empty: $f" >&2
    echo "  INSTRUMENT_ERROR, never a clean sweep: an owner that is not there cannot be compared," >&2
    echo "  and its entries would silently leave the union." >&2
    exit 2
  fi
  SCANNED=$((SCANNED + 1))
done
if [ "$SCANNED" -eq 0 ]; then
  echo "handover-diff scanned 0 current-state files — it measured nothing, which is not a clean sweep" >&2
  exit 2
fi

# Which two versions to compare, decided over the WHOLE owner set: if any owner differs from HEAD
# (or is untracked), this is a mid-close comparison of the working tree against HEAD. Otherwise it is
# the last commit that touched any owner against its predecessor.
dirty=0
for o in "${OWNERS[@]}"; do
  f="${o%%|*}"
  git ls-files --error-unmatch "$f" >/dev/null 2>&1 || { dirty=1; break; }
  git diff --quiet -- "$f" 2>/dev/null || { dirty=1; break; }
done
paths=(); for o in "${OWNERS[@]}"; do paths+=("${o%%|*}"); done
last="$(git log -1 --format=%H -- "${paths[@]}" 2>/dev/null || true)"
[ -n "$last" ] || { echo "no committed history for the handover yet — nothing to compare"; exit 0; }
if [ "$dirty" -eq 1 ]; then
  base="$last"; head_desc="working tree (uncommitted)"
else
  prevc="$(git log -2 --format=%H -- "${paths[@]}" | tail -1)"
  [ "$prevc" = "$last" ] && { echo "only one committed version of the handover — nothing to compare"; exit 0; }
  base="$prevc"; head_desc="HEAD ($(git log -1 --format=%h -- "${paths[@]}"))"
fi

# mktemp, not fixed /tmp paths: a fixed name is writable by anything else on the machine and silently
# reused between concurrent runs — the comparison would then be against someone else's file, and the
# result would look exactly like a normal one.
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
n=0; SPEC=""
for o in "${OWNERS[@]}"; do
  f="${o%%|*}"; mode="${o##*|}"; n=$((n + 1))
  # An owner absent from the base commit is a NEW owner, not a read failure: prev is empty, and the
  # union arithmetic is what decides whether anything was lost.
  git show "$base:$f" > "$WORK/prev.$n" 2>/dev/null || : > "$WORK/prev.$n"
  if [ "$head_desc" = "working tree (uncommitted)" ]; then cp "$f" "$WORK/curr.$n"
  else git show "HEAD:$f" > "$WORK/curr.$n" 2>/dev/null || : > "$WORK/curr.$n"; fi
  SPEC="$SPEC$f|$mode|$WORK/prev.$n|$WORK/curr.$n
"
done
echo "  current-state files scanned: $SCANNED (owner set)"

BASE_SHORT="$(git log -1 --format=%h "$base")" HD_SPEC="$SPEC" python3 - "$head_desc" <<'PY'
import re, sys, os, difflib

# Cells are split on UNESCAPED pipes only. A row may legitimately contain an escaped pipe — this
# repository's baton 4 carries `none\|minimal\|low\|medium\|high\|xhigh\|max` — and the naive
# split('|') truncated that row's identity at the first one, so any later edit to the rest of the
# row was invisible to this audit. That is case PT-33's shape exactly: a verifier splitting rows
# the same wrong way as the thing it is verifying.
CELL = re.compile(r'(?<!\\)\|')
ROW  = re.compile(r'^\|\s*\*{0,2}[A-Za-z]{0,3}[0-9]+\*{0,2}\s*\|')

def entries(path, mode):
    """(section, text) entries, per the owner's declared mode."""
    out, sec = [], None
    try: fh = open(path, encoding="utf-8")
    except OSError: return out
    with fh:
        for line in fh:
            m = re.match(r'^## (§[0-9])', line)
            if m:
                sec = m.group(1); continue
            if mode == "handover":
                if sec == "§2" and ROW.match(line):
                    cells = [c.strip() for c in CELL.split(line.strip().strip('|'))]
                    if len(cells) >= 2: out.append(("§2", cells[1]))
                elif sec == "§3" and line.startswith("- "):
                    out.append(("§3", line[2:].strip()))
            elif mode == "batons":
                # Every numbered table row in a baton-body owner is a §2 entry, whatever heading it
                # sits under: the body owner has no §-numbered sections of its own.
                if ROW.match(line):
                    cells = [c.strip() for c in CELL.split(line.strip().strip('|'))]
                    if len(cells) >= 2: out.append(("§2", cells[1]))
    return out

def norm(s):
    # emphasis and backticks are formatting, not identity; a row reworded from **X** to X is the
    # same row. Everything else is left alone deliberately — normalising harder would start hiding
    # real edits, which is the failure this script exists to prevent.
    return re.sub(r'[*`]', '', s).strip()

spec = [l for l in os.environ["HD_SPEC"].splitlines() if l.strip()]
prev, curr, per = [], [], []
for line in spec:
    path, mode, pfile, cfile = line.split("|")
    p, c = entries(pfile, mode), entries(cfile, mode)
    prev += p; curr += c
    per.append((path, mode, len(p), len(c)))

curr_by_sec = {}
for sec, t in curr:
    curr_by_sec.setdefault(sec, []).append(norm(t))

gone, reworded, seen = [], [], set()
for sec, t in prev:
    n = norm(t)
    if (sec, n) in seen: continue
    seen.add((sec, n))
    pool = curr_by_sec.get(sec, [])
    if n in pool: continue
    best, ratio = None, 0.0
    for c in pool:
        r = difflib.SequenceMatcher(None, n, c).ratio()
        if r > ratio: best, ratio = c, r
    (reworded if ratio >= 0.60 else gone).append((sec, n, best, ratio))

print(f"handover-diff: {os.environ.get('BASE_SHORT','?')} -> {sys.argv[1]}")
print("  per-owner entries (before -> now):")
for path, mode, np, nc in per:
    print(f"    {np:>4} -> {nc:<4}  [{mode}] {path}")
print(f"  §2/§3 entries parsed over the owner set: {len(prev)} before, {len(curr)} now")
if len(prev) == 0:
    print("\n  INSTRUMENT_ERROR: the previous version yielded 0 entries over the whole owner set, so")
    print("  nothing could be found missing — this prints identically to a clean sweep and is not one.")
    print("  Either the section headings / row shape changed and the parser no longer matches, or")
    print("  §2 and §3 were genuinely empty before.")
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
    print(f"\n  GONE (0) over {len(prev)} entries compared across {len(per)} owners — nothing left §2/§3 unaccounted.")
PY
hd_rc=$?
exit "$hd_rc"
