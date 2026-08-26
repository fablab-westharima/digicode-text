# S009-L3 — Read allowance derivation and Opus 5 effective effort

Investigation only. No threshold, allowance, cap, model setting, or effort setting was changed.
Measurements are conditioned on repository `HEAD 139c202` and, for the live transcript corpus, the
timestamp stated in C9. Token values produced with `scripts/read-load.sh`'s estimator are explicitly
called **estimated tokens**; they are not API-tokenizer measurements.

## C1. `read-load.sh` mechanics and threshold locations, path:line

- `scripts/read-load.sh:101` defines `READ_ALLOWANCE=48000` estimated tokens. It is the first signal
  point and is explicitly not a gate. `scripts/read-load.sh:102` defines `READ_REVIEW=68000`
  estimated tokens. The script has no variable named `REVIEW_REQUIRED`; that is the status selected
  when `total >= READ_REVIEW` (`scripts/read-load.sh:213-216`). `WARNING` is selected when
  `48000 <= total < 68000`; `OK` is selected below 48,000.
- The estimator is documented at `scripts/read-load.sh:19-35` and implemented at
  `scripts/read-load.sh:180-184`: `tokens = ascii_chars / 2.862 + nonascii_units / 0.788`, rounded to
  the nearest integer, where `nonascii_units = (bytes - chars) / 2`. The header says it was calibrated
  on Opus 5 and reports a held-out error of -0.03%; it also says the constants are model-specific.
- `ROSTER` is the seven-entry array at `scripts/read-load.sh:151-159`: `CLAUDE.md`, README Core,
  rule 13 in full, rule 17 Core, judgment-mistakes Part 1, the full current handover, and the active
  bug index. `portion()` (`scripts/read-load.sh:114-127`) uses only `## Core (mandatory read)` or
  `## Part 1` when present; the other entries are counted in full. Each entry must exist and produce
  a non-empty measurement; otherwise the script emits no stdout measurement and exits 3
  (`scripts/read-load.sh:166-211`).
- The premise check is at `scripts/read-load.sh:232-263`. It reads `CLAUDE.md` section 0 and verifies
  that each roster file having a Core/Part-1 marker is both listed there and described as Core/Part-1,
  rather than as a full read. A mismatch exits 2. The header explicitly limits the proposition:
  it proves that section 0 *says* Core-only, not that the reader actually stopped there
  (`scripts/read-load.sh:241-244`).
- Contrary to the packet premise, the current file contains an explicit claimed basis. The relevant
  comment is `scripts/read-load.sh:56-79`, including: “Both derive from ONE equation — this project's
  own, measured 2026-08-15 and re-derived 2026-08-24”; `200,000 - 31,200 - 579 = 168,221`; and
  “READ_ALLOWANCE 48,000 = 168,221 - 120,000 reserved for the session's real work.” It also derives
  `READ_REVIEW 68,000 = 168,221 - 100,000`.

Command and observed result `[synthetic]`:

```text
bash scripts/read-load.sh; rc=$?; printf '\nRC=%s\n' "$rc"
62570 48000 tokens
Unconditional read 62570 tok / allowance 48000 tok (130%); inputs measured 7/7.
BUDGET_STATUS: WARNING ...
RC=0
```

## C2. Derivation-record search: found, not absent

The repository's “no derivation record” claim is refuted by the current repository. These exact
searches were run from the repository root `[static]`:

```sh
rg -n --hidden --glob '!.git/**' -F '48000' prompt scripts CLAUDE.md .claude
rg -n --hidden --glob '!.git/**' -F '48,000' prompt scripts CLAUDE.md .claude
rg -n --hidden --glob '!.git/**' \
  '200,000|31,200|168,221|120,000 reserved|smallest context window|same derivation|deriv(ed|ation).{0,80}48,?000|48,?000.{0,80}deriv' \
  prompt scripts CLAUDE.md .claude
git log --oneline --all -- scripts/read-load.sh
git blame -L 56,83 -- scripts/read-load.sh
```

Observed derivation records:

1. `scripts/read-load.sh:56-79` supplies the arithmetic and prose basis described in C1.
2. `prompt/maintenance/local/handover/sessions/S004_2026-08-26_handover-compliance-and-read-load.md:56-64`
   first says there is no repository derivation record and then, at line 61, records the same
   `48,000 = 168,221 - 120,000` / 200,000-token-roster derivation. The passage is internally
   contradictory.
3. `git blame -L 56,83 -- scripts/read-load.sh` attributes the complete derivation block to bootstrap
   commit `2a18176c`; `git log --oneline --all -- scripts/read-load.sh` shows that as the only commit
   touching this file. Thus the derivation text was present from this repository's initial import,
   not created by this investigation.

The contrary current-state claims remain at
`prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:97` and `:206`. What is genuinely
absent is a current, project-specific **remeasurement** of the claimed 200,000 / 31,200 / 579 /
120,000 inputs and a declared current model roster. That is different from absence of a derivation
record. `[inferred]` The likely intended baton is therefore “the inherited derivation has not been
validated against the current conductor and policy inputs,” not “no derivation exists.”

## C3. The derivation model: formula, inputs, source, and obtainability

The model keeps actual unconditional load separate from the policy allowance and prevents the hook
payload from being counted twice.

```text
M = read-load.sh roster estimate
I = estimated bodies in M that the SessionStart hook replaces (handover + bug index)
H = actual hook additionalContext estimate (those bodies + hook wrapper + conditional manifest)
U = M - I + H                                  # effective unconditional repository payload

A_candidate = max(0, C - P - W - G - O - S)  # proposed read allowance
headroom = A_candidate - U
```

| Input | Meaning and source | Obtainability |
|---|---|---|
| `C` | Effective conductor context window for every model/variant in the Human-approved roster; source must be runtime/provider evidence for the active conductor, not a documented default. | **NOT-OBTAINABLE-HERE** — conductor/platform owner; no repository instrument exposes it. |
| `M` | Unconditional mandatory set as owned by `CLAUDE.md` section 0 and measured by `scripts/read-load.sh`. | **MEASURABLE-HERE**. |
| `I` | The two roster bodies replaced by the hook payload: handover plus active bug index. | **MEASURABLE-HERE** with the same estimator. |
| `H` | `.hookSpecificOutput.additionalContext` emitted by the registered SessionStart hook, including body, wrapper, and manifest. | **MEASURABLE-HERE** by executing the hook read-only and applying the same estimator. |
| `P` | Claude Code system prompt, tool schemas/definitions, auto-memory, and any other unavoidable non-repository startup overhead. | **NOT-OBTAINABLE-HERE** — Claude Code/provider owner. Transcript cache totals do not separate this payload from user and hook input. |
| `W` | Per-session working/reasoning margin after cold start, in tokens, at a Human-chosen service level (for example a percentile and task class). | **HUMAN-DECLARED**. Historical transcript consumption may inform it, but does not choose the acceptable margin. |
| `G` | Delegation packet plus result-capsule input/output cost reserved for a delegated lane. | **NOT-OBTAINABLE-HERE** for this packet — integration owner/transport owner; no canonical packet artifact or tokenizer measurement exists in this repository. |
| `O` | Output-token reserve that must remain available at the end of work. | **HUMAN-DECLARED**; provider maximum-output metadata is a limit, not the desired reserve. |
| `S` | Additional safety margin for estimator error, compaction boundary, roster variation, and unmeasured startup variance. | **HUMAN-DECLARED**. |

The allowance is therefore a policy boundary derived from capacity and reserves; `U` is the observed
load tested against it. Adding `U` to the subtraction that defines `A_candidate` would count the read
load both as the subject and as a reserve.

## C4. Measured inputs and `NOT OBTAINED` inputs

### Repository measurements

`M = 62,570 estimated tokens`, 7/7 inputs, RC 0, from the C1 command. The hook-replaced bodies were
measured as `I = 25,101 + 401 = 25,502 estimated tokens` with:

```sh
for f in prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md \
         prompt/maintenance/local/bugs/active/index.md; do
  bytes=$(LC_ALL=C wc -c < "$f" | tr -d ' ')
  cont=$(LC_ALL=C tr -dc '\200-\277' < "$f" | LC_ALL=C wc -c | tr -d ' ')
  chars=$((bytes-cont)); na=$((cont/2)); ascii=$((chars-na))
  tok=$(awk -v a="$ascii" -v n="$na" 'BEGIN{printf "%d", int(a/2.862+n/0.788+0.5)}')
  printf '%s bytes=%s estimated_tokens=%s\n' "$f" "$bytes" "$tok"
done
```

Observed: handover `66,976 bytes / 25,101 estimated tokens`; bug index
`1,135 bytes / 401 estimated tokens`.

`H = 70,186 bytes / 26,230 estimated tokens` was measured from the actual registered hook output:

```sh
payload=$(CLAUDE_PROJECT_DIR="$PWD" bash .claude/hooks/session-start.sh |
  jq -rj '.hookSpecificOutput.additionalContext')
bytes=$(printf '%s' "$payload" | LC_ALL=C wc -c | tr -d ' ')
cont=$(printf '%s' "$payload" | LC_ALL=C tr -dc '\200-\277' |
  LC_ALL=C wc -c | tr -d ' ')
chars=$((bytes-cont)); na=$((cont/2)); ascii=$((chars-na))
tok=$(awk -v a="$ascii" -v n="$na" 'BEGIN{printf "%d", int(a/2.862+n/0.788+0.5)}')
printf 'HOOK_ADDITIONAL_CONTEXT bytes=%s estimated_tokens=%s\n' "$bytes" "$tok"
```

The hook's separate `systemMessage` was 134 bytes. It is not included in `H`, because the hook schema
labels `additionalContext` as the context payload while `systemMessage` is a separate field; no local
instrument measured the latter as model input.

### Inputs not obtained

- `C`: **NOT OBTAINED**. Owner: conductor/provider plus the Human who declares the supported roster.
  The installed Claude Code catalog is documentation/implementation metadata, not a runtime context
  capacity measurement, so its number is not substituted.
- `P`: **NOT OBTAINED**. Owner: Claude Code/provider. The header's 31,200 and 579 are existing
  transcriptions, not measurements performed in this investigation.
- `W`: **NOT OBTAINED**. Owner: Human. The header's 120,000 is an existing policy claim, not a newly
  measured or re-adopted margin.
- `G`: **NOT OBTAINED**. Owner: integration owner/transport owner. The current delegation packet and
  result capsule are not a repository artifact with a tokenizer measurement.
- `O`: **NOT OBTAINED**. Owner: Human.
- `S`: **NOT OBTAINED**. Owner: Human.

No plausible/default value was substituted for any of these inputs.

## C5. Candidate allowance under the model — proposal only, not a change

The measured effective unconditional payload candidate is:

```text
U = M - I + H
  = 62,570 - 25,502 + 26,230
  = 63,298 estimated tokens
```

The 728-estimated-token difference from `read-load.sh` is the hook wrapper and conditional-owner
manifest that the roster-body estimate does not include. This remains an estimator result, not an API
token count.

The proposed allowance is therefore, with every input visible:

```text
A_candidate = max(0,
  C[NOT OBTAINED]
  - P[NOT OBTAINED]
  - W[HUMAN-DECLARED, NOT OBTAINED]
  - G[NOT OBTAINED]
  - O[HUMAN-DECLARED, NOT OBTAINED]
  - S[HUMAN-DECLARED, NOT OBTAINED])
```

There is intentionally no adoptable numeric allowance from this packet. The computable condition for
the present payload to fit is `C - P - W - G - O - S >= 63,298 estimated tokens`. Before adoption,
the Human must declare the supported conductor roster and `W`, `O`, and `S`; the conductor/platform
owner must supply measured `C` and `P`; and the integration/transport owner must supply measured `G`.
The Human must then adopt the resulting boundary and separately decide whether/how to rederive the
68,000 review point. **This is a proposal only. `READ_ALLOWANCE`, `READ_REVIEW`, and all settings are
unchanged.**

## C6. Is the WARNING structural or an artefact of an underived threshold?

Two claims must be separated:

1. `[synthetic]` Against the current adopted-provisional constant, the WARNING is real:
   62,570 estimated tokens is 130% of 48,000, 7/7 inputs were measured, and RC was 0. The script's
   status contract intentionally classifies that crossing as a structural signal
   (`scripts/read-load.sh:46-54`, `:213-225`).
2. `[inferred]` The WARNING alone cannot establish that the read set is structurally too large for the
   current conductor. The threshold is not “underived” in the literal record—the derivation exists—but
   its capacity, overhead, roster, and reserve inputs were not revalidated here and several are still
   `NOT OBTAINED`. Therefore the observed crossing is simultaneously a valid signal under the current
   rule and insufficient evidence to distinguish read-set structural growth from stale/inapplicable
   threshold inputs. That causal distinction remains a Human decision after the missing inputs are
   supplied.

## C7. `settings.json` model/effort keys verbatim

Read-only command `[static]`:

```sh
jq '{model,effortLevel,modelSettings}' ~/.claude/settings.json
```

Observed verbatim values (`~/.claude/settings.json:6`, `:14-18`):

```json
{
  "model": "opus[1m]",
  "effortLevel": "xhigh",
  "modelSettings": {
    "claude-opus-5": {
      "effortLevel": "medium"
    }
  }
}
```

The file mtime measured `2026-08-26T02:40:53+0900`. No write was made.

## C8. `modelSettings` and variant-suffix matching

### Local implementation evidence

Installed artifact: Claude Code `2.1.246`, SHA-256
`336625850986371487de7ece776d583f36cc3b3bc7178fcfbde3656d010289fb` at
`~/.local/share/claude/versions/2.1.246`. Focused `strings` extraction of that local binary showed:

- the settings schema describes `modelSettings` as “Per-model settings keyed by canonical model
  name” and each entry may carry `effortLevel`;
- the settings-table builder canonicalizes every `modelSettings` key with `le(d)`, while `Kt` applies
  the same `le(t)` to the active model before lookup;
- within a settings layer, lookup takes `modelSettings[canonical].effortLevel` first and consults that
  layer's top-level `effortLevel` only when the per-model value is absent;
- model-equivalence code removes a trailing `[1m]` before case-insensitive comparison:
  `y(e){return e.replace(/\[1m\]$/i,"")}` and `Ue(e,t){return
  y(e).toLowerCase()===y(t).toLowerCase()}`;
- the catalog contains alias `opus[1m]`, canonical `claude-opus-5`, and marks Opus 5 as supporting
  the 1M suffix. It records effort cost indices `medium: 0.76`, `high: 1`, `xhigh: 1.6`.

Representative extraction commands `[static]`:

```sh
binary_path="$(readlink "$HOME/.local/bin/claude")"
strings "$binary_path" | perl -ne \
  'while(/(.{0,500}modelSettings.{0,900})/g){print "$1\n---\n"}'
strings "$binary_path" | perl -ne \
  'while(/(.{0,300}replace\(\/\\\[1m\\\]\$\/i,""\).{0,500})/g){print "$1\n---\n"}'
strings "$binary_path" | perl -ne \
  'while(/(.{0,200}id:"claude-opus-5".{0,1800})/g){print "$1\n---\n"}'
```

### Mechanism and limit

The transcript corpus independently records all 2,095/2,095 assistant records as model
`claude-opus-5`, even though the configured selector is `opus[1m]` (C9). `[inferred]` Joining the
shared-normalizer implementation, explicit suffix-stripping equivalence, catalog alias, and observed
canonical transcript model establishes that the 1M selector resolves to canonical Opus 5 for
per-model settings matching; `[1m]` selects the context variant and does not create a distinct
`modelSettings` key.

The exact precedence relevant here is obtained: for a matching canonical model in the same settings
layer, `modelSettings[canonical].effortLevel` overrides top-level `effortLevel`. The local source also
supports higher-priority setting layers and session/env/CLI effort, but this investigation did not
obtain the launch arguments of every historical session. The current shell measured
`CLAUDE_CODE_EFFORT_LEVEL_SET=NO`. `[inferred]` Given the exact configured `medium` per-model value,
the source precedence, and 100% `medium` observations across eight files, the per-model override is
the cause of the declared-versus-effective mismatch; no contrary record was found.

## C9. Effective-effort measurement

The effort field exists at top-level `.effort` on each transcript record whose `.type` is
`"assistant"`. At `2026-08-27T03:17:36+0900`, the project directory contained 8 top-level JSONL
session files. Result: **`medium: 2,095/2,095 assistant records`**; the field was present in
2,095/2,095; model was `claude-opus-5` in 2,095/2,095. As a duplicate-record control, these records
contained 1,020 distinct non-null `requestId` values and **`medium: 1,020/1,020 unique request IDs`**.

Exact command `[real-fire transcript measurement]`:

```sh
transcript_dir="$HOME/.claude/projects/-Users-ohahiso-github-project-digicode-text"
files=("$transcript_dir"/*.jsonl)
date '+MEASURED_AT=%Y-%m-%dT%H:%M:%S%z'
printf 'FILES=%s\n' "${#files[@]}"
jq -s '{
  assistant_records:([.[]|select(.type=="assistant")]|length),
  medium_records:([.[]|select(.type=="assistant" and .effort=="medium")]|length),
  records_with_effort:([.[]|select(.type=="assistant" and has("effort"))]|length),
  unique_request_ids:([.[]|select(.type=="assistant")|.requestId]|unique|length),
  unique_medium_request_ids:([.[]|select(.type=="assistant" and .effort=="medium")|.requestId]|unique|length),
  model_opus5_records:([.[]|select(.type=="assistant" and .message.model=="claude-opus-5")]|length)
}' "${files[@]}"
```

Per-file assistant/medium counts were: 507/507, 184/184, 263/263, 415/415, 150/150,
56/56, 241/241, and 279/279. The corpus is live, so later reruns may have a larger conditioned
denominator; the timestamp prevents that expected growth from being read as a contradiction.

## C10. Human decision package

- **Effective value:** `medium`, measured in 2,095/2,095 assistant transcript records and 1,020/1,020
  unique request IDs across eight project session files.
- **Cause:** `[inferred]` `model: "opus[1m]"` resolves to canonical `claude-opus-5`; the matching
  `modelSettings["claude-opus-5"].effortLevel: "medium"` has per-model precedence over the top-level
  `effortLevel: "xhigh"`. The observed 100% medium corpus matches that implementation path.
- **Specific Human edit:** change exactly
  `modelSettings["claude-opus-5"].effortLevel` in `~/.claude/settings.json` from `"medium"` to
  `"xhigh"`; leave `model: "opus[1m]"` and top-level `effortLevel: "xhigh"` unchanged. This packet did
  not perform the edit.
- **Impact:** the selected model and 1M variant remain unchanged; only Opus 5's effort selection moves
  from medium to xhigh. The installed catalog's relative effort-cost index moves from 0.76 to 1.6
  (about 2.11 times that internal index). `[inferred]` Reasoning work, latency, and cost/token use move
  upward; exact latency, token, and billing changes are **NOT OBTAINED** and must not be inferred from
  the index alone.
- **Rollback:** restore that exact per-model value from `"xhigh"` to `"medium"`. Then start a new
  session/request and rerun the C9 transcript measurement; rollback is observed only when new records
  return `medium`, not merely when the JSON text is restored.

## Investigation limits and conflict surface

- No API-smoke request was created solely for this investigation; existing real session transcripts
  supplied the effective-effort evidence. No visual rung was applicable. No setting mutation was
  permitted or run. No mutation test was applicable because only this report was written.
- A broad local-documentation search command used
  `rg ... ~/.claude --glob '!projects/**'`, but the absolute-path traversal did not honor that relative
  exclusion as intended and emitted matches from other `~/.claude/projects` trees, including a
  DigiCode-named transcript tree. That output was outside the packet's project-transcript scope, was
  not used as evidence, and caused no write. This is reported as a scope conflict, not silently
  discarded.
- The repository was clean at the first `git status --short`. During the investigation, untracked
  `prompt/maintenance/local/plans/active/10_task-scoped-context-brief-read-architecture.md` appeared.
  It was not created, read, or modified by this lane. It is a concurrent working-tree conflict for the
  integration owner to reconcile, not evidence for C1-C10.

