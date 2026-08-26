# maintenance_index — digicode-text メタドキュメント全体の地図

<!-- 更新頻度: 構造変更時のみ(ファイル追加のたびには更新しない。件数は目安)。
     ヘッダに更新履歴を積層する: 最終更新 / 直前更新 の2行を維持 -->

**最終更新:** 2026-08-27 (S008 — current state を 3 owner へ topic 分割: `16.md` を router 化し、`batons.md` / `evidence-map.md` を conditional owner として新設)
**直前更新:** 2026-08-25 (テンプレート `5148e67` の bootstrap-defect 修正を再適用。件数の実体を撤去し数え方へ委譲 = L-5)

---

## §0. 設計方針(2層構造)

- `global/` = プロジェクト非依存(テンプレート由来)。ルール・テンプレート・空スケルトン。**別プロジェクトへ丸ごと持ち出せる状態を維持する** — プロジェクト固有の記述を global/ に書かない。
- `local/` = このプロジェクト限定。持ち出さない。
- `maintenance/` 直下へのファイル作成は禁止(rule 15)。配置に迷ったら `global/rules/common/15-docs-organization.md` の decision tree。この禁止は散文ではなく実行される — `bash scripts/placement-scan.sh` が rule 15 §Layer definitions を parse して allow-set を導出し、selftest B67 が live tree を走査する。

## §1. global/ 構成

| パス | 内容 | 数え方 |
|---|---|---|
| `global/rules/README.md` | ルール索引 + decision tree + format spec | 単一ファイル |
| `global/rules/common/` | 共通ルール(`NN-topic.md` 連番 + judgment-mistakes-history) | `ls prompt/maintenance/global/rules/common \| wc -l` |
| `global/rules/reference/` | 参照資料(origin 事例保存) | `ls prompt/maintenance/global/rules/reference \| wc -l` |
| `global/templates/` | 雛形(AGENTS 生成器 / bug / delegation-packet / investigation / plan / review-report / routing-profile / rule / session-log) | `ls prompt/maintenance/global/templates \| wc -l` |
| `global/{bugs,handover,plans,investigations,docs,legacy}/` | 空スケルトン(構造ミラー) | — |

**この地図は routing-index であり、事実の owner ではない。**件数の実体をここに書かないのは方針ではなく実測の結果で、テンプレート側の同ファイルは bootstrap 時の数(rules 21 / 実際 25)を **7 週間**保持したまま新 consumer へ複製されていた — この repository の bootstrap が検出した finding **L-5** で、2026-08-25 にテンプレート側(`5148e67`)とここの両方で是正した。**数は書かず、数え方だけを書く。**

## §2. local/ 構成

| パス | 内容 | 数え方 |
|---|---|---|
| `local/README.md` | local 層の運用標準(命名規則・ライフサイクル)。**テンプレート標準につき構造を変えない** | 単一ファイル |
| `local/rules/digicode-text/` | プロジェクト固有ルール | `bash scripts/baseline.sh`(rules 行の local 側) |
| `local/docs/` | `routing-profile.md`(model / effort / target mapping の**唯一の owner**)/ `RULES_SNAPSHOT`(受領したテンプレート断面の受け手側記録) | `ls prompt/maintenance/local/docs \| wc -l` |
| `local/handover/` | **current-state owner set 3 本**: `16.md`(router・上書き・hook が全文注入・**mandatory**)· `batons.md`(baton 本文・**conditional**)· `evidence-map.md`(evidence / provenance / loop / template feedback queue・**conditional**)。read class の owner は `CLAUDE.md` §0 / sessions/(履歴・1session=1file)/ 改定log.md(索引)/ 本ファイル | `bash scripts/baseline.sh`(sessions 行) |
| `local/bugs/active/` + `closed/` | バグ + index.md ×2 | `bash scripts/baseline.sh`(bug index 行) |
| `local/plans/active/` + `completed/` | 計画 | `bash scripts/baseline.sh`(plans 行) |
| `local/investigations/` | 調査記録 | `ls prompt/maintenance/local/investigations \| wc -l` |
| `local/legacy/` | 旧版アーカイブ | `ls prompt/maintenance/local/legacy \| wc -l` |

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

受領断面の記録は **`local/docs/RULES_SNAPSHOT`** にある。bootstrap 時点ではこれを書けなかった — 当時テンプレートが指定していた `global/RULES_SNAPSHOT` は rule 15 §Forbidden locations に抵触し、placement-scan が `VIOLATIONS=1` を返したためで、配置は policy 判断なので単独で解決せず finding **L-1** として返した。2026-08-25 に user が案 A を裁定し、テンプレート側が `local/docs/` へ移した(`5148e67`)ので、受領記録はいま正規の場所にある。このリポジトリからテンプレートを直接編集しない(16.md §3 settled)。テンプレートへ還元すべき知見が生まれた場合は、`/close` の手順が候補として記録し、user の Yes を得てから反映する。
