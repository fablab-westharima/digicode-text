# 07_write / serial / storage — (Phase 2)

**donor:** `DigiCode@bb35c3b` frontend services + `DigiCode-Helper@fa95dfd`
**型ラベル: static のみ** (実機書き込みは未実施 — **実機確認は Human の手が必要**)

---

## 1. 🔴 書き込みは WebUSB ではなく **Web Serial API**

`services/usbFirmwareService.ts`:

- `esptool-js` の `ESPLoader` / `Transport` を使用 (`:12`)
- ポート取得は **`navigator.serial.getPorts()`** (`:311`) — すなわち **Web Serial API**
- `FullPackage` (firmware + bootloader + partitions + boot_app0) を受け取って書く (`:13`)

→ **企画書・引き継ぎ書が一貫して「WebUSB」と表記している経路の donor 実装は、実際には Web Serial である。** ブラウザ対応も権限モデルも別の API なので、browser support matrix (裁定 §20) を書くときに**そのまま WebUSB と書くと誤る**。
※ esptool-js は WebSerial ベースのライブラリであり、この実装は妥当。指摘は「呼び名」ではなく **support matrix の対象 API がどれか**という点。

## 2. BLE OTA — 自前プロトコル実装が資産

`services/bleFirmwareService.ts`:

- **Web Bluetooth** (`navigator.bluetooth.requestDevice`, `:211`)
- **h2zero/NimBLEOta プロトコル準拠**、OTA service UUID `0x8018` (`:9-17`)
- **CRC16-CCITT** 自前実装 (`:43`)
- チャンク構造を自前で組み立て: `[sector index(2byte)][sequence(1byte)][data]` (`:273-294`)

→ 数百行規模の**プロトコル実装そのものが資産**。Text でも書き込み対象が ESP32 + NimBLEOta である限り**ほぼそのまま流用可能**。ただし対向側 firmware (`libs/NimBLEOta` + テンプレート) と対で成立している点に注意。

## 3. Serial Monitor / Plotter

`services/serialService.ts` は **Web Serial API** を直接使用 (`navigator.serial`, `SerialPort` 型を自前定義)。Blockly 非依存。
→ **そのまま流用可能**。

## 4. デバイス検出は外部デスクトップアプリに依存

`services/helperService.ts` は **`http://localhost:31415`** の **DigiCode-Helper** (= remote 名 `DigiCode-Finder`、Tauri 製) と通信する:

- `checkHelperAvailable()` / `getHelperDevices()` (mDNS 検出デバイス一覧) / `triggerHelperSearch()` / `launchHelper()` (カスタム URL スキームで起動、iframe でページ離脱回避)
- 起動はユーザージェスチャ直後に呼ぶ必要があると注記

→ 🟡 **「ローカル agent 不要」という企画の価値主張の例外**。Wi-Fi OTA のデバイス検出には**デスクトップアプリのインストールが必要**。ただし Text の初期方針は **Wi-Fi OTA 不採用**なので、**この依存は Text では落とせる**可能性が高い。

## 5. Storage — donor に流用元がほぼ無い

(詳細は `06_frontend-ui...md` §3。要点のみ再掲せず、結論だけ)

- Classic のプロジェクト正本は **サーバ側 D1 の `blockly_xml` カラム**、auth 必須。
- **autosave / crash recovery は実装が 0 件**。IndexedDB / OPFS / File System Access API の使用も 0 件。
- ローカル入出力は **`.digicode` JSON の import/export のみ** (`services/projectFileReader.ts`)。

## 6. verdict

| 対象 | verdict |
|---|---|
| `bleFirmwareService` (NimBLEOta + CRC16 + チャンク) | **そのまま流用可能** |
| `serialService` (Web Serial) | **そのまま流用可能** |
| `usbFirmwareService` (esptool-js + FullPackage) | **そのまま流用可能** (artifact 形式が同じである限り) |
| `helperService` + DigiCode-Helper 連携 | **Text では不採用候補** (Wi-Fi OTA 不採用と連動) |
| Wi-Fi OTA 実装一式 (`wifiService` / `wifiStore` / `components/wifi/`) | **Text では不採用** (初期方針) |
| `.digicode` JSON の import/export | **改修流用** (multi-file 対応で形式が変わる) |
| プロジェクト保存・autosave・復旧 | **新規実装が必要** |

## 7. Human 実機確認が必要な項目 (裁定 §24)

以下は**私の側では一切検証できない**。acceptance に載せるなら Human hardware として分離が要る:

- Web Serial 経由の実書き込み (board 別)
- BLE OTA の実書き込みと復旧挙動
- Serial Monitor / Plotter の実機挙動
- Chrome / Edge それぞれでの権限ダイアログとポート選択の実挙動
