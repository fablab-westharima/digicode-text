# 06_Product Value Revalidation の反証

**checker:** Codex `gpt-5.6-sol` · packet `DT6-D4a-product-value-falsification` · `LANE: FALSIFICATION` · `VERDICT: PASS`
**制約:** 🔴 **Codex 環境は DNS 段階でネットワーク遮断**。外部一次資料の再取得は**全件 `NOT_OBTAINED`**。
本 packet の evidence は `static`(指定文書全読・相互矛盾・論理的射程)であり **real-fire は無い**。
→ 外部一次情報は `07_primary-sources.md`(別レーン)が owner。

**Human ruling は変更していない。** 反証対象は**裁定へ入力された evidence** のみ。

---

## 1. 測定境界(S005 自身が明記)

`01_method-and-sources.md:17-18, 60, 63-74` `[static]`:

> 「実機での比較(VS Code + PlatformIO を企業 PC で実際に構築してみる) — NOT OBTAINED」
> 「完全 offline bundle の実作成 — NOT OBTAINED」
> 「Codey / Arduino Cloud Editor / Wokwi の実利用 — NOT OBTAINED」
> 「Chrome enterprise policy を実際に配って Local Network 許可が付くことの確認 — NOT OBTAINED」
> 「**本調査そのものは real-fire を 1 件も行っていない**」

---

## 2. 🔴 Sampling / Pattern C

比較単位を固定して数えると、実質的な専用評価を受けたのは **5 単位**:

1. VS Code + PlatformIO/pioarduino + AI
2. Arduino IDE
3. Arduino CLI
4. Arduino Cloud Editor
5. Codey Online

```text
N_substantive = 5 comparison units
N_real-use    = 0 products
candidate-universe denominator = NOT OBTAINED
```

Wokwi / ESP Web Tools / ViperIDE / CircuitPython Online Editor / FlashESP / devcontainer・Codespaces /
ESP-IDF は、二次資料・短い分類・限定的な offline precedent に留まる。

🔴 **選定規則・検索式・検索期間・地域・候補母集団・除外理由は、いずれも記録されていない。**

静的検索は `SCANNED=9 files / 1,089 lines` — これは**文書走査量であり市場母集団の代理ではない**。
Codey / Wokwi 等を positive control として検出した一方、次はヒットしなかった:

> Keil · IAR · Tinkercad · MakeCode · STM32Cube · MPLAB · MCUXpresso · Code Composer ·
> Renesas e² studio · Simplicity Studio · Mixly · Mind+ · mBlock

文書自身も `08_conclusion-and-next.md:200-201` で Pattern C を認めているが、
**「弱い証拠」と注記するだけでは、そこから得た中核価値・Go・次設計中心の強度は下がっていない。**
case 59 と同型である。

---

## 3. P1–P10 判定

| Claim | 判定 | 最強の反証 | ORIGINAL evidence | 今回の check | Human ruling |
|---|---|---|---|---|---|
| **P1** digicode-text is Go | 🔴 **REFUTED** | Go 根拠 1 は「権限ゼロで書込可能な他製品なし」だが、**同じ調査が Codey を「ローカル導入不要・Web Serial 直接書込」と記載**。さらに需要・利用実績・支払意思がゼロ測定 | inference | static・**文書内矛盾** | 中核価値・Registry 裁定が依存 |
| **P2** Web Arduino Editor 自体に独自価値なし | **PARTIALLY_REFUTED** | 類似機能の存在は機能単体の唯一性を崩すが、「独自価値がない」までは導かない。統合品質・教材・サポート等は未測定 | primary source + inference | static。競合実利用 / 一次再取得は NOT OBTAINED | S005 §1 |
| **P3** Core value = Managed/Verified Environment | 🔴 **REFUTED** | `04:7-13` は **Human 仮説を再掲して即「支持」**。Classic の依存事故は問題の存在と維持困難を示すが、顧客価値・需要・実現可能性を示さない。**同じ証拠は No-Go も支持する** | inference + inherited real-fire | static・**循環性監査** | S005 §1/§2 が直接依存 |
| **P4** Compiler と AI が同じ正本を読むことが価値 | 🔴 **REFUTED** | source-of-truth は設計上の整合性仮説。**分離正本との比較、AI 誤生成率、compile 成功率、利用者価値を一度も測っていない**。文書自身も prompt 制約は保証でないと認める | inference | static。比較実験なし | S005 §1/§2/§6 |
| **P5** Manager を触らせないことが価値 | **PARTIALLY_REFUTED** | UX 便益はありうるが独自ではない。**管理配布された offline bundle も利用者から manager を隠せる**。文書自身が Desktop bundle は「隠せる・1 ドメイン」と認める | primary source + inference | static | S005 §1/§3 |
| **P6** offline VS Code+PlatformIO bundle は同じ問題を解かない | 🔴 **REFUTED** | 調査自身が「技術的にはかなり可能」「顧客は自前で組める」と認定。支えられるのは「**維持作業が残る**」という推論だけで、「不能」でも「現存しない」でもない。Marketplace 取得制限から全 VSIX 再配布不可へ跳躍し、**拡張不要の PlatformIO Core CLI-only 構成も未検討** | inference built on primary sources | static。法的 / 一次再取得 NOT OBTAINED | Desktop 価値・中核価値・Registry 順序 |
| **P7** 価値は PC 権限・通信自由度に反比例 | 🔴 **REFUTED** | 測定関数・単位・母集団・比較結果がなく**数学的な反比例ではない**。フル権限ユーザーにも再現性・ゼロ設定・チーム統一の価値は残りうる。逆に低権限環境では vendor / LLM 通信が遮断されうる | inference | static | S005 §3 の重点 segment |
| **P8** Registry が正しい次 design centre | 🔴🔴 **REFUTED** | **P3 を認めても順序は導けない。** `08:174-184` **自身が V1–V7 を menu とし**、競合実査・企業 network 実査・architecture・互換性 matrix を並列候補としている | inference → Human ruling | static・**non sequitur** | S005 §6/§11 が直接依存 |
| **P9** Codey 等は直接競合 | **PARTIALLY_REFUTED** | 機能代替としては直接だが、顧客 segment・品質・利用継続・実際の書込成功・企業販売は未測定。**「直接競合」は vendor 記述ではなく調査者の分類** | Codey 機能 = primary source / 競合分類 = inference | static。実利用 / 一次再取得 NOT OBTAINED | S005 §1、baton 37 |
| **P10** AI 主機能は企業イントラと衝突しうる | **NOT_OBTAINED** | conditional としては合理的だが、**実企業での LLM 到達性はゼロ測定**。allowlist / custom endpoint / local LLM で衝突しない可能性も未測定 | inference | network / real-fire NOT OBTAINED | 直接の S005 裁定なし。baton 35 のみ |

---

## 4. 🔴 P6 の実際の論証 — 3 つの主張の混同

文書が実際に支持するのは、次の 3 つのうち **3 番目だけ**である。

| 主張 | 判定 |
|---|---|
| 「**作れない**」 | **反証済み** — 文書自身が技術的にかなり可能とする |
| 「**現在存在しない**」 | **NOT OBTAINED** — 網羅探索も実作成もない。ESP-IDF では部分的な実例がある |
| 「**維持が高価**」 | **推論として支持されるが未測定** — 工数・更新頻度・顧客 IT 能力の分布がない |

**さらに比較が非対称である。** offline bundle 側には「**AI まで完全 offline** であること」を要求する一方、
DigiCode Text 自身の AI もクラウド通信に依存する。

**検討されていない構成:** PlatformIO Core CLI-only / 承認済み VSIX の顧客内配布 /
社内 artifact repository / ローカル LLM。

---

## 5. 🔴 P3 → P8 の飛躍

P3 を全面的に認めても、Registry が「次」であることは導けない。少なくとも以下が代替 design centre である
(そして `08` は V2–V5 として**自ら列挙している**。順位付けの測定なしに V1 を次へ昇格させている):

| 代替 design centre | 内容 |
|---|---|
| 顧客・問題検証 | 管理済み環境への需要、支払意思、実際の環境構築失敗率を測る |
| 競合 real-fire | Codey / Arduino Cloud / Wokwi 等で同じ課題を実行し、差を測る |
| Offline bundle proof | PlatformIO Core CLI、ローカル package、更新 bundle、企業配布を**実作成する** |
| Value-mechanism experiment | **同一正本あり / なしで AI の非対応 API 生成率、compile 成功率、修正回数を比較する** |
| 互換性・保証範囲の決定 | 何を保証するか決めなければ Registry schema の必要情報も確定しない |

---

## 6. 🔴 建築自体への最強の反対論(Codex が全強度で提示)

> 唯一の差別化とされた「検証済み正本」は、**顧客が欲しいことも、AI 失敗を実際に減らすことも、
> 競合に存在しないことも一度も測られていない**。一方、それを提供するには、Classic が既に維持に
> 失敗した依存閉包・互換性保証を**恒久的に背負う**必要がある。近似体験は Codey 等が既に主張しており、
> 最も価値が高いとされた制限環境では主機能 AI が遮断されうる。
> したがって、**需要未確認の細い差のために、既知の最大負債を製品そのものとして再建する**可能性がある。

調査は Codey・維持負債・AI 遮断を**個別 risk** として扱った。
しかし「**差別化への需要がゼロ測定**」という統合された No-Go 論には答えず、顧客検証なしで Go へ進んだ。

---

## 7. 見落とした競合・カテゴリ(文書走査で未検討と確認できたもの)

- **PlatformIO Core CLI-only の完全 offline / portable workflow**
- 顧客 IT が承認済み VSIX・package を**社内 artifact repository から配布**する方式
- Keil MDK / IAR 級の**商用 managed toolchain**
- STM32Cube / MPLAB X / MCUXpresso / TI Code Composer Studio / Renesas e² studio / Simplicity Studio 等の **vendor IDE/toolchain**
- Tinkercad Circuits / Microsoft MakeCode 等の**教育向け Web 環境**
- **中国市場の教育・maker 製品群**(Mixly / Mind+ / mBlock 等。現行機能は未verify)
- vendor 固有 cloud / managed MCU development platforms
- container / remote development は**存在だけ記録し実質未調査**
- MicroPython / CircuitPython は代替カテゴリとして認識しただけで**比較未実施**
- ESP-IDF は offline installer の存在だけで、**EIM 全体の運用・更新・managed component ecosystem は未評価**

**網羅的 Web 探索が不能だったため、これが世界全体の完全リストだとは主張しない。**

---

## 8. Human ruling への影響

| ruling | original evidence | corrected evidence | impact | 再裁定 |
|---|---|---|---|---|
| S005 §1/§2 中核価値・製品定義 | Classic 依存事故、少数競合に保証表記がないこと | 技術負債は確認できるが**顧客価値は未測定**。競合不在は母集団不明 | **主要評価軸の経験的根拠が失われる** | 🔴 **YES、最強反証が真なら** |
| S005 §3 Web 版の重要価値・重点 segment | Arduino Cloud は Agent 必須、他の権限ゼロ選択肢なし | **同じ調査が Codey を導入不要・Web Serial 書込と記載** | Web だけが成立するという独自性が崩れる | 🔴 **YES** |
| 既存 Desktop / shared Frontend 裁定 | offline / managed bundle に独自価値 | **offline bundle は技術的に可能。配布不能は未立証** | bespoke Desktop の相対価値と境界が変わる | **条件付き YES** |
| S005 §6/§11 Registry が次の中核 | P3/P4 と V1 候補 | **P3/P4 未実証、V1–V7 に順序根拠なし** | 次 objective の優先順位が支えられない | 🔴 **YES** |
| S005 §7–§10 Verified/Custom・昇格・AI 管理・risk-based QA | Registry を製品中心とする前提 | Registry を選ぶなら有用な設計候補だが、**選ぶ理由は未確立** | 下流設計は条件付きになる | Registry 維持なら **NO**、前提が変わるなら YES |
| AI 主機能裁定 | S005 以前の Human 裁定 | P10 は未測定 risk のまま | deployment 要件には影響するが AI 採否を直接反証しない | **P10 だけでは NO** |

`CLAUDE.md:102-110` はこれら裁定の**派生**戦略軸であり、独立した証拠ではない。

---

## 9. Registry Design へ進む安全性(Codex の回答)

> **Conditional。ただし現状証拠のまま「製品中核として確定した Registry architecture」を設計するのは NO です。**

最低条件 7 件:

1. Codey / Arduino Cloud 等の **real-fire 競合実査**
2. PlatformIO Core CLI を含む **offline bundle の実作成・更新実験**
3. Marketplace 条項と各 extension / license の**権利別**レビュー
4. 管理済み環境に対する**顧客需要・環境構築失敗・支払意思の測定**
5. **同一正本あり / なしの AI・Compiler 比較実験**
6. 企業 network で vendor domain と LLM endpoint の**疎通確認**
7. それまでは Registry 設計を**可逆な仮説・experiment として扱い、製品中心を前提化しない**

---

## 10. network 一次資料 — 全件 NOT OBTAINED

`curl -L --fail --silent --show-error --max-time 20 -o /dev/null <URL>` を 10 件実行。
**すべて RC=6 `Could not resolve host`**(HTTP 応答以前に DNS 解決が失敗)。

| URL | RC |
|---|---|
| `https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#_install-from-a-vsix` | 6 |
| `https://aka.ms/vsmarketplace-ToU` | 6 |
| `https://docs.platformio.org/en/latest/core/userguide/pkg/cmd_install.html` | 6 |
| `https://arduino.github.io/arduino-cli/latest/commands/arduino-cli_core_install/` | 6 |
| `https://arduino.github.io/arduino-cli/latest/commands/arduino-cli_lib_install/` | 6 |
| `https://cloud.arduino.cc/plans` | 6 |
| `https://support.arduino.cc/hc/en-us/articles/360016308100-…` | 6 |
| `https://codey.online/` | 6 |
| `https://chromeenterprise.google/policies/#LocalNetworkAccessAllowedForUrls` | 6 |
| `https://learn.microsoft.com/en-us/deployedge/…/localnetworkaccessallowedforurls` | 6 |

**記憶による補完はしていない**(Codex の明示的報告)。

🔴 **この制約が、本 objective で最も重要な運用上の発見の 1 つである** —
**Codex レーンは外部一次情報を取得できない。** Human 指示 §5-E が求めた「2 lane・異なる検索戦略」は
結果的に**必須構成**だった。→ `07_primary-sources.md`
