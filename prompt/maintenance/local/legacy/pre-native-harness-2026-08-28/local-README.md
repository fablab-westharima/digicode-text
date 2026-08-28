# local/ — プロジェクト固有層の運用標準

**この構造はテンプレート標準であり、プロジェクトごとに変えない。** どのプロジェクトを開いても local/ が同じ形をしていること自体が価値(人も Claude Code も横断的に読める)。フォルダの増減・改名をしたくなったら、まず `global/rules/common/15-docs-organization.md` の decision tree を読み、それでも必要なら user 承認を得て、テンプレート側(全プロジェクト)に反映する。

## 構成と命名規則

| パス | 用途 | 命名規則 |
|---|---|---|
| `rules/digicode-text/` | プロジェクト固有ルール | `NN-topic.md` 連番。format は `global/templates/rule-template.md` 準拠。新設時は `global/rules/README.md` の decision tree に行を追加 |
| `docs/` | システム概要・デプロイ手順・トラブルシューティング等の永続ドキュメント。**業務ドメイン知識ベース(一次情報: 外部仕様・データ契約・元資料)もここ**(origin: ouen-plus の会計知識ベース)。親プロジェクトから受け取った reference-spec(下記 §親→子の知見移植)もここに置く | `NN_タイトル.md`(00 = マスターガイド推奨)、ドメイン知識はサブフォルダ可 |
| `handover/` | セッション引き継ぎ 3 ファイル(下記) | 固定名。毎セッション close 時に更新 |
| `bugs/active/` → `bugs/closed/` | バグ管理 | `YYYY-MM-DD_NNN_category_slug.md`。close = **ファイルを closed/ へ物理移動**(ファイル名は発見時のまま維持 = ID 再利用防止)。各フォルダの `index.md` を同時更新 |
| `plans/active/` → `plans/completed/` | 計画管理 | `NN_slug.md`(NN = 起案順通し番号)。大型計画はサブディレクトリ化。完走で completed/ へ移動、supersede は `_superseded` サフィックス |
| `investigations/` | 監査・調査記録 | `YYYY-MM-DD_slug.md`。bug / plan 起案の evidence ベース |
| `reviews/` | REVIEWER セッションの review report(リレー運用のバトン — rule 22 §Review-report baton) | `YYYY-MM-DD_review-{対象セッションID}.md`。様式 = `global/templates/review-report-template.md`。**commit 対象**(監査記録と同様、揮発させない — 2026-08-18 user 裁定)。次の PRIMARY(修正)セッションは最新 report を §0 必読に準じて読む |
| `legacy/` | 旧版ドキュメント(歴史保存) | 移動時にヘッダへ tombstone バナー「⚠️ Superseded by <後継パス> + 相対参照は古い可能性あり」を必ず記載(削除はしない)。親プロジェクト固有ルールを継承した場合も active にせずここへ read-only 隔離(origin: fabcanvas の archive/digicode-rules パターン) |

**maintenance/ 直下および local/ 直下への新規ファイル作成は禁止**(この README は例外)。必ず上記サブフォルダのいずれかに置く。迷ったら rule 15 の decision tree。

## handover/ の役割分担(現在地 1 + 履歴 N + 索引 1 + 地図 1)

```
16_次セッション引き継ぎ指示書.md   = 現在地の router 兼 mandatory owner(常に上書き。hook が全文注入する唯一の入口)
batons.md                         = baton の本文と根拠(conditional。16.md §2 は stub + Status/Trigger/Owner/Sev)
evidence-map.md                   = evidence owner と読解順序・donor SHA・外部一次資料の所在・loop position
                                    ・Project_Template feedback queue(conditional)
sessions/S{NNN}_{日付}_{slug}.md  = 何を・なぜやったか(1 セッション = 1 ファイル、close 後は不変)
改定log.md                        = sessions/ の索引(1 セッション = 1 行、末尾追記のみ)
maintenance_index.md              = どこに何があるか(静的な地図、構造変更時のみ更新)
```

**この 3 ファイルが current-state owner set である**(2026-08-27 S008 で §OPTIONAL CAPABILITY を発動)。
read class(どれが無条件でどれが条件付きか)の owner は `CLAUDE.md` §0 であり、ここには書き写さない。

- **現在地は単一・履歴は分散**が原則(2026-07-07 確立)。16.md は「何が起きたか」を語らず、**現在成立している事実だけ**を持ち、経緯は「詳細は S{NNN}」と委譲する。同じ詳細を 16.md と session file の両方に書かない — それは一つの事実に二人の owner を置くことであり、片方が必ず古くなる(`global/rules/README.md` §Single source of truth)。

### 16.md の大きさ — 行数の hard limit は廃止(2026-08-25 user 裁定 N-5)

**この節が行数規約の唯一の owner。** 他のどのファイル(close.md・16.md 自身・CLAUDE.md)にも行数を書き写さない。

- 旧規約 `≤100行, strict` は **廃止**。導出根拠が repo に無く、どの検査にも実装されていなかった一方で、**内容を実際に整形していた**: 本 repo の 16.md 全 37 revision を実測(2026-08-25)すると 67〜100 行に分布し、**2026-08-16 に 3 revision 連続でちょうど 100 行**に着地している。自由に伸びる文書が上限へぴったり並ぶことはない — 上限に合わせて削られていたということ。
- **別の行数値で置き換えない。** 行は実コストの代理量として 3.32 倍ぶれる(case PT-10)。大きさの signal は既に実資源の単位で存在する — `scripts/read-load.sh` の `BUDGET_STATUS` は 16.md を含む必読集合を token で測り、**gate ではなく構造シグナル**として通知する。行数の上限を再導入すると、その 2 つが別方向を指す。
- **長さを理由に削ってはいけないもの**(超過は「削れ」ではなく「重複がある / 事実の置き場所が間違っている / 独立した authority domain が生まれた」を疑う合図):Human baton / current authority pointer / OPEN・HOLD / superseded 関係 / current baseline / pending Human GO / `PRIMARY_OBJECTIVE` state / deferred の trigger / current generation。

### sessions/ の契約 — 生成する・保存する・current authority にしない(2026-08-25 user 裁定 N-α)

**この節が session history の役割の唯一の owner。** 必読集合の契約そのものは `CLAUDE.md` §0 が owner なので、ここには書き写さない。

| 義務 | 内容 |
|---|---|
| **生成する** | 1 セッション = 1 ファイル。close の 3 点セットの一部であり、廃止しない。selftest B52 は 16.md の `GEN` を最新 `sessions/` ファイルと突き合わせるので、生成が止まれば赤になる |
| **保存する** | close 後は **immutable**。過去の記述が現在と食い違っても、session file を書き換えて辻褄を合わせない — 食い違いは 16.md 側で supersede する |
| **current authority にしない** | 「次に何をするか」を session file から読まない。その事実の owner は 16.md §1/§2。過去 session の `next` は**当時の予定**であって現在の指示ではない |
| **無条件必読にしない** | 2026-08-25 裁定 N-α。読むのは `CLAUDE.md` §0 が列挙する trigger が発火したときだけで、「念のため」は trigger ではない |
| **必要時に到達する** | 到達路は 3 本: 16.md §1「Where the rest lives」/ `改定log.md`(1 セッション 1 行の索引)/ `global/rules/README.md` decision tree の historical-why 行。**最新とは限らない** — 探すのは主題であって新しさではない |

**History is not current state**(Phase 2 で確立)を弱めるのは、履歴を消すことではなく**履歴を毎回読ませること**でもある: 現在地が復元できるかを試さないまま「念のため」を積むと、16.md が痩せても誰も気づかない。実測(2026-08-25、13/13 ファイル)では最新 session file は 341〜10,294 token に散り、無条件必読集合の大きさが**前任者の筆の長さだけ**で決まっていた。

### OPTIONAL CAPABILITY — current owner の topic 分割 — **本 project では 2026-08-27 に発動済み**

**既定は単一 owner(16.md)。** プロジェクトが**実際に独立した authority domain を複数持つ**場合に限り、current state を topic 別の canonical owner へ分割してよい。分割は目的ではなく、authority 境界が実在するときだけの手段。

- 固定の topic 名をテンプレートが決めることはしない(参照実装の topic 名をコピーしない)。domain 名はそのプロジェクトが決める。
- 分割する場合に**同時に負う義務**: ① close の同一 commit で全 topic file を更新する ② `handover-diff.sh` が全 topic file を走査対象にする(現行は単一 file・分母を印字)③ 各 topic file の generation が router の宣言と一致すること。
- 分割の危険: 単一 file の stale は比較で見つかるが、**分割後は各 file が内部的に整合して見えるぶん、file の「あいだ」で落ちた事実が静かになる**。義務 ①〜③ はその相殺であって装飾ではない。
- N=1 のプロジェクト(bootstrap 直後は必ずこれ)では分割しない — 儀式だけが残る。

**digicode-text での発動記録(2026-08-27, S008 — Human GO 済みの harness maintenance objective)。**
分割は「16.md を短くするため」ではなく、**authority domain と update trigger が実際に分かれていたため**に行った。
実測(`investigations/2026-08-27_handover-architecture/` の 3 レポート)が支えた 3 点:

1. **素朴な 4-owner 分割はコスト増だった。** 全 owner を無条件のままにすると owner shell だけで下限 +1,512 tok。
   **無条件の topic を分割することは純損である** — 得になるのは条件付きにできる topic を出すときだけ。
2. **§3 の Human ruling 39 本は 1 本も条件付きにしない。** Human 指示の安全条件(「条件付き化によって
   Human ruling を読み落とす危険が増えるなら採用しない」)がそのまま拘束する。
3. **測定時点の baton 45 件中、0 件が本文無条件・31 件が stub 前提で条件付き可・14 件が trigger のみで可。**
   (現在件数はここに書かない — `selftest` B71 が印字する。)
   したがって **stub は装飾ではなく分割の成立条件そのもの**。stub を削れば分割は不正になる。

義務 ①②③ の履行状況: ① `/close` が owner set 全体を同一 commit で更新する(close.md step 3)
② `handover-diff.sh` が 3 owner を走査し per-owner 分母を印字する(検出力は fixture で確認済み)
③ GEN 一致は selftest **B70** が検査する。加えて **B69** が hook の全量注入を、**B71** が
「stub と本文の対応」を検査する。**この 3 つが無い状態の分割は、義務を書いただけの分割である。**
- **履歴を単一ファイルに蓄積しない**。起源プロジェクトでは単一の改定log が 4,600 行超になり、3分割アーカイブという追加メンテ機構と、追記時の大ファイル操作コスト(Edit のアンカー照合が危険になり script 頼みになる)を生んだ。per-session 分散ならアーカイブ運用が不要で、「最新 entry を読む」= 小さい 1 ファイルで済む。
- ファイル名の「16」は起源プロジェクト(DigiCode)の通し番号の名残だが、ルール群・テンプレート中の相互参照(「16.md」)を壊さないため、および全プロジェクトで同名になる統一効果のため、**固有名詞としてそのまま使う**。

## ライフサイクルの原則

1. **状態はディレクトリで表現する**(active ⇄ closed / active → completed)。frontmatter の status とフォルダ位置を常に一致させる。
2. **「実装完了」≠ close**。Claude Code 側の完了条件(テスト・静的ゲート)と人間側の検証(実環境確認)を分離し、後者が済むまで active に維持する。
3. **index.md は移動と同一タイミングで更新**する(bugs の運用ルールは各 index.md 冒頭に記載)。
4. 新しい教訓は memory → `judgment-mistakes-history.md` の case → rule 昇格のパイプラインに乗せる(`global/rules/README.md` §Memory vs. Rules)。**case/rule の追記は incident が起きたセッション内で完了させる** — 先送りされた case・rule は書かれない(第2世代プロジェクト2件で追記実績 0 の実測)。
5. **prompt/ 配下のどのドキュメントにも本番シークレット・トークン・APIキーを平文で書かない**。`.env` や secret store への参照に留める(origin: 姉妹プロジェクトで gitignore に守られただけの平文トークン記載が実在した)。

## 既知の失敗モード(第2世代プロジェクト2件の実測に基づく)

handover は放置するとこうドリフトする — セッション close 時に3点セット(16.md 全面更新 / sessions/ ファイル作成+索引1行 / index 更新)を**同一タイミングの定型手順**として実行することが唯一の対策(この手順は `/close` カスタムコマンドに固定済み — close は一言で走らせる):

- 履歴の記録が Session 2 で更新停止し、以後 narrative が失われる(fabcanvas の改定log)。per-session 分散は「小さい1ファイルを書くだけ」なので継続コストが低く、この停止を起こしにくい
- maintenance_index が stale 化し、地図が現実とズレる(fabcanvas)
- **現在地ファイル(16.md)を複製して新番号ファイルを作ってしまう**(fabcanvas: 17.md…31.md、セッション番号と +15 ズレて混乱)。16.md は固有名詞であり常に上書き更新 — SessionStart hook は固定名 16.md を注入する前提なので、崩すと自動コールドスタートも壊れる。**過去の詳細は sessions/ のセッションファイルへ**(fabcanvas の教訓の正確な読み: 失敗だったのは「現在地の複製」であって、履歴の per-session 分散自体はむしろ優れており 2026-07-07 に正式採用した)

## 親→子の知見移植(reference-spec パターン、origin: DigiCode→fabcanvas)

実戦投入済みのサブシステム(i18n・認証・課金等)を持つ親プロジェクトから新プロジェクトを始めるときは、**親側の Claude に「reference-spec」を書かせて持ち込む**: ソースコードではなく構造・パターン・教訓・severity 付き推奨実装順序のみを抽出した移植仕様書(ソース非添付なので親のライセンス汚染を回避できる)。親側は `prompt/exports/` に出力し、子側は `local/docs/` に置いて実装の一次参照にする。
