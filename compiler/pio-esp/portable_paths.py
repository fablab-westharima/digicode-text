"""Keep host paths out of __FILE__ strings and debug information at compile time.

Shared by every ESP-family project: the framework packages are read from the platform
manifest, so the same script serves espressif8266 and pioarduino's espressif32.
"""
Import("env")
from pathlib import Path

platform = env.PioPlatform()
framework = platform.frameworks[env.subst("$PIOFRAMEWORK").split()[0]]
# espressif8266 names the framework's own package in its manifest. pioarduino's espressif32
# gives the framework a build script and no package name, so every framework package of the
# platform is mapped instead: the Arduino core and the prebuilt ESP-IDF libraries both carry
# headers that reach the compiler.
names = [framework["package"]] if "package" in framework else [
    name for name, options in platform.packages.items() if options.get("type") == "framework"]
flags = []
for name in names:
    # A package this build does not use is not installed and has no directory, and a pre
    # script can run before the framework itself is fetched. Map what exists.
    directory = platform.get_package_dir(name)
    if directory:
        flags.append("-ffile-prefix-map=%s=%s" % (Path(directory).resolve(), name))
# Never silently: without a framework directory the framework's own paths stay in the images,
# which is what this script exists to prevent, so say so in the build log.
if not flags:
    print("portable_paths: no framework package directory; framework paths stay in this build")
flags.append("-ffile-prefix-map=%s=." % Path(env.subst("$PROJECT_DIR")).resolve())
env.Append(BUILD_FLAGS=flags)
