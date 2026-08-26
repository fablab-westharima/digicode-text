# S006 (2026-08-26) — Full Orchestration Re-Audit: 82 claim を 6 レーンで独立再監査。commit 1 本。新規 case 3(DT-3/4/5)、新規 baton 6、production 変更 0

**作成者: Claude Code (Opus 5)** · `PRIMARY_MODEL_MODE`: Human 指示により **delegation-default**(既定の `T1-solo` ではない)· `SESSION_ROLE: PRIMARY`(既定)

## §0. 目的の問い直し

全作業目的(16.md §0)は「DigiCode から技術資産を選択移植して digicode-text を作る」ことである。
本セッションはそこへ **1 行のコードも足していない**。前進させたのは別の軸である:

> **これまでの 5 セッションが積み上げた判断材料が、そもそも信用に足るのか。**

Human の問題提起は「Opus 5 solo を最も信用しにくい運用の一つと考えている」であり、
S001–S005 が `codex tool calls = 0` / `subagent spawns = 0` で通り続けたことへの疑義だった。
**移植すべき資産を選ぶ判断が、検証されていない evidence の上に載っていないかを確かめる作業**であり、
目的そのものではなく**目的へ向かう足場**を点検した。

## §1. 実施内容

1. **cold start**(rule 13)。`read-load.sh` の範囲で mandatory read 全件、`baseline.sh` / `selftest.sh`
   (75 passed / 0 failed, RC=0)/ `placement-scan.sh`(RC=0)を実測。handover との乖離なし。
2. **task-specific rules を追加読了** — rule 22 全 1005 行、rule 04 §Delegated verification claims、
   `routing-profile.md`、delegation packet template。
3. **pre-flight**(rule 22)。`claude mcp list` → Codex 接続確認。model / effort は
   **transport 自身の設定から**取得(`~/.codex/config.toml`)。`~/.codex/sessions` の最終活動が
   **2026-08-20** であることが「この project では一度も使われていない」の独立裏付けになった。
4. **開始時に route を 1 行で宣言**(Route A / delegation-default / lane 内訳)。
   S001–S005 でこれを守れていたのは S002 のみだったので、本セッションは意図的に先に書いた。
5. **6 レーンを dispatch**(Codex 5 + Claude subagent 1)。全 packet が template contract 準拠で、
   production 禁止事項と donor 絶対境界を **verbatim** で継承。
6. **orchestration 監査を自分で書かず、Codex に FALSIFICATION で攻撃させた** — parent が自分の運用を
   裁く構造は case PT-2 の形だったため。**parent の 4 結論のうち 3 つが部分反証された。**
7. **返却された claim の bounded review** — D4a が返した矛盾(Go 根拠 #1 と §5-1)について、
   参照された exact path:line を実読して確認。それ以外の scope へは踏み込んでいない。
8. **baton 4 の測定を完了** — Codex の effort scale を transport の API エラー応答から実測。
   **書き込みは GO-gated なので行っていない。**
9. **Human へ統合報告 → STOP。** 裁定 4 件を返した。
10. **(Human 依頼)** 詳細報告書を `~/Downloads` へ、閲覧用 Artifact を発行。**いずれも git 外。**
11. **Human の質問「セッションクローズ処理終わってるんだっけ？」で close 未実施が判明** → close GO →
    本 close。**この時点で S006 の evidence は git に 1 バイトも存在しなかった**(case DT-5)。

**GO の取得点:** ① 冒頭の HUMAN GO(再監査の範囲)② close GO。
**production 変更・repo 書き込みは、close 作業まで 0 だった。**

## §2. 状態変化

**新規 case 3 件**(いずれも本セッション内で起票済み。先送りなし):

| case | 内容 |
|---|---|
| **DT-3** | mandatory different-vendor consult が 5 セッション適用対象でありながら一度も発火せず、その理由として誤読した rule 04 が 4 セッション再利用された。**原因の一部はこの repository の規則の外**(Claude Code 製品側が注入した `Do not call the AgentTool unless the user requested it`)にあり、規則だけを見ていたら誤った結論で終わっていた |
| **DT-4** | S005 の Go 根拠 #1 が、同じ調査の 11 ファイル前に自ら「本調査で見つかった最も重い事実」と書いた finding に否定されていた。**両方とも `primary source` ラベル付き**。case 59 と違い**探索は既に成功していた** — 欠けていたのは自分の corpus に対する reconciliation pass |
| **DT-5** | 完全に委譲された objective が disk へ何も書かず、evidence が transcript にしか存在しなかった。**委譲は solo 作業が副産物として与える永続化を静かに奪う**。検知したのは check ではなく Human の質問 |

**新規 baton 6 件**: 38(S005 §1/§2/§3 の再裁定要否)· 39(Registry の順位付け根拠)·
40(positive control 付きで測り直す器材 9 件)· 41(競合実利用 0)· 42(harness 側の注入指示)·
43(conductor effort の未verify)。

**既存 baton の訂正・格上げ 7 件**: 4(実測完了・🔴 へ)· 13(Firefox Web Serial の条件を訂正)·
21(Text Compiler 設計入力 4 件を追加)· 22(registry 不在は独立確認できず)·
24(**測定 runner が保存されていない**を追記、🟡→🔴)· 31(一次情報で確認・🟡→🟢)·
37(PleaseDontCode を追加)。

**新規 settled ruling 1 件**: **Opus 5 solo 禁止**(Human が S007 指示文書 §0 で明示的に再宣言)。

**新規 rule は作っていない。** DT-3 / DT-5 はいずれも Template feedback candidate として記録し、
`Project_Template` はこの repo から変更していない(§3 settled)。

**Template feedback queue に 3 件追加**(計 6 件)。

**evidence directory を新設**: `local/investigations/2026-08-26_orchestration-re-audit/`(8 files)。
**plan を新設**: `plans/completed/07_full-orchestration-re-audit.md`。

**裁定は 1 件も変更していない。** 変更したのは「裁定を支えた evidence の評価」だけである。

## §3. 自己評価

- ✅ **Healthy signs**
  - cold-start protocol 遵守。baseline / selftest / placement を**実測**し、転記していない
  - **開始時に route 行を書いた** — 直前のセッション群が守れていなかった義務
  - **自分の結論を先に立てて別 lineage に攻撃させ、3/4 が部分反証されるのを受け入れた**。
    特に「構造が委譲を禁じていた」という自分に有利な説明が false だったことを、そのまま報告した
  - **反証だけでなく生き残ったもの(V7 / E3 / A4 / bundle 6.2×)も同じ強さで記録した** —
    反証だけを集めると同じ失敗の符号違いになる
  - delegation exclusivity を守り、`EXCEPTION_TRIGGER` を一度も使わず shadow execution 0 件
  - **Human 裁定を 1 件も動かさず、evidence の訂正と分離して返した**
  - **case 3 件をセッション内で起票した**(先送り 0)
  - **「独立確認できず 17 件」を「誤り」と混同せず、両者を分けて報告した**

- ⚠️ **Warning signs**(すべて処理済み — prose のまま残していない)
  - 🔴 **objective の全期間、disk へ何も書かなかった。** → **case DT-5 として起票**。
    Human の質問が無ければ evidence は失われていた
  - 🔴 **parent の自己監査は 4 結論中 3 つが誤りで、しかも誤りは全て「自分に有利な方向」だった**
    (規則が委譲を禁じていた/全セッション同じ理由だった/構造的に不可能だった)。
    → **DT-3 本文に記録**。次に自己監査するときの前提として使う
  - 🟡 **本再監査も real-fire ではない部分が多い。** Codex は network 遮断、Helper 再実行は EPERM、
    esp-clangd は core 更新で path 消失。→ **`01_method-and-lanes.md` §8 に実行できなかった rung
    10 件を列挙**し、baton 40 として再測定対象を登録
  - 🟡 **Codex の各 packet は互いの答えを見ていないが、問いを設計したのは同じ parent である。**
    parent の盲点は packet の盲点になりうる。→ **`01` §8-2 に構造的限界として明記**。
    D4b にだけ異なる検索戦略を与えたのが唯一の緩和
  - 🟡 **conductor 自身の effort が宣言と食い違っている可能性が未verify のまま残った。**
    → **baton 43 として登録**(次セッションの pre-flight step 1 で確認できる)
  - 🟡 `handover-diff.sh` が 16 件を GONE と判定したが、**全件を grep で実在確認**した(LOST 0)。
    S006 が各行へ注記を追記したため類似度が閾値を下回ったもので、実質は REWORDED。
    → 検出漏れの観察として close 報告に記録。**tool の欠陥として本 repo からは直さない**
