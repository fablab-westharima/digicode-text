# 08_security / ops / tests — (Phase 2)

**donor:** `DigiCode@bb35c3b` + `digicode-compile-api@3376746`
**型ラベル: static のみ**

---

## 1. Secret / push protection の実態

| 機構 | 実装 | Text への転用 |
|---|---|---|
| `.gitignore` による内部文書の完全除外 | `prompt/` 全体・`CLAUDE.md`・`docs/dev/deployment.md`・harness symlink 群・`AGENTS.md` を除外。**2026-05-11 の history rewrite を伴う方針転換**として理由がコメントで明記されている | 🟢 **考え方は既に digicode-text にある**が、digicode-text は**逆の選択** (governance を公開追跡) をしている。**どちらが正しいかではなく、選択が違うことを認識しておく** |
| `.gitleaksignore` の **fingerprint 台帳** | commit:file:rule:line 形式で false positive を個別登録。**「false positive 判定は Claude 単独でしない (user 確認必須)」**と台帳の先頭に明記 | 🟢 **そのまま流用可能**。digicode-text の gitleaks gate に台帳運用を足せる |
| pre-commit hook | `.claude/hooks/pre-commit-gate.sh` (`.claude/` は gitignore) | 🟢 digicode-text に**同名の機構が既にある** (テンプレート由来) |
| CI | DigiCode 本体に `.github/` **は存在しない** (CI 無し)。`digicode-compile-api` に `docker-publish.yml` 1 本のみ (push to main → ghcr + Docker Hub へ image publish) | 🟡 **CI による secret scan は donor に無い**。Text で入れるなら新規 |

→ 🔴 **「gitleaks だけ見て安全と判断しない」(裁定 §22) に対する実測回答**: donor の防御は **① gitleaks ② fingerprint 台帳 ③ 内部文書を `.gitignore` で丸ごと除外 ④ history rewrite を実施した前例**の 4 層。**CI 側の防御は無い。** digicode-text は ③ を採らない方針なので、①②＋**内容規律**で代替している構造になる。

## 2. deployment / ops

- `scripts/deploy-frontend.sh` / `deploy-backend.sh` / `local-compile` / `audit-i18n.js` が donor に存在 (**未読** — 追加調査必要)。
- Cloudflare: frontend は Pages (`digicode-frontend.pages.dev` が CORS 許可 origin に存在)、backend と compile proxy は Workers (`wrangler.jsonc`)。compile 本体は自前サーバ + Cloudflare Tunnel、backup が Railway。
- compile-api の image は **ghcr.io と Docker Hub の両方**へ publish。Local Compiler は `docker-compose.local.yml` + 別途 `digicode-installer` (未読)。

## 3. tests / failure corpus / 再利用可能な QA 基盤

**通常テスト:** vitest (jsdom)。tracked のテストファイルは **77 件** (frontend `src/**/__tests__` + backend + proxy worker)。

**`scripts/probabilistic-debug/` — これが 1000+1000 の実体** (60 ファイル、`README.md` あり):

| Phase | 部品 | 内容 |
|---|---|---|
| 1 | `generate-cases.ts` + `lib/strategies/{singleton,edge,matrix,pair,template}.ts` | ケース生成。`--count 1000` の配分は **singleton 414 / edge 86 / matrix 100 / pair 200 / template 200** |
| 2 | `orchestrator.ts` + `lib/compile-client.ts` + `lib/result-store.ts` | **並列 worker pool**、`POST /api/compile`、retry、**timeout 180s**、`results.jsonl` |
| 3 | `analyze-failures.ts` + `lib/report-builder.ts` + `render-report.ts` | **エラーパターンでクラスタリング** → `failures.json` → Markdown レポート + 自動 baseline |
| 4 | 1000 ケース実行 + UAT | README 上は 🚧 |

- 生成物 (`probabilistic-debug-{cases,results,reports}/`) は **git 管理外**。
- `manifest.json` に **generator git SHA + catalog SHA-256** を記録 = 再現性の担保。
- README 記載の PIO baseline: 60 ケースで **passRate 58.3%** (2026-04-28 時点、**再現していない**)。

→ 🟢 **裁定 §23 が言う「継承すべき QA 資産」の中身が特定できた。** ケース生成戦略 (singleton/edge/matrix/pair/template) と **orchestrator / compile-client / result-store / analyze-failures / report-builder は生成器非依存**で、**Text でもほぼそのまま使える**。置き換わるのは「ケースが Blockly XML である」部分だけ (Text ではソースプロジェクト)。
→ 🟢 `experimental` board を **passRate の分母から外す**設計 (`boardStore.ts:63-70`) も、Text の acceptance 設計にそのまま持ち込める考え方。

## 4. Classic failure corpus の所在 (追加調査必要)

- 失敗クラスタの実データは `probabilistic-debug-results/` にあるが **git 管理外**でローカルにのみ存在。
- 障害の**原因分析の記録**は donor の `prompt/maintenance/` (44.md / 45.md / 51-56.md / BUG-059 等) にあるが、**そこは donor の内部 governance 領域**であり、digicode-text の確定事項が「持ち込まない」と定めた場所。
  → 🔴 **判断が要る**: failure corpus の *技術的中身* (dependency 衝突・board 差・include 問題 等) は裁定 §23 が「継承する」と明言した資産だが、その記録は governance 文書に埋まっている。**技術的知見の抽出と governance の持ち込みは別物**として扱う必要がある。**本セッションでは donor の `prompt/` を一切開いていない。** 扱いは Human 裁定候補。
- ただし**コード内コメントから既に相当量が回収できている**: Heltec placeholder による 16/20 board 汚染、MFRC522 同名クラスのリンカ衝突、ESP32Servo360 のスマートクォート、block 追加時の lib_deps 登録漏れ 4 件、RP2040 の lib_deps 非互換、pioarduino の LDF 既定挙動差、`hallRead()` の全 chip 削除。**これらは公開ソースのコメントから取れた** (本ファイル群に記録済み)。

## 5. verdict

| 対象 | verdict |
|---|---|
| `.gitleaksignore` fingerprint 台帳の運用 | **そのまま流用可能** |
| pre-commit gate | **既に digicode-text にある** (テンプレート由来) |
| 内部文書を `.gitignore` で丸ごと除外する方針 | **Text では不採用** (digicode-text は逆の選択を確定済み) |
| CI secret scan | **新規実装が必要** (donor に無い) |
| `docker-publish.yml` (image publish CI) | **改修流用** |
| probabilistic-debug の orchestrator / compile-client / result-store / analyzer / reporter | **そのまま流用可能** (生成器非依存) |
| ケース生成戦略 5 種 | **改修流用** (概念は流用、生成対象が変わる) |
| `experimental` を分母から外す設計 | **そのまま流用可能** |
| deploy スクリプト群 | **追加調査必要** (未読) |
| failure corpus の実データ | **追加調査必要** + **Human 裁定候補** (所在が donor の非公開 governance 領域) |

---

## 6. 追補 — 重複正本に対する build-time 監査スクリプト群 (🟢 重要資産)

`variants/ota/frontend/scripts/` に **audit 系 5 本**が存在する。これは §04 が指摘した「registry が複数箇所に手書きで散る」問題に対する **donor 自身の防御**であり、Text でも同じ問題を抱える以上、**考え方ごと流用する価値が高い**。

| script | 何を検査するか |
|---|---|
| `audit-data-consistency.ts` | canonical な JA データ源と i18n override の構造的整合 / XML サンプルが有効な catalog block しか参照しないこと / **全 block ファイルが probabilistic-debug の bootstrap に配線されていること (= headless 生成器とブラウザエディタが同じ block universe を見ること)** |
| `audit-i18n-block-coverage.ts` | `Blockly.Msg.X \|\| 'English fallback'` が非英語 UI で英語にフォールバックする回帰の検出 (2 モード) |
| `audit-ai-catalog.ts` | AI catalog の整合 |
| `audit-sample-structural.ts` | サンプルの build-time 構造監査 (BUG-086 由来) |
| `audit-ble-controller.ts` | BLE コントローラ定義の整合 |
| `build-unified-controller-bundle.ts` / `build-wifi-controller-bundle.ts` / `generate-ai-block-catalog.ts` | 生成器 (= 生成物の上流) |

→ 🟢 **「複数の正本が食い違っていないかを build 時に機械検査する」というパターンは ① そのまま流用可能。** digicode-text が registry を単一正本化しても、生成物と実装の間には必ず同型の問題が残る。

## 7. 追補 — deploy スクリプト

`scripts/deploy-frontend.sh` / `deploy-backend.sh` はいずれも **「未コミット変更がある状態でのデプロイを禁止する」ことが第一目的**と明記され、`--commit-dirty=true` を使った過去事例の再発防止であると書かれている (再発防止ルールの参照付き)。
→ 🟢 **考え方は ① 流用価値あり** (デプロイ前に作業ツリーの清浄性を機械的に強制する)。スクリプト本体は Cloudflare / wrangler 前提なので、Text の deploy 先が決まるまでは形にできない。
