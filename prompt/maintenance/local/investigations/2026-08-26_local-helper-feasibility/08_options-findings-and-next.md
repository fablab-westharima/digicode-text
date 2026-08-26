# 08_Architecture options · findings · risks · unknowns · Human 判断事項

**材料を並べる。決定はしない**(裁定 §18 / §20、16.md §3 の 2026-08-26 裁定「GO は明示された
PRIMARY_OBJECTIVE の範囲だけ」)。数値の出所は `01`〜`07`。

---

## 1. Architecture options

### Option L1 — 既定 = Local Helper、server-side LSP なし

```
Chrome/Edge (HTTPS, local-network-access 許可 1 回)
   ├── Monaco + 基本機能            ← Helper 無しでも全部動く
   └── ws://127.0.0.1 → Helper → esp-clangd → board pack
Cloud: Web 配信 + Text Compiler のみ
```

| | |
|---|---|
| **実測で裏付いたこと** | 全経路を実測(`04`)。定義 0.6 ms / 参照 3 箇所 / 補完 100 件 / **偽診断 0 件**(`05` §1) |
| **server コスト** | 🟢 **ゼロ** |
| **利用者の負担** | クリック 3 + 許可 1(署名済み macOS)〜 クリック 5〜6 + 許可 4(未署名 Windows) |
| **入れない人** | 🟢 基本 Editor・AI・compile・診断ジャンプは全部動く(実測) |
| **🔴 代償** | 4 プラットフォームのビルド・署名・notarization・鍵管理・board pack 配信が運営側に乗る |

### Option L2 — 既定 = server-side LSP、Local Helper は任意の高速化

| | |
|---|---|
| **利用者の負担** | 🟢 ゼロ |
| **🔴 代償** | **同時利用者 × ≈500 MiB**(実測、線形)。100 人同時で **≈50 GB / ¥61,600 / $504 の桁** |
| 濫用対策 | 🔴 匿名無料なので rate limit / quota / cleanup / セッション上限が必須 |
| 実装量 | 🔴 **両方作ることになる** |

### Option L3 — 既定 = LSP なし、Local Helper を入れた人だけ semantic

```
全員: Monaco + file tree + tabs + syntax + project 検索 + AI
      + Compiler 診断 → file/line jump      ← ここまでで製品として成立
Helper を入れた人だけ: 定義ジャンプ / 参照検索 / 高度補完 / workspace symbols
```

| | |
|---|---|
| **実測で裏付いたこと** | **`04` phase1 がまさにこの状態**。エディタ起動 921 ms、エラーポップアップ 0、compile 診断ジャンプ動作 |
| **server コスト** | 🟢 **ゼロ** |
| **実装量** | 🟢 **最小**。server-side LSP を作らない |
| **🔴 代償** | 「go to definition が無い IDE」を既定にすることの製品判断。**企画書 §5.2 の「人間が参照関係を追える」要求との距離は Human が測る** |

### Option L4 — 教室 LSP サーバ(裁定 §12-C)

| | |
|---|---|
| 構成 | L2 の構成を**教室の 1 台**に置く。受講者はブラウザだけ |
| **実測に照らした所見** | 50 人 = **≈25 GB** → **32 GB の PC 1 台**で足りる。**運営の月額ゼロ** |
| **🔴 代償** | 講師が当日立ち上げる · **1 台落ちたら全員止まる** · 教室 LAN 依存 |
| 状態 | ⚪ **本 spike では実測していない**(L2 の構成をそのまま LAN に置くだけなので成立自体は自明) |

### 直交する選択: Extension を挟むか

**挟まない(案 A)を実測で成立させた。** 案 B(Extension + Native Messaging)が解く問題は
「Local Network Access permission の回避」だが、**案 A ではそれが許可 1 回で済む**ため、
**本 spike の実測範囲では案 B を選ぶ積極的理由は見つからなかった**(`06` §2)。

## 2. Findings

| # | Finding | Sev | 型 |
|---|---|---|---|
| G-1 | 🔴 **Extension 無し・Helper 1 個で成立する。** HTTPS ページ(public address space)から `ws://127.0.0.1` の LSP が開き、Monaco から multi-file semantic navigation が全部動いた | 🔴 | real-fire |
| G-2 | 🔴 **代償は「HTTPS 配信」と「ブラウザ許可 1 回」の 2 点だけ。** 許可なしでは fetch も WebSocket も**ブラウザ側でブロックされ Helper に 1 バイトも届かない**(negative control 済み) | 🔴 | real-fire |
| G-3 | 🔴 **HTTP 配信では `local-network-access` が `denied` に固定され、回避手段がない。** DigiCode Text は HTTPS 必須 | 🔴 | real-fire |
| G-4 | **mixed content は障害ではない。** `https://` から `http://127.0.0.1` / `ws://127.0.0.1` は遮断されない。遮断していたのは Local Network Access permission | 🟡 | real-fire |
| G-5 | **これは Chrome 固有ではない。** WICG 仕様が存在し、chromestatus に **Firefox は "shipping LNA"** と記録。permission 前提の設計が長期的に正しい側 | 🟡 | primary source |
| G-6 | 🔴 **WebSocket に CORS は無い。Origin 検証は Helper が自分でやる以外にない。** 実測の真理値表: 攻撃者 origin → 403、誤 token → 401、正規 → OPENED | 🔴 | real-fire |
| G-7 | 🔴 **`no-cors` リクエストは Origin ヘッダ無しで Helper に届く。** 呼び出し側には opaque にしか見えないが、**サーバ側では実行されうる**。副作用のあるエンドポイントを GET にしてはならない | 🔴 | real-fire |
| G-8 | 🔴 **既存 donor Helper は `0.0.0.0` に bind している。** device finder としては設計意図がありうるが、**ソースコードを扱う LSP Helper で真似してはならない**。probe Helper は `127.0.0.1` のみで、LAN からの到達不能を実測 | 🔴 | primary source + real-fire |
| G-9 | 🔴 **donor に「ローカル HTTP API + Origin 許可リスト + CORS + 4 プラットフォーム配布 + 自動更新(minisign)」が production 稼働の完成品として存在する。** digicode-text Helper はゼロからの発明ではない | 🔴 | primary source |
| G-10 | 🔴 **donor には macOS Developer ID 署名も notarization も Windows Authenticode も無い**(リポジトリ全文検索で 0 件)。→ **Gatekeeper / SmartScreen の警告が導入手順に加わる** | 🔴 | primary source |
| G-11 | 🟡 **donor の PNA 実装(`Access-Control-Allow-Private-Network` ヘッダ)は 2026-08 の Chrome では不十分。** Chrome 142+ は permission モデル。**DigiCode Finder のデバイス検出も影響を受けている可能性がある**(未測定) | 🟡 | primary source + real-fire |
| G-12 | 🔴 **Helper 無しでも DigiCode Text の基本機能は壊れない。** エディタ起動 921 ms、model 5、project 検索 7 hit、編集可、**compile 診断 → file/line jump 動作**、**エラーポップアップ 0** | 🔴 | real-fire |
| G-13 | 🔴 **Helper が死んでもエディタは動き続け、ポップアップは 0。** 状態が `lost`→`absent` へ遷移し、**古い clangd の赤線を掃除**し、案内バナーへ戻る。semantic 要求は例外ではなく `{unavailable, reason}` を返す | 🔴 | real-fire |
| G-14 | **Helper 復活は利用者操作ゼロで 3.9 秒。** ブラウザリロード後の再発見は 20.3 ms | 🟢 | real-fire |
| G-15 | 🔴 **esp-clangd + フラグ除去 + include 指定で、ESP32 実プロジェクトの偽診断が 0 件になった。** 前 spike の残課題 F-15 / R-5 の決着 | 🔴 | real-fire |
| G-16 | 🔴 **`--query-driver` を捨てて `-isystem` 6 行に置き換えても 0 件を維持した** → **GCC バイナリ 91.4 MiB を同梱しなくてよい** | 🔴 | real-fire |
| G-17 | **`clangd-esp-*` の配布物は tar entry が 3 つ、バイナリのみ。clang の builtin ヘッダを含まない**(だから素だと `stdbool.h` が無い) | 🟡 | primary source |
| G-18 | **board 1 枚分の LSP 用ヘッダ集合は 64 MiB / 5,120 ファイル、圧縮すると gzip 9.2 MiB・xz 6.0 MiB。** 一方 ESP32 core 一式は **5.3 GB**。**LSP に要るものとコンパイルに要るものは桁が 2 つ違う** | 🔴 | real-fire |
| G-19 | **esp-clangd の配布サイズ: macOS ARM 10.5 MiB / macOS x64 12.1 MiB / Windows 13.5 MiB。** → **Helper + clangd + board 1 枚 ≒ 17〜20 MB の初回ダウンロード** | 🟡 | primary source + real-fire |
| G-20 | 🔴 **前 spike の 261 MiB/session は楽観側だった。ESP32 実プロジェクトでは ≈500〜520 MiB。** 差は clangd のビルドではなく **board(IDF ヘッダ量)** | 🔴 | real-fire(変数を切り分け済み) |
| G-21 | 🔴 **メモリは加算的。** 8 セッションで 4,176 MiB(1→8 の比 **7.94**)。**共有ページの恩恵は無い。アイドル CPU は 0.0 %** | 🔴 | real-fire |
| G-22 | 🔴 **idle timeout / on-demand / pool は「講座で全員が同時に編集する」場面には効かない。** 効くのは利用がまばらな一般公開の場合だけ | 🔴 | 実測からの帰結 |
| G-23 | **Helper クライアントは bundle をほぼ増やさない**(Monaco 単体 brotli 900,951 B → Helper 版 894,684 B) | 🟢 | real-fire |
| G-24 | **Native Messaging は `allowed_origins` にワイルドカードを許さず、extension ID を installer が知っている必要がある。** Chrome と Edge で ID が異なれば **両方の ID と両方の manifest 置き場**を扱うことになる | 🔴 | primary source |
| G-25 | **Native Messaging は native host → Chrome 方向に 1 MB のメッセージ上限がある。** 大規模プロジェクトの LSP 応答で問題になりうる | 🟡 | primary source |
| G-26 | **教室サーバ案(L4)は過小評価されやすい。** 50 人 = 25 GB = **32 GB の PC 1 台**、受講者はブラウザだけ、月額ゼロ | 🟡 | 実測からの帰結 |

## 3. Risks

| # | Risk | Sev |
|---|---|---|
| S-1 | 🔴 **署名しないと、初学者が「開発元を確認できない」で止まる。** これは技術ではなく心理の問題で、FS 講座では講師の時間を直接消費する | 🔴 |
| S-2 | 🔴 **会社 / 学校の管理 PC ではインストールできないことがある。** Local Helper 一本槍だと、その利用者は永久に高度解析を得られない | 🔴 |
| S-3 | 🔴 **Helper と board pack の version 整合が新しい設計問題になる**(H4 を採る場合)。ずれると「コンパイルは通るのに赤線」が出る | 🔴 |
| S-4 | 🔴 **利用者ライブラリ (`lib_deps`) を追加したときのヘッダ供給が未解決。** board pack だけでは足りない | 🔴 |
| S-5 | 🟡 **Local Network Access permission は仕様が動いている最中**(chromestatus に 142/145/147/154 の複数エントリ)。**将来 UI や条件が変わりうる** | 🟡 |
| S-6 | 🟡 **PC 側 RAM を ≈500 MiB 消費する。** 4 GB の教室 PC では厳しい | 🟡 |
| S-7 | 🟡 **自動起動が未設計。** 「再起動したら Helper が動いていない」は現実的な失敗モード | 🟡 |
| S-8 | 🟡 **server-side を選ぶと、匿名無料のまま濫用対策が製品要件に入り込む**(rate limit / quota / cleanup / セッション上限) | 🟡 |
| S-9 | 🟢 **Helper のセキュリティ欠陥は利用者の PC 上で起きる。** Origin 検証・token・loopback bind を外すと、ローカルのソースコードが露出しうる | 🔴 |

## 4. Remaining unknowns(推測で埋めない)

| 項目 | 状態 |
|---|---|
| **Chrome enterprise policy で Local Network 許可を一括付与できるか** | **NOT OBTAINED** — 🔴 **教室運用の可否に直結する最重要の未取得項目** |
| Windows / Linux 実機での全経路再現 | **NOT OBTAINED**(macOS x86_64 のみ) |
| 実 installer の作成・署名・notarization・実配布 | **NOT OBTAINED** |
| Apple Developer Program / Windows 証明書の実費用 | **NOT OBTAINED** |
| Edge の native messaging manifest 置き場 | **NOT OBTAINED** |
| Chrome Web Store の登録料(公式ページに金額の記載なし) | **NOT OBTAINED** |
| ESP8266 / RP2040 / AVR の board pack サイズ | **NOT OBTAINED**(ESP32 のみ実測) |
| RISC-V 系 ESP32-C/H/P で偽診断 0 件に到達するか | **NOT OBTAINED** |
| 大規模プロジェクト(数十ファイル / 数千行)でのメモリと応答 | **NOT OBTAINED** |
| ポートが drop される(拒否ではなく無応答)環境での探索時間 | **NOT OBTAINED** |
| 複数タブ / project 切替時の Helper 挙動 | **NOT OBTAINED** |
| Helper の version mismatch 時の挙動 | **NOT OBTAINED** |
| 自動起動(Tauri autostart plugin) | **NOT OBTAINED** |
| 実 100 人同時負荷 | **NOT OBTAINED**(8 並列までの線形性から外挿) |
| L4(教室サーバ)の実測 | **NOT OBTAINED** |
| Extension + Native Messaging 案の実装と実測 | **NOT OBTAINED**(要件のみ一次情報で整理) |
| macOS 自身のローカルネットワーク許可が loopback bind でも出るか | **NOT OBTAINED** |
| DigiCode Finder の実挙動が Chrome 142+ で影響を受けているか | **NOT OBTAINED**(donor-side の観察として報告のみ) |

## 5. 🔴 Human 判断事項

| # | 問い | 材料 |
|---|---|---|
| J-1 | **既定をどこに置くか — L1(Helper)/ L2(server)/ L3(LSP なし)/ L4(教室サーバ)** | §1。実測は L1 と L3 を強く支え、L2 のコストが線形であることを確定させた |
| J-2 | **「go to definition の無い既定」を製品として許容するか**(L3 の核心) | 企画書 §5.2 の要求水準との距離は Human が測る |
| J-3 | **署名・notarization に投資するか** | G-10 / S-1。**support cost と UX cost の大部分がこの一回の投資で消える** |
| J-4 | **Extension を挟むか** | `06` §2。実測範囲では挟む積極的理由が見つからなかった |
| J-5 | **board pack の配布方式(H1〜H4)** | `05` §3。**H4 が board 数に対して唯一スケールする**が、version 互換表という新要素を持ち込む |
| J-6 | **Text 側 Board registry を Helper の board pack の生成元にするか** | `05` §4。しないと「compile は通るのに赤線」が恒常化する |
| J-7 | **FS 講座の既定運用をどれにするか** | `07` §3。**L4(教室 1 台 32 GB)は受講者負担ゼロ・月額ゼロで、実測に照らすと過小評価されやすい** |
| J-8 | **DigiCode Finder 側の PNA 問題を donor 側の objective として開くか** | G-11。**本 repo は donor を変更しない** |

## 6. next-objective candidates — **menu であって queue ではない**

| # | 候補 | 開く条件 |
|---|---|---|
| M-1 | **Architecture Decision**(前 spike の H-1〜H-7 + 本 spike の J-1〜J-8) | 本 spike の受理 |
| M-2 | **Chrome / Edge enterprise policy 調査** — Local Network 許可の一括付与可否 | J-7 が教室運用に寄る場合。**§4 の最重要未取得** |
| M-3 | **Windows 実機での Helper 全経路再現** | L1 系が選ばれる場合 |
| M-4 | **署名 / notarization の実費用と実手順の調査** | J-3 |
| M-5 | **board pack 生成パイプライン**(Text Board registry → Compiler 構成 + Helper pack) | J-5 / J-6 |
| M-6 | **大規模プロジェクトでのスケール検証**(メモリ・応答・index) | 方式が絞られたあと |
| M-7 | **L4(教室サーバ)の実測** | J-7 |
| M-8 | **利用者ライブラリのヘッダ供給設計**(S-4) | Helper 方式が選ばれる場合 |
| M-9 | **Text Compiler architecture**(baton 21) — 本 spike と独立に開ける | Human が開く |

## 7. 前 spike に対して更新したこと

| 対象 | 更新 |
|---|---|
| 前 spike F-15 / R-5(Xtensa target 不一致で偽診断が残る) | 🔴 **解決した。esp-clangd + フラグ除去 + include 指定で 0 件**(G-15 / G-16) |
| 前 spike F-17(clangd ≈261 MiB/session) | 🔴 **ESP32 では ≈500〜520 MiB。ほぼ 2 倍**(G-20)。**server-side のコスト試算は倍にする必要がある** |
| 前 spike の「server-side LSP の弱点は常駐コスト」 | **その常駐コストが線形で、共有ページの恩恵が無いことを 8 並列で確認**(G-21) |
| 前 spike Option 2(hybrid / on-demand) | 🔴 **「講座で全員同時」には効かないことが分かった**(G-22)。一般公開向けには依然有効 |
| 前 spike「Editor は Monaco か CodeMirror か」 | Human の現方向は Monaco。**Helper クライアントは bundle をほぼ増やさない**ので、この選択に影響しない(G-23) |
| 16.md §1「Editor / LSP は donor 資産ゼロ」 | 🔴 **Editor は依然ゼロ。しかし Helper については donor 資産が大量にある**(G-9) |
