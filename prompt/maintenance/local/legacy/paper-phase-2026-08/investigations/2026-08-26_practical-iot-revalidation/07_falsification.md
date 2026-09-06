# 07 — digicode-text product-value hypothesis falsification

- `[command+RC]` Packet: `S007-D6-falsification`; lane: `FALSIFICATION`; retrieval date: 2026-08-26.
- `[command+RC]` 指定された6報告、合計 `2,204 lines / 6 files` を読んだ。donor repository、donor の `prompt/`、`CLAUDE.md`、`AGENTS.md`、governance文書は開いていない。書き込みは本ファイルだけである。
- `[inference]` 本報告の判定対象は「その機能を作れるか」ではなく、各T1–T5が **digicode-textを必要にする差別化理由として残るか** である。競合が同じ結果を安価に出せる場合、digicode-text自身にも実装可能であることは差別化claimを救わない。
- `[NOT OBTAINED]` account作成、login、trial、payment、sales contact、実機flash、vendor IDE内操作、enterprise proxy環境での実通信は実施していない。

## Evidence contract

- `[primary source]` vendor自身の公開site/docs/repository、standards implementationの公式docs、またはpublic-cloud providerの公式価格。各使用箇所にURLと取得日を付ける。
- `[secondary source]` 他lane報告または第三者資料。一次資料の代用にはしない。
- `[command+RC]` このlaneで実行して観測したHTTP取得、JSON集計、repository内読取、report検査。
- `[inference]` 一次資料からの比較、費用算術、product-value判定。assumptionを明示する。
- `[NOT OBTAINED]` account、実機、非公開契約、または取得不能のため測れなかった値。

## The strongest argument against digicode-text that I can construct

`[inference]` digicode-textが売ろうとしているのは、すでに別々の成熟した無料/低価格製品が占める5つの層を、もう一度一社で抱えることである。Particleはdevice/OS version表、verified library、architecture、versioned dependency、cloud compile/flashを公開している。PleaseDontCodeはtext codeのglobal variablesを解析してdashboard widgetを提案し、CodeyとPleaseDontCodeはChrome/EdgeだけでAI生成→cloud compile→Web Serial flashを無料枠から行う。ESPHomeはinverter register mapをtyped entityへ変換し、MQTT/Home Assistantとdevice-served Web UIへ自動的に露出する。Mosquitto、Node-RED、InfluxDB、Grafanaは無料・self-hostedで右半分を埋める。したがって、managed environment、automatic UI、browser-only delivery、industrial chain、freeという個々の主張は、どれも空白地帯ではない。

`[inference]` 残る狭い組合せは「ordinary text C/C++、browser、AI、compilerが同一のvendor-maintained verified registryを参照し、arbitrary MCU ecosystemを扱う」である。しかし、この組合せの各語は互いに費用と信頼性を悪化させる。arbitrary hardwareを広げるほど検証matrixは組合せ爆発し、cloud AIを無料にするほどtoken費用とabuse面が増え、browser-onlyにするほどWeb Serial policyとnetwork allowlistに支配される。しかも、donor由来UIはarbitrary C++解析ではなくBlockly metadataから3種のwidgetを出すだけなので、text-code productへ移すには最も差別化を主張した入力adapterを新規に作る必要がある。これは「既存資産を無料化すれば勝てる」状況ではなく、既存無料stackの上に、最も高価な統合・検証・support責任だけを新たに引き受ける状況である。

`[inference]` 10,000 MAUの例では、80,000 compiles/月のcompute・artifact storage・hosting・signingは約 `$82.23/month` にすぎないが、60,000 AI calls/月をClaude Sonnet 4.6でsubsidizeすると `$3,960/month`、さらに保守/supportを2.0 FTEと仮定すると `$24,000/month` である。無料提供は可能だが、差別化ではなく、BYOK、利用制限、寄付、cross-subsidy、または資本によって誰がその費用を負担するかという事業モデルである。競合もすでに同じ無料枠/BYOK/FOSSを使っている。

## T1 — The core value: a managed, verified MCU environment

### Attack evidence

- `[primary source]` Particleは、Device OSのversionごとにsupport device/platform、GA/preview/archive、default release、LTS/minimum versionを出すinteractive version tableを公開する。user firmware binaryはminimum target Device OS versionを持ち、古いdeviceは必要なsystem binaryへ自動upgradeする。URL: https://docs.particle.io/reference/device-os/versions.md （retrieved 2026-08-26）。これは「vendorはcompatibility matrixを公開しない」という広い不在主張へのpositive controlである。
- `[command+RC]` `https://docs.particle.io/assets/files/libraryIndex.json` を `curl` + `jq` で取得・集計し、`972 libraries` を観測した（RC=0）。各recordはversion、architectures、dependencies/verification classを保持し、sample `neopixel 1.0.4` は `verified: true` / `verified community library` だった。URL取得日: 2026-08-26。
- `[primary source]` Particleのlibrary docsはverified libraryについて「all relevant hardware platformsでcompileし、意図どおり動作し、第三者が追試できる`verification.txt`を含む」と定義する。`library.properties` はcompatible `architectures`、library semver、依存libraryのexact desired versionを持つ。URL: https://docs.particle.io/getting-started/device-os/firmware-libraries/ （retrieved 2026-08-26）。これはboard/device OS/library/dependency/version/verificationを公開schemaで結ぶvendor例である。
- `[primary source]` Particle Web IDEはbrowserからcode、cloud compile、OTA flashを行い、library versionをprojectへ含め、target Device OS versionを選べる。URL: https://docs.particle.io/getting-started/developer-tools/build/ （retrieved 2026-08-26）。`[inference]` board/library managerをlocal PCに置かず、vendor-side environmentを使うoutcomeはすでに存在する。
- `[primary source]` PlatformIOは`platformio.ini`の`lib_deps`でregistry/Git dependencyとversionを指定し、`platform_packages`でenvironmentごとのtoolchain/framework/SDK packageをversion指定またはoverrideできる。URL: https://docs.platformio.org/en/latest/projectconf/sections/env/options/library/lib_deps.html および https://docs.platformio.org/en/latest/projectconf/sections/env/options/platform/platform_packages.html （retrieved 2026-08-26）。
- `[primary source]` ESPHomeはframeworkの`recommended`/exact version、container tags、Git `ref`、package/external-component refを持ち、公式CIはbuilt imageでESP32 Arduino/ESP-IDF等のper-toolchain compile smoke matrixを実行する。URL: https://esphome.io/components/esp32/ および https://github.com/esphome/esphome/tree/dev/.github/workflows （retrieved 2026-08-26）。
- `[inference]` 無料assembled pathは `version-pinned platformio.ini + pinned container image + CI compile matrix + ESPHome/package metadata + local or BYOK LLM` である。これはvendorが全組合せを保証するserviceではないが、toolchain/framework/library version driftを避け、AIへ同じmanifestを渡す技術outcomeはlicense feeなしで構成できる。
- `[primary source]` Embedderは590+ platform catalog、datasheet/reference/errata、custom peripheral PDF、repositoryのbuild/test/debug/flash workflow検出、connected hardwareでbuild/flash/runtime evidenceを分けるagentを公開する。URL: https://docs.embedder.com/supported-hardware.md 、https://docs.embedder.com/quickstart.md 、https://docs.embedder.com/solutions/automated-testing.md （retrieved 2026-08-26）。`[inference]` vendor-maintained hardware knowledge + AI + actual toolchain/HILという残りgapに最も近い既存製品である。

### Attack result

- `[inference]` Particleは「公開matrixがない」というabsenceを破った。PlatformIO/ESPHome/container/CIは無料assemblyで再現可能性の大部分を満たし、EmbedderはAI/HIL側を既に提供する。よって「managed/verified environmentという発想自体が空白である」は反証された。
- `[NOT OBTAINED]` ただし、Particleのcompilerとvendor AIが同じregistryを読む証拠はない。Embedderはuser既存toolchainを使い、Particleの全libraryがverifiedではない。任意board×toolchain×framework×device libraryの全組合せをvendorが継続検証し、AIとcompilerの単一source of truthにして、利用者がmanager/GitHubを一切触らないという **全条件同時成立** は得られなかった。

### Verdict

**PARTIALLY_REFUTED**

- `[inference]` **Attacks tried:** six-lane vendor absenceへのpositive-control search、Particle version/library indexのdirect retrieval、verified-library定義の読解、PlatformIO/ESPHome/container/CI無料assembly、Embedder AI/HILの比較。
- `[inference]` **What would change the verdict to REFUTED:** 一つの既存productで、compilerとAIが同じversioned registryを参照し、board×toolchain×framework×library/deviceのtested combinationsを公開し、browserからmanagerなしでcompile/flashできる一次資料または非transactional product観測。
- `[inference]` **What would change the verdict to SURVIVED:** Particle verified-library/device-version mechanismが実際にはcompiler targetに拘束されない、またはpublished verificationが現在無効である実測、かつ無料assembled pathがtarget usersに再現不能であるadoption evidence。

## T2 — Automatic Web UI generation as a differentiating asset

### Attack evidence

- `[primary source]` PleaseDontCodeの公開home pageはPOTA dashboardについて **“Global variables from your code are automatically analyzed and suggested as widgets, no manual setup needed”** と明記し、thermometer、real-time chart、slider、toggle、button、dropdownを列挙する。URL: https://www.pleasedontcode.com/ （retrieved 2026-08-26）。これは文字どおり「programを解析しUIを提案する」であり、Blockly metadataではなくuploaded/generated text codeのglobal variablesが入力である。
- `[primary source]` Blynk AI Assistantはnatural-language descriptionからworking templates、datastreams、widgetsを作り、weather/HVAC dashboardのlayout、range、alertを提案し、data converter codeも生成する。URL: https://www.blynk.io/blog/blynk-ai-assistant-describe-what-you-need-the-platform-builds-it （retrieved 2026-08-26）。`[inference]` existing program解析ではないが、「one prompt → dashboard + datastream + alert + code」はUI outcomeとしてより広い。
- `[primary source]` ESPHomeは「定義したsensor/switch/light/displayがHome Assistant UIに自動出現」し、deviceの`web_server`もconfigured entitiesのcontrol/view UIを生成する。local assetsをfirmwareへ含め、clientにInternet不要にもできる。URL: https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/install/getting-started.mdx および https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/web_server.mdx （retrieved 2026-08-26）。
- `[secondary source]` `02_auto-web-ui-deep-dive.md`はdonor機構がarbitrary C++/AST/AI解析ではなくBlockly XML block fieldを読み、functional widgetはtoggle/slider/displayの3種、AI customizationは非表示かつappearance-onlyであると報告する。`[inference]` text-code版では、差別化を担うprogram→schema adapterがdonor assetに存在しない。

### Attack result

- `[inference]` PDCはT2のattack wordingそのものをshipしている。Blynkはdashboard generation scopeが広く、ESPHomeはAIなしでより再現可能なconfig→entity/UIを無料で行う。donor機構の3-widget Blockly adapterは、これらより一般的でもtext-nativeでもない。
- `[NOT OBTAINED]` PDCのglobal-variable analyzerのfalse-positive/false-negative率、Blynk AIの生成成功率、各UIの実機latency/安全性はaccount/real-fireなしで測れていない。

### Verdict

**REFUTED**

- `[inference]` **Attacks tried:** PDC landing/POTA claimのdirect retrieval、Blynk AI postのdirect retrieval、ESPHome automatic HA UI/device web server docs、donor mechanismとのinput/widget breadth比較。
- `[inference]` **What would change the verdict:** PDCの記述が未出荷marketingでglobal-variable解析がproductに存在しない実測、Blynk AIがdashboard/codeを生成しない実測、かつESPHome config-driven UIが対象user outcomeに不適切であるadoption evidence。単に「source analysisではなくconfig/prompt driven」はoutcome差別化を回復しない。

## T3 — Browser-only, zero-install, zero-privilege operation

### Attack evidence

- `[primary source]` CodeyはAI code/wiring生成、cloud compile、Chrome/Edge Web Serial flashをone browser tabで行い、free offer `$0` / Pro `€9.99`を同じpageに構造化表示する。`“No IDE, no driver hell, no setup”`、server-side toolchain、pre-installed librariesも明記する。URL: https://codey.online/ （retrieved 2026-08-26）。
- `[primary source]` PleaseDontCodeは`“Everything from the browser, nothing to install”`、desktop Chrome/Edge、browser serial-port picker、cloud `arduino-cli` compile/auto-repair/USB flashを明記する。free planは3 credits/月、1 device、no credit cardでcode generation/compile/USB flash/POTAを含む。URL: https://www.pleasedontcode.com/ （retrieved 2026-08-26）。
- `[primary source]` Web Serial APIはHTTPS secure contextでのみ使え、limited availability / experimentalとされ、Permissions Policy `serial`の対象である。URL: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API （retrieved 2026-08-26）。
- `[primary source]` Chromium enterprise policy `DefaultSerialGuardSetting`はvalue `2`で全siteのserial requestをdenyでき、`SerialBlockedForUrls`はsite URL pattern単位でSerial APIをblockできる。Chrome/ChromeOS 86+でsupportされる。URL: https://chromium.googlesource.com/chromium/src/+/main/components/policy/resources/templates/policy_definitions/ContentSettings/DefaultSerialGuardSetting.yaml および https://chromium.googlesource.com/chromium/src/+/main/components/policy/resources/templates/policy_definitions/ContentSettings/SerialBlockedForUrls.yaml （retrieved 2026-08-26）。
- `[inference]` locked-down PCでadmin不要というclaimは、OS install権限よりChrome enterprise policyとnetwork allowlistに依存する。digicode-textだけがこの制約を回避するmechanismはない。vendor origin、compile endpoint、LLM endpoint、package registryのいずれかがproxy/firewallでblockされれば、browser shellだけ起動してもend-to-end outcomeは成立しない。

### Attack result

- `[inference]` browser-only end-to-endは既にCodey/PDCが無料枠でshipしており、delivery差別化はない。enterprise環境ではWeb Serial自体をpolicyでdenyできるため、「install不要だからlocked-down PCに強い」という一般化も成立しない。allowlistされた学校PCでは利点は実在するが競合にも同じ利点がある。
- `[NOT OBTAINED]` 特定の学校/corporate proxyでCodey、PDC、digicode-text候補を並列実行するreal enterprise network testは行っていない。device固有USB driverが本当に不要なboard denominatorも実機で測っていない。

### Verdict

**REFUTED**

- `[inference]` **Attacks tried:** Codey/PDCのbrowser→compile→flash一次資料と無料条件、Web Serial platform limitation、Chromium enterprise deny policy、remote endpoint dependencyのnetwork failure analysis。
- `[inference]` **What would change the verdict:** 対象school/corporate fleetでdigicode-text originだけが正式allowlistされ、競合origin/agent installが禁止され、複数target boardsでdriverなしflashが成功する管理者policyとreal-fire記録。一般browser capabilityの存在だけでは変わらない。

## T4 — Practical industrial IoT reach

### Attack evidence

- `[primary source]` ESPHome `modbus_controller`はRS485 Modbus clientとしてcoil/input/holding/input-registerをsensor/switch/select/number/outputへ露出し、U/S word/dword、reversed word order、FP32、bitmask、scale、multi-register、arbitrary `custom_command`を扱う。URL: https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/modbus_controller.mdx （retrieved 2026-08-26）。
- `[primary source]` ESPHome MQTT componentはESP32でarbitrary broker、TLS/client certificate、publish/subscribeを持ち、Home Assistant MQTT discoveryをdefaultで有効にしてentityを自動追加する。docs自身がlocal Mosquitto brokerを例にする。URL: https://raw.githubusercontent.com/esphome/esphome.io/current/src/content/docs/components/mqtt.mdx （retrieved 2026-08-26）。
- `[primary source]` Eclipse MosquittoはEPL/EDL licensed open-source MQTT brokerで、plain/TLS/WebSocketをsupportする。URL: https://mosquitto.org/ （retrieved 2026-08-26）。
- `[primary source]` Node-REDはOpenJS Foundation下のflow-based/low-code event-driven toolである。URL: https://nodered.org/about/ （retrieved 2026-08-26）。InfluxDB 3 CoreはMIT/Apache-2.0のopen-source time-series DBでlocal diskをsupportする。URL: https://github.com/influxdata/influxdb （retrieved 2026-08-26）。Grafana OSSはopen-source metrics/dashboard/visualizationを提供する。URL: https://grafana.com/oss/grafana/ （retrieved 2026-08-26）。
- `[inference]` 具体的無料pathは `inverter manual/register map → isolated RS485 transceiver → ESP32 + ESPHome modbus_controller YAML → local Mosquitto → Home Assistant auto-discovery UI` である。履歴/任意flowが必要なら `Mosquitto → Node-RED → InfluxDB → Grafana` を追加する。software licence costは `$0`、cloud vendor dependencyも必須でない。
- `[secondary source]` `03_donor-iot-capability.md`はdonor ModbusがFC03/FC06のsingle 16-bit holding registerに限定され、register map、multiword/float/endian/bitfield、安全interlock、backend/dashboardは外部と報告する。`[inference]` ESPHomeはこのdonor-side limitationの大部分を既に直接扱う。

### Attack result

- `[inference]` golden scenarioで最も難しい情報はinverter vendor manualのregister map、電気的isolation/termination/grounding、control safety、backend運用である。digicode-text/donorはそれを供給せず、ESPHomeもmanual入力を必要とする。両者が同じ外部hard partを残すなら、donorの狭いFC03/FC06 wrapperは差別化価値ではなく劣後部分である。
- `[inference]` Azure必須でなければRaspberry Pi/local pathは一次資料だけで完成する。Azureを選ぶ場合も、device-side valueではなくbroker/cloud connector構成の問題であり、digicode-textだけのassetではない。
- `[NOT OBTAINED]` 実inverter、isolated transceiver、fault injection、MQTT delivery、Home Assistant/Grafana real-fireは行っていない。industrial safety certification、cybersecurity、24/7 reliabilityはどのstackについても証明していない。

### Verdict

**REFUTED**

- `[inference]` **Attacks tried:** ESPHome Modbus datatype/register breadth、MQTT/HA automatic discovery、device UI、free local broker/flow/DB/dashboard chain、hard-part allocation、donor Modbus limitationとの比較。
- `[inference]` **What would change the verdict:** target inverter群に対するvendor-maintained tested register profiles、安全control model、one-click backend deployment、field reliability evidenceをdigicode-textが持ち、ESPHome/manual gateway pathより測定可能に低い工数/故障率を示すreal-fire。単なるMQTT/HTTP block追加では変わらない。

## T5 — Free provision as a competitive weapon

### Public unit prices

- `[primary source]` Google Cloud Run Jobs us-central1 list price: CPU `$0.000018/vCPU-second`、memory `$0.000002/GiB-second`、monthly free tier `240,000 vCPU-seconds` + `450,000 GiB-seconds`。URL: https://cloud.google.com/run/pricing （retrieved 2026-08-26）。
- `[primary source]` Cloudflare R2 Standard: `$0.015/GB-month`、Class A `$4.50/million`、Class B `$0.36/million`、Internet egress free。free tier: `10 GB-month`、`1 million Class A`、`10 million Class B`。URL: https://developers.cloudflare.com/r2/pricing/index.md （retrieved 2026-08-26）。
- `[primary source]` Cloudflare Workers Paid minimum `$5/month`、10 million dynamic requests included、static asset requests free/unlimited、egress chargeなし。URL: https://developers.cloudflare.com/workers/platform/pricing/ （retrieved 2026-08-26）。
- `[primary source]` Claude Sonnet 4.6 standard API: base input `$3/MTok`、output `$15/MTok`（MTok = million tokens）。URL: https://platform.claude.com/docs/en/about-claude/pricing （retrieved 2026-08-26）。
- `[primary source]` AWS KMS: customer-managed key `$1/month`; asymmetric signing exampleは `$0.15/10,000 Sign requests`。URL: https://aws.amazon.com/kms/pricing/ （retrieved 2026-08-26）。

### Cost model — 10,000 MAU/month

すべてのassumptionを固定し、価格表にない値は推定と分離する。

| Item | Assumption | Arithmetic | Monthly cost |
|---|---|---:|---:|
| Cloud compilation | `[inference]` 10,000 MAU × 8 jobs/user = 80,000 jobs; 45 seconds/job; 1 vCPU + 2 GiB; cache hit benefitは0として保守的に無視 | CPU `(80,000×45−240,000)×$0.000018 = $60.48`; RAM `(80,000×45×2−450,000)×$0.000002 = $13.50` | **$73.98** |
| Web hosting/API | `[inference]` Workers Paid、dynamic ≤10M requests、static assets主体 | base `$5`; included request範囲内 | **$5.00** |
| Traffic | `[inference]` firmwareはR2から直接配信、他metered service経由なし | R2 Internet egress `$0`; Workers egress `$0` | **$0.00** |
| Artifact storage | `[inference]` 1 MiB/job、30日retain ≈80 GB-month、1 write + 2 reads/artifact | storage `(80−10)×$0.015=$1.05`; 80k Class A <1M free; 160k Class B <10M free | **$1.05** |
| AI provider | `[inference]` 6 calls/user/month =60,000 calls; 12,000 input +2,000 output tokens/call; cache/batch discountなし | input `60,000×12,000/1M×$3=$2,160`; output `60,000×2,000/1M×$15=$1,800` | **$3,960.00** |
| Artifact signing | `[inference]` 1 asymmetric KMS Sign/job、1 key | key `$1`; `80,000/10,000×$0.15=$1.20` | **$2.20** |
| Maintenance | `[inference]` assumption: 1.5 FTE × `$12,000/FTE-month` fully loaded; salary geographyを決めるprimary sourceなし | `1.5×$12,000` | **$18,000.00** |
| Support/abuse/ops | `[inference]` assumption: 0.5 FTE × `$12,000/FTE-month` fully loaded | `0.5×$12,000` | **$6,000.00** |
| **Infrastructure subtotal** | `[inference]` labour除外 | `$73.98+$5+$0+$1.05+$3,960+$2.20` | **$4,042.23/month = $0.404/MAU-month** |
| **All-in modeled total** | `[inference]` 2.0 FTE含む | `$4,042.23+$24,000` | **$28,042.23/month = $2.804/MAU-month** |

- `[inference]` AIだけでinfrastructure subtotalの `3,960 / 4,042.23 = 97.97%`。6 calls/userを1 call/userに落とせばAIは `$660/month`、BYOKならvendor AI billは `$0` だが、機能を無料にしたのではなく費用をuserへ移したことになる。
- `[inference]` AIを除いたmodeled infrastructureは `$82.23/month`。cloud compile/storage/egress/signing自体は小規模なら十分安い。したがって「freeは技術的に不可能」というattackは失敗したが、「無料AI + continuous verification + supportを無制限にvendor負担してもcliffがない」は成立しない。
- `[NOT OBTAINED]` DB/logging/monitoring、email、DDoS/abuse、package-registry egress、backup、tax/payment fee、legal/security review、hardware lab、CI matrix実機、on-call、regional redundancyはmodel外。これらは実費を上げる方向で、下げる方向ではない。FTE単価は地域で上下するためdecision-grade予算ではなくsensitivity assumptionである。
- `[primary source]` 競争面ではCodey `$0`、PDC free、Arduino Cloud free、ESPHome FOSS、Blynk freeが既に存在する（各vendor URLsはT2/T3および`05_pricing-and-limits.md`のprimary captures）。`[inference]` freeはcategory entry conditionであり、単独のdefensible differentiatorではない。

### Verdict

**REFUTED**

- `[inference]` **Attacks tried:** compute/storage/hosting/egress/signing/API list-price model、AI token sensitivity、maintenance/support FTE sensitivity、BYOK/FOSS/competitor free-tier比較。
- `[inference]` **What would change the verdict:** non-subsidized recurring revenue/cross-subsidyがfree-user costとcontinuous verification/supportをcoverageし、競合free tiersより高いretention/adoptionを生む実測unit economics。寄付やgrantがあるだけでは「freeそれ自体がdifferentiator」の証拠にならない。

## Attack on the other lanes' reports

### `02_auto-web-ui-deep-dive.md`

- `[secondary source]` Checked: parser input、widget union、BLE/Wi-Fi transport、AI feature flags、text-code reuse boundary、static/synthetic/real-fire labels。内部denominatorとclaim qualifiersを照合した。
- `[inference]` **No factual error found.** 攻撃は別方向で成功した: reportが示すdonor assetの狭さ（Blockly metadata、3 functional widgets、inactive appearance AI）がPDC/Blynk/ESPHome一次資料に対するT2差別化を守れない。runtime rung未実施はreport自身が明記している。

### `03_donor-iot-capability.md`

- `[secondary source]` Checked: 580 block denominator、Modbus FC03/FC06 shape、MQTT/backend distinction、board FQBN mapping、golden-scenario limits、未実施rungs。
- `[inference]` **No factual error found.** 「narrow but real demo」は`inference`でありreal-fire claimではない。T4 attackは、ESPHomeがreport記載のdonor gaps（multi-register/type/endian/bitmask）を一次資料で既に埋めることを示した。

### `04_competitor-population.md`

- **OL-01** `[secondary source]` §introは「20 searches and 6 direct page fetches」と書くが、同report §1は`SEARCHES_RUN: 34`、S1–S34を列挙する。`[inference]` stale denominatorである。
- **OL-02** `[secondary source]` D3はArduino Cloud Editorとdesktop App Labを1 rowへ結合し、overlap mapでBr/Tx/AI/Env/Dep/CCを全て●にする一方、同reportはAI Agentic ModeをApp Lab desktop、Cloud Editorをbrowserと説明する。`[inference]` 一つのproductが全機能を持つように見せるcomposite-row overreachである。
- **OL-03** `[secondary source]` 「48 named candidates」は6+11+25+6の **rows** であり、A19はAWS+Azure、A22は複数flasher、S1/S3/S4は複数製品群を1 rowにまとめる。`[inference]` denominatorのunitは`candidate rows`であってnamed productsではない。

### `04b_population-gap-closure.md`

- **OL-04** `[secondary source]` 「13 direct retrievals attempted, 9 succeeded, 4 hard-blocked」はtable row数をrequest数として扱うが、1 row内にMDPI `/htm` + `/pdf`、複数method、ScienceDirect `/pdf` + `/pdfft` + proxyをまとめる。`[inference]` attempted request denominatorと表の集約row denominatorが一致せず、9+4のcross-checkはHTTP試行数を検証しない。
- **OL-05** `[secondary source]` IoT-SkillsBenchの「human-expert skillsでnear-perfect」を「academic statement of this project's thesis」と同一視する。`[inference]` structured prompt/skill knowledgeは、vendor-maintained board×toolchain×library version matrix、compiler binding、user-facing manager eliminationを測っていない。supportive analogyではあるが、project mechanismの第三者評価というラベルはover-strongである。

### `05_pricing-and-limits.md`

- **OL-06** `[secondary source]` §2.6/§7はBlynkに「no AI features」「no AI code generation」と断言する。`[primary source]` Blynk公式postはAI Assistantがdashboard、datastream、alert、data-converter codeをpromptから生成すると明記する: https://www.blynk.io/blog/blynk-ai-assistant-describe-what-you-need-the-platform-builds-it （retrieved 2026-08-26）。明確なfactual errorである。
- **OL-07** `[secondary source]` ESPHomeのbinding costを`$1–10/month`、self-host required/always-on SBCとしてcost化する。`[primary source]` ESPHome公式getting-startedはCLIとWindows/macOS/Linux Desktopを別install pathとして明記する。開発・compile・USB/OTAだけなら既存PCでon-demand実行でき、software/hosting `$0` pathがある。Home Assistant/always-on Device Builderを使う場合との混同である。
- **OL-08** `[secondary source]` App Lab AI costをlight `$5–15`、individual `$20–60`とするが、model、input/output token数、rateを示さず、「every inference arithmetic shown」というreport自身のcontractを満たさない。
- **OL-09** `[secondary source]` Viam 5-user costをindividual estimateの5倍にしながら、同reportはseat chargeなし/headcount does not directly multiplyと書く。usageがheadcountに比例するassumptionを置いておらず内部矛盾である。
- **OL-10** `[secondary source]` §7の「Every AI-assisted embedded editor ... none is hobby-usable」は、同report §4.1がCodey light use `$0` fits、Blynk `$0` fitsとすること、そしてBlynk公式AI機能と矛盾する。population全体ではなくaudit subsetからの全称化でもある。

### `06_feature-primary-sources.md`

- **OL-11** `[secondary source]` report自身は対象6 vendor内の`not found in docs`と限定しており、個別cellのfactual errorは見つけなかった。しかしこの6-vendor negativeを「vendorはmatrixを公開しない」へ外挿するabsence detectorにはpositive controlがない。`[primary source]` ParticleのDevice OS version×device table、972-library index、verified-library definitionが反例である（T1 URLs、retrieved 2026-08-26）。report内限定ならvalid、market-wide conclusionへ使うとinvalidである。
- `[secondary source]` Checked: six-vendor denominator、NF/NO/US semantics、fetch log、PDC 33 visible/35+ claim、ESPHome 742-directory proxy、account-gated limits。上記outside-denominator absence以外のfactual errorは見つけなかった。

**OTHER_LANE_ERRORS: 11 (OL-01–OL-11).**

## Where my attack failed and why

1. `[inference]` **T1のexact conjunctionは生き残った。** Particleは最も強い反例だがvendor AIを持つ一次資料がなく、Embedderはuser toolchainを使い、ESPHome/PlatformIO assemblyはuserがmanifest/refを管理する。AIとcompilerのsingle source of truth + vendor continuous verification + no managers/GitHubの全条件を一製品で破れなかった。
2. `[inference]` **T3の便益自体は壊れていない。** 管理policyがSerial APIと必要originをallowする学校、個人PC、一時PCではzero-install browser flowは明確に便利である。壊れたのはunique differentiatorと「locked-downなら常に動く」という一般化である。
3. `[inference]` **T4でordinary text C/C++ preferenceは代替されていない。** ESPHomeはYAML/config-firstで、arbitrary C++ firmwareをそのまま取り込む製品ではない。text-code preferenceに支払意思があるかを示すadoption evidenceは得られなかったため、このniche preferenceは残る。
4. `[inference]` **T5でfreeの技術可能性は否定できなかった。** AIをBYOK/localにし、compiler jobsをfree tier/cacheへ収めればinfraは低額である。壊れたのはfree単独の競争優位とunbounded vendor-subsidized AI/supportであり、sponsor-funded public goodとしての成立可能性ではない。
5. `[NOT OBTAINED]` target userのwillingness-to-pay、retention、task completion time、failure rateを比較するprimary observational datasetは得られなかった。従って「誰も価値を感じない」までは主張しない。今回破ったのは競合不在/無料不在/機能不在に依存するproduct-value論である。

## Commands run and observed evidence

- `[command+RC]` `wc -l` on six reports → `2,204 total lines`, RC=0。`sed`/`rg`で全6報告の本文、headings、URL、limitsを読んだ、RC=0。
- `[command+RC]` `curl -LfsS` direct retrievals: Particle docs/index、PDC、Blynk、Codey、ESPHome raw docs/GitHub workflows、Embedder docs、PlatformIO docs、Chromium policy YAML、Mosquitto/Node-RED/InfluxDB/Grafana、Google Cloud Run、Cloudflare R2/Workers、Anthropic pricing、AWS KMS。採用URLはすべてHTTP success / curl RC=0。
- `[command+RC]` Particle `libraryIndex.json` → `972 libraries`; sample verified record observed、RC=0。
- `[command+RC]` POTA GitHub repository search → `pleasedontcode/POTA` 1 relevant repository in returned result、RC=0。ただしdashboard analyzer claimはrepositoryではなくvendor home page本文を一次根拠にした。
- `[command+RC]` Chromium policy sourceは最初のguessed `Serial/` pathがHTTP 404、curl RC=22。directory候補probeで`ContentSettings/DefaultSerialGuardSetting.yaml`と`SerialBlockedForUrls.yaml` HTTP 200を確認し、再取得/base64 decode RC=0。404 runはproduct findingに使っていない。
- `[command+RC]` Cloudflare R2 HTMLが過大だったためofficial alternate `https://developers.cloudflare.com/r2/pricing/index.md`を再取得し、price/free-tier tableを直接読んだ、RC=0。
- `[command+RC]` repository write前 `07_falsification.md` absence check → RC=0。receiving investigation directory全体はpre-existing untracked shared-worktree contentで、本laneは他fileを変更していない。
- `[command+RC]` 初回structure checkはT sections `5`、verdicts `5`、attack lists `5`を観測したが、T1にchange conditionが2本あるため`CHANGE_CONDITIONS=6`となり、検査器が誤ってexactly 5を要求してRC=1。report defectではなくinstrument defectとして棄却した。
- `[command+RC]` 修正版structure checkは `T_SECTIONS=5 / VERDICTS=5 / ATTACK_LISTS=5 / CHANGE_CONDITIONS=6 / OTHER_LANE_IDS=11 / STRUCTURE_RC=0`。change conditionsを`>=5`とし、closed-set verdict regexを使用した。
- `[command+RC]` `awk`でT5 arithmeticを独立再計算し、`CPU=$60.48 / RAM=$13.50 / AI=$3,960.00 / STORAGE=$1.05 / SIGN=$2.20 / INFRA=$4,042.23 / AI_SHARE=97.97% / ALL_IN=$28,042.23 / PER_MAU=$2.804`、RC=0を観測した。
- `[NOT OBTAINED]` Verification rungs not run: account UI `visual`、vendor API authenticated smoke、hardware compile/flash `real-fire`、enterprise proxy test、industrial inverter chain、user study。report structureの`static` checkのみ実行した。

## Conflict surface

- `[inference]` Literal packet conflict、uncovered decision、secret/credential exposure、donor boundary violationはなかった。
- `[inference]` Pre-existing investigation directoryがgit上untrackedであることはshared-worktree state。既存reportは変更していない。
