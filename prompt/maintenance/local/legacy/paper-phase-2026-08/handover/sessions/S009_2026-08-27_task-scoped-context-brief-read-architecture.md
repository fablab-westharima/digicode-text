# S009 (2026-08-27) — Task-Scoped Context Brief / Read Architecture Maintenance:削減効果は route 設計依存で未確定、意味的完全性は機械保証できない。統合が 12 件誤り、独立レーンだけが捕まえた。Opus 5 の effort 運用が Human により訂正 / commit 1 本 / test 増減なし(アプリコード無し)/ 新規 case 2(DT-9, DT-10)

**作成者: Claude Code (Opus 5, effective effort `medium` — Human 運用方針として正常状態)**

## §0. 目的の問い直し

全作業目的(16.md §0)は **digicode-text を、DigiCode を donor として選択移植しながら開発すること**である。
本セッションは製品を 1 行も進めていない。前進させたのは **その手前の条件** — repo access を持たない actor
へ current truth を渡す構造が、次の製品設計(情報量が大きい)に耐えるかどうかである。

**答えは「耐えるとは言えないが、その理由は当初の想定と違った」**だった。
Human は menu を「1. harness → 2. 製品設計」の順にしていたが、その根拠(製品設計で再び context delivery
問題が起きる)は **実測に対して未確定**であり、しかも **task-scoping で解けるかどうかも未確定**である。
Human はこれを受理し、**harness maintenance をここで一区切りとし、次を製品設計へ戻す**と裁定した。

## §1. 実施内容

**Route A / `PRIMARY_MODEL_MODE: T1-conserve` / `SESSION_ROLE: PRIMARY` / Adaptive fan-out 三波。**

1. **cold start**(rule 13)— HEAD `139c202` / clean / origin 同期 0-0。baseline · selftest 78/78 ·
   read-load 62,570 tok(130%)· context-brief 102,629 B · handover-diff RC0 · placement-scan RC0 を実測。
   `codex mcp-server` 接続確認、delegate の実 model を **rollout journal から** `gpt-5.6-sol` と確認
   (自己申告ではない — rule 22 pre-flight 6)。
2. **Human GO 取得済みで開始**(指示書末尾の HUMAN GO)。plan を `plans/active/10_…md` として登録。
3. **第一波 3 lane**(異なる証拠経路)— L1 architecture inventory / L2 failure-mode FALSIFICATION /
   L3 allowance + effort。
4. **bounded review** → **第二波 2 lane**(第一波が残した gap にだけ)— L4 は L1 が `NOT OBTAINED` にした
   packet 重複を Codex rollout journal から測り、あわせて L2/L3 の主張 2 件を独立再検証。
   L5 は measurement-only prototype を作り 6 fixture 復元 + 8 negative control。
5. **統合 v1 `05_…md` → 実測により v2 `07_…md` へ訂正**(L3 INDEX の見積が 3.5 倍外れ、size 主張が反転)。
6. **第三波 1 lane — 統合結論そのものへの FALSIFICATION**(L6)。**91 claim を全件追跡**され、
   `CONTRADICTED 6 / UNSUPPORTED 6 / OVERSTATED 20`、判定は **「Human へそのまま出すのは不安全」**。
   → **訂正版 `09_…md` を作成**し、`07` は攻撃対象として保存(読解順序 `08` → `09` を owner に明記)。
7. **Human へ報告 → Human が Opus 5 effort 運用を訂正**(「実効 medium は不整合」という 4 セッション分の
   前提そのものが誤り)。**medium 固定は意図した設定**。
8. **第四波 1 lane**(Human 指示 §13「Codex 1 lane 程度で十分」)— top-level `xhigh` の provenance。
   結論 **`SETTING ORIGIN NOT OBTAINED`**、ただし **`claude-fable-5` だけが top-level を参照している**
   ことを実測(削除は inert ではない)。
9. **Human GO(正式 close + commit/push)受領 → close protocol 実行。**

**codex tool calls = 7 / subagent spawns = 0。**

## §2. 状態変化

### 実測された主要事実(一次証拠は `investigations/2026-08-27_task-scoped-brief/`)

| # | 事実 |
|---|---|
| 1 | **削減効果は route 依存**: Harness **−35.39%** / 製品 3 route **各 −5.16%** / fallback 2 件 **+13.7%**。ただし −5.16% は **probe の手書き route table に条件づけられており**、既存 artifact 上で **−13.88%〜−20.38%** に動く |
| 2 | **意味的完全性は機械保証できない**: baton 54 の precedent がそのまま着地。**ID の存在は禁止の存在を保証しない** |
| 3 | **可視化は narrow に成立**: 凍結 expected **301/301 可視(absent 0)**、negative control **8/8 RED**、positive **1/1 GREEN**。ただし固定 96-ID catalog と注入 8 shape のみ |
| 4 | **96 item catalog は current truth の補集合ではない**: `evidence-map.md` の事実は scanned denominator = 0 |
| 5 | **現行 brief は GEN を 1 つも載せていない**(`grep -Fc 'GEN:'` = 0) |
| 6 | **brief↔packet 重複**: `CITABLE` **6,879 B = packet の 23.77%**(物理行単位の gross upper bound) |
| 7 | 🔴 **baton 25 / §3:206 の「導出記録が存在しない」は事実として誤り** — 導出は `scripts/read-load.sh:56-79` に bootstrap commit `2a18176c` から実在。`S004_…md:57-62` は同じ passage で自己矛盾。**欠けているのは導出ではなく入力の現行再検証** |
| 8 | 🔴 **baton 43 は mismatch ではなかった** — Opus 5 の `medium` は Human の意図した運用。機構は実バイナリから確定(`modelSettings` は canonical 名 keyed · `[1m]` は比較前に除去 · per-model が top-level に優先) |
| 9 | top-level `xhigh` の出所 = **`SETTING ORIGIN NOT OBTAINED`**。`claude-fable-5` のみが参照しており **削除は inert ではない** |

### rule / case

- **新規 case 2 件**(いずれも本セッション内で完結):
  - **DT-9** — 統合が再び自分の evidence を超えた(91 claim 中 12 件が evidence に反する/根拠なし、20 件が
    分母超えの一般化)。**自己点検の検出 0 件**、捕まえたのは dispatch された独立レーンのみ。**DT-6 の 2 度目**。
    同時に、**parent が書いた 3 packet の critical stop 逐語継承が 5/5 不履行**。
  - **DT-10** — 2 つの設定値が食い違っていたので「不整合」と呼び、**4 セッション追いかけたが、
    所有者に「意図的ですか」と訊いた者が 1 人もいなかった**。分母を 47 → 2,095 records まで広げたが、
    広げたのは「実効値は medium か」であって「medium は誤りか」については **n=0** のままだった。
- **新規 rule: なし。**(Human 指示 §5/§7 により harness 機構の追加は禁止)

### handover

- **新規 ruling 7 件**(§3、2026-08-27 S009 セクション): Opus 5 medium 固定 / top-level 非削除 /
  Codex effort routing との分離 / harness 非連鎖 / Adaptive fan-out の速度標準 / S009 成果の受理 /
  top-level 現状維持と origin 調査終了。
- **既存 ruling 2 件を訂正**: §3 の allowance 裁定(根拠が反証されたことを追記、**裁定は維持**)·
  §3 の baton 43 裁定(**supersede** され、「Human GO なしで effort を変更しない」だけ存続)。
- **新規 baton 1 件**: **56**(S009 probe は production 実装ではない — batons 24/26 と同じ扱い)。
- **既存 baton 2 件を再評価**: **25**(誤った根拠を訂正、禁止は維持)· **43**(🟡 mismatch → 🟢 正常状態、
  trigger を「毎 preflight」から「top-level を触るとき」へ変更)。
- **`handover-diff` の GONE 4 件はすべて baton 25 / 43 の stub と body の書き換え**であり、
  4 件とも両 owner に存在することを `grep -c` で確認済み(**loss は 0**)。分類は **done — 本 commit で
  Human 裁定に従って書き直した**。
- **Template feedback +3(#13/#14/#15、いずれも Human 未承認として記録のみ)**。

### production

**変更 0。**`scripts/` · `.claude/` · `CLAUDE.md` · threshold · cap · effort setting · `Project_Template`
本体 · donor のいずれも未変更(`git diff --name-only` で確認)。
**`~/.claude/settings.json` は 1 バイトも変更していない**(mtime `2026-08-26T02:40:53+0900` のまま)。

## §3. 自己評価

- ✅ **Healthy signs**:
  - cold-start protocol 遵守。baseline を **全行実測**(transcribe 0)。
  - **current truth の誤りを独立発見**(baton 25 の根拠)し、**裁定を覆さずに Human へ返した**。
  - **統合を Human へ出す前に独立レーンへ攻撃させ、12 件の訂正を受け入れた**(feedback #7 の 2 度目の自己適用)。
  - Adaptive fan-out を**三波**で運用 — 第二波は gap にだけ、第三波は統合が出そろってからだけ。
    固定 fan-out なら L4 の反証も L6 の攻撃も成立しなかった。
  - `EXCEPTION_TRIGGER` 0 / `SHADOW_EXECUTION` 0 / mode-boundary 違反 0 / requested≠observed model 0。
  - Human の訂正を受けて **自分の 4 セッション分の前提を撤回し、case として起票した**。

- ⚠️ **Warning signs** — **すべて処理済み。prose のまま残していない**:
  1. **統合が 12 件誤った** → **case DT-9 起票** + 訂正版 `09_…md` 作成 + 読解順序を owner に明記。
  2. **packet の逐語継承 5/5 不履行** → **case DT-9 に併記** + **Template feedback #14 として記録**
     (本 repo で guard を作ることは Human 指示 §5 が禁止)。
  3. **「実効 medium = 不整合」という 4 セッション分の誤った前提** → **case DT-10 起票** +
     baton 43 / §3 裁定を訂正。
  4. **L3 INDEX の見積を 3.5 倍外した**(測る前に見積を書き、それを設計根拠に使った)→
     **DT-9 の防御 3 に含めた**(測っていない命題の確信を、測っている命題の分母で上げない)。
  5. **`context-brief.sh` の fail-open 面 3 件** → **DT-10 に従い「defect」と断定せず、
     「所有者未確認の観測」として Template feedback #15 に記録**(所有者は template 側)。**acknowledged, not acting** —
     Human 指示 §5 が本 repo での追加 checker hardening を禁じているため。
  6. **read-load 136% / brief 86.3%** → **acknowledged, not acting**。閾値は Human GO-gated(baton 25 / 52)、
     かつ Human 指示 §7 がこれを理由とした次 Objective の提案を禁じている。**閾値に触れたら STOP して問う。**
  7. **`09_…md` 自身への再 FALSIFICATION は未実施** → **acknowledged, not acting**(Human 指示 §5 が
     追加 FALSIFICATION を明示的に禁止)。**S009 の結論は「独立反証を 1 回通した統合」であって、
     二重に通したものではない**と正確に記録する。
