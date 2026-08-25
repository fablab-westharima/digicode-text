# 01_donor-inventory-audit — DigiCode Donor Inventory / Audit

<!-- 配置: local/plans/active/01_donor-inventory-audit.md (rule 15 / local/README.md §plans)。
     完走したら plans/completed/ へ移動。この計画は「調査」であって実装ではない。 -->

| 項目 | 内容 |
|---|---|
| 起案日 | 2026-08-26 |
| 起案契機 | 2026-08-26 Human 裁定 + HUMAN GO「PRIMARY_OBJECTIVE = DigiCode Donor Inventory / Audit」 |
| 起案者 | Claude Code (Opus 5) |
| ステータス | 🟢 GO済・進行中 |
| 想定Phase数・工数 | 6 Phase / 試算 3-5 session (完走時に実績を追記) |
| 先行依存 | なし (Project Template 適用は S000 で完了済み) |
| 後継計画 | Architecture Decision (次 objective 候補。本計画は候補を記録するだけで、着手しない) |

## ⚡ 30秒で把握

既存 DigiCode を **READ ONLY** で調査し、各既存機能を「そのまま流用 / 改修流用 / Text では不要 / 新規実装必要 / 追加調査必要」の 5 分類へ振り分けられるだけの実装事実・依存関係・リスクを把握する。
**やらないこと**: DigiCode Text の本番実装、architecture の確定、DigiCode / Compiler / Docker / Cloudflare / production への一切の変更、Editor の本番実装。
完了したら STOP して Human へ報告する。発見した関連事項は finding / risk / proposal / next objective candidate として記録し、自動的に着手しない。

## 1. 経緯 + 動機

founding use case (2026-08-26 Human 裁定、逐語):

> **DigiCode の既存構造・実装を出発点として調査し、Text 化に伴って何を残し、何を外し、何を変更するかを判断する。完全な新 architecture を先に設計してから DigiCode を当てはめることはしない。**

企画書 v0.2 §33 の「DigiCode Text の構造を先に決め、その構造へ DigiCode を無理に当てはめない」は字義どおりの「新 architecture を先に設計する」意味ではない、と裁定された。企画書側の該当表現は**今後の修正対象**として扱う (本計画では企画書を書き換えない — 原本は user 所有)。

最重要原則 (企画書 v0.2 §33 / 後編 §25 より、裁定と整合する部分):

- まず完成済み DigiCode を読む
- 流用できるものは積極的に流用して楽をする。ただし闇雲な流用はしない
- DigiCode にあるという理由だけで Text に不要な負債を持ち込まない
- 新規プロジェクトだからという理由で、DigiCode で解決済みの問題を再発明しない
- 「動くはず」ではなく「実際に動かして確認する」

## 2. 既存実装・現状の調査

**本リポジトリ側**: アプリケーションコードは 0 行 (baseline 実測 2026-08-26: typecheck/lint/test = 不在、HEAD `5752897`、selftest 75 passed / 0 failed RC=0、placement-scan CATEGORIES=8 VIOLATIONS=0 RC=0)。

**donor 側**: 未着手。**この時点で donor リポジトリは一度も開いていない。**
引き継ぎ書前編 §4 に記載された Codex 調査結果 (compile-api が ESP32 library を全 target へ付与 / ESP32 partition·binary packaging が hard-coded / Docker に ESP8266 toolchain なし / templates が ESP32 固有 / 73 block generator が ESP32 API 依存 / RP2040 追加の断念前例 / AI block proposal が board を無視する settled design) は、**他セッションの調査結果の引用であり本計画にとっては未verify**。Phase 2 で自ら確認するまで確定として扱わない (Pattern C 対策)。

## 3. 設計判断点 (Decisions for user)

| # | 判断点 | 選択肢 | 推奨 | user 判断 |
|---|---|---|---|---|
| 1 | donor リポジトリの所在 | A: ローカル clone 済みパスを指定 / B: GitHub URL を渡し repo 外へ isolated clone | A (ネットワーク取得が発生せず、対象 SHA が固定される) | **未回答 — Phase 1 の blocker** |
| 2 | CLAUDE.md §4 の暫定 out of scope「AI コーディングエージェントを製品の必須機能にすること」の削除 | A: 本 objective と同時に修正 / B: 後回し | A (毎セッション自動読込されるため、放置すると矛盾した指示を保持し続ける) | **未回答** |
| 3 | 監査成果物の配置 | A: `local/investigations/2026-08-26_donor-audit/` にクラスタ別分割 / B: 単一ファイル | A (30 項目 × 14 属性は単一ファイルに収まらない。rule 15 §Sub-folder organization が許可する形) | (本計画の Phase 0 で採用、異議があれば変更) |

## 4. Phase 分割

| Phase | Task | Severity | 完了条件 (機械検証可能な形) | 状態 |
|---|---|---|---|---|
| 0 | 監査枠組みの確定 — 成果物の骨格・**証拠契約**・分類語彙を先に固定する | 🔴 | `investigations/2026-08-26_donor-audit/00_index.md` が存在し、30 調査対象すべてが行として列挙され、全行の verdict 列が `未調査` である | ⬜ |
| 1 | donor 取得と全体地図 — repo 構造 / 言語 / ビルド系 / 依存 / 規模 / 対象 commit SHA の固定 | 🔴 | `01_overview.md` に donor repo・**commit SHA**・取得方法・トップレベル構造・依存マニフェストの実測が記録されている。SHA は以後すべての証拠行に付く | ⬜ |
| 2 | クラスタ別深掘り (A〜G、下表) | 🔴 | 各クラスタファイルの全項目が 14 属性を埋め、各主張に `path:line` + SHA が付く。埋まらない項目は `追加調査必要` として理由付きで残す | ⬜ |
| 3 | 横断分類とリスク — Classic 固有依存 / Text 化で不要になる機能 / Compiler 共用可否の判断材料 | 🔴 | `00_index.md` の verdict 列が 5 分類で全行埋まる。`未調査` が 0 行 | ⬜ |
| 4 | Editor / LSP の OSS 調査 (**donor 非依存・並行実行可**) | 🟡 | `08_editor-lsp-survey.md` に候補ごとの比較表 (要求 13 項目 × license / 保守状況 / 導入重量 / server 依存 / browser 依存 / Chromium 相性 / 組み込み粒度) | ⬜ |
| 5 | 第三者資料の安全な配置調査 (**donor 非依存・並行実行可**) | 🟢 | `09_third-party-material-placement.md` に、rule 15 と整合し git 管理対象外で参照できる配置案が候補比較付きで提示されている | ⬜ |
| 6 | 統合レポート + next objective candidates → **STOP** | 🔴 | `10_findings-and-next.md` に finding / risk / proposal / next objective candidate が severity 付きで分離記録され、実装へ進んでいない | ⬜ |

### Phase 2 クラスタ割り (裁定の調査対象 30 項目を漏れなく配分)

| クラスタ | ファイル | 含む調査対象 |
|---|---|---|
| A | `02_frontend-ui.md` | Frontend / UI shell / **Blockly との結合点** |
| B | `03_ai.md` | AI / AI API key / AI dictionary·context / Sample code |
| C | `04_registries.md` | Board registry / Device registry / Library registry |
| D | `05_compile.md` | Compile API / Cloud Compiler / Local Docker Compiler / Docker image / PlatformIO·platform 構成 |
| E | `06_write-and-serial.md` | WebUSB / BLE OTA / Serial Monitor / Serial Plotter |
| F | `07_storage-and-settings.md` | Storage / Autosave / Import·Export / Settings |
| G | `08_ops-security-tests.md` | Error handling / Security / **secret·commit·push protection** / Cloudflare·deployment / Tests |
| H | (Phase 3 で `00_index.md` へ集約) | Classic 固有依存 / Text 化で不要になる可能性がある機能 |

### 各項目に記録する 14 属性 (裁定が指定した形式)

現在どう実装されているか · 主な caller · 主な callee · dependency · persistence / data model · frontend↔backend coupling · **Blockly coupling** · auth/payment coupling · **Compiler coupling** · Classic への影響 · verdict (そのまま流用 / 改修流用 / 不採用候補 / 新規実装必要 / **追加調査必要**) · 判断根拠 · 証拠 (`path:line` + SHA) · 残リスク

### 証拠契約 (rule 04 / CLAUDE.md §9 migration evidence)

- すべての事実主張に **donor repo + commit SHA + path (+ 行範囲)** を付ける。付かない主張は「推測」とラベルする。
- 検証の型を明示する: 静的読解 / grep / 実 compile / 実機。**実機は user の手が要る** — 私の側では実施できないので、必要な行は分離して user 確認項目として立てる。
- probe を行った場合は再現コマンドと結果を記録する (前編 §7 の ESP8266 probe のように、記録のない実測値は次セッションで再測不能になる)。

## 5. 完了条件 (計画全体)

- [ ] 30 調査対象すべてに verdict が付き、`未調査` が 0 行
- [ ] 全事実主張に SHA + path が付いている / 付かないものは推測とラベルされている
- [ ] Compiler 共用可否の**判断材料**が揃っている (可否そのものは確定しない — 裁定 §4「現時点で共有・分離を確定しないでください」)
- [ ] Editor / LSP OSS 候補の比較表がある (採用は決めない)
- [ ] 第三者資料の配置案が提示されている (置き場所の最終判断は user)
- [ ] **donor / Compiler / Docker / Cloudflare / production への変更が 0 件**であることを示せる
- [ ] finding / risk / proposal / next objective candidate が分離記録されている
- [ ] STOP して Human へ報告した

## 6. 引き継ぎメモ

- 本計画は **調査 objective** であり、完了しても実装 GO にはならない (裁定「GO は明示された PRIMARY_OBJECTIVE の範囲だけに対する作業許可」)。
- Phase 4 / 5 は donor 非依存なので、判断点 #1 (donor 所在) が未回答でも実行できる。**Phase 1〜3 は blocker あり。**
- 現在地の canonical owner は `handover/16_次セッション引き継ぎ指示書.md` §1/§2。本ファイルには進捗の二重管理を書かない。
