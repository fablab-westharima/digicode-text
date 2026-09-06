# 05_`.ino` vs `main.cpp` — Editor / LSP 側から見た事実

**baton 23 の trigger はこの spike の完了。Acceptance 4 / 5 / 12 に対応。**
**S002 が確定させた前提:** Compiler 側では**どちらでも成立する** (PlatformIO が `.ino` を前処理する)。
→ **判断材料は Editor / LSP 側にしかない。本書がそれを出す。決定は Human** (裁定 §2 / §21)。

**検証の型: real-fire。** 同一プログラムを `.ino` と `main.cpp` の 2 形態で用意し、
実際に language server を起動して応答を測った。fixture の作り方は `01` §3。

---

## 1. 🔴 Arduino プリプロセッサが実際に何をするか (実測)

`arduino-cli compile -b esp32:esp32:esp32 --only-compilation-database` が生成した
`build/sketch/SensorNode.ino.cpp` を、元の `.ino` と diff した実結果:

```diff
+ #include <Arduino.h>
+ #line 1 "…/SensorNode/SensorNode.ino"
  #include "sensor.h"
  #include "network.h"

  static uint32_t lastPublishMs = 0;

+ #line 6 "…/SensorNode/SensorNode.ino"
+ void setup();
+ #line 13 "…/SensorNode/SensorNode.ino"
+ void loop();
+ #line 27 "…/SensorNode/SensorNode.ino"
+ void reportBoot();
+ #line 6 "…/SensorNode/SensorNode.ino"
  void setup() {
```

**やっていることは 3 つだけ:**

1. 先頭に `#include <Arduino.h>` を挿入
2. **全関数の前方宣言を生成**して先頭に置く (`setup` / `loop` / `reportBoot`)
3. **`#line` ディレクティブ**で、生成ファイルの行を元 `.ino` の行へ写像する

**②が `.ino` の本質。** fixture の `reportBoot()` は `setup()` より後に定義されているので、
この生成が無ければ C++ として通らない (`01` §3 の対照実験で確認済み)。
**③が LSP を成立させている鍵**で、これがあるから clangd の位置情報を元ファイルへ戻せる。

### 🔴 さらに重要: `.cpp` / `.h` も build ディレクトリへコピーされる

生成された `compile_commands.json` (61 entries) の**プロジェクト側 3 件**は:

```
…/build-esp32/sketch/SensorNode.ino.cpp
…/build-esp32/sketch/sensor.cpp
…/build-esp32/sketch/network.cpp
```

**ユーザが編集している `SensorNode/sensor.cpp` ではなく、build ディレクトリのコピーを指している。**
つまり `.ino` 経路では **`.ino` だけでなくスケッチ内の全ファイルについて URI 変換層が要る。**
「`.ino` だけ特別扱いすればいい」ではない。

## 2. 素の clangd を `.ino` に向けるとどうなるか (対照実験)

```
node probe_ino_raw.js <sketch> SensorNode.ino
→ diagnostics: [{ line 1, severity 1,
     "Unable to handle compilation, expected exactly one compiler job in ''" }]
→ documentSymbols: []
→ stderr: E Could not build CompilerInvocation for file …/SensorNode.ino
```

🔴 **clangd は `.ino` を C++ ソースとして認識しない。** 拡張子が driver に解釈されず、
**シンボルが 1 つも出ない。** 補完も定義ジャンプも一切成立しない。
→ **`.ino` を採るなら、前処理層 (= arduino-language-server 相当) は選択肢ではなく必須。**

## 3. arduino-language-server 0.7.7 の実測 (`.ino` 経路)

FQBN `esp32:esp32:esp32`、スケッチ 5 ファイルを全部 didOpen した状態。

### 動いたもの ✅

| 項目 | 実測 | 意味 |
|---|---|---|
| **first diagnostics** | **18.2 / 18.4 / 18.7 s** (3 回) | 内部で**スケッチのビルドを実行してから**診断する |
| 診断の宛先 | `./SensorNode.ino` · `./sensor.cpp` · `./sensor.h` · `./network.cpp` · `./network.h` | **全ファイルがユーザの実 URI に写像された** |
| 診断の行番号 | `.ino` の **28 行目** | `#line` 写像が効いている (原文の該当行と一致) |
| **go to definition (`.ino` → `.cpp`)** | **3.0 ms** → `./sensor.cpp:12` | **前処理の壁を越えて実装へ飛んだ** |
| 🔴 **go to definition (暗黙プロトタイプ経由)** | **1.1 ms** → **`./SensorNode.ino:27`** | `setup()` 内の `reportBoot()` から、**後方にある本物の定義行**へ飛んだ。生成された prototype 行ではない。**`.ino` の核心が成立している** |
| **go to definition (`.cpp` → `.h`)** | **63 ms** → `./sensor.h:7` | スケッチ内の非 `.ino` ファイルでも動く |
| **document symbol** | **65 ms** → `["lastPublishMs","setup","loop","reportBoot"]` | ユーザの `.ino` のシンボルのみ。生成された prototype は混ざらない |

### 🔴 動かなかったもの

| 項目 | 実測 | 判定 |
|---|---|---|
| **find references** | `referencesProvider: **ABSENT**` (initialize の応答で確認)。呼ぶと**エラーを返さずハングし、25 s で timeout** | 🔴 **未実装。** 裁定 §3 が挙げた必要 UX の 1 つが丸ごと無い |
| **go to implementation** | `implementationProvider: **ABSENT**` | 🔴 未実装 |
| **client が `hierarchicalDocumentSymbolSupport` を宣言しない場合の documentSymbol** | 🔴 **`panic: not implemented` でプロセスが死ぬ** | 下記 |

### 🔴 3-1. クライアント能力の宣言しだいでサーバが落ちる (対照実験で特定)

| クライアントの `textDocument.documentSymbol` | 結果 | プロセス |
|---|---|---|
| `{ hierarchicalDocumentSymbolSupport: true }` | ✅ `["lastPublishMs","setup","loop","reportBoot"]` | **生存** |
| `{}` (階層非対応 = flat な `SymbolInformation[]` を期待) | 🔴 **TIMEOUT** | **死亡** |

死亡時の stderr (実測):

```
panic: not implemented [recovered]
        panic: not implemented
github.com/arduino/arduino-language-server/streams.CatchAndLogPanic()
        /home/build/streams/panics.go:30
github.com/arduino/arduino-language-server/ls.(*INOLanguageServer).clang2IdeSymb…
```

**LSP 仕様上、`hierarchicalDocumentSymbolSupport` は任意である。** それを宣言しないクライアントに対して
**graceful なエラーではなく panic でプロセスごと終了する。**
🔴 **1 ユーザ 1 プロセスのサーバ構成では、これはそのユーザのセッション全滅を意味する。**

> **この発見の経緯は `01` §6 P-3 に記録した。** 最初の測定では「ALS は documentSymbol も
> completion も返さない」と読めたが、それは**私の probe が前のプロセスを生かしたまま起動していた**
> ことと、**capability 宣言の差**が混ざった結果だった。切り分けて初めて真因に届いた。

### 3-2. ✅ completion は編集直後でも正常に動く — 一度の赤は私の測定バグだった

最初の測定では `didChange` 後の補完が `ERROR -32602 trying to get preamble for non-added document`
を返し、**ALS の欠陥に読めた。** 切り分けた結果、**そうではなかった。**

| 条件 | 実測 |
|---|---|
| `didChange` 無し。既存の `g_sensor.` で補完 | ✅ **3 件** — `begin()` · `isReady() const` · `read()` (宣言は別ファイル `sensor.h`) |
| 増分 `didChange` で末尾に行を足したあと、同じ位置で補完 | ✅ **3 件** — 同上 |
| 🔴 **実際の編集シナリオ**: `loop()` 内に `  reading.` を**新しく打ち込んで**、打った位置で補完 | ✅ **3 件** — **`humidity` · `temperature` · `timestampMs`**。`SensorReading` (別ファイル `sensor.h` で定義) のメンバが**編集直後に正しく出た** |

**最初の赤の真因:** 私が `didChange` を送ったあと、**補完位置を編集前のテキストから計算していた**。
ALS は存在しない位置を渡されて `-32602` を返した。**正しい応答である。**

**プロトコル面の確認も取った:** ALS の `textDocumentSync` は
`{openClose: true, change: 2, save: {includeText: true}}` = **Incremental を明示的に広告している**。
つまり範囲指定の増分 `didChange` は仕様どおりであり、この経路自体に問題は無い。

> **これを記録する理由 (rule 04 / case PT-4 系):** この 1 件を切り分けずに出していれば、
> 「`.ino` は編集するたびに補完が壊れる」という**存在しない欠陥**を Human の判断材料に混ぜていた。
> `01` §6 の P-1〜P-4 と同じ種類の事故であり、**本 spike で 5 件目**にあたる。

### 3-3. 実測でわかった ALS の真の欠落 (上記を除いた後)

| 欠落 | 判定 |
|---|---|
| **find references** | 🔴 `referencesProvider: ABSENT` — **実装されていない**。呼ぶとエラーではなくハングする |
| **go to implementation** | 🔴 `implementationProvider: ABSENT` |
| **`hierarchicalDocumentSymbolSupport` 非宣言時の panic** | 🔴 §3-1 |
| **初回診断 18 秒台** | 🔴 §6 |

**この 4 点は切り分け後も残った、再現する欠落である。**

## 4. `main.cpp` 経路の実測 (同じプログラム・同じ ESP32 ツールチェーン)

`fixtures/cpp32/`。arduino-cli が ESP32 用に実際に使ったコンパイルコマンドをそのまま
`compile_commands.json` にして、**素の clangd に直接**与えた。**前処理層も URI 変換層も無い。**

| 項目 | 実測 (`.clangd` チューニング後) |
|---|---|
| `initialize` | **36 ms** |
| **first diagnostics** | **1,521 ms** |
| 残った偽エラー | **1 件** (`__block attribute…` = host target 由来、`03` §2) |
| go to definition | **0.69 ms** → `src/sensor.cpp:12` |
| **find references** | **53 ms** → **3 箇所 / 3 ファイル** ✅ |
| workspace symbol | 0.55 ms → `Sensor` / `SensorReading` / `g_sensor` |
| completion | **16 ms** → **100 件** (`SensorReading` `Sensor` `Network` + ESP32 の board define) |
| document symbol | 16 ms |

## 5. 🔴 比較表 (裁定 §19 の指定軸)

| 観点 | `.ino` | `main.cpp` |
|---|---|---|
| **Arduino 初学者 UX** | 🟢 `#include <Arduino.h>` を書かなくてよい。関数を書いた順に置ける。**Arduino の教材・書籍・Web 記事がそのまま通じる** | 🟡 `#include <Arduino.h>` と前方宣言が要る = **C++ の作法を最初に説明することになる**。ただし「なぜ動くか」は説明可能になる |
| **Arduino IDE との親和性** | 🟢 **そのまま同じもの。** IDE と Text の間でファイルを往復できる | 🔴 Arduino IDE は `.ino` を要求する。往復するには変換が要る |
| **PlatformIO との親和性** | 🟡 PlatformIO は `.ino` を受け付ける (S002 実測) が、**PlatformIO 世界の標準は `src/*.cpp` + `include/*.h`** | 🟢 **PlatformIO の標準そのもの。** `pio run -t compiledb` が 0.84 s で 86 entries を吐いた |
| **LSP** | 🔴 **前処理 + URI 変換層が必須。** 素の clangd では**シンボル 0** | 🟢 **変換層ゼロ。** `compile_commands.json` を渡すだけで成立 |
| **clangd** | 🔴 `.ino` を認識しない。arduino-language-server 経由が唯一の道 | 🟢 直接扱える |
| **preprocessing** | 🔴 `#include <Arduino.h>` 挿入 + 全関数プロトタイプ生成 + `#line` 写像。**さらにスケッチ内の全ファイルが build dir へコピーされる** | 🟢 **無し** |
| **multi-file** | 🟡 動くが、**全ファイルについて URI 写像が要る** | 🟢 素直。`src/` と `include/` がそのまま LSP の座標系 |
| **find references** | 🔴 **arduino-language-server 0.7.7 は未実装 (`referencesProvider: ABSENT`)** | 🟢 **実測 3/3 ファイルで正常** |
| **AI 生成** | 🟡 AI は `.ino` を書けるが、**「暗黙プロトタイプがあるから通る」という Arduino 固有ルールを前提にしたコードを出す**。生成物の検証も前処理を通さないとできない | 🟢 **普通の C++。** AI にとって最も扱いやすく、生成物をそのまま静的検証にかけられる |
| **外部 sample 取り込み** | 🟢 **Arduino のサンプルは `.ino` で配布されている。** そのまま貼れる | 🔴 `#include <Arduino.h>` の追加と前方宣言の補完が要る。**機械変換は可能** (プリプロセッサがやっていることと同じ) |
| **complexity** | 🔴 前処理層 + URI 双方向写像 + build dir 管理。**その層が落ちると全機能が落ちる** | 🟢 層が 1 つ少ない |
| **maintenance** | 🔴 arduino-language-server は **安定版が 2025-03-19 の 0.7.7、main は unstable と明記、references 未実装、capability 宣言しだいで panic**。改変すると AGPL の義務が確定する | 🟢 **clangd 本体に乗るだけ。** upstream の保守は LLVM が担う |
| ライセンス | AGPL-3.0 (ALS) + GPL-3.0 (arduino-cli) — digicode-text の AGPL-3.0 とは整合するが**義務が増える** | Apache-2.0 w/ LLVM Exceptions (clangd) のみ |

## 6. 実測値の対照 (同じプログラム・同じ board)

| | **`.ino` + arduino-language-server** | **`main.cpp` + 素の clangd** |
|---|---|---|
| 初回診断までの時間 | **18,200〜18,700 ms** | **1,521 ms** (**≈12 倍速い**) |
| go to definition | 1.1〜63 ms ✅ | 0.69 ms ✅ |
| **find references** | 🔴 **未実装** | **53 ms / 3 箇所 ✅** |
| document symbol | 65 ms ✅ (条件付き、§3-1) | 16 ms ✅ |
| workspace symbol | 広告あり (未計測) | 0.55 ms ✅ |
| completion | ✅ **3 件 (cross-file メンバ、編集直後も正常)** | **16 ms / 100 件 ✅** |
| 必要な外部バイナリ | **arduino-cli + clangd + arduino-language-server の 3 本** | **clangd 1 本** |
| 必要な中間層 | 前処理 + 双方向 URI 写像 + build dir | **無し** |

## 7. 本書が Human に渡すもの (決めない)

- **技術的には `main.cpp` が明確に軽い。** 層が 1 つ少なく、初回診断が約 12 倍速く、
  find references が実際に動き、依存バイナリが 1/3 で、保守が upstream LLVM に乗る。
- **`.ino` の価値は技術ではなく生態系にある。** Arduino のサンプル・教材・IDE 互換という、
  **初学者向け製品としては軽くない価値**であり、これは実測で比較できる種類のものではない。
- **決定的な非対称性が 1 つある:** **`.ino` → `main.cpp` の機械変換は、Arduino プリプロセッサが
  実際にやっていること (§1) と同じで、実装可能である。逆は不要。**
  → **「内部標準は `main.cpp`、外部 `.ino` サンプルは取り込み時に変換」という第三の形が、
  実測上は両方の利点を取れる位置にある。** ただし**これは提案であって決定ではない** (裁定 §21)。
- **残る未取得:** `.ino` を採る場合に arduino-language-server を fork して references を実装する
  コスト、および `0.8.0-rc.1` で状況が変わっているか = **NOT OBTAINED** (本 spike は安定版 0.7.7 で測った)。
