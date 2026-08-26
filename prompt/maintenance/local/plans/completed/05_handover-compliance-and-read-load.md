# 05_handover-compliance-and-read-load — 現行 handover 体制への準拠監査と read-load WARNING の解消

<!-- 配置: local/plans/active/ (rule 15 / local/README.md §plans)。完走したら plans/completed/ へ移動。
     これは harness maintenance であって製品実装ではない。 -->

| 項目 | 内容 |
|---|---|
| 起案日 | 2026-08-26 |
| 起案契機 | 2026-08-26 Human 裁定 + HUMAN GO「PRIMARY_OBJECTIVE = Current Handover Architecture Compliance & Read-load Maintenance」 |
| 起案者 | Claude Code (Opus 5) |
| ステータス | 🎉 成功条件 12/12(うち 1 件は「WARNING 解消 **または** 正当な allowance 再設定」を**どちらも取らない**判定で満たす — §3 参照)。**Human 報告済み** |
| 先行依存 | S003 close(`0f14f03`)で `BUDGET_STATUS` が初めて OK を離脱 |
| 後継計画 | なし。次 objective は Human が指定 |

## ⚡ 30秒で把握

**現行の handover / cold-start / authority 管理体制を正本とし**、その設計に則って
read-load WARNING の原因を **監査で特定**し、**current truth と evidence を一切失わずに**是正する。

**やらないこと**(裁定 §12): 新規製品調査 · Enterprise policy · Local Network Access 追加調査 ·
Helper 正式採否 · Desktop / Text Compiler / Storage / AI edit architecture · Board pack 設計 ·
production implementation。**旧 handover 方式への回帰 · 独自 handover architecture の新設 ·
役割の再発明も禁止**(裁定 前文)。

## 1. 監査の順序(裁定 §1 / §2 が指定)

1. **先に現行ルールを読み直す** — `global/rules/README.md` §Single source of truth /
   `local/README.md` §handover・§OPTIONAL CAPABILITY / `CLAUDE.md` §0 / `scripts/read-load.sh` header /
   `local/docs/routing-profile.md`
2. **「正常成長か、役割逸脱か」を先に判定する** — 分割・新設・allowance 変更を最初から前提にしない
3. 増加源を **token / section 単位で定量化**(裁定 §8)
4. 現行ルールが許す **最小限の是正**のみ(裁定 §5)
5. allowance 変更は **最後の選択肢**(裁定 §10)

## 2. 成功条件(裁定 §14 の 12 項目)

1. 現行 handover / cold-start 管理ルールを正本として作業
2. read-load 増加原因を定量化
3. 管理体制から逸脱した重複があれば是正
4. current truth を失わない
5. Human 裁定を失わない
6. investigation / session / plan / baton の owner 境界を維持
7. mandatory read と optional evidence の境界を明確化
8. 二重正本を作らない
9. current session 復元性を維持または改善
10. read-load WARNING を解消、または正当な allowance 再設定
11. 全 gate green
12. 次 session が追加説明なしで正しい現在地を復元可能

## 3. 検証の型(rule 04)

| 型 | 適用範囲 |
|---|---|
| **real-fire** | `read-load.sh` の実測(前後)· section 別 char 数の git 履歴からの実測 · **cold-start restoration test**(mandatory set だけを読んで 24 項目が復元できるかを機械検査)· pointer 整合性 · duplicate truth 検査 · 全 gate |
| **primary source** | 現行 rule 本文 · `read-load.sh` header の allowance 導出 · `routing-profile.md` の roster 宣言状態 · template との `diff` |
| **NOT OBTAINED** | 推測で埋めない。特に **roster の最小 context window は宣言されていない**ので、それに依存する再校正は行わない |

**絶対条件**: 削除は「owner が別に実在する」ことを **grep で先に示してから**行う。
「軽くなったが次 session が現在地を復元できない」は **FAIL**(裁定 §7)。
