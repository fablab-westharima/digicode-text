#!/usr/bin/env python3
"""MEASUREMENT INSTRUMENT ONLY — NOT A PRODUCTION IMPLEMENTATION.

This fixture/control runner has no authentication, no error-handling guarantees,
and no maintenance contract. It is not part of the harness and writes only below
its own probe directory.
"""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import sys
from typing import Callable

from generator import (
    PROBE_DIR,
    Fixture,
    ProbeError,
    Sources,
    render_brief,
    write_probe_file,
)


FIXTURES = (
    Fixture("Harness Maintenance", "Task-Scoped Context Brief / Read Architecture Maintenance", "VERIFICATION", "HARNESS"),
    Fixture("Product Architecture", "Managed Environment & Device Knowledge Architecture Design", "VERIFICATION", "PRODUCT_ARCH"),
    Fixture("Registry / Device Knowledge", "Registry / Device Knowledge", "VERIFICATION", "PRODUCT_ARCH"),
    Fixture("Compiler", "Compiler", "VERIFICATION", "PRODUCT_ARCH"),
    Fixture("Generic unknown task", "Generic unknown task", "VERIFICATION", "FULL_BRIEF"),
    Fixture(
        "FALSIFICATION task",
        "FALSIFICATION task — attack the task-scoped brief's load-bearing complement-visibility conclusion",
        "FALSIFICATION",
        "HARNESS",
    ),
)

EXPECTED = {
    "Harness Maintenance": "CORE12 S3-04 S3-30 S3-39 S3-44 S3-45 S3-47 B-04 B-20 B-24 B-25 B-42 B-43 B-52 B-53 B-54 B-55",
    "Product Architecture": "CORE12 S3-05 S3-07 S3-10 S3-11 S3-12 S3-13 S3-14 S3-15 S3-16 S3-17 S3-18 S3-19 S3-21 S3-22 S3-23 S3-24 S3-25 S3-26 S3-27 S3-28 S3-29 S3-32 S3-33 S3-34 S3-35 S3-36 S3-37 S3-40 S3-41 S3-42 B-02 B-03 B-13 B-15 B-18 B-21 B-27 B-28 B-29 B-32 B-34 B-35 B-36 B-38 B-39 B-40 B-45 B-47 B-48 B-50 B-51",
    "Registry / Device Knowledge": "CORE12 S3-05 S3-07 S3-10 S3-15 S3-21 S3-22 S3-23 S3-24 S3-25 S3-26 S3-27 S3-28 S3-29 S3-34 S3-35 S3-36 S3-37 B-02 B-03 B-13 B-15 B-18 B-21 B-29 B-32 B-35 B-38 B-39 B-40 B-45 B-47 B-48 B-50 B-51",
    "Compiler": "CORE12 S3-05 S3-07 S3-10 S3-11 S3-12 S3-13 S3-15 S3-16 S3-21 S3-22 S3-23 S3-25 S3-29 B-02 B-03 B-13 B-15 B-18 B-21 B-24 B-28 B-29 B-32 B-34 B-35 B-40 B-48",
    "FALSIFICATION task": "CORE12 S3-04 S3-30 S3-39 S3-44 S3-45 S3-47 B-04 B-19 B-20 B-24 B-25 B-40 B-42 B-43 B-52 B-53 B-54 B-55",
}
CORE12 = {"S3-01", "S3-02", "S3-03", "S3-06", "S3-08", "S3-20", "S3-31", "S3-38", "S3-43", "S3-46", "S3-48", "B-19"}


def expected_ids(name: str, all_ids: set[str]) -> set[str]:
    if name == "Generic unknown task":
        return set(all_ids)
    values = set(EXPECTED[name].split())
    values.discard("CORE12")
    return values | CORE12


def copy_sources(name: str) -> Sources:
    target = PROBE_DIR / "work" / name
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    live = Sources.live()
    result = Sources(target / "16.md", target / "batons.md", target / "evidence-map.md", target / "CLAUDE.md")
    for source, destination in zip((live.router, live.batons, live.evidence, live.claude), (result.router, result.batons, result.evidence, result.claude)):
        shutil.copy2(source, destination)
    return result


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if text.count(old) != 1:
        raise RuntimeError(f"mutation anchor count for {path.name}: {text.count(old)}")
    changed = text.replace(old, new, 1)
    if changed == text:
        raise RuntimeError(f"mutation did not change {path.name}")
    path.write_text(changed, encoding="utf-8")


def replace_all_checked(path: Path, old: str, new: str) -> int:
    text = path.read_text(encoding="utf-8")
    before = text.count(old)
    if before < 1:
        raise RuntimeError(f"mutation anchor absent for {path.name}")
    changed = text.replace(old, new)
    if changed.count(old) != 0 or changed.count(new) < before:
        raise RuntimeError(f"mutation count mismatch for {path.name}: before={before}")
    path.write_text(changed, encoding="utf-8")
    return before


def run_fixture(fixture: Fixture) -> dict[str, object]:
    brief, metrics = render_brief(fixture, Sources.live())
    write_probe_file(PROBE_DIR / "artifacts" / "fixtures" / f"{fixture.name.lower().replace(' ', '-').replace('/', '-')}.md", brief)
    all_ids = set(metrics["index_ids"])
    expected = expected_ids(fixture.name, all_ids)
    inline = set(metrics["inline_ids"])
    indexed = set(metrics["index_ids"])
    recovered = expected & inline
    degraded = (expected - inline) & indexed
    misses = expected - inline - indexed
    unnecessary = inline - expected
    metrics.update({
        "expected_ids": sorted(expected),
        "expected_count": len(expected),
        "recovered_inline_ids": sorted(recovered),
        "recovered_inline_count": len(recovered),
        "degraded_index_only_ids": sorted(degraded),
        "degraded_index_only_count": len(degraded),
        "miss_ids": sorted(misses),
        "miss_count": len(misses),
        "unnecessary_ids": sorted(unnecessary),
        "unnecessary_count": len(unnecessary),
        "wrong_route": metrics["route"] != fixture.expected_route,
    })
    return metrics


def control_result(number: int, name: str, action: Callable[[], tuple[str, str]]) -> dict[str, object]:
    try:
        verdict, caught_by = action()
        return {"control": number, "name": name, "verdict": verdict, "caught_by": caught_by}
    except ProbeError as error:
        return {"control": number, "name": name, "verdict": "RED", "caught_by": str(error)}


def positive_control() -> tuple[str, str]:
    sources = copy_sources("positive")
    fixture = FIXTURES[0]
    _, metrics = render_brief(fixture, sources)
    if metrics["route"] != fixture.expected_route or metrics["status"] != "ROUTED":
        return "RED", "unexpected route/status"
    return "GREEN", "96 unique items, CORE semantic guards, owner pointers, GEN match, expected route"


def control_1() -> tuple[str, str]:
    sources = copy_sources("control-1")
    line = next(line for line in sources.router.read_text(encoding="utf-8").splitlines() if line.startswith("- **A Human GO authorises"))
    replace_once(sources.router, line + "\n", "")
    render_brief(FIXTURES[0], sources)
    return "GREEN", "not caught"


def control_2() -> tuple[str, str]:
    sources = copy_sources("control-2")
    replace_all_checked(sources.router, "Task-Scoped Context Brief / Read Architecture Maintenance", "Evidence Audit / Read Architecture Maintenance")
    _, metrics = render_brief(FIXTURES[0], sources, force_route="EVIDENCE")
    if metrics["route"] != FIXTURES[0].expected_route:
        return "RED", "EXPECTED_ROUTE:HARNESS!=EVIDENCE"
    return "GREEN", "not caught"


def control_3() -> tuple[str, str]:
    sources = copy_sources("control-3")
    replace_all_checked(sources.router, "Task-Scoped Context Brief / Read Architecture Maintenance", "Unroutable maintenance placeholder")
    _, metrics = render_brief(FIXTURES[0], sources, force_no_owner=True)
    if metrics["status"] == "ERROR_NO_OWNER" and len(metrics["inline_ids"]) == 0 and len(metrics["index_ids"]) == 96:
        return "RED", "NO_OWNER_STATUS with 0 inline / 96 index entries"
    return "GREEN", "not caught"


def control_4() -> tuple[str, str]:
    sources = copy_sources("control-4")
    replace_once(sources.batons, "GEN: S008-close", "GEN: S007-stale")
    render_brief(FIXTURES[0], sources)
    return "GREEN", "not caught"


def control_5() -> tuple[str, str]:
    sources = copy_sources("control-5")
    replace_all_checked(sources.claude, "local/handover/batons.md", "local/handover/missing-batons.md")
    render_brief(FIXTURES[0], sources)
    return "GREEN", "not caught"


def control_6() -> tuple[str, str]:
    sources = copy_sources("control-6")
    replace_all_checked(sources.router, "Task-Scoped Context Brief / Read Architecture Maintenance", "Compiler and Context Brief Architecture")
    fixture = Fixture("ambiguous", "Compiler and Context Brief Architecture", "VERIFICATION", "FULL_BRIEF")
    _, metrics = render_brief(fixture, sources)
    if metrics["status"] == "FALLBACK_FULL" and "multi-domain" in str(metrics["route_reason"]):
        return "RED", "AMBIGUOUS_MULTI_DOMAIN -> FALLBACK_FULL"
    return "GREEN", "not caught"


def control_7() -> tuple[str, str]:
    sources = copy_sources("control-7")
    replace_all_checked(sources.router, "Managed Environment & Device Knowledge Architecture Design", "Context Brief Registry Schema Maintenance")
    fixture = Fixture("mislabeled", "Context Brief Registry Schema Maintenance", "VERIFICATION", "FULL_BRIEF")
    _, metrics = render_brief(fixture, sources)
    if metrics["status"] == "FALLBACK_FULL" and "multi-domain" in str(metrics["route_reason"]):
        return "RED", "MISLABEL produced HARNESS+PRODUCT_ARCH ambiguity -> FALLBACK_FULL"
    return "GREEN", "not caught"


def control_8() -> tuple[str, str]:
    sources = copy_sources("control-8")
    lines = sources.router.read_text(encoding="utf-8").splitlines()
    ruling_indexes = [index for index, line in enumerate(lines) if line.startswith("- **") and index > next(i for i, value in enumerate(lines) if value.startswith("## §3."))]
    if len(ruling_indexes) != 48:
        raise RuntimeError(f"control 8 ruling population {len(ruling_indexes)}")
    target = ruling_indexes[42]
    original = lines[target]
    lines[target] = "- **See S3-31.**"
    if lines[target] == original:
        raise RuntimeError("control 8 mutation did not change S3-43")
    sources.router.write_text("\n".join(lines) + "\n", encoding="utf-8")
    render_brief(FIXTURES[0], sources)
    return "GREEN", "not caught"


def main() -> int:
    fixture_results = [run_fixture(fixture) for fixture in FIXTURES]
    controls = [
        control_result(0, "positive unmutated run", positive_control),
        control_result(1, "delete one ALWAYS Human ruling", control_1),
        control_result(2, "force wrong owner/route", control_2),
        control_result(3, "force no owner", control_3),
        control_result(4, "stale owner GEN", control_4),
        control_result(5, "broken owner pointer", control_5),
        control_result(6, "ambiguous Objective", control_6),
        control_result(7, "mislabeled Objective", control_7),
        control_result(8, "prohibition removed while positional ID remains", control_8),
    ]
    result = {"fixtures": fixture_results, "controls": controls}
    write_probe_file(PROBE_DIR / "artifacts" / "measurements.json", json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    shutil.rmtree(PROBE_DIR / "work")
    pycache = PROBE_DIR / "__pycache__"
    if pycache.exists():
        shutil.rmtree(pycache)
    print(json.dumps({
        "fixtures": len(fixture_results),
        "fixture_bytes": {row["fixture"]: row["bytes"] for row in fixture_results},
        "controls": {str(row["control"]): row["verdict"] for row in controls},
        "measurement_file": str(PROBE_DIR / "artifacts" / "measurements.json"),
    }, ensure_ascii=False, indent=2))
    controls_valid = (
        len(controls) == 9
        and controls[0]["verdict"] == "GREEN"
        and all(row["verdict"] == "RED" for row in controls[1:])
    )
    return 0 if controls_valid else 2


if __name__ == "__main__":
    sys.exit(main())
