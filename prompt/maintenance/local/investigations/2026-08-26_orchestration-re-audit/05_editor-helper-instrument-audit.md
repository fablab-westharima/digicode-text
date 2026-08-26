# 05_Editor / LSP Spike と Local Helper の器材監査

**checker:** Codex `gpt-5.6-sol` · packet `DT6-D3-editor-lsp-and-helper-instrument-audit` · `LANE: VERIFICATION`
**verdict:** 🔴 **`ERROR / INVALID_MEASUREMENT`**
**監査基準:** case **DT-2** 本文 + rule 04 §absence / §detection power / §instrument dimension / §gauge unit

**この 2 領域は case DT-2(1 セッションで 9 件の器材欠陥、全て同一方向)の発生源であり、最優先で再監査した。**

**書込 0**(digicode-text / DigiCode-Helper とも最終 `git status --short` 0 行)。**production 接触 0。**

---

## 1. 本 packet の中心的な問い

> **修正は、欠陥のある probe を書いたのと同じ actor が、単独で書いた。
> 最終版の器材は、本当にその欠陥を除去しているか。**

Human が名指しした具体例:**Helper を停止するはずの fixture が、実際には停止していなかった**件。

---

## 2. 検証表(E1–E11 / H1–H14)

元の 8 + 11 claim に、Codex が追加列挙した E9–E11 / H12–H14 を含む **25 主張**。

| id | claim | positive control | 再検査方法 | 結果 | 誤差方向 | 裁定依存 |
|---|---|---|---|---|---|---|
| E1 | Monaco/CM: brotli **6.2×** / startup **4.1×** | 部分(両 app の ready は確認、cold/order control なし) | retained bundle を Node zlib で再圧縮 → **921,838/148,317 = 6.215×** `[command+RC=0]` | `PARTIALLY_CONTRADICTED` | startup は Monaco を悪く見せ得る | Yes — Monaco 第一候補 |
| E2 | native clangd の navigation / completion / 応答時間 | **あり**(診断あり / semantic 成功の両側) | Apple clangd 17 確認。retained probe 実行、**30 秒内に終了せず RC 未取得** | `EVIDENCE_REVIEWED_OK` | 不明 | Yes — Editor/LSP・main.cpp 材料 |
| E3 | `.ino` は素の clangd 不可 / `main.cpp` が軽い | **あり**(`.ino` 失敗 / C++ 成功) | `clangd --check` で `.ino` が **RC=3**、生成 `.ino.cpp` の Arduino.h・prototype・`#line` を diff 確認 `[command+RC]` | `INDEPENDENTLY_REPRODUCED` | — | 🔴 Yes — 内部 `main.cpp` 標準 |
| E4 | ALS 0.7.7 の find references は「**未実装**」 | あり(同 parser が他 provider を検出、server は documentSymbol 等に応答) | 最終 probe source 確認。`referencesProvider: ABSENT` + timeout `[static]` | `PARTIALLY_CONTRADICTED` | **ALS を悪く見せる** | Yes — 内部 main.cpp 標準 |
| E5 | diagnostics が正しく file/line/owner へ表示 | 部分(既知 2 件を投入。**visual / 誤行 control なし**) | `browser_editor.js:92-98` `[static]` | `PARTIALLY_CONTRADICTED` | **Editor を良く見せる** | Yes — Monaco / Compiler 統合 |
| E6 | bundle / startup / memory 数値 | 部分 | 再圧縮一致 / startup 単発 / memory は RSS proxy | `PARTIALLY_CONTRADICTED` | startup は Monaco を悪く、RSS は server を悪く見せ得る | Yes |
| E7 | COOP/COEP/DIP と広告両立 | **あり**(header なし / COOP+COEP iframe / DIP 各 arm) | final Worker 順序・SAB・Atomics fixture を source 確認。localhost 再実行は **bind EPERM** | `EVIDENCE_REVIEWED_OK` | 実広告互換を良く見せ得る | No direct settled ruling |
| E8 | browser clangd WASM 成立 / WASI sysroot に Arduino 環境なし | **なし**(Arduino headers を載せた WASM arm が存在しない) | retained source clone なし。公開 demo 再取得 **DNS RC=6** | `NOT_OBTAINED` | 不明 | No direct ruling |
| E9 | Compiler jump / AI multi-file edit・undo が両 Editor で成立 | 部分(挿入結果あり) | CM の edit range 補正は source で正しい。しかし **browser probe は CM undo を実行せず**、`aiUndoAll` も current view 1 つだけ `[static]` | `PARTIALLY_CONTRADICTED` | **CodeMirror を良く見せる** | Yes — Monaco / AI |
| E10 | OSS version / license / maintenance facts | 部分 | retained package metadata は読めるが、外部 API 取得物・source snapshot なし | `NOT_INDEPENDENTLY_CHECKED` | 不明 | No |
| E11 | 各 LSP 方式が storage へ課す制約 | N/A | source / path 構造を review。方式自体が未実装 | `NOT_INDEPENDENTLY_CHECKED` | 不明 | No |
| H1 | Extension なし Helper 1 個で全経路成立 | **あり**(Helper absent / present 両 arm) | final Helper / browser source を review。再実行は **local bind EPERM** | `EVIDENCE_REVIEWED_OK` | — | Yes — Local Helper 技術成立 |
| H2 | LNA permission は **1 回**で済む | 🔴 **なし**(grant / no-grant は接続 control であって永続性 control ではない) | `helper_connect.js:15-52` `[static]` | `PARTIALLY_CONTRADICTED` | **Helper UX を良く見せる** | Yes |
| H3 | Origin + token + loopback bind の防御モデル | **あり**(403 / 401 / OPENED の truth table) | final Helper source で 3 防御を確認。donor の 0.0.0.0 bind も pinned SHA で確認 `[static]` | `INDEPENDENTLY_SOURCE_VERIFIED` | — | Yes |
| H4 | Helper なし fallback 成立 | **あり**(port-free precondition + phase2 liveness) | `helper_scenario.js:30-48` 実読 `[static]` | `NOT_OBTAINED` | 不明 | Yes |
| H5 | crash / restart / reconnect 成立 | **あり**(connected → absent → connected) | final scenario source と記録を review。raw run なし、再実行 EPERM | `EVIDENCE_REVIEWED_OK` | — | Yes |
| H6 | ESP32 project の偽 diagnostic **0 件** | 部分(7/1/5 件 arm はあるが **main.cpp のみ**) | `probe_cpp.js:39-56` 実読 `[static]` | `PARTIALLY_CONTRADICTED` | **esp-clangd を良く見せる** | Yes |
| H7 | LSP header pack 64 MiB / 5120 files / xz 6.0 MiB | N/A | exact pack / manifest 未保存。**現在は core 3.3.11 で、記録の 3.3.8 path は不存在** | `NOT_OBTAINED` | 不明 | Yes — Local/Desktop pack 材料 |
| H8 | server clangd **≈500 MiB/session**・ほぼ線形・**共有 page の恩恵なし** | 🔴 **なし**(N ramp はあるが unique / physical-memory control なし) | `concurrency.js:14-19,43-57` 実読 `[static]` | `PARTIALLY_CONTRADICTED` | **server-side を悪く見せる** | 🔴 Yes — server-side 必須 backend 除外 |
| H9 | 20 / 50 / 100 人の費用 | N/A | 500 MiB × N を再計算 → 20 = **9.766 GiB** / 50 = **24.414 GiB** / 100 = **48.828 GiB** | `PARTIALLY_CONTRADICTED` | server-side を悪く見せる | Yes |
| H10 | 署名で macOS 3→1 / Windows 4→1 | 🔴 **なし**(signed / unsigned 実 build なし) | evidence 自身が **installer 未作成と明記**。Windows は署名後も SmartScreen reputation が必要と同じ文書にある | `PARTIALLY_CONTRADICTED` | **signed Helper UX を良く見せる** | Yes — Desktop signing ruling |
| H11 | donor に packaging / update 資産あり | **あり**(updater 署名 2 hits) | pinned SHA で 54 files 走査。4 target / Tauri updater / minisign / latest.json `[static, RC=0]` | `INDEPENDENTLY_SOURCE_VERIFIED` | — | Yes |
| H12 | mixed-content / no-cors / PNA / browser 挙動 | **あり**(permission / origin 各 arm) | instrument / source review。再 real-fire は EPERM | `EVIDENCE_REVIEWED_OK` | — | Yes — Helper 成立条件 |
| H13 | Extension 不要 / Native Messaging 制約 / Helper bundle ほぼ不増 | 部分 | bundle artifact は保持。Native Messaging の外部 source snapshot なし、Extension 案は未実装 | `NOT_INDEPENDENTLY_CHECKED` | 不明 | Yes — Extension を挟まない方向 |
| H14 | 教室 server 50 人 ≈ 25 GB / 32 GB PC 1 台 | **なし**(実 LAN / server なし) | H8 外挿。算術は一致 | `PARTIALLY_CONTRADICTED` | classroom server を悪く見せ得る | No — deferred candidate |

---

## 3. 🔴 H4 — Human が名指しした Helper 停止 fixture

### 3-1. 最終 fixture は実際に停止している

`helper_scenario.js:30` の正確な流れ `[static]`:

```js
execSync('lsof -ti tcp:8771 | xargs -r kill -9 2>/dev/null || true')
...
stopHelper();
await sleep(1200);
report.phase1_precondition_port_free = !helperListening();
if (!report.phase1_precondition_port_free) {
  console.error('ABORT: helper still listening on 8771');
  process.exit(2);
}
```

記録された証拠行は `04_monaco-helper-clangd-probe.md:32` の
`phase1_precondition_port_free = true`、Phase 1 結果は同ファイル 39–48 行。
script の mtime は 12:00:55、evidence commit は 12:29:47。

### 3-2. しかし記録値との結合は証明できない

**raw JSON / 実行 RC / script hash を evidence に結ぶ artifact がない。**

| 問い | 判定 |
|---|---|
| 最終 fixture が Helper を止め、止まらなければ中断するか | ✅ `INDEPENDENTLY_SOURCE_VERIFIED` |
| 記録された 921 ms 等が、その最終版の**同一 run** から得られたか | 🔴 `NOT_OBTAINED` |

**決着に必要なもの:** script SHA・port-free 行・Phase 1 全出力・RC を**同じ raw artifact に保存した再 run**。
今回の再 run は `listen EPERM 0.0.0.0:8443` で **RC=1**。

**→ Human の懸念は「器材側では解消済み、記録との結合は未証明」が正確な答えである。**

---

## 4. 🔴 H6 — 「偽 diagnostic 0 件」の分母

**主張どおりではない。**

`probe_cpp.js:39` で 5 ファイルを open するが、52–56 行が収集するのは:

- URI = `src/main.cpp`
- **最初の** `publishDiagnostics` 通知
- その通知内の diagnostic 件数

**だけ。**

→ **実測分母は「1 fixture / opened 5 files 中 1 URI / 最初の 1 通知」。project 全 5 ファイルではない。**

positive control は構成 #1/#2/#3 の 7/1/5 件だが、これも**同じ `main.cpp` 単独計器**である。
**全 5 URI を分類する collector の positive control は存在しない。**

現在の全 5 ファイル再検査は、ESP32 core が 3.3.8 → 3.3.11 へ更新されて path が消えており
`Arduino.h file not found`、**RC=3**。これは historical 0 件の反証ではなく**再現 artifact 不足**である。

---

## 5. 🔴🔴 H8 — server-side memory:計器が主張した次元を測っていない

`concurrency.js:14-19,43-57` `[static]`:

> **計器は `ps -o rss` を process 間で加算している。**

| 問題 | 内容 |
|---|---|
| 共有 page の重複計上 | **RSS 合計は shared page を重複計上する**ため、「共有効果は無い」という主張**そのものを測定できない** |
| 課金対象と一致しない | RSS 合計は server operator が課金される物理 RAM ではない |
| 誤差方向 | **server-side を実際より悪く見せる** |

**この数値が Human 裁定「server-side LSP を Web 版の必須 backend にしない」へ直接入っている。**

**必要な再測定:** unique physical memory / PSS / footprint / 実 8-session RAM / RSS→billing 変換。

H9 の算術自体は合う(500 MiB × N)が、`GB` 単位表記と RSS→RAM proxy が不正確で、H8 を継承する。

---

## 6. DT-2 の 9 件の修正は本当に欠陥を除去したか

**corrected properly 5 / symptom-only 3 / cannot tell 1**

| 欠陥 | 判定 | 内容 |
|---|---|---|
| P-1 | **corrected properly** | Worker source が inline reader より前。header なし control あり |
| P-2 | **corrected properly** | CM range は 1-based を 0-based offset へ変換。(1,1)–(1,1) が zero-width insertion |
| P-3 | 🔴 **symptom-only** | clean ALS process を最終 probe 自身が assert しない。単独結果は得たが**元の precondition 欠陥を防止していない** |
| P-4 | 🔴 **symptom-only** | 「definition を結論に使わない」としたが、**最終 findings と Local Helper evidence が definition 成功を再び引用している**。root isolation / URI assertion なし |
| P-5 | **corrected properly** | post-edit caret を明示的に再計算。no-edit arm と実 type arm あり |
| Q-1 | **corrected properly** | HTML を request ごとに読み、`Cache-Control: no-store` |
| Q-2 | **corrected properly**(最終 source) | port resource で kill し、port-free でなければ Phase 1 前に RC=2。ただし historical raw binding は cannot tell |
| Q-3 | 🔴 **cannot tell** | 壊れた shell loop も修正版 request / raw header も保存されていない。Helper 側 403 logic は source 確認できるが sender 補正の証明ではない |
| Q-4 | 🔴 **symptom-only** | P-4 と同じ。同名 fixture を除去・分離せず、最終 scenario も definition URI を assert しない |

---

## 7. 🔴 新規に発見された器材欠陥(元の 9 件とは別、9 件)

| # | 欠陥 | 方向 |
|---|---|---|
| 1 | **H6**: 5 ファイル open を 1 ファイル最初の通知で代表させた | subject が**良く**見える |
| 2 | **H8/H9**: summed RSS で shared-page 効果と課金 physical RAM を判断 | subject が**悪く**見える |
| 3 | **H2**: programmatic permission grant を「利用者の許可 1 回・永続」と読んだ | subject が**良く**見える |
| 4 | **E1 startup**: n=1、順序・cold/warm・反復 control なし。ready は LSP 接続も含み、WS 接続だけなら 242.9 ms 対 38.6 ms | subject が**悪く**見え得る |
| 5 | **E4**: capability 非広告 + hang を source-level「未実装」と断定。caller-facing unavailable は支持されるが実装不存在は未測定 | subject が**悪く**見える |
| 6 | **E5**: Compiler 実出力ではなく hand-written JSON、visual 未実施を real-fire と分類 | subject が**良く**見える |
| 7 | **E9**: CodeMirror 全ファイル undo を実行していない。fixture の `aiUndoAll` も current view だけ | subject が**良く**見える |
| 8 | **H10**: 実 installer なしの手順表を「実測の許可回数」として裁定へ渡した | subject が**良く**見える |
| 9 | **H4/H7**: raw run / script hash / board-pack manifest を保存しておらず historical 再現不能 | 不明 |

---

## 8. 🔴 DT-2 の directional bias は消えていない — 逆向きの誤差が生まれている

**DT-2 当初は 9 件すべてが subject を悪く見せる方向だった。最終セットでは双方向になっている。**

| 方向 | 該当 |
|---|---|
| subject を**悪く**見せる | E1 / E4 / H8 / H9 |
| subject を**良く**見せる | E5 / E9 / H2 / H6 / H10 |
| 方向不明 | H4 / H7(provenance 不足) |

**「全欠陥が一方向」という DT-2 当初の一様性は最終セットには無い。
しかし「計器欠陥が architecture finding へ入る」パターン自体は残っている。**

→ これは DT-2 本文へ追記すべき観察である(修正パスが逆方向の誤差を導入する)。

---

## 9. 独立確認できない Human ruling

| ruling | original evidence | 未確認の部分 | impact | 再裁定 |
|---|---|---|---|---|
| Monaco 第一候補 | E1 / E5 / E9 | startup 4.1× の再現性、diagnostic visual、CM 全 file undo | performance 比較と一部 integration claim が弱まる。**bundle 6.2× は確認済み** | **No** — 再測定のみ必要 |
| 内部標準 `main.cpp` | E3 / E4 | ALS source-level「未実装」と厳密 latency | **`.ino` の追加層と raw clangd failure は独立確認済み。**caller から references 不可は維持 | **No** |
| server-side LSP を必須 backend にしない | H8 / H9 | unique physical memory、PSS / footprint、実 8-session RAM、RSS→billing 変換 | 🔴 **約 500 MiB × N と費用の根拠が未確定。最も影響が大きい** | **No** — ruling 再開は禁止。**独立 memory 再測定が必要** |
| Local Helper 技術成立 | H1–H7 | H4 historical run binding、H2 permission persist、H6 project 全体 0、H7 pack artifact | **接続 source と防御 model は支持。**UX / diagnostic / pack の一部は未支持 | **No** |
| 署名で macOS 3→1 / Windows 4→1 | H10 | signed / unsigned 実 installer、Gatekeeper / SmartScreen 実挙動 | **許可回数の数値は実測値として扱えない** | **No** |

---

## 10. 実行コマンドと観測

| コマンド | RC | 観測 |
|---|---|---|
| `node -e '… zlib.gzipSync / brotliCompressSync …'` | 0 | 元 bundle 値と **byte 単位一致**(6.215×) |
| `/usr/bin/clangd --check=<SensorNode.ino> --log=error` | **3** | `expected exactly one compiler job` |
| `diff -u SensorNode.ino SensorNode.ino.cpp` | 1 | Arduino 前処理 3 操作を確認 |
| retained `probe_cpp.js` 実行 | 未取得 | LSP JSON は取得したが 30 秒時点で process 未終了 |
| esp-clangd で 5 ファイル `--check` | 各 **3** | 3.3.8 path 消失による `Arduino.h not found` |
| `curl --max-time 10 -fsSI https://clangd.guyutongxue.site/` | **6** | DNS unavailable |
| Helper webapp 起動 | **1** | `listen EPERM 0.0.0.0:8443` |
| donor pinned SHA 検索 | 0 | 54 files、codesign/notarization/AuthentiCode 系 0、**updater signing positive control 2** |
| 最終 `git status --short`(digicode-text / DigiCode-Helper) | 0 | 両方 **出力 0 行** |
| ports 8096/8097/8098/8099/8442/8443/8771 | — | **listeners 0** |

**未実施 rung:** visual / Windows / Linux / 実 installer / 実署名・notarization / 実広告 GPT /
production contact / 100-user real-fire。
