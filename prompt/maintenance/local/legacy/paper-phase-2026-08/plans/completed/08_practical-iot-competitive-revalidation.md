# 08_Practical IoT Competitive & DigiCode Capability Revalidation

**PRIMARY_OBJECTIVE:** DigiCode / DigiCode Text を「初心者向け Arduino IDE」や「AI 付き Web MCU Editor」
としてではなく、**企業 IoT・スマートデバイス・FabAcademy・FabLab・実用的な組み込み / IoT デバイス開発を
支援する開発環境**として再評価する。既存 DigiCode の実機能、特に **コードを解析して簡易 Web UI を自動生成
する機能**を実コードから詳細に分析し、それを含めた価値仮説を 2026 年現在の競合と、**機能・対応範囲・料金・
無料枠・実用コスト**まで含めて再検証する。

**Human GO:** 2026-08-26(調査・読解・比較・isolated probe・設計判断材料の作成のみ。
**production implementation GO ではない**)
**Session:** S007
**Status:** 完了・Human 受理済み(2026-08-27)・close 済み

---

## 1. この objective が禁止していたこと(Human 指示 §28、要約せず継承)

DigiCode Text production 実装 · DigiCode production 変更 · Compiler production 変更 ·
Docker production 変更 · Cloudflare 変更 · DNS 変更 · deploy · Board / Library 本番追加 ·
Web UI 機能の移植実装。必要な場合は **isolated probe のみ**許可。

さらに §22 より: **有料契約 · クレジットカード · 外部 account 作成 · 個人情報登録 · vendor への課金を行わない。**
必要な場合は Human test として提示する。

**§0 の最重要制約:** **Opus 5 solo で完結することは認めない。**
`codex tool calls = 0` で終了した場合は PRIMARY_OBJECTIVE 未達とみなす。

**§19 / §27:** Managed Environment Registry の**設計はしない**(入力のみ)。
Go/No-Go を無理に出す必要はない。

---

## 2. 実施したこと

| wave | lane | actor | 対象 | 結果 |
|---|---|---|---|---|
| pre | — | codex | donor 読解可否 · network · sandbox の実測(S006 の値を転記せず再測定) | 完了 |
| 1 | `INVESTIGATION` | codex D1 | donor の自動 Web UI 生成機能(Human 最重要指定、§10 全 6 問) | `PASS` |
| 1 | `INVESTIGATION` | codex D2 | donor の実用 IoT capability(§5–§9、A–H) | `PASS` |
| 1 | `INVESTIGATION` | subagent D3 | 競合母集団(§12 の 16 探索領域) | `PASS` |
| 2 | `INVESTIGATION` | subagent D3b | 日本市場 + 学術層(D3 自身が申告した 2 つの穴) | `PASS` |
| 2 | `INVESTIGATION` | subagent D4 | 料金・無料枠・上限・実用コスト(§13–§16) | `PASS` |
| 2 | `INVESTIGATION` | codex D5 | 競合の機能一次情報(§12/§14/§17、D4 と別 actor・別問い) | `PASS` |
| 2 | `FALSIFICATION` | codex D6 | 「競合が十分強く価格も妥当で不要」を最大強度で立証 | `PASS` |
| 3 | `FALSIFICATION` | codex D7 | **統合結論そのものへの最終反証** | `PASS` |

**lane 内訳:** `INVESTIGATION` 6 / `FALSIFICATION` 2 / `IMPLEMENTATION` 0。
**codex tool calls = 6 / subagent spawns = 3。eligible-task denominator 8 に対し 8/8 を委譲。**

---

## 3. Acceptance(Human 指示 §26 の成果物 A–H + §30 の報告項目)

| # | 成果物 | 状態 |
|---|---|---|
| A | DigiCode Practical IoT Capability Map | ✅ `08_…md` A |
| B | Automatic Web UI Deep Dive | ✅ `08_…md` B(evidence は `02_…md`) |
| C | Competitive Capability Matrix | ✅ `08_…md` C(Particle 追加、Arduino AI 訂正) |
| D | Pricing & Limits Matrix(無料枠が実用かを別列で) | ✅ `08_…md` D |
| E | Cost-to-Capability Matrix | ✅ `08_…md` E |
| F | Golden IoT Scenario Comparison | ✅ `08_…md` F |
| G | Product differentiation result | ✅ `08_…md` G(false differentiator 4 件を含む) |
| H | Registry requirements input(**schema は設計しない**) | ✅ `08_…md` H |
| — | 統合結論への独立反証 | ✅ `09_…md`(**13 件訂正、claim-trace 37 件**) |

**§27 への回答:** `PRODUCT VALUE NOT RESOLVED`(D7 訂正版。Human が 2026-08-27 に採用)。

---

## 4. 主要な結果

- **旧 value grounds 4 本が反証された** — 競合不在 / 無料であること自体 / auto Web UI の独自性 /
  browser-only の唯一性。産業 IoT リーチも現 donor については負に resolve。
- **問題の実在は第三者実測で支持された** — ただし射程は **「*コンパイル失敗* の最頻原因が
  存在しないライブラリ参照と誤 API」**まで(baton 48)。
- **auto Web UI は C++ 解析ではなく Blockly metadata → schema → widget/transport だった**(baton 50)。
- **Golden Scenario の破断点は Modbus の解釈層**(FC03/FC06 単一レジスタのみ)。
- **統合者自身が 13 件の過剰主張をし、独立反証レーンが全件を検出した**(case DT-6)。

---

## 5. 未実施(隠さない)

競合製品の**実利用 0**(Human test 11 件として提示、baton 44)· production 接触 0 · 実機 flash 0 ·
Wokwi / Blynk / RainMaker / PlatformIO の**機能**監査未実施(価格のみ取得)·
**Arduino Cloud AI Assistant の系統監査未実施**(baton 45)· 半導体ベンダ AI カテゴリ未探索(baton 46)·
対象利用者の支払意思 / 定着率 / 作業時間の観測証拠なし。

---

## 6. 参照

**evidence の owner:** `local/investigations/2026-08-26_practical-iot-revalidation/`
(`00_index.md` → **`09_integration-falsification.md`** → `08_conclusion-and-next.md` の順で読む)。
**current state:** `local/handover/16_次セッション引き継ぎ指示書.md`。
