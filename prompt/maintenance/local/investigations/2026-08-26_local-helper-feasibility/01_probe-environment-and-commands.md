# 01_probe 環境と実行コマンド — 再現手順

**実施:** 2026-08-26 (Session 003 後半) / **PRIMARY_OBJECTIVE:** Local LSP Helper Feasibility
**役割:** 以降の全ファイルが引く数値の出所を 1 箇所に固定する。引用側は再掲せずここを指す。

---

## 1. 隔離の担保 (裁定 §18 / §20)

| 対象 | 状態 | 実測 |
|---|---|---|
| `DigiCode` (donor) | **READ ONLY・未変更** | 開始・終了とも `bb35c3b8025610299bf952c2c45eda2196a07401` / dirty 0 |
| `digicode-compile-api` (donor) | **READ ONLY・未変更** | 開始・終了とも `3376746f1e5a4ca039e0cade279741f16612fccf` / dirty 0 |
| **`DigiCode-Helper` (donor、本 objective で新規に監査)** | **READ ONLY・未変更** | 開始・終了とも `fa95dfd67ee83d881f93be7641cc9cef171165a2` / dirty 0 |
| donor の governance | **そもそも存在しない**(`prompt/` も `CLAUDE.md` も 0 件) | — |
| production (Cloud / Cloudflare / DNS / deploy) | **一切接続していない** | 外部通信は OSS の公開ページ・GitHub API・各社の価格ページ・esp-clangd の release 取得のみ |
| digicode-text repo | **production 依存 0**。probe 一式は repo 外 scratchpad | — |
| probe が立てた service | `127.0.0.1:8771` (Helper) / `0.0.0.0:8443`+`:8442` (probe Web アプリ) | 全て使い捨て。終了時に停止 |

## 2. 実測環境

| 要素 | バージョン (実測) |
|---|---|
| OS / arch | Darwin 24.6.0 / `x86_64` / LAN IP `<LAN-IP>` |
| Node.js | v20.20.2 |
| **ブラウザ** | **Google Chrome for Testing 148.0.7778.96**(playwright-core 1.62.1 で駆動) |
| clangd (比較用) | Apple clangd 17.0.0 |
| **esp-clangd** | **Espressif clangd 21.1.3** (`esp-21.1.3_20260408`, 既定 target `riscv32-esp-unknown-elf`) |
| arduino-cli / core | 1.3.1 / `esp32:esp32 3.3.8` |
| Tauri donor | DigiCode Finder 1.5.3 |

### secure context を本物にした方法

自己署名証明書を作り、その **SPKI ハッシュを Chrome に許可**して起動した
(`--ignore-certificate-errors-spki-list=<SPKI>`)。
**証明書エラーを無視させるのではなく、その origin を本物の secure context にする**ためである。
これをしないと `isSecureContext` が false になり、**測りたい条件そのものが消える**。

実測で `isSecureContext: true` を確認したうえで各測定を行っている。

### public address space を再現した方法

`Content-Security-Policy: treat-as-public-address` をページに付けた。
**Cloudflare 等から配信された本番アプリと同じ address space 分類**にするための、仕様上の手段。
これを付けない測定は本番を再現していない(`02` §1)。

## 3. 主要コマンド

```bash
# 自己署名証明書と SPKI
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 2 -config san.cnf
openssl x509 -in cert.pem -pubkey -noout | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary | openssl enc -base64        # → SPKI

# probe Helper (127.0.0.1 のみ bind / Origin 検証 / token 検証 / clangd bridge)
ALLOWED_ORIGINS=... PROJECT_ROOT=... HELPER_TOKEN=... node helper/helper.js

# probe Web アプリ (HTTPS + HTTP、/app と /app-public、/editor と /editor-public)
DIST_DIR=... node helper/webapp.js

# 接続と permission の実測 (GRANT=0 / GRANT=1 の A/B)
GRANT=0 node probe/helper_connect.js
GRANT=1 node probe/helper_connect.js

# Helper のライフサイクル 5 フェーズ
node probe/helper_scenario.js

# clangd のセッションあたりメモリと線形性
node probe/concurrency.js <root> <clangd> <N> [extra args]

# esp-clangd の偽診断ゼロ構成
node probe/probe_cpp.js <root> <esp-clangd> [--query-driver=...]
```

## 4. 検証の型 (rule 04)

| 型 | 対象 |
|---|---|
| **real-fire** | HTTPS→localhost の fetch / WebSocket · Local Network Access permission の有無 A/B · Origin / token の真理値表 · loopback bind の確認 · Monaco↔Helper↔clangd 全経路 · Helper 不在/死亡/復活/リロードの 5 フェーズ · esp-clangd の偽診断 0 件 · 同時 8 セッションのメモリ線形性 · bundle / board pack のサイズ |
| **primary source** | WICG Local Network Access 仕様 · chromestatus の Chrome バージョン · Chrome 公式 Native Messaging ドキュメント · Chrome Web Store 登録ドキュメント · donor リポジトリの実読 · esp-clangd / LLVM の release サイズ · さくらのVPS / DigitalOcean の公式価格ページ |
| **NOT OBTAINED** | Windows / Linux 実機での再現 · 実 installer の作成と実配布 · 実 notarization · 実 100 人負荷 · Edge の native messaging 置き場 · Chrome enterprise policy による Local Network 許可の一括付与 · 自動起動 · Extension 案の実装 |

## 5. 自分の probe に見つけた欠陥(結論より先に出す)

前半 objective の P-1〜P-5 に続く。**測定器の欠陥を結論に混ぜない**ため(rule 04 / PT-4 系)。

| # | 欠陥 | 影響 | 対処 |
|---|---|---|---|
| Q-1 | probe Web アプリが **起動時に HTML を 1 回だけ読み込んで**いた | `app.html` に追加した計測(permission query / `targetAddressSpace`)が**走っていないのに、他項目は緑に見えた** | リクエストごとに読む形へ変更して再実測 |
| Q-2 | Helper の停止を **`pkill -f "helper/helper.js"`** で行っていたが、`node helper.js` として起動した実体に**マッチしなかった** | **Phase 1「Helper 不在」が測れておらず、`helper: "connected"` になっていた**。fallback を実証したつもりで何も実証していない | **ポートで殺す**方式へ変更し、さらに **「ポートが空いていること」を前提条件として測定してから** phase 1 に入るようにした |
| Q-3 | Origin 真理値表を取るループで **シェルの引用符が壊れ**、不正なヘッダを送っていた | Helper が **400** を返し、**「Origin 検証が 403 を返さない」と読めた**。単発の verbose 実行では正しく **403** だった | 引用を直して再実測。`02` §4 の表は修正後 |
| Q-4 | clangd の background index が scratchpad 内の**同名ヘッダ**(別 fixture)を拾った | go to definition が別 fixture のファイルを指すことがある | **probe 環境の副作用**として結論に使わない。`references` は正しく対象内 3 箇所を返しており、そちらを採る |

🔴 **Q-2 は本 objective で最も危険だった。** 「Helper 無しでも壊れない」は本 objective の中心主張で、
**それを Helper が動いたまま測っていた**。前提条件を測る一行を入れるまで、
自分の測定が何も言っていないことに気づけなかった。
