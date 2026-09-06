# 05_Option 比較 / findings / risks / 残 unknown / Human 判断事項 / next-objective candidates

**この文書の性格:** 現 objective を**超える**事項の置き場。ここに書かれたものは
**記録であって着手指示ではない** (裁定 §18、rule 24)。
**Shared / Separate の最終決定は Human が行う。本セッションは決定しない** (裁定 §17)。

---

## 1. Option 比較 (裁定 §17) — Acceptance 10

### 1.1 選択肢の定義

裁定の A / B / C に加え、実測で意味のある境界が 1 本見つかったので B を 2 つに割った。
**二択で考えないでほしい**という裁定 §10 の指示に沿った分割である。

| | Option A 最大共用 | **Option B1 route 分離・同一プロセス** | Option B2 プロセス分離・image 共用 | Option C 完全分離 |
|---|---|---|---|---|
| Compile API | 既存 endpoint を multi-file 受理へ**拡張** | 既存に**触れず endpoint 追加** | Text 用に別プロセス起動 (同一 image) | Text 専用 API |
| Docker image | 共用 | 共用 | 共用 | **別 image** |
| toolchain / platform | 共用 | 共用 | 共用 | 別 (同一版でも別実体) |
| registry (board / lib) | **共用** | 分離 | 分離 | 分離 |
| workspace / cache / lock | 共用 | 分離 (namespace) | 分離 (別ボリューム可) | 完全分離 |
| **本 probe での検証状況** | 未実装 (意図的に避けた) | **実測済み** | 未実測 (B1 からの推論) | 未実測 (推論 + 部分実測) |

### 1.2 比較表

凡例: **[測]** = 本 probe の実測 / **[推]** = 実測からの推論 / **[未]** = 未検証

| 観点 | Option A | **Option B1 (実測済み)** | Option B2 | Option C |
|---|---|---|---|---|
| **Classic regression risk** | **高** [測: 既存 57 本の lib universe は全 build で解決される。過去に 3 件の全体停止事故が記録されている] | **実測で 0** [測: Classic artifact 4 点が 3 回ともバイト一致、生成 ini の差分 0、既存 6 ファイルの差分 0] | B1 と同等かそれ以下 [推] | **構造的に 0** [推: 共有コードが無い] |
| **Text の Board 追加の軽さ** | 軽いが**全体に露出** [測: `FQBN_TO_PIO` は Classic と同一テーブル] | **軽い・露出しない** [測: 独自 registry でビルド flag が実到達] | 同左 [推] | 同左 [推] |
| **Text の Library 追加の軽さ** | **危険** [測: 追加は Classic 全 build の解決対象に入る] | **安全** [測: marker positive control 付きで漏洩 0] | 同左 [推] | 同左 [推] |
| **maintenance** | 単一実装で済むが、変更の影響範囲が常に両方 | **2 実装 + 共有 6 ファイルの読み替え**。`buildLibDeps()` を再利用した瞬間に A に退化する [測: 分離は関数の分離に依存] | B1 + プロセス管理 | **完全 2 系統**。toolchain 更新も 2 回 |
| **Docker image** | 1 本 | 1 本 (Text 追加分は +0 MB) [測] | 1 本 | **2 本**。ただし Text 側は Classic の vendored robotics lib・4 template・57 lib warmup が不要なため**大幅に小さくできる可能性** [未] |
| **deploy** | 1 系統 | 1 系統 — **ただし Text の変更が Classic の再起動を伴う** [測: 同一プロセス] | Text だけ再起動可 [推] | 完全独立 |
| **Cloudflare** | 変更なし | **`ALLOWED_ORIGINS` に origin 追加が必須** = Classic 本番 Worker の変更 [測] / 代替は Text 専用 Worker (Worker は path 透過なので新規作成は容易) [測] | 同左 | Text 専用 Worker が自然 |
| **Local Compiler** | 1 コンテナ | 1 コンテナで両対応 [測] | 2 プロセス | **2 コンテナ = 利用者の負担増** [推] |
| **school / company LAN 共有** | 1 image を配れば両方動く | **同左** [測] | 同左 | 2 image 配布。合計 DL 量は増えるが、Text 単独運用なら小さい image で済む [未] |
| **failure isolation** | 無し | **弱い** [測: 同一 Node プロセス。Text 経路の crash / OOM / 無限ループは Classic を道連れにする] | **強い** [推] | **最強** [推] |
| **future scalability** | 単一 lib universe が肥大し続ける | workspace 数に比例して 23 MB ずつ増える [測] → cleanup 設計が必須 | 同左 + 水平分割しやすい | 独立にスケールできる |
| **build cache 共用の利得** | — | **わずか** [測: 共有 493 MB に対し、Text 専用の空キャッシュでも 1 ビルドで同等速度に到達、サイズ 24 MB] | 同左 | **共有しなくても損しない** [測] |

### 1.3 この比較から読み取れること (判断ではなく、事実の要約)

1. **「共用しないと遅い / 重い」という直感は、build cache については実測に支持されない。**
   共有の実質的な価値は **toolchain 実体を二重に持たないこと** (image content 3.42 GB) に絞られる。
2. **Classic への回帰リスクは、endpoint を分けるかどうかではなく `lib_deps` を分けるかどうかで決まる。**
   Option A が高リスクなのは API を共用するからではなく、registry を共用するからである。
3. **B1 と B2 の差は「障害の道連れ」だけ**であり、そこは実測ではなく設計上の性質。
   B1 は最小コストで成立し (既存 3 行追加)、失敗時の巻き添えを許容する構成である。
4. **Cloudflare は、どの案でも「Classic の Worker を触る」か「Text 用 Worker を新設する」かの二択**になる。
   Worker が path 透過であることが実行で確認できたので、**新設は容易**な部類に入る。

## 2. findings

| # | finding | 型 | 影響 |
|---|---|---|---|
| **F-A** 🔴 | **現行 Classic の `lib_deps` は、まっさらな環境では今日ビルドできない。** `gin66/FastAccelStepper@^0.32` が registry から消えており (残存版は 0.31.8 と 0.33.6 以降)、`UnknownPackageError` で全体が落ちる。47 registry エントリ中**この 1 件のみ** | 実測 (実 compile 失敗 91 s + 全 47 件の突合) | **donor 側の問題であり本 objective では直さない**。ただし「新しい Local Compiler を配布したら誰もビルドできない」形で表面化しうる。Text がこの依存集合を継承すれば同じ病気を継承する |
| **F-B** 🔴 | **`lib_ldf_mode = chain` は「ビルド対象」を絞るだけで、`lib_deps` 全件の解決・インストールは行われる。** ユーザソースが一度も include しないライブラリの解決失敗でビルドが落ちた。57 宣言に対し `.pio/libdeps` に 69 ディレクトリが実体化 | 実測 | **Classic の 57 本は事実上すべてのユーザコードの必須依存**。audit F-2 の「軽く足す」問題の正確な形がこれ |
| **F-C** 🟢 | **audit P-1 の仮説「additive な新 endpoint なら Classic に無影響」は成立した。** 既存 6 ファイル差分 0、`server.ts` に 3 行追加のみで、Classic の 4 artifact は 3 回ともバイト一致 | 実測 + 対照実験で検出力を確認 | Shared/Separate 判断の前提が 1 つ確定した |
| **F-D** 🟢 | **Text 専用依存は Classic のビルドに到達しない。** positive control 付きの marker 検査で実証 | 実測 | 「Library を足すと Classic が壊れる」は**構造の宿命ではなく、関数を共有した場合の帰結** |
| **F-E** 🟡 | **Text-only board は Classic に露出しない。** ただし成立条件は「現行 image の pioarduino platform に board 定義があること」。別 platform を要する board は image 変更になる | 実測 (registry 分離) + 静的 (platform 構成) | Board 分離の限界線がここ |
| **F-F** 🟡 | **Text workspace は 1 つあたり約 23 MB。** donor には相当する cleanup 機構が無い (Classic は (board × template) の有限個しか作らないため不要だった) | 実測 | **cleanup / TTL / LRU は新規設計要素**。編集セッション数に比例して増える |
| **F-G** 🟡 | `projectLock` は**プロセス内**の直列キュー。同一 workspace への同時要求は正しく直列化され、成果物も互いに壊さないことを実測したが、**複数プロセス / 複数コンテナでは保護されない** | 実測 (単一プロセス内) + 静的 (実装) | 水平スケール時に効く。audit R-1 の再確認 |
| **F-H** 🔴 | **共有 SCons build cache の利得は小さい。** Text 専用の空キャッシュでも 1 ビルド後に共有時と同等 (5.3–5.4 s)、サイズ 24 MB | 実測 | **Option C を「キャッシュを失うから不利」とは言えない** |
| **F-I** 🟡 | **Cloudflare Worker は path 透過**で、新 endpoint の追加に Worker 側のコード変更は不要。必須変更は `ALLOWED_ORIGINS` の 1 箇所のみ。未登録 origin は **preflight 段階で落ちる** | 実行 (donor コードを stub 上流で isolated 実行) | audit F-6 を実行で再確認。Text 専用 Worker 新設が容易であることも同時に判明 |
| **F-J** 🟡 | **`.ino` は PlatformIO 側で前処理される** (`Arduino.h` 自動 include + プロトタイプ自動生成)。Classic の template を通さない full-source `.ino` がそのままビルドできた | 実測 | **`.ino` か `main.cpp` かは Compiler 側の制約ではない**。判断材料は Editor / LSP 側へ移る (audit P-2 / F-7) |
| **F-K** 🟢 | Text の firmware は 300 KB 台、Classic は 1.35 MB。差の主因は Classic template が内包する製品ロジック (WiFi / HTTP / Preferences / NimBLE) | 実測 | `min_spiffs.csv` の 1.9 MB スロットに対し Text 側は余裕が大きい |
| **F-L** 🟡 | Classic は edge timeout 対策として **SSE + 15 秒 heartbeat** を持つが、**probe の Text 経路は同期 POST のみ**。Text の実ビルド時間分布が不明なため、SSE 相当の要否は決められない | 実測 (probe の構成) + 静的 (Classic の対策) | Cloud 経由運用の設計項目 |
| **F-M** 🟢 | Classic frontend の `BoardDefinition` は `experimental` フラグの**機構を持つが、現時点で true の board は 0 件** (16 board 中) | 実測 (grep 全件) | audit が「experimental バッジ込みで流用可能」と記した対象は**機構であってデータではない**、という精度の補正 |

## 3. risks

- **R-1** 🔴 **probe コードは production 実装ではない。** 認証・rate limit・quota・ファイルサイズ上限・
  workspace の cleanup・ソース総量の上限が**いずれも無い**。パス検証は基本的なもの (traversal は拒否を実証済み)
  だが、production の脅威モデルで再設計が要る。
- **R-2** 🟡 測定はすべて**小さな fixture** (ソース 297〜971 B、firmware 300 KB 台) による。
  実運用規模のプロジェクトで同じ時間・同じ挙動になる保証は無い。
- **R-3** 🟡 **実機書き込みは 1 件も行っていない。** artifact の形が Classic と一致することは示したが、
  「焼けること」は未検証。
- **R-4** 🟡 並行検証は **2 並列まで**。負荷試験は行っていない (裁定 §7 のとおり不要とされた)。
- **R-5** 🟡 D-1 (`FastAccelStepper` の pin 読み替え) を BEFORE / AFTER の両方に適用している。
  回帰判定はこの条件下で成立しているが、**production の現行 pin そのままの状態では Classic は
  まっさらな環境でビルドできない** (F-A)。
- **R-6** 🟢 Worker の検証は **stub 上流**で行った。実 Cloudflare edge の size / timeout 挙動は未測定。

## 4. 残 unknown (Acceptance 9)

1. Cloudflare のプラン別 request body 上限と実 timeout 値
2. 複数プロセス / 複数コンテナ構成での排他制御
3. Text の実運用プロジェクト規模におけるビルド時間分布 (SSE 要否の判断材料)
4. `digicode-installer` (Local Compiler 配布) の実装 — audit からの持ち越し、未読のまま
5. オフライン / 校内 LAN 環境での registry 解決の可否
6. Text 専用 image を作った場合の実サイズ (Option C のコスト見積り)
7. `build_cache_dir` が VOLUME でない設計が Text 運用に与える影響
8. donor の deploy スクリプト 4 本 — audit からの持ち越し、未読のまま

## 5. Human 判断が必要な項目

| # | 判断事項 | 本 probe が用意した材料 |
|---|---|---|
| H-1 | **Shared / Separate の決定** (Option A / B1 / B2 / C) | §1 の比較表。B1 は実測済み、他は推論を明示 |
| H-2 | Cloud 経路を **Classic の Worker に相乗り**させるか (= 本番 Worker の `ALLOWED_ORIGINS` 変更を許すか)、**Text 専用 Worker を新設**するか | F-I。Worker は path 透過で、新設は 137 行相当 |
| H-3 | **`.ino` か `main.cpp` か** | F-J。Compiler 側は両方受ける。制約は Editor / LSP 側 (audit F-7) |
| H-4 | Text workspace の **cleanup / TTL / 保持ポリシー** | F-F (23 MB/workspace) |
| H-5 | compile API に **認証 / rate limit / quota** を設けるか | R-1、audit の「Worker に auth も rate limit も無い」 |
| H-6 | donor 側 `FastAccelStepper@^0.32` の是正を**誰がいつ行うか** (本 repo からは行わない) | F-A |
| H-7 | RP2040 を Text で扱うか — **本 objective では決定しない** | 04 §3 の示唆のみ |

## 6. next-objective candidates (Human が選ぶ / menu であって queue ではない)

| # | 候補 | 前提 | 規模感 |
|---|---|---|---|
| M-1 | **Architecture Decision objective** — Editor 方式 / 保存方式 / 収益モデル / Compiler Shared-Separate / `.ino` vs `main.cpp` をまとめて裁定する | 本 probe で Compiler 側の材料は揃った。**F-7 (COOP/COEP × 広告) が未解決のままなので、単独では決まらない** | 大 |
| M-2 | **Editor / LSP technical spike** — clangd WASM の実サイズ・ロード時間・multi-file 対応・COOP/COEP × 広告の両立可否 | audit N-2 のまま。H-3 の判断材料でもある | 中 |
| M-3 | **registry 単一正本化の設計** — Board / Device / Library の正本を 1 つにする | audit N-4 のまま。F-E がその限界線を与えた | 中 |
| M-4 | **Text compile path の production 設計** — 認証 / quota / cleanup / SSE / サイズ上限を含む本実装の設計 | **H-1 が決まってから**。probe コードは設計の入力であって実装ではない | 大 |
| M-5 | **残 ⑤ の消化** — `digicode-installer` / deploy スクリプト / class-server / `variants/usb` / ML30 | audit N-5 のまま | 小〜中 |
| M-6 | **企画書の改訂** — F-J / F-A / 04 §3 を反映 | Human 側の作業 | 小 |
