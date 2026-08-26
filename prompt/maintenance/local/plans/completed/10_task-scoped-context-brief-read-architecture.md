# 10_task-scoped-context-brief-read-architecture — Task-Scoped Context Brief / Read Architecture Maintenance

| 項目 | 内容 |
|---|---|
| 起案日 | 2026-08-27 |
| 起案契機 | Human 指示書 `~/Downloads/Claude Code 新規セッション開始プロンプト — Task-Scoped Context Brief - Read Architecture Maintenance.md`(S009 開始)。直接の前提は S008 の実測 — topic split では brief は縮まず**増えた**(16.md §3 / baton 52) |
| 起案者 | User(PRIMARY_OBJECTIVE を宣言)/ Claude Code(plan 化) |
| ステータス | 🎉 全Phase完走(2026-08-27 Human 受理・正式 close。**production 変更 0**) |
| 想定Phase数・工数 | 試算 1 session → **実績 1 session(S009)**。設計と検証のみ。実装 GO は含まない |
| 先行依存 | `plans/completed/09_handover-context-brief-read-load-architecture.md`(S008) |
| 後継計画 | `Managed Environment & Device Knowledge Architecture Design`(menu #2、着手権限なし) |

## ⚡ 30秒で把握

repo access を持たない actor へ current truth を渡す唯一の正規手段 `scripts/context-brief.sh` は、
**完全性が任務であるがゆえに current truth に比例して肥大する**。cap 128 KiB は Human 裁定で
「この種の最後の一回」であり、実測 102,629 bytes(78.3%)。本 plan は **Objective ごとに必要な
current truth だけを安全に export する architecture** を設計・検証する。**現時点で分類器も
wrong-owner control も no-owner control も 1 つも存在しない**(S008 実測)。あわせて baton 25
(read allowance 導出)と baton 43(Opus effort mismatch)を**測定・提案まで**扱う。
**threshold・cap・effort 設定の変更は一切行わない。**

## 1. 経緯 + 動機

Human verbatim(指示書 PRIMARY_OBJECTIVE):

> repo accessを持たないactorやdelegated laneへ、Objectiveに必要なcurrent truthだけを、安全かつ
> 過不足なくexportできるcontext delivery architectureを設計・検証する。
> 同時に、current mandatory read / conditional owner / task routing / fallback / wrong-owner /
> no-owner / completeness / read allowance / effective model effort等の未解決Harness課題を整理し、
> 次の大規模製品設計へ安全に進める状態を作る。

founding use case はこの 1 文である。**export 量を減らすことが目的であり、project truth を
減らすことではない**(指示書 §19 / 16.md §3)。

## 2. 既存実装・現状の調査

S009 cold start 実測(2026-08-27、HEAD `139c202`):

| 対象 | 実測 | 命令 |
|---|---|---|
| context brief | 102,629 bytes(plain)/ 106,761 bytes(`--rules 22`)、cap 131,072 の 78.3% / 81.5% | `bash scripts/context-brief.sh \| wc -c` |
| unconditional read | 62,570 tok / allowance 48,000 = 130%、WARNING | `bash scripts/read-load.sh` |
| selftest | 78 passed / 0 failed | `bash scripts/selftest.sh` |
| owner set | 3(router 1 + conditional 2)、GEN `S008-close` 一致 | `bash scripts/selftest.sh` B69/B70/B71 |
| baton stub↔body | 48/48 | B71 |
| effort mismatch | 宣言 `xhigh` / `modelSettings["claude-opus-5"] = medium` 併存 | `~/.claude/settings.json` |

詳細な section 単位の内訳・重複測定・failure mode の実測は
`local/investigations/2026-08-27_task-scoped-brief/` が owner(本 plan には転記しない)。

## 3. 設計判断点 (Decisions for user)

| # | 判断点 | 選択肢 | 推奨 | user 判断 |
|---|---|---|---|---|
| 1 | task→owner routing の決定方式 | A: explicit metadata + deterministic route(AI は補助のみ)/ B: AI classifier 主体 / C: 併用 | (証拠確定後に記載) | (承認待ち) |
| 2 | unknown-task の fallback | A: full brief へ縮退 / B: Core + 全 ALWAYS + owner path のみ / C: STOP して Human へ | (証拠確定後に記載) | (承認待ち) |
| 3 | repo access 有無で brief を分けるか | A: 分ける / B: 単一形式のまま | (証拠確定後に記載) | (承認待ち) |
| 4 | context brief と delegation packet の責務境界 | (重複実測後に提示) | (証拠確定後に記載) | (承認待ち) |
| 5 | `READ_ALLOWANCE` 導出モデルの採否と入力値 | (導出案 + Human が供給すべき入力) | 測定・提案のみ。**値は変更しない** | (承認待ち) |
| 6 | baton 43 の設定変更 | (実効値・原因・具体設定・影響・rollback を提示) | 提示のみ。**AI は変更しない** | (承認待ち) |
| 7 | `BRIEF_MAX_BYTES = 128 KiB` の今後の扱い | 維持 / 引き下げ / 別 threshold 設計 | proposal のみ | (承認待ち) |

## 4. Phase 分割

| Phase | Task | Severity | 完了条件 | 状態 |
|---|---|---|---|---|
| 1 | Adaptive fan-out 第一波(3 Codex lane) | 🔴 | 3 capsule 受領・bounded review 完了 | ✅ |
| 2 | Harness 統合 — requirements 明文化 · task→owner routing 案 · fallback · repo access 別 brief · packet 責務境界 | 🔴 | 統合文書が investigations/ に存在 | ✅ |
| 3 | 第二波(disagreement / evidence gap のみ)+ 複数 Objective fixture での reconstruction + negative control | 🔴 | fixture 別に expected/recovered/misses/false facts/bytes を実測 | ✅ |
| 4 | 統合結論への **Codex FALSIFICATION**(Harness 自己点検で close しない) | 🔴 | falsifier の訂正が統合へ反映済み | ✅ |
| 5 | Human 向け詳細報告書を `~/Downloads/` へ実 write + terminal 要約 + STOP | 🔴 | ファイルが実在しパスを提示 | ✅ |

## 5. 完了条件 (計画全体)

- [ ] Acceptance criteria 33 項目(Human 指示書 §33)を 1 件ずつ照合
- [ ] production 変更 **0**(scripts の threshold / cap / effort / owner 本文いずれも未変更)
- [ ] `Project_Template` 本体変更 **0**(feedback candidate として記録のみ)
- [ ] `codex tool calls > 0`(Opus 5 solo での完結は未達扱い)
- [ ] selftest / read-load / context-brief / handover-diff / placement-scan を最終 tree で再測定
- [ ] 詳細報告書が `~/Downloads/` に実ファイルとして存在

## 6. 引き継ぎメモ

現在地は 16.md §1 が owner。本 plan は S009 の作業単位のみを保持する。
**menu #2 `Managed Environment & Device Knowledge Architecture Design` には着手しない**(指示書 §25)。
