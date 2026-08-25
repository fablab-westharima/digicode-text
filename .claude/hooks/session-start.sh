#!/bin/bash
# SessionStart hook — automated cold-start for the maintenance harness.
#
# Fires at every session start / resume / clear and injects into Claude's context:
#   1. the cold-start protocol directive (rule 13)
#   2. the current handover (local/handover/16_次セッション引き継ぎ指示書.md, ≤100 lines by convention)
#   3. the active bug index
# so the user never has to say "read this first, prepare with that" at session switch.
#
# Requirements: bash + python3 (macOS/Linux standard). Degrades silently if the
# harness files don't exist (e.g. before bootstrap), so it never blocks a session.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HANDOVER="$ROOT/prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md"
BUGS="$ROOT/prompt/maintenance/local/bugs/active/index.md"
[ -f "$HANDOVER" ] || exit 0
command -v python3 >/dev/null 2>&1 || exit 0
export HANDOVER BUGS
python3 - <<'PY'
import json, os, pathlib

def clipped(path, max_lines):
    p = pathlib.Path(path)
    if not p.is_file():
        return None
    lines = p.read_text(encoding="utf-8").splitlines()
    if len(lines) > max_lines:
        return "\n".join(lines[:max_lines]) + f"\n… (truncated at {max_lines} lines — Read the file for the rest)"
    return "\n".join(lines)

handover = clipped(os.environ["HANDOVER"], 200)
bugs = clipped(os.environ.get("BUGS", ""), 150)

parts = [
    "=== AUTOMATED COLD-START (SessionStart hook — injected without a user prompt) ===",
    "This project runs on the maintenance harness. Complete the cold-start protocol (rule 13) BEFORE any work:",
    "1. The current handover (16.md) is inlined below — this is the project's current state. Treat it as read.",
    "2. Read prompt/maintenance/global/rules/README.md and use its decision tree to pick the task-specific rules; read them fully.",
    "3. Re-measure the baseline numbers in 16.md §5 (typecheck / tests / bug counts) — never transcribe them on trust; report any drift to the user first.",
    "4. Before design or judgment work: self-check against global/rules/common/judgment-mistakes-history.md.",
    "5. Wait for the user's GO before implementation (rule 12 wait-for-go).",
    "",
    "--- BEGIN prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md ---",
    handover,
    "--- END 16.md ---",
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
    "systemMessage": "🧭 Cold-start: 引き継ぎ書(16.md)+ bug index を自動読み込みしました",
}, ensure_ascii=False))
PY
