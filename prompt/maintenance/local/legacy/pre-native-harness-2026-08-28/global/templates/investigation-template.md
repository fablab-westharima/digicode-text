# YYYY-MM-DD_<slug> — <調査タイトル>

<!-- 配置: local/investigations/YYYY-MM-DD_slug.md。監査・調査・分類レポートの記録。
     bug 起案 / plan 起案の evidence ベースとして参照される -->

| 項目 | 内容 |
|---|---|
| 実施日 | YYYY-MM-DD |
| 契機 | (何のための調査か — bug / plan / user指示へのリンク) |
| 手法 | (grep / 実測 / 外部リサーチ / programmatic classifier 等) |
| 結論(1行) | |

## 目的

(何を明らかにするための調査か)

## 手法と網羅性の担保

(どう調べたか。**手作業目視のみは不十分** — 候補の全件列挙は programmatic に行い、件数を `wc -l` 等で確定させる。「grep して上位N件を目視」で全体を語るのは判断ミスパターンC/D — judgment-mistakes-history 参照)

```
(実行したコマンド・classifier script をここに保存 — 次回の再監査で baseline として再利用する)
```

## 発見事項 (severity ラベル必須)

- 🔴 (release blocker 級)
- 🟡 (設計影響あり)
- 🟢 (情報として記録)

(flat な列挙は禁止 — 必ず severity を付ける)

## 結論と次アクション

(この調査から起案される bug / plan / rule。未確定のものは「[未verify]」と正直にラベルする — 検証せず信用で skip しない)

## 復活条件(deferred 判断の場合のみ)

<!-- 「今はやらない」と決めた調査は、いつ再検討するかを条件で明文化する (origin: ouen-plus)。
     条件なしの defer は永久に忘れられる -->

- 条件1: (例: 対象ライブラリが vN をリリースしたら)
- 条件2:

## 復活時の手順書(deferred 判断の場合のみ)

(復活条件を満たしたとき、当時の文脈を思い出さなくても着手できる移行手順をステップで残す)

1. ...
