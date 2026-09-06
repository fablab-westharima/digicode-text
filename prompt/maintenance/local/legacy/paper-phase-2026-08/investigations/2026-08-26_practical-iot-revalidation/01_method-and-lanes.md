# 01_method / lanes / packets / pre-flight — S007 Practical IoT Competitive & DigiCode Capability Revalidation

**PRIMARY_OBJECTIVE:** Practical IoT Competitive & DigiCode Capability Revalidation
**HUMAN GO:** 2026-08-26(調査 GO。**production implementation GO ではない**。lane 設計・packet 作成・
dispatch・read-only donor 調査・web 一次情報調査・isolated verification まで含み、再 GO 待ちは不要)
**Conductor:** Claude Code / Opus 5 — Harness / Integration Conductor
**`SESSION_ROLE`:** PRIMARY / **`PRIMARY_MODEL_MODE`:** T1-conserve(= delegation-default、Human 追認済み)
**Route:** A(製品方向を決める expensive-to-get-wrong 判断)

---

## 1. 型ラベル(rule 04 §Verification-type labeling)— 付いていない主張は書かない

| ラベル | 意味 |
|---|---|
| `static` | ファイルを直接読んだ(path:line を示す) |
| `grep` | パターン検索。**単独では結論の根拠にしない**(母数の証拠でしかない) |
| `command+RC` | コマンドを実行し RC を独立行で取得した |
| `git-history` | commit / diff を読んだ |
| `primary source` | vendor 公式 doc / 公式ポリシー / 公式 repo / 公式 pricing ページを fetch した。**URL と取得日を記す** |
| `secondary source` | 第三者記事・まとめ・レビュー。**一次情報の代用にしない** |
| `inference` | 上記の組み合わせからの推論。**推論であることを明記する** |
| `NOT OBTAINED` | 取得を試みたが取れなかった。**≠ 存在しない、≠ 誤り**。失敗コマンドと RC を記す |

## 2. 本 objective 固有の規律(Human 指示 §13 / §15 / §21 / §23)

- **「Free plan がある」≠「無料で実用になる」。** demo / learning / hobby-usable / practical individual /
  professional / team-company の 6 段で判定する。
- **「機能が存在する」≠「その機能を実用的に使えるコスト」。** 価格は plan 名・取得日・URL とともに記す。
- **「競合サイトに書いてある」≠「実際に動く」。** 文献調査と real-use を混同しない。実利用は現状 0。
- **「見つからない」≠「存在しない」。** 探索母集団・検索式・検索日・除外理由を記録する(case 59 / DT-4)。
- **「唯一」を安易に主張しない。** commodity / common / paid-only common / uncommon / differentiator
  candidate / cost-performance differentiator / independently demonstrated differentiator /
  not yet demonstrated へ分類する。
- **分母を書く。** 「違反 0」と「走査 0」は要約上で同じ見た目になる。
- **Human ruling と finding を分離する。** 裁定は harness が覆さない。evidence は裁定の**根拠**を検証しうる。

## 3. pre-flight 実測(rule 22 §Pre-flight check — delegate への質問ではなく transport 側から取得)

| 項目 | 実測 | 取得元 |
|---|---|---|
| MCP 接続 | `codex: codex mcp-server - ✔ Connected` | `claude mcp list` |
| delegate model | `gpt-5.6-sol` | `~/.codex/config.toml` |
| delegate effort | `high` | 同上 |
| CLI version | `codex-cli 0.149.1` | `codex --version` |
| trust level | `[projects."/Users/ohahiso"] trust_level = "trusted"` | `~/.codex/config.toml` |
| global AGENTS | `~/.codex/AGENTS.md` **不在**(上流からの希釈・上書き無し) | `ls` |
| conductor effort | 🔴 **`medium`**(transcript 6 ファイル / 1,427 レコードの 100%)。settings の top-level は `xhigh` だが `modelSettings["claude-opus-5"] = medium` が優先。**baton 43 は CONFIRMED** | session transcript の `effort` フィールド |
| AGENTS.md drift | **検出 → Human GO(裁定 A)で修正済み**。donor 禁止行が全 lane で本 objective の中核作業を禁じていた | 全文読解 |

### 3-1. Codex 側 capability probe(**S006 の値を転記せず再測定した**)

`sandbox: workspace-write` + `config.sandbox_workspace_write.network_access = true` で probe を実行:

| 項目 | S006 実測 | **S007 実測** |
|---|---|---|
| donor 読解 | 可 | **可** — `ls /Users/ohahiso/github_project/DigiCode` RC=0 |
| 外部 HTTP | **RC=6(全 10 URL で名前解決不能)** | **HTTP 200 / RC=0**(`https://www.arduino.cc/`) |
| DNS | 遮断 | **解決可** — `nslookup example.com` RC=0 |
| python3 | — | 可 RC=0 |

→ **Codex にも一次情報取得を分担させる**(Human 裁定 B)。parent 側 network も生存(HTTP 200 / RC=0)。

## 4. effort routing

**BASELINE で dispatch する。** `local/docs/routing-profile.md` は 3 target すべて
`effort_scale = NONE` / `baseline_effort = NONE`。非 `NONE` を要求すれば rule 22 §Routing decision
row 7(`effort_supported=no` → `REJECT_UNSUPPORTED_EFFORT`)。escalation は closed set の理由**かつ**
当該 task に紐づく evidence を要求するが、**該当する task は無い**。
全 packet に `EFFORT_REASON: BASELINE` / `EFFORT_EVIDENCE: NONE` を明示的に書く。
**routing profile への書き込みは行わない**(16.md §1 で always-needs-its-own-GO、baton 4)。

## 5. レーン設計

**「無意味な委譲数稼ぎ」ではなく、独立性が意味を持つ単位で切る。**
web 系を 2 系統(Codex / Claude subagent)に分けたのは、**探索戦略の分離**が
「見つからない = 存在しない」を防ぐ唯一の構造的手段だから(case 59 / DT-4)。

| id | actor | lane | wave | 対象 | なぜこの lane / actor か |
|---|---|---|---|---|---|
| **D1** | codex `gpt-5.6-sol` | `INVESTIGATION` | 1 | 🔴 **donor 自動 Web UI 生成機能の詳細分析**(Human 指示 §10 全項) | Human が最重要と名指しした資産。**source を実際に開く actor にしか答えられない**。parent は donor コードを 1 行も読んでいない |
| **D2** | codex `gpt-5.6-sol` | `INVESTIGATION` | 1 | donor の実用 IoT capability — MQTT / Azure / Wi-Fi / BLE / HTTP / WebSocket / serial / Controller / board / device / actuator / backend / AI / generated metadata | 「audit 済みだから分かっている」を崩せるのは source を読む actor だけ(§9)。S006 でも未記録資産が追加発見された |
| **D3** | claude subagent | `INVESTIGATION` (web) | 1 | 競合**母集団**の探索。§12 の 16 探索領域、検索式・検索日・除外理由の記録 | 母集団を 1 本の検索式から作らないための独立探索。**pricing とは別 actor**にして、探索の失敗が価格取得の失敗と相関しないようにする |
| **D4** | claude subagent | `INVESTIGATION` (web) | 2 | §13 pricing / free plan / paid plan / limits / AI allowance / compile allowance / practical cost | 一次情報の取得と構造化。D5 と**同じ問いを別 actor**に渡し、価格の読み違いを相互検出する |
| **D5** | codex `gpt-5.6-sol` | `INVESTIGATION` (web) | 2 | §12/§14/§17 の**機能側**一次情報 — supported boards / libraries / custom extension / write method / backend / UI generation / industrial capability | 異なる lineage の探索。**D4 の答えを見せない**(rule 22 §Anti-patterns「Showing one lane the other's answer」) |
| **D6** | codex `gpt-5.6-sol` | `FALSIFICATION` | 2 | 🔴 「競合が既に十分強く価格も妥当であり、DigiCode Text は不要である」を**最大強度で立証**しにいく | 支持ではなく破壊を成果物とする lane。§27 が「Go を必ず出す必要はない」と明示している以上、否定側を本気で走らせる意味がある |
| **D7** | codex `gpt-5.6-sol` | `FALSIFICATION` | 3 | parent の**統合結論そのもの**への最終反証 | Human 指示「最終的な結論を出す前に different-vendor / independent perspective を必ず通すこと」。case DT-4(結論が自分の evidence に否定される)への構造的対策 |

**`IMPLEMENTATION` 0 件**(production 実装禁止のため、そもそも該当タスクが無い)。

### 5-1. レーン間で答えを見せない

- D4(pricing / claude)と D5(feature / codex)は**同じ競合集合について異なる問い**を持ち、**互いの結果を見ない**。
- D6 は D1–D5 の**evidence** を受け取るが、parent の**結論**は受け取らない。
- D7 のみ parent の結論を受け取る(それが攻撃対象だから)。

### 5-2. 🔴 全レーンに課す永続化義務(case DT-5 への直接対策)

S006 では**完全に委譲された objective が disk へ何も書かなかった**。委譲が成功するほど、
solo 作業が副産物として残す永続化が失われるという構造欠陥である。
本 objective では **各レーンが自身のレポートを本ディレクトリ配下へ直接書く**ことを acceptance criteria に含める。
capsule の `REPORT:` は必ず実在するファイルパスを指す。

## 6. delegation packet contract

全 packet が `global/templates/delegation-packet-template.md` に準拠し、以下を持つ:

```text
LANE / LANE_SEQUENCE / AUTHORITY_MODE: DELEGATED / INTEGRATION_OWNER / PACKET_ID
ROUTE_TARGET / ROUTE_EFFORT / EFFORT_REASON: BASELINE / EFFORT_EVIDENCE: NONE / ROUTE_AUTHORITY_REF
AUTO_ADVANCE / CONFLICT_SURFACE: MANDATORY
DELEGATED_SCOPE_ACTIVE { id / scope / owner / parent_shadow_execution: FORBIDDEN }
# Mission / # Scope / # OUT_OF_SCOPE / # Acceptance / # STOP_IF / # KNOWN_SANDBOX_NOISE
# FINDING_HANDLING (rule 24 分類) / # RESULT_CAPSULE_FORMAT
```

### 6-1. 全 packet に verbatim で継承する禁止事項(Human 指示 §28、要約しない)

> DigiCode Text production implementation / DigiCode production 変更 / Compiler production 変更 /
> Docker production 変更 / Cloudflare 変更 / DNS 変更 / deploy / Board・Library 本番追加 /
> Web UI 機能の移植実装

加えて Human 指示 §22 より:

> 有料契約・クレジットカード・外部 account 作成・personal information 登録・vendor への課金を行わない。
> 必要な場合は「どの競合のどの画面で何を試してほしいか」を **Human test** として提示する。

### 6-2. donor の絶対境界(全 donor packet に明記)

> donor の `prompt/` ディレクトリ · `CLAUDE.md` · `AGENTS.md` · governance documents を
> **開かない・読まない・引用しない・要約しない**。検索がそれらの path に入るなら除外し、
> 除外したことをレポートに書くこと。

## 7. delegation exclusivity(rule 22 §Delegation action classification)

dispatch 後、parent は delegated scope 内の技術作業を行わない。parent が行うのは:
`HARNESS_GOVERNANCE`(objective 保持・scope 監視・worker status・evidence contract 検査・STOP 判断)·
`BOUNDED_REVIEW`(capsule と claim が名指しした exact path:line のみ)·
`ALLOWED_CLOSE_WORK`(close 後)。
`EXCEPTION_TRIGGER` を使う場合は trigger / scope / necessity を**実行前に**記録する。

## 8. 未取得・未実行(随時追記 — 本調査の限界を隠さない)

- 競合製品の**実利用**:現時点 0(Human 操作が要るものは Human test として §22 の形式で提示する)
- 実機 flash / hardware:0
- production 接触:**0(禁止事項につき意図的)**
- 各レーンの `NOT OBTAINED` は本ファイル末尾ではなく**各レポートが owner**

---

## 9. 横断矛盾監査(parent の duty — rule 22 §Roles、contradiction detection)

**実施タイミング:** wave 1–2 の 6 レーンが全て `PASS` で closed した時点。D6 dispatch の前。
**方法:** 同一対象について**別 actor が独立に書いた記述**を突き合わせる。一致は「確からしさが上がった」であって
「確定した」ではない(rule 22 §Lineage and independence — 同一 packet 作者の設計に由来する盲点は共有されうる)。

### 9-1. 突き合わせ結果

| # | 突き合わせ | 結果 | 扱い |
|---|---|---|---|
| 1 | **D4(料金)× D5(機能)** — 同じ 6 ベンダを別 actor・別問いで取得 | **矛盾 0。** Arduino App Lab の BYOK / Embedder の営業ゲート / PleaseDontCode の無料枠の存在は、両者が独立に同じ一次情報へ到達した | 相互裏づけとして採用可。ただし両者とも同じ公開 web を情報源としており、**ベンダの記述自体が誤っている可能性は両者とも検出できない** |
| 2 | **D1(donor auto UI)× D5(競合の UI 生成)** | 🔴 **PleaseDontCode の POTA は「コードの global variables を解析して dashboard widget を提案」する** — donor 実装(Blockly metadata 読み取り、C++ 非解析)より**「コード解析 → UI」に近い可能性がある** | **D6 の T2 攻撃目標に設定した。**確定には PleaseDontCode 側の技術資料が要る(D5 は product docs で Modbus/MQTT を確認できなかったと記録) |
| 3 | **D2(donor Modbus)× D5(ESPHome)** | 🔴 **ESPHome は Modbus RTU → register/coil → entity → MQTT/Home Assistant → UI を一続きで文書化**。donor の Modbus は 4 ブロック(init / slave / FC03 単一保持レジスタ / FC06 単一書き込み)のみ | **D6 の T4 攻撃目標に設定した。**Golden Scenario の field 側で**無料 OSS が donor より前に出ている**という観測 |
| 4 | **D3b(学術)× D5(managed matrix)** | **相互補強、ただし両方 absence 型。** 学術側は「LLM の組み込みコード失敗の最頻原因は存在しないライブラリの hallucination と非推奨リポジトリ参照」(実測)、D5 側は「6/6 ベンダが verified matrix を公開していない」(`not found in docs`) | D5 は「NF ≠ unsupported」を明示し、6 ベンダ分の settling evidence を列挙している(規律として正しい)。**D6 の T1 攻撃目標に設定した** — absence claim は最も弱い証拠型であり、反証レーンに detection power を試させる |
| 5 | **D3(母集団)× D4/D5(監査対象)** | **カバレッジの非対称を検出。** D4 は Wokwi / Blynk / ESPHome / Embedr / FlowFuse を価格まで取得したが、D5 は優先 6 対象を完成させるため Wokwi / Blynk / RainMaker / PlatformIO を `NOT OBTAINED` として未着手 | **限界として明記する。**「価格は分かるが機能は監査していない」製品が 4 件あり、cost-to-capability 表でその 4 件は片肺になる |
| 6 | **D3(母集団)× D3b(日本市場)** | **矛盾 0、加算のみ。** D3 の単一 JA クエリが obniz を出しており、D3b の 13 クエリはそれを含んで拡張した | — |

### 9-2. parent 自身の packet 欠陥(1 件、記録する)

🟡 **私(parent)が D3b の packet に書いた `arXiv 2508.00083` は、組み込みの論文ではなかった。**
D3b が一次情報で確認したところ *"A Survey on Code Generation with LLM-based Agents"* であり、embedded /
firmware / board / library の内容を含まない。**D3 が「位置特定した」識別子を、私が中身を開かずに次の packet へ
転記した**のが原因である。rule 22 §Anti-patterns「Blaming the delegate for the packet's defects」が名指しする形
(欠陥の起点は packet = parent)であり、case **PT-7**(識別子を開かずに運ぶな)の系統。
**当該論文は本 objective の証拠として引用しない。**

### 9-3. この監査が検出できないこと

- **同一 packet 作者(parent)の盲点。** 6 レーンは互いの答えを見ていないが、**問いの設計は全て私が書いた**。
  D6(反証)と D7(統合結論への最終反証)はこの穴を部分的にしか塞がない。
- **ベンダの公開情報そのものの誤り。** D4 と D5 が一致しても、両者の情報源はベンダの公開ページである。
- **実利用の不在。** 競合製品を実際に使ったレーンは 0 件。account を作らない制約下では原理的に埋まらない
  (Human test として提示する)。
