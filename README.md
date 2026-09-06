# digicode-text

ブラウザで **通常のテキストコード**(`main.cpp`)を編集し、専用 compiler でマイコン向けに build し、実機へ書き込む Web アプリケーション。ブロックエディタではない。既存 DigiCode(Blockly 版)とは独立した新規プロジェクトで、fork ではない。license は AGPL-3.0。

## 今動くもの(slice 1、2026-09-06)

- `compiler/pio-rp2040/` — project 専用の PlatformIO project。XIAO RP2040(community platform + earlephilhower core)と Raspberry Pi Pico(公式 platform)で "hello" を Serial に出す `main.cpp` が build でき、`firmware.uf2` が生成される。global な lib_deps は無い。
- `compiler/server.mjs` — 依存ゼロの Node サーバ。`POST /compile` に `{env, source}` を送ると `.uf2` を返す(compile 失敗は 422 + log)。`GET /` で `web/index.html` を配信。
- `web/index.html` — textarea + Build + `.uf2` ダウンロード + Web Serial monitor(Raspberry Pi VID 0x2e8a でフィルタ)。

### 動かし方

```
# 前提: Node 20 以上、PlatformIO Core(~/.local/bin/pio)
node compiler/server.mjs          # http://127.0.0.1:3000
```

ブラウザで開き、Build を押すと `.uf2` がダウンロードできる。書き込みは BOOTSEL で挿した `RPI-RP2` ドライブへコピーする。

## まだ無いもの

実機書き込みの確認、ESP32 / esptool-js、library、device、Docker 化、認証、複数ユーザー対応。

## 進め方と過去の記録

進め方は `CLAUDE.md`。2026-08 の調査・設計・裁定は `prompt/maintenance/local/legacy/` にメモとして残している。

## セキュリティ方針

repo は PUBLIC。secret / credential / token / 個人情報 / 非公開 URL を書かない。commit 時に gitleaks の staged scan が走る(`.claude/hooks/pre-commit-gate.sh`)。
