"""Keep host paths out of __FILE__ strings and debug information at compile time.

Shared by every ESP-family project: the framework package name is read from the platform
manifest, so the same script serves espressif32 and espressif8266.
"""
Import("env")
from pathlib import Path

platform = env.PioPlatform()
package = platform.frameworks[env.subst("$PIOFRAMEWORK").split()[0]]["package"]
env.Append(BUILD_FLAGS=[
    "-ffile-prefix-map=%s=%s" % (Path(platform.get_package_dir(package)).resolve(), package),
    "-ffile-prefix-map=%s=." % Path(env.subst("$PROJECT_DIR")).resolve(),
])
