#!/bin/bash
# PreToolUse gate — runs a gitleaks staged-scan automatically before any `git commit` / `git push`.
#
# Origin: DigiCode local rule 14 (security-pre-commit) requires gitleaks before every commit/push,
# with "No self-exceptions". A rule that relies on Claude remembering it fails exactly when
# discipline fails — this hook makes forgetting structurally impossible. trufflehog stays manual
# (too slow for a per-commit hook): run it at /close or before publishing anything.
#
# Behavior:
#   - non-git commands: instant pass-through (exit 0, no output)
#   - gitleaks missing: allow with a warning (install it; mandatory for public repos)
#   - staged scan clean: allow with a one-line confirmation
#   - findings: DENY the tool call, feed the redacted findings back to Claude
#     (false positives → add fingerprints to .gitleaksignore, then retry)
set -u
payload="$(cat 2>/dev/null || true)"
cmd="$(printf '%s' "$payload" | python3 -c '
import json, sys
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("command", ""))
except Exception:
    print("")
' 2>/dev/null || true)"
case "$cmd" in
  *"git commit"*|*"git push"*) : ;;
  *) exit 0 ;;
esac

if ! command -v gitleaks >/dev/null 2>&1; then
  printf '{"systemMessage":"⚠️ pre-commit gate: gitleaks 未インストールのためスキャンなしで通過(公開リポジトリでは brew install gitleaks が必須)"}'
  exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$ROOT" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

out="$(gitleaks protect --staged --redact --no-banner 2>&1)"
rc=$?
if [ "$rc" -eq 0 ]; then
  printf '{"systemMessage":"🔒 pre-commit gate: gitleaks staged scan クリーン — 通過"}'
  exit 0
fi

export GATE_OUT="$out" GATE_RC="$rc"
python3 <<'PY'
import json, os
rc = os.environ.get("GATE_RC", "?")
out = os.environ.get("GATE_OUT", "")
tail = "\n".join(out.splitlines()[-25:])
if rc == "1":
    reason = (
        "pre-commit gate BLOCKED: gitleaks found potential secrets in the staged changes "
        "(security-pre-commit rule, no self-exceptions). Redacted findings below. "
        "Resolve them, or if confirmed false positives with the user, add their fingerprints "
        "to .gitleaksignore and retry.\n" + tail
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        },
        "systemMessage": "🚫 pre-commit gate: gitleaks が staged 変更に検出あり — commit をブロックしました",
    }, ensure_ascii=False))
else:
    print(json.dumps({
        "systemMessage": f"⚠️ pre-commit gate: gitleaks がエラー終了(rc={rc})のため通過。手動確認推奨: {tail[:200]}",
    }, ensure_ascii=False))
PY
exit 0
