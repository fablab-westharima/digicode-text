# 02_Text compile path — 実測結果

**検証の型:** すべて **real-fire (実 compile)**。実機書き込みは 1 件も行っていない。

---

## 1. 追加した経路の形 (probe 実装)

```
Classic (無改変)                      Text (追加)
POST /api/compile                     POST /api/compile/project
POST /api/compile/sse                 GET  /api/text/health
  ↓ fragments 4 種                      ↓ files: [{path, content}, ...]
  ↓ 固定 .ino template へ正規表現注入     ↓ template 無し・そのまま materialize
  ↓ projectStore: src/main.ino 1 本      ↓ textProject: src/ include/ lib/ に任意本数
  ↓ compile.ts: buildLibDeps() 57 本     ↓ textCompile: 独自 lib_deps (既定 1 本)
  ↓ boards.ts: FQBN_TO_PIO               ↓ textBoards: 独自 registry
  ↓ projects/<board>_<template>/         ↓ projects/text/<projectId>/
  ↓ cache/<key>  (v3…)                   ↓ cache/text/<key>  (digicode-text-v1…)
  ↓ lock key "<board>_<template>"        ↓ lock key "text:<projectId>"
        └──────── 共有: PlatformIO 本体 / platform / framework / toolchain / build_cache_dir ────┘
```

**追加のフットプリント (実測):**

| 対象 | 変更 |
|---|---|
| `src/server.ts` | **+3 行 / −0 行** (import 1 · `app.route` 1 · 空行 1)。既存 route / middleware / handler の変更は 0 |
| `src/compile.ts` `inject.ts` `projectStore.ts` `cache.ts` `boards.ts` `projectLock.ts` | **差分 0** (D-1 を除く) |
| 新規ファイル | `textBoards.ts` 39 / `textProject.ts` 120 / `textCompile.ts` 402 / `textRoutes.ts` 32 = **593 行** |

`projectLock.ts` だけは **import して再利用**している (コードは無改変)。ロックキーの名前空間が
`text:` 接頭辞で分かれているため、Classic のキーとは決して一致しない。

## 2. compile 結果一覧

| case | 内容 | 成功 | cached | ms | firmware bytes | 診断 |
|---|---|---|---|---|---|---|
| **A** | `src/main.cpp` 1 本、ユーザ定義 `setup()`/`loop()`、template 注入なし | ✅ | false | 9,102 | 306,352 | 0 |
| **A2** | `src/main.ino` 1 本、`#include <Arduino.h>` なし・**定義前の関数呼び出しあり** | ✅ | false | 5,215 | 301,648 | 0 |
| **B2** | `src/main.cpp` + `src/sensor.cpp` + `include/sensor.h` | ✅ | false | 5,264 | 313,264 | 0 |
| **B3** | 上記 + `src/network.cpp` + `include/network.h` (計 5 ファイル) | ✅ | false | 5,326 | 314,272 | 0 |
| **C** | image 内蔵 lib (`Adafruit_NeoPixel`) を `#include` して使用 | ✅ | false | 5,243 | 325,088 | 0 |
| **ERR** | `src/sensor.cpp` に意図的な構文エラー | ❌ (意図) | — | 2,887 | — | **2** |
| **TEXTLIB** | Text 専用 test library のみを依存に指定 | ✅ | false | 4,920 | 301,296 | 0 |
| **TEXTBOARD** | Classic に存在しない FQBN `digicode-text:esp32:probe_only` | ✅ | false | 9,158 | 301,568 | 0 |
| **TRAVERSAL** | `src/../../escape.cpp` を含むリクエスト | ❌ (意図) | — | 0 | — | 0 |
| B2 (cache MISS) | 同一内容を cache 有効で | ✅ | false | 2,666 | 313,264 | 0 |
| B2 (cache HIT) | 直後に同一リクエスト | ✅ | **true** | **1** | 313,264 (同一 sha256) | 0 |

**Acceptance 1 (full-source) = 達成 / Acceptance 2 (multi-file) = 達成 / §5-C (既存 Library 利用) = 達成。**

### multi-file が本当に複数ファイルを compile しているかの担保

`main.cpp` は `Sensor::Sensor()` / `Sensor::begin()` / `Sensor::read()` を**呼ぶだけ**で、実体は
`src/sensor.cpp` にしかない。もし `sensor.cpp` が build 対象から漏れていればリンク段で
undefined reference になり成功し得ない。**成功したこと自体が「別ファイルがコンパイル・リンクされた」
ことの証明**であり、ファイル数の増加が firmware サイズの増加 (306,352 → 313,264 → 314,272 B) として
現れている。

### A2 が答えたこと — `.ino` 前処理 (企画書 §32 / audit P-2 の分岐)

fixture の `.ino` は **`#include <Arduino.h>` を書かず**、`blinkFor()` を**定義より前で呼んでいる**。
素の C++ ならどちらもコンパイルエラーになる。それが通ったということは、
**PlatformIO が `framework = arduino` の下で `.ino` の前処理 (Arduino.h 自動 include + プロトタイプ自動生成)
を行っている**ことを意味する。

→ **`.ino` を採るか `main.cpp` を採るかは、Compiler 側の制約ではない。** Compiler はどちらも受ける。
判断材料は Editor / LSP 側 (clangd は `.ino` を C++ として解釈できない) に移る。**決定は Human**。

## 3. Error semantics (裁定 §12) — Acceptance 7 = 達成

`src/sensor.cpp`(main ではないファイル)に入れた構文エラーに対し、API が返した構造化診断:

```json
[
  {"file":"src/sensor.cpp","line":9,"column":3,"severity":"error",
   "message":"expected ',' or ';' before 'return'"},
  {"file":"src/sensor.cpp","line":10,"column":1,"severity":"error",
   "message":"no return statement in function returning non-void [-Werror=return-type]"}
]
```

- **file** … リクエストで送ったプロジェクト相対パスに正規化済み (コンテナ内絶対パスは露出しない)
- **line / column / severity / message** … すべて取得できている
- 生 stderr も併せて返しているので、パーサが取り逃した情報は失われない

→ **file / line jump に必要な情報は Compiler 側から返せる。** Editor / LSP はこの objective では実装しない。

**留意 (🟡):** 現在の diagnostic は `-Werror=return-type` のように**フラグ名が message に混ざる**。
Text の UI でどう見せるかは product 判断であり、ここでは事実の記録に留める。

## 4. Artifact (裁定 §13) — Acceptance 8 = 達成

Text 経路は `fullPackage=true` で Classic と同じ 4 点セットを返す。

| artifact | Text (probe A) | Classic (基準線) | 一致 |
|---|---|---|---|
| `firmware.bin` | 306,352 B | 1,350,288 B | 内容は当然別 (ソースが別) |
| `bootloader.bin` | 23,472 B / `66687b94…` | 23,472 B / `66687b94…` | **バイト一致** |
| `partitions.bin` | 3,072 B / `0a8b5720…` | 3,072 B / `0a8b5720…` | **バイト一致** |
| `boot_app0.bin` | 8,192 B / `f94c5d78…` | 8,192 B / `f94c5d78…` | **バイト一致** |

→ **同一の build infrastructure から、同一の boot 側 artifact が出ている。** 既存の
Web Serial (esptool-js) / BLE OTA (NimBLEOta) が期待する 4 点セットの形をそのまま満たす。
**実機書き込みは本 objective では行っていない (裁定 §13 のとおり)** ため、
「実機に焼けること」は **[未verify]**。

**firmware サイズ差の理由 (🟢):** Classic の 1.35 MB は `DigiCodeUSB.ino` template が WiFi / HTTP /
Preferences / NimBLE 等の製品ロジックを内包しているため。Text のユーザソースは 300 KB 台で、
**同じ partition (`min_spiffs.csv`) の 1.9 MB スロットに対して余裕が大きい**。

## 5. 入出力サイズ (裁定 §11 の payload 検討材料)

| リクエスト | ファイル数 | ソース合計 | request JSON | response JSON |
|---|---|---|---|---|
| Classic (fragments) | — | — | 389 B | 1,846,857 B |
| Text A | 1 | 297 B | 431 B | 454,984 B |
| Text B3 | 5 | 971 B | 1,335 B | 465,548 B |

**request 側は multi-file にしても桁が変わらない** (数 KB 規模)。**response 側が支配的**で、
firmware を base64 で返す設計上 **1 リクエスト 0.45〜1.85 MB** になる。
Cloud 経由の制約はここに効く → `04_…md`。
