# maintenance_index — digicode-text メタドキュメント全体の地図

<!-- 更新頻度: 構造変更時のみ(ファイル追加のたびには更新しない。件数は目安)。
     ヘッダに更新履歴を積層する: 最終更新 / 直前更新 の2行を維持 -->

**最終更新:** 2026-08-25 (S000 bootstrap — Project_Template `v2026-08-13-106-g088b1c3` から初期化)
**直前更新:** —

---

## §0. 設計方針(2層構造)

- `global/` = プロジェクト非依存(テンプレート由来)。ルール・テンプレート・空スケルトン。**別プロジェクトへ丸ごと持ち出せる状態を維持する** — プロジェクト固有の記述を global/ に書かない。
- `local/` = このプロジェクト限定。持ち出さない。
- `maintenance/` 直下へのファイル作成は禁止(rule 15)。配置に迷ったら `global/rules/common/15-docs-organization.md` の decision tree。この禁止は散文ではなく実行される — `bash scripts/placement-scan.sh` が rule 15 §Layer definitions を parse して allow-set を導出し、selftest B67 が live tree を走査する。

## §1. global/ 構成

| パス | 内容 | 件数 |
|---|---|---|
| `global/rules/README.md` | ルール索引 + decision tree + format spec | 1 |
| `global/rules/common/` | 共通ルール(01-24 + judgment-mistakes-history) | 25 |
| `global/rules/reference/` | 参照資料(context-handoff / four-axis-essence / known-pitfalls / memory-index / migration-history / phase-patterns / whole-system-analysis) | 7 |
| `global/templates/` | 雛形(AGENTS 生成器 / bug / delegation-packet / investigation / plan / review-report / routing-profile / rule / session-log) | 9 |
| `global/{bugs,handover,plans,investigations,docs,legacy}/` | 空スケルトン(構造ミラー) | — |

**件数は目安であって権威ではない。**正は `ls | wc -l`。ここに書かれた数は更新トリガを持たないので、数を根拠に判断しないこと。

## §2. local/ 構成

| パス | 内容 | 件数 |
|---|---|---|
| `local/README.md` | local 層の運用標準(命名規則・ライフサイクル)。**テンプレート標準につき構造を変えない** | 1 |
| `local/rules/digicode-text/` | プロジェクト固有ルール | 0 |
| `local/docs/` | システム概要・手順書 + `routing-profile.md`(model / effort / target mapping の**唯一の owner**) | 1 |
| `local/handover/` | 16.md(現在地・上書き)/ sessions/(履歴・1session=1file)/ 改定log.md(索引)/ 本ファイル | 3 + sessions 1 |
| `local/bugs/active/` + `closed/` | バグ(active 0 / closed 0)+ index.md ×2 | 2 |
| `local/plans/active/` + `completed/` | 計画(active 0 / completed 0) | 0 |
| `local/investigations/` | 調査記録 | 0 |
| `local/legacy/` | 旧版アーカイブ | 0 |

## §3. 新セッションの読み順

**この節は読み順の要約であって契約ではない。**必読契約の owner は `CLAUDE.md` §0 一箇所であり、範囲は `bash scripts/read-load.sh` が出力する(selftest B53 が両者の不一致で赤になる)。

1. `bash scripts/read-load.sh`(各ファイルをどこまで読めばよいか = `Read limit:N`)
2. `CLAUDE.md`(プロジェクトルート — 索引。SessionStart hook が 16.md と bug index を自動注入する)
3. `global/rules/README.md` §Core(decision tree)
4. `global/rules/common/13-session-recovery.md`(cold-start protocol)
5. `global/rules/common/17-no-self-imposed-scope.md` §Core
6. `global/rules/common/judgment-mistakes-history.md` Part 1
7. `local/handover/16_次セッション引き継ぎ指示書.md`(現在地)
8. タスクに応じ decision tree が指すルール

**`local/handover/sessions/` の最新ファイルは無条件必読ではない**(2026-08-25 ruling N-α、テンプレートから継承)。`CLAUDE.md` §0 が列挙する 4 つのトリガのいずれかが発火したときだけ、**主題に該当するファイル**(最新とは限らない)を開く。「念のため」はトリガではない。

## §4. このプロジェクトとテンプレートの関係

digicode-text は `Project_Template` の **consumer** であり、distributor ではない。テンプレート改訂は user が決断した展開訪問で inbound に届く。

🔴 **受け手側 marker `global/RULES_SNAPSHOT` はこのリポジトリに存在しない。**decision tree の 1 行と `OPERATIONS.md` §1 付帯義務 2 はこのパスを指定するが、rule 15 の placement contract(`scripts/placement-scan.sh` / selftest B67)は layer root へのファイル配置を禁止しており、**両者が矛盾する**。テンプレート側は送り手なので受け手 marker を持たず、この矛盾は一度も発火していない。配置先の裁定は user のものなので、S000 bootstrap では矛盾を実体化させず、受領断面の記録は `sessions/S000_2026-08-25_bootstrap.md` と `README.md` に置いた(16.md §2 baton 7)。このリポジトリからテンプレートを直接編集しない(16.md §3 settled)。テンプレートへ還元すべき知見が生まれた場合は、`/close` の手順が候補として記録し、user の Yes を得てから反映する。
