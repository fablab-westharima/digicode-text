# 05_Helper に何を同梱するか — clangd / esp-clangd / board 環境

**Acceptance 10 / 11 に対応。裁定 §6 / §7。検証の型: real-fire + primary source。**

---

## 1. 🔴 まず決着した一件 — Local Helper なら偽診断が 0 件になる

前 spike の残課題(F-15 / R-5)は「**Xtensa target 不一致のため偽の赤線が 1 件残る**」だった。
Local Helper 方式では利用者 PC 側に**適切な clangd variant** を置けるので、これを実測で潰した。

**同一の ESP32 multi-file プロジェクト (`fixtures/cpp32`) に対する 4 段階の実測:**

| # | 構成 | **偽診断** |
|---|---|---|
| 1 | Apple clangd 17、素の `compile_commands.json` | 🔴 **7 件**(`-mlongcalls` 等の GCC 専用フラグ + `riscv/rv_utils.h` not found) |
| 2 | Apple clangd 17 + `.clangd` フラグ除去 + `--query-driver` | 🟡 **1 件**(`__block attribute…` = ホスト target 由来) |
| 3 | **esp-clangd 21.1.3**、素の `compile_commands.json` | 🟡 **5 件**(`-mlongcalls` は**通るようになった** = Xtensa target がある。残りは GCC 専用フラグ 3 件 + `stdbool.h` not found) |
| 4 | **esp-clangd + `.clangd` フラグ除去 + `--query-driver` + `-isystem` 1 行** | 🟢 **0 件** |
| 5 | **esp-clangd + `.clangd` フラグ除去 + `-isystem` 6 行(`--query-driver` なし)** | 🟢 **0 件** |

**#4 / #5 の同時測定値:** go to definition 0.6 ms · **find references 3 箇所 / 3 ファイル** ·
workspace symbol 1.0 ms · **completion 100 件** · 初回診断 1.8 s。

> 🔴 **これは Local Helper 方式に固有の強みではなく、「実 toolchain がある側」の強みである。**
> server-side LSP でもサーバに toolchain を置けば同じ品質になる。
> **Local Helper の利点は、その toolchain の設置コストが利用者 PC 側に分散すること**である。

### #5 が重要な理由 — GCC バイナリ 91 MiB を落とせる

`--query-driver` は clangd に**実際の GCC を実行させて** system include を取得させる仕組みで、
そのために **`bin/` の 91.4 MiB** を同梱することになる。
GCC が返す 6 個の include パスを `.clangd` の `-isystem` に**焼き込む**と、
**GCC バイナリ無しで偽診断 0 件に到達した**(#5、実測)。

esp-clangd が既定で見に行かない `stdbool.h` は、GCC 側の
`lib/gcc/xtensa-esp-elf/14.2.0/include`(**144 KiB**)にある。

## 2. 配布サイズの実測

### clangd 本体

| 対象 | サイズ (圧縮済み配布物) |
|---|---|
| **esp-clangd macOS ARM** | **10,995,644 B (10.5 MiB)** |
| **esp-clangd macOS x86_64** | **12,662,520 B (12.1 MiB)** |
| **esp-clangd Windows (mingw)** | **14,144,936 B (13.5 MiB)** |
| esp-clangd Linux x86_64 | 17,077,740 B (16.3 MiB) |
| 展開後 (macOS x86_64) | **56 MiB** |
| 参考: LLVM 公式のフル配布 | **901 MB** (`clang+llvm-23.1.0-x86_64-pc-windows-msvc.tar.xz`) — **clangd だけを配る Espressif の形が正しい** |

🔴 **`clangd-esp-*` の tar には entries が 3 つしかない** — `esp-clangd/`, `esp-clangd/bin/`,
`esp-clangd/bin/clangd`。**clang の builtin ヘッダは入っていない。**
だから素で使うと `stdbool.h` が見つからない(§1 #3)。**この事実は同梱設計に直結する。**

### board 環境(ESP32 1 枚分)

`.clangd` が実際に参照した集合だけを取り出して測った(**5,120 ファイル**):

| 要素 | 非圧縮 |
|---|---|
| esp32-libs ヘッダ (IDF) | **44.4 MiB** |
| gcc sysroot include | 16.5 MiB |
| core esp32 | 1.1 MiB |
| bundled libraries ヘッダ | 1.4 MiB |
| gcc builtin include / include-fixed | 0.1 MiB |
| flags (`includes` / `defines` / `cpp_flags` 応答ファイル) | 0.1 MiB |
| **合計** | **64 MiB** |
| **tar.gz** | **9,674,032 B (9.2 MiB)** |
| **tar.xz** | **6,295,020 B (6.0 MiB)** |

**比較のため — 同梱しない場合の全体規模(実測):**

| | ディスク |
|---|---|
| ESP32 core 一式 (`packages/esp32`) | **5.3 GB** |
| そのうち xtensa toolchain | 1.1 GB |
| SoC 別 lib ツリー | esp32 162 MB · esp32s3 216 MB · esp32c3 207 MB · esp32c6 240 MB · esp32c5 246 MB · esp32h2 227 MB · esp32p4 213 MB · esp32s2 154 MB |
| ESP8266 core | 453 MB |
| RP2040 core | 1.4 GB |
| Arduino AVR core | 766 MB |

🔴 **「LSP に必要なヘッダ集合」と「コンパイルに必要な環境」は桁が 2 つ違う** — 64 MiB 対 5.3 GB。
**Text Compiler はクラウド側にあるので、Helper はコンパイル環境を持つ必要がない。**
これが Option H4 を現実的にしている根拠である。

## 3. Option H1〜H4 の比較

| 軸 | **H1** Helper+clangd のみ | **H2** Helper+clangd+対応 board 全部 | **H3** Helper+Text Compiler と共通 toolchain | **H4** 薄い Helper + 初回利用時に board 環境を DL/cache |
|---|---|---|---|---|
| **installer size** | **11〜14 MB** + Tauri app 数 MB | 11〜14 MB + **6 MB × board 数**(xz) | 🔴 **GB 級**(ESP32 だけで 5.3 GB) | **11〜14 MB** + Tauri app |
| **update size** | clangd 更新時のみ | clangd + 全 board | 🔴 巨大 | clangd 更新 + 変わった board のみ |
| **disk** | 56 MiB + α | 56 MiB + **64 MiB × board 数** | 🔴 GB 級 | 56 MiB + 使った board 分だけ |
| **first-run time** | 即時 | 即時 | 即時(ただし DL が終わっていれば) | **board 1 枚あたり 6 MB DL + 展開**(数秒〜十数秒) |
| **偽診断 0 件に到達するか** | 🔴 **到達しない**(ヘッダが無い) | ✅ | ✅ | ✅ |
| **Board 追加の容易さ** | — | 🔴 Helper の再リリースが要る | 🔴 同左 | 🟢 **サーバ側にファイルを置くだけ。Helper は変えない** |
| **offline** | — | 🟢 完全 offline | 🟢 完全 offline | 🟡 初回だけ通信が要る。以後 cache |
| **corporate firewall** | 🟢 | 🟢 | 🟢 | 🟡 **配信元へ HTTPS 到達が要る**(Helper 更新と同じ経路なら追加要件なし) |
| **maintenance** | 軽い | 🔴 board 追加のたびに全 OS 分を再ビルド・再署名 | 🔴 最重 | 🟢 **board 定義とバイナリの寿命が分離する** |
| **version 同期** | — | Helper version = board 集合 version(硬直) | 同左 | 🟡 **Helper ⇄ board pack の互換表が要る**(新たな設計要素) |
| **Text Compiler との整合性** | — | 別々に管理 → ずれうる | 🟢 定義上一致 | 🟢 **同じ board 定義から両方を生成できる**(S002 が「Board registry は Text 側で独立管理」と裁定済み — baton 21) |

**実測に照らした所見(推奨ではない):**

- 🔴 **H1 は単独では成立しない。** ヘッダが無ければ `Arduino.h` すら解決できず、
  「高度解析を有効にしたのに赤線だらけ」になる。H1 は必ず H4 とセットになる。
- 🔴 **H3 は installer として現実的でない。** ESP32 だけで 5.3 GB。
- **H2 は board を絞れば成立する。** 1 board = 6 MB (xz) なので、
  たとえば ESP32 / ESP8266 / RP2040 の 3 枚なら **+18 MB 程度**。
  ただし board を増やすたびに **4 プラットフォーム分を再リリース**することになる。
- **H4 は board 数に対してスケールする唯一の形。** 代償は
  ①初回に通信が要る ②**Helper と board pack の version 互換表という新しい設計要素**。

## 4. Text Compiler との関係(S002 裁定との整合)

S002 の裁定は **「Text 専用 Compiler を持ち、Board registry / Library registry / dependency 定義は
Text 側で独立管理する」**(16.md §3、baton 21)。

🟢 **その独立 registry は、Helper 側の board pack の生成元にもなれる。**
同じ board 定義から
① クラウド Compiler 用の toolchain 構成 と
② Helper 用の**ヘッダのみの pack (6 MB)**
を出せば、**Compiler と LSP が同じ board 情報を見ている**ことが構造的に保証される。

🔴 **逆に、両者を別管理にすると「コンパイルは通るのに LSP が赤線を出す」/「LSP は通るのに
コンパイルが落ちる」が恒常的に発生する。** これは初学者向け製品では最悪の症状である。
**ただしこれは提案であって、architecture の決定ではない**(裁定 §18)。

## 5. 測っていないこと

| 項目 | 状態 |
|---|---|
| ESP8266 / RP2040 / AVR の board pack サイズ | **NOT OBTAINED**(ESP32 のみ実測) |
| RISC-V 系 ESP32-C/H/P で偽診断 0 件に到達するか | **NOT OBTAINED**(esp-clangd の既定 target は `riscv32-esp-unknown-elf` なので有望だが未測定) |
| board pack の配信・cache・検証機構の実装 | **NOT OBTAINED**(設計要素として挙げただけ) |
| 利用者ライブラリ (`lib_deps`) 追加時のヘッダ供給 | **NOT OBTAINED** — 🔴 **未解決の設計問題として残る** |
| Windows / Linux での esp-clangd 実挙動 | **NOT OBTAINED** |
