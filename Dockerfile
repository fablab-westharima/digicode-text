# DigiCode Text compile サーバーの image。
# build が要るもの（PlatformIO Core、platform、toolchain、framework）を全部焼き込むので、
# 動いているコンテナは compile のためにネットワークへ出ない。
#
#   docker build --platform linux/amd64 -t digicode-compiler:repo .
#   docker run -d -p 127.0.0.1:3100:3100 -e MAX_CONCURRENT_BUILDS=1 --memory 2g digicode-compiler:repo
#
# env と run 例は README.md の「Docker image」。

# ---------------------------------------------------------------- web assets
# web/dist は git 管理外なので、build context にブラウザ用の bundle は入っていない。
# この stage が作り、同じコンテナが GET / で UI も配れるようにする。
FROM node:20-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build:web

# ---------------------------------------------------------------- compiler image
FROM node:20-bookworm-slim

# git: RP2040 の platform は compiler/pio-rp2040/platformio.ini で git URL で指定されている。
# python3 + venv: PlatformIO Core 本体。
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-venv git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PLATFORMIO_CORE_DIR=/opt/platformio \
    PLATFORMIO_SETTING_ENABLE_TELEMETRY=false \
    PLATFORMIO_SETTING_CHECK_PLATFORMIO_INTERVAL=1000000 \
    PLATFORMIO_SETTING_CHECK_PLATFORMS_INTERVAL=1000000 \
    PLATFORMIO_SETTING_CHECK_LIBRARIES_INTERVAL=1000000 \
    PLATFORMIO_DISABLE_PROGRESSBAR=true \
    PATH=/opt/pio-venv/bin:$PATH \
    PIO_BIN=/opt/pio-venv/bin/pio

RUN python3 -m venv /opt/pio-venv \
    && /opt/pio-venv/bin/pip install --no-cache-dir "platformio==6.2.0" \
    && /opt/pio-venv/bin/pio --version

WORKDIR /app
COPY . /app/
COPY --from=web /app/web/dist /app/web/dist

# ESP8266 だけは最初から別の PlatformIO core dir に入れる。espressif8266 は
# platformio/tool-esptoolpy@~1.30000.0 を、pioarduino の espressif32 は自分の 5.x を、同じ
# package 名で同じ core dir に入れるので、同居させると後勝ちになり、負けた方は build のたびに
# 取りに行こうとする（ネットワークの無いコンテナでは失敗する）。これは Classic の教訓 1
# 「依存は project 単位で分離する」そのもの。server.mjs は platform が esp8266 のボードの
# build にだけ PIO_CORE_DIR_ESP8266 を渡す。
# extra_scripts は compile サーバーが一時 project へ複写するものなので、template dir で
# そのまま pio run すると missing SConscript になる。ここだけ置いて、すぐ消す。
RUN set -eux; \
    export PLATFORMIO_CORE_DIR=/opt/platformio-esp8266; \
    pio pkg install -d /app/compiler/pio-esp8266; \
    cp /app/compiler/pio-esp/portable_paths.py /app/compiler/pio-esp/package_firmware.py /app/compiler/pio-esp8266/; \
    pio run -d /app/compiler/pio-esp8266; \
    rm -f /app/compiler/pio-esp8266/portable_paths.py /app/compiler/pio-esp8266/package_firmware.py; \
    rm -rf /app/compiler/pio-esp8266/.pio

# 残りの platform / toolchain / framework を先に取る。project ディレクトリごとに 1 RUN に
# しているのは、失敗したときにどの系統で失敗したかが名前で分かるようにするため。
RUN pio pkg install -d /app/compiler/pio-rp2040
RUN pio pkg install -d /app/compiler/pio-esp32
RUN pio pkg install -d /app/compiler/pio-esp32c3
RUN pio pkg install -d /app/compiler/pio-esp32s3
RUN pio pkg install -d /app/compiler/pio-esp32c5
RUN pio pkg install -d /app/compiler/pio-esp32p4

# `pio pkg install` だけでは足りない。実際の build は install とは別の spec で package を
# 解決することがある（pioarduino は一部のボードで ESP toolchain を自分のミラーから取りに行く）。
# そこで、まだネットワークがあるうちにサーバーを起こして全ボードの hello を 1 回建てる。
# ここで建たないボードがあれば image build を失敗させる。
ENV PIO_CORE_DIR_ESP8266=/opt/platformio-esp8266
# warmup は初回なので framework の全 compile と toolchain の展開が走る。4 コアの ML30 では
# 1 ボード 90 秒（実行時の既定）に収まらないので、ここだけ長い timeout にする（2026-09-22 実測）。
RUN COMPILE_TIMEOUT_MS=1200000 node /app/compiler/tools/docker-warmup.mjs

# ダウンロードキャッシュは install のときだけ要る。build は展開済みの package を読む。
RUN rm -rf /opt/platformio/.cache /opt/platformio-esp8266/.cache /root/.cache

# 削るのは warmup の後（warmup が要ると言ったものは残っている）。
#  1. ボードの無いチップの prebuilt libs（esp32s2 / esp32c6 / esp32h2 / esp32p4）
#  2. pioarduino が staging に残す toolchain の 2 つ目の実体（/opt/platformio/tools）
# この 2 つを消しても 20 ボードは全部建つ（2026-09-22 実測）。gdb と
# framework-arduinopico/.git は、使わないのに消すと package が無効扱いになるので残す。
RUN set -eux; \
    LIBS=/opt/platformio/packages/framework-arduinoespressif32-libs; \
    du -sh /opt/platformio /opt/platformio-esp8266; \
    rm -rf $LIBS/esp32s2 $LIBS/esp32c6 $LIBS/esp32h2 $LIBS/esp32p4; \
    rm -rf /opt/platformio/tools/toolchain-riscv32-esp /opt/platformio/tools/toolchain-xtensa-esp-elf; \
    du -sh /opt/platformio /opt/platformio-esp8266

# published port は loopback の listener には届かないので、image の既定は 0.0.0.0。
# ALLOWED_ORIGINS は配信元によって変わるので image では設定しない（docker run で渡す）。
ENV BIND_HOST=0.0.0.0 \
    PORT=3100
EXPOSE 3100
CMD ["node", "/app/compiler/server.mjs"]
