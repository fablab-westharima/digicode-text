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

上部「ライブラリ」から名前・キーワードを入力し、検索ボタンまたはEnterで検索する。提供者・正式名・Registry IDを確認し、「バージョンを選択」→具体的な版→「プロジェクトに追加」。追加済み一覧から削除でき、検索結果の「追加済み · 版を変更」から明示的に版を変更できる。設定追加はインストール完了を意味せず、実パッケージはBuild時に取得する。対応情報は登録メタデータであり動作保証ではない。`WiFi.h`などコア付属ライブラリは追加不要。

対象はPlatformIO Registryのライブラリのみ。プロジェクトごとの`libraries`配列に`{id, owner, name, version}`を保存する（最大32件、具体的なSemVerのみ）。Git URL、パス、ZIP、任意スクリプト指定は受け付けない。ブラウザ保存キーとJSON版はv1のまま任意項目を追加し、項目のない旧プロジェクト/JSONは空配列として復元する。複製・JSON往復も独立した設定を保持。不正指定は拒否し、Build前にはサーバーからRegistryのID・正式名・版の実在も照合する。**ライブラリ管理非対応の旧アプリへ戻すと追加項目を保持できないため、新しいJSONは対応版で使用する。**

Build開始時にコード・board・プロジェクトID/revision・ライブラリをスナップショット化する。サーバーは既存の直列キューを維持し、要求ごとに新しい一時ディレクトリへ設定とソースを作り、成果物を読み出した後に削除する。`lib`・`libdeps`・グローバルライブラリ検索先・コンパイル生成物は要求内に隔離する。共有するのはPlatformIOのツールチェーンとパッケージ取得キャッシュ。削除済み依存を過去のビルド領域から再利用しない分、毎回コンパイルが必要になる。

直接依存は`owner/name@version`で固定する。推移的依存の解決はPlatformIOに従い、lockfileによる完全固定はしていない。既存のRP2040 platform/coreも今回固定を追加していないため、ビルド全体の完全再現性は保証しない。Registry接続が必要で、公開ライブラリが持つビルド処理はPlatformIOが実行する。コンパイルサービス自体はOSサンドボックスではなく、従来どおり信頼するローカル利用向け。

Registry接続はPlatformIO Core 6.1.19の公開RegistryClientが使う`https://api.registry.platformio.org/v3/search`と`/v3/packages/{owner}/library/{name}`をサーバーから読み取る。CLIは人向け出力でJSON出力オプションがないため文字列解析はしない。検索は明示操作・10件単位のページ送り、入力変更/再検索/閉じる操作で古い応答を破棄する。外部API変更時は取得失敗として通知する。

参照：[公式の依存管理](https://docs.platformio.org/en/latest/librarymanager/dependencies.html)、[pkg search](https://docs.platformio.org/en/latest/core/userguide/pkg/cmd_search.html)、[pkg show](https://docs.platformio.org/en/latest/core/userguide/pkg/cmd_show.html)、[Core 6.1.19 RegistryClient](https://github.com/platformio/platformio-core/blob/v6.1.19/platformio/registry/client.py)。

読み込み用サンプルは`examples/xiao-rp2040-arduinojson.digicode.json`と`examples/xiao-esp32c3-arduinojson.digicode.json`。`bblanchon/ArduinoJson@7.4.3`（Registry #64）のJSON生成・シリアライズを呼ぶ。両系列で実Chrome追加・Build・ダウンロード、削除後のヘッダー不足、同時要求した別プロジェクトへの依存混入防止を検証した。実機実行は未確認。検証コードは`tests/libraries.spec.js`。
