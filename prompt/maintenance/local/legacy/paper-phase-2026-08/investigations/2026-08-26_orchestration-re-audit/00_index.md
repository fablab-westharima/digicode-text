# 00_index — Full Orchestration Re-Audit

**PRIMARY_OBJECTIVE:** これまでの DigiCode Text 主要調査・probe・findings・設計判断材料を、
Project_Template が本来想定するオーケストレーションを実際にフル活用して独立再監査し、
Opus 5 solo 由来の自己確証・測定ミス・見落としが重要判断へ混入していないことを確認する。

**Session:** S006 / 2026-08-26
**Human GO:** 調査・再監査のみ。**production 実装 GO ではない**(Human 指示 §12 / §16)。
**Plan:** `local/plans/completed/07_full-orchestration-re-audit.md`

---

## この調査の性格

**これは前 5 セッションの成果を裁く監査であり、その監査自身が同じ失敗をしうる。**

Human の問題提起は次のとおりだった:

> **Opus 5 solo を最も信用しにくい運用の一つ**と考えている。したがって、これまでの主要 findings や
> Human 裁定を、Opus 5 が自分自身で作った evidence だけを根拠にそのまま次工程へ持ち込むことを避ける。

したがって本調査は **Opus 5 solo で完結することを禁じられた**。orchestration 監査については、
**parent の結論を先に立て、それを Codex に FALSIFICATION レーンで攻撃させる**構成をとった
(自己監査が自己確証に落ちる形は case PT-2 が記録している)。結果、parent の 4 結論のうち
**3 つが部分反証された**。その訂正も含めて記録する。

## 読む順

| file | 何を持つか |
|---|---|
| `01_method-and-lanes.md` | 型ラベル定義・レーン設計・delegation packet の構成・pre-flight 実測・**やっていないこと** |
| `02_orchestration-audit.md` | 🔴 **なぜ 5 セッション連続 solo だったのか**。規則の実文・反証結果・harness 側の原因 |
| `03_donor-reverify.md` | Donor Inventory の donor source 実読による再検証(A1–A12)+ **監査が一度も記録していなかった資産 9 件** |
| `04_compiler-probe-reverify.md` | Compiler Shared/Separate probe の evidence と probe code の検証(V1–V10, F-I〜F-M)+ 隔離再現 |
| `05_editor-helper-instrument-audit.md` | 🔴 **DT-2 発生源の器材監査**(E1–E11 / H1–H14)。DT-2 の 9 件の修正が本当に欠陥を除去したか |
| `06_product-value-falsification.md` | Product Value Revalidation の反証(P1–P10)。Codex は network 遮断下で実施 |
| `07_primary-sources.md` | web 一次情報レーン(S1–S12)。**Codex が到達できなかった外部ソース** |
| `08_conclusion-and-next.md` | 🔴 **matrix 集計 / Human 裁定と evidence の分離 / Registry へ進む安全性 / 次への入力** |

## この調査が置かれている前提(16.md §3 の裁定 — 動かさない)

Human ruling は Human が変えない限り覆さない。本調査は**裁定へ入力された evidence**のみを対象とし、
誤りがあった場合は (ruling) / (original evidence) / (corrected evidence) / (impact) / (再裁定要否)
に分離して報告する。裁定そのものの変更提案は行わない。

## 成果の要約(詳細は `08_conclusion-and-next.md`)

- 検査した claim **82 件** / レーン **6 本**(Codex 5 + Claude subagent 1)
- 独立再現・一次情報確認 **14** / 反証 **9** / 部分反証・要訂正 **21** / 独立確認できず **17**
- Codex packet のうち **2 本が `ERROR / INVALID_MEASUREMENT`**(結果を作ったのが subject ではなく instrument)
- **production 変更 0**、repo 書き込み 0、donor 3 SHA は pin と一致

## 本セッションの外部成果物(git 外)

| 成果物 | 場所 | 性格 |
|---|---|---|
| Human 向け詳細報告書(1,168 行) | `~/Downloads/DigiCode_Text_Full_Orchestration_Re-Audit_報告書_2026-08-26.md` | Human の依頼で作成。**git 外**(16.md §2 baton 16 と同じ理由で、外部文書は git に入れない) |
| Artifact(閲覧用) | claude.ai artifact | 同内容の閲覧版 |

**本ディレクトリが evidence の owner である。** 外部成果物は読みやすさのための派生であり、
矛盾した場合は本ディレクトリが正しい。
