# 02_HTTPS Web アプリ → localhost Helper は Extension 無しで成立するか

**Acceptance 1 / 8 に対応。裁定 §3 / §15 の第一候補そのもの。**
**検証の型: real-fire** — Chrome for Testing **148.0.7778.96** を実起動し、
自己署名証明書の SPKI を許可して **本物の secure context** を作り、
`127.0.0.1` に立てた Helper へ実際に fetch / WebSocket を張って測った。
仕様は **WICG / chromestatus の一次情報**で裏を取った。

---

## 0. 結論

**成立する。ただし条件が 3 つあり、そのうち 1 つは利用者の許可操作 1 回である。**

| 条件 | 必須度 |
|---|---|
| ① Web アプリが **HTTPS (secure context)** で配信されていること | 🔴 必須。HTTP では permission が `denied` に固定され、回避手段がない |
| ② 利用者が **Local Network Access の許可**をブラウザに与えること | 🔴 必須。未許可だと fetch も WebSocket も**ブラウザ側でブロックされ、Helper には 1 バイトも届かない** |
| ③ Helper 側が **Origin 検証 + token 検証**を自分で行うこと | 🔴 必須。WebSocket には CORS が無いため、ブラウザは守ってくれない |

---

## 1. 何を測ったか (測定の忠実性)

**本番と同じ状況を作らなければ測ったことにならない。** DigiCode Text は Cloudflare 等から
**public IP address space** で配信される。ローカルで `https://localhost` を測っても、
それは **loopback → loopback** であって本番とは別の分類になる。

そこで **`Content-Security-Policy: treat-as-public-address`** を使い、
ページを **public address space に属すると宣言**させた。これは Private / Local Network Access を
デプロイ無しに試験するための、仕様が用意している経路である。

| 配信 | 実 origin | secure context | address space |
|---|---|---|---|
| A | `https://<LAN-IP>:8443/app` | ✅ true | private |
| B | `https://<LAN-IP>:8443/app-public` (+CSP) | ✅ true | **public ← 本番相当** |
| C | `http://<LAN-IP>:8442/app` | ❌ false | private |
| D | `http://<LAN-IP>:8442/app-public` (+CSP) | ❌ false | public |

## 2. 🔴 実測結果 — permission の有無を A/B 対照にした

Helper は `http://127.0.0.1:8771`(loopback のみ bind)。

### 許可なし (`local-network-access` = `prompt`、既定状態)

| 配信 | `fetch` → loopback | `ws://` → loopback | Helper に届いたか |
|---|---|---|---|
| A (https / private) | ✅ **200**, 4.0 ms | ✅ **open**, 5.1 ms | 届いた |
| **B (https / public ← 本番相当)** | 🔴 **ブロック** | 🔴 **ブロック** | **1 バイトも届かない** |
| C (http / private) | ✅ 200 | ✅ open | 届いた |
| D (http / public) | 🔴 ブロック | 🔴 ブロック | 届かない |

B のコンソール実文言: `blocked by CORS policy: **Permission was denied for this request**`
D のコンソール実文言: `blocked by CORS policy: **The request client is not a secure context**`

### 許可あり (`local-network-access` = `granted`)

| 配信 | `fetch` → loopback | `ws://` → loopback |
|---|---|---|
| A (https / private) | ✅ 200, 2.9 ms | ✅ open, 5.1 ms |
| **B (https / public ← 本番相当)** | ✅ **200, 4.0 ms** | ✅ **open, 2.3 ms** |
| C / D (http) | permission が **`denied` に固定**され、許可できない | 同左 |

**`navigator.permissions.query({name:'local-network-access'})` の実測値:**
HTTPS origin では **`"prompt"`**、HTTP origin では **`"denied"`**。
= **利用者に提示される本物の permission であり、HTTPS が前提**。

> **negative control の意味 (rule 04 §absence):** 「許可なしの B」で **ブロックされる**ことを先に示した。
> したがって「許可ありの B で通った」は、検出器が常に通すだけの結果ではない。
> Helper のログにも B の未許可時は **1 行も記録が残らない**ことを確認している。

### mixed content について

🟢 **`https://` ページから `http://127.0.0.1` / `ws://127.0.0.1` は mixed content として遮断されない。**
loopback は potentially trustworthy として扱われる。**遮断していたのは mixed content ではなく
Local Network Access permission である** — この 2 つは混同されやすいので分けて記録する。

## 3. 一次情報による裏取り

**WICG "Local Network Access" 仕様** (`https://wicg.github.io/local-network-access`):

> Abstract: **"Restrict access to the users' local network with a new permission"**

目次に **"Local Network Request Permission Prompt" / "Secure Context Restriction" / "Mixed Content" /
"Integration with WebSockets"** が並ぶ。実測はこの構造とそのまま一致した。

**chromestatus (一次):**

| feature | Chrome desktop | 状態 |
|---|---|---|
| Local network access restrictions | **142** | In development |
| **Local network access restrictions for WebSockets** | **147** | Proposed |
| Local network access restrictions for WebTransport | 147 | Proposed |
| Local Network Access split permissions | 145 | Proposed |
| `targetAddressSpace` option for WebSockets | 154 | Proposed |

本 probe のブラウザは **148** なので、fetch と WebSocket の両方に規制がかかる版であり、実測と一致する。

**Firefox:** Mozilla の standards-positions 注記に **「Firefox is shipping LNA」** とある。
= これは Chrome 固有の癖ではなく、**web platform の方向**である。
→ **permission 前提で設計するのが、長期的に正しい側**。

## 4. Helper 側の防御 — ブラウザは守ってくれない部分

**WebSocket には CORS が無い。** したがって Origin 検証は **Helper 自身が行う以外にない**。
probe Helper に実装し、**攻撃者オリジンで実際に叩いて**確認した。

### `GET /discover` の Origin 真理値表 (curl = ブラウザ外の任意クライアント)

| 送った Origin | 応答 |
|---|---|
| `https://evil.example.com` | **403** |
| `http://localhost:3000` | **403** |
| `null` | **403** |
| **`https://<LAN-IP>:8443` (許可リスト)** | **200** |
| Origin ヘッダ無し | **403** |

### WebSocket upgrade

| Origin | token | 結果 |
|---|---|---|
| `https://evil.example.com` | 正しい | 🔴 **REFUSED 403** |
| 許可リスト | 誤り | 🔴 **REFUSED 401** |
| 許可リスト | 正しい | ✅ **OPENED** |

### 🔴 CSRF / no-cors の残余リスク (実測で見えたもの)

`fetch(..., {mode:'no-cors'})` は **Origin ヘッダを付けずに届く**。
実測でも Helper のログに `discover REFUSED origin= undefined` が残り、
呼び出し側には `type: "opaque"` としか見えなかった。

🔴 **つまり「レスポンスを読めない」ことと「リクエストが実行されない」ことは別である。**
→ **Helper の副作用のあるエンドポイントは、GET にしてはならず、
Origin が無い / 一致しないリクエストは実行前に拒否しなければならない。**
probe Helper はこの形で実装してあり、`/discover` 以外に無認証エンドポイントを持たない。

### DNS rebinding

攻撃者が DNS を書き換えて自分のページから `127.0.0.1` を指しても、**Origin は攻撃者のもの**になる。
上表のとおり **Origin 検証だけで拒否される**。追加の定石として `Host` ヘッダ検証も可能
(本 probe では未実装 = `NOT OBTAINED`)。

### bind アドレス

probe Helper は **`127.0.0.1` のみに bind**。実測で確認:

```
via LAN IP <LAN-IP>:8771 -> 000 (refused/unreachable)
lsof: TCP 127.0.0.1:8771 (LISTEN)
```

🔴 **これは重要な設計点で、既存 donor Helper は `0.0.0.0` に bind している** (`03` §2)。
LSP Helper は利用者のソースコードを扱うため、**LAN 露出は避けるべき**。

## 5. 通信方式の比較

| 方式 | 成立 | 所見 |
|---|---|---|
| **localhost HTTP (`http://127.0.0.1`)** | ✅ 実測成立 | mixed content にならない。**証明書不要**。discovery に最適 |
| **localhost WebSocket (`ws://127.0.0.1`)** | ✅ 実測成立 | LSP の全二重に必要。**CORS が無いので Origin 検証は自前** |
| localhost HTTPS (`https://127.0.0.1`) | 🔴 非推奨 | 公開 CA 証明書を localhost に発行できない。自己署名は利用者に警告を出させることになる。**loopback は既に trustworthy なので利益がない** |
| secure WebSocket (`wss://127.0.0.1`) | 🔴 同上 | 同じ理由 |
| Chrome Extension + Native Messaging | 別案 | `06` §3 で比較 |

**→ localhost HTTP (discovery) + localhost WebSocket (LSP) の組み合わせが、実測上そのまま成立する。**

## 6. この節が渡す事実

1. **Extension 無し・Helper 1 個で成立する。** 裁定 §15 の第一優先は実測上生き残った。
2. **代償は「利用者のブラウザ許可 1 回」と「HTTPS 配信」の 2 点だけ。**
3. **Helper 側に Origin 検証 + token が必須。** ブラウザは WebSocket を守らない。
4. **loopback のみに bind すべき。** donor Helper の `0.0.0.0` はそのまま真似してはならない。
5. **permission は Chrome だけの話ではない** — Firefox も shipping。設計を permission 前提にすることは、
   将来の他ブラウザ対応とも整合する。
