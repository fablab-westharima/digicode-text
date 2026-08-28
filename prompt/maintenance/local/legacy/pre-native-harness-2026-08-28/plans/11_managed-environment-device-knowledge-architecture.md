# 11 — Managed Environment & Device Knowledge Architecture Design (S010)

**Status:** **DESIGN COMPLETE 2026-08-27 — Human acceptance NOT obtained** (the Human instructed close only). Kept in `active/` deliberately: the design objective is finished, but its output is a *recommendation* whose eight decisions (D-1…D-8, baton 57) belong to the Human, and nothing in it is verified. It moves to `completed/` when the Human accepts it or declares it dropped.

**Outcome in one line:** the central hypothesis is **REFUTED in its universal form**; only the narrowed proposition survives; the integration itself was falsified (36 of 71 claims) and corrected. Output owner: `investigations/2026-08-27_managed-environment-architecture/06_corrected-architecture.md` (read `05` → `06`; `04` is SUPERSEDED).
**Type:** Architecture Design Objective. **NOT a production implementation GO.**

## PRIMARY_OBJECTIVE (Human verbatim, 2026-08-27)

> **Managed Environment & Device Knowledge Architecture Design**
>
> DigiCode Classic で Board / Library / Device / Protocol 対応を増やす際に Blockly 実装コストが肥大化し、
> 実用 IoT・産業 device 対応の拡張が途中で止まった構造的問題を解消するため、DigiCode Text では対応追加を
> 「専用 Block / Generator 実装」中心から「managed knowledge / data 追加」中心へ変換できる architecture を設計する。
>
> 同時に、Board / Toolchain / Framework / Library / Dependency / Device / Sensor / Actuator /
> Electrical Interface / Protocol / Register Map / Backend / UI capability / Compatibility / Evidence /
> Verified / Custom 等を、AI・Compiler・UI が共有可能な source of truth としてどう管理するかを設計する。

## Ground this objective stands on (baton 39 declaration, required at open)

NOT the refuted P8 ranking ("Registry is what comes next"). The declared ground is:
S007-supported ⑥ AI library hallucination in embedded code generation is a real problem +
⑦ managed / verified environment mechanisms have prior implementations + the Human-supplied
structural account of Classic's per-addition cost (16.md §3, 2026-08-27 ruling).

## Prohibitions carried in

- No production implementation: no production schema, DB migration, API, UI, Compiler change,
  AI prompt implementation, device addition, Docker change, deployment. Isolated schema /
  prototype only if needed.
- Opus 5 solo forbidden; Opus 5 effort fixed at `medium`.
- AI self-report is never acceptance evidence.
- No return to whole-combination guarantees; counts are not the goal.
- Do not reduce functionality to make things "easy" (MQTT / Azure / HA / RS485 / Modbus / CAN /
  industrial sensors / local backend / Raspberry Pi server stay in view).
- Device is NOT modelled as "a library name".
- Do not assume the central hypothesis is true — design AND falsify it.
- Do not chain further harness maintenance.

## Lanes

| Lane | Packet | Type | Question |
|---|---|---|---|
| L1 | S010-L1-classic-cost | INVESTIGATION | What does adding a device actually cost in the donor, measured from source? What is already data-driven? |
| L2 | S010-L2-prior-art | INVESTIGATION | ERROR / INVALID_MEASUREMENT — sandbox had no network (`curl` RC=6, DNS). Correct fail-closed return. |
| L2b | S010-L2b-prior-art | INVESTIGATION | Prior-art entity/relation models and Verified lifecycles from primary sources (network enabled). |
| L3 | S010-L3-hypothesis-falsification | FALSIFICATION | Seven attacks on the central hypothesis, before any design rests on it. |
| L4 | (conditional) | — | Second wave only on disagreement / evidence gap / contradiction / Human impact. |
| L5 | (planned, once) | FALSIFICATION | One falsification pass over the final integrated architecture. Once only. |

## Deliverables (Human §41)

A Requirements · B Entity/Relation model · C Architecture options (2–3) · D Selected architecture ·
E Golden scenario walkthrough (inverter → RS485/Modbus RTU → ESP32 → MQTT → Azure/RPi → Web UI/HA) ·
F Custom device walkthrough (unnamed Modbus temp/humidity sensor from a PDF manual) ·
G Verified/Custom lifecycle · H AI management flow · I Compiler/AI/UI integration ("same source of
truth" made falsifiable) · J risk-based QA · K Classic vs Text effort comparison · L MVP boundary ·
M Implementation sequence · N Risks/unknowns.

Detailed report is written to `~/Downloads/` as Markdown; evidence stays under
`local/investigations/2026-08-27_managed-environment-architecture/`.
