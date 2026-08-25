# Rule: Meta-Docs Organization — 2-Layer Structure (global/ + local/) + Root-Forbidden Discipline

> **Origin: DigiCode (2024–2026).** This rule was battle-tested on a real project; the incidents cited (BUG-XXX / Session NNN / case N) are preserved verbatim as reference lessons — real failures carry a weight hypotheticals don't. When applying in your project: treat origin-specific paths, URLs, commands, and stack names as worked examples and substitute your own; append your project's cases below the originals — never delete them.

**Severity:** ★★★★ (every session can drop a file in the wrong place; left unchecked, the meta-docs root accumulates dozens of orphan files within weeks, breaking the cold-start protocol)
**Scope:** common (cross-project transferable — applies wherever a project keeps a meta-docs area such as `prompt/maintenance/`, `docs/internal/`, `.project/`, or equivalent)
**Last reviewed:** 2026-05-11
**Related memory:** `quality_over_tokens`, `wait_for_go`, `investigation_incomplete_assumption`
**Related cases:** DigiCode Task 3-B incident — `prompt/maintenance/` root grew from 16 files to 54 files in ~3 weeks because no placement rule existed; cold-start protocol degraded into "skim 54 unrelated files to find what's relevant"

---

## TL;DR

1. **The meta-docs area has exactly 2 layers**: `global/` (cross-project transferable: rules, templates, empty structure) and `local/` (project-specific work products: handover, plans, bugs, investigations, docs). No third layer.
2. **No file may be created at the meta-docs root.** Every new file goes into a `global/<subfolder>/` or `local/<subfolder>/` matching its purpose. Root-level creation is the failure mode this rule defeats.
3. **Decision tree for new files**: Is the file's *content* useful in another project as-is? → `global/`. Otherwise → `local/`. When unsure, default to `local/` (a file misplaced as project-local is recoverable; one misplaced as global pollutes future projects).
4. **New project bootstrap**: Copy `global/` wholesale (rules + templates + empty subfolder skeleton). Start `local/` empty. The assistant's persistent memory (`userMemories`, `MEMORY.md`, equivalent) syncs the same `global/rules/common/*` content so the discipline travels with the assistant role, not just the file tree.

---

## Why this exists

Without a placement rule, the meta-docs root becomes a dumping ground:

- **Session-boundary forgetfulness** — each new assistant session has no memory of "where things go." A file that was logically a plan, a bug report, or an investigation gets dropped at the root because the assistant defaults to "next to other recent files." Three weeks of that = ~50 orphan files.
- **Cold-start degradation** — the cold-start protocol (`13-session-recovery.md`) requires the assistant to read the rules + handover before working. When the root is full of mixed-purpose files, "find the handover" becomes a needle-in-haystack search, and the assistant skims instead of reading. Skimming was the trap that produced this project's worst incidents (cases 14 / 15 / 16 / 17 / 18 in `judgment-mistakes-history.md`).
- **Cross-project drift** — without a `global/` vs `local/` separation, project-specific decisions (e.g., a particular CI quirk, a vendor-specific deploy step) leak into rule files and contaminate other projects when the rules are copied. The `global/` boundary is the firewall.
- **Phase-plan churn** — completed plans and active plans pile up together; the cold-start assistant can't tell what is current work vs historical reference, and re-litigates settled decisions.

The 2-layer structure forces every file to declare its lifetime (transferable vs project-only) and its category (rule, plan, bug, handover, etc.) at creation time. The discipline is upstream — placing the file correctly costs ~5 seconds; cleaning up after weeks of misplacement costs hours of file-by-file judgment.

---

## When to apply

- Creating any new file in the project's meta-docs area (e.g., `prompt/maintenance/` for DigiCode, but the rule applies wherever such an area exists).
- Resuming a session and noticing a file at the meta-docs root that wasn't there before (someone violated the rule; flag it and propose relocation).
- Bootstrapping a new project — `global/` copied verbatim, `local/` initialized empty.
- Reviewing a pull request that touches the meta-docs area.

---

## How to apply

### Layer definitions

```
<meta-docs root>/
├── global/                          ← Cross-project transferable. Copy wholesale to new projects.
│   ├── rules/common/                ← Generic rules (this file, investigation, design-principles, etc.)
│   ├── rules/reference/             ← Cross-project lookup tables (known pitfalls, phase patterns, etc.)
│   ├── templates/                   ← Templates for project-specific files (bug report, plan, etc.)
│   ├── bugs/active/                 ← Empty skeleton folder (.gitkeep)
│   ├── bugs/closed/                 ← Empty skeleton folder
│   ├── handover/                    ← Empty skeleton folder
│   ├── plans/active/                ← Empty skeleton folder
│   ├── plans/completed/             ← Empty skeleton folder
│   ├── investigations/              ← Empty skeleton folder
│   ├── docs/                        ← Empty skeleton folder
│   └── legacy/                      ← Empty skeleton folder (for retired-but-preserved content)
│
└── local/                           ← Project-specific. Never copied to other projects.
    ├── rules/<project>/             ← Project-specific rules (e.g., rules/digicode/)
    ├── docs/                        ← System overview, deploy procedures, troubleshooting
    ├── handover/                    ← Session handover docs, change logs
    ├── bugs/active/                 ← Open bugs (one .md per bug + index.md)
    ├── bugs/closed/                 ← Resolved bugs (history, never delete)
    ├── plans/active/                ← In-progress plan documents
    ├── plans/completed/             ← Finished plans (archive value, reference for similar future work)
    ├── investigations/              ← Audit reports, ad-hoc research, post-mortems that aren't bugs or plans
    └── legacy/                      ← Retired content kept for historical reference (rules superseded by newer rules, deprecated specs)
```

### Decision tree — placing a new file

1. **Is this content useful in another project as-is?** (Without project-specific names, paths, or deploy details.)
   - **Yes** → `global/`. Pick the subfolder by category (rules, templates, etc.).
   - **No** → `local/`. Continue.
2. **What category does this file belong to?**

| Content type | Target subfolder |
|---|---|
| Generic rule applicable to many projects | `global/rules/common/` |
| Project-specific rule (this codebase only) | `local/rules/<project>/` |
| Cross-project lookup table | `global/rules/reference/` |
| Reusable file template (e.g., bug report skeleton) | `global/templates/` |
| Currently-in-progress plan | `local/plans/active/` |
| Finished plan (kept as reference) | `local/plans/completed/` |
| Open bug report | `local/bugs/active/` |
| Resolved bug report | `local/bugs/closed/` |
| Session handover, change log | `local/handover/` |
| Audit report, post-mortem, research note | `local/investigations/` |
| System overview, deploy guide, troubleshooting reference | `local/docs/` |
| Superseded but preserved (rules migrated to new format, retired specs) | `local/legacy/` |

3. **If still unsure, choose `local/`.** A file misplaced as `local/` is a one-line `git mv` to fix. A file misplaced as `global/` pollutes every future project that copies `global/`. Bias toward conservatism on the `global/` boundary.

### Forbidden locations

- **The meta-docs root** (`<root>/<file>.md` with no subfolder). The only files allowed at the root are top-level navigational files such as a project-wide `CLAUDE.md` equivalent, if the project's convention places it there. Even then, prefer pushing it down into `global/` or `local/` with a thin pointer at the root.
- **Directly under `global/` or `local/`** (without a category subfolder). Every file lives in a category-named subfolder (`global/rules/common/`, `local/plans/active/`, etc.).
- **Inventing new top-level subfolders without updating this rule.** If a new category seems needed (e.g., `local/release-notes/`), update this rule first, then create the folder. The 2-layer structure is the contract; invisible drift defeats the discipline.

**The navigational exception, stated so a guard can apply it** (2026-08-25, Phase 7 — written down, not newly permitted: the tree has always carried `local/README.md` and the project's own instruction file designates it as the layout standard): a **layer root** may hold `README.md` and nothing else, and only while the project's top-level instruction file cites that exact path. An arbitrary `README.md` dropped at a layer root does not inherit the exception, and a second file never does. State it this narrowly because the alternative readings both fail — a blanket "READMEs are fine" reopens the root as a dumping ground, and no exception at all makes the rule disagree with every tree that has ever used it.

**This section is executable.** `scripts/placement-scan.sh` enforces all four clauses above, and it **parses the allowed category set out of §Layer definitions** rather than carrying its own copy — so the scan cannot drift from this rule without the parse failing, and it refuses (exit 2) rather than scanning against an empty allow-set. *Enforced: selftest B67, with a must-flag and a must-not-flag denominator; detection power: mutation family M12.* Until 2026-08-25 this contract was written in three places and enforced in none: a file created directly under `local/` passed all 74 checks green, and what caught it was a human-ordered close step (16.md §2 baton #35).

### Sub-folder organization within categories

Within a category subfolder, prefer **flat** layout for typical cases. Introduce a sub-sub-folder only when a single topic needs multiple co-located files:

```
local/plans/active/
├── 35_AI-expansion.md                                ← single-file plan, flat
├── 42_LS-integration/                                ← multi-file plan: main + checklist
│   ├── main.md
│   └── Phase-A-checklist.md
└── HA-implementation/                                ← multi-file plan: spec + history + final
    ├── 01_initial-proposal.md
    ├── 02_review-history.md
    └── 03_final-spec.md
```

The threshold for promoting to a sub-folder: **2+ files belong together AND removing one breaks the others' context**. If files are merely on the same topic but read independently, keep them flat with a shared name prefix.

### Naming conventions (within a subfolder)

- **Number prefix optional but common** for sequence-significant content (`35_*.md`, `01_*.md`). Use it when reading order matters; omit when topic-search beats sequence.
- **Date prefix** (`2026-05-04_*.md`) for snapshot-in-time content (audits, session reports, investigations). Avoid date prefix on plans/rules where the topic is the primary identifier.
- **Topic-based name** (`AI-expansion.md`, `compile-infra-redesign.md`) — short, hyphen-separated, English-clean for searchability.
- Avoid full-width parens, special characters, spaces in filenames (cross-platform compatibility).

### New project bootstrap

When starting a new project that uses this discipline:

1. Copy `global/` from the source project into the new project's meta-docs area (verbatim, no edits).
2. Initialize `local/` with empty category subfolders matching the `global/` skeleton (the `.gitkeep` files in `global/` already document the expected layout).
3. Sync the assistant's persistent memory (`userMemories` for ClaudeDesktop, `MEMORY.md` for Claude Code, equivalent) with a project-memory entry pointing at this rule.
4. Initialize `local/handover/` with the project's first session handover doc (typically by reading this rule first).

The new project starts with the discipline intact; root-level dumping is impossible because the assistant reads `global/rules/common/15-docs-organization.md` (or equivalent path) on cold-start and sees the layout immediately.

### Sync with assistant persistent memory

This rule lives in two places by design:

- **The rule file** (`global/rules/common/15-docs-organization.md`, this file).
- **The assistant's persistent memory** for the project (a brief pointer like "see global/rules/common/15-docs-organization.md for meta-docs layout; root-level creation forbidden").

The duplication is intentional: the rule file is the source of truth, the memory entry is a pointer that prevents the assistant from creating a file at the root before reading the rule. **When the rule changes, update both** — same atomic commit if possible, otherwise back-to-back commits with cross-references.

If the memory and the rule conflict, the rule wins (per `rules/README.md` "Memory vs Rules" — memory is point-in-time, rules are durable).

### Cold-start interaction

`13-session-recovery.md` Step 1 (mandatory rules read) includes this rule's index entry. On cold-start:

1. The assistant reads `rules/README.md` decision tree.
2. The decision tree points to this rule for "new file placement" / "meta-docs organization."
3. The assistant reads this rule and sees the 2-layer structure.
4. Subsequent file creation in the session uses the decision tree above.

If the cold-start assistant finds files at the meta-docs root that it didn't create, **flag them** in the sanity-check report (`13-session-recovery.md` Step 4) as a discipline violation requiring relocation, not as new state to absorb.

---

## Anti-patterns

### ❌ Dropping a file at the meta-docs root

```
prompt/maintenance/
├── 16_handover.md
├── 35_AI-expansion-plan.md
├── 36_round3-debug.md
├── new-investigation.md           ← BAD: where does this go?
├── HA-blocks-survey.md            ← BAD: investigation? plan? doc?
├── ...
└── 50+ more files at root
```

Defense: forbid root-level creation. Every new file gets a category subfolder before it's named.

### ❌ Putting project-specific content in `global/`

```
global/rules/common/
├── 03-coding.md
└── 16-deploy-to-cloudflare.md     ← BAD: Cloudflare-specific, doesn't transfer
```

`16-deploy-to-cloudflare.md` belongs in `local/rules/<project>/` because it carries vendor specifics. The `global/` boundary is the firewall against project pollution.

Defense: when drafting a `global/` rule, ask: "If I were writing this for a project that uses GCP / AWS / on-prem, would the rule still apply with minor adaptation?" If no, it's `local/`.

### ❌ Inventing new top-level subfolders silently

```
local/
├── docs/
├── handover/
├── plans/
├── bugs/
└── archived-2026-05/              ← BAD: new top-level without updating this rule
```

If a new category seems needed, update this rule first (formally introduce the category), then create the folder. Silent drift defeats the discipline.

Defense: this rule's `### Sub-folder organization within categories` table is the canonical list. If a file doesn't fit any row, the question is "is this a category gap?" not "let me make a new folder."

### ❌ Mixing active and completed plans in one folder

```
local/plans/
├── 35_AI-expansion.md             ← completed
├── 42_LS-integration.md           ← active (Phase A in progress)
├── 43_probabilistic-debug.md      ← completed
└── 46_local-installer.md          ← active (Phase 1 in progress)
```

Active and completed plans serve different purposes: active = needs review, may change; completed = reference, frozen. Mixing them forces every cold-start to re-classify by reading.

Defense: `active/` vs `completed/` split is part of the structure, not optional. Promote to `completed/` when the plan's last phase ships.

### ❌ Treating the rule and the memory as equivalent

```
[Memory: "files go in global/ or local/, no root level"]
[Rule file: doesn't exist or is stale]
Cold-start: assistant uses memory, decides global/ vs local/ on intuition,
            creates global/rules/cf-pages-deploy.md (project-specific!).
```

The memory is a pointer, not the spec. When in doubt, the assistant must open the rule file and read the decision tree — recall is not verification (this is the same trap pattern as `13-session-recovery.md`'s "recall-as-verification").

Defense: keep the rule file canonical, the memory entry as a one-line pointer ("see global/rules/common/15-docs-organization.md"). Update both on change.

---

## Related rules

- `13-session-recovery.md` — Step 1 (mandatory rules read) includes this rule. Step 4 (sanity-check report) flags root-level violations.
- `12-collaboration.md` — large reorganizations following this rule require user GO before `git mv` (wait-for-go discipline).
- `judgment-mistakes-history.md` — case 18 (axis-and-trap as checklist) applies if this rule is treated as boxes-to-tick rather than as discipline-to-follow. Recognition without action is the meta-trap.
- `rules/README.md` (or equivalent index) — should reference this rule in the decision tree under "creating a new meta-docs file."
- The project's persistent-memory index (e.g., `MEMORY.md`) — needs a one-line pointer to this rule per the "Sync with assistant persistent memory" section.

### Sync protocol with project memory

A project adopting this rule must:

1. Add a one-line pointer in the assistant's persistent memory (`MEMORY.md` for Claude Code, `userMemories` for ClaudeDesktop): "Meta-docs layout: see `<path>/15-docs-organization.md`. Root-level forbidden, 2-layer global/ + local/."
2. Add the rule's index entry in `rules/README.md` (or equivalent) under both the file layout list and the decision tree.
3. Update `13-session-recovery.md`'s Step 1 must-read list to include this rule for the cold-start.
4. Update the project-wide top-level instruction file (`CLAUDE.md` for Claude Code) with a brief reference, not the full content.

When the rule changes, the propagation order is: rule file → README index → session-recovery step list → memory pointer → top-level instruction file. Same atomic commit when feasible, back-to-back otherwise.
