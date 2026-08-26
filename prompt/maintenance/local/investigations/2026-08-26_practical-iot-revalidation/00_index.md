# S007 — Practical IoT Competitive & DigiCode Capability Revalidation

**Objective:** DigiCode / DigiCode Text を「初心者向け Arduino IDE」や「AI 付き Web MCU Editor」としてではなく、
**企業 IoT・スマートデバイス・FabAcademy・FabLab・実用的な組み込み/IoT デバイス開発を支援する開発環境**として再評価する。
**Human GO:** 2026-08-26。**production implementation GO ではない。**
**Status:** 進行中(本ファイルは close 時に最終化される)

---

## 読む順序

| # | ファイル | 何の owner か |
|---|---|---|
| 01 | `01_method-and-lanes.md` | 型ラベル定義 · 本 objective 固有の規律 · pre-flight 実測 · レーン設計 · packet contract · 永続化義務 |
| 02 | `02_auto-web-ui-deep-dive.md` | 🔴 donor の**自動 Web UI 生成機能**の実装分析(Human 最重要指定) |
| 03 | `03_donor-iot-capability.md` | donor の実用 IoT capability(通信 / backend / board / device / Controller / AI / metadata / golden scenario) |
| 04 | `04_competitor-population.md` | 競合**母集団**と探索ログ(検索式・日付・除外理由) |
| 05 | `05_pricing-and-limits.md` | 料金 · Free plan · 上限 · 実用コスト(一次情報) |
| 06 | `06_feature-primary-sources.md` | 機能・Board・Device・industrial・拡張性・write 方式(一次情報、04/05 とは別 actor) |
| 07 | `07_falsification.md` | 「競合が既に十分強く価格も妥当で DigiCode Text は不要」の最大強度検証 |
| 08 | `08_conclusion-and-next.md` | 統合 · 成果物 A–H · Registry requirements input · 次への入力 |

**⚠️ baton 19 の適用:** 08 の結論を読む前に、その根拠となった evidence ファイル(02–07)を 1 度は開くこと。
S005 では**結論ファイルが同じ調査の evidence ファイルに否定されていた**(case DT-4)。

## 成果物(Human 指示 §26)

- **A.** DigiCode Practical IoT Capability Map
- **B.** Automatic Web UI Deep Dive
- **C.** Competitive Capability Matrix
- **D.** Pricing & Limits Matrix(**無料プランが実用になるかを別列で**)
- **E.** Cost-to-Capability Matrix
- **F.** Golden IoT Scenario Comparison(`Inverter → RS485/Modbus → ESP32 → Azure / Raspberry Pi → Web UI`)
- **G.** Product differentiation result(confirmed / candidate / false / commodity / paid-only / …)
- **H.** Registry requirements input(**Registry schema そのものは設計しない**)

## この調査がやらないこと

- production 実装(Web / Desktop / Helper / Compiler / Registry のいずれも)
- Managed Environment Registry の設計(次 Objective。本調査は input を作るだけ)
- 有料契約 · account 作成 · 外部サービスへの課金(必要なら **Human test** として提示する)
- Go / No-Go の強制的な産出(§27 — 証拠が足りなければ `PRODUCT VALUE STILL UNRESOLVED` でよい)

## DELEGATED_SCOPE_ACTIVE(wave 1、dispatch 済み)

```text
- id: S007-D1-auto-web-ui            | owner: codex D1          | scope: donor 自動 Web UI 生成の実装分析
- id: S007-D2-donor-iot-capability   | owner: codex D2          | scope: donor 実用 IoT capability
- id: S007-D3-competitor-population  | owner: claude subagent   | scope: 競合母集団の探索
parent_shadow_execution: FORBIDDEN
```
