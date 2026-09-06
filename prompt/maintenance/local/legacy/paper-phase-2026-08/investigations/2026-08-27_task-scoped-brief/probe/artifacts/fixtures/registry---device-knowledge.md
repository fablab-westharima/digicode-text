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
GENERATED_AT_UTC: 2026-08-26T18:44:23.639255+00:00
GEN: S008-close
GEN_ROUTER: S008-close
GEN_BATONS: S008-close
GEN_EVIDENCE_MAP: S008-close
STATUS: ROUTED
ROUTE: PRODUCT_ARCH
ROUTE_REASON: deterministic keyword match: PRODUCT_ARCH

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
SELECTED_NON_CORE_COUNT: 63

### B-02 — owner `prompt/maintenance/local/handover/batons.md`
**Compatibility / acceptance matrix** — which DigiCode features, boards, devices and compile tests digicode-text must reach. Risk-based, never count-based: Classic's principle 「動くはず」ではなく「実際に動かして確認する」 and its failure corpus are inherited as a risk source; the 1000+1000 counts are not. **S005 が足した問い: 「何件を保証するか」は未定義であり、保証範囲の広さは価値ではなく負債である。S006 が足した訂正: donor の QA 実装は 5 戦略ではなく 6 戦略・52 files・別配分で、README・CLI help・実装が三者不一致 — 件数を継承しない裁定はむしろ補強される** | OPEN | its input exists (S001–S003, S005, S006); the user opens it as an objective | User | 🔴

### B-03 — owner `prompt/maintenance/local/handover/batons.md`
**Technology stack and deployment target** — Web application is settled; **2026-08-26 ruling adds: Monaco 第一候補 / shared Frontend から Desktop も作れる architecture を第一方針で検討 / Desktop target は Windows・macOS・Ubuntu**. The concrete framework and adapter architecture are **still open** | OPEN | the user opens it as an objective | User | 🔴

### B-06 — owner `prompt/maintenance/local/handover/batons.md`
**`scripts/spec-boundary-terms.txt` is empty** — the fork-neutrality check therefore guards only the mechanism. **The trigger has fired**: S001–S003 surfaced the real domain vocabulary (board ids, `fragments`, `FlashMethod`, NimBLEOta, `lib_deps`, FQBN, compile_commands, …). Fill it from the evidence, not from guesses | OPEN | next time anyone edits this repository's product-facing text | Harness | 🟢

### B-13 — owner `prompt/maintenance/local/handover/batons.md`
**Browser support matrix is not fixed** — Chromium (Chrome / Edge) is the initial priority; Safari need not work initially, Firefox is not a priority. Measured: Safari has **neither Web Serial nor Web Bluetooth**, File System Access API is Chromium-only while OPFS works in all three. **S003 adds: `Document-Isolation-Policy` は Safari が Negative / Firefox が Positive。S005 adds: ChromeOS / Chromebook の Web Serial 実挙動は `NOT OBTAINED`。🔴 S006 が訂正: 「Firefox 151+ は Web Serial 対応」は無条件では成立しない** — 条件と Chrome for Android の限定は一次情報つきで `orchestration-re-audit/07_primary-sources.md` S10 が owner | OPEN | the architecture objective opens | User | 🟡

### B-14 — owner `prompt/maintenance/local/handover/batons.md`
**Third-party material placement — proposal delivered, decision pending.** Four options compared in `investigations/2026-08-26_donor-audit/10_…md` §B; the recommendation is a repo-external sibling directory (`.gitignore` is a single line standing between third-party teaching material and a public repository, and `local/sample/` is **not** one of the eight permitted rule-15 categories) | OPEN | the user picks an option | User | 🟡

### B-15 — owner `prompt/maintenance/local/handover/batons.md`
**Third-party licence discipline applies at adoption, not at release** — for OSS this company does not own, read the actual licence text at formal adoption, never inferring from a name or a reputation. Which licences have been raised to primary source is recorded in `investigations/2026-08-26_editor-lsp-spike/02_oss-landscape.md` §6. **S005 adds: offline / Desktop pack として *再配布* するなら、読む義務はさらに強くなる。S006 adds: VS Code Marketplace ToU 2025-09 §2.b は「In-Scope Products and Services 以外の製品・サービスへの import/install/use」を明確に禁じている** — 一次情報は `orchestration-re-audit/07_…md` S1 | OPEN | fires at every adoption decision | Harness | 🟡

### B-16 — owner `prompt/maintenance/local/handover/batons.md`
**The planning documents cannot be committed as they stand** — the 2026-08-26 documents contain a real employer name from the user's work history and a named company whose staff are described failing at a course. This repository is PUBLIC and its defence is content discipline, not redaction. Originals stay outside git; only a de-identified version could enter, if the user wants one in-repo at all | OPEN | the user decides whether a de-identified planning document belongs in `local/plans/` | User | 🔴

### B-18 — owner `prompt/maintenance/local/handover/batons.md`
**A licence marking is not a portability verdict.** The rule, its five separated questions and why the conservative error survived review are owned by **case DT-1**; the ruling itself is in §3. This row exists only to keep the trigger alive | OPEN | fires at every portability or adoption question | User (rights) / Harness (procedure) | 🔴

### B-21 — owner `prompt/maintenance/local/handover/batons.md`
**The Text Compiler's architecture is undecided — the 2026-08-26 ruling settled a direction, not a design.** The enumeration of what is *not* settled is the **Boundary** clause of that ruling in §3. **S006 が足した設計入力 4 件**(result cache に eviction / TTL / 容量上限が無い · SCons shared-cache race の one-shot retry が存在する · compile API は raw stderr を返し structured parser は QA 側にある · container 実効 timeout は code fallback の値ではない)**は `orchestration-re-audit/03_donor-reverify.md` §3–§4 が owner** | OPEN | the user opens an architecture objective | User | 🔴

### B-22 — owner `prompt/maintenance/local/handover/batons.md`
**`gin66/FastAccelStepper@^0.32` no longer resolves — a donor-side maintenance issue that digicode-text must NOT fix.** Its use here is as **failure evidence**. **🔴 S006 注記: 現在の registry 解決不能は独立確認できていない** — `^0.32` / `^0.34` 両 arm とも network 不通で `HTTPClientError` RC=1 となり、**version 不在と通信不能を分離できなかった**。反証も得ていない | DEFERRED | the user opens a donor-side objective | User | 🟡

### B-26 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **The S003 probe code is not a production implementation either.** The Helper (`scratchpad`, not in git), the Monaco/CodeMirror probe apps and the LSP bridge exist only to reproduce measurements. The probe Helper has **a hardcoded origin allowlist, a token handed out over an unauthenticated endpoint, no version negotiation, no autostart, no installer and no signing** | OPEN | fires whenever anyone reaches for the S003 probe code as a starting point | Harness | 🟡

### B-27 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **Local Helper は技術的成立済みだが正式採否は保留** (2026-08-26 ruling §10). **S005 が足した観察: Desktop 版が成立すると Helper の対象は「Web 版利用者のうち、インストールでき、かつ高度解析が要る人」という二重に絞られた集合になる。S006 が足した訂正: 「LNA permission は 1 回で済む」は programmatic grant で測っており、実 prompt も再起動後の永続性も測っていない**(baton 40) | OPEN | the Web / Desktop architecture objective opens | User | 🔴

### B-28 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **Board / Library bundle の境界が未決**(2026-08-26 ruling §14)。検討対象は installer 同梱 / optional component / offline pack / versioned pack。**installer を無制限に肥大化させることも目的ではない**。実測入力は `investigations/2026-08-26_local-helper-feasibility/05_…md` が owner。**baton 34 と対で読む。🔴 S006 注記: board pack の実サイズは pack / manifest が保存されておらず再現不能(baton 40)** | OPEN | the Desktop architecture objective opens | User | 🔴

### B-29 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **「LSP なしで何ができるか」を architecture 設計時に明示する** (2026-08-26 ruling §13). 候補: syntax highlight · file tree · tabs · project-wide text search · compile diagnostics · compile error → file/line · AI project analysis · AI error repair · AI multi-file editing · Board/Device/Library knowledge · samples · Serial · write。**AI や project search が LSP の一部 navigation / analysis をどこまで補えるかも評価する。ただし AI を LSP の完全代替だと事前に決めつけない** | OPEN | the architecture objective opens | User | 🔴

### B-30 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **教室 Local LSP Server は将来候補として維持** (2026-08-26 ruling §12). **🔴 S006 注記: 「50 人なら 32 GB 級 PC 1 台」という外挿は H8 の RSS 合計 proxy を継承しており、baton 40 の再測定が済むまで数値として使えない**(元の実測は S003b が owner)。当日の運用負担と single point of failure があるため正式方式にはしない | DEFERRED | the user opens it | User | 🟡

### B-31 — owner `prompt/maintenance/local/handover/batons.md`
🟢 **Chrome / Edge の enterprise policy で Local Network Access 許可を一括付与できるか — 🟡→🟢: S006 が一次情報で確認し格上げした。** `LocalNetworkAccessAllowedForUrls` は Chromium の policy 定義 YAML(一次定義元)と Microsoft Learn の双方に実在する。**対応バージョン・値形式・iOS 非対応・GP path は `orchestration-re-audit/07_primary-sources.md` S9 が owner。****🔴 実配布して許可が付く実挙動は依然 未verify** | OPEN | 実配布確認は、Helper を含む architecture option が採られる時点で | User (opens it) / Harness (measures) | 🟢

### B-32 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **利用者ライブラリ (`lib_deps`) 追加時のヘッダ供給が未解決。** board pack だけでは足りない。Helper 方式でも Desktop 版でも同じ問題が立つ。**S005 が足した射程: これは Verified / Custom 二層構造(§3)の Custom 側そのものであり、Registry 設計と同じ問題である。S006 が足した参照: ESP-IDF の Partial Mirror が「開発者に利用可能なバージョンを制限する」公式機構として先行実装されている**(`07_…md` S11) | OPEN | a local-semantic-analysis option is chosen / the Registry objective opens | User | 🟡

### B-33 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **donor DigiCode-Finder の PNA 実装が Chrome 142+ では不十分な可能性。** donor は `Access-Control-Allow-Private-Network` ヘッダのみで対応しており、S003b の実測では同じヘッダを返す Helper が未許可でブロックされた。**DigiCode Finder の実挙動は測っていない**。**本 repo は donor を変更しない** | DEFERRED | the user opens a donor-side objective | User | 🟡

### B-34 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **Desktop 版の価値は「Compiler がローカルかクラウドか」で二分され、両者は別製品である。** クラウド Compiler なら installer は小さいが **offline にはならない**。ローカル Compiler なら offline になるが **GB 級**(ESP32 core 一式 5.3 GB — S003b 実測)。**分けずに設計へ入ると事故的に着地する。** 分析は `product-value-revalidation/05_…md` §2-2 が owner | OPEN | the Desktop architecture objective opens — **baton 28 より前に裁定される必要がある** | User | 🔴

### B-35 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **AI = 主機能という裁定と、企業イントラが最有効セグメントであることが衝突しうる。** package manager を遮断する環境は **LLM API エンドポイントも遮断しうる**(inferred、実測は `NOT OBTAINED`)。**緩和手段は donor に既にある** — provider 抽象の `custom` endpoint と Local LLM のヘルプページ(S006 が donor source で独立確認済み)。**しかし設計として明示的に扱われたことがない** | OPEN | the architecture objective opens, or a customer-facing 企業向け提案を書く時点 | User | 🔴

### B-36 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **debugger の不在が未議論。** Classic は Blockly だったので概念が無かったが、Text は「通常のテキストコードを書く」製品であり、**熟練者ほど debugger の不在を欠落として感じる**。PlatformIO には Debug がある。**対象外とするなら明示的に対象外と書く** | OPEN | the product specification / 企画書 が書かれる時点 | User | 🟡

### B-37 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **直接競合は 1 つではなく、少なくとも 2 つ実在する。** **Codey Online**(蘭 OTRONIC)と、**🔴 S006 が発見した 2 つ目 — PleaseDontCode**(伊 ITALCODY)。**S005 の調査に PleaseDontCode は一度も登場しない。** 両者の機能・料金・無料枠は一次情報つきで `orchestration-re-audit/07_primary-sources.md` S7 / S12 が owner。🔴 **両製品とも実利用は 0**(`NOT OBTAINED`)。**S007 が母集団を 48 行へ拡張し(直接 6 / 部分 11 / 隣接 25 / 代替 6)、最近接は Codey でも PDC でもなく `Arduino Cloud AI Assistant` であることを確定した — baton 45。** 母集団と探索ログの owner は `practical-iot-revalidation/04_…md` + `04b_…md` | OPEN | 競合実査 objective を開くか、企画書を改訂する時点 | User | 🔴

### B-38 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **S005 §1/§2/§3 の裁定を支えた evidence が反証された。再裁定要否は Human のもの。** Go 根拠 #1「権限ゼロの PC で書き込みまで成立する選択肢が他に存在しない」は、**同じ調査の `02_existing-environments-2026.md:100-113` に自ら書いた Codey の記述に否定されている**(両方とも `primary source` ラベル)。さらに PleaseDontCode が存在する。**中核価値の主張が誤りだとは言っていない — 経験的根拠が無いと言っている。** 分離表(ruling / original / corrected / impact / 再裁定)は `orchestration-re-audit/08_conclusion-and-next.md` §3 が owner。case **DT-4**。**🔴 S007 が根拠の差し替え候補を供給した** — 「競合不在」ではなく **①AI 組み込みコード生成の *コンパイル失敗* 最頻原因が存在しないライブラリ参照であるという第三者実測 ②Particle が同種機構を商用で維持している事実**。**ただし差し替え先も同じ強度では立たない**(baton 47 / 48)。分離表は `practical-iot-revalidation/08_…md` §G-2 が owner | OPEN | 🔴 **Human が ②-A(裁定維持・根拠差し替え)/ ②-B(裁定を再検討)/ ②-C(維持し限界を明記)を選ぶとき** | User | 🔴

### B-39 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **Registry を「次の中核」とする順位付けの根拠が無い(P8 反証)。ただし Registry の設計対象そのものを支える証拠はむしろ強くなった。** 崩れたのは「Registry が製品の中核的差別化であり、ゆえに *次に* 設計すべきだ」という順序であって、必要性ではない。**支持された根拠**: Board が frontend 16 / compiler 10 の手書き二重正本で **Device⇔Library registry は 69/69 走査して本当に不在**(A4)· global `lib_deps` が未使用依存まで解決対象にする構造を**隔離環境で独立再現**(V7)。**同じ成果物でも、何の証拠に立って始めるかで安全性が変わる** — `orchestration-re-audit/08_…md` §4。**🔴 S007 が立つべき根拠を 3 点に更新した**(学術実測 + Particle の先行実装 + Viam の課金モデル)。**さらに Human が objective 名を `Managed Environment & Device Knowledge Architecture Design` へ更新した(§1 / §3)** | OPEN | the Registry objective opens — **開始時にどちらの根拠に立つかを宣言すること** | User | 🔴

### B-40 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **positive control 付きで測り直す必要がある器材が 9 件ある。** 最重要は **H8 server-side memory** — 計器が `ps -o rss` を**プロセス間で合計**しており、合計 RSS は**共有ページを重複計上する**ため「共有の恩恵は無い」という主張そのものを測定できず、課金対象の物理 RAM でもない(誤差方向は server-side を**悪く**見せる)。他 8 件(E1 startup / H6 偽診断の分母 / H2 permission / H10 署名 UX / V3 absence の個別 control / V4 known-bad control / V8 registry / V10a image cost)と、それぞれ何を測り直すかは `orchestration-re-audit/08_…md` §6-1 が owner | OPEN | 該当 architecture objective が開くか、Human が器材再測定 objective を指定したとき | User (opens) / Harness (measures) | 🔴

### B-45 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **`Arduino Cloud AI Assistant`(2025-04)が未監査のまま、DigiCode Text 構想に最も近い競合候補である。** Cloud Editor 内で board / project コンテキスト · sketch 生成 · **コンパイルエラー修正** · **Arduino 側で整備された documentation / libraries / examples の参照**を行う。**破れていないのは ①AI と compiler が同じ versioned registry を読むこと ②tested version 組合せの公開 の 2 点のみ。**統合が当初これを機能表から落としていた経緯は case **DT-6** | OPEN | 次 objective が開くとき、または競合実査 objective のとき。**最優先の監査対象** | User (opens) / Harness (measures) | 🔴

### B-47 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **Particle は「巨大な全ライブラリ保証環境」ではない。** 実測 `verified:true` は **10/972 = 1.03%**(official 5 を足しても 1.54%)。**機構(version×device 表 · verified 定義 · 依存 exact version · browser compiler)の実在は参考価値が高いが、それは需要の存在証明ではない。**coding AI の公開証拠も無い(docs 2,398 URL + marketing 937 URL + 公開 repo 9,216 path を走査して 0)。更新頻度 · 再検証 trigger · 失効ポリシーは未取得 | OPEN | 次 objective が Particle を参考実装として開くとき | Harness (measures) | 🔴

### B-48 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **学術実測の射程を広げない。** 支持されたのは **「AI 組み込みコード生成の *コンパイル失敗* の最頻原因が、存在しないライブラリ参照と誤った API 使用であること」**まで。**論文はシナリオ 6/7 のエラーを「source code の機能不備・通信関数の誤用・cloud 設定規則の不備であり、*不適切なライブラリ選択ではない*」と明記しており、複雑度崩壊をライブラリ問題へ一般化してはならない。**さらに **zero-shot のみを測っており、Managed Registry という解法は試験されていない** | OPEN | 学術証拠を裁定の根拠として引くたびに | Harness | 🔴

### B-50 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **auto Web UI は「C++ を解析して UI を作る機能」ではない。** 実態は **Blockly 由来の registration metadata → schema → widget / transport** であり、**Text 版では入力アダプタを新設する必要がある**(2026-08-27 Human 裁定、§3)。**中核資産 `registration records → schema → renderer → transport / packaging` は再利用候補として維持する。**置換候補の評価(manifest = 高忠実 / annotation = 意味的に最近接 / compile metadata = backend 契約変更が必要 / AST = 制約付き API 前提)は `practical-iot-revalidation/02_…md` §5 が owner | OPEN | architecture / device knowledge objective が開くとき | User (opens) / Harness (design input) | 🔴

### B-51 — owner `prompt/maintenance/local/handover/batons.md`
🔴 **「Device knowledge を追加すれば対応範囲が増える」は Human の期待であって実証済み product value ではない**(2026-08-27 Human 指示 §5 / §6、§3 に裁定として記録)。**次 architecture 設計で検証すべき最重要の design expectation。**schema は確定しない。想定形(Device / Electrical Interface / Protocol / Registers{address, function, type, scale, unit, access, bit, semantic})の例示は Human 指示文書が owner | OPEN | `Managed Environment & Device Knowledge Architecture Design` が開くとき | User | 🔴

### B-54 — owner `prompt/maintenance/local/handover/batons.md`
🟡 **current truth の損失検出は一様ではない。どの機構が何を捕まえるかは 2026-08-27 S008 の独立レーンが 6 mutation で実測した**(`investigations/2026-08-27_handover-architecture/04_cold-start-reconstruction.md` §C)。**6/6 は検出されたが、どの単独機構も 6/6 は捕まえていない**: ① §3 の Human ruling 1 本の削除 → `handover-diff` が GONE(1) で捕捉、**selftest は 78/78 のまま素通り** ② router の baton stub 削除(本文は残存)→ **B71 が捕捉、`handover-diff` は GONE 0**(残った本文が union の entry を維持するため)③ 本文削除(stub 残存)→ B71 と handover-diff の双方 ④ GEN drift → B70 ⑤ hook manifest の path 破壊 → B70 ⑥ router を 200 行へ切詰 → **B69 は green のまま**(ディスク側が切れていれば注入も切れて「一致」する)、B55(9→7/9)と B58(8→7/8)が捕捉、**`handover-diff` は GONE 0** — その union は §2/§3 のみで **§5 baseline の消失を覆わない**。**したがって「gate が green だから current truth は無傷」とは書けない。****🔴 2026-08-27 の統合反証レーンがさらに 4 件の盲点を実証**(いずれも throwaway copy で mutation を実行し、対象 check が green のまま通過することを確認): ⑦ `settings.json` の SessionStart を別 script へ差し替えても B69 は green だった(**修正済み** — B69 が登録先を検査するようになり、mutation で RC=1 を実証)⑧ hook の manifest tuple を comment out しても path 文字列がコメントに残れば B70 は green(predicate が substring 照合であるため。**未修正**)⑨ baton 44 の Human-GO 禁止文を `See baton 44.` に置換しても B71 は green(ID 集合しか見ないため。**stub の意味的十分性を測る executable guard は存在しない** — 人間かレーンの査読が唯一の手段)⑩ **`mode none` owner(`evidence-map.md`)の行を削除しても `handover-diff` は GONE 0**(その owner は §2/§3 entry を持たないため走査対象が空。file 全欠落は exit 2 で捕まるが、**部分欠落は不可視**。donor SHA · 外部一次資料の所在 · evidence 読解順序 · feedback queue が該当する)§1/§4/§5 に相当する current truth を新設するときは、その section を覆う検出器が存在するかを先に確認すること | OPEN | 🟡 単一 gate を「損失検出器」として引用しようとするとき、および §2/§3 以外に current-truth section を追加するとき | Harness | 🟡

### S3-05 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **The product specification, target scope, completion conditions and DigiCode compatibility range are provisional and settled after the donor audit** (2026-08-25, user ruling). *Rejected*: leaving §4 as `{{PLACEHOLDER}}`. *Supersedes*: none. **Partially settled 2026-08-26 (S005)**: the *core value* and the *one-sentence product definition* are now fixed (below). **Still provisional**: the detailed product specification, the target scope, the completion conditions and the DigiCode compatibility range (baton 2 / 3).

### S3-07 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **AI is a primary feature of digicode-text and ships from the start** (2026-08-26, user ruling): investigation covers *how* the donor implements AI — **never whether AI belongs in the product**. *Rejected*: keeping the template-derived provisional out-of-scope line. *Supersedes*: the 2026-08-25 provisional §4 out-of-scope clause (that clause only).

### S3-09 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **A licence marking is not a portability verdict** (2026-08-26, user ruling, correcting this repository's own error): `PROPRIETARY = 移植不可` as a mechanical rule is forbidden. Third-party OSS is unchanged: read the actual licence text at adoption. *Rejected*: this session's original conclusion (case **DT-1**). *Supersedes*: that conclusion, corrected in place.

### S3-10 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 digicode-text has its own dedicated Compiler; riding Classic's running Compiler is off the first-candidate list** (2026-08-26, user ruling on top of accepting the S002 probe). Grounds, as the user gave them: Classic's global `lib_deps` structure has caused whole-matrix regressions · part of Classic's dependency set is already unobtainable in a fresh environment · a shared dependency universe fits badly with adding Boards / Libraries lightly on the Text side · the shared build cache's real benefit is small · the Text full-source / multi-file path is a small additive implementation · the Text side wants to keep up with new Boards / Libraries / platforms. **What this does NOT mean**: it is not 「DigiCode Compiler の資産を捨てて全部一から作る」. Donor technique is reused **actively** — PlatformIO build orchestration · pioarduino knowledge · Board/FQBN mapping · artifact 生成 · binary packaging · error parsing · file/line semantics · cache · queue · workspace management · Docker 構成 · compile result API · failure handling · regression / compile test infrastructure. **NOT carried over**: the Blockly fragment contract · fixed template injection · the `includes/globals/setupCode/loopCode` premise · the single `src/main.ino` premise · a global `lib_deps` effective across everything · a Board registry coupled to the Classic UI · editing configuration directly on the Classic production server. *Rejected*: ① Option A (maximal sharing) ② riding Classic's production Worker ③ 「共用しないとキャッシュを失うので不利」. *Supersedes*: the S001 position that Compiler Shared / Separate was undecided. **Boundary**: architecture / toolchain / Docker / Worker / registry schemas / resolver / cleanup / rate limit / RP2040 are **NOT settled** (baton 21). **🔴 S006 訂正(裁定は維持)**: 却下理由 ③ の「測定で refuted」は**強すぎた**(順序反転を含む独立再測定 — `orchestration-re-audit/04_…md` §2 が owner)。**ただし中核根拠 V7(global `lib_deps` が未使用依存まで解決対象)は隔離環境で独立再現され、裁定は無傷**。RP2040 削除理由も単一の Compiler 原因ではなく製品方針転換と user 判断を含む(`orchestration-re-audit/04_…md` §7 / `03_…md` §3)。

### S3-11 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 AI = 主機能、LSP = 高度なコード編集支援。LSP は digicode-text を成立させる必須機能ではない** (2026-08-26, user ruling §1). **🔴 したがって「LSP なしの Web 版」を「機能不足版」と定義してはならない。** *Rejected*: LSP を成立条件に据える設計、および LSP 非搭載構成を欠損として記述すること。*Supersedes*: none。

### S3-12 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Web 版が主製品。Helper や LSP が無くても Web 版自体が完成した製品として利用できることを基本原則とする** (2026-08-26, user ruling §2). 最重要価値は **「Chrome / Edge を開くだけで利用でき、ユーザ PC へ複雑な MCU 開発環境を構築する必要がないこと」**。*Rejected*: Web 版を Helper 前提・LSP 前提にする設計。*Supersedes*: none.

### S3-13 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 server-side LSP を Web 版の必須 backend にしない** (2026-08-26, user ruling §11). **digicode-text は基本無料が前提**であるため、**利用者が増えるほど LSP 費用が比例して増える構造を初期必須要件にしない**。optional service / 将来サービス / 教室 Local Server として残すことは可能。*Rejected*: server-side LSP を Web 版の必須 backend に据える構成。*Supersedes*: none。**🔴 S006 訂正(裁定は維持)**: 根拠となった per-session メモリ数値は、計器が `ps -o rss` をプロセス間で合計しており、**主張した次元(共有ページの恩恵の不在)を測定できていない**(baton 40、分析は `orchestration-re-audit/05_…md` §5 が owner)。**裁定自体は「基本無料が前提」という測定に依存しない事業判断も含むため維持されるが、費用の根拠は未確定である。**

### S3-14 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Monaco Editor を第一候補とする(多少重くても)** (2026-08-26, user ruling §3). **production Monaco を実装するという意味ではなく、正式 architecture で確定するまでの第一候補**。*Rejected*: サイズと起動時間だけを根拠に CodeMirror 6 を既定にすること。*Supersedes*: none. **S006 注記**: bundle 比は独立再現された。**startup 比は n=1 で cold/warm・順序 control が無く、再現性未確認**(baton 40)。

### S3-15 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 内部標準 = `main.cpp`。Arduino `.ino` = import 可能。`.ino` を内部標準にすることは第一候補から外す** (2026-08-26, user ruling §4). **Arduino ecosystem 互換は重要なので、`.ino` を読み込んだら内部の `main.cpp` project へ変換する方向を今後検討する。変換仕様そのものは別 Objective**。*Rejected*: `.ino` を内部標準に据える案。*Supersedes*: baton 23。**S006 注記**: `.ino` が素の clangd で不可であることは **`clangd --check` RC=3 + diff で独立再現された**。ALS の find references は「未実装」ではなく「**非広告・caller から利用不能**」が正確。

### S3-16 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Desktop 版を正式に視野へ入れる。Web 版を主製品として維持しつつ、同じ Frontend から Desktop 版も作れる architecture を第一方針として検討する** (2026-08-26, user ruling §5–§7、Product Value 受理 §4 で維持を再確認). **Desktop 版を今すぐ実装するという意味ではない。** 重要なのは **Web ブラウザでしか成立しない構造へ Frontend 全体を固定しないこと**。環境依存機能は adapter / service boundary で分離。*Rejected*: Web 版のみに限定する方針、および Frontend をブラウザ専用構造に固定すること。*Supersedes*: none. **Boundary(S005)**: この裁定は Desktop の *価値* を定めるが **Compiler をローカルに置くか否かは定めていない** — baton 34。**🔴 S006 注記**: Desktop 価値の根拠の一部(「既存 IDE の offline bundle は製品として配布できない」)は**読み方によって真偽が反転する** — 自社製品への同梱は Marketplace ToU §2.b が禁止側だが、**顧客 IT 側の re-hosting / air-gapped は MS が公式サポートしている**(baton 38 / `orchestration-re-audit/07_…md` S1–S2)。

### S3-17 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Desktop 版の初期 target は Windows / macOS / Linux(まず Ubuntu)。開発初期は署名・認証を必須にしない** (2026-08-26, user ruling §8). **正式配布段階では Windows code signing / macOS Developer ID / notarization を検討する。** *Rejected*: 開発初期から署名を必須要件にすること。*Supersedes*: none. **🔴 S006 訂正**: 「実測で導入手順の許可回数が macOS 3→1 / Windows 4→1 に変わる」は **installer を一度も build しておらず実測値として扱えない**。Windows は署名後も SmartScreen reputation が必要と同じ文書にある。**裁定自体には影響しない。**

### S3-18 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Desktop 版では高度 LSP を標準搭載する方向が有力(ただし現時点では正式決定しない)** (2026-08-26, user ruling §9). *Rejected*: 現時点で正式決定すること。*Supersedes*: none.

### S3-19 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Local Helper は技術的成立を確認済み。正式採用は未決定。Desktop 版との役割重複を後続 architecture で評価する** (2026-08-26, user ruling §10 / §16). **これらは Local Helper の正式採用を意味しない。** *Rejected*: 成立実証をもって採用と読むこと。*Supersedes*: none. **🔴 S006 注記**: 防御モデル(Origin + token + loopback bind)は **source で独立確認された**。**Helper なし fallback の最終 fixture は実際に Helper を停止し、停止していなければ `exit(2)` で中断する構造であることを確認**(Human が名指しした懸念は器材側では解消)。ただし記録値がその最終版の同一 run から出たことを結ぶ raw artifact が無い。「偽 diagnostic 0 件」の**分母は project 全体ではない**(実測分母は `orchestration-re-audit/05_…md` §4 が owner、baton 40)。

### S3-21 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 製品の中核価値が確定した。DigiCode Text の存在意義は「Web で使える Arduino/C++ Editor を作ること」でも「VS Code より高機能な Editor を作ること」でも「AI でコードを書けること自体」でもない** (2026-08-26, user ruling §1). **中核価値は、検証済みの MCU 開発環境(Board・Toolchain・Framework・Device/Sensor Library・Dependency・Version・Compatibility)を DigiCode 側で継続的に管理し、その同じ正本を Compiler と AI が利用すること**であり、その結果として **利用者自身に Board Manager / Library Manager / Package Manager / GitHub 等から環境を構築・更新させないこと**に価値がある。**この方向を今後の設計判断における主要評価軸とする。** *Rejected*: ① Editor の機能競争を存在意義に据えること ② 「Web IDE」「AI IDE」「Library Manager」という単体機能で唯一性を主張すること。*Supersedes*: 企画書段階の「Web 版 Arduino Editor」という製品説明。**🔴🔴 S006: この裁定を支えた evidence が反証された — baton 38。裁定は Human のものであり、harness は覆さない。**

### S3-22 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 製品定義の 1 文(今後の基準)** (2026-08-26, user ruling §2): **「DigiCode Text は、検証済みのマイコン開発環境(Board・Toolchain・Library・Dependency)を利用者自身に構築させずに提供し、その同じ管理済み環境を Compiler と AI が共有して利用する MCU 開発環境である。」** *Rejected*: 機能列挙型の製品説明。*Supersedes*: none.

### S3-23 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Web 版の重要価値は「ブラウザ Editor であること」ではなく「利用者 PC へ MCU 開発環境を構築させないこと」である** (2026-08-26, user ruling §3). 特に **学校 · FS 講座等の研修 · 企業イントラ · 管理者権限の弱い PC · 一時利用 PC · ワークショップ** での価値を重視する。*Rejected*: Web 版の価値を Editor 体験として説明すること。*Supersedes*: none。**🔴 S006: baton 38 — 「権限ゼロの PC で書込まで成立する選択肢が他に存在しない」は Codey / PleaseDontCode により成立しない。**

### S3-24 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Block 製品分担: DigiCode Classic = Block を必要とする層向け / DigiCode Text = AI + Text + 管理済み MCU 環境** (2026-08-26, user ruling §5). Classic は既存成果物として維持し、**Text へ Blockly を戻さない**。*Rejected*: Text へ Blockly を戻す方向。*Supersedes*: none。**S006 注記**: 「結合 6 ファイル」は direct-import の尺度であり、blocks 外の意味的 surface は 64 files。**移植工数評価には影響するが製品分担裁定には直結しない。**

### S3-25 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 次に設計すべき中核は Managed Environment Registry である** (2026-08-26, user ruling §6 / §11). **Registry を単なる「対応 Board 一覧 / 対応 Library 一覧」にしない** — 目標は **Compiler・AI・UI・Desktop pack・QA 等が参照する共通の Source of Truth**。**具体 architecture は次 Objective で設計する。** *Rejected*: Registry を一覧表として実装すること。*Supersedes*: none。**🔴🔴 S006: 「次に」という順位付けの根拠(P8)が反証された — baton 39。ただし Registry の設計対象そのものを支える証拠(A4 / V7)は独立検査を通過しており、むしろ強くなった。**

### S3-26 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Verified / Custom の二層構造を Registry 設計の有力候補とする** (2026-08-26, user ruling §7 / §12). **🔴 管理外 Library を禁止する closed ecosystem にはしない**。ただし **Verified / Custom / Experimental / Unsupported の状態を混同せず、その保証レベルが利用者にも AI にも Compiler にも分かる構造**が必要。*Rejected*: ① 完全 closed ecosystem ② Verified と Custom を同じ強度で提示すること。*Supersedes*: none。**S006 参照**: ESP-IDF の **Partial Mirror** が「開発者に利用可能なバージョンを制限する」公式機構として先行実装されている(baton 32)。

### S3-27 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 理想は Custom から Verified への昇格経路を持つこと** (2026-08-26, user ruling §8). 概念的な流れ: 候補発見 → metadata 取得 → source 確認 → license 確認 → dependency 解析 → compatible Board 確認 → isolated compile → representative sample → selected regression → risk 評価 → **Human review** → Verified 昇格。*Rejected*: 昇格を自動化して Human review を省くこと。*Supersedes*: none。**S006 参照**: donor の **canonical-sample / host-compile probes** がこの経路へ直接転用できる既存資産である(`orchestration-re-audit/03_…md` §4-2)。

### S3-28 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 Registry 管理を人力前提にしない。AI を管理・調査・QA 補助へ最大限活用することを前提候補とする** (2026-08-26, user ruling §9 / §13). **🔴 ただし AI の自己申告だけを acceptance evidence にしない。最終的な保証は従来どおり実 compile / 必要なら実機 / evidence を基準とする。** *Rejected*: ① 人力運用を前提にした Registry 設計 ② AI の報告を evidence として受理すること。*Supersedes*: none.

### S3-29 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 「全組み合わせ保証」へ戻らない。risk-based compatibility / regression を維持する** (2026-08-26, user ruling §10). **件数を目的化しない。** *Rejected*: 件数ベースの網羅保証。*Supersedes*: none。**S006 注記**: donor の QA 実装は 6 戦略・52 files・別配分で README と不一致 — **この裁定をむしろ補強する。**

### S3-30 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🟡 現在の read-load `BUDGET_STATUS = WARNING` を、既知の作業状態として受容する** (2026-08-26, user ruling §15). **ただし問題が解消したという意味ではない**(baton 25)。*Rejected*: ① WARNING を理由に製品 objective の close を差し戻すこと ② WARNING を解消済みとして baton を落とすこと。*Supersedes*: baton 25 の 🔴 severity。

### S3-32 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 S007 の最終 evidence state は D7 訂正版を採用する: `legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED`** (2026-08-27, user ruling). 具体的には ①「競合がいないから価値がある」は成立しない ②「無料だから勝てる」は成立しない ③「自動 Web UI が独自だから価値がある」は成立しない ④「ブラウザだけで完結すること自体が唯一性」は成立しない ⑤ 現行 DigiCode の産業 IoT 対応深度は十分とは言えない ⑥ **AI による embedded code 生成で library hallucination / 誤 API が実在する問題であることは支持された** ⑦ **Managed / Verified 環境という機構の先行実装は存在する** ⑧ **ただし DigiCode Text が提案する解法・組合せの user value はまだ実証されていない**。*Rejected*: `PRODUCT VALUE PARTIALLY RESOLVED`(未測定の価値を肯定側に温存する hedge — case DT-6 E13)。*Supersedes*: 統合が当初出した `PARTIALLY RESOLVED`。

### S3-33 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 DigiCode の産業 IoT 対応が浅いのは「産業 IoT を重視していなかったから」ではない** (2026-08-27, user context, 永続化必須). **DigiCode は初心者向け Block Editor を目的に作られたのではなく、実際にデバイスを設計・製作する人を主な利用者として意識してきた。**その方向で **MQTT · Azure IoT · Home Assistant 連携 · HTTP · WebSocket · BLE · Wi-Fi · CAN · Modbus · Controller/UI** をかなり実装している。**実装が止まった本当の理由は、産業デバイス層へ進もうとした段階で Blockly 方式そのものの追加開発・保守コストが大きくなりすぎ、開発体力が尽きたことである。**Classic では Board / Device / Sensor / Protocol を 1 つ追加するだけで **Block 定義 · Generator · parameter UI · code synthesis · Board 差異 · Library dependency · AI catalog/context · sample · i18n · block 間組合せ · compatibility · regression · compile test** が連鎖する。*Rejected*: **「DigiCode は産業 IoT を目指していなかった」という解釈**(観測「産業 IoT に届かなかった」は正しいが、解釈は誤り)。*Supersedes*: none。

### S3-34 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 DigiCode Text へ期待する構造変化: `新 Device 対応 = 新 Block / Generator / UI / regression の実装` から `新 Device 対応 = Library / Protocol / Device knowledge / metadata の追加` へ移せるか** (2026-08-27, user ruling). **これは現時点で仮説であり、実証済み product value として扱わない。**ただし **次 architecture 設計で検証すべき非常に重要な Human objective / design expectation** として維持する(baton 51)。*Rejected*: この期待を実証済みの価値として扱うこと。*Supersedes*: none。

### S3-35 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 Home Assistant との親和性は Classic 開発時からの設計意図であり、今後の設計でも参考にする** (2026-08-27, user context). Device の意味を **sensor · switch · number · binary status · measurement · command · alarm · state · unit · read/write capability** として表現し、**同じ意味情報から AI · firmware · MQTT · Home Assistant · Web UI · Cloud telemetry へ展開できるか**を検討対象とする。*Rejected*: **Home Assistant 方式をそのまま DigiCode Text へコピーすること**(先行設計として参考にするという位置付けであり、採用ではない)。*Supersedes*: none。

### S3-36 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 auto Web UI の位置付けを訂正する** (2026-08-27, user ruling). 現行 DigiCode の auto Web UI は **C++ コードを解析して UI を作るものではなく、Blockly 由来の registration metadata → schema → widget / transport** である。したがって **Text 版では入力アダプタを新設する必要がある**。**中核資産 `registration records → schema → renderer → transport / packaging` は再利用候補として維持する。**また **auto Web UI が世界唯一ではないことも受理する** — 重要なのは独自性そのものではなく、**Device / protocol / project knowledge と AI を使って、IoT device から監視・操作 UI までを作る一連の workflow に統合できるか**である。*Rejected*: ①「コードを解析して UI を生成する機能」という説明 ② 独自性を価値の中心に据えること。*Supersedes*: S007 開始時の前提記述。

### S3-37 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 次 Objective 第一候補の名称を `Managed Environment & Device Knowledge Architecture Design` とする** (2026-08-27, user ruling). 目的は **DigiCode Classic で Block 実装コストに阻まれた Board / Library / Sensor / Industrial Device / Protocol 対応を、Text 版では data / knowledge-driven に拡張できる architecture へ変換できるかを設計すること**。想定検討対象: Platform · Board · Toolchain · Framework · Library · Dependency · Version · Device · Sensor · Actuator · Electrical Interface · Protocol · Register Map · Data Type · Endianness · Scaling · Unit · Access mode · Semantic capability · Backend relation · UI capability · Compatibility · Evidence · Verified/Custom · AI-assisted addition/update · Custom→Verified · risk-based QA。**参考にする既存実装**: **Particle**(verified library · 検証機構 · version/device 互換性 — **ただし coverage が小さい現実も含めて参考にする**)· **ESPHome**(Modbus controller · register type · word order · scaling · entity model · Home Assistant 連携 · external component — **YAML 方式をそのまま採用するとは限らない**)· **Arduino Cloud AI Assistant**(vendor-maintained structured knowledge + AI + compiler という近接構造 — **差を今後正確に確認する**)· **Embedder**(platform / part / datasheet / hardware knowledge)· **Viam**(registry / module / semver · local + cloud runtime)· **DigiCode donor**(MQTT · Azure · Home Assistant · BLE/Wi-Fi Controller · auto UI schema/renderer · compile / AI / Board / Device 資産)。*Rejected*: 旧名称 `Managed Environment Registry Design`(扱う範囲を狭く誤解させる)。*Supersedes*: S005 §6 が置いた次候補名。**menu への記録は着手権限ではない。**

### S3-40 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 DigiCode / DigiCode Text は「初心者・子供向け・教育・簡単」を主ターゲットにしていない** (2026-08-27, user ruling §8). **主に想定するのは、それなりの専門領域を持つ人にとっての「組み込み / IoT 初心者」である**: 企業の技術者・社員 · Factory Scientist / FS 講座受講者 · 高専 · 大学 · 研究者 · FabAcademy 受講者 · FabLab 利用者 · Maker · IoT / Smart Device を試作する人 · **機械・電気・製造・デザイン等の専門分野を持つが embedded software の専門家ではない人**。*Rejected*: ①「初心者向け = 子供向け」と読むこと ② target を「教育」と要約すること。*Supersedes*: `CLAUDE.md` §4 の provisional target-users 記述のうち、これと矛盾する読み方(§4 の記述自体は Human が別途裁定するまで残る)。**cold start の既知の失敗形**: rule 13 §Anti-patterns の「educational = simplified for children = reduce functionality」がまさにこれであり、本 project は origin から継承している。

### S3-41 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴🔴 「簡単」とは機能を削ることではない** (2026-08-27, user ruling §9). **意図は、実用 IoT / device development に必要な能力を保ったまま、その複雑さを環境・AI・managed knowledge によって隠し、専門外の人でも実用品まで到達しやすくすること。**したがって **MQTT · Azure · Home Assistant · RS485 · Modbus · CAN · industrial sensor · local backend · Raspberry Pi server** 等を「初心者には難しいから削る」という設計方向は**誤り**である。**必要な高度機能を残したまま、扱う難易度を下げる**のが基本思想。*Rejected*: 機能削減による簡易化、および高度プロトコル/産業デバイスを対象外へ落とす設計。*Supersedes*: none.

### S3-42 — owner `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- **🔴 小中高・プログラミング教室は「主戦場ではないが、利用できることを否定しない」** (2026-08-27, user ruling §10). Classic は Blockly · 視覚的操作 · AI · 簡単な sensor 利用によりその用途にも使えた。Text 版でも workshop · education · secondary-school · simple prototyping で使われる可能性を**排除しない**。ただし **小中高向け競合に勝つために機能・architecture を最適化することは主目的ではない。***Rejected*: ① これらの用途を排除する設計 ② これらの用途を主評価軸に据える設計。*Supersedes*: none.

## L2 LANE_OVERLAY
LANE: VERIFICATION
OVERLAY_IDS: B-40,B-54,S3-30

## L3 INDEX
INDEX_COUNT: 96
- B-02 [INLINE] 🔴 Compatibility/acceptance remains open, risk-based, and not inherited from Classic counts. — owner: `prompt/maintenance/local/handover/batons.md`
- B-03 [INLINE] 🔴 Web/Monaco/shared-Frontend/Desktop-target directions exist, but concrete stack, deployment, and adapters remain open. — owner: `prompt/maintenance/local/handover/batons.md`
- B-04 [INDEX_ONLY] 🔴 Routing values were measured, but recording them awaits Human GO; current profile remains NONE. — owner: `prompt/maintenance/local/handover/batons.md`
- B-05 [INDEX_ONLY] Technology-stack/deployment settlement must trigger project rows in protected-paths; read baton 5 before adding application paths. — owner: `prompt/maintenance/local/handover/batons.md`
- B-06 [INLINE] Before product-facing text edits, populate spec-boundary terms from S001–S003 evidence, never guesses; read baton 6. — owner: `prompt/maintenance/local/handover/batons.md`
- B-07 [INDEX_ONLY] Bootstrap findings L-6/L-7 remain deferred pending a user ruling. — owner: `prompt/maintenance/local/handover/batons.md`
- B-13 [INLINE] Any architecture objective must load the open browser-support matrix and its Safari/Firefox/Chromium caveats; read baton 13. — owner: `prompt/maintenance/local/handover/batons.md`
- B-14 [INLINE] Third-party material placement has four options and no adopted placement. — owner: `prompt/maintenance/local/handover/batons.md`
- B-15 [INLINE] Actual license/ToU review happens at adoption, with stronger redistribution obligations. — owner: `prompt/maintenance/local/handover/batons.md`
- B-16 [INLINE] 🔴 Original planning documents contain identifying/private information and cannot enter this PUBLIC repo; only user-chosen de-identified text may enter; read baton 16. — owner: `prompt/maintenance/local/handover/batons.md`
- B-17 [INDEX_ONLY] The user's external planning documents have enumerated wording/factual/product-definition corrections. — owner: `prompt/maintenance/local/handover/batons.md`
- B-18 [INLINE] 🔴 Portability cannot be decided mechanically from a license marking; the trigger must stay live. — owner: `prompt/maintenance/local/handover/batons.md`
- B-19 [INLINE] 🔴 Investigation conclusions can contradict their evidence; read evidence before conclusions, and never treat candidate menus as work queues; read baton 19. — owner: `prompt/maintenance/local/handover/batons.md`
- B-20 [INDEX_ONLY] B57's PT- special-case is a Project_Template defect handled only during a template visit. — owner: `prompt/maintenance/local/handover/batons.md`
- B-21 [INLINE] 🔴 Dedicated Compiler is a direction, not a design; architecture boundaries and four audit inputs remain open; read baton 21. — owner: `prompt/maintenance/local/handover/batons.md`
- B-22 [INLINE] FastAccelStepper resolution failure is network-confounded, failure evidence only, and not a donor fix; read baton 22. — owner: `prompt/maintenance/local/handover/batons.md`
- B-24 [INDEX_ONLY] 🔴 S002 probes are measurement-only, not production, and decision runners are unauditable; read baton 24 before reuse. — owner: `prompt/maintenance/local/handover/batons.md`
- B-25 [INDEX_ONLY] Read-load is still WARNING after the S008 topic split (option ① executed under Human GO). Option ② — declaring the model roster and DERIVING the allowance — is untouched: this repository has no record of what model / context size / operating margin produced READ_ALLOWANCE = 48,000. Never move that value or the REVIEW threshold without it. Carried into the menu's Task-Scoped Context Brief / Read Architecture Maintenance; read baton 25. — owner: `prompt/maintenance/local/handover/batons.md`
- B-26 [INLINE] S003 Helper/editor/LSP probes are measurement-only and lack production protections; read baton 26 before reuse. — owner: `prompt/maintenance/local/handover/batons.md`
- B-27 [INLINE] 🔴 Local Helper feasibility is not adoption; real LNA prompt/persistence was not measured; read baton 27 in Web/Desktop architecture. — owner: `prompt/maintenance/local/handover/batons.md`
- B-28 [INLINE] 🔴 Board/Library bundle boundary is unresolved and pairs with baton 34; read both before Desktop bundle design. — owner: `prompt/maintenance/local/handover/batons.md`
- B-29 [INLINE] 🔴 Web must be complete without LSP; explicitly design no-LSP capabilities and do not presume AI fully replaces LSP; read baton 29. — owner: `prompt/maintenance/local/handover/batons.md`
- B-30 [INLINE] Classroom Local LSP remains only a future candidate and its 32-GB/50-user extrapolation is unusable pending remeasurement. — owner: `prompt/maintenance/local/handover/batons.md`
- B-31 [INLINE] Enterprise Local Network Access policy exists, but real deployment behavior is unverified. — owner: `prompt/maintenance/local/handover/batons.md`
- B-32 [INLINE] User-library header provisioning is unresolved and is the Custom/Registry problem; read baton 32 for local semantic or Registry work. — owner: `prompt/maintenance/local/handover/batons.md`
- B-33 [INLINE] DigiCode-Finder Chrome-142+ PNA behavior is unverified and this repo must not change the donor; read baton 33 before donor work. — owner: `prompt/maintenance/local/handover/batons.md`
- B-34 [INLINE] 🔴 Decide cloud-vs-local Desktop Compiler before bundle baton 28; they are different products and invert offline claims; read baton 34. — owner: `prompt/maintenance/local/handover/batons.md`
- B-35 [INLINE] 🔴 AI-primary may conflict with intranet users because LLM endpoints may also be blocked; architecture/customer claims must address this; read baton 35. — owner: `prompt/maintenance/local/handover/batons.md`
- B-36 [INLINE] Debugger scope is unresolved; product specifications must explicitly include or exclude it; read baton 36. — owner: `prompt/maintenance/local/handover/batons.md`
- B-37 [INLINE] 🔴 Competitive inventory expanded, closest is Arduino Cloud AI Assistant, and real use remains 0 products; read batons 37/45 before product claims. — owner: `prompt/maintenance/local/handover/batons.md`
- B-38 [INLINE] 🔴 R21–R23 stand but their original empirical ground was refuted; only Human may maintain, reconsider, or limit them; read baton 38 before relying. — owner: `prompt/maintenance/local/handover/batons.md`
- B-39 [INLINE] 🔴 Registry need is supported but its “next” ranking ground was refuted; declare the updated ground before opening the objective; read baton 39. — owner: `prompt/maintenance/local/handover/batons.md`
- B-40 [INLINE] 🔴 Nine instruments require positive-control remeasurement; do not reuse affected numbers as evidence; read baton 40. — owner: `prompt/maintenance/local/handover/batons.md`
- B-41 [INDEX_ONLY] Competitor literature is not real use, which remains 0 products; read baton 41 before competitive claims. — owner: `prompt/maintenance/local/handover/batons.md`
- B-42 [INDEX_ONLY] If harness behavior conflicts with repo rules, S006 observed a platform-injected AgentTool restriction; inspect baton 42 before blaming the repo. — owner: `prompt/maintenance/local/handover/batons.md`
- B-43 [INDEX_ONLY] Conductor effort is measured medium, not the declared xhigh — modelSettings["claude-opus-5"] overrides the top level. Human ruled 2026-08-27 to keep this OPEN and change nothing: no effort setting is edited without a Human GO. Re-measure at every preflight; carried into the menu's Task-Scoped Context Brief / Read Architecture Maintenance. — owner: `prompt/maintenance/local/handover/batons.md`
- B-44 [INDEX_ONLY] Competitor accounts, payment, sales contact, and personal-information entry require named Human GO; run no real-use test without it; read baton 44. — owner: `prompt/maintenance/local/handover/batons.md`
- B-45 [INLINE] 🔴 Arduino Cloud AI Assistant is the closest unreviewed competitor; audit it before the next product/competitor conclusion; read baton 45. — owner: `prompt/maintenance/local/handover/batons.md`
- B-46 [INDEX_ONLY] Semiconductor-vendor AI tooling and domestic vendors were not searched; make no market-wide coverage claim; read baton 46. — owner: `prompt/maintenance/local/handover/batons.md`
- B-47 [INLINE] 🔴 Particle verified coverage is 10/972 (1.03%) with no public coding-AI evidence; mechanism is not demand proof; read baton 47. — owner: `prompt/maintenance/local/handover/batons.md`
- B-48 [INLINE] 🔴 Academic evidence supports common compile failures only, not broad complexity/library causation or Registry efficacy; read baton 48. — owner: `prompt/maintenance/local/handover/batons.md`
- B-49 [INDEX_ONLY] Scope competitor absence/uniqueness to the primary-checked set, never the whole market; read baton 49. — owner: `prompt/maintenance/local/handover/batons.md`
- B-50 [INLINE] 🔴 Auto Web UI consumes Blockly registration metadata, not C++; Text needs an input adapter while downstream assets remain candidates. — owner: `prompt/maintenance/local/handover/batons.md`
- B-51 [INLINE] 🔴 Device-knowledge expansion is an unproven Human design expectation and schema remains open. — owner: `prompt/maintenance/local/handover/batons.md`
- B-52 [INDEX_ONLY] 🔴 🔴 The brief cap is 128 KiB, a BRIDGE and the last raise of its kind (2026-08-27 Human GO). The S008 split did NOT shrink the brief — it grew, by exporting truth it had been omitting. If the brief reaches 128 KiB, STOP and ask: do not raise it again, and do not delete current truth to fit. The permanent repair is the menu's Task-Scoped Context Brief / Read Architecture Maintenance. — owner: `prompt/maintenance/local/handover/batons.md`
- B-53 [INDEX_ONLY] 🔴 The current-state owner set is three files and its safety rests on the router's stubs plus B69/B70/B71; every close updates all three in one commit and carries the router's GEN into all three. Adding or removing an owner also requires, in the same commit: read-load.sh ROSTER · context-brief.sh allowlist · the hook's conditional manifest · CLAUDE.md §0 · handover-diff.sh OWNERS — miss one and the rest stay green while a fact leaves silently. — owner: `prompt/maintenance/local/handover/batons.md`
- B-54 [INLINE] 🟡 No single mechanism catches every current-truth loss, and the map of which catches what is now measured — handover-diff compares only §2/§3, so a §1/§4/§5 deletion and any partial loss inside evidence-map.md are invisible to it; selftest misses a single §3 ruling bullet; B69 cannot see a router truncated on disk; B70 matches a path as a substring; B71 cannot see whether a stub still carries its prohibition. — owner: `prompt/maintenance/local/handover/batons.md`
- B-55 [INDEX_ONLY] 🟡 CLAUDE.md §2's "this file never owns a current fact" is enforced by selftest B54 over §2 and §3 only — the same violation written into §0, §4, §7 or §9 is green. Measured: a stale count sat in §0. — owner: `prompt/maintenance/local/handover/batons.md`
- S3-01 [INLINE] - digicode-text is a new independent project bootstrapped from Project_Template, not a fork of DigiCode (2026-08-25, user directive §0): its git hist… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-02 [INLINE] - DigiCode's legacy governance is never imported; the template's own Origin: DigiCode provenance is kept (2026-08-25, user ruling). *Rejected*: remov… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-03 [INLINE] - prompt/ and CLAUDE.md are git-tracked in a PUBLIC repository, and the answer to that is content discipline, not concealment (2026-08-25, user rulin… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-04 [INDEX_ONLY] - The routing profile records an absence of measurement rather than a plausible mapping (2026-08-25, user ruling): every effort_scale is NONE, so uns… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-05 [INLINE] - The product specification, target scope, completion conditions and DigiCode compatibility range are provisional and settled after the donor audit (… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-06 [INLINE] - Project_Template is not modified from this repository (2026-08-25, user directive §10): defects are reported to the user and recorded here. *Reject… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-07 [INLINE] - AI is a primary feature of digicode-text and ships from the start (2026-08-26, user ruling): investigation covers *how* the donor implements AI — n… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-08 [INLINE] - A Human GO authorises one declared PRIMARY_OBJECTIVE and nothing beyond it (2026-08-26, user ruling): 「GO は、その時点で明示された PRIMARY_OBJECTIVE の範囲だけに対する作… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-09 [INLINE] - A licence marking is not a portability verdict (2026-08-26, user ruling, correcting this repository's own error): PROPRIETARY = 移植不可 as a mechanica… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-10 [INLINE] - 🔴 digicode-text has its own dedicated Compiler; riding Classic's running Compiler is off the first-candidate list (2026-08-26, user ruling on top o… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-11 [INLINE] - 🔴 AI = 主機能、LSP = 高度なコード編集支援。LSP は digicode-text を成立させる必須機能ではない (2026-08-26, user ruling §1). 🔴 したがって「LSP なしの Web 版」を「機能不足版」と定義してはならない。 *Rejected*:… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-12 [INLINE] - 🔴 Web 版が主製品。Helper や LSP が無くても Web 版自体が完成した製品として利用できることを基本原則とする (2026-08-26, user ruling §2). 最重要価値は 「Chrome / Edge を開くだけで利用でき、ユーザ PC へ複雑な MCU 開発環境… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-13 [INLINE] - 🔴 server-side LSP を Web 版の必須 backend にしない (2026-08-26, user ruling §11). digicode-text は基本無料が前提であるため、利用者が増えるほど LSP 費用が比例して増える構造を初期必須要件にしない。optional… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-14 [INLINE] - 🔴 Monaco Editor を第一候補とする(多少重くても) (2026-08-26, user ruling §3). production Monaco を実装するという意味ではなく、正式 architecture で確定するまでの第一候補。*Rejected*: サイズと起動時間だけ… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-15 [INLINE] - 🔴 内部標準 = main.cpp。Arduino .ino = import 可能。.ino を内部標準にすることは第一候補から外す (2026-08-26, user ruling §4). Arduino ecosystem 互換は重要なので、.ino を読み込んだら内部の main.c… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-16 [INLINE] - 🔴 Desktop 版を正式に視野へ入れる。Web 版を主製品として維持しつつ、同じ Frontend から Desktop 版も作れる architecture を第一方針として検討する (2026-08-26, user ruling §5–§7、Product Value 受理 §4 で… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-17 [INLINE] - 🔴 Desktop 版の初期 target は Windows / macOS / Linux(まず Ubuntu)。開発初期は署名・認証を必須にしない (2026-08-26, user ruling §8). 正式配布段階では Windows code signing / macOS De… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-18 [INLINE] - 🔴 Desktop 版では高度 LSP を標準搭載する方向が有力(ただし現時点では正式決定しない) (2026-08-26, user ruling §9). *Rejected*: 現時点で正式決定すること。*Supersedes*: none. — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-19 [INLINE] - 🔴 Local Helper は技術的成立を確認済み。正式採用は未決定。Desktop 版との役割重複を後続 architecture で評価する (2026-08-26, user ruling §10 / §16). これらは Local Helper の正式採用を意味しない。 *Reje… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-20 [INLINE] - 🔴 この裁定を受けても production 実装へ自動的に進まない (2026-08-26, user ruling §17、Product Value 受理 §16 で再確認). 進んではいけないもの: Web / Desktop / Helper production implement… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-21 [INLINE] - 🔴🔴 製品の中核価値が確定した。DigiCode Text の存在意義は「Web で使える Arduino/C++ Editor を作ること」でも「VS Code より高機能な Editor を作ること」でも「AI でコードを書けること自体」でもない (2026-08-26, user rul… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-22 [INLINE] - 🔴 製品定義の 1 文(今後の基準) (2026-08-26, user ruling §2): 「DigiCode Text は、検証済みのマイコン開発環境(Board・Toolchain・Library・Dependency)を利用者自身に構築させずに提供し、その同じ管理済み環境を Com… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-23 [INLINE] - 🔴 Web 版の重要価値は「ブラウザ Editor であること」ではなく「利用者 PC へ MCU 開発環境を構築させないこと」である (2026-08-26, user ruling §3). 特に 学校 · FS 講座等の研修 · 企業イントラ · 管理者権限の弱い PC · 一時利用 P… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-24 [INLINE] - 🔴 Block 製品分担: DigiCode Classic = Block を必要とする層向け / DigiCode Text = AI + Text + 管理済み MCU 環境 (2026-08-26, user ruling §5). Classic は既存成果物として維持し、Text… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-25 [INLINE] - 🔴🔴 次に設計すべき中核は Managed Environment Registry である (2026-08-26, user ruling §6 / §11). Registry を単なる「対応 Board 一覧 / 対応 Library 一覧」にしない — 目標は Compiler・AI… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-26 [INLINE] - 🔴 Verified / Custom の二層構造を Registry 設計の有力候補とする (2026-08-26, user ruling §7 / §12). 🔴 管理外 Library を禁止する closed ecosystem にはしない。ただし Verified / Custom… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-27 [INLINE] - 🔴 理想は Custom から Verified への昇格経路を持つこと (2026-08-26, user ruling §8). 概念的な流れ: 候補発見 → metadata 取得 → source 確認 → license 確認 → dependency 解析 → compatible… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-28 [INLINE] - 🔴🔴 Registry 管理を人力前提にしない。AI を管理・調査・QA 補助へ最大限活用することを前提候補とする (2026-08-26, user ruling §9 / §13). 🔴 ただし AI の自己申告だけを acceptance evidence にしない。最終的な保証は従来ど… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-29 [INLINE] - 🔴 「全組み合わせ保証」へ戻らない。risk-based compatibility / regression を維持する (2026-08-26, user ruling §10). 件数を目的化しない。 *Rejected*: 件数ベースの網羅保証。*Supersedes*: none。S… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-30 [INLINE] - 🟡 現在の read-load BUDGET_STATUS = WARNING を、既知の作業状態として受容する (2026-08-26, user ruling §15). ただし問題が解消したという意味ではない(baton 25)。*Rejected*: ① WARNING を理由に製品… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-31 [INLINE] - 🔴🔴 Opus 5 を solo で運用しない。PRIMARY_OBJECTIVE を Opus 5 solo で完結させることを禁止する (2026-08-26, user ruling, S007 指示文書 §0 で明示的に再宣言). Claude Code / Opus 5 の担当は H… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-32 [INLINE] - 🔴🔴 S007 の最終 evidence state は D7 訂正版を採用する: legacy rationale mostly REFUTED / problem existence SUPPORTED / proposed product value NOT RESOLVED (2026… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-33 [INLINE] - 🔴🔴 DigiCode の産業 IoT 対応が浅いのは「産業 IoT を重視していなかったから」ではない (2026-08-27, user context, 永続化必須). DigiCode は初心者向け Block Editor を目的に作られたのではなく、実際にデバイスを設計・製作する人… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-34 [INLINE] - 🔴 DigiCode Text へ期待する構造変化: 新 Device 対応 = 新 Block / Generator / UI / regression の実装 から 新 Device 対応 = Library / Protocol / Device knowledge / metadat… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-35 [INLINE] - 🔴 Home Assistant との親和性は Classic 開発時からの設計意図であり、今後の設計でも参考にする (2026-08-27, user context). Device の意味を sensor · switch · number · binary status · measu… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-36 [INLINE] - 🔴 auto Web UI の位置付けを訂正する (2026-08-27, user ruling). 現行 DigiCode の auto Web UI は C++ コードを解析して UI を作るものではなく、Blockly 由来の registration metadata → schem… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-37 [INLINE] - 🔴 次 Objective 第一候補の名称を Managed Environment & Device Knowledge Architecture Design とする (2026-08-27, user ruling). 目的は DigiCode Classic で Block 実装コスト… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-38 [INLINE] - 🔴🔴 Opus 5 solo 禁止を維持する (2026-08-27, user ruling, 再確認). S007 でも D6 / D7 の独立 FALSIFICATION によって Opus 統合者自身の複数の誤り・過剰一般化・競合見落としが訂正された(13 件、case DT-6)。次… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-39 [INDEX_ONLY] - 🔴 BRIEF_MAX_BYTES を 64 KiB → 96 KiB へ引き上げる(暫定) (2026-08-27, user ruling — gate threshold の変更として明示的に GO). 根拠は実測: S007 close の時点で brief は 65,141 byte… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-40 [INLINE] - 🔴🔴 DigiCode / DigiCode Text は「初心者・子供向け・教育・簡単」を主ターゲットにしていない (2026-08-27, user ruling §8). 主に想定するのは、それなりの専門領域を持つ人にとっての「組み込み / IoT 初心者」である: 企業の技術者・社員… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-41 [INLINE] - 🔴🔴 「簡単」とは機能を削ることではない (2026-08-27, user ruling §9). 意図は、実用 IoT / device development に必要な能力を保ったまま、その複雑さを環境・AI・managed knowledge によって隠し、専門外の人でも実用品まで到達… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-42 [INLINE] - 🔴 小中高・プログラミング教室は「主戦場ではないが、利用できることを否定しない」 (2026-08-27, user ruling §10). Classic は Blockly · 視覚的操作 · AI · 簡単な sensor 利用によりその用途にも使えた。Text 版でも worksho… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-43 [INLINE] - 🔴🔴 BRIEF_MAX_BYTES を 96 KiB → 128 KiB へ上げる。これは bridge であり、この種の最後の一回である (2026-08-27, user ruling, gate threshold 変更として明示的に GO). 目的は S008 の統合反証修正を gr… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-44 [INDEX_ONLY] - 🔴 context brief の恒久解は別 Objective で扱う — Task-Scoped Context Brief / Read Architecture Maintenance (2026-08-27, user ruling). 問いは 「repo access を持たない… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-45 [INDEX_ONLY] - 🔴 task-scoped export をその場で実装しない (2026-08-27, user ruling). S008 の Lane B が測定したとおり、task→owner 分類器 · wrong-owner control · no-owner control は現時点で 1 つ… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-46 [INLINE] - 🔴 READ_ALLOWANCE / REVIEW_REQUIRED threshold を勝手に上げない (2026-08-27, user ruling). S008 は topic split 側を実施したが、model roster を明示し context window から rea… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-47 [INDEX_ONLY] - 🔴 baton 43(Opus 5 effort mismatch)は未解決として維持する。今回は設定を変更しない (2026-08-27, user ruling). declared / expected = xhigh、effective transcript = medium が S0… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
- S3-48 [INLINE] - 🔴🔴 Orchestration の新運用方針 — Adaptive fan-out。次 objective / session から適用する (2026-08-27, user directive). 固定の最大 fan-out ではなく適応的に決める: 最初は必要最小限の 1〜3 inde… — owner: `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md`
