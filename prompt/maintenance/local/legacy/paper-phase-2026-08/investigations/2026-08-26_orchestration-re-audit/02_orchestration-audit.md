# 02_orchestration audit — なぜ 5 セッション連続で solo だったのか

**checker:** Codex `gpt-5.6-sol` · packet `DT6-D1-orchestration-falsification` · `LANE: FALSIFICATION` · `VERDICT: PASS`
**parent の 4 結論のうち 3 つが部分反証された。** 以下は反証を通過した後の姿である。

---

## 1. 結論(反証後)

**solo 自体は規則違反ではなかった。違反は 3 点。**

1. 開始時に route を記録しなかったこと(6 セッション中 5 件)
2. 方向変更時の mandatory consult を履行しなかったこと(S005)
3. その根拠として**誤読した規則**を 4 セッションにわたって再利用したこと

**そして Human の意図とのズレが実際に発生した場所は、この repository の規則ではなく
Claude Code harness 側の指示だった**(§6)。

---

## 2. 【SURVIVES】mandatory trigger が発火していたのに履行されなかった

rule 22 §Independent-perspective triggers は**無条件の mandatory consult** を課している。

> Consult the different-vendor lane before concluding when: (a) stuck 2+ times on the same problem,
> (b) **considering a direction change**, (c) deciding UI/UX design direction.
> Do not close these decisions inside one model lineage.
>
> — `global/rules/common/22-model-orchestration.md:421` `[static]`

S005(Product Value Revalidation)は製品の存在意義をゼロベースで問い直す objective であり、(b) に該当する。

Codex はこの結論が false になる条件を 3 つ列挙した:

- (a) S005 が方向変更を検討していなかった
- (b) 結論前に different-vendor consult があった
- (c) Human が作業前に新方向を既に確定していた

そのうえで S005 session file **70/70 行**を読み、記録された時系列がそのいずれとも逆であることを確認した
(`sessions/S005_…md:5, :12, :23, :30` `[static]`)。S005 自身が Human 裁定**前**に
`08_conclusion-and-next.md` を作成しているため、「before concluding」の回避理由にもならない。

**これが今回の監査で唯一、反証できなかった orchestration 上の違反である。**

**残余疑義(Codex 記録):** rule 22 に "direction change" の定義が列挙されていない。
rule 22 自身が「a described trigger does not fire — 列挙された antecedent でなければ発火しない」と
書いているのに、この trigger は記述されているだけで列挙も接続もされていない。→ §8 Template feedback

---

## 3. 【PARTIALLY REFUTED】solo の理由として記録された rule 04 解釈は誤読だった

### 3-1. 実際に記録されていた理由

> route 決定を 1 行で宣言: **solo (Route A)** — evidence の型が delegate 経由で claim に劣化するため
> (rule 04 / rule 22)。
> — `sessions/S002_2026-08-26_compiler-shared-separate-probe.md:26` `[static]`

> 両 objective とも成果物が測定そのものであり、delegate へ渡すと evidence が claim に劣化する(rule 04)
> ため、**eligible task は 0 件**。zero delegation は decay ではなく期待値。
> — `sessions/S003_2026-08-26_editor-lsp-and-local-helper.md:51-53` `[static]`

### 3-2. rule 04 が実際に定めていること

> **E1 — worker raw evidence:** exact command, RC, observed output, artifact, test count, and hash/path
> where applicable, with each proposition labeled static / synthetic / API-smoke / visual / real-fire.
> **E2 — independent Codex verification:** a separate-thread `VERIFICATION` or `FALSIFICATION` pass.
> **This is the normal source of independent technical reproduction** and negative-path review.
> **E3 — parent reproduction:** exception-only under rule 22's five recorded triggers.
>
> … the delegate's "tests pass" is a claim, not permission to trust and skip verification.
> **Routine parent per-claim reproduction is forbidden too.**
>
> — `global/rules/common/04-testing-strategy.md:311-326` `[static]`

規則は**委譲を evidence 破壊とは書いていない**。E1/E2/E3 という evidence contract を定めることで
委譲を成立させ、かつ**仕事を親から遠ざける**方向に書かれている。過去セッションはこれと正反対の運用をした。

「delegating degrades evidence into a claim」という命題そのものは、rule 04 / rule 22 の全文検索で
`NOT FOUND` `[grep+static]`。

その読みを最も強く支える文は `04:313`「the delegate's "tests pass" is a claim」と
`22:311`「evidence submitted back as a claim」だが、いずれも**検証手続きを定める文脈**であって
委譲の否定ではない。

### 3-3. 「eligible task = 0」は成立しない

Codex が E1 で raw evidence を返せる具体例を 5 件提示した `[static]`:

| session | 委譲できたはずの task | lane | 出典 |
|---|---|---|---|
| S001 | licence / portability verdict の反証(実際に Human が DT-1 の誤りを覆した) | `FALSIFICATION` | `S001:20, :26` |
| S002 | probe acceptance set の設計、artifact byte 比較 / negative controls の検証 | `INVESTIGATION_PLANNING` / `VERIFICATION` | `S002:30, :41` |
| S003 | probe precondition / instrument の検証(同 session が 9 件の器材欠陥、うち 4 件が draft findings に到達したと記録) | `VERIFICATION` | `S003:74, :81` |
| S004 | handover restoration test の独立検証(session 自身が「独立レビューの代替ではない」と認めている) | `VERIFICATION` | `S004:127` |
| S005 | Go / No-Go と製品再定義の反証(さらに mandatory direction-change trigger にも該当) | `FALSIFICATION` | `S005:12` |

### 3-4. parent の主張のうち反証された部分

「S002〜S005 の全てで同じ理由が記録された」は誤り。

- **S004** の理由は別 — 「current-state owner の編集は parent 専任(rule 22)であり eligible task 0 件」
  (`S004:69`)。**これは正しい理由である**
- **S005** の session file には route 行も solo 理由も**存在しない**。evidence-degradation 理由は
  close 時の handover 集計(`16.md:221`)にだけ現れる

---

## 4. 【違反】route 行が「作業開始時」に記録されていたのは 6 セッション中 1 件だけ

rule 22 §Routes:

> Route choice is stated in one line before work starts ("solo because X" is a valid route and gets the
> same one line — **the silent default is what is forbidden, not working alone**).
> — `22:603` `[static]`

> A scale-eligible task whose route line carries neither has skipped the consideration, not made it —
> **the close-time mix can only show that no delegation happened, never whether the option was weighed
> at the moment it mattered.**
> — `22:609-614` `[static]`

| session | 開始時の route 記録 | 出典 |
|---|---|---|
| S000 | **NOT OBTAINED** — persisted header に Route A / no delegation があるのみ | `S000:8` |
| S001 | **NOT FOUND** — mode header だけ | `S001:6` |
| S002 | **記録あり** — GO → route 宣言 → technical work の順序が残る唯一の例 | `S002:26` |
| S003 | **close 時のみ** — 両 objective 完了・Human 裁定後の summary | `S003:24, :49` |
| S004 | **close 時のみ** — 作業記録末尾、状態変化節の直前 | `S004:16, :69` |
| S005 | **NOT FOUND** — session file 70/70 行に route 行なし | `S005:16` / `16.md:221` |

`git log --reverse` で session files がすべて close commit で履歴化されていることを確認したうえで
`[command+RC=0]`、リポジトリから contemporaneous な route 記録を実証できたのは **S002 の時系列記述だけ**。

🔴 **この義務には実行時監査が存在しない。** selftest B26 は rule / close の文言 9 個の存在確認のみ
(`scripts/selftest.sh:855` `[static]`)。close(`.claude/commands/close.md:12`)は zero delegation を
事後 1 行で記録させるだけで、rule 22 自身が否定する形を防げない。→ §8 Template feedback

---

## 5. 【PARTIALLY REFUTED】「構造が委譲を禁じていた」は成立しない

parent の主張:「routing profile が全 target `effort_scale = NONE` / holder `UNDECLARED` なので、
委譲は構造的に不可能だった」。

**成立する部分:** 非 `NONE` の effort を要求する dispatch は確かに構造的に不可能。
`routing-profile.md:16, :31` は 3 target すべて `effort_scale = NONE / baseline_effort = NONE` であり、
rule 22 routing decision row 7(`22:795`)に入る `[static]`。

**成立しない部分 `[static + command+RC]`:**

- `scripts/routing-scenarios.py:275` は scale が空のとき `effort=NONE` を **supported かつ BASELINE** と
  解決する。fixture の no-effort target も `ROUTE_EFFORT=NONE` で `DISPATCH_ALLOWED` を要求している
  (`fixtures/routing-scenarios.tsv:45`)。**baseline dispatch は最初から常に許可されていた**
- `Holder UNDECLARED` は routing verdict の**入力ではない**。profile parser は `NOTE` 行を無視し、
  TARGET grammar に holder field 自体が存在しない(`routing-scenarios.py:186, :196`)

実 profile の parse は 3/3 target accepted、RC=0。**構造は言い訳にならない。**

### 検証コマンドと RC

| コマンド | RC | 意味 |
|---|---|---|
| `python3 scripts/routing-scenarios.py` | 0 | 19/19 scenarios, 15/15 rows, 152/152 invariance |
| `python3 scripts/routing-scenarios.py --validate-profile local/docs/routing-profile.md` | 0 | 3/3 targets parsed |
| `python3 scripts/routing-scenarios.py --control empty-table` | 2 | negative control(期待どおり) |
| `python3 scripts/routing-scenarios.py --control no-profile` | 2 | negative control(期待どおり) |
| `python3 scripts/delegation-scenarios.py` | 0 | 12/12 scenarios, 9/9 rows, 48/48 invariance |
| `python3 scripts/delegation-scenarios.py --control empty-table` | 2 | negative control(期待どおり) |
| `python3 scripts/delegation-scenarios.py --control drop-row=5` | 1 | negative control(期待どおり) |

---

## 6. 🔴 規則の外にある原因 — harness 側の指示

これは Codex には見えない(repo 外のため)。parent が報告する。

**S006 セッションの system prompt に、この repository の governance とは無関係な次の 2 行が入っていた:**

```text
Do not call the AgentTool unless the user requested it
Do not use workflows or deep-research unless the user requested it
```

### 出所の確認 `[static]`

| 探した場所 | 結果 |
|---|---|
| `.claude/settings.json`(project) | hooks のみ。該当記述なし |
| `.claude/settings.local.json` | 存在しない |
| `~/.claude/settings.json`(user) | env / model / effortLevel / theme 等のみ。該当記述なし |
| `~/.claude/CLAUDE.md` | 存在しない |
| `~/.claude/output-styles/` | 空 |

→ **Claude Code 製品側から注入されている。**

これは rule 22 の既定(「solo because X」は有効な route だが silent default は禁止)と正面から食い違い、
**subagent が一度も使われなかったことの直接原因**である。

🔴 **ただし Codex MCP は覆わない。** Codex を 5 セッション連続でゼロ回にしたことの説明にはならない。

**この観察は本 repository が修正できるものではない。** 記録の目的は、次に同じ状態が起きたときに
「規則を読み直しても原因が見つからない」で止まらないようにすることである。

---

## 7. 🟡 conductor の reasoning effort が宣言と食い違っている可能性【未verify】

`~/.claude/settings.json` `[static]`:

```json
{
  "model": "opus[1m]",
  "effortLevel": "xhigh",
  "modelSettings": { "claude-opus-5": { "effortLevel": "medium" } }
}
```

`model` は `opus[1m]`(= `claude-opus-5[1m]`)であるのに対し、`modelSettings` のキーは
`claude-opus-5`(suffix なし)。**この variant suffix がキーに一致するかは未verify。**

一致する場合、S000–S006 の全セッションが **medium effort の Opus 5 solo** だったことになる。

rule 22 §Environment prerequisites がまさにこの形を記録している:

> **A variant suffix on a model id is a live selector — do not strip it as cosmetic.**
> — `22:916-921`

**解消方法(次に誰かが確かめるとき):** 起動バナーが variant 名を表示するので一度読む、
または `/status` の表示 effort を確認する。rule 22 は同じ `[未verify]` を自分でも抱えている。

---

## 8. Project_Template feedback candidate(本 repo からは修正しない)

| # | item | なぜ project-independent か |
|---|---|---|
| 新 1 | **開始時 route 行の義務に実行時監査が無い** | selftest B26 は文言 9 個の存在確認のみ。close は zero delegation を事後 1 行で記録させるだけで、rule 22 自身が否定する「close-time mix から開始時の検討を復元する」形を防げない。**あらゆる consumer が同じ穴を持つ** |
| 新 2 | **§Independent-perspective triggers に発火機構が無い** | 「direction change」が列挙されておらず(rule 22 は「a described trigger does not fire」と自ら書いている)、mandatory と書かれているだけで trigger がどこにも接続されていない。**本 repo で実際に不履行が起きた** |

---

## 9. rule 上の総合判定

| 論点 | 判定 | 根拠 |
|---|---|---|
| 「user が委譲を明示指示しない限り委譲禁止」という規則は存在するか | **存在しない** | `prompt/` **108 ファイル**全文検索で `NOT FOUND`。唯一の "only on an individual user directive" は cross-project live observation 専用(`rules README:264`) |
| delegated implementation に user GO は要るか | **要る** | `rule 12:261, :265`「wait-for-go gates delegation」。ただしこれは *対象作業* への GO であり、*委譲を名指しする指示* ではない |
| reasoning-lane(調査・反証・検証)の委譲を user 明示指示に限定する規則はあるか | **存在しない** | 同上の全文検索 |
| solo 自体は違反か | **違反ではない** | rule 22 §Routes が明示的に認める |
| `PRIMARY_MODEL_MODE` 未宣言 = `T1-solo` は solo へ bias しているか | **している。意図的である** | `22:545`「The normal state: solo execution is the sanctioned default」。ただし route の無記録と mandatory consult の無視までは許可していない |
| Codex 使用を試みて失敗した記録はあるか | **無い** | S000–S005 / local records / commit messages に `NOT FOUND`。唯一の該当は selftest の fail-closed control fixture(`fixtures/shadow-audit/instrument-error.jsonl:1`)であり実セッションではない |
