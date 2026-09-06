# 04_local-lsp-helper-feasibility — 高度解析をユーザ PC へ逃がしつつ導入 UX を保てるか

<!-- 配置: local/plans/active/ (rule 15 / local/README.md §plans)。完走したら plans/completed/ へ移動。
     調査 + isolated probe であって production 実装ではない。 -->

| 項目 | 内容 |
|---|---|
| 起案日 | 2026-08-26 |
| 起案契機 | 2026-08-26 Human 裁定 + HUMAN GO「PRIMARY_OBJECTIVE = Local LSP Helper Feasibility」 |
| 起案者 | Claude Code (Opus 5) |
| ステータス | 🎉 Acceptance 17/17 達成 (2026-08-26)。**Human 受理済み** (裁定 §16) — ただし Local Helper の正式採否は保留、Desktop 版との役割重複を後続で評価 |
| 先行依存 | `investigations/2026-08-26_editor-lsp-spike/`(特に F-17 clangd ≈261 MiB/セッション、F-15 target mismatch、F-16 esp-clangd、`06` Monaco 実接続) |
| 後継計画 | Architecture Decision(Human) |

## ⚡ 30秒で把握

Human の懸念は **「無料利用者が増えるほど server-side LSP の運営費が比例増する構造」**。
そこで **基本機能はブラウザだけで完結**させ、**高度な C/C++ semantic analysis を必要とする利用者だけが
Helper を 1 個入れる**構成が成立するかを実測・比較する。

**最優先の調査順序(裁定 §15):** ① Web app + Helper 単体 ② Web app + Extension + Helper
③ server-side LSP ④ browser-side WASM。**ただし ① が安全に成立しないなら、その事実を優先する。**

**やらないこと**: Local Helper 正式採用 · server-side LSP 正式不採用 · Chrome Extension 正式採用 ·
Tauri 正式採用 · production Helper / installer / auto update / Monaco / Compiler 接続 ·
Cloudflare / DNS / deploy 変更。

## 1. 中心にある未知数

**「HTTPS で配信された Web アプリから、利用者 PC の localhost サービスへ、Extension 無しで安全に繋がるか」**
— これが成立しなければ ① は消え、裁定 §15 の優先順位そのものが変わる。
mixed content · CORS · origin validation · CSRF · DNS rebinding · Private Network Access ·
Chrome/Edge の security policy を **推測ではなく Chrome 148 で実測する**。

## 2. probe 環境(production から隔離)

| 要素 | 実体 | 隔離の担保 |
|---|---|---|
| probe 置き場 | セッション scratchpad(repo 外) | repo に production 依存を作らない |
| Web アプリ側 | 自己署名証明書の **HTTPS サーバ**(secure context を本物にするため SPKI を Chrome に許可) | localhost bind / 使い捨て |
| Helper 側 | localhost の HTTP + WebSocket サービス(自作、使い捨て) | `127.0.0.1` bind のみ |
| clangd | 既存 native clangd / 必要なら esp-clangd を isolated に取得 | production ではない |
| donor(`DigiCode-Helper` 他) | **READ ONLY**。開始時・終了時に SHA と dirty を実測 | 変更・commit・push 一切なし |
| production | Cloud / Cloudflare / DNS / deploy | **一切接続しない** |

## 3. Acceptance(裁定 §19 の 17 条件)

1. Extension なし Local Helper 方式を調査
2. Extension + Native Messaging 方式を比較
3. 既存 DigiCode Helper donor を調査
4. Monaco → localhost Helper → clangd を isolated 環境で実証
5. multi-file semantic navigation 成功
6. Helper なし fallback を実証
7. Helper 停止 / 再起動 / reconnect を実証
8. localhost security model を整理
9. Windows / macOS 導入手順を比較
10. Helper への clangd 等の bundling 案を比較
11. Board environment 配布案を比較
12. installer / signing / notarization 要件を整理
13. FS 講座 20〜50 人ケースを比較
14. 100 人 server-side vs Local Helper を比較
15. monetary / engineering / UX cost を分離
16. remaining unknown を明示
17. Human が Architecture 判断できる材料を提示

## 4. 検証の型(rule 04)

| 型 | 適用範囲 |
|---|---|
| **real-fire** | HTTPS→localhost 接続の可否 · mixed content · CORS · origin 検証 · PNA · Monaco↔Helper↔clangd の全経路 · Helper 不在/停止/再起動時の挙動 · clangd / esp-clangd の実サイズと実挙動 · board headers の実ディスク量 |
| **primary source** | donor リポジトリの実読 · Chrome/Chromium の公式仕様と chromestatus · 署名 / notarization の公式要件 · VPS の**現在の実価格** |
| **NOT OBTAINED** | Windows / Linux 実機での再現 · 実際の installer 作成と実配布 · 実 notarization · 実 100 人負荷 — 推測で埋めない |

**絶対条件**: 「localhost に繋がる」は**繋がらない条件を先に示してから**主張する(rule 04 §absence)。
「Helper なしで壊れない」は**実際に Helper を落として**測る。
コスト比較は **monetary / engineering / support / UX を分離**する(裁定 §14)。

## 5. 成果物

`local/investigations/2026-08-26_local-helper-feasibility/` に、環境 / コマンド / 検証型 /
security model / 実測値 / 導入手順の実カウント / bundling 比較 / 講座ケース / 100 人比較 /
Architecture options / risks / remaining unknowns / Human 判断事項 / next-objective candidates を永続化する。
