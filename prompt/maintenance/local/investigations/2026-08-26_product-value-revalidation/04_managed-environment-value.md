# 04_管理済み MCU 環境という価値仮説 — Board / Device Library / dependency / AI

**Human 指示 §3 / §4 / §5 / §12 に対応。**

---

## 1. 仮説の再掲(Human)

> DigiCode Text は Web 版 Arduino Editor そのものに価値があるのではなく、
> **検証済み MCU 環境を管理・提供すること**に価値がある。
> さらに同じ管理情報を **Compiler と AI の両方が同じ正本として利用する**ことに価値がある。

**判定: 🟢 支持する。ただし条件付き**(条件は §5 と `08` §8)。

## 2. 「Board だけ」では足りないことの定量的な裏づけ

Human 指示 §3 は「Board package だけ offline 化すれば解決、のような狭い評価をするな」と定めた。
その正しさは**外部の一次情報と内部の実測の両方**から確認できる。

### 外部(primary source)

- **zip / git から入れた Arduino ライブラリの依存は解決されない**(A-4)。
- **`depends=` に git / zip を書く提案は却下済み**(A-3)。
- **PlatformIO の registry 依存はネットワークを要すると公式に明記**(P-1)。

→ **ライブラリを 1 つ管理下に置くとは、その推移閉包を管理下に置くことである。**

### 内部(inherited real-fire — donor-audit)

- **Device → Library → include の対応データが機械可読な形で存在しない。**
  HX711 の例では、必要ライブラリは**ソースコメント**、include は**生成器内の文字列定数**、
  実依存解決は**compile-api のグローバル `lib_deps`** と、3 箇所に分散し、どれも他から生成されていない。
- その結果 **「block を足したが lib_deps 登録を忘れた」事故が 4 件**記録されている。
- placeholder ライブラリ 1 個が **16/20 board のコンパイルを汚染**した実績。
- **RP2040 が削除された真因はグローバル `lib_deps`** であり、Blockly ではない。

🔴 **つまり「検証済み環境を管理する」という価値仮説は、
DigiCode が現在**できていない**ことを製品価値にするという宣言である。**
これは否定ではない — **できていないと分かっているからこそ、Text で構造を変える意味がある**。
ただし `08` §8 の risk として正面から扱う必要がある。

## 3. 管理対象の候補(Human 指示 §4)を「正本の形」で整理する

Human が挙げた管理対象候補を、**誰が消費するか**で並べ替えると設計の輪郭が出る
(**これは提案であって architecture の決定ではない** — 決定は baton 3 / 21 / 28 の対象)。

| 正本(候補) | Compiler が使う | AI が使う | Editor / LSP が使う | UI が使う |
|---|---|---|---|---|
| Board / FQBN / platform / framework / board version | ✅ ビルド構成 | ✅ 対象 MCU の制約 | ✅ board pack(ヘッダ) | ✅ 選択 UI |
| Board capability(WiFi / BLE / OTA / flash method) | ✅ | ✅ 不可能な提案を避ける | — | ✅ グレーアウト |
| Device / Sensor 一覧と対応 Board | — | ✅ **存在しない部品を提案しない** | — | ✅ カタログ |
| Device → Library の対応 | ✅ 依存注入 | ✅ **正しいライブラリ名** | ✅ ヘッダ供給 | ✅ |
| Library version / compatible version | ✅ | ✅ **API の世代を間違えない** | ✅ | ✅ |
| dependency(推移閉包) | ✅ | 🟡 | ✅ | — |
| samples | 🟡 regression 入力 | ✅ **few-shot** | — | ✅ |
| compile 結果 / failure corpus | ✅ regression | ✅ **エラー修復の知識** | — | 🟡 |

🟢 **この表が示す構造:同じ正本を 4 系統が読む。**
donor では **4 系統がバラバラの手書き**で、**生成されているのは AI 辞書だけ**だった
(`donor-audit/04` — frontend UI / compiler / AI dictionary / Blockly generator)。

🔴 **したがって「単一正本 + 生成」は、Text の独自価値の実装そのものである。**
これは新機能ではなく、**Classic が抱えた事故の再発防止機構**であり、
かつ **AI に正しい制約を与えるための唯一の供給源**でもある。

## 4. AI + 管理済み環境の価値(Human 指示 §5)

### 4-1. 一般的な AI に頼んだときの失敗モード

Human が挙げた 5 つ — 存在しないライブラリ / 未インストール / version 不一致 /
選択 Board 非対応 / deprecated API — は、**LLM の一般的な失敗モードとして妥当**である
(inferred。本調査で実測はしていない)。

### 4-2. donor に既にあるもの / 無いもの(inherited、donor-audit `03_ai`)

| 要素 | donor の状態 |
|---|---|
| provider 抽象(openai / anthropic / gemini / **custom**) | 🟢 実装済み。**流用可能** |
| API key を利用者が持ちブラウザに保存 | 🟢 実装済み(サービス側が AI 利用料を負担しない設計) |
| **辞書を生成 → 実行時 fetch → system prompt へ整形**するパイプライン | 🟢 実装済み(`block-catalog.json` 379,375 B は生成物)。**構造ごと流用可能。中身が Text 用辞書に入れ替わるだけ** |
| **generate → 機械検証 → 失敗なら文脈付きで再生成(最大 3 回)** | 🟢 実装済み。**骨格は流用可能** |
| 検証器 | 🔴 Blockly XML 専用。**Text では compile dry-run が対応物**(提案) |
| **multi-file context / diff / patch 適用** | 🔴 **donor に存在しない。新規実装** |
| **compile error → 修正ループ** | 🔴 経路を特定できていない |

🟢 **「AI が管理済み環境の範囲で生成する」を作るための部品は、
辞書生成パイプラインと validate-retry 骨格という形で donor に既にある。**
足りないのは **辞書の中身(= §3 の正本)** と **multi-file 対応**である。

### 4-3. 🔴 この組み合わせの価値と、その正直な限界

**価値(🟢):**
「保証された環境の範囲で生成する」は、**事後修復(コンパイルエラーを AI が直す)より構造的に強い**。
Codey が主張しているのは事後修復であり(`02` §5-1)、
**事前制約 — 存在しない部品・非対応 Board・version 不一致を生成前に排除する — は差別化になりうる。**

**限界(🔴、正直に書く):**

1. **制約は prompt で与える限り「守られる保証」ではない。** LLM は指示に反する出力をしうる。
   → 本当に保証するなら **生成後に機械検証(コンパイル / registry 照合)を通す**必要がある。
   donor の validate-retry 骨格がその位置に来るが、**compile を毎回回すと費用と待ち時間が乗る**。
2. **保証の範囲は「管理している Board × Library」に限られる。** 利用者が管理外のライブラリを
   使いたくなった瞬間、この価値は消える(`08` §8 の risk、baton 32 と同根)。
3. 🔴 **AI 自体はネットワーク必須である。** 企業イントラで package manager が遮断される環境は、
   **`api.openai.com` / `api.anthropic.com` も同様に遮断されうる。**
   → **「AI = 主機能」と「企業イントラが最有効セグメント」は衝突しうる。**
   donor の provider 抽象に **`custom` endpoint** があり、Local LLM のヘルプページも存在するため
   **緩和手段は既にある**が、**これは設計上明示的に扱うべき論点であり、まだ扱われていない。**
   → `08` §8 risk / §9 unknown に登録した。

## 5. 「入っています」だけでは不足(Human 指示 §12)— 保証水準の定義

Human の指摘どおり、**プリインストールと保証は別物**である。
保証を名乗るために必要な最小限を、Classic の実績から逆算すると:

| 要素 | 必要性の根拠(inherited real-fire) |
|---|---|
| **Board × Library の組み合わせを実コンパイルする** | Classic の思想。「動くはず」ではなく「実際に動かして確認する」 |
| **代表サンプルを持つ** | 単体コンパイルが通ってもサンプルが動かない事例が block レベルで存在 |
| **regression として繰り返す** | placeholder 1 個が 16/20 board を汚染した事故が「1 回通った」では防げない |
| **failure corpus を持つ** | リンカ衝突・スマートクォート・`#error` 混入など、**症状から原因へ戻れる知識が必要** |
| **保証範囲を明示する** | `experimental` フラグで「使えるが保証しない」を表現する precedent が donor にある |

🟢 **そして QA 機構は donor から流用できる**(donor-audit `08`):
`probabilistic-debug` のケース生成 5 戦略(singleton / edge / matrix / pair / template)と
**orchestrator / compile-client / result-store / analyze-failures / report-builder は生成器非依存**で、
置き換わるのは「ケースが Blockly XML である」部分だけ。
`experimental` を passRate の分母から外す設計も、そのまま acceptance 設計へ持ち込める。

🔴 **ただし Classic の 1000+1000 件そのものは継承しない**(裁定済み)。
**保証範囲は「小さく、明示的に」始めるべきである** — その理由は `08` §8 で述べる。

## 6. この節の一行

🟢 **「検証済み MCU 環境を単一正本で管理し、Compiler・AI・Editor・UI がすべてそれを読む」は、
DigiCode Text の独自価値として成立する。** 部品(辞書生成・validate-retry・QA orchestrator)は donor にあり、
足りないのは**正本そのもの**と **multi-file AI** である。

🔴 **ただしその価値は「保証を出し続ける」という恒久的な約束であり、
Classic が実際に失敗した種類の作業である。保証範囲の広さは価値ではなく、負債である。**
