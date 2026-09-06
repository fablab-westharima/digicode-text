# 06_Block Editor の再評価

**Human 指示 §13 に対応。**

**前提(Human 指示が定めた境界):**
- Blockly を DigiCode Text へ戻すことは前提にしない。
- **DigiCode Classic は既存成果物として維持する。今回は Classic を廃止・改修する objective ではない。**

---

## 1. Human の現在認識

> Block Editor は入力手段としての役割が AI によってかなり低下した。
> 一方、Block 対応のための開発・QA 負担は依然非常に重い。

**判定: 🟢 支持する。ただし「役割が低下した」の範囲は利用者層で分かれる**(§4)。

## 2. Block 維持コストの定量(inherited real-fire / donor-audit)

| コスト要素 | 実測 |
|---|---|
| Blockly 依存ファイル | `blocks/**` に **76 ファイル**(block 定義 + generator)。UI shell 側で Blockly を直接触るのは **6 ファイルのみ** |
| Device / Sensor の「正本」 | **registry が存在せず、Blockly block そのものが実質の正本**(`blocks/arduino/` 11 カテゴリ 69 ファイル) |
| **Board を 1 枚追加する作業** | 🔴 **最低 2 リポジトリ・8 ファイル** — `boardStore.ts`(capability flag 5 個を全 board 分ミラー)/ `BoardSelector.tsx` / **i18n 5 言語** / 別リポジトリの `boards.ts` / 必要なら `blockBoardGuards.ts` / **本番サーバ上で SSH 編集 + コンテナ再起動** |
| Device→Library→include の対応 | 🔴 **3 箇所に分散し、どれも他から生成されていない**(ソースコメント / 生成器内の文字列定数 / グローバル `lib_deps`) |
| 同型事故 | 🔴 **「block を足したが `lib_deps` 登録を忘れた」が 4 件**、compile-api のコメントに記録 |
| 大量 compile regression | `probabilistic-debug` 60 ファイル。ケース生成 5 戦略、並列 worker、timeout 180 s、エラーパターンでクラスタリング |
| **AI 辞書** | `block-catalog.json` **379,375 B の生成物**。**block を変えるたびに再生成が要る** |
| i18n | `Blockly.Msg` の英語フォールバック回帰を検出する専用 audit スクリプトが存在するほど、i18n と block が絡んでいる |

🔴 **重要な観察(inferred、ただし根拠は上記実測):**
**AI の追加は Block の維持コストを下げていない。増やしている。**
AI が block を生成するには **block catalog という第 5 の派生物**が要り、
block を 1 つ変えるたびにそれを再生成し、整合を検査しなければならない
(donor には `audit-ai-catalog.ts` という専用の検査スクリプトが実在する)。

## 3. Board / Library 追加速度への影響

🔴 **ただし最大のボトルネックは Blockly ではない。**

- **RP2040 が削除された真因は Compiler 側のグローバル `lib_deps`** であり、Blockly ではない。
- placeholder ライブラリ 1 個が **16/20 board のビルドを汚染**したのも Compiler 側。
- `FastAccelStepper@^0.32` が解決不能になったのも依存管理側(baton 22)。

→ 🔴 **「Blockly を捨てれば Board / Library 追加が軽くなる」は半分しか正しくない。**
Blockly を捨てると **8 ファイル中の数ファイル**と block 定義・catalog 再生成が消えるが、
**グローバル `lib_deps` と 2 リポジトリ手書き重複が残る限り、本質的なボトルネックは残る。**

**この点は本 project の裁定と整合している** — S002 は「Text 専用 Compiler を持ち、
Board / Library / dependency 定義を Text 側で独立管理する」と裁定しており、
**その裁定こそが追加速度の本体**であって、Blockly を外したことではない。

## 4. Block UI が「今も」持つ価値(過小評価しない)

Human 指示 §18 の姿勢に従い、Block を切る結論に都合よく寄せない。

| Block が今も強い場面 | 理由 |
|---|---|
| **タイピングが障壁になる層**(小中学生、キーボード非習熟) | AI プロンプトも**文章入力**を要求する。ブロックは入力が**選択**で済む |
| **タブレット / キーボード無し環境** | 同上 |
| **構文エラーが構造的に起きない** | 初回体験での脱落を減らす。テキストでは AI が書いても、**利用者が触った瞬間**に壊せる |
| **プログラムの構造を見せる教材価値** | 「順次・分岐・反復」を視覚化する授業目的そのもの |
| **AI を使わせない/使えない教育方針** | 学校では AI 利用を制限する運用が現実に存在する。その場合 **Block の入力価値は低下していない** |

🔴 **したがって正確な結論は「Block は役割を終えた」ではない。**

> **Block の入力手段としての価値は、「テキストを書ける層」に対しては AI によって大きく低下した。
> 「テキストを書けない/書かせない層」に対しては低下していない。
> そして DigiCode Text の対象は前者である。**

→ 🟢 **これは「Classic は維持し、Text は Block を持たない」という現方針を支持する。**
2 製品が**別の層を担当している**という整理になり、どちらかが不要にはならない。

## 5. この節の一行

🟢 **DigiCode Text が Block を持たない判断は正しい** — 維持コストは重く(76 ファイル + catalog 再生成 +
i18n 5 言語 + 8 ファイル横断の board 追加)、AI がそのコストを増やす側に働いており、
Text の対象層では Block の入力価値が低下しているため。

🔴 **ただし「Blockly を捨てたから Board 追加が軽くなる」と考えてはならない。**
本体は Compiler / registry 側の構造であり、そこを直さなければ Text でも同じ壁に当たる。

🟢 **Classic を維持する判断も正しい** — Block の価値が残っている層が実在し、
Text はその層を担当しないため。**2 製品は競合ではなく分担である。**
