# S008 — Handover / Context-Brief / Read-Load Architecture Maintenance(2026-08-27)

**種別:** Harness Maintenance Objective · **Human 受理:** 2026-08-27 · **Conductor:** Claude Code (Opus 5, effective effort `medium` 実測)
**Route:** A / `PRIMARY_MODEL_MODE: T1-conserve` / `SESSION_ROLE: PRIMARY` / delegate = `SIX-LANE-DELEGATE`(codex, `gpt-5.6-sol`)
**Evidence owner:** `local/investigations/2026-08-27_handover-architecture/`(5 ファイル)

> **これは historical evidence であり、current authority ではない。**現在成立している事実は `16.md` と
> `batons.md` / `evidence-map.md` が owner。ここに書いてあることが現在と食い違う場合、正しいのは owner 側である。

---

## §0. 目的の再検討

投入時の前提は「`16.md` が肥大化したので topic 分割する」だった。**Human 指示は明確に「16.md を短くすることが目的ではない」
と述べており、真の目的を「次セッションが必要な current truth を、過不足なく、低い read cost で、誤った owner を読まずに
復元できる構造」と定義していた。**この定義に忠実に測った結果、投入時の前提は 2 回否定された。

1. **無条件 topic の単純分割はコスト増だった**(Lane B の算術反証)。得になるのは条件付きにできる topic を切り出すときだけ。
2. **より大きな問題は分割ではなく既存の 2 欠陥だった** — hook の silent clip と、read-load の二重配送未計上。

目的そのものは変更していない。**手段が測定で置き換わった。**

## §1. やったこと

### 委譲(5 レーン、codex tool calls = 5)

| Lane | 種別 | 目的 | 結果 |
|---|---|---|---|
| A | `INVESTIGATION` | current truth inventory / owner 分析 | PASS(115 項目・279/279 行を完全被覆) |
| B | `FALSIFICATION` | topic split への最大強度の反証 | ESCALATE — **素朴な 4-owner 分割を反証** |
| C | `VERIFICATION` | baton↔ruling 依存の実測(A/B の不一致を解決) | ESCALATE — **第三の答え**(0 / 31 / 14) |
| D | `VERIFICATION` | 独立 cold-start 復元 + negative control | PASS(17/17・MISSES 0・6/6 検出) |
| E | `FALSIFICATION` | **統合への反証**(feedback #7 の初の自己適用) | ESCALATE — **不適合判定**、指摘 7 件 + 盲点 4 件 |

**Lane A と Lane B が §2 batons の読解クラスで正反対の結論を出した。** rule 22 §Disagreement に従い多数決を避け、
両レーンの報告書を OFF LIMITS にした Lane C を dispatch して 45 baton × 39 ruling の依存を 1 件ずつ測定させた。
**答えはどちらのレーンでもなく第三の答えで、それが設計原則を決めた** —
**「移動できるのは詳細と根拠であり、禁止・限定・順序は router に 1 行 stub として残す」**。

### 実装

- **hook**: 200 行 clip を撤廃し全量注入。conditional owner の manifest(path のみ)を注入。
- **owner 分離**: `batons.md`(baton 本文)· `evidence-map.md`(evidence / provenance / loop / feedback queue)。移設は逐語。
- **検査器**: **B69**(hook 全量注入 + settings 登録)· **B70**(owner 間 GEN・到達性)· **B71**(stub↔本文)を新設、
  すべて negative control 付き。**B51** に owner-set control を追加。
- **`handover-diff.sh`**: owner set の union 走査へ拡張。**cell 分割を unescaped pipe のみに修正**(baton 4 が `\|` を含む)。
- **`context-brief.sh`**: owner set 全体を export、stub と本文の重複を排除。**cap を 96 KiB → 128 KiB(Human GO、bridge)**。
- **契約文書**: `CLAUDE.md` §0/§2 · `close.md` · `local/README.md` · `maintenance_index.md`。

## §2. state changes

- **新 owner 2 本**と、その契約(**baton 53**)。read class の owner は `CLAUDE.md` §0。
- **新規 baton 3 本**: 53(owner set 契約)· **54**(検出の非一様性 — 7 mutation の実証つき)· **55**(B54 の走査範囲の穴)。
- **既存 baton 更新**: 25(選択肢①実施・②持ち越し)· 43(未解決維持、設定変更しない)· 52(128 KiB bridge)。
- **baton 43 の自己矛盾を解消**: `未verify` と `CONFIRMED` が同一 owner 内で分裂していた(Lane A 発見)。本セッション再実測で CONFIRMED に統一。
- **新規 case: DT-8。** parent の手元作業から 5 欠陥、うち 4 件が *自分が書いていた検査器の中*。DT-7 の直接の再演。
- **新規 ruling 9 件**(§3): target user 定義 · 「簡単」の意味 · 小中高の位置付け · 128 KiB bridge · task-scoped export の恒久解を別 objective へ ·
  その場実装の禁止 · allowance/threshold 凍結 · baton 43 維持 · **Adaptive fan-out**(次 objective から適用)。
- **Template feedback**: #7/#8 に加え **#9〜#12 を Human 承認**(hook clipping · read-load 二重配送 · handover-diff の実装ギャップ · rule 13 との衝突)。queue は 12 件全件現存。
- **menu を 2 本立てに更新**(種別を分離): `Task-Scoped Context Brief / Read Architecture Maintenance`(harness)· `Managed Environment & Device Knowledge Architecture Design`(製品設計)。Human の現時点の第一候補は前者。
- **新規 local rule: なし。** DT-8 の構造化は既に template feedback #8 が担っており、二重に作らない。

## §3. 自己評価

### ✅ Healthy

- **投入時の前提が実測で 2 回否定され、そのたびに設計を変えた。**「分割する」という指示語に引きずられず、
  Lane B の算術反証と Lane C の依存測定で手段を置き換えた。
- **lane 間の不一致を多数決で潰さず、測定で解決した。**結果はどちらのレーンでもない第三の答えだった。
- **最も重い欠陥(hook clip)は 3 系統が独立に発見**し、うち 1 つは parent の bounded review だった。
- **統合を Human へ出す前に反証レーンへ通した**(feedback #7 の初の自己適用)。**それが機能した** — 自己点検 0 件に対し
  レーンが 7 件 + 盲点 4 件。**S007 と同じ結論が再現した:認知的な defense は捕まえず、dispatch された独立レーンだけが防御だった。**
- **current truth を 1 文字も削らずに実コストを下げた。**削減の主因は二重配送の除去であり、内容の削除ではない。

### ⚠️ Warning(すべて処理済み — prose のまま残さない)

| Warning | 処理 |
|---|---|
| parent の手元作業から 5 欠陥、うち 4 件が自作の検査器の中 | **(b) case 起票 — DT-8** |
| Lane E の測定中にツリーを編集し続けた(PT-36 型)。しかも DT-8 に「反証中は凍結する」と書いた直後 | **(b) case DT-8 の防御 6 として記載** |
| Lane E の**未完成の下書き**を読み、誤った判定値を Human へ報告した | **(b) DT-8 の retroactive application に記載 + 報告済みの訂正を実施** |
| 検出器は 6/6 を捕まえたが、単独機構では捕まえられない | **(a) baton 54** |
| `CLAUDE.md` の pointer-only 規律に走査範囲の穴(B54 は §2/§3 のみ) | **(a) baton 55** |
| checker blind spot 3 件が未修正(B70 部分文字列 · B71 意味不感 · `mode none` 部分欠落) | **(a) baton 54 に mutation 実証つきで記録** |
| owner duplication の全面 dedup 未実施(DUPLICATE 32/115 · SPLIT 10/115) | **(c) acknowledged, not acting** — 矛盾を起こしていた 3 件のみ解消した。残りは矛盾を生じておらず、本 objective の acceptance を塞がない(rule 24: 重大度ではなく acceptance で判断) |
| context brief が縮まず、bridge として cap を上げることになった | **(a) baton 52 + §3 裁定** — 恒久解は menu の別 objective |

### 測っていないもの

hardware write 0 · production 接触 0 · competitor 実利用 0 · 実機 flash 0 · donor 変更 0 · `Project_Template` 変更 0。
**本セッションは harness のみを測った。製品については何も測っていない。**
