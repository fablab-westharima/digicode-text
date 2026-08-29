# DigiCode Text — Human Decisions

このファイルは **Human が確定した判断の current owner** です。

- 過去の investigation / session log は **immutable な historical evidence** であり、ここの記録によって書き換えません。investigation と本ファイルが食い違った場合、**製品判断としては本ファイルが現行、測定値としては `investigations/` が正しい**。
- ここに載るのは Human の裁定だけです。AI の推奨・提案・未裁定事項は載せません。
- 旧 harness 時代(〜2026-08-28)の Human 裁定の逐語記録は `../legacy/pre-native-harness-2026-08-28/handover/16_次セッション引き継ぎ指示書.md` §3 にあり、そちらは historical archive として保持します。**2026-08-29 以降の裁定は本ファイルが owner です。**

---

## 2026-08-29 — S010 の分割受理と BLOCKED 解除

**対象:** S010 `Managed Environment & Device Knowledge Architecture Design`
**evidence:** `../investigations/2026-08-27_managed-environment-architecture/`(読解順序 `05` → `06`。`04` は SUPERSEDED)
**判断者:** Human(2026-08-29)

### 1. 受理の範囲(分割受理)

| 対象 | 判断 |
|---|---|
| **反証系の結論** — 中心仮説「新 Device 対応 = data 追加でコスト大幅減」の **REFUTED**、および S007 での旧 product-value 根拠の反証 | ✅ **受理する** |
| **実測値** — donor 20 device family 中 pure-data 化可能は 5(25%、幅 20〜40%、低確度) | ✅ **受理する** |
| **Option C の採用** | ❌ **受理しない。** Option C は **「PoC の作業仮説」** へ位置づけを変更する |
| **R-1 / R-2 / R-7 の充足** | 未検証のまま。**PoC 自体がその実地検証を兼ねる。PoC で崩れた場合は Option C ごと見直す** |

**付記(Human):** S010 の調査過程は旧オーケストレーション体制下で行われ、**中間判断の採用・棄却は Human に可視化されていない。結論は受理するが、過程の再現性は保証対象としない。**

### 2. D-1〜D-8 の決定

`06_corrected-architecture.md` §「🔴 Human に必要な決定」に対する回答。**現時点の方向**であり、PoC の実測で覆り得る。

| # | 決定事項 | **Human 決定(2026-08-29)** |
|---|---|---|
| **D-1** | 狭められた仮説を採用するか、比較測定に投資するか | **PoC 後、本格比較も実施してよい** |
| **D-2** | Verified の device class ごとの最低 level | **全デバイス実機必須にはしない。Compile / Conformance + Library 信頼情報を基本とし、L5 実機は追加実績とする** |
| **D-3** | `L6 MAINTAINED` の `N days` と「現行上流 version」の運用定義 | **Library 更新時に再確認 + 最低年 1 回の棚卸し** |
| **D-4** | 「代表 board 集合」の選定規則 | **Classic 対応 Board + Wio Node + XIAO RP2040 系 + Pico / Pico W を初期目標とする** |
| **D-5** | Artifact Archive を作るか | **ERA は必要。Artifact Archive は当面保留が妥当** |
| **D-6** | ESPHome / HA 語彙の release baseline | **既存語彙を baseline とし、industrial の不足分を DigiCode 側で拡張する** |
| **D-7** | MVP に L4 conformance を含めるか | **MVP は L4 までの方向。PoC でも少数 device について L4 を実証可能とする** |
| **D-8** | 本設計を次の PRIMARY_OBJECTIVE(PoC 実装)へ進めるか | **次は PoC = 実装段階、という理解で正しい** |

### 3. 状態

- 🔴 **S010 の `BLOCKED` を解除する。** 上記の分割受理をもって **決着**とする。
- S010 を「Option C 採用済み」として扱わない。**Option C は PoC の作業仮説**である。
- 次段階は **PoC(実装段階)**。ただし **PoC の scope・着手は Human GO を要する**(本裁定は方向の確定であって、個別 work unit の GO ではない)。

### 4. この裁定が supersede するもの

- `../README.md` §S010 の「Human acceptance は取得されていません」
- `../docs/evidence-index.md` §S010 の「S010 の Human acceptance は未取得です」
- `../../../CLAUDE.md` の「S010 checkpoint `a6212af` は保存用であり、S010 の ACCEPTED / CLOSED を意味しない。未処理の Human 判断が残っている」
- `../handover/sessions/S010_…md` §2b の `BLOCKED` 状態(**session log 自体は immutable として書き換えない**。状態の現行 owner が本ファイルへ移る)
- `../legacy/…/handover/16_次セッション引き継ぎ指示書.md` §1 の `PRIMARY_OBJECTIVE: BLOCKED`(legacy archive として原文保持)

**supersede されないもの:** S010 の測定値・反証結果・risk / unknown 一覧(N-1〜N-19)は有効な evidence として残る。とくに **N-3「総コスト削減は NOT DECIDABLE WITHOUT MEASUREMENT」** は解除されていない。

---

## 2026-08-29 — PoC 着手条件(Q-2 / Q-3 / Q-4 / Q-5)と WU-0 の GO

**対象:** PoC scope 案(`~/Downloads/DigiCode_Text_PoC_Scope_Proposal_2026-08-29.md`)§5 の Human 判断事項
**判断者:** Human(2026-08-29)

| # | 論点 | **Human 決定** |
|---|---|---|
| **Q-1** | L4 実証デバイスの選定 | **未決。**候補の提示のみ AI が行い(`poc-charter.md` §7)、**選定は Human が行う** |
| **Q-2** | 代表 board 集合 | **全量。**Classic 対応 Board + Wio Node + XIAO RP2040 系 + Pico / Pico W。部分集合にしない |
| **Q-3** | PoC の実装スタック | **donor 資産は参考にしてよい。**ただし **PoC のスタック選択は製品スタックの決定ではない**ことを憲章に明記する(baton 3 は未決のまま)。**工数記録は 6 分類の粗い集計のみとし、ツール化しない** |
| **Q-4** | 実機の保有範囲 | **ESP32 系:** XIAO ESP32C3 / XIAO ESP32S3 / ESP32 DevKit / M5Stick CORE S3。**RP2040 系:** XIAO RP2040 / Pico / Pico W。**ESP8266:** Wio Node。**L5 はこの範囲で追加実績として拾う** |
| **Q-5** | 停止規律 | 🔴 **R-1 が偽と出た時点で停止し、Human へ返す。**Option C を守るための追加設計を PoC 中に始めない |

**GO:** **WU-0(PoC 憲章、紙のみ)を実施する。**成果物は `poc-charter.md`(2026-08-29 作成)。
**WU-1 以降の着手は、Q-1 の選定と別途の Human GO を要する。**

**付記(2026-08-29、Human 提供の予定情報 — 裁定ではない):** Human は **2026-09 に三菱インバータ + RS485(M5Stick RS485 Hat)+ ESP32 の実ロギング系を別件で構築予定**。**③ 産業型(Modbus RTU)の L5 実機および Custom device walk-through の実例データとして、PoC へ将来流用できる可能性がある。**現時点では予定であり、PoC の前提条件にしない。

---

## 2026-08-29 — Q-1 の確定と地域規制の扱い

**対象:** L4 実証デバイスの選定(Q-1)、および Q-1 補足調査で浮上した技適(地域規制)の扱い
**判断者:** Human(2026-08-29)
**evidence:** `~/Downloads/DigiCode_Text_Q1_Owned_Sensor_Mapping_2026-08-29.md`(donor read-only 調査)

### 1. Q-1 確定 — L4 実証デバイス 3 件

| 枠 | **確定した device** | L4 の検証手段 |
|---|---|---|
| **①** pure-data 型 | **タクトスイッチ(ボタン)** | GPIO digital(donor 実測 pure-data 5 family の 1 件) |
| **②** `capability_code` が要る型 | **HX711 + ロードセル** | **simulator** |
| **③** 産業型 | **Modbus RTU 温湿度センサ** | **simulator** |

- **2026-09 の三菱インバータ + RS485 実機系は「流用可能性のみ」。**🔴 **PoC の前提条件にしない。**
- simulator は **profile と独立の出所**から作る(`poc-charter.md` §2.1 L4 の要件)。

### 2. 地域規制(技適等)の扱い

- 🔴 **地域規制を device の除外基準にしない。**
- **DigiCode Text は国際利用を前提とする。**ある地域で認証されていないことは registry からの排除理由にならない。
- **規制情報を registry / profile schema でどう扱うかは schema 設計の論点へ持ち越す。**憲章では決めない。
- donor の「技適制約により SPI 版 MFRC522 を永久に非サポート」という方針は **donor の判断であり、DigiCode Text は継承しない。**

---

## 2026-08-29 — 独立反証レビュー(11 件)の採否

**対象:** `poc-charter.md` §4(R-1 / R-2 / R-7 / 停止規律)に対する独立反証レビュー
**evidence:** `~/Downloads/DigiCode Text PoC 憲章 — 独立反証レビュー.md`
**判断者:** Human(2026-08-29)。**11 件全件について採否と処置を確定**(「12 件」は誤記)

| 指摘 | 採否 | 処置 |
|---|---|---|
| **1-1** profile 選定操作 | **採用** | 20 profile の構成を**事前登録制**。A3 の分布を反映し、word order 差 · bit field · 複数 register · read/write 混在 · 特殊 encoding を含む構成リストを**測定開始前に確定し、以後変更しない** |
| **1-2** WU-1 先回り実装 | **採用(部分)** | **完全防止は不可能**と憲章に明記。共有面は **Q-1 の 3 device が必要とする範囲のみで凍結**。WU-5 で「共有面の実装内容 vs WU-1〜3 が実際に必要とした機能」の diff を Human が確認。**作り置きと見える汎用機能は実装側が申告** |
| **1-3** 共有ロジックの profile 側押し込み | **採用(軽量)** | WU-5 に **profile 間の重複コード検査を 1 項追加**(機械的な copy 検出で足りる)。有意な重複は共有面回避と見なし **Human 判定へ回す** |
| **2-1** provenance ラベルの真偽 | **採用(主張の縮小)** | R-2 の主張を「**分離の機械的強制が働くこと**」に縮小。**ラベル自体の真偽は validator では検証不能**と明記し、Q-1 の 3 device について **datasheet との突き合わせ spot-check(Human)** で補う。**R-2 PASS を「分離成立の証明」と表現しない** |
| **2-2** canonical 参照資産への instance 混入 | **採用** | R-2 の走査対象を profile 単体から **canonical 側資産(adapter / capability_code 等)全体へ拡大**。negative control として **instance 値を 1 つ意図的に canonical 側へ埋め、FAIL することを確認** |
| **3-1** N・構成の自由度 | **採用** | 合成 profile の **N と分布**(register type · datatype · endian/word order · read/write · edge case)を**憲章に事前固定** |
| **3-2** migration 強度 | **採用** | migration 内容を **semantic 変更クラス(word-order 表現変更級)**と事前指定。**field rename · optional 追加級の容易な migration は不可** |
| **3-3** 全消し invalidation | **採用** | 判定に**精度条件**を追加:影響を受けるべき evidence の無効化と**同時に、影響を受けない evidence が有効なまま残ること**(negative control)。**全件無効化は FAIL** |
| **3-4** 他 protocol 不在で非干渉が空疎 | **採用(主張の削除)** | R-7 の合格主張から「**他 protocol 非干渉**」を外し、**PoC 時点では検証不能**である旨と「**2 番目の protocol が本当の検定(PoC 後)**」を既知の限界として明記 |
| **4-1** FAIL 認定前の善意の分類 | **採用** | **分類権を実装者から外す。**測定期間中の共有面変更は**理由を問わず**(bug fix · 初期設定 · 別作業の別なく)カウントして停止し、**FAIL か否かの分類は Human が行う**。実装側は分類判断をしない |
| **4-2** 自動生成変更の除外解釈 | **採用** | 「編集回数」の定義を「**共有面の git diff 非零**」に機械化。**手作業か自動生成かを問わない** |

**制約:** **新しいツール · work unit · 監査体系を追加しない。**改訂は**判定定義の明確化に限る。**
**反映先:** `poc-charter.md` §4(全面改訂)+ §1.2(既知の限界 2 件を追加)。
