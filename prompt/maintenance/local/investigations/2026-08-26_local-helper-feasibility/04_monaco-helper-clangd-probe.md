# 04_Monaco → localhost Helper → clangd の実接続と、Helper 不在時の挙動

**Acceptance 4 / 5 / 6 / 7 に対応。裁定 §8 / §9。検証の型: real-fire。**
1 つのブラウザセッションの中で、Helper の**不在 → 起動 → 死亡 → 復活 → リロード**を
実際に起こして測った。配信は **HTTPS + `treat-as-public-address` + permission 許可** = **本番相当**。

---

## 1. 構成

```
Chrome for Testing 148  (https://…/editor-public, secure context, public address space,
                         local-network-access = granted)
        │  fetch http://127.0.0.1:8771/discover     ← Helper 探索
        │  ws   ws://127.0.0.1:8771/lsp?token=…     ← LSP
        ▼
DigiCode Text Helper (probe)   ── 127.0.0.1 のみ bind / Origin 検証 / token 検証
        │
        ▼
clangd (ESP32 fixture, compile_commands.json)
```

fixture は裁定 §8 指定の `src/{main,sensor,network}.cpp` + `include/{sensor,network}.h`
(前 spike の `fixtures/cpp32`、ESP32 実フラグ)。

**エディタ側の設計原則(probe で実装し、実測で確かめたもの):**
基本機能を**先に**立ち上げ、**そのあとで**初めて Helper を探しに行く。
Helper に関する失敗は **1 つも例外として投げない** — `{unavailable, reason}` を返す。

## 2. 🔴 実測 — 5 フェーズ

**前提条件も測った**(「Helper が無い」を主張する前に、ポートが本当に空いていることを確認):
`phase1_precondition_port_free = true` / `phase3_precondition_port_free = true`。

### Phase 1 — Helper 未インストール (裁定 §9)

| 項目 | 実測 |
|---|---|
| **エディタ起動** | **921 ms** で `__editorReady` |
| **基本機能が動いたか** | ✅ **`basicEditorWorking: true`** — model 5 件 / project 内検索 **7 hit** / 実際に 1 行挿入して先頭が変わったことを確認 |
| Helper 探索にかかった時間 | **91 ms** (3 ポート試行して全滅) |
| **バナー** | 「高度なコード解析は利用できません。DigiCode Text Helper をインストールすると、定義ジャンプ・参照検索・高度補完が利用できます。」 |
| **エラーポップアップ** | **0** |
| **compile 診断 → file/line jump** | ✅ **動いた**(`src/network.cpp` に marker 1 件、該当行へ移動) |
| go to definition | **`{unavailable: true, reason: "helper not connected"}`** — 例外ではない |
| find references | 同上 |

**→ 裁定 §9 の要求(Helper 無しで基本 Editor が壊れない)は実測で満たされた。**

### Phase 2 — Helper を起動

| 項目 | 実測 |
|---|---|
| 接続完了 | **44 ms** |
| serverInfo | clangd が応答 |
| バナー | 「高度なコード解析: 有効 (DigiCode Text Helper 接続中)」 |
| **go to definition** | ✅ `src/sensor.cpp:12`(宣言ではなく**実装**) |
| **find references** | ✅ **3 箇所 / 3 ファイル** (`src/main.cpp:20` · `include/sensor.h:14` · `src/sensor.cpp:12`) |
| **workspace symbols** | ✅ **23 件**(`Network` `g_network` … ESP32 の設定シンボルまで) |
| **cross-file completion** | ✅ **3 件** — `humidity` · `temperature` · `timestampMs`(別ファイル `sensor.h` の構造体メンバ、**打鍵直後**) |
| エラーポップアップ | **0** |

### Phase 3 — Helper が死ぬ (kill -9)

| 項目 | 実測 |
|---|---|
| 状態遷移 | `connected` → **`lost`** → **`absent`**(イベント列を記録) |
| バナー | 未インストール時と同じ案内へ**自動で戻った** |
| **エラーポップアップ / ダイアログ** | **0** |
| **エディタは動き続けたか** | ✅ project 内検索 **14 hit** / compile 診断 marker 設定 / タブ切替(`currentFile` が変わった) |
| semantic 要求 | **`{unavailable, reason}`** を返す。例外なし |
| **古い clangd の赤線** | ✅ **消した**(Helper が死んだ状態で古い semantic 診断を残すのは、無いより悪い) |

### Phase 4 — Helper が戻る

| 項目 | 実測 |
|---|---|
| **再接続** | **3,941 ms**、**利用者の操作ゼロ**(指数バックオフの自動再試行) |
| semantic 復帰 | ✅ go to definition が `src/sensor.cpp:12` を返した |
| エラーポップアップ | **0** |

### Phase 5 — ブラウザリロード (Helper 起動中)

| 項目 | 実測 |
|---|---|
| リロード完了 | **298 ms** |
| Helper 再発見 | **20.3 ms** |
| 基本機能 | ✅ 変わらず動作 |

### セッション全体

**`page_errors_or_dialogs: []`** — 5 フェーズを通して、
**JS 例外もダイアログも 1 件も出ていない。**

## 3. bundle への影響

| | raw | gzip | brotli |
|---|---|---|---|
| Monaco 単体 (前 spike) | 4,486,763 | 1,164,349 | 900,951 |
| **Monaco + Helper クライアント** | **4,443,525** | **1,155,934** | **894,684** |
| CSS (共通) | 157,246 | 24,738 | 20,887 |

🟢 **Helper クライアントは bundle をほぼ増やさない。**
(差は同一機能の別実装によるもので、Helper 対応のために増える分は測定誤差の範囲。)

## 4. 実装上わかった要点

1. 🔴 **「基本機能を先に立ち上げ、Helper は後から探す」順序が、fallback UX の本体。**
   探索を起動パスに入れると、Helper 不在の利用者は**探索が終わるまで待たされる**。
   実測では探索 91 ms だが、これはポートが**即座に拒否**されたためで
   (`ERR_CONNECTION_REFUSED` は 1〜2 ms)、ファイアウォールで **drop** される環境では
   タイムアウトまで延びる。**非同期にしておくことが必須**。
2. 🔴 **Helper 側の死は「イベント」であって「エラー」ではない。** `ws.onerror` を握りつぶし、
   状態遷移として扱った結果、ポップアップ 0 を実測できた。
3. 🔴 **Helper が落ちたら semantic marker を消すこと。** 消さないと、編集を続けるユーザーに
   古い解析結果が残り続ける。実測でこの掃除が入っていることを確認した。
4. **compile 診断は Helper と無関係に動く。** Compiler 由来の marker は
   `setModelMarkers(model, 'digicode-compiler', …)` の owner に載るので、
   clangd の marker を消しても残る(前 spike F-3 の owner 分離が、ここで効いた)。

## 5. 測っていないこと

| 項目 | 状態 |
|---|---|
| Helper の version mismatch 時の挙動 | **NOT OBTAINED**(probe Helper は version を返すが、突き合わせロジックは未実装) |
| ローカルポートがファイアウォールで **drop** される環境(拒否ではなく無応答) | **NOT OBTAINED** — 探索時間が延びる方向 |
| 複数タブから同一 Helper への同時接続 | **NOT OBTAINED** |
| project を切り替えたとき(別 root)の Helper 再初期化 | **NOT OBTAINED** |
| Windows / Linux での同シナリオ | **NOT OBTAINED**(macOS x86_64 のみ) |
| 大規模プロジェクト (数十ファイル / 数千行) | **NOT OBTAINED** |
