#!/bin/bash
# SessionStart hook — automated cold-start for the maintenance harness.
#
# Fires at every session start / resume / clear and injects into Claude's context:
#   1. the cold-start protocol directive (rule 13)
#   2. the MANDATORY current-truth owners, IN FULL
#   3. the manifest of CONDITIONAL current-truth owners (paths only — not their bodies)
#   4. the active bug index
# so the user never has to say "read this first, prepare with that" at session switch.
#
# ── WHY THIS FILE STOPPED CLIPPING (2026-08-27, S008) ───────────────────────────────────────────
# Until S008 this hook did `clipped(handover, 200)` and, in the same block, instructed the reader
# "The current handover (16.md) is inlined below … Treat it as read."  Measured at S008 on a
# 279-line handover: 200/279 lines were injected and 79 were dropped — and the dropped tail held
# the S006 and S007 rulings, INCLUDING the project's most load-bearing prohibition ("Opus 5 を solo
# で運用しない"), the whole template-feedback queue and the whole baseline section.  A truncation
# marker was printed, but a marker that sits under a "treat it as read" instruction is not a
# defense: the reader is told the payload IS the handover.  Two independent lanes and the parent's
# own measurement found this in the same session; selftest B9 stayed green throughout because it
# checks the injected PATH, never the injected BYTES.
#
# The rule this file now follows: **a mandatory owner is injected whole, or the hook says so in
# the loudest terms it has and never calls it read.**  Size is never quietly traded for completeness
# — that is the same trade CLAUDE.md §1 and read-load.sh forbid elsewhere.
#
# ── AND WHY IT INJECTS *INSTEAD OF* A RE-READ ───────────────────────────────────────────────────
# Measured S008: the reader was paying for the handover twice — 21,913 est. tokens through this
# hook and 30,488 again from disk, because CLAUDE.md §0 listed it as a mandatory read as well.
# scripts/read-load.sh counted it once, so the reported 65,868 tok was really 87,781 tok (182% of
# allowance, not 137%).  CLAUDE.md §0 now records that a hook-injected owner is satisfied BY the
# injection; GEN is what makes that safe (16.md §GEN vs this payload — if they differ, disk wins).
#
# Requirements: bash + python3 (macOS/Linux standard). Degrades silently if the
# harness files don't exist (e.g. before bootstrap), so it never blocks a session.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HANDOVER="$ROOT/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md"
BUGS="$ROOT/prompt/maintenance/local/bugs/active/index.md"
[ -f "$HANDOVER" ] || exit 0
command -v python3 >/dev/null 2>&1 || exit 0
export ROOT HANDOVER BUGS
python3 - <<'PY'
import json, os, pathlib

ROOT = pathlib.Path(os.environ["ROOT"])

# Conditional owners: the manifest is injected, the BODIES are not. Each line is
# path | one-line description | the trigger that makes it a required read.
# Adding a row here costs ~30 tokens; adding a body costs its whole weight, so a
# body belongs here only if CLAUDE.md §0 also promotes it to the mandatory set.
CONDITIONAL = [
    ("prompt/maintenance/local/handover/batons.md",
     "the body and grounds of every baton; 16.md §2 already carries each one's stub + Status + Trigger + Owner + Sev",
     "a baton's trigger has fired and its one-line stub in 16.md §2 is not enough to act safely"),
    ("prompt/maintenance/local/handover/evidence-map.md",
     "closed-objective outputs, donor SHA pins, external-source paths, evidence owners and their read order, loop position, template-feedback queue",
     "you need a measurement's provenance, an evidence file, a donor pin, a closed objective's output, or the template-feedback queue"),
]

def read_full(path):
    p = pathlib.Path(path)
    if not p.is_file():
        return None, 0
    text = p.read_text(encoding="utf-8")
    return text, len(text.splitlines())

def gen_of(text):
    for line in (text or "").splitlines():
        if "GEN:" in line and "-close" in line:
            i = line.find("GEN:")
            return line[i:i+20].split("**")[0].strip(" *—-")
    return "UNDECLARED"

handover, h_lines = read_full(os.environ["HANDOVER"])
bugs, _ = read_full(os.environ.get("BUGS", ""))
gen = gen_of(handover)

parts = [
    "=== AUTOMATED COLD-START (SessionStart hook — injected without a user prompt) ===",
    "This project runs on the maintenance harness. Complete the cold-start protocol (rule 13) BEFORE any work:",
    f"1. The MANDATORY current-truth owner (16.md, {h_lines} lines, {gen}) is inlined below IN FULL. This injection SATISFIES its mandatory read — do not re-read it from disk unless you edit it or suspect the generation is stale (then disk wins).",
    "2. Read prompt/maintenance/global/rules/README.md and use its decision tree to pick the task-specific rules; read them fully.",
    "3. Re-measure the baseline numbers in 16.md §5 (typecheck / tests / bug counts) — never transcribe them on trust; report any drift to the user first.",
    "4. Before design or judgment work: self-check against global/rules/common/judgment-mistakes-history.md.",
    "5. Wait for the user's GO before implementation (rule 12 wait-for-go).",
    "",
    "CONDITIONAL CURRENT-TRUTH OWNERS — paths only. Their bodies are NOT injected and are NOT read by",
    "default. 16.md carries a one-line stub for every prohibition, limitation and read-order these hold,",
    "so a session that never opens them still cannot act wrongly. Open one when its trigger fires:",
]
for path, what, trigger in CONDITIONAL:
    exists = (ROOT / path).is_file()
    parts.append(f"  - {path}{'' if exists else '   [MISSING — this is a defect, report it]'}")
    parts.append(f"      holds:   {what}")
    parts.append(f"      open it: {trigger}")
parts += [
    "",
    f"--- BEGIN {os.path.relpath(os.environ['HANDOVER'], os.environ['ROOT'])} ({h_lines} lines, complete) ---",
    handover,
    "--- END 16.md (complete — nothing was omitted) ---",
]
if bugs:
    parts += [
        "",
        "--- BEGIN prompt/maintenance/local/bugs/active/index.md ---",
        bugs,
        "--- END bugs index ---",
    ]

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "SessionStart",
        "additionalContext": "\n".join(parts),
    },
    "systemMessage": f"🧭 Cold-start: 16.md 全文({h_lines} 行 / {gen})+ conditional owner の manifest + bug index を自動読み込みしました",
}, ensure_ascii=False))
PY
