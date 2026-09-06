# DigiCode Text — Managed Environment & Device Knowledge Architecture Design Report

**日付:** 2026-08-27 · **Session:** S010 · **種別:** Architecture Design Objective（**production implementation GO ではない**）
**作成:** Claude Code (Opus 5, medium 固定) = Harness / Integration Conductor
**レーン:** Codex 独立 4 レーン（L1 donor 実測 / L2b 先行実装一次資料 / L3 仮説反証 / L4 統合反証）

---

## 🔴 この報告書の読み方 — 最初に読むべき一節

**本設計の中心仮説は、設計を始める前に独立レーンで反証にかけました。結果は「現在の形では成立しない」でした。**

> **Human が期待した仮説:**
> Classic「新 Device 対応 = Block / Generator / UI / regression の実装」
> → Text「新 Device 対応 = Library / Protocol / Device knowledge / metadata の追加」
> → **したがって対応追加コストが大幅に下がる**
>
> **反証レーン L3 の判定: REFUTED（この普遍形では成立しない）。**
> **生き残った命題は、これだけです:**
>
> > **transport・初期化・timing・error 処理・変換を既に実装した安定した汎用 adapter が存在する場合に限り、
> > address / channel / 定数 / 単位 / 極性 / 単純な scaling だけが違う device は主に metadata として追加でき、
> > UI / generator の限界 authoring 作業を減らし得る。**

さらに、**この生き残った命題に基づいて私が書いた統合案そのものも、独立レーン L4 の反証にかけました。
71 個の検証可能な主張のうち 36 個（50.7%）が OVERSTATED / UNSUPPORTED / CONTRADICTED でした。**
本報告書は**その 36 件を訂正した版**です。訂正前の版は repository に監査証跡として残してあります。

これは 3 セッション連続で同じ欠陥が測定されたことになります（S007: 13 件 / S009: 12 件 + 過剰一般化 20 件 /
S010: 36 件 — 出典は `16.md` §3 と case index DT-6 / DT-9）。**3 回とも、統合者自身の self-check は 0 件しか
捕まえていません。**この事実自体が、以降の判断で「統合の断定」を割り引いて読むべき理由です。

---

# A. Requirements — 何を解く architecture なのか

## A.1 実測された問題（Classic 側）

Classic の追加コストは「Block を書くこと」だけではありません。L1 が donor source から実測した値：

**3 件の実追加（HX711 = 単純センサ / Modbus RTU = プロトコル / Relay = アクチュエータ）の初期 commit:**
**32 file instances / 642 added lines。**内訳は block 実装 410 行（63.9%）· 生成 AI catalog 134 行（20.9%）·
toolbox 53 行（8.3%）· regression 配分 27 行（4.2%）· 初期 i18n 15 行（2.3%）· global registry 3 行（0.5%）。

しかし本当の病理は**共有面の結合**です。pin 時点の実測分母：

| 共有面 | 現在の分母 | 1 件追加が触る理由 |
|---|---:|---|
| `BlocklyEditor.tsx` | **72** block module import | import 副作用で登録するため |
| `toolboxGenerator.ts` | **90** category / 10 mode list | 静的配列。1 追加あたり **5〜6 箇所** |
| `public/ai/block-catalog.json` | **580** block / 79 category | AI が読む単一の生成 catalog |
| locale JSON × 5 | 各 **約 4,124** leaf key | category と message を全 locale で反復 |
| `compile-api/src/compile.ts` | **57 エントリの単一 global 依存 universe** | compile が全部入りから始まる |
| `sampleProjects.ts` | **69** | 単一配列 |
| `sampleProjectsI18n.ts` | 4 override section | locale ごとの反復 |
| `fewShotSelector.ts` | global selector rule | AI の例選択が中央集権 |
| `crossBlockContracts.ts` | **10** protocol contract | 新 protocol は共有 record を追加 |

**⚠️ 精度に関する訂正（L4 F-01）: 「1 件追加ごとに 9 面すべてを編集する」は測定されていません。**
実測 3 件のうち、初期 commit で 9 面すべてを触ったものはありません。catalog / 依存 / sample は後続バッチで入り、
**その per-device 費用は `NOT OBTAINED`** です。実測が支持するのは「機械的な fan-out が存在すること」までです。

**ただし、その結合が実害を生んだことは実測されています:**
- `compile.ts:219` が明記 — **依存 1 つの placeholder が 20 board 中 16 board のビルドを汚染した**。
- `boardStore.ts:21` — **RP2040 ファミリは丸ごと削除された**。共有依存 universe と非互換で、
  依存を分離するより削除する方が容易だったため。

## A.2 したがって要求は「device を data にすること」ではない

| # | 要求 | 根拠 |
|---|---|---|
| **R-1** | (N+1) 番目の device 追加が触る共有面を、**小さく・列挙可能で・device 数に比例して増えない集合**に限定する | L1 の結合実測（「0 にする」ではない — L4 F-01） |
| **R-2** | **device が何であるか（canonical / 機種共通）**と、**project がそれをどう使うか（instance）**を分離する | L2b が ESPHome generic Modbus で両者の混在を実測 |
| **R-3** | 「対応済み」は**名前のついた証拠から導出される状態**であり、意見であってはならない | L3/A7。これが無いとコスト比較が反証不能になる |
| **R-4** | 「AI と Compiler が同じ正本を読む」は**文ではなくハッシュ一致**でなければならない | L3/A6 |
| **R-5** | **code を一級の、versioned で証拠を持つ市民として扱う** | L3/A3: donor の 20 device family 中 **15 が code-bearing** |
| **R-6** | project が 6 か月後に再現できること | L2b Q-B: 先行 7 システムすべて lock **NONE** |
| **R-7** | **1 つの protocol の encoding schema を、他 protocol の profile を触らずに migrate できること。**（semantic 層の変更は全体波及であり、証拠を無効化し得ることを設計として認める） | L3/A2 + L4 F-07 による訂正 |

**要求でないもの（drift 防止のため明記）:** 全組合せ保証 · marketplace · knowledge graph · ontology ·
独自 DB engine · 分散 registry · 「初心者に難しいから機能を削る」方向（既存裁定）。

---

# B. Entity / Relation Model

## B.1 組成原理 — **adapter が投資単位、device はその上の data**

L3/A3 が決定的です。**pure data で表現できるのは device family の約 25%（strict 法で 5/20、慎重な幅 20〜40%、
低確度）であり、しかも汎用 runtime adapter が既に存在する場合に限られます。** L2b が独立に同じ形を確認：
汎用 `modbus_controller` で足りる新 Modbus device なら、**新規 Python component ファイルは 0 個**。
足りなければ external component（= code）が必要。

```
 Project Manifest        ← instance: どの board / どの device / slave addr / pin / topic / endpoint
        │ overlay（canonical へ merge しない）
        ▼
 Device Profile          ← canonical: この「機種」が何か。identity / interface / protocol binding /
        │                   CHANNELS / constraints。DATA。
        ▼
 Protocol / Transport Adapter   ← CODE。versioned・証拠を持つ。自分の `encoding` schema を所有。
        │
        ▼
 Package (library) ── Framework / Toolchain ── Board / Platform     ← DATA + pin された artifact
        │
        ▼
 Environment Resolution Artifact (ERA) + Artifact Archive  ← 全 consumer が一致すべき正体
```

この形を採る理由は、**code / data の境界を、L3 が実測した場所そのものに置く**ためです。結果として、コストに
関する正直な言明が構造から出てきます — per-device は下がり得る、per-protocol は下がらず償却されるだけ、
証拠コストについては**どちらとも測定されていない**。

## B.2 registry は 5 つのオーナーに分割し、関係で結ぶ（単一巨大 registry にしない）

| オーナー | 保持するもの | 分ける理由 |
|---|---|---|
| **Platform Registry** | platform · board · framework · toolchain（exact version pin）。フィールドは PlatformIO board manifest + Arduino `package_index.json` に準拠（L2b S5.2 / S6.2） | board の変化は上流由来で device 意味論と無関係 |
| **Package Registry** | library release: `name · version · dependencies[{name, constraint}] · frameworks · platforms/architectures · license · url · archiveFileName · checksum · providesIncludes`（Arduino `library_index.json` + PlatformIO `library.json` から。**新しい package schema を発明しない**） | 既に公開されている ecosystem と相互運用するため |
| **Adapter Registry** | protocol / transport / bus adapter。**code artifact**、package と同様に versioned。各 adapter が `encoding_schema` を宣言 | R-7 の firebreak（**部分的**。B.5 の限界を参照） |
| **Device Knowledge Registry** | Device Profile（B.3）。**canonical のみ** | R-2。ESPHome にも donor にも存在しない層 |
| **Evidence Store** | `(profile@v, adapter@v, package@v…, board, toolchain@v, generator@v)` → 結果 + artifact + 日時 | R-3。status はここから導出され、手入力されない |
| **Artifact Archive**（**L4 F-02 で追加**） | 解決済み artifact の**バイト保存**（content-addressed）。上流消失時の取得経路 | digest は「同じか」しか言えない。**再取得可能性は別の仕組みが要る** |

**project instance configuration は registry ではありません。** user の project 内の manifest です（B.4）。
**backend も registry entity ではありません**（Human §15）: backend は (a) project manifest 内の
**deployment profile** と、(b) 必要なら **backend adapter package**（protocol adapter と同じ市民階級）です。
Azure · local Mosquitto · Node-RED · InfluxDB · 独自 REST · Home Assistant が同じ種類の物になり、
1 つ増やしても device knowledge を触りません。

## B.3 Device Profile — schema v0（Modbus 束縛の例）

```yaml
profile_id: dev.mitsubishi.fr-e800          # namespace:vendor:model（Viam の triple 形、L2b S4）
version: 1.2.0                              # semver。profile は versioned artifact
schema_version: 1                           # 読み手は versioned（D.3）
identity:
  manufacturer: Mitsubishi Electric
  model: FR-E800
  revision_range: ">=1.00 <2.00"            # firmware/hardware 適用範囲は identity の一部
interface: rs485                            # gpio|i2c|spi|uart|rs485|can|4-20ma|0-10v|pulse|ethernet
protocol:
  adapter: adapter.modbus-rtu               # ← この profile が要求する CODE
  adapter_version: "^1.0"
defaults:                                   # canonical な既定値。project で override 可
  baud: 19200
  parity: even
channels:
  - id: output_frequency
    origin: datasheet                       # 🔴 provenance（L4 F-04）— canonical/instance の判定軸
    semantic: { device_class: frequency, state_class: measurement, unit: Hz }
    access: read
    datatype: u16
    encoding: { register_type: holding, address: 0x2103, register_count: 1, value_type: U_WORD }
    transform: { scale: 0.01, scale_origin: datasheet }   # 🔴 scale にも provenance
    ui: { display: numeric, graph: true, precision: 2 }
  - id: output_current
    origin: datasheet
    semantic: { device_class: current, state_class: measurement, unit: A }
    access: read
    datatype: u16
    encoding: { register_type: holding, address: 0x2104, value_type: U_WORD }
    transform: { scale: 0.01, scale_origin: datasheet }
    ui: { display: numeric, graph: true }
  - id: running
    origin: datasheet
    semantic: { device_class: running }
    access: read
    datatype: bool
    encoding: { register_type: holding, address: 0x2100, bitmask: 0x0001 }
    ui: { display: led }
  - id: alarm
    origin: datasheet
    semantic: { device_class: problem }
    access: read
    datatype: enum
    encoding: { register_type: holding, address: 0x2101, value_type: U_WORD }
    transform: { enum_map: { 0: none, 16: OC1, 32: OV1, 48: THT } }
    ui: { display: badge }
  - id: run_command
    origin: datasheet
    semantic: { device_class: switch }
    access: write
    datatype: bool
    encoding: { register_type: holding, address: 0x2000, bitmask: 0x0002 }
    ui: { display: toggle, confirm: true }
capability_code: []                          # 正直な逃げ道（B.5）
constraints: { poll_interval_min_ms: 100, max_concurrent_reads: 1 }
```

**出所の明示（L4 F-11 対応）:**
- `encoding` と `value_type`（`U_WORD` … `FP32_R` の word order 列挙、`register_type` の FC01/02/03/04、
  `bitmask`、`offset`、`register_count`）は **ESPHome の一次資料から実測されたモデル**（L2b S1.1）。
- `semantic` の `device_class` / `state_class` / `unit_of_measurement` は **Home Assistant の一次資料から
  実測された語彙**（L2b S2.1）。
- **ただし `semantic` という入れ子構造、`origin` / `scale_origin`、`ui` ブロック、`capability_code`、
  profile 全体の構成は「設計」であり、どこかで測定されたものではありません。**
- L2b の検証は `static`（公式 docs / schema / source の取得と読解）と `API-smoke` のみで、
  **synthetic / real-fire は一切実行されていません。**「production で実証済み」とは言えません。

**profile が意図的に持たないもの:** slave address · pin 割当 · MQTT topic · Azure endpoint · 資格情報 ·
現場都合の poll interval。これらは instance（R-2）。

## B.4 Project Manifest — instance の overlay

```yaml
schema: digicode.project/1
board: esp32-s3-devkitc-1
framework: { type: arduino, version: "6.1.0" }
devices:
  - ref: inverter_1
    profile: dev.mitsubishi.fr-e800@1.2.0
    bind: { bus: rs485_a, slave_id: 3, overrides: { baud: 38400 } }
    calibration:                       # 🔴 origin: site の値はここに来る（L4 F-04）
      # 例: HX711 の scale factor はここ。profile 側には置かない
buses:
  - id: rs485_a
    adapter: adapter.modbus-rtu@1.4.2
    pins: { rx: 16, tx: 17, de_re: 4 }
telemetry:
  - { from: inverter_1.output_frequency, to: mqtt_main, topic: factory/line1/inv1/freq }
backends:
  - id: mqtt_main
    kind: mqtt                         # deployment profile であって registry entity ではない
    endpoint: "mqtt://192.168.1.50:1883"
    credentials: ${secret:MQTT_MAIN}   # 参照のみ。リテラルは絶対に書かない
ui: { auto: true }
```

## B.5 `capability_code` — 75% を正直にモデル化する

L3/A3 は donor の **20 device family 中 15 が code-bearing** と実測しました：ISR（encoder、YF-S201）·
calibration ループ（HX711、QTR）· 永続的アルゴリズム状態（MAX30102）· 非線形変換（thermistor の Beta 式）·
ストリームパーサ（GPS）· 多段初期化 + readiness polling（SCD30）· BLE の callback / race / 復旧処理。

**これらの居場所を持たない architecture は、現実の 4 分の 1 だけをモデル化していることになります。**

```yaml
capability_code:
  - id: calibration
    package: pkg.digicode.hx711-calib@1.0.3    # Package Registry のエントリ。versioned・licensed・
    entry: calibrate(known_mass_g)             #   compiled・証拠を持つ。free text ではない
```

規則: **`capability_code` は Package 参照であり、profile 内にインラインのソースを書かない。**
data record にインラインコードを許すと、registry は build も licence も証拠も無い codebase に静かに変わります。

これは ESPHome の `lambda` / `external_component`（L2b S1.3/S1.4）を**アドレス可能・pin 可能にしたもの**です
— ただし ESPHome がそうしているという意味ではなく、**ESPHome の inline lambda / external ref に対する設計上の
変更提案**です（L4 F-11 A26 の訂正）。

## B.6 🔴 Option C が**残す**共有面 — 正直な列挙（L4 F-01）

「共有面がゼロになる」は成立しません。Option C が持つ共有面は少なくとも 15 あります：

1. Device Profile root schema / 共通 channel・access・datatype schema
2. `semantic` 語彙 + validator
3. `transform` 語彙（`scale`、`enum_map` …）
4. `ui` 語彙 + widget 推論規則
5. Adapter registry / adapter loader
6. Package registry schema / resolver / licence policy
7. Platform / board registry
8. Evidence record schema + L0–L6 status contract
9. ERA schema / canonical serializer / resolver / attestation contract
10. representative board-set policy
11. generated build-manifest schema + Compiler interface
12. AI environment context serializer
13. channels → Web UI / MQTT / HA / logging の各変換器
14. namespace / supersession / security-advisory reverse index
15. registry snapshot の公開・保管

**これらを触るのはどういう時か**（= R-1 の本当の主張）:

| 追加の種類 | 触る共有面 |
|---|---|
| 既存 adapter 上の device、既存 semantic 語彙で足りる | **なし**（record の追加のみ） |
| 新しい `device_class` / 単位が要る device | 2, 13 |
| 新しい widget 表現が要る device | 4, 13 |
| **新しい protocol** | 5 + 新 adapter 実装（= Classic の per-block コストに相当する規模の一回払い） |
| 新しい board | 7, 10 |
| schema 変更 | 1〜3, 8, 9（D.3 参照） |

> **R-1 の主張（設計claim、未構築）:** 共有面は **device 数に比例して増えない**。Classic では device #N が
> 1..N−1 と共有する配列・catalog・locale・依存 universe を編集するのに対し、Option C では通常の device 追加は
> record の append で済む。
> **反証テスト:** MVP で 20 個の profile を順に追加し、**共有面への編集回数を数える**。
> 期待値は「既存 adapter・既存語彙で足りる profile については 0」。1 件でも超えれば、この主張は偽。

---

# C. Architecture 候補の比較

### Option A — 単一中央 registry
全 entity（board / package / device / protocol / compatibility / project config）を 1 つのモデルの行として持つ。

*利点:* 一貫性が自明、クエリ面が 1 つ、着手が最も簡単。
*欠点:* schema 変更の影響半径が全 entity 種別に及ぶ。project instance data が canonical の隣に置かれ、
L2b が実測した ESPHome の混在を再現する（Q-A）。
*⚠️ 訂正:* 「Option A では**あらゆる** schema 変更が global migration になる」は L4 F-11（A27）で
**UNSUPPORTED** と判定されました。E2 が示したのは 1 つの catalog の migration 例であり、全 entity 種別への
必然性ではありません。ここでの欠点は「影響半径が**大きくなりやすい**」であって「必ずそうなる」ではありません。

### Option B — 複数ドメイン registry + relation graph
project configuration も graph node の 1 種として扱う。

*利点:* migration 影響半径がドメイン単位、拡張しやすい。
*欠点:* project configuration を graph node にすると canonical と instance が再び混ざり（R-2 不成立）、
現場ごとの secret / endpoint が共有ストアへ入る。汎用 relation graph は Human §33 が名指しした過剰設計の入口
でもある（証拠は ontology を要求していない）。backend を node にすることは Human §15 が前提にするなと述べた事項。

### Option C — adapter 固定の階層 canonical registry + project manifest overlay + resolution lock ✅
5 つのドメイン registry（B.2）、**adapter が自分の `encoding` schema を所有**、canonical に merge しない
project manifest、全 consumer を束縛する **ERA + Artifact Archive**。

*利点:* R-1〜R-7 を**設計として**狙える形。借用した語彙はすべて L2b が一次資料で確認したもの。
code/data の境界が L3 の実測位置と一致する。
*欠点:* ERA + Artifact Archive は**先行実装がどこにも無い**（L2b Q-B: 7/7 が `NONE`）。差別化要素であると
同時に**未証明の工学的コスト**。adapter を跨ぐ横断クエリ（「周波数を測る device をすべて」）には semantic 層の
統一が要るが、encoding は統一されない — `semantic` が protocol 非依存であることに依存する。

**採用: Option C。**

> ⚠️ **ただし L4 F-11 の指摘どおり、「Option C が R-1 / R-2 / R-7 を満たす」ことは検証されていません。**
> validator も実装も存在しないため、これは**設計意図の宣言**であり、達成の報告ではありません。
> 各要求には上記および以下に**反証テスト**を付けてあります。それが通るまでは未達です。

---

# D. Selected Architecture — 中核定義

## D.1 Environment Resolution Artifact（§18 と L3/A6 への答え）

L3/A6 は「AI と Compiler が同じ正本を読む」を**現在の言語形では REFUTED** とし、内容を持たせるための 9 項目を
提示しました。ERA はその 9 項目です。**ただし L4 F-02 / F-12 により 2 点を訂正しています。**

```
ERA = {
  registry_snapshot_digest,                    # 1
  schema_version,                              # 2
  profiles:  [{id, version, digest}],          # 3
  packages:  [{id, version, content_digest}],  # 4  adapter と capability_code package を含む
  dependency_lock,                             # 5  transitive を含む完全解決、pin 済み
  target: {board, fqbn, toolchain_version, core_version, build_flags},   # 6
  generator_version,                           # 7
  build_manifest_digest                        # 8  🔴 訂正: 生成された source fragment を
                                               #     snapshot へ結びつける manifest の digest。
                                               #     project manifest の digest ではない
}
era_hash = sha256(canonical_json(ERA))
```

**9 番目 = attestation。🔴 L4 F-12 による訂正 — ハッシュのエコーバックでは不十分です:**

```
attestation = {
  era_hash_requested,
  identities_actually_used: { registry_snapshot, packages[], toolchain, core, generator, board },
  artifact_digest,
  compiler_identity,
  signature            # ← 署名。信頼された compiler identity で検証する
}
```

- **AI** は ERA の内容だけを環境の正本として与えられ、その外の package / board / device を提案できない
  （明示的に宣言された Custom / external モードを除く。§H）。
- **Compiler** は `era_hash` とともに起動され、**ERA が同一に解決しない要求を拒否する**。
- **すべての consumer**（AI / UI / MQTT / HA）が hash 不一致で**実行を拒否する** gate を持つ。
  これが無いと、入力ハッシュをそのまま返す Compiler が acceptance test を通ってしまう（L4 F-12）。

**受け入れ基準 = 反証テスト**（L3/A6 から採用）:
1. AI 生成と compile の間で registry を変更 → compile は**古い manifest を拒否**しなければならない;
2. library alias の指す先を変えて名前は変えない → digest が変わり、compile は**拒否**しなければならない;
3. 別の lock / toolchain を持つ origin へ compile を回す → attestation が**不一致を露呈または拒否**しなければならない;
4. lock された入力を再実行 → 依存解決は**同一**でなければならない。

**🔴 再現性についての訂正（L4 F-02）。ERA だけでは 6 か月後の再現性は成立しません。**
digest が言えるのは「取得したバイトが同じか」だけで、そのバイトを**再取得できること**は保証しません。
実測された上流の現実：ESPHome の branch / default / 可動 tag は変化し content snapshot 保証が無い（L2b S1.4、
署名検証も無い）· Arduino index 自体が更新され、`discoveryDependencies` / `monitorDependencies` は
**version を持たない**（L2b S5.2）· PlatformIO には依存解決 lock が無い（L2b S6.3）· 7 システムすべてで
transitive が逃げる（L2b Q-B）。

したがって **Artifact Archive（B.2）が必須構成要素**です。未解決の設計課題として残るもの：
PlatformIO の実解決結果の捕捉 · framework / tool package の保存 · package script が取得する外部資材 ·
保存容量とライセンス上の再配布可否。**「project は再現可能」と現時点で言うことはできません。**

**L1 が実測した「なぜこれが要るか」:** donor の compile 要求は現在、source fragment + FQBN + connection type を
運び、**catalog identity も snapshot も lock も digest も持ちません**（`compileService.ts:47`）。
donor 自身の `/health` SHA 照合は、load balancer が別 origin から答え得るため**近似にすぎない**と文書化されて
います（`:119`）。「同じ名前」はまさにこの失敗形です。

## D.2 Support Status Contract（§23 と L3/A7 への答え）

L3/A7 は本 objective で最も方針を変える発見です。**donor には既に少なくとも 3 種類の「対応済み」がある** —
UI に見えているが検証分母からは除外（`boardStore.ts:63`）· **代替 board 定義**でコンパイルし物理 UAT は保留
（`boards.ts:69`）· 100% compile gate は実機 servo 検証とは明示的に別（`servoSpeedCompileRateMatrix.test.ts:29`）。
契約が無ければ、architecture は**弱い意味を採用するだけでコストを「下げた」ように見せられます**。分母の洗浄です。

| Level | 名称 | 必要な証拠 | **この level が測れないこと**（L4 F-03） |
|---|---|---|---|
| **L0** | `DECLARED` | adapter の `encoding_schema` に対する検証通過。identity / source / licence 記録 | **構文整合のみ。**schema 妥当な偽の register map も通る |
| **L1** | `RESOLVES` | 依存解決成功 + lock 生成。licence 衝突なし（**policy と権限の owner を定義すること**） | lock 自体が未構築の間は暫定 |
| **L2** | `BUILDS` | 実 compile RC=0（1 board 以上）。artifact digest + `era_hash` 記録 | **都合のよい 1 board を選べば通る。**device との意味的一致は測れない |
| **L3** | `BUILDS_SET` | 宣言された**代表 board 集合**で compile green | **「代表」の選定規則・最小集合・変更条件を governed artifact として固定しない限り、分母は操作可能** |
| **L4** | `CONFORMS` | simulator / probe に対する protocol 適合。channel の read/write 実行。**negative control 必須** | **🔴 simulator を同じ profile から生成すると自己確認になる。**simulator は独立の出所（vendor 文書 / 別実装）から作ること。wrong word order が FAIL することは decoder の検出力を示すが、**address が真であることは示さない** |
| **L5** | `HARDWARE` | 実機。機種名 **と firmware version**、実行した channel、担当者、日付。**期待値・許容誤差・fault ケース・channel coverage を必須項目にする** | 実施した channel の範囲まで |
| **L6** | `MAINTAINED` | **その device class の最低 level**（L3 ではない）を、現行上流 version に対して N 日以内に再検証済み。security advisory なし | 🔴 訂正: 旧案は `L3+` のみを要求しており **L5 より弱い L6 が成立してしまう非単調な梯子**だった。`N days` と「現行上流 version」の定義は ERA の exact pin と緊張するため、**運用定義を Human が決める必要がある** |

**Verified** = device class ごとに **Human が定める最低 level** + **人間レビュー記録**。
（産業用アクチュエータは L5 を要求、GPIO ボタンは L3 で足りる、等。）
**Custom** = 実際に到達した level をそのまま表示。**status は手入力せず、Evidence Store から導出し、期限切れする。**

これは Particle の洞察の一般化です — L2b S3.1 は `verification.txt` が**フラグではなく再実行可能な手順**である
ことを実測しました。上の各 level は結果だけでなく**手順**を保存します。

**⚠️ 訂正（L4 F-03）:** L2b の新規実測 **Particle verified 10 / 977 = 1.02%**（従来の 10/972 = 1.03% を更新。
分子 10 は確認、分母が +5）は、**「全部 Verified は到達不能」の証明ではありません。**L2b 自身が
「977 は公開 docs ページ数の proxy であり、Particle API の直接 registry count ではない」と限界を明示しています。
言えるのは「先行する成熟した実装においても、verified coverage は現に非常に小さい」という**観測**までです。

## D.3 Migration の防火帯 — **部分的**であることを含めて（L3/A2 + L4 F-07）

L3/A2 は donor の**はるかに単純な** catalog が既に generator 15 commit / audit 8 commit /
catalog 111 commit を、schema `1.0` のまま蓄積していることを実測しました。

| # | 施策 | 適用範囲 |
|---|---|---|
| 1 | **adapter が `encoding` schema を所有** | ✅ 局所化する: Modbus の encoding 変更は Modbus profile のみに及ぶ |
| 2 | `semantic` は共有・低速変化の語彙（HA 由来）、変更は追加のみを方針とする | ⚠️ **局所化しない。**上流の意味修正・廃止は project policy では止められない（L2b S1.6 が ESPHome の docs↔dev 衝突と 2027.3 削除予定を実測） |
| 3 | `transform` / `ui` / `datatype` / `access` / channel identity / status 解釈 | ⚠️ **すべて adapter の外 = 全 adapter へ波及する。**owner を明示的に定めること（現状未定義だった — L4 F-01 #3） |
| 4 | 全 record が `schema_version` を持ち、読み手は versioned。**古い snapshot は読めるまま、書き換えない** | ✅ R-6 の前提 |
| 5 | **semantic migration は既定で証拠を無効化する。**level を維持できるのは**証拠を再実行した場合のみ**で、同等性の主張では維持できない | ✅ ただし R-7 の文言は「証拠を無効化せずに schema を変える」ではなく「**protocol 単位で migrate できる。semantic 層の変更は全体波及であり証拠を無効化し得る**」に訂正済み（旧 R-7 は D.3 と内部矛盾していた — L4 F-07） |
| 6 | **migration リハーサルを MVP に含める** | 2 番目の adapter を出す前に、N 個の合成 profile に対して最初の schema 変更を実演する |

---

# E. Golden Scenario walk-through — インバータ → RS485/Modbus RTU → ESP32 → MQTT → Azure/RPi → UI/HA

1. **device 追加。** FR-E800 の profile を作成（または AI が提案、§H）。
   書くもの: **Device Knowledge Registry に 1 record。**触る共有面: **既存 adapter・既存 semantic 語彙で
   足りるなら 0**（B.6 の反証テスト対象）。
2. **register map。** `output_frequency` / `output_current` / `running` / `alarm` / `run_command` が
   address + `register_type` + `value_type`（word order） + `bitmask` + `scale` + `unit` + `access` +
   `device_class` + `origin` を持つ。`adapter.modbus-rtu@1` の `encoding_schema` で検証 → **L0 `DECLARED`**。
3. **RS485 / Modbus の関係。** profile は `interface: rs485` と `adapter: adapter.modbus-rtu` を宣言。
   adapter は code で、**既に存在する**。
   ⚠️ **訂正（L4 F-06）:** 「したがって adapter のコストは二度払いにならない」は経済的主張であり、
   **L3 は総コストを未決（NOT DECIDABLE）としています。**構造として一回払いであることは言えますが、
   **その額が Classic の per-block コストと同等だという主張は未測定**です。
4. **board 選択。** manifest が `esp32-s3-devkitc-1` + arduino 6.1.0 を選ぶ。Platform Registry が
   chip variant ごとの framework 制約を持つ（L2b S1.5 で実測）。
5. **code 生成。** generator が *profile + manifest + adapter* から C++ を生成: DE/RE 方向制御つき bus 初期化、
   宣言された word order と scaling による channel 単位の read/write、telemetry publisher。
   **DE/RE callback、UART 設定、初期化順序、error fallback は adapter の code であって data ではありません**
   — L3/A4 が「最も好都合なケースですらこれが要る」と実測（`modbusBlocks.ts:32`）。
6. **依存選択。** Package Registry 上の解決が **lock** を生成し、ERA に入る。
   L1 との対比: donor は **57 エントリの単一 global 依存 universe を全 ESP32 ビルドへコンパイル**しており、
   これが「placeholder 1 つで 20 board 中 16 board が汚染」の機構です。ここでは解決が **project 単位**です。
   ⚠️ **訂正（L4 F-11）:** 「したがってこの失敗形は構造的に存在しない」「RP2040 は削除せずに済んだはずだ」は
   **counterfactual であり測定されていません。**project 単位解決でも、壊れた依存 / 可動 version /
   transitive の問題は残ります。言えるのは「**共有 universe 由来の汚染機構は無い**」までです。
7. **compile。** `era_hash` つきで起動。不一致は拒否。成功は identities を列挙した署名つき attestation を返す。
   → **L2 `BUILDS`**、代表 board 集合で **L3 `BUILDS_SET`**。
8. **MQTT。** `telemetry:` が `inverter_1.output_frequency` を topic へ写像。channel の
   `device_class: frequency` / `state_class: measurement` / `unit: Hz` が一緒に運ばれる。
9. **Raspberry Pi / Azure。** `backends:` は **deployment profile** であり registry entity ではない（Human §15）。
   local Mosquitto を Azure IoT に替えても manifest が変わるだけで canonical は動かない。
10. **UI / Home Assistant。** auto Web UI は同じ channel から導出。
    ⚠️ **訂正（L4 F-09）: 「ほぼ無改造で再利用できる」は過大でした。**
    L1 が実測した donor の widget モデルは toggle / slider / display の 3 種で、フィールドは
    `channelId` · `label` · `dataType` · `min/max` · `canRead/canWrite/canNotify` です。本設計が追加する
    `graph` · `badge` · `confirm` · HA semantics · MQTT mapping は**新規**です。さらに L1 は
    **schema は `endpoint.path` を持つが standalone bundle は `/` を直接構築するという fidelity caveat**
    を記録しています（現状は既定が `/` なので一致しているだけ）。
    正確な言明: **transport 契約（`GET /schema.json` 起動 + `{"id","value"}` の ASCII envelope）と
    renderer の骨格は再利用候補として強い。widget 語彙は拡張が必要で、それは共有面 4/13 の編集にあたる**（B.6）。
    同じ channel record から Home Assistant の **MQTT discovery** payload も出せます — `device_class` /
    `state_class` / `unit_of_measurement` / `unique_id` / `state_topic` / `command_topic` は L2b S2.2 が
    実測した discovery キーそのものだからです。

**🔴 「同じ正本」の正確な言明（L4 F-08 による訂正）。**
旧稿の「1 つの record を 6 つの consumer が読む」は**誤りでした**。本設計自体が複数の record を要求します —
Device Profile · Project Manifest · Adapter package/schema · ERA · generated build manifest · Evidence record。
MQTT topic は manifest 側、Compiler が読むのは build manifest、HA には `unique_id` / topic / device identity が
追加で要ります。**正しい言明は次のとおりです:**

> **channel record が、UI・MQTT・Home Assistant・AI に対する共通の*意味的*入力になる。**
> **そして ERA が、それら全 consumer が同じ解決済み環境の上で動いていることを*検証可能*にする。**
> **これは設計目標であり、D.1 の 4 つの反証テストが通るまでは達成ではありません。**

---

# F. Custom Device walk-through — 無名の AliExpress Modbus 温湿度センサー

1. **manual / PDF。** vendor PDF を upload。**Custom** の source artifact として digest つきで保存。
2. **register map + AI 抽出。** AI レーンが draft profile を提案: address / datatype / word order / scale /
   unit / access / semantic。**これは提案であり、証拠ではありません**（既存裁定）。
   L3/A5 がその理由: donor 自身の AI 生成は prompt だけの緩和が「一貫して失敗した」ため semantic validator を
   必要とし、retry orchestrator は **4 回試行後も残存問題を含む XML を返し得る**。
3. **Custom Device Profile。** `adapter.modbus-rtu@1` の `encoding_schema` で検証 →
   **L0 `DECLARED`、`origin: custom`、`source: <pdf digest>`。**
4. **compile。** project がビルドできる → **L2 `BUILDS`**。
   **L2 が言っていないこと**: address 0x0001 が本当に湿度かどうかは何も検証していない。
5. **project lock。** ERA が profile version / adapter version / package version / toolchain を pin。
   ⚠️ **ただし D.1 の訂正どおり、Artifact Archive が無ければ 6 か月後の再取得は保証されません。**
6. **利用。** auto UI / MQTT / HA discovery が同じ channel から動く。UI は状態を**「L2」として**表示し、
   「対応済み」とは表示しない。
7. **Verified 候補。** 昇格には **L4 `CONFORMS`**（主張された map を再生する**独立出所の** simulator +
   negative control — 誤った word order は FAIL しなければならない）と、この device class では **L5 `HARDWARE`**、
   さらに人間レビュー記録が要る。**自動化される箇所はここには一つもありません。**

正直な読み方: この walk-through は step 4 で user を**動かし**、step 7 で初めて**信頼**します。
architecture の仕事は、その差をすべての画面で見えるようにすることです。

---

# G. Verified / Custom ライフサイクル — add · update · rollback · deprecate · remove · supersede

| 操作 | 機構 |
|---|---|
| **add** | versioned record を append。status は証拠から導出（D.2） |
| **update** | **新 version**。in-place 変更はしない。ERA が旧版を pin しているため既存 project は影響を受けない |
| **rollback** | manifest で旧 version を pin。lock により厳密（近似ではない） |
| **deprecate** | version への status flag + 後継ポインタ。既存 lock は動き続け、新規解決は警告する |
| **remove** | 公開済み snapshot から参照されている version の削除は**禁止**（R-6 が壊れる）。未公開 version のみ削除可 |
| **supersede** | `superseded_by: <id@version>` + migration note。UI と AI の両方が提示する |
| **migration** | §D.3。semantic 変更は既定で証拠無効化 |
| **security advisory** | package version に付き、lock にそれを含む全 profile / project へ伝播。`L6 MAINTAINED` を落とす |
| **breaking change** | 新版の `encoding_schema` / channel 集合を旧版と比較して検出。破壊的差分は**自動更新を止め、判断を要求する** |

**user が追加した Custom の更新（Human §21）:** 既定は **pin する・通知する・`latest` を自動採用しない**。
これは好みではなく実測に基づきます — L2b Q-B は先行 7 システムに解決 lock が無いこと、Viam の `latest` は
新 release で自動更新すること、ESPHome の external component を branch や可動 tag に pin すると
**署名検証も content snapshot 保証も無いまま静かに変わる**こと（L2b S1.4）を測定しています。
破壊的変更は**止めて問う**。

---

# H. AI Management Flow — AI をどこで使い、どこで構造的に禁じるか

**AI は提案する。証拠が受理する。** 既存裁定（AI 自己申告を acceptance evidence にしない）はここでは注意書き
ではなく荷重を支える制約であり、L3/A5 がその量を出しました：

- donor 自身の 1,000 ケース走行から観測された自動 compile スループット: **並列度 4 で約 131 ケース/時**。
  すなわち 16 board 集合に対する 1 device ≈ **7.3 分の compile-only 下限**;
- 人間レビューを 1 提案あたり 10 / 30 / 60 分と置いた場合の上限は
  **3.47 / 1.61 / 0.89 件/レビュアー時**、しかも**実機時間 `H` を含む前**;
- スループット ≤ `1 / (review + H + compile gate)`。

⚠️ **訂正（L4 F-06 / F-10）:** 上の 10/30/60 分の表は **L3 が「例示であり、観測された donor のレビュー時間ではない」
と明記したもの**です。ここでも感度分析としてのみ扱い、実測値として扱いません。また
「**AI は起案時間を除去する**」は過大で、L3 の言明は「**起案時間を下げ得る**」です。
**AI がレビューを不要にできないことは確かです。**

| AI タスク | 許される出力 | gate |
|---|---|---|
| package 発見 · 上流 release 監視 · changelog 解析 | **候補** record | L1 解決 + licence 確認 |
| dependency / licence 解析 | **候補** licence field | 人間が確認するまで候補のまま（L2b S3.2: licence は宣言 field であって導出値ではない） |
| datasheet / manual → register map | **draft profile** | schema 検証（L0）→ 独立出所の simulator 適合（L4）→ 人間レビュー。**Verified へ直行は不可** |
| sample 生成 · compile ケース生成 | artifact | 実際に compile すること（L2/L3） |
| 非互換 / breaking change 検出 | **フラグ** | 実ビルドで確認 |
| Custom→Verified 提案 | **キュー項目** | 人間レビューが必須で、最後の工程 |

**🔴 datasheet 抽出が最大リスクであり、architecture はそれが動く前提を置いてはいけません。**
L2b は Embedder の**公開資料からは**、任意 PDF を typed register schema へ正規化するパイプラインを
確認できませんでした（`NOT OBTAINED`）。文書化されているのは PDF の**索引化**と SVD / EDA パーサです。
⚠️ 訂正（L4 F-11）: これは「**先行実装すべてで未実証**」ではなく「**Embedder の公開資料では確認できなかった**」
です。PDF→profile は**未証明**として扱い、L4 で negative control つきの gate を置き、
依拠する前に測定すること（L3/A5 の「50 件以上の実マニュアルによる盲検試験」が正しい計器）。

---

# I. Compiler / AI / UI の統合

**Registry は Compiler を所有しません**（Human §16）。結合は各方向 1 つの artifact だけです：

```
Registry + Manifest ──resolve──▶  ERA (era_hash) ──▶ generated build manifest ──▶ Compiler
                                      │                                              │
                                      ├──▶ AI environment context（同じ内容）          │
                                      └──▶ UI schema / MQTT discovery / logging       │
                                                                                      ▼
                             attestation { era_hash_requested, identities_actually_used,
                                           artifact_digest, compiler_identity, signature }
```

Compiler のインターフェースは **build manifest + `era_hash`** で、registry を直接読まず、registry schema の
知識も持ちません。これにより「digicode-text は専用 Compiler を持つ」という既存裁定を保ちながら結合を緩く保て、
donor の技術（PlatformIO ビルド編成 · FQBN マッピング · artifact 生成 / packaging · error parsing · cache ·
queue · Docker 構成 · compile result API · regression / compile test 基盤）は 16.md §3 が「積極的に再利用する」
と定めたとおり再利用できます。

---

# J. QA Strategy — risk-based。ただし弱くしない

2 つの既存裁定が逆方向に引き、**両方とも有効です**: **全組合せ保証へ戻らない / 件数を目的化しない**（§22）と、
**QA を弱くしすぎない — Classic の厳格さは AI の「できました」を信用できなかったことから生まれた**（§23）。

何をビルドするかの選定軸（変更ごとに）:
- **変更面** — ERA から計算する（推測しない）、diff が触れた profile / adapter / package;
- **依存トポロジ** — 変更 package の逆依存;
- **リスククラス** — device class（産業アクチュエータ > センサ > GPIO 入力）と書込み能力
  （`access: write` を持つアクチュエータは高リスク）;
- **protocol 固有の危険軸** — word order / 符号 / bitmask / scaling。L2b が示した ESPHome の
  `U_DWORD_R` / `FP32_R` / `_S` variant はまさにこの軸;
- **歴史的に脆い組合せ** — Evidence Store が既にどの tuple が落ちたか知っている;
- **影響 board / 変更された toolchain** — toolchain 更新は `L6` を広範に無効化し、検出は安価。

**Classic から引き継ぐ非交渉事項:** 実 compile（静的チェックで代用しない）· L4 の **negative control**
（意図的に誤った word order が FAIL しなければ計器は何も証明していない）· 隔離環境 · guard 自体への mutation ·
class が要求するなら実機（L5）。**赤くなり得ない緑は証拠ではありません。**

節約するのは**選定**であって**厳格さ**ではありません。

---

# K. Classic vs Text 工数比較 — 証拠が許す範囲でのみ

## K.1 Classic 側（実測）

初期 commit: **1 追加あたり約 161〜309 行 / 10〜12 files**（3 件で 32 file instances / 642 行）。
加えて A.1 の共有面。3 device の i18n は最終的に **85 / 75 / 55 locale record**。
検証は別勘定で重い: 1,000 ケースの probabilistic 走行が**並列度 4 で約 7.6 時間**、平均 **109.4 秒/ケース**、
初期の走行は **921/1000** しか通らなかった。

⚠️ **訂正（L4 F-10）:** catalog / 依存 / sample / few-shot の費用は**後続バッチ由来で per-device 値は
`NOT OBTAINED`** です。「1 追加あたりの定常費用」として扱ってはいけません。

## K.2 Text（Option C）— **すべて設計上の見込みであり、実測ではありません**

| ケース | 限界コスト（設計上の見込み） |
|---|---|
| **既存 adapter 上の device（既存語彙で足りる）** | profile record 1 件 + 証拠実行（L0→L2/L3、class により上位） |
| **新 adapter が要る device** | adapter 実装。**protocol あたり一回払いで、その protocol 上の全 device に償却される** |
| **`capability_code` が要る device** | Package 1 件（versioned / licensed / 証拠つき） + それを参照する profile |
| **新 board** | Platform Registry record 1 件 + 代表集合の証拠 |

## K.3 🔴 主張できることと、できないこと

| | 判定 |
|---|---|
| ✅ **共有面の結合の性質が変わる** | Classic では device #N が 1..N−1 と共有する配列 / catalog / locale / 依存 universe を編集する。Option C では通常の device 追加は record の append。**ただしこれは設計claim であり、B.6 の反証テスト（20 profile を追加して共有面編集回数を数える）が通るまで未達です** |
| ⚠️ **per-device の authoring 作業は減り得る** | L3 の生存命題そのまま。「減り得る（can reduce marginal UI/generator authoring work）」であって「減る」ではない |
| ⚠️ **per-protocol のコストは下がらない** | 移動して償却されるだけ。**その額が Classic の per-block コストと同等かは未測定** |
| ❌ **証拠コストがどうなるかは、どちらとも測定されていません** | 旧稿の「まったく下がらない」は誤りでした（L4 F-06）。L3 が言ったのは「donor は検証コストが下がることを立証しない」であって、不変であることの測定ではありません。新しい選定 / cache / simulator / 実機ハーネスで増減し得ます |
| ❌ **「総コストが大幅に下がる」は成立していません** | L3/A1 は donor からは決定不能（NOT DECIDABLE WITHOUT MEASUREMENT）と判定。**誰にもそう伝えないこと** |

## K.4 何をすれば決着するか（L3/A1 の計器をそのまま採用）

**支援契約（D.2）を固定したうえで、20 件以上の層化された device を両方式で実装し**、
engineer-hours を ① authoring/UI/generation ② dependency / licence 解決 ③ compile matrix 修復
④ 実機 UAT ⑤ docs / i18n / sample ⑥ 90 日間の上流 churn と support incident、に分けて記録。
**受理された device あたりの中央値と P90 を報告する。**

---

# L. MVP 境界 — 最初に何を作り、何を作らないか

⚠️ **L4 F-05 により旧 MVP は循環依存を含み、最小でもありませんでした。以下は縮小・順序訂正済みです。**

**In（この順で意味を持つもの）:**
1. **Support Status Contract**（D.2）— 紙。すべての意味がこれに依存する。
2. **Adapter `encoding_schema` の仕組み** + `modbus-rtu` の `encoding_schema`（**validator より先**）。
3. **Device Profile schema v0** + **Project Manifest schema v0** + validator（隔離環境）。
4. **registry の保管形式と snapshot の作り方**（ファイル配置 + digest。DB エンジンではない）。
5. **resolver + dependency lock**（小さく。Package Registry の記述から解決する）。
6. **ERA** の定義・正規化・hash・**attestation の形**（署名は MVP では省略可、ただし identities 列挙は必須）。
7. **generator prototype**: profile + manifest + adapter → 1 board 向け C++。
8. **compile 証拠ハーネス** — donor の canonical-sample / host-compile probe を再利用。
9. **ERA の 4 つの反証テスト**（5〜8 が揃って初めて実行可能）。
10. **channels → auto Web UI adapter**（donor の renderer / transport を再利用。widget 語彙の拡張分は明示）。
11. **migration リハーサル** — N 個の合成 profile に対して。

**Out（紛れ込ませないために明記）:** 2 番目の protocol · AI datasheet 抽出 · Custom→Verified 昇格
ワークフローのソフトウェア化 · marketplace · knowledge graph · 独自 DB engine · ontology · 分散 registry ·
Home Assistant discovery の実装 · Azure · Desktop packaging · Artifact Archive の本実装（**設計だけ**） ·
上記いずれの production 実装も。

**⚠️ MVP に無いことの明示:** **L4 conformance と L5 hardware は MVP に含みません。**
したがって MVP は「支援契約を定義し、L0〜L3 を機械化する」ところまでです。実機で意味的正しさを検証する層は
次の段階の判断事項です。

---

# M. Implementation Sequence

| # | ステップ | 次へ進む gate |
|---|---|---|
| 1 | Support Status Contract + Evidence record schema | **Human が device class ごとの Verified 最低 level を裁定** |
| 2 | Adapter `encoding_schema` の仕組み + `modbus-rtu` の encoding schema | schema 単体で妥当な profile と不当な profile を分けられる |
| 3 | Device Profile v0 + Project Manifest v0 + validator | 🔴 **provenance テスト**: `origin: site` の値（例: HX711 の calibration scale）を profile に書いた profile が FAIL し、`origin: datasheet` の scale は PASS すること。**フィールド名の禁止ではなく provenance の分類が正しいことを見るテストであること**（L4 F-04）。禁止対象は **slave address · bus binding · topic · endpoint · 資格情報**であって、profile が当然持つ register address ではない |
| 4 | registry 保管形式 + snapshot digest | snapshot を 2 回作って同一 digest |
| 5 | resolver + dependency lock | 同じ入力で 2 回解決して同一 lock |
| 6 | `modbus-rtu` adapter + generator prototype | 実 compile RC=0、artifact digest 記録 |
| 7 | compile 証拠ハーネス（donor probe 再利用） | **negative control: 壊れた profile が FAIL すること** |
| 8 | ERA + attestation + 4 つの反証テスト | **4 つとも実際に RED になれることを示す** |
| 9 | channels → auto Web UI adapter | 全状態を**描画して目で見る**（rule 04） |
| 10 | migration リハーサル（N 個の合成 profile） | 証拠の無効化が**主張ではなく観測**されること |
| 11 | **B.6 の R-1 反証テスト**: 20 profile を追加し共有面編集回数を数える | 期待 0。1 件でも超えたら R-1 は偽 |
| 12 | **その後で**、性質の違う 2 番目の adapter（schema が一般化するかの本当の検定） | — |

**このシーケンスのどれも GO ではありません。各ステップは Human への提案です。**

---

# N. Risks / Unknowns

| # | リスク | Sev | 位置づけ |
|---|---|---|---|
| N-1 | pure data で表現できるのは device family の約 25%（20〜40%） | 🔴 | **実測**（L3/A3、n=20、strict 法、低確度）。`capability_code` で緩和するだけで解決はしない |
| N-2 | registry 自体が大きなソフトウェアになり、エントリごとに人手が要る | 🔴 | **WEAKENED（反証しきれていない）**。donor のより単純な catalog で既に 15+8+111 commit |
| N-3 | 総コスト削減は未証明 | 🔴 | **NOT DECIDABLE WITHOUT MEASUREMENT**。主張しないこと |
| N-4 | Modbus は「既存エンジンの上の metadata」しか検証しない | 🔴 | **実測**（L3/A4）。性質の違う 2 番目の adapter が本当の検定 |
| N-5 | AI の Verified スループット未測定。datasheet→profile は Embedder 公開資料では確認できず | 🔴 | L3/A5 + L2b S7 |
| N-6 | 支援契約が運用で摩耗し、「対応済み」が静かに弱くなる | 🔴 | L3/A7。機械導出 status で抵抗する（**それが唯一の手段だという証拠はない** — L4 F-11） |
| N-7 | schema migration が N 件の profile の証拠を無効化する | 🔴 | D.3 は**部分的な**防火帯。semantic 層は全体波及（L4 F-07） |
| N-8 | ERA + Artifact Archive の先行実装が存在しない | 🔴 | L2b Q-B: 7/7 が `NONE`。差別化要素であると同時に**未証明の工学コスト**。再現性は現時点で成立していない（L4 F-02） |
| N-9 | HA / ESPHome 語彙は上流統治で drift する | 🟡 | L2b S1.6 が docs↔dev 衝突を実測（`skip_updates`、`custom_command`→`custom_pdu`、2027.3 削除予定）。**release baseline を pin する必要がある** |
| N-10 | ERA attestation の trust boundary | 🔴 | L4 F-12。identities 列挙 + 署名 + consumer 側 gate が無ければ、ハッシュのエコーで通ってしまう |
| N-11 | registry の運用体制は前提を置いただけ | 🟡 | Human §11 は AI 活用、L3/A5 はレビューが床。未解決 |
| N-12 | 「代表 board 集合」の選定規則が無いと分母を操作できる | 🟡 | L4 F-03。governed artifact にすること |
| N-13 | Particle coverage 10/977 = 1.02% は docs ページ数の proxy | 🟢 | L2b S3.3 が限界を自ら明示 |
| N-14 | 最も近い競合（Arduino Cloud AI Assistant）の compile error feedback loop は公開文書からは確認できない | 🟢 | L2b S5.1 `NOT OBTAINED`。**その不在を差別化の根拠にしないこと**（baton 45 / 49） |
| N-15 | Home Assistant の MQTT discovery における device `name` 必須性が、散文 docs と core schema で食い違う | 🟢 | L2b S2.2。実装時に core schema 側を正とすること |
| N-16 | ESPHome の RP2040 の現況は `NOT OBTAINED`（現行 source URL が 404、component 一覧にも無い） | 🟢 | L2b S1.5。RP2040 を参照設計に使う場合は再確認が要る |
| N-17 | 先行実装調査は `static` + `API-smoke` のみ。**synthetic / real-fire は 1 件も実行していない** | 🟡 | L2b 自身が明示。「production で実証済み」と読まないこと |
| N-18 | Arduino package index の `discoveryDependencies` / `monitorDependencies` は version を持たない | 🟢 | L2b S5.2。ERA が Arduino 系を扱う場合の穴 |
| N-19 | ESPHome external component には署名検証も content snapshot 保証も無い | 🟢 | L2b S1.4。Custom 取り込み設計の参考にする際の注意 |

---

# 🔴 Human に必要な決定

| # | 決定事項 | なぜ Human でなければならないか |
|---|---|---|
| **D-1** | **狭められた仮説を採用するか、比較測定に投資するか。** L3 の明示的な選択肢: (a)「既存 adapter の上の metadata」という狭い仮説だけを採用して進む / (b) K.4 の比較測定（20 件以上・両方式・工数記録）に投資して広い主張を防衛する | 事業判断であり、私が選ぶ権限を持たない。**旧稿はこれを Human に返さずに Option C を選んでしまっていた（L4 F-10）** |
| **D-2** | **Verified の device class ごとの最低 level**（GPIO 入力は L3 で足りるか、産業アクチュエータは L5 必須か） | 保証水準の宣言であり製品の約束にあたる |
| **D-3** | **`L6 MAINTAINED` の `N days` と「現行上流 version」の運用定義** | ERA の exact pin と緊張するため、運用方針の裁定が要る |
| **D-4** | **「代表 board 集合」の選定規則** — 誰が決め、いつ変え、変更時に既存証拠をどう扱うか | 分母の統治であり、これが無いと L3 は操作可能 |
| **D-5** | **Artifact Archive を作るか**（保存容量・上流の再配布可否・ライセンス） | R-6 の成否がここに懸かる。作らないなら「6 か月後の再現性」は製品の約束にできない |
| **D-6** | **ESPHome / HA 語彙の release baseline をどこに pin するか** | N-9。上流の削除予定（2027.3）がある |
| **D-7** | **MVP に L4 conformance を含めるか** | 現案は L0〜L3 まで。意味的正しさの検証層をいつ作るかの判断 |
| **D-8** | 本設計を次の PRIMARY_OBJECTIVE（PoC 実装）へ進めるか | production 実装 GO は Human のみ |

---

# 付録 — 証拠のオーナー

repository 側（`prompt/maintenance/local/investigations/2026-08-27_managed-environment-architecture/`）:

| ファイル | 内容 |
|---|---|
| `01_classic-per-addition-cost.md` | L1: donor 実測（3 追加の実 surface、共有面分母、既に data 駆動な資産、産業 IoT 実装深度、auto Web UI の実スキーマ） |
| `02_hypothesis-falsification.md` | L3: 中心仮説への攻撃 7 本と「生き残った命題」 |
| `03_prior-art-models.md` | L2b: ESPHome / HA / Particle / Viam / Arduino / PlatformIO / Embedder の実データモデルと Verified ライフサイクル |
| `04_integrated-architecture.md` | 統合の**訂正前**草案（監査証跡として保存。**これは現行ではない**） |
| `05_integration-falsification.md` | L4: 統合への反証。71 主張中 36 件の欠陥 |
| `06_corrected-architecture.md` | 本報告書と同一の訂正版（repository 側の正本） |

**読む順序: `05` → `06`。`04` は訂正前であり、単独で読むと訂正前の主張を持ち帰ります**（S007 の
`08`/`09` と同じ危険、case DT-6）。

**測定値の owner は `investigations/` です。本報告書と食い違った場合は `investigations/` が正しい。**
