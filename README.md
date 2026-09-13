# digicode-text

ブラウザで **通常のテキストコード**(`main.cpp`)を編集し、専用 compiler でマイコン向けに build し、実機へ書き込む Web アプリケーション。ブロックエディタではない。既存 DigiCode(Blockly 版)とは独立した新規プロジェクトで、fork ではない。license は AGPL-3.0。

## 今動くもの

- `compiler/pio-rp2040/` — project 専用の PlatformIO project。XIAO RP2040(community platform + earlephilhower core)と Raspberry Pi Pico(公式 platform)で "hello" を Serial に出す `main.cpp` が build でき、`firmware.uf2` が生成される。global な lib_deps は無い。
- `compiler/server.mjs` — 依存ゼロの Node サーバ。`POST /compile` に `{env, source, libraries, projectId, projectRevision}` を送ると RP2040は`.uf2`、C3はBINセットZIPを返す(compile 失敗は 422 + log)。`GET /` で `web/index.html` を配信。
- `web/` — Monaco Editor(C++、行番号、自動インデント、Undo/Redo) + 名前付きプロジェクト管理・ブラウザ内自動保存・JSON入出力 + Build + UF2／BINセットのダウンロード + Web Serial monitor(Raspberry Pi VID 0x2e8a でフィルタ)。

### 動かし方

```
# 前提: Node 20 以上、PlatformIO Core(~/.local/bin/pio)
npm ci                          # 固定依存をproject内に取得（初回はnetworkが必要）
npm run build:web               # Monaco・Worker・CSSをローカル配信用に生成
npm start                       # http://127.0.0.1:3100
```

Chromeで開き、コードを編集してBuildを押し、成功後に「UF2 ダウンロード」（RP2040）または「BINセット ダウンロード」（C3）をクリックする。
上部の「ファイル」を押すと直下に縦型メニューが開く。新規プロジェクト・プロジェクトを開く・名前変更・複製・ファイル入出力・削除をまとめて操作できる。上下キーで移動、Enterで選択、Escapeやメニュー外クリックで閉じる。各プロジェクトは固有IDと単一main.cpp・board・外部ライブラリ設定・作成/更新日時を持つ。同名でも別IDとして保持する。コード・board・ライブラリは変更ごとにこのブラウザのlocalStorageへ同期保存し、再読み込みで最後に開いたプロジェクトを復元する（空コードも保存）。保存できない場合は画面に表示し、編集・Build・現在の内容のJSON書き出しは継続できる。未保存内容を捨てないよう切り替え・新規作成などは停止する。保存失敗時だけ保存状態の横に現れる「再試行」で保存を試せる。保存は同じブラウザ・同じorigin専用なので、`http://127.0.0.1:3100`を継続して使う。ブラウザデータを削除すると保存内容も消える。
保存キーは `digicode-text.projects.v1`。旧 `digicode-text.draft.v1` は初回に「引き継いだ下書き」へ移行し、新保存が成功した後は新キーを正本にする。旧キーは復旧用に保持し、不正データは上書きせず通知する。Web Locksで最初のタブだけに保存を許可し、別タブは編集のメモリ保持・書き出しが可能。別タブの内容を退避してから、他のタブを閉じて再読み込みすると保存を再開できる。ロック非対応時も安全のため保存を停止する。

「ファイル」内の「ファイルへ書き出す」「ファイルから読み込む…」は1プロジェクトのJSON（`format: "digicode-text-project"`, `version: 1`, `name`, `source`, `env`, `libraries`）。読み込みは必ず新IDで追加する。名前は空白だけを除く1〜80文字、読み込みファイルは2 MiB・コードは1 MiBまでで、型・board・版を検証する。同期・バックアップではないので必要な内容はファイルへ退避する。Build APIは従来の要求サイズ上限（約256 KiB）のまま。

画面とMonacoはダーク固定。OS設定や以前のテーマ保存値には影響されない。下部のビルド結果・シリアルパネルはタブで切り替え、開閉できる。上端をドラッグ、または高さ調整部分へTabで移動して上下矢印キー（Home/Endで最小/最大）で高さを調整できる。シリアルタブの表示だけでは接続しない。ビルド失敗時は結果パネルを開き、最初のエラーへスクロールする。ログは横・縦スクロールとコピーが可能。

コード・board・ライブラリの変更で以前の成果物リンクは無効になる。Build途中の変更があった場合は成果物を破棄し、再Buildを案内する。

Monaco `0.53.0`、esbuild `0.28.2`を固定し、lockfileを使用する。実行時CDNは使わない。フロントエンド変更後は`npm run build:web`を再実行する。サーバーはNode標準機能のみで動作する。停止は起動したターミナルでCtrl-C。

ブラウザ検証はPlaywright `1.63.0`とインストール済みGoogle Chromeで、サーバー起動後に`npm run test:browser`。独立したブラウザコンテキストを使い、普段のChromeの保存内容には触れない。実コンパイルは要求ごとの一時ディレクトリを使い、テンプレートのmain.cppを変更しない。実Buildテストは時間がかかるため、HumanのBuildと同時には実行しない。

USB・実機操作は別途Humanの明示許可が必要。実機書き込み・hello表示・Serial monitorの実機確認は未完了。

## まだ無いもの

実機書き込みの確認、C3以外のESP32追加、esptool-jsによるブラウザ書き込み、device、Docker 化、認証、複数ユーザー対応。

## AI開発支援

上部「AI支援」から会話を開き、「API設定」でOpenAI／Claudeの利用者APIキーとモデルを設定する。候補モデルは対応API方式を自動設定する。自由入力モデルとAPI方式は「詳細設定」にまとめ、接続方式の短い説明とクリック・キーボード・タッチ対応のⓘを用意した。既存の候補外モデル／保存キー／API方式を保持する。設定編集中は実行設定へ反映せず、「保存して閉じる」で提供元別にブラウザ保存、「保存せず使う」で選択中の提供元をページ内だけで使用する。閉じる／Escapeでは編集を破棄する。キー削除は即時の独立操作で、閉じても復元しない。保存失敗は表示し、設定画面を開いたままにする。保存は暗号化保管ではない。

送信操作は共通の「↑」（名前は「送信」）に一本化した。送信モードの選択はなく、メッセージと会話からAIが回答／コード変更を判断する。明確な変更依頼には対応し、曖昧な意図だけ確認する。「例だけ」「まだ適用しない」は回答として扱うよう指示する。入力欄の「コード変更時」で自動適用／確認して適用を選べる。自動適用が初期値で、保存済み適用モードを復元する。Enterで送信、Shift＋Enterで改行。IME確定Enter・キーリピート・要求中の重複送信を抑止する。失敗／中止では入力を残し、成功時も待機中に書いた次の文章は消さない。

「Buildエラーを含めて送信」は説明・変更依頼のどちらでも使え、現在のコード・ボード・依存に一致するBuild失敗があるときだけ選択可能。編集・切替・新Buildで無効化するとチェックも解除する。空文は送らない。「AIに送る内容を確認」で選択されたログとコンテキストを確認できる。要求時に適用モード・添付を固定し、待機中の選択変更では適用方法を変えない。既存のsnapshot照合、差分、Undo／Redo、保存失敗時の保持と成果物無効化を維持する。

会話は入力欄の上に常時表示し、利用者とAIを区別する。古い発言を読んでいる間は強制スクロールせず、「最新へ」で末尾へ移動できる。「会話を消去」は表示中のプロジェクト／提供元の会話だけを消し、コード・API設定を消さない。表示履歴は最大20対象、各12往復・512 Ki文字、API再送履歴は最大12往復・32,000文字で別に管理する。表示には回答全文を残し、再送時だけ過去のコードブロックを省略する。メモリ上限の省略は表示する。

文章はUIフォント、コードは等幅フォントで表示。`markdown-it 15.0.2`をローカルバンドルし、見出し・リスト・インラインコード・コードブロックを表示する。raw HTMLは無効、画像は説明文字列のみ、リンクはhttp/httpsだけ許可し、明示操作で別タブを開く。CDNや外部画像を自動取得しない。表示の安全性を手製の正規表現サニタイザーには依存しない。

回答は通常テキストとして受けたJSONの `kind`（`answer`／`change`）、`message`（説明）、`source`（回答ならnull、変更なら完全main.cpp）の厳密な3項目で検査する。全APIで同じ契約を使い、自由入力モデルへ未確認の構造化出力パラメーターを送らない。正常終了・単一候補・型・サイズ・重複フィールドを確認し、不正なら適用・自動再送をしない。通常回答のコードブロックは適用対象にしない。制御JSONは表示せず、変更コードは該当回答内の「生成されたmain.cpp」に保持する。自動判断の完全な正確さは保証できず、既存の差分確認・競合拒否・Undoで操作を保護する。

回答指示は最新の依頼へ直接、既定は簡潔に、詳細要求には詳しく答える原則に統合した。段落数・改善案数の固定目標は置かず、未依頼の背景・提案・注意や過去の定型説明を広げない。誤解を防ぐ条件は残し、コードの事実・検証記録・推測を区別する。ソースコメントを検証証拠とせず、確認記録がないだけで誰も検証していないと断定しない。

`web/ai-context.js`で応答原則・既存JSON契約・短い製品対応情報を区別し、全APIへ共通送信する。現在のコード・選択ボード・具体版の直接依存・適用方法は要求時snapshotから取得する。製品情報はボード/core系列/platform設定、UF2とBINセットZIP、ブラウザ書き込み未実装、シリアルのVID/速度制限、保存/JSON退避、AIと利用者の操作境界を含む参照情報で、毎回答の説明項目ではない。依存設定、Registry登録、パッケージ取得、Build成功、実機確認を区別する。coreの実インストール版は推測せず、未特定はnullとする。

書き込み案内では対象成果物のmanifest／README本文をAIへ自動送信していないことを明示する。未確認アドレス・flash設定を使う具体的コマンドは「一般例」でも提示しないよう指示し、Build→ZIP取得→同梱資料に基づく外部書き込みは案内する。過去のアドレスは共通情報に固定しない。選択ボードの情報にはSerialの案内条件も含め、C3にはアプリ内Serialを接続手順として勧めない。RP2040も実際のポートとVIDフィルターの一致が条件。C3の書き込み用ROM download modeをDFUと混同せず、手動移行は[Seeed公式手順](https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/#troubleshooting)を参照する（2026-09-13確認）。これはモデルへ渡す情報・指示の修正であり、生成文章の正確性を強制・保証する後処理ではない。実モデルの改善確認はHumanによる再確認が必要。

保守時は機能変更と同じ差分で`ai-context.js`の該当実装コメントと対応情報を更新する。限定的なmetadataのためcompilerやINI生成は変更せず、`tests/ai-product.spec.js`で実際のボード選択・project検証・compiler成果物定義・INI・serial設定との一致、および3APIへの最終送信を検査する。`npm run test:browser -- tests/ai.spec.js tests/ai-product.spec.js`は独立Chrome・外部AI遮断の検証であり、実モデルの簡潔さ・正確さの保証ではない。

履歴へは回答文と簡潔なコード適用状態（pending/applied/discarded/stale）を渡し、画面のUndo案内やBuild注意文を再送しない。現在のソースを正本とし、履歴の適用状態をBuild・実機成功とは扱わない。改行はJSON各層を1回ずつデコードし、本文を一律置換・二重デコードしない。モデルには通常文章の改行を過剰エスケープしないよう指示する。生成コードは折り畳みを開けば全文を選択できる。閉じた状態のコピーではコードが含まれない場合がある。

HumanはOpenAIで5000→2000の変更応答と適用／保存済み表示、改善案のみの非適用を確認した。変更後のBuild・実機・Undo・再読み込み保存の実確認まで済んだとは扱わない。簡潔さ、重複説明、条件付き挙動の説明には課題があり、今回指示を整理した。改善後の回答品質はHumanによる実API確認待ち。

ブラウザから提供元の固定APIへ直接送信し、NodeはAI要求・会話・キーを中継しない。プロジェクトJSON・Build要求へAI設定を含めない。コード256 KiB、指示16,000文字、出力16,384 token、復号した説明／コード各256 KiB、制御JSON 1 MiB、HTTP応答2 MiBを上限とし、打ち切り・拒否・曖昧な候補は適用しない。生成コードは利用者がBuildで確認する。AIはBuild・依存追加・ボード変更・実機操作を自動実行しない。

標準fetchでOpenAI Responses／Chat CompletionsとAnthropic Messagesを使用する。初期モデルは`gpt-5-mini`（Responses、reasoning low）と`claude-sonnet-5`（Messages）。候補に`gpt-5.3-codex`（Responses）、`gpt-4.1-mini`（Chat Completions）、`claude-haiku-4-5`を用意し、モデルID自由入力とAPI方式指定も可能。候補は公式モデル資料で確認した静的一覧で、アカウントの利用権限を保証しない。Codex APIモデルとCLI／サブスク認証は別物であり、後者は使用しない。

通信は非ストリーミング・1操作1要求・自動再送なし。中止と3分タイムアウトがあり、提供側の生成停止・無課金は保証しない。Anthropicにはブラウザ直送用ヘッダーを付ける。OpenAIはブラウザへの秘密キー配置を推奨していないため、本人のキーを本人のブラウザで扱うという製品方針での利用となる。Humanから、当該環境のOpenAI／gpt-5-miniで日本語のコード説明を受信したとの確認を受けた（2026-09-12）。Codex自身の実API検証ではなく、Claude接続や生成コードのBuild成功を確認した意味ではない。上記の追加Human確認と今回のモック検証を区別し、Codexは実APIを再検証していない。接続失敗時もサーバー中継やCORS回避へ切り替えない。

公式確認日：2026-09-11。[GPT-5 Mini](https://developers.openai.com/api/docs/models/gpt-5-mini)は明確な小規模コード課題の費用・速度を考慮した初期値、[Sonnet 5](https://platform.claude.com/docs/en/models/sonnet-5/overview)はコード支援の品質と速度を考慮した初期値。[Codexモデル](https://developers.openai.com/api/docs/models/gpt-5.3-codex)、[Responses](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create)、[Messages](https://platform.claude.com/docs/en/api/messages/create)、[Anthropicブラウザ利用](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript)、[OpenAI認証](https://developers.openai.com/api/reference/overview)。

AIのモック検証はサーバー起動後`npm run test:browser -- tests/ai.spec.js`。独立ブラウザ・ダミーキーを使い、外部HTTPを捕捉／遮断する。実API課金要求はテストに含めない。

## 進め方と過去の記録

進め方は `CLAUDE.md`。2026-08 の調査・設計・裁定は `prompt/maintenance/local/legacy/` にメモとして残している。

## セキュリティ方針

repo は PUBLIC。secret / credential / token / 個人情報 / 非公開 URL を書かない。commit 時に gitleaks の staged scan が走る(`.claude/hooks/pre-commit-gate.sh`)。


### XIAO ESP32C3（ソフトウェア対応）

`compiler/pio-esp32c3/` はRP2040用と分離したPlatformIOプロジェクト。`espressif32@7.0.1`、board `seeed_xiao_esp32c3`、Arduino core 2.0.17（framework package 3.20017.241212+sha.dcc1105b）、RISC-V GCC 8.4.0+2021r2-patch5を実ビルドで確認した。既定の新規プロジェクトは従来どおりXIAO RP2040。C3を使う場合はボード選択を変更する。

C3用の応答はUF2ではなく `firmware-xiao_esp32c3.zip`。4つのBIN（bootloader、partitions、boot_app0、firmware）と、当該ビルド環境から取得したアドレス・flash設定・サイズ・SHA-256を記載したmanifest.json、README.txtを含む。アプリ単体BINだけで初回書き込みが完結するとは扱わない。ブラウザ書き込み機能は追加していない。helloとWi-Fiサンプルの実Chrome Build・ZIPダウンロードを確認済み。現在の生成設定はbootloader 0x0、partitions 0x8000、boot_app0 0xe000、firmware 0x10000、flashはdio / 80m / 4MB。設定の正本は各ZIPのmanifestとし、C3へ汎用ESP32のbootloaderアドレスを流用しない。

Wi-Fiサンプルは `examples/xiao-esp32c3-wifi.cpp` と `examples/xiao-esp32c3-wifi.digicode.json`。「ファイル」→「ファイルから読み込む…」でJSONを選ぶと、C3を選択した新しいプロジェクトとして追加される。`WiFi.h` はcore付属を使い、外部libraryの追加はない。SSID・パスワードはダミー値、接続待機は15秒で打ち切る。Wi-Fiコードのコンパイル確認済み、実接続未確認。利用者の現在のコードへ自動挿入しない。

C3の通常ビルドは、PlatformIO内部でesptoolのオフライン `elf2image` 変換を呼び出す。USB検出・書き込みとは別処理だが、esptool自体が禁止されている作業では実行しない。

C3のビルドでは`portable_paths.py`でコンパイル時のパス置換を行い、coreの`__FILE__`文字列へローカル絶対パスが残るのを防ぐ。生成後のBINの書き換えは行わない。

### プロジェクトごとのライブラリ管理

上部「ライブラリ」から名前・キーワードを入力し、入力停止400ms後に自動検索する。Enterや検索ボタンで即時検索もできる。日本語IME変換中は送信せず、確定後に待機を開始する。提供者・正式名・Registry IDを確認し、「バージョンを選択」→具体的な版→「プロジェクトに追加」。追加済み一覧から削除でき、検索結果の「追加済み · 版を変更」から明示的に版を変更できる。設定追加はインストール完了を意味せず、実パッケージはBuild時に取得する。対応情報は登録メタデータであり動作保証ではない。`WiFi.h`などコア付属ライブラリは追加不要。

対象はPlatformIO Registryのライブラリのみ。プロジェクトごとの`libraries`配列に`{id, owner, name, version}`を保存する（最大32件、具体的なSemVerのみ）。Git URL、パス、ZIP、任意スクリプト指定は受け付けない。ブラウザ保存キーとJSON版はv1のまま任意項目を追加し、項目のない旧プロジェクト/JSONは空配列として復元する。複製・JSON往復も独立した設定を保持。不正指定は拒否し、Build前にはサーバーからRegistryのID・正式名・版の実在も照合する。**ライブラリ管理非対応の旧アプリへ戻すと追加項目を保持できないため、新しいJSONは対応版で使用する。**

Build開始時にコード・board・プロジェクトID/revision・ライブラリをスナップショット化する。サーバーは既存の直列キューを維持し、要求ごとに新しい一時ディレクトリへ設定とソースを作り、成果物を読み出した後に削除する。`lib`・`libdeps`・グローバルライブラリ検索先・コンパイル生成物は要求内に隔離する。共有するのはPlatformIOのツールチェーンとパッケージ取得キャッシュ。削除済み依存を過去のビルド領域から再利用しない分、毎回コンパイルが必要になる。

直接依存は`owner/name@version`で固定する。推移的依存の解決はPlatformIOに従い、lockfileによる完全固定はしていない。既存のRP2040 platform/coreも今回固定を追加していないため、ビルド全体の完全再現性は保証しない。Registry接続が必要で、公開ライブラリが持つビルド処理はPlatformIOが実行する。コンパイルサービス自体はOSサンドボックスではなく、従来どおり信頼するローカル利用向け。

Registry接続はPlatformIO Core 6.1.19の公開RegistryClientが使う`https://api.registry.platformio.org/v3/search`と`/v3/packages/{owner}/library/{name}`をサーバーから読み取る。CLIは人向け出力でJSON出力オプションがないため文字列解析はしない。検索は400msの入力待機（明示操作で即時実行）・10件単位のページ送り、入力変更/再検索/閉じる操作で古い応答を破棄する。外部API変更時は取得失敗として通知する。

参照：[公式の依存管理](https://docs.platformio.org/en/latest/librarymanager/dependencies.html)、[pkg search](https://docs.platformio.org/en/latest/core/userguide/pkg/cmd_search.html)、[pkg show](https://docs.platformio.org/en/latest/core/userguide/pkg/cmd_show.html)、[Core 6.1.19 RegistryClient](https://github.com/platformio/platformio-core/blob/v6.1.19/platformio/registry/client.py)。

読み込み用サンプルは`examples/xiao-rp2040-arduinojson.digicode.json`と`examples/xiao-esp32c3-arduinojson.digicode.json`。`bblanchon/ArduinoJson@7.4.3`（Registry #64）のJSON生成・シリアライズを呼ぶ。両系列で実Chrome追加・Build・ダウンロード、削除後のヘッダー不足、同時要求した別プロジェクトへの依存混入防止を検証した。実機実行は未確認。検証コードは`tests/libraries.spec.js`。

検索は入力を引用した通常検索、正式名検索、単語前方一致の`word*`検索（relevance/popularity）を各1ページ取得し、取得した実在の前方一致名から追加検索を最大1回行う。最大5要求・50候補をIDで重複排除し、取得範囲内で名前の完全一致→前方一致→途中一致→関連一致の順に表示する。画面の「取得候補」はRegistry総件数ではない。ページ送りは同じ取得結果を10件ずつ表示し、再取得しない。サーバーは60秒・最大64検索のキャッシュで同一要求をまとめる。一部検索の失敗も取得失敗として通知し、不完全な結果を0件扱いしない。

`serv`からServoとESP32Servo、`arduinoj`からArduinoJson、`BusIO`からAdafruit BusIOの実取得を確認した。Registryのname指定は完全名用で、`name:*文字列*`は途中一致として動かない。今回の方法も任意の名前の途中断片を全Registryから網羅する検索ではなく、全文の単語前方一致と実候補からの拡張で取得できた範囲に限る。見つからない場合は名前の別の部分や長めの語を試す。引用符・バックスラッシュ・制御文字は解釈が曖昧になるため検索入力では明示拒否し、他の記号・複数語は通常/正式名検索で保持する。補助ワイルドカードだけは英数字/Unicode文字の単語から生成し、利用者の制御構文を実行しない。

候補0件の場合の「もしかして」は、そのページセッションで取得した直近最大200 IDの名前だけを対象とする（編集距離2以内・最大3提案）。Registry全体のスペル検索ではない。提案のクリックで初めて検索語を変更する。ページ再読み込みでこの補助辞書は消え、永続収集・AI接続はしない。テストは`node --test compiler/library-search.test.mjs`と既存Playwrightスイート。
