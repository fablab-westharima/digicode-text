# 03_反証仮説 B の検証 — 既存 IDE を完全 offline bundle にすれば DigiCode Text は不要か

**Human 指示 §8 / §9 / §10 / §11 に対応。**

> **反証仮説:** VS Code / pioarduino / AI Agent 等を、Board / Toolchain / Sensor Library /
> dependency まで含めた完全な offline package として配布すれば、DigiCode Text は不要ではないか。

**この節は DigiCode Text を正当化するために書かれていない。** 仮説 B が成立するなら、
それは No-Go の根拠になる。実際、**B は技術的にはかなりの程度成立する**。
成立しないのは技術ではなく、**配布の合法性・依存の推移閉包・更新**の 3 点である。

---

## 1. B を実際に作るなら何が要るか(具体化)

| # | 要素 | 現状の可否 | 根拠 |
|---|---|---|---|
| 1 | **VS Code 本体** | 🟢 可。オフラインインストーラが公式に配布されている | — |
| 2 | **拡張(PlatformIO IDE / C/C++ / AI Agent)** | 🔴 **第三者が再配布することは Marketplace 利用規約に反する。** Offering は Visual Studio 製品との併用にのみ許諾され、Microsoft の公開インターフェース以外の手段での取得は禁止。private / offline gallery は長年の feature request のまま未提供 | B-3 |
| 3 | **platform(pioarduino / platformio-espressif32)** | 🟢 可。GitHub Releases の zip を `platform = <URL or file://…>` で固定できる | P-1 / P-2 / P-8 |
| 4 | **toolchain / packages** | 🟡 **原理的には可、実運用は脆い。** `file://` / `symlink://` は公式に offline 動作すると明記。ただし **`.platformio/packages` へ手で置いた package を Tool Manager が認識せずダウンロードを試みる**事象が open issue として存在し、mirror fallback も壊れている(maintainer 応答なし) | P-1 / P-7 |
| 5 | **Sensor / Device Library** | 🟡 可。`file://<zip>` / `symlink://` / ローカルフォルダで指定できる。**ただし manifest(`library.json` 等)が必須** | P-1 |
| 6 | **その依存ライブラリ(推移閉包)** | 🔴 **ここが壊れる。**§3 参照 | A-3 / A-4 / P-1 |
| 7 | **dependency lock** | 🟡 PlatformIO 側は全指定を `file://` に固定すれば実質 lock になる。Arduino 側は `depends=` が registry 前提 | P-1 / A-3 |
| 8 | **samples** | 🟢 可(ただの成果物) | — |
| 9 | **AI setup** | 🔴 **AI は offline 化できない。** Copilot は air-gapped では動作せず、他のクラウド AI も同じ。ローカル LLM に切り替えるならモデル(GB 級)と実行環境が bundle に乗り、品質も別物になる | B-4 |
| 10 | **configuration** | 🟡 `platformio.ini` / `.vscode` / `arduino-cli.yaml` を配れば可。ただし絶対パス依存になりやすい | P-4 |
| 11 | **update bundle** | 🔴 §5 参照 |

## 2. 🟢 B が成立する部分は本当に成立する — Espressif が実例

**ESP-IDF には公式の offline installer が存在する**(B-5)。
インストーラ本体と全依存データを含む `.zst` アーカイブを zip で配布し、
**インターネット接続なしで導入が完了する**。v6.0 以降は EIM で online / offline を選べる。

🔴 **これは「一括 installer で MCU 環境を配る」という発想が
ベンダ自身によって実装され、出荷されているという証拠である。**
Human 指示 §10 の「DigiCode MCU Development Pack」構想は、**空想ではなく既存事例のある形**である。

**ただし ESP-IDF offline installer が含むのは ESP-IDF と toolchain だけ**であり、
**Arduino ライブラリでも、サードパーティのセンサライブラリでも、Editor でも、AI でもない。**
つまり Human 指示 §3 が繰り返し警告した
「Board package だけ offline 化すれば解決、ではない」の**実例側の証拠**にもなっている。

## 3. 🔴 B が壊れる第一点 — 依存の推移閉包を誰も自動で閉じてくれない

**Arduino 側(A-3 / A-4、いずれも公式 issue):**

- `lib install --zip-path` / `--git-url` は `enable_unsafe_install=true` を要求する。
- **zip からインストールしたライブラリの dependency は解決されない。**
- `library.properties` の `depends=` は **Library Manager 掲載ライブラリしか受け付けない**。
  git URL / zip path を書けるようにする提案 (#1772) は **`conclusion: declined` で却下済み**。

**PlatformIO 側(P-1):**

- ローカル指定は可能だが、`file://` の archive / folder には manifest が必須。
- registry 名で書かれた依存は **registry へのネットワークアクセスを要する**と公式に明記。
- したがって **ベンダリングしたライブラリが `dependencies` に registry 名を書いていれば、そこで通信が発生する。**

→ 🔴 **「Sensor Library を 1 つ足す」とは、実際には
「そのライブラリと、その依存と、依存の依存を、すべて手で見つけて manifest を確認して
ローカル指定へ書き換える」ことである。** そしてこれは**ライブラリを足すたび、更新するたびに再発する**。

🔴 **これは DigiCode Text がやろうとしていることと同じ作業である。**
違いは **誰がやるか**だけ — B ではそれが**顧客側の IT 部門または講師**になる。

## 4. 🔴 B が壊れる第二点 — 配布の合法性

| 対象 | 制約 |
|---|---|
| VS Code 拡張(PlatformIO IDE / C/C++ / AI Agent) | **Marketplace ToS により第三者の再配布は不可**(B-3)。「社内で使うために各自が入れる」なら合法だが、**それは「offline bundle として配る」ことではない** |
| GitHub Copilot | **air-gapped で動作しない**(B-4)。bundle に含める意味がない |
| サードパーティ OSS ライブラリ | ライセンスは個別。再配布可なものが多いが、**採用時に実際のライセンス本文を読む義務がある**(本 project の baton 15) |

→ 🔴 **「VS Code + AI Agent 入りの offline bundle」を製品として第三者が配布することは、
少なくとも拡張の部分で規約上できない。**
できるのは「顧客の IT 部門が、自組織のために、自分で組み立てる」形だけである。

**この区別は決定的である:**
- B が**顧客の内製作業**なら → DigiCode Text は不要にならない。**顧客がその作業をやりたくないから製品が要る**。
- B が**製品として配布可能**なら → DigiCode Text は不要になりうる。**しかし規約上そうはならない。**

## 5. 🔴 B が壊れる第三点 — 更新(Human 指示 §8 が必ず評価せよと言った軸)

**初回配布より更新のほうが厳しい。**

| 更新対象 | B での運用 | 根本問題は解決するか |
|---|---|---|
| VS Code 本体 | オフラインインストーラを再配布 | 🟢 解決する |
| 拡張 | 🔴 再配布不可(§4)。各 PC が Marketplace へ到達する必要が戻る | ❌ **戻る** |
| platform / toolchain | zip を差し替え、`platformio.ini` の URL / パスを更新 | 🟢 解決する(ただし GB 級の再配布) |
| **Sensor / Device Library** | 🔴 **新しい版を取ってきて、依存の推移閉包を再度手で閉じ、bundle を作り直す** | ❌ **戻る**(作業が消えるのではなく、顧客側に固定される) |
| AI | 🔴 クラウド AI は常時通信。ローカル LLM ならモデル更新が GB 級 | ❌ **戻る** |
| security update | 上記すべてに従属 | ❌ |
| arduino-cli を使う場合 | 🔴 **default index への通信は無効化できない**(A-1) | ❌ **戻る** |

🔴 **Human 指示 §8 の懸念は正しい:**
**「更新のたびに Library Manager / registry / GitHub へ接続するなら根本問題は解決していない」**
— そして**実際に、拡張・ライブラリ・AI の 3 つで接続が戻る。**

## 6. 🔴 B が壊れる第四点 — 「誰が maintenance 責任を負うか」(Human 指示 §12)

B で「保証された環境」を成立させるには、誰かが次を恒久的に担う:

1. Board × Library の互換性を実コンパイルで確認する
2. 依存の推移閉包を維持する
3. version 更新のたびに 1 を再実行する
4. 壊れたときに原因を切り分ける
5. 全 PC へ配り直す

**B ではこれが顧客側(学校の担当教員 / 企業の IT 部門 / 講師)に乗る。**
🔴 **DigiCode Classic の実績は、この作業が「片手間でできる作業ではない」ことを示している**
(inherited real-fire / donor-audit):

- Board 1 枚の追加が **2 リポジトリ・8 ファイル**(i18n 5 言語を含む)
- **block を足して `lib_deps` 登録を忘れた事故が 4 件**、compile-api のコメントに記録
- placeholder ライブラリ 1 個が **16/20 board のビルドを汚染**
- **RP2040 を削除した真因はグローバル `lib_deps`**、細分化より削除を選んだ
- `gin66/FastAccelStepper@^0.32` が現在 **解決不能**(baton 22)

→ 🔴 **「専任チームがある DigiCode ですら維持に失敗した種類の作業」を、
顧客の IT 部門や講師が継続できると仮定するのは非現実的である**(inferred、ただし根拠は実測記録)。

## 7. 反証仮説 B の判定

| 問い | 判定 |
|---|---|
| **技術的に可能か** | 🟢 **かなりの程度、可能。** PlatformIO は `file://` / `symlink://` / ローカル zip platform を公式にサポートし、offline 動作を明記している。ESP-IDF は公式 offline installer を出荷している |
| **製品として第三者が配布できるか** | 🔴 **できない。** VS Code 拡張の再配布が規約で禁じられ、AI は offline 化できない |
| **顧客が自前で組めるか** | 🟡 **組める。ただし依存の推移閉包と更新を恒久的に自分で持つことになる** |
| **更新後も根本問題が解決したままか** | 🔴 **ならない。** 拡張・ライブラリ・AI・arduino-cli の default index で通信が戻る |
| **DigiCode Text を不要にするか** | 🔴 **しない。** B は**問題を消すのではなく、問題の所有者を顧客へ移す** |

## 8. 🔴 この節が Human に渡す一行

**反証仮説 B は「DigiCode Text は不要」を導かない。導くのは
「DigiCode Text が売るものは Editor でも Web でもなく、
"依存の推移閉包を閉じ続ける作業を、顧客の代わりに引き受けること" である」という定義である。**

そして同時に、**B の検証は DigiCode Text の最大リスクも露わにした** —
**その作業を引き受けるということは、Classic が既に失敗した種類の負債を、
今度は契約として背負うということである**(`08` §8)。

## 9. 補記 — Human 指示 §11「Package Manager をユーザーに触らせない価値」への直接回答

| 方式 | Package Manager を本当に隠せるか | 更新時に戻らないか |
|---|---|---|
| **Web(server 側管理)** | 🟢 **完全に隠せる。** 利用者の PC に package manager が存在しない | 🟢 **戻らない。** 更新は server 側で完結する |
| **Desktop(bundle / versioned pack)** | 🟢 隠せる(利用者は installer と更新しか見ない) | 🟡 **配信元へ HTTPS 到達が要る。** ただし宛先は **1 ドメイン**で済む |
| **既存 IDE の offline bundle** | 🟡 初回は隠せる | 🔴 **戻る。** 拡張・ライブラリ・AI・arduino-cli の index(§5) |

🔴 **Human の仮説「共通価値は Package Manager をユーザーに触らせないことにある」は、
証拠に照らして支持される。** ただしより正確に言い直すなら:

> **価値は「触らせないこと」そのものではなく、
> 「利用者側が到達を許可されなければならないネットワーク宛先の集合を、
> 際限なく増える registry / GitHub の集合から、ベンダ 1 ドメインへ畳むこと」である。**

**この言い直しが重要な理由:** 企業イントラの問題は「通信が全く無い」ことではなく、
**「何を許可すればよいか事前に列挙できず、しかも増え続ける」**ことである。
DigiCode Text は Web でも Desktop でも、**IT 部門に対して「この 1 ドメインを許可してください」と言える**。
既存 IDE の bundle はそれが言えない — 明日新しいライブラリを使えば、明日新しい宛先が増えるからである。
