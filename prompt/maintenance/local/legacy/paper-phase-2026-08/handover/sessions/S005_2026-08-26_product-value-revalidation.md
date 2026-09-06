# S005 (2026-08-26) — Product Value Revalidation(Acceptance 15/15、Human 受理)。real-fire 0・production 変更 0・新規 rule/case なし。commit 1 本、次目的は UNSET

**作成者: Claude Code (Opus 5)**

## §0. 目的の問い直し

全作業目的(16.md §0)は「DigiCode を donor として技術資産を選択移植し、ブロックエディタに依存しない
テキストコードの MCU 開発 Web アプリを作ること」である。S001–S004 は **donor に何があるか**と
**技術的に何が成立するか**を積み上げてきた。本セッションが前進させたのは、その手前にある問い —
**「そもそもなぜ作るのか」** である。

2026 年には Arduino Cloud Editor があり、Codey Online は「AI が書く → クラウドでコンパイル →
Web Serial でブラウザから書き込む」を既に提供している。**その環境で digicode-text に独自価値があるか**を
ゼロベースで問い直し、**今後の設計判断の評価軸を明文化できるだけの事実と比較材料**を揃えた。

## §1. 実施内容

1. **cold start(rule 13)** — `read-load.sh` の `Read limit:N` に従って必読 7/7、selftest **75 passed / 0 failed**(`RC=0` 独立取得)、baseline 実測、origin 同期確認(`202eba0` = `origin/main`)。**handover との乖離 0 件**。
2. **Human GO を受領**(調査・比較・評価の範囲のみ。production implementation GO ではない旨が指示に明記)。
3. **内部 evidence の再読** — S001 donor-audit(AI / registry / frontend-Blockly 結合 / findings)、S002 compiler probe、S003a/b の findings と実測値を入力として読解。
4. **外部一次調査(2026-08 時点)** — PlatformIO 公式 docs(Package Specifications / settings / cache_dir / lib_extra_dirs)、platformio-core issue #5062、pioarduino releases、arduino-cli issue #3073 / #1772、arduino-ide issue #122、Arduino Cloud / Create Agent、Espressif の ESP-IDF offline installer、Chrome LNA(developer.chrome.com)と `LocalNetworkAccessAllowedForUrls`(Microsoft Learn の設定手順)、VS Code Marketplace ToU、GitHub Copilot allowlist、Codey Online 製品サイト。
5. **反証仮説 B の検証**(Human 指示 §8)— 「既存 IDE を完全 offline bundle にすれば digicode-text は不要ではないか」を、**成立する側から先に**書いたうえで、成立しない 4 点(依存の推移閉包 / 配布の合法性 / 更新 / 維持責任の所在)を一次情報で特定した。
6. **成果物 9 ファイルを執筆** — `investigations/2026-08-26_product-value-revalidation/`。Acceptance 15/15 を `08_conclusion-and-next.md` で充足。
7. **完了報告 → STOP**(Human 指示 §25)。production 実装へ進まず、次 objective も開始しなかった。
8. **Human が結果を受理**し、製品裁定 13 件 + read-load WARNING の受容 + 次 objective 第一候補の記録を指示 → 本 close。

**GO の取得点:** ① 調査 objective の GO(セッション冒頭)② 受理と close の GO(調査完了報告のあと)。
**この 2 点以外に作業を広げていない** — production 変更 0、donor 変更 0、実装 0。

## §2. 状態変化

- **plan:** `plans/active/06_product-value-revalidation.md` を起案 → 完走 → `plans/completed/` へ移動(active 0 / completed 6)。
- **investigations:** `2026-08-26_product-value-revalidation/`(9 ファイル)を新設。16.md §1 の evidence owner 表に行を追加。
- **settled decisions(§3)に 9 件追加** — 製品中核価値の確定 / 1 文定義 / Web 版価値の言い直し / Block 製品分担 / Managed Environment Registry が次の中核 / Verified・Custom 二層構造 / Custom→Verified 昇格経路 / Registry 管理を人力前提にしない(+ AI 自己申告を evidence にしない)/ 全組み合わせ保証へ戻らない / read-load WARNING の受容。
- **baton 新設 4 本** — 34(Desktop の価値は Compiler の置き場所で二分される)/ 35(AI 主機能と企業イントラの衝突)/ 36(debugger 未議論)/ 37(直接競合 Codey Online)。
- **baton 更新 2 本** — 25 は Human 受容により 🔴→🟡(trigger と選択肢は維持)、31 は文献レベルで解決し 🔴→🟡(**実挙動は未verify**)。
- **§3 の復旧 1 件** — `handover-diff.sh` が「製品仕様 / 対象範囲 / 完了条件 / 互換範囲は暫定」の裁定を **GONE** と検出。**LOST と分類して書き戻した**(S005 で部分的に settled になった旨を追記)。**この検出が無ければ静かに落ちていた。**
- **CLAUDE.md §4** に中核価値の段落を追加(invariant 側の anchor。current fact は書いていない)。
- **🔴 新規 rule / case なし。** 本セッションに判断ミス・手戻り・user 訂正・rule 違反は発生していない。
  (`08_conclusion-and-next.md` §12 に self-check を記録済み — Pattern A/B/C の該当リスクは
  結論の書き方そのもので相殺し、DT-2 の裏返し(自社製品に有利な方向へ器材が偏る)にも
  「既存環境の弱点ではなく digicode-text の弱点から書き始める」という形で対処した。)

## §3. 自己評価

**✅ Healthy signs**

- cold-start protocol を完走。selftest / baseline / placement-scan を**実測**し、`RC` をパイプ経由でなく独立取得した。
- **型ラベルを全主張に付けた** — primary source / secondary source / inherited real-fire / inferred / NOT OBTAINED。
  「本調査は real-fire を 1 件も行っていない」を最初に明記した。
- **反証仮説を本気で扱った。** B が技術的に成立すること、Espressif が実際に offline installer を出荷していることを
  先に書いてから、成立しない理由を規約・依存閉包・更新の 3 点に**限定**した。
- **競合を過小評価しなかった。** Codey Online を「価値仮説に最も近い既存製品」として 🔴 で記録し、
  baton 37 と next-objective 候補 V-4 に登録した。都合の悪い事実を findings に埋めていない。
- **Go 結論を無条件にしなかった。** No-Go 側の論拠 4 本を同じ強さで並べ、条件 A / B を付けた。
- **scope 逸脱なし。** production 変更 0、donor 変更 0、次 objective 未着手、read-load 構造変更 0。
- `handover-diff.sh` の GONE 3 件を分類し、**LOST 1 件を close 前に復旧**した。

**⚠️ Warning signs → 全件を処理済み(prose のまま残していない)**

| # | Warning | 処理 |
|---|---|---|
| W-1 | **競合 3 製品(Codey / Arduino Cloud / Wokwi)を実利用していない。**「体験は同等」は製品サイトの記述に基づく | (a) **baton 37 に登録**(owner: User、trigger: 競合実査 objective または企画書改訂)+ V-4 候補 |
| W-2 | **企業イントラの遮断実態と LLM API の到達性が推論。** 最有効セグメントの主機能に関わる | (a) **baton 35 に登録**(owner: User、trigger: architecture objective / 企業向け提案の作成時) |
| W-3 | **Chrome enterprise policy は文献確認のみで実挙動が未verify** | (a) **baton 31 を更新して trigger を維持**(🔴→🟡、「実配布して許可が付くことの確認」は Helper を含む option が採られる時点) |
| W-4 | **Arduino Cloud の「無料 25 コンパイル/日」は一次ページが 403 で、検索結果の引用に留まる** | (c) **acknowledged, not acting** — 結論(Go)はこの数値に依存していない。`08` §9 の unknown に「再取得が要る」として記録済み |
| W-5 | **「保証を売っている既存製品が無い」は不在の証明であり弱い。** 網羅探索はしていない | (c) **acknowledged, not acting** — `08` §9 に弱い証拠として明記。rule 04 §absence の趣旨どおり、**強い主張には使っていない** |
| W-6 | **Cloud Compiler の 1 コンパイルあたり実コストが未測定。**「基本無料」前提と衝突しうる | (a) **`08` §8 R-7 に risk 登録** + V-6 候補。**baton 化はしない** — Compiler architecture(baton 21)の内側の問い |

**未verify のまま残した項目は、すべて `08_conclusion-and-next.md` §9 の `NOT OBTAINED` 表(11 項目)が owner である。**
