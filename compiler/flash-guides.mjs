// 書き込み前に画面で見せる接続手順。BOARDS の flashGuide フィールドの中身はここだけにあり、
// GET /boards で UI へ渡る（web/flash-guide.js がモーダルに描く）。文書ではなく画面の正本。
//
// steps[].text は 1 文。steps[].figure は web/figures/<id>.svg の識別子で、同じ図は使い回す。
// notes は手順の後に読む補足で、書き込みそのものの事実（flashHint と同じ出所）だけを書く。
// 手順に書いてよいのは、このアプリの操作と、ボードに実際に付いているコネクタ・ボタンの事実のみ。
const RP2040_NOTES = [
  'コピーが終わるとボードは自動で再起動する。',
  'macOSでは書き込みの後に「ディスクの不正な取り出し」の通知が出るが、正常な動作。',
];
// XIAO RP2040 と Pico は同じ手順で、押すボタンの呼び名と基板の図だけが違う。
const rp2040Guide = (button, holdFigure) => ({
  steps: [
    { text: `${button}を押したままUSBケーブルをPCに挿す。`, figure: holdFigure },
    { text: 'PCにRPI-RP2ドライブが現れる（Macでは「NO NAME」と表示される場合がある）。', figure: 'drive-appear' },
    { text: 'OKを押すと開くドライブ選択ダイアログで、そのドライブを選ぶ。', figure: 'drive-dialog' },
  ],
  notes: RP2040_NOTES,
});

export const FLASH_GUIDES = {
  xiao_rp2040: rp2040Guide('ボードのBボタン（BOOTSEL）', 'bootsel-hold-xiao'),
  pico: rp2040Guide('ボードのBOOTSELボタン', 'bootsel-hold-pico'),
  // 手順は無印 Pico と同じ。基板の図だけ、下辺にアンテナ区画のある Pico W のものにする。
  pico_w: rp2040Guide('ボードのBOOTSELボタン', 'bootsel-hold-pico-w'),
  xiao_esp32c3: {
    steps: [
      { text: 'USB-CケーブルでボードをPCに接続する。', figure: 'usb-c-connect' },
      { text: 'OKを押すと開くブラウザのポート選択ダイアログで、「USB JTAG/serial debug unit」などボードのポートを選ぶ。', figure: 'port-dialog-usb-jtag' },
    ],
    notes: ['書き込みの前後のリセットは自動で行われるので、ボタン操作は要らない。'],
  },
  // XIAO ESP32S3 は USB がチップに直結。ダイアログに出る名前はこの板でまだ確かめていないので、
  // C3 と違って行は帯の図で描き、何を選ぶかは手順文で言う。
  xiao_esp32s3: {
    steps: [
      { text: 'USB-CケーブルでボードをPCに接続する。', figure: 'usb-c-connect-xiao-s3' },
      { text: 'OKを押すと開くブラウザのポート選択ダイアログで、ボードを挿したときに増えたポートを選ぶ。', figure: 'port-dialog-usb-serial' },
    ],
    notes: ['書き込みの前後のリセットは自動で行われるので、ボタン操作は要らない。'],
  },
  // DevKitC は USB シリアル変換チップ経由。そのチップが EN と GPIO0 を駆動するので、
  // 書き込みのためのボタン操作は要らない（Espressif の boot-mode-selection の配線）。
  esp32_devkitc_v4: {
    steps: [
      { text: 'USBケーブル（Standard-A to Micro-B）でボードをPCに接続する。', figure: 'micro-usb-connect-devkitc' },
      { text: 'OKを押すと開くブラウザのポート選択ダイアログで、ボードを挿したときに増えたポートを選ぶ。', figure: 'port-dialog-usb-serial' },
    ],
    notes: [
      '書き込みの前後のリセットは、USBシリアル変換チップがENとGPIO0を動かして自動で行われるので、ボタン操作は要らない。',
      '自動リセットが効かない個体では、Bootを押したままENを押してから書き込む。',
    ],
  },
  wio_node: {
    steps: [
      { text: 'FT234X（GroveのUSBシリアル）をPORT0に挿し、USB側をPCに接続する。', figure: 'grove-serial-port0' },
      { text: 'FUNCを押したままRSTを押して離す。ボードが書き込みモードに入る。', figure: 'func-rst' },
      { text: 'OKを押すと開くブラウザのポート選択ダイアログで、FT234X（FTDI）のポートを選ぶ。', figure: 'port-dialog-ft234x' },
    ],
    notes: [
      'Wio NodeのmicroUSBは給電専用でUARTが無いため、USBシリアルを挿して書き込む。',
      '書き込みが終わったらRSTを押す。',
    ],
  },
};
