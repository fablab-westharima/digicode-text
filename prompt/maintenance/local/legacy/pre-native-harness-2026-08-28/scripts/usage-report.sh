#!/bin/bash
# AI USAGE REPORT — per-actor model usage for the closing session (close.md step 1 runs this;
# the table lands in the close report). Unit: tokens — emitted by this script on the table
# header, and no consumer restates it (rule 04 §A gauge reports its unit / selftest B10 doctrine).
#
# Sources (all measured at run time, never transcribed):
#   parent    : the session transcript JSONL under ~/.claude/projects/<sanitized-cwd>/
#               (newest *.jsonl by default = the session currently being closed; override $UR_SESSION).
#               Usage lines are deduplicated by message.id (one API call emits several content-block
#               lines carrying the same id and usage — measured: 346 lines / 140 unique ids, S006).
#   subagents : <session-dir>/subagents/agent-*.jsonl (+ .meta.json for the agent type). Same
#               schema as the parent; per-turn message.model is authoritative (plan 03 M15 probe).
#   codex     : ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl whose session_meta.cwd == this repo
#               and whose mtime falls inside the session window. Granularity = THREAD-CUMULATIVE
#               (last token_count event's total_token_usage) — per-call splits are not recorded
#               by the rollout format; call counts come from the parent transcript's tool_use lines.
#
# Coverage limits are printed in the output footer, because an accounting that is silent about
# what it cannot see reads as complete (PT-15: unopened ≠ unobeyed; state the proxy's direction).
#
# Fail-closed: a missing transcript directory prints NOT OBTAINED and exits 3 (context-brief.sh
# convention) — zeros are never fabricated for an unmeasured source.
#
# Env overrides (for selftest fixtures and non-default layouts):
#   UR_PROJ_DIR   directory holding the session JSONLs   (default: ~/.claude/projects/<sanitized-cwd>)
#   UR_SESSION    explicit session JSONL path            (default: newest *.jsonl in UR_PROJ_DIR)
#   UR_CODEX_DIR  Codex rollout root                     (default: ~/.codex/sessions)
#   UR_REPO       repo path matched against rollout cwd  (default: git toplevel, else pwd)
set -u

REPO="${UR_REPO:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
SAN="$(printf '%s' "$REPO" | sed 's/[^A-Za-z0-9]/-/g')"
PROJ_DIR="${UR_PROJ_DIR:-$HOME/.claude/projects/$SAN}"
CODEX_DIR="${UR_CODEX_DIR:-$HOME/.codex/sessions}"

if [ -n "${UR_SESSION:-}" ]; then
  SESSION="$UR_SESSION"
else
  SESSION="$(ls -t "$PROJ_DIR"/*.jsonl 2>/dev/null | head -1)"
fi
if [ -z "${SESSION:-}" ] || [ ! -f "$SESSION" ]; then
  echo "NOT OBTAINED: parent transcript (looked in: $PROJ_DIR)"
  echo "No usage is reported for a source that was not measured."
  exit 3
fi

SESSION="$SESSION" CODEX_DIR="$CODEX_DIR" REPO="$REPO" python3 - <<'PYEOF'
import glob, json, os, sys

session = os.environ["SESSION"]
codex_dir = os.environ["CODEX_DIR"]
repo = os.environ["REPO"]
sess_dir = os.path.splitext(session)[0]

def agg_jsonl(path):
    """Aggregate one Claude transcript: per-model usage deduped by message.id, plus tool counts."""
    by_id = {}          # message.id -> (model, usage)  — keep last occurrence
    tools = {}
    first_ts = None
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                d = json.loads(line)
            except Exception:
                continue
            ts = d.get("timestamp")
            if ts and (first_ts is None or ts < first_ts):
                first_ts = ts
            if d.get("type") != "assistant":
                continue
            m = d.get("message") or {}
            model = m.get("model")
            u = m.get("usage")
            if u and model and model != "<synthetic>":
                by_id[m.get("id")] = (model, u)
            content = m.get("content")
            if isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get("type") == "tool_use":
                        tools[c.get("name")] = tools.get(c.get("name"), 0) + 1
    per_model = {}
    for model, u in by_id.values():
        r = per_model.setdefault(model, dict(turns=0, inp=0, cw=0, cr=0, out=0))
        r["turns"] += 1
        r["inp"] += u.get("input_tokens", 0) or 0
        r["cw"]  += u.get("cache_creation_input_tokens", 0) or 0
        r["cr"]  += u.get("cache_read_input_tokens", 0) or 0
        r["out"] += u.get("output_tokens", 0) or 0
    return per_model, tools, first_ts

parent, tools, first_ts = agg_jsonl(session)

# --- subagents ---
sub_rows = []
for aj in sorted(glob.glob(os.path.join(sess_dir, "subagents", "agent-*.jsonl"))):
    meta = {}
    mp = aj[:-6] + ".meta.json"
    if os.path.isfile(mp):
        try:
            meta = json.load(open(mp))
        except Exception:
            meta = {}
    pm, _, _ = agg_jsonl(aj)
    label = meta.get("agentType", "subagent")
    aid = os.path.basename(aj)[:-6]
    for model, r in pm.items():
        sub_rows.append((f"subagent:{label} ({aid})", model, r))

# --- codex threads: cwd match + inside the session window (mtime >= first parent timestamp) ---
import datetime
start_epoch = None
if first_ts:
    try:
        start_epoch = datetime.datetime.fromisoformat(first_ts.replace("Z", "+00:00")).timestamp()
    except Exception:
        start_epoch = None
codex_rows = []
for rf in sorted(glob.glob(os.path.join(codex_dir, "*", "*", "*", "rollout-*.jsonl"))):
    if start_epoch and os.path.getmtime(rf) < start_epoch:
        continue
    cwd = model = None
    last_usage = None
    try:
        with open(rf, encoding="utf-8", errors="replace") as f:
            for line in f:
                if cwd is None and '"session_meta"' in line:
                    try:
                        cwd = (json.loads(line).get("payload") or {}).get("cwd")
                    except Exception:
                        pass
                    if cwd is not None and cwd != repo:
                        break
                if '"model"' in line and model is None:
                    try:
                        d = json.loads(line)
                        p = d.get("payload") or {}
                        model = p.get("model") or (p.get("turn_context") or {}).get("model")
                    except Exception:
                        pass
                if '"total_token_usage"' in line:
                    try:
                        info = ((json.loads(line).get("payload") or {}).get("info") or {})
                        last_usage = info.get("total_token_usage") or last_usage
                    except Exception:
                        pass
    except OSError:
        continue
    if cwd == repo and last_usage:
        tid = os.path.basename(rf).replace("rollout-", "").replace(".jsonl", "")[-12:]
        codex_rows.append((tid, model or "[unrecorded]", last_usage))

codex_calls = sum(n for name, n in tools.items() if name.startswith("mcp__codex__"))
agent_calls = tools.get("Agent", 0) + tools.get("Task", 0)

print(f"## AI USAGE REPORT (unit: tokens; measured from transcripts, not recalled)")
print(f"session transcript: `{os.path.basename(session)}`")
print()
print("| actor | model | turns/calls | input | cache_write | cache_read | output |")
print("|---|---|---|---|---|---|---|")
for model, r in sorted(parent.items()):
    print(f"| parent | {model} | {r['turns']} | {r['inp']} | {r['cw']} | {r['cr']} | {r['out']} |")
for label, model, r in sub_rows:
    print(f"| {label} | {model} | {r['turns']} | {r['inp']} | {r['cw']} | {r['cr']} | {r['out']} |")
for tid, model, u in codex_rows:
    print(f"| codex thread …{tid} | {model} | thread-cumulative | {u.get('input_tokens',0)} "
          f"(cached {u.get('cached_input_tokens',0)}) | {u.get('cache_write_input_tokens',0)} | — | "
          f"{u.get('output_tokens',0)} (reasoning {u.get('reasoning_output_tokens',0)}) |")
if not parent:
    print("| parent | [no usage lines found] | 0 | 0 | 0 | 0 | 0 |")
print()
print(f"parent-side delegation calls this session: codex tool calls = {codex_calls}, "
      f"subagent spawns = {agent_calls}")
print("coverage: Codex tokens are THREAD-CUMULATIVE (the rollout records no per-call split); "
      "codex threads are matched by repo cwd + session window, so a concurrent same-repo session's "
      "threads would be included — thread ids above make that auditable. Route B (browser ChatGPT) "
      "leaves no local usage log: NOT OBTAINED, never zero. Subscription quota is user-observed "
      "in the vendor UI, never derived from these numbers (plan 03 §9b).")
PYEOF
