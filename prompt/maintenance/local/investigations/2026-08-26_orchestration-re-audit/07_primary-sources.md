# 07_web 一次情報レーン — Codex が到達できなかった外部ソース

**checker:** Claude subagent · packet `DT6-D4b-primary-source-verification` · `LANE: INVESTIGATION`
**手段:** WebSearch / WebFetch。**取得日 2026-08-26。**

**このレーンの存在理由:** Codex 環境は DNS 段階で遮断されており(`06_…md` §10、10 URL すべて RC=6)、
**外部一次情報を取得できるレーンはこれ 1 本だけだった。**
Human 指示 §5-E の「必要であれば異なる検索戦略を 2 lane で」は結果的に必須構成だった。

**packet の hard rule:**

> 一次情報に着地できない claim は `NOT_OBTAINED` と報告せよ。**自分の訓練知識で穴を埋めるな。
> 想起を検証済みの事実として提示するな。** 全 claim に、実際に fetch した URL とページ表示日を付けよ。

---

## 1. 検証表(S1–S12)

| id | claim | 判定 | 一次情報 URL | ページ日付 | 引用 / 数値 |
|---|---|---|---|---|---|
| **S1** | 第三者が `.vsix` を Marketplace から取得しオフライン配布物として再配布してよいか | **PARTIALLY_CONFIRMED**(一律禁止でも自由でもない) | `cdn.vsassets.io/v/M264_20251020.18/_content/Microsoft-Visual-Studio-Marketplace-Terms-of-Use.pdf` | "Last Updated September 2025" | §3: `"you may not access, search, obtain or attempt to obtain any Offerings … through any means other than directly from Microsoft's publicly supported interfaces"` / §2.b: `"you may not install, reverse-engineer, import or use Marketplace Offerings in products and services except for the In-Scope Products and Services."` / §2.a: `"Your right to use any Publisher Offering is governed by separate terms of use provided by the Publisher"` |
| S1 補 | 旧版との差分 | **CONFIRMED** | `cdn.vsassets.io/v/M190_20210811.1/…Terms-of-Use.pdf` | "Last Updated June 2021" | 旧 §1.f は `"through any means other than Microsoft's publicly supported interfaces"`。**2025 年版で `import, install, or use … in any products or services except for the In-Scope Products and Services` が明文追加された** |
| **S2** | VS Code と拡張のオフライン / air-gapped 導入について MS が公式に何を文書化しているか | **CONFIRMED** | `code.visualstudio.com/docs/configure/extensions/extension-marketplace` · `/docs/enterprise/extensions` · `/blogs/2025/11/18/PrivateMarketplace` | blog 2025-11-18 | `"You can manually install a VS Code extension packaged in a .vsix file"` / `"select Download VSIX"` / `"This is useful when there are connectivity concerns"` / enterprise: `"Download and host public extensions … with support for air-gapped environments"` / `"Private marketplace is currently available to GitHub Enterprise customers."` / `"Connecting from VS Code Server or VS Code for the Web is not supported."` |
| S2 補 | 再ホストの MS 公式手順 | **CONFIRMED** | `github.com/microsoft/vsmarketplace/blob/main/privatemarketplace/latest/README.md` | main、取得 2026-08-26 | `"We recommend re-hosting public extensions only if you do not use the upstreaming feature OR you need to control specific extension versions"`。手順は Download VSIX → Private Marketplace へアップロード。**再配布の法的条件についての記述は無し** |
| **S3** | PlatformIO はネット無しで platform / toolchain / library を入れられるか | **PARTIALLY_CONFIRMED** | `docs.platformio.org/…/pkg/cmd_install.html` · `/pkg/cmd_pack.html` · `/projectconf/…/cache_dir.html` | "Documentation v6.2.0b1 (latest)"(日付表記なし) | `"Install a package and its dependencies from a local folder. A path should start with file:// or symlink://"` / `"Install … from a local TAR or ZIP archive."` / pkg pack: `"Create a tarball from a package"` / cache_dir: `"…downloaded packages…"`。🔴 **「オフラインモード」「公式ミラー」を名指しした公式文書は発見できず** |
| **S4** | pioarduino とは何か / 誰が保守 / PlatformIO との関係 / 現状 | **CONFIRMED** | `github.com/pioarduino/platform-espressif32`(raw README, develop) | 取得 2026-08-26 | `(p)eople (i)nitiated (o)ptimized (arduino)`。**PlatformIO を置き換えるものではなく** PlatformIO エコシステム内の platform(platform-espressif32 のコミュニティ fork)。安定版基準 `"espressif Arduino 3.3.11 and IDF v5.5.5"`。**board 関連 issue は PR 無しでは受け付けない**旨を明記 |
| **S5** | arduino-cli のオフライン導入 | **PARTIALLY_CONFIRMED**(library は可 / core は不可) | `arduino.github.io/arduino-cli/1.5/commands/arduino-cli_lib_install/` · `…_core_install/` | docs v1.5(日付表記なし) | lib: `--zip-path`(`arduino-cli lib install --zip-path /path/to/WiFi101.zip`)、`--git-url` あり。🔴 **core install のフラグは `--no-overwrite` `--run-post-install` `--run-pre-uninstall` `--skip-post-install` `--skip-pre-uninstall` のみで、local/zip/offline 相当のフラグは無い**。`--additional-urls` は `"Comma-separated list of additional URLs for the Boards Manager"`。package_index 仕様書に `file://` / ローカルパスの記述なし |
| **S6** | Arduino Cloud の現行プラン・価格・上限、およびブラウザからの書込方式 | **CONFIRMED**(一部 NOT OBTAINED) | `cloud.arduino.cc/plans` · `github.com/arduino/arduino-create-agent`(raw README, main) | 取得 2026-08-26 | **Free**: Things 2 / **Compilations 25/日** / **AI Assistant 30 interactions/月** / データ保持 1 日。**Maker $72/年**、**Team $1,000/年**、**School $20/member/年**、Enterprise custom。書込は Web Serial ではなく常駐エージェント: `"The Arduino Cloud Agent is a single binary that will sit on the traybar and work in the background. It allows you to use the Arduino Cloud to seamlessly upload code to any USB connected Arduino board … directly from the browser."`(Browser ⇄ WebSocket ⇄ Agent ⇄ serial ⇄ Board) |
| **S7** | Codey Online は実在するか、AI 生成 / クラウドコンパイル / Web Serial 書込 / ライブラリ同梱 / 部品カタログ、無料枠と有料価格 | **CONFIRMED**(実在。全項目該当) | `codey.online/` | フッター "© 2026 OTRONIC" | `"Direct USB upload over Web Serial — no drivers, no Arduino IDE required."` / `"📦 Libraries Already Installed — Library installs are a thing of the past. The most popular Arduino & ESP32 libraries — Adafruit GFX, FastLED, ArduinoJson, WiFiManager, ESP-NOW, NeoPixel, Servo, Wire, SPI and many more — are pre-installed on our compile servers. Just write #include and it works. No ZIPs, no version conflicts, no waiting."` / `"🛠️ Auto Error Fixing"` / `"🎁 Starter Kits — Open a kit URL and Codey already knows which board and components you have. Great for classrooms"`。部品カタログ: HC-SR04 / DHT11 / SG90 / SSD1306 / WS2812。**価格: Starter Free `"5 AI messages per day"` / Pro €9.99/mo `"Unlimited AI messages"`**。運営元 `"built by OTRONIC, a Netherlands-based electronics company"` |
| **S8** | Wokwi はシミュレーションのみか、実機書込もするか。価格 | **CONFIRMED**(シミュレータ) | `wokwi.com/` · `wokwi.com/pricing` | 取得 2026-08-26 | 自称 `"World's most advanced ESP32 Simulator"`。**実機フラッシュの記載なし**(実ハード言及は Tiny Tapeout 提携のみ)。**Community €0/mo · Hobby €5.6/mo · Hobby+ €8.1/mo · Wokwi Pro €20/seat/mo**(年払時)、Classroom は要問合せ |
| **S9** | `LocalNetworkAccessAllowedForUrls` は Chrome/Edge の公式ポリシー一覧に実在するか | **CONFIRMED** | `chromium.googlesource.com/chromium/src/+/main/components/policy/resources/templates/policy_definitions/LocalNetworkAccessSettings/LocalNetworkAccessAllowedForUrls.yaml` · `learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/localnetworkaccessallowedforurls` | Edge doc: ms.date 2026-05-20 / updated_at 2026-06-15 | Chromium: `supported_on: chrome.*:139- / chrome_os:139- / android:140-`、`type: list`、example `http://www.example.com:8080` / `[*.]example.edu` / `*`。desc: `"List of URL patterns. Network requests initiated from websites served by matching origins are not subject to Local Network Access checks."`。Edge: **Windows ≥140 / macOS ≥140 / Android ≥144 / iOS: Not supported**、`Data type: List of strings`、GP path `Administrative Templates/Microsoft Edge/Network settings` |
| **S10** | Web Serial / Web Bluetooth の現行ブラウザ対応(「Firefox 151+ が Web Serial 対応」の検証を含む) | **PARTIALLY_CONFIRMED**(🔴 重要な留保あり) | `raw.githubusercontent.com/mdn/browser-compat-data/main/api/Serial.json` · `/Bluetooth.json` · `developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/151` | Firefox 151 = 2026-05-19 / MDN Web_Serial_API last modified 2026-05-26 | Serial: chrome 89 / edge mirror / **firefox 151** / firefox_android false / safari false / webview_android false / chrome_android 138 だが **`partial_implementation: true`** + `"Serial ports are only available if they're provided by Bluetooth RFCOMM serial port emulation."`。🔴 **Firefox 151 リリースノート原文**: `"The Web Serial API is supported on desktop platforms … Use of the API will require that website users install a synthetically generated site permission add-on — this is the same approach used to safely manage access to WebMIDI."`。Bluetooth: chrome 70(Linux 既定無効)/ chrome_android 56 / **firefox false** / **safari false** |
| **S11** | ESP-IDF Component Manager / ESP Component Registry は何を管理し、「verified/managed environment」相当があるか | **PARTIALLY_CONFIRMED** | `docs.espressif.com/projects/idf-component-manager/en/latest/` · `/reference/manifest_file.html` · `/use/how_to_partial_mirror.html` | 取得 2026-08-26 | Component Manager は `"integrates with ESP-IDF to download and manage components from the Registry"`、Registry は components.espressif.com が `"the central repository for ESP-IDF-compatible components"`。manifest は registry / git / local path 依存とバージョン制約をサポート。**「verified」「managed environment」相当の認定・保証の概念は公式ドキュメント上に見当たらない**。🔴 **ただし Partial Mirror は公式機能**: `"A partial mirror contains only a subset of the components available in the main mirror. This is useful when you have limited network connectivity or bandwidth, or when you want to restrict which versions of components are available to your developers."`(`compote registry sync …` → `local_storage_url: - file:///opt/compote-mirror`、HTTP 配信も可) |
| **S12** | 「利用者が Board/Library/Package Manager に一切触れない検証済み管理環境を、コンパイラと AI が同一の正本として読む」製品は既存か | 🔴🔴 **CONTRADICTED**(=「存在しない」は誤り。極めて近い製品が複数実在) | `codey.online/` · `pleasedontcode.com/` · `cloud.arduino.cc/plans` | 取得 2026-08-26 | **Codey Online**: ライブラリはコンパイルサーバに pre-installed(Library Manager に触れない)、ボードはカタログから選択(Board Manager 不要)、同じカタログを AI が参照して部品→ライブラリを自動選択、クラウドコンパイル + Web Serial 書込。**PleaseDontCode**: `"Pick your board from 35+ supported…"`、AI は `"knows the pin map, voltage, I/O limits and core of each supported board; it generates a wiring schematic in sync with the code; it actually compiles the firmware"`、USB / WiFi(POTA) で書込、無料枠 `"3 credits per month and 1 device, forever"`。**Arduino Cloud**: キュレートされた board/library + クラウドコンパイル + Claude ベース AI Assistant |

---

## 2. 一次情報に到達できなかったもの

| id | 未取得の部分 | 理由 |
|---|---|---|
| S3(一部) | PlatformIO の「オフラインモード」を明示した公式ドキュメント、公式ミラー / パッケージキャッシュ配布機構 | `file://` / ローカルアーカイブ導入・`pio pkg pack`・`cache_dir` は公式に確認できたが、「インターネット無しで platform/toolchain を一式導入する」ことを公式が**手順として保証する**記述は **NOT_OBTAINED**。該当議論は community フォーラムと GitHub issue(= 一次仕様ではない)にしかない |
| S6(一部) | Arduino Cloud の「sketch 数 100 / storage 100MB」等の Web Editor 側上限 | `support.arduino.cc` は **Cloudflare の JS チャレンジ**で WebFetch / curl とも本文取得不可(403 / "Just a moment...")。取得できたのは `cloud.arduino.cc/plans` の表のみで、そこに sketch 数・storage の行は無い |
| S11(一部) | 「verified / qualified component」に相当する制度の**不存在** | 公式ドキュメントに記述が無いことによる**推定**であり、明示的な否定文を一次ソースで取れたわけではない |
| S9(一部) | `chromeenterprise.google` のポリシー詳細ページ本文 | 完全に JS レンダリングで、ページタイトル(ポリシー名の実在)以外は取得できず。値形式・対応バージョンは **Chromium ソースの policy 定義 YAML(= Chrome の一次定義元)と Microsoft Learn** で代替取得した |

---

## 3. 🔴 前提を否定する事実(5 件)

### 3-1. S12 の「そういう製品は無い」という前提は成立しない

**Codey Online**(蘭 OTRONIC)と **PleaseDontCode**(伊 ITALCODY)は、いずれも

- 利用者が **Board Manager / Library Manager / パッケージ管理に触れない**
- **サーバ側で検証済みの環境をコンパイラが使う**
- **同じボード・部品カタログを AI が読む**

という組み合わせを**すでに商用提供している**。Codey は無料 5 AI メッセージ/日・Pro €9.99/mo、
PleaseDontCode は無料 3 credits/月・1 device。Arduino Cloud も
(Claude ベース AI Assistant + キュレート済みライブラリ + クラウドコンパイル)で同じ方向に立っている。

🔴 **PleaseDontCode は S005 の調査に一度も登場しない。**

### 3-2. S1 の「Marketplace 再配布は不可」という単純な前提は、Microsoft 自身の運用と矛盾する

MS は公式に `Download VSIX` を提供し、Private Marketplace で公開拡張の **re-hosting** と
**air-gapped 環境**を明文サポートしている(GitHub Enterprise 顧客限定、VS Code Server /
VS Code for the Web からの接続は非対応)。

一方 ToU(2025 年 9 月版)は「In-Scope Products and Services 以外の製品・サービスに Offering を
import/install/use してはならない」と明記しており、**自社製品にバンドルする方向は明確に禁止側**。

→ **「オフライン束ね」が社内配布か製品同梱かで結論が反転する。**

### 3-3. S10 の「Firefox 151+ は Web Serial 対応」は、無条件では成立しない

Mozilla 公式リリースノートは (a) **デスクトップ限定**、(b) 利用にはサイトごとに生成される
**site permission add-on のインストールをエンドユーザーに要求**する、と明記している。
**Chrome/Edge と同等の体験にはならない。**
また Chrome for Android の Web Serial は `partial_implementation` で、Bluetooth RFCOMM 経由のポートのみ。

### 3-4. S6 のブラウザ書込方式は Web Serial ではない

Arduino Cloud は今も**常駐バイナリ**(Arduino Cloud Agent、WebSocket + REST)経由でシリアルに流す方式。
つまり **「ブラウザだけで完結する書込」は Arduino 公式ではなく Codey / PleaseDontCode 側の差別化点**に
なっている。

### 3-5. S11 の Partial Mirror は、S3 で PlatformIO に見つからなかったものを Espressif は公式に持っている

`compote registry sync` + `local_storage_url` により、**限定ネットワーク / 版固定の運用が
公式手順として存在する。**
→ **エコシステム間で「管理環境の再現性」に関する公式サポート水準に差がある。**
S005 は ESP-IDF を「offline installer の存在」だけで扱っていた。

---

## 4. baton への訂正

| baton | 現在の記述 | 訂正 |
|---|---|---|
| **13** | 「Firefox 151+ has Web Serial」 | 🔴 **無条件では成立しない** — desktop 限定 + site permission add-on のエンドユーザーインストールを要求。Chrome for Android は `partial_implementation`(Bluetooth RFCOMM 経由のみ) |
| **31** | 「🔴 実挙動は未verify — ドキュメントの存在確認のみ」 | 🟢 **一次情報で確認、格上げ可能** — Chromium policy 定義 YAML(一次定義元)で `chrome.*:139-` / `chrome_os:139-` / `android:140-`、Edge は Win/macOS ≥140・Android ≥144・**iOS 非対応**。値は list of strings。**実配布して許可が付く実挙動は依然 未verify** |
| **37** | 「直接競合 Codey Online が実在する」 | **PleaseDontCode を追加**。Codey の全項目を一次情報で確認済み(価格・機能とも) |

---

## 5. 出典一覧

- VS Marketplace ToU (current) / (June 2021 版)
- VS Code Extension Marketplace docs / Enterprise extensions / Private Marketplace README / Network Connections
- pio pkg install / pio pkg pack / cache_dir
- pioarduino/platform-espressif32
- arduino-cli lib install / core install
- Arduino Cloud Plans / arduino-create-agent
- Codey Online / PleaseDontCode
- Wokwi / Wokwi Pricing
- Chromium `LocalNetworkAccessAllowedForUrls` policy / Edge policy
- MDN BCD `Serial.json` / `Bluetooth.json` / Firefox 151 release notes
- IDF Component Manager / Partial Mirror
