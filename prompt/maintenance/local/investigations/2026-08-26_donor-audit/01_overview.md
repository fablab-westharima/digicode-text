# 01_overview — donor 全体地図 (Phase 1)

**調査日:** 2026-08-26
**donor repository:** `~/github_project/DigiCode` (ローカル clone、READ ONLY)
**donor branch:** `main`
**donor commit SHA:** `bb35c3b8025610299bf952c2c45eda2196a07401`
**donor working tree:** clean (`git status --porcelain` = 0 行)
**調査方法:** `git -C <donor> ls-files` / `find` / `du` / `cat` — **読み取りのみ。donor への書き込み・commit・push・履歴操作は 0 件。**

> 以降の全調査事実はこの SHA に紐づく。SHA が変われば再測が要る。

---

## 1. donor の remote 構成

| remote | URL | 備考 |
|---|---|---|
| `origin` | `fablab-westharima/digicode` (SSH、ローカル host alias 経由) | DigiCode Classic 本体 |
| `digicode-compile-api` | `fablab-westharima/digicode-compile-api` (同上) | **Compile API は別リポジトリ** |

## 2. トップレベル構成 (tracked 699 ファイル)

| パス | tracked | 実体サイズ | 中身 | git 管理 |
|---|---|---|---|---|
| `variants/` | 570 | 671M | **フロントエンド本体**。`ota/frontend` (React+Vite+Blockly)、`usb/firmware`、`_reference/` | tracked |
| `esp32-blockly-backend/` | 92 | 355M | **auth / 課金 / class 管理 backend** (Cloudflare Worker + D1)。Blockly も AI も compile もここには無い | tracked |
| `compile-proxy-worker/` | 13 | 564K | Cloudflare Worker (compile 中継) | tracked |
| `docs/` | 9 | 104K | 公開ドキュメント | tracked (`docs/dev/deployment.md` のみ除外) |
| `scripts/` | 6 | 116K | 一部は private harness repo への symlink で **gitignore 済み** | 一部 tracked |
| `compile-api/` | **0** | 40M | **`node_modules` だけ。ソースはこの clone に存在しない** | 別リポジトリ |
| `prompt/` | **0** | 156M | donor の内部 governance / archive / logs / guides。2026-05-11 の history rewrite 以降 **意図的に非公開** | gitignore |
| `CLAUDE.md`, `AGENTS.md` | 0 | — | donor の内部 instruction | gitignore |

## 3. フロントエンド `variants/ota/frontend/src` (tracked 343 ファイル)

| ディレクトリ | 件数 | 対応クラスタ |
|---|---|---|
| `blocks/arduino` | 69 | Blockly generator 群 (Text 版で不要候補の中心) |
| `components/editor` | 46 | A: UI shell / editor 周辺 |
| `services/ai` | 27 | B: AI |
| `components/ui` | 21 | A: shadcn ベース UI プリミティブ |
| `components/auth` | 18 | Classic 固有 (auth) |
| `pages` | 17 | A |
| `services` | 14 | 横断 |
| `stores` | 13 | F: 状態・永続化 |
| `data` | 9 | C: registry 候補 |
| `components/settings` | 8 | F |
| `components/servo` | 8 | Classic 固有 (Servo 補助 UI) |
| `blocks/__tests__` | 8 | G: tests |
| `services/pid` | 6 | 再評価対象 (PID tuning) |
| `components/device` / `wifi` / `serial` / `pins` / `tuning` / `plan` / `classes` / `tutorial` / `common` | 各 1-5 | C / E / Classic 固有 |
| `i18n/locales` | 5 | 5 言語 |

その他: `public/` 143 ファイル (docs・`ai/block-catalog.json` を含む)、`scripts/` 60 ファイル、`patches/blockly+10.4.3.patch`。

## 4. Phase 1 時点の確認事実 (証拠付き)

- **F-1 Compile API のソースはこの clone に無い。** `compile-api/` は `node_modules` のみで `.git` も無く、tracked 0。`.gitignore` には別途 `arduino-compile-server/` が "Separate repository" として記載。→ **裁定 §11「Compile」クラスタは、この clone だけでは調査できない。**
  証拠: `bb35c3b` `/.gitignore:37`, `git ls-files compile-api` = 0
- **F-2 backend は Blockly / AI / compile を持たない。** `esp32-blockly-backend/src` は `routes/{auth,2fa,passkey,classes,subscriptions,webhooks,projects,submissions,feedback,admin,...}` と `services/payment/{stripe,polar,lemonSqueezy}`、D1 migration 29 本。名前に反して **account / 課金 / class の backend**。
  証拠: `git ls-files esp32-blockly-backend` (92 件)、`src/routes/` 一覧
- **F-3 フロントエンドは単一 React+Vite アプリ**で `variants/ota/frontend` に集中。Blockly は 10.4.3 + 独自パッチ 1 本。
  証拠: `variants/ota/frontend/package.json`, `patches/blockly+10.4.3.patch`
- **F-4 donor の内部 governance (`prompt/`, `CLAUDE.md`, `AGENTS.md`) は donor 側で既に gitignore 済み。** 本プロジェクトの「legacy governance を持ち込まない」確定事項と donor 側の非公開方針が同じ向きを向いている。
  証拠: `/.gitignore:44-58`

## 5. 未解決 (Phase 2 以降へ)

- **compile-api / arduino-compile-server の所在** — 別 clone が必要 (baton 化)
- `variants/usb` と `variants/ota` の関係 (別プロダクト構成なのか、書き込み経路違いの派生なのか)
- `scripts/` の symlink 群が指す private harness repo — **調査対象外**（governance であり、持ち込まない）
