# digicode-text

ブラウザで **通常のテキストコード**(`main.cpp`)を編集し、専用 compiler でマイコン向けに build し、実機へ書き込む Web アプリケーション。ブロックエディタではない。既存 DigiCode(Blockly 版)とは独立した新規プロジェクトで、fork ではない。license は AGPL-3.0。

## 今動くもの

- `compiler/pio-rp2040/` — project 専用の PlatformIO project。XIAO RP2040(community platform + earlephilhower core)と Raspberry Pi Pico(公式 platform)で "hello" を Serial に出す `main.cpp` が build でき、`firmware.uf2` が生成される。global な lib_deps は無い。
- `compiler/server.mjs` — 依存ゼロの Node サーバ。`POST /compile` に `{env, source}` を送ると RP2040は`.uf2`、C3はBINセットZIPを返す(compile 失敗は 422 + log)。`GET /` で `web/index.html` を配信。
- `web/` — Monaco Editor(C++、行番号、自動インデント、Undo/Redo) + 名前付きプロジェクト管理・ブラウザ内自動保存・JSON入出力 + Build + UF2／BINセットのダウンロード + Web Serial monitor(Raspberry Pi VID 0x2e8a でフィルタ)。

### 動かし方

```
# 前提: Node 20 以上、PlatformIO Core(~/.local/bin/pio)
npm ci                          # 固定依存をproject内に取得（初回はnetworkが必要）
npm run build:web               # Monaco・Worker・CSSをローカル配信用に生成
npm start                       # http://127.0.0.1:3100
```

Chromeで開き、コードを編集してBuildを押し、成功後に「UF2 ダウンロード」（RP2040）または「BINセット ダウンロード」（C3）をクリックする。
上部の「ファイル」を押すと直下に縦型メニューが開く。新規プロジェクト・プロジェクトを開く・名前変更・複製・ファイル入出力・削除をまとめて操作できる。上下キーで移動、Enterで選択、Escapeやメニュー外クリックで閉じる。各プロジェクトは固有IDと単一main.cpp・board・作成/更新日時を持つ。同名でも別IDとして保持する。コード・boardは変更ごとにこのブラウザのlocalStorageへ同期保存し、再読み込みで最後に開いたプロジェクトを復元する（空コードも保存）。保存できない場合は画面に表示し、編集・Build・現在の内容のJSON書き出しは継続できる。未保存内容を捨てないよう切り替え・新規作成などは停止する。保存失敗時だけ保存状態の横に現れる「再試行」で保存を試せる。保存は同じブラウザ・同じorigin専用なので、`http://127.0.0.1:3100`を継続して使う。ブラウザデータを削除すると保存内容も消える。
保存キーは `digicode-text.projects.v1`。旧 `digicode-text.draft.v1` は初回に「引き継いだ下書き」へ移行し、新保存が成功した後は新キーを正本にする。旧キーは復旧用に保持し、不正データは上書きせず通知する。Web Locksで最初のタブだけに保存を許可し、別タブは編集のメモリ保持・書き出しが可能。別タブの内容を退避してから、他のタブを閉じて再読み込みすると保存を再開できる。ロック非対応時も安全のため保存を停止する。

「ファイル」内の「ファイルへ書き出す」「ファイルから読み込む…」は1プロジェクトのJSON（`format: "digicode-text-project"`, `version: 1`, `name`, `source`, `env`）。読み込みは必ず新IDで追加する。名前は空白だけを除く1〜80文字、読み込みファイルは2 MiB・コードは1 MiBまでで、型・board・版を検証する。同期・バックアップではないので必要な内容はファイルへ退避する。Build APIは従来の要求サイズ上限（約256 KiB）のまま。

画面とMonacoはダーク固定。OS設定や以前のテーマ保存値には影響されない。下部のビルド結果・シリアルパネルはタブで切り替え、開閉できる。上端をドラッグ、または高さ調整部分へTabで移動して上下矢印キー（Home/Endで最小/最大）で高さを調整できる。シリアルタブの表示だけでは接続しない。ビルド失敗時は結果パネルを開き、最初のエラーへスクロールする。ログは横・縦スクロールとコピーが可能。

コード・boardの変更で以前のUF2リンクは無効になる。Build途中の変更があった場合は成果物を破棄し、再Buildを案内する。

Monaco `0.53.0`、esbuild `0.28.2`を固定し、lockfileを使用する。実行時CDNは使わない。フロントエンド変更後は`npm run build:web`を再実行する。サーバーはNode標準機能のみで動作する。停止は起動したターミナルでCtrl-C。

ブラウザ検証はPlaywright `1.63.0`とインストール済みGoogle Chromeで、サーバー起動後に`npm run test:browser`。独立したブラウザコンテキストを使い、普段のChromeの保存内容には触れない。テストは実コンパイルで作業用main.cppを一時変更するため、HumanのBuildと同時には実行しない。終了時に元のソースへ戻す。

USB・実機操作は別途Humanの明示許可が必要。実機書き込み・hello表示・Serial monitorの実機確認は未完了。

## まだ無いもの

実機書き込みの確認、C3以外のESP32追加、esptool-jsによるブラウザ書き込み、library、device、Docker 化、認証、複数ユーザー対応。

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
