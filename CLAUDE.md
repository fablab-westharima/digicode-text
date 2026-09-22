# DigiCode Text — Claude Code 指示

## この project は何か
- ブラウザで main.cpp を編集し、専用 compiler で MCU 向けに build し、実機へ書き込む Web アプリ。
- 既存 DigiCode(Blockly 版、以下 Classic)とは独立した新規 project。fork ではない。
- repo は PUBLIC、license は AGPL-3.0。secret / credential / 個人情報を repo に書かない。

## 進め方
- 進捗の単位は「動くもの」だけ。報告は「何を試し、何が動き、何が動かなかったか」で書く。文書は進捗ではない。
- 判断は作ってから。scope・schema・受入基準、実機・センサの選定は、動くものを見て必要が出てから決める。それまでの判断は仮置きで、撤回に手続きは要らない。
- 1 周 = Human GO → 作る → 動作報告 → Human が触って次を決める。次の周は Human の GO で始める(触った結果が次の scope を決めるため)。1 周が 1 週間を超えたら切り方を疑う。
- 検証は実行で行う。動くものに対して壊れるか試す。独立レビューは重要なコードにかけ、文書にはかけない。
- test は repo がその種の変更に test を持つ場所にだけ、隣の test と同じ規模で。
- コードの commit より文書の commit が多くなったら、やり方が戻っている。
- 停止するたびに、ターミナルに出した報告と同じ内容を `~/Downloads/` に md ファイルで書き出す(unit ごとに 1 ファイル、日付と unit 名をファイル名に、止まるたびに追記)。Human はターミナルからコピーせず、そのファイルをチャットに渡すため。repo には動くコードと最小の README だけを commit する。
- `~/Downloads/` の報告書は Claude Code → チャットへの受け渡し用で、消える。仕様・記録ではない。過去の報告書は読まない。

## Classic から持ち越す教訓(この 4 つだけ)
1. 依存は project 単位で分離する。global な lib_deps で 16/20 board が死んだ。
2. 「対応済み」は実際に compile が通ってから言う。AI の自己申告を受入根拠にしない。
3. donor の実コードは読んでから判断する。空想で設計しない。
4. platform は、新しいチップまで対応し、古いボードを切り捨てず、開発が活発なものを選ぶ。Classic では platform の対応遅れで新しいボードが載らなかった。ESP32 系で 2026-09 時点にこれを満たすのは pioarduino(PlatformIO 公式 espressif32 は arduino-esp32 2.x で止まっている)。

## donor の扱い
- donor(DigiCode / digicode-compile-api / DigiCode-Helper)は現在の checkout を read-only で読み、必要なコードは流用してよい。
- donor 側を変更・統合・subtree 化・fork 化しない。donor の governance / prompt は読まない・継承しない。この project は donor から独立した新規 project のため。
- donor の前提(Blockly fragment 注入、global lib_deps、固定 template)は、この project で要ると確かめたものだけ持ち込む(教訓 1)。

## 今の目標
- 縦串(編集 → build → 書き込み → Serial に "hello")は動いている。対応ボードは 20 台、正本は `compiler/server.mjs` の `BOARDS`。ESP32 系の platform は pioarduino。
- 配布は Web + ML30 のクラウド compile(制限なし)で完成させ、実数を見る。compile サーバーは Docker image(repo 直下の `Dockerfile`)。
- 対応ボードは無線を持つ MCU 板。実機確認は板が届いてから Human が行う。
- ローカル LLM は未着手。順は Human が決める。

## 表示の裁定
- 型は `web/app.css` の共通規則と `web/styleguide.html` が正。全 view に当てる。
- 置き場: 一覧から選ぶ → サイドバー、読む・入力する → 中央 dialog、会話 → 右パネル、出力 → 下パネル。
- 常時表示の説明文は置かない。説明は取説(ヘルプ dialog)とホバーへ。
- 設定は項目ごとに 名前 + 1 行説明 + 入力欄。機能ごとに節を分ける。

## 実機・USB の扱い
- 板・USB・シリアル・`/Volumes` の操作は Human が行う。下の明示許可がない限り、Claude Code は触らない前提で作業を組む。
- USB デバイスとシリアルポートへの操作(open / write / reset / monitor / upload / 列挙)は、Human がその回の GO で明示的に許可した場合だけ行う。接続中の機器は別 project で稼働していることがある。
- 書き込みは Human が「稼働中ボードを外した」と宣言した後の別 GO でのみ行う。

## 外部への操作
- production、credential、外部サービスへの write など非可逆操作は、Human の GO を得てから行う。取り消せないため。
- AI 提供元の API は Human の実操作でだけ呼ぶ。test はダミー値で、外部送信 0 件で通る作りにする。課金が発生し、公開 repo に test 用のキーを置けないため。

## 過去の記録
- 2026-08 の調査・設計・裁定は `prompt/maintenance/local/legacy/paper-phase-2026-08/` に残す。gate ではなく、動くものができた後に測るかもしれないことのメモ。
- 迷ったら過去文書ではなく、今動いているものと Human の直近の指示を優先する。
