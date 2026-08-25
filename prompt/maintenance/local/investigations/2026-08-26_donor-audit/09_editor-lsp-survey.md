# 09_editor / LSP / Web IDE — OSS landscape 調査 (Phase 4)

**調査日:** 2026-08-26 / **調査方法:** Web 検索 + 各プロジェクトの公開ページ取得。**動かしていない** → 型ラベル: **secondary source のみ**。数値・保守状況は出典元の記載であり、私が再現したものではない。
**原則 (裁定 §19):** 既存 OSS で解決済みのものを再発明しない。**採用は決めない** (Architecture Decision 送り)。

---

## 1. donor 側の利用可能資産

DigiCode Classic は **Blockly 10.4.3 + 独自パッチ 1 本**で、**テキストエディタ資産を持たない**。`CodePreview.tsx` は生成コードの表示のみ。
→ **Editor は donor からの流用元がゼロ。** ここは最初から OSS 選定になる。

## 2. エディタ本体の候補

| 候補 | License | 規模 / 依存 | 所見 |
|---|---|---|---|
| **Monaco Editor** | MIT | 非圧縮 **約 5-10MB** (出典記載) | VS Code のエンジン。LSP エコシステムとの統合が最も厚い。10 万行級の性能が要るなら本命 |
| **CodeMirror 6** | MIT | コア **約 300KB** + 機能をモジュール追加 | 軽量・モジュール式。LSP はコミュニティ製パッケージ経由で、Monaco より初期配線が要る |
| **Eclipse Theia** | EPL-2.0 または GPLv2+classpath exception | IDE **フレームワーク丸ごと** | 最新安定 **1.70 (2026-04-16)**。Monaco を内包。Electron / ブラウザ両対応。**「部品として組み込む」より「Theia の上に載る」形になる** |
| **OpenVSCode Server / code-server** | code-server は MIT | **サーバ常駐が前提** | ユーザごとにサーバ側セッションが要る。DigiCode Text の「auth なし・無料・広告収益」モデルとコスト構造が合わない可能性が高い |

**所見 (推奨ではない):** 「DigiCode の UI shell を保ち、Blockly canvas をエディタに差し替える」という donor 実測に照らすと、**部品として差し込める Monaco / CodeMirror が構造的に噛み合う**。Theia / OpenVSCode Server は器ごと置き換える選択で、donor UI の流用 (§06 で「そのまま流用可能」と判定した資産) を捨てることになる。

## 3. 🔴 C/C++ の意味解析 — ここが最大の分岐点

要求のうち **go to definition / find references / symbol search / autocomplete** は、シンタックスハイライトと違い **C++ の意味解析器**が要る。選択肢は 3 つで、コスト構造が桁で違う。

### 経路 A: clangd を WASM でブラウザ内実行

- 参照実装: **`guyutongxue/clangd-in-browser`** — **MIT**、Monaco + LSP client port の例つき、デモ公開あり。
- 🔴 **決定的な制約: cross-origin isolation (COOP `same-origin` + COEP `require-corp`) が必須。** clangd がマルチスレッドで **SharedArrayBuffer** を要求するため。
- 🔴 **これは収益モデルと衝突する。** Google Publisher Tag は **COEP を使うページを現状サポートしない** (Google 公式ドキュメントの記載)。COOP/COEP は YouTube 埋め込み・Stripe Checkout・Google Sign-In も壊し得る。
  → **「clangd を WASM でブラウザ内実行する」と「AdSense を出す」は、同一ドキュメントでは両立しない可能性が高い。**
  → 回避の方向性は存在する (広告をエディタと別ドキュメント/別オリジンに逃がす、`Document-Isolation-Policy` の動向を追う 等) が、**いずれも architecture 判断であり、ここでは確定しない。**
- WASM サイズ・multi-file / `compile_commands.json` の扱いは**公開ページに記載がなく未確認**。

### 経路 B: サーバ側 LSP

- **`arduino/arduino-language-server`** — **AGPL-3.0** (digicode-text と同一ライセンス、整合性は良い)。**clangd を土台に `.ino` を扱う**、コミット 553、ただし **main は stable ではないと明記**、リリース pin 推奨。
- 依存: **arduino-cli と clangd のバイナリが別途必要**。FQBN を渡して board ごとの設定に追従する。**ネイティブバイナリ専用でブラウザ版は無い。**
- 🟡 **DigiCode の compile 基盤は PlatformIO であって arduino-cli ではない** (compile-api 実測)。採るなら **arduino-cli を追加依存として持ち込む**ことになる。
- コスト構造: **ユーザ 1 人ごとに常駐プロセス**。「auth なし・無料」モデルでは濫用耐性と単価が問題になる。

### 経路 C: 意味解析を持たない (構文ベース近似)

- Monaco / CodeMirror 単体 + tree-sitter 等でハイライトと粗い補完のみ。**go to definition / find references は諦めるか近似**。
- 企画書 §5.2 が「単に複数ファイルを保存できるだけでは不十分、人間が参照関係を追えること」と明記しているため、**要求水準を満たさない可能性が高い**。

## 4. `.ino` の扱い

`.ino` は正しい C++ ではない (関数の暗黙前方宣言、`Arduino.h` の暗黙 include 等)。したがってどの経路でも **前処理が要る**。

- 経路 B は **arduino-language-server がまさにその前処理を持つ** (build ディレクトリに前処理済みスケッチのコピーを置き、clangd はそこを見る)。**この問題を解決済みの実装が存在する。**
- 経路 A は前処理を自前で用意する必要がある。
- 🟢 **回避策**: DigiCode Text が `.ino` を捨てて **`main.cpp` + 明示 include** を標準にすれば、この問題は消える。企画書 §32 が「`.ino` / `main.cpp` の標準」を未確定としているのは、**まさにこの分岐**。donor 側は `src/main.ino` を書いている (`projectStore.ts:70-75`) が、PlatformIO は `framework = arduino` 下で `.ino` を受け付けているだけで、`.cpp` でも動く。

## 5. license 上の注意 (裁定 §21、採用は未決)

| 候補 | license | AGPL-3.0 プロジェクトへの組込み注意 |
|---|---|---|
| Monaco Editor | MIT | 問題なし。notice 保持義務 |
| CodeMirror 6 | MIT | 同上 |
| clangd-in-browser | MIT | 同上。ただし **clangd 本体は Apache-2.0 with LLVM exception** — 再配布時の notice 義務を要確認 (**未確認**) |
| Eclipse Theia | EPL-2.0 / GPLv2+CE | **EPL-2.0 と AGPL-3.0 の組み合わせは要精査。** 採用検討時に本文を読む必要がある (**未実施**) |
| arduino-language-server | **AGPL-3.0** | 同一ライセンスで整合。ただし **arduino-cli 自体のライセンス**は別途確認が要る (**未確認**) |
| code-server | MIT | 同上 |

**いずれも license 本文を読んでいない。** 裁定 §21 が「名称や慣例だけで判断しない」と定めているため、**採用判断の時点で本文確認が必要**。ここに書いた license 名は**二次情報**である。

## 6. 未確認 / 次に必要なこと

- clangd WASM の **実サイズ・初回ロード時間・multi-file / `compile_commands.json` 対応**。→ 判断に効くので **repo 外 isolated 環境での小規模 spike が正当化される** (裁定 §19 が許可する範囲)。
- COOP/COEP と広告の両立可否の**具体的な回避構成**。
- CodeMirror 6 の LSP パッケージの実際の保守状況。
- Theia を「部品」として使えるのか、器ごとかの実地確認。

## 7. verdict (候補の位置づけのみ。採用は決めない)

| 対象 | 位置づけ |
|---|---|
| Monaco / CodeMirror | **新規採用候補** (donor に該当資産なし) |
| clangd-in-browser (経路 A) | **新規採用候補**。ただし **COOP/COEP × 広告** の衝突を先に裁定する必要あり |
| arduino-language-server (経路 B) | **新規採用候補**。`.ino` 前処理という難所を解決済み。ただし arduino-cli 依存とサーバ常駐コスト |
| Theia / OpenVSCode Server | **不採用候補** (donor UI 資産の流用と両立しにくい、常駐コスト) |
| 意味解析なし (経路 C) | **不採用候補** (企画の要求水準に届かない) |
