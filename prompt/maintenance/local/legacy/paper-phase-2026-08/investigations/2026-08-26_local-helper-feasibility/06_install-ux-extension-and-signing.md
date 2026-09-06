# 06_導入 UX を実手順で数える · Extension 案との比較 · 署名 / 配布

**Acceptance 2 / 9 / 12 に対応。裁定 §4 / §10 / §11。**
**検証の型:** 接続と permission は **real-fire**(`02`)。Native Messaging の要件と
Chrome Web Store の条件は **primary source**。**installer は作っていないので、
手順数は「measured な要素」と「documented な要素」を分けて示す。**

---

## 1. 「簡単」と言わずに数える — 案 A: Web app + Helper 単体 (Extension なし)

初めて DigiCode Text を開いた利用者が、高度解析を有効にするまで。

### macOS

| # | 操作 | 種別 | 根拠 |
|---|---|---|---|
| 1 | バナー「DigiCode Text Helper をインストールすると…」の **[有効にする] をクリック** | **クリック 1** | `04` phase1 実測でこのバナーが出ることを確認 |
| 2 | Helper の **.dmg をダウンロード** | 自動 | donor と同じ GitHub Releases 配布 (`03` §3) |
| 3 | .dmg を開いて **アプリを Applications へドラッグ** | **ドラッグ 1** | donor は dmg を生成している |
| 4 | 初回起動時 **Gatekeeper 警告**「開発元を確認できないため開けません」→ 右クリック→開く→[開く] | **🔴 許可 2 手**(右クリック起動 + ダイアログ) | 🔴 **donor には Developer ID 署名も notarization も無い** (`03` §6)。**署名すればこの手順は消える** |
| 5 | Helper が起動し、127.0.0.1 で待ち受け | 自動 | — |
| 6 | DigiCode Text のタブへ戻る | **クリック 1** | — |
| 7 | **ブラウザの「ローカルネットワークへのアクセスを許可しますか」→ [許可]** | **🔴 許可 1** | 🔴 `02` §2 実測。**これは省略できない** |
| 8 | 自動接続 → バナーが「有効」に変わる | **自動 44 ms** | `04` phase2 実測 |
| **合計** | | **クリック/ドラッグ 3 + 許可 3 + 再起動 0** | 署名すれば **クリック 3 + 許可 1 + 再起動 0** |

**管理者権限:** Applications へのドラッグは通常ユーザ権限で可(管理者アカウントなら)。
🟡 **管理下の学校 / 企業 Mac では Applications への書き込みが制限されることがある** — `~/Applications` へ
置ければ回避できるが、**本 spike では実測していない** = `NOT OBTAINED`。

### Windows

| # | 操作 | 種別 |
|---|---|---|
| 1 | バナーの [有効にする] をクリック | クリック 1 |
| 2 | `-setup.exe` (NSIS) または `.msi` をダウンロード | 自動 |
| 3 | 実行 | クリック 1 |
| 4 | 🔴 **SmartScreen「WindowsによってPCが保護されました」→ 詳細情報 → 実行** | **🔴 許可 2 手** |
| 5 | 🟡 **UAC 昇格**(インストール先が Program Files の場合) | **🟡 許可 1** |
| 6 | インストーラの [次へ]×n → [完了] | クリック 2〜3 |
| 7 | DigiCode Text のタブへ戻る | クリック 1 |
| 8 | 🔴 **ブラウザのローカルネットワーク許可 → [許可]** | **🔴 許可 1** |
| 9 | 自動接続 | 自動 |
| **合計** | | **クリック 5〜6 + 許可 4 + 再起動 0** |

🔴 **UAC を消す方法は実在する**: NSIS を**ユーザ領域インストール**(`%LOCALAPPDATA%`)にすれば
昇格不要になる。**Authenticode 署名**があれば SmartScreen 警告も消える(評判の蓄積が要る)。
**donor には Windows 署名が無い** (`03` §6)。

### 一括配布 (学校 / 企業)

| 手段 | 可否 |
|---|---|
| `.msi` を **Intune / Active Directory GPO** で配布 | 🟢 donor が既に `.msi` を生成している |
| macOS を **MDM (Jamf 等)** で `.pkg` 配布 | 🟡 donor は `.dmg` のみ。`.pkg` 生成は Tauri で追加可能だが**未実測** |
| **ブラウザの Local Network 許可を管理者が一括付与できるか** | 🔴 **NOT OBTAINED** — Chrome の enterprise policy に相当項目があるかを本 spike では確認していない。**確認できれば教室運用が大きく楽になる重要項目** |

## 2. 案 B: Web app + Extension + Native Messaging + Helper

### 一次情報で確認した要件

Chrome 公式 "Native messaging" ドキュメントの実記述:

| 要素 | 内容 |
|---|---|
| **Windows** | manifest はどこでもよいが、**レジストリキー**が必要 — `HKEY_LOCAL_MACHINE\SOFTWARE\Google\Chrome\NativeMessagingHosts\<name>` または `HKEY_CURRENT_USER\...` |
| **macOS システム全体** | `/Library/Google/Chrome/NativeMessagingHosts/<name>.json` |
| **macOS ユーザ単位** | `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/<name>.json` |
| Chromium / Chrome for Testing | **それぞれ別のディレクトリ**が定義されている |
| 必須フィールド | `name` · `description` · `path` · `type: "stdio"` · **`allowed_origins`** |
| 🔴 `allowed_origins` | **ワイルドカード不可。`chrome-extension://[extension-ID]/` を列挙する** |
| **メッセージサイズ上限** | native host → Chrome **1 MB** / Chrome → native host 64 MiB |

### そこから出る UX / 保守の含意

| # | 含意 | Sev |
|---|---|---|
| B-1 | 🔴 **利用者が 2 つ入れることになる** — Extension(ストアから)と Helper(installer)。裁定 §4 が「UX 上のマイナス」と定めたケースにそのまま当たる | 🔴 |
| B-2 | 🔴 **Helper の installer が extension ID を知っていなければならない。** `allowed_origins` にワイルドカードが使えないため | 🔴 |
| B-3 | 🔴 **Chrome と Edge でストアが違えば extension ID も違う。** Helper は**両方の ID を allowed_origins に持ち、両方のブラウザの manifest 置き場に書き込む**ことになる(Edge の置き場所は本 spike で未確認 = `NOT OBTAINED`) | 🔴 |
| B-4 | 🟡 **LSP のレスポンスに 1 MB 上限がかかる。** `workspace/symbol` は実測で 23 件だったが、大規模プロジェクトの補完・参照結果は 1 MB に近づきうる。**分割送信の実装が要る可能性** | 🟡 |
| B-5 | 🟡 **ストア審査が更新の律速になる。** Helper 側だけ直したいときも、extension 側の変更が絡むと審査待ち | 🟡 |
| B-6 | 🟡 **バージョン整合が 3 者になる** — Web アプリ / Extension / Helper | 🟡 |
| B-7 | 🟢 **Extension の一括配布は enterprise policy で可能**(`ExtensionInstallForcelist` 系)。学校での配布はむしろ楽になりうる | 🟢 |
| B-8 | 🟢 **Local Network Access permission を回避できる**(通信がブラウザのネットワークスタックを通らないため)。ただし `02` の実測で **案 A は許可 1 回で通る**ことが分かっているので、この利点は小さい | 🟢 |
| B-9 | ⚪ **Chrome Web Store の登録には一回限りの登録料が要る**(公式ドキュメントに「pay a one-time registration fee」とあるが**金額はページに記載がない** = `NOT OBTAINED`) | ⚪ |

### 案 A と案 B の比較

| 軸 | **A: Helper のみ** | **B: Extension + Helper** |
|---|---|---|
| 利用者のインストール数 | **1** | **2** |
| ブラウザ許可 | **1 回**(Local Network Access) | Extension のインストール許可 |
| Edge 対応 | **追加作業ゼロ**(同じ Web ページ) | 🔴 別ストア・別 ID・別 manifest 置き場 |
| 実測で成立を確認したか | ✅ **`02` `04` で全経路を実測** | ⚪ **本 spike では実装・実測していない** |
| 更新の律速 | Helper 自身のみ | + ストア審査 |
| version 整合 | 2 者 | 3 者 |
| メッセージサイズ制限 | 無し(WebSocket) | **1 MB** |
| enterprise 一括配布 | msi / MDM | msi / MDM + ExtensionInstallForcelist |

🔴 **裁定 §15 の優先順位に照らすと、案 A は実測で成立し、案 B が解く問題(permission 回避)は
案 A では「許可 1 回」で足りている。** よって案 B を選ぶ積極的理由は、
本 spike の実測範囲では見つからなかった。**ただし採用は決めない**(裁定 §18)。

## 3. 署名 / notarization / 配布 — 現実的な経路

**donor に既にあるもの** (`03` §3、実読):

- 4 プラットフォームの GitHub Actions ビルド (macOS Intel / macOS ARM / Windows / Linux)
- dmg · NSIS exe · msi · AppImage · deb · rpm
- **Tauri updater + minisign 署名 + `latest.json`** → **自動更新は完成している**
- **GitHub Releases がホスティング**(追加費用なし)

**donor に無いもの** (`03` §6、リポジトリ全文検索で 0 件):

| 必要なもの | 目的 | 無いとどうなるか |
|---|---|---|
| **Apple Developer ID Application 証明書 + notarization** | macOS Gatekeeper | §1 の手順 4(許可 2 手)が発生し、**「開発元を確認できない」という文言が初学者を止める** |
| **Windows Authenticode 証明書** | SmartScreen | §1 の手順 4(許可 2 手)が発生 |

**現実的な経路(整理のみ。実装しない):**

1. **Apple Developer Program**(組織アカウント)→ Developer ID 証明書 → `codesign` →
   `notarytool submit` → `stapler`。GitHub Actions から実行でき、
   **donor の workflow に env とステップを足す形**で入る。
2. **Windows**: OV/EV コード署名証明書、または **Azure Trusted Signing** のような従量型サービス。
   EV は SmartScreen の評判蓄積を早める。
3. **更新チャネル**: donor の `latest.json` に stable / beta を分ける余地がある(現在は単一)。
4. **rollback**: GitHub Releases に旧版が残るので、`latest.json` を戻せば実現できる。
   **donor に明示的な rollback 手順は無い。**
5. **checksum**: minisign の `.sig` が完全性を担保している。別途 SHA256 を出すかは運用判断。

🔴 **費用と手間はゼロではない。** 年額の開発者プログラム費用と証明書費用、
および**署名鍵の管理**が運営側に乗る。これは `07` の engineering cost に計上する。

**具体的な年額は本 spike では調べていない = `NOT OBTAINED`**(裁定 §11 は「整理」を求めており、
価格調査は §13 が server 費用について許可した範囲に限られるため)。

## 4. 自動起動 / uninstall

| 項目 | 実測・所見 |
|---|---|
| **自動起動** | 🔴 **NOT OBTAINED**。Tauri には autostart plugin があるが donor は使っていない(`tauri.conf.json` の plugins は updater と deep-link のみ)。**「PC を再起動したら Helper が動いていない」は現実的な失敗モード** |
| **代替: deep link で起動** | donor は `digicode-finder://` を登録済み。**Web ページから Helper を起動する導線に使える**(未実測) |
| **uninstall** | Windows は NSIS/MSI の標準アンインストーラ。macOS は Applications から削除。**board pack の cache も消す必要がある**(H4 を採る場合) |
| **初回起動** | `04` 実測では Helper 起動から接続まで 44 ms。**ただし clangd の初回 index は別**(1.8 s) |
