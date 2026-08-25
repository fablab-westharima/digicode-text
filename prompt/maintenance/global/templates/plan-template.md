# NN_<slug> — <計画タイトル>

<!-- 配置: local/plans/active/NN_slug.md (NN = 起案順の通し番号)。大型計画は local/plans/active/NN_slug/ サブディレクトリ化し main.md + PhaseN.md に分割。superseded 時はディレクトリ名に _superseded を付けて凍結。完走したら plans/completed/ へ移動。
     サブディレクトリ内の文書は番号連番で自己完結させる: 00_概要と背景 → 01_調査 → 02_計画 → 03_ログ → 98/99_関係者回答・懸念 → _archive/ (origin: fablab-westharima-astro の projects/ 規約) -->

| 項目 | 内容 |
|---|---|
| 起案日 | YYYY-MM-DD |
| 起案契機 | (何がきっかけか — bug / user指示 / 調査結果へのリンク) |
| 起案者 | Claude Code / User |
| ステータス | 📝 起案(GO待ち) → 🟢 GO済・進行中 → 🎉 全Phase完走 / ❄️ superseded |
| 想定Phase数・工数 | 試算: N session (完走時に実績を追記: 実績 M session) |
| 先行依存 | (先に完了すべき plan / bug) |
| 後継計画 | (この plan が生む次の plan) |

## ⚡ 30秒で把握

(この計画の目的・やること・やらないことを3-5行で。cold-start した Claude が最初に読む)

## 1. 経緯 + 動機

(なぜこの計画が必要か。founding use case = この機能/変更が存在する理由をユーザーの言葉で記録する — rule 17: founding use case が全判断の anchor になる)

## 2. 既存実装・現状の調査

(設計前に必ず現状を調査した結果。grep 結果・既存構造・参照実装の比較テーブル — rule 19。調査せず設計に入るのは禁止 — rule 01/02)

## 3. 設計判断点 (Decisions for user)

<!-- 各判断点は「推奨 + 根拠 + trade-off」で提示し、user の承認を得てから確定。
     「recommend defer」を先に書いて誘導する pre-decision pattern は禁止 (rule 17) -->

| # | 判断点 | 選択肢 | 推奨 | user 判断 |
|---|---|---|---|---|
| 1 | | A: … / B: … | A (理由: …) | (承認待ち) |

## 4. Phase 分割

| Phase | Task | Severity | 完了条件 | 状態 |
|---|---|---|---|---|
| 1 | | 🔴/🟡/🟢 | (機械検証可能な条件) | ⬜ |
| 2 | | | | ⬜ |

(実装は user GO 後。Phase 単位で GO を取る — rule 12 wait-for-go)

## 5. 完了条件 (計画全体)

- [ ] (静的ゲート: typecheck / lint / test 全PASS)
- [ ] (機能検証: 1シナリオずつの UAT — rule 04)
- [ ] (人間側検証が必要な項目は明示的に分離)

## 6. 引き継ぎメモ

(セッションを跨ぐ場合の現在地。詳細は handover/16.md と改定log に委譲し、ここは plan 固有の文脈のみ)
