# 07 — 統合結論 v2(実測により v1 を訂正)

**Author:** Harness / Integration Conductor(Claude Code, Opus 5)
**これは統合であり一次証拠ではない。** 一次証拠は `01`–`04`・`06` および `probe/artifacts/`。
**本文書と一次証拠が食い違ったら一次証拠が正しい。**

**Status:** 統合結論への FALSIFICATION レーンへ提出する版。**Human へ出す前の最終検査対象。**

---

## §0. v1(`05_…md`)からの訂正一覧 — 先に誤りを置く

`05_…md` は L4 / L5 の実測を受ける前に書いた。**訂正は 5 件、うち 2 件は中心的主張の反証である。**

| # | v1 の記述 | 実測 | 訂正 |
|---|---|---|---|
| **T1** | L3 INDEX のコストは「~7.7 KiB `[inferred]`」 | **27,202–27,458 B**(`06_…md` E6) | **見積が 3.45–3.48 倍外れていた。**INDEX 単体で現行 full brief の **26.5–26.7%** を占める |
| **T2** | 「task-scoping には実際に削減余地がある」(L2 の size 検定を根拠に) | 6 fixture 中 **削減は 1 件だけ**。Harness −35.39% / Product・Registry・Compiler **各 −5.16%** / unknown **+13.69%** / FALSIFICATION **+13.71%** | **「小さくなる」は 5/6 で成立しない。**§1 で扱う |
| **T3** | L3 INDEX が「選ばれなかった truth を可視化する」ので silent omission が構造的に作れなくなる | 96 item catalog は **`16.md` §2/§3 のみ**。`evidence-map.md` の事実(donor SHA pin · evidence 読解順序 · closed-objective 出力 · loop position · feedback queue)は **scanned denominator = 0** | **owner 1 つ分の事実が INDEX の外で silent に落ちうる**まま `INDEX_COUNT: 96` は green。**主張は catalog 内に限定される** |
| **T4** | ALWAYS 12 件を L0 CORE とする | L4 の独立再分類は **ALWAYS 19**(L2 の 12 件は全支持、7 件の漏れ) | **CORE 集合は未確定。**§3 で扱う |
| **T5** | §3.3 の route 一覧に `FALSIFICATION` を置き、同時に lane を直交軸と書いた | probe が両方として解釈できず、domain 名詞のない FALSIFICATION fixture が full fallback した | **設計の内部矛盾。**route と lane を混ぜた |

**T2 と T3 が中心的主張の反証である。**以下はその上で書き直した結論である。

---

## §1. 🔴 最重要 — task-scoping は「次の製品設計」の size 問題を解かない

Human が menu を 1 → 2 の順にした理由は指示書 §17 に明示されている:

> 次の製品設計は情報量が大きくなる可能性が高く、現在の brief architecture のまま進めると
> 設計途中で再び context delivery 問題が起きる可能性が高い。

**その前提に対して、実測は否定的である。**

| fixture | bytes | 現行 full brief 比 | inline item |
|---|---:|---:|---:|
| 現行 full brief | 102,782 B | — | 96/96 |
| **Harness Maintenance** | 66,403 B | **−35.39%** | 32/96 |
| **Product Architecture** | 97,477 B | **−5.16%** | **75/96** |
| Registry / Device Knowledge | 97,477 B | −5.16% | 75/96 |
| Compiler | 97,477 B | −5.16% | 75/96 |
| Generic unknown(fallback) | 116,855 B | **+13.69%** | 96/96 |
| FALSIFICATION(fallback) | 116,873 B | **+13.71%** | 96/96 |

**原因は分類器の性能不足ではなく、current truth の実際の依存構造である。**
`06_…md` E2 の凍結 expected set(生成前に手作業で確定)自身が、
Product Architecture に **63 件**、Registry に 46 件、Compiler に 39 件を要求している。
`02_…md` B4-6 が先に指摘したとおり、Managed Environment design は
batons 13/15/21/29/32/34/35/38–40/45/47/48/50/51 と複数 §3 ruling を横断する。
**製品 architecture objective は、本当に current truth の大半を必要とする。**

さらに **削減しない側に固定費が乗る**: L3 INDEX が 27 kB(T1)。
これは全 route に無条件で付くため、inline を削っても総量が戻る。

🔴 **したがって「task-scoped brief を作れば次の製品設計へ安全に進める」という
S008→S009 の想定は、この実測に対して成立しない。**
成立するのは **harness maintenance route(−35%)だけ**であり、それは
Human が menu #1 を置いた理由(製品設計のための準備)とは別の用途である。

**これは設計の失敗ではなく、測ったから分かったことである。**
`05_…md` を Human へ出していたら、この反転は届かなかった。

---

## §2. では何が有効か — 実測が支持する 3 つのレバー

削減が効かないことと、**安全性が向上しないこと**は別である。実測は後者を支持している。

| レバー | 実測された効果 | severity |
|---|---|---|
| **① 誤りの可視化(L3 INDEX + 明示 fallback)** | 凍結 expected 301/301 occurrence が可視(inline 300 / index-only 1 / **absent 0**)。no-owner control は「0 inline / 96 INDEX」という**見える異常**になった。negative control **8/8 RED**、positive control **1/1 GREEN** | 🔴 採用価値あり |
| **② brief↔packet の重複除去** | `CITABLE` **6,879 B = packet の 23.77%**(`04_…md` D5)。ID 参照へ置換可能 | 🟡 |
| **③ GEN の搭載** | 現行 brief は GEN を **0 件**しか載せていない(`01_…md` A1.4)。probe では GEN 不一致 control が RED になった | 🔴 単独で有効・低コスト |

**①〜③ は size と独立に効く。**したがって本 objective の成果は
**「brief を小さくする方法」ではなく「brief の欠落を見える化し、二重配送を削り、鮮度を検証可能にする方法」**である。
Human への提案はこの形に組み替える。

---

## §3. 未解決 — Human 裁定なしに進めない 3 点

### ① ALWAYS 集合が確定していない(T4)

| レーン | ALWAYS | OBJECTIVE_SCOPED | AMBIGUOUS |
|---|---:|---:|---:|
| L2(`02_…md` B1) | 12 | 82 | 2 |
| L4(`04_…md` D8b、独立再分類) | **19** | 77 | 0 |

L4 が追加した 7 件: **baton 4 / 25 / 43 / 44 / 52 · §3 line 148 / 207**。
L4 の論拠は「L2 自身の規則を**双子の言い回しへ対称適用**した」というもので、
例えば baton 52 は §3:203 と同じ 128 KiB STOP と truth 削除禁止を持つ。

**投票では決めない**(rule 22 §Disagreement)。分岐点を特定すると:

> **ALWAYS な境界の「双子」を持つ item 自身も ALWAYS か。**

- L2 の読み: 双子が必ず載るので、その item は OBJECTIVE_SCOPED でよい。
- L4 の読み: その item 単独の欠落で誤りうるなら ALWAYS。

**測定で決まる問題ではなく、定義の問題である。**ただし安全側は L4 である —
「双子が載るから大丈夫」は、**双子が削除される mutation を本 repo が実際に測っている**
(baton 54 / control 8)ため成立しない前提に依存する。

🔴 **ただし正しい修正は「19 件全部を L0 へ入れる」ではない。**それは同じ禁止を毎回二重に載せる。
正しいのは **`02_…md` B4-6 が指摘した dependency edge を明示すること** —
OBJECTIVE_SCOPED item が ALWAYS 境界を内包するなら、その edge を宣言し、router が境界側を必ず含める。
**この解決自体が未検証である。**Human 裁定 + 次回検証が要る。

### ② `evidence-map.md` の事実が catalog の外にある(T3)

`INDEX_COUNT: 96` が green のまま、owner 1 つ分の事実(donor SHA pin · evidence 読解順序 ·
closed-objective 出力 · loop position · feedback queue)が落ちうる。
とくに **S007 の「`09` を `08` より先に読む」順序**(case DT-6 の防御)はここにしか無い。

**選択肢:** ⓐ evidence-map の事実を governed item 化して catalog を拡張する /
ⓑ evidence-map は常に全文同梱する / ⓒ 現状維持(= 既知の穴として受容)。
**裁定は Human。**harness の推奨は ⓐ だが、**item 化のコストは未測定**。

### ③ ID の存在は禁止の存在を保証しない(control 8 の限界)

control 8 が RED になったのは、probe が **CORE 12 件の literal signature guard** を
追加したからであり、L3 INDEX 自身の性質ではない。`06_…md` E5 が明記:

> L3 by itself would still show only the ID and stub and cannot prove that the body retained
> its prohibition.

しかも signature guard は **正当な言い換えで割れる**(PT-29 の形)。
**baton 54 の「意味的十分性を測る executable guard は存在しない」は依然として真である。**

---

## §4. 派生する設計上の欠陥(実測、未解決)

| # | 欠陥 | owner |
|---|---|---|
| D1 | route と lane を混同(`FALSIFICATION` が両方) | `06_…md` E7-6 |
| D2 | `FULL_BRIEF` の表現が未定義(96 本文+INDEX か、現行 brief の呼び出しか) | E7-7 |
| D3 | tag / dependency に owner も GEN も無い — **第 4 の truth surface** | E7-8 |
| D4 | 位置ベース `S3-NN` ID は挿入で全部ずれる。安定 ID は owner か governed catalog に要る | E7-9 |
| D5 | 6-route 圧縮は製品側で効かない(Product/Registry/Compiler が同一 75/96) | E7-5 |
| D6 | fallback 率 **2/6 = 33.3%**、fallback は full より **+13.7%** 大きい | E6 |

---

## §5. baton 25 / baton 43(v1 から変更なし、L4 が V1 を CONFIRMED)

### baton 25 — 🔴 current truth の反証(L1 · L3 · L4 の 3 レーンが一致)

`16.md:97` と `16.md:206` の「`READ_ALLOWANCE = 48,000` の導出記録はこの project に 1 件も存在しない」は
**事実として誤り**。導出は `scripts/read-load.sh:56-79` にあり、`git blame` / `git log --follow` とも
bootstrap commit `2a18176c` 一本のみ。`sessions/S004_…md:57-62` は**同じ passage 内で**
「導出記録は 1 件も無い」と書き、直後に `48,000 = 168,221 − 120,000` を書いている。

実際に欠けているのは **導出の入力(200,000 / 31,200 / 579 / 120,000)の現行再検証**。
導出モデルと `U = 63,298 est tok` は `03_…md` C3–C5 が owner。
**採用可能な数値は出ない** — `C`(context window)· `P`(system/tool overhead)· `G`(packet 往復)は
this repo で取得不能、`W` / `O` / `S` は Human 宣言事項。
**裁定の結論は無傷、根拠だけが崩れた — baton 38 と同型。再裁定要否は Human。**

副次: `read-load.sh` は実コストを **728 est tok 過小報告**(hook wrapper + manifest)。🟢(1.2%)。

### baton 43 — 原因確定、設定は未変更

実効 `medium`(**2,095/2,095 records · 1,020/1,020 unique requestId · 8 files**)。
機構は Claude Code 2.1.246 の実バイナリから: `modelSettings` は canonical 名 keyed、
`[1m]` は比較前に除去、同一 layer で per-model が top-level に優先。
Human が変える箇所は `modelSettings["claude-opus-5"].effortLevel` の `medium`→`xhigh` **1 箇所のみ**。
effort cost index は 0.76 → 1.6(約 2.11 倍)。**実 latency / token / 課金の変化量は `NOT OBTAINED`**。
rollback は逆編集 + **新 session の transcript 再測定**(JSON を戻しただけでは未確認)。

🔴 **S000–S009 の全作業が `medium` で行われている。**これは過去の全 finding の生成条件である。

---

## §6. 🔴 parent 自身の欠陥 — case DT-9 候補(DT-7 / DT-8 の 3 度目)

`04_…md` D5 が実測: rule 22 §Delegation packet と packet template 契約 2 は
critical stop condition の **逐語継承・AI 要約禁止**を要求するが、
**本セッションの 3 packet の該当 5 行は 5/5 が PARAPHRASED、verbatim 0/5**。

- delegate 成果物の欠陥: **0 件**
- parent の手元作業(packet 執筆)の contract 違反: **5/5**

**DT-7(委譲を厳格に運用した結果、parent の手元に残った作業が黙って誤る)·
DT-8(検査を作る工程自体が無検査地帯)の 3 度目の再演である。**
しかも今回は **packet 契約の遵守を測る executable guard が存在しない**ことが原因で、
捕まえたのは**また dispatch された独立レーン**だった(DT-6 と同じ結論)。

---

## §7. Human 裁定が要る点(最終)

| # | 論点 | harness の立場 |
|---|---|---|
| **1** | 🔴 **task-scoped brief は製品設計 route の size 問題を解かない**(−5.16%)。menu 1 → 2 の前提が実測で崩れた。**次の製品設計へどう進むか** | 事実の報告。順序も着手も Human |
| **2** | 本 objective の成果を **「size 削減」ではなく「欠落の可視化 + 重複除去 + GEN 搭載」**として受理するか | 推奨 |
| **3** | ALWAYS 集合 **12 か 19 か**、および dependency-edge 方式の採否 | 安全側は 19。ただし正解は edge 明示 |
| **4** | `evidence-map.md` の事実を governed item 化するか(ⓐ/ⓑ/ⓒ) | 推奨 ⓐ。コスト未測定 |
| **5** | baton 25 / §3:206 の**根拠反証**に対する再裁定(維持・根拠差替 / 再検討 / 維持+限界明記) | 裁定は Human。harness は覆さない |
| **6** | `modelSettings["claude-opus-5"].effortLevel` を `xhigh` へ変えるか | 提示のみ。AI は変更しない |
| **7** | `READ_ALLOWANCE` 導出の Human 入力(`W` / `O` / `S`)と roster 宣言 | 提案のみ。値は未変更 |
| **8** | `BRIEF_MAX_BYTES = 128 KiB` の扱い(**維持を推奨** — fallback が full を出すため防護柵が要る) | proposal のみ |
| **9** | probe code(`investigations/…/probe/`)を **batons 24/26 と同じ measurement-only 扱い**で baton 化するか | 推奨。production ではない |
| **10** | 本 objective は **設計・検証まで**であり実装 GO を含まない | 確認 |

---

## §8. まだ無いもの(正直な欠落)

- dependency-edge 方式の検証: **未実施**
- evidence-map item 化のコスト: **未測定**
- ALWAYS 19 で作り直した場合の実測: **未実施**(probe は 12 で実装)
- 新 prototype 出力 vs delegation packet の重複: **`NOT OBTAINED`**
- probe を配線した場合の read-load 変化: **`NOT OBTAINED`**(意図的に未配線)
- 現行 full brief の false facts: **`NOT OBTAINED`**
- **本結論そのものへの FALSIFICATION: 実施中(この文書が対象)**
