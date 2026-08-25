# Rule: <short name>

**Severity:** ★★★★★ / ★★★★ / ★★★ (frequency × pain if violated)
**Scope:** common | {{PROJECT_SLUG}}
**Last reviewed:** YYYY-MM-DD
**Related memory:** <memory file names, if any>
**Related cases:** BUG-XXX / plan NN / kaitei-log Session N / judgment-mistakes case N

## TL;DR

1-3 lines, copy-pasteable rule statement. Read this first when scanning.

## Why this exists

Past failure cases. Be specific (BUG IDs, commits, session numbers). A rule without a real incident behind it is a guess — prefer promoting from `judgment-mistakes-history.md` cases or closed bugs.

## When to apply

Trigger conditions. Be concrete — list grep commands, file patterns, task types. This is what the decision tree row in `rules/README.md` will point to (add that row in the same commit).

## How to apply

Step-by-step. Code examples / commands preferred over prose.

## Anti-patterns

What violations look like, with bad/good pairs.

## Related rules

Cross-refs to other files in this directory (and back-refs from them — cross-reference both ways).

<!--
Checklist when adding a rule (delete this comment in the real file):
1. Save under global/rules/common/ (cross-project) or local/rules/{{PROJECT_SLUG}}/ (project-specific) — rule 15 decision tree.
2. Add a decision-tree row in global/rules/README.md.
3. Cross-reference related rules / cases both ways.
4. Record the addition in local/handover/改定log.md (and CLAUDE.md §conventions table if project-specific).
-->
