# digicode-text

ブラウザで **通常のテキストコード**(`main.cpp`)を編集し、専用 compiler でマイコン向けに build し、実機へ書き込む Web アプリケーション。ブロックエディタではない。既存 DigiCode(Blockly 版)とは独立した新規プロジェクトで、fork ではない。license は AGPL-3.0。

## 今動くもの

- `compiler/pio-rp2040/` — project 専用の PlatformIO project。XIAO RP2040(community platform + earlephilhower core)と Raspberry Pi Pico(公式 platform)で "hello" を Serial に出す `main.cpp` が build でき、`firmware.uf2` が生成される。global な lib_deps は無い。
- `compiler/server.mjs` — 依存ゼロの Node サーバ。`POST /compile` に `{env, source}` を送ると `.uf2` を返す(compile 失敗は 422 + log)。`GET /` で `web/index.html` を配信。
- `web/` — Monaco Editor(C++、行番号、自動インデント、Undo/Redo) + ブラウザ内自動保存 + Build + `.uf2` ダウンロード + Web Serial monitor(Raspberry Pi VID 0x2e8a でフィルタ)。

### 動かし方

```
# 前提: Node 20 以上、PlatformIO Core(~/.local/bin/pio)
npm ci                          # 固定依存をproject内に取得（初回はnetworkが必要）
npm run build:web               # Monaco・Worker・CSSをローカル配信用に生成
npm start                       # http://127.0.0.1:3100
```

Chromeで開き、コードを編集してBuildを押し、成功後に「Download .uf2」をクリックする。
コード・boardは変更ごとにこのブラウザのlocalStorageへ保存し、再読み込みで復元する（空コードも保存）。保存できない場合は画面に表示し、編集・Buildは継続できる。保存は同じブラウザ・同じorigin専用なので、`http://127.0.0.1:3100`を継続して使う。ブラウザデータを削除すると保存内容も消える。
画面とMonacoはダーク固定。OS設定や以前のテーマ保存値には影響されない。下部のビルド結果・シリアルパネルはタブで切り替え、開閉できる。上端をドラッグ、または高さ調整部分へTabで移動して上下矢印キー（Home/Endで最小/最大）で高さを調整できる。シリアルタブの表示だけでは接続しない。ビルド失敗時は結果パネルを開き、最初のエラーへスクロールする。ログは横・縦スクロールとコピーが可能。

コード・boardの変更で以前のUF2リンクは無効になる。Build途中の変更があった場合は成果物を破棄し、再Buildを案内する。

Monaco `0.53.0`、esbuild `0.28.2`を固定し、lockfileを使用する。実行時CDNは使わない。フロントエンド変更後は`npm run build:web`を再実行する。サーバーはNode標準機能のみで動作する。停止は起動したターミナルでCtrl-C。

ブラウザ検証はPlaywright `1.63.0`とインストール済みGoogle Chromeで、サーバー起動後に`npm run test:browser`。独立したブラウザコンテキストを使い、普段のChromeの保存内容には触れない。テストは実コンパイルで作業用main.cppを一時変更するため、HumanのBuildと同時には実行しない。終了時に元のソースへ戻す。

USB・実機操作は別途Humanの明示許可が必要。実機書き込み・hello表示・Serial monitorの実機確認は未完了。

## まだ無いもの

実機書き込みの確認、ESP32 / esptool-js、library、device、Docker 化、認証、複数ユーザー対応。

## 進め方と過去の記録

進め方は `CLAUDE.md`。2026-08 の調査・設計・裁定は `prompt/maintenance/local/legacy/` にメモとして残している。

## セキュリティ方針

repo は PUBLIC。secret / credential / token / 個人情報 / 非公開 URL を書かない。commit 時に gitleaks の staged scan が走る(`.claude/hooks/pre-commit-gate.sh`)。
