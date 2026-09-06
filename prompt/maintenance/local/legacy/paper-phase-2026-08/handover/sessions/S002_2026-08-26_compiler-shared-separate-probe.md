# S002 (2026-08-26) — Compiler Shared / Separate 実証 probe: Acceptance 10/10 受理、Human 裁定「Text 専用 Compiler を第一方針」。commit 2 本 (evidence 1 + close 1)、新規 rule/case なし

<!-- 配置: local/handover/sessions/S002_2026-08-26_compiler-shared-separate-probe.md。
     close 後は不変(書き換え禁止 — 訂正は後続セッションのファイルで行う)。 -->

**作成者: Claude Code (Opus 5)**

## §0. 目的の問い直し

全作業目的 (16.md §0) は「DigiCode を donor として選択移植しながら、テキストコード中心の Web アプリを作る」こと。
本セッションが前進させたのは、その**最初の技術的分岐**である。

S001 の監査は「Compile API は Blockly 前提で、任意 multi-file を受ける口が無い」ことまでを static に確定させ、
「additive な新 endpoint なら Classic に無影響」を**仮説のまま**残した (P-1)。仮説のままでは
Shared / Separate を裁定できず、architecture 全体が止まる。本セッションはこの一点を**実測に変えた**。

結果として、Human は「Text 専用 Compiler を第一方針とする」と裁定した。つまり本セッションは
「共用できるか」を証明したうえで、**共用しないという判断の根拠**を提供したことになる。
技術的可否と製品判断は別物であり、その分離が成立したことが成果である。

## §1. 実施内容

1. **cold start** (rule 13)。`read-load.sh` のレンジ指示に従い必読集合を全読 (44,255 tok / allowance 48,000、7/7)。
   HEAD `09a0d29` / tree clean / `origin/main` と 0-0 / selftest 75 passed 0 failed RC=0 を実測。
   donor 2 リポジトリの SHA が S001 監査の固定値と一致・dirty 0 を確認。`PRIMARY_OBJECTIVE = UNSET` を確認して **STOP・報告**。
2. **Human が新 PRIMARY_OBJECTIVE を宣言 + HUMAN GO**「Compiler Shared / Separate 判断に必要な実証調査」。
   route 決定を 1 行で宣言: **solo (Route A)** — evidence の型が delegate 経由で claim に劣化するため (rule 04 / rule 22)。
3. **donor 実装の全読** — `digicode-compile-api` の `src/*.ts` 1,453 行 + Dockerfile + `compile-proxy-worker/src/index.ts`。
   grep ヒット数ではなく実装を読んだ (CLAUDE.md §6)。
4. **probe 環境構築** — isolated clone (`git remote remove origin` で push 先を構造的に消去) +
   使い捨てコンテナ `dt-probe-api` (127.0.0.1:3999)。既存の停止済みコンテナ `goofy_hugle` は未接触、image の build/pull は 0。
5. **Classic BEFORE 基準線**。初回は 91 秒で失敗 — `UnknownPackageError: gin66/FastAccelStepper @ ^0.32`。
   ここで「環境が悪い」と即断せず、registry 到達性 (HTTP 200) と **47 registry エントリ全件**を PIO 自身の
   `PackageSpec` で突合し、**donor 側の事実 (0.32.x が registry から消滅、47 件中 1 件のみ)** と確定。
   環境 deviation **D-1** として isolated clone のみ `^0.34` に読み替え、BEFORE/AFTER 双方に同一適用。
   → cold 301 秒で firmware 1,350,288 B / sha256 `46a089bd…` を取得。
6. **additive Text 経路の実装** — 新規 4 ファイル 593 行 + `server.ts` に **3 行追加 / 0 行変更**。
   `tsc --noEmit` RC=0。既存 6 ファイルの差分 0。
7. **probe 実行** — A (main.cpp) / A2 (.ino) / B2 (3 ファイル) / B3 (5 ファイル) / C (image 内蔵 lib) /
   ERR (非 main ファイルのエラー) / TEXTLIB (Text 専用 lib) / TEXTBOARD (Text 専用 FQBN) / TRAVERSAL (拒否確認)。
8. **Classic 回帰判定** — AFTER と FINAL で artifact 4 点が BEFORE とバイト一致。
   **さらに対照実験**: Classic のソースを 1 行変えると、サイズ不変のまま sha256 が変化 → 比較器に検出力があることを実証。
9. **分離の実証** — marker 文字列 (positive control 付き) / 名前空間衝突攻撃 / 並行 3 シナリオ /
   build cache の共有 vs 専用の定量 / Worker の isolated 実行 (上流 fetch を stub 化)。
10. **evidence 永続化** — `investigations/2026-08-26_compiler-shared-probe/` 7 文書。commit `06db85f` (gitleaks clean)。
    **Acceptance 10/10 を報告して STOP**、次 objective は選ばず。
11. **Human が Acceptance を受理 + Compiler 方針を裁定**。probe container 削除 (§12 の許可)、close へ。

## §2. 状態変化

- **PRIMARY_OBJECTIVE**: `Compiler Shared / Separate 実証調査` → 受理 → **`UNSET`**。
- **plan**: `plans/active/02_…md` を起案 → 全 Acceptance 達成 → `plans/completed/02_…md` へ移動。active 0 / completed 2。
- **settled 追加 (16.md §3)**: 🔴「**digicode-text は専用 Compiler を持ち、Classic 稼働 Compiler への相乗りは第一候補から外れる**」
  (2026-08-26 Human 裁定)。donor 技術は積極流用、Classic 固有構造は非継承、full-source / multi-file が正規入力、
  Text 専用 dependency / registry universe が第一候補。**S001 の「Shared/Separate は未決、測るまでそのまま」を supersede**。
  同時に「これは direction であって architecture ではない」という境界も裁定に含まれる。
- **baton 追加**: 21 (Text Compiler architecture 未決 — 11 項目を Human の逐語で列挙) /
  22 (F-A は donor 側 maintenance issue、**Text 側では直さない**、failure evidence として使う) /
  23 (`.ino` vs `main.cpp` 未決、Editor/LSP spike 後に Human が決定) /
  24 (probe コードは production 実装ではない)。
- **baton 更新**: 19 を「監査の findings」から「**evidence がその要約を上回る**」へ拡張し、S002 の成果物も対象に含めた
  (handover-diff が GONE と報告したのはこの再文言化であり、行そのものは同一 id で存在する)。
  17 に事実誤り 1 件を追加 (企画書 §21 の pioarduino 記述)。2 / 6 の trigger 記述を S002 の実測込みに更新。
- **bug**: 起案 0 / close 0 (active 0 のまま)。
- **新規 rule / case: なし。** 本セッションに判断ミス・ユーザ訂正・ルール違反は発生していない。
  手戻りは 2 件とも軽微な技術的欠陥 (fixture の `LED_BUILTIN` 未定義、harness の ESM 設定) で、
  いずれも計器が即座に検出し、誤った主張は 1 件も出していない。
  D-1 の切り分け (probe 環境の失敗を donor 側の事実と確定させた手順) は case 化の価値がある候補として
  Human へ提示したが、incident ではないため**独断では case index に追記していない**。
  裁定は得られていないので、`01_probe-environment-and-commands.md` §3 に**方法として**残してある。

## §3. 自己評価

**✅ Healthy signs**

- cold start を完走し、`PRIMARY_OBJECTIVE = UNSET` を確認して**一度 STOP した**。候補 6 件から自分では選ばなかった。
- baseline / selftest / donor SHA をすべて**実測**。前セッションの close report を転記していない。
- 「Classic を壊していない」を存在確認ではなく**バイト比較**で示し、さらに**比較器の検出力を対照実験で証明**した。
- 「依存が漏れていない」を **positive control 付き**で示した (検出器が一度も PRESENT を返さなければ absent は無意味 — rule 04 §absence)。
- 環境 deviation (D-1 / D-2) を**隠さず明記**し、比較の前提として成立することを説明した。
- 初回の compile 失敗を「環境のせい」と即断せず、47 件全件で切り分けた (Pattern A / B の回避)。
- production 非接触を、宣言ではなく**開始時と終了時の donor SHA + dirty の実測**で示した。
- 裁定 §18 の scope 拡大禁止を守り、実装したくなったもの (registry 再設計 / Editor / production 実装) を
  finding・proposal・candidate へ回した。Acceptance 達成後に追加作業へ進んでいない (rule 24)。
- Shared / Separate を**自分で決めなかった**。Option 比較の各セルに [測]/[推]/[未] を付け、推論を実測と混ぜなかった。

**⚠️ Warning signs → 全件、放置せず処理済み**

| Warning | 処理 |
|---|---|
| 実機書き込み 0 件 — artifact の形は Classic と一致したが「焼けること」は未検証 | **(a) baton 化**: 16.md §2 baton 2 (compatibility / acceptance matrix) が実機確認の owner。`05_…md` R-3 に [未verify] として明記 |
| 測定はすべて小さな fixture (ソース 297〜971 B) で、実運用規模の挙動は未知 | **(a) baton 化**: baton 21 の architecture objective が SSE 要否と併せて扱う。`05_…md` R-2 / 04 §5-3 に残 unknown として登録 |
| probe コードは production 実装ではない (auth / rate limit / quota / cleanup / サイズ上限がすべて無い) | **(a) baton 化**: **baton 24 を新設**し、trigger を「誰かがあの file を出発点にしようとした瞬間」に設定 |
| Cloudflare の実 size / timeout 上限は未測定 (stub 上流での検証) | **(c) 承知のうえ不作為**: production 非接触が裁定 §3 の禁止事項であり、測るには production 接続が要る。`04_…md` §5-1 に残 unknown として登録 |
| `projectLock` はプロセス内のみ — 複数プロセス運用は未保護 | **(a) baton 化**: baton 21 の architecture objective の設計項目。`05_…md` F-G |
| commit `06db85f` を push しないまま報告した (case PT-20 の形に近づく) | **(c) 承知のうえ**: 報告時に「commit 済み・**push していない**」と明記し、`git rev-list` の 0/1 を根拠として示した。close の step 8 で push する |

**残る自己疑い (次セッションへの申し送りではなく、記録)**: Option A / B2 / C は**推論**であり、実測は B1 のみである。
比較表のセルに型ラベルを付けたのはそのためで、**推論を実測と同じ強さで読まないこと**。
