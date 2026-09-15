"""Package built ESP flash images into one JSON flash set (manifest + base64 images).

Shared by every ESP-family PlatformIO project. The images and their addresses come from
the build environment itself — FLASH_EXTRA_IMAGES plus the application image at the
environment's own application offset — so a platform that flashes four images
(espressif32) and one that flashes a single image at 0x0 (espressif8266) both package
without a fixed image count or fixed addresses here. No device operations.
"""
Import("env")
import base64
import hashlib
import json
from pathlib import Path


def framework_package(platform, env):
    """The framework package name from the platform manifest (never a hard-coded name)."""
    return platform.frameworks[env.subst("$PIOFRAMEWORK").split()[0]]["package"]


def flash_parameters(env, board):
    """Flash mode/frequency/size as the platform's own uploader computes them.

    espressif32 exposes helper substitutions for these; espressif8266 exposes none, so
    fall back to the board manifest. Keyed on what the environment provides, not on a board.
    """
    if "__get_board_flash_mode" in env:
        mode = env.subst("${__get_board_flash_mode(__env__)}")
    else:
        mode = str(board.get("build.flash_mode", ""))
    if "__get_board_f_image" in env:
        frequency = env.subst("${__get_board_f_image(__env__)}")
    else:
        frequency = "%dm" % (int(str(board.get("build.f_flash", "0")).replace("L", "")) // 1000000)
    size = board.get("upload.flash_size", "")
    if not size and "__get_flash_size" in env:
        size = env.subst("${__get_flash_size(__env__)}") + "B"
    return mode, frequency, size


def package_firmware(source, target, env):
    platform = env.PioPlatform()
    board = env.BoardConfig()
    images = [(offset, Path(env.subst(str(path)))) for offset, path in env.get("FLASH_EXTRA_IMAGES", [])]
    # The application image goes at the environment's application offset; platforms that
    # define none (espressif8266) flash it at 0x0, exactly as their own uploader does.
    app_offset = env.subst("$ESP32_APP_OFFSET") or board.get("upload.offset_address", "0x0")
    images.append((app_offset, Path(env.subst("$BUILD_DIR/${PROGNAME}.bin"))))
    entries = []
    previous_end = 0
    flash_bytes = int(str(board.get("upload.maximum_size", 4 * 1024 * 1024)))
    for offset, path in sorted(images, key=lambda item: int(str(item[0]), 0)):
        address = int(str(offset), 0)
        content = path.read_bytes()
        if not content or address < previous_end or address + len(content) > max(flash_bytes, 4 * 1024 * 1024):
            raise RuntimeError("Invalid/overlapping flash images")
        previous_end = address + len(content)
        entries.append({"file": path.name, "address": hex(address), "size": len(content),
                        "sha256": hashlib.sha256(content).hexdigest(),
                        "data": base64.b64encode(content).decode("ascii")})
    package = framework_package(platform, env)
    framework = json.loads((Path(platform.get_package_dir(package)) / "package.json").read_text())
    flash_mode, flash_frequency, flash_size = flash_parameters(env, board)
    flash_set = {
        "format": "digicode-text-flash-set", "version": 2,
        "board": env.subst("$BOARD"), "chip": board.get("build.mcu"),
        "platform": platform.name + "@" + platform.version,
        "frameworkPackage": framework["version"],
        "flashMode": flash_mode,
        "flashFrequency": flash_frequency,
        "flashSize": flash_size, "images": entries,
    }
    out = Path(env.subst("$BUILD_DIR/flashset.json"))
    out.write_text(json.dumps(flash_set) + "\n")
    print("Packaged ESP flash set: " + out.name)

# Always refresh the flash set, even when the compiler reuses the existing firmware.
env.AddPostAction("buildprog", package_firmware)
