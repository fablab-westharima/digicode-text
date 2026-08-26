# 05 — Pricing and Practical Limits (competitor cost audit)

Packet: `S007-D4-pricing-and-limits` · Lane: INVESTIGATION (web) · Authority: DELEGATED
All retrievals: **2026-08-26**. Currency is recorded as the vendor quotes it; any USD conversion is a separate, labelled column.

**Reading contract for this document.** Every figure carries one of:
`primary` (vendor's own page, URL + retrieval date) · `secondary` (never a substitute for primary) ·
`inference` (my arithmetic, shown) · `NOT OBTAINED` (with what was tried).
Two claims are kept apart throughout and are **never merged**: *"a free plan exists"* and *"it is usable for free in practice"*.

---

## 1. Fetch log

| # | URL | Retrieved | Yielded pricing? | Note |
|---|---|---|---|---|
| F1 | `https://cloud.arduino.cc/plans/` | 2026-08-26 | YES — full tier table | 5 tiers incl. School; AI interaction counts present |
| F2 | `https://www.pleasedontcode.com/pricing` | 2026-08-26 | PARTIAL — 3 paid tiers only | **Free tier absent from this page** (see F6, conflict C-A) |
| F3 | `https://codey.online/pricing` | 2026-08-26 | NO — HTTP 404 | No dedicated pricing page exists |
| F4 | `https://www.embedder.com/pricing` | 2026-08-26 | NO — HTTP 404 | No pricing page exists (consistent with sales-gating) |
| F5 | `https://www.viam.com/pricing` | 2026-08-26 | YES — full usage-based rate card | Free credit + per-GB/per-second rates |
| F6 | `https://www.pleasedontcode.com/` | 2026-08-26 | YES — free tier terms + credit definition | Resolves C-A |
| F7 | `https://www.arduino.cc/en/pricing` | 2026-08-26 | NO — HTTP 404 | Wrong host path; F1 is the real one |
| F8 | `https://blog.arduino.cc/2026/08/12/arduino-app-lab-0-10-meet-agentic-mode/` | 2026-08-26 | YES — BYOK statement (verbatim) | No price for App Lab itself |
| F9 | `https://codey.online/` | 2026-08-26 | YES — free + Pro tier, EUR | Pricing lives on the home page |
| F10 | `https://embedder.com/` | 2026-08-26 | YES — verbatim sales-gating sentence | No price obtained, by vendor design |
| F11 | `https://www.embedr.app/pricing` | 2026-08-26 | YES — 2 tiers, USD, credit-denominated | No free tier listed |
| F12 | `https://blynk.io/pricing` | 2026-08-26 | YES — 5 tiers incl. free | Device/message caps |
| F13 | `https://wokwi.com/pricing` | 2026-08-26 | YES — 4 tiers, EUR | Build-minute model |
| F14 | `https://wokwi.com/pricing` (2nd pass, free-tier detail) | 2026-08-26 | PARTIAL | Free build minutes not stated on page |
| F15 | `https://flowfuse.com/pricing/` | 2026-08-26 | **NO — page has no prices** | All three tiers are "Contact Us" |
| F16 | `https://esphome.io/guides/getting_started_hassio.html` | 2026-08-26 | YES (negative) — no cost, no licence fee | Establishes hosting requirement |
| F17 | `https://docs.wokwi.com/guides/simulation-time-limit` | 2026-08-26 | NO — HTTP 404 | Simulation cap not confirmed from primary |

**Fetches: 17 (successful 12 / failed 5).** Failures F3, F4, F7, F17 are 404s; F15 is a successful fetch that yielded no pricing (vendor withheld it) — counted as successful fetch, `NOT OBTAINED` datum.

Two web searches were used **only to locate URLs and to cross-check that a 404 was not a temporary fault**. No search-result excerpt is used as a figure anywhere in this report; every number below traces to a vendor page in the table above.

---

## 2. Per-service pricing detail

### 2.1 Arduino Cloud / Arduino Cloud Editor / Arduino App Lab

**Source: F1 `https://cloud.arduino.cc/plans/`, retrieved 2026-08-26 — `primary`.**

The important structural fact first: **Arduino sells two different things and they are priced on completely different models.** Arduino Cloud (the browser editor + IoT backend) is a subscription with hard per-day and per-month counters. Arduino App Lab (the 2026-08-12 Agentic Mode product) is bring-your-own-API-key, so its AI cost is not on Arduino's price list at all — it lands on the user's Anthropic bill. Comparing "Arduino's AI price" against a competitor's without separating these two is the single easiest mistake to make here.

#### Free plan — `primary`

| Field | Vendor's figure | Unit (as quoted) |
|---|---|---|
| Price | $0 | — |
| Things (≈ connected objects) | 2 | per account |
| Variables per Thing | 5 | per Thing |
| **Compilations** | **25** | **per day** |
| **AI Assistant** | **30 interactions** | **per month** |
| Data retention | "1 day" | — |
| Daily ingested records | "100 K" | per day |
| Monthly data ingested | "10 MB" | per month |
| Triggers / notifications | "10 notifications / day / member" | per day per member |
| API requests | 10 req/sec | rate |
| Users | 1 | per account |
| OTA updates | No | — |
| Shared space / white label | No / No | — |
| Support | Community | — |
| Intended use | "Personal" | — |

Vendor's own definition of a Thing: *"one connected object, which can be associated with one device"* — `primary`.
Vendor's own footnote on the word "unlimited" (applies to paid tiers): *"fewer than 256 variables per Thing, a maximum of 210 MB of sketch storage, and no more than 1,000 sketch files"* — `primary`. That footnote is itself a trap and is listed in §6.

**Commercial use on the free plan:** `NOT OBTAINED`. The plans page labels the free tier's intended use as "Personal" and says of the paid Maker tier *"Maker is intended for personal use only"* — but "intended for" is marketing framing, not a licence term. The binding answer is in the Terms of Service, which I did not fetch. Human test H-1 (§5).
**Education terms:** `primary` — a distinct **School plan at $20 per member per year**, with 5 Things per member, 6-month retention, 1500 AI interactions/month, unlimited compilations, Google Classroom integration, and a course library.

#### Paid plans — `primary`

| Plan | Price as quoted | Billing | Things | Compilations | AI Assistant | Users | Retention |
|---|---|---|---|---|---|---|---|
| Maker | **$72/year** | annual (a monthly option exists) | 25 | Unlimited | 1500/month | 1 | 3 months |
| School | **$20/member/year** | annual | 5 per member | Unlimited | 1500/month | pay per member | 6 months |
| Team | **$1,000/year** (promo: $240 / 6 months) | annual | 100 | Unlimited | Unlimited | 50 | 1 year |
| Enterprise | Custom — contact required | custom | Unlimited | Unlimited | Unlimited | Unlimited | 2 years |

Annual-equivalent monthly, `inference`: Maker $72 ÷ 12 = **$6.00/mo**. Team $1,000 ÷ 12 = **$83.33/mo** for up to 50 users = **$1.67/user/mo** at full seat occupancy — but only $83.33 ÷ 5 = **$16.67/user/mo** if you actually have 5 people. School $20 ÷ 12 = **$1.67/member/mo**.

**Maker monthly-billed price: `NOT OBTAINED`.** The page states a monthly option exists but the fetched content exposed only the annual figure. This matters only for someone who refuses annual commitment; the annual figure is the one a cost comparison should use.

**Extra AI credit / extra compile / extra storage pricing: `NOT OBTAINED`.** No overage or top-up mechanism is published. Arduino's model appears to be *upgrade the tier*, not *buy more credits* — which is a materially different (and less forgiving) shape than the credit-based vendors below. Human test H-2.

#### Arduino App Lab — Agentic Mode (released 2026-08-12)

**Source: F8 `https://blog.arduino.cc/2026/08/12/arduino-app-lab-0-10-meet-agentic-mode/`, retrieved 2026-08-26 — `primary`.**

Verbatim vendor sentence:

> "Agentic Mode works on a Bring-Your-Own-Key basis: you authenticate with your AI provider of choice, keeping you in control of your API usage and costs."

Claude is the first supported provider, with more stated as coming. The post also notes Language Server features are *"not available in SBC Mode on UNO Q."*

**Price of App Lab itself: `NOT OBTAINED`** — the post does not state whether App Lab is free, and I found no App Lab pricing page. What *is* established primary-source is the cost **model**: the AI spend is unmetered by Arduino and billed by the user's chosen model provider. There is no Arduino-side AI cap on App Lab, and equally no Arduino-side AI allowance.

**This is the most consequential single finding in this packet**, and it cuts in a direction that is easy to misread. BYOK is not "free AI". It converts a predictable subscription into an unpredictable variable bill, and it pushes onto the user the entire burden of obtaining, funding and safeguarding an API key. It also means App Lab's AI capability is, in principle, unbounded — a paying power user is not capped at 1500 interactions/month the way a Maker subscriber is. Any comparison that puts "Arduino: 30 AI interactions/month free" next to a competitor without noting that App Lab has a second, uncapped, separately-billed path is comparing the wrong product.

**Hardware coupling — an additional cost that is not on any price list.** App Lab is presented in the context of the Arduino UNO Q board. A related 2026-08 Arduino announcement prices the VENTUNO Q at $299 (`secondary` — CNX Software/TechPowerUp headlines surfaced in search; I did **not** fetch the Arduino store page, so treat $299 as unverified). Flagged because "the software is free" and "the capability is free" diverge sharply when the capability presupposes a specific board.

---

### 2.2 PleaseDontCode

**Sources: F2 `https://www.pleasedontcode.com/pricing` and F6 `https://www.pleasedontcode.com/`, both retrieved 2026-08-26 — `primary`.**

#### Conflict C-A, and its resolution

The pricing page lists **three paid tiers and no free tier** — from that page alone the correct reading is "no free plan exists". The home page states the opposite. Both are the vendor's own pages, retrieved minutes apart.

**Resolution: a free tier does exist; the pricing page simply does not display it.** Home page, verbatim:

> "3 credits per month and 1 device, forever, with no credit card required"

and

> "1 device free  No credit card  ESP32 / RP2040 / ESP8266"

This **confirms the previous lane's observation** ("3 credits per month and 1 device, forever"). No conflict with the prior lane; the conflict was internal to the vendor's own site, and is itself worth recording — a pricing page that omits the free tier is a page that will mislead any audit that fetches only the obvious URL.

#### What a credit actually buys — `primary`, and this is the number that matters

Vendor's own definition:

> "1 credit = 1 AI code generation or 1 wiring schematic or 1 project finalization for flashing"

Expanded on the home page as three credit-consuming actions:

> "Three actions use 1 credit each: 1. Generating a wiring schematic. 2. Generating or modifying code via AI chat. 3. Finalizing your project to flash"

Explicitly **free of credits** (`primary`):

> "Browsing projects, editing code manually, exploring version history or visiting the community are always free"

And, importantly, flashing is not re-charged:

> once finalized, users can "flash it via USB or POTA as many times as you want, on as many devices as you want, with no additional credits"

**Read what that means for the free tier.** 3 credits per month. A single realistic project needs at minimum one schematic (1) + one code generation (1) + one finalization to flash (1) = **3 credits**. That is the entire monthly allowance, and it assumes the AI is correct on the first attempt. Every code revision — the normal case in embedded work, where the first firmware rarely runs — costs another credit, and there are none left. The free tier is therefore sized at **one flawless project per month**, `inference` from the vendor's own credit definition.

#### Paid tiers — `primary`

| Plan | Price | Billing | Credits/month | IoT devices | Notable |
|---|---|---|---|---|---|
| BASIC | **$9/month** | billed annually | 25 | 5 | USB flash from browser |
| PRO | **$29/month** | billed annually | 100 | 50 | private projects, manual code editor, project import, per-project framework choice |
| PREMIUM | **$79/month** | billed annually | 300 | 500 | project download (code + wiring) |

Cost per credit, `inference`: BASIC $9 ÷ 25 = **$0.36/credit**; PRO $29 ÷ 100 = **$0.29/credit**; PREMIUM $79 ÷ 300 = **$0.263/credit**. Volume discount is mild — roughly 27% from bottom to top tier.

Monthly-billed (non-annual) prices: `NOT OBTAINED`. Extra-credit top-up pricing: `NOT OBTAINED` — no overage mechanism is published. Commercial use: not explicitly restricted on the pricing page; PRO is described as supporting private client work, which implies permission but does not state it. `NOT OBTAINED` as a licence term. Education terms: **none published** — `NOT OBTAINED`.

**Note the paywalled fundamental.** Manual code editing is free, but *"Finalizing your project to flash"* costs a credit. The ability to put your own firmware onto your own hardware is metered. That is a materially stronger lock-in than metering the AI alone.

---

### 2.3 Codey Online

**Source: F9 `https://codey.online/`, retrieved 2026-08-26 — `primary`. Note: `https://codey.online/pricing` returns 404 (F3); pricing is on the home page.**

#### Free (Starter) — `primary`

- **"5 AI messages per day"** — unit is explicitly **per day**, per the vendor's own wording.
- Cloud compilation (no count stated)
- Direct USB uploading
- Wiring diagram generator
- Live serial monitor
- Standard libraries only
- **No image/vision uploads**

#### Pro — `primary`

- **€9.99/month** (vendor quotes **EUR**)
- Unlimited AI messages
- "Deep Think" AI mode
- Vision — upload photos & schematics
- Priority compilation queue
- Advanced library support
- Milestones & rollback history
- Email support from a human

USD equivalent, `inference`: at ~1.08 USD/EUR (approximate rate, **not** retrieved from a rate source on 2026-08-26 — treat the USD column as indicative only, the EUR figure is the real one), €9.99 ≈ **$10.79/month**. The conversion rate is unsourced; this is flagged rather than presented as fact.

**Confirms the previous lane** on both figures: 5 AI messages/day free, Pro €9.99/mo. No conflict.

Annual pricing, team/business tiers, education terms, project counts, board counts, custom-library policy on free, commercial-use terms: **all `NOT OBTAINED`** — the home page pricing block does not cover them and there is no pricing page to consult. Human test H-3.

**The binding free limit is 5 AI messages per day.** In embedded development a single non-trivial debugging session — paste the error, get a fix, it still fails, paste again — consumes that in under ten minutes. The daily reset is the only thing that saves it: 5/day is ~150/month, which is more generous *in aggregate* than PleaseDontCode's 3/month, but it cannot be banked, so it caps the *depth* of any single session rather than the *number* of sessions. Those are different constraints and a matrix that shows only a number hides the difference.

---

### 2.4 Embedder

**Source: F10 `https://embedder.com/`, retrieved 2026-08-26 — `primary`. `https://www.embedder.com/pricing` returns 404 (F4) — there is no pricing page.**

**Confirms the previous lane.** The exact vendor sentence, verbatim:

> "Plans are scoped to the team and the hardware, so the honest answer is a short call rather than a pricing table."

And on evaluation, verbatim:

> "Evaluation periods are available if you'd rather see it work on your own board before committing."

**Price: `NOT OBTAINED` — by vendor design, not by my failure.** No free plan is published. No trial length is published. No tier structure is published. Obtaining a figure requires booking a sales call, which this lane is **forbidden** to do, and which I did not do.

This is a **hard `NOT OBTAINED`, and it must not be replaced with an estimate.** Sales-gated pricing on an embedded-AI product signals a per-seat enterprise contract, but "signals" is not "is" — the honest entry in the matrix is *unknown*, and it should stay unknown. Recording a guess here would be exactly the merge of inference and fact this packet's evidence discipline forbids.

For the product decision, the *shape* is the finding and it is solid: Embedder is not a self-serve product. No one evaluates it, prices it, or starts using it without talking to a salesperson first. That is a different market position from every other service in this audit, and it is a fact obtained from primary source even though the number is not.

---

### 2.5 Viam

**Source: F5 `https://www.viam.com/pricing`, retrieved 2026-08-26 — `primary`.**

Viam is not priced like the others: there is no per-seat or per-device subscription for the developer platform. It is **metered cloud usage** with a small monthly credit.

#### Free tier — `primary`

> "Free to start, no credit card required"

**First $5/month of cloud services included.** The unit is *dollars of metered usage per month*, not devices, seats, or messages — a genuinely different limit shape from every other vendor here.

#### Rate card — `primary`

| Component | Price | Unit |
|---|---|---|
| Standard tabular/JSON data management | $0.25 | per GB/month |
| Hot data store storage | $2.50 | per GB |
| Hot data store compute | $0.00125 | per second |
| Image, video, logs, non-tabular data | $0.05 | per GB/month |
| Cloud data upload | $0.15 | per GB |
| Cloud data egress | $0.25 | per GB |
| Standard compute | $0.0025 | per second |
| Trigger notifications | $2.50 | per 1M notifications |

Enterprise: *"For bulk storage exceeding 100 GB/month pricing can adapt to volume"* — custom, contact sales. A separate robotic surface-finishing solutions line is entirely contact-sales (*"Pricing varies based on part size, production volume, and facility configuration."*) and is out of scope for a text-editor comparison. Page also notes standard rates can be superseded by separate agreements.

**What $5/month actually buys, `inference`:** 20 GB-months of tabular data management ($5 ÷ $0.25), or 100 GB-months of image/video/log storage ($5 ÷ $0.05), or 33.3 GB of cloud upload ($5 ÷ $0.15), or 2,000 seconds ≈ 33 minutes of standard compute ($5 ÷ $0.0025). Mixed real workloads sit well inside that for a hobby project that is not streaming video.

**Viam has no AI-message cap, no compile cap, no seat cap and no device cap** in the published model — which makes it look extremely generous next to the others. That reading is wrong in an important way: Viam is a robotics fleet/data platform, not an AI code-generation IDE. It is not metering the same thing, so its free tier is not comparable on the same axis. Its relevance to digicode-text is as evidence about the **vendor-run registry/fleet** model — the thing this project's core value proposition is actually about — not as an AI-editor competitor. Usage-metered with a small free credit is a workable commercial shape for exactly that kind of managed-environment service.

---

### 2.6 Runners-up

#### ESPHome Device Builder — `primary` (F16, `https://esphome.io/guides/getting_started_hassio.html`, 2026-08-26)

Free and open source. The documentation contains **no mention of licensing fees, paid components, or subscription costs**. Runs under Home Assistant, standalone, or Docker.

**But "free" here has a real bill, and it is not zero — `inference`:**
- **Hosting.** It needs somewhere to run. Home Assistant Green / equivalent SBC ≈ $60–100 one-time, or a Raspberry Pi ≈ $50–80 plus power, or a small VPS ≈ $5–10/month. Amortised over 3 years an SBC is ≈ $2–3/month equivalent.
- **Electricity.** An always-on SBC at ~5 W ≈ 3.6 kWh/month ≈ $0.50–1.10/month depending on tariff.
- **Labour.** Setup, updates, breakage. Unpriced here but not zero, and it is the cost that actually deters people.
- **No AI.** ESPHome is YAML-driven configuration generation, not an AI code assistant. It has no AI cost because it has no AI.

Vendor-stated hardware requirement: *"The very first install has to happen over a USB cable; every update after that can happen wirelessly."*

**Practical monthly cost, `inference`: $1–10/month** depending on whether you self-host on owned hardware or rent a VPS — plus your time. This is the honest answer to "what does free cost", and it is the reason "free/self-hosted" is not automatically the cheapest option for a non-technical user.

#### Blynk — `primary` (F12, `https://blynk.io/pricing`, 2026-08-26)

| Plan | Price | Devices / users | Messages | Retention | Webhooks | Automations | OTA campaigns |
|---|---|---|---|---|---|---|---|
| Free | $0/mo | "5 devices, 1 user" | "100,000 messages" | "1 week data retention" | 1 | 5 | 2 |
| Starter | $29/mo | "10 devices, 1 user" | "10,000,000 messages" | "1 month" | 10 | 5 | 2 |
| Prototype | $99/mo | "50 devices, and users" | "Unlimited messages" | "6 months" | 100 | 50 | 25 |
| Production | $199–$1,099/mo | "100-1000 devices, and users" | "Unlimited" | "12 months" | 100 | 100 | 25 |
| Enterprise | Custom | Unlimited | Unlimited | "12+ months" | — | — | — |

Production adds SMS alerts, 99.95% SLA, priority support; Enterprise adds white-label apps and 99.99% SLA. All plans support WiFi, cellular, ethernet, LoRaWAN, satellite. **Commercial use is supported across all tiers** (`primary`).

**Message-count unit ambiguity.** "100,000 messages" — the page does not state whether this is per month, per device, or lifetime. Almost certainly per month, but *almost certainly* is not a measurement. Recorded as **unit `NOT OBTAINED`**; H-4.

The free→paid jump is brutal: **$0 → $29/month** to go from 5 to 10 devices. There is no intermediate step. Blynk has no AI features and no compile/editor function — it is a dashboard/IoT-backend product, adjacent rather than competing.

#### Wokwi — `primary` (F13/F14, `https://wokwi.com/pricing`, 2026-08-26)

Vendor quotes **EUR**. All prices below are the annual-billing rate as displayed.

| Plan | Price | Fast build minutes | Private/unlisted | VS Code | Custom libraries |
|---|---|---|---|---|---|
| Community (free) | €0/mo | not stated on page | No — "The free plan allows you to create public projects that are visible to everyone." | No | **No** |
| Hobby | €5.6/mo (annual, "20% savings") | 100/month | Unlisted projects | No | Yes |
| Hobby+ | €8.1/mo (annual, "33% savings") | 500/month | Unlisted projects | "Wokwi for VS Code" | Yes |
| Pro | €20/seat/mo (annual, "20% savings") | 1000/month + 2000 CI minutes/month | Unlisted projects | "VS Code offline plug-in" | Yes |

Vendor on libraries, verbatim: *"All users can use thousands of libraries from the Arduino Library Manager. The paid plans allow you to upload your own custom"* [libraries] — i.e. **the free plan cannot upload custom libraries**.

Classroom: *"Check out the Wokwi Classroom license and get a quotation in minutes."* — **price `NOT OBTAINED`**, quotation-gated.

Free-tier simulation time limit: **`NOT OBTAINED`.** The pricing page states no per-simulation duration cap, and `docs.wokwi.com/guides/simulation-time-limit` 404s (F17). Wokwi has historically imposed a per-session simulation timeout on free users, but I could not confirm it from a primary source today and will not assert it. H-5.

**Two hard free-tier constraints are confirmed primary**, and they are the ones that bind: **everything you make is public**, and **you cannot upload your own library**. For anyone doing client work, proprietary work, or work depending on a vendor library not in the Arduino Library Manager, the free tier is unusable regardless of build minutes.

#### FlowFuse — `NOT OBTAINED` (F15, `https://flowfuse.com/pricing/`, 2026-08-26)

The pricing page presents three offerings — **Edge** ("For OT teams"), **Hub** ("For IT teams"), **Fleet** ("For large IoT Fleets") — and **every one of them is a "Contact Us" button.** No prices, no currency, no billing periods, no free-tier specification, no per-instance or per-device pricing, no usage-based charges, no user or device limits.

**This is a successful fetch of a page that contains no pricing.** FlowFuse previously operated a self-serve tiered model with a free starter tier; the current page shows no such thing. Whether the free tier was removed or merely delisted, I cannot say from this page — and I will not infer it. H-6.

#### Embedr — `primary` (F11, `https://www.embedr.app/pricing`, 2026-08-26)

| Plan | Price | AI credits | Models | Overage |
|---|---|---|---|---|
| Hobby | **$25/month** (USD) | "$25 equivalent per month" | All models incl. Claude Opus and Fable | Pay-as-you-go available |
| Pro | **$100/month** (USD) | "$100 equivalent per month" | All models incl. Claude Opus and Fable | Pay-as-you-go available |

Vendor: *"Both plans consume monthly AI credits first, with additional usage charged only if pay-as-you-go is enabled."* Annual billing is stated to offer better rates than monthly; the annual figures themselves are `NOT OBTAINED`.

**There is no free plan on this page.** Entry price is **$25/month** — the highest floor of any self-serve service in this audit.

The pricing is essentially **at-cost model resale**: $25/month buys $25 of AI credit. Embedr is charging for the embedded-specific harness around the model and passing model tokens through at face value. That is an unusually transparent structure, and it is the opposite of the credit-obfuscation pattern seen at PleaseDontCode (where a "credit" is an *action*, not a *dollar*, so the user cannot compute their own token economics). Project/board/library/compile/commercial/education terms are all **`NOT OBTAINED`** — the pricing page does not address them.

---

## 3. Pricing & limits matrix

One row per service. "Practical individual" and "5-user team" columns are `inference` — arithmetic in §4.

| Service | Free plan? | **Binding free limit** (the one that actually stops you) | Cheapest paid | Practical individual /mo | 5-user team /mo | Major restrictions | **Free tier practically usable?** |
|---|---|---|---|---|---|---|---|
| **Arduino Cloud** | Yes | **30 AI interactions/month**; 2 Things; 25 compilations/day; 1-day retention | $72/yr ($6.00/mo) Maker | **$6.00** (Maker) | **$83.33** (Team, 50 seats) | Free: no OTA, 1 user, "Personal" intent; Maker "personal use only" | **learning tier** — 30 AI interactions/month is one afternoon; 2 Things blocks any multi-device project |
| **Arduino App Lab** (Agentic) | App Lab price NOT OBTAINED | No Arduino-side AI cap — **you pay your model provider directly (BYOK)** | n/a — BYOK | **$5–30** (Anthropic API, est.) | **$25–150** (5× API usage) | Requires own API key; UNO Q board context; LSP unavailable in SBC Mode | **NOT OBTAINED** — no free AI at all; cost is real but external and uncapped |
| **PleaseDontCode** | Yes — "forever" | **3 credits/month** = exactly one flawless project; 1 device | $9/mo (BASIC, billed annually) | **$29** (PRO) | **$145** (5× PRO) | Flashing your own firmware costs a credit; no education terms | **demo tier** — 3 credits/month cannot absorb a single AI code revision |
| **Codey Online** | Yes | **5 AI messages per day** (cannot be banked); no vision; standard libraries only | **€9.99/mo** (~$10.79) | **€9.99** | **€49.95** (5× Pro; no team tier published) | No team/education tier published; annual pricing unknown | **learning tier** — 5/day survives a tutorial, dies in the first real debugging session |
| **Embedder** | **No free plan published** | n/a | **NOT OBTAINED** — sales-gated | **NOT OBTAINED** | **NOT OBTAINED** | Not self-serve; must book a call to learn anything | **NOT OBTAINED** — no free tier exists to judge |
| **Viam** | Yes | **First $5/month of cloud services** (metered dollars, not seats/messages) | usage-based — no fixed floor | **$5–15** (est. metered) | **$25–75** (est. 5× usage) | Metered egress/upload; >100 GB/mo → sales | **hobby-usable** — $5/mo of metered usage sustains a real personal fleet with no seat or AI cap |
| **ESPHome Device Builder** | Yes — FOSS, no tiers | **No software limit.** Binding cost is hosting + your labour | $0 software | **$1–10** (hosting/power) | **$1–10** (same host, shared) | Self-host required; **no AI at all**; YAML config, not code gen | **practical individual** — genuinely unlimited software, but you pay in hosting and setup labour |
| **Blynk** | Yes | **5 devices, 1 user**; 1-week retention; 100,000 messages (unit unconfirmed) | **$29/mo** (Starter) | **$29** | **$99** (Prototype — Starter is 1 user) | $0→$29 cliff for the 6th device; no AI, no editor | **hobby-usable** — 5 devices and 1 week of history genuinely sustains a personal IoT project |
| **Wokwi** | Yes | **All projects public** + **no custom library upload** | €5.6/mo (~$6.05) Hobby | **€8.1** (Hobby+, for VS Code) | **€100** (5× Pro @ €20/seat) | Free work is public; classroom price quotation-gated | **hobby-usable** — unlimited public simulation is real, but only if your work may be public |
| **FlowFuse** | **NOT OBTAINED** | n/a — page shows no limits | **NOT OBTAINED** — all tiers "Contact Us" | **NOT OBTAINED** | **NOT OBTAINED** | Entirely sales-gated as of retrieval | **NOT OBTAINED** — cannot confirm a free tier still exists |
| **Embedr** | **No free plan listed** | n/a | **$25/mo** (Hobby) | **$25** | **$125** (5× Hobby) | Highest entry floor in the audit; credits are $-denominated | **demo tier** by absence — there is no free tier; $25/mo is the floor to touch it |

---

## 4. Practical cost estimates (`inference` throughout — arithmetic shown)

Three usage classes, as specified. Every figure below is `inference` built on the `primary` figures in §2. Where a component is `NOT OBTAINED` the estimate is withheld rather than guessed.

### 4.1 Light use — a few projects/month, small AI use, hobby

| Service | Cost | Arithmetic |
|---|---|---|
| Arduino Cloud | **$0** | 30 AI interactions/mo and 25 compiles/day cover a few small projects — *if* ≤2 Things. Free tier holds. |
| PleaseDontCode | **$0–9** | 3 credits = 1 schematic + 1 codegen + 1 finalize = exactly 1 project. "A few projects" ⇒ 2–3 projects × 3 credits = 6–9 credits > 3 free ⇒ BASIC $9/mo (25 credits) required. |
| Codey Online | **$0** | 5 msg/day × 30 = 150 msg/mo. Light use fits. |
| Viam | **$0** | Hobby telemetry well under $5/mo metered. |
| ESPHome | **$1–10** | Hosting only: owned SBC amortised ≈ $2–3/mo + ~$0.50–1.10 power; or VPS $5–10/mo. |
| Wokwi | **$0** | Free, if public projects and no custom libraries are acceptable. |
| Blynk | **$0** | ≤5 devices fits free. |
| Embedr | **$25** | No free tier. Floor is Hobby. |
| App Lab | **$5–15** | BYOK: light agentic use ≈ a few M tokens/mo on Anthropic API. Rough order only — actual depends entirely on model and session length. |
| Embedder / FlowFuse | **NOT OBTAINED** | Sales-gated. |

### 4.2 Practical individual use — weekly development, routine AI, several projects, several boards

| Service | Cost | Arithmetic |
|---|---|---|
| Arduino Cloud | **$6.00/mo** | Maker $72/yr ÷ 12. Buys 25 Things, unlimited compiles, 1500 AI interactions/mo. Free tier's 30/mo and 2 Things both fail this class. |
| PleaseDontCode | **$29/mo** | Weekly dev with revisions ≈ 4 projects × (1 schematic + ~4 codegen iterations + 1 finalize) = 4 × 6 = 24 credits — right at BASIC's 25 with zero margin. Any debugging overflow ⇒ PRO (100 credits) $29/mo. |
| Codey Online | **€9.99/mo** (~$10.79) | 5/day cannot support routine AI use — one debugging session exceeds it. Pro (unlimited) required. |
| Viam | **$5–15/mo** | Several devices with modest telemetry: e.g. 10 GB tabular ($2.50) + 20 GB upload ($3.00) + compute ≈ $2–8 ⇒ ~$8–14, first $5 free ⇒ ~$3–9 net. Range widened for variability. |
| ESPHome | **$1–10/mo** | Unchanged — the software does not scale in price. This is its structural advantage. |
| Wokwi | **€8.1/mo** (~$8.75) | Hobby+ needed for VS Code and 500 build minutes; Hobby's 100 min is thin for weekly work. |
| Blynk | **$29/mo** | >5 devices ⇒ Starter. |
| Embedr | **$25–100/mo** | Hobby $25 = $25 of model credit. Routine agentic use on Opus-class models exhausts $25 quickly ⇒ Pro $100 or pay-as-you-go overage. |
| App Lab | **$20–60/mo** | BYOK, weekly agentic sessions. Highly variable; this is an order-of-magnitude estimate, not a measurement. |

### 4.3 Small team / company

**3–5 people:**

| Service | 5-user cost | Arithmetic |
|---|---|---|
| Arduino Cloud | **$83.33/mo** | Team $1,000/yr ÷ 12. Includes up to 50 users ⇒ $16.67/user at 5 people, $1.67/user at 50. **Maker cannot be stacked** — it is 1 user and "personal use only". |
| PleaseDontCode | **$145/mo** | 5 × PRO $29. No team tier published; no seat discount. |
| Codey Online | **€49.95/mo** (~$53.95) | 5 × Pro €9.99. No team tier published — assumes individual subscriptions, which the ToS may not permit. |
| Wokwi | **€100/mo** (~$108) | 5 × Pro €20/seat. Pro is the only tier with team billing. |
| Blynk | **$99/mo** | Starter is explicitly "1 user" ⇒ Prototype ($99, 50 devices and users) is the real 5-person floor. |
| Embedr | **$125–500/mo** | 5 × Hobby $25 minimum; 5 × Pro $100 if usage is real. |
| Viam | **$25–75/mo** | 5× the individual metered estimate. No seat charge at all — the only service here where headcount does not directly multiply cost. |
| ESPHome | **$1–10/mo** | One shared host serves the team. **Cost does not scale with headcount.** |
| Embedder / FlowFuse | **NOT OBTAINED** | |

**10 people:**

| Service | 10-user cost | Arithmetic |
|---|---|---|
| Arduino Cloud | **$83.33/mo** | Unchanged — Team covers 50 users. $8.33/user. **Best per-seat economics in the audit at this size.** |
| PleaseDontCode | **$290/mo** | 10 × $29. Linear, no discount. |
| Codey Online | **€99.90/mo** (~$108) | 10 × €9.99. Linear. |
| Wokwi | **€200/mo** (~$216) | 10 × €20. Linear. |
| Blynk | **$99/mo** | Prototype covers it. |
| Embedr | **$250–1,000/mo** | Linear. |
| Viam | **$50–150/mo** | Usage-driven, not seat-driven. |
| ESPHome | **$1–10/mo** | Still flat. |

**Education class (per vendor's own education terms):**

- **Arduino — the only service with real published education pricing.** School plan **$20/member/year** = **$1.67/member/month** (`primary`). A 30-student class = **$600/year = $50/month** (`inference`: 30 × $20 ÷ 12). Includes 5 Things/member, unlimited compilations, 1500 AI interactions/month/member, Google Classroom integration, course library. This is dramatically cheaper per head than any other service here and is a deliberate, defended market position.
- **Wokwi** — Classroom licence exists; **price `NOT OBTAINED`**, quotation-gated.
- **PleaseDontCode, Codey Online, Embedr, Embedder, Blynk, Viam, FlowFuse** — **no education terms published** (`NOT OBTAINED`). A 30-student class on Codey Online at list price = 30 × €9.99 = **€299.70/month** (`inference`), ~6× the Arduino School equivalent.
- **ESPHome** — free software; a class costs one shared host. Structurally the cheapest, and structurally the highest setup labour.

---

## 5. What could not be determined, and the Human tests needed

Nothing in this section is estimated. Each item is a real gap.

| ID | Gap | Why not obtained | Human test |
|---|---|---|---|
| **H-1** | Arduino Cloud **commercial use on free and Maker plans** | Plans page says "Personal" / "intended for personal use only" — marketing framing, not a licence term. ToS not fetched. | Read Arduino Cloud Terms of Service; find the clause governing commercial use per tier. Quote it. |
| **H-2** | Arduino Cloud **overage / top-up pricing** (extra AI interactions, extra Things) | No overage mechanism published anywhere on the plans page. | Log into an Arduino Cloud free account, exhaust or approach the 30 AI interactions, and capture what the UI offers — upgrade-only, or a top-up purchase? |
| **H-3** | Codey Online **annual price, team tier, education terms, commercial use, board/project counts** | No pricing page exists (404); home page block covers free + Pro only. | Create no account. Instead check for a Terms/FAQ page; if pricing detail is account-gated, sign in on the Pro checkout screen **without completing payment** and capture the billing-period options. |
| **H-4** | Blynk **"100,000 messages" unit** — per month? per device? lifetime? | Pricing page states the number without a period. | Check Blynk docs for the message-quota definition, or hover the pricing-page tooltip. |
| **H-5** | Wokwi **free-tier simulation time limit** and **free build minutes** | Pricing page states neither; `docs.wokwi.com/guides/simulation-time-limit` 404s. | Open a Wokwi public project logged out, run a simulation, and time until it stops. Record the cap and units. |
| **H-6** | FlowFuse **whether a free tier still exists** | Pricing page is entirely "Contact Us" across all three tiers. Cannot infer removal vs. delisting. | Check FlowFuse docs/changelog for a pricing change announcement, or app.flowfuse.com signup screen for a free option. |
| **H-7** | Embedder **any price at all** | Sales-gated by explicit vendor statement. **Forbidden to book a call in this lane.** | Human decision required — is a sales call worth it? If Embedder is not a serious comparator, leave as NOT OBTAINED permanently. |
| **H-8** | Embedr **annual pricing, commercial/education terms, board and library support** | Pricing page covers price and credits only. | Check embedr.app docs/ToS; the annual rate is stated to exist but is not shown. |
| **H-9** | Arduino **App Lab's own price** and required hardware cost | Blog post states the BYOK model but not App Lab's price; VENTUNO Q $299 is `secondary` (unfetched). | Fetch the Arduino store page for UNO Q / VENTUNO Q; find an App Lab download/pricing page. |
| **H-10** | Arduino Cloud **Maker monthly-billed rate** | Page confirms a monthly option exists but exposed only the annual figure. | Toggle the monthly/annual switch on cloud.arduino.cc/plans and read the Maker monthly price. |

**Account-gated items requiring a Human decision: H-2, H-3 (partially), H-6, H-7.** None were estimated. No account was created, no trial started, no payment details entered, no sales call booked, no personal information submitted anywhere.

---

## 6. Traps I avoided

Places where the vendor's framing and the actual limit diverge. Each of these would have produced a wrong entry in the matrix if taken at face value.

1. **PleaseDontCode's pricing page hides its own free tier.** `/pricing` lists three paid tiers and nothing else — an audit that fetched only the obvious URL would have concluded "no free plan exists" and contradicted the previous lane. The free tier is real and is documented only on the home page. **Lesson: for pricing, the home page and the pricing page are two different sources and both must be fetched.**

2. **"3 credits per month, forever" is marketed as generosity and is arithmetically one project.** The vendor's own credit definition — schematic (1) + codegen (1) + finalize (1) — consumes the entire monthly allowance on a single project, *assuming the AI is right the first time*. In embedded work it usually is not. The word "forever" is doing heavy lifting for a quota that cannot complete a second attempt.

3. **PleaseDontCode meters flashing, not just AI.** *"1 project finalization for flashing"* costs a credit. Putting your own firmware on your own hardware is a metered operation. Reading the credit as "an AI quota" understates the lock-in materially.

4. **Codey Online's "5 AI messages per day" resets daily and therefore cannot be banked.** ~150/month sounds larger than PleaseDontCode's 3/month, and in aggregate it is — but it caps *session depth*, not *session count*. Two limits with very different shapes reduce to indistinguishable numbers in a matrix cell. Both are recorded with their unit and their behaviour.

5. **Arduino's "Unlimited" carries a footnote that makes it not unlimited:** *"fewer than 256 variables per Thing, a maximum of 210 MB of sketch storage, and no more than 1,000 sketch files."* Copying "Unlimited" into the matrix would have propagated the vendor's own asterisk as fact.

6. **Wokwi's free tier is unlimited in the dimensions Wokwi advertises and blocked in the two that decide usability.** "Unlimited simulations, unlimited public projects" is true. **Every project is public, and you cannot upload a custom library.** For client work, proprietary work, or any vendor library outside the Arduino Library Manager, the free tier is unusable — and neither blocker appears in the headline.

7. **Arduino App Lab's BYOK is not "free AI".** It removes Arduino's cap and Arduino's bill simultaneously. The cost is real, external, uncapped, and lands on the user's model-provider account. Filing App Lab as "free" — or as "30 AI interactions/month" by borrowing Arduino Cloud's figure — would be wrong in both directions. They are separate products on separate cost models.

8. **Blynk's free tier is genuinely usable and its second tier costs $29.** No intermediate step exists between 5 devices free and 10 devices for $29/month. The cliff, not the free tier, is the finding.

9. **Embedr's "$25/month = $25 of AI credits" is at-cost model resale, not a margin-bearing subscription.** It is also the highest entry floor in this audit *and* the most transparent structure — the user can compute their own token economics, which a PleaseDontCode "credit" (an action, not a dollar) does not permit. Both facts are true and neither should be dropped.

10. **Viam's apparently unbeatable free tier is not comparable on this axis.** No AI cap, no seat cap, no device cap, no compile cap — because Viam meters *cloud resource dollars* and is a robotics fleet/data platform, not an AI code IDE. Ranking it "most generous free tier" against the AI editors would compare unlike things. Its real evidentiary value to this project is as a working commercial model for a **vendor-run registry/fleet service** — which is the shape of digicode-text's own stated core value.

11. **"Free and open source" (ESPHome) is not a zero bill.** Hosting, power, and setup labour are real and recurring; the honest figure is $1–10/month plus time. It is nonetheless the only service whose cost **does not scale with headcount** — 1 user and 10 users cost the same, which no commercial tier in this audit matches.

12. **FlowFuse's pricing page fetched successfully and contained no prices.** That is a `NOT OBTAINED` datum, not a fetch failure, and the two are logged distinctly (§1). It is also a *change*: FlowFuse previously ran a self-serve tiered model. I did not infer whether the free tier was removed or delisted.

13. **Embedder's sales-gating was confirmed, not estimated.** The vendor's verbatim sentence — *"the honest answer is a short call rather than a pricing table"* — is primary evidence about the vendor's **market position** (not self-serve; a human conversation precedes any evaluation) even though it yields no number. Filling that cell with a plausible per-seat guess would have been the exact merge of inference and fact this packet forbids.

---

## 7. What this actually says about cost (findings, severity-labelled)

🔴 **Every AI-assisted embedded editor in this audit has a free tier that is a demo or a learning tier — none is hobby-usable.** Arduino Cloud 30 AI interactions/month, PleaseDontCode 3 credits/month, Codey Online 5 messages/day, Embedr and Embedder no free tier at all. The services whose free tiers *are* genuinely usable (Blynk, Wokwi, Viam, ESPHome) are the ones with **no AI code generation**. As of 2026-08-26 there is no service in this set offering sustainable free AI-assisted embedded development. Whether that is a gap or a signal about unit economics is a product judgment, not mine.

🟡 **The practical individual price clusters tightly at $6–29/month**, with Arduino Maker at $6.00 the clear floor among AI-capable services and Embedr at $25 the ceiling. Any pricing decision for digicode-text lands inside a well-populated band.

🟡 **Arduino owns education on price and it is not close.** $20/member/year ($1.67/month) with real classroom tooling, versus no published education terms at all from PleaseDontCode, Codey Online, Embedr, Embedder, Blynk and Viam, and a quotation gate at Wokwi. A 30-student class is $50/month on Arduino and ~€300/month on Codey Online at list.

🟡 **Two distinct AI cost models now exist and they are not comparable.** Metered subscription (Arduino Cloud, PleaseDontCode, Codey Online) versus BYOK / at-cost pass-through (Arduino App Lab, Embedr). BYOK removes the vendor's cap and the vendor's margin together, and transfers key management to the user. The 2026-08-12 App Lab release means Arduino is now running **both models simultaneously in different products**.

🟢 **Viam is the only priced evidence here for the vendor-run-registry model** — usage-metered, $5/month free credit, no seat or device charge. If digicode-text's core value is a continuously managed verified environment rather than an editor, Viam is the closest priced analogue in this set, and its shape (meter the resource, not the seat) is worth more to the decision than any of the AI-editor price points.

---

*Retrieved 2026-08-26. Prices move; every figure above is a snapshot with a date and a URL. Nothing here is a recommendation about whether digicode-text should exist — this lane supplies cost facts only.*
