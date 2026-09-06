# 04_Docker / toolchain 共用と Cloud 経路 — 裁定 §10 / §11 / §14 / §15

---

## 1. Docker 共用 (裁定 §10)

裁定が挙げた各点への実測回答。

| 問い | 実測回答 | 根拠 |
|---|---|---|
| Text full-source compile で**追加 package** が必要か | **不要** | image に一切手を加えず、`docker build` も `pull` もせずに A / A2 / B2 / B3 / C / TEXTLIB / TEXTBOARD の全ビルドが成功した |
| 既存 pioarduino / PlatformIO **だけ**で成立するか | **成立する** | image 内 platform は `espressif32` (pioarduino `54.03.21`) の 1 つのみ。それだけで multi-file / full-source が通った |
| **multi-file 自体**は image 変更なしで成立するか | **成立する** | multi-file は PlatformIO の標準プロジェクト構造 (`src/` + `include/`) にすぎず、Compiler 側に新機能は要らない。要るのは **API 側の materializer** (593 行の probe コード) だけ |
| dependency 追加時に image rebuild が必要か | **不要 (registry / `file://` の場合)** | Text 専用 test lib は `file:///probe/testlibs/...` を `lib_deps` に書くだけで解決・ビルドされた。image は無変更 |
| runtime dependency resolution が可能か | **可能。ただしネットワークに依存する** | Classic の 47 registry エントリは実行時に registry へ問い合わせている (D-1 の発覚経路がこれ)。**オフライン環境では新規解決ができない** |
| shared cache の影響 | 汚染は観測されず、**利得は限定的** | 下表 |
| image size への影響 | Text 経路の追加そのものは **+0 MB** (コードのみ)。**運用時の増加は build cache と workspace** | build-cache 493 MB → 781 MB (+288 MB、COW 層)。workspace 23 MB/セッション |
| Classic と Text で**別 environment** を持てるか | **持てる** | `platformio.ini` はプロジェクトごとに生成される。Text は独自の `[env:...]`・独自 `lib_deps`・独自 `build_flags` (`-DDIGICODE_TEXT_COMPILE_API`) を持ち、Classic と共有していない |

### 1.1 共有 build cache の価値を数値で

`TEXT_BUILD_CACHE_DIR` を切り替えて、**新規 workspace** のビルド時間を比較した。

| 条件 | 1 回目 | 2 回目 | 3 回目 | cache サイズ |
|---|---|---|---|---|
| Classic と**共有**の build cache (image に 493 MB 焼込済) | 9.1 s | 5.3 s | 5.8 s | 781 MB (共有) |
| Text **専用**の空 build cache | **9.6 s** | **5.4 s** | **5.3 s** | **24 MB** |

→ **共有 SCons キャッシュは、Text 側にとって「1 回目で 0.5 秒」程度の差しか生んでいない。**
Text 専用キャッシュは **1 ビルドで共有時と同等の速度に到達**し、サイズは 24 MB で済む。

**含意 (🔴 Option 判断への直接入力):** 「Docker / build cache を共有しないと遅い」という
直感的な理由は、**Text 側については実測に支持されない**。共有の本当の価値は
**toolchain (platform / framework / toolchain パッケージ、image 3.42 GB 相当) を二重に持たないこと**であって、
SCons オブジェクトキャッシュではない。

### 1.2 「API は分けるが Docker / toolchain は共用」は成立するか (裁定 §10 の中間案)

**成立する。本 probe の構成そのものがそれである。**
実測された共有 / 分離の境界:

```
共有 (image 由来、二重に持つ必要が無いもの)
  PlatformIO Core 6.1.19 · pioarduino platform 54.03.21 · framework-arduinoespressif32
  toolchain-xtensa / riscv · tool-esptoolpy · tool-scons · vendored libs 8 本 · templates 4 本

分離できたもの (probe で実際に分離した)
  endpoint 契約 · 入力 materializer · lib_deps 集合 · board registry
  project workspace root · 結果 cache namespace · lock namespace · build flags
  (任意で) build cache dir
```

## 2. pioarduino (裁定 §14)

- 「Classic で採用済み」という事実は維持。本 probe も**同じ pioarduino tag `54.03.21` を使用**した。
- **full-source / multi-file compile との技術的相性: 問題は観測されなかった。** `.cpp` / `.h` / `.ino` の
  いずれの構成でもビルドが通り、`min_spiffs.csv` パーティションと 4 点 artifact も従来どおり得られた。
- **DigiCode Text も pioarduino を採用する、という決定は本 objective では行わない** (裁定 §14)。

## 3. RP2040 (裁定 §15) — 示唆のみ、決定はしない

audit F-3 は「RP2040 削除の真因は Compiler 側 (global `lib_deps`) であって Blockly ではない」と記録した。
本 probe の実測はこれに 2 つの示唆を加える。

1. **Text 経路は独自の `lib_deps` 集合を持てる**ことが実証された。したがって
   「ESP32 専用ライブラリが RP2040 ビルドに混入して落ちる」という削除理由そのものは、
   Text 側の構造では**再現しない可能性がある** (Text は必要な lib だけを入れられるため)。
2. ただし **RP2040 は別 platform (`raspberrypi`) を要する**。現行 image は
   Dockerfile で `raspberrypi` platform の install を**明示的に削除済み** (「DigiCode is ESP32-only」)。
   つまり RP2040 対応は **image を共有する限り image 側の変更**になり、
   ここは Classic と Text が本当に共有している唯一の層に当たる。

→ **示唆:** 「lib_deps の分離だけでは RP2040 は戻らない。image / platform 層の扱いが別途要る。」
**対応の決定は行わない** (裁定 §15)。

## 4. Cloud Compile (裁定 §11)

production Worker は変更していない。donor の Worker コード
(`DigiCode@bb35c3b/compile-proxy-worker/src/index.ts`、137 行) を **isolated に実行**し、
上流 `fetch` を stub に差し替えて挙動を観測した (production へは 1 リクエストも出していない)。

| # | 条件 | 結果 |
|---|---|---|
| 1 | Classic endpoint + 許可 origin | 200 / `ACAO: https://code.fablab-westharima.jp` / 転送先 `https://compile.digital-fab.jp/api/compile` |
| 2 | **新 Text endpoint** `/api/compile/project?fullPackage=true` + 許可 origin | 200 / 転送先 `…/api/compile/project?fullPackage=true` — **query string 込みでそのまま転送された** |
| 3 | 新 Text endpoint + **digicode-text の origin** | 転送はされるが `ACAO` が `https://code.fablab-westharima.jp` になる → **ブラウザが応答を拒否する** |
| 4 | 同 origin からの **OPTIONS preflight** | 204 / `ACAO` は同じく Classic の origin → **preflight 段階で失敗し、POST は送られない** |

### 4.1 結論と、まだ分かっていないこと

| 問い | 回答 |
|---|---|
| Text 専用 route を同 Worker へ**追加**できるか | **route の追加作業は不要**。Worker は `targetBase + url.pathname + url.search` を無条件に転送する path 透過型で、endpoint を増やしても Worker のコードは変わらない |
| **origin だけ追加すればよいのか** | **CORS に関してはそのとおり**。`ALLOWED_ORIGINS` に digicode-text の origin を足す 1 箇所が唯一の必須変更。**ただしそれは Classic 本番 Worker の変更**であり、裁定 §3 の禁止対象 (audit F-6 と同じ結論を、今回は実行して確認した) |
| CORS | 上表 3・4 のとおり、未登録 origin は **preflight で落ちる**。`ALLOWED_ORIGINS[0]` へフォールバックする実装のため、エラーが「CORS 拒否」ではなく「別 origin が許可されている」形で現れる |
| failover | primary (`compile.digital-fab.jp`) → 5xx / 到達不能なら backup (Railway) へ。**Text route も同じ failover に自動的に乗る** (path 透過のため) |
| auth | **無い**。Worker にも compile-api にも認証は存在しない。Text を足しても認証は増えない |
| rate limit | **無い**。許可 origin からの無制限中継 |
| request size 制限 | **Worker のコードには無い**。プラットフォーム側の上限は Cloudflare のプラン依存であり、**本 probe では確認していない → [未verify]** |
| timeout | **Worker のコードには設定が無い**。Cloudflare edge 側のタイムアウトに対しては、compile-api が **SSE + 15 秒 heartbeat** で対処している (donor のコメントに 100 秒 edge timeout と実測経緯が記録されている)。**Text 経路には SSE 版が無い** — probe は同期 POST のみ |

### 4.2 Text 経路を Cloud に乗せる場合に効いてくる実測値

- Text の同期応答は **0.45 MB** (単一ファイル) 〜 **0.47 MB** (5 ファイル)。Classic は **1.85 MB**。
- cold ビルドは Classic で **301 秒**を実測。Text は今回 5〜10 秒だったが、これは
  **image に焼かれた build cache が効いた ESP32 の小さなプロジェクト**での値であり、
  Text の実運用プロジェクトが同じ範囲に収まる保証は無い → [未verify]。
- **同期 POST のままでは、100 秒級の edge timeout に対して Classic と同じ問題を再現する。**
  Text 経路にも SSE 相当が要るかどうかは、Text の実ビルド時間分布が分かってから決まる。

## 5. この章の残 unknown (Acceptance 9)

1. Cloudflare のプラン別 request body 上限・実 timeout 値 — **未測定** (production 非接触のため)
2. 複数プロセス / 複数コンテナ構成での排他 — `projectLock` はプロセス内のみ。**未測定**
3. Text の実運用プロジェクト規模でのビルド時間分布 — **未測定** (probe は小規模 fixture のみ)
4. Local Compiler (`digicode-installer`) 側の配布・更新手順 — **未読** (audit からの持ち越し)
5. オフライン / 校内 LAN 環境での registry 解決 — **未測定**。D-1 は「registry に届く」環境での失敗であり、
   届かない環境の挙動はさらに厳しい可能性がある
6. `build_cache_dir` が VOLUME でないため image 更新でキャッシュが消える件の、Text 運用での影響 — **未測定**
