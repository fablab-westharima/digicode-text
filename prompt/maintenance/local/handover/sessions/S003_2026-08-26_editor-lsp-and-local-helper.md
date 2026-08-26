# S003 (2026-08-26) — Editor/LSP Technical Spike + Local LSP Helper Feasibility を連続実行し両方受理。commit 3本(docs×2 + close)。test 増減なし(製品コード未着手)。**新規 case 1 件 (DT-2)**、新規 rule なし

<!-- 配置: local/handover/sessions/S{NNN}_{YYYY-MM-DD}_{slug}.md。close 後は不変。 -->

**作成者: Claude Code (Opus 5)**

## §0. 目的の問い直し

全作業目的(16.md §0)は **「DigiCode を donor として選択移植しつつ、テキストコードを扱う digicode-text を作る」**。
S001 が donor を棚卸しし、S002 が Compiler の分離可否を実測した。**本セッションはその先の 2 つの空白を埋めた** —
**Editor / LSP をどう成立させるか**(donor 資産がゼロの領域)と、**その費用構造を誰が負うか**。

前進したのは「実装」ではなく **「Human が architecture を決められる状態」** である。
本セッション終了時点で、Human は Editor 方式・semantic analysis 方式・`.ino` vs `main.cpp`・
広告との両立可否・server 費用の実額・Local Helper の成立性を、**すべて実測値の上で**裁定できる。
実際に 2026-08-26 の製品裁定はその材料の上で下された。

## §1. 実施内容

**cold start** — `read-load.sh` → 必読集合(README §Core / rule 13 / rule 17 §Core / JMH Part 1 / 16.md / bug index)を読了。
baseline を実測(HEAD `49ea0ad` / selftest 75 passed RC=0 / placement 0 violations / 読み込み 47,330 tok)。
S002 が close 済みであることを GEN・sessions/・plans/completed で確認。sanity-check を報告し、GO を待った。

**Objective 1: Editor / LSP Technical Spike**(Human GO 受領、範囲限定)

1. plan `03_…md` を起票 → OSS landscape を**一次情報**へ格上げ(GitHub API / npm registry / license 本文)
2. `clangd-in-browser` のソースとビルドスクリプトを実読 → **wasm32-wasi sysroot 焼き込み**という未特定の障害を発見
3. デモの実配信を計測 → `clangd.wasm` **gzip 24.5 MiB**、`COEP: require-corp` + `COOP: same-origin` を実ヘッダで確認
4. 自作の最小 LSP stdio クライアントで native clangd を駆動 → multi-file の定義 / 参照 / シンボル / 補完を実測
5. `.ino` fixture を用意し、Arduino プリプロセッサの**実出力を diff** → 3 つの操作を特定。素の clangd が `.ino` を認識しないことを対照実験で確認
6. arduino-language-server 0.7.7 を実起動 → `referencesProvider: ABSENT`、`hierarchicalDocumentSymbolSupport` 非宣言時の **panic** を対照実験で特定
7. Chrome for Testing 148 で COOP/COEP/DIP を **negative control 付き**で実測 → **DIP なら広告と両立する**ことを確認
8. Monaco / CodeMirror を実ブラウザで起動し、実 clangd に WebSocket で接続 → bundle・起動・navigation・compile 診断 jump・AI 編集面を実測
9. evidence 9 ファイルを `investigations/2026-08-26_editor-lsp-spike/` へ永続化 → Acceptance 14/14 を報告して **STOP**

**Objective 2: Local LSP Helper Feasibility**(Human から新 GO 受領)

1. plan `04_…md` を起票 → **最重要未知数**(HTTPS ページから localhost へ Extension 無しで届くか)から着手
2. 自己署名証明書の SPKI を Chrome に許可して**本物の secure context** を作り、`CSP: treat-as-public-address` で**本番相当の public address space** を再現
3. permission の有無を **A/B 対照**で実測 → 未許可では Helper に 1 バイトも届かず、許可すれば fetch も WebSocket も通ることを確認
4. WICG 仕様と chromestatus で裏取り(Chrome 142 / WebSocket 147 / Firefox も shipping)
5. probe Helper(loopback bind / Origin 検証 / token)を実装し、**攻撃者オリジンで実際に叩いて**真理値表を取得
6. donor `DigiCode-Helper` を **READ ONLY** で監査 → axum ローカル API・Origin 許可リスト・4 プラットフォーム配布・minisign 自動更新という資産と、**署名 0 件 / `0.0.0.0` bind** という注意点を特定
7. Monaco → Helper → clangd の**ライフサイクル 5 フェーズ**(不在 / 起動 / 死亡 / 復活 / リロード)を、**前提条件を測定してから**実行
8. esp-clangd を取得し、**偽診断 0 件**に到達。`--query-driver` を外しても維持できることを確認(GCC 91.4 MiB 不要)
9. board pack の実サイズ、同時 8 セッションのメモリ線形性、VPS の**現在の実価格**を取得
10. evidence 9 ファイルを永続化 → Acceptance 17/17 を報告して **STOP**

**Human 裁定受領**(2026-08-26「Web 主軸・Desktop 対応方針の裁定」)→ 本 close。

**route/mode/lane**: `PRIMARY_MODEL_MODE = T1-solo`(既定)、`SESSION_ROLE = PRIMARY`(既定)、**delegation なし**。
両 objective とも成果物が測定そのものであり、delegate へ渡すと evidence が claim に劣化する(rule 04)ため、
**eligible task は 0 件**。zero delegation は decay ではなく期待値。

## §2. 状態変化

- **plan**: `03_editor-lsp-technical-spike.md` と `04_local-lsp-helper-feasibility.md` を起票し、**両方とも Human 受理を経て `completed/` へ移動**(active 0 / completed 4)。
- **investigations**: 2 ディレクトリ・**18 ファイル**を新規作成。
- **settled decisions**: 2026-08-26 の製品裁定を **§3 へ 8 項目追加** — AI 主機能 / LSP は必須でない・Web 版が主製品・server-side LSP を必須 backend にしない・Monaco 第一候補・内部標準 `main.cpp`・Desktop 版を正式に視野・Desktop target と未署名開発・Desktop での LSP 標準搭載方向・Local Helper 採否保留・production 実装へ進まない。
- **baton**: **解消 1 件**(baton 23 `.ino` vs `main.cpp` — 裁定 §4 が内部標準を `main.cpp` に確定し、§3 の settled entry が明示的に supersede)。**新規 7 件**(26 S003 probe コードは実装ではない / 27 Local Helper 採否保留 / 28 Board・Library bundle 境界 / 29 LSP なしで何ができるか / 30 教室 Local LSP Server / 31 enterprise policy 未取得 / 32 利用者ライブラリのヘッダ供給 / 33 donor の PNA 実装)。既存 baton 3・13・15・19・20・21・25 を裁定と実測で更新。
- **case**: 🔴 **新規 1 件 — `case DT-2`**(probe 欠陥 9 件、**すべて subject を実際より悪く見せる方向**、うち 4 件は draft findings へ到達していた)。Part 1 index に行を追加、Part 2 に本体を追加。case index **87 → 88**。
- **rule**: **新規 rule なし**。DT-2 の defense は既存 `04-testing-strategy.md` §When the acceptance criterion is an absence の **setup 側の隣**であり、rule 化するかは §3 の Warning 経由で baton 化していない — 下記 §3 参照。
- **CLAUDE.md**: §4 に 2 節追加(Web が主製品だが唯一ではない / LSP は製品の成立条件ではない)。§2・§3 は pointer-only のまま(current fact 0)。
- **bug**: 起案 0 / close 0(active 0 のまま)。
- **donor**: `DigiCode` / `digicode-compile-api` / `DigiCode-Helper` の 3 repo、**開始時と終了時で SHA 同一・dirty 0**。変更・commit・push・deploy・production 接続はすべて 0 件。

## §3. 自己評価

**✅ Healthy signs**

- cold-start protocol を完走し、baseline を**すべて実測**(転記 0)。`RC` はパイプを通さず独立行で取得。
- **測定条件を近似せず本物にした** — secure context を SPKI 許可で、public address space を CSP で再現。`https://localhost` で測っていれば別のものを測っていた。
- **negative control を先に置いた** — permission 未許可でブロックされること、SAB が undefined になること、ポートが空いていることを、肯定側の主張より先に測った。
- **自分の probe 欠陥 9 件をすべて自分で見つけ、結論に混ぜる前に潰し、evidence に明記した**(P-1〜P-5 / Q-1〜Q-4)。うち 4 件は誤った finding を Human の判断材料へ入れる寸前だった。
- **誤りを撤回した** — 「`.ino` は編集のたびに補完が壊れる」という draft finding を、切り分け後に**存在しない欠陥として明示的に訂正**した(`05` §3-2)。
- scope 逸脱なし。両 objective とも Acceptance 到達時点で STOP し、production 実装へ進まなかった。
- 裁定 §21 / §18 の「決めないこと」を守り、採用判断を一切書かなかった。

**⚠️ Warning signs — 全件、下記の処理を付けて閉じる**

1. **⚠️ Q-2: 本 objective の中心主張を、前提条件が満たされていない状態で測っていた。**
   → **(b) case 起票で処理**。`case DT-2` の中核事例として記録し、defense 1「precondition は arrange するのではなく measure する」を明文化した。
2. **⚠️ probe 欠陥が 2 objective で 9 件と多い。** 測定器の作り込みが速度優先だった。
   → **(b) case 起票で処理**(DT-2)。加えて DT-2 の forward application 節で、本 close 自身の gate 再実行に同じ規律を適用した。
3. **⚠️ DT-2 の defense が rule へ昇格していない。** 構造的な発見(instrument 欠陥は false negative へ偏る)だが、rule 化は本 close の scope 外。
   → **(c) acknowledged, not acting**。理由: rule 15 の decision tree に従えば common 層への追加であり、**それは `Project_Template` へのフィードバック候補**でもある(§7 / 別報告で 1 問確認する)。本 repo から template を編集することは §3 で禁止されている。case は本 session 内に書き切ってあるので、先送りされたものは無い。
4. **⚠️ clangd の background index が scratchpad 内の同名ヘッダを跨いで拾った (Q-4)。** go to definition が別 fixture を指すことがあった。
   → **(c) acknowledged, not acting**。理由: **probe 環境の副作用**であって製品側の性質ではない。`references` は一貫して対象内 3 箇所を返しており、結論はそちらに依拠している。evidence に probe artifact として明記済み。
5. **⚠️ Windows / Linux 実機・実 installer・実署名 / notarization・実 100 人負荷が未実施。** 導入 UX とコスト試算の一部は外挿である。
   → **(a) 16.md §2 のタスク行で処理**。baton 31(enterprise policy)を 🔴 で新設し、その他は `08_options-findings-and-next.md` §4 の `NOT OBTAINED` 一覧 + next-objective candidates M-3 / M-4 として、**consuming trigger 付き**で登録した。
6. **⚠️ 前 spike の 261 MiB/session をそのまま持ち越していたら、server 費用を半分に見積もっていた。**
   → **(a) 16.md §1 と §5 で処理**。補正値(ESP32 で ≈500 MiB、8 並列で線形)を「cold start が再導出してはならない事実」として記録し、前値がどの条件のものだったかも併記した。
7. **⚠️ 必読集合が allowance の 98% に張り付いている。** 本 session は §1 の事実リストを 2 objective 分増やした。
   → **(a) baton 25 で処理**(既存行を更新)。**削って下げることは禁止**なので、次 close で「独立した authority domain が生まれたか」を問う trigger として維持した。
