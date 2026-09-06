# S009-L4 — 実 dispatch 重複測定と cross-lane 再検証

- Packet: `S009-L4-brief-packet-duplication`
- Lane: `VERIFICATION`
- 測定日: 2026-08-27 JST
- 対象 HEAD: `139c202dcda542d103752744737651c21ce20a1f`
- 検証ラベル: journal / source / history の読解は `static`、brief 生成・byte/count・shingle 再計算は `synthetic`。`API-smoke` / `visual` / `real-fire` は実施していない（本 packet は文書・履歴・生成物の検証であり、アプリケーションは存在しない）。

## D1. Packet artifacts located

3/3 packet を取得した。ここでいう packet は各 journal の `response_item` のうち、`payload.type == "message"`、`payload.role == "user"`、かつ対象 `PACKET_ID` を含む `input_text` の全文である。system / developer prompt と delegate の返答は含めていない。

| sample | `PACKET_ID` | read-only journal | 抽出先（一時 artifact） | bytes |
|---|---|---|---|---:|
| L1 | `S009-L1-architecture-inventory` | `/Users/ohahiso/.codex/sessions/2026/08/27/rollout-2026-08-27T03-08-11-01a03f42-1701-7da0-bc43-a5521f5a7442.jsonl` | `$TASK_TMP/L1.packet.txt` | 8,685 B |
| L2 | `S009-L2-failure-modes` | `/Users/ohahiso/.codex/sessions/2026/08/27/rollout-2026-08-27T03-10-10-01a03f43-e83a-7db2-a9a0-23cc8f1b64be.jsonl` | `$TASK_TMP/L2.packet.txt` | 10,477 B |
| L3 | `S009-L3-allowance-and-effort` | `/Users/ohahiso/.codex/sessions/2026/08/27/rollout-2026-08-27T03-12-10-01a03f45-bd06-72c3-b38d-ab37c8e607aa.jsonl` | `$TASK_TMP/L3.packet.txt` | 9,780 B |
| **total** | 3/3 | 3 journals | 3 packet files | **28,942 B** |

抽出 command（`$TASK_TMP` は `mktemp -d "${TMPDIR:-/tmp}/s009-l4.XXXXXX"` の結果）:

```bash
jq -j --arg id "$packet_id" \
  'select(.type=="response_item" and .payload.type=="message" and .payload.role=="user")
   | [.payload.content[] | select((.text // "") | contains($id)) | .text]
   | join("\n")' \
  "$journal" > "$output"
wc -c "$TASK_TMP"/L?.packet.txt
rg -o '^PACKET_ID: .*' "$TASK_TMP"/L?.packet.txt
```

`rg` で各 ID が current L4 journal にも見つかったため、最初の path match は artifact 同定に使わなかった。各 ID を含む別 journal を選び、上の role/type predicate と packet 本文内の `PACKET_ID` で照合した。[static]

brief は次で生成した。

```bash
bash scripts/context-brief.sh > "$TASK_TMP/brief.txt"
brief_rc=$?
printf 'BRIEF_RC=%s\n' "$brief_rc"
wc -lc "$TASK_TMP/brief.txt"
```

観測: `BRIEF_RC=0`、410 lines、102,782 B。[synthetic] packet dispatch 後に共有 worktree へ未追跡成果物が追加されたため、brief header は `Dirty count: 2` だった。packet に書かれた開始時の `clean` と時間的に同一ではない。

## D2. Exact whole-line intersection

方法は、各行の前後 ASCII whitespace を除去し、空行を除外し、`sort -u` で unique line set にしたうえで `comm -12` を取った。したがって単位は「正規化後の distinct whole line」であり、同一行の出現回数は数えない。shared file の byte 数は改行 LF を含む。

```bash
trim_unique() {
  LC_ALL=C awk '{ sub(/^[[:space:]]+/, ""); sub(/[[:space:]]+$/, "");
    if (length($0)>0) print }' "$1" | sort -u > "$2"
}
trim_unique "$TASK_TMP/brief.txt" "$TASK_TMP/brief.lines"
for lane in L1 L2 L3; do
  trim_unique "$TASK_TMP/$lane.packet.txt" "$TASK_TMP/$lane.lines"
  comm -12 "$TASK_TMP/$lane.lines" "$TASK_TMP/brief.lines" \
    > "$TASK_TMP/$lane.shared.lines"
  wc -lc "$TASK_TMP/$lane.shared.lines"
done
sort -u "$TASK_TMP"/L?.shared.lines > "$TASK_TMP/all.shared.lines"
wc -lc "$TASK_TMP/all.shared.lines"
```

| packet | exact shared distinct lines | shared bytes |
|---|---:|---:|
| L1 | 0 lines | 0 B |
| L2 | 0 lines | 0 B |
| L3 | 0 lines | 0 B |
| **3 packet union** | **0 lines** | **0 B** |

結論: whole-line equality は semantic duplication を全く可視化できない。[synthetic]

## D3. Shingle-level overlap

N は **4 words** とした。N=3 は generic phrase の偶然一致が多く（raw hit: L1=8 / L2=23 / L3=24）、N=6 は実際の短い clause をほぼ全て落とした（0 / 0 / 2）。N=4 は短い clause を拾いつつ、手動で false positive を判定できる中間点だった。tokenizer は Unicode NFKC → lowercase → regex `\w` と `./~-[]=: +%` 相当の path/value 文字を保持し、各行内だけで連続4 tokenを作る。packet shingle を brief の全 shingle と照合し、同一 packet/brief line 上で連続する hit は maximal passage に併合した。

再現 command は次の Python 3 one-shot（入力は read-only、一時出力なし）である。

```bash
TASK_TMP="$TASK_TMP" python3 - <<'PY'
# N=4; Unicode NFKC/lowercase; line-bounded token shingles.
# Build brief shingle -> (line, token offset), intersect each packet,
# then merge collinear adjacent hits into maximal passages.
PY
```

実際に列挙された passage は以下の全件である（`P` = packet line、`B` = brief line）。raw shingle hit は、同じ passage 内の重なる window と、同じ phrase の brief 内複数出現を別々に数える。

| packet | raw 4-word hits | maximal match (`packet ↔ brief`) | matched passage |
|---|---:|---|---|
| L1 | 0 | なし | — |
| L2 | 4 | P28 ↔ B158 | `current truth だけを安全に export` |
| L2 |  | P28 ↔ B175 | `current truth だけを安全に export` |
| L2 |  | P35 ↔ B93 | `settled decisions never reopen` |
| L2 |  | P99 ↔ B270 | `bash scripts/context-brief.sh wc -c` |
| L3 | 8 | P26 ↔ B243 | `the unconditional cold-start read` |
| L3 |  | P26 ↔ B160 | `read_allowance = 48 000` |
| L3 |  | P28 ↔ B161 | `baton 43 opus 5 effort` |
| L3 |  | P54 ↔ B204 | `current truth to move a size signal` |

L2 P99 ↔ B270 は命題重複ではなく、packet-native な測定 command が brief 内の owner command と一致した false positive である。残りは project truth の語句共有だが、shingle 自体は proposition の同一性を証明しない。[synthetic + static]

## D4. Hand-enumerated semantic restatements

次表は packet が project ruling / prohibition / threshold / measured value を再掲した全 line を、brief の対応 line へ結び直したもの。1 packet line が複数 proposition を持つ場合は brief line を併記した。`VERBATIM` は対応 passage が byte-for-byte 同じもの、`PARAPHRASED` は値だけ同じ場合を含め、命題全体の文言が異なるものとした。

| packet line | brief line | duplicated proposition | form | class |
|---|---|---|---|---|
| L1 P22 | B3–B5 | repository / branch / HEAD | PARAPHRASED（値は同一） | CITABLE |
| L1 P22 | B157, B270 | no-repo actor 向けの complete single payload、current truth 比例成長、128 KiB が最後の raise | PARAPHRASED | CITABLE |
| L1 P24 | B158, B175 | task-scoped export Objective と「必要な current truth だけ」の問い | PARAPHRASED | CITABLE |
| L1 P50 | B157, B160, B203 | owner/cap/allowance/threshold をこの lane が変更しない | PARAPHRASED | CITABLE |
| L1 P51 | B157, B160, B270 | `BRIEF_MAX_BYTES=128 KiB`、`READ_ALLOWANCE=48,000`、threshold は Human-GO-gated | PARAPHRASED（値は同一） | CITABLE |
| L1 P52 | B104, B355 | `Project_Template` はこの repo から変更しない | PARAPHRASED | CITABLE |
| L1 P53 | B99, B203–B204 | donor は READ ONLY、legacy governance/history を持ち込まない | PARAPHRASED | CITABLE |
| L1 P76 | B157, B160, B203, B270 | threshold/cap/allowance を変更しない | PARAPHRASED | MUST_DUPLICATE |
| L1 P82 | B101 | pre-commit gitleaks gate の存在 | PARAPHRASED | CITABLE |
| L2 P22 | B3–B5 | repository / branch / HEAD | PARAPHRASED（値は同一） | CITABLE |
| L2 P24 | B158–B159 | task-scoped export ruling と classifier / wrong-owner / no-owner control が 0 | PARAPHRASED | CITABLE |
| L2 P28 | B158, B175 | Objective に必要な current truth だけを安全に export する問い | PARAPHRASED | CITABLE |
| L2 P34–P37 | B271 | current-state owner 3 files と router / baton body / evidence-map の役割 | PARAPHRASED | CITABLE |
| L2 P35 | B93, B204 | settled decisions は reopen しない | PARAPHRASED | CITABLE |
| L2 P45 | B99, B101, B146, B157, B198–B204 | GO/STOP、Opus solo、secret、donor、current-truth deletion の禁止例 | PARAPHRASED | CITABLE |
| L2 P61 | B272 | baton 54: 単独機構は全損失を捕捉せず、B71 は stub の意味的十分性を見ない | PARAPHRASED | CITABLE |
| L2 P63 | B157, B270 | brief は current truth に比例して再膨張し cap に達するという ruling | PARAPHRASED | CITABLE |
| L2 P69 | B157, B160, B270 | cap / allowance / threshold は Human-GO-gated | PARAPHRASED（値は同一） | CITABLE |
| L2 P70 | B157, B204, B270 | current truth を size のために削らない | PARAPHRASED | CITABLE |
| L2 P71 | B104, B355 | template をこの repo から変更しない | PARAPHRASED | CITABLE |
| L2 P93 | B157, B204, B270 | current truth の削除・短縮禁止 | PARAPHRASED | MUST_DUPLICATE |
| L2 P94 | B157, B160, B203, B270 | threshold / cap の変更禁止 | PARAPHRASED | MUST_DUPLICATE |
| L3 P22 | B3–B5 | repository / branch / HEAD | PARAPHRASED（値は同一） | CITABLE |
| L3 P24 | B160–B161 | allowance / effort は investigation/proposal のみで、変更は Human-GO-gated | PARAPHRASED | CITABLE |
| L3 P26 | B160, B243, B393 | unconditional cold-start、48,000、62,570、WARNING、derivation record 不在という recorded claim | PARAPHRASED（48,000 は同一） | CITABLE |
| L3 P28 | B161, B261 | `opus[1m]`、top-level `xhigh`、modelSettings `medium`、6/1,427 と 47/47 | PARAPHRASED（値は同一） | CITABLE |
| L3 P50 | B157, B160–B161 | effort / allowance / review / cap を変更しない | PARAPHRASED | CITABLE |
| L3 P52 | B104, B355 | template をこの repo から変更しない | PARAPHRASED | CITABLE |
| L3 P54 | B157, B204, B270 | size signal のため current truth を削らない | **VERBATIM passage**: `current truth to move a size signal` | CITABLE |
| L3 P77 | B161, B261 | effort setting は Human GO なしに変更しない | PARAPHRASED | MUST_DUPLICATE |
| L3 P78 | B157, B160, B203, B270 | threshold / allowance / cap を変更しない | PARAPHRASED | MUST_DUPLICATE |

L1 P22 の `102,629 bytes plain / 106,761 bytes --rules 22` は生成した brief 自身には載っておらず、今回の plain 実測も 102,782 B である。この2値は **重複として数えていない**。L1 P77 / L2 P22 / L3 P22 の `clean` は dispatch 時点の記録だが、今回の brief B6–B7 は concurrent untracked files により dirty だったため、`clean` も重複として数えていない。

## D5. Classification: `MUST_DUPLICATE` / `CITABLE` / `PACKET_NATIVE`

分類単位は packet の物理 line（末尾 LF 込み）。D4 の semantic truth line を `CITABLE`、そのうち `STOP_IF` に置かれた critical project stop を `MUST_DUPLICATE`、残りを `PACKET_NATIVE` とした。この排他的 partition は全 28,942 B と一致する。mixed line は line 全体を truth class に置くため、`CITABLE` / `MUST_DUPLICATE` bytes にはその line の packet-specific framing も含む。

```bash
# Python 3: read_bytes().splitlines(keepends=True), then sum byte length by line-number set.
# MUST: L1{76}, L2{93,94}, L3{77,78}
# CITABLE: L1{22,24,50,51,52,53,82}
#          L2{22,24,28,34,35,36,37,45,61,63,69,70,71}
#          L3{22,24,26,28,50,52,54}
# all unassigned physical lines => PACKET_NATIVE
```

| packet | MUST_DUPLICATE | CITABLE | PACKET_NATIVE | total |
|---|---:|---:|---:|---:|
| L1 | 85 B | 1,612 B | 6,988 B | 8,685 B |
| L2 | 194 B | 3,146 B | 7,137 B | 10,477 B |
| L3 | 194 B | 2,121 B | 7,465 B | 9,780 B |
| **total** | **473 B** | **6,879 B** | **21,590 B** | **28,942 B** |

`CITABLE = 6,879 B`（全 packet bytes の 23.77%）が、brief ID / line-range reference に置換し得た measured duplication problem である。[inferred] reference 自体の置換後 bytes は設計していないため、6,879 B は gross duplicated line weight であり net saving ではない。

rule 22:174–181 と packet template contract rule 2（template:75–79）は critical stop を **verbatim** に継承するよう要求する。しかし D4 の MUST 5 lines は全て brief と PARAPHRASED であり、VERBATIM ではない。これは packet artifact と contract の literal conflict である。命令の存在は保たれているが、contract compliance は 0/5 critical duplicated lines。[static]

## D6. Measurement limits and error direction

1. Exact-line intersection は punctuation、Markdown、前置き、言語、line wrapping のどれか一つが違うだけで 0 になる。この task では semantic duplication を大幅に **under-count** した。`sort -u` のため反復回数も under-count する。
2. 4-word shingle は順序を保つ局所一致だけを見ており、語順変更・同義語・英日翻訳・line break 越しの一致を見ない。日本語の空白なし clause は長い1 token になりやすく、主方向は **under-count**。一方、command や generic phrase（L2 P99）の偶然一致は **over-count** を起こす。
3. 手動 semantic enumeration は proposition 対応を見られるが、判定者依存である。D4 は ruling/prohibition/threshold/measured value に限定し、task question・acceptance・output contract を除いたため、一般説明の重複を **under-count** し得る。
4. D5 は mixed line 全体を一 class にするため `CITABLE` / `MUST_DUPLICATE` を **over-count** する。したがって 6,879 B は gross upper-bound proxy。reference ID の byte cost を差し引いていないので net saving より大きい。
5. packet は dispatch 時の artifact、brief は本 lane 実行時の生成物であり時間差がある。HEAD は同じだが dirty state と plain byte size は変化した。dispatch 時 brief を journal が保存していないため、その時点の exact bytes は `NOT OBTAINED`。
6. journal 抽出は user packet 本文だけを測り、Codex system/developer context は分母外。従って「dispatch 全体の transport cost」ではなく「filled delegation packet text」の測定である。

## D7. Claim V1 verdict — CONFIRMED

**Verdict: CONFIRMED.** repository の「48,000 の derivation record が無い」という current statement は、現行 repository artifact 自身により反証される。

- `scripts/read-load.sh:56–79` は `200,000 - 31,200 - 579 = 168,221` を示し、line 68–71 で `READ_ALLOWANCE 48,000 = 168,221 - 120,000` と明記する。[static]
- `git log --follow -- scripts/read-load.sh` は commit `2a18176c845dbea626d63134d56523e1a958c2a3` の1件だけを返した。`git rev-list --all --count -- scripts/read-load.sh` = 1、unique SHA count = 1。[static]
- `git blame -L 56,79 -- scripts/read-load.sh` は全24 lines を同じ bootstrap commit `2a18176c` に帰属させた。[static]

S004 の同一 passage は、次の2つを同時に述べる（verbatim）。

`prompt/maintenance/local/handover/sessions/S004_2026-08-26_handover-compliance-and-read-load.md:57–60`:

```text
`scripts/read-load.sh` は **template のものと byte-identical(diff 0 行)** で、
**この repo に導出記録は 1 件も無い**。header 自身が
「a consumer's thresholds encode a consumer's context window and a consumer's roster, and copying them
would rebuild this same problem under a different constant」と定めている。
```

同 file:61–62:

```text
48,000 は `168,221 - 120,000` すなわち **「roster の最小 context window 200,000」からの導出**であり、
`local/docs/routing-profile.md` は **全 holder が UNDECLARED**(2026-08-25 裁定、意図的な absence of measurement)。
```

従って「project 固有に再校正された記録が無い」なら区別可能だが、literal claim「導出記録は1件も無い」は同 passage と script header の双方に反する。[inferred]

## D8. Claim V2 verdict

### D8(a). 8,571-byte total — CONFIRMED

L2 が named set とした12 items を exact physical lines（LF 込み）で連結すると、12 lines / **8,571 B** を再現した。

```bash
file=prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md
sed -n '92p;145p;146p;147p;150p;152p;164p;181p;192p;203p;206p;208p' "$file" | wc -lc
# observed: 12 8571
```

per-line bytes（LF 込み）は `92=225, 145=462, 146=243, 147=433, 150=238, 152=469, 164=532, 181=1,341, 192=707, 203=1,607, 206=589, 208=1,725`。LF を除く content bytes は 8,559 B なので、8,571 B という claim の unit は「selected source lines with their 12 LF delimiters」である。[synthetic]

### D8(b). Full 96-item independent classification — item set REFUTED

母集団は §2 baton table **48 data rows**（line 80–128。line 125 の空行をまたぎ、baton 55 は line 128）と §3 **48 bullets**、計 **96/96 items**。L2 の literal rule をそのまま適用した: `ALWAYS` は「その item の不在だけで、Objective に関係なく actor が Human authority / safety boundary に反する行動を取り得るもの」。nameable trigger/objective class に限られるものは `OBJECTIVE_SCOPED` とした。判別不能 item は無かった。

再導出結果: **ALWAYS 19 / OBJECTIVE_SCOPED 77 / AMBIGUOUS 0 = 96**。

#### §2 baton table — 48/48

| line / baton | class | independent reason / objective class |
|---|---|---|
| 80 / 2 | OBJECTIVE_SCOPED | compatibility / acceptance |
| 81 / 3 | OBJECTIVE_SCOPED | stack / deployment / adapter architecture |
| 82 / 4 | **ALWAYS** | every dispatch uses routing; writing measured mappings is Human-GO-gated |
| 83 / 5 | OBJECTIVE_SCOPED | application path / protected-path setup |
| 84 / 6 | OBJECTIVE_SCOPED | product-facing text edits |
| 85 / 7 | OBJECTIVE_SCOPED | bootstrap L-6/L-7 ruling |
| 86 / 13 | OBJECTIVE_SCOPED | browser-support architecture |
| 87 / 14 | OBJECTIVE_SCOPED | third-party material placement |
| 88 / 15 | OBJECTIVE_SCOPED | OSS adoption / redistribution |
| 89 / 16 | OBJECTIVE_SCOPED | named external planning documents; general secret rule is §3 line 147 |
| 90 / 17 | OBJECTIVE_SCOPED | external planning-document revision |
| 91 / 18 | OBJECTIVE_SCOPED | portability/adoption question |
| 92 / 19 | **ALWAYS** | evidence outranks summary; candidate menu never grants work authority |
| 93 / 20 | OBJECTIVE_SCOPED | Project_Template B57 visit |
| 94 / 21 | OBJECTIVE_SCOPED | Compiler architecture |
| 95 / 22 | OBJECTIVE_SCOPED | FastAccelStepper / donor-side evidence |
| 96 / 24 | OBJECTIVE_SCOPED | S002 probe reuse |
| 97 / 25 | **ALWAYS** | the same no-threshold-change Human boundary as §3 line 206 |
| 98 / 26 | OBJECTIVE_SCOPED | S003 probe reuse |
| 99 / 27 | OBJECTIVE_SCOPED | Helper adoption / LNA evidence |
| 100 / 28 | OBJECTIVE_SCOPED | Desktop bundle design |
| 101 / 29 | OBJECTIVE_SCOPED | no-LSP architecture |
| 102 / 30 | OBJECTIVE_SCOPED | classroom Local LSP |
| 103 / 31 | OBJECTIVE_SCOPED | LNA deployment |
| 104 / 32 | OBJECTIVE_SCOPED | user libraries / Registry |
| 105 / 33 | OBJECTIVE_SCOPED | donor PNA behavior |
| 106 / 34 | OBJECTIVE_SCOPED | Desktop Compiler placement |
| 107 / 35 | OBJECTIVE_SCOPED | intranet / AI architecture |
| 108 / 36 | OBJECTIVE_SCOPED | debugger product scope |
| 109 / 37 | OBJECTIVE_SCOPED | competitor/product claims |
| 110 / 38 | OBJECTIVE_SCOPED | R21–R23 evidence / Human re-ruling |
| 111 / 39 | OBJECTIVE_SCOPED | Registry objective ground |
| 112 / 40 | OBJECTIVE_SCOPED | reuse of nine named measurements |
| 113 / 41 | OBJECTIVE_SCOPED | competitor real-use claims |
| 114 / 42 | OBJECTIVE_SCOPED | harness/platform behavior conflict |
| 115 / 43 | **ALWAYS** | effort is checked every preflight; no effort edit without Human GO |
| 116 / 44 | **ALWAYS** | account/payment/contact/PII are Human-only external commitments under any Objective |
| 117 / 45 | OBJECTIVE_SCOPED | Arduino competitor audit |
| 118 / 46 | OBJECTIVE_SCOPED | market coverage claim |
| 119 / 47 | OBJECTIVE_SCOPED | Particle evidence |
| 120 / 48 | OBJECTIVE_SCOPED | academic-evidence use |
| 121 / 49 | OBJECTIVE_SCOPED | competitor absence / uniqueness claim |
| 122 / 50 | OBJECTIVE_SCOPED | auto-Web-UI architecture |
| 123 / 51 | OBJECTIVE_SCOPED | device-knowledge architecture |
| 124 / 52 | **ALWAYS** | critical STOP at 128 KiB and never-delete-current-truth boundary |
| 126 / 53 | OBJECTIVE_SCOPED | every close / owner-set edit |
| 127 / 54 | OBJECTIVE_SCOPED | relying on a loss detector / adding current-truth section |
| 128 / 55 | OBJECTIVE_SCOPED | writing CLAUDE.md outside §2/§3 / B54 extension |

#### §3 settled decisions — 48/48

| line | class | independent reason / objective class |
|---|---|---|
| 145 | **ALWAYS** | donor is READ ONLY; no fork/history import under any Objective |
| 146 | **ALWAYS** | donor legacy governance is an absolute cross-lane prohibition |
| 147 | **ALWAYS** | PUBLIC-repo secret/private-data discipline applies to every output |
| 148 | **ALWAYS** | every dispatch must fail closed on unmeasured routing; mapping write is GO-gated |
| 149 | OBJECTIVE_SCOPED | product specification / compatibility settlement |
| 150 | **ALWAYS** | Project_Template is never modified from this consumer repo |
| 151 | OBJECTIVE_SCOPED | AI product/investigation scope |
| 152 | **ALWAYS** | one GO grants only one declared Objective; universal authority boundary |
| 153 | OBJECTIVE_SCOPED | licence / portability decision |
| 154 | OBJECTIVE_SCOPED | Compiler direction and boundary |
| 155 | OBJECTIVE_SCOPED | LSP product role |
| 156 | OBJECTIVE_SCOPED | Web completeness / Helper/LSP independence |
| 157 | OBJECTIVE_SCOPED | server-side LSP architecture |
| 158 | OBJECTIVE_SCOPED | editor candidate selection |
| 159 | OBJECTIVE_SCOPED | `.ino` / `main.cpp` representation |
| 160 | OBJECTIVE_SCOPED | shared Web/Desktop architecture |
| 161 | OBJECTIVE_SCOPED | Desktop platforms / signing |
| 162 | OBJECTIVE_SCOPED | Desktop LSP candidate |
| 163 | OBJECTIVE_SCOPED | Helper adoption / evidence |
| 164 | **ALWAYS** | a direction ruling never auto-authorises production implementation |
| 168 | OBJECTIVE_SCOPED | product core value |
| 169 | OBJECTIVE_SCOPED | one-sentence product definition |
| 170 | OBJECTIVE_SCOPED | Web product value |
| 171 | OBJECTIVE_SCOPED | Classic/Text product split |
| 172 | OBJECTIVE_SCOPED | Registry design priority/ground |
| 173 | OBJECTIVE_SCOPED | Verified/Custom model |
| 174 | OBJECTIVE_SCOPED | Custom→Verified promotion |
| 175 | OBJECTIVE_SCOPED | Registry AI/QA evidence |
| 176 | OBJECTIVE_SCOPED | risk-based compatibility |
| 177 | OBJECTIVE_SCOPED | read-load WARNING handling |
| 181 | **ALWAYS** | PRIMARY_OBJECTIVE may not finish Opus-solo |
| 186 | OBJECTIVE_SCOPED | S007 evidence-state interpretation |
| 187 | OBJECTIVE_SCOPED | DigiCode industrial-IoT history |
| 188 | OBJECTIVE_SCOPED | device-knowledge design hypothesis |
| 189 | OBJECTIVE_SCOPED | Home Assistant design reference |
| 190 | OBJECTIVE_SCOPED | auto-Web-UI interpretation |
| 191 | OBJECTIVE_SCOPED | next product Objective naming/scope |
| 192 | **ALWAYS** | Opus-solo prohibition applies until Human revokes it |
| 193 | OBJECTIVE_SCOPED | superseded 96-KiB bridge history / brief maintenance |
| 197 | OBJECTIVE_SCOPED | target users |
| 198 | OBJECTIVE_SCOPED | meaning of “easy” in product design |
| 199 | OBJECTIVE_SCOPED | school/education positioning |
| 203 | **ALWAYS** | 128-KiB STOP and current-truth deletion prohibition |
| 204 | OBJECTIVE_SCOPED | task-scoped brief design Objective |
| 205 | OBJECTIVE_SCOPED | no immediate task-scoped implementation |
| 206 | **ALWAYS** | no allowance/review-threshold move without derivation/Human authority |
| 207 | **ALWAYS** | no effort-setting change without Human GO, regardless Objective |
| 208 | **ALWAYS** | adaptive fan-out / lane STOP / no competing implementation applies to every Objective |

#### Every disagreement with L2

L2's named `ALWAYS` 12-item set was line 92 plus §3 lines 145, 146, 147, 150, 152, 164, 181, 192, 203, 206, 208. I agree with those 12. I disagree by **seven omissions**; no L2 `ALWAYS` item is downgraded.

| omitted by L2 | my class | reason the L2 rule makes it ALWAYS |
|---|---|---|
| baton 4 / line 82 | ALWAYS | every task is routed; unsupported mapping and writing values without GO can misroute any task |
| baton 25 / line 97 | ALWAYS | it contains the same absolute no-threshold-change boundary L2 classified ALWAYS at line 206 |
| baton 43 / line 115 | ALWAYS | it explicitly requires every preflight to remeasure and forbids effort edits without Human GO |
| baton 44 / line 116 | ALWAYS | account creation, payment, sales contact and PII entry remain Human-only whatever Objective named |
| baton 52 / line 124 | ALWAYS | it contains the same 128-KiB STOP/current-truth prohibition L2 classified ALWAYS at line 203 |
| §3 line 148 | ALWAYS | routing fail-closed governs every dispatch and mapping write remains GO-gated |
| §3 line 207 | ALWAYS | effort setting is the same class of Human-only setting as line 206's threshold; Objective does not grant residual authority |

この差は重要度判断ではなく、L2 自身の universal-rule を duplicate/sibling formulations に対称適用した結果である。[inferred] よって Claim V2 は、**(a) byte total は CONFIRMED、(b) item set は REFUTED**。

## Conflict surface and unresolved limits

- **Packet-contract conflict:** critical duplicated STOP lines 0/5 verbatim。rule 22 / template contract は全て verbatim を要求する。
- **Concurrent worktree delta:**開始後、packet が既知 noise として列挙した `01_…md` / `02_…md` / `03_…md` / `plans/active/10_…md` に加えて、untracked `05_integrated-architecture.md`、`06_fixture-reconstruction.md`、`probe/**`（20 paths）が順次出現した。`04_…md` は本 lane の report。本 lane は追加 concurrent paths を名前の確認以外に evidence として読んでおらず、変更していない。
- **Temporal limit:** dispatch-time brief bytes は `NOT OBTAINED`; current regenerated brief と packet の比較である。

## Verification record

- [synthetic] Report structure validator: required D1–D8 headings `8/8`、D8 §2 classification rows `48/48`、D8 §3 classification rows `48/48`、RC 0。
- [synthetic] Detection-power control: `$TMPDIR` copy から D8 heading を1件削除し、変更を `ORIGINAL_D8=1 / MUTANT_D8=0` で確認。validator は mutant RC 1、原本へ戻すと RC 0。killed 1/1。
- [static] `git diff --no-index --check /dev/null <report>` は whitespace diagnostic 0件。command RC 1 は `/dev/null` と追加 file に差分が存在することを表す通常の `diff` status。
- [synthetic] `bash scripts/selftest.sh` は `RESULT: 78 passed / 0 failed`、`SELFTEST_RC=0`。
- 実行していない rungs: application test / typecheck / lint（stack/application code が存在しない）、API-smoke、visual、real-fire。production artifact の mutation は実施していない（変更は report だけ）。
