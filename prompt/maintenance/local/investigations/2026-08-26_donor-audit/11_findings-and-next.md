# 11_findings / risks / next-objective candidates

**PRIMARY_OBJECTIVE:** DigiCode Donor Inventory / Audit
**この文書の性格:** 現 objective を**超える**事項の置き場 (裁定 §0)。ここに書かれたものは **記録であって着手指示ではない**。

---

## 🔴 findings — 企画・裁定の前提に影響するもの

| # | finding | 影響 |
|---|---|---|
| F-1 | **Compile API の契約に Blockly 前提が埋まっている** (`{fragments:{includes,globals,setupCode,loopCode}}` を固定テンプレートへ正規表現注入)。任意 multi-file / full-source を受ける口が無い | 「Compiler 共用」は*同じサーバを指すだけ*では成立しない。Text 向け入力経路の**追加**が要る |
| F-2 | **`lib_deps` が全ビルド共通** (`lib_ldf_mode = chain`)。placeholder lib が **16/20 board の compile を汚染した実績**、同名クラスのリンカ衝突、`#error` の文字で全 ESP32 ビルドが落ちた実績あり | **「Text 側で Library を軽く足す」を現行構造に乗せると Classic 全ビルドが被弾する。** 裁定 §13 の「実質的な悪影響」に**該当する具体経路が実在** |
| F-3 | **RP2040 削除の真因は Compiler 側 (lib_deps グローバル) であって Blockly ではない** | 裁定 §5 の切り分けへの回答。**Text が Blockly を捨てても自動的には解決しない** |
| F-4 | **保存モデルが企画書の前提と食い違う。** Classic のプロジェクト正本は**サーバ D1 の `blockly_xml`、auth 必須**。autosave / IndexedDB / OPFS / FSA の実装は **0 件** | 企画書 §13.1「DigiCode と同じくローカル保存中心」は donor 実態と異なる。Storage は**ほぼ全面新規実装** |
| F-5 | **書き込みは WebUSB ではなく Web Serial** (esptool-js + `navigator.serial`) | browser support matrix の対象 API が変わる。Firefox 151+ が Web Serial 対応という事情も効く |
| F-6 | **`compile-proxy-worker` の `ALLOWED_ORIGINS` は 4 つにハードコード**され、digicode-text の origin を含まない | Text が同 Worker を通すには **Classic 本番 Worker の変更が必要** (現 objective では禁止) |
| F-7 | **clangd を WASM でブラウザ実行すると cross-origin isolation (COOP/COEP) が必須**で、**Google Publisher Tag は COEP 非対応** | **Editor 方式・収益モデル (AdSense)・保存方式は独立に決められない**。三者同時の architecture 判断が要る |
| F-8 | **Device → Library → include の対応データが機械可読な形で存在しない** (block ファイルのコメント / `definitions_` の文字列 / compile-api の lib_deps に三分割) | 企画書の Managed Imports 自動生成は**新規実装**。ただし block 69 ファイルから**抽出できる可能性**あり |
| F-9 | **Blockly 結合は 6 ファイルに局所化** (`blocks/**` 76 を除く) | 🟢 良い報せ。UI shell の大半が流用可能 |
| F-10 | **pioarduino は Classic で既に採用・統一済み** (tag `54.03.21`)。企画書 §21 の「未確定」は donor 側では決着している | Text の採否は別判断だが、**判断材料は既に揃っている** |
| F-11 | **Safari には Web Serial も Web Bluetooth も無い** = 書き込み経路が 1 本も無い | iPad 教室では「編集のみ可」という第 3 の状態が要る可能性 |
| F-12 | **Board 追加は最低 2 リポジトリ・8 ファイル**を触る (frontend / i18n 5 言語 / BoardSelector / compile-api)。しかも compile-api 側は **本番サーバ上で SSH 編集 + 再起動が正規手順** | 企画の「軽い Board 追加」の中身は、この重複を畳むこと |

## 🟡 risks

- **R-1** `projectLock` は**プロセス内**の直列キュー。複数プロセス / 複数コンテナ運用時の保護は未確認。Text を同居させると同時実行の前提が変わる。
- **R-2** `build_cache_dir` は image に焼込 (VOLUME でない) → **image 更新でキャッシュが消える**。Board / Library 追加頻度が上がると再 warmup コストが効く。
- **R-3** AI API key を **localStorage に平文保存**する設計を Text も継承するなら、同じ XSS リスクを継承する。
- **R-4** ブラウザから Anthropic API を直接叩く際の CORS / 専用ヘッダ要件が**未verify**。
- **R-5** 本監査は **static のみ**。実 build / 実 compile / ブラウザ表示 / 実機書き込みを 1 件も行っていない。「動くはず」で止まっている領域が広い。
- **R-6** failure corpus の記録が **donor の非公開 governance 領域**にある。技術的知見の抽出と legacy governance の持ち込みは別物として扱う必要がある (**本監査では donor の `prompt/` を一切開いていない**)。

## proposals (提案であって着手ではない)

- **P-1** Text 用 compile 経路を **additive な新 endpoint** として置けるか、`server.ts`/`compile.ts` の共有状態を最後まで追って判定する。ini 生成が関数化され cache key に lib 構成が含まれるため、**構造的な余地はある** (未検証)。
- **P-2** `.ino` を捨てて **`main.cpp` + 明示 include** を標準にすれば、`.ino` 前処理問題が消える。企画書 §32 の未確定項目はこの分岐そのもの。
- **P-3** Device→Library→include の初期データを **block 69 ファイル + `block-catalog.json` + `lib_deps` の突合で抽出**する。
- **P-4** 第三者資料は **repo 外の sibling ディレクトリ**へ。理由と候補比較は `10_...md` §B。
- **P-5** `.gitleaksignore` の fingerprint 台帳運用を digicode-text にも導入する。

## next-objective candidates (Human が選ぶ)

| # | 候補 | 前提 | 規模感 |
|---|---|---|---|
| N-1 | **Compiler 共用可否の判定 objective** — `server.ts`/`compile.ts` 完走 + isolated 環境での additive endpoint probe。Shared/Separate の**判断材料を出し切る**(決定は Human) | 現 objective の残 ⑤ を潰す | 中 |
| N-2 | **Editor / LSP technical spike** — clangd WASM の実サイズ・ロード時間・multi-file 対応を isolated で実測し、COOP/COEP × 広告の両立可否を詰める | F-7 が未解決だと architecture が決まらない | 中 |
| N-3 | **Architecture Decision objective** — Editor 方式 / 保存方式 / 収益モデル / Compiler Shared-Separate / `.ino` vs `main.cpp` を**まとめて**裁定する | N-1・N-2 の結果が要る。**単独では決められない (F-7)** | 大 |
| N-4 | **registry 単一正本化の設計 objective** — Board / Device / Library の正本を 1 つにする設計 (P-3 の抽出込み) | 企画の「軽い追加」の中身 | 中 |
| N-5 | **残 ⑤ の消化 objective** — installer / deploy スクリプト / class-server / `variants/usb` / ML30 | 小粒だが数が多い | 小〜中 |
| N-6 | **企画書の改訂** — §33 の文言、§31 の強度 3 層化、F-4 / F-5 の事実訂正 | Human 側の作業 | 小 |

## Human 確認が必要な項目 (裁定 §24)

- 実機書き込み (Web Serial / BLE OTA) の board 別確認
- Chrome / Edge の権限ダイアログ・ポート選択の実挙動
- Serial Monitor / Plotter の実機挙動
- clangd WASM デモの体感 (spike で代替可)
- 第三者資料の最終配置 (権限判断)
- failure corpus の扱い (governance 境界の裁定)
