# evidence-map — digicode-text の evidence / provenance / loop position owner

<!-- CONDITIONAL CURRENT-TRUTH OWNER (CLAUDE.md §0 が read class の owner).
     このファイルは 16.md から分離された「どこに何があるか」の地図であり、16.md と同じ
     current truth の一部である。history ではない — sessions/ が history の owner。
     ここへ measurement や ruling の本文を書かない(それぞれ investigations/ と 16.md §3 が owner)。
     16.md と同一 commit で更新し、GEN は 16.md の宣言と一致させること
     (local/README.md §OPTIONAL CAPABILITY 義務 ①②③)。
     16.md の route map にある 1 行 stub は、このファイルを読まない session でも
     禁止・限定・順序を取り違えないための最小記述である。stub を削らないこと。 -->

> **GEN: S009-close** — 16.md の GEN と一致していなければ、どちらかが stale。16.md が router。

## §A. Evidence and provenance map

<!-- 出典: 16.md §1(S007 close 時点)から逐語移設。2026-08-27 S008. -->

**What the eight closed objectives produced**

| objective | evidence | plan |
|---|---|---|
| S001 DigiCode Donor Inventory / Audit | `local/investigations/2026-08-26_donor-audit/` (12 files; `00_index.md` first) | `plans/completed/01_…` |
| S002 Compiler Shared / Separate probe | `local/investigations/2026-08-26_compiler-shared-probe/` (7 files) | `plans/completed/02_…` |
| S003a Editor / LSP Technical Spike | `local/investigations/2026-08-26_editor-lsp-spike/` (9 files; `08_…` for findings) | `plans/completed/03_…` |
| S003b Local LSP Helper Feasibility | `local/investigations/2026-08-26_local-helper-feasibility/` (9 files; `08_…` for the same) | `plans/completed/04_…` |
| S004 handover 準拠監査 / read-load maintenance | (成果は本ファイルの構造そのもの + baton 25) | `plans/completed/05_…` |
| S005 Product Value Revalidation | `local/investigations/2026-08-26_product-value-revalidation/` (9 files; `08_…` for Go 判定) | `plans/completed/06_…` |
| S006 Full Orchestration Re-Audit | `local/investigations/2026-08-26_orchestration-re-audit/` (8 files; `08_conclusion-and-next.md`) | `plans/completed/07_…` |
| **S007 Practical IoT Competitive & DigiCode Capability Revalidation** | **`local/investigations/2026-08-26_practical-iot-revalidation/` (10 files; `00_index.md` → `08_conclusion-and-next.md`、🔴 `08` を読む前に `09_integration-falsification.md` を読むこと)** | `plans/completed/08_…` |
| **S008 Handover / Context-Brief / Read-Load Architecture Maintenance** | **`local/investigations/2026-08-27_handover-architecture/` (5 files; `01`=inventory · `02`=split 反証 · `03`=baton↔ruling 依存 · `04`=独立復元 + negative control · `05`=統合反証)** | `plans/completed/09_…` |
| **S009 Task-Scoped Context Brief / Read Architecture Maintenance** | **`local/investigations/2026-08-27_task-scoped-brief/` (10 files + `probe/`; 🔴 `08`(統合反証)を `07`(統合 v2)より先に読み、現行結論は `09` である)** | `plans/completed/10_…` |

**Donor SHAs all objectives are pinned to** — S007 が `git rev-parse HEAD` で **3/3 一致を再確認済み**:

| repo | branch | SHA | dirty |
|---|---|---|---|
| `DigiCode` (donor) | main | `bb35c3b8025610299bf952c2c45eda2196a07401` | 0 |
| `digicode-compile-api` (donor) | main | `3376746f1e5a4ca039e0cade279741f16612fccf` | 0 |
| **`DigiCode-Helper` (remote is `DigiCode-Finder`)** | main | `fa95dfd67ee83d881f93be7641cc9cef171165a2` | 0 |

**Ecosystem boundary** — current assets are **DigiCode** (frontend + auth/課金) · **digicode-compile-api** · **digicode-class-server** · **DigiCode-Helper** (Tauri, remote *DigiCode-Finder*). `arduino-compile-server` is **decommissioned (2026-04-28)**. `~/github_project/archive/` is **not** current authority. ML30 was **never connected**.

**Where the external primary sources are** — none is in git (baton 16); `~/Downloads/` holds ~180 unrelated `.md` files, so **exact filenames matter**.

| what | path |
|---|---|
| planning documents (5) | `~/Downloads/DigiCode_Text_引き継ぎ書_{INDEX,前編,中編,後編}_2026-08-26.md` · `~/Downloads/DigiCode_Text_企画書_開発計画書_v0.2_2026-08-26.md` |
| S001 ruling / instruction documents (4) | `~/Downloads/Claude Code投入用プロンプト — DigiCode Text Donor Inventory - Audit {開始,継続}.md` · `~/Downloads/Claude Codeへの継続指示プロンプト.md` · `~/Downloads/Claude Code セッションクローズ指示.md` |
| S002 (3) | `~/Downloads/Claude Code 新規セッション開始プロンプト — DigiCode Text.md` · `~/Downloads/Claude Code 新PRIMARY_OBJECTIVE — Compiler共用可否の実証調査.md` · `~/Downloads/Claude Codeへの回答.md` |
| S003 (3) | `~/Downloads/Claude Code 新規セッション開始プロンプト — Editor - LSP Technical Spike.md` · `~/Downloads/Claude Codeへの追加調査プロンプト — Local LSP Helper Feasibility.md` · `~/Downloads/Claude Codeへの返信プロンプト — Web主軸・Desktop対応方針の裁定.md` |
| S005 (2) | `~/Downloads/Claude Code 新規セッション開始プロンプト — DigiCode Text 有効性再確認と製品軸の再定義.md` · `~/Downloads/Claude Codeへの指示 — Product Value Revalidation受理・closeと次Objective準備.md` |
| S006 (1) | `~/Downloads/Claude Code 新規セッション開始プロンプト — Full Orchestration Re-Audit.md` |
| **S007 (2)** | **`~/Downloads/Claude Code 新規セッション開始プロンプト — Practical IoT Competitive  DigiCode Capability Revalidation.md`(実ファイル名は `&` を含む)· `~/Downloads/Claude Codeへの指示 — S007正式受理・Human補足裁定反映・Session Close.md`** |
| Human 向け詳細報告書(派生、git 外) | S006: `~/Downloads/DigiCode_Text_Full_Orchestration_Re-Audit_報告書_2026-08-26.md` · **S007: `~/Downloads/DigiCode_Text_S007_Practical_IoT_Competitive_調査報告書_2026-08-26.md` + `~/Downloads/DigiCode_Text_S007_Cold_Start_調査報告書_2026-08-26.md`** — **owner は `investigations/`。矛盾時は investigations が正しい** |
| donor + related local clones | `investigations/2026-08-26_donor-audit/02_ecosystem-inventory.md` owns that table |

**Re-reading them is usually unnecessary** — every ruling is distilled into §3 and the batons. Open them for the user's own wording or a decision's provenance. **They stay outside git until baton 16 is ruled on.**

**Measured evidence — owned elsewhere, never restated here.** Every probe result, benchmark and
technical measurement this project has is owned by `investigations/`, which is **immutable historical
evidence**. **Do not copy a measurement into this file.**

| evidence owner | what it owns | open first |
|---|---|---|
| `investigations/2026-08-26_donor-audit/` | DigiCode ecosystem の静的監査、AI/registry/compile/frontend/write/security の実装読解、Editor OSS の一次調査 | `00_index.md` → `11_findings-and-next.md` |
| `investigations/2026-08-26_compiler-shared-probe/` | 実 `pio run` による Compiler Shared/Separate 実証 | `00_index.md` → `05_options-findings-and-next.md` |
| `investigations/2026-08-26_editor-lsp-spike/` | Monaco / CodeMirror の実ブラウザ実測、clangd と arduino-language-server の実応答、COOP/COEP | `00_index.md` → `08_options-findings-and-next.md` |
| `investigations/2026-08-26_local-helper-feasibility/` | HTTPS→localhost、Helper の防御モデル、board pack 実サイズ、VPS 実価格 | `00_index.md` → `08_options-findings-and-next.md` |
| `investigations/2026-08-26_product-value-revalidation/` | 2026 年の既存環境比較、offline bundle 反証、Go 判定と 1 文定義 | `00_index.md` → `08_conclusion-and-next.md` |
| `investigations/2026-08-26_orchestration-re-audit/` | S001–S005 の独立再監査、裁定と evidence の分離、器材欠陥追跡 | `00_index.md` → `08_conclusion-and-next.md` |
| **`investigations/2026-08-27_task-scoped-brief/`** | 🔴 **現行 context delivery の実測(brief の section 別 byte · source owner · hook 注入量)· 96 item の全件分類と 5 failure mode · read allowance 導出モデルと Opus effort の機構/実効値 · 実 packet 3 件との重複測定 · measurement-only prototype と 6 fixture 復元 + 8 negative control · 統合への全件反証 · top-level `xhigh` の provenance** | **`01` → `02` → `03` → `04` → `06` → 🔴 `08` → `09`(`09` が現行結論。`05` と `07` は superseded で、`08` の攻撃対象として保存されている)** |
| **`investigations/2026-08-26_practical-iot-revalidation/`** | 🔴 **donor の auto Web UI 実装 · donor の実用 IoT capability · 競合母集団 48 行と探索ログ · 日本市場と学術 3 本 · 料金/無料枠/実用コスト · 競合機能の一次情報 191 URL · 反証 T1–T5 · 統合 A–H · 統合への最終反証** | **`00_index.md` → `09_integration-falsification.md` → `08_conclusion-and-next.md`(この順序で読む)** |

🔴 **S009 の evidence も読む順序がある。** `05`(統合 v1)と `07`(統合 v2)は **superseded** であり、`08` が 91 claim を全件追跡して
**CONTRADICTED 6 / UNSUPPORTED 6 / OVERSTATED 20** を検出した。**現行の統合結論は `09` である。**`07` を先に読むと訂正前の主張を持ち帰る。

🔴 **S007 の evidence を読む順序は逆である。** `08`(統合)は `09`(統合への反証)に **13 件訂正されている**。
`09` を先に読まないと、訂正前の主張を current truth として持ち帰ることになる。訂正内容は `08` §5 が owner。


## §B. Loop position and template feedback queue

<!-- 出典: 16.md §4 から逐語移設。2026-08-27 S008. -->


**① harvest:** the project owns ten cases — **DT-1** … **DT-10** (`global/rules/common/judgment-mistakes-history.md`).
**S009 filed two: DT-9**(統合が再び自分の evidence を超えた — 事実主張 91 件中 CONTRADICTED 6 / UNSUPPORTED 6 / OVERSTATED 20。
**認知的自己点検の検出は 0 件**で、捕まえたのは dispatch された独立レーンだけ。**S007 の DT-6 と同じ結論が 2 度目**)·
**DT-10**(2 つの設定値が食い違っていたので「不整合」と呼び 4 セッション追いかけたが、**所有者に「意図的ですか」と訊いた者が 1 人もいなかった**。
分母を 47 → 2,095 records まで広げたが、広げたのは「実効値は medium か」であって「medium は誤りか」については **n=0** のままだった)。
**S008 filed one: DT-8** — DT-7 の直接の再演。5 レーンへ委譲したセッションで、delegate 成果物の欠陥は 0、
**parent の手元作業から 5 件**が出て、うち 4 件は *parent が書いていた検査器そのもの* の中にあった
(id 衝突 · control が別ファイルを検査 · 分母を別 grep で数えて誤表示 × 2 · 存在しない guard の主張 · 自作 control の
パイプ RC)。**無検査地帯が、検査を作る工程を覆っていた。**認知的自己点検は 0 件しか捕まえず、
捕まえたのは dispatch された独立レーン(DT-6 と同じ結論)。
**S007 filed two: DT-6**(統合が自分の evidence を超え、同一セッションの反証レーンが 13 件を差し戻した。
**認知的な defense は 1 件も捕まえず、dispatch された独立レーンという構造だけが防御だった**)·
**DT-7**(委譲を厳格に運用した結果、parent の手元に残った「小さな作業」2 件が黙って誤った)。
**② crossdeploy:** not applicable — digicode-text is a consumer, not a distributor.
**③ spot observation:** awaiting an individual directive.

**🔴 Template feedback queue — waiting for a deployment visit.
`Project_Template` is NOT modified from this repository (16.md §3):**

**Approval state — 全 12 件が Human 承認済み(2026-08-27):** #7 / #8 は S008 開始時の Human 指示 §12 で、
**#9 / #10 / #11 / #12 は S008 受理時の Human 指示 §9 で承認された。**#1–#6 は従来どおり。
**承認は「queue へ記録してよい」までであり、本 repo から `Project_Template` を変更してよいという意味ではない**
(2026-08-27 Human 指示 §9 が既存裁定の維持を明示)。実際の還流は deployment visit で、`origin: digicode-text S{NNN}`
を付して行う。

| # | item | why it is project-independent |
|---|---|---|
| 1 | **case DT-1** — a licence marking is not a portability verdict | any consumer auditing a donor hits it; it is case 16 with the sign flipped |
| 2 | **selftest B57 special-cases only the `PT-` case prefix** (baton 20) | every consumer numbering cases with its own prefix falls into the generic branch |
| 3 | **case DT-2** — instrument defects are biased toward **false negatives** | the mechanism is generic: a probe that under-supplies its subject yields failures |
| 4 | **開始時 route 行の義務に実行時監査が無い**(case DT-3) | selftest B26 は rule / close の文言 9 個の存在確認のみで、09:00 に書かれた route 行と close 時に書かれたものを区別できない |
| 5 | **rule 22 §Independent-perspective triggers に発火機構も列挙も無い**(case DT-3) | rule 22 自身が「a described trigger does not fire」と書いているのに、この trigger は記述されているだけ |
| 6 | **`RESULT CAPSULE` contract に「どこへ書くか」が無い**(case DT-5) | rule 22 は capsule の中身を定義するが**永続化を要求しない**。investigation を委譲する全 consumer がこの穴を継承する |
| **7** | **統合文書に対する falsification lane の義務が rule 22 に無い**(case **DT-6**) | rule 22 は `FALSIFICATION` lane を定義するが、**「Human 裁定へ供給される統合文書は提出前にそれを通す」という trigger を持たない。**S007 では 13 件が捕まり、そのうち 0 件が統合者の自己点検で見つかった。**evidence を統合する行為は限定を外す方向に構造的な圧力がかかる**という一般的性質であり、consumer 全体に効く |
| **8** | **委譲比率が高いセッションで parent の手元作業に検査工程が無い**(case **DT-7**) | delegate の成果は capsule + bounded review で検査されるが、**packet 執筆・ファイル生成・統合という parent 自身の作業には対応する検査が無い。**orchestration が厳格なほどこの無検証地帯が相対的に大きくなる |

| **9** | 🔴 **SessionStart hook が mandatory owner を silent clip しながら「treat it as read」と指示する**(S008 実測) | template の hook は `clipped(handover, 200)` で、consumer の handover が 200 行を超えた瞬間に**その project で最も load-bearing な禁止事項が自動 cold start へ届かなくなる**。本 repo では 279 行中 79 行(Opus solo 禁止・S007 裁定全体・feedback queue・§5 baseline)が落ちていた。**selftest B9 は path しか見ないので全期間 green だった。**修正形(全量注入 + conditional manifest)と検出器(B69, bytes を behaviourally 検査、controls 3/3)は本 repo に実装済み |
| **10** | 🔴 **`read-load.sh` が hook 注入分を二重計上せず、実 context コストを過小報告する**(S008 実測) | hook が注入したファイルを `CLAUDE.md` §0 が mandatory read にも列挙していると、注意深い reader は同じ内容を 2 回払う。本 repo の実測では報告値 65,868 tok に対し実コスト 87,781 tok(**+33%**)。これは PT-10(proxy を量そのものとして報告)と同族で、**BUDGET_STATUS を構造シグナルとして使う設計の前提そのものを損なう**。修正は「hook 注入が mandatory read を満たす」と §0 に明記すること |
| **11** | 🟡 **`handover-diff.sh` と `local/README.md` §OPTIONAL CAPABILITY の間に実装ギャップがある**(S008 実測) | README は topic 分割時の義務 ①②③ を課すが、**template の `handover-diff.sh` は単一ファイル固定**であり、義務②(全 topic file を走査)を果たせる実装が無い。分割した consumer は「relocation が GONE として大量報告される」→「ノイズ扱いする」→「実際の loss も見逃す」という経路に入る。本 repo の owner-set 走査版と、その検出力 control(移設は損失でない / stub が残っても本文削除は損失 / 宣言 owner 欠落は exit 2)が実装参考になる |

| **12** | 🔴 **rule 13 は「handover を disk から再読込せよ」と命じるが、hook が同じ file を注入する構成を知らない**(S008 実測) | template の rule 13 §Step 2 は hook 機構より前に書かれており、hook 注入と mandatory disk read が併存すると **同一内容を二重に払う**。本 repo の実測では 21,913 est tok / 全体の 33%。consumer 側が `CLAUDE.md` §0 で specialise すると、今度は **rule と project instruction が正面衝突した状態**が残る。必要なのは rule 13 側に 「注入で取得済みの owner は再読込しない。GEN が食い違うときは disk が正」という一文であり、これは hook を持つ 全 consumer に効く。**Human 承認済み(2026-08-27)** |

| **13** | 🔴 **統合文書への falsification 義務が rule 22 に無い(既存 #7 の再確認・強化)** — **Human 未承認(2026-08-27 S009 で新規記録)** | S007 で 13 件、S009 で 12 件。**どちらも統合者の自己点検が捕まえた件数は 0**。2 セッション独立に同じ結果が出ており、**evidence を統合する行為には限定を外す構造的圧力がかかる**という一般的性質。consumer 全体に効く |
| **14** | 🟡 **delegation packet の contract 遵守(critical stop の逐語継承)を測る executable guard が無い** — **Human 未承認(2026-08-27 S009 で新規記録)** | rule 22 §Delegation packet と template 契約 2 が逐語継承を要求するのに、遵守を検査する機構が template 側に無い。本 repo では **5/5 不履行**が実測された(分母は「選ばれた inherited-stop の物理行」) |
| **15** | 🟡 **`context-brief.sh` に fail-open 面が 3 つある** — **Human 未承認(2026-08-27 S009 で新規記録)** | `CONTEXT_BRIEF_*` の path containment 無し · gitleaks 不在時は WARNING を足して続行 · `--out` の `cp` RC 未捕捉。template 由来の script であり export 面の安全性は全 consumer に効く。**🔴 ただし case DT-10 に従い、これらが「意図された設計か」は所有者へ未確認である — defect と断定していない** |

**同じ visit で共有する構造観察が 2 件ある**(本 repo が直せる defect ではない)。内容の owner は `sessions/S004_…md` §2。

