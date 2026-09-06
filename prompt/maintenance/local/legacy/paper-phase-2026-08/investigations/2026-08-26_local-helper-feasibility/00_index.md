# 00_index — Local LSP Helper Feasibility

**PRIMARY_OBJECTIVE:** DigiCode Text の基本機能はブラウザだけで利用可能とし、高度な C/C++ semantic
analysis を必要とするユーザだけが、最小限の導入作業でローカル clangd を利用できる構成を実証・比較する。

**実施:** 2026-08-26 (Session 003 後半) / **HUMAN GO:** 2026-08-26(この objective の範囲のみ)
**donor SHA(probe 前後で不変を実測):**
`DigiCode` = `bb35c3b8025610299bf952c2c45eda2196a07401` /
`digicode-compile-api` = `3376746f1e5a4ca039e0cade279741f16612fccf` /
**`DigiCode-Helper` = `fa95dfd67ee83d881f93be7641cc9cef171165a2`** — **3 つとも dirty 0**
**donor / production への変更・commit・push・deploy・接続:** **0 件**
**production Helper / installer / auto update の実装:** **0 件**

> **検証の型 (rule 04):** 中核は **real-fire**。Chrome for Testing 148 を実起動し、
> **本物の secure context** と **本番相当の public address space** を作ったうえで、
> 実 Helper・実 clangd・実 esp-clangd に繋いで測った。
> 仕様・donor・価格は**一次情報**で裏を取った。
> **Windows / Linux 実機・実 installer・実 notarization・実 100 人負荷は 1 件も行っていない。**

---

## この調査が出した答え

| 問い | 答え |
|---|---|
| **Extension 無し・Helper 1 個で成立するか** | 🔴 **成立する。** HTTPS ページ(public address space)から `ws://127.0.0.1` の LSP が開き、Monaco から multi-file semantic navigation が全部動いた |
| その代償は | **「HTTPS 配信」と「ブラウザのローカルネットワーク許可 1 回」の 2 点だけ。** 許可が無いと Helper に 1 バイトも届かない |
| Extension + Native Messaging は要るか | **本 spike の実測範囲では、選ぶ積極的理由が見つからなかった。** それが解く問題(permission 回避)は案 A では許可 1 回で済む |
| 既存 DigiCode Helper は使えるか | 🔴 **骨格は production 実績付きで存在する**(ローカル HTTP API + Origin 許可リスト + 4 プラットフォーム配布 + 自動更新)。**ただし `0.0.0.0` bind・認証なし・署名なしはそのまま真似してはならない** |
| **Helper 無しで壊れないか** | 🔴 **壊れない。** エディタ起動 921 ms、基本機能全動作、compile 診断 → file/line jump 動作、**エラーポップアップ 0** |
| Helper が死んだら | 🔴 **エディタは動き続け、古い赤線を掃除し、案内バナーへ戻る。ポップアップ 0。** 復活は利用者操作ゼロで 3.9 秒 |
| **偽の赤線は消せるか** | 🔴 **消えた。esp-clangd + フラグ除去 + include 指定で ESP32 実プロジェクトの偽診断 0 件**(前 spike の残課題の決着) |
| 何を同梱するのか | **esp-clangd 10.5〜13.5 MiB + board 1 枚分のヘッダ 6.0 MiB (xz)。** 初回 **17〜20 MB** 程度。**ESP32 core 一式は 5.3 GB なので、同梱するのは LSP に要るものだけ** |
| **server-side はいくらかかるか** | 🔴 **前 spike の 261 MiB は楽観側。ESP32 実測で ≈500 MiB/session、しかも線形。** 100 人同時で **≈50 GB / ¥61,600 / $504 の桁** |
| その最適化は効くか | 🔴 **講座のように全員が同時に編集する場面には効かない**(idle timeout / on-demand / pool のいずれも) |
| 結局どちらが正しいか | **決めない。** ただし実測が 1 つ言えることがある — **どちらを選んでも、選ばなかった人の体験は壊れない。これは「どちらか一方」ではなく「既定をどちらに置くか」の決定である** |

## Acceptance(裁定 §19)— 17 条件の判定

| # | 条件 | 判定 | 根拠 |
|---|---|---|---|
| 1 | Extension なし Local Helper 方式を調査 | ✅ | `02` 全体 |
| 2 | Extension + Native Messaging 方式を比較 | ✅ | `06` §2(一次情報で要件を確定。実装はしていないと明記) |
| 3 | 既存 DigiCode Helper donor を調査 | ✅ | `03` — READ ONLY、SHA 不変 |
| 4 | Monaco → localhost Helper → clangd を isolated 環境で実証 | ✅ | `04` §2 |
| 5 | multi-file semantic navigation 成功 | ✅ | `04` phase2(定義 / 参照 3 箇所 / symbols 23 / cross-file 補完) |
| 6 | Helper なし fallback を実証 | ✅ | `04` phase1(**前提条件も測定**) |
| 7 | Helper 停止 / 再起動 / reconnect を実証 | ✅ | `04` phase3〜5 |
| 8 | localhost security model を整理 | ✅ | `02` §4(Origin / token の実真理値表、no-cors、DNS rebinding、bind) |
| 9 | Windows / macOS 導入手順を比較 | ✅ | `06` §1(**クリック数・許可回数を数えた**) |
| 10 | Helper への clangd 等の bundling 案を比較 | ✅ | `05` §3(H1〜H4) |
| 11 | Board environment 配布案を比較 | ✅ | `05` §2〜§4 |
| 12 | installer / signing / notarization 要件を整理 | ✅ | `06` §3 + `03` §6 |
| 13 | FS 講座 20〜50 人ケースを比較 | ✅ | `07` §3(A/B/C/D) |
| 14 | 100 人 server-side vs Local Helper を比較 | ✅ | `07` §2(**実測で基準値を補正**) |
| 15 | monetary / engineering / UX cost を分離 | ✅ | `07` §4(support を加えた 4 分類) |
| 16 | remaining unknown を明示 | ✅ | `08` §4 |
| 17 | Human が Architecture 判断できる材料を提示 | ✅ | `08` §1 / §5 / §6 |

## 読む順序

| ファイル | 中身 |
|---|---|
| **`01_probe-environment-and-commands.md`** | 隔離の担保 · 実測環境 · **secure context と public address space をどう本物にしたか** · 再現コマンド · **自分の probe に見つけた欠陥 4 件** |
| **`02_localhost-connectivity-and-security.md`** | 🔴 **中心。** HTTPS→localhost の可否を permission の A/B 対照で実測 · 仕様の一次情報 · Origin / token の真理値表 · no-cors / DNS rebinding / bind |
| **`03_donor-helper-audit.md`** | 既存 Tauri Helper の READ ONLY 監査 · 流用できるもの / そのまま真似してはいけないもの · **署名が無いという事実** |
| **`04_monaco-helper-clangd-probe.md`** | Monaco↔Helper↔clangd の全経路 · **Helper 不在 / 死亡 / 復活 / リロードの 5 フェーズ** |
| **`05_bundling-and-board-environment.md`** | 🔴 **偽診断 0 件の達成** · esp-clangd と board pack の実サイズ · H1〜H4 比較 |
| **`06_install-ux-extension-and-signing.md`** | **導入手順をクリック数・許可回数で数える** · Extension 案との比較 · 署名 / 配布 |
| **`07_cost-comparison-and-fs-course.md`** | 🔴 **メモリ基準値の補正** · 100 人試算 · FS 講座 4 案 · **コストの 4 分離** |
| **`08_options-findings-and-next.md`** | **Architecture options · findings 26 · risks 9 · unknowns · Human 判断事項 · next-objective candidates** |

## この調査が決めていないこと(裁定 §18)

Local Helper 正式採用 · server-side LSP 正式不採用 · Chrome Extension 正式採用 · Tauri 正式採用 ·
production Helper · installer 本番実装 · auto update 本番実装 · production Monaco ·
production Compiler 接続 · Cloudflare 変更 · DNS 変更 · production deploy — **すべて Human。**
