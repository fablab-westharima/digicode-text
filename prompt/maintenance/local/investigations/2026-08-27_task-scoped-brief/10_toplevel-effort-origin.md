# Top-level `effortLevel: "xhigh"` provenance check

**Packet:** `S009-L7-toplevel-effort-origin`

**Lane:** `INVESTIGATION` / read-only

**Measured:** 2026-08-27 JST

## G1. Current state

`jq '{model,effortLevel,modelSettings}' ~/.claude/settings.json` の出力にある三つの対象キーは次のとおりだった（`static`）。

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

`stat` の実出力（`static`）:

```text
path=/Users/ohahiso/.claude/settings.json
mtime=2026-08-26T02:40:53+0900
mtime_epoch=1787679653
birth=2026-08-26T02:40:53+0900
birth_epoch=1787679653
owner=ohahiso (501)
group=staff (20)
mode=-rw-r--r-- (644)
```

この mtime/birth は `digicode-text` session `fe1160a2-8f02-4a2c-a624-08ee718b2732` の `/effort medium` 保存イベント（2026-08-26 02:40:53.181 +0900、transcript UTC `2026-08-25T17:40:53.181Z`）と同じ秒である。したがって、この時刻は現ファイルの再作成／保存時刻を示すが、`xhigh` を最初に設定した時刻ではない。そのイベントの stdout は `medium` を保存したと明記する一方、現在の実装では model-specific 保存が有効なとき既存 top-level 値を残して `modelSettings` を更新する（G5）。

## G2. Source-by-source table

| # | Part A source | Result | Set / observed | Exact command |
|---:|---|---|---|---|
| 1 | Current `~/.claude/settings.json` + `stat` | **CHECKED (found: G1 の三キー、mtime/birth/owner/mode)** | 現在値の **observed/read**。由来操作ではない | A1 |
| 2 | Backup / versioned copy / local snapshot | **CHECKED (found: Claude `file-history` に 2026-08-13〜14 の設定スナップショット 6 版。全版 top-level は `high`; `xhigh` 版なし)** | 過去値の **observed/read**。`~/.claude/backups/` の 5 ファイルは `.claude.json` backup で、対象 effort/model keys は全て absent。通常の settings backup/swap は 0 件。Time Machine は OS update snapshot 2 件のみ | A2 |
| 3 | VCS | **CHECKED (nothing)** | `~/.claude`, `/Users/ohahiso`, `/Users` のいずれも Git worktree ではない。従って `git log -p -- settings.json` の履歴は存在しない | A3 |
| 4 | Claude Code change / telemetry logs | **CHECKED (found: `history.jsonl` に `/effort` invocation metadata; debug file 0)** | invocation の **observed/read** のみ。`history.jsonl` は選択値を持たず、settings write audit はなかった。対象候補 3 files = `settings.json`, `settings.local.json`, `history.jsonl` | A4 |
| 5 | `~/.claude/projects/**/*.jsonl` transcripts | **CHECKED (found: `xhigh` を new-session default として保存した `/effort` 操作 3 件)** | 三件とも **SET (`xhigh` persisted default)**。ただし stdout は保存先 JSON key を示さないため、top-level key を set したかは **NOT OBTAINED**。詳細は G3/G4 | A5 |
| 6 | Shell history | **CHECKED (nothing)** | readable な `~/.zsh_history` に settings edit / effort assignment hit 0。`~/.bash_history` は存在せず **UNAVAILABLE (file absent)** | A6 |
| 7 | This repository's investigations / session history / git log | **CHECKED (found: S006 observation candidate、S007/S008 confirmed observation、baton 43; setting operation 0)** | 全て **observed/read**。S006/S007/S008 は設定していない | A7 |

### Exact commands

**A1**

```sh
jq '{model, effortLevel, fallbackModel, modelSettings, env: (.env | with_entries(select(.key | startswith("ANTHROPIC_DEFAULT_"))))}' "$HOME/.claude/settings.json"
stat -f 'path=%N%nmtime=%Sm%nmtime_epoch=%m%nbirth=%SB%nbirth_epoch=%B%nowner=%Su (%u)%ngroup=%Sg (%g)%nmode=%Sp (%OLp)' -t '%Y-%m-%dT%H:%M:%S%z' "$HOME/.claude/settings.json"
```

**A2**

```sh
find "$HOME/.claude" -maxdepth 2 \( -name 'settings.json.bak' -o -name 'settings.json.old' -o -name 'settings.json~' -o -name '.settings.json.swp' -o -name '.settings.json.swo' -o -path "$HOME/.claude/backups" -o -path "$HOME/.claude/backups/*" \) -print 2>/dev/null
for f in "$HOME/.claude/backups"/.claude.json.backup.*; do jq -c --arg file "$f" '{file:$file, has_effort:has("effortLevel"), effortLevel:(.effortLevel // null), has_modelSettings:has("modelSettings"), modelSettings:(.modelSettings // null), has_fallbackModel:has("fallbackModel"), fallbackModel:(.fallbackModel // null)}' "$f"; done
rg -l --hidden '"effortLevel"[[:space:]]*:' "$HOME/.claude/file-history" 2>/dev/null | sort
tmutil listlocalsnapshots /
```

**A3**

```sh
for d in "$HOME/.claude" "$HOME" "$(dirname "$HOME")"; do printf '%s\t' "$d"; git -C "$d" rev-parse --show-toplevel 2>/dev/null || printf 'NOT_GIT\n'; done
```

**A4**

```sh
find "$HOME/.claude" -type f \( -iname '*.log' -o -iname '*history*' -o -iname '*statsig*' -o -iname '*settings*' \) -not -path "$HOME/.claude/projects/*" -not -path "$HOME/.claude/file-history/*" -not -path "$HOME/.claude/plugins/*" -not -path "$HOME/.claude/backups/*" -print
rg -n --hidden 'effortLevel|Set effort level to xhigh|/effort|/config|/model|settings\.json' "$HOME/.claude/settings.json" "$HOME/.claude/settings.local.json" "$HOME/.claude/history.jsonl"
find "$HOME/.claude/debug" -type f | wc -l
```

**A5**

```sh
find "$HOME/.claude/projects" -name '*.jsonl' -type f -print0 | xargs -0 jq -r '
  select(.message.content? | type == "string")
  | select(.message.content | contains("<command-name>/effort</command-name>") or contains("Set effort level to"))
  | [input_filename, .timestamp, (.message.content | gsub("[\\r\\n]+"; " "))] | @tsv
' 2>/dev/null | sort -k2,2
```

Focused confirmation:

```sh
for f in \
  "$HOME/.claude/projects/-Users-ohahiso/39e651d6-8f3e-4277-94fe-f8bdf59a174d.jsonl" \
  "$HOME/.claude/projects/-Users-ohahiso-github-project-LaserEditor/70aee93a-8d82-4401-9c95-2291d0155463.jsonl" \
  "$HOME/.claude/projects/-Users-ohahiso-github-project-LaserEditor/7dc3e67c-8460-4b3a-8cb0-0c74c654fd23.jsonl"; do
  jq -s -c '{file:input_filename, xhigh_events:[.[] | select(.message.content? | type=="string") | select(.message.content | contains("Set effort level to xhigh")) | {timestamp,content:(.message.content|gsub("[\\r\\n]+";" "))}], first_assistant:([.[]|select(.type=="assistant")][0]|{timestamp,version,effort,model:.message.model})}' "$f"
done
```

**A6**

```sh
for f in "$HOME/.zsh_history" "$HOME/.bash_history"; do if [ -r "$f" ]; then printf 'HISTORY=%s\n' "$f"; rg -n 'settings\.json|effortLevel|CLAUDE_CODE_EFFORT_LEVEL|/effort' "$f" || true; else printf 'HISTORY=%s UNAVAILABLE\n' "$f"; fi; done
```

**A7**

```sh
rg -n --hidden 'effortLevel|xhigh|settings\.json|/effort|/config|/model' prompt/maintenance/local/investigations prompt/maintenance/local/handover/sessions 2>/dev/null || true
git log --all --date=iso-strict --format='%H %ad %an %s' -S'effortLevel' -- prompt/maintenance/local/investigations prompt/maintenance/local/handover/sessions
git log --all --date=iso-strict --format='%H %ad %an %s' -S'xhigh' -- prompt/maintenance/local/investigations prompt/maintenance/local/handover/sessions
```

## G3. Origin verdict

**SETTING ORIGIN NOT OBTAINED**。

`xhigh` を persisted default として選んだ route、setting actor class、時刻、session は直接記録されている。しかし、旧 Claude Code が各操作を top-level `effortLevel` と `modelSettings` のどちらへ保存したかは取得できない。installed `2.1.246` の writer `Gt(e,t)` は feature flag `tengu_russet_plover` が false なら `{effortLevel:t}`、true なら `{modelSettings:{[canonicalModel]:{effortLevel:t}}}` を返す。当時の flag state と旧バイナリ `2.1.235` / `2.1.237` / `2.1.238` は残っていない。このため、以下は **top-level origin の直接証拠ではなく、最も強い candidate setting operations** である。

The first obtained `xhigh` default-save candidate is:

| Field | Obtained fact | Evidence |
|---|---|---|
| who | Local Claude Code **user operation** under account/file owner `ohahiso`. The transcript record is `role: user` and marked as a local command. A legal-person identity beyond that is **NOT OBTAINED** | `~/.claude/projects/-Users-ohahiso/39e651d6-8f3e-4277-94fe-f8bdf59a174d.jsonl:10-11`; G1 `stat` owner |
| when | `2026-08-20T04:21:15.498+0900` (transcript `2026-08-19T19:21:15.498Z`) | same transcript `:10-11` |
| session | home-tree session `39e651d6-8f3e-4277-94fe-f8bdf59a174d`, Claude Code `2.1.235`; first assistant record then ran `claude-opus-5`, effort `xhigh` | A5 focused output |
| purpose | `xhigh` was saved “as your default for new sessions”; no broader project purpose was recorded, so none is inferred | transcript local-command stdout `:11` |
| route | Interactive Claude Code `/effort` selector, not an assistant `Edit`/`Write` tool and not a shell command | transcript local command `:10-11`; explicit tool-write scan in G4 |

The same route repeated the same default-save operation twice:

- `2026-08-20T22:57:55.741+0900`, LaserEditor tree, session `70aee93a-8d82-4401-9c95-2291d0155463`, Claude Code `2.1.237` (`:14-15`).
- `2026-08-21T13:20:03.088+0900`, LaserEditor tree, session `7dc3e67c-8460-4b3a-8cb0-0c74c654fd23`, Claude Code `2.1.238` (`:173-174`). This is the last obtained `xhigh` default-save candidate before later `medium` saves.

The three records prove only that a local user selected and persisted an `xhigh` default. They do **not** prove that any one wrote the top-level key. Inferring that link would require the missing historical writer/flag evidence and is therefore deliberately not made.

Competing hypotheses:

1. **H1 — interactive `/effort` created the top-level `xhigh`: plausible candidate, not established.** Three direct “Set effort level to xhigh (saved as your default for new sessions)” records exist, but they do not name the target key.
2. **H2 — an assistant/tool directly edited in `xhigh`: not supported.** Full transcript tool-use scan found only two `Edit` operations on the exact user settings path, both in Project_Template session `4592751a-...` on 2026-08-13; they changed model/env/fallback keys and did not add/change `effortLevel`.
3. **H3 — an unrecorded settings migration, restore, VCS action, or shell command supplied it: not supported by checked evidence, not excluded.** No settings backup carrying `xhigh`, no VCS ancestor, and no readable shell-history command was found. Absence here does not prove such an unrecorded route never occurred.

Facts that would have settled origin: a settings write-audit containing before/after JSON and target key, the historical writer implementation plus `tengu_russet_plover` state for the three sessions, a timestamped `settings.json` backup for each `/effort` event, VCS history, or a Time Machine snapshot containing the file at those times.

## G4. Set vs observed

| Candidate hit | Classification | What it proves / does not prove |
|---|---|---|
| Current top-level `"effortLevel": "xhigh"` | **OBSERVED/READ** | Present now; no actor or origin by itself |
| Current `stat` mtime/birth | **OBSERVED/READ** | Current file rewritten at the same second as the 2026-08-26 `/effort medium` save; not the `xhigh` origin |
| `file-history/.../7f4505a0c2d8e502@v1..v6` | **OBSERVED/READ** | Earlier settings versions held `high` on 2026-08-13/14; narrows `xhigh` introduction to later than those versions |
| Project_Template session `4592751a-...` exact-path `Edit` calls | **SET (other keys)** | User settings was edited on 2026-08-13, but neither operation set `effortLevel`; not origin |
| home session `39e651d6-...` `/effort xhigh` | **SET (`xhigh` persisted default); target key NOT OBTAINED** | First obtained candidate operation; does not prove top-level write |
| LaserEditor session `70aee93a-...` `/effort xhigh` | **SET (`xhigh` persisted default); target key NOT OBTAINED** | Repeated candidate operation; does not prove top-level write |
| LaserEditor session `7dc3e67c-...` `/effort xhigh` | **SET (`xhigh` persisted default); target key NOT OBTAINED** | Last obtained candidate before later `medium` saves; does not prove top-level write |
| Other transcript `/effort high` / `/effort medium` | **SET (other value)** | Saved another default/per-model value; not an `xhigh` origin. `/effort max` stdout explicitly says session-only and is not persisted |
| `history.jsonl` `/effort` rows | **OBSERVED/READ** | Confirms command invocation/session ID only; it omits selected value and write target |
| S006/S007/S008 and baton 43 | **OBSERVED/READ** | S006 observed a possible discrepancy; S007/S008 measured effective `medium`; none set `xhigh` |
| Shell-history result | **NO HIT** | No readable shell route found; it does not authenticate the local-command actor |

## G5. Blast radius

### Installed implementation

Artifact checked (`static`): Claude Code `2.1.246`, `~/.local/share/claude/versions/2.1.246`, SHA-256 `336625850986371487de7ece776d583f36cc3b3bc7178fcfbde3656d010289fb`.

Focused `strings` extraction establishes:

- schema: top-level `effortLevel` is a persisted effort level; `modelSettings` contains per-model effort keyed by canonical model name;
- writer `Gt(e,t)` has two storage routes: feature flag `tengu_russet_plover` false writes top-level `{effortLevel:t}`; true writes `{modelSettings:{[canonicalModel]:{effortLevel:t}}}`. This establishes why a `/effort` stdout alone cannot identify the historical target key;
- table builder: for a model with a matching per-model entry, `modelSettings[canonical].effortLevel` wins; when no per-model value exists in a layer, that layer's top-level `effortLevel` becomes its default;
- request lookup `Kt(e,t)` canonicalizes the actual/current model `t`, returns `byModel[t]` when present, otherwise `default`;
- suffix equivalence removes `[1m]`, so `opus[1m]` resolves to the `claude-opus-5` entry;
- fallback selection itself carries only model names. `[inferred]` Once a fallback becomes the actual/current request model, the same current-model lookup applies. A live overload fallback was not fired, so runtime fallback confirmation is **NOT OBTAINED**;
- subagent execution adds an explicit definition `effort` as a higher-priority permission layer. When an agent has no explicit effort, its resolved agent model is passed to the shared settings-effort lookup; therefore a subagent model with no `modelSettings` entry falls back to top-level `effortLevel`. This is `static`; no synthetic or real-fire subagent probe was run.

Representative exact commands:

```sh
binary_path="$(readlink "$HOME/.local/bin/claude")"
shasum -a 256 "$binary_path"
strings "$binary_path" | perl -ne 'while(/(.{0,700}modelSettings.{0,1300})/g){print "$1\n---\n"}'
strings "$binary_path" | perl -ne 'while(/(.{0,500}fallbackModel.{0,1200})/g){print "$1\n---\n"}'
strings "$binary_path" | rg -o '.{0,800}(agentDefinition|agent_type|subagent_type).{0,1800}' | rg -i 'effort'
```

### Configured-model classification from `settings.json` alone

| Source | Configured selector/model | Matching per-model entry? | Effective persisted setting if selected |
|---|---|---:|---|
| `model` | `opus[1m]` → canonical `claude-opus-5` | yes | `medium` |
| `fallbackModel[0]` | `claude-opus-5` | yes | `medium` |
| `env.ANTHROPIC_DEFAULT_OPUS_MODEL` | `claude-opus-5` | yes | `medium` |
| `env.ANTHROPIC_DEFAULT_FABLE_MODEL` | `claude-fable-5` | **no** | **top-level `xhigh`** |

Therefore the configured model that currently **would use the top-level value** is `claude-fable-5` only. Removing or changing the top-level key would not be configuration-inert: `claude-fable-5` and any subagent/route selecting another model with no per-model entry would stop obtaining persisted `xhigh` from this key. Whether removal would produce a different effective effort is **NOT OBTAINED**, because the model/catalog default that would replace the missing key was not established.

## G6. Limits

- No historical settings write-audit, historical `tengu_russet_plover` state, or old `2.1.235` / `2.1.237` / `2.1.238` executable was present. Whether any of the three repeated `xhigh` saves wrote the top-level key is **NOT OBTAINED**.
- The local-command record attributes the action to a local `user` event under account/file owner `ohahiso`; it does not independently authenticate the individual at the keyboard.
- `~/.bash_history` was absent. `~/.zsh_history` was readable and had zero relevant hits.
- Time Machine exposed only two OS update local snapshots. No restore/mount was attempted, as required.
- `~/.claude/debug` contained 0 files; no separate Statsig/settings-write log was present in the bounded log population.
- Claude `file-history` had six old settings versions with top-level `high`, but no intervening `xhigh` settings snapshot.
- Fallback and subagent conclusions are from the installed artifact (`static`). No overload/unavailability event, synthetic fallback, subagent probe, API-smoke, visual, or real-fire run was performed.
- The implementation is minified inside a Mach-O binary; function names are build-local. SHA-256 and version identify the artifact checked.
- No setting or external file was modified. The only write is this report inside the repository.
