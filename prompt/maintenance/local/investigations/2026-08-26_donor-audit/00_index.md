# 00_index — DigiCode Donor Inventory / Audit 分類マトリクス

**donor SHA (固定):** `DigiCode` = `bb35c3b8025610299bf952c2c45eda2196a07401` (branch `main`, clean) / `digicode-compile-api` = `3376746f1e5a4ca039e0cade279741f16612fccf` (branch `main`, clean)
**調査期間:** 2026-08-26 (Session 001) / **調査方式:** READ ONLY 静的読解 + grep + 公開情報検索
**donor への変更・commit・push・履歴操作:** **0 件**

**verdict の語彙 (裁定 §17):** ①そのまま流用可能 / ②改修流用 / ③Text では不採用 / ④新規実装が必要 / ⑤追加調査必要

> **検証の型 (rule 04):** 本監査は全項目 **static (ソース静的読解)** である。**実 build / 実 compile / ブラウザ表示 / 実機書き込みは 1 件も行っていない。** 性能値・passRate 等の数値は donor 側ドキュメントの記載であり、再現していない。

---

## Frontend / UI (詳細: `06_frontend-ui-and-blockly-coupling.md`)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| Application shell / layout / `components/ui` (shadcn 21) | ① | Blockly 非依存 |
| routing (react-router) | ② | ProtectedRoute 系を落とす |
| Board selector (experimental バッジ込み) | ① | Blockly 非依存、可視性フィルタの precedent |
| Device selector | ⑤ | Classic の "Device" は **OTA 対象機器**であり sensor registry ではない |
| Blockly workspace / toolbox / theme / contrast / messages | ③ | Blockly 専用、6 ファイルに局所化 |
| Code preview | ② | Text では編集対象そのものになる |
| Error / status 表示 | ① | |
| Settings 各種 | ① | |
| i18n 5 言語 | ② | 仕組み流用・文言入替 |
| AI UI | ② | 出力が XML 前提の箇所のみ改修 |
| auth / class / 課金 / passkey / 2FA UI | ③ | 裁定・企画とも不採用で一致 |
| PIN assignment UI | ③ | コードを正本にする方針 |
| Servo reverse / speed / Block 専用補助 UI | ③ | Blockly 由来 |
| Servo Trim / PID tuning / USB utility / device diagnostics | ⑤ | 実機価値の再評価が要る |

## AI (詳細: `03_ai.md`)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| provider 抽象 (openai/anthropic/gemini/custom) | ① | |
| API key = user 自身のもの / localStorage 保存 / ブラウザから provider へ直接 | ① | 企画方針と donor 実装が一致。backend proxy なし |
| auth / subscription との coupling | — | **AI 経路には存在しない** (Classic を落としても AI は成立) |
| 辞書パイプライン (生成 JSON を実行時 fetch → prompt 整形) | ② | 構造流用・中身入替 |
| `block-catalog.json` (379KB, 生成物) | ③ | 中身が block 定義 |
| few-shot selector + sampleProjects | ② | |
| generate → validate → retry orchestrator | ② | 骨格流用、検証器差し替え |
| `xmlValidator` / `semanticValidator` / `blocklyDryRun` | ③ | Blockly XML 専用 |
| project-aware AI (multi-file / related-file / diff / patch) | ④ | **donor に前例なし** |
| compile error 修正ループ | ⑤ | 経路を特定できず |
| 外部コード解析 → 変換 | ⑤ | 実装を特定できず |

## Board / Device / Library registry (詳細: `04_registries.md`)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| `BoardDefinition` スキーマ (capability flag / flash method / experimental) | ① | |
| `experimental` による可視性フィルタ | ① | 「Text で可視・Classic で非表示」の precedent |
| category 5 flag による toolbox フィルタ | ③ | toolbox は Blockly の概念 |
| `blockBoardGuards` (block 単位 guard) | ② | Device グレーアウトに対応する考え方 |
| Board registry の 2 リポジトリ手書き重複 (frontend 16 board / compile-api 10 FQBN) | ④ | 単一正本化が「軽い Board 追加」の中身 |
| Device → Library → include の対応データ | ④ | **機械可読な形で存在しない**。ただし block 69 ファイルから抽出できる可能性 |
| AI 辞書の生成スクリプト方式 | ② | 「registry から辞書を生成する」構造は正しい |

## Compile (詳細: `05_compile.md`)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| Docker image / toolchain (PIO 6.1.19 + pioarduino + Python pin + warmup cache) | ① | Text も同じ ESP32 toolchain が要る |
| `boards.ts` の FQBN→PIO 写像 | ① | |
| cache key 設計 (`v3` + platform + board + template + source + flags + libDepsHash) | ① | 設計思想が正しい |
| vendored libs (NeoPixel / ESP32Servo / NimBLE / NimBLEOta / DigiMotion 系 4) | ② | 競技ロボ向けの要否は Text の範囲次第 |
| `POST /api/compile` の **fragment 契約** | ③④ | **任意 multi-file を受け取る口が無い** |
| `.ino` テンプレート 4 種 | ③ | 製品ロジック内包、ユーザの setup/loop 前提でない |
| `projectStore` の単一 `src/main.ino` | ④ | multi-file 不可 |
| グローバル `lib_deps` (全ビルド共通) | ④ | **Classic 悪影響の実証済み経路** |
| `projectLock` (プロセス内直列キュー) | ⑤ | 分散ロックではない。複数プロセス運用時の保護は未確認 |
| `compile-proxy-worker` (CORS + failover、auth/rate limit なし) | ② | Text 用に別 Worker を立てるのが素直 |
| Local Docker 配布 (`docker-compose.local.yml` + `digicode-installer`) | ⑤ | installer 未読 |
| deploy スクリプト群 | ⑤ | 未読 |

## Write / Hardware (詳細: `07_write-serial-storage.md`)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| USB 書き込み (esptool-js + **Web Serial**) | ① | **WebUSB ではない** |
| BLE OTA (Web Bluetooth + NimBLEOta + CRC16 + チャンク) | ① | プロトコル実装そのものが資産 |
| Serial Monitor / Plotter (Web Serial) | ① | |
| Wi-Fi OTA 実装一式 | ③ | 初期不採用方針 |
| `helperService` + DigiCode-Helper (localhost:31415, mDNS) | ③ | Wi-Fi OTA 不採用なら落とせる |
| USB driver 案内 | ⑤ | 未読 |

## Storage / Project (詳細: `06` §3, `07` §5)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| プロジェクト保存 (**サーバ D1 の `blockly_xml`、auth 必須**) | ④ | **企画書の「DigiCode もローカル保存中心」は donor の実態と異なる** |
| autosave / crash recovery | ④ | **donor に実装 0 件** |
| IndexedDB / OPFS / File System Access API | ④ | **donor に使用例 0 件** |
| `.digicode` JSON の import/export | ② | multi-file 化で形式が変わる |

## Security / Operations (詳細: `08_security-ops-tests.md`)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| `.gitleaksignore` fingerprint 台帳 (+ FP 判定は user 確認必須の運用) | ① | |
| pre-commit gate | — | digicode-text に既存 (テンプレート由来) |
| 内部文書を `.gitignore` で丸ごと除外する方針 | ③ | digicode-text は逆の選択を確定済み |
| CI secret scan | ④ | **donor に存在しない** |
| `docker-publish.yml` (ghcr + Docker Hub) | ② | |
| Cloudflare 構成 (Pages + Workers + Tunnel + Railway backup) | ⑤ | deploy スクリプト未読 |

## Tests / QA (詳細: `08` §3)

| 対象 | verdict | 一行根拠 |
|---|---|---|
| vitest 構成 (jsdom)、tracked テスト 77 件 | ② | |
| probabilistic-debug の orchestrator / compile-client / result-store / analyzer / reporter | ① | **生成器非依存の QA 基盤** |
| ケース生成戦略 5 種 (singleton/edge/matrix/pair/template) | ② | 概念流用、生成対象が変わる |
| `experimental` を passRate の分母から外す設計 | ① | |
| failure corpus の実データ | ⑤ + **Human 裁定候補** | 記録が donor の非公開 governance 領域にある |

## Classic 固有機能の再評価

| 対象 | verdict |
|---|---|
| Blockly / generator / palette / Code→Block / Block 専用 AI | ③ |
| auth / subscription / payment / account / class / passkey / 2FA | ③ |
| PIN assignment / Servo reverse / Servo speed / Block 専用補助 UI | ③ |
| Servo Trim / PID tuning / USB utility / device diagnostics | ⑤ |

---

## 未調査として残るもの (⑤ の一覧)

`compile-api` の `server.ts`/`compile.ts` 呼び出し経路の完走 · `digicode-installer` · donor の deploy スクリプト 4 本 · `block-catalog.json` の生成スクリプト · `probabilistic-debug` 実データ · AI の外部コード解析経路 · AI の compile error 連携 · Sidebar/StatusBar/LinearToolbar の意味的結合 · USB driver 案内 · `variants/usb` と `variants/ota` の関係 · `digicode-class-server` の詳細 · ML30 (未接続)
