# 06_Editor probe — Monaco / CodeMirror を実ブラウザで動かした結果

**Acceptance 2 / 3 / 6 / 7 に対応。検証の型: real-fire。**
Chrome for Testing 148.0.7778.96 を実起動し、`127.0.0.1:8096` の静的サーバから配ったページで、
`127.0.0.1:8097` の **WebSocket ↔ 実 clangd stdio ブリッジ**に繋いで測った。
LSP サーバは両者で**同一プロセス構成**なので、差はエディタ層の差である。

---

## 1. 何を作ったか (裁定 §9 の probe)

`fixtures/cpp/` (`src/{main,sensor,network}.cpp` + `include/{sensor,network}.h`) を対象に、
Monaco 版と CodeMirror 版で**同じ機能**を実装した。

| 機能 | Monaco 実装 | CodeMirror 実装 |
|---|---|---|
| file tree | 自前 (DOM) | 自前 (DOM) |
| multi-tab | `monaco.editor.createModel` を URI ごとに保持 | `EditorState` を path ごとに保持し `view.setState` |
| syntax highlighting | 内蔵 `cpp` | `@codemirror/lang-cpp` |
| diagnostics | `monaco.editor.setModelMarkers(model, owner, …)` | `@codemirror/lint` の `setDiagnostics` |
| definition / references / completion | `registerDefinitionProvider` 等 + 自前 LSP クライアント | `@codemirror/lsp-client` の `languageServerSupport` |
| compile error → file/line jump | `openFile(file, line)` + `revealLineInCenter` | `openFile` + `view.dispatch({selection})` |
| AI multi-file 編集 | `model.pushEditOperations` | `state.update({changes})` |

## 2. 起動と転送量 (real-fire)

| | DOM load | **editor ready** | 転送 | リクエスト | WebSocket 接続 | **LSP `initialize`** |
|---|---|---|---|---|---|---|
| **Monaco** | 1,030 ms | **1,087 ms** | 4,646,879 B | 3 | 242.9 ms | **24.8 ms** |
| **CodeMirror 6** | 203 ms | **262 ms** | 544,580 B | 2 | 38.6 ms | **31.3 ms** |

> 配信は **localhost の非圧縮**。実運用の brotli 相当は `02` §1 (Monaco 900 KiB / CodeMirror 145 KiB)。
> `initialize` が両者とも 25〜31 ms なのは、**LSP 側の起動コストがエディタ選択と無関係**であることを示す。

## 3. multi-file semantic navigation (Acceptance 3)

**両者とも同一の結果**を返した (同じ clangd を見ているので当然だが、
「エディタ層が LSP の応答を正しく往復させられるか」の確認になっている)。

`src/main.cpp` の `g_sensor.read()` 上での操作:

| 操作 | Monaco | CodeMirror | 返ってきた中身 |
|---|---|---|---|
| **go to definition** | **1.7 ms** | **2.0 ms** | `src/sensor.cpp:12` — **宣言 (`include/sensor.h:14`) ではなく実装**に飛んだ |
| **find references** | **0.7 ms** | **0.8 ms** | **3 箇所 / 3 ファイル**: `src/main.cpp:20`, `include/sensor.h:14`, `src/sensor.cpp:12` |
| **workspace symbol** (`Network`) | **0.8 ms** | (Monaco 側で測定) | `Network`, `g_network`, `network_down`, `network_reset`, `network_unreachable` |
| 開いた model / state 数 | **5** | 5 | fixture の全ファイル |

**header → implementation の移動**は上記 definition がそのまま該当する
(`include/sensor.h` の宣言から `src/sensor.cpp` の定義へ)。

**clangd 側の診断も両方のエディタに届いた**: Monaco 側で `include/sensor.h` / `src/sensor.cpp` /
`src/network.cpp` / `src/main.cpp` / `include/network.h` の 5 ファイルすべてに 1 件ずつ配信された
(この 1 件の中身と、それが偽陽性である件は `03` §2)。

## 4. 🔴 compile diagnostics → file / line jump (Acceptance 6)

S002 が Compiler 側から `file:line:column:severity:message` を構造化取得できることを実証済み。
**その形のまま**の fixture を、Compiler を一切変更せずにエディタへ流し込んだ。

投入した fixture (S002 が実際に返した形):

```json
[{"file":"src/network.cpp","line":12,"column":3,"severity":"error",
  "message":"'Serial' was not declared in this scope"},
 {"file":"src/sensor.cpp","line":9,"column":5,"severity":"error",
  "message":"expected ';' before '}' token"}]
```

| | 結果 |
|---|---|
| **該当ファイルを開いたか** | ✅ 両者とも `after_jump_current_file = "src/network.cpp"` (1 件目のファイル) |
| **該当行へ jump したか** | ✅ Monaco = `revealLineInCenter` + `setPosition` / CodeMirror = `selection` + `scrollIntoView` |
| **marker / underline を出せたか** | ✅ Monaco: `setModelMarkers` で 2 ファイルに設定 / CodeMirror: `setDiagnostics` で 2 ファイルに設定 |
| **まだ開いていないファイルでも動くか** | ✅ 両者とも、診断が指すファイルを**その場で開いて** marker を付けた |

> 🔴 **Monaco の marker は owner 名前空間で分かれる。** `setModelMarkers(model, 'digicode-compiler', …)` と
> clangd 由来の `'clangd'` が**同じファイル上で共存**し、`getModelMarkers` は合算で 2 を返した。
> **Compiler 診断と LSP 診断を混ぜずに同居させられる**ことを意味し、
> 「コンパイルすると LSP の赤線が消える」類の実装事故を構造的に避けられる。
> CodeMirror の `@codemirror/lint` は 1 つの diagnostic 集合を持つので、
> **同居させるには source を自分で束ねる必要がある** (実測では compiler 側 1 件のみ = 1 を返した)。
> **これは Monaco 側の明確な優位点**。

## 5. AI との共存 — Editor API の integration surface (Acceptance 7)

裁定 §12 の要求は「**AI がエディタ内部の非公開状態を直接壊さず、project model を経由して変更できる構造**」。
**両者ともその構造を持つことを実測した。**

| 要求 | Monaco (実測) | CodeMirror 6 (実測) |
|---|---|---|
| **model API / file model** | `monaco.editor.createModel(text, lang, Uri)` — URI がそのまま LSP の `textDocument.uri` | `EditorState` を path ごとに保持。`view.setState` で切替 |
| **multi-file 一括更新** | ✅ 2 ファイルを 1 回の呼び出しで編集。`include/sensor.h` と `src/network.cpp` の両方に反映 | ✅ 同上、同一結果 |
| **ranges** | `monaco.Range(startLine, startCol, endLine, endCol)` (1-based) | `doc.line(n).from + (col-1)` で offset に変換 |
| **undo / redo** | ✅ `model.pushEditOperations` は**モデル自身の undo stack に載る**。`model.undo()` で全ファイルを元のバイト長に復元 (419/391/402/315/306) | ✅ transaction が通常の history に載る (`@codemirror/commands` の `undo`) |
| **decorations (提案の可視化)** | ✅ `createDecorationsCollection` で行装飾を追加 (返り値 1) | `Decoration` / `StateField` で同等 (本 probe では未実行 = `NOT OBTAINED`) |
| **diff / proposed changes** | Monaco は `DiffEditor` を内蔵 | CodeMirror は `@codemirror/merge` が別パッケージ (本 probe では未導入 = `NOT OBTAINED`) |
| **selection / context 取得** | ✅ `aiGetContext()` が `currentFile` / `selection` / `selectedText` / `openFiles` / **diagnostics 件数 7** を返した | ✅ 同等 (`from`/`to` オフセット形式) |
| **diagnostics API** | ✅ `setModelMarkers` (owner 分離あり、§4) | ✅ `setDiagnostics` (owner 分離なし) |

**構造上の要点 (実測から言えること):**

- 🔴 **両者とも「AI がテキストを差し替える」経路が、エディタの公開状態遷移 API そのもの**である。
  Monaco は `pushEditOperations`、CodeMirror は `state.update({changes})`。
  **どちらも undo 履歴に載るので、AI の編集は人間が 1 操作で取り消せる。**
  「AI がエディタ内部を直接壊す」構造にはならない。
- 🔴 **LSP の `textDocument.uri` = エディタの file model の識別子**という 1 対 1 の対応が、
  AI・Compiler 診断・LSP 診断の 3 者を**同じ座標系**に乗せる。本 probe ではこの座標系だけで
  「AI が編集 → 該当ファイルを開く → 行に marker」が全部通った。

## 6. 測れていないこと (推測で埋めない)

| 項目 | 状態 |
|---|---|
| 10,000 行級 / 数十ファイル規模での挙動 | **NOT OBTAINED** (fixture は 100 行 / 5 ファイル) |
| project load / browser reload 後の再開時間 | **NOT OBTAINED** |
| CodeMirror の diff / merge UI (`@codemirror/merge`) | **NOT OBTAINED** (未導入) |
| Monaco の `editor.worker` を含めた実運用 bundle | **NOT OBTAINED** (本 probe の Monaco 値は**下限**) |
| 同時多接続時のエディタ側の劣化 | **NOT OBTAINED** |
| Safari / Firefox での動作 | **NOT OBTAINED** (裁定 §17 により成立条件外。ただし両者とも標準 API のみ使用) |
