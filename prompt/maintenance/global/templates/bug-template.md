---
id: NNN
title: 簡潔な概要
category: ui | backend | build | security | dead-code | runtime | data | i18n | infra | other   # プロジェクトに合わせてカテゴリ集合を確定し、この行を更新する
severity: 🔴 critical | 🟠 high | 🟡 medium | 🟢 low
discovered: YYYY-MM-DD
discovered_by: Claude Code (<model>) | User
status: 🔍 発見 | 🔧 修正中 | 🛠 実装済み(人間検証待ち) | ✅ 修正済み
fixed: YYYY-MM-DD  # 修正済み時のみ
fixed_commit:      # 修正済み時のみ(short hash)
related_files:
  - path/to/file.ts:123
---

## 症状
(ユーザー視点 or ログで観測される現象。実害の大きさも記述)

## 再現手順
1. ...
2. ...

## 証拠
(grep 結果・エラーメッセージ・ファイル行番号等、客観的事実を列挙)

## 推定原因
(何が根本原因か、類似バグが他にないかの仮説。「同パターンの全滅」方針で考察 — 1件見つけたら同型を全codebase grep する。rule 01 参照)

## 対処案
(未修正時のみ。複数案あれば併記して trade-off 明記。実装は user GO 後 — rule 12 wait-for-go)

## 関連
- 発見経緯(どの audit / 作業で見つかったか)
- 類似バグ ID(あれば)
- 適用される rule / 教訓(`global/rules/common/` / `local/rules/` へのリンク)
- 参照 issue / PR / commit

---

## 修正記録(修正済み時のみ記入)

### 修正内容
(どう直したか、差分の要約)

### 検証
- [ ] 該当 audit / テストを再実行して 0 エラー確認
- [ ] 関連機能の動作確認
- [ ] regression が他に無いか確認
- [ ] 人間側の検証(実環境確認)が必要な場合、完了するまで status は「🛠 実装済み」のまま active に維持(close しない)

### コミット
`commit-hash` — commit message 先頭行
