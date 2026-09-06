# 03_Classic 回帰と分離 — 裁定 §6 / §7 / §8 / §9

**本 objective の最重要 Acceptance。** 「壊していないはず」ではなく **artifact のバイト比較**で示す。

---

## 1. Classic regression isolation (裁定 §6) — Acceptance 3 = 達成

同一の Classic リクエスト (`fragments` 4 種 + `board` + `connectionType=usb`) を、
`?no-cache=true&fullPackage=true` で **3 回**実行した。`no-cache` により結果 blob cache を
両方向 (get / put) で迂回しているので、3 回とも**実際に `pio run` が走っている** (`cached: false` を確認)。

| 実行 | いつ | wall | firmware sha256 | bootloader | partitions | boot_app0 |
|---|---|---|---|---|---|---|
| **BEFORE** | Text 経路を接続する**前** | 301 s (cold) | `46a089bd20fe9efb…` | `66687b94…` | `0a8b5720…` | `f94c5d78…` |
| **AFTER** | Text 経路の接続直後 | 27 s (incremental) | `46a089bd20fe9efb…` | 同一 | 同一 | 同一 |
| **FINAL** | Text build 20 本超 + Text 専用 lib + Text 専用 board + 並行実行 + 意図的なキー衝突の**すべての後** | 27 s | `46a089bd20fe9efb…` | 同一 | 同一 | 同一 |

```
== Classic BEFORE vs AFTER (byte comparison) ==
  firmware    IDENTICAL  before=1350288B/46a089bd20fe9efb  after=1350288B/46a089bd20fe9efb
  bootloader  IDENTICAL  before=23472B/66687b947340a42b   after=23472B/66687b947340a42b
  partitions  IDENTICAL  before=3072B/0a8b5720e7b77ff1    after=3072B/0a8b5720e7b77ff1
  bootApp0    IDENTICAL  before=8192B/f94c5d786a7a8fab    after=8192B/f94c5d786a7a8fab
  -> artifacts compared=4 all_identical=True
```

維持されたことを個別に確認した項目 (裁定 §6 の列挙):

| 項目 | 実測 |
|---|---|
| existing Classic request | 同一 body・同一 endpoint で 3 回とも 200 / `success:true` |
| fragment injection | 生成された `src/main.ino` を経由する経路が動作 (`template: "DigiCodeUSB"` を応答が返す) |
| existing template | `templateNameFor('usb')` → `DigiCodeUSB` が選択されている |
| build result | 上表のとおり 4 artifact すべてバイト一致 |
| 生成される `platformio.ini` | 初回生成分と最終時点を diff → **差分は D-1 の 1 行のみ** (`FastAccelStepper@^0.32` → `^0.34`)。Text 経路由来の差分は **0 行** |
| Classic の project dir | 中身は `platformio.ini` と `src/main.ino` のみ。Text のファイルは 1 つも混入していない |

## 2. その比較に検出力があることの証明 (rule 04)

**「同一だった」は、比較器が差を見つけられる場合にしか意味を持たない。** 対照実験:

Classic のリクエストの `loopCode` に `delay(1);` を 1 行足して再 compile した結果 —

```
CONTROL (Classic source mutated): success=True wall=35.7s
  firmware bytes=1350288 sha256=fdab8d908c2fcce8222a985572e249e1804c830ca2459057be671209d50bbfdc
  baseline      bytes=1350288 sha256=46a089bd20fe9efb34ec9d7f78d3ad4560b129646946f0b9745aa50f12964558
  -> instrument returns DIFFERENT: True
```

**サイズは 1,350,288 B のまま変わらず、sha256 だけが変わった。** つまり
「サイズ比較」では見逃す変化を「sha256 比較」は捕まえる。使った計器は正しい次元を測っている。

## 3. Workspace isolation (裁定 §7) — Acceptance 4 = 達成

| 状態 | Classic のキー | Text のキー | 衝突可能性 |
|---|---|---|---|
| project dir | `projects/<pioBoard>_<template>` | `projects/text/<projectId>` | **親ディレクトリが別**。同名でも衝突しない (下記の実証) |
| lock | `"<pioBoard>_<template>"` | `"text:<projectId>"` | 接頭辞が異なるため文字列一致し得ない |
| 結果 cache | `cache/<sha256>` prefix `v3` | `cache/text/<sha256>` prefix `digicode-text-v1` | ディレクトリもハッシュ前置文字列も別 |
| build object cache | `/root/.platformio/build-cache` | 既定は同一 / `TEXT_BUILD_CACHE_DIR` で分離可 | 共有時も内容ハッシュ鍵のため混線せず (§4 の実測) |

### 意図的なキー衝突攻撃

Text リクエストの `projectId` に **Classic のプロジェクトキーそのもの** (`esp32dev_DigiCodeUSB`) を指定した:

- 結果: 成功、firmware `d90111ceb217…` (313,264 B = B2 相当)
- 着地先: `/opt/digicode-compile/projects/**text**/esp32dev_DigiCodeUSB`
- **Classic 側の `projects/esp32dev_DigiCodeUSB/` は無変化** (`platformio.ini` と 0 バイトの `main.ino` のみ、mtime も不変)

→ **root 分離により、クライアントが名前を偶然一致させても構造的に衝突しない。**

### パストラバーサル

`src/../../escape.cpp` を含むリクエストは **I/O 前に拒否** (`illegal file path`)。
ファイルシステム全体を検索して `escape.cpp` は **0 件**、`projects/text/probe-traversal` ディレクトリも
**作られていない**。

### 並行リクエスト

| シナリオ | 結果 |
|---|---|
| **Classic + Text 同時** | Classic 36.3 s / Text 5.4 s、**overlap 5.4 s** = Text は Classic のビルド中に開始し完了した。両方成功。ロックキーが別なので互いにブロックしない |
| **Text × 2、別 workspace** | 5.78 s / 5.55 s、overlap 5.55 s = 完全並行。単独実行 (5.3 s) とほぼ同じ |
| **Text × 2、同一 workspace** | 直列化。片方 2.75 s、もう片方 5.41 s (= 2 本ぶん)。**両方成功し、firmware sha は互いに異なる** (`1c987a9eee0a…` / `dea2abdf2110…`) = 後発が先発の成果物を壊していない |

→ 同一 workspace への同時要求は**壊れるのではなく直列化される**。ただしこれは
**プロセス内ロック**であり、**複数プロセス / 複数コンテナ運用では保護されない** (donor の `projectLock.ts`
の設計そのまま)。→ 残 unknown。

### workspace のディスクコスト (cleanup 設計の入力)

| 対象 | 実測 |
|---|---|
| Text workspace 1 つあたり | **約 23 MB** (`.pio/build` を保持するため。エラーで終わった 1 件のみ 2.9 MB) |
| Text workspace 12 個 | 251 MB |
| Classic の project dir | 444 MB (`.pio/libdeps` に 69 ディレクトリ + build) |
| 共有 build cache | image 内 493 MB → 全 probe 後 **781 MB** (+288 MB。コンテナ COW 層なので再起動で消える) |

→ **「1 編集セッション = 1 workspace」を素直に実装すると 23 MB/セッションで増える。**
cleanup / TTL / LRU は**新規に必要な設計要素**であり、donor には相当機構が無い (Classic は
(board × template) の有限個しか作らないため必要が無かった)。→ finding。

## 4. Dependency isolation (裁定 §8) — Acceptance 5 = 達成

**問い:** Text で Library を足すとき、Classic の global `lib_deps` universe を必ず拡張しなければならない構造か。

**答え: いいえ。ただし「同じ関数を使えば」必ず拡張することになる。**

### 4.1 現行 Classic 側の事実 (実測)

- `buildLibDeps()` が返す `lib_deps` は **57 エントリ** (registry 47 / `file://` 9 / `symlink://` 1)
- **`lib_ldf_mode = chain` は「ビルド対象」を絞るだけで、「解決・インストール」は全件行われる** —
  ユーザソースが `Adafruit_NeoPixel` しか include していないのに、
  **一度も include されない `FastAccelStepper` の解決失敗でビルド全体が落ちた**
  (D-1 の発生そのものがこの証拠)。`.pio/libdeps` には **69 ディレクトリ**が実体化した
- つまり **Classic の 57 本は、どのユーザコードにとっても事実上の必須依存**である

### 4.2 Text 側で分離できることの実証

Text 経路は `buildTextLibDeps()` という**別関数**を持ち、既定は 1 本だけを返す。
probe では **Classic にも image にも存在しない test library** (`ProbeMarkerLib`) を Text 側だけに与えた。
この library はソース中に一意な文字列 `DIGICODE_TEXT_PROBE_MARKER_9F3A7C` を持ち、
firmware に焼き込まれる。

```
== Text-only dependency leak scan ==
  classic-after-firmware.bin           marker=absent   bytes=1350288
  classic-before-firmware.bin          marker=absent   bytes=1350288
  text-a-firmware.bin                  marker=absent   bytes=306352
  text-a2-firmware.bin                 marker=absent   bytes=301648
  text-b2-firmware.bin                 marker=absent   bytes=313264
  text-b3-firmware.bin                 marker=absent   bytes=314272
  text-c-firmware.bin                  marker=absent   bytes=325088
  text-textboard-firmware.bin          marker=absent   bytes=301568
  text-textlib-firmware.bin            marker=PRESENT  bytes=301296
  -> positive control (text-textlib firmware contains marker) = True
  -> images other than the Text-lib build containing the marker: []
```

**positive control が要る理由:** 「見つからなかった」は、検出器が一度も「見つけた」ことがないなら
何の証拠にもならない (rule 04 §absence)。実際に `text-textlib` の firmware では **PRESENT** を返しており、
検出器は動作している。その上で **Classic の firmware (Text 経路接続の前後とも) には存在しない**。

→ **Text 専用の依存は Classic のビルドに一切到達しない。** `platformio.ini` がプロジェクトごとに
独立して生成され、`.pio/libdeps` もプロジェクトごとに独立しているため。

### 4.3 したがって危険はどこに残るか

危険は「構造」ではなく「**どの関数を呼ぶか**」に移る。Text 経路が `buildLibDeps()` を再利用した瞬間に
Classic と同じ universe を共有し、audit F-2 が記録した既往症 (Heltec が 16/20 board を汚染 /
MFRC522 のリンカ衝突 / ESP32Servo360 の `#error` で全 ESP32 ビルド停止) をそのまま引き継ぐ。
**分離は自動的には保たれない — 分離した関数を持ち続けることが条件。**

## 5. Board 分離 (裁定 §9) — Acceptance 6 = 事実取得済み

**問い:** Text-only Board を追加した場合、Classic 側へ必ず露出・影響するのか。

| 層 | 現状 (実測) | Text-only board を足したときの影響 |
|---|---|---|
| frontend Board registry | `variants/ota/frontend/src/stores/boardStore.ts` の `SUPPORTED_BOARDS` = **16 board** (FQBN は 10 種)。`experimental?: boolean` フラグの**機構は存在するが、現時点で true の board は 0 件** | digicode-text は**別リポジトリの別 frontend**。Classic の UI 一覧に現れる経路が無い |
| compile-api Board mapping | `boards.ts` の `FQBN_TO_PIO` = **10 エントリ**、全 ESP32 系 | probe は `textBoards.ts` という**独立 registry**を持ち、`boards.ts` を import していない。**差分 0** |
| FQBN validation | Classic: `pioTargetFor()` が未知 FQBN を throw / Text: `textPioTargetFor()` が別テーブルで throw | 互いの語彙が独立。Text の `digicode-text:esp32:probe_only` は Classic からは存在しない |
| 実証 | Text 専用 FQBN でビルドし、`-DDIGICODE_TEXT_PROBE_BOARD=1` が届かなければ `#error` で落ちる fixture を使用 → **成功** (301,568 B) | Text registry の build flag が実ビルドに到達していることの証明 |
| shared underlying toolchain | 同一 pioarduino platform / 同一 framework package | **ここだけは共有**。既存 platform に board 定義がある限り image 変更は不要 |

→ **「Text-only board が Classic に露出するか」は No。**
ただし**条件付き**: 追加したい board が**現行 image の pioarduino platform に board 定義を持つ**場合に限る。
持たない board (別 platform が要る = RP2040 など) は image 変更が必要で、そこは共有領域 → `04_…md`。

**関連する donor 側の事実 (audit F-12 の再確認):** Classic 側で board を 1 つ足す作業は
**2 リポジトリ・8 ファイル**に及び、compile-api 側は**本番サーバ上で SSH 編集 + 再起動が正規手順**と
コードコメントに明記されている。Text が独自 registry を持つ設計は、この運用に相乗りしないという意味も持つ。
