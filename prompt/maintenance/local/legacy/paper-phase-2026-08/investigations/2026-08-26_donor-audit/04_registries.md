# 04_registries — Board / Device / Library registry (Phase 2)

**donor:** `DigiCode@bb35c3b` frontend + `digicode-compile-api@3376746`
**調査方法:** 静的読解 + grep。**型ラベル: static のみ**
**この節の問い (裁定 §10):** registry は 1 つの正本から生成されているのか、複数箇所に重複定義されているのか。

---

## 1. 結論 — 正本は 1 つではない。3 種の registry は「種類ごとに存在の仕方が違う」

| registry | 実体 | 正本の数 |
|---|---|---|
| **Board** | frontend `stores/boardStore.ts` の `SUPPORTED_BOARDS` (**16 board**) と compile-api `src/boards.ts` の `FQBN_TO_PIO` (**10 FQBN**) | **2 リポジトリに分かれた 2 正本**。16 board が 10 FQBN に多対一で写像 |
| **Device / Sensor** | **registry は存在しない。** device/sensor は **Blockly block そのもの** (`blocks/arduino/` 配下 11 カテゴリ、69 ファイル) | 正本なし (block 定義が実質の正本) |
| **Library** | **registry は存在しない。** 実依存は compile-api `compile.ts` の**グローバル `lib_deps` 配列 1 本**のみ | 正本 1 だが、**Device との対応関係を持つデータが無い** |

## 2. Board registry の実際

`BoardDefinition` (`boardStore.ts:52-80`):
`id / name / fqbn / description / category('generic'|'m5stack'|'xiao') / supportsWifi / supportsOta / supportsBle / supportsEspNow / supportsHallSensor / supportedFlashMethods[] / experimental?`

- **16 board = M5Stack 9 + XIAO 3 + 汎用 4**、全て ESP32 系。RP2040 4 board は 2026-05-05 に削除 (理由が明記されている: `lib_deps` universe が RP2040 で incompatible = **ArduinoWebsockets 等が ESP32-only API 依存で compile fail**。lib_deps 細分化 (Phase 3.5) より削除を選択 — `boardStore.ts:24-29`)。
  → 🔴 **裁定 §5 が求める切り分けの答え**: RP2040 削除は **Blockly / generator 由来ではなく、Compiler infrastructure (lib_deps がグローバル 1 本) 由来**。**Text で Blockly 責任が消えても、この原因は消えない。** lib_deps 構造を変えない限り Text でも同じ壁に当たる。
- `FlashMethod` は 6 種 (`wifi` / `wifi-batch` / `usb` / `ble` / `bin-generic` / `bin-ha-ota`) で board ごとに宣言 (`boardStore.ts:14-20`)。
- `experimental?` フラグは「UI から使わせるが compile/runtime 品質を保証しない board」を示し、**probabilistic-debug の case 生成から除外され、release passRate の分母から外れる**うえ BoardSelector に「実験的サポート」バッジが出る (`boardStore.ts:63-70`)。
  → 🟢 **Text 版の「Text では利用可・Classic Blockly では非表示」を実現する precedent が既にある。** 可視性フィルタの機構自体は流用候補。
- capability flag は 2 階層: **category 単位 5 flag** (toolbox のカテゴリごと表示制御) と **block 単位 guard** (`data/blockBoardGuards.ts`)。後者は UI (`toolboxGenerator.ts`) と case 生成 (`scripts/probabilistic-debug/lib/catalog.ts`) の**両方から参照される単一正本**として設計されている。

### Board を 1 つ追加すると触るファイル (実測)

1. `stores/boardStore.ts` — `SUPPORTED_BOARDS` に追記 + **5 つの capability flag を全 16 board 分ミラー**
2. `components/editor/BoardSelector.tsx`
3. `i18n/locales/{ja,en,es,pt-PT,zh-TW}.json` — **5 言語**
4. `digicode-compile-api/src/boards.ts` — **別リポジトリ**の `FQBN_TO_PIO`
5. 必要なら `data/blockBoardGuards.ts` + catalog generator の型
6. (運用) 本番サーバ上で `boards.ts` を SSH 編集 + コンテナ再起動

→ **最低 2 リポジトリ・8 ファイル。** 企画の「Board 追加を Classic より軽く」は、この重複を畳むことが実質的な中身になる。

## 3. Device / Library の対応関係が「機械可読な形で存在しない」

例: HX711 ロードセル (`blocks/arduino/sensor/hx711Blocks.ts`)

| 情報 | どこにあるか |
|---|---|
| 必要ライブラリ `robtillaart/HX711@^0.6.3` | **ソースコメント** (`:20`) — 機械可読ではない |
| `#include <HX711.h>` + インスタンス宣言 | 生成器内の文字列定数 `HX711_INCLUDE`、`generator.definitions_['include_hx711']` に代入 (`:32,54`) |
| 実際の依存解決 | compile-api の**グローバル `lib_deps`** に別途エントリが必要 |
| board 互換性 | 同コメントの `boardRequires: null` (`:21`) と `blockBoardGuards.ts` |

**3 箇所に散っており、どれも他から生成されていない。** 「block を足したが lib_deps 登録を忘れた」という同型事故が **compile-api 側に少なくとも 4 件記録されている** (`compile.ts:163-167` — QTRSensors / MFRC522_I2C / AccelStepper 等、"Same systematic root cause as commits 2-4/2-7/2-10 (block added without lib_deps registration in compile.ts)")。

→ 🔴 **企画書 §6.3/§7 の「Device 一覧 → Required Library 決定 → dependency 解決 → Managed Imports 自動生成」に対応する実装は donor に存在しない。** これは **新規実装が必要**な領域。ただし**原資はある** — 69 block ファイルのコメントと `definitions_` の include 文字列、`block-catalog.json` の生成スクリプト、compile-api の lib_deps を突き合わせれば、Device→Library→include の初期データは**抽出できる可能性が高い** (未検証、次 objective 候補)。

## 4. 4 系統の registry の関係

| 系統 | 実体 | 生成関係 |
|---|---|---|
| frontend UI | `boardStore.SUPPORTED_BOARDS` + `toolboxGenerator` | 手書き |
| compiler | `compile-api/src/boards.ts` + `lib_deps` | 手書き (frontend を "Mirrors" と自称、`boards.ts:11-15`) |
| AI dictionary | `public/ai/block-catalog.json` | **生成物** (`generatedAt` あり) — block 定義から生成 |
| Blockly generator | `blocks/arduino/**` | 手書き (実質の正本) |

→ **生成されているのは AI 辞書だけ。** 他 3 系統は手書きで、うち 2 つは別リポジトリに分かれている。

## 5. verdict

| 対象 | verdict | 根拠 |
|---|---|---|
| `BoardDefinition` のスキーマ (capability flag + flash method + experimental) | **そのまま流用可能** | Blockly 非依存。Text でも同じ軸が要る |
| `experimental` による可視性フィルタ機構 | **そのまま流用可能** | 「Text では可視・Classic では非表示」の precedent |
| category 5 flag による toolbox フィルタ | **Text では不採用** | toolbox は Blockly の概念 |
| `blockBoardGuards` の block 単位 guard | **改修流用** | 「機能単位の board 制約」という考え方は Text の Device グレーアウトに対応 |
| Board registry が 2 リポジトリ手書き重複 | **新規実装が必要** (単一正本化) | 企画の「軽い Board 追加」の中身そのもの |
| Device→Library→include の対応データ | **新規実装が必要**（donor から**抽出**は可能かもしれない） | 機械可読な形で存在しない |
| AI 辞書の生成スクリプト方式 | **改修流用** | 「registry から辞書を生成する」構造は正しい |

## 6. risk / remaining unknown

- 🔴 RP2040 削除の真因が **Compiler 側 (lib_deps グローバル)** にあることは、Text でも RP2040/ESP8266 追加が同じ壁に当たることを意味する。**Text が Blockly を捨てても自動的には解決しない。**
- 🟡 `scripts/probabilistic-debug/` (60 ファイル) 未読 — case 生成と passRate の仕組みは QA クラスタで読む。
- 🟡 `block-catalog.json` の生成スクリプトの所在を特定していない (`scripts/` 配下と推定、未確認)。
