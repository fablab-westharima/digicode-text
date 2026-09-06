# 02_ecosystem-inventory — DigiCode 関連資産の境界 (Phase 1)

**調査日:** 2026-08-26 / **調査方法:** `~/github_project/` を READ ONLY 走査 + 各 repo の `git remote -v` / `rev-parse` / `status` + donor 内の参照 grep
**目的:** 「実は別 repo だった」の再発を防ぐため、先に ecosystem boundary を固定する (裁定 §7)

> 内部インフラの host 名・IP・deploy パスは**本リポジトリに書かない**（public repo / content discipline）。所在の事実のみ記録する。

## 現行資産 (Donor Audit 対象)

| Name | Location | Type | Git | Remote | HEAD | Relation の根拠 | Currentness | Audit 対象 |
|---|---|---|---|---|---|---|---|---|
| **DigiCode** | `~/github_project/DigiCode` | frontend + backend | yes | `fablab-westharima/digicode` | `bb35c3b` clean | donor 本体 | **current** | ✅ 全クラスタ |
| **digicode-compile-api** | `~/github_project/digicode-compile-api` | compiler | yes | `fablab-westharima/digicode-compile-api` | `3376746` clean | DigiCode の remote に登録済み / `.gitignore` で本体から除外 | **current** | ✅ Compile クラスタの本体 |
| **digicode-class-server** | `~/github_project/digicode-class-server` | backend (class 管理) | yes | `fablab-westharima/digicode-class-server` | `8bcc20e` clean | Docker + migrations を持つ独立 service。DigiCode backend の `utils/classApi.ts` が呼ぶ側 | **current** | 🟡 Classic 固有 (class) — Text 不採用候補の確認のみ |
| **DigiCode-Helper** | `~/github_project/DigiCode-Helper` | desktop helper (Tauri) | yes | `fablab-westharima/**DigiCode-Finder**` | `fa95dfd` clean | AGPL-3.0 / README に ecosystem 記載。**ディレクトリ名と remote 名が食い違う** | **current** | 🟡 Write/Hardware クラスタ (USB driver 案内 / device 検出) |

## 廃止・歴史資産 (現行と誤認しないこと)

| Name | 状態 | 根拠 |
|---|---|---|
| **arduino-compile-server** | **2026-04-28 decommissioned** | `digicode-compile-api/README.md:96` "Replaces: legacy `arduino-compile-server` (arduino-cli; decommissioned 2026-04-28)"。ローカルに clone は存在しない。**探索終了 — 新規 clone 不要** |
| `~/github_project/archive/` | 歴史バックアップ 2.6G (`DigiCode_backup_20251211` / `DigiCode_Backup_20251217_2段階前` / `DigiCodeのコピー`) | git repo ではない。**現行構成の根拠に使わない** |
| RP2040 対応 | **削除済み** | `digicode-compile-api/Dockerfile:69-76` — 2026-05-05 に board mapping を全削除し、`raspberrypi` platform install も除去 (約 150MB 削減)。DigiCode は **ESP32 専用** |

## 非関連 (名前だけでは判断せず、remote で除外)

`fabcanvas` / `fabcanvas-api` / `fablab-westharima-astro` / `FJN-Website` / `FlatLayout` / `LaserEditor` / `MachPro` / `Make_Mach4` / `Nagaoka*` / `ouen-plus` / `Project_Template` / `esp32s3-blink` — いずれも別プロダクトの remote を持つ。`Project_Template` のみ本プロジェクトの供給元。

## 未確認 (追加調査必要)

- **ML30 (社内サーバ)** — donor の `docs/dev/deployment.md` (donor 側 gitignore = 非公開) と compile-api README が production ホストとして言及。SSH alias は存在するが**本セッションでは接続していない**。Compile 本番構成の一次情報が残る可能性があるが、**現行正本とは限らない** (裁定 §9)。接続可否と探索は次段で判断。
- **digicode-installer** — compile-api README が end-user 向け導入手段として参照。ローカル clone なし、GitHub 上の別 repo。Local Compiler 配布経路の調査対象候補。
- **compile-proxy-worker** — donor 本体内 (tracked 13 ファイル)。Cloudflare Worker。Compile 経路の中継として Compile クラスタで読む。

---

## 追補 (2026-08-26、残 ⑤ 消化)

- 🟡 **`digicode-class-server` の license 表記は現在 PROPRIETARY (All rights reserved)。** README 冒頭に明記。DigiCode ecosystem の中で表記上は唯一 AGPL-3.0 ではない。
  - 役割: enterprise プラン限定のクラス機能 (クラス作成 / 生徒アカウント代理作成 / 課題配布 / 提出 / 採点)。D1 の 10GB 制限を避けるため **SQLite** に保存。
  - 経路: Browser → Cloudflare Workers (`esp32-blockly-backend`、JWT 検証 + `requirePlan('enterprise')`) → Cloudflare Tunnel → 内部サーバの Hono + better-sqlite3。**外部から直接到達不可**、共有秘密ヘッダで呼び出し元検証。呼び出し側は `esp32-blockly-backend/src/utils/classApi.ts` (timeout 10s)。
  - ⚠️ **ここから「digicode-text へ持ち込めない」とは結論しない (2026-08-26 Human 裁定による訂正)。** donor 側の license 表記は**権利者が現在選んでいる提供条件**にすぎず、権利者自身が digicode-text 側で別の license 条件を設定できる場合がある。**`PROPRIETARY = 移植不可` という機械判定は禁止**されている。
  - **確認済みの事実はここまで**: 現在の表記が PROPRIETARY / All rights reserved であること。
  - **持ち込み可否を判断するときの分離** (裁定 §1.2): ①権利帰属 ②第三者由来コードの有無 ③third-party dependency / bundled / copied code の license 条件 ④DigiCode 側で現在採用している license・公開条件 ⑤digicode-text 側でどの license 条件で提供可能か。**④ と ⑤ は別の判断。**
  - **製品判断とは別問題**: verdict ③ (Text では不採用) は**製品要件上の判断**であり、「license 上持ち込めない」ではない。混同しない。
- **`digicode-installer` の上流は donor 内の `scripts/local-compile/`** (`install.sh` / `install.ps1` / `README.md`)。公開 repo `fablab-westharima/digicode-installer` は **MIT** で、**手動で同期**されると README に明記。Local Compiler のワンコマンド導入 (macOS/Linux は `bash <(curl ...)`、Windows は `irm ... | iex`) を提供。→ ⑤ 解消。
- `variants/usb` は **tracked 1 ファイル** (`firmware/templates/DigiCodeUSB.ino`) のみ。`variants/_reference/` は「Phase 1.1-1.5 の OTA 専用化で削除した USB/Bluetooth コードを、将来の実装時の参考として保管する場所」で**実行されない**。→ ⑤ 解消 (別プロダクト構成ではない)。
