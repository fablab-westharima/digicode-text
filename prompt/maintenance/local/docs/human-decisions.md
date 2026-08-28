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
