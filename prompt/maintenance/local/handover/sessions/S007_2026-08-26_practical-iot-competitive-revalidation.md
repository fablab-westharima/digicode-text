# S007 — Practical IoT Competitive & DigiCode Capability Revalidation

**Date:** 2026-08-26 〜 2026-08-27(close)
**Conductor:** Claude Code (Opus 5) — `SESSION_ROLE: PRIMARY` / `PRIMARY_MODEL_MODE: T1-conserve`
**Status:** Human 受理済み・close 済み
**⚠️ 本ファイルは immutable な歴史的証拠であり、current authority ではない。** 現在の状態は 16.md。

---

## §0. 目的の再確認

DigiCode / DigiCode Text を「初心者向け Arduino IDE」ではなく **実用 IoT / 組み込みデバイス開発環境**
として再評価する。donor の実機能(特に自動 Web UI 生成)を実コードから分析し、価値仮説を
2026 年の競合と **機能・対応範囲・料金・無料枠・実用コスト**まで含めて再検証する。
**production implementation GO ではない。**

## §1. やったこと

1. **cold start** — baseline 全 14 項目を再測定(転記ゼロ)、donor SHA 3/3 を独立確認、
   selftest 75/0、mandatory read 完了。**handover と実測の食い違いは 0 件。**
2. **🔴 dispatch 前に blocker を 2 件検出** — ① `AGENTS.md` が donor 読解を全 lane で禁止したまま
   (S000 bootstrap 時点の記述)で、本 objective の中核作業と literal に矛盾していた
   → Human GO(裁定 A)を得て限定修正。② pricing lane の network 経路
   → **S006 の「Codex は DNS 遮断」を転記せず再測定**し、今回は疎通することを確認して Codex にも
   一次情報取得を分担させた。
3. **baton 43 を CONFIRMED 化** — conductor の実効 effort を transcript の `effort` フィールドから実測。
   **6 ファイル / 1,427 レコードの 100% が `medium`。**`modelSettings["claude-opus-5"]` が
   top-level `xhigh` を上書きしている。設定変更は Human 判断で未実施。
4. **8 レーンを dispatch**(codex 6 / subagent 3、うち pre-flight probe 1)。
   D4(料金)と D5(機能)には**同じ競合集合に別 actor・別問いを、互いの答えを見せずに**渡した。
5. **横断矛盾監査**(parent の duty)を実施し `01_method-and-lanes.md` §9 に永続化 — 突き合わせ 6 件、
   parent 自身の packet 欠陥 1 件、この監査が検出できないこと 3 件。
6. **統合(成果物 A–H)**を `08_conclusion-and-next.md` に作成。
7. **🔴 統合結論そのものを D7 に攻撃させ、13 件の訂正を受けた**(claim-trace 37 件:
   SUPPORTED 20 / OVERSTATED 8 / UNSOURCED 7 / UNDERSTATED 1 / CONTRADICTED 1)。
   本文中の誤りをその場で訂正し、訂正前の表現は `08` §5 に 13 行の表として保存。
8. Human へ最終報告 → **2026-08-27 に D7 訂正版で受理**、追加 context を受領して close。

## §2. 状態変化

**新規 case 2 件:**
- **DT-6** — 統合が自分の evidence を超え、13 件を同一セッションの反証レーンが差し戻した。
  **統合者の自己点検では 1 件も出なかった。**DT-4 が処方した defense を初めて実行し、それが実際に発火した。
  **認知的 defense は機能せず、dispatch された独立レーンという構造だけが防御だった。**
- **DT-7** — 委譲を厳格に運用した結果 parent の手元に残った「小さな作業」で 2 件の静かな失敗
  (識別子の無検証転記 / `cd &&` 短絡下の偽成功メッセージ)。

**新規 baton 8 本(44–51):** 競合実利用 0 と Human test 11 件 / Arduino Cloud AI Assistant 未監査 /
半導体ベンダ AI カテゴリ未探索 / Particle の verified coverage 1.03% / 学術証拠の射程限定 /
absence claim を市場全体へ外挿しない / auto Web UI の入力アダプタ / Device knowledge 化の検証。
**既存 baton 4 本(37 / 38 / 39 / 41)を S007 の結果で更新。GONE 0(handover-diff で確認)。**

**新規 ruling 7 件(§3、2026-08-27):** S007 evidence state の採用 / **産業 IoT 実装が止まった真因** /
knowledge-driven 転換への期待(仮説) / Home Assistant の設計意図 / auto Web UI の位置付け訂正 /
次 Objective 名称 `Managed Environment & Device Knowledge Architecture Design` / Opus 5 solo 禁止の再確認。

**新規 rule:** なし。**Template feedback +2**(#7 統合文書への falsification 義務が rule 22 に無い /
#8 委譲比率が高いセッションで parent の手元作業に検査工程が無い)。

**repo 変更:** `AGENTS.md` の donor 行(Human GO 済み)+ investigations 10 ファイル + 本 close 一式。
**donor 3 repo への変更 0 · production 接触 0 · account 作成 0 · 課金 0 · 営業接触 0。**

## §3. 自己評価

**✅ Healthy**
- baseline を 1 つも転記せず、donor SHA を独立確認し、**delegate の model を transport 側の設定ファイルから取得**した(自己申告ではない)。
- **dispatch 前に `AGENTS.md` の矛盾を検出**した。packet と delegate config が literal に衝突する状態で
  委譲を始めていたら、遵守すれば作業不能・無視させれば Forbidden set 違反だった。
- **S006 の環境測定値を転記せず再測定**し、結果が変わっていることを確認した(Codex の network)。
- **統合結論を独立反証へ通すことを、Human に言われる前に工程として組んだ。**それが 13 件を捕まえた。
- 誤りを本文中で訂正し、**訂正前の表現を削除せず保存**した。

**⚠️ Warning(すべて処理済み — prose のまま残さない)**
- **統合が evidence を 13 回超えた。** → case **DT-6** として起票(処理 (b))。
- **packet に識別子を無検証で転記し、`echo` が起きていない状態を主張した。** → case **DT-7**(処理 (b))。
- **competitor の実利用が 0 のまま結論を書いた。** → baton **44** に Human test 11 件として登録(処理 (a))。
- **最近接競合(Arduino Cloud AI Assistant)を機能表から落としていた。** → baton **45**(処理 (a))。
- **conductor が宣言と異なる effort(medium)で全セッション走っていた。** → baton **43** を CONFIRMED 化し、
  16.md §5 に実測値として記録。設定変更は Human 判断のため **(c) acknowledged, not acting**。
- **read-load は WARNING のまま**(case 2 件追加で Part 1 が増えた)。→ baton **25** が既に owner(処理 (a))。
