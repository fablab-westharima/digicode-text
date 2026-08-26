# Current context-delivery architecture inventory

- Packet: `S009-L1-architecture-inventory`
- Lane: `INVESTIGATION`
- Measurement date: 2026-08-27 JST
- Start state: `main`, `HEAD 139c202`, clean tree. Command: `git status --short && git rev-parse --short HEAD && git branch --show-current` → stdout was `139c202` / `main` with no status line, RC 0.
- Verification labels used below: source reading is **static**; generated-output and byte/count probes are **synthetic**. Network, API-smoke, visual, and real-fire rungs were not run because this packet is a repository-local architecture inventory.

## A1. `context-brief.sh` mechanics

### A1.1 Allowlist and enforcement

The declared export surface is `CLAUDE.md`, the three current-state owners, `scripts/baseline.sh` (or a handover §5 fallback), requested common-rule TL;DRs, Git/repository metadata, and the transcript-file count (`scripts/context-brief.sh:2-11`). The concrete defaults are:

| input | enforced source / extraction | evidence |
|---|---|---|
| purpose | `CLAUDE.md`, section beginning `## 4.` | `scripts/context-brief.sh:15`, `scripts/context-brief.sh:128` |
| settled decisions | `16_次セッション引き継ぎ指示書.md`, section beginning `## §3` | `scripts/context-brief.sh:16`, `scripts/context-brief.sh:129` |
| router current position | the same handover, section beginning `## §1` | `scripts/context-brief.sh:130` |
| baton bodies | `batons.md`, section beginning `## Baton bodies` | `scripts/context-brief.sh:35`, `scripts/context-brief.sh:131-138` |
| evidence/provenance and loop/feedback | `evidence-map.md`, sections beginning `## §A` and `## §B` | `scripts/context-brief.sh:36`, `scripts/context-brief.sh:139-140` |
| baseline | stdout of `scripts/baseline.sh`; if absent, only item/value cells from the handover §5 table | `scripts/context-brief.sh:142-164` |
| requested rules | exactly one basename match for `${N}-*.md` below `prompt/maintenance/global/rules/common`, then only its `## TL;DR` section | `scripts/context-brief.sh:196-221` |
| identity/corpora | repo path/name, Git branch/HEAD/status, UTC time, and per-project transcript count | `scripts/context-brief.sh:166-194`, `scripts/context-brief.sh:224-260` |

`extract_section` starts at a line whose prefix is the requested marker and stops before the next `## ` heading (`scripts/context-brief.sh:109-126`). This is a section allowlist, not a whole-file export, except that the baseline generator's stdout is accepted as a unit (`scripts/context-brief.sh:142-148`).

The allowlist has three static trust-boundary qualifications:

1. The five `CONTEXT_BRIEF_*` source variables are unrestricted path overrides, described only as testing overrides; the script does not check that their resolved paths remain under the repository or equal the defaults (`scripts/context-brief.sh:3`, `scripts/context-brief.sh:15-16`, `scripts/context-brief.sh:35-36`, `scripts/context-brief.sh:142`). Therefore the default path set is hard-coded, but path containment is **fail-open to the caller environment**. [inferred from static control flow]
2. `baseline.sh` is executed and its stdout is copied; `context-brief.sh` does not independently constrain the generator's transitive reads or output schema (`scripts/context-brief.sh:142-148`). Thus that boundary trusts the allowlisted generator rather than re-allowlisting its inputs. [inferred from static control flow]
3. Rule lookup remains confined to one directory with `find -maxdepth 1` and requires exactly one match before extracting the TL;DR (`scripts/context-brief.sh:203-215`).

### A1.2 Fail-closed and fail-open behavior

| condition | observed/static behavior | class and evidence |
|---|---|---|
| missing source section/owner | emits a `NOT OBTAINED` value, increments `BRIEF-MISSING`, emits `STATUS: INCOMPLETE`, and exits 3 after emitting the payload | fail-closed as a labelled incomplete result, but not “emit nothing”; `scripts/context-brief.sh:95-107`, `scripts/context-brief.sh:123-125`, `scripts/context-brief.sh:260-262`, `scripts/context-brief.sh:301-302` |
| baseline command RC nonzero or empty | replaces it with `NOT OBTAINED` | fail-closed; `scripts/context-brief.sh:142-148` |
| transcript root cannot be located | `NOT OBTAINED` + incomplete | fail-closed; `scripts/context-brief.sh:186-194` |
| transcript root exists but project directory does not | reports measured `0 *.jsonl files` | intentional measured-empty branch, not missing; `scripts/context-brief.sh:179-190` |
| Git branch/HEAD/status unobtainable | marks the run incomplete and prints `NOT OBTAINED` fallbacks | fail-closed status; `scripts/context-brief.sh:224-233`, `scripts/context-brief.sh:240-242` |
| invalid/unknown CLI argument or nonnumeric cap | exits 2 | fail-closed before output; `scripts/context-brief.sh:71-89` |
| byte cap exceeded | stderr says actual and cap, emits nothing, exits 5 | fail-closed; `scripts/context-brief.sh:278-282` |
| gitleaks is installed and returns nonzero | emits nothing, exits 4 | fail-closed for both candidate/error nonzero statuses; `scripts/context-brief.sh:284-293` |
| gitleaks is absent | adds `WARNING: secret scan unavailable` and continues | explicitly fail-open for scan availability; `scripts/context-brief.sh:235-236`, `scripts/context-brief.sh:262`, `scripts/context-brief.sh:284` |
| `--out` copy fails | `cp` RC is not captured; final RC is decided only by `incomplete` | fail-open delivery result [inferred]; `scripts/context-brief.sh:296-302` |

In this measurement environment `command -v gitleaks` returned `/usr/local/bin/gitleaks`, and both brief generations returned RC 0; this is a **synthetic** observation that the current generated payload passed the installed scan, not proof about every override/source path.

### A1.3 Emitted sections and order

The script emits these ten stable top-level sections, in this exact order (`scripts/context-brief.sh:238-276`):

1. `IDENTITY` (preceded by `BRIEF-SCHEMA: v1`)
2. `PURPOSE`
3. `TASK`
4. `SETTLED DECISIONS`
5. `CURRENT STATE`
6. `BASELINE`
7. `AVAILABLE DATA CORPORA`
8. `RECIPIENT AUTHORITY`
9. `RULE TL;DRS`
10. `KNOWN UNCERTAINTIES`

The exact-marker positive control `grep -Fxc` returned 1 for each of the nine post-identity marker lines in both generated files. The byte partition in A2 therefore did not silently split at a same-named embedded line.

`--task VALUE`, `--recipient VALUE`, `--rules VALUE`, and `--out PATH` are the only accepted flags (`scripts/context-brief.sh:66-85`). `--rules N` adds `### Rule N` plus the unique matching rule's `## TL;DR` section; a comma-separated list is accepted (`scripts/context-brief.sh:196-219`). With no rule request, it emits `No rule TL;DRs requested.` (`scripts/context-brief.sh:220-221`). There is no `--help` branch.

### A1.4 Cap, HEAD, GEN, and generation time

The default cap lives at `scripts/context-brief.sh:65` as `MAX_BYTES="${BRIEF_MAX_BYTES:-131072}"`, i.e. **131,072 bytes = 128 KiB**. Its Human-GO provenance and “do not raise again” ruling are in `scripts/context-brief.sh:37-64`. Breach behavior is emitted-nothing/RC 5 (`scripts/context-brief.sh:278-282`).

The brief stamps short and full HEAD (`scripts/context-brief.sh:225-227`, emitted at `scripts/context-brief.sh:240-242`) and UTC generation time (`scripts/context-brief.sh:234`, emitted at `scripts/context-brief.sh:259`). It does **not** stamp the current-state `GEN`:

- the router's `GEN: S008-close` is at `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:13`, before the exported `## §1` at line 21;
- the other owners' GEN lines are at `prompt/maintenance/local/handover/batons.md:12` and `prompt/maintenance/local/handover/evidence-map.md:12`, before their exported headings at lines 14;
- the exporter starts those extractions at their later headings (`scripts/context-brief.sh:130`, `scripts/context-brief.sh:138-140`).

Synthetic command `grep -Fc 'GEN:' "$brief"; grep -Fc 'S008-close' "$brief"` returned `0` and `0`. Competing hypotheses were: (H1) exporting all three owner sections implicitly carries GEN, versus (H2) the start markers omit all owner preambles. The generated output supports H2 and falsifies H1 for the present files.

### A1.5 Material that is not bare current truth

Yes. The emitted payload contains more than bare current-state facts:

- fixed handoff instructions in `RECIPIENT AUTHORITY` (`scripts/context-brief.sh:271-273`);
- unfilled operational placeholders in `TASK`, `RECIPIENT AUTHORITY`, and `KNOWN UNCERTAINTIES` (`scripts/context-brief.sh:264-265`, `scripts/context-brief.sh:271-275`);
- standing rule instructions when `--rules` is used (`scripts/context-brief.sh:196-221`, `scripts/context-brief.sh:274`);
- settled-decision grounds/rejected alternatives embedded in the current authority section (`scripts/context-brief.sh:129`, source begins `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:139`);
- an evidence/provenance map and closed-objective routing history inside `CURRENT STATE` (`scripts/context-brief.sh:139-140`; source description at `prompt/maintenance/local/handover/evidence-map.md:14-30`).

The script's own comments are not emitted. The non-bare material above is emitted because it is fixed guidance, a placeholder, standing instruction, or currently authoritative provenance/grounds—not because the shell comments leak into output.

## A2. Section-level size table

### Method

The generated files were made with no `--task` or `--recipient`, matching the packet's stated 102,629 B / 106,761 B baseline:

```bash
probe_dir="$(mktemp -d)"
bash scripts/context-brief.sh > "$probe_dir/plain"
plain_rc=$?
bash scripts/context-brief.sh --rules 22 > "$probe_dir/rules22"
rules_rc=$?
wc -c "$probe_dir/plain" "$probe_dir/rules22"
```

Observed: `plain_rc=0`, `rules_rc=0`; `wc -c` = **102,629 bytes plain**, **106,761 bytes `--rules 22`**.

The partition command was:

```bash
for f in "$probe_dir/plain" "$probe_dir/rules22"; do
  LC_ALL=C awk '
    BEGIN {
      n=10
      names[1]="IDENTITY"; names[2]="PURPOSE"; names[3]="TASK"; names[4]="SETTLED DECISIONS"
      names[5]="CURRENT STATE"; names[6]="BASELINE"; names[7]="AVAILABLE DATA CORPORA"
      names[8]="RECIPIENT AUTHORITY"; names[9]="RULE TL;DRS"; names[10]="KNOWN UNCERTAINTIES"
      current=1
    }
    {
      line=$0
      if (NR > 1) for (i=2; i<=n; i++) if (line == names[i]) { current=i; break }
      bytes[current] += length(line) + 1
    }
    END {
      sum=0
      for (i=1; i<=n; i++) { printf "%02d\t%s\t%d\n", i, names[i], bytes[i]; sum += bytes[i] }
      printf "SUM\t%d\n", sum
    }
  ' "$f"
done
```

Partition convention: byte 1 through immediately before the next exact marker line belongs to the current section; therefore the blank separator emitted before the next marker belongs to the preceding section. `IDENTITY` also includes `BRIEF-SCHEMA: v1`. Each sum matched `wc -c` exactly. Shares and the explicitly estimated token column were produced from the measured bytes with `awk 'BEGIN{t=TOTAL}{printf "%.2f %.2f",100*$2/t,$2/4}'`; **estimated tokens = bytes / 4, not a tokenizer measurement**.

| stable section | plain bytes | plain share | plain tokens (bytes/4 estimate) | `--rules 22` bytes | rules share | rules tokens (bytes/4 estimate) |
|---|---:|---:|---:|---:|---:|---:|
| `IDENTITY` | 267 B | 0.26% | 66.75 est. tok | 267 B | 0.25% | 66.75 est. tok |
| `PURPOSE` | 5,237 B | 5.10% | 1,309.25 est. tok | 5,237 B | 4.91% | 1,309.25 est. tok |
| `TASK` | 66 B | 0.06% | 16.50 est. tok | 66 B | 0.06% | 16.50 est. tok |
| `SETTLED DECISIONS` | 37,488 B | 36.53% | 9,372.00 est. tok | 37,488 B | 35.11% | 9,372.00 est. tok |
| `CURRENT STATE` | 58,210 B | 56.72% | 14,552.50 est. tok | 58,210 B | 54.52% | 14,552.50 est. tok |
| `BASELINE` | 620 B | 0.60% | 155.00 est. tok | 620 B | 0.58% | 155.00 est. tok |
| `AVAILABLE DATA CORPORA` | 289 B | 0.28% | 72.25 est. tok | 289 B | 0.27% | 72.25 est. tok |
| `RECIPIENT AUTHORITY` | 321 B | 0.31% | 80.25 est. tok | 321 B | 0.30% | 80.25 est. tok |
| `RULE TL;DRS` | 39 B | 0.04% | 9.75 est. tok | 4,171 B | 3.91% | 1,042.75 est. tok |
| `KNOWN UNCERTAINTIES` | 92 B | 0.09% | 23.00 est. tok | 92 B | 0.09% | 23.00 est. tok |
| **total** | **102,629 B** | **100.00%** | **25,657.25 est. tok** | **106,761 B** | **100.00%** | **26,690.25 est. tok** |

The `CURRENT STATE` source-component probe used the same `awk` extraction rule as `extract_section` and `LC_ALL=C wc -c`. It measured router §1 = **5,794 B**, baton bodies = **37,514 B**, evidence-map §A = **7,575 B**, and evidence-map §B = **7,312 B**. These sum to 58,195 B; the remaining 15 B are the `CURRENT STATE` label plus the partition's trailing separator. Command:

```bash
for spec in \
  "router-section1|prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md|## §1" \
  "baton-bodies|prompt/maintenance/local/handover/batons.md|## Baton bodies" \
  "evidence-map-A|prompt/maintenance/local/handover/evidence-map.md|## §A" \
  "evidence-map-B|prompt/maintenance/local/handover/evidence-map.md|## §B"
do
  name="${spec%%|*}"; rest="${spec#*|}"; src="${rest%%|*}"; start="${rest#*|}"
  bytes="$(LC_ALL=C awk -v start="$start" \
    'index($0,start)==1{found=1;print;next} found&&/^## /{exit} found{print}' \
    "$src" | wc -c | tr -d ' ')"
  printf '%s\t%s\n' "$name" "$bytes"
done
```

## A3. Section → source-owner mapping

| brief section | source owner / runtime source | evidence |
|---|---|---|
| `IDENTITY` | generated at runtime from repository name, Git branch/HEAD/status, UTC clock, missing count, and optional scan warning | `scripts/context-brief.sh:224-262` |
| `PURPOSE` | `CLAUDE.md` section beginning `## 4.` | `scripts/context-brief.sh:128`, `scripts/context-brief.sh:263` |
| `TASK` | `--task` argument or fixed placeholder | `scripts/context-brief.sh:66`, `scripts/context-brief.sh:76`, `scripts/context-brief.sh:264-265` |
| `SETTLED DECISIONS` | `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` §3 | `scripts/context-brief.sh:129`, `scripts/context-brief.sh:266` |
| `CURRENT STATE` | handover §1 + `batons.md` baton bodies + `evidence-map.md` §A + §B, concatenated | `scripts/context-brief.sh:130-140`, `scripts/context-brief.sh:267` |
| `BASELINE` | current stdout of `scripts/baseline.sh`; fallback is handover §5 item/value cells labelled as last-close claims | `scripts/context-brief.sh:142-164`, `scripts/context-brief.sh:268` |
| `AVAILABLE DATA CORPORA` | runtime repository path + runtime transcript path/count + fixed enumeration instruction | `scripts/context-brief.sh:166-194`, `scripts/context-brief.sh:269-270` |
| `RECIPIENT AUTHORITY` | `--recipient` argument or placeholder + fixed integration/assumption instructions | `scripts/context-brief.sh:67`, `scripts/context-brief.sh:77`, `scripts/context-brief.sh:271-273` |
| `RULE TL;DRS` | requested numbered files below `prompt/maintenance/global/rules/common`, or fixed no-rules line | `scripts/context-brief.sh:196-221`, `scripts/context-brief.sh:274` |
| `KNOWN UNCERTAINTIES` | generated fixed placeholder; it has no owner-file input | `scripts/context-brief.sh:275` |

The three-file owner contract itself says 16.md is the router/current-state owner (`prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:3-8`), `batons.md` is the conditional baton-body owner (`prompt/maintenance/local/handover/batons.md:3-12`), and `evidence-map.md` is the conditional evidence/provenance/loop owner (`prompt/maintenance/local/handover/evidence-map.md:3-12`).

## A4. `read-load.sh` mechanics and threshold provenance

### Roster and portion rule

`ROSTER` has **7 expected entries**, declared at `scripts/read-load.sh:151-159`:

1. `CLAUDE.md` full
2. `prompt/maintenance/global/rules/README.md` §Core only
3. `prompt/maintenance/global/rules/common/13-session-recovery.md` full
4. `prompt/maintenance/global/rules/common/17-no-self-imposed-scope.md` §Core only
5. `prompt/maintenance/global/rules/common/judgment-mistakes-history.md` §Part 1 only
6. `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` full, hook-injected
7. `prompt/maintenance/local/bugs/active/index.md` full, hook-injected

`portion()` emits the file start through the end of a first `## Core (mandatory read)` or `## Part 1` section, skipping fenced headings while locating the end; files without either marker are read whole (`scripts/read-load.sh:92-94`, `scripts/read-load.sh:109-129`). Missing, malformed, or measured-empty roster inputs do not reduce the total: the script requires `MEASURED == EXPECTED`, otherwise stderr + RC 3 before stdout (`scripts/read-load.sh:161-211`).

### Token computation

The unit is explicitly an estimate. The documented formula is `ascii_chars / 2.862 + nonascii_units / 0.788`, where `nonascii_units = (bytes - chars) / 2` (`scripts/read-load.sh:19-29`). Implementation counts bytes under `LC_ALL=C`, derives UTF-8 characters by subtracting continuation bytes, applies the formula, and rounds to the nearest integer (`scripts/read-load.sh:131-133`, `scripts/read-load.sh:180-184`). The header records calibration on Opus 5 and its model-specific limitation (`scripts/read-load.sh:25-35`).

### Thresholds and provenance

The values live in `scripts/read-load.sh:101-104`:

- `READ_ALLOWANCE=48000` estimated tokens;
- `READ_REVIEW=68000` estimated tokens;
- `READ_BUDGET` aliases the allowance for the output contract;
- basis `ADOPTED_PROVISIONAL`, review date 2026-09-30.

The in-file provenance is present at `scripts/read-load.sh:56-83`: smallest window 200,000 tokens minus 31,200 system/tool tokens and 579 MEMORY tokens gives 168,221 available; 48,000 is described as 168,221 minus a 120,000 work reserve, and 68,000 as 168,221 minus 100,000. Per packet scope, I did not independently re-derive those inputs; this is **static provenance found**, not adoption or fresh validation.

Status selection is `REVIEW_REQUIRED` at total `>= 68000`, `WARNING` at total `>= 48000`, otherwise `OK` (`scripts/read-load.sh:213-216`), and is explicitly a signal rather than a gate (`scripts/read-load.sh:218-226`).

Exact run:

```bash
bash scripts/read-load.sh
read_rc=$?
printf 'READ_LOAD_RC=%s\n' "$read_rc"
```

Observed (**synthetic**): **62,570 estimated tokens / 48,000 estimated-token allowance**, **130%**, `MEASURED 7/7`, `BUDGET_STATUS: WARNING`, RC 0. This numeric output is the script's estimator result, not actual model tokenization.

### Premise check

After printing, the script extracts `CLAUDE.md` §0 and checks that every roster file with a Core/Part-1 marker is listed there with `Core` or `Part 1`; contradiction produces stderr and RC 2 (`scripts/read-load.sh:232-263`). It explicitly cannot prove the reader actually stopped at that range; the emitted `Read limit:N` is the mitigation (`scripts/read-load.sh:241-244`). The current RC 0 means the textual premise check passed; it does not prove reader behavior.

## A5. SessionStart hook injection payload

The hook runs at session start/resume/clear and declares four deliveries: cold-start protocol, mandatory owner in full, conditional-owner manifest as paths only, and active bug index (`.claude/hooks/session-start.sh:2-9`). Actual construction is:

1. five cold-start instructions and a banner (`.claude/hooks/session-start.sh:78-90`);
2. a hard-coded conditional manifest for `batons.md` and `evidence-map.md`; each item carries path, “holds”, and “open it” trigger, and gains a visible missing marker if absent (`.claude/hooks/session-start.sh:47-58`, `.claude/hooks/session-start.sh:91-95`);
3. the handover body in full, bracketed by begin/end lines (`.claude/hooks/session-start.sh:60-76`, `.claude/hooks/session-start.sh:96-101`);
4. the active bug index in full if nonempty (`.claude/hooks/session-start.sh:102-108`);
5. JSON fields `hookSpecificOutput.hookEventName=SessionStart`, `hookSpecificOutput.additionalContext`, and a Japanese `systemMessage` (`.claude/hooks/session-start.sh:110-116`).

The hook's `GEN` is extracted from the first handover line containing both `GEN:` and `-close`; absent match becomes `UNDECLARED` (`.claude/hooks/session-start.sh:67-76`). This hook therefore does carry `S008-close` in both its instruction header and inlined full owner, unlike the context brief.

Exact byte probe:

```bash
CLAUDE_PROJECT_DIR="$PWD" bash .claude/hooks/session-start.sh > "$probe_dir/hook.json"
hook_rc=$?
wc -c "$probe_dir/hook.json"
python3 - "$probe_dir/hook.json" <<'PY'
import json, pathlib, sys
raw = pathlib.Path(sys.argv[1]).read_bytes()
obj = json.loads(raw)
ctx = obj["hookSpecificOutput"]["additionalContext"].encode("utf-8")
msg = obj["systemMessage"].encode("utf-8")
print(f"additionalContext_bytes={len(ctx)}")
print(f"systemMessage_bytes={len(msg)}")
print(f"decoded_injected_fields_bytes={len(ctx)+len(msg)}")
print(f"additionalContext_lines={len(obj['hookSpecificOutput']['additionalContext'].splitlines())}")
PY
```

Observed (**synthetic**): hook RC 0; `additionalContext` **70,186 B / 299 lines**; `systemMessage` **134 B**; decoded injected string fields total **70,320 B**; serialized JSON stdout including keys/escaping/newline **70,733 B**. These measure script output bytes, not the downstream platform's eventual token count or proof that a client consumed the fields.

## A6. Delegation packet field inventory

The template is mandatory and every `{{...}}` slot must be replaced without deleting fields (`prompt/maintenance/global/templates/delegation-packet-template.md:1-5`). Its complete field/section inventory is:

| group | fields carried | evidence |
|---|---|---|
| dispatch header | `LANE`, `LANE_SEQUENCE`, `AUTHORITY_MODE`, `INTEGRATION_OWNER`, `PACKET_ID`, `ROUTE_TARGET`, `ROUTE_EFFORT`, `EFFORT_REASON`, `EFFORT_EVIDENCE`, `ROUTE_AUTHORITY_REF`, `AUTO_ADVANCE`, `CONFLICT_SURFACE` | `prompt/maintenance/global/templates/delegation-packet-template.md:8-19` |
| active-scope record | `DELEGATED_SCOPE_ACTIVE.id`, `.scope`, `.owner`, `.parent_shadow_execution` | `prompt/maintenance/global/templates/delegation-packet-template.md:21-25` |
| task body | `Mission`, `Scope`, `OUT_OF_SCOPE`, `Acceptance`, `STOP_IF`, `KNOWN_SANDBOX_NOISE` | `prompt/maintenance/global/templates/delegation-packet-template.md:27-43` |
| fixed return policy | `FINDING_HANDLING` with BLOCKER/ADJACENT_DEFECT/HARDENING and invalid-measurement return mapping | `prompt/maintenance/global/templates/delegation-packet-template.md:45-53` |
| result capsule | `VERDICT`, `REASON`, `REPORT`, `COMMIT_CANDIDATE`, `TEST_CMD`, `TEST_RC`, `TESTS`, `SELFTEST`, `MUTATION`, `CHANGED_FILES`, `CLAIMS`, result `CONFLICT_SURFACE`, `HUMAN_DECISION_REQUIRED`, `NEXT_RECOMMENDED_LANE` | `prompt/maintenance/global/templates/delegation-packet-template.md:55-72` |

The template also carries nine contract rules governing those fields (`prompt/maintenance/global/templates/delegation-packet-template.md:75-104`). Rule 22 independently requires the target paths, lane-shaped problem/design, acceptance, standing removal question, founding use case, relevant TL;DRs, and escalation instruction (`prompt/maintenance/global/rules/common/22-model-orchestration.md:174-190`).

## A7. Brief ↔ packet duplication

### A7.1 Section/field comparison

Classification is semantic at the schema level; “identical” would require the whole brief section and packet field payload to be the same bytes. No pair meets that condition in the unfilled template.

| brief section | packet field(s) | overlap (identical / partial / none) |
|---|---|---|
| `IDENTITY` | no dedicated repo/HEAD/generation field; these may be repeated in `Mission`/`Scope` | **none** by contract; [inferred] possible partial in a filled packet |
| `PURPOSE` | `Mission` and rule-22 founding use case | **partial** |
| `TASK` | `Mission`, `Scope`, `Acceptance` | **partial** by schema; measured default brief contains only a placeholder |
| `SETTLED DECISIONS` | settled constraints in `Scope`, `OUT_OF_SCOPE`, `STOP_IF` | **partial** |
| `CURRENT STATE` | `Mission`, `Scope`, `Acceptance`, `STOP_IF`, sometimes `KNOWN_SANDBOX_NOISE` | **partial** |
| `BASELINE` | no dedicated result/baseline input; authors may repeat it in `Mission` or `Acceptance` | **none** by contract; [inferred] possible partial in a filled packet |
| `AVAILABLE DATA CORPORA` | data/files in `Scope` (rule 22 also requires available-data enumeration) | **partial** |
| `RECIPIENT AUTHORITY` | `AUTHORITY_MODE`, `INTEGRATION_OWNER`, active-scope record, `FINDING_HANDLING` | **partial**; values/instructions are not byte-identical |
| `RULE TL;DRS` | lane/authority/STOP/finding/capsule rules spread across header, `STOP_IF`, `FINDING_HANDLING`, and result format | **partial** for `--rules 22`; plain configuration has no requested TL;DR body |
| `KNOWN UNCERTAINTIES` | `CONFLICT_SURFACE`, `STOP_IF`, unresolved constraints in `Mission`/`Scope` | **partial** by intended role; measured default brief is only a placeholder |

The strongest structural overlap is not an identical copy: the brief provides broad project/current truth, while the packet reselects mission, task boundaries, authority, stop conditions, and evidence duties from that truth. The template has no provenance pointer saying which brief bytes generated a packet field, so partial semantic overlap cannot be converted into an exact byte count from the two schemas alone. [inferred]

### A7.2 Quantification and denominator

The requested session sample was searched with:

```bash
rg -n --fixed-strings 'S009-L' . \
  --glob '!prompt/maintenance/local/handover/sessions/**' \
  --glob '!prompt/maintenance/local/investigations/**' \
  --glob '!prompt/maintenance/global/rules/common/judgment-mistakes-history.md'
```

Observed: RC 1, zero matches. Thus **0/3 filled S009 packet artifacts were available inside the allowed repository scope**. Only the L1 packet is visible in the conversation, not as a byte-addressable artifact; the other two are not visible. Per packet instruction, the fallback denominator is therefore the template field set.

Template measurement:

```bash
sed -n '8,72p' prompt/maintenance/global/templates/delegation-packet-template.md | wc -c
rg -o '\{\{[^}]+\}\}' prompt/maintenance/global/templates/delegation-packet-template.md | wc -l
rg -o '\{\{[^}]+\}\}' prompt/maintenance/global/templates/delegation-packet-template.md | sort -u | wc -l
rg -o '\{\{[^}]+\}\}' prompt/maintenance/global/templates/delegation-packet-template.md \
  | LC_ALL=C awk '{n+=length($0)} END{print n}'
comm -12 \
  <(sed -n '8,72p' prompt/maintenance/global/templates/delegation-packet-template.md | sed '/^$/d' | LC_ALL=C sort -u) \
  <(sed '/^$/d' "$probe_dir/plain" | LC_ALL=C sort -u) | wc -c
```

Observed denominator: template contract lines 8-72 = **2,347 B**, containing **21 placeholder occurrences / 20 unique placeholder names / 559 B of placeholder marker text**. Exact nonempty whole-line intersection with the plain brief was **0 B**; repeating against `--rules 22` was also **0 B**.

Therefore:

- **measured template lower bound:** **0 B / 2,347 B** are byte-identical, nonempty full lines carried by both the generated brief and the unfilled packet contract;
- **bytes carried twice by a typical filled dispatch:** **NOT OBTAINED** — the three filled packet artifacts were unavailable, and the unfilled 21 slots contain no task/current-truth values to measure. Substituting `0 B` for this second quantity would conflate “not measured” with “measured none.”

Competing hypotheses remain unresolved by the template fallback: (H1) filled packets repeat large owner passages verbatim; (H2) they repeat only small selected propositions while adding task-specific constraints. The semantic table shows where either can occur, but the template cannot distinguish them. Confounders are author paraphrase, optional inclusion of HEAD/baseline in narrative slots, and whether a brief was generated with `--task`/`--recipient` or left at the measured placeholders.

## A8. Repo-access vs no-repo-access requirements

This table records only requirements found in the current scripts/rules. “Delivered” means supplied in the packet/hook/brief; it does not claim the actor obeyed or consumed it.

| actor/access | what the current text requires delivered | current route and evidence |
|---|---|---|
| WITH repo access | packet target as files/area **with paths**, plus lane-shaped problem, constraints, acceptance, applicable rules and stop/escalation | delegation contract in `prompt/maintenance/global/rules/common/22-model-orchestration.md:174-190`; packet fields at `prompt/maintenance/global/templates/delegation-packet-template.md:8-43` |
| WITH repo access, cold start | a read route: run `read-load.sh`, then README §Core → rule 13 → rule 17 Core → hook-satisfied 16.md → judgment-history Part 1 → triggered task rules | `CLAUDE.md:8-20`; owner of this read contract at `CLAUDE.md:39-45` |
| WITH repo access, conditional current truth | conditional owner **paths + holds + trigger** are enough by default; bodies are opened only when the trigger fires | owner table `CLAUDE.md:21-28`; manifest construction `.claude/hooks/session-start.sh:47-58`, `.claude/hooks/session-start.sh:87-95` |
| WITH repo access, mandatory owner | current hook nevertheless injects 16.md whole and says this satisfies the read; disk is re-read only on edit or stale GEN suspicion | `.claude/hooks/session-start.sh:78-85`, `.claude/hooks/session-start.sh:96-101`; specialization `CLAUDE.md:17`, `CLAUDE.md:39-41` |
| WITHOUT repo access | use `scripts/context-brief.sh`, never a hand-assembled summary; it is the only sanctioned allowlisted, HEAD-stamped, fail-closed Route-B export | `prompt/maintenance/global/rules/README.md:78`; role statement `CLAUDE.md:232-234`; script contract `scripts/context-brief.sh:2-11` |
| WITHOUT repo access | inline every current-state owner body needed for completeness, because a router-only payload loses current truth | `scripts/context-brief.sh:17-34`; actual concatenation `scripts/context-brief.sh:128-140`, `scripts/context-brief.sh:263-275` |
| WITHOUT repo access | carry evidence/provenance routing content inline | evidence-map §A is explicitly exported at `scripts/context-brief.sh:139`; source owner contract `prompt/maintenance/local/handover/evidence-map.md:3-16` |
| WITHOUT repo access | carry provenance of payload freshness: schema, repo, branch, full/short HEAD, dirty count/digest where applicable, UTC generation time, and missing count | `scripts/context-brief.sh:224-260`; stale/dirty handling required by route text at `prompt/maintenance/global/rules/common/22-model-orchestration.md:620-628` |
| WITHOUT repo access | `GEN` requirement for the brief | **No explicit rule requiring brief GEN was found.** GEN is required to order hook-frozen 16.md against disk (`prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md:13`; `.claude/hooks/session-start.sh:67-81`), and conditional owners must share it (`prompt/maintenance/local/handover/batons.md:9-12`, `prompt/maintenance/local/handover/evidence-map.md:7-12`), but current brief extraction omits all three markers. Present output gives HEAD + UTC time, not GEN. |
| WITHOUT repo access, incomplete/stale | missing/schema mismatch: do not start; incomplete is startable only when no missing section is load-bearing; HEAD mismatch regenerates; dirty HEAD-only payload either gains relevant diff digest or moves repo-aware | `prompt/maintenance/global/rules/common/22-model-orchestration.md:616-628` |

### Conflict and limits

1. **CONFLICT_SURFACE:** the objective framing asks for no-repo delivery including “provenance + GEN”, while current executable output and current Route-B rule require/stamp HEAD but do not carry GEN. This report does not decide whether task-scoped architecture must add it.
2. **Static fail-open surfaces:** unrestricted testing path overrides, trusted baseline stdout, optional secret scanner, and unchecked `--out` copy RC are part of the measured mechanics. No exploit/mutation was run; their practical impact is unconfirmed.
3. **Duplication limit:** typical filled-dispatch byte duplication is NOT OBTAINED for the artifact-availability reason in A7. The 0 B result is only an exact-line lower bound over the 2,347 B unfilled template contract.
4. **Hook limit:** byte counts prove what the hook process emitted, not what downstream Claude context accepted or tokenized.
5. Network evidence was neither needed nor used. No donor or path outside the repository working tree was opened; temporary generated outputs were under the system temporary directory.
6. **Concurrent worktree delta:** the start-state command showed a clean tree, but the final `git status --short` also listed `?? prompt/maintenance/local/plans/active/10_task-scoped-context-brief-read-architecture.md`. This lane did not create, open, or modify that file. It does not overlap the report path, but its appearance is a literal conflict surface relative to the packet's clean-start snapshot.

### Post-report checks

- `git diff --check` → RC 0. Because the report is untracked, this command only checks tracked diffs and is not used as proof of the report's whitespace.
- `rg -n '^## A[1-8]\.' prompt/maintenance/local/investigations/2026-08-27_task-scoped-brief/01_current-architecture-inventory.md` → 8/8 named sections found, RC 0.
- `bash scripts/selftest.sh; selftest_rc=$?; printf 'SELFTEST_RC=%s\n' "$selftest_rc"` → **78 passed / 0 failed**, RC 0 (**synthetic** harness verification). This verifies the harness invariants it enumerates; it does not independently validate the report's interpretation or the unavailable packet-duplication quantity.

## Investigation outcome

The present architecture has two different delivery shapes: repo-aware cold start uses one full mandatory owner plus a path/trigger manifest, while no-repo Route B uses one complete, HEAD-stamped payload containing all exported owner sections. The latter's measured weight is dominated by `CURRENT STATE` (58,210 B plain, 56.72%) and `SETTLED DECISIONS` (37,488 B, 36.53%). `--rules 22` adds 4,132 B exclusively to `RULE TL;DRS`. These are observations, not a proposed Core/Objective-specific split.
