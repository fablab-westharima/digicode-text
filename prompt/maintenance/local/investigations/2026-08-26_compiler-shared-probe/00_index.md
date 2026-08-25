# 00_index — Compiler Shared / Separate 判断のための実証調査

**PRIMARY_OBJECTIVE:** Compiler Shared / Separate 判断に必要な実証調査 — 既存 Classic 経路を変更せず、
DigiCode Text 向け full-source / multi-file compile 経路を同一 Compiler infrastructure 上へ
additive に成立させられるかを検証する。

**実施:** 2026-08-26 (Session 002) / **HUMAN GO:** 2026-08-26
**donor SHA (固定・不変を実測):** `DigiCode` = `bb35c3b8025610299bf952c2c45eda2196a07401` /
`digicode-compile-api` = `3376746f1e5a4ca039e0cade279741f16612fccf` — **両方 dirty 0、probe 前後で同一**
**donor / production への変更・commit・push・deploy・接続:** **0 件**

> **検証の型 (rule 04):** 本調査の中核は **real-fire (実 compile)** である。Classic を 4 回、Text 経路を
> 20 回以上、いずれも実際に `pio run` を走らせて artifact を取得した。
> **実機書き込み・production 接続・負荷試験は 1 件も行っていない。**
> Cloudflare Worker は donor コードを **isolated 実行** (上流 `fetch` を stub 化) して観測した。

---

## この調査が出した答え (1 行ずつ)

| 問い | 答え |
|---|---|
| Classic を一切変えずに Text 用 full-source / multi-file 経路を足せるか | **足せた。** 既存 6 ファイル差分 0、`server.ts` に **3 行**追加のみ |
| Classic は壊れていないか | **壊れていない。** artifact 4 点が **3 回ともバイト一致**。比較器の検出力も対照実験で確認済み |
| Text の依存が Classic を汚染するか | **しない。** positive control 付きの marker 検査で漏洩 0 |
| Text 専用 Board は Classic に露出するか | **しない。** ただし別 platform を要する board は image 層に触れる |
| Shared / Separate はどちらが正しいか | **本調査は決めない。** 材料は `05_…md` §1 に整理した。**決定は Human** |

## Acceptance (裁定 §16) — 10 条件の判定

| # | 条件 | 判定 | 根拠 |
|---|---|---|---|
| 1 | isolated 環境で full-source compile 成功 | ✅ | `02` §2 case A / A2 (9.1 s / 5.2 s、firmware 306,352 B / 301,648 B) |
| 2 | isolated 環境で multi-file compile 成功 | ✅ | `02` §2 case B2 (3 ファイル) / B3 (5 ファイル)。リンク成功そのものが別ファイルのビルドを証明 |
| 3 | Classic existing path を維持できること | ✅ | `03` §1 — BEFORE / AFTER / FINAL の 4 artifact がバイト一致、生成 ini の差分 0 |
| 4 | Text / Classic workspace collision を避けられること | ✅ | `03` §3 — root / lock / cache の 3 名前空間が分離。**Classic のキーを故意に指定しても衝突しなかった** |
| 5 | dependency を Classic 全体へ汚染せず Text 側へ与えられること | ✅ | `03` §4 — Text 専用 test library の marker が Classic firmware に **不在**、Text firmware に **存在** |
| 6 | Board visibility / registry を分離できるかの事実取得 | ✅ | `03` §5 — 独立 registry で Text 専用 FQBN のビルドが成立。限界線 (platform 層) も特定 |
| 7 | multi-file error で filename / line を取得 | ✅ | `02` §3 — `src/sensor.cpp:9:3` / `:10:1` を severity・message 付きで構造化して返した |
| 8 | artifact 生成経路を確認 | ✅ | `02` §4 — bootloader / partitions / boot_app0 が Classic と**バイト一致**。実機書き込みは [未verify] |
| 9 | Cloud / Local 共用に関する残 unknown を明確化 | ✅ | `04` §5 / `05` §4 — 8 項目を列挙 |
| 10 | Shared / Separate それぞれの実際の変更範囲を比較可能にする | ✅ | `05` §1 — Option A / B1 / B2 / C を 11 観点で比較、各セルに [測]/[推]/[未] を付与 |

## 文書構成

| ファイル | 内容 |
|---|---|
| `01_probe-environment-and-commands.md` | production 非接触の担保 · probe 環境 · **環境 deviation (D-1 / D-2) の明示** · 再現コマンド |
| `02_text-compile-path-results.md` | 追加した経路の形と**フットプリント実測** · compile 結果一覧 · `.ino` 前処理 · error semantics · artifact · payload サイズ |
| `03_classic-regression-and-isolation.md` | **Classic 回帰のバイト比較と検出力の証明** · workspace / lock / cache 分離 · 並行実行 · 依存分離 · Board 分離 |
| `04_docker-toolchain-and-cloud.md` | Docker 共用の可否 · **共有 build cache の価値の定量** · pioarduino · RP2040 への示唆 · Cloudflare Worker の実行観測 |
| `05_options-findings-and-next.md` | **Option A / B1 / B2 / C 比較** · findings 13 件 · risks 6 件 · 残 unknown 8 件 · Human 判断 7 件 · next-objective candidates |
| `06_probe-implementation.md` | probe コード全文 (再現用)。**production 実装ではない**。donor コードは 1 行も含まない |

## 特に読んでほしい 3 点

1. **🔴 F-A — 現行 Classic の依存集合は、まっさらな環境では今日ビルドできない。**
   `gin66/FastAccelStepper@^0.32` が registry から消えている (47 registry エントリ中この 1 件のみ)。
   **donor 側の問題であり本 objective では直していない** が、Local Compiler の新規配布に直接効く。
2. **🔴 F-H — 共有 build cache の利得は小さい** (Text 専用の空キャッシュでも 1 ビルドで同等速度、24 MB)。
   「キャッシュを失うから分離は不利」という論拠は実測に支持されない。
3. **🔴 F-B — `lib_ldf_mode = chain` は解決を絞らない。** Classic の 57 本は、
   どのユーザコードにとっても事実上の必須依存である。**Classic への回帰リスクを決めるのは
   endpoint の共用ではなく registry の共用**、というのが本調査の中心的な発見。

## 本 objective がやらなかったこと (裁定 §18 の遵守)

Editor の実装 · registry の全面再設計 · Docker の作り直し · Compiler 本体の production 修正 ·
Library Manager の実装 · Board の本番追加 · Shared / Separate の決定 — **いずれも着手していない。**
probe 中に生じた「実装したくなったもの」は `05_…md` の finding / risk / Human 判断 /
next-objective candidate として記録した。
