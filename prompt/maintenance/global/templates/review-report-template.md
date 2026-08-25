<!-- review-report-template.md — the REVIEWER session's baton (rule 22 §Review-report baton).
     Instance location: prompt/maintenance/local/reviews/YYYY-MM-DD_review-{reviewed-session-id}.md
     (committed — review records are audit records; 2026-08-18 user ruling).
     All five sections are required. A section with nothing to report says so explicitly
     ("none found" is a measured result; an absent section is an unmeasured one).
     Reached from: rules/README.md decision tree ("SESSION_ROLE: REVIEWER" row). -->

# Review report — {reviewed-session-id} ({YYYY-MM-DD})

**Reviewer session:** S{NNN} (`SESSION_ROLE: REVIEWER`, model per roster)
**Reviewed session:** S{NNN} (the immediately preceding PRIMARY)

## §1. Target commit range

`{oldest-commit}..{newest-commit}` — obtained via `git log --oneline` this session, not from the
handover. List every commit in range with one line each. Note any uncommitted / untracked files
observed (`git status --porcelain`) — they are part of the reviewed state.

## §2. Claim-verify table (every claim, not a sample)

Verify each claim the PRIMARY session made (16.md §1/§5, its session file, its close report)
against the artifact. Full enumeration — a sampled subset is reported as a sample with its
denominator, never as the table.

| # | Claim (source: file/§) | Verify method (command or file:line actually read) | Result |
|---|---|---|---|
| 1 | | | ✅ verified / ❌ diverges (state both values) / ⚠️ 未verify (why) |

## §3. Findings (severity-labeled, state-separated wording)

State separation is mandatory: write "criteria PASS / acceptance OPEN", "claimed X / measured Y" —
never a bare completion or acceptance word (rule 04 §Completion words are state transitions).

| # | Sev | Finding | Evidence (file:line / command output) | State |
|---|---|---|---|---|
| 1 | 🔴/🟡/🟢 | | | e.g. claimed green / measured red |

## §4. Adjudication candidates (裁定候補 — out of scope, listed, never implemented)

Findings outside the reviewed session's enumerated scope. The REVIEWER does not implement or
recommend-by-default; each row is a question for the Human.

| # | Candidate | Why out of scope | Decision needed from |
|---|---|---|---|
| 1 | | | User |

## §5. Independent re-measurements

Re-run the gates yourself; transcribing the PRIMARY's numbers is forbidden (rule 13 Step 4).
Each row: the command as run, RC captured on its own line, and both values where they diverge.

| Gate | Command (as run this session) | Observed | PRIMARY claimed | Δ |
|---|---|---|---|---|
| selftest | `bash scripts/selftest.sh; RC=$?` | | | |
| read-load | `bash scripts/read-load.sh` | | | |
| tests / typecheck | (project gates) | | | |

---

At close: add the 16.md §2 baton row
`| n | **Review complete — fixes pending** (report: local/reviews/{this-file}; findings 🔴x/🟡y/🟢z) | next PRIMARY | report read at start | 🔴 |`
and commit only this report + that row + close artifacts (rule 22 §Session role).
