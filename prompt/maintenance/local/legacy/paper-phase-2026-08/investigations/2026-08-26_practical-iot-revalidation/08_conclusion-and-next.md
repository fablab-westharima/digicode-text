# 08_統合結論と次への入力 — S007 Practical IoT Competitive & DigiCode Capability Revalidation

**統合者:** Claude Code (Opus 5) — Harness / Integration Conductor
**日付:** 2026-08-26
**状態:** 🔴 **criteria PASS / acceptance OPEN** — 受理は Human のもの。
**⚠️ baton 19:** 本ファイルは統合であって evidence ではない。**結論を読む前に 02〜07 を 1 度は開くこと。**
S005 では結論ファイルが同じ調査の evidence に否定されていた(case **DT-4**)。本セッションでも
**統合者(私)の中間報告に 3 件の誤りがあり、反証レーンが検出した**(§0-2)。

---

## §0-1. 一文の答え(🔴 D7 の反証を受けて訂正済み — 元の表現は §5 に保存)

**「競合が存在しない」「無料で提供できるから勝てる」「自動 Web UI が独自資産である」という形の
product value 論は、本調査で成立しなくなった。** 問題の実在(AI が組み込みコード生成で
存在しないライブラリを参照して**コンパイルに失敗する**こと)は第三者実測で支持される。
**ただしその実測は、複雑シナリオでの崩壊をライブラリ選択のせいだとは言っていない**(§5 E03)。
残る差別化候補は 1 つの狭い連言だが、**その空白の広さを私は過大評価していた** — 最も近い既存製品
(**Arduino Cloud AI Assistant**)を機能表から落としていた(§5 E06)。

**正確な状態:** **「旧根拠はおおむね反証された / 問題の実在は支持された / 提案された製品価値は未解決」**

## §0-2. 🔴 統合者自身の誤り(反証レーン D6 が検出、記録する)

| # | 私が中間報告で述べたこと | 実際 | 検出 |
|---|---|---|---|
| 1 | 「無料で実用になるサービスには AI が無い」 | **誤り。** Blynk は公式 AI Assistant を持ち、prompt から dashboard・datastream・alert・変換コードを生成する(公式 blog、primary source) | OL-06 |
| 2 | 「6/6 ベンダが verified matrix を公開していない」 | **市場全体への外挿として誤り。** **Particle** が Device OS version × device 表、**972 library index**(`curl`+`jq` 実測 RC=0)、verified library の定義(全対象 HW で compile・動作し第三者が追試できる `verification.txt`)を公開している。**D5 のレポートは「調査した 6 社の docs 内で」と正しく限定しており、外挿した私が誤り** | OL-11 |
| 3 | 「IoT-SkillsBench はほぼ当プロジェクトの主張そのもの」 | **過剰。** 同論文が測るのは構造化専門知識つき prompt の効果であり、**vendor 維持の版行列でも compiler 結合でも manager 撤廃でもない** | OL-05 |

**教訓:** 3 件とも「evidence の限定を外して断定側へ寄せた」形である。case **DT-4** の再演を反証レーンが止めた。
D6 は他レーンのレポートに **OL-01〜OL-11 の 11 件**を指摘しており、うち factual error は OL-06 のみ、
残りは分母の単位ずれ・内部矛盾・外挿である。

---

## A. DigiCode Practical IoT Capability Map

owner: `03_donor-iot-capability.md`。分母はすべて **block カタログ 580 エントリ**。

| capability | implementation | evidence | maturity | Text 再利用 | value |
|---|---|---|---|---|---|
| **MQTT** | 任意ブローカー・認証・retain・再接続・LWT・buffer・keepalive・LWT QoS | 21/580 `[static]` `mqttBlocks.ts:28-687`、compiler が PubSubClient を pin | **実装済**(ただし**広告された送信 QoS-1 は生成コードに出ていない**) | 高 — 生成規則は block 非依存に切り出せる | 🔴 高。**ブローカーアドレスが任意 = Cloud 専用ではない** |
| **HTTP/REST** | GET/POST/PUT/DELETE/JSON/ヘッダ/URL 構築 | 9/580 `httpBlocks.ts:27-390` | 実装済 | 高 | 中 |
| **WebSocket** | client + ESP32 側サーバ | 12/580 `webSocketBlocks.ts:33-660` | 実装済 | 高 | 中(auto UI の transport) |
| **BLE** | NUS・scan/beacon・カスタム GATT、NimBLE + NimBLEOta を volume mount | 19/580 `bleBlocks.ts` | 実装済 | 高 | 中 |
| **Wi-Fi** | 接続・状態ポーリング・IP 報告 | 1 block、16/16 board が `supportsWifi` | 実装済 | 高 | 前提条件 |
| **Azure IoT** | Hub/Central、secure MQTT、SAS、DPS、D2C、C2D、direct method、twin | 9/580 | 実装済 | 中 | 🔴 高(企業向けの入口) |
| **Modbus RTU** | init / slave 選択 / **FC03 で 16bit 保持レジスタ 1 本** / **FC06 で 1 本書き** | **4/580** `modbusBlocks.ts:40-147` | 🔴 **partial — これが golden scenario の破断点** | 低(構造ごと再設計が要る) | 🔴 **現状は劣後部分。ESPHome の方が広い** |
| **RS485** | DE/RE 制御は Modbus 内部のみ。汎用は UART2 のみ | `uart2Blocks.ts:38-167` | partial | 低 | 中 |
| **CAN** | 生 TWAI フレーム(CANopen/J1939/CAN-FD なし) | 5/580 | 実装済(生のみ) | 中 | 中 |
| **LoRa** | 生 SX127x(LoRaWAN の join/keys/channel なし) | 6/580 | 実装済(生のみ) | 中 | 低 |
| **Modbus TCP / Ethernet / LoRaWAN / セルラー** | **無し** | 350/350 ファイル走査で 0 一致 RC=1 | **absent** | — | — |
| **Home Assistant 連携** | エンティティ発見・制御 | `[static]` | 実装済 | 中 | 中 |
| **Board** | **16/16、全て ESP32 系**(M5Stack 9 / XIAO 3 / 汎用 4)。RP2040・nRF・STM32・Linux SBC は **0** | `boardStore.ts:100-312` | 実装済 | — | 🔴 **frontend 16 件と compiler 10 FQBN の二重手管理**(baton 39 を条件つきで裏づけ) |
| **Device / Sensor** | 「device = 特定 Arduino ライブラリ + pin」モデル。**protocol + register map モデルは無い** | `[static]` | partial | 低 | 🔴 **Registry 設計の中心論点** |
| **AI 統合** | provider 抽象 + `custom` endpoint + Local LLM ヘルプ | `[static]`(鍵は type/location-class のみ記録) | 実装済 | 高 | 🔴 高(baton 35 の緩和手段) |
| **生成コード metadata** | project artifact + compile/cache metadata。**UI schema チャネルは無い** | `[static]` | partial | — | Registry 入力 |
| **任意 Arduino ライブラリ持ち込み** | **580/580 カタログにも compile request にもユーザ依存宣言が無い** | `[static]` | **未確立** | — | 🔴 **「何でも使える」は製品能力として成立していない** |

**総括 `[inference]`:** DigiCode は LED レベルの Arduino 環境ではなく、**ESP32 専用の実用 IoT 伝送路**を持つ。
**壊れるのは伝送ではなく「産業デバイスの解釈層」と「保存・可視化の backend」である。**

---

## B. Automatic Web UI Deep Dive

owner: `02_auto-web-ui-deep-dive.md`(分母 `38 examined / 1,341 searched files`、donor SHA `bb35c3b` 一致)。

### B-1. 🔴 前提の訂正 — これは「コード解析」ではない

| 解析対象候補 | 実装 |
|---|---|
| **block metadata**(UUID/channel、label、dataType、min/max、read/write/notify) | **`inspected` — 唯一の load-bearing 入力** |
| generated code text | **`not inspected`**(editor は XML と生成コードを別 state に持ち、controller には XML を渡す) |
| variables / pins / comments / known function patterns | **`not inspected`** |
| sensor values / output values | 生成時 `not inspected`(runtime 表示のみ) |
| AI | **Layer 1 で不使用。** Layer 2 は既存 schema の**外観 diff のみ**、しかも `SHOW_PHASE4_AI_CHAT = false` で**両ダイアログとも非表示** |

C++ parser も AST も無く、**plain C++ を渡すと widgets は 0 件**(`inferUiSchema.ts:42-86`)。

### B-2. 生成できる UI

| widget | 判定 |
|---|---|
| numerical display / toggle / slider / 複数値同時 / リアルタイム更新 | **`implemented`** |
| text/status / input field / actuator control | `partially implemented` |
| **gauge / graph / led** | 🔴 `partially implemented` — **型・validator・AI プロンプトには在るが bundle renderer が `displayMode` を読まない**(schema diff は通り、画面は変わらない) |
| **button(モーメンタリ)/ alarm・閾値・条件付き色** | **`unsupported`** |

**機能 widget は実質 3 種**(`gatt-toggle` / `gatt-slider` / `gatt-display`)+ BLE の NUS チャット。

### B-3. transport(3 経路)

1. **BLE** — editor 内から Web Bluetooth で MCU へ直結
2. **Wi-Fi 単機** — コンパイル時に HTML を firmware へ埋め込み、**ESP32 が HTTP で配信、ページが ESP32 の WebSocket に接続**
3. **Wi-Fi 複数機** — `.digicode.json` 群からブラウザ内で **standalone HTML Blob を生成してダウンロード**、各 ESP32 の WebSocket へ直結

### B-4. Text 版への再利用 — 壊れる境界

- **壊れる:** 入力アダプタのみ(`ble_*` / `websocket_server_*` の block type と field への完全依存、`.digicode.json` は `blocklyXml` 必須で保存済み生成コードを解析しない)
- **生きる:** `registration records → schema → widget 規則 → renderer → wire contract → packaging` の中核。**Wi-Fi 側の純粋推論関数は Blockly API を呼ばない**
- **置換候補(実装根拠つき評価):** project manifest = **高忠実** · code annotation = **意味的に最近接** · compile metadata = 可(**backend 契約変更が必要**) · AST = 制約付き API 前提なら可 · registry metadata = 補助にはなるが単独では不可 · AI = 補助であって drop-in ではない
- **最小の可搬資産:** `registration records → schema → renderer`。**両側のアダプタが Text 版固有の新規作業**

### B-5. AI との組合せ(§10-6 の 4 例)

| 指示 | 既存機構で駆動できるか |
|---|---|
| 「このコードから監視画面を作って」 | **不可** — AI はコードを受け取らず現行 schema のみ受け取る |
| 「回転数・電流・運転状態を表示して」 | **3 チャネルが既に登録済みの場合のみ**(AI は id を新規作成できない) |
| 「異常時は赤表示」 | **不可** — 閾値・条件・正常/異常の状態対応が schema に無い |
| 「Start / Stop を追加」 | **不可** — モーメンタリ widget が無く、toggle 1 個は ON/OFF の状態であって 2 コマンドではない |

---

## C. Competitive Capability Matrix

owner: `06_feature-primary-sources.md`(191 URL の取得ログ)+ `07_falsification.md`(Particle)。
`NF` = not found in docs(**≠ 非対応**)、`US` = ユーザ供給ライブラリ経由、`NO` = NOT OBTAINED。

| capability | DigiCode(現行) | **DigiCode Text(仮説)** | Arduino Cloud + App Lab | PleaseDontCode | Codey Online | Embedder | Viam | ESPHome | **Particle** |
|---|---|---|---|---|---|---|---|---|---|
| Board 幅 | 16、**全 ESP32** | 未定 | 公式 + 汎用 ESP32/8266、総数 NO | 35+ 公称/33 可視 | 12 | **590+ platform** | Pi/Linux 中心、MCU は WROVER のみ | ESP32 13 変種・RP2040/2350・nRF52・Linux | 自社デバイス |
| Device/Sensor 幅 | ライブラリ + pin モデル | 未定 | 総数 NO | 総数 NO | **79 詳細ページ** | **5,850+ parts** | registry module | 742 component dir(device 数ではない) | **library index 972 件(うち `verified:true` は 10 = 1.03%、§5 E01)** |
| **産業 protocol** | Modbus RTU の FC03/FC06 のみ。TCP/CANopen/4-20mA/IO-Link **無し** | 未定 | **MKR485 + Modbus メータの実例あり** | **NF** | RS485 部品あり / Modbus **NF** | RS485・CAN/CAN-FD 部品 / Modbus **NF/US** | **NF/US** | 🔴 **`modbus_controller` が coil/input/holding、U/S word/dword、逆ワード順、FP32、bitmask、scale、複数レジスタ、任意コマンド** | NF |
| custom 拡張 | **未確立**(依存宣言が無い) | 未定 | Cloud ライブラリ import / Brick | `.cpp/.h/.zip` import | multi-file + auto install | **PDF から custom platform/peripheral** | **registry module + semver pin** | **Git/URL/file の external component + `ref`** | library index |
| Compile | 自社クラウド | 自社(裁定済) | Cloud compiler | cloud + auto repair | server 側 `arduino-cli` | 利用者の既存 toolchain | module build(MCU compiler ではない) | ローカル/Docker/HA | **Web IDE で cloud compile** |
| Write | Web Serial / BLE OTA | 未定 | Agent + browser + OTA | **Web Serial + POTA OTA** | **Web Serial + ESP OTA** | vendor tool/probe | `viam-server` install | USB→OTA | **browser + OTA** |
| backend | 任意 MQTT / Azure / HA | 未定 | Arduino Cloud + webhook | POTA cloud、汎用 MQTT **NF** | firmware 生成のみ、hosted **NF** | **IoT backend 無し** | **Viam Cloud + 自前 Mongo 同期** | **汎用 MQTT/HTTP/HA、self-host** | Particle Cloud |
| **UI 自動生成** | **block metadata → 3 widget** | 未定 | dashboard は**手動** widget | 🔴 **コードの global 変数を解析して widget 提案**(公式明記) | 配線図は生成、hosted dashboard **NF** | agent の Monitor(開発ツール UI) | dashboard は手動設定 | 🔴 **config → entity が HA UI と device `web_server` に自動出現** | — |
| AI | provider 抽象 + custom endpoint | **主機能(裁定)** | **App Lab 0.10 = MCP + LSP + BYOK** | hardware-aware 生成 + compile 自動修復 | Agent/Plan/Ask、multi-file | **repo + datasheet + schematic + 実機 HIL** | 設定エディタ AI | **製品 AI 無し** | NF |
| **managed 再現性** | — | **中核価値(裁定)** | **NF** | **NF** | **NF** | 既存 toolchain 依存 | module semver pin(MCU 行列ではない) | version knob はあるが vendor 保証ではない | 🔴 **Device OS version×device 表 + verified library 定義 + 依存 exact version** |
| enterprise / offline | — | 未定 | **NF** | **NF** | **NF** | **SaaS/VPC/on-prem/air-gapped を文書化** | ローカル runtime は回線断後も継続 | **OSS・ローカル完結可** | NF |

🔴 **最重要の 1 行(D7 の訂正を反映):** **本調査で一次確認した範囲では**、
「vendor が board×toolchain×library×version を**検証して維持する**」を公開文書で持つのは **Particle のみ**。
ただし **`verified:true` は 10/972 = 1.03%**、自社デバイス限定、**coding AI の公開証拠なし**
(docs 2,398 URL + marketing 937 URL + 公開 repo 9,216 path を走査して 0)。

🔴 **上表の重大な欠落(§5 E06)— Arduino の AI 欄は誤り。**
**Arduino Cloud AI Assistant(2025-04)が Cloud Editor 内に存在する** — board / project コンテキスト、
sketch 生成、**コンパイルエラー修正**、そして **Arduino 自身の documentation / libraries / code examples を参照**。
Arduino は「hand-picked structured documentation を継続更新して Claude に与えている」と公表している。
**これは残存差別化候補に最も近い既存製品であり、私はそれを機能表から落としていた。**
破れていないのは **①「AI と compiler が同じ versioned registry を読む」② tested version 組合せの公開** の 2 点のみ。

🔴 **未探索カテゴリ(§5 E07):** **Microchip MPLAB AI Coding Assistant**(無料、ベンダ固有の製品/文書知識、
継続更新、コード編集・エラー検出)。browser ではないため連言は満たさないが、
**「ベンダ知識 + AI + toolchain」という直接隣接カテゴリを本調査は一度も探していない。**

---

## D. Pricing & Limits Matrix

owner: `05_pricing-and-limits.md`(取得日 **2026-08-26**、17 fetch / 成功 12・失敗 5)。**OL-06 の訂正を反映済み。**

| service | free plan | **拘束する上限**(実際に止まる場所) | 最安有料 | 実用個人/月 | 5 人/月 | **無料枠は実用になるか** |
|---|---|---|---|---:|---:|---|
| **Arduino Cloud** | あり | **AI 30 回/月**、Thing 2 個、compile 25 回/日、保持 1 日 | $72/年 = **$6.00/月** | $6.00 | $83.33 | **learning tier** |
| **Arduino App Lab** | 価格 `NOT OBTAINED` | Arduino 側 AI 上限なし — **BYOK で自分のプロバイダに直接支払う** | — | $5〜30(API 実費) | $25〜150 | **NOT OBTAINED**(無料 AI は無い) |
| **PleaseDontCode** | あり「永久」 | **3 credit/月**(= AI 一発正解でちょうど 1 プロジェクト)、device 1 台。**書き込みも 1 credit** | $9/月(年払) | $29 | $145 | **demo tier** |
| **Codey Online** | あり | **AI 5 通/日**(繰越不可) | **€9.99/月** | €9.99 | €49.95 | **learning tier** |
| **Embedder** | **無し** | — | **NOT OBTAINED**(営業ゲート) | NO | NO | **NOT OBTAINED** |
| **Viam** | あり | **クラウド利用の最初の $5/月**(従量、シート課金なし) | 従量 | $5〜15 | $25〜75 | **hobby-usable** |
| **ESPHome** | FOSS | **ソフト上限なし。**費用はホスティングと手間 | $0 | $1〜10 | $1〜10(同一ホスト) | **practical individual** |
| **Blynk** | あり | device 5・user 1・保持 1 週間 | $29/月 | $29 | $99 | **hobby-usable**(🔴 **AI Assistant あり** — OL-06 訂正) |
| **Wokwi** | あり | **全プロジェクトが公開**、**カスタムライブラリ不可** | €5.6/月 | €8.1 | €100 | **hobby-usable**(公開可なら) |
| **Embedr** | **無し** | — | **$25/月** | $25 | $125 | **無料枠なし** |
| **FlowFuse** | **NOT OBTAINED** | — | 全 tier「Contact Us」 | NO | NO | **NOT OBTAINED** |

**訂正後の見出し `[inference]`:** 「AI つき無料枠はいずれも demo/learning tier」は**AI コード生成 IDE の範囲では成立する**が、
**「無料で実用なものには AI が無い」は Blynk により成立しない。** 正確には —
**「AI で *ファームウェアのソースコードを生成する* 無料枠は、いずれも demo/learning tier である。
ダッシュボード生成 AI は無料実用枠(Blynk)に存在する。」**

**教育価格:** Arduino **$20/人/年 = $1.67/月**。PleaseDontCode・Codey・Embedr・Embedder・Blynk・Viam は
教育価格の公開なし、Wokwi は見積ゲート。**30 人クラスで Arduino $50/月 vs Codey 約 €300/月。**

---

## E. Cost-to-Capability

`[inference]` — D よりも判断価値が高いのは「金額あたり何が手に入るか」である。

| service | 月額 | AI | Board/Device | 産業 IoT | backend | 自動 UI | custom lib | 実用価値の要約 |
|---|---:|---|---|---|---|---|---|---|
| **ESPHome** | **$0**(+ホスト $1〜10) | 無し | 広い(ESP32/RP2040/nRF52/Linux) | 🔴 **最強**(Modbus 型・複数レジスタ・FP32) | **汎用 MQTT/HTTP/HA、self-host** | **config → entity → UI 自動** | Git/URL/file | **金額あたり最強。**代償は YAML 設定であり、テキスト C/C++ ではない |
| **Arduino Cloud** | $6.00 | 30 回/月 | 公式中心 | MKR485 の実例 | Arduino Cloud | 手動 widget | Cloud import | **教育の価格支配者。**App Lab で AI は BYOK へ分岐 |
| **Codey Online** | €9.99 | 無制限(Pro) | 12 | RS485 部品のみ | 無し | 配線図生成 | auto install | **ブラウザ完結の最短経路。**backend が無い |
| **PleaseDontCode** | $9〜79 | credit 制 | 35+ | **NF** | POTA cloud | 🔴 **global 変数 → widget** | zip import | **自動 UI の直接競合。**産業 protocol は未確認 |
| **Viam** | $5〜15 従量 | 設定 AI | Linux/SBC 中心 | custom module | Viam Cloud + 自前 DB | 手動 | registry + semver | 🔴 **「ベンダ運用レジストリ」の唯一の価格実例。**シートではなく資源を課金 |
| **Embedder** | **NOT OBTAINED** | 🔴 **repo + datasheet + 実機 HIL** | **590+ / 5,850+** | 部品はあるが Modbus NF | 無し | 開発ツール UI | PDF 追加 | **ハード知識 + AI の最強。**IoT backend ではない |
| **Blynk** | $0〜29 | **dashboard 生成 AI** | — | — | Blynk Cloud | **prompt → dashboard** | — | **無料実用 + AI が両立している唯一例**(OL-06) |
| **Particle** | 未取得 | 無し | 自社デバイス | NF | Particle Cloud | 無し | 🔴 **verified library 機構あり。ただし実測 `verified:true` は 10/972 = 1.03%**(§5 E01) | **機構の公開実例。**自社 HW 限定・AI の公開証拠なし |
| **DigiCode Text(仮説)** | **$0 方針** | **主機能** | 未定 | **未定**(donor は FC03/FC06 のみ) | 任意 MQTT/Azure | **要再設計** | **未確立** | **未実証。**下記 G 参照 |

**費用構造 `[inference]`(D6 の 10,000 MAU モデル、算術は `07_falsification.md`):**
インフラ **$4,042.23/月**、うち **AI が 97.97%($3,960)**。**AI を除くと $82.23/月**
(compile $73.98 + hosting $5 + storage $1.05 + signing $2.20 + egress $0)。
保守/support を 2.0 FTE と仮定すると総額 $28,042.23/月。
→ **「無料提供は技術的に不可能」は誤りだが、費用の実体はほぼ全て AI である。**
BYOK にすればベンダ請求は $0 になるが、それは**機能を無料にしたのではなく費用を利用者へ移した**ことになる。

---

## F. Golden IoT Scenario Comparison

> `Inverter → RS485/Modbus RTU → ESP32 → MQTT/HTTP → Azure or Raspberry Pi → 可視化`

| 環境 | どこまで到達するか | 破断点 | そのシナリオの費用 |
|---|---|---|---|
| **DigiCode(現行)** | **各値が単一 16bit 保持レジスタなら成立**(ModbusMaster/PubSubClient/Azure SDK は compiler が pin 済) | 🔴 **入力レジスタ・複数ワード・float・エンディアン・ビットフィールド・FC03/06 以外で破断。**Pi 側スタックは範囲外 | 無料 |
| **ESPHome** | 🔴 **Modbus register → typed entity → MQTT/HA → UI まで一続き** | Azure と DB は別途。Modbus TCP は docs 未確認。**YAML 設定であってテキスト C/C++ ではない** | **$0**(+ホスト) |
| **Arduino Cloud** | MKR485 + Modbus メータ → Cloud dashboard の実例あり | Azure / Pi ブローカー / DB は利用者統合 | $6/月〜 |
| **Codey Online** | MAX485 配線 + 汎用 MQTT のコード生成まで | **Modbus のレジスタ意味論・backend・DB・UI は利用者** | €9.99/月 |
| **PleaseDontCode** | 産業 protocol の公開証拠が無い所で停止 | **Modbus/RS485 が公開資料で未確認** | $9〜29/月 |
| **Embedder** | ファーム作成と実機検証を支援 | **Modbus・backend・UI は利用者/プロジェクト供給** | NOT OBTAINED |
| **Viam** | Modbus driver module を利用者が供給すればローカル/Cloud のデータ・UI・制御まで到達 | driver は custom module | $5〜15/月 |
| **無料組み立て** | `ESPHome + Mosquitto + Node-RED + InfluxDB + Grafana` で**全チェーン成立** | 利用者が構成を維持する | **$0** |

🔴 **D6 の指摘(採用):** このシナリオで最も難しいのは **インバータのベンダマニュアルのレジスタマップ、
電気的絶縁・終端・接地、制御の安全性、backend 運用**である。**DigiCode も ESPHome もそれを供給しない。**
両者が同じ外部の難所を残すなら、**donor の狭い FC03/FC06 ラッパは差別化ではなく劣後部分である。**

---

## G. Product differentiation result

Human 指示 §21 の分類へ落とす。**「唯一」を主張しないこと**が本節の設計条件である。

| 分類 | 該当 |
|---|---|
| **commodity**(誰でも無料で持つ) | ブラウザでのテキスト編集 · クラウドコンパイル · Web Serial 書き込み · 汎用 MQTT · ローカル backend への送信 · AI によるコード生成そのもの |
| **common**(複数社が持つ) | AI + 配線図生成 · ボード/部品カタログ · OTA · マルチファイルプロジェクト · dashboard |
| **paid-only common**(有料でのみ実用) | 🔴 **AI による firmware ソース生成の継続利用**(Arduino 30/月・PDC 3 credit/月・Codey 5/日 はいずれも demo/learning tier) · チーム/教育機能 |
| **uncommon**(少数だけが持つ) | **ベンダ維持の verified library 定義と版行列**(= Particle のみ) · **datasheet/errata 索引 + 実機 HIL**(= Embedder のみ) · **産業 Modbus 型の完全な取り扱い**(= ESPHome が突出) |
| **differentiator candidate**(候補、ただし未実証) | 🔴 **「普通のテキスト C/C++ を、ブラウザで、AI とコンパイラが同一の vendor 維持 verified registry を参照しながら、任意 MCU エコシステムに対して扱う」という連言。** どの既存製品もこの**全条件を同時に**満たさない — Particle は AI 無し・自社 HW 限定、Embedder は利用者 toolchain、ESPHome は YAML・ベンダ保証なし、Arduino は verified matrix なし |
| **cost-performance differentiator** | 🔴 **「有料競合でしか継続利用できない AI firmware 生成を、無料で実用水準で出す」**。ただし D6 の費用モデルにより、**これは差別化ではなく誰が費用を負担するかの事業モデル**である(AI がインフラ費の 97.97%) |
| **independently demonstrated differentiator** | **該当なし。** 本調査で独立実証まで到達した差別化は 0 件 |
| **not yet demonstrated**(価値が否定されたのではなく、示されていない) | 上記 differentiator candidate の全条件同時成立 · 対象利用者の支払意思 · 定着率 · 作業時間短縮 · 故障率 |
| 🔴 **false differentiator**(差別化ではなかったもの) | **① 自動 Web UI の独自性** — PleaseDontCode がコードの global 変数を解析して widget を提案し(公式明記)、ESPHome は config → entity → UI を無料で自動化する。**donor の 3 widget・Blockly 依存機構はこれらより一般的でも text-native でもない** · **② ブラウザのみ・権限ゼロの独自性** — Codey/PDC が無料枠で実現済み。さらに **Chromium の `DefaultSerialGuardSetting=2` / `SerialBlockedForUrls` で管理者が Web Serial 自体を禁止できる**ため「インストール不要だからロックダウン PC に強い」は一般化として成立しない · **③ 無料であること自体** — カテゴリ参入条件であって優位ではない · **④ 実用産業 IoT リーチ** — 現状の donor 実装は ESPHome に劣後 |
| **competitor advantages**(競合が勝っている点) | ESPHome = 産業 Modbus の深さ・無料・self-host · Arduino = 教育価格($1.67/人月)と正統性・2 週間前の Agentic Mode · Embedder = ハードウェア知識の規模(590+/5,850+)と実機 HIL · Particle = 検証済みライブラリの公開機構 · Viam = レジストリ課金モデルの実在 |
| **missing capabilities**(digicode-text 側に無い/未定) | 産業デバイスモデル(register map/電気 IF)· backend 運用層 · debugger(baton 36)· 任意ライブラリ持ち込みの製品能力 · 教育向け価格/管理機能 · enterprise の proxy/offline |

### G-1. 🔴 それでも壊れなかったもの — 学術実測による**問題の実在**

**これが本調査で最も強い肯定的証拠であり、競合ではなく第三者の実測から来ている。**
owner: `04b_population-gap-closure.md`。

- **MDPI *Future Internet* 18(2) 94**(27 LLM × 8 ESP32 シナリオ、人手 AHP):
  **「コンパイル失敗の最頻原因は、存在しないライブラリの hallucination と誤った API 使用」**、
  **「LLM は既に利用不能または機能しない、個別かつ非推奨のリポジトリを頻繁に参照した」**。
  複雑度で崩壊 — 単純センサー 19〜23/27 → Firebase 9/27 → InfluxDB 11/27 → **InfluxDB+Grafana 3/27**。
  🔴 **訂正(§5 E03):** 「コンパイル失敗の最頻原因」はこの引用のとおりだが、**複雑度崩壊(3/27)を
  ライブラリのせいにしてはならない。** 論文はシナリオ 6/7 について「エラーは source code の機能不備・
  通信関数の誤用・cloud 設定規則の不備に起因し、**不適切なライブラリ選択ではない — 全てのライブラリは
  適切だった**」と明記している。
- **EmbedAgent(arXiv 2506.11003)**: MicroPython/Pico **73.8%** vs **ESP-IDF 29.4%** pass@1。
  **RAG + コンパイラフィードバックで 55.6 → 65.1%** — **効くが万能ではない**。
- **IoT-SkillsBench(arXiv 2603.19583、実機 378 ラン)**: 構造化された専門知識で高い成功率。
  **⚠️ ただし OL-05 の訂正 —** これは prompt/skill 知識の効果であって、
  **vendor 維持の版行列でも compiler 結合でも manager 撤廃の評価でもない。**

`[inference]` 🔴 **訂正後の正確な言い方(§5 E03/E04):**
**「AI が組み込みコードを書くとき、*コンパイル失敗* の最頻原因は存在しないライブラリの参照と誤った API 使用である」**
— ここまでは第三者実測。**それ以上ではない。** 論文は **zero-shot のみを測り、RAG / few-shot /
compiler feedback を測っていない**(論文自身の limitation)。つまり **提案されている解法(管理済み registry)は
試されていない。** したがってこれは **問題の実在の証拠であって、解法が効くことの証拠ではない。**
baton 38 への「根拠の差し替え候補」としては使えるが、**差し替え先も同じ強度では立たない。**

### G-2. 🔴 裁定 / 元根拠 / 差し替え候補 / 影響(**再裁定は Human のもの**)

| Human 裁定 | S005 が用いた根拠 | 本調査での状態 | 差し替え候補 |
|---|---|---|---|
| **中核価値 = 管理済み MCU 環境**(2026-08-26 §1) | 「権限ゼロ PC で書き込みまで成立する選択肢が他に無い」(baton 38 で反証済) | **元根拠は成立しない**(Codey/PDC が無料枠で実現。D6 T3 `REFUTED`) | 🔴 **G-1 の学術実測**(環境・ライブラリ正しさが AI 失敗の最頻原因)+ **Particle が同種機構を商用で維持している事実**(需要の存在証明) |
| **Web 版の価値 = 利用者 PC に環境を作らせない**(§3) | 同上 | **便益自体は残る**(D6 §失敗 2)。壊れたのは**唯一性**と「ロックダウンなら常に動く」の一般化 | **enterprise policy の実測**(`DefaultSerialGuardSetting` 等)を前提に、対象を「許可された学校/個人/一時 PC」へ**明示的に限定**する |
| **auto Web UI は重要な製品資産候補**(S007 §10) | Human の直接指示 | **資産の中身が想定と異なる**(B-1)。**独自性は false differentiator**(G) | 「コード解析器」ではなく **`registration records → schema → UI/transport 生成器`** として評価し、**宣言の供給方法(manifest / annotation)を設計対象にする** |
| **Registry が次の中核**(§6、baton 39 で順序の根拠は反証済) | P8(反証済) | **設計対象を支える証拠はさらに強化**(A4/V7 に加え本調査の G-1、および Particle という先行実装) | **G-1 + Particle + Viam(課金モデル)** の 3 点に立つ |

---

## H. Registry requirements input(**設計はしない。入力のみ**)

owner: 次 Objective。本節は**要求の候補**であって schema ではない。

### H-1. 管理すべき entity(本調査が根拠を持つものだけ)

| entity | なぜ必要か(本調査の根拠) |
|---|---|
| **Platform / Board** | donor が **frontend 16 件と compiler 10 FQBN を別々に手管理**しており、join は FQBN のみ(A) |
| **Toolchain / Framework + version** | PlatformIO `platform_packages`、ESPHome の framework `recommended`/exact、コンテナタグが**既存の先行例**(D6 T1) |
| **Library + version + dependency + 検証状態** | 🔴 **AI 失敗の最頻原因**(G-1)。**Particle の `verified: true` / `verification.txt` が唯一の公開実装例** |
| **Device / Sensor / Actuator** | 🔴 **donor は「device = 特定 Arduino ライブラリ」モデル。産業デバイスに届かない**(A、F) |
| **Electrical interface**(RS485 / 4-20mA / 0-10V / pulse) | 産業デバイスはライブラリではなく**電気 IF + register map** で決まる(F) |
| **Protocol + register map profile** | 🔴 **golden scenario の破断点そのもの。**ESPHome は型・語順・スケールまで扱う(F) |
| **Backend target**(Cloud / Local) | Cloud 専用にしないことが裁定。donor は任意ブローカーで既に満たす(A) |
| **UI capability / channel 宣言** | B-4 の「registration records」が **Text 版で新規に必要な入力**。UI 生成の source of truth 候補 |
| **Compatibility + evidence + 取得日** | 「全組合せ保証へ戻らない」裁定と両立させるには、**保証範囲そのものをデータとして持つ**必要がある |

### H-2. 設計時に効く制約(本調査で判明したもの)

1. 🔴 **Registry は「一覧表」では足りず、「compiler と AI が同じものを読む」ことが差別化の核である** — Particle も Viam もこの結合の公開証拠を持たない(C)。**ここが唯一まだ空いている場所**
2. 🔴 **検証の組合せ爆発が費用の本体になる** — 「任意 MCU エコシステム」を広げるほど verified matrix は爆発する(D6 の最強論)。**risk-based を維持する裁定はこの意味で正しい**
3. **UI schema チャネルが compile 経路に存在しない** — 現行 compile request/response はコード片と成果物のみ(A)。**manifest 方式を採るなら backend 契約の変更が要る**
4. **Custom → Verified の昇格経路は Particle の `verification.txt`(第三者追試可能)という先行形がある**
5. **AI の自己申告を acceptance にしない裁定**は、G-1 の実測(AI は存在しないライブラリを参照する)によって**独立に裏づけられた**

---

## §1. 未取得・未実行(隠さず列挙)

| 項目 | 状態 |
|---|---|
| **競合製品の実利用** | **0 件。** account 作成・課金・営業接触を行わない制約による(意図的)。**Human test を 11 件提示**(§2) |
| production 接触 | **0 件**(禁止事項) |
| 実機 flash / hardware | **0 件** |
| Wokwi / Blynk / RainMaker / PlatformIO の**機能**監査 | **未実施**(D5 が優先 6 社を完成させるため)。**価格は取得済**のため、cost-to-capability 表でこの 4 件は片肺 |
| Embedder / FlowFuse の価格 | **NOT OBTAINED**(営業ゲート) |
| Particle の価格・機能の系統監査 | **未実施** — D6 が反証中に発見したため、feature lane の対象に入っていない |
| ScienceDirect の閉ループ論文の全文 | **NOT OBTAINED**(CC-BY だが Cloudflare 壁、5 経路失敗) |
| 実企業ネットワークでの到達性 | **0 件**(baton 35 は依然 inferred) |
| 対象利用者の支払意思・定着率・作業時間 | **NOT OBTAINED** — 「誰も価値を感じない」も「感じる」も本調査からは言えない |

## §2. Human test(account / 課金 / 個人情報が要るもの — 私は実行しない)

1. **Codey Online** — 無料 AI 5 通/日を使い切り、その後エディタ/コンパイラが何を許すか
2. **PleaseDontCode** — 3 credit / 1 device で 1 credit が何を買うか、枯渇後にプロジェクトが残るか
3. **PleaseDontCode POTA** — 🔴 **global 変数解析 → widget が実際に動くか**(T2 の判定を支える中核証拠)
4. **Arduino App Lab Agentic Mode** — BYOK エージェントの実ループ(Arduino アカウント + API キー)
5. **Embedder** — 価格は営業電話でのみ取得可能。**電話をかける価値があるかは Human 判断**
6. **Particle** — 🔴 **verified library の実際の網羅率と、AI 機能の有無**(D6 の最強反例の深さ確認)
7. **Blynk AI Assistant** — 無料枠で dashboard 生成 AI がどこまで動くか(OL-06 の実挙動)
8. **FlowFuse** — 無料枠が現存するか
9. **Neural Inverse Cloud** — 「forever-free、API キー不要」の主張の実体
10. **Wokwi** — 無料枠のシミュレーション上限(docs URL が 404)
11. **企業/学校ネットワーク** — 対象 fleet で Web Serial と各 origin が許可されるか(baton 35 / T3 の決着条件)

## §3. §27 に対する回答 — 🔴 **訂正: `PRODUCT VALUE NOT RESOLVED`**(元は `PARTIALLY RESOLVED`。§5 E13)

Human 指示 §27 は「Go/No-Go を無理に出さなくてよい」としている。本調査の到達点は:

- ❌ **「競合がいないから価値がある」— 成立しない。** 48 行の母集団、直接競合 6、Arduino は 2 週間前に AI エージェントを投入
- ❌ **「無料だから勝てる」— 成立しない。** 無料は参入条件。費用の 97.97% は AI であり、誰が負担するかの事業モデル問題
- ❌ **「自動 Web UI が独自資産」— 成立しない。** PDC と ESPHome が別方式で先行
- ❌ **「ブラウザだけで権限ゼロ」が独自 — 成立しない。** 競合も実現済み、かつ管理者が Web Serial を禁止できる
- ❌ **「実用産業 IoT に届く」— 現状の donor 実装では成立しない。** ESPHome が上位互換
- ✅ **「AI 組み込み開発は環境・ライブラリの正しさで失敗する」— 第三者実測で成立**
- ✅ **「managed verified environment を商用で維持する需要は実在する」— Particle が実例**
- ⚠️ **「compiler と AI が同一の vendor 維持 registry を読む」— どの既存製品も公開証拠を持たない。だが digicode-text も実証していない**

**したがって価値は「否定された」のでも「確認された」のでもなく、狭くなった。**
残っているのは **1 つの連言と、1 つの実在する問題**である。

🔴 **D7 による訂正(E13):** 上の書き方は **hedge であり、evidence state の記述として不正確**である。
正しくは —
- **旧 value grounds 5 本のうち 4 本(競合不在・無料・auto UI 独自・browser-only 独自)は負に resolve した**
- **industrial reach も現 donor については負に resolve した**
- **問題の実在は支持されたが、提案された解法は誰も試していない**(MDPI は解法を測っていない)
- **Particle は機構の実在を示すが、`verified:true` は 10/972。需要は測っていない**
- **「誰も満たさない連言」は white-space 観測であって、user value でも feasibility でも支払意思でもない**

→ **`legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED`**
これは No-Go 判定ではない。**未測定の価値を「半分は肯定」として温存しない、という evidence state の修正である。**

## §4. 次に調査/設計すべきこと(**候補であって queue ではない。着手は Human の裁定**)

| 候補 | なぜ | 前提 |
|---|---|---|
| **Particle の系統監査** | 🔴 D6 の最強反例。**managed environment の唯一の先行実装**であり、verified library の運用実態(網羅率・更新頻度・人手か自動か)は Registry 設計の直接入力 | 本調査で未監査 |
| **Registry Design Objective** | baton 39 の「どちらの根拠に立つか」に、本調査が **G-1 + Particle + Viam** という答えを供給した | 開始時に立つ根拠を宣言すること |
| **産業デバイス層の設計調査** | golden scenario の破断点が特定された(F)。**ESPHome の `modbus_controller` が到達点の実例** | Registry と同時に扱う必要がある |
| **Verified matrix の費用モデル** | D6 の最強論は「検証の組合せ爆発」。risk-based 裁定を**数値で裏づける**必要がある | Cloud Compiler cost model と対 |
| **競合 real-fire(Human test §2)** | 文献調査と real-use の混同を解消する唯一の手段 | account 作成の Human 裁定が要る |

---

**本ファイルは統合であって evidence ではない。数値・URL・path:line の owner は 02〜07 である。**
**criteria PASS / acceptance OPEN — 受理は Human のもの。**

---

## §5. 🔴 D7(統合結論への最終反証)による訂正 — **13 件**

owner: `09_integration-falsification.md`。**claim trace 37 件の内訳: SUPPORTED 20 / OVERSTATED 8 /
UNDERSTATED 1 / UNSOURCED 7 / CONTRADICTED 1。**
本節は**私(統合者)の誤りの記録**であり、evidence レーンの誤りではない。

| id | 私が書いたこと | 実際 | 種別 |
|---|---|---|---|
| **E01** | Particle の「972 library index」を verified 環境の証拠として提示 | 🔴 **`verified:true` は 10/972 = 1.03%**(`curl … libraryIndex.json \| jq` RC=0 で実測)。official 5 を足しても 15/972 = 1.54% | factual / 分母 |
| **E02** | Particle の存在を「managed 環境の需要の存在証明」へ昇格 | **機構の実在は示すが、需要は測っていない。**購入理由も verified 機構への需要も未測定 | 推論の飛躍 |
| **E03** | 「失敗はロジックではなく環境・ライブラリの正しさだった」 | 🔴 **論文と矛盾。** MDPI 原文はシナリオ 6/7 について **「エラーは source code の機能不備・通信関数の誤用・cloud 設定規則の不備に起因し、*不適切なライブラリ選択ではない — 全てのライブラリは適切だった*」**と明記。**「コンパイル失敗の最頻原因はライブラリ hallucination」は正しいが、複雑度崩壊(3/27)はライブラリのせいではない** | factual / 解釈 |
| **E04** | zero-shot ベンチマークを registry+compiler 機構の裏づけ、かつ Human 裁定の根拠差し替え候補へ昇格 | **論文は zero-shot のみを測り、RAG / few-shot / compiler feedback を測っていない**(論文自身の limitation)。**提案された解法は試されていない** | 手法の読み過ぎ |
| **E05** | 「compiler と AI が同じものを読むのが唯一まだ空いている場所」 | **要求候補ではなく差別化判断であり、非飽和母集団の absence に依存する。**Registry 設計 input へ事実として持ち込めない | absence の外挿 |
| **E06** | Arduino の AI を **App Lab の BYOK だけ**として機能表に記載 | 🔴 **Arduino Cloud AI Assistant(2025-04)が Cloud Editor 内に存在**。board/project コンテキスト、sketch 生成、**コンパイルエラー修正**、**Arduino の documentation / libraries / code examples を使用**。Arduino は「hand-picked structured documentation を継続更新して Claude に与えている」と公表。**残存連言に最も近い既存製品を落としていた** | 欠落 / 過小評価 |
| **E07** | 母集団に半導体ベンダ系 AI が無い | **Microchip MPLAB AI Coding Assistant(無料)** — ベンダ固有の製品/文書知識 + 継続更新 + コード編集/エラー検出。**browser ではないが「ベンダ知識 + AI + toolchain」カテゴリの未探索競合** | 母集団の穴 |
| **E08** | 「AI firmware 生成の継続利用は paid-only common」と閉じた集合で断定 | **real-use なしに「どの利用者に実用でないか」は閉じられない。**`05` 自身が light use で Arduino Cloud / Codey を `$0` fit としている | 分類の過剰 |
| **E09** | commodity / uncommon の「〜のみ」を市場全体に対して主張 | **非飽和母集団からは出せない。**正しい単位は**「本調査で一次確認した集合では」** | 分類の過剰 |
| **E10** | Backend target を Registry entity に含めた | **「Cloud 専用にしない」は製品/経路の要求であって registry entity である必然は未調査。**compiler / project manifest / config との所有権比較が無い | 包含側の scope creep |
| **E11** | UI channel を Registry の source of truth 候補へ | `02:219-223` は **per-program の意図には manifest / annotation / schema-first API が必要で registry metadata 単独では不足**としている。**device capability と project instance の channel を分けていない** | 包含側の scope creep |
| **E12** | 「検証の組合せ爆発が費用の本体」 | **未計測。**D6 の費用モデルは matrix コストを測っておらず、hardware lab / CI matrix はモデル外と明記。**測定済モデルでは AI が 97.97%** | 未裏づけの費用主張 |
| **E13** | `PRODUCT VALUE PARTIALLY RESOLVED` | **hedge。**正しくは `legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED` | 判定の状態誤り |

### §5-1. 訂正後の差別化状況(§G の置き換え)

| 旧 §G の記述 | 訂正後 |
|---|---|
| 「どの既存製品も全条件を同時に満たさない」 | **本調査で一次確認した範囲では満たす製品を取得できなかった。ただし空白の広さの確信度は下がった** |
| 最近接製品 = Particle / Embedder | 🔴 **最近接は Arduino Cloud AI Assistant**(browser + text C/C++ + AI + ベンダ整備の構造化ドキュメント + 同一 compiler surface)。**破れていないのは「AI と compiler が同じ versioned registry を読む」ことと「tested version 組合せの公開」の 2 点だけ** |
| Particle = managed 環境の唯一の公開実例 | **機構は実在するが coverage は 1.03%。**AI は公開証拠なし(docs 2,398 URL + marketing 937 URL + repo 9,216 path を走査して 0) |

### §5-2. D7 が破れなかったもの(= 現時点で残る)

1. **auto Web UI の機構境界**(Blockly metadata / 3 widget / AI は非表示の外観のみ)— `02` と一致
2. **donor の Modbus 境界**(FC03/FC06 単一レジスタ、型/複数ワードモデル無し、backend 外部)— `03` と一致
3. **`NF ≠ unsupported` の限定**が主要セルで保たれていたこと
4. **Particle の機構そのものの実在**(version 表・verified 定義・依存 version・browser compiler)
5. **MDPI の数値と「コンパイル失敗の最頻原因」の引用**(27×8 / 19 / 23 / 9 / 11 / 3 すべて再現)
6. **D6 の費用算術**($4,042.23 / $3,960 / 97.97% / $82.23 — 再計算一致)
7. **旧 value grounds 5 本の反証**

### §5-3. まだ誰も見ていないもの(D7 の指摘、次への入力)

- **Arduino Cloud AI Assistant の系統監査**(最近接製品。未監査)
- **Microchip / 半導体ベンダ系 AI アシスタントのカテゴリ**(未探索。国内ベンダ/商社も未着手)
- **「AI と compiler が同じ registry を読む」を観測する計器そのもの**(語彙比較ではなく artifact ID/hash の追跡)
- **Particle の verified coverage の更新頻度・再検証 trigger・失効ポリシー**
- **ライブラリ名の正しさと API の正しさを分離する実験**(registry は前者を抑えるが後者は未測定)
- **Registry の費用分母**(対応組合せ数・CI job・実機ベンチ分・保守イベント数)
- **対象利用者の観測証拠**(失敗率・時間短縮・定着・支払意思)— **問題の実在と製品需要を結ぶ欠落リンク**
- **証拠の非対称の明示** — donor はソースコード、競合は marketing/docs のみ。**§G の確信度ラベルに反映されていない**
