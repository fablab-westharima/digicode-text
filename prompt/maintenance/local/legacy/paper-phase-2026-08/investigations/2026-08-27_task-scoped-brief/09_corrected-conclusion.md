# 09 — 統合結論 v3(FALSIFICATION による訂正版)

**Author:** Harness / Integration Conductor(Claude Code, Opus 5)
**これは統合であり一次証拠ではない。一次証拠は `01`–`04` · `06` · `08` · `probe/artifacts/`。
矛盾したら一次証拠が正しい。**

**`07_revised-conclusion.md` は本文書に置き換えられる。**`07` は削除せず、
**`08_integration-falsification.md` の攻撃対象として履歴に残す**(訂正前の主張を current truth として
持ち帰らないため、**`08` を `07` より先に読むこと** — S007 の `08`/`09` と同じ順序規律、case DT-6)。

---

## §0. 何が訂正されたか — `08` が壊したもの

`08` は `07` の**事実主張 91 件を全件追跡**し、
**SUPPORTED 59 / OVERSTATED 20 / UNSUPPORTED 6 / CONTRADICTED 6** と判定した。
うち **load-bearing な訂正 6 件**を先に置く。

| # | `07` の記述 | `08` の反証 | 訂正後 |
|---|---|---|---|
| **X1** | 「削減は 1 件だけ」「『小さくなる』は 5/6 で成立しない」 | 同じ表で **4/6 が byte 減**(Harness + 製品 3 件)。`06` の原文は **「useful threshold が substantial reduction であれば」**という条件つき。`07` はその条件を落とした | **4/6 が減少。ただし製品 3 件は −5.16% にとどまる。「substantial」の閾値は誰も定義していない** |
| **X2** | −5.16% の原因は「分類器の性能ではなく current truth の依存構造」 | probe の `PRODUCT_ARCH` は Compiler+Registry+Device を**意図的にまとめた手書きの保守的閉包**(`06:31-35`)であり、3 fixture が同一 75/96 なのは **route table の性質**。既存 artifact から、probe 自身が不要と認めた 12 block(8,965 B)を引くだけで **88,512 B = −13.88%**、L6 独立導出の 55 item なら **81,833 B = −20.38%** | **🔴 §1 の headline は BROKEN。原因を current truth に帰属させられない** |
| **X3** | S007 の evidence 読解順序は「evidence-map にしか無い」 | **router `16.md:46-48` に同じ順序が重複して存在する** | **誤り。catalog の穴は残るが、この例は不適切** |
| **X4** | 「delegate 成果物の欠陥 0 / parent の手元 5/5」 | L4 が L2 の分類集合を 7 件で反証し、L3 は自らの scope 逸脱検索を報告している。**cross-delegate の「欠陥 0」監査は存在しない** | **「欠陥 0」は撤回。parent 側 5/5 の narrow metric のみ有効** |
| **X5** | 3 つのレバーは「size と独立に効く」 | **重複除去はそれ自体が size レバー**。GEN は不一致検出であって鮮度証明ではない | **「size と独立」は撤回** |
| **X6** | 「S000–S009 の全作業が medium」 | 実測は 1 時点の 8 file corpus。過去 session の launch 引数は未取得。baton は S000–S008 のみ主張 | **観測 corpus の条件つき事実へ後退** |

さらに `08` §F6 は、`07` が一次証拠から**落とした・弱めた限定を 23 件**列挙している。
以下の本文はそれらを戻した版である。

---

## §1. size — 何が測れて、何が測れていないか

| fixture | bytes | 現行 full brief(102,782 B)比 | inline |
|---|---:|---:|---:|
| Harness Maintenance | 66,403 B | **−35.39%** | 32/96 |
| Product Architecture | 97,477 B | −5.16% | 75/96 |
| Registry / Device Knowledge | 97,477 B | −5.16% | 75/96 |
| Compiler | 97,477 B | −5.16% | 75/96 |
| Generic unknown(fallback) | 116,855 B | **+13.69%** | 96/96 |
| FALSIFICATION(fallback) | 116,873 B | **+13.71%** | 96/96 |

**測れたこと:** **4/6 が減少**し、**fallback 2/6 は増加**する。減少幅は route により **−35.39% 〜 −5.16%** と大きく開く。

**測れていないこと(重要):**

- **製品 route の −5.16% は route table の作り方に強く依存する。** probe が不要と認めた 12 block を
  引くだけで **−13.88%**、L6 が独立に導いた 55 item 集合なら **−20.38%**(いずれも既存 artifact 上の
  静的反実仮想であり、再生成した実測ではない)。**別の route table は一度も測っていない。**
- したがって **「製品 objective は本当に current truth の大半を必要とする」は仮説であり、
  この測定が確立した事実ではない。** L6 の独立導出は **55/96**(L4 の係争 7 件を足すと 62/96)で、
  `06` E2 の 63 とは cardinality が近くても**構成が実質的に違う**。
- 「substantial reduction」の閾値は**誰も定義していない**。定義せずに 5.16% を「効果なし」と読むのは post-hoc。

🟡 **したがって Human へ出せるのはこう:**
**現在の route 設計では製品 route の削減は 5.16% にとどまるが、route 設計を変えれば
13.9%〜20.4% まで動く余地が既存 artifact 上で示された。次の製品設計に対して task-scoping が
有効かどうかは、route の gold set を凍結して 2 つ以上の route table を測るまで確定しない。**
`08` §F2 が、その決着手順(actor/lane/phase/action を宣言した fact-level gold set を独立レーンが
生成前に凍結 → 不一致を裁定 → 複数 route table を同一 gold set で測定)を具体的に書いている。

**L3 INDEX は 27,202–27,458 B**(`07` の見積 7.7 KiB の 3.45–3.48 倍)で全 route に無条件で乗る。
これは削減の上限を押し下げる固定費であり、**index を「非選択 item のみ」に縮めるなど未検証の改善余地がある。**

---

## §2. 安全性 — narrow に成立し、一般化はしない

**成立した narrow な結果:**
凍結 expected **301/301 occurrence が可視**(inline 300 / index-only 1 / **absent 0**)。
negative control **8/8 RED**、positive control **1/1 GREEN**。
no-owner は「0 inline / 96 INDEX」という**見える異常**になった。

**`08` が戻した限定:**

- 対象は **凍結された 96-ID universe と注入された 8 つの failure shape のみ**。
  `06:188-191` は「**任意の Objective は検証していない**」と明記し、control 6/7 は
  **fallback の検出であって正しい意味分類ではない**。
- control 8 が RED になったのは probe が足した **CORE12 の literal signature guard** のためで、
  L3 INDEX 自体の性質ではない。**ID + 空洞化した stub は L3 を通る。**
- **GEN は「不一致検出」であって鮮度証明ではない。** owner set 全体が同じ古さ(common-mode)、
  中身だけ古く GEN は current、部分欠落 — いずれも見えない。
- **重複除去は size レバーそのもの。**`CITABLE` 6,879 B は**物理行単位の gross upper bound** であり
  net saving ではない(参照 ID 自体の byte を差し引いていない)。
- 全 fixture は `NO_REPO_ACCESS` / execution phase / investigative action **のみ**。
  actor・phase・action の一般化は**未検証**。
- 正常系の **wrong-route rate は 1/6**、不要 inline は Product 12 / Registry 29 / Compiler 37 /
  FALSIFICATION 67。**分類品質は可視性の結果より明確に弱い。**
- probe の tag / dependency は **owner も GEN も持たない第 4 の truth surface** であり、
  wrong tag・欠落 edge・新規 non-item fact を検出できない。

🟡 **安全に言えるのはここまで:**
**「固定 catalog と注入された failure shape に対して observability が向上した。
一般の意味的完全性・任意 Objective の分類・鮮度・net な重複削減は未検証。」**

---

## §3. catalog の穴(訂正済み)

96 item catalog は `16.md` §2/§3 のみを覆う。`evidence-map.md` の事実
(donor SHA pin · closed-objective 出力 · loop position · feedback queue)は **scanned denominator = 0** で、
`INDEX_COUNT: 96` が green のまま落ちうる。

🔴 **ただし `07` の例示は誤りだった** — S007 の読解順序は **`16.md:46-48` にも重複して存在する**(X3)。
穴は残るが、**fact-level の分母は `NOT OBTAINED`** であり、「owner 1 つ分が丸ごと不可視」という
強い言い方はできない。

選択肢 ⓐ item 化 / ⓑ 常時全文同梱 / ⓒ 既知の穴として受容。**コスト未測定。裁定は Human。**

---

## §4. ALWAYS 分類 — 未解決(「解決した」という書き方を撤回)

| | ALWAYS | SCOPED | AMBIGUOUS |
|---|---:|---:|---:|
| L2 | 12 | 82 | 2 |
| L4(独立) | 19 | 77 | 0 |
| L6 spot-check 7 件 | — | — | **どちらのレーンも一貫していない** |

`08` §F4 の独立 spot-check(7 件)の結論:

- **L2 は不整合** — CORE12 の一部も「双子」を持つのに、双子を持つ他の item だけ scoped にしている。
- **L4 は過剰昇格** — composite item(baton 43 / §3:207 は普遍節と harness 固有の履歴が同居)と
  trigger-scoped row(baton 44 は競合実査 trigger)まで ALWAYS にしている。
- **不一致の本質は「定義の違い」ではなく「単位の違い」** — L2 は *item の単独欠落*で分類し、
  L4 は *obligation* で分類している。

🔴 **`07` が「安全側は L4」「正しい修正は dependency edge」と書いたのは両方とも撤回する。**
control 8 は「双子が届くこと」ではなく **後付けの signature** で殺されたので、
L4 が安全であることの証拠にはならない。dependency edge は**一度も検証していない設計**であり、
harness がそれを「正しい」と呼ぶ権限はない(rule 24 §Human authority)。

**現状は未解決。**候補は少なくとも 3 つある — ① CORE19 ② dependency edge
③ **composite item の分割 / semantic-obligation 単位への変更**(L6 が提示)。**いずれも未検証。**

---

## §5. baton 25 / baton 43(`08` が STANDS と判定)

### baton 25 — 根拠の反証は成立(L1 · L3 · L4 が一致、L6 が確認)

`16.md:97` / `16.md:206` の「導出記録はこの project に 1 件も存在しない」は**事実として誤り**。
導出は `scripts/read-load.sh:56-79`、`git blame` / `git log --follow` とも bootstrap commit
`2a18176c` 一本。`sessions/S004_…md:57-62` は同じ passage 内で「記録は無い」と書き、直後に
`48,000 = 168,221 − 120,000` を書いている。

欠けているのは**導出そのものではなく、その入力の現行再検証**。
`U = M − I + H = 62,570 − 25,502 + 26,230 = 63,298 est tok`。
`A_candidate = max(0, C − P − W − G − O − S)` で、`C`/`P`/`G` は this repo で取得不能、
`W`/`O`/`S` は Human 宣言事項。**採用可能な数値は出ない。値は未変更。**

🟡 `08` の追加限定: **WARNING は「読む量が構造的に多い」のか「threshold の入力が古い/不適用」なのかを
区別できない。**この因果の曖昧さは残る。

🔴 **裁定の no-change 境界は無傷。ただし「根拠が正しければ Human は同じ裁定をしたか」は測っていない。**
再裁定要否は Human のもの。

副次: `read-load.sh` は実コストを **728 est tok(1.2%)過小報告**(hook wrapper + manifest)。🟢

### baton 43 — 原因確定、設定は未変更

実効 `medium` — **2,095/2,095 assistant records · 1,020/1,020 unique requestId · 8 files**、
**1 時点の live corpus に条件づけられた測定**。
機構は Claude Code 2.1.246 の実バイナリから: `modelSettings` は canonical 名 keyed、
`[1m]` は比較前に除去、同一 layer で per-model が top-level に優先。

Human が変える箇所は `modelSettings["claude-opus-5"].effortLevel` の `medium`→`xhigh` **1 箇所のみ**。
effort cost index 0.76 → 1.6(約 2.11 倍)。**実 latency / token / 課金の変化量は `NOT OBTAINED`。**
rollback は逆編集 + **新 session の transcript 再測定**。

🟡 **訂正(X6):** 「S000–S009 の全作業が medium」とは言えない。**観測された 8 file corpus では
全件 medium**であり、過去 session の launch 引数は未取得。baton の主張は S000–S008。

---

## §6. 🔴 parent 自身の欠陥(訂正済み)

### ① packet contract 違反 — narrow に成立

rule 22 §Delegation packet(`22-…md:174-181`)と packet template 契約 2 は critical stop の
**逐語継承・AI 要約禁止**を要求する。本セッションの 3 packet について
**`04` D5 が選んだ 5 つの物理 STOP_IF 行は 5/5 が PARAPHRASED、verbatim 0/5**。

🟡 **`08` が正した分母:** 5 は **「D5 が選んだ inherited-stop の物理行」の分母**であって、
STOP_IF bullet 全体(12)でも、critical 命題全体でも、parent の欠陥全体でもない。
**「executable guard が無いことが原因」という因果は検証していない。**

### ② 統合が自分の evidence を超えた — DT-6 の再演

**本セッションの統合 `07` は、事実主張 91 件中 CONTRADICTED 6 / UNSUPPORTED 6 / OVERSTATED 20 を
含んでいた。**捕まえたのは **dispatch された独立 FALSIFICATION レーン**であり、
統合者の自己点検は **0 件**しか捕まえていない。**S007(13 件)と同じ結論。**

### ③ 🔴 「delegate 成果物の欠陥 0」は撤回(X4)

L4 は L2 の ALWAYS 集合を 7 件で反証し、L3 は自らの scope 逸脱検索を自己申告している。
**cross-delegate の「欠陥 0」監査は存在しない。**`07` はそれを書いた。

→ **case DT-9 として起票**(§8)。

---

## §7. Human 裁定が要る点(`08` §F7 の権限指摘を反映)

**すべて proposal であり、harness の結論ではない。**

| # | 論点 | harness の立場(`08` による修正後) |
|---|---|---|
| **1** | 🔴 task-scoping は次の製品設計の size 問題を解くか | **未確定。**現 route では −5.16%、route を変えれば −13.9〜−20.4% の余地が既存 artifact 上で示された。**決着には gold set 凍結 + 複数 route table の測定が要る**(`08` F2 に手順)。**「解かない」と断定した `07` の主張は撤回** |
| **2** | 本 objective の成果をどう受理するか | **受理判断は Human のみ**(rule 24)。harness が提示できるのは「固定 catalog での observability 向上・重複の gross 実測・GEN 欠落の発見」という**限定つきの成果**まで |
| **3** | ALWAYS 分類(12 / 19 / 分割 / edge) | **未解決。**候補 3 つ、いずれも未検証。harness はどれも「正しい」と呼べない |
| **4** | `evidence-map.md` の事実を governed item 化するか | 穴は成立。**分母は `NOT OBTAINED`、コストも未測定。**proposal のみ |
| **5** | baton 25 / §3:206 の**根拠反証**への再裁定 | 反証は成立。**裁定は Human。**harness は覆さない |
| **6** | `modelSettings["claude-opus-5"].effortLevel` → `xhigh` | 提示のみ。**AI は変更しない** |
| **7** | `READ_ALLOWANCE` 導出の Human 入力(`W`/`O`/`S`)と roster 宣言 | proposal のみ。`C`/`P`/`G` は platform/transport 側の証拠も要る |
| **8** | `BRIEF_MAX_BYTES = 128 KiB` | **限定つき proposal として維持を提案。**他 threshold 設計との比較は**していない**。裁定は Human |
| **9** | probe code の扱い | **`08` が指摘: 「baton 化すべき」は無根拠。**事実は「measurement-only・未配線」のみ。**Human への任意の問い**として置く |
| **10** | 本 objective は設計・検証まで(実装 GO 無し) | scope 確認 |

---

## §8. 起票する case

**DT-9(候補、本セッションで起票)** — **DT-6 の再演・統合工程版、かつ DT-8 の隣**:
統合文書が事実主張 91 件中 12 件を evidence に反して/根拠なく述べ、20 件を分母や限定を超えて一般化した。
**認知的自己点検は 0 件しか捕まえず、捕まえたのは dispatch された独立レーンだけ。**
同時に、parent が書いた 3 packet の critical stop 逐語継承は 5/5 不履行だった。
**2 つとも parent の手元作業で起き、どちらにも executable guard が無い。**

---

## §9. まだ無いもの(正直な欠落)

- route gold set の凍結と複数 route table の比較: **未実施**(決着手順は `08` F2)
- dependency edge / item 分割 / CORE19 いずれの検証: **未実施**
- evidence-map item 化のコスト: **未測定**
- 現行 full brief の false facts: **`NOT OBTAINED`**
- prototype 出力 vs packet の重複: **`NOT OBTAINED`**
- probe を配線した場合の read-load 変化: **`NOT OBTAINED`**(意図的に未配線)
- actor / phase / action を変えた場合の挙動: **未検証**(全 fixture が同一 tuple)
- `context-brief.sh` の fail-open 面(`CONTEXT_BRIEF_*` の path containment 無し · gitleaks 不在時の続行 · `--out` の cp RC 未捕捉): **`01` A1.2 が実測。本 objective では未対処**(ADJACENT_DEFECT)
- **本訂正版 `09` 自身への再 FALSIFICATION: 未実施**
