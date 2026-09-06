# DigiCode Text — PoC 憲章 v0(WU-0 成果物)

**作成日:** 2026-08-29 · **work unit:** WU-0(紙のみ・実装なし)
**根拠:** `human-decisions.md`(2026-08-29 S010 分割受理 + D-1〜D-8)+ 2026-08-29 追加裁定(Q-2 / Q-3 / Q-4 / Q-5)+ 2026-08-29 **Q-1 確定・地域規制裁定** + 2026-08-29 **独立反証レビュー 11 件の Human 採否**(§4 を改訂)
**設計 evidence:** `../investigations/2026-08-27_managed-environment-architecture/`(読解順序 `05` → `06`。`04` は SUPERSEDED)

---

## §0. この文書の位置づけ

- 本憲章は **PoC 期間中の「合格」「対応済み」「完了」の意味の owner** です。以降の work unit(WU-1 以降)はここを参照します。
- **Human 裁定の owner は `human-decisions.md`** です。本憲章はそれを PoC の運用形へ落としたものであり、裁定を新設しません。**本憲章と `human-decisions.md` が食い違った場合、`human-decisions.md` が正です。**
- **測定値の owner は `../investigations/`** です。本憲章に転記した数値が investigation と食い違った場合、investigation が正です。
- 🔴 **Option C は採用された設計ではなく、PoC の作業仮説です。**本憲章は Option C を前提に手順を組みますが、**Option C を守ることを目的にしません。**

---

## §1. PoC が証明しようとしていること / しないこと

### 1.1 PoC の任務

**Option C を実装することではなく、Option C が壊れるかどうかを最短で観測すること。**

| 要求 | PoC が答える問い |
|---|---|
| **R-1** | (N+1) 番目の device 追加が触る共有面は、小さく列挙可能で device 数に比例しないか |
| **R-2** | canonical(機種共通)と instance(project 固有)を機械的に分離できるか |
| **R-7** | 1 protocol の encoding schema を、他 protocol の profile を触らずに migrate できるか |

### 1.2 PoC が答えない問い(明示)

- 🔴 **総コスト削減の是非。** S010/N-3 の `NOT DECIDABLE WITHOUT MEASUREMENT` は解除されていません。**PoC の成果として「コストが下がった」と言わないこと。**それは **D-1「PoC 後の本格比較」**の担当です。
- **製品としての user value。** S007 の `proposed product value NOT RESOLVED` も解除されていません。
- **6 か月後の再現性(R-6)。** D-5 により Artifact Archive を作らないため、**PoC 期間中は達成不能**です(§4.3)。
- 🔴 **canonical / instance 分離が実際に成立していること。** R-2 が確認できるのは**分離の機械的強制が働くこと**までで、**provenance ラベル自体の真偽は検証できません**(§4.2)。
- 🔴 **protocol 間の非干渉性。** 2 番目の protocol が PoC 期間中に存在しないため、**R-7 は非干渉を検証していません**(§4.3.1)。**本当の検定は PoC 後**です。

---

## §2. Support Status Contract v0(D-2 / D-3 の運用形)

### 2.1 level 定義

status は **Evidence Store から導出**します。**手入力しません。期限切れします。**
(出典: `06_corrected-architecture.md` D.2。各 level の「測れないこと」は同 D.2 が owner)

| Level | 名称 | 必要な証拠 | 🔴 この level が**測っていない**こと |
|---|---|---|---|
| **L0** | `DECLARED` | adapter の `encoding_schema` に対する検証通過。identity / source / licence 記録 | 構文整合のみ。**schema 妥当な偽の register map も通る** |
| **L1** | `RESOLVES` | 依存解決成功 + lock 生成。licence 衝突なし | lock 機構自体が未成熟な間は暫定 |
| **L2** | `BUILDS` | 実 compile RC=0(1 board 以上)。artifact digest + `era_hash` 記録 | **都合のよい 1 board を選べば通る。**device との意味的一致は測っていない |
| **L3** | `BUILDS_SET` | **代表 board 集合**(§3)で compile green | 代表集合を governed artifact として固定しない限り**分母は操作可能** |
| **L4** | `CONFORMS` | simulator / probe に対する protocol 適合。channel の read/write 実行。**negative control 必須** | 🔴 **simulator を同じ profile から生成すると自己確認になる** — simulator は**独立の出所**(vendor 文書 / 別実装)から作ること。誤 word order が FAIL することは decoder の検出力を示すが、**address が真であることは示さない** |
| **L5** | `HARDWARE` | 実機。機種名 **と firmware version**、実行した channel、期待値・許容誤差・fault ケース・channel coverage、担当者、日付 | 実施した channel の範囲まで |
| **L6** | `MAINTAINED` | §2.3 の維持ルールを満たしていること | 再検証した時点の上流に対してのみ |

### 2.2 Verified の最低 level(D-2)

🔴 **全 device 実機必須にはしません。**

| 区分 | PoC 期間中の運用 |
|---|---|
| **Verified の基本線** | **L3 `BUILDS_SET`(compile)+ L4 `CONFORMS`(conformance)+ Library 信頼情報**(§2.4) |
| **L5 `HARDWARE`** | **追加実績**。到達した device にだけ付く上位ラベルであり、Verified の必須条件にしない |
| **PoC 期間中の現実解(D-7)** | **L4 を実証するのは少数 device のみ**(§7 で Human が選定)。それ以外は **L3 + Library 信頼情報**まで到達させ、**L4 未達であることを表示する**(「対応済み」と表示しない) |
| **Custom** | 実際に到達した level をそのまま表示する。昇格を自動化しない |

⚠️ **PoC で観測して Human へ返すべき論点:** **L4 が構造的に成立しにくい device class が存在します。**GPIO / ADC 系(button · PIR · potentiometer · LDR)は適合すべき protocol を持たないため、L4 の検出力が protocol 系より低くなります。**この class の Verified 最低 level をどう扱うかは、PoC の観測後に Human が決めるべき事項**として open にします(本憲章では決めません)。

### 2.3 維持ルール — L6 `MAINTAINED` の運用定義(D-3)

**L6 は「その device class の最低 level(§2.2)を、現行上流 version に対して再検証済み」であることを指します。**
🔴 **L3 固定ではありません** — L5 を持つ device の L6 は L5 の再検証を要します(非単調な梯子を作らないため)。

| trigger | 要求 |
|---|---|
| **Library / package の更新時** | 🔴 **再確認必須。**該当 device の最低 level を再実行する |
| **定期** | 🔴 **最低年 1 回の棚卸し。**再検証されないまま 365 日を超えた status は **期限切れ**とし、`STALE` を表示する |
| **security advisory** | 該当時は再確認 |

**「現行上流 version」の定義:** 棚卸し実施日時点で、その package registry が解決する version。⚠️ これは ERA の exact pin と緊張します(pin は固定、棚卸しは追随)。**PoC ではこの緊張を解消せず、観測して記録します。**

### 2.4 Library 信頼情報(Verified の構成要素)

Verified の基本線に含める「Library 信頼情報」を、PoC では以下の**記録された事実**とします。判断を足しません。

| 項目 | 内容 |
|---|---|
| identity | package name / **exact version** / registry 出所 URL |
| licence | licence 識別子 + **本文取得の有無**(採用時に本文を読む義務 — baton 15) |
| provenance | 取得元(registry / Git / URL / file)と digest |
| 依存 | 解決した dependency と **lock の成否** |
| 上流の活性 | 最終更新日(取得日つき) |
| 既知の問題 | advisory / 既知の解決不能依存(例: `FastAccelStepper@^0.32` が現在解決不能 — baton 22。**donor 側の問題であり Text 側で直さない**) |

---

## §3. 代表 board 集合(D-4 + Q-2)

🔴 **Q-2 裁定: 全量。**部分集合にしません。

| 群 | 内容 | platform |
|---|---|---|
| **Classic 対応 Board** | 現行 DigiCode の全 board(**全て ESP32 系**、frontend 16 physical / compiler 10 distinct FQBN) | ESP32 |
| **Wio Node** | 追加 | **ESP8266**(3 つ目の platform になり得る) |
| **XIAO RP2040 系** | 追加 | **RP2040** |
| **Pico / Pico W** | 追加 | **RP2040** |

⚠️ **Classic 16 の正確な列挙は本憲章に転記しません。**出典は donor の `boardStore.ts:100-312` / compiler の FQBN mapping であり、**WU-1 で donor を read-only で読んで確定**します(推測で埋めない)。

🔴 **この集合の意味(PoC の性格を決める点):**
Classic は **RP2040 ファミリを「共有依存 universe と非互換で、分離するより削除する方が容易」という理由で丸ごと削除**しています(`boardStore.ts:21`、S010/L1 実測)。**D-4 はその RP2040 を初期目標へ戻す指示**であり、**PoC は WU-1 の時点で 2〜3 アーキテクチャを跨ぎます。**
→ **R-1 の最初の実地検証は device 層ではなく board 層で発生します。board 層で依存を分離できないなら、device 層を作る意味がありません。**

### 3.1 保有実機(Q-4)

L5 は追加実績として、以下の範囲で拾えます。

| platform | 保有機 |
|---|---|
| ESP32 系 | **XIAO ESP32C3** · **XIAO ESP32S3** · **ESP32 DevKit** · **M5Stick CORE S3** |
| RP2040 系 | **XIAO RP2040** · **Pico** · **Pico W** |
| ESP8266 | **Wio Node** |

**制約として明記:** 代表 board 集合(§3)は保有実機より広い。**したがって L3 `BUILDS_SET` は全 board、L5 は保有機のみ**という非対称が PoC 期間中は常に存在します。**この非対称を「実機で確認済み」と混同しないこと。**

---

## §4. PoC の合否判定(実装前に定義する)

🔴 **後付けの基準は判定になりません。**以下は WU-1 着手前に確定した判定です。

> **本節は 2026-08-29 の独立反証レビュー(11 件)の Human 採否に従って改訂されています。**
> レビューの結論は「**停止規律自体は機能するが、判定入力・試験対象・分類境界に操作余地があり false PASS を構成可能**」でした。以下の定義は **その操作余地を塞ぐこと**を目的とします。**新しいツール・work unit・監査体系は追加しません。**

### 4.1 R-1 — 共有面テスト(PoC の主判定)

| 項目 | 内容 |
|---|---|
| **手順** | **事前登録した 20 profile**(§4.1.1)を順に追加し、**1 件追加ごとに共有面の変更を数える** |
| **共有面の定義** | 追加のたびに編集が必要になる、device 非依存の中央資産(登録配列 / catalog / locale / 依存 universe / toolbox 相当 / selector 規則 等)。**WU-1 完了時点の実体で確定し、以後動かさない**(定義を後から緩めない) |
| **編集回数の定義** | §4.1.4(**共有面の git diff 非零**。手作業か自動生成かを問わない) |
| **期待値** | 🔴 **0。1 件でも超えたら R-1 は偽** |
| **偽だった場合** | 🔴 **その時点で停止し Human へ返す(Q-5 / §4.4)。**「直して通す」ことをしない |

#### 4.1.1 20 profile の事前登録制(指摘 1-1 の処置)

🔴 **20 profile の構成を、測定開始前に確定し、以後変更しません。**
簡単な側(同一 adapter · holding register read 中心 · datatype / scale 差のみ)に 20 件を寄せれば、共有面編集 0 は「選定した簡単な 20 件については 0 だった」ことしか示しません。

| 要件 | 内容 |
|---|---|
| **分布** | **A3 の実測分布を反映する** — pure-data 側と code-bearing 側の比を **5 : 15(25% : 75%)** とする(`02_hypothesis-falsification.md` A3) |
| **必須で含める軸** | 🔴 **word order 差 · bit field · 複数 register にまたがる値 · read / write 混在 · 特殊 encoding** を**それぞれ最低 1 件**含める |
| **確定の時期** | **測定を開始する前**(最初の 1 件を追加する前)に構成リストを確定する |
| **凍結** | 🔴 **確定後は変更しない。**測定中に「この profile は不適当だった」として差し替えない。差し替えが必要と判断した場合は**測定を止めて Human へ返す** |
| **記録先** | 該当 work unit の完了報告(Markdown)。**専用ツールを作らない**(§5 と同じ運用) |

#### 4.1.2 共有面の凍結範囲と先回り実装(指摘 1-2 の処置 — 部分採用)

🔴 **先回り実装の完全防止は不可能です。**測定開始前に共有面へ機能を入れておけば、その後の 20 件で編集 0 を作れます。**この抜け道は原理的に閉じられない**ことを、憲章として明記します。**その上で、以下で観測可能にします。**

| 措置 | 内容 |
|---|---|
| **凍結範囲** | 共有面は **Q-1 の 3 device(§7.0:タクトスイッチ · HX711 · Modbus RTU 温湿度)が実際に必要とする範囲のみ**で凍結する。**20 件のために必要そうな機能を先に入れない** |
| **diff 確認** | **WU-5 で「共有面の実装内容」と「WU-1〜WU-3 が実際に必要とした機能」の diff を Human が確認する。**(既存 work unit の判定項目であり、新しい work unit ではありません) |
| **申告義務** | 🔴 **作り置きと見える汎用機能は、実装側が申告する。**申告されていない汎用機能が diff で見つかった場合、**R-1 の測定は無効**として Human へ返す |

#### 4.1.3 共有ロジックの profile 側押し込み(指摘 1-3 の処置 — 軽量採用)

配置場所だけで shared / profile を判定すると、**本来共有すべき処理を profile · 参照 package · `capability_code` · device 個別 helper へ複製**して中央編集を 0 に見せられます。

| 措置 | 内容 |
|---|---|
| **検査** | **WU-5 の判定項目に、profile 間の重複コード検査を 1 項追加する。**🔴 **機械的な copy 検出で足りる**(専用の解析基盤を作らない) |
| **扱い** | **有意な重複は「共有面の回避」と見なし、Human 判定へ回す。**実装側が「これは profile-owned だ」と自己判定しない(§4.4 の分類権と同じ規律) |

#### 4.1.4 「編集回数」の機械的定義(指摘 4-2 の処置)

🔴 **編集回数 = 共有面の `git diff` が非零であること。**

- **手作業か自動生成かを問いません。**catalog · registry index · generated lookup · dependency manifest 等が **profile 追加によって自動更新された場合も、共有面の変更として計上します。**
- 「人間は編集していないので 0 回」という解釈を認めません。R-1 が測るのは **(N+1) 番目の device 追加によって device 非依存の共有面が変わるかどうか**であり、変更の発生源は問いません。

### 4.2 R-2 — provenance テスト

🔴 **本テストの主張は縮小されています(指摘 2-1 の処置)。**

| 項目 | 内容 |
|---|---|
| **主張すること** | **canonical / instance 分離の「機械的強制」が働くこと**(宣言された provenance に従って validator が正しく振る舞うこと) |
| **主張しないこと** | 🔴 **provenance ラベル自体の真偽は validator では検証不能です。**project 固有の slave address を `origin: datasheet` と記録すれば PASS します。**R-2 の PASS を「canonical / instance 分離が成立していることの証明」と表現しません** |
| **ラベル真偽の補い方** | **Q-1 の 3 device(§7.0)について、datasheet との突き合わせ spot-check を Human が行う。**🔴 これは**人手の抜き取り確認**であり、機械的保証ではありません。**自動照合ツールを作りません** |
| **走査対象** | 🔴 **profile 単体ではなく canonical 側資産全体**(profile · adapter · `capability_code` · 参照 package · helper · external definition)。profile の表面だけを見ると、instance 値を参照先へ移すことで検出を免れます(指摘 2-2) |
| **FAIL すべき** | **slave address · bus binding · topic · endpoint · 資格情報**、および `origin: site` の値(例: HX711 の calibration scale)。**canonical 側のどこに置かれていても FAIL** |
| **PASS すべき** | `origin: datasheet` の値(例: register address、datasheet 由来の scale) |
| **🔴 注意** | **フィールド名の禁止ではなく provenance の分類が正しいことを見るテスト**であること(S010/L4 F-04 の訂正)。**register address は profile が当然持つ値であり、禁止対象ではありません** |
| **negative control** | 🔴 **必須。**壊れた入力が FAIL することに加え、**instance 値を 1 つ意図的に canonical 側資産(adapter / `capability_code` 等)へ埋め、それが FAIL することを確認する。**FAIL しなければ R-2 の検出力はその範囲で無い |

### 4.3 R-7 — migration リハーサル

| 項目 | 内容 |
|---|---|
| **手順** | 合成 profile に対し、`modbus-rtu` の `encoding_schema` を 1 回 migrate する |
| **N と分布(事前固定 — 指摘 3-1 の処置)** | 🔴 **N = 20。構成は §4.1.1 で事前登録した 20 profile と同一とする**(R-7 のために別の、通しやすい合成集合を作らない)。したがって **word order 差 · bit field · 複数 register · read / write 混在 · 特殊 encoding が最低 1 件ずつ含まれる。**加えて **schema version 差と edge case を最低 1 件ずつ含める。確定後は変更しない** |
| **migration 強度(事前指定 — 指摘 3-2 の処置)** | 🔴 **semantic 変更クラス**(**word-order 表現変更級**。datatype 表現変更 · address semantics 変更 · encoding 構造変更を含む)。**field rename · optional field 追加 · default 値追加のような容易な migration は不可** |
| **期待** | **protocol 単位で migrate できること** |
| **判定の精度条件(指摘 3-3 の処置)** | 🔴 **影響を受けるべき evidence が無効化されること**、**かつ同時に、影響を受けない evidence が有効なまま残ること**(= negative control)。**schema version 変更で全 evidence を無条件 invalidate する実装は FAIL。**「無効化が観測された」だけでは合格になりません |
| **🔴 同時に観測すべきこと** | **semantic 層の変更は全体波及であり、証拠を無効化し得る**(S010/L4 F-07 の訂正)。**「証拠を無効化せずに schema を変えられる」ことは要求ではありません。**無効化が**主張ではなく観測**されること |

#### 4.3.1 「他 protocol 非干渉」を合格主張から外す(指摘 3-4 の処置 — 主張の削除)

🔴 **R-7 の合格主張から「他 protocol の profile を触らない」を削除します。**

- scope 制約(§6.2)により、**2 番目の protocol / adapter は PoC 期間中に存在しません。**存在しないものを触らないのは自動的に成立するため、**非干渉性は PoC では検証していません。**
- **既知の限界として明記します:** **非干渉の本当の検定は 2 番目の protocol を入れたときであり、それは PoC 後**です(S010/N-4)。**PoC の結果を「protocol 間の分離が確認できた」と表現しません。**

### 4.4 停止規律(Q-5)

> 🔴 **R-1 が偽と出た時点で PoC を停止し、Human へ返す。**
> Option C ごと見直す(2026-08-29 Human 裁定)。**Option C を守るための追加設計を PoC 中に始めない。**

同じ規律を R-2 / R-7 にも適用します。**判定が出たら止めて報告する**のであって、判定を通すための修正を続けません。

#### 4.4.1 分類権は実装側にない(指摘 4-1 の処置)

レビューの指摘は「**STOP 規律は強いが、STOP を発火させる前の『これは FAIL なのか』という分類に解釈余地がある**」ことでした。悪意がなくても、**善意の分類**(「これは初期実装の不足修正」「これは schema 初期設定」「これは bug fix」「これは loader の一般化」「これは profile 追加とは別の基盤修正」)で計上を回避できます。

🔴 **したがって分類権を実装側から外します。**

| 規律 | 内容 |
|---|---|
| **計上** | **測定期間中の共有面変更は、理由を問わずカウントする。**bug fix · 初期設定 · 別作業 · 一般化 の別を**問わない**(§4.1.4 の git diff 非零がそのまま計上根拠) |
| **停止** | **カウントが 1 に達した時点で停止する。**停止は分類の**前**に起きる |
| **分類** | 🔴 **FAIL か否かの分類は Human が行う。実装側は分類判断をしない。**実装側の役割は「起きた変更をそのまま報告すること」まで |
| **§4.1.3 の重複も同様** | 有意な profile 間重複を「profile-owned だから問題ない」と実装側が自己判定しない。Human 判定へ回す |

## §5. 工数記録(D-1 の後続比較を可能にするための計器)

🔴 **Q-3 追加裁定: 6 分類の粗い集計のみ。ツール化しない。**

| # | 分類 |
|---|---|
| ① | authoring / UI / generation |
| ② | dependency / licence 解決 |
| ③ | compile matrix 修復 |
| ④ | 実機 UAT |
| ⑤ | docs / i18n / sample |
| ⑥ | 上流 churn / support incident |

**運用:**
- work unit 単位で、上記 6 分類に**粗い時間**を記録する。分単位の精度を求めない。
- 記録先は work unit の完了報告(Markdown)。**専用ツール・計測基盤・自動収集を作らない。**
- 🔴 **これを最初に置く理由:** 後から始めると比較の分母が失われ、**D-1 の本格比較が「やったが測れなかった」になります。**粗くても、最初から取ることに意味があります。

---

## §6. PoC の scope 制約

### 6.1 実装スタックの境界(Q-3)

> 🔴 **PoC のスタック選択は、製品スタックの決定ではありません。**
> **baton 3(技術スタックと deployment target)は未決のまま**であり、PoC はそれを確定させません。

- **donor 資産は参考にしてよい**(donor は TypeScript / Node、compile は Docker + PlatformIO)。ただし **donor の既存前提を無条件に継承しない**(project CLAUDE.md)。
- PoC のコードは **PoC の計器**であって production 実装ではありません(baton 24 / 26 / 56 と同じ位置づけ)。**PoC の成果物を「製品の実装が始まった」と読まないこと。**
- 製品スタックの裁定が必要になったら、**PoC を進めずに Human へ返す。**

### 6.2 scope 外(紛れ込ませないために明記)

| 対象 | 理由 |
|---|---|
| **Artifact Archive の実装** | **D-5 により当面保留。**🔴 帰結: **ERA は「同じか」しか言えず、上流消失時の再取得可能性は別機構**。したがって **R-6「6 か月後の再現性」は PoC では未達**であり、**製品の約束として語らない** |
| **2 番目の protocol / adapter** | R-1 検証(§4.1)の**後**。ここが本当の一般化検定であり、PoC で先取りしない(S010/N-4) |
| **L5 の網羅** | D-2 により追加実績。保有機の範囲で拾うが、**合否条件にしない** |
| **Custom → Verified 昇格のソフトウェア化** | 二層構造の方針は裁定済みだが、機械化は PoC 外 |
| **AI datasheet 抽出 / AI 統合本体** | AI は製品の主機能だが、PoC の任務は registry 側の反証。**「AI と Compiler が同じ正本を読む」ことの実証は ERA hash で最小限に留める** |
| **marketplace · knowledge graph · ontology · 独自 DB engine · 分散 registry** | S010「要求でないもの」を継承 |
| **Desktop packaging · Azure · HA discovery 実装 · 本番 UI** | 製品段階 |
| **auto Web UI adapter** | WU-5(R-1 判定)が PASS してからのみ意味を持つ |
| **規制情報(技適 / CE / FCC 等)の schema 表現** | §7.1 の裁定により **schema 設計の論点へ持ち越し**。PoC では扱わない |
| **製品スタックの確定** | §6.1 |

---

## §7. L4 実証デバイス(**Q-1 は 2026-08-29 に Human が確定**)

### 7.0 確定した 3 件(Human 裁定 2026-08-29)

| 枠 | **確定した device** | L4 の検証手段 |
|---|---|---|
| **①** pure-data 型 | **タクトスイッチ(ボタン)** | GPIO digital。**donor 実測の pure-data 5 family の 1 件**(button) |
| **②** `capability_code` が要る型 | **HX711 + ロードセル** | **simulator** による L4 conformance |
| **③** 産業型 | **Modbus RTU 温湿度センサ** | **simulator** による L4 conformance |

- **L4 の検証は simulator で行います。**憲章 §2.1 L4 の要件どおり、**simulator は profile と独立の出所**(vendor 文書 / 別実装)から作ります。**同じ profile から生成した simulator は自己確認であり L4 の証拠になりません。**
- **2026-09 の三菱インバータ + RS485 実機系は「流用可能性のみ」**です。🔴 **PoC の前提条件にしません。**実機が来なくても①②③の判定が出る構成を維持します(D-2 により L5 は追加実績)。
- 🔴 **本裁定は §7.1 以降の候補一覧を無効化しません。**候補一覧は選定の根拠として残します。

### 7.1 device 選定基準に関する裁定 — 地域規制(技適等)

**Human 裁定(2026-08-29):**

- 🔴 **地域規制(日本の技適を含む)を device の除外基準にしません。**
- **DigiCode Text は国際利用を前提**とします。ある地域で認証されていないことは、その device を registry から排除する理由になりません。
- **規制情報を registry / profile schema でどう扱うか(表現するのか、しないのか、どの層が持つのか)は schema 設計の論点へ持ち越し**ます。**本憲章では決めません。**

⚠️ **帰結:** donor が「技適制約により SPI 版 MFRC522 を永久にサポートしない」とした方針(`rfidBlocks.ts:14-17` / `compile.ts:187-190`)は **donor の判断であり、DigiCode Text はこれを継承しません**(project CLAUDE.md)。ただし **L5 実機を実施する場合の法令遵守は Human の領域**であり、AI は判定しません。

### 7.2 候補一覧(選定の根拠 — 記録として保持)

**分母:** S010/L3 が実測した **donor 20 device family**(`02_hypothesis-falsification.md` A3 が owner)。
**pure-data 化可能 5 / code-bearing 15。**以下は選定時に提示した候補であり、**AI は選定していません。**

### ① 既存 adapter 上の pure-data 型(donor 実測 5 family)

**donor 実測の 5 件:** button · PIR · potentiometer · LDR · **Modbus holding-register endpoint**(汎用 RTU engine が存在する場合)

| 候補 | 入手性 | L4 実証の観点 | 検出力 |
|---|---|---|---|
| **タクトスイッチ / ボタン** | 極めて容易 | GPIO digital read。polarity / pull-up が data 化できるか | 🔴 **低**(適合すべき protocol が無い) |
| **可変抵抗(10 kΩ)** | 極めて容易 | ADC read + affine scaling。**scale の provenance テストに使える** | 🟡 中(R-2 向きだが L4 向きではない) |
| **LDR(CdS)** | 極めて容易 | ADC + 分圧。**非線形性をどこまで data で表すかの境界が見える** | 🟡 中 |
| **PIR(HC-SR501)** | 容易 | digital + 保持時間。**時間的振る舞いが data 化できるかの試金石** | 🟡 中 |

⚠️ **正直な注記:** ①は **R-1 / R-2 の検証には向くが、L4 `CONFORMS` の検出力は構造的に低い**(§2.2)。**①だけを選ぶと PoC は「うまくいく側」しか測りません。**

### ② `capability_code` が要る型(donor 実測 15 family)

**donor 実測の 15 件:** thermistor · encoder · YF-S201 · HX711 · MAX30102 · APDS9960 · GPS · SCD30 · PMS5003 · QTR · BLE GATT/NUS · RFID · DFPlayer · AS5600 · ENV-IV composite

| 候補 | 入手性 | code が要る理由(donor 実測) | PoC 上の価値 |
|---|---|---|---|
| 🟢 **HX711 + ロードセル** | 容易・安価 | **calibration**(tare / 既知質量での校正 / scale 保存)— `hx711Blocks.ts:79` | 🔴 **R-2 の最良の題材。**calibration scale は **`origin: site`** であり **profile に入ってはいけない値**。canonical / instance 分離が最も鋭く試される |
| 🟢 **サーミスタ** | 極めて容易・安価 | **Beta 式の対数変換** — `analogSensorBlocks.ts:111` | 「非線形変換は data か code か」の境界が最小コストで見える |
| 🟢 **AS5600(I2C 磁気エンコーダ)** | 容易・安価 | 磁気角度センサ | I2C adapter 上の register 読みで、**Modbus 以外の bus で同じ形が成立するかの小さな試験** |
| 🟡 **GPS モジュール** | 容易 | **streaming parser / state machine** — `gpsBlocks.ts:57` | code-bearing の典型だが、L4 の simulator 作成コストが上がる |
| 🟡 **SCD30(CO2)** | やや高価 | **多段初期化 + 周期測定 + 3 channel cache** — `sensorAirQualityBlocks.ts:55` | 実用的だが PoC には重い |
| 🟡 **ロータリーエンコーダ** | 極めて容易 | **ISR 2 本 + volatile state + 20 ms delta** — `encoderBlocks.ts:56` | ISR は data 化不能側の代表。**ただし L4 simulator が難しい** |

### ③ 産業型(Modbus RTU — golden scenario 側)

**要 RS485 変換**(MAX485 / 自動方向制御モジュール)。donor の Modbus は **FC03 / FC06 の単一レジスタのみ**で、**register-map 層は存在しません**(検索ヒット 0)。**ここは donor 流用ではなく新規作業です。**

| 候補 | 入手性 | PoC 上の価値 |
|---|---|---|
| 🟢 **無名の Modbus RTU 温湿度センサ**(AliExpress 系) | 容易・安価 | 🔴 **S010 §F の Custom Device walk-through がまさにこの device を想定**している。**Custom → L0 → L2 → L4 の経路をそのまま実演できる** |
| 🟢 **Modbus RTU リレー基板**(Waveshare 等) | 容易・安価 | **write 側(FC06)の適合**。read だけで終わらせないために有用 |
| 🟡 **Modbus 電力計(PZEM-016 等)** | 容易 | 複数レジスタ・スケーリング・単位が一度に出る |
| 🔴 **産業インバータ(FR-E800 等)** | 入手困難・高価 | S010 の golden scenario の題材だが、**PoC で背負うには重い。**L5 は現実的でない |

### 選定にあたって Human に提示する論点

1. **①だけでは PoC が「うまくいく側」しか測りません。**②を最低 1 件入れるかどうか。
2. **③を入れると R-1 の検証が「産業 device で成立するか」まで届きます**が、RS485 変換の実機セットアップが要ります。
3. **HX711 は R-2(provenance)の題材として突出しています** — calibration scale が `origin: site` である点が、canonical / instance 分離の最も鋭い試験になります。
4. **L4 の simulator は「独立の出所」から作る必要があります**(同じ profile から生成すると自己確認になる)。**この作成コストが device ごとに大きく違います** — ③ Modbus は vendor PDF があるため作りやすく、②の ISR / streaming 系は難しい。
5. **推奨する規模は 2〜3 件**(D-7「少数 device」)。**AI は選定しません。**

---

## §8. 本憲章の限界(正直に)

- 本憲章は **S010 の設計と 2026-08-29 の Human 裁定を PoC の運用形へ落としたもの**であり、**新しい測定を 1 件も含みません。**
- **工数見積もりを付けていません。**根拠がないためで、推測で埋めていません。
- **Classic 16 board の正確な列挙**、および **§7 の候補が donor の実装とどう対応するか**の最終確認は、**WU-1 で donor を read-only で読んで行います。**
- S010 の統合は 3 セッション連続で独立レーンに反証されており(S007 13 件 / S009 12 件 / S010 71 中 36 件)、**自己点検は 3 回とも 0 件しか捕まえていません。**本憲章も同じ性質の文書です。
