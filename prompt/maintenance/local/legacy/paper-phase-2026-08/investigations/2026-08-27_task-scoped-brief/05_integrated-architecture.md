# 05 — Task-Scoped Context Delivery Architecture(統合設計案)

**Author:** Harness / Integration Conductor(Claude Code, Opus 5)。**これは統合であり、一次証拠ではない。**
一次証拠の owner は `01_…md`(architecture inventory)· `02_…md`(failure-mode falsification)·
`03_…md`(allowance / effort)· `04_…md`(duplication / cross-check)。**本文書と一次証拠が食い違ったら
一次証拠が正しい。**

**Status:** DRAFT — **統合結論そのものへの FALSIFICATION を通す前の状態**。S007 の case DT-6(統合が自分の
evidence を 13 箇所超えた)と S008 の case DT-8(parent の手元作業に検査工程が無い)を踏まえ、この文書は
Human へ出す前に独立レーンの攻撃対象になる。

---

## §1. 何が壊れたか — 出発点を先に固定する

Lane B(`02_…md` §B7)の falsification verdict は **`BROKEN`** である。ただし**壊れた場所を取り違えると
設計全体が誤る**ので、まず正確に写す。

| 検定された主張 | 結果 |
|---|---|
| 「ALWAYS 級の truth だけで cap に迫るので task-scoping は無意味」 | **反証されなかった**(= task-scoping には実際に削減余地がある)。ALWAYS 12 件 = **8,571 B = cap の 6.54%**、full brief の 8.35% |
| 「Objective ごとに必要な current truth だけを **安全に** export できる」 | **BROKEN**。理由は容量ではなく、**選んだ subset が意味的に十分だと機械検証できないこと** |

破断の根拠は本 repo の実測 precedent である(baton 54 / `batons.md:73`):

> **B71 cannot see whether a stub still carries its prohibition** — stub の意味的十分性を測る
> executable guard は存在しない。人間かレーンの査読が唯一の手段。

実証済みの具体例も既にある: baton 44 の Human-GO 禁止文を `See baton 44.` に置換しても B71 は green だった。
**ID が揃っていることと、禁止が生きていることは別命題である。**

さらに Lane B は**前提そのものを訂正した**。必要な写像は `task → owner` ではない:

> `(Objective, actor, lane, phase, action) → semantic obligations`

「production へ進まない」「Human review を省かない」「GO なしで setting を変えない」は Objective の名詞では
決まらず、**誰が・どの lane で・どの phase で・何をしようとしているか**で決まる。Objective 名だけを入力に
した router は、`investigate` と `implement` を区別できない。

### 設計原則としての結論

**「機械的に安全な task-scoped export」を名乗ってはならない。** 名乗れるのは
**「complement を可視化した、review 付きの risk reduction」**までである。以下の設計はその強度で書く。

---

## §2. Requirements(実装前の明文化 — Human 指示 §9 に対する回答)

Human が列挙した最低要件を、**実測で裏づく形へ変換**した。R1–R17 が要件、右列がその要件を生んだ観測。

| # | 要件 | それを生んだ観測(owner) |
|---|---|---|
| **R1** | repo access なし actor が単体で使える | rule 22 §Routes / `README.md:78` — brief は Route B の唯一の正規 export 面 |
| **R2** | Human ruling を落とさない | `02_…md` B2.2 — owner 0 選択で `16.md:205`「task-scoped export をその場で実装しない」がちょうど消える |
| **R3** | GO/STOP boundary を落とさない | `16.md:53-59` は §1 に属し、現行 brief では `CURRENT STATE` に含まれる |
| **R4** | critical prohibition を落とさない | ALWAYS 12 件(`02_…md` B1)。うち 5 件は絶対境界(donor / governance / secret / template / production) |
| **R5** | Objective に関係する ruling を落とさない | OBJECTIVE_SCOPED 82 件の選択問題 |
| **R6** | 無関係な巨大 history/evidence を渡さない | `01_…md` A2 — `CURRENT STATE` 58,210 B のうち **baton 本文 37,514 B** が最大の塊 |
| **R7** | conditional owner を必要に応じて選択 | `CLAUDE.md` §0 の owner 契約 |
| **R8** | unknown task でも安全に fallback | `02_…md` B2.4 — full brief 102,629 B は cap の 78.3% で**現時点では収まる** |
| **R9** | wrong owner を検出 | `02_…md` B2.1 — wrong-owner は token cost ではなく **scope expansion surface**(baton 45 の literal trigger が harness objective でも発火して読める) |
| **R10** | no owner を検出 | R2 と同じ実例 |
| **R11** | stale owner を検出 | `01_…md` A1.4 — **brief は GEN を 1 つも載せていない**(`grep -Fc 'GEN:'` = 0)。hook は載せている |
| **R12** | source owner への pointer を維持 | `evidence-map.md` の read 順序(S007 は `09` を `08` より先に読む)は pointer が無いと復元不能 |
| **R13** | complete だが最小 | `02_…md` B5 — completeness の意味的検証は不可能。**minimality を安全性の指標にしない** |
| **R14** | exported brief 自身が新たな authority にならない | `evidence-map.md:53` の既存規律(Downloads 報告書は owner ではない)の一般化 |
| **R15** | target actor の能力/role に応じて内容を変える | `01_…md` A8 — repo あり / なしで必要物が実際に違う |
| **R16** | FALSIFICATION lane には attack surface を十分渡す | `02_…md` B1.4 — 必要な obligation は lane 依存 |
| **R17** | implementation lane に Objective 外の誘惑情報を渡さない | rule 24 の widening 側 + `02_…md` B2.1 |

**追加要件(実測から新規に導出、Human 指示には無かった):**

| # | 要件 | 根拠 |
|---|---|---|
| **R18** | **渡さなかった truth の存在を、渡さなかったことごと可視化する** | `02_…md` B5.3 — subset の意味的十分性は検証できない。**検証できないなら、欠落を silent にしないことが唯一残る防御である** |
| **R19** | brief は `GEN` と owner 別 GEN を必ず載せる | `01_…md` A1.4(現状 0 件) |
| **R20** | AI は選択を **広げる方向にのみ**関与でき、狭める方向には関与できない | `02_…md` B3 — 危険な誤りはすべて narrowing 側で起きる |

---

## §3. 設計 — Core + Selected + Index の 3 層

### §3.1 構造

```
BRIEF v2
├─ L0  CORE          — 無条件。Objective・actor・lane に関係なく必ず載る
├─ L1  SELECTED      — route が選んだ OBJECTIVE_SCOPED item の本文
├─ L2  LANE_OVERLAY  — lane 依存の追加面(FALSIFICATION 用 / IMPLEMENTATION 用)
└─ L3  INDEX         — 選ばれなかった item も含む 全 item の ID + 1 行 stub + owner path
```

**L3 がこの設計の中心である。** subset の意味的完全性は証明できない(§1)。したがって設計目標を
「完全な subset を作る」から **「不完全さを actor に見える状態にする」** へ移す。
選ばれなかった truth は *無* にならず、**index entry へ縮退する**。actor は
「S3-27 という ruling が存在し、今回は本文を渡されていない」と分かり、要求できる。

- `no-owner` は「何も無い」ではなく「**96 件全部が index にあり、本文 0 件**」という**目に見える異常**になる。
- `partial-owner` は「§3 の本文が 0 件で index に 48 件」という形で現れる。
- **silent omission が構造的に作れなくなる。** これは意味的十分性の保証ではないが、
  実測 precedent(B71 が green のまま prohibition が消えた)が示す**silent という性質そのもの**を取り除く。

L3 のコスト実測見積: 96 items × 平均 80 B ≈ **7.7 KiB**(`[inferred]` — 実測は fixture 段階)。

### §3.2 L0 CORE の内容(無条件)

| 要素 | 出所 | 実測/見積 |
|---|---|---|
| `BRIEF-SCHEMA` / repo / branch / full+short HEAD / dirty / UTC 生成時刻 | 既存 `IDENTITY` | 267 B(実測) |
| **owner 別 GEN 3 件**(router / batons / evidence-map) | **新規 — R19** | ~60 B `[inferred]` |
| `PURPOSE`(`CLAUDE.md` §4) | 既存 | 5,237 B(実測) |
| GO/STOP boundary(`16.md` §1 の該当表) | 既存 §1 の一部 | ~2 KiB `[inferred]` |
| **ALWAYS ruling 12 件 全文** | `02_…md` B1 | **8,571 B(実測、source weight)** |
| owner manifest(3 owner の path + holds + trigger) | hook の manifest と同形 | ~1 KiB `[inferred]` |
| fallback 宣言 + `STATUS` + `ROUTE` + 選択理由 | 新規 | ~0.5 KiB `[inferred]` |
| **「この brief は authority ではない。repo owner と矛盾したら repo が正しい」** | 新規 — R14 | ~0.2 KiB |
| L3 INDEX(全 96 item) | 新規 — R18 | ~7.7 KiB `[inferred]` |

**L0 合計見積 ≈ 25.5 KiB**(cap の 19.5%)。**実測ではない — fixture 段階で測る。**

🔴 **ALWAYS 12 件の集合そのものが、この設計の単一障害点である。** 1 件でも取りこぼせば、
全 Objective で恒久的に落ちる。だからこそ L4 レーンへ **96 件の独立再分類**を投げており、
L2 との不一致は「揃った」ではなく **findings** として扱う。

### §3.3 routing — deterministic を主、AI を従に置く

`(Objective, actor, lane, phase, action) → obligations`。

**主:** 各 item に**明示 metadata tag** を付け、決定的に選択する。
**従:** AI は **tag の提案** と **選択の拡張** のみ。**narrowing は構造的に不可**(R20)。

```
route(Objective, actor, lane, phase, action):
    obligations := ALWAYS                       # 常に全件
    obligations ∪= deterministic_match(tags)    # 明示 tag
    obligations ∪= transitive_deps(obligations) # dependency edge
    obligations ∪= ai_proposed_additions        # AI は ∪ のみ。差集合を作れない
    if route_unresolved or ambiguous or multi_domain or untagged_item_exists:
        return FULL_BRIEF, STATUS=FALLBACK_FULL, reason=<literal>
```

**category は増やさない。**Human 指示 §10 の候補を、実測に合わせて **6 route** へ圧縮する:

| route | 含む Objective 例 |
|---|---|
| `HARNESS` | harness maintenance · context brief · read architecture · close · orchestration |
| `PRODUCT_ARCH` | product architecture · compiler · registry / device knowledge · UI / editor · helper / desktop |
| `EVIDENCE` | competitor research · donor audit · 学術/一次情報調査 |
| `IMPLEMENTATION` | 実装(settled scope 内) |
| `VERIFICATION` | 検証・再測定 |
| `FALSIFICATION` | 統合結論への攻撃 |

`PRODUCT_ARCH` を細分しないのは、`02_…md` B4-6 が **Managed Environment design だけで
batons 13/15/21/29/32/34/35/38–40/45/47/48/50/51 と複数 §3 ruling を横断する**と実測したためである。
細分は dependency edge の欠落を増やすだけで、削減にならない。

**actor / lane / phase / action は route の直交軸**であり、category ではない:

| 軸 | 値 | 効果 |
|---|---|---|
| `actor` | `REPO_ACCESS` / `NO_REPO_ACCESS` | §3.5 |
| `lane` | 6 lane | L2 LANE_OVERLAY の内容 |
| `phase` | `PREFLIGHT` / `EXECUTION` / `CLOSE` | preflight は baton 43 を必ず含む、close は baton 53 を必ず含む |
| `action` | `INVESTIGATE` / `EDIT` / `ADOPT` | `EDIT`/`ADOPT` は**全 authority 系 ruling を強制的に ALWAYS へ昇格** |

### §3.4 fallback の梯子(すべて fail-closed・loud)

| 事象 | 挙動 | 根拠 |
|---|---|---|
| route 解決不能 / 未知語 | `FULL_BRIEF` + `STATUS: FALLBACK_FULL` + 理由 | `02_…md` B2.4 — 102,629 B は cap の 78.3% で収まる |
| Objective が複数 domain | 該当 route の**和**。それでも曖昧なら FULL | 狭める方向を許さない(R20) |
| tag の無い item が 1 件でも存在 | **FULL_BRIEF**(部分選択を許さない) | `02_…md` B4-2 — untagged を「どの route にも属さない」と扱うと silent omission |
| owner 到達不能 / GEN 不一致 | 出力せず exit(既存 fail-closed と同形) | `01_…md` A1.2 |
| L0 CORE の item が 1 件でも欠けた | **出力せず exit** | ALWAYS は単一障害点(§3.2) |
| brief が cap 超過 | **出力せず exit 5**(既存)。**cap を上げない・truth を消さない** | `16.md:203` |

🔴 **fallback が常用されると size 目的は達成されない。** これは設計の欠陥ではなく、
**安全側の既定値を選んだことの正直な代償**であり、Human へそう報告する。
fallback 率は fixture で実測し、運用指標として残す(目的化はしない)。

### §3.5 repo access の有無で形を変える(R15)

| | repo access **あり** | repo access **なし** |
|---|---|---|
| L0 CORE | **path + 読み順のみ**(本文を載せない) | **本文を inline** |
| L1 SELECTED | owner path + section marker + trigger | **本文を inline** |
| L3 INDEX | 全件(短形) | 全件(短形) |
| provenance | HEAD + GEN | HEAD + GEN + 生成時刻 + missing count |
| 見積 | **~10 KiB** `[inferred]` | §3.2 + 選択分 |

repo access ありの actor に本文を inline するのは、**hook 注入と mandatory read の二重払い
(S008 が実測した +33%)と同型の欠陥**である。同じ間違いを export 面で繰り返さない。

### §3.6 context brief と delegation packet の責務境界(Human 指示 §15)

| | context brief | delegation packet |
|---|---|---|
| 答える問い | **何が真であるか** | **何をするか** |
| 中身 | current project truth · 該当 ruling · constraint · owner provenance · GEN | question · scope · acceptance · prohibited assumptions · output contract · STOP_IF |
| 寿命 | HEAD/GEN に紐づく | 1 dispatch |
| 重複規律 | — | **brief が持つ ruling は ID 参照で引く。逐語再記は禁止** |

**例外は 1 つだけ:** rule 22 §Delegation packet と template 契約 2 が
「critical stop conditions は逐語継承、AI 要約禁止」と定める。したがって
**`STOP_IF` に入る critical stop condition のみ逐語重複が許される**(`MUST_DUPLICATE`)。
それ以外の重複は `CITABLE` であり、削減対象。**その byte 量は L4 レーンが実測中。**

### §3.7 brief は authority にならない(R14)

出力先頭に固定文を置く:

> この brief は repository owner から生成された**派生物**であり、current authority ではない。
> repository の owner file と矛盾した場合は **repository 側が正しい**。
> 本 brief に載っていない truth が存在する — INDEX 節が全 item の ID を持つ。

---

## §4. baton 25 — read allowance 導出(測定・提案のみ)

### §4.1 🔴 current truth の反証 — 2 レーンが独立に一致

`16.md:97`(baton 25)と `16.md:206`(§3 裁定)は次を current truth として持つ:

> `READ_ALLOWANCE = 48,000` が **どの model / context size / operating margin から導出された値なのか、
> この project 固有の記録は存在しない**

**これは事実として誤りである。** 導出は `scripts/read-load.sh:56-79` に実在し、`git blame` が
bootstrap commit `2a18176c`(このファイルに触れた唯一の commit)を指す:

```
200,000 − 31,200 (system/tool) − 579 (MEMORY) = 168,221
READ_ALLOWANCE 48,000 = 168,221 − 120,000 (session の実作業予約)
READ_REVIEW    68,000 = 168,221 − 100,000
```

さらに `sessions/S004_…md:56-64` は**同じ段落の中で**「記録は無い」と書き、その 5 行後に同じ導出式を
書いている(内部矛盾)。

**実際に欠けているのは導出ではなく、その入力の現行再検証である。**
`[inferred]` baton 25 が本来言うべきだったのは
**「継承した導出が、現行 conductor と現行 policy 入力に対して検証されていない」**。

🔴 **裁定の結論は無傷、根拠だけが崩れた** — baton 38 と同型。**再裁定の要否は Human のものである。**

### §4.2 導出モデル(`03_…md` C3 が owner)

```
U = M − I + H                                # 実効 unconditional payload
A_candidate = max(0, C − P − W − G − O − S)  # 提案 allowance
```

| 記号 | 意味 | 取得可能性 | 実測 |
|---|---|---|---|
| `M` | roster 実測 | **MEASURABLE** | 62,570 est tok |
| `I` | hook が置換する roster 本文(handover + bug index) | **MEASURABLE** | 25,502 est tok |
| `H` | hook `additionalContext` 実測 | **MEASURABLE** | 26,230 est tok(70,186 B) |
| **`U`** | **実効 payload** | — | **63,298 est tok** |
| `C` | conductor の実効 context window | **NOT OBTAINABLE HERE** — provider / Human | — |
| `P` | system prompt + tool schema + memory | **NOT OBTAINABLE HERE** — Claude Code / provider | — |
| `W` | session の実作業余裕 | **HUMAN-DECLARED** | — |
| `G` | delegation packet + capsule 往復 | **NOT OBTAINABLE HERE** | — |
| `O` | 出力予約 | **HUMAN-DECLARED** | — |
| `S` | 安全余裕(estimator 誤差 · compaction · roster 変動) | **HUMAN-DECLARED** | — |

**採用可能な数値は本 objective からは出ない。**計算可能な条件は
`C − P − W − G − O − S ≥ 63,298 est tok` のみ。
**`READ_ALLOWANCE` / `READ_REVIEW` は変更していない。**

副次実測: `read-load.sh` は **728 est tok 過小報告**している(hook wrapper + conditional manifest が
roster 本文の推定に含まれない)。PT-10 系の再演を避けるため記録する。severity 🟢 — 62,570 に対し 1.2%。

---

## §5. baton 43 — Opus 5 effort mismatch(測定・提案のみ)

| 項目 | 内容 |
|---|---|
| **実効値** | **`medium`** — assistant records **2,095/2,095**、unique requestId **1,020/1,020**、8 session files。model は全件 `claude-opus-5` |
| **機構** | `modelSettings` は **canonical 名 keyed**。`[1m]` は比較前に除去(`y(e){return e.replace(/\[1m\]$/i,"")}`、`Ue(e,t)` が case-insensitive 比較)。同一 settings layer では **per-model 値が top-level に優先**。Claude Code 2.1.246 の実バイナリから抽出 |
| **原因** | `model: "opus[1m]"` → canonical `claude-opus-5` → `modelSettings["claude-opus-5"].effortLevel = "medium"` が top-level `xhigh` を上書き。`[inferred]`(実装 + catalog + transcript 100% 一致。反例なし) |
| **Human が変える箇所** | `~/.claude/settings.json` の `modelSettings["claude-opus-5"].effortLevel` を `"medium"` → `"xhigh"`。**それ 1 箇所のみ。**`model` と top-level `effortLevel` は触らない |
| **影響** | model と 1M variant は不変。effort だけ移動。catalog の effort cost index は `medium 0.76` → `xhigh 1.6`(約 2.11 倍)。`[inferred]` reasoning・latency・cost は上方向。**実際の latency / token / 課金の変化量は `NOT OBTAINED`** — index から推定してはならない |
| **rollback** | 同じ値を `"xhigh"` → `"medium"` へ戻し、**新規 session で transcript を再測定**。JSON を戻しただけでは rollback 未確認 |

🔴 **本セッションを含む S000–S009 の全作業が `medium` で行われている。** これは過去の全 finding の
生成条件であり、Human の判断材料として明記する。**設定は変更していない。**

---

## §6. `BRIEF_MAX_BYTES = 128 KiB` の扱い(proposal のみ)

実測: **102,629 B = 78.30%**、headroom **28,443 B**。

| 選択肢 | 評価 |
|---|---|
| **① 維持**(推奨) | task-scoped brief が成立しても **fallback が full brief を出す**ため、cap は依然 full 経路の防護柵として要る。128 KiB は「最後の一回」として既に裁定済み |
| ② 引き下げ | full fallback が cap に当たって **出力不能**になる。fallback は安全側の既定値なので、それを塞ぐのは危険 |
| ③ 別 threshold 設計 | route 別 soft budget(例: `HARNESS` route は 40 KiB 目安)を **signal として**持つ。**gate にはしない** — 導出のない threshold を correctness gate にするのは PT-10 の形 |

**推奨: ① 維持 + ③ の signal を追加。**変更は行っていない。Human 裁定事項。

---

## §7. まだ無いもの(正直な欠落)

| 欠落 | 状態 |
|---|---|
| 複数 Objective fixture による reconstruction 実測 | **未実施** — 第二波で実施予定 |
| negative control(ruling 削除 / wrong owner / no owner / stale GEN / broken pointer / 誤分類) | **未実施** — 同上 |
| before/after の実 bytes・tokens・completeness・wrong-owner rate・fallback rate | **未実施** — 同上 |
| L0 CORE / L3 INDEX の実 byte(現在は `[inferred]` 見積) | **未実測** |
| ALWAYS 12 件集合の独立再分類 | **L4 レーンへ委譲中** |
| brief↔packet の `CITABLE` byte 量 | **L4 レーンへ委譲中** |
| 本統合結論そのものへの FALSIFICATION | **未実施 — Human へ出す前に必須** |

**この節を消して報告してはならない。**

---

## §8. Human 裁定が要る点

| # | 論点 | 本文書の立場 |
|---|---|---|
| 1 | baton 25 / §3 裁定の**根拠が反証された**。維持(根拠差し替え)/ 再検討 / 維持+限界明記 のどれか | 裁定は Human のもの。harness は覆さない |
| 2 | `READ_ALLOWANCE` 導出の Human 入力(`W` / `O` / `S`)と roster 宣言 | 提案のみ。値は未変更 |
| 3 | `modelSettings["claude-opus-5"].effortLevel` を `xhigh` へ変えるか | 提示のみ。AI は変更しない |
| 4 | 128 KiB の扱い(① 維持推奨) | proposal のみ |
| 5 | task-scoped brief を**実装してよいか**(本 objective は設計・検証まで) | 実装 GO は含まれていない |
| 6 | 安全性の主張強度を **「review 付き risk reduction」**へ弱めることの受理 | §1 の破断がその理由 |
