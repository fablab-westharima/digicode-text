# 08_結論 / 裁定と evidence の分離 / 次への入力

**この file は本調査の executive conclusion であり、判断材料の owner である。**
各 claim の詳細は `02`〜`07` が owner で、ここには**再掲しない**。

---

## 1. 集計

| 区分 | 件数 |
|---|---|
| 独立再現 / 一次情報で確認 | **14** |
| 反証(REFUTED / CONTRADICTED) | **9** |
| 部分反証・要訂正 | **21** |
| 独立確認できず / NOT OBTAINED | **17** |
| 計器判定 `ERROR / INVALID_MEASUREMENT` | **2 packet**(D2 Compiler / D3 Editor·Helper) |
| 検査した claim 総数 | **82** |
| レーン数 | **6**(Codex 5 + Claude subagent 1) |

🔴 **「独立確認できず」は「間違い」ではなく「今回の環境では確かめられなかった」の意である。両者を混同していない。**

---

## 2. 🔴 最も重い 5 件

### 2-1. Go 根拠 #1 が、同じ調査自身の最重要 finding に否定されている

Codex D4a が `CONFLICT_SURFACE` として返し、**parent が該当行を実読して確認した**(`BOUNDED_REVIEW`)。
**両方とも `primary source` ラベル付きである。**

| | |
|---|---|
| `product-value-revalidation/08_conclusion-and-next.md:48` **Go 根拠 #1** | 「権限ゼロの PC で書き込みまで成立する選択肢が**他に存在しない**(Arduino Cloud は Agent 必須)」/ 型: **primary source** |
| `product-value-revalidation/02_existing-environments-2026.md:100-113` **§5-1** | Codey Online =「**ローカルインストール不要**」+「ブラウザ(Chrome/Edge)から **Web Serial で直接書き込み**」/ 型: **primary source**、しかも「**本調査で見つかった最も重い事実**」と自ら明記 |

**製品全体の Go 根拠 #1 が、同じ調査の 11 ファイル前に書かれ、しかも「最も重い事実」と自ら明記された
finding によって否定されている。** 一人の actor が、自分で書いた §5-1 を結論で参照し損ねた形。

さらに `07_primary-sources.md` S12 が **2 つ目の該当製品(PleaseDontCode)** を一次情報で確認しており、
**「他に存在しない」は二重に成立しない。**

→ case **DT-4** として起票済み。

### 2-2. 2 レーンが異なる証拠源から同じ構造欠陥へ独立に到達した

Go 根拠 #3「既存 IDE の offline bundle は製品として配布できない」について:

- **Codex D4a**(repo 内論理のみ、network 遮断)が「『作れない』『現存しない』『維持が高価』の
  3 つを混同している」と指摘
- **Claude subagent D4b**(web 一次情報)が、その 3 つが実際に分かれることを一次情報で示した

| 読み方 | 判定 | 根拠 |
|---|---|---|
| 「**自社製品へ同梱できない**」 | **正しい** | Marketplace ToU 2025-09 §2.b が明確に禁止側 |
| 「**顧客 IT 側で offline 配布できない**」 | **誤り** | MS 公式が re-hosting と air-gapped を明文サポート |
| 「**維持が高価**」 | **未測定** | 工数・更新頻度・顧客 IT 能力の分布なし |

**これは片方のレーンだけでは出なかった結果である。** rule 22 §Parallel investigation の
「同じ*問い*を、互いの答えを見せずに両 lineage へ渡す」形が実際に機能した唯一の実例。

### 2-3. server-side LSP 除外の根拠数値が、主張した次元を測っていない

H8 の計器は `ps -o rss` を**プロセス間で合計**している。合計 RSS は**共有ページを重複計上する**ため、
「共有ページの恩恵は無い」という主張**そのものを測定できず**、課金対象の物理 RAM でもない。
誤差方向は **server-side を実際より悪く見せる**。詳細 `05_…md` §5。

**今回の技術系 finding の中で最も影響が大きい。**

### 2-4. mandatory trigger が発火していたのに履行されなかった

rule 22:421 の direction-change consult。**Codex が反証を試みて反証できなかった唯一の orchestration 違反。**
詳細 `02_…md` §2。→ case **DT-3** として起票済み。

### 2-5. 一方、Compiler 分離裁定と `main.cpp` 内部標準裁定の中核根拠は無傷だった

- **V7**(global `lib_deps` が未使用依存まで解決対象にする)を隔離環境で **known-bad RC=1 / control RC=0** で独立再現
- **E3**(`.ino` は素の clangd 不可)を `clangd --check` RC=3 + diff で独立再現
- **A4**(Board が手書き二重正本、Device⇔Library registry 不在)を **69/69 block 全数走査**で支持
- **E1 bundle 6.2×** を Node zlib 再圧縮で **6.215×** と byte 単位一致

**反証は一様ではない。何が生き残ったかも同じ強さで記録する。**

---

## 3. Human 裁定と evidence の分離(objective §6 の 5 分割)

**Human ruling は Human が変えない限り覆さない。** 以下は**裁定へ入力された evidence が誤っていた**ケースのみ。

| # | ruling | corrected evidence | impact | 再裁定 | owner |
|---|---|---|---|---|---|
| 1 | S005 §1/§2 中核価値・製品定義 | 代替は 2 つ実在(Codey / PleaseDontCode、一次情報確認済み)。不在の主張は母集団不明 | 「Web だから唯一」という独自性が崩れる。**中核価値の主張自体は残りうるが経験的根拠は別途必要** | 🔴 **要 — Human 判断** | `06_…md` §8 |
| 2 | S005 §3 Web 版の重要価値・重点 segment | 同じ調査が Codey を「導入不要・Web Serial 書込」と記載 | Web だけが成立するという独自性が崩れる | 🔴 **要** | `06_…md` §8 |
| 3 | Desktop / shared Frontend 裁定 | offline bundle は技術的に可能。配布不能は未立証(条件次第) | bespoke Desktop の相対価値と境界が変わる | **条件付きで要** | `06_…md` §4 / `07_…md` §3-2 |
| 4 | S005 §6/§11 Registry が次の中核 | **P3/P4 未実証、V1–V7 に順序根拠なし** | 次 objective の優先順位が支えられない | 🔴 **要** | `06_…md` §5 |
| 5 | server-side LSP を必須 backend にしない | H8 の計器が主張した次元を測っていない | 「利用者が増えるほど費用が比例する」構造の根拠が未確定 | **不要** — ただし**独立 memory 再測定が必要**。裁定には「基本無料が前提」という測定に依存しない事業判断も入っている | `05_…md` §5, §9 |
| 6 | 専用 Text Compiler 第一方針 | V9 の「refute」は強すぎる(順序反転で shared 優位 0.80–1.39 秒が warm 後も残る) | 根拠 1 本を狭める訂正 | **不要** — **V7 が独立再現され中核根拠は無傷** | `04_…md` §7 |
| 7 | Text へ Blockly を戻さない | coupling「6 files」は direct-import の尺度。意味的 surface は 64 files | 移植工数評価に影響。製品分担裁定には直結しない | **不要** | `03_…md` §7 |
| 8 | 1000+1000 を保証数として継承しない | 実装は 6 戦略・52 files・別配分 | **裁定をむしろ補強する** | **不要** | `03_…md` §3 |
| 9 | 開発初期は署名を必須にしない | 「macOS 3→1 / Windows 4→1」は installer 未 build。実測値として扱えない | 裁定自体には影響なし | **不要** | `05_…md` §2 (H10) |

---

## 4. Registry Design へ進んで安全か

### 4-1. Codex の回答

> **Conditional。現状証拠のまま「製品中核として確定した Registry architecture」を設計するのは NO。**

最低条件 7 件は `06_…md` §9 が owner。

### 4-2. ただしこの否定は一様ではない

**Registry の設計対象そのものを支える証拠は、今回むしろ強くなった:**

| 支持された根拠 | 出典 |
|---|---|
| Board は frontend 16 / compiler 10 の**手書き二重正本**で、Device⇔Library registry は **69/69 走査して本当に不在** | `03_…md` A4 |
| global `lib_deps` が未使用依存まで解決対象にする構造を**隔離環境で独立再現** | `04_…md` V7 |
| ESP-IDF の **Partial Mirror** が「開発者に利用可能なバージョンを制限する」公式機構として実在 — **Verified / Custom 二層の先行実装として読める** | `07_…md` S11 |
| donor の **canonical-sample / host-compile probes** は Verified 昇格経路へ直接転用できる既存資産 | `03_…md` §4-2 |

### 4-3. parent の統合判断(draft judgment — 採否は Human)

**「進める / 進めない」の二択が、今回の証拠が示す形ではない。証拠が示しているのは順序の問題である。**

崩れたのは「**Registry が製品の中核的差別化であり、ゆえに *次に* 設計すべきものだ**」という
順位付け(P3 / P4 / P8)であって、**Registry という設計対象の必要性ではない**。

- Registry 設計を「**digicode-text の中核的差別化を確定させる作業**」として始めると、
  反証済みの P3/P4/P8 を前提として固めることになる
- 「**Classic が実際に抱えている二重正本と global dependency 問題を解く技術設計**」として始めるなら、
  その根拠(A4 / V7)は今回の独立検査を通過している

🔴 **同じ成果物でも、何の証拠に立って始めるかで安全性が変わる。**

---

## 5. Human の裁定が要る項目

| # | 項目 | 選択肢 |
|---|---|---|
| **①** | **routing profile へ実測値を書き込むか**。`routing-profile.md:26` は「初回 dispatch 前に commit attribution を書け」と定めており、S006 が初回 dispatch だった。**測定は完了している**(`01_…md` §6) | A: 書き込む GO を出す(**baton 4 が閉じる**) / B: 例外として進め、別 maintenance objective にする |
| **②** | **§3-1/§3-2 を受けて S005 §1/§2/§3 を再裁定するか。** 中核価値が**間違っている**とは言っていない — **経験的根拠が無い**と言っている | A: 裁定維持・根拠のみ差し替え(競合実査を先に置く) / B: 中核価値の裁定を再検討 / C: 維持し「顧客需要は未測定」を裁定本文に明記 |
| **③** | **次の PRIMARY_OBJECTIVE** | A: 競合 real-fire 実査 / B: Registry Design(範囲限定、A4·V7 に立つ) / C: 器材の再測定(H8 / E1 startup) / D: orchestration 是正 |

---

## 6. 次の Objective への入力(menu であって queue ではない)

### 6-1. 再測定が必要な数値(positive control 付きで)

| 対象 | 何を測り直すか |
|---|---|
| **H8 server memory** | unique physical memory / PSS / footprint / 実 8-session RAM / RSS→billing 変換。**合計 RSS を使わない** |
| **E1 startup** | cold/warm・順序反転・反復を control として持つ。ready の定義(WS 接続のみ / LSP 接続込み)を分ける |
| **H6 偽 diagnostic** | **全 5 URI を分類する collector** と、その collector 自身の positive control |
| **H2 LNA permission** | programmatic grant ではなく**実 prompt**、再起動後の永続性、回数 |
| **H10 署名 UX** | signed / unsigned の**実 installer を build** し、Gatekeeper / SmartScreen 実挙動を測る |
| **V3 Classic 不変** | bootloader / partitions / bootApp0 の**個別 mutation control**。comparator source を保存する |
| **V4 isolation** | **known-bad workspace / cache を計器に与える** |
| **V8 registry** | network のある環境で `^0.32` / `^0.34` 両 arm を再実行し、version 不在と通信不能を分離する |
| **V10a image cost** | **image を実際に build** して配布 artifact の増分を測る |

### 6-2. 競合 real-fire で確かめるべきこと

**文献調査と real-use を混同しない。**現在の実利用は **0 製品**。

- Codey Online / PleaseDontCode / Arduino Cloud で**同じ課題を通す**
- **料金・無料枠・実用に課金必須かを一次情報で確認する**(`07_…md` S6/S7/S8 が現時点の一次情報)
- 見落としカテゴリ(`06_…md` §7 の 10 カテゴリ)を探索式を記録したうえで走査する

### 6-3. Registry 設計へ渡せる requirements input(schema は設計しない)

| 入力 | 出典 |
|---|---|
| Board が **frontend / compiler の二重正本**である実態(16 / 10、手書き) | `03_…md` A4 |
| **Device ⇔ Library を結ぶ registry が存在しない**(69/69 走査、structured library field 0 / library コメント 32 / include 生成 54) | `03_…md` A4 |
| global `lib_deps` が**未使用依存まで解決対象**にする(独立再現) | `04_…md` V7 |
| 非 registry 依存の内訳 **file 8 + git URL 1 + symlink 1** | `04_…md` §6 |
| **result cache に eviction / TTL / 容量上限がない** | `03_…md` §4-4 |
| **SCons shared-cache race の one-shot retry** が存在する | `03_…md` §4-6 |
| **ESP-IDF Partial Mirror** が version 制限の公式機構として先行実装されている | `07_…md` S11 |
| donor の **canonical-sample / host-compile probes** が Verified 昇格経路へ転用できる | `03_…md` §4-2 |
| **arduino-cli は library の offline 導入は可・core は不可** という非対称性 | `07_…md` S5 |

---

## 7. 本調査の限界

`01_method-and-lanes.md` §8 が owner。**実行できなかった rung 10 件、構造的限界 4 件を列挙してある。**
ここには再掲しない。

特に:**Codex の各 packet は互いの答えを見ていないが、同じ packet 作者(parent)が問いを設計している。
parent の盲点は packet の盲点になりうる。**
