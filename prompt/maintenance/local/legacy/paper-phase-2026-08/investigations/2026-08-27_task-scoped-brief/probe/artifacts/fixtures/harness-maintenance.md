# BRIEF v2 — MEASUREMENT-ONLY PROTOTYPE OUTPUT

> This brief is derived from repository owners and is not current authority.
> If it conflicts with a repository owner, the repository owner is correct.
> Truth not inlined still exists; INDEX carries every item ID.

## L0 CORE
BRIEF-SCHEMA: probe-v1
REPO: digicode-text
BRANCH: main
HEAD: 139c202dcda542d103752744737651c21ce20a1f
SHORT_HEAD: 139c202dcda5
DIRTY: yes
GENERATED_AT_UTC: 2026-08-26T18:44:23.448565+00:00
GEN: S008-close
GEN_ROUTER: S008-close
GEN_BATONS: S008-close
GEN_EVIDENCE_MAP: S008-close
STATUS: ROUTED
ROUTE: HARNESS
ROUTE_REASON: deterministic keyword match: HARNESS

### OWNER MANIFEST
- router: prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md; holds current position, baton stubs, settled rulings; unconditional
- batons: prompt/maintenance/local/handover/batons.md; holds baton bodies/grounds; trigger = selected baton
- evidence-map: prompt/maintenance/local/handover/evidence-map.md; holds provenance/read order/loop/feedback; trigger = evidence provenance

## 4. Strategic axis (anchor for judgment) 🔴

**Purpose of all work:** develop **digicode-text** — a Web application for microcontroller
development that handles ordinary **text code**, not a block editor — by selectively porting
technical assets from **DigiCode** as a donor repository.

**The Web version is the primary product, and it is not the only one** (2026-08-26 user ruling). A
Desktop version is formally in view, so the Frontend is not to be fixed into a shape that only a
browser can host; the shared-Frontend / adapter direction and its boundaries live in `16.md` §3.

```
DigiCode (donor, READ ONLY)  ──selective port, evidence-recorded──▶  digicode-text
   ├ what may travel:  product/technical assets the user approves, one at a time,
   │                   each with donor repo + donor commit SHA + donor path + import
   │                   date + imported asset + excluded legacy governance recorded
   └ what never travels: the donor's CLAUDE.md, rules, handover, sessions, judgment-
                         mistakes history, orchestration bodies, and its git history
                         itself (no merge / subtree / rewrite / fork). 16.md §3, settled.
```

**AI is a primary feature of digicode-text and ships from the start** (2026-08-26 user ruling). It is
not provisional and is not deferred to the donor audit: the audit investigates *how* the donor
implements AI, its API-key handling and its dictionary / context design — never *whether* AI belongs
in the product. A template's generic provisional value never outranks this project's product ruling.

**AI is the primary feature; LSP is advanced editing support, not a condition of the product**
(2026-08-26 user ruling). A build without LSP is **never** to be described as a reduced or
incomplete version. The grounds, and what the Web version must stand up on its own, are in `16.md` §3.

**The core value is the managed environment, not the editor** (2026-08-26 user ruling, on accepting the
Product Value Revalidation). digicode-text does **not** exist to be a browser Arduino/C++ editor, to beat
VS Code on editing, or because AI can write code — near-equivalents of each already ship elsewhere. It
exists to **keep a verified MCU environment (Board · Toolchain · Framework · Device/Sensor Library ·
Dependency · Version · Compatibility) continuously managed on DigiCode's side, and to have the Compiler
and the AI read that same single source of truth** — so that users never build or update the environment
themselves through a Board Manager, a Library Manager, a Package Manager or GitHub. This is the primary
evaluation axis for every design judgment from here on. The one-sentence product definition, the
Verified / Custom two-layer candidate, the "never go back to whole-matrix guarantees" ruling and the
"do not assume Registry upkeep is a human-powered activity" ruling all live in `16.md` §3.

**Everything below this line is PROVISIONAL and is settled by the user after the donor audit**
(2026-08-25 user ruling). It is written out rather than left blank because an anchor that is empty
still reads as present — but it is not a licence to treat it as settled. The four things explicitly
**not** fixed yet: the detailed product specification, the target scope, the completion conditions,
and the DigiCode compatibility range.

**Target users (provisional):**

- people who want to write ordinary text code in the browser and develop for microcontrollers;
- beginners to intermediates doing Arduino / ESP-family / RP-family development who want a clearer
  path than a full IDE offers;
- FabLab, education and workshop settings that want to handle real code rather than blocks.

**Out of scope (provisional):** re-implementing DigiCode's block editor as-is · fully replacing a
complete IDE such as VS Code · enterprise collaborative-editing / cloud-IDE features.

**"Passing grade" definition (provisional, user verbatim 2026-08-25):**

> 「DigiCode から必要な技術資産を選択移植したうえで、ブロックエディタに依存せず、ブラウザ上で通常のテキストコードを編集し、対象マイコン向けのビルドから書き込みまでを分かりやすく行える独立した Web アプリとして成立すること。」

Explicitly **not** fixed by that definition: full DigiCode feature parity, full board/device parity,
how much of the origin's compile-test suite is inherited, and the finished UI specification. A
compatibility / acceptance matrix is ruled on by the user after the donor audit (16.md §2 baton 2).

**Add nothing the user did not ask for.** Before writing any new mechanism, feature or check, be
able to say in one line which user directive or measured finding produced it. If you cannot, it is a
proposal for the user, not a task (rule 17 / rule 24).

**This project is a consumer of `Project_Template`**, not a distributor: template revisions arrive
by a user-decided deployment visit, and this repository never edits the template. **The current
position of that relationship lives in `local/handover/16_…md` §4** (this section is the invariant
purpose; 16.md §4 is the movable position — never mix them).

---

**GO / STOP boundary**

| | |
|---|---|
| **Waiting on user GO** | **① routing profile への実測値書き込み(baton 4 — 測定は完了済み)② S005 §1/§2/§3 の再裁定要否(baton 38 — S007 が根拠の差し替え候補を供給した)③ `Managed Environment & Device Knowledge Architecture Design` の着手。** 従来から継続: Web / Desktop / shared-Frontend architecture; Local Helper の正式採否; Text Compiler architecture (baton 21); Board / Library bundle 境界; the product specification, the compatibility / acceptance matrix, and the technology stack / deployment target; the third-party-material placement decision |
| **Always needs its own GO, whatever came before** | **any change to DigiCode / its compiler / its Docker images / Cloudflare / DNS / deploy / production Board·Library additions / production AI / production Web Serial·BLE OTA** — donor and its running assets are read-only unless the user says otherwise; any push that can reach a production effect; adopting a mechanism or code asset from DigiCode or any other reference implementation; changing a gate's class or threshold; overwriting or relicensing `LICENSE` (AGPL-3.0); changing PUBLIC visibility; **writing a model / effort / target mapping into the routing profile**; **競合サービスの account 作成 · 有料契約 · 課金 · 営業接触 · 個人情報登録**(S007 で 11 件の Human test として提示済み、baton 44) |
| **Forbidden without a new ruling** | reopening anything in §3; importing DigiCode's legacy governance — **the donor's `prompt/` has never been opened and stays unopened**; deleting current truth to move a size signal; treating a baton or a next-objective candidate as authority to work on it; modifying `Project_Template` from this repository; **treating any probe code from S002 / S003 as a production implementation** (baton 24, 26); **新たな read-load 構造変更**(baton 25); **Opus 5 solo で PRIMARY_OBJECTIVE を完結すること**(§3、2026-08-27 に再確認) |

### ALWAYS ITEMS (full body)
#### B-19 — owner `prompt/maintenance/local/handover/batons.md`
**The evidence outranks its own summary** — six `investigations/**/…findings-and-next.md` files hold the findings, risks, unknowns, Human decisions and candidates. **The candidates are menus for the user, not queues.** 🔴 **S006 が足した最重要の注意: 結論ファイルが、同じ調査の evidence ファイルと矛盾しうる**(case **DT-4**)。結論を読む前に、その調査の evidence を 1 度は開くこと | OPEN | the user picks the next objective | User | 🔴

#### S3-01 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **digicode-text is a new independent project bootstrapped from `Project_Template`, not a fork of DigiCode** (2026-08-25, user directive §0): its git history begins at its own `Initial commit`; DigiCode is a **donor / source repository** audited READ ONLY, and its history is never merged, subtree'd, rewritten or forked in. *Rejected*: ① forking DigiCode and stripping it ② `git init` + force push over the existing GitHub repository. *Supersedes*: none.

#### S3-02 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **DigiCode's legacy governance is never imported; the template's own `Origin: DigiCode` provenance is kept** (2026-08-25, user ruling). *Rejected*: removing `Origin: DigiCode` case bodies from the inherited common rules. *Supersedes*: none.

#### S3-03 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **`prompt/` and `CLAUDE.md` are git-tracked in a PUBLIC repository, and the answer to that is content discipline, not concealment** (2026-08-25, user ruling). The countermeasure is **never writing secrets, credentials or private information into the repository**, enforced by the pre-commit gitleaks gate on every commit. *Rejected*: ① gitignoring `prompt/` and `CLAUDE.md` ② making the repository Private. *Supersedes*: none.

#### S3-06 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **`Project_Template` is not modified from this repository** (2026-08-25, user directive §10): defects are reported to the user and recorded here. *Rejected*: fixing the template in place while the finding is fresh. *Supersedes*: none.

#### S3-08 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **A Human GO authorises one declared PRIMARY_OBJECTIVE and nothing beyond it** (2026-08-26, user ruling): 「GO は、その時点で明示された PRIMARY_OBJECTIVE の範囲だけに対する作業許可です」. A related discovery is recorded as finding / risk / proposal / next-objective-candidate and the objective is **not** extended; when it completes, STOP and report. *Rejected*: treating a GO as project-wide implementation approval. *Supersedes*: none.

#### S3-20 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 この裁定を受けても production 実装へ自動的に進まない** (2026-08-26, user ruling §17、Product Value 受理 §16 で再確認). 進んではいけないもの: Web / Desktop / Helper production implementation · Monaco / LSP / Tauri production 導入 · Text Compiler 実装 · Board pack 実装 · Installer 実装 · **Managed Environment Registry 実装**。**次の PRIMARY_OBJECTIVE は Human が改めて指定する。** *Rejected*: 方向裁定を実装 GO と読むこと。*Supersedes*: none.

#### S3-31 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 Opus 5 を solo で運用しない。PRIMARY_OBJECTIVE を Opus 5 solo で完結させることを禁止する** (2026-08-26, user ruling, S007 指示文書 §0 で明示的に再宣言). Claude Code / Opus 5 の担当は **Harness · scope 管理 · orchestration · delegation packet 作成 · evidence 監査 · contradiction detection · Human ruling との分離 · 最終統合**。Codex は **donor source 調査 · implementation 読解 · grep / structural analysis · isolated probe · competitor falsification · data extraction · technical comparison · evidence verification** へ積極的に使用する。**`codex tool calls = 0` で終わった objective は未達とみなす。** 根拠: S001–S005 で重要 finding の自己矛盾(case DT-4)· evidence の過剰一般化 · instrument defect(case DT-2)· 独立検証不足 · mandatory different-vendor consult 不履行(case DT-3)が**実際に発生した**。*Rejected*: ① `PRIMARY_MODEL_MODE` 未宣言の既定 `T1-solo` を、この project の既定として使い続けること ② 「delegate へ渡すと evidence が claim に劣化する」という rule 04 の誤読を solo の理由に再利用すること(全文検索で `NOT FOUND`)。*Supersedes*: S002 / S003 が記録した solo 理由(誤読であり、根拠として無効)。

#### S3-38 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 Opus 5 solo 禁止を維持する** (2026-08-27, user ruling, 再確認). S007 でも **D6 / D7 の独立 FALSIFICATION によって Opus 統合者自身の複数の誤り・過剰一般化・競合見落としが訂正された**(13 件、case DT-6)。次 Objective でも **Opus = Harness / integration / scope / review、Codex = source analysis / design investigation / verification / falsification、必要に応じて different-vendor lane** という構造を使う。**Human が改めて解除しない限り solo へ戻さない。** *Rejected*: 「今回は範囲が狭いから solo でよい」という個別判断。*Supersedes*: none(2026-08-26 の裁定を再確認・強化)。

#### S3-43 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 `BRIEF_MAX_BYTES` を 96 KiB → 128 KiB へ上げる。これは bridge であり、この種の最後の一回である** (2026-08-27, user ruling, gate threshold 変更として明示的に GO). 目的は S008 の統合反証修正を **green な gate の上で land させること** に限られる。**🔴 128 KiB に到達しても、これ以上 cap を上げてはならない** — 192 も 256 も無い。到達したら STOP して Human に問うこと。**🔴 サイズ調整のために current truth を削ることは引き続き禁止** — checker blind spot · baton · Human ruling · owner contract · feedback queue のいずれも、収めるために消さない。**根拠は構造的で、S008 が実測した**: brief の任務は repo access を持たない actor 向けの *完全性* であるため、current-state owner の本文をすべて載せねばならず、**topic split では縮まない**(実際 S008 では、それまで brief が黙って落としていた loop position と feedback queue を含むようになり **増えた**)。**完全な current state を単一 payload として export し続ける限り、brief は current truth に比例して増え、どの threshold 値も安住の地ではない。**測定値は `investigations/2026-08-27_handover-architecture/` が owner。*Rejected*: ① 「超えたら上げる」を運用として続けること ② current truth を削って収めること ③ この場で task-scoped export を実装すること(§下記)。*Supersedes*: 2026-08-27 の 96 KiB 暫定裁定(baton 52)。

#### S3-46 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 `READ_ALLOWANCE` / `REVIEW_REQUIRED` threshold を勝手に上げない** (2026-08-27, user ruling). S008 は topic split 側を実施したが、**model roster を明示し context window から read allowance を導出する側は未実施**であり、`READ_ALLOWANCE = 48,000` が **どの model / context size / operating margin から導出された値なのか、この project 固有の記録は存在しない**(baton 25)。次の Harness Maintenance の検討対象とする。*Rejected*: 導出記録の無いまま allowance を動かすこと。*Supersedes*: none。

#### S3-48 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 Orchestration の新運用方針 — Adaptive fan-out。次 objective / session から適用する** (2026-08-27, user directive). **固定の最大 fan-out ではなく適応的に決める**: 最初は必要最小限の **1〜3 independent Codex lane**、通常の重要調査は **2〜3 lane**、重大判断では **3〜4 investigation lane + 必要なら FALSIFICATION**。**第二波は disagreement / uncertainty / evidence gap / Human impact が残る箇所にだけ**出す。**lane 数より「異なる仮説・異なる証拠経路」を重視する。** Codex は implementation だけでなく **investigation / verification / falsification へ積極利用**し、**Opus subagent を反射的に増やさない**(通常の investigation / verification / falsification は **Codex が第一候補**)。high-cost model は **architecture · ambiguity · large-context integration · difficult falsification** 等へ限定。**baseline effort から開始**。**lane 単位でも STOP discipline** を効かせる。implementation では**同じ scope を複数 worker へ競争実装させない** — `Primary Worker → Independent Verifier → Harness acceptance`。**Harness 自身の integration / report も verification 対象**であり、重大 Human 判断では **統合結論への FALSIFICATION を検討する**。**read-load も orchestration cost として扱う。** *Rejected*: ① この指示だけを理由に既存 rule を自動書き換えすること ② この指示を理由に受理済み objective を reopen すること。*Supersedes*: none(rule 22 と衝突する点を見つけた場合は **勝手に解釈せず Human へ conflict を提示して STOP する**)。

## L1 SELECTED
SELECTED_NON_CORE_COUNT: 20

### B-04 — owner `prompt/maintenance/local/handover/batons.md`
🟡→ **Routing profile values — 測定は S006 で完了した。書き込みが GO 待ち。** `local/docs/routing-profile.md` は全 target が `effort_scale = NONE` のまま。**S006 が transport 自身から実測した値**(delegate への質問ではなく API のエラー応答から): `SIX-LANE-DELEGATE` = holder `codex-cli 0.149.1 / gpt-5.6-sol`、`effort_scale = none\|minimal\|low\|medium\|high\|xhigh\|max`(昇順)、`baseline_effort = high`。導出は `orchestration-re-audit/01_method-and-lanes.md` §6 が owner。**さらに `routing-profile.md:26` は「初回 dispatch 前に commit attribution を書け」と定めており、S006 がその初回 dispatch だった** — 書き込まないまま dispatch した状態が現在も続いている | OPEN | 🔴 **Human が書き込み GO を出したとき。** それまで escalation は `REJECT_UNSUPPORTED_EFFORT` のまま(baseline dispatch は可能 — 「構造が委譲を禁じていた」は S006 で反証済み) | User (writing values is GO-gated) | 🔴

### B-05 — owner `prompt/maintenance/local/handover/batons.md`
**`scripts/protected-paths.txt` has no project rows yet** — only the harness prefixes that travel with the template | OPEN | the stack and deployment target are settled (baton 3) | Harness | 🟡

### B-06 — owner `prompt/maintenance/local/handover/batons.md`
**`scripts/spec-boundary-terms.txt` is empty** — the fork-neutrality check therefore guards only the mechanism. **The trigger has fired**: S001–S003 surfaced the real domain vocabulary (board ids, `fragments`, `FlashMethod`, NimBLEOta, `lib_deps`, FQBN, compile_commands, …). Fill it from the evidence, not from guesses | OPEN | next time anyone edits this repository's product-facing text | Harness | 🟢

### B-07 — owner `prompt/maintenance/local/handover/batons.md`
**Template bootstrap findings — L-6 / L-7 remain deferred** by the 2026-08-25 ruling. L-6 is cosmetic; L-7 is not a defect (`OPERATIONS.md` mutations being inapplicable here is correct, prints as `A=2`). Receipt: `local/docs/RULES_SNAPSHOT` | OPEN | user ruling on L-6 / L-7 | User | 🟢

### B-20 — owner `prompt/maintenance/local/handover/batons.md`
**Selftest B57 only special-cases the `PT-` case prefix** — a consumer project numbering cases with its own prefix falls into the generic branch and needs the literal string `case <id>` in the body. Worked around here by titling bodies 「case DT-N — …」. **This is a `Project_Template` defect and is not fixed from this repository** | OPEN | reported to the user; a template deployment visit fixes it | User | 🟢

### B-24 — owner `prompt/maintenance/local/handover/batons.md`
**The S002 probe code is not a production implementation.** `investigations/2026-08-26_compiler-shared-probe/06_probe-implementation.md` exists so measurements can be reproduced. It has **no authentication, no rate limit, no quota, no workspace cleanup and no source-size ceiling**. **🔴 S006 が足した重大な注記: 測定を判定した runner(`run-text.py` / `run-concurrent.py` / `compare.py` / cache benchmark)は保存されていない。** API 内部の RC 処理は正しいが、**外側の route は compile failure も HTTP 200 で返す**ため、runner が JSON の `success` を見ていなければ silent green だった。その runner は監査不能 | OPEN | fires whenever anyone reaches for that file as a starting point | Harness | 🔴

### B-25 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **The unconditional cold-start read is at `BUDGET_STATUS = WARNING`**, accepted by the user as a known working state (2026-08-26). **Never transcribe a figure into this row — this row is part of what the total measures.** Run `bash scripts/read-load.sh` for the value. **The audit is done and its result is: the growth is current truth, not duplication.** **🔴 2026-08-27 S008: ① を実行した(topic split)。② は未実施で、menu の `Task-Scoped Context Brief / Read Architecture Maintenance` へ持ち越す。****`READ_ALLOWANCE` / `REVIEW_REQUIRED` を勝手に動かさない(16.md §3)。****残る選択肢は 2 つで、どちらも Human のもの**: ① `local/README.md` §OPTIONAL CAPABILITY による current owner の topic 分割 ② allowance 導出の前提である **roster の宣言**。**監査で判明した前提の欠落**: `scripts/read-load.sh` は template のものと **byte-identical** で、**この repo に allowance の導出記録は 1 件も存在しない** | OPEN | 🔴 **受容されたが解消していない。** trigger: Human が **別の maintenance objective** として ①/② を指定したとき。**close を read-load maintenance へ差し戻す理由にはしない** | User(①も②も裁定事項)/ Harness(測定) | 🟡

### B-40 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **positive control 付きで測り直す必要がある器材が 9 件ある。** 最重要は **H8 server-side memory** — 計器が `ps -o rss` を**プロセス間で合計**しており、合計 RSS は**共有ページを重複計上する**ため「共有の恩恵は無い」という主張そのものを測定できず、課金対象の物理 RAM でもない(誤差方向は server-side を**悪く**見せる)。他 8 件(E1 startup / H6 偽診断の分母 / H2 permission / H10 署名 UX / V3 absence の個別 control / V4 known-bad control / V8 registry / V10a image cost)と、それぞれ何を測り直すかは `orchestration-re-audit/08_…md` §6-1 が owner | OPEN | 該当 architecture objective が開くか、Human が器材再測定 objective を指定したとき | User (opens) / Harness (measures) | 🔴

### B-42 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **本セッション(S006)の system prompt に、この repository の governance とは無関係な `Do not call the AgentTool unless the user requested it` が Claude Code 製品側から注入されていた。** `.claude/settings.json` / `~/.claude/settings.json` / `~/.claude/CLAUDE.md` / `~/.claude/output-styles/` のいずれにも該当記述は無い。これが `subagent spawns = 0` の直接原因だが **Codex MCP は覆わない**。**本 repo が修正できるものではない** — 記録の目的は、次に同じ状態が起きたとき「規則を読み直しても原因が見つからない」で止まらないようにすること。case **DT-3** | OPEN | 次に harness の挙動が規則で説明できないとき | Harness(観察のみ) | 🟡

### B-43 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **conductor の reasoning effort は宣言と食い違っている【CONFIRMED — S006 が transcript 6 ファイル / 1,427 レコードの 100% で、S008 が本セッション transcript 47/47 レコードで再確認】。** `~/.claude/settings.json` は `effortLevel: "xhigh"` を持ちながら `modelSettings["claude-opus-5"].effortLevel = "medium"` を併記し、`model` は `opus[1m]`。**variant suffix `[1m]` は `modelSettings` のキー照合には影響せず、`modelSettings["claude-opus-5"].effortLevel = "medium"` が top-level の `xhigh` に優先することが実測された。**したがって S000–S008 の全セッションが medium effort である。**S008 でも設定は変更されていない(変更は Human 権限)。**rule 22 §Environment prerequisites が「variant suffix を装飾として剥がすな」と記録している、まさにその形。**🔴 2026-08-27 S008 Human 裁定: 未解決として維持し、今回は設定を変更しない。**次の Harness Maintenance で `opus[1m]` · top-level effort · `modelSettings` override · effective effort · routing profile · Human-only effort authority の関係を明確化する。**Human GO なしで effort setting を変更しない。****解消方法**: 起動バナーの variant 表示を 1 度読む、または `/status` の effort を確認する | OPEN | 次セッション開始時(pre-flight step 1 で確認できる) | User(設定)/ Harness(確認) | 🟡

### B-52 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **`BRIEF_MAX_BYTES` を 64 KiB → 96 KiB へ引き上げた(2026-08-27、Human GO 済みの gate threshold 変更)。96 KiB は暫定値である。** 実測根拠: S007 close 時点で brief は **65,141 bytes / cap 65,536 = 余裕 395 bytes** であり、**次の close は誰が書いても越えた**。threshold を触らない 2 つの修復(current truth の削除 / close 中の handover 再構成)はいずれも本 repo で禁止されている。**🔴🔴 2026-08-27 S008 close: Human GO により 96 KiB → 128 KiB へ引き上げた。これは bridge であり、この種の最後の一回である。****128 KiB に到達しても、これ以上上げてはならない — STOP して Human に問う。****サイズ調整のために current truth(checker blind spot · baton · Human ruling · owner contract · feedback queue)を削ることは禁止。**恒久解は menu の `Task-Scoped Context Brief / Read Architecture Maintenance`。裁定本文は 16.md §3 が owner。**🔴 2026-08-27 S008 更新: menu #2 の topic split は実施されたが、**brief は縮まず、むしろ増えた**(数値はここに書かない — `bash scripts/context-brief.sh \| wc -c` が唯一の owner。この行に一度書いた値は同一セッション中に stale になった)。**理由は構造的である: brief の任務は repo access を持たない actor 向けの **完全性** であり、conditional owner の本文も載せなければならない。実際 S008 の brief は、それまで黙って落としていた loop position と template feedback queue を新たに含むようになった。**したがって「topic split が brief の恒久修復である」という S007 時点の想定は実測で成立しない。**brief には別のレバー(task-scoped export 等)が要り、それは未設計である。**cap を維持するか / 下げるか / 別 threshold 設計にするかは Human の裁定であり、再度の引き上げには改めて Human GO が要る** | OPEN | 🔴 **brief が再び cap に接近したとき、または menu #2 が objective として開かれたとき** | User (threshold は GO-gated) / Harness (測定) | 🔴

### B-53 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **current-state owner set は 3 ファイルになった(2026-08-27 S008、Human GO 済みの harness maintenance objective)。** router = `16_…md`(mandatory・hook が全文注入)· `batons.md`(baton 本文、conditional)· `evidence-map.md`(evidence/provenance/loop/feedback queue、conditional)。**分割の安全性は「router に全 baton の stub が残っていること」に依存する**(実測: 45 件中 31 件が stub 前提でのみ条件付き可)。義務: ① close は 3 owner を**同一 commit** で更新し ② `handover-diff.sh` が 3 owner を走査し ③ GEN を 3 owner で一致させる。検出器は **B69**(hook 全量注入・bytes)· **B70**(GEN 一致 + owner 到達性)· **B71**(stub↔本文の双方向対応)。**owner を増減するときはこの 3 検査と `read-load.sh` の ROSTER と `context-brief.sh` の allowlist と hook の manifest を同時に直すこと** — どれか 1 つを忘れると、残りが green のまま事実が静かに落ちる | OPEN | 🔴 **every close**、および current-state owner を増減するとき | Harness | 🔴

### B-54 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **current truth の損失検出は一様ではない。どの機構が何を捕まえるかは 2026-08-27 S008 の独立レーンが 6 mutation で実測した**(`investigations/2026-08-27_handover-architecture/04_cold-start-reconstruction.md` §C)。**6/6 は検出されたが、どの単独機構も 6/6 は捕まえていない**: ① §3 の Human ruling 1 本の削除 → `handover-diff` が GONE(1) で捕捉、**selftest は 78/78 のまま素通り** ② router の baton stub 削除(本文は残存)→ **B71 が捕捉、`handover-diff` は GONE 0**(残った本文が union の entry を維持するため)③ 本文削除(stub 残存)→ B71 と handover-diff の双方 ④ GEN drift → B70 ⑤ hook manifest の path 破壊 → B70 ⑥ router を 200 行へ切詰 → **B69 は green のまま**(ディスク側が切れていれば注入も切れて「一致」する)、B55(9→7/9)と B58(8→7/8)が捕捉、**`handover-diff` は GONE 0** — その union は §2/§3 のみで **§5 baseline の消失を覆わない**。**したがって「gate が green だから current truth は無傷」とは書けない。****🔴 2026-08-27 の統合反証レーンがさらに 4 件の盲点を実証**(いずれも throwaway copy で mutation を実行し、対象 check が green のまま通過することを確認): ⑦ `settings.json` の SessionStart を別 script へ差し替えても B69 は green だった(**修正済み** — B69 が登録先を検査するようになり、mutation で RC=1 を実証)⑧ hook の manifest tuple を comment out しても path 文字列がコメントに残れば B70 は green(predicate が substring 照合であるため。**未修正**)⑨ baton 44 の Human-GO 禁止文を `See baton 44.` に置換しても B71 は green(ID 集合しか見ないため。**stub の意味的十分性を測る executable guard は存在しない** — 人間かレーンの査読が唯一の手段)⑩ **`mode none` owner(`evidence-map.md`)の行を削除しても `handover-diff` は GONE 0**(その owner は §2/§3 entry を持たないため走査対象が空。file 全欠落は exit 2 で捕まるが、**部分欠落は不可視**。donor SHA · 外部一次資料の所在 · evidence 読解順序 · feedback queue が該当する)§1/§4/§5 に相当する current truth を新設するときは、その section を覆う検出器が存在するかを先に確認すること | OPEN | 🟡 単一 gate を「損失検出器」として引用しようとするとき、および §2/§3 以外に current-truth section を追加するとき | Harness | 🟡

### B-55 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **`CLAUDE.md` の pointer-only 規律には走査範囲の穴がある。**§2 は「この file は current fact の owner ではない」と定め、selftest **B54** がそれを検査するが、B54 が読むのは **§2 と §3 の 2 section だけ**である(`selftest.sh` の B54 は `2/2 sections scanned` と印字する)。したがって同型の違反を §0 / §4 / §7 / §9 に書くと**green のまま通る**。2026-08-27 S008 の統合反証レーンが実例を検出した — §0 に `45 batons` という measured count があり、実測は既に 46 で stale だった。**現在の対処は文言のみ**: §0 に「§0 が持ってよいのは read contract であり、数値は *過去の測定* としてのみ、live 値は必ず command から」と明記した。**executable な guard は無い。**B54 を全 section へ広げるのは PT-29(文言に鍵をかけた guard が正当な書き換えを赤にする)の危険があるため、設計を伴う変更であり、この baton はその判断を Human/次の harness objective へ残す | OPEN | 🟡 `CLAUDE.md` の §2/§3 以外へ書き込むとき、または B54 の走査範囲を変更するとき | Harness | 🟡

### S3-04 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **The routing profile records an absence of measurement rather than a plausible mapping** (2026-08-25, user ruling): every `effort_scale` is `NONE`, so unsupported escalation is refused fail-closed. *Rejected*: ① inventing model / effort / target values at bootstrap (case PT-1's shape) ② inheriting `Project_Template`'s roster values ③ leaving the `{{...}}` template unfilled. *Supersedes*: none. **S006 注記**: 実測値は取得済み(baton 4)。**書き込みは依然 GO-gated であり、この裁定は「測っていないものを書かない」であって「測っても書かない」ではない。**

### S3-30 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🟡 現在の read-load `BUDGET_STATUS = WARNING` を、既知の作業状態として受容する** (2026-08-26, user ruling §15). **ただし問題が解消したという意味ではない**(baton 25)。*Rejected*: ① WARNING を理由に製品 objective の close を差し戻すこと ② WARNING を解消済みとして baton を落とすこと。*Supersedes*: baton 25 の 🔴 severity。

### S3-39 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 `BRIEF_MAX_BYTES` を 64 KiB → 96 KiB へ引き上げる(暫定)** (2026-08-27, user ruling — gate threshold の変更として明示的に GO). 根拠は実測: S007 close の時点で brief は **65,141 bytes / cap 65,536**(余裕 395 bytes)で、**S007 の current truth 追加により構造的に上限へ到達した**。*Rejected*: ① **current truth を削除してサイズを調整すること**(§1 で禁止)② **close 中に topic split まで実施すること**(別の構造変更)③ **赤い gate のまま land すること**(case 110 / PT-18 の再演)。*Supersedes*: none。**🔴 これは「今後も超えるたびに cap を上げてよい」という裁定ではない。96 KiB は暫定値であり、恒久修復は menu #2 の topic split。再度の引き上げには改めて Human GO が要る(baton 52)。**

### S3-44 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 context brief の恒久解は別 Objective で扱う — `Task-Scoped Context Brief / Read Architecture Maintenance`** (2026-08-27, user ruling). 問いは **「repo access を持たない actor へ、Objective に必要な current truth だけを安全に export するにはどうするか」**。候補論点: task → required owner routing · task-scoped export · unconditional core · conditional owner selection · **wrong-owner detection** · **no-owner detection** · fallback path · unknown task handling · product / harness objective 別の read route · Human ruling omission detection · critical prohibition omission detection · stale owner detection · brief completeness · brief minimality · cold-start reconstruction · remote/subagent 向け brief · FALSIFICATION lane 向け brief · delegation packet と brief の責務境界。**この Objective では baton 25 の allowance 導出と baton 43 の effort mismatch も扱う候補とする。***Rejected*: none。*Supersedes*: 「topic split が brief の恒久修復である」という S007 時点の想定(S008 の実測で反証)。

### S3-45 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 task-scoped export をその場で実装しない** (2026-08-27, user ruling). S008 の Lane B が測定したとおり、**task→owner 分類器 · wrong-owner control · no-owner control は現時点で 1 つも存在しない**。「brief が大きいから簡単に実装する」ことを禁止する。requirements · failure modes · fallback · mutation · reconstruction を含めて**別 PRIMARY_OBJECTIVE として設計・検証する**。*Rejected*: brief のサイズを理由に分類器なしの export を入れること。*Supersedes*: none。

### S3-47 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 baton 43(Opus 5 effort mismatch)は未解決として維持する。今回は設定を変更しない** (2026-08-27, user ruling). declared / expected = `xhigh`、effective transcript = `medium` が S008 でも再確認された。次の Harness Maintenance で **`opus[1m]` · top-level effort · `modelSettings` override · effective effort · routing profile · Human-only effort authority** の関係を明確化する。**🔴 Human GO なしで effort setting を変更しない。** *Rejected*: 今回その場で設定を直すこと。*Supersedes*: none。

## L2 LANE_OVERLAY
LANE: VERIFICATION
OVERLAY_IDS: B-40,B-54,S3-30

## L3 INDEX
INDEX_COUNT: 96
- B-02 [INDEX_ONLY] 🔴 Compatibility/acceptance remains open, risk-based, and not inherited from Classic counts. — owner: `prompt/maintenance/local/handover/batons.md`
- B-03 [INDEX_ONLY] 🔴 Web/Monaco/shared-Frontend/Desktop-target directions exist, but concrete stack, deployment, and adapters remain open. — owner: `prompt/maintenance/local/handover/batons.md`
- B-04 [INLINE] 🔴 Routing values were measured, but recording them awaits Human GO; current profile remains NONE. — owner: `prompt/maintenance/local/handover/batons.md`
- B-05 [INLINE] Technology-stack/deployment settlement must trigger project rows in protected-paths; read baton 5 before adding application paths. — owner: `prompt/maintenance/local/handover/batons.md`
- B-06 [INLINE] Before product-facing text edits, populate spec-boundary terms from S001–S003 evidence, never guesses; read baton 6. — owner: `prompt/maintenance/local/handover/batons.md`
- B-07 [INLINE] Bootstrap findings L-6/L-7 remain deferred pending a user ruling. — owner: `prompt/maintenance/local/handover/batons.md`
- B-13 [INDEX_ONLY] Any architecture objective must load the open browser-support matrix and its Safari/Firefox/Chromium caveats; read baton 13. — owner: `prompt/maintenance/local/handover/batons.md`
- B-14 [INDEX_ONLY] Third-party material placement has four options and no adopted placement. — owner: `prompt/maintenance/local/handover/batons.md`
- B-15 [INDEX_ONLY] Actual license/ToU review happens at adoption, with stronger redistribution obligations. — owner: `prompt/maintenance/local/handover/batons.md`
- B-16 [INDEX_ONLY] 🔴 Original planning documents contain identifying/private information and cannot enter this PUBLIC repo; only user-chosen de-identified text may enter; read baton 16. — owner: `prompt/maintenance/local/handover/batons.md`
- B-17 [INDEX_ONLY] The user's external planning documents have enumerated wording/factual/product-definition corrections. — owner: `prompt/maintenance/local/handover/batons.md`
- B-18 [INDEX_ONLY] 🔴 Portability cannot be decided mechanically from a license marking; the trigger must stay live. — owner: `prompt/maintenance/local/handover/batons.md`
- B-19 [INLINE] 🔴 Investigation conclusions can contradict their evidence; read evidence before conclusions, and never treat candidate menus as work queues; read baton 19. — owner: `prompt/maintenance/local/handover/batons.md`
- B-20 [INLINE] B57's PT- special-case is a Project_Template defect handled only during a template visit. — owner: `prompt/maintenance/local/handover/batons.md`
- B-21 [INDEX_ONLY] 🔴 Dedicated Compiler is a direction, not a design; architecture boundaries and four audit inputs remain open; read baton 21. — owner: `prompt/maintenance/local/handover/batons.md`
- B-22 [INDEX_ONLY] FastAccelStepper resolution failure is network-confounded, failure evidence only, and not a donor fix; read baton 22. — owner: `prompt/maintenance/local/handover/batons.md`
- B-24 [INLINE] 🔴 S002 probes are measurement-only, not production, and decision runners are unauditable; read baton 24 before reuse. — owner: `prompt/maintenance/local/handover/batons.md`
- B-25 [INLINE] Read-load is still WARNING after the S008 topic split (option ① executed under Human GO). Option ② — declaring the model roster and DERIVING the allowance — is untouched: this repository has no record of what model / context size / operating margin produced READ_ALLOWANCE = 48,000. Never move that value or the REVIEW threshold without it. Carried into the menu's Task-Scoped Context Brief / Read Architecture Maintenance; read baton 25. — owner: `prompt/maintenance/local/handover/batons.md`
- B-26 [INDEX_ONLY] S003 Helper/editor/LSP probes are measurement-only and lack production protections; read baton 26 before reuse. — owner: `prompt/maintenance/local/handover/batons.md`
- B-27 [INDEX_ONLY] 🔴 Local Helper feasibility is not adoption; real LNA prompt/persistence was not measured; read baton 27 in Web/Desktop architecture. — owner: `prompt/maintenance/local/handover/batons.md`
- B-28 [INDEX_ONLY] 🔴 Board/Library bundle boundary is unresolved and pairs with baton 34; read both before Desktop bundle design. — owner: `prompt/maintenance/local/handover/batons.md`
- B-29 [INDEX_ONLY] 🔴 Web must be complete without LSP; explicitly design no-LSP capabilities and do not presume AI fully replaces LSP; read baton 29. — owner: `prompt/maintenance/local/handover/batons.md`
- B-30 [INDEX_ONLY] Classroom Local LSP remains only a future candidate and its 32-GB/50-user extrapolation is unusable pending remeasurement. — owner: `prompt/maintenance/local/handover/batons.md`
- B-31 [INDEX_ONLY] Enterprise Local Network Access policy exists, but real deployment behavior is unverified. — owner: `prompt/maintenance/local/handover/batons.md`
- B-32 [INDEX_ONLY] User-library header provisioning is unresolved and is the Custom/Registry problem; read baton 32 for local semantic or Registry work. — owner: `prompt/maintenance/local/handover/batons.md`
- B-33 [INDEX_ONLY] DigiCode-Finder Chrome-142+ PNA behavior is unverified and this repo must not change the donor; read baton 33 before donor work. — owner: `prompt/maintenance/local/handover/batons.md`
- B-34 [INDEX_ONLY] 🔴 Decide cloud-vs-local Desktop Compiler before bundle baton 28; they are different products and invert offline claims; read baton 34. — owner: `prompt/maintenance/local/handover/batons.md`
- B-35 [INDEX_ONLY] 🔴 AI-primary may conflict with intranet users because LLM endpoints may also be blocked; architecture/customer claims must address this; read baton 35. — owner: `prompt/maintenance/local/handover/batons.md`
- B-36 [INDEX_ONLY] Debugger scope is unresolved; product specifications must explicitly include or exclude it; read baton 36. — owner: `prompt/maintenance/local/handover/batons.md`
- B-37 [INDEX_ONLY] 🔴 Competitive inventory expanded, closest is Arduino Cloud AI Assistant, and real use remains 0 products; read batons 37/45 before product claims. — owner: `prompt/maintenance/local/handover/batons.md`
- B-38 [INDEX_ONLY] 🔴 R21–R23 stand but their original empirical ground was refuted; only Human may maintain, reconsider, or limit them; read baton 38 before relying. — owner: `prompt/maintenance/local/handover/batons.md`
- B-39 [INDEX_ONLY] 🔴 Registry need is supported but its “next” ranking ground was refuted; declare the updated ground before opening the objective; read baton 39. — owner: `prompt/maintenance/local/handover/batons.md`
- B-40 [INLINE] 🔴 Nine instruments require positive-control remeasurement; do not reuse affected numbers as evidence; read baton 40. — owner: `prompt/maintenance/local/handover/batons.md`
- B-41 [INDEX_ONLY] Competitor literature is not real use, which remains 0 products; read baton 41 before competitive claims. — owner: `prompt/maintenance/local/handover/batons.md`
- B-42 [INLINE] If harness behavior conflicts with repo rules, S006 observed a platform-injected AgentTool restriction; inspect baton 42 before blaming the repo. — owner: `prompt/maintenance/local/handover/batons.md`
- B-43 [INLINE] Conductor effort is measured medium, not the declared xhigh — modelSettings["claude-opus-5"] overrides the top level. Human ruled 2026-08-27 to keep this OPEN and change nothing: no effort setting is edited without a Human GO. Re-measure at every preflight; carried into the menu's Task-Scoped Context Brief / Read Architecture Maintenance. — owner: `prompt/maintenance/local/handover/batons.md`
- B-44 [INDEX_ONLY] Competitor accounts, payment, sales contact, and personal-information entry require named Human GO; run no real-use test without it; read baton 44. — owner: `prompt/maintenance/local/handover/batons.md`
- B-45 [INDEX_ONLY] 🔴 Arduino Cloud AI Assistant is the closest unreviewed competitor; audit it before the next product/competitor conclusion; read baton 45. — owner: `prompt/maintenance/local/handover/batons.md`
- B-46 [INDEX_ONLY] Semiconductor-vendor AI tooling and domestic vendors were not searched; make no market-wide coverage claim; read baton 46. — owner: `prompt/maintenance/local/handover/batons.md`
- B-47 [INDEX_ONLY] 🔴 Particle verified coverage is 10/972 (1.03%) with no public coding-AI evidence; mechanism is not demand proof; read baton 47. — owner: `prompt/maintenance/local/handover/batons.md`
- B-48 [INDEX_ONLY] 🔴 Academic evidence supports common compile failures only, not broad complexity/library causation or Registry efficacy; read baton 48. — owner: `prompt/maintenance/local/handover/batons.md`
- B-49 [INDEX_ONLY] Scope competitor absence/uniqueness to the primary-checked set, never the whole market; read baton 49. — owner: `prompt/maintenance/local/handover/batons.md`
- B-50 [INDEX_ONLY] 🔴 Auto Web UI consumes Blockly registration metadata, not C++; Text needs an input adapter while downstream assets remain candidates. — owner: `prompt/maintenance/local/handover/batons.md`
- B-51 [INDEX_ONLY] 🔴 Device-knowledge expansion is an unproven Human design expectation and schema remains open. — owner: `prompt/maintenance/local/handover/batons.md`
- B-52 [INLINE] 🔴 🔴 The brief cap is 128 KiB, a BRIDGE and the last raise of its kind (2026-08-27 Human GO). The S008 split did NOT shrink the brief — it grew, by exporting truth it had been omitting. If the brief reaches 128 KiB, STOP and ask: do not raise it again, and do not delete current truth to fit. The permanent repair is the menu's Task-Scoped Context Brief / Read Architecture Maintenance. — owner: `prompt/maintenance/local/handover/batons.md`
- B-53 [INLINE] 🔴 The current-state owner set is three files and its safety rests on the router's stubs plus B69/B70/B71; every close updates all three in one commit and carries the router's GEN into all three. Adding or removing an owner also requires, in the same commit: read-load.sh ROSTER · context-brief.sh allowlist · the hook's conditional manifest · CLAUDE.md §0 · handover-diff.sh OWNERS — miss one and the rest stay green while a fact leaves silently. — owner: `prompt/maintenance/local/handover/batons.md`
- B-54 [INLINE] 🟡 No single mechanism catches every current-truth loss, and the map of which catches what is now measured — handover-diff compares only §2/§3, so a §1/§4/§5 deletion and any partial loss inside evidence-map.md are invisible to it; selftest misses a single §3 ruling bullet; B69 cannot see a router truncated on disk; B70 matches a path as a substring; B71 cannot see whether a stub still carries its prohibition. — owner: `prompt/maintenance/local/handover/batons.md`
- B-55 [INLINE] 🟡 CLAUDE.md §2's "this file never owns a current fact" is enforced by selftest B54 over §2 and §3 only — the same violation written into §0, §4, §7 or §9 is green. Measured: a stale count sat in §0. — owner: `prompt/maintenance/local/handover/batons.md`
- S3-01 [INLINE] - digicode-text is a new independent project bootstrapped from Project_Template, not a fork of DigiCode (2026-08-25, user directive §0): its git hist… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-02 [INLINE] - DigiCode's legacy governance is never imported; the template's own Origin: DigiCode provenance is kept (2026-08-25, user ruling). *Rejected*: remov… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-03 [INLINE] - prompt/ and CLAUDE.md are git-tracked in a PUBLIC repository, and the answer to that is content discipline, not concealment (2026-08-25, user rulin… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-04 [INLINE] - The routing profile records an absence of measurement rather than a plausible mapping (2026-08-25, user ruling): every effort_scale is NONE, so uns… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-05 [INDEX_ONLY] - The product specification, target scope, completion conditions and DigiCode compatibility range are provisional and settled after the donor audit (… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-06 [INLINE] - Project_Template is not modified from this repository (2026-08-25, user directive §10): defects are reported to the user and recorded here. *Reject… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-07 [INDEX_ONLY] - AI is a primary feature of digicode-text and ships from the start (2026-08-26, user ruling): investigation covers *how* the donor implements AI — n… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-08 [INLINE] - A Human GO authorises one declared PRIMARY_OBJECTIVE and nothing beyond it (2026-08-26, user ruling): 「GO は、その時点で明示された PRIMARY_OBJECTIVE の範囲だけに対する作… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-09 [INDEX_ONLY] - A licence marking is not a portability verdict (2026-08-26, user ruling, correcting this repository's own error): PROPRIETARY = 移植不可 as a mechanica… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-10 [INDEX_ONLY] - 🔴 digicode-text has its own dedicated Compiler; riding Classic's running Compiler is off the first-candidate list (2026-08-26, user ruling on top o… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-11 [INDEX_ONLY] - 🔴 AI = 主機能、LSP = 高度なコード編集支援。LSP は digicode-text を成立させる必須機能ではない (2026-08-26, user ruling §1). 🔴 したがって「LSP なしの Web 版」を「機能不足版」と定義してはならない。 *Rejected*:… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-12 [INDEX_ONLY] - 🔴 Web 版が主製品。Helper や LSP が無くても Web 版自体が完成した製品として利用できることを基本原則とする (2026-08-26, user ruling §2). 最重要価値は 「Chrome / Edge を開くだけで利用でき、ユーザ PC へ複雑な MCU 開発環境… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-13 [INDEX_ONLY] - 🔴 server-side LSP を Web 版の必須 backend にしない (2026-08-26, user ruling §11). digicode-text は基本無料が前提であるため、利用者が増えるほど LSP 費用が比例して増える構造を初期必須要件にしない。optional… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-14 [INDEX_ONLY] - 🔴 Monaco Editor を第一候補とする(多少重くても) (2026-08-26, user ruling §3). production Monaco を実装するという意味ではなく、正式 architecture で確定するまでの第一候補。*Rejected*: サイズと起動時間だけ… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-15 [INDEX_ONLY] - 🔴 内部標準 = main.cpp。Arduino .ino = import 可能。.ino を内部標準にすることは第一候補から外す (2026-08-26, user ruling §4). Arduino ecosystem 互換は重要なので、.ino を読み込んだら内部の main.c… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-16 [INDEX_ONLY] - 🔴 Desktop 版を正式に視野へ入れる。Web 版を主製品として維持しつつ、同じ Frontend から Desktop 版も作れる architecture を第一方針として検討する (2026-08-26, user ruling §5–§7、Product Value 受理 §4 で… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-17 [INDEX_ONLY] - 🔴 Desktop 版の初期 target は Windows / macOS / Linux(まず Ubuntu)。開発初期は署名・認証を必須にしない (2026-08-26, user ruling §8). 正式配布段階では Windows code signing / macOS De… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-18 [INDEX_ONLY] - 🔴 Desktop 版では高度 LSP を標準搭載する方向が有力(ただし現時点では正式決定しない) (2026-08-26, user ruling §9). *Rejected*: 現時点で正式決定すること。*Supersedes*: none. — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-19 [INDEX_ONLY] - 🔴 Local Helper は技術的成立を確認済み。正式採用は未決定。Desktop 版との役割重複を後続 architecture で評価する (2026-08-26, user ruling §10 / §16). これらは Local Helper の正式採用を意味しない。 *Reje… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-20 [INLINE] - 🔴 この裁定を受けても production 実装へ自動的に進まない (2026-08-26, user ruling §17、Product Value 受理 §16 で再確認). 進んではいけないもの: Web / Desktop / Helper production implement… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-21 [INDEX_ONLY] - 🔴🔴 製品の中核価値が確定した。DigiCode Text の存在意義は「Web で使える Arduino/C++ Editor を作ること」でも「VS Code より高機能な Editor を作ること」でも「AI でコードを書けること自体」でもない (2026-08-26, user rul… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-22 [INDEX_ONLY] - 🔴 製品定義の 1 文(今後の基準) (2026-08-26, user ruling §2): 「DigiCode Text は、検証済みのマイコン開発環境(Board・Toolchain・Library・Dependency)を利用者自身に構築させずに提供し、その同じ管理済み環境を Com… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-23 [INDEX_ONLY] - 🔴 Web 版の重要価値は「ブラウザ Editor であること」ではなく「利用者 PC へ MCU 開発環境を構築させないこと」である (2026-08-26, user ruling §3). 特に 学校 · FS 講座等の研修 · 企業イントラ · 管理者権限の弱い PC · 一時利用 P… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-24 [INDEX_ONLY] - 🔴 Block 製品分担: DigiCode Classic = Block を必要とする層向け / DigiCode Text = AI + Text + 管理済み MCU 環境 (2026-08-26, user ruling §5). Classic は既存成果物として維持し、Text… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-25 [INDEX_ONLY] - 🔴🔴 次に設計すべき中核は Managed Environment Registry である (2026-08-26, user ruling §6 / §11). Registry を単なる「対応 Board 一覧 / 対応 Library 一覧」にしない — 目標は Compiler・AI… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-26 [INDEX_ONLY] - 🔴 Verified / Custom の二層構造を Registry 設計の有力候補とする (2026-08-26, user ruling §7 / §12). 🔴 管理外 Library を禁止する closed ecosystem にはしない。ただし Verified / Custom… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-27 [INDEX_ONLY] - 🔴 理想は Custom から Verified への昇格経路を持つこと (2026-08-26, user ruling §8). 概念的な流れ: 候補発見 → metadata 取得 → source 確認 → license 確認 → dependency 解析 → compatible… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-28 [INDEX_ONLY] - 🔴🔴 Registry 管理を人力前提にしない。AI を管理・調査・QA 補助へ最大限活用することを前提候補とする (2026-08-26, user ruling §9 / §13). 🔴 ただし AI の自己申告だけを acceptance evidence にしない。最終的な保証は従来ど… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-29 [INDEX_ONLY] - 🔴 「全組み合わせ保証」へ戻らない。risk-based compatibility / regression を維持する (2026-08-26, user ruling §10). 件数を目的化しない。 *Rejected*: 件数ベースの網羅保証。*Supersedes*: none。S… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-30 [INLINE] - 🟡 現在の read-load BUDGET_STATUS = WARNING を、既知の作業状態として受容する (2026-08-26, user ruling §15). ただし問題が解消したという意味ではない(baton 25)。*Rejected*: ① WARNING を理由に製品… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-31 [INLINE] - 🔴🔴 Opus 5 を solo で運用しない。PRIMARY_OBJECTIVE を Opus 5 solo で完結させることを禁止する (2026-08-26, user ruling, S007 指示文書 §0 で明示的に再宣言). Claude Code / Opus 5 の担当は H… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-32 [INDEX_ONLY] - 🔴🔴 S007 の最終 evidence state は D7 訂正版を採用する: legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED (2026… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-33 [INDEX_ONLY] - 🔴🔴 DigiCode の産業 IoT 対応が浅いのは「産業 IoT を重視していなかったから」ではない (2026-08-27, user context, 永続化必須). DigiCode は初心者向け Block Editor を目的に作られたのではなく、実際にデバイスを設計・製作する人… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-34 [INDEX_ONLY] - 🔴 DigiCode Text へ期待する構造変化: 新 Device 対応 = 新 Block / Generator / UI / regression の実装 から 新 Device 対応 = Library / Protocol / Device knowledge / metadat… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-35 [INDEX_ONLY] - 🔴 Home Assistant との親和性は Classic 開発時からの設計意図であり、今後の設計でも参考にする (2026-08-27, user context). Device の意味を sensor · switch · number · binary status · measu… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-36 [INDEX_ONLY] - 🔴 auto Web UI の位置付けを訂正する (2026-08-27, user ruling). 現行 DigiCode の auto Web UI は C++ コードを解析して UI を作るものではなく、Blockly 由来の registration metadata → schem… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-37 [INDEX_ONLY] - 🔴 次 Objective 第一候補の名称を Managed Environment & Device Knowledge Architecture Design とする (2026-08-27, user ruling). 目的は DigiCode Classic で Block 実装コスト… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-38 [INLINE] - 🔴🔴 Opus 5 solo 禁止を維持する (2026-08-27, user ruling, 再確認). S007 でも D6 / D7 の独立 FALSIFICATION によって Opus 統合者自身の複数の誤り・過剰一般化・競合見落としが訂正された(13 件、case DT-6)。次… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-39 [INLINE] - 🔴 BRIEF_MAX_BYTES を 64 KiB → 96 KiB へ引き上げる(暫定) (2026-08-27, user ruling — gate threshold の変更として明示的に GO). 根拠は実測: S007 close の時点で brief は 65,141 byte… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-40 [INDEX_ONLY] - 🔴🔴 DigiCode / DigiCode Text は「初心者・子供向け・教育・簡単」を主ターゲットにしていない (2026-08-27, user ruling §8). 主に想定するのは、それなりの専門領域を持つ人にとっての「組み込み / IoT 初心者」である: 企業の技術者・社員… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-41 [INDEX_ONLY] - 🔴🔴 「簡単」とは機能を削ることではない (2026-08-27, user ruling §9). 意図は、実用 IoT / device development に必要な能力を保ったまま、その複雑さを環境・AI・managed knowledge によって隠し、専門外の人でも実用品まで到達… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-42 [INDEX_ONLY] - 🔴 小中高・プログラミング教室は「主戦場ではないが、利用できることを否定しない」 (2026-08-27, user ruling §10). Classic は Blockly · 視覚的操作 · AI · 簡単な sensor 利用によりその用途にも使えた。Text 版でも worksho… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-43 [INLINE] - 🔴🔴 BRIEF_MAX_BYTES を 96 KiB → 128 KiB へ上げる。これは bridge であり、この種の最後の一回である (2026-08-27, user ruling, gate threshold 変更として明示的に GO). 目的は S008 の統合反証修正を gr… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-44 [INLINE] - 🔴 context brief の恒久解は別 Objective で扱う — Task-Scoped Context Brief / Read Architecture Maintenance (2026-08-27, user ruling). 問いは 「repo access を持たない… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-45 [INLINE] - 🔴 task-scoped export をその場で実装しない (2026-08-27, user ruling). S008 の Lane B が測定したとおり、task→owner 分類器 · wrong-owner control · no-owner control は現時点で 1 つ… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-46 [INLINE] - 🔴 READ_ALLOWANCE / REVIEW_REQUIRED threshold を勝手に上げない (2026-08-27, user ruling). S008 は topic split 側を実施したが、model roster を明示し context window から rea… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-47 [INLINE] - 🔴 baton 43(Opus 5 effort mismatch)は未解決として維持する。今回は設定を変更しない (2026-08-27, user ruling). declared / expected = xhigh、effective transcript = medium が S0… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-48 [INLINE] - 🔴🔴 Orchestration の新運用方針 — Adaptive fan-out。次 objective / session から適用する (2026-08-27, user directive). 固定の最大 fan-out ではなく適応的に決める: 最初は必要最小限の 1〜3 inde… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
