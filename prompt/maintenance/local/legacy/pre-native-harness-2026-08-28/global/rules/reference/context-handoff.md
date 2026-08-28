# Reference: Surviving context exhaustion — hand off to disk before the window closes

**Audience:** the session that is running out of context, and the one that wakes up after it.
**Companion to:** `common/13-session-recovery.md` (the cold-start side), `.claude/commands/close.md` (the end-of-session side).
**Established:** 2026-08-15, by user direction. *「コンテキストが枯渇しても、作業を継続できる仕組み。Claude が作業を継続できる仕組みだからこそ、他のプロジェクトでも活かせる。」*

---

## The thing this solves

A long session ends in one of two ways, and only one of them is planned.

| | Planned | Unplanned |
|---|---|---|
| What happens | `/close` runs: 16.md rewritten, session file written, change-log row added, commit | The context window fills. The harness compacts — or the session dies — **at a moment nobody chose** |
| What survives | Everything, in the shape the next session reads first | Whatever was already **on disk** |

Compaction is not a save. It is a lossy summary produced under pressure, and the parts it drops are the parts it judged least salient — which is not the same as least load-bearing. A measured number, the exact wording of a user's ruling, the one path you already ruled out: these are precisely the details that read as "detail".

**So the rule is: state that matters lives on disk, continuously — not in the conversation.** The conversation is a working buffer, not a record.

---

## What to do, and when

**Do not wait for a warning.** There is no reliable "you are about to compact" signal, and by the time the window is visibly tight, writing a good handover competes with the work for the same scarce space. Write early and keep writing.

Three moments, in order of importance:

1. **When a fact becomes load-bearing** — a measurement taken, a user ruling given, an approach ruled out, a defect confirmed. Write it to the artefact that owns it *now*: 16.md §2/§3 for state and decisions, the plan for scope, the case file for an incident, the runbook for a procedure. This is the same discipline as "file the case in the session where it happened" — the reason is identical, and the failure mode is identical: **deferred writing does not happen**.
2. **Before a long-running or high-risk operation** — a build, a real-fire, a delegation. If the session does not survive it, the next one should be able to tell what you were in the middle of and what state the world was left in.
3. **When the session has been long by any measure** — many tool calls, large outputs (screenshots and full-file reads are the heavy ones), or simply hours. Refresh 16.md §1/§2/§5 to the current reality even though you are not closing.

## What the next session does

Nothing special — that is the point. It runs the cold-start protocol (`13-session-recovery.md`): the SessionStart hook injects 16.md, and the session re-measures the baseline rather than trusting it. If the handover was kept current, "resume after compaction" and "resume tomorrow" are the same operation, and neither needs the conversation that produced them.

**After a compaction inside a live session, treat yourself as a cold start**: re-read 16.md and the artefacts your task names, and re-measure anything you are about to report. The summary you woke up holding is a claim about the session, subject to exactly the discipline a handover's claimed numbers are (`13-session-recovery.md` Step 4).

## What not to rely on

- **Your recollection of the conversation.** After compaction it is a summary of a summary. If it matters and it is not on disk, it is gone.
- **Scrollback.** The user can see it; you cannot, and it is not an artefact.
- **"I will write it at close."** The close may not happen. Two sibling projects abandoned this system with zero deferred lessons ever written down — the same mechanism, one level up.
- **A number you did not just measure.** Compaction preserves numbers happily and their provenance poorly. Re-measure before reporting (this is why every baseline row carries its command).

## Why this belongs in the template rather than in one project

Every project running a long-lived agent hits this, and the fix is not model-specific: it is the discipline of continuously externalising state into documents whose reading order is fixed. That is what the whole `prompt/maintenance/` layout is for — 16.md as current state, `sessions/` as immutable history, `改定log.md` as the index, the SessionStart hook as the guaranteed edge back in. **The harness is not documentation about the work; it is the mechanism that lets the work survive the reader being replaced.** A project that adopts only the rules and not this loop has adopted the advice without the thing that makes the advice reachable.
