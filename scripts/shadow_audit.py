#!/usr/bin/env python3
"""Shadow-audit v3 — classify the parent's actions inside a delegation window, scope-aware.

v1/v2 asked one question: did the parent use a tool while a delegation was open? Everything except
one hard-coded governance command counted as a violation. Measured 2026-08-25 (Phase 5), that gave
both errors at once:

  false positive — a status poll on the running worker plus a Read of the handover to check
    PRIMARY_OBJECTIVE produced verdict FAIL. Both are duties rule 22 §Delegation exclusivity and
    rule 24 §Harness and worker assign to the parent by name;
  false negative — a delegation dispatched to a subagent opened no window at all, so a parent
    running the worker's tests, grepping the worker's file and editing it scored 0 hits.

v3 classifies instead of counting, using the ordered decision in rule 22 §Delegation action
classification (executed independently by scripts/delegation-scenarios.py). The discriminator is
whose technical scope the action is inside and what it is for — never whether a tool was used.

Verdict classes emitted here (a subset of the rule's: this instrument sees the ACTIVE window, so
BOUNDED_REVIEW, ALLOWED_CLOSE_WORK and the worker-side returns are outside its reach — see LIMITS):
  GOVERNANCE              parent duty about the work, outside the delegated scope
  OUT_OF_DELEGATED_SCOPE  parent work that does not touch the delegated scope
  EXCEPTION_REPRODUCTION  a recorded EXCEPTION_TRIGGER block authorized it
  SHADOW_EXECUTION        the violation

Fail-closed, in three places, because each was a measured failure shape somewhere in this harness:
  * a window whose packet declares no scope is INSTRUMENT_ERROR, not a clean PASS (settled ruling
    "instruments fail closed on missing input" — a partial measurement is no number);
  * a tool this instrument does not know is SHADOW_EXECUTION, not governance;
  * a Bash command is SHADOW_EXECUTION unless it matches the governance allowlist or every path it
    names lies outside the declared scope. A test run names no path at all, and counting it as
    "no target, therefore harmless" is exactly the false negative above.

Usage: python3 scripts/shadow_audit.py <transcript.jsonl>
Exit:  0 = PASS / 1 = FAIL (>=1 SHADOW_EXECUTION) / 2 = INSTRUMENT_ERROR (nothing measured).
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import re
import sys
from pathlib import Path
from typing import Any


# A delegation window opens on any dispatch this project's roster can make (CLAUDE.md §7): the
# different-vendor lane over MCP, and Claude-lineage subagents. v2 knew only the first, which is
# where the false negative lived.
DISPATCH_TOOLS = {"mcp__codex__codex", "mcp__codex__codex-reply", "Agent"}

BACKGROUND_RE = re.compile(r"moved to the background as task ([A-Za-z0-9_-]+)", re.I)

# Rule 22 §Recording an exception trigger — the block the parent must write before reproducing.
EXCEPTION_RE = re.compile(r"^\s*EXCEPTION_TRIGGER:\s*$", re.M)

# Rule 22 §Delegation exclusivity — the packet's mandatory working state. `scope:` is what makes an
# overlap question answerable at all; without it this instrument refuses rather than guesses.
SCOPE_LINE_RE = re.compile(r"^\s*-?\s*scope:\s*(.+?)\s*$", re.M)
DELEGATED_STATE_RE = re.compile(r"DELEGATED_SCOPE_ACTIVE:")

# Tools whose whole purpose is watching or talking, never touching a repository. Rule 22 lists these
# duties by name; they are the parent's job while a delegation runs.
GOVERNANCE_TOOLS = {
    "TaskOutput", "TaskStop", "ListAgents", "SendMessage", "Monitor",
    "AskUserQuestion", "TodoWrite", "ScheduleWakeup",
}

# Tools that name a repository target directly.
PATH_INPUT_KEYS = ("file_path", "notebook_path", "path")

# Bash commands that are governance, not technical execution. Deliberately short and literal: an
# allowlist that grows by pattern stops being an allowlist.
GOVERNANCE_CMD_RES = [
    re.compile(r"^\s*git\s+(status|log|branch|remote|rev-list|rev-parse|stash list)\b"),
    re.compile(r"^\s*(ps|jobs|date|uptime)\b"),
    re.compile(
        r'''^find ~/\.codex/sessions -type f(?: -newermt "\$\(date \+%Y-%m-%d\)")?'''
        r''' \| xargs grep -ohE '"model":"\[\^"\]\+"' \| sort(?: -u| \| uniq -c)?\s*$'''
    ),
]

# A token in a Bash command that looks like a repository path.
PATH_TOKEN_RE = re.compile(r"(?<![\w-])((?:\./)?[\w./-]*/[\w./-]+|[\w-]+\.[a-zA-Z0-9]{1,5})(?![\w-])")


def flatten_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(flatten_text(item) for item in value)
    if isinstance(value, dict):
        if value.get("type") == "text" and isinstance(value.get("text"), str):
            return value["text"]
        return "\n".join(flatten_text(item) for item in value.values())
    return ""


def content_blocks(row: dict[str, Any]) -> list[dict[str, Any]]:
    message = row.get("message")
    if not isinstance(message, dict):
        return []
    content = message.get("content")
    if not isinstance(content, list):
        return []
    return [block for block in content if isinstance(block, dict)]


def row_text(row: dict[str, Any]) -> str:
    message = row.get("message")
    if not isinstance(message, dict):
        return ""
    return flatten_text(message.get("content"))


def receipt_text(row: dict[str, Any], tool_use_id: str) -> str | None:
    if row.get("type") != "user":
        return None
    for block in content_blocks(row):
        if block.get("type") == "tool_result" and block.get("tool_use_id") == tool_use_id:
            return flatten_text(block.get("content"))
    return None


def is_completion(row: dict[str, Any], task_id: str) -> bool:
    if row.get("type") != "user":
        return False
    message = row.get("message")
    if not isinstance(message, dict) or not isinstance(message.get("content"), str):
        return False
    text = message["content"]
    return (
        "<task-notification>" in text
        and f"<task-id>{task_id}</task-id>" in text
        and "<status>completed</status>" in text
    )


# --------------------------------------------------------------------------- scope
def declared_scope(block: dict[str, Any]) -> list[str]:
    """Scope entries from the dispatch packet's DELEGATED_SCOPE_ACTIVE block. Empty = undeclared."""
    tool_input = block.get("input")
    if not isinstance(tool_input, dict):
        return []
    text = "\n".join(v for v in tool_input.values() if isinstance(v, str))
    if not DELEGATED_STATE_RE.search(text):
        return []
    entries: list[str] = []
    for match in SCOPE_LINE_RE.finditer(text):
        for piece in re.split(r"[,\s]+", match.group(1)):
            piece = piece.strip().strip("`'\"")
            if piece:
                entries.append(normalize(piece))
    return entries


def normalize(path: str) -> str:
    path = path.strip().strip("`'\"")
    while path.startswith("./"):
        path = path[2:]
    return path.rstrip("/")


def path_overlaps(target: str, scope: list[str]) -> bool:
    target = normalize(target)
    for entry in scope:
        if not entry:
            continue
        if fnmatch.fnmatch(target, entry) or fnmatch.fnmatch(target, entry + "/*"):
            return True
        if target == entry or target.startswith(entry + "/"):
            return True
        # A scope entry may itself be a glob standing for a family of files.
        if fnmatch.fnmatch(entry, target + "/*"):
            return True
    return False


# ------------------------------------------------------------------ action classification
def action_targets(block: dict[str, Any]) -> list[str]:
    tool_input = block.get("input")
    if not isinstance(tool_input, dict):
        return []
    out = []
    for key in PATH_INPUT_KEYS:
        value = tool_input.get(key)
        if isinstance(value, str) and value:
            out.append(value)
    return out


def bash_path_tokens(command: str) -> list[str]:
    return [m.group(1) for m in PATH_TOKEN_RE.finditer(command)]


def classify(block: dict[str, Any], scope: list[str], exception_open: bool) -> tuple[str, str]:
    """Return (class, reason). `scope` is non-empty (undeclared windows never reach here)."""
    name = block.get("name")
    tool_input = block.get("input") if isinstance(block.get("input"), dict) else {}

    if name == "Bash":
        command = tool_input.get("command", "")
        if not isinstance(command, str):
            return ("SHADOW_EXECUTION", "Bash block carries no readable command")
        for rx in GOVERNANCE_CMD_RES:
            if rx.match(command):
                return ("GOVERNANCE", "governance command allowlist")
        tokens = bash_path_tokens(command)
        if not tokens:
            if exception_open:
                return ("EXCEPTION_REPRODUCTION", "recorded EXCEPTION_TRIGGER")
            return ("SHADOW_EXECUTION",
                    "command names no path and is not governance — a test or build run inside the "
                    "worker's window is technical execution, not an absence of a target")
        if any(path_overlaps(t, scope) for t in tokens):
            if exception_open:
                return ("EXCEPTION_REPRODUCTION", "recorded EXCEPTION_TRIGGER")
            return ("SHADOW_EXECUTION", "command names a path inside the delegated scope")
        return ("OUT_OF_DELEGATED_SCOPE", "every path it names lies outside the delegated scope")

    targets = action_targets(block)
    if any(path_overlaps(t, scope) for t in targets):
        if exception_open:
            return ("EXCEPTION_REPRODUCTION", "recorded EXCEPTION_TRIGGER")
        return ("SHADOW_EXECUTION", "target inside the delegated scope")

    if name in GOVERNANCE_TOOLS:
        return ("GOVERNANCE", "watch / escalate / talk tool, no repository target")

    if targets:
        return ("OUT_OF_DELEGATED_SCOPE", "target outside the delegated scope")

    if exception_open:
        return ("EXCEPTION_REPRODUCTION", "recorded EXCEPTION_TRIGGER")
    return ("SHADOW_EXECUTION",
            "tool %r is not in the governance set and names no target — unknown actions fail closed"
            % name)


CLASSES = ("GOVERNANCE", "OUT_OF_DELEGATED_SCOPE", "EXCEPTION_REPRODUCTION", "SHADOW_EXECUTION")


def emit(windows: int, scoped: int, actions: int, counts: dict[str, int], verdict: str) -> None:
    print("SHADOW_AUDIT: v3")
    print(f"delegated_windows: {windows}")
    print(f"scope_declared_windows: {scoped}")
    print(f"parent_actions_in_window: {actions}")
    for cls in CLASSES:
        print(f"{cls.lower()}: {counts.get(cls, 0)}")
    print(f"parent_same_scope_exec: {counts.get('SHADOW_EXECUTION', 0)}")
    print(f"verdict: {verdict}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Shadow-audit v3")
    parser.add_argument("transcript", type=Path, help="Claude session transcript JSONL")
    parser.add_argument("--detail", action="store_true", help="print one line per classified action")
    args = parser.parse_args()

    empty = {c: 0 for c in CLASSES}
    try:
        with args.transcript.open(encoding="utf-8") as handle:
            rows = [json.loads(line) for line in handle if line.strip()]
    except (OSError, json.JSONDecodeError) as exc:
        emit(0, 0, 0, empty, "INSTRUMENT_ERROR")
        print(f"shadow-audit: {exc}", file=sys.stderr)
        return 2

    dispatches: list[tuple[int, str, list[str]]] = []
    for row_index, row in enumerate(rows):
        if not isinstance(row, dict) or row.get("type") != "assistant":
            continue
        for block in content_blocks(row):
            if block.get("type") != "tool_use" or block.get("name") not in DISPATCH_TOOLS:
                continue
            tool_use_id = block.get("id")
            if isinstance(tool_use_id, str) and tool_use_id:
                dispatches.append((row_index, tool_use_id, declared_scope(block)))
            else:
                emit(len(dispatches) + 1, 0, 0, empty, "INSTRUMENT_ERROR")
                print("shadow-audit: dispatch has no tool_use id", file=sys.stderr)
                return 2

    resolved: list[tuple[int, int, list[str]]] = []
    errors: list[str] = []
    for dispatch_index, tool_use_id, scope in dispatches:
        receipt_index = None
        receipt = None
        for row_index in range(dispatch_index + 1, len(rows)):
            candidate = receipt_text(rows[row_index], tool_use_id)
            if candidate is not None:
                receipt_index = row_index
                receipt = candidate
                break
        if receipt_index is None or receipt is None:
            errors.append(f"dispatch {tool_use_id}: tool_result receipt not found")
            continue

        task_match = BACKGROUND_RE.search(receipt)
        if task_match is None:
            if "still running" in receipt or "moved to the background" in receipt:
                errors.append(f"dispatch {tool_use_id}: background task id not found in receipt")
                continue
            resolved.append((dispatch_index, receipt_index, scope))
            continue
        task_id = task_match.group(1)
        completion_index = None
        for row_index in range(receipt_index + 1, len(rows)):
            if is_completion(rows[row_index], task_id):
                completion_index = row_index
                break
        if completion_index is None:
            errors.append(f"dispatch {tool_use_id}: completion notification for task {task_id} not found")
            continue
        resolved.append((dispatch_index, completion_index, scope))

    undeclared = [i for i, (_s, _e, scope) in enumerate(resolved) if not scope]
    counts: dict[str, int] = {c: 0 for c in CLASSES}
    seen: set[str] = set()
    detail: list[str] = []

    for start, end, scope in resolved:
        if not scope:
            continue
        exception_open = False
        for row_index in range(start, end + 1):
            row = rows[row_index]
            if not isinstance(row, dict) or row.get("type") != "assistant":
                continue
            if EXCEPTION_RE.search(row_text(row)):
                exception_open = True
            for block_index, block in enumerate(content_blocks(row)):
                if block.get("type") != "tool_use" or block.get("name") in DISPATCH_TOOLS:
                    continue
                block_id = block.get("id")
                key = block_id if isinstance(block_id, str) else f"{row_index}:{block_index}"
                if key in seen:
                    continue
                seen.add(key)
                cls, reason = classify(block, scope, exception_open)
                counts[cls] += 1
                detail.append(f"  {cls:<22} {block.get('name')} [{key}] — {reason}")

    scoped = len(resolved) - len(undeclared)

    if errors or undeclared:
        emit(len(dispatches), scoped, len(seen), counts, "INSTRUMENT_ERROR")
        for error in errors:
            print(f"shadow-audit: {error}", file=sys.stderr)
        if undeclared:
            print(
                f"shadow-audit: {len(undeclared)} delegation window(s) declare no DELEGATED_SCOPE_ACTIVE "
                "scope — overlap is unanswerable, and a guess would be a number rather than a measurement "
                "(rule 22 §Delegation exclusivity requires the block at dispatch)",
                file=sys.stderr,
            )
        if args.detail:
            print("\n".join(detail), file=sys.stderr)
        return 2

    if args.detail:
        print("\n".join(detail), file=sys.stderr)

    verdict = "FAIL" if counts["SHADOW_EXECUTION"] else "PASS"
    emit(len(dispatches), scoped, len(seen), counts, verdict)
    print("LIMITS: this reads tool records inside ACTIVE delegation windows. It cannot see reasoning "
          "that never reached a tool call, duplicate work done outside this transcript, or whether a "
          "post-window read stayed inside what the worker submitted (that is BOUNDED_REVIEW, judged "
          "by scripts/delegation-scenarios.py, not here). shadow_execution: 0 means no recorded "
          "in-window action was classified as duplicate — never that the parent thought about "
          "nothing.", file=sys.stderr)
    return 1 if counts["SHADOW_EXECUTION"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
