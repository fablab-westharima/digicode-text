"""Package built ESP flash images into one JSON flash set (manifest + base64 images).

Shared by every ESP-family PlatformIO project: addresses come from the env's
FLASH_EXTRA_IMAGES and ESP32_APP_OFFSET, never from fixed values. No device operations.
"""
Import("env")
import base64
import hashlib
import json
from pathlib import Path


def package_firmware(source, target, env):
    platform = env.PioPlatform()
    board = env.BoardConfig()
    images = [(offset, Path(env.subst(str(path)))) for offset, path in env.get("FLASH_EXTRA_IMAGES", [])]
    images.append((env.subst("$ESP32_APP_OFFSET"), Path(env.subst("$BUILD_DIR/${PROGNAME}.bin"))))
    expected = {"bootloader.bin", "partitions.bin", "boot_app0.bin", "firmware.bin"}
    if {path.name for _, path in images} != expected or len(images) != 4:
        raise RuntimeError("Unexpected ESP flash image configuration")
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
    framework = json.loads((Path(platform.get_package_dir("framework-arduinoespressif32")) / "package.json").read_text())
    flash_set = {
        "format": "digicode-text-flash-set", "version": 2,
        "board": env.subst("$BOARD"), "chip": board.get("build.mcu"),
        "platform": platform.name + "@" + platform.version,
        "frameworkPackage": framework["version"],
        "flashMode": env.subst("${__get_board_flash_mode(__env__)}"),
        "flashFrequency": env.subst("${__get_board_f_image(__env__)}"),
        "flashSize": board.get("upload.flash_size"), "images": entries,
    }
    out = Path(env.subst("$BUILD_DIR/flashset.json"))
    out.write_text(json.dumps(flash_set) + "\n")
    print("Packaged ESP flash set: " + out.name)

# Always refresh the flash set, even when the compiler reuses the existing firmware.
env.AddPostAction("buildprog", package_firmware)
