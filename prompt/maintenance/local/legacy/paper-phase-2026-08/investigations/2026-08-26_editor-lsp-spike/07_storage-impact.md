# 07_Editor / LSP 方式が Storage に課す制約

**裁定 §16 / Acceptance 11 に対応。Storage architecture は決めない** — 方式ごとに
「どの Storage model が自然か」を finding として並べるところまで。

**前提 (S001 実測、変わっていない):** DigiCode Classic の保存モデルはサーバ側 D1 (`blockly_xml`)、
auth ゲート付き、autosave なし。IndexedDB / OPFS / File System Access API は**一切使っていない**。
→ **Text 側の Storage はほぼ新規設計**であって、donor からの移植ではない。

---

## 1. 方式が Storage に何を要求するか (本 spike の実測から導いた要求)

意味解析器は「ファイルの集合」をどこかで見なければならない。**その「どこか」が方式ごとに違う**、
というのが Storage への影響の正体である。

| 方式 | 意味解析器が読む場所 | Storage への要求 |
|---|---|---|
| **A. browser-side clangd WASM** | **Emscripten の in-memory FS** (`clangd.FS.writeFile`、`02` §3 実読) | ブラウザ側が **常に全ファイルの真の中身を持つ**。永続化はブラウザ内で完結できる |
| **B. server-side LSP** | **サーバのファイルシステム** (`compile_commands.json` の `file` は実パス、`01` §4 実測) | ブラウザの中身を**サーバへ送って実体化**する必要がある。同期の方向と粒度を設計しなければならない |
| **C. hybrid** | 構文はブラウザ / semantic はサーバ | B と同じ同期が要るが、**サーバが落ちていても編集は続けられる**ので、ブラウザ側が正本になる |

## 2. 方式ごとに自然な Storage model

### A. browser-side WASM

| Storage | 相性 | 根拠 |
|---|---|---|
| **OPFS (Origin Private File System)** | 🟢 **最も自然** | clangd の in-memory FS と 1 対 1 で写せる。同期 API がワーカー内で使える。S001 実測どおり **Chrome / Edge / Firefox / Safari すべてで使える** |
| IndexedDB | 🟢 良い | ファイル単位の blob として持てる。OPFS より汎用だがパス操作は自前 |
| File System Access API (実フォルダ) | 🟡 Chromium のみ (S001 実測)。`showDirectoryPicker` でユーザの実フォルダを開ければ「ローカルの本物の project」になるが、**baton 13 の browser matrix を Chromium に固定する** |
| project archive (zip 出力入力) | 🟢 どの方式でも成立。**移行・バックアップ手段として独立に要る** |
| サーバ保存 | 🟡 任意。**A では必須ではない** — オフラインで完結できるのが A の性質 |

**A の帰結:** 🔴 **A を選ぶと「ログイン不要・オフラインでも動く・サーバにコードを送らない」が自然な既定になる。**
プライバシー上の主張が強く、サーバ費用も編集中はゼロ。**ただし cross-origin isolation が要る** (`04`)。

### B. server-side LSP

| Storage | 相性 | 根拠 |
|---|---|---|
| サーバ側 workspace ディレクトリ | 🔴 **必須**。clangd はサーバの実ファイルを読む | S002 実測で Text workspace は **≈23 MB**、donor に cleanup 機構は無い |
| OPFS / IndexedDB (ブラウザ側キャッシュ) | 🟢 併用が自然。**サーバ workspace は揮発、ブラウザ側が正本**にするのが安全 | セッション終了で workspace を消せる = cleanup が単純 |
| File System Access API | 🟡 使えるが、実フォルダ ↔ サーバ workspace の**二重同期**になる |
| project archive | 🟢 同上 |

**B の帰結:** 🔴 **匿名・無料の前提だと「誰のものか分からない workspace がサーバに溜まる」問題が直撃する。**
S002 が測った **≈23 MB / workspace** と、本 spike が測った **clangd 1 セッション ≈261 MiB RSS** (`03` §5)
が同時に効く。**cleanup policy と rate limit が Storage 設計の一部になる** (baton 21 が挙げている項目そのもの)。

### C. hybrid

- ブラウザ側 (OPFS / IndexedDB) が**正本**、サーバへは semantic 解析が要るときだけ送る。
- 🟢 **A の「ブラウザが正本」と B の「重い解析はサーバ」を両取りできる。**
- 🔴 ただし「いつ送るか」が新しい設計問題になる (保存のたび / 明示操作のとき / コンパイル時のみ)。

## 3. どの方式でも共通して必要になるもの (方式選択と独立)

本 spike の実測から、**Editor 方式に関係なく要る**と分かったもの:

1. **ファイル単位ではなく project 単位の同一性。** LSP の `textDocument.uri` も compile diagnostics の
   `file` も **project root からの相対パス**を前提にしている (`06` §4 で実測)。
   Storage が「ファイルの寄せ集め」だと、この座標系が壊れる。
2. **autosave / クラッシュ復帰。** Classic には無い (S001)。**新規設計**。
3. **project archive の入出力。** 外部の Arduino サンプルを取り込む導線 (`05` §4) と、
   ユーザがデータを持ち出す導線の両方に要る。
4. **`compile_commands.json` (または `.clangd`) を project の一部として持つか、生成物として持つか。**
   本 spike では `pio run -t compiledb` が **0.84 s で 86 entries** を生成した (`01` §4)。
   **生成物として扱うのが自然** — board を変えたら中身が変わるため、保存すると陳腐化する。

## 4. 🔴 三者が一つの決定であること (baton 19) の現状

S001 は「editor 方式 / storage 方式 / 収益モデルは 3 つで 1 つの決定」と書いた。
**本 spike の実測はその結びつきを 1 本ほどいた。**

| 結びつき | S001 時点 | 本 spike 後 |
|---|---|---|
| browser WASM ⇄ 広告 | 「COEP が要るので AdSense と両立しない可能性が高い」 | **DIP で両立する** (`04` §3 実測)。**ただし Chromium 前提になる** |
| browser WASM ⇄ storage | (未整理) | **OPFS が自然。サーバ保存は任意** (§2 A) |
| server LSP ⇄ 広告 | (未整理) | **無関係。** 隔離が不要なので広告に一切の制約がない |
| server LSP ⇄ storage | (未整理) | **サーバ workspace が必須**になり、cleanup / rate limit / 匿名利用が Storage 設計に入り込む (§2 B) |

**残る結びつきは「browser WASM を選ぶなら Chromium 前提を製品仕様に固定する」の 1 本**であり、
これは収益モデルではなく **browser matrix (baton 13) の決定**である。
