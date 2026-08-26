# S008-E — integration falsification

**Packet:** `S008-E-integration-falsification`  
**Lane:** `FALSIFICATION`  
**Authority:** `DELEGATED` / integration owner = Claude Code harness session (digicode-text S008)

## 結論

final tree での内訳は **UPHELD 2 / OVERSTATED 3 / REFUTED 3 / UNVERIFIABLE 0**。C4・C7 は支持された。C2 は約 33% という規模こそ再現したが、旧値は同じ推定器で **88,138 estimated tokens**、現行は「disk 再読込をしない」という新契約を守っても **59,490 estimated tokens**で、rule 13 は今も disk 再読込を命じている。後から出現した in-scope `04_cold-start-reconstruction.md` も読み、17/17 reconstruction・2 false facts・6/6 negative-control detection を本報告の独自 mutation と照合した。

この lane 中に integration owner が並行訂正し、router/body は 46→47 rows、read-load は 58,262→58,761 estimated tokens、brief は 88,618→90,100 bytes、`CLAUDE.md` は 10,060→10,236 estimated tokensへ動いた。stub 53、B70/B71 attribution、GEN close contract、baton 52、context-brief の不存在 guard claim は final tree で訂正された。一方、その更新で C1/C3/C8 の exact claims は final tree と一致しなくなった。**このまま Human へ出すのは不適合**である。

## C1 — unconditional cold-start read

**Verdict: REFUTED**

packet 開始 tree の `bash scripts/read-load.sh` は RC=0、**58,262 estimated tokens / allowance 48,000 estimated tokens = 121% / inputs 7/7**で、claim はその snapshot では再現した。しかし integration owner の並行訂正後、final run は RC=0、**58,761 / 48,000 = 122% / inputs 7/7**。`git archive HEAD` の throwaway tree は RC=0、**65,868 / 48,000 = 137% / inputs 7/7**だった。`scripts/read-load.sh` 自体に working-tree diff はなく、全 run は header の同じ式

```text
tokens = ascii_chars / 2.862 + nonascii_units / 0.788
```

を使用する。Human に出る final-tree corrected statement は **65,868→58,761 estimated tokens、137%→122%、7/7 inputs、差 -7,107 estimated tokens**。これは architecture split だけの効果ではなく、`CLAUDE.md` 増加、S008 Human rulings、hook/guard 訂正も含む。

## C2 — real cold-start context cost / duplicate read

**Verdict: OVERSTATED**

旧 HEAD と現ツリーそれぞれで hook を実行し、JSON の `additionalContext` を取り出し、`read-load.sh` header と同じ式を独立に適用した。

| quantity | own measurement |
|---|---:|
| old `read-load.sh` total | 65,868 estimated tokens |
| old handover full | 30,489 estimated tokens (script row is 30,488; newline handlingによる 1-token 差) |
| old handover first 200 lines | 21,914 estimated tokens / 57,994 bytes |
| old whole hook context | 22,671 estimated tokens / 60,138 bytes |
| old hook framing beyond clipped handover + bug index | 356 estimated tokens |
| final `read-load.sh` total | 58,761 estimated tokens |
| final whole hook context | 23,146 estimated tokens |
| final handover full | 22,016 estimated tokens |
| final hook framing beyond full handover + bug index | 729 estimated tokens |

旧 reader が hook payload に加えて full handover を disk から読む、という claim 自身のモデルなら、総量は

```text
65,868 + 21,914 + 356 = 88,138 estimated tokens
```

であり、**87,781 ではない**。87,781 は `65,868 + 21,913` だけで、hook directive/framing を「real context」から落としている。現行で hook injection が disk read を代替するなら、総量は

```text
58,761 + 729 = 59,490 estimated tokens
```

となり、旧 88,138 から **-32.5%**。したがって「約 59,000」「約 -33%」の規模は丸めの範囲で再現する。

しかし二重読込は repository 内で解消していない。`CLAUDE.md:17` は injection が read を満たすと言う一方、mandatory full-read である `global/rules/common/13-session-recovery.md:15` は **“Re-read the rules and handover from disk every cold start”**、同 rule `:122` は compaction 後も cold start として re-read を命じる。`maintenance_index.md:48-55` と `CLAUDE.md:294-297` の要約も disk の 16.md を読む順序を残す。現行 reader が rule 13 を優先すると、59,490 に full handover 22,016 が再加算され、**81,506 estimated tokens** になる。

また hook copy と disk file の GEN は mid-session edit では同じ `S007-close` のまま内容だけ食い違い得る。`CLAUDE.md:17` の「GEN looks stale (then disk wins)」ではその状態を識別できない。session resume / `/clear` は hook の再実行を repository が主張するが、compaction について hook comment と `CLAUDE.md:292` は列挙せず、rule 13 だけが disk re-read を要求している。実 transcript を packet 内から取得できないため、旧 session の actor が実際に二度読んだことも repository artifact からは確定できない。

**Corrected statement:** 「同じ estimator による規範上の worst/careful-reader model は旧約 88,138、新契約を一貫して守る場合は final tree 約 59,490 estimated tokens（約 -32.5%）。ただし rule 13 と read contract が衝突しており、二重読込解消は未成立。87,781 は hook framing を除いた部分値である。」

## C3 — no current truth deleted / verbatim relocation

**Verdict: REFUTED**

packet 開始時の `bash scripts/handover-diff.sh` は RC=0、**3 owners / 84 previous / 134 current / REWORDED 1 / GONE 0**だった。しかし final tree は RC=0、**3 owners / router 84→89 / batons 0→47 / total 84→136 / REWORDED 1 / GONE 1**。GONE は並行訂正で全面更新された旧 baton 52 body を指す。したがって Human-facing current claim の `GONE 0` は literal に反証された。integration owner が `done / relocated / dropped by user / lost` のいずれかへ分類する必要がある。

instrument が比較するのは router の §2 baton text cell + §3 bullet と `batons.md` の baton text cellだけで、`evidence-map.md` は明示的に mode `none`、Status / Trigger / Owner / Sev cells も比較しない。

独立 static compare では旧 45 baton rows は body owner に **45/45 present**、**44/45 full rows exact**、baton 43 のみ実測更新で変更されていた。旧 §1 の evidence/provenance 部分は対象 46 nonblank lines が **46/46 exact**。旧 §4 は 20 nonblank lines 中 **19 exact**で、1 行は

```text
Project_Template is NOT modified from this repository (§3)
```

から

```text
Project_Template is NOT modified from this repository (16.md §3)
```

へ変わっている。意味は保持されているが、§4 全体を「verbatim move」と呼ぶのは literal に誤りである。

さらに throwaway repo で `evidence-map.md` の feedback item #11 を 1→0 rows に削除して `handover-diff.sh` を実行すると、RC=0、evidence owner `0 -> 0`、**GONE (0) over 134 entries** のままになった。よって GONE 0 は evidence/loop/feedback current truth の non-deletion を証明しない。

**Corrected statement:** 「旧 baton 45/45 と evidence block の全行は static comparison で残り、§4 も 1 行の参照明確化を除き保持された。その後の correction を含む final `handover-diff.sh` は GONE 1/84 を示すため分類が必要。いずれにせよ 3-owner current truth 全体の non-deletion detector ではない。」

## C4 — every stub carries the protection needed for safety

**Verdict: UPHELD**

final router/body を全 **47/47 baton IDs** で照合した。lane C が semantic dependency を判定したのは 45 batons（2–52）であり、31 `SAFE_ONLY_WITH_STUB` の integrator 版 stub は、実測更新された 25/43 を除き lane C の minimum payload と一致する。14 `SAFE_IF_TRIGGERED` rows も、少なくとも未採用・未検証・Human GO・誤 proxy 等の limitation を router row 内に保持する。

packet 開始時は **baton 53 の stub が不足**していた。Body は owner 増減時に次を同時更新しなければ「残りが green のまま事実が静かに落ちる」と禁止していた。

- B69/B70/B71
- `read-load.sh` ROSTER
- `context-brief.sh` allowlist
- hook manifest

integration owner は lane 中に stub 53 を拡張し、ROSTER・brief allowlist・hook manifest・CLAUDE §0・handover-diff OWNERS の同一 commit 更新を final router に入れた。さらに新設 54 は「単一 detector は全 loss を捕らえない」「handover-diff は §2/§3 only」「selftest は単一 §3 ruling を逃す」「B69 は disk truncation を逃す」を stub に保持し、Trigger も detector 引用前/§2§3外 section 追加時とする。final tree では、lane C 後に追加された 53/54 を含め、body を開かない reader に必要な prohibition/limitation が router にある。

Lane D (`04_cold-start-reconstruction.md`) は 17/17 questions、0 misses、0 late facts と再構成した。packet-start 時点では owner 増減 operation を question/mutation に含めず A17 で safety assertion をそのまま復元していたが、final stub 53 の correction によりこの分岐は解消した。

ただし guard の盲点は残る。final-tree throwaway copy で baton 44 の

```text
Competitor accounts ... require named Human GO; run no real-use test without it
```

を `See baton 44.` に置換しても、B71 は **47/47 green**。B71 は ID 対応だけで、stub が禁止を運んでいるかを測らない。C4 の UPHELD は current text の static semantic readingであり、executable semantic guarantee ではない。

## C5 — detection power of B69/B70/B71 and B51

**Verdict: OVERSTATED**

live `bash scripts/selftest.sh` は RC=0、**78 passed / 0 failed**。claim に挙げた出力は実在する。

- B69: **2/2 complete**, controls **3/3**
- B70: **2 conditional owners**, controls **5/5**
- B71: **47/47 stubs/bodies**, controls **4/4**
- B51: relocation / body loss / missing owner を含む owner-set controls green

ただし controls は実装者が選んだ mutation にだけ detection power を示す。実行した盲点 mutation は後節のとおり、B69 は actual hook registration、B70 は manifest の構文的位置、B71 は stub semantics、B51/handover-diff は `mode none` owner の内容を見ない。特に B70 の実装は CLAUDE.md 全文から path-looking strings を集め、hook **全文中の substring presence** を manifest membership と呼んでいる。packet 開始時の `CLAUDE.md:28` は stub deletion を B70 に誤帰属していたが、integration owner は final tree で B71 へ訂正した。

Lane D の 6 controls は **6/6 いずれかの repository mechanism で detected**だった一方、同 lane 自身も「disk router を 237→200 lines に truncateすると B69 と handover-diff は green」と観測した。これは named mechanisms の相補性を示すが、本報告の B69/B70/B71/B51 blind mutations 4/4 が targeted green だった事実を打ち消さない。control set が異なる。

**Corrected statement:** 「各 check は named positive controls に対して detection power を持つ。B69 は direct script output の byte inclusion、B70 は GEN/path existence/path substring、B71 は numeric ID-set equality、B51 は parsed text-cell loss を検出する。runtime registration・manifest AST membership・stub meaning・mode-none owner content は未検出。」

## C6 — context brief grew and became more complete

**Verdict: OVERSTATED**

claim を読み始めた tree で `bash scripts/context-brief.sh > "$brief_out"` は RC=0、**88,618 bytes**。output 内で §3 の S008 product rulings、loop `① harvest`、template feedback queue #1–#11 を直接確認した。旧 script は 16.md §1–§3 だけを extract し §4 を export しなかったため、「旧 brief が loop / feedback queue を omit した」は static に支持される。lane B report はその時点の clean pre-report tree を **77,190 bytes** と実測し、同 report 追記後は dirty metadata/digest により **77,343 bytes** と記録している。

しかし 77,190 snapshot は uncommitted intermediate state で repository に保存されておらず、同一 tree を独立再実行できない。`git archive HEAD` の旧 exporter は別 temp root / transcript corpus という confounderで 77,354 bytes・RC=3となり、比較値として無効だった。また 11,428-byte の net growth には loop/queue だけでなく、S008 product rulings、`CLAUDE.md` 増分、owner export shape、dirty-tree metadata/digest が同時に入る。「増えたから completeness が増えた」という一方向の因果は instrument が分離していない。

さらに `04_cold-start-reconstruction.md` と本 report が in-scope directory に現れた最終 tree で再実行すると、RC=0、**90,100 bytes**へ動いた。owner content を変えず falsification artifacts を追加しただけで **+1,482 bytes**動くため、88,618 は final-tree current value ではなく integration時点の snapshot である。

**Corrected statement:** 「integration claim 時点の brief は 88,618 bytes、falsification artifacts を含む final tree は 90,100 bytesで、以前 omit していた loop/feedback queue を現に含む。lane B が earlier snapshot を 77,190 bytes と記録したが、delta は複数変更と metadata を含み、全増分を completeness に帰属できない。」

## C7 — new Human product rulings are unconditional

**Verdict: UPHELD**

3 rulings は `16_次セッション引き継ぎ指示書.md:195-199` の §3 に全文で存在する。

1. 主 target は専門領域を持つ embedded/IoT beginner
2. 「簡単」は機能削減でなく複雑さの隠蔽
3. 小中高は排除しないが主戦場・主評価軸ではない

final hook JSON の `additionalContext` は router 240/240 lines を一度だけ連続して含み、B69 live も 2/2 whole。`context-brief.sh` output にも 3/3 rulings が存在した。したがって通常の SessionStart delivery と repository-access cold start の両方で unconditional owner にある。

限界: auto-loaded `CLAUDE.md:127-138` には旧 provisional target-users が残るが、新 ruling 自身がその contradictory reading を supersede すると明記する。これは削除を packet 内で要求できるものではなく、Human の別裁定待ちという current statement である。

## C8 — CLAUDE.md cost is +1,189 estimated tokens

**Verdict: REFUTED**

同一 `read-load.sh` の file rowで旧 HEAD の `CLAUDE.md` は **8,871 estimated tokens**。packet 開始時は **10,060、差 +1,189**で claim を再現したが、parallel corrections 後の final tree は **10,236、差 +1,365 estimated tokens**。Human に出る current cost は +1,189 ではない。

**Corrected statement:** 「final `CLAUDE.md` cost は HEAD 比 +1,365 estimated tokens。増分の一部は後述の current-fact ownership violation であり、cost の開示は配置を正当化しない。」

## C1–C8 外で見つかった defects

### 🔴 ADJACENT_DEFECT — `CLAUDE.md` が current fact を所有し、すでに drift した

`CLAUDE.md:57-73` は「この file は current fact の owner ではない」「measured count を書くな」と禁止するが、§0 `:21-28` は **2026-08-27 S008 / owner set=3 / baton count / B69-B71** という current architecture を所有する。final B71 は **47/47**。`:21` は「45 は past measurement、live count は B71」と訂正されたが、`:25` はなお **“body and grounds of all 45 batons”** と current count を断言する。selftest B54 は `CLAUDE.md` §§2–3 しか scan せず、§0 に移した同型 violation を green にした。

### 🟡 ADJACENT_DEFECT — maintenance index の更新 trigger と rendering

`maintenance_index.md:3-7` は構造変更時に header の最終更新を動かす契約だが、batons/evidence-map を追加した現在も最終更新は 2026-08-25。さらに `:36-38` の `local/handover/` table row は複数 physical lines に分割され、37/38 行が Markdown table cell でなく本文になる。構造地図の表示と update history が変更と一致しない。

### 🔴 ADJACENT_DEFECT — self-measuring brief number was copied into files with no update trigger

packet は「measured number を update trigger のない file に書くこと」を明示的に禁じた。final `scripts/context-brief.sh:24-25` と baton 52 body は **77,190→90,100 bytes / 91%** を prose にコピーしたが、brief は dirty-tree metadata/digest と owner body 自身を含むため、report追加・commit・次 close で動く。実際この lane だけで 88,618→90,100へ動いた。script comment に再測定/更新 trigger はなく、baton body の trigger は cap proximity/別 objective で毎回の output変化ではない。これは C6 が示した volatility を同じ形式で永続化している。

### 🟢 RESOLVED-DURING-LANE — parallel integrator corrections

packet-start で見つけた `/close` GEN 自己矛盾、baton 52 stale body、stub 53 の欠落、context-brief comment の不存在 guard claim、B70/B71 attribution は integration owner が final tree で訂正した。これは本 lane が直したものではない。訂正後の再測定が C1/C3/C4/C6/C8 の final verdict に反映されている。

### 🟢 HARDENING — enumerated forbidden surfaces は保持

`git diff` / `git status` と HEAD/current threshold compare では、application `package.json` / `tsconfig.json` は双方 absent、`prompt/maintenance/global/` と `Project_Template` diff は 0 files、`READ_ALLOWANCE=48,000 tokens`、`READ_REVIEW=68,000 tokens`、`BRIEF_MAX_BYTES=98,304 bytes` は HEAD と同一。product code、global rules、template、threshold を integrator が触った証拠はない。current truth の actual static comparisonでも旧 baton ID の欠落はなかった。rule 17 inclusion direction / rule 24 widening の forbidden surface はこの範囲では発火していない。

## what the new checks cannot see

全 mutation は real tree ではなく `mktemp -d` の throwaway copy で実施し、変更件数/行を確認してから check output を読んだ。copy 特有の B24/B68 transcript-root failures は対象 check と無関係で、各 targeted check の green 行をそのまま記録した。

### B69 — actual SessionStart registration command

Mutation: `.claude/settings.json` の SessionStart command を `session-start.sh` から `pre-commit-gate.sh` へ **1 occurrence** 差し替えた。event key は残るため settings JSON check は greenだが、実 SessionStart は handover を注入しない。

Observed targeted output:

```text
✅ valid JSON with SessionStart + PreToolUse hooks
✅ B69 hook injects each mandatory owner whole: 2/2 complete, 0 truncation markers ... 3/3
```

B69 は hook file を直接実行するだけで、settings がその file を登録しているかを見ない。

### B70 — manifest membership versus a path substring in a comment

Mutation: hook の `evidence-map.md` tuple 3 lines を comment outし、path string は comment に残した。確認 probe は `HOOK_PAYLOAD_HAS_EVIDENCE_MAP=NO`。

Observed targeted output:

```text
✅ B70 owner set agrees with itself: 2 conditional owners share the router's GEN,
exist on disk and are named in the hook manifest (controls 5/5 ...)
```

B70 の predicate は `rel in htext` であり、manifest AST/list membership ではない。

### B71 — stub semantics

Mutation: router baton 44 の Human-GO prohibition sentence を **1 occurrence** `See baton 44.` に置換。ID / Status / Trigger / Owner / Sev は維持した。

Observed targeted output:

```text
✅ B71 baton stub <-> body: 47/47 (stubs/bodies) — every body has a router stub
and every stub resolves to a body, no duplicate ids (controls 4/4 ...)
```

B71 は ID sets だけを比較し、stub が prohibition/limitation を保持するかを見ない。

### B51 / handover-diff — content in a `mode none` owner

Mutation: baseline commit を持つ throwaway repo で `evidence-map.md` feedback item #11 を **1 row → 0 rows** に削除。

Observed output:

```text
current-state files scanned: 3 (owner set)
0 -> 0 [none] prompt/maintenance/local/handover/evidence-map.md
§2/§3 entries parsed over the owner set: 134 before, 134 now
GONE (0) over 134 entries compared across 3 owners
RC=0
```

B51 の owner-presence control は file 全欠落を捕らえるが、存在する `mode none` owner の partial current-truth loss は捕らえない。

## Human 提出適合性

**現状のまま Human に提出するのは不適合。** 数値改善の方向と final C4/C7 は立つが、C1/C3/C8 の exact claims は本 lane 中の integration correction 後の final tree と一致せず、C2 は conflicting read contracts を解消した前提でのみ約 59.5k、旧 exact valueも 357 estimated tokens 過少である。C5 の checks は architecture を壊す現実的 mutation を targeted green にし、C6 の self-measuring byte value は update trigger なしで source/body へ再転記された。少なくとも final read-load/brief/CLAUDE cost と GONE 1 の分類を synthesis に反映し、cold-start disk/injection contract と guard scope を限定するまでは「real cost」「GONE 0」「detection power」を Human-facing claim に残せない。

## Verification record

- `[synthetic]` `bash scripts/read-load.sh; RC=$?` → packet-start 58,262/48,000 estimated tokens (121%)、final 58,761/48,000 (122%)、双方 7/7・RC=0。
- `[synthetic]` HEAD archive 内 `bash scripts/read-load.sh; RC=$?` → 65,868/48,000 estimated tokens, 137%, 7/7, RC=0。
- `[synthetic]` old/current hook JSON + repository estimator の独立再計算 → old hook 22,671 / clipped 21,914 / framing 356; final hook 23,146 / handover 22,016 / framing 729 estimated tokens; probe RC=0。
- `[synthetic]` `bash scripts/handover-diff.sh; RC=$?` → packet-start owners 3・84→134・GONE 0、final owners 3・84→136・GONE 1、双方 RC=0。
- `[synthetic]` `bash scripts/context-brief.sh > "$brief_out"; RC=$?; wc -c` → integration snapshot 88,618 bytes、04/05 出現後の final tree 90,100 bytes、双方 RC=0。rulings 3/3 と loop/queue を payload で確認。
- `[synthetic]` final `bash scripts/selftest.sh; RC=$?` → 78 passed / 0 failed、B71 47/47、RC=0。
- `[static]` HEAD/current exact-row compare → old baton 45/45 present, 44/45 exact; evidence block 46/46 exact; §4 19/20 exact lines; probe RC=0。
- `[synthetic]` throwaway mutations → B69/B70/B71 targeted checks 3/3 survived; B51/handover-diff mode-none mutation 1/1 survived。これは kill count ではなく **survived/attempted mutations = 4/4**。
- `[static]` threshold/scope compare → 3 thresholds unchanged; global/template diff 0 files; package.json/tsconfig.json 0/2 present。
- `[not run]` API-smoke / visual / real-fire / network / donor read / product tests。application code がなく、packet は repository-local falsification に限定。mutation harness 全体は未実行（この packet の独自 mutation を使用）。
