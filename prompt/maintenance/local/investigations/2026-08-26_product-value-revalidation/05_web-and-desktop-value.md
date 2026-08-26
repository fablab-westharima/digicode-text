# 05_Web 版 / Desktop 版の価値評価(比較対象 C / D)

**Human 指示 §6 / §7 / §11 に対応。**

---

## 1. Web 版(C)の価値

### 1-1. 最大の強みは「利用者 PC に何も入れない」

**inherited real-fire で裏づけのある事実:**

- **Helper も LSP も無い状態で、Monaco 起動 921 ms・model 5・project 検索 7 hit・
  compile 診断 → file/line ジャンプ動作・エラーポップアップ 0**(`local-helper-feasibility/04` phase1)。
  → 🟢 **「Web 版だけで完成した製品になる」という裁定は、実測に裏づけられている。**
- 書き込みは donor が **Web Serial(esptool-js + `navigator.serial`)**で実装済み
  (`donor-audit/07`。WebUSB ではない)。

**外部との比較で立つ差(primary source):**

| 比較先 | Web 版の差 |
|---|---|
| **Arduino Cloud Editor** | 🟢 **書き込みに常駐 Agent のインストールが要らない**(Arduino は Cloud Agent 必須 / A-6)。🟢 コンパイル日次上限を置かない設計を選べる(Arduino 無料は 1 日 25 回 / A-5) |
| **VS Code + PlatformIO** | 🟢 **導入・toolchain・ライブラリ・依存が一切要らない** |
| **Codey Online** | 🟡 **体験としては同等。**差は保証と正本管理と対象顧客(`02` §5-1) |

### 1-2. 🔴 Web 版が特に強い場面と、その理由の言語化

Human 指示 §6 が挙げた 6 セグメントに対する評価は `07` が持つ。ここでは**構造的な理由**だけを書く:

> **Web 版の本質的な強みは「インストール不要」ではなく、
> 「利用者 PC に対して要求する権限がゼロであること」である。**

- インストール不要 = Arduino Cloud も Codey も同じ(書き込みは Agent が要るが)
- 🔴 **管理者権限が無くても成立する** = ここが分岐点。Desktop も既存 IDE も成立しない
- 🔴 **一時利用 PC で痕跡を残さず終われる** = ワークショップ・貸出 PC・学校の共有端末

### 1-3. 🔴 Web 版の制約(正直に)

| 制約 | 根拠 |
|---|---|
| **Chromium 必須**(Chrome / Edge) | Safari は **Web Serial も Web Bluetooth も無い**(inherited)。iPad 教室では「編集のみ」という第 3 の状態が要る(baton 13) |
| **HTTPS 必須** | Local Network Access が HTTP では `denied` 固定(inherited real-fire) |
| **コンパイルに通信が要る** | offline では成立しない。**「通信が絞られている」と「通信が無い」を区別する必要がある**(`03` §9) |
| **無料前提だとコンパイル費用が利用者数に比例する** | 🔴 **1 コンパイルあたりの実コストは `NOT OBTAINED`。** LSP と違い bursty だが、**費用構造は未評価**(`08` §9) |
| **debugger が無い** | `02` §1 |

## 2. Desktop 版(D)の価値

### 2-1. Human の仮説の判定

> Desktop 版の価値は「インストール不要」ではなく、**最初に一度 installer を導入できるなら、
> その installer へ検証済み Board / Toolchain / Library 環境をまとめて持たせられること**である。

**判定: 🟢 支持する。** 実例として **ESP-IDF 公式 offline installer が存在する**(B-5、`03` §2)。
「一括 installer で MCU 環境を配る」は既にベンダが出荷している形であり、空想ではない。

### 2-2. 🔴 しかし本調査で新たに見えた緊張 — Desktop の価値は Compiler の置き場所に完全に依存する

**この論点は 16.md §3 の Desktop 裁定にも baton 28 にも明示されていない。**

| Desktop の構成 | installer サイズ | 企業イントラでの価値 |
|---|---|---|
| **Desktop + Cloud Compiler** | 🟢 小さい(Editor + clangd 10.5–13.5 MiB + board pack 6 MiB/枚) | 🟡 **コンパイルのたびに通信が要る。** ただし宛先は **1 ドメイン**で済む |
| **Desktop + Local Compiler** | 🔴 **GB 級。** ESP32 core 一式だけで **5.3 GB**(inherited real-fire) | 🟢 **完全 offline で成立する** |

🔴 **つまり:**
- 「installer を多少大きくしても検証済み環境をまとめて渡す」という Desktop の価値主張が
  **「offline でコンパイルできる」を意味するなら、installer は GB 級になる**。
- baton 28 の「installer を無制限に肥大化させることも目的ではない」と**同じ文の中で両立しない**。

**したがって Desktop の価値は 2 つに分解して裁定される必要がある**(Human 判断事項、`08` §5):

1. **「LSP 用の環境を持たせる」Desktop** → 小さい(board 1 枚 6 MiB xz)。コンパイルは Cloud。
   → 得られるもの: **高度な semantic 解析**。企業 offline 対応は**得られない**。
2. **「コンパイル環境ごと持たせる」Desktop** → GB 級。
   → 得られるもの: **完全 offline**。代償: 配布サイズ・更新サイズ・board 追加のたびの再配布。

🔴 **1 と 2 は「同じ Desktop 版」ではない。混同したまま設計に入ると、
"Desktop を作ったのに企業の offline 要求を満たさない" か
"5 GB の installer を配る" のどちらかに着地する。**

### 2-3. Desktop 版が Web 版より優れる点(1 の構成でも成立するもの)

- 🟢 **高度 LSP を標準搭載できる**(裁定済み方向)。Web 版の Helper が要らなくなる
- 🟢 **ネイティブファイルシステム**(ブラウザ storage の制約から解放)
- 🟢 **ネイティブシリアル**(Chromium 依存が消える → Safari/Firefox ユーザにも届く)
- 🟢 **Local Network Access permission が不要**(そもそもブラウザを介さない)

🔴 **裏返すと、Desktop 版が成立すると Local Helper の存在理由が薄くなる。**
これは baton 27 が既に指摘していることであり、**本調査はそれを追認する**。
Helper は「Web 版利用者のうち、インストールできて、かつ高度解析が要る人」という
**二重に絞られた集合**のためだけの中間製品になる。

## 3. Web と Desktop に共通する価値(Human 指示 §11)

> **共通価値 = Package Manager をユーザーに触らせないこと。**

**判定: 🟢 支持する。** ただし `03` §9 の言い直しを推奨する:

> **利用者側が許可しなければならないネットワーク宛先を、
> 際限なく増える registry / GitHub の集合から、ベンダ 1 ドメインへ畳むこと。**

| | Web | Desktop | 既存 IDE offline bundle |
|---|---|---|---|
| 利用者 PC に package manager が存在するか | 🟢 存在しない | 🟢 見えない(bundle / pack) | 🔴 存在する |
| 許可すべき宛先の数 | 🟢 **1**(+ AI provider) | 🟢 **1**(+ AI provider) | 🔴 **列挙不能・増え続ける** |
| 更新時に package manager が戻るか | 🟢 戻らない | 🟢 戻らない | 🔴 **戻る**(`03` §5) |
| 管理者権限が要るか | 🟢 不要 | 🔴 **必要** | 🔴 必要 |
| offline で成立するか | 🔴 不可 | 🟡 **構成 2 なら可**(§2-2) | 🟡 可(ただし §5 の更新問題) |

🔴 **この表の第 4 行が Web 版を主製品とする最強の根拠である。**
Desktop も既存 IDE bundle も **installer を実行できる権限**を要求する。
**Web 版だけが、権限ゼロの PC で成立する。**

## 4. この節の一行

🟢 **Web 版の独自価値は「インストール不要」ではなく「利用者 PC に要求する権限がゼロ」であり、
これは Arduino Cloud(Agent 必須)にも Desktop にも既存 IDE bundle にも無い。**

🔴 **Desktop 版の価値は「offline でコンパイルできるか」で二分され、
その分岐は現在の裁定でも baton でも未分離である。先に分けて裁定する必要がある。**
