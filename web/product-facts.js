// 画面のどこに何があるか、という事実。AI には ai-context.js の productFacts() が文として渡す。
// ここは「場所」だけを書く。何が起きるか（Build・書き込み・保存・AI の決まり）は ai-context.js の
// PRODUCT_INFO にあり、同じことを二度書かない。
//
// ids は、その文が指している実際の要素の id。tests/flash-guide.spec.js が DOM と照合するので、
// 画面に無いものをここに書くと落ちる。文言を足すときは必ず対応する id を書く。
export const UI_FACTS = [
  { ids: ['build', 'download', 'flash'], text: 'エディタ上部のタブバーの右にBuildボタンがあり、Build成功後にその右へ「書き込み」ボタンが出る（RP2040系ではその手前に「UF2 ダウンロード」も出る）。' },
  { ids: ['flash-guide-open', 'flash-guide-dialog', 'help-flash-guide'], text: '書き込みボタンを押すと、そのボードの接続手順が先に出る。「このボードでは次回から表示しない」にしたあとも、タブバーの「接続手順」ボタン（画面が狭いときはヘルプの「接続手順を見る」）からいつでも開ける。' },
  { ids: ['panel-toggle', 'build-tab', 'serial-tab', 'monitor'], text: '画面下の出力パネルに「ビルド結果」と「シリアル」のタブがあり、シリアルタブの「接続」ボタンでポートを選ぶ。' },
  { ids: ['stop'], text: 'シリアルタブで接続中は「接続」ボタンが「切断」に変わり、それでポートを閉じる。' },
  { ids: ['serial-baud'], text: 'シリアルタブの「接続」の左にボーレートの選択（既定 115200 bps）があり、切断中だけ変えられる。プロッタも同じ接続を使う。' },
  { ids: ['serial-forget'], text: '「切断」の隣の「USBポートを解除」で、選んだポートの許可を手放し、次回接続時に選び直せるようにする。' },
  { ids: ['plotter-tab', 'plot-pause', 'plot-clear', 'plot-samples'], text: '出力パネルの「プロッタ」タブは、シリアルに届いた数値の行をグラフにする。一時停止・クリア・表示するサンプル数がその場にある。' },
  { ids: ['libraries-open', 'library-query', 'library-show-incompatible'], text: '左のアクティビティバーの「ライブラリ」で検索して追加する。そのボードで使えないライブラリは既定で伏せられ、「このボードで使えないライブラリも表示」で出せる。' },
  { ids: ['view-boards', 'env', 'board-facts'], text: '左のアクティビティバーの「ボード」でビルド対象のボードを選ぶ。同じ画面にピン表と注意点が出る。' },
  { ids: ['ai-open', 'ai-context'], text: '右のAIパネルはアクティビティバーの「AI」で開き、「AIに送る内容を確認」で送信内容を見られる。' },
  { ids: ['view-settings', 'ai-key', 'ai-delete'], text: '左のアクティビティバーの「設定」にAPIキーの欄がある。キーの保存先は利用者のブラウザだけで、「キー・保存設定を削除（即時）」で消せる。' },
  { ids: ['theme-select', 'layout-reset'], text: '「設定」の外観でテーマを選び、「レイアウトを初期化」で幅・高さ・表示状態を戻せる。' },
  { ids: ['flash-guide-reset'], text: '「レイアウトを初期化」の隣の「接続手順の非表示をすべて解除」で、ボードごとに「次回から表示しない」にした接続手順を全部出るように戻せる。' },
  { ids: ['projects-open', 'project-export'], text: 'エクスプローラ右上の「ファイル」メニューの「ファイルへ書き出す」で、編集中のプロジェクトをzipとして持ち出せる。' },
  { ids: ['project-export-all'], text: '同じメニューの「すべて書き出す」は、保存してあるプロジェクトを全部まとめて1つのzipにする。' },
  { ids: ['project-import', 'explorer-view'], text: '同じメニューの「ファイルから読み込む…」でzipを選ぶと新しいプロジェクトとして増える。エクスプローラの上へzipをドラッグ＆ドロップしても同じ。' },
  { ids: ['view-help'], text: '左のアクティビティバー下の「ヘルプ」に、流れ・対応ボード・ブラウザ要件がある。' },
];
