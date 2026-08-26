# 09 — 統合文書 `08` の falsification

- `[static]` Packet: `S007-D7-integration-falsification`
- `[static]` Lane: `FALSIFICATION`
- `[static]` Authority: `DELEGATED`
- `[static]` 調査日・外部取得日: **2026-08-26**
- `[static]` 対象: `08_conclusion-and-next.md` と、それが owner とする同ディレクトリの `02`〜`07`
- `[static]` donor repository は開いていない。donor の `prompt/`、`CLAUDE.md`、`AGENTS.md`、governance 文書も開いていない。
- `[static]` 書き込みは本ファイルだけである。

## 0. 結論

`[inference]` **攻撃は成功した。** `08` の主要な否定側結論（auto UI の独自性、browser-only の独自性、現 donor の industrial IoT 優位、free 単独の優位が崩れたこと）は残る。しかし、肯定側で最も荷重を受ける二本は、その強さでは残らない。

1. `[command+RC]` Particle の公開 index は **972 libraries** だが、`verified: true` は **10/972 = 1.02880658436214%**、`verified` field 自体がない通常 community library は **962/972** だった。`08:178` の **“972 verified library”** は総数と verified 部分集合の混同である。
2. `[primary source]` MDPI 論文は「コンパイル失敗の最頻原因」を hallucinated library / incorrect API usage と述べる一方、Firebase / InfluxDB の失敗については **不適切な library 選択ではなく** flawed functionality、improper communication calls、cloud configuration rules と明記する。`08:238` の **「失敗はロジックではなく環境・ライブラリの正しさだった」** は 8 scenario 全体への誤った一般化である。
3. `[primary source]` `08` が競合表から落とした **Arduino Cloud AI Assistant** は、browser の Cloud Editor 内で board/project context と Arduino の structured documentation/libraries を使い、同じ editor の compiler に直結している。full conjunction を満たす証拠ではないが、Particle より「AI + browser compiler + curated library knowledge」の連言に近い公開例である。
4. `[primary source]` 調査母集団にない **Microchip MPLAB AI Coding Assistant** も、Microchip-specific product/document knowledgeを継続更新し、MPLAB toolchain と結びつく。VS Code extension なので browser 条件は満たさないが、`08` の「空いている場所」を市場不在として扱えないことを示す追加の正の control である。
5. `[inference]` 従って、観測から言える強い状態は **「旧 product-value 根拠の複数は REFUTED / 問題の存在は SUPPORTED / 提案 solution の product value は NOT RESOLVED」** である。`PRODUCT VALUE PARTIALLY RESOLVED` は、個別仮説の解像度が上がったという意味なら可能だが、残った正の product-value case が部分的に立証されたという意味では過大である。

## 1. Attack target 1 — claim trace

`[static]` 読んだ分母は `02` 311 lines、`03` 287 lines、`04` 274 lines、`04b` 307 lines、`05` 480 lines、`06` 545 lines、`07` 219 lines、`08` 346 lines、合計 **2,423 evidence-owner lines + 346 synthesis lines = 2,769 lines**。`nl -ba` で全ファイルを開いた。以下は `08` の判断を支える load-bearing claim の全件表である。

Verdict は要求された closed set のみを使う。`SUPPORTED` は cited owner の限定を保った範囲、`OVERSTATED` は source より強い、`UNDERSTATED` は source が示す機能を落とした、`UNSOURCED` は owner がその市場全称・設計要件を立てていない、`CONTRADICTED` は source が反対を述べる、である。

| ID | `08` の load-bearing claim | `08` が示す owner | owner / 外部 source が実際に述べること | verdict |
|---|---|---|---|---|
| CT-01 | 競合不在・free・auto UI 独自性に依存した value 論は成立しない (`08:14-17`) | `07` T2/T3/T5 | `[static]` PDC/Blynk/ESPHome、Codey/PDC、free/BYOK/FOSS の attack を各 T で実行し T2/T3/T5 を `REFUTED` (`07:50-91,117-154`) | SUPPORTED |
| CT-02 | AI embedded 開発が library/API correctness で失敗する問題は実在する (`08:15-17`) | `04b` Paper A | `[primary source]` 論文は compilation failure の最頻原因を hallucinated non-existent libraries / incorrect API usage とする (`04b:176-205`) | SUPPORTED |
| CT-03 | 残る差別化候補は一つの連言で、既存製品の誰も満たさない (`08:16-17,221`) | `07` T1 | `[static]` `07` は調べた集合で破れなかったと述べるだけで、母集団調査は非網羅 (`04:14-21`)。本 lane でも新規に Arduino Cloud AI / Microchip を発見した | UNSOURCED |
| CT-04 | D6 は OL-01〜OL-11、factual error は OL-06 のみと分類した (`08:27-29`) | `07` other-lane attack | `[static]` OL-01〜11 と `OTHER_LANE_ERRORS: 11`、OL-06 を明確な factual error と記録 (`07:168-192`) | SUPPORTED |
| CT-05 | MQTT/HTTP/WS/BLE/Azure/Modbus 等の実装形と block 分母 (`08:35-49`) | `03` | `[static][command+RC]` 21/580、9/580、12/580、19/580、9/580、4/580 と各実装境界を owner が記録 (`03:28-46`) | SUPPORTED |
| CT-06 | Ethernet/Modbus TCP/LoRaWAN/cellular 等は exposed source 350/350 で 0 (`08:49`) | `03` | `[grep]` refined source/config population 350/350 で exact match 0、RC 1。installed image 内の transitively available API は未確認という限定つき (`03:267`) | SUPPORTED |
| CT-07 | Board は16 physical / 全 ESP32、frontend 16 と compiler 10 FQBN の二重手管理 (`08:51`) | `03` | `[command+RC]` frontend 16 physical / 10 distinct FQBN、compiler 10/10 mapping。literal 16-entry duplicate ではないとの限定つき (`03:82-101`) | SUPPORTED |
| CT-08 | device は library+pin model、arbitrary user dependency は製品能力として未確立 (`08:52,55`) | `03` | `[static][inference]` compile request に dependency list がなく fixed arrays。undocumented escape hatch の不存在までは証明しない (`03:138-145,256`) | SUPPORTED |
| CT-09 | donor の主要破断点は transport ではなく device interpretation/backend (`08:57-58`) | `03` | `[inference]` owner の practical verdict が同じ限定を置く (`03:241-246`) | SUPPORTED |
| CT-10 | auto UI は Blockly metadata only、functional 3 widgets、AI appearance path は hidden/no-op 部分あり (`08:64-87`) | `02` | `[static]` parser input、3 widget、false flags、renderer gapを直接記録 (`02:9-16,125-161`) | SUPPORTED |
| CT-11 | portable core は registration→schema→renderer、text版は両側 adapter が新規 (`08:95-100`) | `02` | `[static][inference]` pure inference と Blockly-dependent adapters の境界、最小 portable asset を記録 (`02:196-229`) | SUPPORTED |
| CT-12 | 主要 competitor の board/device/protocol/backend/UI/reproducibility 比較 (`08:113-130`) | `06`,`07` | `[primary source][static]` 6 vendor matrix と Particle 追加は概ね owner の限定 (`NF ≠ unsupported`) を保持する | SUPPORTED |
| CT-13 | Arduino の AI は App Lab 0.10 の MCP/LSP/BYOK として表現される (`08:128`) | `06`,`05` | `[primary source]` それに加え、Arduino Cloud Editor 自体が 2025-04 から AI Assistant を持ち、board/project context + structured Arduino docs/libraries を使う。`05` は 30 interactions/month を既に記録 (`05:49-73`) | UNDERSTATED |
| CT-14 | Particle は 972 library index、verified definition、version×device tableを持つ。`08:178` は “972 verified library” (`08:24,121,129,178`) | `07` T1 | `[command+RC]` 972 は index 総数。再測定は verified 10、official 5、ordinary community 957。verified 定義と version table 自体は一次資料で成立 | OVERSTATED |
| CT-15 | Particle **のみ**が公開文書で verified matrix を持ち、AI を持たない (`08:132-134`) | `06`,`07` | `[static]` `06` は調査6社内の negative、`07` は Particle positive control。本 lane の public sitemap scan では Particle coding assistant は見つからなかったが、市場全体の「のみ」は非網羅集合から出ない | UNSOURCED |
| CT-16 | pricing caps と “demo/learning/hobby-usable” practical labels (`08:139-158`) | `05`,`07` | `[static]` price/cap数値は owner にあるが、`05:350-358` は Codey light use `$0` fits とも述べ、`07:181-185` が label の内部矛盾を指摘。実利用0件 (`08:293`) | OVERSTATED |
| CT-17 | 10k MAU modelで AI=$3,960、infra=$4,042.23、97.97%、AI無し=$82.23 (`08:181-186`) | `07` T5 | `[command+RC][inference]` 算術は再計算済。ただし calls/tokens/provider/FTE は assumption、lab/registry matrix 等は model 外 (`07:127-146,213`) | SUPPORTED |
| CT-18 | golden scenarioで donor/ESPHome/Arduino 等の到達点と破断点 (`08:190-207`) | `03`,`06`,`07` | `[static][primary source][inference]` owner 3報告の限定を保持。real-fire は全て未実施 | SUPPORTED |
| CT-19 | commodity/common の市場分類 (`08:215-219`) | `04`〜`07` | `[inference]` 個々の例は存在するが “誰でも無料で持つ” は population-wide 全称。`04` は discovery curve 未収束を明記 (`04:14-21`) | OVERSTATED |
| CT-20 | sustained AI firmware generation は paid-only common (`08:219`) | `05`,`07` | `[inference]` “継続/実用” の閾値を real use で測っていない。Arduino Cloud AI 30/月、Codey 5/day は正の free evidenceで、どこから paid-only になるかは user workload 依存 | OVERSTATED |
| CT-21 | verified matrix=Particle only、datasheet+HIL=Embedder only、industrial Modbus=ESPHome突出 (`08:220`) | `06`,`07` | `[static]` 調べた集合内の比較としては近いが、市場 “only” を支える exhaustive denominator はない | UNSOURCED |
| CT-22 | exact conjunction は既存 product に存在しない (`08:221`) | `07` T1 | `[static]` `07:40,196` は **得られなかった/破れなかった**。不存在証明ではない。Arduino Cloud AI は近接例として表から落ちていた | UNSOURCED |
| CT-23 | independently demonstrated differentiator は0 (`08:223-224`) | `02`〜`07` | `[static]` account/compile/flash/hardware/user studyを実行しておらず、各候補は未実証と owner が記録 | SUPPORTED |
| CT-24 | auto UI/browser-only/free/industrial reach は false differentiator (`08:225`) | `07` T2-T5 | `[primary source][inference]` 各結果は competing implementation と policy/cost evidenceにより反証。便益そのものや text preference は残る限定も `07:194-200` にある | SUPPORTED |
| CT-25 | MDPI: 27×8、simple 19/27・23/27、Firebase 9/27、InfluxDB 11/27、full chain 3/27 (`08:234-237`) | `04b` Paper A | `[primary source]` full text の methods/results と一致。9/27 と11/27は first-attempt compile、3/27は四要件single-pass full solution | SUPPORTED |
| CT-26 | **失敗はロジックではなく環境・library correctness** (`08:238`) | `04b` Paper A | `[primary source]` Firebase/InfluxDBの失敗は flawed source functionality、improper communication calls、cloud configuration rulesで、all libraries were suitable。Grafanaはinvalid JSONも原因 | CONTRADICTED |
| CT-27 | G-1 は本調査最強の肯定証拠で、managed environment の価値軸を支持する (`08:229-248`) | `04b` | `[inference]` paperは zero-shot ESP32 benchmarkで registry/lock/compiler binding を評価しない。hallucinated nameはregistryで狭められるが incorrect API use と config/logic failureをregistryだけでは除けない | OVERSTATED |
| CT-28 | Human ruling の根拠を G-1 + Particle に差し替え可能、Particle は需要の存在証明 (`08:250-258`) | `04b`,`07` | `[inference]` paperは problem existence、Particleはmechanism existenceを示すだけ。Particle売上/採用理由/verified機構への需要を分離して測っていない | OVERSTATED |
| CT-29 | Registry entity: Platform/Board、Toolchain/Framework、Library/dependency/verification、Device、Protocol/register map (`08:265-274`) | `03`,`06`,`07` | `[static][primary source][inference]` donor duplication/device gap、version mechanisms、Particle library schema、golden breakを各 ownerが持つ | SUPPORTED |
| CT-30 | Electrical interfaceを registry inputに含める (`08:273`) | `03`,`07` | `[inference]` golden scenarioの isolation/termination/RS485、4–20mA/0–10V gapから要求候補への trace はある | SUPPORTED |
| CT-31 | Backend targetを registry entityとして管理 (`08:275`) | Human ruling + `03` | `[static]` evidenceは arbitrary broker/cloud-local destination の能力であり、backend targetが **registry entity** である必要性は測っていない。project configurationとの責務分離も未検討 | UNSOURCED |
| CT-32 | UI capability/channel declarationを registry の source-of-truth 候補にする (`08:276`) | `02` B-4 | `[static]` `02:219-223` は project manifest/code annotationが high-fidelityで、**registry metadata alone is not enough** と明記。per-program channelとglobal device capabilityを分けず registry entityに上げた | OVERSTATED |
| CT-33 | Compatibility+evidence+dateを持つ (`08:277`) | `07` Particle、Human ruling | `[primary source][inference]` guarantee scopeをdata化する先行形と、all-combination保証を避ける必要には traceできる | SUPPORTED |
| CT-34 | compilerとAIが同じregistryを読むことが唯一空いた差別化核 (`08:281`) | `07` T1 | `[static]` `07` は調査集合で同時成立を得られなかっただけ。Arduino Cloud AI/compilerは同一product内でlibrary knowledgeを使うが、same registryは未確認。唯一性は未証明 | UNSOURCED |
| CT-35 | verified matrixの組合せ爆発が費用の本体 (`08:282`) | `07` “strongest argument” | `[static]` D6費用表は verification matrixを計上せず、hardware lab/CI matrixを model外とする (`07:146`)。別の同文書では modeled infraの97.97%はAI (`08:181-185`) | UNSOURCED |
| CT-36 | compile pathにUI schemaなし、Particle verification path、AI自己申告をacceptanceにしない (`08:283-285`) | `02`,`07`,Paper A | `[static][primary source][inference]` compile schema channel absence、verification.txt、AI outputを独立検証すべき failure evidenceにtraceできる | SUPPORTED |
| CT-37 | `PRODUCT VALUE PARTIALLY RESOLVED`、価値は否定/確認でなく狭くなった (`08:317-331`) | 全体 | `[inference]` 旧根拠の複数は負にresolveしたが、残るのは problem existence と unoccupiedか未確認のconjunction。solution demand/effect/adoptionは未測定なので正のproduct valueは **NOT RESOLVED** | OVERSTATED |

`[command+RC]` **CLAIMS_TRACED=37 / SUPPORTED=20 / OVERSTATED=8 / UNDERSTATED=1 / UNSOURCED=7 / CONTRADICTED=1**。表の verdict token を機械集計し RC 0 で cross-checkした。

### この target で試した攻撃

- `[static]` `08` の number、qualifier、evidence type、absence denominatorを owner lineへ逆引きした。
- `[static]` `NF ≠ unsupported`、proxy denominator、account/real-fire未実施が `08` で保持されるか確認した。
- `[inference]` “調査で得られなかった” が “市場に存在しない” へ変換された箇所を positive-control search で攻撃した。

### 何があれば verdict が変わるか

- `[inference]` CT-03/15/21/22/34 の market-wide claim は、明示した inclusion criteria、飽和した discovery curve、vendor primary pass、既知 product（Arduino Cloud AI/Microchipを含む）の全件比較で初めて `SUPPORTED` へ変わる。
- `[inference]` CT-26/27 は、zero-shot paperとは別に **同じ tasks** で unmanaged baseline対vendor registry+compiler+AIを比較し、library/API/logic/config failureがどれだけ減ったか測れば変わる。

## 2. Attack target 2 — Particle と MDPI の独立再検証

### 2-1. Particle

#### Version × device / library mechanism

- `[primary source]` https://docs.particle.io/reference/device-os/versions.md （retrieved 2026-08-26）。user firmware binaryはminimum target Device OS versionを持ち、device側が古ければcloudが必要system binariesを送る。LTS tableは Platform / Models / Current LTS / Minimum Version を公開する。
- `[primary source]` https://docs.particle.io/getting-started/device-os/firmware-libraries/ （retrieved 2026-08-26）。verified community libraryは Particle team review、all relevant hardware platformsでcompile、intended operation、第三者追試可能な`verification.txt`を要求する。`architectures` と dependency desired version fieldも文書化する。
- `[primary source]` https://docs.particle.io/getting-started/developer-tools/build/ （retrieved 2026-08-26）。Web IDEはbrowserでcode/compile/OTA flashし、Library paneでParticle ecosystem libraryをprojectに加える。ただし同pageは product developmentにはWorkbenchを推奨する。

#### Verified ratio の再測定

`[command+RC]` 実行した command（URLはpublic、credentialなし）:

```bash
set -o pipefail
/usr/bin/curl -LfsS --connect-timeout 20 --max-time 120 \
  'https://docs.particle.io/assets/files/libraryIndex.json' |
jq '{total:(.libraries|length),
     verified_true:([.libraries[] | select(.attributes.verified == true)] | length),
     verified_missing:([.libraries[] | select(.attributes | has("verified") | not)] | length),
     ratio_percent: (([.libraries[] | select(.attributes.verified == true)] | length) * 100 / (.libraries|length)),
     verification_values:([.libraries[].verification] | group_by(.) | map({value:.[0],count:length})),
     kind_counts:([.libraries[].kind] | group_by(.) | map({value:.[0],count:length}))}'
```

`[command+RC]` 結果: `total=972 / verified_true=10 / verified_missing=962 / ratio=10/972=1.02880658436214% / verification:null 957, official 5, verified 10 / kind:community 957, official 5, verified community 10 / RC=0`。

`[inference]` official library 5件について docs は verified と同じquality standardsを満たすと述べるが、JSONの `verified:true` 比率という質問の答えは **10/972** である。quality-controlled officialまで広げた別指標は `(10+5)/972 = 15/972 = 1.5432098765%` であり、質問の ratio と混ぜない。

#### Particle AI と compiler は同じ registry を読むか

- `[command+RC]` `docs.particle.io/sitemap.xml` **2,398 URLs** と `particle.io/sitemap-0.xml` **937 URLs** を走査。coding-assistant/copilot URLは両集合 **0**。marketing側のAI-named URL 5件はedge AI / AI use-case / tagで、coding assistantではなかった。RC 0。
- `[command+RC]` public `particle-iot/docs` treeは **9,216 paths / truncated=false**。AI/assistant/copilot named content pathはair-quality等の語彙衝突以外なく、firmware-libraries/version source pathは確認できた。RC 0。
- `[primary source]` Web IDE/compilerがParticle library ecosystemを使う正の証拠は上記build/library docsにある。
- `[NOT OBTAINED]` Particleの **coding AI**、またはAIとcompilerが同じregistry artifact/APIを読むpublic call flowは得られなかった。

`[inference]` 質問への答えは **NO PUBLIC EVIDENCE** である。public materialではcompiler側のlibrary ecosystem利用は確認できるが、比較すべきParticle coding AI自体が確認できないため、「同じregistryを読む」という二者関係は成立を示せない。これはParticle内部に未公開AIが絶対にないというabsence claimではない。

#### 攻撃と breaker

- `[inference]` **Attacks tried:** index全件集計、nested field位置のpositive sample確認、version/library/Web IDE docs、docs/marketing sitemap、public docs tree。
- `[inference]` **What would change verdict:** Particle official page/API traceで coding AI request context と cloud compile dependency resolutionが同一versioned registry identifier/hashを読むこと、かつverified coverage/currentnessを公開すること。

### 2-2. MDPI Future Internet 18(2) 94

- `[primary source]` Babiuch & Smutný, *Benchmarking Large Language Models for Embedded Systems Programming in Microcontroller-Driven IoT Applications*, DOI https://doi.org/10.3390/fi18020094 。original URL https://www.mdpi.com/1999-5903/18/2/94 は `HTTP 403 / curl RC 0`、documented alternative https://r.jina.ai/https://www.mdpi.com/1999-5903/18/2/94 は `HTTP 200 / curl RC 0`、retrieved 2026-08-26。
- `[primary source]` Methods: **27 LLMs × 8 ESP32 scenarios**、LMArena direct chat、zero-shot。AHP weights Functional .544 / Instructions .292 / Output .107 / Creativity .057。二人のevaluatorが別々に評価後consensus。これは automated pass@k benchmarkではない。
- `[primary source]` Verified figures: simple sensor first-attempt compile **19/27** と **23/27**、Firebase first-attempt executable **9/27**（fully functional first pass 8、minor fixes後 total 15）、InfluxDB first compile **11/27**（functional first pass 6、fix後 total 11）、InfluxDB+Grafana full four-requirement single-pass **3/27**（minor fix後に4件目）。
- `[primary source]` Discussionの原文は **“The most frequent cause of compilation failure was hallucinated non-existent libraries or incorrect API usage.”** で、`08:235-236` はこれを正しく転記する。
- `[primary source]` しかしscenario 6/7について原文は **“errors ... stemmed from flawed source code functionality, improper communication function calls, and inadequate cloud configuration rules—not from inappropriate library selection, as all libraries were suitable.”** とする。Grafanaではinvalid JSONも明記する。
- `[primary source]` Limitations: ESP32のみ、specific sensor configurations、zero-shotのみでRAG/few-shot/compiler feedbackを測らない、creativity/instruction-followingは expert 1 + practitioner 1 のsubjective assessmentを含む。

`[inference]` 数値と「compilation failureの最頻原因」は `YES`。しかし `08` がそこから導く **“失敗はlogicではなくenvironmentだった”**、registryが#1 failureを**除去する**、Human rulingのreplacement groundという重みは `NO`。正確な判定は **MDPI_FIGURES_VERIFIED=PARTIAL (figures/quote YES; causal/product-mechanism interpretation NO)** である。

#### 攻撃と breaker

- `[inference]` **Attacks tried:** methods、scenario別denominator、first compile対fully functional、discussion、limitationsをfull textで分離した。
- `[inference]` **What would change verdict:** versioned registryをRAG/compilerと結合した介入群が、同一27×8または同等tasksでunmanaged zero-shot群よりlibrary/API failureとend-to-end failureを有意に下げるcontrolled study。

## 3. Attack target 3 — §G classification と未探索競合

### 3-1. 分類の破断

- **E06 `[primary source][UNDERSTATED]` Arduino Cloud AI Assistant omission.** https://blog.arduino.cc/2025/04/17/code-faster-with-the-new-arduino-ai-assistant/ （retrieved 2026-08-26）は、Cloud Editor内、project/board context、sketch生成・compile error修正、Arduino documentation/libraries/code examplesを使用すると明記する。https://blog.arduino.cc/2025/06/26/why-we-chose-claude-for-the-arduino-cloud-ai-assistant/ は sketch/board/use caseに基づくhand-picked structured documentationと継続更新を記す。`08:128` はArduinoのAIをApp Lab BYOKだけに縮めた。
- **E07 `[primary source]` Microchip missing competitor.** https://www.microchip.com/en-us/about/news-releases/products/artificial-intelligence-meets-embedded-development （direct 403、r.jina.ai alternative 200、retrieved 2026-08-26）は、free MPLAB AI Coding Assistant、Microchip-specific product/document knowledge、continuous updates、code edit/error detectionを公表する。VS Code extensionでbrowser条件は満たさず、verified matrixも未確認だが、vendor knowledge+AI+compiler ecosystem categoryの未調査competitorである。
- **E09 `[inference]` market-wide boxes overreach.** “commodity=誰でも無料”、“only Particle/Embedder”、“どの既存製品も全条件を満たさない” は、非飽和母集団 (`04:14-21`) から出せない。正しい単位は **“この調査で一次確認した集合では”** である。
- **E08 `[inference]` paid-only common overreach.** 30/monthや5/dayがどのuserに実用でないかはusage studyなしにclosed set化できない。`05` 自身がlight useでArduino Cloud/Codeyを `$0` fit としている。

### 3-2. Exact conjunction は本当に空いているか

`[inference]` **full conjunctionを満たすproductは今回も取得できなかった。** しかし、“空いている” のconfidenceは `08` より低い。

| candidate | browser text C/C++ | AI | compiler | vendor knowledge/registry | full conjunctionを破れない理由 |
|---|---|---|---|---|---|
| Arduino Cloud AI Assistant | `[primary source]` YES | `[primary source]` YES | `[primary source]` YES | `[primary source]` board/project-specific structured docs + libraries | `[NOT OBTAINED]` AIとcompilerのsame registry identity、verified board×toolchain×library matrix |
| Microchip MPLAB AI Assistant | `[primary source]` text C/C++ ecosystem | `[primary source]` YES | `[primary source]` MPLAB ecosystem | `[primary source]` Microchip product/docs knowledge | `[primary source]` VS Code extensionでbrowser conditionなし。same registry/verified matrix NO |
| Particle | `[primary source]` browser C++ | `[NOT OBTAINED]` coding AI | `[primary source]` YES | `[primary source][command+RC]` version table + 972 index、verified 10 | AIなし/未取得、自社HW、verified coverage 1.03% |
| Embedder | `[primary source]` existing repo | `[primary source]` YES | `[primary source]` user toolchain | `[primary source]` datasheet/HIL context | browser/vendor compiler/registry contractなし |

`[inference]` **What would break the surviving candidate:** ArduinoがAI contextとcompiler resolutionのsame registry/hash、およびtested version combinationsを公開すれば、`08` のfull conjunctionはほぼ直接破れる。Microchipがbrowser-hosted MPLABとversioned verified pack matrixを結べば同様である。

### 3-3. Search instrument

- `[command+RC]` Brave HTML searchを10 queryで実行。最初の3 queryはresultsを取得しArduino Cloud AI、Microchip MPLAB AI、Arm/GitHub extension等を発見。後半7 queryはHTTP 429となり、subject findingには使わなかった。
- `[primary source]` discovery後はvendor pageを直接取得し、secondary search snippetをcapability evidenceに使っていない。
- `[NOT OBTAINED]` account内product behavior、compiler/AI network trace、private registry、real compile/flashは未実施。

### この target の verdict を変えるもの

`[inference]` full conjunctionを持つ一製品の一次資料/非transactional観測なら `UNSOURCED → CONTRADICTED`。逆に、candidate universe、search saturation、all-vendor primary auditを定義し、全件のsame-registry evidenceを否定できれば `UNSOURCED → SUPPORTED`。

## 4. Attack target 4 — §H Registry requirements input

### Traceできる input

- `[static]` Platform/Board、Toolchain/Framework version、Library/version/dependency/verification、Device、Protocol/register map、Compatibility/evidence/dateは、donor duplication/gap、Particle schema、ESPHome counterexampleへtraceできる。
- `[inference]` Electrical interfaceも、golden scenarioのRS485 physical layer・4–20mA/0–10V gapから **requirement candidate** へはtraceできる。ただし具体的schema entityの形は未決定である。
- `[static]` compile pathにUI schema channelがない、Particleにthird-party reproducible verification pathがある、AI自己申告をacceptanceにしない、はsourceへtraceできる。

### Inclusion-side scope creep / category errors

- **E10 `[inference]` Backend target entity.** “Cloud専用にしない” はproduct/project routing requirementであり、registry entityである必然は調査されていない。compiler/project manifest/configとのownership比較がない。
- **E11 `[static][inference]` UI channel entity.** `02:219-223` はper-program intentにはmanifest/annotation/schema-first APIが必要で、registry metadata aloneは不足とする。`08` はdevice capabilityとproject instance channelを分けず、registryをsource of truth候補へ昇格した。
- **E12 `[static][inference]` Combination explosion = cost本体.** D6 modelはmatrix costを測っておらずhardware lab/CI matrixをmodel外とする (`07:146`)。同じ`08`の測定済modelではAIがinfraの97.97%。組合せ爆発はplausible riskだがmeasured findingではない。
- **E05 `[inference]` same registry = 唯一空いた場所.** requirement候補ではなくdifferentiation judgmentで、非網羅市場absenceに依存する。Registry design inputへ事実のように持ち込めない。

### 何があれば verdict が変わるか

- `[inference]` Backend/UIをregistryに置く判断は、`registry vs project manifest vs compile manifest vs runtime config` のreaders/writers、drift failure、cardinality/lifecycleを比較するdesign evidenceがあれば変わる。
- `[inference]` matrix explosion claimは、board×toolchain×framework×library/deviceのsupported combination数、risk-based sampling数、build minutes、hardware bench minutes、maintenance events/yearを実測すれば変わる。

## 5. Attack target 5 — §3 `PRODUCT VALUE PARTIALLY RESOLVED`

### Stronger negative case

`[inference]` evidenceは次を支持する。

1. 旧 value grounds 5本のうち4本（競合不在、free、auto UI独自、browser-only独自）は負にresolveし、industrial reachも現donorについて負にresolveした。
2. MDPIはproblem existenceを示すが、proposed solutionを試していない。さらにcomplex scenario failureはlogic/API/configにも残る。
3. Particleはmechanism existenceを示すが、`verified:true`は10/972で、Particle購入理由やverified mechanismへの需要を測っていない。
4. “誰も満たさない conjunction” はwhite-space observationであって、user value、feasibility、retention、willingness-to-pay、task improvementではない。
5. 最も近いArduino Cloud AI Assistantをfeature synthesisから落としたため、残ったwhite space自体の幅を過大に見積もった。

`[inference]` よって product-value judgementの状態は **“legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED”** がより正確である。これはNo-Go決定ではない。未測定のvalueをpositive halfとして温存しない、というevidence stateの修正である。

### Under-claim の可能性も攻撃した結果

- `[inference]` problem existenceは論文一報だけではなくEmbedAgent/IoT-SkillsBenchも方向を支持するため、**embedded AIにstructured knowledge/feedbackが有用**という一般方向は`08`が過小評価してはいない。
- `[inference]` ただしそれらもvendor registry/compiler identityを測らないので、product mechanismの立証へは上がらない。
- `[NOT OBTAINED]` target-user observational evidenceがないため、`08`がunder-claimしているproduct demandは発見できなかった。

### 何があれば verdict が変わるか

`[inference]` managed registry+AI+compiler prototypeで、unmanaged baselineに対するfirst-compile success、end-to-end task success、completion time、failure/rework、return usage、willingness-to-payをtarget usersで測れば `NOT RESOLVED` から正負いずれにも変わる。

## 6. What the synthesis got right that I could not break

1. `[static]` **Auto UI mechanism boundary.** arbitrary C++ analyzerではなくBlockly metadata、3 functional widgets、inactive appearance AIという整理は`02`と一致した。破るには別call pathかshipping rendererが必要だが得られなかった。
2. `[static]` **Donor Modbus boundary.** FC03/FC06 single holding register、missing typed/multiword model、backend外部という整理は`03`と一致した。real hardwareでは未確認だがsource claimとして破れなかった。
3. `[static]` **NF ≠ unsupported qualifier.** competitor matrixは明示的にNFをdocs内not-foundとして定義しており、主要cellではその限定を保った。
4. `[primary source]` **Particle mechanismの存在。** version/device表、verified definition、dependency version、browser compilerは再取得できた。壊れたのはcoverageの表現とmarket-only/demandへの外挿である。
5. `[primary source]` **MDPI exact figures/quote.** 27×8、19/27、23/27、9/27、11/27、3/27とmost-frequent compilation causeは再現した。壊れたのは“all failure is environment, not logic”への昇格である。
6. `[command+RC]` **D6 cost arithmetic.** fixed assumptions内の$4,042.23、$3,960、97.97%、$82.23は再計算と一致した。壊すにはassumptionを実測に置換する必要がある。
7. `[inference]` **旧value groundsの反証。** competing productsが各outcomeを持つため、unique claimとしては守れなかった。

## 7. What the synthesis is still missing

1. **Arduino Cloud AI Assistant** — `[primary source]` browser Cloud Editor内でboard/project context、structured Arduino docs/libraries、sketch generation/error fixing。同一compilerと同じproduct surfaceにいる。`08`はApp LabだけをAI欄に載せた。
2. **Microchip MPLAB AI Coding Assistant** — `[primary source]` vendor-specific continuously updated knowledge + embedded code assistant + MPLAB ecosystem。browserではないが、registry/AI/toolchain categoryの直接adjacent。
3. **CompilerとAIのsame-registry instrument** — `[NOT OBTAINED]` vendor docsの語彙比較だけでなく、registry artifact ID/hash/versionがprompt contextとdependency resolverの両方へ渡るかを観測する方法がない。
4. **Verified coverage/currentness** — `[command+RC]` Particleは10/972だった。更新頻度、last verification date、対象OS/device組合せ、reverification trigger、failure/removal policyは未取得。
5. **Library name correctnessとAPI correctnessの分離実験** — `[primary source]` MDPI quoteは二つを一文で束ねる。registryは前者を強く抑え得るが、後者をどこまで抑えるか未測定。
6. **Registry cost denominator** — `[NOT OBTAINED]` supported combinations、CI jobs、hardware benches、verification minutes、maintenance events、deprecation workload。現在の97.97% AI modelには含まれない。
7. **Japanese vendor MCU AI/toolchain category** — `[static]` 04bは13 JA queryでdirect 0だが、Microchip/Arm/semiconductor-vendor AI assistantsに相当する国内vendor/distributor passはしていない。
8. **Target-user evidence** — `[NOT OBTAINED]` failure rate、time saved、retention、willingness-to-pay、registry trust。problem existenceとproduct demandを結ぶmissing linkである。
9. **Competitor source asymmetryの明示** — `[inference]` donorはsource code、競合はmarketing/docsのみ。`08:289-301`に実利用0はあるが、§Gのconfidence labelにはこのasymmetryが反映されていない。

## 8. Errors found

`[static]` **ERRORS_FOUND=13**。一つのerrorがclaim tableの複数行に影響するため、non-SUPPORTED claim数とは一致しない。

| Error ID | finding | class |
|---|---|---|
| E01 | 972 index総数を“972 verified library”と表現。実測10/972 | factual / denominator |
| E02 | Particleの存在をverified-environment需要の存在証明に昇格 | inference overreach |
| E03 | MDPIを“logicではなくenvironment”へ一般化。scenario 6/7が反対 | factual interpretation |
| E04 | zero-shot benchmarkをregistry+compiler mechanismとHuman ruling replacement groundへ昇格 | method overread |
| E05 | non-exhaustive populationからexact conjunction/唯一空地の不存在主張 | absence overreach |
| E06 | Arduino Cloud AI Assistantをcompetitive AI rowから欠落 | omission / understatement |
| E07 | Microchip MPLAB AI Coding Assistant categoryを未探索 | population gap |
| E08 | free capsをreal-useなしでdemo/learning、sustained AIをpaid-onlyへclosed-set化 | classification overreach |
| E09 | commodity/common/uncommon “only”を非飽和母集団から市場全体へ外挿 | classification overreach |
| E10 | Backend targetを根拠なしにregistry entityへ inclusion | requirement scope creep |
| E11 | per-program UI channelとglobal registry capabilityを分離せずsource-of-truth候補へ inclusion | requirement scope creep |
| E12 | 未計測のmatrix combination costを“費用の本体”と表現 | unsupported cost claim |
| E13 | problem existence + white spaceをpositive product-value partial resolutionとして保持 | verdict hedge / state error |

## 9. Commands、verification labels、limits

- `[static][command+RC]` `nl -ba` / `sed`で`02`〜`08`全2,769 linesを読んだ。`wc -l` RC 0。
- `[API-smoke][command+RC]` Particle index/docs/version/Web IDE/sitemaps/GitHub treeをpublic HTTPで取得。採用run RC 0。最初のratio probeはtop-level objectをarrayと誤認しjq RC 5、破棄。`.libraries[].attributes.verified`へ修正したrunがRC 0。
- `[API-smoke][command+RC]` MDPI directはHTTP 403/transport RC 0、r.jina.ai alternativeはHTTP 200/RC 0。full textのmethods/results/discussion/limitationsを読んだ。
- `[API-smoke][command+RC]` Arduino official blog 3 pagesはHTTP success/RC 0。Microchip directは403、r.jina.ai alternativeは200/RC 0。
- `[command+RC]` Particle sitemap scanの最初のPython one-linerはquoting defectでRC 1、破棄。修正版でdocs 2,398 / marketing 937 URL、RC 0。
- `[command+RC]` Brave search後半のHTTP 429はrate limitingとして扱い、absence/capability findingに使用していない。
- `[command+RC]` receiving repositoryの最終`git status --short`はpre-existing `M AGENTS.md`とuntracked investigation directoryを示した。本laneが作成したのはそのdirectory内の`09_integration-falsification.md`だけである。RC 0。
- `[static]` `visual` 未実施: account/client-rendered product UIを開いていない。
- `[synthetic]` 未実施: external productやsourceをmutationしていない。
- `[API-smoke]` 実施: public docs/index/API retrievalのみ。HTTP successは機能動作を証明しない。
- `[real-fire]` 未実施: compile、flash、hardware、vendor AI call、registry/compiler network trace、user study。
- `[static]` account作成、login、payment、sales contact、personal information submissionは0件。

## 10. Conflict surface

- **CF-01 `[static][command+RC]`** `08:178` “972 verified library” 対 Particle index `verified:true=10/972`。
- **CF-02 `[primary source]`** `08:238` “失敗はlogicではなくenvironment/library” 対 Paper A scenario 6/7 “not from inappropriate library selection; all libraries were suitable”。
- **CF-03 `[primary source][static]`** `08:128` Arduino AI=App Lab only 対 Arduino official Cloud AI Assistant pages + `05`の30 interactions/month。
- **CF-04 `[static]`** `08:282` matrix explosion=cost本体 対 cited D6 modelがmatrix costをmodel外とし、measured modelの97.97%をAIとすること。
- `[command+RC]` shared worktreeにはpre-existing `M AGENTS.md`とuntracked investigation directoryがある。本laneのscope内fileと衝突する変更は観測しなかった。
- `[inference]` packetとのliteral conflict、secret exposure、donor boundary violation、uncovered decisionはなかった。
