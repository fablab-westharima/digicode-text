# 03_既存 DigiCode Helper の donor 監査 (READ ONLY)

**Acceptance 3 に対応。裁定 §5。**
**検証の型: primary source(donor リポジトリの実読)。ビルド・実行はしていない。**
**donor は変更していない** — 監査前後とも `fa95dfd67ee83d881f93be7641cc9cef171165a2` / dirty 0。

> **裁定 §5 の但し書きを守る:** 「既存 Helper があるからそのまま Text へ使う」とは決めない。
> **donor として、何が流用でき、何がそのままでは危険かを分けて記録する。**

---

## 1. 実体

| 項目 | 実測 |
|---|---|
| ローカル clone | `~/github_project/DigiCode-Helper` |
| remote | `fablab-westharima/DigiCode-Finder` (ディレクトリ名と製品名が違う) |
| SHA / dirty | `fa95dfd67ee83d881f93be7641cc9cef171165a2` / **0** |
| 製品名 / version | **DigiCode Finder 1.5.3** |
| identifier | `jp.digital-fab.digicode-finder` |
| license | **AGPL-3.0-or-later**、`Copyright (C) 2024-2026 DigiCo LLC` |
| tracked ファイル数 | **54** |
| 構成 | **Tauri** (Rust `src-tauri/` + React/Vite フロント) |
| governance ファイル | **0 件** (`prompt/` も `CLAUDE.md` も無い。持ち込み禁止対象は存在しない) |

**case DT-1 の適用:** これは**自社(DigiCo LLC)保有コード**である。
license 表記は AGPL-3.0-or-later だが、**権利者が digicode-text へ別条件で提供できるかは別の問い**であり、
本書は「表記 = 移植可否」と機械判定していない。digicode-text 自身が AGPL-3.0 なので、
**そのままの条件でも整合する**という事実だけを記録する。

## 2. 🔴 最重要 — ローカル HTTP API が既に実装され、本番で動いている

`src-tauri/src/api_server.rs`(実読):

| 要素 | donor の実装 | DigiCode Text Helper への含意 |
|---|---|---|
| HTTP フレームワーク | **axum** + tower-http | そのまま LSP bridge を足せる形 |
| ポート | **固定 31415** | 固定ポートは discovery が簡単。衝突時の代替は未実装 |
| **Origin 許可リスト** | **実装済み**。`http://localhost:5173/5174` + `https://app.digital-fab.jp` · `https://digicode.pages.dev` · `https://code.fablab-westharima.jp` · `https://digicode-frontend.pages.dev` の 6 件 | **`02` §4 が必須と結論した防御が、既に donor にある** |
| CORS | `CorsLayer` で origin/methods/headers を制御 | 流用可 |
| **PNA 対応** | `Access-Control-Allow-Private-Network: true` を常時返す層。コメントに **「Private Network Access 対応 (Chrome 138+)」** | 🔴 §4 参照 — **2026-08 の Chrome ではこれだけでは足りない** |
| エンドポイント | `/api/devices` `/api/search` `/api/status` `/health` | `/health` は discovery にそのまま使える形 |
| **bind アドレス** | 🔴 **`0.0.0.0:31415`** | 🔴 §5 参照 — **LSP Helper でそのまま真似してはならない** |
| 認証 / token | **無し** | 🔴 LSP Helper には必要 (`02` §4)。device finder では露出情報が軽いので設計が違う |

**→ 「Web アプリからローカル常駐サービスへ繋ぐ」という骨格は、この会社で既に production 実績がある。**
digicode-text Helper はゼロからの発明ではない。

## 3. 配布・更新・パッケージング (流用価値が最も高い部分)

`.github/workflows/release.yml` + `src-tauri/tauri.conf.json`(実読):

| 要素 | donor の実装 |
|---|---|
| トリガ | tag `v*` push |
| **ビルド対象** | **macOS Intel (`x86_64-apple-darwin`) / macOS ARM (`aarch64-apple-darwin`) / Windows / Linux** の 4 系統 |
| bundle 形式 | dmg · NSIS `.exe` · `.msi` · AppImage · `.deb` · `.rpm` |
| **自動更新** | **Tauri updater plugin**。`latest.json` を GitHub Releases に置き、アプリが取りに行く |
| 更新の完全性 | **minisign 署名** (`TAURI_SIGNING_PRIVATE_KEY`)。`.sig` を成果物ごとに生成・添付し、公開鍵を `tauri.conf.json` に埋め込み |
| **配布ホスティング** | **GitHub Releases**(追加費用なし) |
| deep link | `digicode-finder://` スキーム登録済み |
| macOS 最低バージョン | 10.13 |

**→ 「1 アプリを安全かつ簡単に配布する現実的な経路」(裁定 §11) は、donor に完成品として存在する。**
digicode-text Helper は、この workflow を雛形にできる。

## 4. 🔴 donor の PNA 実装は、2026-08 の Chrome では不十分

donor のコメントは「Private Network Access 対応 (Chrome 138+)」で、
対応内容は `Access-Control-Allow-Private-Network: true` を返すことである。

**本 spike の実測 (`02` §2) では、このヘッダを返す Helper に対して、
public address space の HTTPS ページからのアクセスは permission 未許可だとブロックされた。**
(probe Helper は同じヘッダを返している。)

Chrome は **142 で Local Network Access の permission モデルへ移行**し、
**147 で WebSocket にも適用**した(chromestatus 一次情報)。
**ヘッダによる server 側 opt-in から、利用者の許可へ主体が移っている。**

🟡 **これは donor 側の finding である。** `app.digital-fab.jp` は public address space なので、
**DigiCode Finder のデバイス検出も、Chrome 142+ の利用者では permission 待ちになっている可能性がある。**
**本 spike は donor を変更しないし、DigiCode Finder の実挙動も測っていない** (= `NOT OBTAINED`)。
**Human へ報告する donor-side の観察**として記録する。

## 5. 🔴 そのまま真似してはならない点

| # | donor の実装 | LSP Helper で危険な理由 |
|---|---|---|
| D-1 | **`bind("0.0.0.0:31415")`** — 全インタフェースで待ち受け | **同一 LAN の誰でも Helper に到達できる。** device finder は「LAN 上の機器を探す」道具なので設計意図がありうるが、**LSP Helper は利用者のソースコードを扱う**。`127.0.0.1` のみに bind すべき (`02` §4 で probe Helper が実測確認済み) |
| D-2 | **認証 token が無い** | Origin 検証だけでは、ブラウザ外のローカルプロセスからのアクセスを防げない。LSP Helper には token が要る |
| D-3 | **固定ポート 1 つ、衝突時の代替なし** | 教室で複数版が動く状況を考えると、候補ポート列 + discovery が要る (probe Helper は 3 ポート探索で実測) |
| D-4 | `app.security.csp = null` | Tauri の WebView 側 CSP 無効。Helper の UI が増えるなら見直し対象 |
| D-5 | Origin 許可リストが**コードに直書き** | digicode-text のドメインが決まっていない現状では、**ビルド時定数ではなく設定可能にする**必要がある |

## 6. 🔴 署名・notarization は donor に存在しない

**リポジトリ全体を検索した実測結果: `notariz` / `APPLE_ID` / `APPLE_CERTIFICATE` /
`APPLE_TEAM` / `signingIdentity` / `codesign` / `signtool` / `Authenticode` を含むファイルは 0 件。**

| 署名の種類 | donor の状態 |
|---|---|
| **Tauri updater の minisign** | ✅ **あり**(更新の完全性は担保されている) |
| **macOS Developer ID 署名** | 🔴 **無し** |
| **macOS notarization** | 🔴 **無し** |
| **Windows Authenticode 署名** | 🔴 **無し** |

`src-tauri/entitlements.plist` には `com.apple.security.network.client` /
`network.server` / **`com.apple.developer.networking.multicast`** が書かれているが、
**entitlements は Developer ID 署名があって初めて効く**。また multicast entitlement は
**Apple の個別許諾が要る**種類のものである。

`src-tauri/Info.plist` には `NSLocalNetworkUsageDescription`(macOS 自身のローカルネットワーク許可
ダイアログ用の文言)と `NSBonjourServices: _digicode._tcp` がある。
🟡 **LSP Helper が loopback のみに bind するなら、この macOS 側許可は原理的に不要**になるはずだが、
**本 spike では実測していない** = `NOT OBTAINED`。

**→ 導入 UX を数える (`06`) 際、「Gatekeeper / SmartScreen の警告を利用者が越える」手順は
donor の現状では発生する。** これは `06` の手順カウントに直接効く。

## 7. 流用可否の整理

| donor 資産 | 流用 | 根拠 |
|---|---|---|
| **Tauri アプリ骨格 (Rust + Web フロント)** | 🟢 **流用価値が高い** | 4 プラットフォーム分の実績 |
| **axum ローカル HTTP API + CORS + Origin 許可リスト** | 🟢 **流用価値が最も高い** | `02` が必須と結論した防御そのもの |
| **GitHub Actions リリース workflow (4 プラットフォーム)** | 🟢 **流用価値が最も高い** | 裁定 §11 の「現実的な配布経路」が完成品で存在 |
| **Tauri updater + minisign + `latest.json`** | 🟢 流用可 | 自動更新の完全性 |
| GitHub Releases でのホスティング | 🟢 流用可 | 追加費用なし |
| mDNS 探索 (`mdns_service.rs`) | 🔵 **LSP Helper には不要** | デバイス検出専用。持ち込むと multicast entitlement 問題まで連れてくる |
| `0.0.0.0` bind | 🔴 **流用しない** | D-1 |
| 認証なし設計 | 🔴 **流用しない** | D-2 |
| PNA ヘッダのみの対応 | 🔴 **流用では足りない** | §4 |
| 署名・notarization | ⚪ **存在しないので流用できない** | §6。新規に用意する判断が要る |

**採用の決定はしない**(裁定 §18)。上表は「何が既にあるか」の事実整理である。
