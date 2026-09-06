# 01_method / sources / 型ラベル / やっていないこと

---

## 1. 型ラベルの定義(rule 04 §Verification-type labeling)

本調査の主張には次のいずれかが付く。**付いていない主張は書かない。**

| ラベル | 意味 |
|---|---|
| **primary source** | 公式 documentation / 公式 GitHub issue / release notes / 公式ポリシーページを直接読んだ |
| **secondary source** | 二次記事・フォーラム・要約。**単独では結論の根拠にしない**(運用トラブルの存在証拠としてのみ使う) |
| **inherited real-fire** | 本 project の S002 / S003 が**実際に走らせて測った**値。出典 investigation を明示する |
| **inferred** | 上記の組み合わせからの推論。**推論であることを明記する** |
| **NOT OBTAINED** | 取れていない。推測で埋めない |

🔴 **本調査そのものは real-fire を 1 件も行っていない。** 新しい実測は無く、
外部は文献調査、内部は S001–S003 の実測の再利用である。この境界は結論の強さに直結する。

## 2. 一次情報(primary source)の一覧

### PlatformIO / pioarduino

| # | 出典 | 何を取ったか |
|---|---|---|
| P-1 | `docs.platformio.org` `core/userguide/pkg/cmd_install.html` §Package Specifications | ローカル指定の全形式: `file://<folder>`(hard copy)· `symlink://<folder>` · `file://<tar or zip>`(`.tar.gz`/`.tar`/`.tgz`/`.zip`)· repository 各 scheme · registry。**「Registry-based installation requires network access, while local `file://` and `symlink://` specifications work offline」**、および archive/folder には `library.json` / `platform.json` / `package.json` の manifest が必須 |
| P-2 | `docs.platformio.org` `projectconf/.../platform.html` | platform は registry / git URL / commit 固定で指定できる。バージョン固定を強く推奨 |
| P-3 | `docs.platformio.org` `.../lib_deps.html` | `lib_deps` は registry 名 / semver / git URL / archive URL / `名前=URL` を受ける |
| P-4 | `docs.platformio.org` `core/userguide/cmd_settings.html` | `enable_cache`(既定 Yes)· `enable_telemetry`(既定 Yes)· `check_platformio_interval`(既定 7 日)· `enable_proxy_strict_ssl`。**offline mode / private registry / mirror を指定する設定は存在しない** |
| P-5 | `docs.platformio.org` `.../cache_dir.html` | cache 位置は `core_dir/cache`、`PLATFORMIO_CACHE_DIR` で変更可 |
| P-6 | `docs.platformio.org` `.../lib_extra_dirs.html` | **`lib_extra_dirs` は 6.0 で deprecated**、次のメジャーで削除予定。Local Folder / Symbolic Link 機能へ誘導 |
| P-7 | GitHub `platformio/platformio-core` issue **#5062**(2025-01-09 open、**maintainer 応答なし**) | mirror fallback が機能せず同じ mirror を再試行する。加えて **「packages を `.platformio/packages` へ手で置いても Tool Manager が認識せずダウンロードを試みる」**。カスタム mirror / private registry の設定方法は issue 中に示されていない |
| P-8 | GitHub `pioarduino/platform-espressif32` releases | platform は GitHub Releases の zip として配布(`.../releases/download/stable/platform-espressif32.zip`)。PlatformIO 側から URL 直指定でインストールできる |

### Arduino

| # | 出典 | 何を取ったか |
|---|---|---|
| A-1 | GitHub `arduino/arduino-cli` issue **#3073**(2026-01-06 open、label `type: enhancement`、担当なし) | 🔴 **arduino-cli は `downloads.arduino.cc` の default index を「no matter what」読みに行き、無効化・上書き・置換する手段が公式に存在しない。** 必要な core が全て入っていても、追加 index を設定していても、`file://` index を使っていても同じ。air-gapped / CI / 企業 firewall / lab / 教室で不可避の外向き通信・起動遅延・警告が出る |
| A-2 | GitHub `arduino/arduino-ide` issue **#122**(2020-02-01 open、milestone なし、担当なし) | 🔴 **Arduino IDE 2.x に portable mode は無い。** 1.x にあった `portable` フォルダ方式は 2.x で動かない。6 年以上 open のまま |
| A-3 | GitHub `arduino/arduino-cli` issue **#1772**(2022-06-16、**`conclusion: declined` で close**) | 🔴 **`library.properties` の `depends=` は Library Manager 掲載ライブラリしか受け付けない。** git URL / zip path を dependency として書く提案は**却下された** |
| A-4 | `arduino-cli` docs / issue 群 | `lib install --git-url` / `--zip-path` は `enable_unsafe_install=true` が必要。**zip からインストールした場合 dependency は解決されない**(`--no-deps` 相当が既定の挙動) |
| A-5 | Arduino Help Center(free plan compilation limits) | Cloud Editor 無料プランは **1 日 25 コンパイル**。日付変更でリセット。無制限化は有料プラン。*(ページ本体は 403 で直接取得できず、検索結果の引用による — **primary source としては弱い**。→ `08` §9 の unknown に登録)* |
| A-6 | `github.com/arduino/arduino-create-agent` + Arduino Help Center | 🔴 **Arduino Cloud Editor からボードへ書き込むには、利用者 PC に Arduino Cloud Agent(単体バイナリ、常駐)のインストールが必要。** ブラウザだけでは書き込めない |

### ブラウザ / 企業配布

| # | 出典 | 何を取ったか |
|---|---|---|
| B-1 | `developer.chrome.com/blog/local-network-access` | Local Network Access permission は **Chrome 142** で本番投入。**loopback(`127.0.0.0/8` / `::1/128`)を含む**。要求できるのは **secure context のみ**。企業ポリシーで許可/拒否を事前付与する方針が明記 |
| B-2 | `chromeenterprise.google/policies/local-network-access-allowed-for-urls/`(ページ題名から確認、本文は JS レンダリングのため未取得)+ `learn.microsoft.com/ecdn/how-to/configure-local-network-access-policy`(2026-01-29 更新) | 🟢 **`LocalNetworkAccessAllowedForUrls` は実在する企業ポリシーであり、Chrome と Edge の両方でレジストリから一括付与できる。** Chrome: `HKLM\SOFTWARE\Policies\Google\Chrome\`、Edge: `HKLM\SOFTWARE\Policies\Microsoft\Edge\`、キー名 `LocalNetworkAccessAllowedForUrls`、値は origin / `[*.]host` 形式の REG_SZ を番号付きで列挙。**Firefox は同等の制限を release へ未投入(Nightly のみ)で、当面このポリシーは不要** |
| B-3 | VS Code Marketplace Terms of Use(Microsoft 公式 PDF)+ `microsoft/vscode` issue #21839 / `microsoft/vsmarketplace` discussion #211 | 🔴 **Marketplace の Offering は Visual Studio 製品・サービスとの併用にのみ許諾され、Microsoft が公開しているインターフェース以外の手段での取得(自動収集・スクレイピング等)は禁止**。private gallery / offline gallery は長年の feature request のまま |
| B-4 | GitHub Docs `copilot/reference/copilot-allowlist-reference` + community discussion #173463 | 🔴 **GitHub Copilot は air-gapped では動作しない。** IDE plugin が Copilot サービスと通信する必要がある。企業環境では allowlist / proxy 設定が前提 |
| B-5 | `docs.espressif.com/projects/idf-im-ui/.../offline_installation.html` | 🟢 **ESP-IDF には公式の offline installer が存在する。** インストーラ本体 + 全データを含む `.zst` アーカイブの zip で、**インターネット接続なしで導入できる**。ESP-IDF v6.0 以降は EIM(Espressif Installation Manager)の online / offline を選べる。**更新の扱いはドキュメントに記載がない**(= `NOT OBTAINED`) |

### 2026 年の競合プロダクト

| # | 出典 | 何を取ったか |
|---|---|---|
| C-1 | `codey.online`(製品サイト、primary source) | 🔴 **DigiCode Text の価値仮説に最も近い既存製品。** 「アイデアを書けば Codey がコードを書き、配線図を描き、クラウドでコンパイルし、ブラウザのタブから直接ボードへ書き込む」。**Web Serial による Chrome/Edge からの直接書き込み**(AVR / ESP32 WROOM / S3 / C3、auto-reset 対応)。**主要ライブラリ(Adafruit GFX / FastLED / ArduinoJson / WiFiManager / ESP-NOW / NeoPixel / Servo / Wire / SPI 他)がプリインストール済み**。部品カタログ(DHT11/22 · HC-SR04 · SG90 · SSD1306 · WS2812 · relay · PIR 等)に pinout / 配線図 / 動くサンプル。Serial monitor、ESP32/ESP8266 の OTA、コンパイルエラーの自動修正。**ローカルインストール不要。** 無料は AI メッセージ 1 日 5 件、Pro €9.99/月 |
| C-2 | 二次記事(**secondary source**) | Wokwi(ブラウザ上のシミュレータ、実 Arduino C++ を実行、ESP32/ESP8266/Pico/STM32)· ESP Web Tools(ブラウザからの書き込み。WLED / ESPHome / Tasmota / ESPEasy が採用)· ViperIDE · CircuitPython Online Editor · FlashESP |

## 3. 🔴 やっていないこと(結論の強さの境界)

| 項目 | 状態 |
|---|---|
| 実機での比較(VS Code + PlatformIO を企業 PC で実際に構築してみる) | **NOT OBTAINED** |
| 実際の企業イントラでの疎通試験(どのドメインが実際に遮断されているか) | **NOT OBTAINED** — 本調査の企業環境の議論は**利用者(Human)の実体験報告と公開情報からの推論**である |
| 完全 offline bundle の実作成 | **NOT OBTAINED**(要件の具体化のみ) |
| Codey / Arduino Cloud Editor / Wokwi の実利用 | **NOT OBTAINED** — 製品サイトと公式ヘルプの記述のみ。**品質・実用度は評価していない** |
| Chrome enterprise policy を実際に配って Local Network 許可が付くことの確認 | **NOT OBTAINED**(ポリシーの存在と設定方法は primary source で確認、**実挙動は未verify**) |
| Cloud Compiler の 1 コンパイルあたり実コスト | **NOT OBTAINED** — S002 は所要時間を測ったが**金額に変換していない** |
| ChromeOS / Chromebook での Web Serial 実挙動 | **NOT OBTAINED**(二次記事は対応と記述) |
| DigiCode Classic の利用実績・利用者数・継続率などの事業データ | **NOT OBTAINED** — 本 repo に無く、Human 側の情報 |

## 4. 内部 evidence(inherited real-fire)の出典

| 参照する数値 | owner |
|---|---|
| ESP32 core 一式 5.3 GB / board 1 枚の LSP ヘッダ 64 MiB(xz 6.0 MiB)/ esp-clangd 10.5–13.5 MiB | `2026-08-26_local-helper-feasibility/05_…md` |
| clangd ≈500 MiB/session、8 並列で線形(比 7.94) | 同 `07_…md` |
| Helper 無しでも Monaco 起動 921 ms・compile 診断ジャンプ動作・エラーポップアップ 0 | 同 `04_…md` |
| Local Network Access が HTTPS 必須・許可 1 回・HTTP では `denied` 固定 | 同 `02_…md` |
| Board 追加は最低 2 リポジトリ 8 ファイル / RP2040 削除の真因は `lib_deps` グローバル / Device→Library→include が機械可読でない / block 追加時の lib_deps 登録漏れ 4 件 | `2026-08-26_donor-audit/04_…md`・`11_…md` |
| Blockly 結合は `blocks/**` 76 ファイル + shell 側 6 ファイル / AI 辞書 `block-catalog.json` 379,375 B は生成物 | 同 `03_…md`・`06_…md` |
| probabilistic-debug のケース生成 5 戦略と orchestrator が生成器非依存 | 同 `08_…md` |
| Classic の実入力は `{fragments:{includes,globals,setupCode,loopCode}}` 固定テンプレート注入 | `2026-08-26_compiler-shared-probe/` |
