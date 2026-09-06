# 02_2026 年の既存環境 — 比較対象 A / E とその他

**Human 指示 §2 / §16 / §21 に対応。**
**方針: 既存環境を過小評価しない**(§8 の前提)。ここは DigiCode Text の弱点を先に並べる節である。

---

## 1. 🔴 まず認めるべきこと — Editor 機能で既存環境に勝つ余地は無い

| 機能 | VS Code + PlatformIO/pioarduino + AI Agent | DigiCode Text(想定) |
|---|---|---|
| Editor 本体 | VS Code(Monaco の完全上位) | Monaco(第一候補) |
| semantic 解析 | clangd / C/C++ 拡張がローカルで常時 | 🔴 **Web 版は既定で無し**(裁定済み)。Helper か Desktop でのみ |
| multi-file / project / 検索 | 完全 | 実装予定 |
| refactoring / rename | 完全 | 🔴 無し(LSP 依存) |
| Git 統合 | 完全 | 🔴 無し |
| debugger / JTAG | PlatformIO Debug が対応 | 🔴 **無し。検討もされていない** |
| terminal / 任意ツール | 完全 | 🔴 無し |
| AI Agent(ファイル横断編集・実行) | Copilot / Claude Code / Cline 等が成熟 | 実装予定(donor に multi-file AI の前例なし) |
| 拡張エコシステム | 数万 | 無し |

🔴 **結論(inferred):この列で勝負する製品なら作る意味は無い。**
Human 指示 §2 / §15 の「独自 Editor として VS Code に勝つことを存在意義にしない」は、
証拠に照らして**正しい判断である**。本調査はこの前提を追認する。

さらに 🔴 **debugger の不在は本 project でまだ明示的に議論されていない**。
Classic は Blockly なので debugger 概念が無かったが、Text は「通常のテキストコードを書く」製品であり、
**熟練者ほど debugger の不在を欠落として感じる**。`08` §8 の risk に登録した。

## 2. しかし「Editor が強い」ことと「使い始められる」ことは別問題

既存環境の強さは**環境が構築できた後の話**である。構築の前に置かれている壁を分解すると:

| 壁 | 実体 | primary source |
|---|---|---|
| ① アプリ本体の導入 | VS Code のインストール(管理者権限 / 配布ポリシー) | — |
| ② 拡張の導入 | PlatformIO IDE 拡張 · C/C++ · AI Agent 拡張。Marketplace への到達が要る | B-3 |
| ③ platform / core の取得 | PlatformIO は registry と `dl.registry.*.platformio.org` へ、pioarduino は GitHub Releases へ | P-7 / P-8 |
| ④ toolchain の取得 | ③ に紐づく数百 MB〜GB。ESP32 core 一式で **5.3 GB**(inherited real-fire) | `local-helper-feasibility/05` |
| ⑤ **Sensor / Device Library の取得** | Library Manager / PlatformIO Registry / GitHub | A-3 / A-4 |
| ⑥ **その依存ライブラリの取得** | ⑤ が宣言する `depends=` / `dependencies` の推移閉包 | A-3 / A-4 |
| ⑦ AI の疎通 | Copilot 等は**ネットワーク必須**。air-gapped では動作しない | B-4 |
| ⑧ 以後の更新 | ②〜⑦ が**恒久的に繰り返される** | — |

🔴 **①②③④は「一度きり」だが、⑤⑥⑦⑧は「作るたび・使うたび」に発生する。**
Human 指示 §3 が「Board package だけ offline 化すれば解決、のような狭い評価をするな」と釘を刺したのは
この構造を指しており、**証拠はその指摘を支持する**(`03` §3 で定量化)。

## 3. 比較対象 A の総合評価

| 軸 | 評価 |
|---|---|
| 到達できたときの能力 | 🟢 **圧倒的**。DigiCode Text が並ぶ見込みは無いし、並ぶ必要も無い |
| 到達できる利用者 | 自分の PC を自由にでき、ネットワークが自由な開発者 |
| 到達できない利用者 | 管理権限のない PC · 通信が絞られたイントラ · 一時利用 PC · 環境構築で脱落する初学者 |
| 維持責任 | **利用者自身**。壊れたら利用者が直す |

## 4. 比較対象 E — Arduino IDE / CLI / Cloud

### E-1. Arduino IDE 2.x

🔴 **portable mode が無い**(A-2、issue #122 が 2020 年から open)。
インストールと依存物が PC 内の複数箇所へ分散するため、
**「USB メモリに丸ごと入れて配る」「検証済みの一式をそのまま複製する」ができない。**
→ **教室・研修で「同じ環境を全員に配る」用途に、Arduino IDE 2.x は構造的に向いていない。**
(1.x にはあった。2.x で失われたまま 6 年以上)

### E-2. Arduino CLI

🔴 **`downloads.arduino.cc` の default index を無効化できない**(A-1、issue #3073)。
必要な core が全て導入済みでも、追加 index を設定していても、`file://` の index を使っていても、
**外向き通信を試み続ける。** 提案されている `--no-default-index` 相当は未実装。
→ **完全 offline 環境で「静かに」動かすことが公式には保証されていない。**

🔴 **zip / git から入れたライブラリの依存は解決されない**(A-4)。
そして **`depends=` に git URL / zip path を書けるようにする提案は却下されている**(A-3、`conclusion: declined`)。
→ **ベンダリングした瞬間、依存の推移閉包を人間が管理する責任が発生する。これは仕様であって不具合ではない。**

### E-3. Arduino Cloud Editor

DigiCode Text Web と最も直接に競合する既存サービス。

| 軸 | 実態 | source |
|---|---|---|
| 導入 | ブラウザで開くだけ | — |
| **書き込み** | 🔴 **Arduino Cloud Agent(常駐バイナリ)のインストールが必要。** ブラウザ単独では書き込めない | A-6 |
| コンパイル上限 | 🔴 **無料プランは 1 日 25 回**(有料で無制限) | A-5(要再取得) |
| 対応ボード | Arduino 公式ボード中心 | — |
| ライブラリ | Cloud 側で管理 | — |

🟢 **DigiCode Text Web の差別化点が 2 つ、既存製品の仕様として実在する:**
① **書き込みにローカルインストールが要らない**(Web Serial 直結、donor で実装実績あり)。
② **コンパイル回数に日次上限を置かない設計を選べる**(選ぶかは事業判断。無料前提なら費用と直結 → `08` §8)。

🔴 ただし ① は**「Agent を入れられない PC」でだけ効く差**である。
入れられる PC では Arduino Cloud も同じ体験を提供する。**この差は利用者セグメントに強く依存する**(`07`)。

## 5. その他 2026 年の有力環境

### 5-1. 🔴 Codey Online — 価値仮説が最も近い既存製品

**これは本調査で見つかった最も重い事実である。**(C-1、製品サイト = primary source、**実利用は未verify**)

Codey は既に次を**同時に**提供している:

- 自然言語 → コード生成(AI)
- **クラウドコンパイル**
- **ブラウザ(Chrome / Edge)から Web Serial で直接書き込み**(AVR / ESP32 WROOM / S3 / C3、auto-reset)
- **主要ライブラリのプリインストール**(Adafruit GFX / FastLED / ArduinoJson / WiFiManager / ESP-NOW / NeoPixel / Servo / Wire / SPI 他)
- **部品カタログ**(pinout / 配線図 / 動くサンプル)
- Serial monitor、ESP32/ESP8266 の OTA、コンパイルエラーの自動修正
- **ローカルインストール不要**
- 無料 = AI メッセージ 1 日 5 件 / Pro €9.99 月

→ 🔴 **「ブラウザだけで、AI が書いて、クラウドでコンパイルして、そのまま書き込む」は
2026 年時点で既に存在する。DigiCode Text の企画のうち、この部分は独自ではない。**

**では何が残るか。** Codey の公開情報から読み取れない/主張されていないのは:

| DigiCode Text の仮説 | Codey で確認できるか |
|---|---|
| 「プリインストール」ではなく **Board × Library の互換性を実コンパイルで保証している** | ❌ 主張されていない(=無いとは言えないが、**保証を売りにしていない**) |
| Board / Device / Library / version / dependency の**正本を公開して管理する** | ❌ 確認できない |
| **AI が「保証された環境の範囲内で」生成する**(存在しない/非対応/version 不一致を構造的に避ける) | ❌ 「エラーを自動修正する」= 事後修復であって事前制約ではない |
| 企業・学校の**環境構築問題**を明示的な対象にしている | ❌ 個人メイカー向けの体裁 |
| Desktop / offline 形態 | ❌ 無い |
| 日本語・国内教育現場・FabLab 等の文脈 | ❌ |

🟡 **したがって差は「機能の有無」ではなく「保証と正本管理と対象顧客」にある。**
これは**細い差**であり、`08` の Go 判断はこの細さを直視したうえで下している。

### 5-2. Wokwi / ESP Web Tools / ViperIDE 等(secondary source)

- **Wokwi** — ブラウザ上のシミュレータ。実機不要で試せる点は DigiCode Text に無い強み。ただし**実機開発の代替ではない**。
- **ESP Web Tools** — ブラウザからの書き込みのみ。WLED / ESPHome / Tasmota 等が採用。**編集もコンパイルもしない**ので競合ではなく、Web Serial 書き込みが枯れた技術であることの傍証。
- **ViperIDE / CircuitPython Online Editor** — MicroPython / CircuitPython 系。**コンパイルが不要な言語**なので、そもそも本製品が解く問題(toolchain 管理)を持たない。
  → 🟡 **これは重要な示唆である**: 「環境構築問題を回避する」だけなら **MicroPython へ逃げる**という既存解が存在し、教育現場では実際に採られている。DigiCode Text は「**C++ / Arduino エコシステムのまま**環境問題を解く」ことを選んでいる。その選択の根拠(既存 Arduino 資産・ライブラリ・性能・DigiCode Classic との連続性)は Human の領域だが、**比較対象として MicroPython 系を無視しない**ほうがよい。

### 5-3. 参考 — devcontainer / Codespaces 系

「管理済み環境をコンテナで配る」は一般的な解だが、**MCU では書き込みが USB 経由**であり、
リモートコンテナからの書き込みは追加の仕掛けを要する。加えて企業イントラでは
Codespaces / コンテナレジストリ自体が遮断対象になりうる。**本調査では深掘りしていない**(`NOT OBTAINED`)。

## 6. この節の一行

🔴 **既存環境は「環境が構築できた人」に対しては DigiCode Text より強い。
そして「ブラウザだけで AI とクラウドコンパイル」という体験も、2026 年には既に存在する。
DigiCode Text の差は、機能ではなく「環境そのものを検証済みの形で管理して渡すこと」にしか無い。**
