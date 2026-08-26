# 08_Executive conclusion / Go・No-Go / 1 文定義 / 作るべきもの / risks / unknowns / next

**Human 指示 §18 / §19 / §20 / §23 / §24 に対応。**
**これは材料であって決定ではない。** 製品方針の裁定は Human のものである。

---

## 1. Executive conclusion

2026 年の環境を基準に見ると、DigiCode Text の存在意義は**当初の企画より狭い**。

**消えた(あるいは元々無かった)存在意義:**

- 🔴 **「Web で使える Arduino エディタ」は独自価値ではない。** Arduino Cloud Editor が既にあり、
  **Codey Online は「AI が書き、クラウドでコンパイルし、Web Serial でブラウザから書き込む」を
  既に全部やっている**(`02` §5-1、製品サイト = primary source)。
- 🔴 **Editor の出来で勝つ余地は無い**(VS Code / `02` §1)。debugger も Git も無い。
- 🔴 **LSP は存在意義ではない**(裁定済み。本調査もそれを追認する)。

**残った存在意義は 2 つだけである:**

1. 🟢 **利用者 PC に対して要求する権限がゼロであること**(Web 版)。
   Arduino Cloud は書き込みに常駐 Agent を要求し(A-6)、Desktop も既存 IDE bundle も
   インストール権限を要求する。**権限ゼロで書き込みまで完結するのは Web 版だけ**である。
2. 🟢 **検証済み MCU 環境を単一正本で管理し、Compiler と AI が同じ正本を読むこと**。
   これは既存のどの選択肢も**保証として売っていない**(Codey は「プリインストール」と
   「エラーの自動修正」= 事後修復であり、事前制約でも保証でもない)。

**そして反証仮説 B(既存 IDE の完全 offline bundle)は DigiCode Text を不要にしない** — が、
不要にしない理由は**技術ではなく、配布の合法性と依存の推移閉包と更新**である(`03`)。
B が明らかにしたのはむしろ **DigiCode Text が本当に売っているものの定義**であった:

> **依存の推移閉包を閉じ続ける作業を、顧客の代わりに恒久的に引き受けること。**

🔴 **最大の弱点は、その独自価値がそのまま最大の負債であることである。**
「保証する」とは「保証し続ける」ことであり、**Classic が実際に失敗した種類の作業**である
(RP2040 削除 / placeholder が 16/20 board を汚染 / `lib_deps` 登録漏れ 4 件 /
`FastAccelStepper@^0.32` が現在解決不能)。

## 2. 🔴 Go / No-Go

> ### **Go。ただし「保証範囲を小さく明示する製品」としての Go であり、
> 「Web 版 Arduino エディタ」としての Go ではない。**

**Go の根拠:**

| # | 根拠 | 型 |
|---|---|---|
| 1 | 権限ゼロの PC で書き込みまで成立する選択肢が他に存在しない(Arduino Cloud は Agent 必須) | primary source |
| 2 | 「保証された環境」を売っている既存製品が見当たらない | primary source(不在の確認は弱い証拠 — §9) |
| 3 | 既存 IDE の offline bundle は**製品として配布できない**(VS Code 拡張の再配布不可 / AI は offline 不可) | primary source |
| 4 | offline bundle は更新時に package manager 問題が戻る(拡張・ライブラリ・AI・arduino-cli の default index) | primary source |
| 5 | Web 版が単体で成立することは実測済み(Helper / LSP 無しで起動 921 ms・診断ジャンプ動作) | inherited real-fire |
| 6 | 部品の多くが donor にある(AI 辞書生成パイプライン・validate-retry 骨格・QA orchestrator・Web Serial 書き込み・UI プリミティブ) | inherited |

**No-Go 側の主張も並べる(§18 の要求に従い、都合よく落とさない):**

| # | No-Go 論拠 | これに対する評価 |
|---|---|---|
| N-1 | Codey Online が体験としてほぼ同じものを既に出している | 🔴 **重い。**差は保証と正本管理と対象顧客で、**細い**。ただし本調査は Codey を実利用していない(`NOT OBTAINED`) |
| N-2 | 保証の維持は Classic が失敗した作業であり、体制が同じなら再び失敗する | 🔴 **最も重い。**組織的な判断であり、Human の領域 |
| N-3 | 最有効セグメント(企業イントラ)で AI が遮断されうる = 主機能が動かない | 🔴 重い。緩和手段(custom endpoint / Local LLM)は donor にあるが未設計 |
| N-4 | MicroPython 系へ逃げれば toolchain 問題自体が消える(既存解) | 🟡 教育現場では実在する選択。**C++ / Arduino エコシステムを選ぶ理由は Human 側の資産価値判断** |

🔴 **したがって Go は無条件ではない。** 次の 2 条件が満たされないなら、
**「縮小」または「Pivot」のほうが証拠に整合する**(条件の採否は Human の裁定):

- **条件 A:** 保証対象を**最初から小さく、明示的に**定義する。
  「Board × Library を広く揃える」は価値ではなく負債である(`04` §5)。
- **条件 B:** 企業イントラで AI がどう成立するかを設計に入れる(`04` §4-3 / §9)。

## 3. 🔴 DigiCode Text は何のための製品なのか(§19 — 1 文)

> ### **DigiCode Text は、検証済みのマイコン開発環境(Board・Toolchain・Library・依存関係)を利用者の PC に構築させずに提供し、その同じ正本の上でコンパイラと AI が一貫して動く開発環境である。**

**1 文で言えたので、`§19` の「独自価値がまだ弱い」finding には該当しない。**
ただし正直に付記する 🟡:
**この 1 文のうち「利用者の PC に構築させずに提供する」部分は既存製品と重なる**(Arduino Cloud / Codey)。
**独自なのは「検証済み」と「同じ正本」の 2 語である。** その 2 語が実際に守られなければ、
この 1 文は既存製品の説明文と区別できなくなる。

## 4. 最大の独自価値 / 最大の弱点

| | |
|---|---|
| **最大の独自価値** | 🟢 **利用者側が許可すべきネットワーク宛先を、際限なく増える registry / GitHub の集合から、ベンダ 1 ドメインへ畳めること。** 企業 IT 部門に対して「この 1 つを許可してください」と言える。既存 IDE bundle はこれが言えない — 明日新しいライブラリを使えば明日新しい宛先が増えるから |
| **最大の弱点** | 🔴 **独自価値と最大負債が同一物であること。** 保証は一度出せば終わりではなく、Board / Library / version が動くたびに再検証が要る。Classic はこれに失敗した実績がある |

## 5. 🔴 本調査で新たに見えた、まだ裁定にも baton にも無い論点

| # | 論点 | なぜ今出すか |
|---|---|---|
| **NEW-1** | **Desktop 版の価値は「Compiler がローカルかクラウドか」で二分され、両者は別製品である。** クラウド Compiler なら installer は小さいが **offline にはならない**。ローカル Compiler なら offline になるが **GB 級**(ESP32 core 一式 5.3 GB) | 16.md §3 の Desktop 裁定と baton 28 は両者を分けていない。分けずに設計へ入ると、どちらかに事故的に着地する |
| **NEW-2** | **AI = 主機能と「企業イントラが最有効セグメント」が衝突しうる。** package manager を遮断する環境は LLM API も遮断しうる | 裁定にも baton にも無い。donor に `custom` provider と Local LLM ヘルプがあるので**緩和は可能だが未設計** |
| **NEW-3** | **debugger の不在が未議論。** Classic は Blockly だったので概念が無かったが、Text は「通常のテキストコード」を掲げる | 熟練者ほど欠落として感じる。対象から外すなら明示的に外すべき |
| **NEW-4** | **Codey Online という直接競合が実在する**(AI + クラウドコンパイル + Web Serial 書き込み + ライブラリ同梱 + 部品カタログ、無料/€9.99) | 企画の前提に「同種の既存製品は無い」が含まれているなら、その前提は誤りである |
| **NEW-5** | **保証範囲の広さは価値ではなく負債である。** 「Classic の 1000+1000 は継承しない」は既に裁定済みだが、**では何件を保証するのかは未定義** | baton 2(互換性マトリクス)の実質的な中身 |
| **NEW-6** | 🟢 **baton 31(Chrome enterprise policy で Local Network 許可を一括付与できるか)は、文献レベルで解けた。** `LocalNetworkAccessAllowedForUrls` は Chrome / Edge 両方に実在し、レジストリ(`HKLM\SOFTWARE\Policies\{Google\Chrome,Microsoft\Edge}\`)で一括配布できる。**Firefox は release へ未投入のため当面不要** | baton 31 は「最重要の未取得項目」だった。**ただし実挙動は未verify**(primary source = ドキュメントのみ) |

## 6. 独自価値を実現するために「自前で作るべきもの」(§20)

| 対象 | 判定 | 理由 |
|---|---|---|
| **Board / Device / Library の単一正本 registry** | 🔴 **自前。これが製品そのもの** | donor は 4 系統が手書きで分散、Device→Library→include は機械可読でない |
| **compatibility / dependency / version の保証データ** | 🔴 **自前** | 既存にこれを売っている製品が無い(= 独自価値の実体) |
| **正本 → Compiler 構成 / AI 辞書 / (Desktop の) board pack の生成パイプライン** | 🔴 **自前** | 生成しなければ必ずずれる。「compile は通るのに赤線」が恒常化する |
| **AI へ環境正本を供給する層(dictionary + context + 事前制約)** | 🔴 **自前** | donor の辞書パイプラインは**構造だけ**流用可。中身は総入れ替え |
| **project-aware AI(multi-file context / diff / patch 適用)** | 🔴 **自前** | donor に前例が無い |
| **compile 保証の regression 運用**(何を保証したかの台帳) | 🟡 **自前(機構は donor 流用)** | orchestrator / analyzer は生成器非依存で流用可 |
| **Text Compiler の入力経路(full-source / multi-file)** | 🔴 **自前** | Classic の入力は `{fragments:{...}}` 固定テンプレート注入 |
| **プロジェクト保存 / autosave / crash recovery** | 🔴 **自前** | donor に実装が 0 件(Classic はサーバ D1 + auth が正本) |

## 7. OSS / donor / 既存サービスを使えばよいもの(§20 — 作らなくてよいもの)

| 対象 | 使うもの |
|---|---|
| **Editor** | 🟢 **Monaco**(裁定済み)。独自 Editor エンジンは作らない |
| **semantic 解析** | 🟢 **clangd / esp-clangd**。独自 LSP は作らない |
| **build orchestration** | 🟢 **PlatformIO / pioarduino**。独自ビルドシステムは作らない |
| **書き込み** | 🟢 **esptool-js + Web Serial**(donor に実装あり) |
| **AI provider 接続 / key 管理** | 🟢 **donor の provider 抽象(openai/anthropic/gemini/custom)+ localStorage 方式** |
| **generate → validate → retry の骨格** | 🟢 donor(検証器だけ差し替え) |
| **QA orchestrator / result store / failure analyzer / reporter** | 🟢 donor(生成器非依存) |
| **Desktop 殻 / 自動更新 / 4 プラットフォーム配布** | 🟢 **Tauri + donor Helper の packaging / updater 資産** |
| **UI プリミティブ / i18n の仕組み / BoardSelector / Serial UI / Compile 設定 UI** | 🟢 donor |
| **AI モデル** | 🟢 外部 provider。自前モデルは作らない |
| **シミュレータ** | 🟢 作らない(Wokwi 等が存在。競合ではなく別カテゴリ) |
| **package manager の UI** | 🔴 **作らない。隠すことが価値**(`03` §9) |
| **Blockly / block generator** | 🔴 **作らない**(`06`) |
| **debugger** | 🟡 **現時点では作らない**(対象外を明示すべき — NEW-3) |

## 8. Risks(運用 / maintenance burden を含む)

| # | risk | Sev |
|---|---|---|
| R-1 | 🔴 **保証の維持コストが恒久的に発生し、Board / Library を増やすほど二次関数的に増える。** Classic は同じ作業に失敗した実績がある | 🔴 |
| R-2 | 🔴 **AI が企業イントラで遮断されうる**(NEW-2)。最有効セグメントで主機能が失われる | 🔴 |
| R-3 | 🔴 **Desktop の二分未解決**(NEW-1)。設計に入る前に裁定しないと事故的に着地する | 🔴 |
| R-4 | 🔴 **直接競合 Codey Online の存在**(NEW-4)。差は保証と正本管理という**説明の要る差**であり、体験では区別されない | 🔴 |
| R-5 | 🔴 **利用者が管理外ライブラリを使いたくなった瞬間、保証の価値が消える。** ヘッダ供給も未解決(baton 32) | 🔴 |
| R-6 | 🟡 **Chromium 依存**。Safari は Web Serial / Web Bluetooth の両方が無く、書き込み経路が 1 本も無い | 🟡 |
| R-7 | 🟡 **Cloud Compiler の費用が利用者数に比例する可能性。**「基本無料」前提と衝突しうる。**1 コンパイルあたりの実コストは未測定** | 🟡 |
| R-8 | 🟡 **サードパーティ OSS のライセンスを採用時に読む義務**(baton 15)。offline pack として**再配布**するなら、読む義務はさらに強くなる | 🟡 |
| R-9 | 🟡 **Local Network Access の仕様が動いている最中**(Helper 方式を残す場合) | 🟡 |
| R-10 | 🟢 **AI が生成した「保証範囲内のコード」は prompt での制約に過ぎず、機械的な保証ではない。** 本当に保証するなら compile 検証が要り、費用と待ち時間が乗る | 🟡 |

## 9. Remaining unknowns(推測で埋めない)

| 項目 | 状態 |
|---|---|
| **Codey Online / Arduino Cloud Editor / Wokwi の実利用品質** | **NOT OBTAINED** — 製品サイトと公式ヘルプの記述のみ |
| **Arduino Cloud の無料プラン 25 コンパイル/日** | 🟡 **一次ページが 403 で直接取得できず、検索結果の引用に留まる。**再取得が要る |
| **実際の企業イントラで何が遮断されているか** | **NOT OBTAINED** — 本調査の企業論はすべて Human の実体験報告 + 公開情報からの推論 |
| **LLM API エンドポイントが企業環境で通るか**(R-2 の実測) | **NOT OBTAINED** |
| **Chrome / Edge の enterprise policy を実配布して Local Network 許可が付くこと** | **NOT OBTAINED**(ポリシーの存在と設定手順は primary source、実挙動は未verify) |
| **Cloud Compiler の 1 コンパイルあたり実コスト** | **NOT OBTAINED** |
| **ChromeOS / Chromebook での Web Serial 実挙動** | **NOT OBTAINED**(二次記事は対応と記述) |
| **保証対象を N 件に絞ったときの維持工数** | **NOT OBTAINED** — 組織的な見積もりであり Human 側 |
| **DigiCode Classic の利用実績 / 継続率 / 顧客の声** | **NOT OBTAINED** — 本 repo に存在しない |
| **AI 利用が制限された教育現場での成立性** | **未検討**(§07 で論点として提示のみ) |
| **MicroPython 系へ逃げる既存解との比較** | **未検討**(`02` §5-2 で存在を指摘したのみ) |
| **「保証を売っている既存製品が無い」の確認** | 🟡 **不在の証明は弱い。** 網羅探索はしていない(rule 04 §absence:主体が走らなければ不在は完璧に満たされる) |

## 10. Product recommendation(提案であって決定ではない)

1. **製品定義を §3 の 1 文へ置き換える。** 「Web 版 Arduino エディタ」という説明を捨てる。
2. **保証範囲を最初から小さく、明示的に。** 「Board N 枚 × Device M 種を実コンパイルで保証。
   それ以外は `experimental` として提供し保証しない」という形(`experimental` 機構は donor にある)。
3. **Desktop を 2 案に分けて裁定する**(NEW-1)。
4. **企業イントラでの AI 成立性を設計要件に入れる**(NEW-2)。
5. **Local Helper の正式採否は Desktop の形が決まるまで保留のまま**(baton 27 を追認)。
6. **debugger を対象外とするなら明示する**(NEW-3)。

## 11. next-objective candidates — **menu であって queue ではない**

| # | 候補 | 前提 | 規模 |
|---|---|---|---|
| V-1 | **Managed Environment Registry の設計 objective** — Board / Device / Library / dependency の単一正本スキーマと生成パイプライン(Compiler 構成 / AI 辞書 / board pack を 1 つの正本から出す) | 本調査の受理。**独自価値の実体はここ** | 大 |
| V-2 | **互換性 / 受け入れマトリクスの裁定 objective**(baton 2)— 「何件を保証するか」を決める | V-1 と対 | 中 |
| V-3 | **Architecture Decision objective** — Web / Desktop / Compiler / adapter 境界を裁定(baton 3 / 21 / 27 / 28 / 29 + NEW-1) | 本調査 + S002 + S003 | 大 |
| V-4 | **競合実査 objective** — Codey Online / Arduino Cloud Editor / Wokwi を実際に使い、差を実測する | R-4 が重いと判断される場合 | 小〜中 |
| V-5 | **企業 / 学校ネットワーク実態調査 objective** — 何が遮断され、AI API は通るか(R-2 / NEW-2) | 企業セグメントを主戦場と定める場合 | 中 |
| V-6 | **Cloud Compiler の費用モデル objective**(R-7) | 「基本無料」を維持する場合 | 小〜中 |
| V-7 | **AI project-aware 設計 objective** — multi-file context / diff 適用 / 事前制約 / compile 検証ループ | AI が主機能である以上いずれ必須 | 大 |
| V-8 | **企画書の改訂**(baton 17 + 本調査の NEW-1〜NEW-5) | Human 側の作業 | 小 |

---

## 12. Self-check(`judgment-mistakes-history.md`)

### 過去の失敗パターン照合

- **Pattern A(即断)**: 🟡 **一部該当しうる。** 「Codey が競合である」は**製品サイトの記述のみ**で、
  実利用していない。→ 対処: 結論では「体験としては同等**と主張されている**」と限定し、
  `NOT OBTAINED` に登録し、V-4 を候補に出した。**断定していない。**
- **Pattern B(スコープ自己確証)**: 🟡 **該当リスクあり。** 「反証仮説 B は成立しない」で
  終えると DigiCode Text に都合がよい。→ 対処: **B が技術的にはかなり成立すること**、
  **ESP-IDF が実際に offline installer を出荷していること**を先に書き、
  成立しない理由を**技術ではなく規約・依存閉包・更新の 3 点に限定**した。
- **Pattern C(サンプルの全体化)**: 🟡 **該当。** 競合調査は Codey / Arduino Cloud / Wokwi 等の
  少数であり、網羅探索ではない。→ 対処: 「保証を売る既存製品が無い」を**弱い証拠**と明記(§9)。
- **Pattern D(ログの頭/末尾だけ)**: ✅ 非該当(ログ判定を含む作業をしていない)。
- **case 22(founding use case 未達のまま defer)**: ✅ 非該当。本調査は acceptance 15 項目すべてに回答した。
- **case DT-2(器材欠陥の方向性バイアス)の裏返し**: 🟡 **本調査は「既存環境を悪く見せる」方向に
  バイアスしうる構造**にある(依頼者が自社製品の検討者であるため)。→ 対処: `02` を
  **DigiCode Text の弱点から書き始め**、debugger / Git / refactoring の不在を明示した。
- **case 16 / DT-1(ライセンス表記から結論を跳ばす)**: 🟡 **該当箇所あり。**
  VS Code Marketplace ToS を根拠に「offline bundle は配布できない」と述べている。
  → 対処: **「規約に反する」であって「法的に不可能」とは書いていない**。
  最終判断は権利者と法務のものであり、本調査は**製品判断のための材料**として提示している。

### 判断の型ラベル

- **evidence-based(primary source)**: arduino-cli の default index 無効化不可 / Arduino IDE 2.x に
  portable mode 無し / zip 依存が解決されない / `depends=` の git・zip 提案は却下 /
  PlatformIO の `file://`・`symlink://` は offline 動作 / Marketplace ToS / Copilot は air-gapped 不可 /
  ESP-IDF offline installer の存在 / Arduino Cloud Agent 必須 / Chrome enterprise policy の存在
- **inherited real-fire**: Helper 無しの Web 版成立 / ESP32 core 5.3 GB / board pack 64 MiB /
  clangd ≈500 MiB・線形 / Board 追加 2 リポジトリ 8 ファイル / lib_deps 事故 4 件 / Blockly 76 ファイル
- **secondary source**: Wokwi / ESP Web Tools / ViperIDE の存在、Arduino Cloud の 25 回/日
- **inferred(推論と明記)**: 企業イントラでの遮断範囲 / AI API も遮断されうること /
  顧客 IT 部門が推移閉包を維持できないこと / Codey に保証が無いこと(**不在の推論**)
- **NOT OBTAINED**: §9 の表(11 項目)

### 推論のまま進めてよい根拠

企業ネットワークの実態と AI API の到達性は**本調査で測れない**(実顧客環境が必要)。
→ **推論であることを明記し、R-2 として risk に登録し、V-5 を候補に出した。**
結論(Go)はこの推論に依存していない — **推論が外れても「権限ゼロで成立する唯一の選択肢」は残る。**
