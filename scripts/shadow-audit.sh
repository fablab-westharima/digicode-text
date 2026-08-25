#!/bin/bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/shadow_audit.py" "$@"
