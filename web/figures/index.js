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
import portDialogUsbSerial from './port-dialog-usb-serial.svg';
import microUsbConnectDevkitc from './micro-usb-connect-devkitc.svg';
import usbCConnectXiaoS3 from './usb-c-connect-xiao-s3.svg';
import bootselHoldPicoW from './bootsel-hold-pico-w.svg';
import usbCConnectXiaoC5 from './usb-c-connect-xiao-c5.svg';
import usbCConnectC5Devkitc from './usb-c-connect-c5-devkitc.svg';
import usbCConnectEsprC5 from './usb-c-connect-espr-c5.svg';
import usbCConnectStampC5 from './usb-c-connect-stamp-c5.svg';
import usbCConnectCoreS3 from './usb-c-connect-cores3.svg';
import resetHoldCoreS3 from './reset-hold-cores3.svg';
import g0HoldStampS3A from './g0-hold-stamp-s3a.svg';
import usbCConnectAtomS3 from './usb-c-connect-atoms3.svg';
import resetHoldAtomS3 from './reset-hold-atoms3.svg';

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
  // USBシリアル変換チップを載せた板。ダイアログに出る名前は板ごとに違うので、行は帯で描く。
  'port-dialog-usb-serial': portDialogUsbSerial,
  'micro-usb-connect-devkitc': microUsbConnectDevkitc,
  // XIAOは基板の形が共通でも、前面の部品の位置がボードで違う。図はボード別に持つ。
  'usb-c-connect-xiao-s3': usbCConnectXiaoS3,
  // Pico W は無印 Pico と外形が同じでも、下辺のアンテナ区画と無線モジュールがある。
  'bootsel-hold-pico-w': bootselHoldPicoW,
  'usb-c-connect-xiao-c5': usbCConnectXiaoC5,
  // ESP32-C5-DevKitC-1 は USB-C が 2 口あるので、どちらに挿すかまで図で言う。
  'usb-c-connect-c5-devkitc': usbCConnectC5Devkitc,
  // ESPr Developer C5 は押すボタンこそ無いが、入らなかったときに押す 2 つの名前を図でも示す。
  'usb-c-connect-espr-c5': usbCConnectEsprC5,
  // M5StampC5 はボタンが無いので、挿す口と取り出せるパッドだけを描く。
  'usb-c-connect-stamp-c5': usbCConnectStampC5,
  // CoreS3 と CoreS3-SE は外形も口もボタンの位置も同じなので、この 2 枚を 2 台で共有する。
  // 挿す口は左側面、書き込みモードに入れる RESET は底面で、図は別の手順ぶん 2 枚。
  'usb-c-connect-cores3': usbCConnectCoreS3,
  'reset-hold-cores3': resetHoldCoreS3,
  // M5StampS3A は押しながら挿すので、挿す口と押すボタンを 1 枚に入れる（BOOTSEL の図と同じ作り）。
  'g0-hold-stamp-s3a': g0HoldStampS3A,
  // ATOMS3 と ATOMS3 Lite も外形も口もボタンの位置も同じなので、この 2 枚を 2 台で共有する。
  // 挿す口は手前側の面、書き込みモードに入れる RESET は左側面で、図は別の手順ぶん 2 枚。
  'usb-c-connect-atoms3': usbCConnectAtomS3,
  'reset-hold-atoms3': resetHoldAtomS3,
};
