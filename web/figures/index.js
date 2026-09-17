// 書き込み前ガイドの図。ファイルは esbuild の text loader で束ねるので、実行時に取得は要らない。
// キーは compiler/flash-guides.mjs の steps[].figure と同じ識別子で、ここに無い識別子は図なしで描く。
import usbCConnect from './usb-c-connect.svg';
import bootselHoldXiao from './bootsel-hold-xiao.svg';
import bootselHoldPico from './bootsel-hold-pico.svg';
import driveAppear from './drive-appear.svg';
import driveDialog from './drive-dialog.svg';
import groveSerialPort0 from './grove-serial-port0.svg';
import funcRst from './func-rst.svg';
import portDialogUsbJtag from './port-dialog-usb-jtag.svg';
import portDialogFt234x from './port-dialog-ft234x.svg';

export const FIGURES = {
  'usb-c-connect': usbCConnect,
  // 基板の形もボタンの位置もXIAOとPicoで違うので、図はボード別に持つ。
  'bootsel-hold-xiao': bootselHoldXiao,
  'bootsel-hold-pico': bootselHoldPico,
  'drive-appear': driveAppear,
  'drive-dialog': driveDialog,
  'grove-serial-port0': groveSerialPort0,
  'func-rst': funcRst,
  // ポート選択の図は、その一覧で選ぶ行の名前がボードで違うので、選ぶポート別に持つ。
  'port-dialog-usb-jtag': portDialogUsbJtag,
  'port-dialog-ft234x': portDialogFt234x,
};
