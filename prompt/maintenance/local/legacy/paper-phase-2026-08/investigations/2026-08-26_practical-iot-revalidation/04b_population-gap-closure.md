# 04b — Population Gap Closure (Japanese market + academic layer, actually read)

- Packet: `S007-D3b-population-gap-closure`
- Lane: INVESTIGATION (web), AUTHORITY_MODE: DELEGATED
- Retrieval date for everything below unless stated otherwise: **2026-08-26**
- Scope: closes exactly the two gaps declared by the earlier discovery lane. The general English competitor
  population was **not** re-run and is not touched here.

Evidence labels used throughout: `primary` (vendor page / the paper itself / official docs, URL + retrieval
date) · `secondary` (press, blog, aggregator, or a search engine's own summary of a page I did not open) ·
`inference` (mine, stated as such) · `NOT OBTAINED` (with what was tried and how it failed).

---

## 1. Search log

All queries run 2026-08-26. "Surfaced" = what the result set actually contained, not what I hoped for.

### 1a. Japanese-language queries (Gap 1)

| # | Query (verbatim) | Lang | What it surfaced |
|---|---|---|---|
| J1 | `ブラウザ マイコン 開発環境 クラウド コンパイル ESP32` | JA | Only local Arduino-IDE setup tutorials (Qiita, personal blogs) and ESP32-as-web-server articles. **No Japanese cloud-compile service surfaced at all.** |
| J2 | `ノーコード IoT 開発 産業 設備データ 収集 中小企業 SaaS` | JA | Asteria AIoT Suite, MEEQ (ミーク), MotionBoard (ウイングアーク1st), SAS manufacturing IoT, IoT platform comparison listicles |
| J3 | `Ambient ambidata IoT データ可視化 サービス` | JA | ambidata.io (primary), 一創 explainer, JMF「スマートものづくり応援ツール」PDF, Zenn/MSR howtos |
| J4 | `obniz ブラウザ 開発 マイコン ライブラリ管理不要 クラウド` | JA | obniz Wikipedia(ja), スイッチサイエンス マガジン, paiza blog「obniz Cloud」, Qiita「arduinoとは全く違う」 |
| J5 | `SORACOM Harvest Lagoon デバイス 開発 マイコン 環境 提供` | JA | soracom.jp/services/lagoon, users.soracom.io docs (Harvest Data / Harvest Files / Lagoon 3), 2018 launch PR |
| J6 | `IchigoJam MESH Sony プログラミング教育 マイコン ブラウザ 開発環境` | JA | meshprj.com education page, MESH browser-app announcement (Chromebook 2021→Windows), MEXT 未来の学び page, IchigoJam Wikipedia + ichigojam.net/edu |
| J7 | `M5Stack UIFlow ブラウザ 開発 日本 Espressif クラウド ビルド サービス` | JA | docs.m5stack.com/ja UIFlow pages, UIFlow-Desktop-IDE, several JA blogs. **Espressif Japanese cloud-build service: nothing.** |
| J8 | `Kadecot ECHONET Lite 開発 プラットフォーム 日本 IoT` | JA | echonet.jp spec pages, GitHub ECHONET Lite emulators; Kadecot itself only via secondary mentions — project ended, know-how moved to PicoGW |
| J9 | `産業用IoTゲートウェイ PLC 代替 Modbus データ収集 クラウド 国産` | JA | KES IoT Logic (岡谷システム), CONEXIOBlackBear (コネクシオ), RT-IoTgw (マイクロネット), LMG-300 (アイネットディ), テレメータ series, イプロス/Metoree directories |
| J10 | `ファクトリーサイエンティスト 育成講座 IoT 中小企業 M5Stack` | JA | Panasonic Connect 現場 article, NTT docomo Biz Solution column, 一般社団法人ファクトリーサイエンティスト協会 course (5-day, certificate), しぶちょー技術研究所 M5Stack articles |
| J11 | `AI マイコン プログラム生成 サービス 日本 ライブラリ 検証済み 環境 提供` | JA | Generic generative-AI coding-tool listicles, Renesas e² studio / RA8P1 edge-AI, Google Gemini Code Assist. **No Japanese AI-for-MCU-codegen product surfaced.** |
| J12 | `FabLab ファブラボ マイコン 開発環境 ブラウザ 教育 プログラミング 日本 導入不要` | JA | FabLab Japan Network, 経産省 未来の教室 FabLab実証, 信州大 FabLab Nagano, fabcross. **No FabLab-specific MCU dev environment product.** |
| J13 | `SORACOM Flux デバイス 開発 ノーコード IoT アプリ 2025` | JA | soracom.jp/services/flux, SORACOM blog seminar report (2025-04-23), changelog (app templates), IT Leaders (2025-05-01 math functions), classmethod/Zenn reviews |

### 1b. English queries (Gap 2 — academic)

| # | Query | Lang | What it surfaced |
|---|---|---|---|
| E1 | `MDPI Future Internet 2026 18 2 94 LLM embedded benchmark` | EN | Identified the paper: Babiuch & Smutný, *Benchmarking LLMs for Embedded Systems Programming in Microcontroller-Driven IoT Applications*, Future Internet 18(2) 94, 2026-02-11 |
| E2 | `closed-loop LLM agent evaluation embedded firmware ScienceDirect 2025` | EN | ScienceDirect S1383762126002559; also arXiv 2509.09970 (Securing LLM-Generated Embedded Firmware) |
| E3 | `arXiv García-Carrasco closed-loop benchmark embedded coding agents ESP32 simulated` | EN | No arXiv preprint of that paper; surfaced arXiv 2506.11003 (EmbedAgent/Embedbench), 2505.24081 (ESP32-CAM benchmark), 2603.19583 (Skilled AI Agents for Embedded and IoT), Embedded Arena, SlopCodeBench |
| E4 | `automatic dashboard UI generation from firmware source code LLM 2025 2026 research` | EN | Only general UI-codegen work (2409.11667, 1D-Bench 2602.18548, AlignUI 2601.17614) and vendor blogs. **Nothing on dashboard generation from firmware source.** |

### 1c. Direct retrievals (fetch / API), 2026-08-26

| Target | Method | Outcome |
|---|---|---|
| `https://www.mdpi.com/1999-5903/18/2/94` | WebFetch, then curl with browser UA | **403** (Cloudflare) both times |
| `https://www.mdpi.com/1999-5903/18/2/94/htm` and `/pdf` | WebFetch / curl | **403** both |
| same, via `r.jina.ai` text proxy | curl | **200, 80,771 bytes — full text obtained** |
| `https://api.semanticscholar.org/graph/v1/paper/DOI:10.3390/fi18020094` | curl | 200 — full abstract, authors, GOLD OA CC-BY confirmed |
| `https://www.sciencedirect.com/science/article/pii/S1383762126002559` (+ `/pdf`, `/pdfft`) | WebFetch, curl UA, r.jina.ai | **403 / captcha wall every route — full text NOT OBTAINED** |
| `https://api.crossref.org/works?query.title=Closed-loop+evaluation…` | curl | DOI `10.1016/j.sysarc.2026.103937`, *Journal of Systems Architecture*, created 2026-07-31 |
| `https://api.openalex.org/works/doi:10.1016/j.sysarc.2026.103937` | curl | 200 — **full abstract reconstructed** from inverted index; `is_oa: true`, `hybrid`, CC-BY |
| `https://api.unpaywall.org/v2/10.1016/j.sysarc.2026.103937` | curl | is_oa true; the only OA location is the publisher PDF (the one that 403s) |
| `https://arxiv.org/abs/2508.00083` | WebFetch | 200 — full abstract |
| `https://arxiv.org/abs/2506.11003` | WebFetch | 200 — full abstract + results |
| `https://arxiv.org/abs/2603.19583` | WebFetch | 200 — full abstract |
| `https://iot.obniz.com/ja/` (301 from `obniz.com/ja/`) | WebFetch | 200 — JA marketing copy |
| `https://ambidata.io/` | WebFetch | 200 — JA service description |

**Counts with denominators:** 17 search queries run (13 JA, 4 EN); 13 direct retrievals attempted, 9 succeeded,
4 hard-blocked (all 4 blocks were MDPI or ScienceDirect bot walls, and MDPI was recovered by proxy).

---

## 2. Japanese-market candidates

Buckets: **direct** = browser-based text-code MCU development with a managed/verified environment ·
**partial** = browser-based MCU development but not text-code-to-compiled-firmware, or not managed in our sense ·
**adjacent** = sits next to the workflow (data, connectivity, visualisation) without owning code authoring ·
**substitute** = removes the need to program the MCU at all · **out** = not a competitor / discontinued.

| # | Name | Vendor | URL | Vendor's own words (JA → EN) | Bucket | Why |
|---|---|---|---|---|---|---|
| J-1 | **obniz / obniz Cloud** | obniz Inc. (obniz株式会社) | https://iot.obniz.com/ja/ (`primary`, 2026-08-26) | 「通信デバイス・ネットワーク・クラウド・データ解析のすべてを、端末のソフト開発無しで提供します」→ "We provide the communication device, network, cloud and data analytics — all with **no device-side software development**." Site also contrasts the traditional need for 「ハードウェアやファームウェア、ネットワーク、クラウドの各設計」 and calls its own approach a 「管理されたプラットフォーム」(managed platform). Developer tier: "obniz for Developers", open-source JS/TS SDKs. | **partial** | The closest Japanese thing to "managed environment, no Board/Library Manager". But it achieves that by **deleting firmware authoring**: your JS runs in the cloud and drives the device over the network. There is no text C/C++ source, no compile, no toolchain, and it only works on obniz-compatible hardware. It is the anti-thesis of "handle ordinary text code", not a browser MCU IDE. |
| J-2 | **UIFlow (Web IDE)** | M5Stack (JP ecosystem: docs.m5stack.com/ja, スイッチサイエンス distribution) | https://flow.m5stack.com/ , https://docs.m5stack.com/ja/uiflow/ (`primary` docs, 2026-08-26) | 「UIFlow はブロックを組み合わせるようにしてプログラムを作る、グラフィカルな M5Stack の開発環境で、内部では MicroPython が動いています」→ "UIFlow is a graphical M5Stack development environment where you build programs by combining blocks; MicroPython runs underneath." (`secondary`, JA blog learn.ee3.jp; consistent with the official ja docs) | **partial** | Browser IDE, vendor-curated device firmware, no Library Manager — so it *does* deliver a managed feel. But it is a **block editor over MicroPython**, which is precisely the thing this project is defined as not being, and the managed part is firmware images per board, not a verified Board·Toolchain·Framework·Library·Version matrix. Also requires flashing a UIFlow firmware first. |
| J-3 | **Ambient** | アンビエントデーター株式会社 (ambidata) | https://ambidata.io/ (`primary`, 2026-08-26) | 「Ambient は IoT データの可視化サービスです。マイコンなどから送られるセンサデータを受信し、蓄積し、可視化(グラフ化)します。」→ "Ambient is an IoT data visualisation service. It receives, stores and visualises (graphs) sensor data sent from microcontrollers and the like." Registration is 「無料」. Ships client libraries for Arduino / mbed / Raspberry Pi. | **adjacent** | Owns the *destination* of the data, not the authoring of the code. It ships a library you must still install yourself in Arduino IDE. No editor, no compiler, no environment management. It is heavily used in Japanese SME/education IoT (it appears in JMF's 「スマートものづくり応援ツール」 catalogue, `secondary`). |
| J-4 | **SORACOM** (Harvest Data / Harvest Files / Lagoon 3 / Napter / **Flux**) | 株式会社ソラコム | https://soracom.jp/services/lagoon/ , https://soracom.jp/services/flux/ , https://users.soracom.io/ja-jp/docs/ (`primary` docs, 2026-08-26) | Flux: 「ローコード IoT アプリケーションビルダー … デバイスから送信されたセンサーデータやカメラから送信された画像に対して、ルールを適用し、複数のデータソースや生成 AI を組み合わせて分析・判断し、その結果を IoT デバイスの制御に反映させる」→ "a low-code IoT application builder … applies rules to sensor data or camera images from devices, combines multiple data sources **and generative AI** to analyse and decide, and reflects the result back into device control." | **adjacent** | The dominant Japanese IoT platform, and it now has generative AI *inside the application layer* (Flux). But its entire surface is connectivity → data → dashboard → app logic. **It does not author, compile, or manage MCU firmware environments.** A digicode-text user would plausibly send data *to* SORACOM. |
| J-5 | **MEEQ** | ミーク株式会社 | https://meeq.jp/ (`secondary` — PR TIMES release + kigyolog listing, 2026-08-26; vendor page not opened) | Self-described as a 「NoCode IoT/DX Platform」 offering low-cost mobile lines and a 「コーディング不要で利用可能なデータプラットフォーム」→ "a data platform usable **without coding**", from ¥143/month. | **adjacent** | Same shape as SORACOM, smaller. Connectivity + no-code data. No code authoring. |
| J-6 | **IchigoJam** | jig.jp / IchigoJam project (福井) | https://ichigojam.net/edu/ (`primary` landing, `secondary` Wikipedia ja, 2026-08-26) | Positioned as a 「こどもパソコン」 that starts BASIC 「電源を入れてすぐに」 without needing separate development on a PC. | **adjacent** | Removes the PC toolchain by putting the interpreter on the device — a genuinely different answer to the same pain (no install, no Board Manager). But it is a fixed BASIC machine, not browser-based, not a managed cloud environment, and education-only in practice. |
| J-7 | **MESH** | ソニー / MESH Project | https://meshprj.com/jp/education.html , https://library.meshprj.com/entry/mesh-windows-browser-app (`primary`, 2026-08-26) | Browser version of the MESH app shipped for Chromebook (2021-06) then Windows, so 「アプリのインストールが不要」 → "no app installation needed". MESH itself: small 「電子タグ」 blocks programmed visually. | **substitute** | Browser-delivered and zero-install, which is the delivery property we care about — but it eliminates code entirely (tag + visual flow). Education/prototyping segment overlap with FabLab/workshop users is real; the product overlap is none. |
| J-8 | **国産 PLC/設備データ収集 IoT ゲートウェイ群** — KES IoT Logic (岡谷システム), CONEXIOBlackBear (コネクシオ), RT-IoTgw (マイクロネット), LMG-300 (アイネットディ), テレメータ series | multiple JP vendors | https://www.okaya-system.co.jp/solutions/623/ , https://conexio-iot.jp/ , https://www.mnc.co.jp/RT-IoTgw/ , https://www.i-netd.co.jp/products/gateway/lmg-300/ (`secondary` — search-result summaries of these pages; pages not individually opened) | KES IoT Logic: 「既存設備（PLC）を変更することなく、簡単に PLC データをクラウドに収集 … ノンプログラミングでデータ収集設定が可能」→ "collects PLC data to the cloud without modifying existing equipment … data-collection setup is **non-programming**." | **substitute** | This is the strongest *substitute pressure* on the "Japanese SME staff collecting equipment data" segment. For a factory that already has PLCs, the answer on the shelf today is a non-programming gateway, not an MCU you program. It does **not** compete for the sensor-you-must-build case (no PLC, custom sensor, education/FabLab). |
| J-9 | **Asteria AIoT Suite** | アステリア株式会社 | https://jp.asteria.com/news/2024112720612/ (`primary` press release, 2026-08-26) | 「AI 推論モデルの構築〜センサーデータ収集〜生成 AI 活用までをノーコードで完結」→ "completes everything from building the AI inference model, through sensor-data collection, to using generative AI — **entirely no-code**." | **substitute** | A Japanese vendor already selling "AI + IoT + no-code" as one sentence. It targets enterprise integration, not MCU firmware, and has no device-environment management — but it occupies the *words* this project might otherwise use in Japanese marketing. |
| J-10 | **Kadecot** | ソニーCSL | (project ended; successor PicoGW) (`secondary`, 2026-08-26) | — | **out** | Discontinued. ECHONET Lite home-appliance server, never an MCU development environment. Named in the packet, so recorded as checked-and-dead rather than omitted. |
| J-11 | **ファクトリー・サイエンティスト育成講座** | 一般社団法人ファクトリーサイエンティスト協会 | (Panasonic Connect / docomo Biz Solution columns, `secondary`, 2026-08-26) | 5-day course, certificate on final-day presentation; teaches SME manufacturing staff to build IoT with 「マイコンボード（千円〜1万円）とセンサー類」. | **out (as a competitor) / load-bearing as segment evidence** | Not a product. It is confirmation that the named user segment exists, is organised, and its default stack today is **hand-assembled**: an M5Stack-class board + sensors + Arduino/UIFlow + Ambient or SORACOM for the data. That assembly is exactly what a managed environment would replace. |

**Counts (denominator = 11 candidates recorded):** direct **0** · partial **2** · adjacent **4** ·
substitute **3** · out **2**.

### Espressif-related Japanese services

`NOT FOUND by my queries`, and I state that as a property of the queries: J1 and J7 were the two aimed at
this, and neither surfaced any Japanese cloud-build / managed-toolchain service for ESP32. The Japanese
ESP32 material that exists is tutorial content for the local Arduino IDE / ESP-IDF install. I did not run an
exhaustive vendor-by-vendor sweep of Japanese distributors (スイッチサイエンス, 秋月, マルツ), so this is
"my searches did not surface one", not "none exists".

---

## 3. Whether any Japanese candidate changes the picture

Stated as observation, not verdict.

**O-1 — No Japanese direct competitor surfaced (0 of 11).** Across 13 Japanese queries, nothing appeared
that edits ordinary text MCU code in a browser, compiles it server-side, and manages a verified
Board·Toolchain·Framework·Library·Version environment on the user's behalf. The Japanese market's answers
split cleanly into "don't write firmware" (obniz, MESH, gateways, Asteria) and "here's where your data goes"
(Ambient, SORACOM, MEEQ). `inference`, grounded in the log above.

**O-2 — obniz is the one candidate whose *pitch* is the same as this project's core value.** 「端末のソフト開発
無しで」 and 「管理されたプラットフォーム」 are, in Japanese, almost the sentence this project's value axis
would want. The mechanism is opposite (delete the firmware vs. manage the environment behind the firmware),
but a Japanese reader hearing "managed MCU environment" has probably already heard obniz say it. That is a
positioning observation, not a product-overlap one. `primary` + `inference`.

**O-3 — The substitute pressure on the SME-equipment-data segment is stronger in Japan than the competitor
pressure.** For the factory-floor case the incumbent is a non-programming PLC gateway (J-8), which is a
different *category* answering the same job. This matters more for that one segment than any browser IDE does.
`secondary` + `inference`.

**O-4 — The FabLab / education / Factory-Scientist segments currently run on an assembled stack, not a
product.** M5Stack (or Arduino) + Arduino IDE or UIFlow + Ambient or SORACOM, taught over five days (J-11).
Every seam in that assembly — install the IDE, add the board URL, pick the library version, get the sensor
library that matches the board — is a seam a managed environment removes. No Japanese vendor was found
selling the assembled thing as one managed product. `secondary` + `inference`.

**O-5 — "AI + IoT + no-code" is already claimed in Japanese by an enterprise vendor** (Asteria, J-9) and
generative AI is already *inside* SORACOM Flux's application layer (J-4). Neither points the AI at firmware
source or at environment correctness. `primary`.

**Conflict check against the earlier population lane:** the earlier lane surfaced obniz from its single
Japanese query. Everything here is additive to that; I found **no statement in the Japanese material that
contradicts** what the earlier lane recorded. See CONFLICT_SURFACE below.

---

## 4. The three papers, read

### Paper A — Babiuch & Smutný (2026), *Benchmarking Large Language Models for Embedded Systems Programming in Microcontroller-Driven IoT Applications*

`primary` — Future Internet **18**(2), 94, published 2026-02-11, DOI `10.3390/fi18020094`, MDPI, **Gold OA
CC-BY**. Full text obtained 2026-08-26 via `r.jina.ai` proxy after MDPI returned 403 to direct fetch and to
curl; abstract independently confirmed via Semantic Scholar API.

**What was measured.** Not pass@k. The authors used the **Analytic Hierarchy Process** with four weighted
criteria — Functional 0.544, Instructions 0.292, Output 0.107, Creativity 0.057 (Saaty 1–9 pairwise matrix;
λ_max = 4.006, CI = 0.002, CR = 0.002). Sub-criteria under Functional are explicitly *"complete code
provision, **correct libraries**, error-free compilation"*. Two independent human evaluators (a 25-year
microcontroller expert and a 15-year practitioner) scored separately, then reached consensus.

**Corpus and denominators.** **27 LLMs × 8 scenarios**, zero-shot, all through LMArena.ai chat. Hardware:
ESP32 + BME280 (env), HC-SR04 (distance), OLED (Waveshare) + HD44780 LCD. The eight scenarios, in increasing
complexity: (1) basic multi-output sensor read to Serial + OLED + local web server; (2) distance measurement
with multi-display; (3) ThingSpeak; (4) Thinger.io; (5) Beebotte; (6) Firebase Realtime DB; (7) InfluxDB;
(8) **ESP32→InfluxDB→Grafana end-to-end incl. a valid Grafana dashboard JSON**.

**Results, with denominators (all out of 27 models).**

| Scenario | First-attempt compile | Fully functional |
|---|---|---|
| Environmental sensor | **19 / 27** | — (8 failed on OLED driver libraries) |
| Distance measurement | **23 / 27** | — (4 failed, again third-party display libraries) |
| ThingSpeak | **20 / 27** | — (7 failed, missing ThingSpeak library) |
| Thinger.io | **18 / 27** compiled, though **24 / 27** picked the right library | — |
| Beebotte | 19 / 27 compiled (8 failed); 24 picked suitable libraries, 3 wrong | — |
| Firebase | **9 / 27** | 8 first-pass, 15 after minor fixes/prompts |
| InfluxDB | **11 / 27** | **6** first-pass, 11 after fixes |
| InfluxDB + Grafana (full chain) | — | **3 / 27** error-free in a single pass (claude-opus-4-1, claude-sonnet-4-5-thinking-32k, gpt-5-high); a 4th (command-a-03-2025) after one trivial fix |

Overall AHP scores ranged 0.984 → 0.539. Top: claude-sonnet-4-5-thinking-32k 0.984, claude-opus-4-1 0.961,
gemini-2.5-pro 0.918.

**Failure modes named — this is the part that matters here.**

> *"The most frequent cause of compilation failure was hallucinated non-existent libraries or incorrect API usage."*

> *"Rather than utilizing official or currently supported libraries, the LLMs frequently referenced individual, **deprecated repositories that are no longer available or functional**."*

> *"…these hallucinations were most prevalent in the integration of IoT services (e.g., ThingSpeak, Thinger.io, and Beebotte), **display drivers**, and environmental sensor configurations."*

> *"Our observation that models often generate **valid logic but invalid syntax for specific sensor libraries** is consistent with findings that general-purpose LLMs struggle to use domain-specific pre-trained knowledge effectively in embedded contexts."*

> *"…the prevalence of **invalid JSON configurations for Grafana dashboards** suggests that while models excel at imperative code (C++/Python), they are less robust at generating strictly schema-compliant configuration files without few-shot examples."*

They anchor this to Spracklen et al., USENIX Security 2025, *We Have a Package for You!*: over 2 million code
samples, package-hallucination rates up to **21.7%** for open-source models vs **5.2%** for GPT-4 (`secondary`
via this paper's citation [27]; I did not open the USENIX paper).

Also notable for a completely different reason: in scenario 1 the models were given **no guidance on layout,
styling or visualisation**, and every model invented its own web UI. Five models spontaneously chose an
**asynchronous** ESP32 web server instead of a 5-second meta-refresh page, and were scored higher on
creativity. That is direct empirical evidence about auto-generated device UI quality variance.

**Stated limitations (their words, condensed):** ESP32-only; zero-shot only, explicitly *not* capturing what
RAG / few-shot / **compiler feedback loops** would add; creativity and instruction-following judged by one
expert + one practitioner.

**Relevance here.** The paper's single most-frequent failure mode is *exactly* the failure mode a verified,
managed Board·Toolchain·Framework·Library·Version registry removes. The failure is not "the AI can't write
C++" — logic was frequently valid — it is "the AI picked a library that does not exist, is deprecated, or
whose API it got wrong." An AI that reads a curated registry as its single source of truth is attacking the
measured #1 cause of failure, and this is a peer-reviewed measurement, not a vendor claim.

### Paper B — García-Carrasco, García-Carrasco, Maté & Trujillo (2026), *Closed-loop evaluation of LLM agents for embedded software development*

`primary` for abstract and bibliographic facts; **full text NOT OBTAINED**. *Journal of Systems Architecture*,
DOI `10.1016/j.sysarc.2026.103937`, PII `S1383762126002559`, Crossref-created **2026-07-31**. Unpaywall:
`is_oa: true`, status **hybrid, CC-BY** — so it is legally open, but the only OA location is the Elsevier PDF,
and ScienceDirect returned **403 / "Are you a robot?" captcha** to WebFetch, to curl with a browser UA, to
`/pdf`, to `/pdfft`, and to the r.jina.ai proxy (all 2026-08-26). Abstract reconstructed in full from the
OpenAlex inverted index.

**What was measured.** Closed-loop, not one-shot. *"Each task provides a plain-text engineering description,
constrained workspace, and visible build-and-runtime surface. The agent must translate requirements into
implementation and self-verification steps, then iterate until the required device behavior is achieved."*

**Corpus and denominator.** **5 embedded-control tasks × 4 feedback scenarios × 7 model configurations × 3
repetitions = 420 runs.** The four feedback scenarios: one-shot generation; realistic self-verification;
CI-style red/green feedback; oracle-style detailed feedback. Models: seven GPT-family and Qwen-family
configurations.

**Substrate.** *"The implementation targets **simulated ESP32 firmware** for reproducibility."* Per a search
snippet of the methodology section (`secondary`, since I could not open the paper): ESP32 firmware runs in
**QEMU** against deterministic plant simulators, with the sensor/actuator boundary virtualised over a **UART
protocol** between firmware and simulator — *"abstracts board-specific electrical integration while preserving
the closed-loop control logic."*

**Results.** *"gpt-5.4 has the highest pass rate among evaluated configurations but **does not saturate the
benchmark**; qwen3.5-27B is the strongest observed local model; and smaller local models degrade sharply in
pass rate and search efficiency."* Per-cell numbers are in the full text I could not obtain.

**Failure modes named.** The abstract names the *premise*: *"Embedded firmware is a demanding target because
correctness depends on **closed-loop behavior under sensing, timing, and safety constraints, not only on static
source quality**."* It also states the field's own gap: *"embedded-agent evaluation remains limited and often
emphasizes one-shot synthesis or offline correctness."* Named per-run failure taxonomies: **NOT OBTAINED**.

**Relevance here.** Two things. First, it is independent academic confirmation that *compiles* ≠ *works* for
firmware, and that the feedback surface you give the agent changes the outcome — which is an argument for a
product that can actually build and verify, not just generate text. Second, and it should be said plainly:
this benchmark deliberately **virtualises the board boundary away** in order to be reproducible. The exact
layer this project claims as its value — real board / toolchain / library correctness — is the layer this
paper abstracts out. So it supports the closed-loop claim and is silent on the environment claim.

### Paper C — arXiv 2508.00083

`primary` — https://arxiv.org/abs/2508.00083, retrieved 2026-08-26. **This is not an embedded paper.** It is
Dong, Jiang, Qian, Wang, Zhang, Jin & Li, ***A Survey on Code Generation with LLM-based Agents*** (v1
2025-07-31, v2 2025-09-30).

**What it is.** A systematic survey of LLM-based code-generation agents. It defines the field by three
properties — *"1) Autonomy … 2) Expanded task scope … beyond generating code snippets to encompass the full
software development lifecycle (SDLC). 3) Enhancement of engineering practicality: a shift in research
emphasis from algorithmic innovation toward practical engineering challenges, such as **system reliability,
process management, and tool integration**."* It categorises single- and multi-agent architectures, catalogues
benchmarks, metrics and tools, and proposes long-term research directions.

**Measured / corpus / denominator / results:** **none — it is a survey, not an empirical study.** No embedded,
firmware, board or library findings.

**Relevance here.** Low as evidence, non-zero as context: it is the map of the field, and its stated framing
(the research centre of gravity moving to reliability, process and tool integration rather than raw
generation) is congruent with a product whose bet is on the environment rather than the model. It should
**not** be cited in this project as embedded-AI evidence — whatever earlier note routed it into this packet as
"the third source" was working from a title match, not the content. Flagging that explicitly, because the
recorded lesson behind this packet is precisely about locating a paper and not opening it.

---

## 5. Other 2025–2026 literature found

| Ref | Title / venue | Open? | Substance (with denominators) | Bearing on this project |
|---|---|---|---|---|
| arXiv **2506.11003** (v3, final 2026-01-23; first 2025-04-19) | **EmbedAgent / Embedbench** — *Benchmarking LLMs in Embedded System Development*, Xu, Cao, Wu, Zhong, Lu, He, Han, Cheung, Sun | **Open** (`primary`, abs page read 2026-08-26) | *"the first comprehensive benchmark for embedded system programming, circuit design, and cross-platform migration."* **126 cases, 9 electronic components, 3 hardware platforms, 10 LLMs.** DeepSeek-R1 **55.6% pass@1** with schematics, **50.0%** generating them. Cross-platform: MicroPython on RP Pico **73.8%** best; **ESP-IDF only 29.4%** best. Arduino→ESP32 migration **21.4%**. Adding **RAG + compiler feedback**: R1 → **65.1%** / 53.1%; migration 21.4% → **27.8%**. | The strongest quantitative support in this set. It measures the framework/platform gap directly (73.8% vs 29.4% on the *same* logic, different framework) and it shows **retrieval of correct domain knowledge + a compiler in the loop** measurably closes it. That is the mechanism this project proposes, evaluated by a third party. It also **contradicts** any vendor implication that a general chat model handles ESP-IDF: 29.4%. Note the honest caveat — the gains are real but partial (55.6 → 65.1), so a registry is not a fix-all. |
| arXiv **2603.19583** (2026-03-20) | **IoT-SkillsBench / skills-based agentic framework**, Li, Cheng, Ma, Zou, Yang, Cheng, Li, Chen, Chen (Duke) | **Open** (`primary`, abs read 2026-08-26) | *"Code that compiles successfully may still fail when deployed on real devices because of **timing constraints, peripheral initialization requirements, or hardware-specific behaviors**."* **3 platforms, 23 peripherals, 42 tasks, 3 difficulty levels, 3 agent configurations (no-skills / LLM-generated skills / human-expert skills), 378 hardware-validated runs.** Result: *"concise **human-expert skills with structured expert knowledge** enable near-perfect success rates across platforms."* | The most directly supportive result found. Curated, human-expert, structured hardware knowledge injected into the agent takes success from mediocre to near-perfect on **real hardware** (not simulated). That is an academic statement of this project's thesis: the curated environment/knowledge layer, not the model, is what makes embedded AI work. Note it is 2026-03 and single-group; treat as strong but not replicated. |
| arXiv **2509.09970** (2025-09) | *Securing LLM-Generated Embedded Firmware through AI Agent-Driven Validation and Patching* | Open (`secondary` — surfaced in E2, abstract not opened) | Validation-and-patching agent loop over LLM-generated firmware. | Signals that "LLM firmware output needs an automated validation layer" is an established 2025 research assumption, not a novel claim. NOT read. |
| arXiv **2505.24081** (2025-05) | *A Benchmark Reference for ESP32-CAM Module* | Open (`secondary`, not opened) | ESP32-CAM benchmark reference. | Peripheral relevance only. NOT read. |
| **Embedded Arena** — ubicomplab.github.io/embedded-arena/ | *Iterative Optimization via Hardware Feedback* | Web (`secondary`, not opened) | Leaderboard-style embedded agent evaluation with hardware feedback. | A third independent 2025–26 group converging on "hardware feedback in the loop". NOT read. |
| **SlopCodeBench**, arXiv 2603.24755 (2026) | *Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks* | Open (`secondary`, not opened) | Long-horizon agent degradation. | General, not embedded. Contextual only. |
| Spracklen et al., **USENIX Security 2025** | *We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs* | `secondary` — known only via Paper A's citation [27] | >2M code samples; hallucinated package rates **21.7%** (open-source models) vs **5.2%** (GPT-4). | The general-software number behind the embedded finding. Worth obtaining directly before it is ever quoted as this project's own evidence. NOT read. |
| **EmbedGenius** (cited as [24] by Paper A) | LLM framework for automated embedded IoT development | `secondary` via Paper A | Per Paper A: LLMs handle modular IoT tasks, *"their efficacy drops when coordinating multiple hardware-software interfaces **without RAG or compiler feedback loops**."* | Same conclusion as EmbedAgent, from a different group. NOT read directly. |

**Automatic dashboard / UI generation from source code:** query E4 surfaced **nothing** on generating a
dashboard or UI *from firmware source*. What exists is UI-code generation from designs, screenshots or
prompts (2409.11667; 1D-Bench 2602.18548; AlignUI 2601.17614) — a different input. The one empirical datum on
device-UI generation I found is inside Paper A: unprompted, 27 models produced wildly varying web UIs and only
5 chose a non-blocking async server. Labelled as `my queries did not surface it`, not as `it does not exist`.

**Hardware-abstraction registries:** no paper found that evaluates a curated board/library/toolchain registry
as such. The nearest is IoT-SkillsBench's "human-expert skills" (2603.19583), which is a curated structured
knowledge layer under a different name.

---

## 6. What I could not obtain, and why

| Target | Attempted | Failure |
|---|---|---|
| **ScienceDirect S1383762126002559 full text** (Paper B) | WebFetch; curl with Chrome UA; `/pdf`; `/pdfft`; `r.jina.ai` proxy — 5 routes, 2026-08-26 | **403 / Cloudflare "Are you a robot?" captcha on every route.** The article is **CC-BY hybrid OA** per Unpaywall — it is legally open and technically walled. Abstract recovered in full from OpenAlex; per-condition pass rates, the task list, and any failure taxonomy are **NOT OBTAINED**. No account was created and no captcha was solved, per packet constraints. |
| MDPI direct access | WebFetch ×2, curl with UA ×2 | 403 on all four; **recovered** via r.jina.ai. Recording the block because it means MDPI links in this report will 403 for anyone who retries them the same way. |
| USENIX Security 2025 package-hallucination paper | not attempted this session | Known only through Paper A's citation. The 21.7% / 5.2% figures are `secondary` and must be verified at source before this project quotes them. |
| arXiv 2509.09970, 2505.24081, 2603.24755; Embedded Arena; EmbedGenius | surfaced but not opened | Time-boxed to the packet's named three plus the two most load-bearing extras (2506.11003, 2603.19583). Listed as leads, labelled NOT read. |
| Japanese vendor pages for J-5 (MEEQ) and J-8 (the five gateway products) | not opened individually | Bucketed from search-result summaries. Labelled `secondary`. If the gateway substitute pressure becomes decision-relevant, these need a primary pass. |
| An exhaustive sweep of Japanese distributors (スイッチサイエンス / 秋月 / マルツ) for own-brand cloud dev tooling | not run | Out of the packet's named coverage list. My "no Japanese cloud-compile service" statement is therefore scoped to the 13 queries logged in §1a. |
| Japanese-language academic literature | not searched | The packet scoped Gap 2 to the three named sources plus 2025–26 field literature; CiNii / J-STAGE were not queried. Recorded as a known uncovered surface. |
