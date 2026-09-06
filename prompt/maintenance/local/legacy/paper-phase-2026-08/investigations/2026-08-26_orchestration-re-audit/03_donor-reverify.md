# 03_donor inventory の再検証 — donor source 実読

**checker:** Codex `gpt-5.6-sol` · packet `DT6-D5-donor-inventory-reverify` · `LANE: VERIFICATION` · `VERDICT: PASS`
**監査基準:** judgment Part 1 pattern C(標本を全体評価として扱う)+ case DT-1(制約的方向への誤読)

**donor は READ ONLY。書込 0。donor の `prompt/` / `CLAUDE.md` / governance は一度も開いていない**
(packet の絶対境界、Codex が遵守を明示報告)。**秘密値・個人情報・private URL は返却されていない。**

---

## 1. donor SHA 照合 `[command+RC=0]`

```bash
git -C ~/github_project/DigiCode              rev-parse HEAD   # bb35c3b8025610299bf952c2c45eda2196a07401
git -C ~/github_project/digicode-compile-api  rev-parse HEAD   # 3376746f1e5a4ca039e0cade279741f16612fccf
git -C ~/github_project/DigiCode-Helper       rev-parse HEAD   # fa95dfd67ee83d881f93be7641cc9cef171165a2
```

**3/3 とも 16.md 記載の pin と一致。** 最終 `git status --porcelain --untracked-files=no` は 4 repo すべて 0 行。

---

## 2. 検証表(A1–A12)

| id | 監査の verdict | 母数 (n of N) | 再検査方法 | 結果 | 誤差方向 | 裁定依存 |
|---|---|---|---|---|---|---|
| A1 | 現行 4 資産 / legacy compiler 2026-04-28 廃止 / ML30 未接続 | 走査 repo の N 未記録 | `digicode-compile-api/README.md:96` `[static]` + 3×rev-parse `[command+RC=0]` | `EVIDENCE_REVIEWED_OK` | なし | Yes — ecosystem boundary |
| A2 | Blockly 結合は UI shell **6 ファイル**に局所化 | direct-import 343/343。手読 proxy 64/343 source, 17/126 components。**読解 manifest なし** | 全 src `git grep` `[grep, RC=0]` | `PARTIALLY_CONTRADICTED` | **LESS restrictive** | Yes — Text へ Blockly を戻さない |
| A3 | 4 provider / custom endpoint / Local LLM help / BYOK / 辞書 / generate-validate-retry | production AI service 15/15、AI tests 0/12。監査記載「16 files」は現物 27 と不一致 | `services/ai/index.ts:16-78`, `openAICompatibleClient.ts:30-51`, `systemPrompt.ts:83-119`, `aiStore.ts:80-87`, `HelpLocalLLMPage.tsx:6-22` `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | core にはなし | AI 主機能裁定には No / baton 35 には Yes |
| A4 | Board は frontend 16 / compiler 10 の手書き二重正本。Device⇔Library registry **なし** | Board 16/16 + FQBN 10/10。監査の Device 説明例は **1/69**。今回 **69/69 全数走査** | `boardStore.ts:50-100`, `boards.ts:12-15,63-108` `[static]` + 69/69 block scan `[grep, RC=0]` | `INDEPENDENTLY_SOURCE_VERIFIED` | なし | 🔴 Yes — **Managed Environment Registry の最重要根拠** |
| A5 | Classic 保存は server-side D1 / auth-gated | frontend 343/343 keyword scan + project store 1/1 + backend route 1/1 | `projectStore.ts:50-195`, `routes/projects.ts:8-9,42-55,84-88`, `0001_initial_schema.sql:14-19` `[static/grep]` | `INDEPENDENTLY_SOURCE_VERIFIED` | なし | Yes — 企画書訂正 |
| A6 | USB 書込の実体は WebUSB でなく **Web Serial** | USB writer 1/1、frontend 343/343。Web Serial hit 5 files、WebUSB hit 0 | `usbFirmwareService.ts:12,37-42,311`, `serialService.ts:41-76` `[static]` + **positive-control grep**: Serial RC=0 / WebUSB RC=1 | `INDEPENDENTLY_SOURCE_VERIFIED` | なし | Yes — 企画書訂正 / browser matrix |
| A7 | PlatformIO orchestration / global lib_deps / Docker / cache / queue / workspace / error 解析が資産 | compile source 7/7 + Dockerfile 1/1 + proxy 1/1 | `compile.ts:222-229,261-268,383-415,486-543,607-698`, `projectLock.ts:10-36`, `cache.ts:35-146`, `report-builder.ts:46-98` `[static]` | `PARTIALLY_CONTRADICTED` | **MORE restrictive** | Yes — 専用 Compiler 裁定(ただし S002 実測も根拠) |
| A8 | donor は pioarduino へ統一済み | mapping 1/1、Docker setup 1/1 | `boards.ts:19-29,51-68`, `Dockerfile:55-62` `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | なし | Yes — 企画書訂正 |
| A9 | RP2040 削除の真因は global `lib_deps` 非互換 | 監査は current comment のみで **git-history 0/2**。今回は削除 pair commit **2/2** | `boardStore.ts:24-27` `[static]` + commit `bfe5d533…` / `21913904…` `[git-history, RC=0]` | `PARTIALLY_CONTRADICTED` | **MORE restrictive** | No settled RP2040 ruling |
| A10 | QA: tracked tests 77 / **60 files** / **5 戦略** / 配分 414-86-100-200-200 | DigiCode test-like files 77/77。QA directory は実際 **52/52**。監査の実装読解 n は未記録 | `generate-cases.ts:28-33,157-185,228-249`, `README:49-57` `[static]` + git count `[command+RC=0]` | `PARTIALLY_CONTRADICTED` | 主に **MORE restrictive** | Yes — baton 2 |
| A11 | `.gitignore` / fingerprint ledger / pre-commit / history rewrite。CI secret scan なし | tracked security configs 2/2、compile workflow 1/1。**untracked hook は禁止境界により未読。Helper API 0/1 が監査範囲外だった** | file existence/count `[command+RC=0]`, `compile.ts:526-540`, `aiStore.ts:80-87`, Helper `api_server.rs:30-73` `[static]` | `EVIDENCE_REVIEWED_OK` | 沈黙が **MIXED** | No direct adoption ruling |
| A12 | `11_findings` F-1〜F-12 が Human 判断材料 | donor-source findings 10/10。F-7 / F-11 の browser/LSP claims 2/12 は packet の OUT_OF_SCOPE | 上記 A2–A10 各証拠 + `compile-proxy-worker/src/index.ts:16-31`(F-6), `BoardSelector.tsx:20-38,64-66`(F-12) `[static]` | `PARTIALLY_CONTRADICTED` | **MIXED** | Yes — 複数 baton / ruling。ただし直接再裁定を要する反証なし |

---

## 3. 訂正の内訳

### A2 — Blockly 結合「6 ファイル」

- direct import の**総数 86 は正しい**。しかし**内訳「76/5/1/1」は誤り**。正しくは
  **blocks 78 / editor 5 / AI 2 / utils 1** `[grep, RC=0]`
- 「結合 6 ファイル」は **direct-import の尺度**であり、監査はそれを**意味的結合へ拡張して**使っている
- blocks 外 production **64 files** に Blockly / XML / workspace 語彙 hit がある。
  これは結合確定数ではなく、**「6 files」を意味結合の母数として使えないことを示す grep proxy**
- **移植工数評価に影響する。** 製品分担裁定(Classic = Block / Text = AI+Text)自体には直結しない

### A7 — Compiler timeout

- 監査の **180,000 ms は code fallback**(`compile.ts:112`)
- **container 実効既定は 900,000 ms**(`Dockerfile:88-117`)
- さらに **compile API 自体は structured parser ではなく raw stderr を返す**。解析器は QA 側にある

### A9 — RP2040 削除理由

- `lib_deps` 非互換は**技術的トリガー**である
- しかし削除 pair commit の履歴は **ESP32 専用への製品方針転換**と、
  **「分割改修より削除を選んだ user 判断」**も明記している
- 🔴 **単一の不可避な Compiler 原因ではない。** 監査は git-history を 0/2 しか見ずに
  current comment から「真因」を確定していた

### A10 — QA infrastructure

| 項目 | 監査の記述 | 実測 |
|---|---|---|
| 戦略数 | 5 | **6**(第 6 戦略 `combo` を落としている) |
| 配分 | 414 / 86 / 100 / 200 / 200 | **588 / 86 / 100 / 11 / 200 / 15** |
| QA directory files | 60 | **52**(60 は frontend scripts 全体の数を QA subdir へ誤適用) |

**README・CLI help・実装の三者が不一致。** 監査はそのいずれか 1 つを読んで一般化していた。
なお「1000+1000 を保証件数として継承しない」という裁定は**むしろ補強される**。

---

## 4. 🔴 監査が一度も記録していなかった donor 資産・制約

**「監査の沈黙は不在として読まれる」** — Codex が最も価値ある回答として挙げた項目。**いずれも今回が初出。**

| # | 資産 / 制約 | 出典 `[static]` | なぜ重要か |
|---|---|---|---|
| 1 | **BLE / Wi-Fi Controller subsystem** | `BleController/webBluetoothClient.ts:1-22`<br>`Controller/unifiedControllerBuilder.ts:1-33,77-94` | Web Bluetooth GATT/NUS controller、複数 project から downloadable な controller HTML を生成する builder、AI customization diff。**製品機能として丸ごと未評価** |
| 2 | **AI の canonical-sample / host-compile probes** | `sample-e2e-probe.test.ts:10-30,44-93`<br>`host-compile-probe.test.ts:2-16,133-159` | sample 全件の XML→C++→semantic validation と、環境設定時だけ compile API へ送る probe。**Registry の Verified 昇格経路へ直接転用できる既存資産**(実行はしていない) |
| 3 | 🔴 **DigiCode-Helper の runtime security topology** | `api_server.rs:30-73` | 固定 CORS list、PNA response header、**全 interface bind**。API server に **auth / token 機構が見当たらない**。donor 側の観察であり本 repo は変更しない |
| 4 | 🔴 **result cache に eviction / TTL / 容量上限がない** | `cache.ts:79-146`(全読) | keyed get/put のみ。削除・TTL・容量上限の経路が存在しない。**Text Compiler architecture の設計入力**(baton 21) |
| 5 | **compile 後の credential-bearing source cleanup** | `compile.ts:526-540` | persistent workspace の `main.ino` を compile 後に空にする best-effort 処理。**監査は positive mechanism として記録していなかった**(値は確認・記録していない) |
| 6 | **SCons shared-cache race の one-shot retry** | `compile.ts:682-689` | 並列 compile 時の既知 race を検出して 1 回再試行。**共有 cache に既知の race があること自体が V9 の解釈に関わる** |
| 7 | **probabilistic-debug の第 6 戦略 `combo`** | `generate-cases.ts:28-33,157-185` | 監査の「5 戦略」は実装と食い違う |
| 8 | **Helper の updater** | `useUpdater.ts:30-83` | 起動時 update check / download-install |
| 9 | **Blockly の意味的 surface は direct import より広い** | blocks 外 production 64 files | A2 の grep proxy |

---

## 5. 誤りの方向性(DT-1 型の検査)

**一方向ではない。**

- **donor をより制約的・低能力に見せる**: A7 の timeout / A9 の RP2040 単因化 / A10 の QA 資産過小評価
- **donor をより使いやすく・安全に見せる**: A2 の意味的 Blockly coupling 過小評価 / A11 の Helper runtime 制約の沈黙
- **非方向的**: AI file count / QA directory file count

→ **DT-1 型の restrictive cluster は再発しているが、全誤りがその方向という結論は出せない。**

---

## 6. static grade では危険な verdict

| id | 何を実行すれば足りるか |
|---|---|
| A1 | deployment / runtime inventory と実サービス health |
| A2 | Blockly 除去 build、typecheck、主要 UI flow の browser 実行 |
| A3 | provider mock / local endpoint、CORS、retry、Local LLM 互換の browser / API-smoke |
| A4 | Board visibility、dependency 解決、representative compile |
| A5 | isolated Worker + D1 integration、auth rejection、browser 保存 / reload |
| A6 | API 同定は source で十分。書込成功・権限・復旧は実 browser + hardware |
| A7 / A8 | Docker build、cold / warm / cache-hit、concurrency、timeout、代表 board compile |
| A9 | documented decision 理由は history で足りる。当時の lib 非互換を事実として保持するなら historical environment で reproducer |
| A10 | test suite、1000-case generator、mutation、corpus parser の実行 |
| A11 | repo copy で gitleaks / pre-commit detection mutation、Helper の network / auth negative tests |

**今回これらは実行していない。**

---

## 7. Human ruling への影響

**直接、再裁定を要求する反証はない。** ただし証拠記録の訂正は必要。

| ruling | original evidence | corrected evidence | impact | 再裁定 |
|---|---|---|---|---|
| Text へ Blockly を戻さない | coupling は 6 files | 6 は UI shell の direct-import 尺度。blocks 外の意味的 surface は広い | 移植工数評価には影響。製品分担裁定には直結しない | **No** |
| dedicated Text Compiler を第一候補 | global lib_deps / fragment contract / RP2040 原因 | 前二者は支持。RP2040 は技術的トリガー + 製品方針 / user 選択 | RP2040 を「不可避な Compiler 制約」とする強度を下げる | **No** — S002 実測と他の分離理由が独立に存在 |
| 1000+1000 を保証数として継承せず risk-based QA | 5 戦略・固定配分 | 6 戦略、`--count` 可変、実装配分は別値 | **件数を product acceptance へ継承しない裁定をむしろ補強** | **No** |
| planning corrections(server-side 保存 / Web Serial / donor 側 pioarduino 採用済み) | — | 3 件とも source 支持 | none | **No** |
