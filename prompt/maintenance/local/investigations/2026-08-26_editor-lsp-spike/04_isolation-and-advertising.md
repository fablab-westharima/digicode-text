# 04_COOP / COEP / SharedArrayBuffer と広告 — 推測ではなく実測

**裁定 §14 / §15 / Acceptance 9 / 10 に対応。**
**検証の型:** ブラウザ挙動は **real-fire** (Chrome for Testing 148.0.7778.96 を実起動し、
`127.0.0.1` に立てた probe サーバから異なるヘッダで同一ページを配って測った)。
広告側の可否は **Google 公式ドキュメントの記述** = **primary source**。

---

## 0. 結論を先に (S001 の前提が 1 点、実測で覆る)

S001 は「**clangd を WASM でブラウザ内実行する** と **AdSense を出す** は同一ドキュメントでは両立しない可能性が高い」と書いた。
**この判断は COOP/COEP を前提にした限りで正しく、実測でも再現した。**

**しかし 2026-08 時点では第三の道が実在する。**
**`Document-Isolation-Policy` (Chrome 137+ desktop / 146+ Android) を使うと、
非隔離の親ページに広告を置いたまま、iframe の中だけを cross-origin isolated にできる。**
本 spike はこれを**実際に動かして確認した**。

---

## 1. トップレベル文書: どのポリシーが cross-origin isolation を与えるか

| 配信したヘッダ | `crossOriginIsolated` | `typeof SharedArrayBuffer` | `new SharedArrayBuffer(8)` |
|---|---|---|---|
| **何も付けない (negative control)** | **false** | **undefined** | **ReferenceError** |
| `COOP: same-origin` + `COEP: require-corp` | **true** | function | ✅ 成功 |
| `COOP: same-origin` + `COEP: credentialless` | **true** | function | ✅ 成功 |
| `Document-Isolation-Policy: isolate-and-require-corp` | **true** | function | ✅ 成功 |
| `Document-Isolation-Policy: isolate-and-credentialless` | **true** | function | ✅ 成功 |

> **negative control が意味を持つ理由 (rule 04 §absence):** 1 行目でこの計測器は **false / undefined を返せる**。
> したがって以降の true は「検出器が常に true を返しているだけ」ではない。

## 2. emscripten pthreads が実際に要る原始操作は動くか

`SharedArrayBuffer` が取れるだけでは足りない。clangd の WASM ビルドは
`-pthread` + `PTHREAD_POOL_SIZE` (`02` §3、`build.sh` 実読) なので、
**Worker 内のブロッキング `Atomics.wait` と、スレッド間で見える共有メモリ書き込み**が要る。

| 条件 | SAB 確保 | Worker 内 `Atomics.wait` | 共有メモリの書込みがメインから見えるか |
|---|---|---|---|
| ヘッダなし (negative control) | ❌ ReferenceError | 到達せず | 到達せず |
| DIP `isolate-and-credentialless` (トップレベル) | ✅ | ✅ `timed-out` を返した = **実際にブロックして待った** | ✅ `4242` を読めた |
| DIP `isolate-and-require-corp` (トップレベル) | ✅ | ✅ | ✅ `4242` |
| **非隔離の親 → DIP `credentialless` の iframe** | ✅ | ✅ | ✅ `4242` |
| **非隔離の親 → DIP `require-corp` の iframe** | ✅ | ✅ | ✅ `4242` |

**= emscripten pthreads が要求する原始操作は、非隔離の親の中の DIP iframe でも成立する。**

> この項目は一度**私の probe のバグで測れていなかった** (Worker ソースの `<script>` 順序、`01` §6 P-1)。
> 修正前は他項目だけ緑に見えていた。上表は**修正後**の値である。

## 3. 🔴 決定的: 非隔離の親 + 隔離した iframe + 広告技術

親ページ (広告が載る側) にヘッダを一切付けず、iframe (エディタが載る側) だけを隔離し、
**親に third-party のスクリプトと画像を実際に読ませた**。

| 構成 | 親 `crossOriginIsolated` | **iframe `crossOriginIsolated`** | iframe の SAB | 親の third-party `<img>` (google.com) | 親の third-party `<script>` (googletagmanager.com) |
|---|---|---|---|---|---|
| 親=なし, 子=**DIP credentialless** | false | **✅ true** | ✅ 使える | **✅ LOADED** | **✅ LOADED** |
| 親=なし, 子=**DIP require-corp** | false | **✅ true** | ✅ 使える | **✅ LOADED** | **✅ LOADED** |
| 親=なし, 子=COOP+COEP | false | **❌ false** | ❌ undefined | ✅ LOADED | ✅ LOADED |
| 親=なし, 子=COOP+COEP + `allow="cross-origin-isolated"` | false | **❌ false** | ❌ undefined | ✅ LOADED | ✅ LOADED |

**読み取れること:**

1. 🔴 **COOP/COEP 方式では、親が隔離されていない限り iframe は隔離されない。**
   `allow="cross-origin-isolated"` を付けても変わらなかった。
   これは clangd-in-browser の `docs/embed.md` の記述
   (「your host server's COOP/COEP headers を設定し、`allow="cross-origin-isolated"` が要る」) と整合する。
   **つまり「広告は親、エディタは iframe」という逃げ方は COOP/COEP では成立しない。**
2. 🔴 **DIP 方式では成立する。** 親は非隔離のまま、iframe だけが `crossOriginIsolated: true` になり、
   **親の third-party スクリプト / 画像は普通に読み込まれた。**
3. 隔離された文書の**内側**からでも、cross-origin の `fetch(mode:'no-cors')` は `opaque` で成功し、
   cross-origin の `<img>` も LOADED になった (4 構成すべて)。

## 4. 広告側の一次情報 (Google 公式)

**Google Publisher Tag 公式ドキュメント "Configure a Cross-Origin Embedder Policy" の記述:**

> **"The Google Publisher Tag (GPT) does not yet support pages served with this restriction."**
>
> "Displaying ads requires embedding cross-origin content, and COEP requires that content to explicitly opt in to cross-origin embedding." — 「Google が配信するものも third-party が配信するものも、**すべての広告のすべてのリソースに変更が要る**」
>
> "publishers affected by Chrome's SharedArrayBuffer deprecation opt their site out by applying for the reverse Origin Trial **until Chrome supports combining COEP with ads**."
>
> 将来については "we intend to ensure GPT supports COEP pages"。

**= COEP を付けたドキュメントに GPT を載せることは、2026-08 時点で公式に未サポート。**
これは推測ではなく Google の記述である。

**しかし §3 の実測により、この制約は「広告を載せる文書に COEP を付けなければ回避できる」。**
DIP は COEP ではないので、**親ページに COEP は付かない**。

## 5. Amazon Affiliate / donation / 外部 API キー通信への影響

| 対象 | 実測 / 判断 |
|---|---|
| **Amazon Affiliate の通常リンク** | ただの `<a href>`。**隔離とは無関係**。§3 で親は非隔離のまま。影響なし |
| **アフィリエイトのバナー画像 (cross-origin `<img>`)** | 親 (非隔離) では当然 LOADED。**隔離文書の内側でも LOADED だった** (§3) |
| **donation ウィジェット (Stripe / PayPal 等の third-party script)** | 親ページに置く限り制約を受けない。**隔離文書の中に置くのは避ける**べき (COEP require-corp 相当の制約が内側にはかかる) |
| **外部 AI provider への API キー通信** | donor 実測 (S001) では「ブラウザから provider を直接叩く」設計。これは `fetch` であり、**CORS が通れば隔離下でも動く**。ただし `isolate-and-credentialless` では **cross-origin リクエストから credential が外れる**ので、**Cookie 認証に依存する外部サービスは壊れる**。API キーを `Authorization` ヘッダで送る方式は影響を受けない → **donor の AI 方式は隔離下でも成立する側** |
| **YouTube 埋め込み / Google Sign-In** | 隔離文書の内側に置くと COEP 相当の制約を受ける。**親側に置けば無関係** = `NOT OBTAINED` (本 spike では実測していない) |

## 6. Document-Isolation-Policy の対応状況 (chromestatus 一次情報)

| | 値 |
|---|---|
| 仕様 | `https://wicg.github.io/document-isolation-policy` (WICG) |
| **Chrome desktop** | **137** |
| Chrome Android | 146 |
| Chrome 上のステータス | "In development" |
| **Firefox** | **Positive** (mozilla/standards-positions#1074) |
| **Safari (WebKit)** | **Negative** — 「低スペック Android で crossOriginIsolation 依存 API を出さない初版設計を懸念。その計画は改訂済み」との注記付き (WebKit/standards-positions#399) |

**本 spike の実測ブラウザは Chrome for Testing 148 で、DIP は実際に効いた** (§1〜§3)。

> **baton 13 との関係:** digicode-text の初期最優先は Chrome / Edge (Chromium)。
> DIP は Chromium で動く。**Safari は Negative** だが、そもそも Safari には Web Serial も Web Bluetooth も無く
> (S001 実測)、初期対応外という既定方針と矛盾しない。**Firefox は Positive** なので中期的な芽はある。
> ただし **DIP に依存する構成は「Chromium 前提」を製品仕様に固定する**ことを意味する。これは Human 判断事項。

## 7. この節が Architecture 判断に渡す事実

1. **browser-side clangd WASM は SharedArrayBuffer を本当に必要とする** (ビルドフラグ実読 + 実測)。回避不能。
2. **COOP/COEP を選ぶと、その文書に GPT 広告は載せられない** (Google 公式)。iframe への逃げも効かない (実測)。
3. **DIP を選ぶと、広告を載せる親を非隔離に保ったまま iframe だけ隔離でき、広告も普通に読み込まれた** (実測)。
4. **ただし DIP は Chromium 前提**であり、Safari は Negative。製品の browser matrix を Chromium に固定する判断とセット。
5. **server-side LSP を選べば、この論点は丸ごと発生しない** — SharedArrayBuffer が要らないので隔離自体が不要。
   **「広告と semantic 解析の緊張」は browser-side WASM を選んだ場合にだけ生じる制約である。**
