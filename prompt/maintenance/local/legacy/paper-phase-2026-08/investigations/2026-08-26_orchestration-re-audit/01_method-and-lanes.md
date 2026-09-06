# 01_method / lanes / packet / pre-flight / やっていないこと

---

## 1. 型ラベルの定義(rule 04 §Verification-type labeling)

本調査の主張には次のいずれかが付く。**付いていない主張は書かない。**

| ラベル | 意味 |
|---|---|
| **static** | ファイルを直接読んだ |
| **grep** | パターン検索。**単独では結論の根拠にしない**(実装を開くまでは母数の証拠でしかない) |
| **command+RC** | コマンドを実行し、RC を独立した行で取得した |
| **git-history** | commit / diff を読んだ |
| **primary source** | vendor 公式 documentation / 公式ポリシー / 公式 repo を fetch した。URL と取得日を記す |
| **inference** | 上記の組み合わせからの推論。**推論であることを明記する** |
| **NOT OBTAINED** | 取得を試みたが取れなかった。**≠ 存在しない、≠ 誤り**。失敗コマンドと RC を記す |

## 2. 結果ラベル(claim ごとの判定)

| ラベル | 意味 |
|---|---|
| `INDEPENDENTLY_REPRODUCED` | 隔離環境で command + RC を取得して再現した |
| `INDEPENDENTLY_SOURCE_VERIFIED` | 元 source を直接読んで確認した |
| `EVIDENCE_REVIEWED_OK` | 提出 evidence の内部整合・detection power を検査して問題なし |
| `NOT_INDEPENDENTLY_CHECKED` | 今回は検査していない(理由を明記) |
| `PARTIALLY_CONTRADICTED` | 一部成立、一部不成立 |
| `CONTRADICTED` / `REFUTED` | 反証された |
| `NOT_OBTAINED` | 取得できなかった |

---

## 3. レーン設計

Human が「無意味な委譲数稼ぎは禁止。役割分離に意味のある単位で委譲せよ」と指示したため、
**領域ごとではなく、独立性が意味を持つ単位**でレーンを切った。

| id | actor | lane | route | AUTHORITY_MODE | 対象 | なぜこの lane か |
|---|---|---|---|---|---|---|
| D1 | codex `gpt-5.6-sol` | `FALSIFICATION` | A | DELEGATED | orchestration 監査の反証 | **parent が自分の運用を裁く**構造なので、parent の結論を攻撃させる以外に独立性を作れない |
| D2 | codex `gpt-5.6-sol` | `VERIFICATION` | A | DELEGATED | Compiler probe evidence + probe code | 「test itself is in scope for doubt」が要る。器材そのものを疑う lane |
| D3 | codex `gpt-5.6-sol` | `VERIFICATION` | A | DELEGATED | Editor/LSP + Local Helper 器材 | **DT-2 の発生源**。修正版が本当に欠陥を除去したかは、修正を書いた actor には見えない |
| D4a | codex `gpt-5.6-sol` | `FALSIFICATION` | A | DELEGATED | Product Value Revalidation | 製品方向の結論。`FALSIFICATION` = 支持ではなく破壊を成果物とする lane |
| D4b | claude subagent | `INVESTIGATION` | A | DELEGATED | web 一次情報 | **異なる検索戦略の第 2 レーン**(Human 指示 §5-E)。結果的に必須だった(§7) |
| D5 | codex `gpt-5.6-sol` | `VERIFICATION` | A | DELEGATED | Donor Inventory の donor source 実読 | 「監査済みだから分かっている」を崩せるのは source を実際に開く actor だけ |

**lane 内訳:** `FALSIFICATION` 2 / `VERIFICATION` 3 / `INVESTIGATION` 1。
**`IMPLEMENTATION` 0 件** — rule 22 §Success criteria が「delegate が typist に戻っている兆候」と呼ぶ形にはなっていない。

**レーン間で答えを見せていない。** rule 22 §Anti-patterns「Showing one lane the other's answer before asking」を避けるため、
D4a と D4b には**同じ問いを、互いの答えを伏せて**渡した。両者は異なる証拠源から
同じ構造欠陥へ到達した(§6 / §7、`08_conclusion-and-next.md` §2-2)。

---

## 4. delegation packet の構成

全 packet が `global/templates/delegation-packet-template.md` の contract に準拠。各 packet が持つもの:

```text
LANE / LANE_SEQUENCE / AUTHORITY_MODE / INTEGRATION_OWNER / PACKET_ID
ROUTE_TARGET / ROUTE_EFFORT / EFFORT_REASON / EFFORT_EVIDENCE / ROUTE_AUTHORITY_REF
AUTO_ADVANCE / CONFLICT_SURFACE
DELEGATED_SCOPE_ACTIVE { id / scope / owner / parent_shadow_execution: FORBIDDEN }
# Mission / # Scope / # OUT_OF_SCOPE / # Acceptance / # STOP_IF / # KNOWN_SANDBOX_NOISE
# FINDING_HANDLING (rule 24 分類) / # RESULT_CAPSULE_FORMAT
```

### packet に verbatim で継承した禁止事項

Human 指示 §12 の production 変更禁止を、要約せずそのまま各 packet の `OUT_OF_SCOPE` に置いた
(template contract rule 2「Critical stop conditions are inherited **verbatim**, never AI-summarized」):

> DigiCode Text production 実装 / DigiCode production 変更 / Compiler production 変更 /
> Docker production 変更 / Cloudflare / DNS / deploy / Board・Library 本番追加

### donor packet の絶対境界

D5 には次を明記した。Codex は遵守を明示的に報告している。

> **Do NOT open, read, quote or summarise anything under the donor's `prompt/` directory,
> its CLAUDE.md, or its governance docs.** If your search would enter those paths, exclude them and say so.

加えて `STOP_IF` に「秘密値を返信に含めそうになったら STOP、type と location-class だけに redact せよ」を置いた。
**返却された全レポートに秘密値・個人情報・private URL は含まれていない。**

---

## 5. pre-flight 実測(rule 22 §Pre-flight check)

**delegate の自己申告ではなく、transport 自身の設定・ログから取得した**(pre-flight 6 / case 93 の教訓)。

| 項目 | 実測 |
|---|---|
| MCP 接続 | `claude mcp list` → `codex: codex mcp-server - ✔ Connected` |
| delegate の model | `~/.codex/config.toml` → `model = "gpt-5.6-sol"` |
| delegate の effort | `~/.codex/config.toml` → `model_reasoning_effort = "high"` |
| CLI version | `codex-cli 0.149.1` |
| trust level | `[projects."/Users/ohahiso"] trust_level = "trusted"`(digicode-text を包含) |
| 直近の Codex 活動 | `~/.codex/sessions` の最終ファイルは **2026-08-20** |

最後の行が「digicode-text では Codex が一度も使われていない」ことの**独立した裏付け**になっている。

---

## 6. effort routing

**BASELINE で実行した。**

`local/docs/routing-profile.md` は全 3 target が `effort_scale = NONE / baseline_effort = NONE`。
非 `NONE` の effort を要求すれば rule 22 §Routing decision row 7(`effort_supported=no →
REJECT_UNSUPPORTED_EFFORT`)が返る。escalation は closed set の理由**かつ**当該 task に紐づく
evidence を要求するが、**今回 escalation に該当する task は無かった**。理由も evidence も無いのに
escalation を要求することは規則違反である。

全 packet に `EFFORT_REASON: BASELINE` / `EFFORT_EVIDENCE: NONE` を**明示的に**書いた
(rule 22:835「made optional, "the author forgot" and "the author decided baseline" become the same
record, and the second is the one the audit needs」)。

### baton 4 が要求していた測定 — 完了

transport 自身から取得(delegate への質問ではない):

```console
$ codex -c model_reasoning_effort=bogus exec --skip-git-repo-check "hi"
OpenAI Codex v0.149.1
model: gpt-5.6-sol
reasoning effort: bogus
ERROR: {
  "error": {
    "type": "invalid_request_error",
    "message": "[ReasoningEffortParam] [reasoning.effort] [invalid_enum_value] Invalid value: 'bogus'.
                Supported values are: 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', and 'max'.",
  },
  "status": 400
}
```

したがって `SIX-LANE-DELEGATE` の実測値:

- `effort_scale = none | minimal | low | medium | high | xhigh | max`(昇順)
- `baseline_effort = high`
- holder = codex-cli 0.149.1 · `gpt-5.6-sol`

🔴 **副次的な発見:CLI 側は `bogus` を検証せず素通しし、API 側が 400 で拒否した。つまり CLI は enum を検証しない。**
これは rule 22 の `INVARIANT_KEY | transport_accepted`(「transport が値を受け入れたことは capability の証明で
あって policy 準拠の証明ではない」)の実例である。**transport capability probe を routing validator の
代わりに使うと、意味のない green が出る。**

**profile への書き込みは行っていない。** 16.md §1 が「writing a model / effort / target mapping into the
routing profile」を「always needs its own GO」に列挙しているため。→ Human 裁定事項。

---

## 7. delegation exclusivity の遵守(rule 22 §Delegation action classification)

dispatch 後、delegated scope 内の技術作業は行っていない。parent が実行したのは以下のみ。

| 行為 | 分類 | 根拠 |
|---|---|---|
| packet 構築のための事前 inventory | dispatch 前 = exclusivity 対象外 | — |
| pre-flight(mcp list / codex config / effort 測定) | `HARNESS_GOVERNANCE` | pre-flight は parent の duty |
| `08_conclusion-and-next.md:42-52` 等 3 箇所の実読 | `BOUNDED_REVIEW` | D4a が claim で参照した exact path:line のみ |
| `usage-report.sh` / `git status` の実行 | `HARNESS_GOVERNANCE` + `ALLOWED_CLOSE_WORK` | evidence contract 検証と report の duty |

`EXCEPTION_TRIGGER` は一度も使用していない(5 triggers のいずれも発火しなかった)。
`SHADOW_EXECUTION` は 0 件。

---

## 8. 🔴 やっていないこと(本調査の限界)

**この監査も real-fire ではない部分が多い。隠さず列挙する。**

### 8-1. 実行できなかった rung

| rung | 状況 |
|---|---|
| 外部一次情報の Codex 側再取得 | **不可** — DNS 遮断、10 URL すべて `curl RC=6: Could not resolve host` |
| Helper / browser probe の再実行 | **不可** — `listen EPERM 0.0.0.0:8443`、ports 8096-8099/8442/8443/8771 に listener 0 |
| `pio pkg install` によるレジストリ確認 | **不可** — `HTTPClientError`。V8 は version 不在と通信不能を分離できず |
| esp-clangd による 5 ファイル再検査 | **不可** — ESP32 core が 3.3.8 → 3.3.11 へ更新され path 消失、`Arduino.h not found` RC=3 |
| installer 実 build / 署名 / notarization | 未実行 |
| 実機 flash / hardware | 未実行 |
| Windows / Linux 実行 | 未実行 |
| 競合製品の実利用 | 未実行(objective 範囲外) |
| production 接触 | **禁止事項につき未実行**(意図的) |
| visual rung | 未実行 |

### 8-2. 構造的な限界

- **Codex の各 packet は互いの答えを見ていない(意図的)が、同じ packet 作者(parent)が問いを設計している。**
  parent の盲点は packet の盲点になりうる。D4b にだけ異なる検索戦略を与えることで部分的に緩和した。
- **S002 / S003 の raw artifact が保存されていない**ため、歴史的な測定値と最終器材版の結合は
  いずれのレーンでも証明できなかった。これは今回の限界ではなく**元の測定の限界**である。
- A11(security)の donor 側 untracked hook は、packet の絶対境界により未読。
- 「独立確認できず」17 件は「誤り」ではない。**両者を混同していない**が、読む側も混同しないこと。

### 8-3. case-filing protocol の自己適用(judgment Part 1)

「case を起票したら、その教訓を**今から実行する検証**にも適用せよ」を本調査に適用した:

| 適用した教訓 | どう適用したか | 結果 |
|---|---|---|
| **DT-2**(器材欠陥は方向を持つ) | 各 packet に「誤差方向を報告せよ」を明示要求 | **双方向の誤差**という新発見。DT-2 当初の一様性は消えていた |
| **case 59**(「存在しない」を狭い探索から導く) | D4b に「何も見つからなければ実行した検索式を明記せよ」を要求 | **PleaseDontCode を発見** |
| **PT-2**(他 actor の criteria を厳格と称賛したが全て static だった) | 自己監査の結論を先に立てて Codex に攻撃させた | **3/4 が部分反証** |
