# 09 — Handover / Context-Brief / Read-Load Architecture Maintenance(完了)

**Objective:** current truth を失わず、cold start の復元性能を維持したまま、owner と read path を topic 単位で再構成する。
**Session:** S008(2026-08-27)· **Human 受理:** 2026-08-27
**Evidence owner:** `local/investigations/2026-08-27_handover-architecture/`(5 ファイル)
**種別:** Harness Maintenance Objective(製品設計ではない)

---

## 何を達成したか

1. **SessionStart hook の silent clip を除去した。** hook は handover を 279 行中 200 行で切りながら「Treat it as read」と指示しており、落ちていた範囲に **`Opus 5 solo 禁止`**・S007 裁定全体・template feedback queue・§5 baseline が含まれていた。全量注入へ変更し、**B69**(bytes を behaviourally 検査、settings 登録も検査)で守った。
2. **read-load の二重配送を除去した。** hook 注入と `CLAUDE.md` §0 の mandatory disk read が同じファイルを二重に払わせており、計器は 1 回しか計上していなかった。契約を「注入が読了を満たす」に改め、GEN を順序の根拠とした。
3. **条件付きにできる部分だけを owner 分離した。** router(`16.md`)+ `batons.md` + `evidence-map.md` の 3 owner。**無条件 topic の分割は純損である**ことを Lane B が実測で示したため、rulings は分割していない。
4. **baton の conditional 化は router 側の semantic stub を条件に成立させた。** Lane C の実測(0 / 31 / 14)に基づく。
5. **分割が生む新しい failure mode に検出器を付けた。** B70(owner 間 GEN・到達性)· B71(stub↔本文)· B51 拡張(移設 ≠ 損失、stub 残存下の本文削除 = 損失)· handover-diff の owner-set union 走査。
6. **Human 裁定 3 件(target user / 「簡単」の意味 / 小中高の位置付け)を無条件 owner へ永続化した。**

## 何を達成しなかったか(意図的)

- **context brief は縮まなかった。** brief の任務は完全性であり、topic split では解けない。恒久解は別 objective(`Task-Scoped Context Brief / Read Architecture Maintenance`)。
- **owner duplication の全面 dedup は未実施。** 矛盾していた 3 件のみ解消(Lane A 実測: DUPLICATE 32/115 · SPLIT 10/115)。
- **allowance 導出(baton 25 選択肢②)· effort mismatch(baton 43)は未着手。** いずれも次 objective へ持ち越し、Human 裁定で維持。
- **checker blind spot 3 件は未修正**(B70 の部分文字列照合 · B71 の意味不感 · `mode none` owner の部分欠落)。baton 54 に mutation 実証つきで記録。

## Acceptance(Human 指示 §23、20 項目)

✅ 17 / ⚠️ 2(owner duplication は部分的 · selftest は bridge 適用前に B21 が赤だった)/ ❌ 0(bridge 適用後にすべて green)

## 実測(投入前 → close 時)

数値の owner は `investigations/2026-08-27_handover-architecture/` と各 script。ここには結論のみ記す。

- 実 cold-start コスト: **大幅減**(hook 二重配送の除去が主因、conditional 化が従)
- 独立復元テスト: **17/17 recovered / MISSES 0 / WRONG-OWNER 0**
- negative control: **6/6 検出**(ただし単一 checker では 6/6 に届かない ― baton 54)
- 統合反証(feedback #7 の初の自己適用): 指摘 7 件 + 盲点 4 件 → **全件対応または記録**
- production / donor / template 変更: **0**

## 生まれた current truth

- 新 owner 2 本(`batons.md` · `evidence-map.md`)と、その契約(baton 53)
- baton 54(検出の非一様性、mutation 実証つき)· baton 55(B54 の走査範囲の穴)
- case **DT-8**(parent 手元作業の 5 欠陥、うち 4 件が検査器の中)
- 裁定: 128 KiB bridge · task-scoped export 禁止 · allowance/threshold 凍結 · baton 43 維持 · **Adaptive fan-out**(次 objective から)
- Template feedback #9〜#12(Human 承認済み)
