# S004 (2026-08-26) — handover 準拠監査 + read-load maintenance。commit 1本。test 増減なし(製品コード未着手)。**新規 rule/case なし**(DT-2 に同日再発の追記のみ)

<!-- 配置: local/handover/sessions/S{NNN}_{YYYY-MM-DD}_{slug}.md。close 後は不変。 -->

**作成者: Claude Code (Opus 5)**

## §0. 目的の問い直し

全作業目的(16.md §0)は製品開発だが、**本セッションは製品を 1 行も進めていない**。
進めたのは **「次の cold start が現在地を正しく復元できる状態」** そのものである。

S003 close で `BUDGET_STATUS` が初めて OK を離脱した。Human の指示は
「read-load を下げろ」ではなく **「現行の handover / cold-start / authority 管理体制を正本として、
それが想定どおり運用されているかを先に監査しろ」** だった。この順序が本セッションの中身を決めている。

## §1. 実施内容

**① 先に現行ルールを読み直した**(裁定 §1)— `global/rules/README.md` §Single source of truth /
`local/README.md` §handover・§OPTIONAL CAPABILITY / `CLAUDE.md` §0 / `scripts/read-load.sh` header /
`local/docs/routing-profile.md`。**四分類(CURRENT STATE / ROUTING / HISTORICAL EVIDENCE /
SETTLED DECISION)と「a reference never restates the fact's content」が判定基準**になった。

**② 増加源を定量化した**(裁定 §8)— git から section 別 char 数を実測:

| section | S001 close | S002 close | S003 close | S002→S003 |
|---|---|---|---|---|
| §1 Current position | 6,778 | 9,966 | 10,379 | **+413** |
| §2 Batons | 7,543 | 11,055 | 13,204 | **+2,149** |
| §3 Settled decisions | 6,181 | 8,431 | 12,077 | **+3,646** |
| §5 Baseline | 3,833 | 4,238 | 4,315 | +77 |
| **TOTAL** | 26,775 | 36,350 | 42,743 | **+6,393** |

🔴 **増加の 91% は §3 裁定 + §2 open baton** — ルールが CURRENT STATE と定め、
`local/README.md` §handover が「長さを理由に削ってはいけないもの」に列挙している 2 クラスである。
**主因は「正常成長」だった。**

**③ それでも役割逸脱を探した**(裁定 §2)。見つかった:

- §1 の「Facts a cold start must not re-derive」ブロック(**4,689 char = 16.md の 10% / §1 の 45%**)。
  代表値 **13/13 が `investigations/` に所有**され、load-bearing な結論 **12/12 が §3 裁定に所有**
  されていた。**三重正本**であり、「a reference never restates the fact's content」違反。
- baton **15 / 18 / 21 / 25 / 28** が、それぞれ investigations / case DT-1 / §3 Boundary 節 /
  実測値 / §3 Desktop 裁定 の内容を再掲していた。**baton は「完了済みの経緯を永久保存する場所ではない」**(裁定 §4)。
- 自分が S003 close で §5 に書いた **実測値のプローズ記載**が
  「never write a measured count into prose, anywhere」(README 系 corollary 1)違反だった。

**④ 是正した** — いずれも **owner が別に実在することを grep で先に示してから**削除:

| 変更 | 前 | 後 |
|---|---|---|
| §1 実測リスト → **evidence-owner pointer 表** | 4,689 char | 表 4 行 + 型ラベルの所在 |
| baton 15/18/21/25/28 → **pointer + trigger** | 内容再掲 | owner を名指し、trigger のみ保持 |
| §5 → **command が owner の値をプローズから撤去** | 数値の直書き | 「green」+ コマンド名 |
| §1 の routing 重複(自分が新設したもの)を統合 | 2 ブロック | 1 ブロック |

**⑤ allowance を変更しなかった。その根拠**(裁定 §10)—
`scripts/read-load.sh` は **template のものと byte-identical(diff 0 行)** で、
**この repo に導出記録は 1 件も無い**。header 自身が
「a consumer's thresholds encode a consumer's context window and a consumer's roster, and copying them
would rebuild this same problem under a different constant」と定めている。
48,000 は `168,221 - 120,000` すなわち **「roster の最小 context window 200,000」からの導出**であり、
`local/docs/routing-profile.md` は **全 holder が UNDECLARED**(2026-08-25 裁定、意図的な absence of measurement)。
→ **roster を推定して再校正することは case PT-1 の形**であり、この project が既に禁じた動きである。
**したがって「WARNING を消すためだけの増額」にも「根拠ある再設定」にも到達できない。取らないことが正解。**

**⑥ 復元性を機械検査した**(裁定 §13)— mandatory set **だけ**を読み込み、
裁定 §16 の製品裁定 16 項目 + current state 8 項目を grep で復元判定 → **24/24 合格 / 0 FAIL**。

**route/mode/lane**: `PRIMARY_MODEL_MODE = T1-solo`(既定)、`SESSION_ROLE = PRIMARY`(既定)、
**delegation なし**。current-state owner の編集は parent 専任(rule 22)であり eligible task 0 件。

## §2. 状態変化

- **read-load**: **52,853 → 51,139 tok(-1,714)**。うち 16.md 単体は **18,138 → 16,821(-1,317)**
  で、**監査結果と Human 承認済み feedback queue を新たに載せながら**の減少である。
  **WARNING は解消していない**(106%)。理由は §1 ⑤。
- **16.md**: §1 実測リストを evidence-owner 表へ置換、baton 5 本を pointer 化、§5 を command-owned へ、
  §4 に **Human 承認済み template feedback queue(DT-1 / B57 / DT-2)** を明記、GEN を `S004-close` へ。
  **製品裁定(§3)は 1 文字も変更していない。** baton の削除は 0 件。
- **plan**: `05_handover-compliance-and-read-load.md` を起票し `completed/` へ(active 0 / completed 5)。
- **case**: **新規なし**。**DT-2 に同日再発の記録を追記**(下記 §3)。case index は **88 のまま**。
- **rule**: 新規なし。**`global/rules/` は 1 行も編集していない**(judgment-mistakes-history への case 追記を除く)。
- **CLAUDE.md**: 変更なし(S003 close の 2 節は裁定と整合しており、§2/§3 は pointer-only のまま)。
- **投資記録 / investigations / 過去 session file**: **一切変更していない**。

### 🔴 Template feedback visit へ共有する構造観察 2 件(本 repo は直さない — §3 が template 編集を禁止)

- **(a) threshold の import**: `read-load.sh` が **template の roster と context window から導出された定数**を
  そのまま consumer へ配っている一方、**header 自身がそれを禁じている**。
  consumer が自分で導出しない限り、**確立していない定数に対して WARNING を測り続ける**ことになる。
  `BUDGET_STATUS_BASIS=ADOPTED_PROVISIONAL review=2026-09-30` はその暫定性を記録する field として機能しているが、
  **「consumer 側で導出せよ」という手順がどこにも無い。**
- **(b) mandatory set の 2 大項目が template 所有**: `13-session-recovery.md` の **full read (8,375 tok)** と
  JMH **Part 1 の case index (8,685 tok の一部)**。後者は script header 自身が
  「the case index is 6.7% of the lines and **25.1% of the real cost**」と測っている。
  **consumer は common structure を壊さずにどちらも縮められない**(裁定 §11)。
  → consumer 側で削れる余地は構造上 16.md と CLAUDE.md しか無く、そこは current truth が占める。

## §3. 自己評価

**✅ Healthy signs**

- **削除の前に owner を示した** — 13/13 の代表値が `investigations/`、12/12 の結論が §3 にあることを
  grep で確認してから §1 を pointer 化した。「消してから探す」をしていない。
- **token 削減を目的にしなかった。** 削減が止まる点を「これ以上は current truth を削ることになる」で
  自分から宣言し、そこで止めた(裁定 §3)。
- **allowance を上げなかった。** 上げられる根拠が無いことを、routing profile と script header の
  一次情報で示した。**「解消できませんでした」ではなく「取ってはいけない手だと分かった」**である。
- **復元性を主張ではなく機械検査で示した**(24/24)。裁定 §7 の FAIL 条件
  (「軽くなったが次 session が現在地を分からない」)に対する直接の反証になっている。
- **新しい authority file を 1 つも作らなかった**(裁定 §6)。§4 の feedback queue は
  既存 §4 の loop position に載せ、自分の観察は session file 側へ移した。
- 製品 objective へ 1 歩も進んでいない(裁定 §12)。

**⚠️ Warning signs — 全件、処理を付けて閉じる**

1. **⚠️ read-load WARNING は解消していない(106%)。**
   → **(a) 16.md §2 の task 行で処理**。baton 25 が **trigger 発火済み**として、
   Human の 2 択(**① topic 分割の裁定 / ② roster 宣言による再校正**)と、その根拠(template 由来定数である事実)を保持している。
   **harness 単独ではどちらも取らない**と明記した。
2. **⚠️ DT-2 が同日に再発した。** pointer 整合性チェッカが base ディレクトリを取り違え、
   **すべて有効なポインタに対して「9 件未解決」と報告した**。正しい base で再実行すると **0 件**。
   → **(b) case への追記で処理**。新規 case は起票せず、**DT-2 本体に「同日再発」節**として記録した。
   これは DT-2 にとって最強の証拠である — **case を書いたことでは防げず、defense 5
   (「harness のバグでもこの結果は出るか?」)を実際に問うたことで防げた**。
   本 session ではその問いを 2 回発動し、2 回とも自分の器具が原因だった。
3. **⚠️ 監査対象が自分の直前の成果物だった。** S003 close を書いたのも、その重複を判定したのも同一 session である。
   → **(c) acknowledged, not acting**。理由: 判定基準を**自分の記憶ではなく現行 rule 本文と grep**
   に置き、削除の可否を「owner が実在するか」という**外部化された条件**にした。
   ただし **独立レビューの代替にはならない**ことは明記しておく。次 session が
   `handover-diff` と cold-start restoration test を再実行すれば検証できる形にはなっている。
4. **⚠️ mandatory set の 60% 超(25,719 tok)が template 所有で、この repo からは縮められない。**
   → **(a) §4 の feedback queue + 本 §2 (a)(b) で処理**。次の deployment visit の入力として登録済み。
