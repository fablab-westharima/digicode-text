"""Package only built flash images and portable metadata; no device operations."""
Import("env")
import hashlib
import json
from pathlib import Path
import zipfile


def package_firmware(source, target, env):
    platform = env.PioPlatform()
    board = env.BoardConfig()
    images = [(offset, Path(env.subst(str(path)))) for offset, path in env.get("FLASH_EXTRA_IMAGES", [])]
    images.append((env.subst("$ESP32_APP_OFFSET"), Path(env.subst("$BUILD_DIR/${PROGNAME}.bin"))))
    expected = {"bootloader.bin", "partitions.bin", "boot_app0.bin", "firmware.bin"}
    if {path.name for _, path in images} != expected or len(images) != 4:
        raise RuntimeError("Unexpected C3 flash image configuration")
    entries = []
    payloads = {}
    previous_end = 0
    for offset, path in sorted(images, key=lambda item: int(str(item[0]), 0)):
        address = int(str(offset), 0)
        content = path.read_bytes()
        if not content or address < previous_end or address + len(content) > 4 * 1024 * 1024:
            raise RuntimeError("Invalid/overlapping flash images")
        previous_end = address + len(content)
        payloads[path.name] = content
        entries.append({"file": path.name, "address": hex(address), "size": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    framework = json.loads((Path(platform.get_package_dir("framework-arduinoespressif32")) / "package.json").read_text())
    manifest = {
        "format": "digicode-text-flash-set", "version": 1,
        "board": env.subst("$BOARD"), "chip": board.get("build.mcu"),
        "platform": "espressif32@" + platform.version,
        "frameworkPackage": framework["version"],
        "flashMode": env.subst("${__get_board_flash_mode(__env__)}"),
        "flashFrequency": env.subst("${__get_board_f_image(__env__)}"),
        "flashSize": board.get("upload.flash_size"), "images": entries,
    }
    payloads["manifest.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    payloads["README.txt"] = ("Seeed Studio XIAO ESP32C3 / DigiCode Text\n"
        "Build artifacts only; device flashing and Wi-Fi connectivity are NOT verified.\n"
        "Use all four BIN files at the addresses in manifest.json, with chip/flash settings from that file.\n"
        "firmware.bin alone is not a complete first-flash image. This archive does not flash a device.\n"
        "Addresses come from this build's FLASH_EXTRA_IMAGES and ESP32_APP_OFFSET.\n").encode()
    archive = Path(env.subst("$BUILD_DIR/firmware.zip"))
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as bundle:
        for name, content in payloads.items():
            bundle.writestr(name, content)
    print("Packaged C3 flash set: " + archive.name)

# Always refresh the archive, even when the compiler reuses the existing firmware.
env.AddPostAction("buildprog", package_firmware)
