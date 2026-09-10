"""Keep host paths out of __FILE__ strings and debug information at compile time."""
Import("env")
from pathlib import Path

framework = env.PioPlatform().get_package_dir("framework-arduinoespressif32")
env.Append(BUILD_FLAGS=[
    "-ffile-prefix-map=%s=framework-arduinoespressif32" % Path(framework).resolve(),
    "-ffile-prefix-map=%s=." % Path(env.subst("$PROJECT_DIR")).resolve(),
])
