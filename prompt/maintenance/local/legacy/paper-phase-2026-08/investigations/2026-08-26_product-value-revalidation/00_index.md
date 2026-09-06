# 00_index — DigiCode Text Product Value Revalidation

**PRIMARY_OBJECTIVE:** DigiCode Text の存在意義を 2026 年現在の AI 開発環境・既存 IDE・
企業/学校の MCU 環境構築問題を基準に再評価し、今後の設計判断の評価軸を明文化する。

**Session:** S005 / 2026-08-26
**Human GO:** 調査・比較・評価のみ。**production 実装 GO ではない**(Human 指示 §22 / §25)。
**Plan:** `local/plans/active/06_product-value-revalidation.md`

---

## この調査の性格

**これは決定ではなく材料である。** 製品方針を裁定するのは Human であり、本調査は
「証拠から見て何が言えて、何が言えないか」だけを出す。Human 指示 §18 の要求どおり、
**DigiCode Text を存続させる前提で結論を作っていない** — No-Go / 縮小 / Pivot も同じ強さで検討した。

## 読む順

| file | 何を持つか |
|---|---|
| `01_method-and-sources.md` | 調査方法・型ラベルの定義・一次情報の一覧・**やっていないこと** |
| `02_existing-environments-2026.md` | 比較対象 A / E とその他 2026 年の有力環境の実態(VS Code + PlatformIO/pioarduino + AI、Arduino IDE/CLI/Cloud、Codey、Wokwi、ESP Web Tools) |
| `03_offline-bundle-counterhypothesis.md` | 🔴 **反証仮説 B の本気の検証** — 既存 IDE を完全 offline bundle にすれば DigiCode Text は不要か。初回配布と**更新時**の両方 |
| `04_managed-environment-value.md` | 管理済み MCU 環境という価値仮説の評価。Board だけでなく Sensor/Device Library と dependency。AI との組み合わせ価値 |
| `05_web-and-desktop-value.md` | C(Web)/ D(Desktop)の価値評価と、両者に共通する価値の抽出 |
| `06_block-editor-revaluation.md` | Block Editor の現在価値と maintenance cost の再評価 |
| `07_user-segments.md` | 利用者別の有効性 — **誰に有効で、誰には不要か** |
| `08_conclusion-and-next.md` | 🔴 **Executive conclusion / Go・No-Go / 1 文定義 / 自前で作る部分 / risks / unknowns / next-objective candidates** |

## この調査が置かれている前提(16.md §3 の裁定 — 動かさない)

- AI = 主機能、LSP = 高度なコード編集支援(必須機能ではない)
- Web 版が主製品。Helper や LSP が無くても完成した製品として成立させる
- server-side LSP を Web 版の必須 backend にしない
- Monaco 第一候補 / 内部標準 `main.cpp`
- Desktop 版を正式に視野へ入れる(shared Frontend、実装は未着手)
- Text 専用 Compiler(Classic 本番と分離、donor の技術は再利用)
- この裁定を受けても production 実装へ自動的に進まない

**本調査はこれらを検証対象にはしていない。** 検証したのは
**「その方針で作る製品に、2026 年の環境に対する独自価値があるか」**である。

## 一行で(詳細は `08`)

**Go。ただし独自価値は Editor でも Web であることでもなく、
「検証済み MCU 環境を利用者に構築させないこと」と
「その同一の正本を Compiler と AI が共有すること」の 2 点に限られる。**
**そして最大の弱点は、その独自価値がそのまま最大の maintenance 負債であることである。**
