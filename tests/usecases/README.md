# compile ユースケース ハーネス

実際の main.cpp を compiler サーバーへ投げ、どの board / ライブラリの組み合わせが
本当に build できるのかを実測して残す。製品コード (`compiler/` `web/` `shared/`) は変更しない。

## 前提

compiler サーバーが動いていること。

```
curl -s http://127.0.0.1:3100/health   # -> {"ok":true}
```

別ポートの場合は `DIGICODE_COMPILER=http://127.0.0.1:4000` を環境変数で渡す。

## 実行

```
node tests/usecases/run.mjs                              # 全件。新しい results dir を作る
node tests/usecases/run.mjs --board pico                 # board で絞る
node tests/usecases/run.mjs --board pico,pico_w          # 複数 board を 1 回で回す (カンマ区切り)
node tests/usecases/run.mjs --jobs 3                     # 同時実行数 (既定は CPU コア数の半分)
node tests/usecases/run.mjs --lib ArduinoJson            # ライブラリ名の部分一致で絞る
node tests/usecases/run.mjs --limit 3                    # 先頭 N 件だけ
node tests/usecases/run.mjs --results latest             # 中断した実行を再開 (結果があるものは飛ばす)
node tests/usecases/run.mjs --results latest --rerun     # 既存結果を無視して実行しなおす
```

終了コードは ng が 1 件でもあれば 1。

## ケースの書き方

`tests/usecases/<board>/<NN>-<slug>.cpp`。ファイル先頭のコメントで宣言する。

```cpp
// @board xiao_esp32c3
// @lib bblanchon/ArduinoJson@7.4.3
// @lib knolleary/PubSubClient@2.8
// @desc WiFi 接続後に MQTT へ JSON を publish
```

- `@board` は必須。`xiao_rp2040` / `pico` / `pico_w` / `xiao_esp32c3` / `xiao_esp32c6` / `xiao_esp32s3` / `xiao_esp32c5` / `esp32_c5_devkitc_1` / `espr_developer_c5` / `m5stamp_c5` / `m5stack_cores3` / `m5stack_cores3_se` / `m5stamp_s3a` / `m5stack_atoms3` / `m5stack_atoms3_lite` / `m5stack_atom_lite` / `m5stack_atom_matrix` / `m5stack_stickc_plus2` / `m5stamp_p4` / `esp32_devkitc_v4` / `wio_node`。
- 同じ PlatformIO env を共有する 2 台（CoreS3 と CoreS3-SE、ATOMS3 と ATOMS3 Lite、ATOM Lite と
  ATOM Matrix）は build の設定がまったく同じなので、ケースは env を代表する 1 台にだけ置く
  (`m5stack_cores3` / `m5stack_atoms3` / `m5stack_atom_lite`)。結果もその 1 台のぶんだけ出る。
  ピン表 `compiler/boards/<env>.pins.json` と同じ単位。
- `@lib` は `owner/Name@version`。version は具体版のみ (`^` や `latest` は不可)。
  コア同梱のライブラリ (ESP32 の `WiFi.h`、ESP8266 の `ESP8266WiFi.h` など) には `@lib` を書かない。
- `@skip 理由` があれば compile せず skip に集計する。

宣言は先頭のコメント塊だけを見る。最初の非コメント行で読み取りを打ち切る。

## 実行時間について

同時実行数は `--jobs`、既定は CPU コア数の半分。compiler サーバー側も同時 build 数に上限を持つ
(既定はサーバー機の CPU コア数の半分。`MAX_CONCURRENT_BUILDS` で変えられる) ので、`--jobs` を
それより大きくしても待ち行列が伸びるだけで速くはならない。

縮み方は限られる。`pio run` は 1 件の build を自前で全コアに広げるため (6 コアの実測で
`-j 1` が 51.0s、`-j 6` が 16.7s)、逐次実行でもマシンはすでにほぼ埋まっている。
並列で取り戻せるのは残りの直列部分だけで、6 コアでの実測は次のとおり。

| | 所要 | 1 件あたり |
| --- | ---: | ---: |
| `--board xiao_esp32c3,xiao_esp32c5 --jobs 1` (123 件) | 37 分 07 秒 | 18.1s |
| `--board xiao_esp32c3,xiao_esp32c5 --jobs 3` (123 件) | 24 分 21 秒 | 11.9s |

ok/ng は両者で一致する。`--jobs 6` にしても `--jobs 3` から先は頭打ちで、逆に `pio run` 側の
`-j` を絞ると遅くなる。1 件あたり数十秒〜数分。クライアント側 timeout は 15 分。

## 結果

`tests/usecases/results/<YYYYMMDD-HHMMSS>/` に出る (git 管理外)。
`results/latest` が最新の実行へのシンボリックリンク。

- `<board>/<case>.json` — 1 ケース 1 ファイル。`ok` `httpStatus` `stage` `durationMs` `errorHead` など。
  `classification` は空文字で出力する。人が後から種別を書き込むための欄。
- `summary.md` — 全体 ok/ng/skip、board 別の ok/ng と平均所要、ライブラリ別 ng (同じエラーはまとめて件数)、ng 一覧。
- `summary-<board>.md` — 同じ内容をその board のケースだけで出したもの。`--board` 指定時は指定した board の
  `summary-<board>.md` だけ、指定なしの全件実行では `summary.md` と合わせて board ごとに出る。

compile に到達しなかったケースは `problem.kind` に理由が入る。

- `version-not-in-registry` — 宣言した version が Registry の versions に無い
- `library-lookup-failed` — `GET /libraries/details` 自体が失敗した
- `header-invalid` — ヘッダ宣言が壊れている
- `request-failed` — `/compile` への接続失敗・timeout
