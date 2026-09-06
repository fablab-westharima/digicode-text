# Task-scoped context brief failure modes — FALSIFICATION

**Packet:** `S009-L2-failure-modes`  
**Lane:** `FALSIFICATION`  
**Date:** 2026-08-27  
**Sources read:** `CLAUDE.md`、`16_次セッション引き継ぎ指示書.md`、`batons.md`、`evidence-map.md`。DigiCode donor は読んでいない。  
**Verification convention:** source text / row counts / byte counts / command output は `[static]` または `[synthetic]`。分類、因果、misroute の蓋然性はすべて `[inferred]`。

## B1. Objective-independence classification table (ALWAYS / OBJECTIVE_SCOPED / AMBIGUOUS)

### B1.1 判定規則と母集団

- `ALWAYS`: Objective の内容にかかわらず、その item の欠落だけで actor が権限・禁止・scope を誤り得る。
- `OBJECTIVE_SCOPED`: 適用対象を名前で示せる。
- `AMBIGUOUS`: Objective 名だけでは配送要否を決められない。追加の provenance / lifecycle / trigger 解釈が要る。
- `[static]` `16.md` §3 の `^- ` を 48/48 bullet、§2 の baton data row を 48/48 row 読んだ。**denominator = 96 items、classified = 96、unclassified = 0**。
- `[inferred]` 結果は **ALWAYS 12 / OBJECTIVE_SCOPED 82 / AMBIGUOUS 2 / total 96**。内訳は §3 が `11 / 36 / 1`、baton が `1 / 46 / 1`。

### B1.2 `16.md` §3 — 48/48

| ID | source | ruling (一意に識別する短縮名) | class | Objective class / 判定理由 `[inferred]` |
|---|---:|---|---|---|
| S3-01 | `16.md:145` | independent project / donor READ ONLY / no history import | ALWAYS | donor・git history の絶対境界。 |
| S3-02 | `16.md:146` | donor legacy governance never imported | ALWAYS | donor governance の絶対境界。 |
| S3-03 | `16.md:147` | PUBLIC repo / never write secrets or private information | ALWAYS | 全 Objective の content discipline。 |
| S3-04 | `16.md:148` | routing profile remains `NONE` until measured values receive GO | OBJECTIVE_SCOPED | routing-profile 設定・routing maintenance。 |
| S3-05 | `16.md:149` | product spec / target / completion / compatibility remain provisional | OBJECTIVE_SCOPED | product specification、acceptance、architecture。 |
| S3-06 | `16.md:150` | do not modify `Project_Template` from this repo | ALWAYS | repository authority boundary。 |
| S3-07 | `16.md:151` | AI is primary and ships from start | OBJECTIVE_SCOPED | product architecture・product claims。 |
| S3-08 | `16.md:152` | one Human GO authorises one PRIMARY_OBJECTIVE only | ALWAYS | 全作業の scope/STOP boundary。 |
| S3-09 | `16.md:153` | licence marking is not portability verdict | OBJECTIVE_SCOPED | portability、adoption、licence review。 |
| S3-10 | `16.md:154` | dedicated Text Compiler direction; boundaries remain open | OBJECTIVE_SCOPED | Compiler / toolchain architecture。 |
| S3-11 | `16.md:155` | AI primary; LSP advanced support, not product condition | OBJECTIVE_SCOPED | editor/LSP/product architecture。 |
| S3-12 | `16.md:156` | Web must be complete without Helper/LSP | OBJECTIVE_SCOPED | Web/Desktop/Helper architecture。 |
| S3-13 | `16.md:157` | server-side LSP is not mandatory Web backend | OBJECTIVE_SCOPED | Web/LSP/cost architecture。 |
| S3-14 | `16.md:158` | Monaco is first candidate, not production GO | OBJECTIVE_SCOPED | editor architecture。 |
| S3-15 | `16.md:159` | internal standard `main.cpp`; `.ino` import candidate | OBJECTIVE_SCOPED | source-format / compiler / editor design。 |
| S3-16 | `16.md:160` | shared Frontend should preserve Desktop path | OBJECTIVE_SCOPED | Web/Desktop architecture。 |
| S3-17 | `16.md:161` | Desktop targets and deferred signing | OBJECTIVE_SCOPED | Desktop distribution。 |
| S3-18 | `16.md:162` | Desktop advanced LSP likely, not decided | OBJECTIVE_SCOPED | Desktop/LSP architecture。 |
| S3-19 | `16.md:163` | Helper feasibility is not adoption | OBJECTIVE_SCOPED | Helper/Web/Desktop architecture。 |
| S3-20 | `16.md:164` | directions do not auto-authorise production implementation | ALWAYS | implementation authority boundary for every Objective。 |
| S3-21 | `16.md:168` | managed environment is core value; original evidence refuted | OBJECTIVE_SCOPED | product value / architecture / claims。 |
| S3-22 | `16.md:169` | one-sentence product definition | OBJECTIVE_SCOPED | product definition、spec、external text。 |
| S3-23 | `16.md:170` | Web value is no local MCU environment | OBJECTIVE_SCOPED | Web value / target use cases。 |
| S3-24 | `16.md:171` | Classic=Block, Text=AI+Text+managed environment | OBJECTIVE_SCOPED | product partition / Blockly scope。 |
| S3-25 | `16.md:172` | Registry as next core; ranking ground refuted | OBJECTIVE_SCOPED | Managed Environment / Registry architecture。 |
| S3-26 | `16.md:173` | Verified/Custom candidate; not closed ecosystem | OBJECTIVE_SCOPED | Registry / library policy。 |
| S3-27 | `16.md:174` | Custom→Verified promotion with Human review | OBJECTIVE_SCOPED | Registry lifecycle / QA。 |
| S3-28 | `16.md:175` | AI-assisted Registry, but AI self-report is not evidence | OBJECTIVE_SCOPED | Registry operation / acceptance evidence。 |
| S3-29 | `16.md:176` | retain risk-based compatibility; no all-combinations guarantee | OBJECTIVE_SCOPED | compatibility / regression / QA。 |
| S3-30 | `16.md:177` | read-load WARNING accepted but unresolved | OBJECTIVE_SCOPED | read-load maintenance / close interpretation。 |
| S3-31 | `16.md:181` | Opus 5 solo completion forbidden | ALWAYS | explicitly applies to every PRIMARY_OBJECTIVE。 |
| S3-32 | `16.md:186` | S007 final evidence state D7 corrected | OBJECTIVE_SCOPED | competitive/product-value conclusion。 |
| S3-33 | `16.md:187` | industrial IoT depth was stopped by Blockly cost, not intent | OBJECTIVE_SCOPED | product history / device architecture。 |
| S3-34 | `16.md:188` | knowledge-driven expansion is unproven hypothesis | OBJECTIVE_SCOPED | Device Knowledge architecture / value claims。 |
| S3-35 | `16.md:189` | Home Assistant semantics are reference, not adoption | OBJECTIVE_SCOPED | device semantics / HA integration。 |
| S3-36 | `16.md:190` | auto Web UI consumes registration metadata, not C++ | OBJECTIVE_SCOPED | auto UI / device-knowledge architecture。 |
| S3-37 | `16.md:191` | renamed Managed Environment & Device Knowledge objective/menu | OBJECTIVE_SCOPED | that named product-design Objective and menu interpretation。 |
| S3-38 | `16.md:192` | Opus 5 solo ban reaffirmed | ALWAYS | S3-31 の objective-independent reinforcement。 |
| S3-39 | `16.md:193` | former 96 KiB temporary cap ruling | AMBIGUOUS | 後の `16.md:203` が 128 KiB へ supersede。operational brief か decision provenance かを Objective 文だけでは決められず、単独配送は stale threshold を作る。 |
| S3-40 | `16.md:197` | target is domain experts new to embedded/IoT, not children | OBJECTIVE_SCOPED | target-user / UX / product claims。 |
| S3-41 | `16.md:198` | “easy” means hide complexity, not delete capability | OBJECTIVE_SCOPED | UX / capability / product architecture。 |
| S3-42 | `16.md:199` | K-12 is neither excluded nor primary axis | OBJECTIVE_SCOPED | target-user / education positioning。 |
| S3-43 | `16.md:203` | 128 KiB last bridge; never raise again or delete truth to fit | ALWAYS | Human-GO gate threshold + “never delete current truth” absolute prohibition。 |
| S3-44 | `16.md:204` | permanent repair is separate Task-Scoped Context Brief Objective | OBJECTIVE_SCOPED | context-brief/read-architecture maintenance。 |
| S3-45 | `16.md:205` | do not implement task-scoped export on the spot | OBJECTIVE_SCOPED | task-scoped export design/implementation。 |
| S3-46 | `16.md:206` | do not move READ_ALLOWANCE/REVIEW threshold without derivation | ALWAYS | gate-threshold authority boundary。 |
| S3-47 | `16.md:207` | effort mismatch remains open; no setting change without GO | OBJECTIVE_SCOPED | effort/routing/preflight maintenance。 |
| S3-48 | `16.md:208` | Adaptive fan-out from next Objective/session | ALWAYS | orchestration policy explicitly applies to every next Objective。 |

### B1.3 `16.md` §2 baton table — 48/48

| Baton | source | class | Objective class / 判定理由 `[inferred]` |
|---:|---:|---|---|
| 2 | `16.md:80` | OBJECTIVE_SCOPED | compatibility / acceptance matrix。 |
| 3 | `16.md:81` | OBJECTIVE_SCOPED | stack / deployment / adapter architecture。 |
| 4 | `16.md:82` | OBJECTIVE_SCOPED | routing-profile value recording。 |
| 5 | `16.md:83` | OBJECTIVE_SCOPED | application-path creation after stack settlement。 |
| 6 | `16.md:84` | OBJECTIVE_SCOPED | product-facing text edit。 |
| 7 | `16.md:85` | OBJECTIVE_SCOPED | template bootstrap L-6/L-7 ruling。 |
| 13 | `16.md:86` | OBJECTIVE_SCOPED | browser-support architecture。 |
| 14 | `16.md:87` | OBJECTIVE_SCOPED | third-party material placement。 |
| 15 | `16.md:88` | OBJECTIVE_SCOPED | every third-party adoption/licence decision。 |
| 16 | `16.md:89` | OBJECTIVE_SCOPED | de-identified planning-document placement。 |
| 17 | `16.md:90` | OBJECTIVE_SCOPED | external planning-document revision。 |
| 18 | `16.md:91` | OBJECTIVE_SCOPED | portability/adoption question。 |
| 19 | `16.md:92` | ALWAYS | every next Objective can confuse evidence with conclusions or menu with work queue。 |
| 20 | `16.md:93` | OBJECTIVE_SCOPED | `Project_Template` deployment visit。 |
| 21 | `16.md:94` | OBJECTIVE_SCOPED | Text Compiler architecture。 |
| 22 | `16.md:95` | OBJECTIVE_SCOPED | donor-side dependency objective。 |
| 24 | `16.md:96` | OBJECTIVE_SCOPED | S002 probe reuse。 |
| 25 | `16.md:97` | OBJECTIVE_SCOPED | read-load / allowance maintenance。 |
| 26 | `16.md:98` | OBJECTIVE_SCOPED | S003 probe reuse。 |
| 27 | `16.md:99` | OBJECTIVE_SCOPED | Helper/Web/Desktop architecture。 |
| 28 | `16.md:100` | OBJECTIVE_SCOPED | Desktop Board/Library bundle。 |
| 29 | `16.md:101` | OBJECTIVE_SCOPED | no-LSP Web architecture。 |
| 30 | `16.md:102` | OBJECTIVE_SCOPED | classroom Local LSP candidate。 |
| 31 | `16.md:103` | OBJECTIVE_SCOPED | enterprise Helper deployment behavior。 |
| 32 | `16.md:104` | OBJECTIVE_SCOPED | local semantic analysis / Registry Custom path。 |
| 33 | `16.md:105` | OBJECTIVE_SCOPED | donor DigiCode-Finder/PNA objective。 |
| 34 | `16.md:106` | OBJECTIVE_SCOPED | Desktop cloud-vs-local Compiler decision。 |
| 35 | `16.md:107` | OBJECTIVE_SCOPED | architecture or enterprise proposal。 |
| 36 | `16.md:108` | OBJECTIVE_SCOPED | product spec / debugger scope。 |
| 37 | `16.md:109` | OBJECTIVE_SCOPED | competitor audit / product claims。 |
| 38 | `16.md:110` | OBJECTIVE_SCOPED | Human reconsideration of S005 rulings。 |
| 39 | `16.md:111` | OBJECTIVE_SCOPED | Managed Environment/Registry Objective opening ground。 |
| 40 | `16.md:112` | OBJECTIVE_SCOPED | affected architecture measurement / instrument rerun。 |
| 41 | `16.md:113` | OBJECTIVE_SCOPED | competitor real-use claims。 |
| 42 | `16.md:114` | OBJECTIVE_SCOPED | unexplained harness behavior。 |
| 43 | `16.md:115` | OBJECTIVE_SCOPED | session preflight / effort setting; consumer role matters, despite every-session trigger。 |
| 44 | `16.md:116` | OBJECTIVE_SCOPED | competitor real-use test requiring account/payment/contact。 |
| 45 | `16.md:117` | AMBIGUOUS | trigger says both 「次 objective が開くとき」 and competitor audit; it does not delimit whether a harness-maintenance Objective fires the “most-priority competitor audit” requirement。 |
| 46 | `16.md:118` | OBJECTIVE_SCOPED | competitor population / market-wide coverage claim。 |
| 47 | `16.md:119` | OBJECTIVE_SCOPED | Particle as reference implementation。 |
| 48 | `16.md:120` | OBJECTIVE_SCOPED | academic evidence used as ruling ground。 |
| 49 | `16.md:121` | OBJECTIVE_SCOPED | competitor absence/uniqueness claim。 |
| 50 | `16.md:122` | OBJECTIVE_SCOPED | auto UI / device-knowledge architecture。 |
| 51 | `16.md:123` | OBJECTIVE_SCOPED | Managed Environment & Device Knowledge design。 |
| 52 | `16.md:124` | OBJECTIVE_SCOPED | context-brief cap/read architecture; S3-43 carries its absolute clauses globally。 |
| 53 | `16.md:126` | OBJECTIVE_SCOPED | harness close / owner-set mutation。 |
| 54 | `16.md:127` | OBJECTIVE_SCOPED | current-truth loss detection / gate-completeness claim。 |
| 55 | `16.md:128` | OBJECTIVE_SCOPED | `CLAUDE.md` pointer-only edits / B54 extension。 |

### B1.4 分類自体への攻撃

`AMBIGUOUS` が 2 件だけでも無害ではない。S3-39 は**同一 topic 内で古い operative value と新しい operative valueが共存**し、baton 45 は**内容の domain と literal trigger の domain が一致しない**。どちらも valid な route tag を付けるだけでは解消しない。さらに `[inferred]` この分類は Objective だけでなく actor role（Harness / repo-less alternative orchestrator / delegate）、lane、lifecycle phase（preflight / execution / close）、requested action（investigate / edit / adopt）に依存する。したがって premise は実際には task→owner ではなく `(Objective, actor, lane, phase, action) → semantic obligations` である。

## B2. Five failure modes

### B2.1 `wrong-owner`

**Concrete instance:** Task-Scoped Context Brief / Read Architecture Maintenance に、競合 baton を含む `batons.md` を owner 単位で誤選択する。baton 45 の router text は verbatim:

> 「次 objective が開くとき、または競合実査 objective のとき。**最優先の監査対象**」 (`16.md:117`)

`[inferred]` 現 objective も「次 objective」なので literal trigger は発火したように読める。結果は token cost だけではない。競合実査を current harness-maintenance scope に入れる圧力が生じ、`16.md:25-35` の「menu は queue でも着手権限でもない」と衝突する。`batons.md:17-23` の「baton is NOT a work queue」まで常に同梱すれば緩和できるが、そうすると owner fragment 化に新たな ALWAYS dependency が生じる。**wrong-owner は harmless extra context ではなく、actual trigger text による scope expansion surface である。**

### B2.2 `no-owner`

**Concrete instance:** current-truth owner を 0 件選ぶと、この Objective を直接止める次の Human ruling が消える（verbatim）:

> 「**task-scoped export をその場で実装しない**」 (`16.md:205`)

同じ bullet は「**task→owner 分類器 · wrong-owner control · no-owner control は現時点で 1 つも存在しない**」とも記録する。`CLAUDE.md` の一般的な user-GO rule はこの個別禁止を逐語所有していない。`[inferred]` したがって no-owner は、この Objective で最も直接的な prohibition をちょうど落とし、actor が「サイズ問題の簡単な修正」として実装へ進む経路を作る。

### B2.3 `partial-owner`

**Concrete instance:** 正しい router `16.md` を選ぶが、exporter が §1/§2 だけを出し §3 を省く。GO/STOP と baton 52 の stub は届いても、必要な section は **§3 `16.md:203-208`** であり、特に上記「task-scoped export をその場で実装しない」と、次の restriction が消える:

> 「**128 KiB に到達しても、これ以上 cap を上げてはならない**」 (`16.md:203`)

`[static]` baton 54 は、§3 ruling 1本削除時に `selftest` が `78/78` のまま通った precedent を記録する (`batons.md:73`)。owner path が正しいことと、必要 section が完全なことは別命題である。

### B2.4 `unknown-task`

**Safe fallback:** route 不明・複合・未知語なら、現行の full brief へ戻す。これ以外の fail-open は omission を silent にする。

**Measured cost `[synthetic]`:** `set -o pipefail; bash scripts/context-brief.sh | wc -c` は **102,629 bytes、pipeline RC=0**。128 KiB = 131,072 bytes に対して **78.30%**、headroom は **28,443 bytes**。したがって unknown fallback は現時点で安全側だが、未知・複合 Objective が増えるほど task-scoping の削減効果を失う。fallback が頻発しても correctness は保てるが、permanent size repair という目的は達成しない。

### B2.5 `stale-owner`

**Concrete instance:** `evidence-map.md` の template-feedback queue #9–#12 は Human 承認済みであり、owner は次を逐語で持つ:

> 「**#9 / #10 / #11 / #12 は S008 受理時の Human 指示 §9 で承認された。**」 (`evidence-map.md:97-100`)

この追加前の stale `evidence-map.md` を選ぶと、4件の current queue state が落ちる。`[static]` honest な GEN drift（例: router=`S008-close`, map=`S007-close`）は B70 が検出する (`evidence-map.md:12`, `batons.md:72`)。しかし次は検出しない:

- 同じ古い GEN の owner set 全体を remote actor に渡す common-mode staleness。比較対象の disk がない。
- 内容を古く戻したのに GEN 文字列だけ current のままにした equal-but-stale state。B70 は equality しか見ない。
- `evidence-map.md` の一部を落として GEN を変えない partial staleness。baton 54 の実測では mode-none owner の部分欠落は `handover-diff GONE 0` (`batons.md:73`)。

よって GEN は **cross-owner disagreement detector** であって **freshness proof** ではない。

## B3. Attack on the AI classifier

以下はすべて、この repository の §1 next-objective menu と §3 の旧称/候補から作った realistic Objective 文である。misroute の発生確率は `NOT OBTAINED`、失われる current truth は source から `[static]`、因果は `[inferred]`。

| construction | plausible AI route | lost truth / wrong action |
|---|---|---|
| **AI-1:** 「`Managed Environment Registry Design` を開始し、Verified/Custom schema を確定する」 | 古い語 `Registry` に寄せ、S3-25〜29 / batons 32・39 の狭い Registry route | 現名称は旧称を reject し Board/Library/Sensor/Industrial Device/Protocol まで広げる (`16.md:191`)。さらに expansion は未実証で schema open (`16.md:188`, baton 51)、auto UI は input adapter が要る (baton 50)。狭い route は**既に reject された scope 名を復活**させる。 |
| **AI-2:** 「次の製品設計前に context delivery を軽量化し、read architecture を整理する」 | `read-load`/topic split maintenance と解釈し baton 25 だけを選ぶ | task-scoped export の即時実装禁止 (`16.md:205`)、128 KiB last bridge / truth deletion ban (`16.md:203`)、single completeness gate 不在 (baton 54) が落ちる。topic split は恒久修復でないという supersession (`16.md:204`) も失う。 |
| **AI-3:** 「`Task-Scoped Context Brief / Read Architecture Maintenance`。allowance 導出と effort mismatch を解消する」 | 明示語に一致する batons 25/43 だけを選ぶ | Objective の本体である wrong-owner/no-owner/fallback/completeness controls (`16.md:204-205`) を落とし、named subtopics が主目的へ反転する。effort setting は Human GO なしに変更不可 (`16.md:207`) なので、「解消する」という動詞を設定変更GOと誤読すると authority violation になる。 |
| **AI-4:** 「Classic の Block 追加コストを Text の Device knowledge / metadata 追加へ変換できるか調べる」 | donor capability audit または generic architecture に分類 | これは実証済み value ではない (`16.md:188`, baton 51)、target は子供向け簡略化ではない (`16.md:197-199`)、auto UI input は C++ ではなく Blockly metadata (`16.md:190`, baton 50)。donor route だけではこれら Human rulings が落ちる。 |

AI-only classifier には、出力 confidence を付けても semantic completeness の ground truth がない。`[inferred]` confidence は「モデルが迷ったか」を表し、「落とした ruling がないか」を測らない。Human instruction の「AI classifier alone に依存しない」は、この repo では preference ではなく必要条件である。

## B4. Attack on explicit-metadata + deterministic routing

AI-only より deterministic route は再現可能だが、**安全性の最難部を metadata author へ移すだけ**である。

1. **誰が維持するか。** `[static]` current owner contract は Harness が close ごとに3 ownerを同一 commitで更新し、owner増減時はさらに `read-load.sh` ROSTER、`context-brief.sh` allowlist、hook manifest、`CLAUDE.md` §0、`handover-diff.sh` OWNERSを同時更新すると定める (`16.md:126`, `batons.md:72`)。route metadata を追加すれば第6/第7の同期面になる。Human ruling 自体は route tag を伴って到着しないため、integration owner が意味を解釈して tag を付ける。
2. **新 ruling に tag が無い。** 現在は task-route metadata / missing-tag gate が0なので (`16.md:205`)、untagged item を「どの route にも属さない」と扱えば silent omission になる。future schema が tag-required を hard error にすれば missing tag は loud にできるが、close/brief generation の全入口がその validator を必ず通ることが追加前提になる。
3. **valid but wrong tag は silent。** enum validation、owner existence、GEN equality は `product` と書くべき ruling に `harness` と書いた意味誤りを検出できない。B71 が ID の存在を検査しても prohibition の意味を検査できない precedent と同型である。
4. **composite ruling。** S3-43 は context-brief-specific cap と objective-independent truth-deletion ban を1 bulletに持つ。単一 tag はどちらかを落とす。複数 tag は maintenance burden と over-inclusion を増やす。S3-39 は superseded 96 KiB と still-relevant provenance が同居する。
5. **vocabulary drift。** `Managed Environment Registry Design` は `Managed Environment & Device Knowledge Architecture Design` に supersede された (`16.md:191`)。旧名を含む S3-25 / baton 39 は残る。deterministic exact match は旧名を別 task と誤るか、新旧 alias table を永続保守する必要がある。
6. **transitive dependency。** Managed Environment design は batons 13, 15, 21, 29, 32, 34, 35, 38–40, 45, 47, 48, 50, 51 の一部と複数 §3 rulingsを横断する。`[inferred]` route metadata は owner selection ではなく fact-level dependency graph になり、その edge の追加漏れが semantic omission になる。
7. **negative / authority items。** 「productionへ進まない」「Human reviewを省かない」「GOなしでsettingを変えない」は action と phase に依存する。Objective noun だけの route は、`investigate` と `implement` を区別できない。
8. **fallback paradox。** missing/unknown/ambiguous tagを full brief fallback にすれば omissionはloud/safe側になるが、102,629-byte payloadへ戻る。fallbackせず空集合にすれば silent no-owner になる。

**Silentか:** 現状は **silent**。missing-tag detector が存在しないからである。将来、required tag / unknown-tag / zero-route / owner-existence を fail-closed にすればこれらの syntax failure は loud にできる。しかし **wrong-but-valid tag、missing dependency edge、semantic under-tagging、common-mode stale metadata は引き続き silent**。determinism は同じ誤りを再現可能にするだけで、誤りを可視化しない。

## B5. Completeness-checking limits

### B5.1 mechanically verifiable

| proposition | current/prefigured mechanical check | limit |
|---|---|---|
| selected owner path exists / declared owner is reachable | B70 / manifest membership | B70 path predicate has substring caveat (`16.md:127`, baton 54)。 |
| three owners have equal GEN | B70 | equality only; freshness/currentnessは証明しない。 |
| router baton IDs and body baton IDs correspond | B71, bidirectional | ID presence only。 |
| hook injected full router bytes | B69 | disk itself truncatedなら一致してgreen (`16.md:127`)。 |
| §2/§3 entry disappears from owner union | `handover-diff` | §1/§4/§5 and partial `evidence-map.md` loss are invisible。 |
| generated brief contains declared sections/IDs/tags | future schema/fixture can count and compare | declared setがsemanticに正しいという前提を検査しない。 |
| route returns zero / multiple / unknown token | deterministic router can fail closed | legitimate multi-domain Objective と bad metadata を区別しない。 |
| byte cap and selected-item count | `wc -c`, manifest count | completeness/minimalityの意味を検査しない。 |

### B5.2 not mechanically verifiable by the current truth model

- Objective 文が暗黙に必要とする Human ruling の集合。
- stub が prohibition / limitation / supersession を**意味として十分に保持**しているか。
- valid route tag が正しいか、または dependency edge が不足していないか。
- superseded ruling を provenance として要するか、operative value と誤読させるか。
- selected extra truth が scope expansion を誘発するか（minimalityのsemantic cost）。
- equal GEN の owner set / remote brief が最新か。
- declared owner set 外に、新しい current truth owner が生まれたのに宣言されていないか。
- future/unknown Objective に既存 taxonomy が十分か。

### B5.3 baton 54 precedent applied

baton 54 の decisive text は verbatim:

> 「**B71 cannot see whether a stub still carries its prohibition**」 (`16.md:127`)

body はさらに、baton 44 の Human-GO禁止文を `See baton 44.` に置換しても B71 が green だったこと、そして

> 「**stub の意味的十分性を測る executable guard は存在しない — 人間かレーンの査読が唯一の手段**」 (`batons.md:73`)

を記録する。これは task-scoped export にそのまま着地する。route checker が「baton 44 を選んだ」「ID 44 が brief にある」ことを確認しても、account作成・課金・営業接触・個人情報登録が Human-GO gated だという意味が残ったかは確認できない。

**Structural break:** task-scoped export の safety claim は、まさに「選んだ subset が semantic に complete-enough」という、現行 guard が測れない命題である。人間/lane reviewを必須にすれば一回のbriefを査読できるが、それは classifier+checker が安全性を保証したことにはならず、Objective追加ごとに同じ semantic review cost が戻る。したがって **mechanically safe task-scoped export** という強い方向はこの repository の実測 precedent により破れる。

## B6. The size argument tested — is `ALWAYS` alone already near the cap?

### Method

`[synthetic]` B1で `ALWAYS` とした12 itemの**source lineそのもの（UTF-8、newline込み）**を `perl -Mbytes` で加算した。対象は baton 19 (`16.md:92`) と §3 lines `145,146,147,150,152,164,181,192,203,206,208`。これは export framing、section heading、`CLAUDE.md`の別のunconditional rules、deduplicationを含まないため **ALWAYS payload の estimate / lower bound** であり、complete unconditional core の測定ではない。

### Results

| measure | observed |
|---|---:|
| ALWAYS items | 12 items |
| ALWAYS source weight | **8,571 bytes** |
| 128 KiB cap | 131,072 bytes |
| ALWAYS / cap | **6.54%** |
| current full brief | **102,629 bytes** (`bash scripts/context-brief.sh \| wc -c`, pipeline RC=0) |
| ALWAYS / current full brief | **8.35%** |
| current full brief / cap | **78.30%** |

**Result:** counter-hypothesis「growthはALWAYSに支配される」は、この分類とsource-weight proxyでは **not supported**。ALWAYSだけはcapに近くない。したがって size argument 単独では task-scoping の方向を falsify できなかった。`[inferred]` ただし削減可能な82 itemsを安全に選別できることは別命題であり、B4/B5がそこを破る。**size headroom と semantic safety を混同してはならない。**

## B7. VERDICT of the falsification round

**BROKEN** — load-bearing claim「Objective ごとに、本当に必要な current truth だけを安全に export できる」は、**THIS repository の現行 truth/control set に対しては破れた**。

Breaking evidence:

1. `[static]` baton 54 は、ID対応がgreenでも prohibition の意味欠落を見抜けず、`evidence-map.md` の部分欠落も見抜けないと実測済み (`16.md:127`, `batons.md:73`)。
2. `[inferred]` task-scoped completeness は「Objective→必要な意味集合」の正しさを要求するが、その ground truth を作る classifier/metadata author と、それを検査する checker が同じ未検証の semantic judgment に依存する。
3. `[static]` 現在は task→owner classifier / wrong-owner / no-owner control が0で、Humanは即時実装を明示禁止している (`16.md:205`)。
4. `[inferred]` explicit metadata は missing-tagを将来loudにできても、valid-but-wrong tag、dependency omission、composite ruling、common-mode stale stateをsilentのまま残す。
5. `[synthetic]` full fallback は102,629 bytesで安全側だが、unknown/ambiguous taskで常用すればsize repairを達成しない。
6. `[synthetic]` ALWAYS weightは8,571 bytesであり、サイズ支配の反証経路は成立しなかった。**破れた理由は容量ではなく、semantic completenessを判定・検証できないこと**である。

この verdict は「永久に設計不能」という証明ではない。現行方向が safety guarantee を名乗るには、少なくとも semantic Human/lane review、missing/zero/unknown route の fail-closed、full fallback、metadata mutation controls、freshness comparator が必要になる。しかしその場合もB71 precedentの意味的十分性は機械保証されず、claimは「review付きのrisk reduction」まで弱める必要がある。

## Commands actually run

- `[static]` `wc -c CLAUDE.md ...` → owner source total 152,389 bytes。
- `[static]` `awk` row enumeration → §3 bullets 48、baton rows 48。
- `[synthetic]` `set -o pipefail; bash scripts/context-brief.sh | wc -c` → 102,629 bytes、RC=0。
- `[synthetic]` `perl -Mbytes ...` → ALWAYS 12 items / 8,571 bytes。
- `[synthetic]` `bash scripts/selftest.sh; SELFTEST_RC=$?` → **78 passed / 0 failed、RC=0**。このrun自身がB69 controls 3/3、B70 controls 5/5、B71 controls 4/4を実行した。
- `[synthetic]` `bash scripts/placement-scan.sh; PLACEMENT_RC=$?` → **CATEGORIES=8 / SCANNED=16 / VIOLATIONS=0、RC=0**。
- `[static]` worktree は開始時 `git status --short` がemptyで、report directoryもemptyだったが、report作成後に本laneが作っていない `01_current-architecture-inventory.md`、`03_read-allowance-and-effort.md`、`prompt/maintenance/local/plans/active/10_task-scoped-context-brief-read-architecture.md` がuntrackedで出現した。内容は読まず、変更せず、concurrent conflict surfaceとしてintegration ownerへ返す。本laneのwriteは本report 1 fileのみ。
- Not run: application tests（application codeなし）、API-smoke、visual、real-fire、mutation harness（production/checkerを変更しておらず、このlaneでは既存baton-54 mutation evidenceをsourceとして読んだ）。
