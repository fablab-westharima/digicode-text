# 10_browser API + 第三者資料の配置 (Phase 4/5)

**調査日:** 2026-08-26 / **browser 節の型ラベル: secondary source のみ** (MDN 等の記載であり、**実機ブラウザで確認していない**)

---

## A. Browser API の対応状況

初期最優先は **Chrome / Edge (Chromium)**。Safari は初期優先せず、Firefox も最優先ではない (裁定 §20)。正式 matrix は Architecture / Acceptance で Human 裁定。

| API | DigiCode Text での用途 | Chrome / Edge | Firefox | Safari |
|---|---|---|---|---|
| **Web Serial** | **USB 書き込み (esptool-js) と Serial Monitor/Plotter の実体** | 89+ (desktop)。Chrome 148 beta で Android 対応 (2026-04) | **151+ で対応** (比較的新しい) | 表明なし |
| **Web Bluetooth** | BLE OTA (NimBLEOta) | 対応 | 非対応 (既定) | 非対応 |
| **WebUSB** | **donor では未使用** (§07 参照) | 対応 | 非対応 | 非対応 |
| **File System Access API** | 本保存 (実フォルダ) | 86+ | **非対応** (OPFS のみ) | **非対応** (OPFS のみ) |
| **OPFS** | autosave / 作業領域 | 86+ | 111+ | 15.2+ |
| **IndexedDB** | autosave / 設定 | 対応 | 対応 | 対応 |
| **SharedArrayBuffer** | **clangd WASM (経路 A) に必須** | **cross-origin isolation 必須** | 同上 | 同上 |

**含意:**

- 🟢 **Chromium 前提なら、書き込み・Serial・保存のすべてが成立する。** 初期方針と矛盾しない。
- 🟡 **Firefox は Web Serial が 151+ で入った**ため、**USB 書き込みだけなら将来的に届き得る**。ただし BLE OTA は非対応のまま。
- 🔴 **Safari は Web Serial も Web Bluetooth も無い** = **書き込み経路が 1 本も無い**。iPad / iPhone は「編集はできるが書き込めない」端末になる。教育現場の端末事情に直結するので、**support matrix には「編集のみ可」という第 3 の状態が要る可能性がある** (提案。確定は Human)。
- 🔴 **保存方式の選択がブラウザ方針と連動する**: File System Access API は Chromium のみ。**OPFS なら 3 ブラウザで動く**。企画書 §24 が両方を候補に挙げているのは妥当だが、**「実フォルダを正本にする」を選ぶと Chromium 専用が確定する**。
- 🔴 **clangd WASM (経路 A) を採ると cross-origin isolation が要り、AdSense と衝突する** (§09 §3)。**Editor 方式・収益モデル・保存方式の 3 つは独立に決められない。**

## B. 第三者資料 (FS 教材等) の配置案

**制約 (裁定 §22 + rule 15 実測):**

- public repo へ commit しない。
- 過去文書の `prompt/maintenance/local/sample/` は**確定ではない**。実測: rule 15 の許可カテゴリは **8 種** (`rules/<project>` / `docs` / `handover` / `bugs/{active,closed}` / `plans/{active,completed}` / `investigations` / `legacy`) で、**`sample/` は含まれない**。作成すれば `placement-scan.sh` が赤になる。
- 現在の digicode-text `.gitignore` は 4 行 (`.DS_Store` / `scheduled_tasks.lock` / `__pycache__/` / `*.pyc`) のみ。

**候補比較:**

| 案 | accidental commit 防止 | placement rule 整合 | backup | portability | Human が見つけやすい | cold start 後の位置復元 |
|---|---|---|---|---|---|---|
| **① repo 外の sibling ディレクトリ** (例: `~/github_project/digicode-text-private/`) | ◎ **物理的に repo の外**。git が存在を知らない | ◎ rule 15 の対象外 | ○ 別途 | ◎ repo を消しても残る | ○ 命名で分かる | △ **パスを 16.md に書く必要がある** (パス自体は公開して問題ない一般名) |
| ② repo 内 + `.gitignore` | ○ `.gitignore` 依存。**1 行消えれば混入する** | ✗ **rule 15 の許可カテゴリに無い** → placement-scan 赤 | ○ | ✗ repo と一緒に消える | ◎ | ◎ |
| ③ repo 内 + `.gitignore` + rule 15 にカテゴリを新設 | ○ 同上 | △ **テンプレート標準の変更**になる (local/README.md: 「フォルダの増減は user 承認を得てテンプレート側へ反映」) | ○ | ✗ | ◎ | ◎ |
| ④ ユーザのローカルデータ領域 (`~/Library/...` 等) | ◎ | ◎ 対象外 | △ | △ | ✗ 埋もれる | ✗ |

**推奨 (最終判断は Human):** **①**。理由は 3 つ — (a) 第三者教材の混入は `.gitignore` の 1 行に賭けるべきリスクではない、(b) rule 15 のカテゴリ増設という**テンプレート標準の変更を伴わない**、(c) 「repo に入れない」という裁定の文言に構造として一致する。
①の弱点である「cold start 後に位置が分からない」は、**16.md §1 にディレクトリ名を 1 行書けば解決する** (ディレクトリ名自体は秘密情報ではない)。

**②③ を採る場合の必須条件:** `.gitignore` への追記は**そのディレクトリを作る commit と同一 commit**で行う (rule 05)。後追いは事故の形。

## C. Human 確認が必要な項目 (裁定 §24)

| 項目 | なぜ私では検証できないか |
|---|---|
| Chrome / Edge での Web Serial 権限ダイアログとポート選択 | 実ブラウザ + 実機が要る |
| BLE OTA の実書き込み | 実機が要る |
| Safari / Firefox の実挙動 | 同上 (二次情報のみ) |
| clangd WASM デモの実ロード時間・体感 | ブラウザ実行が要る (spike 候補) |
| 第三者資料の最終配置 | 権限判断 |
