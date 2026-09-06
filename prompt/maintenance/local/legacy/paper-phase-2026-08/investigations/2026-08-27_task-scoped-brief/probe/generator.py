#!/usr/bin/env python3
"""MEASUREMENT INSTRUMENT ONLY — NOT A PRODUCTION IMPLEMENTATION.

This probe has no authentication, no error-handling guarantees, and no maintenance
contract. It exists only to measure the draft task-scoped-brief architecture. It
must not be wired into the harness. It reads the three current-state owner files
and CLAUDE.md and writes only beneath this probe directory.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import time
from typing import Iterable


PROBE_DIR = Path(__file__).resolve().parent
REPO_ROOT = PROBE_DIR.parents[5]
ROUTER_REL = Path("prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md")
BATONS_REL = Path("prompt/maintenance/local/handover/batons.md")
EVIDENCE_REL = Path("prompt/maintenance/local/handover/evidence-map.md")
CLAUDE_REL = Path("CLAUDE.md")

BATON_IDS = (
    2, 3, 4, 5, 6, 7, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25,
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41,
    42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
)
CORE_S3 = {1, 2, 3, 6, 8, 20, 31, 38, 43, 46, 48}
CORE_IDS = {*(f"S3-{value:02d}" for value in CORE_S3), "B-19"}

# Route tags are probe metadata, not repository truth. They were fixed before the
# first generation run. PRODUCT_ARCH is deliberately broad because candidate §3.3
# explicitly refuses Compiler/Registry/Device sub-routes.
HARNESS_IDS = {
    "S3-04", "S3-30", "S3-39", "S3-44", "S3-45", "S3-47",
    "B-04", "B-05", "B-06", "B-07", "B-20", "B-24", "B-25",
    "B-42", "B-43", "B-52", "B-53", "B-54", "B-55",
}
PRODUCT_ARCH_IDS = {
    *(f"S3-{value:02d}" for value in (
        5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22,
        23, 24, 25, 26, 27, 28, 29, 32, 33, 34, 35, 36, 37, 40, 41, 42,
    )),
    *(f"B-{value:02d}" for value in (
        2, 3, 6, 13, 14, 15, 16, 18, 21, 22, 26, 27, 28, 29, 30,
        31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 47, 48, 50, 51,
    )),
}
EVIDENCE_IDS = {
    "S3-09", "S3-32", "S3-33", "S3-34", "S3-35",
    *(f"B-{value:02d}" for value in (14, 15, 17, 18, 22, 37, 38, 39, 40, 41, 44, 45, 46, 47, 48, 49)),
}
FALSIFICATION_OVERLAY = {"B-40", "B-54", "B-19", "S3-31", "S3-38", "S3-39"}
VERIFICATION_OVERLAY = {"B-40", "B-54", "S3-30"}
IMPLEMENTATION_OVERLAY = {"S3-20", "S3-43", "S3-46", "B-15", "B-18", "B-24", "B-26"}
BRIEF_MAX_BYTES = 128 * 1024

ALWAYS_SIGNATURES = {
    "S3-01": ("independent project", "READ ONLY", "never merged"),
    "S3-02": ("legacy governance", "never imported"),
    "S3-03": ("PUBLIC repository", "never writing secrets"),
    "S3-06": ("Project_Template", "not modified"),
    "S3-08": ("one declared PRIMARY_OBJECTIVE", "nothing beyond"),
    "S3-20": ("production 実装", "自動的に進まない"),
    "S3-31": ("Opus 5", "禁止する"),
    "S3-38": ("Opus 5 solo 禁止", "維持する"),
    "S3-43": ("128 KiB", "上げてはならない", "current truth", "削る"),
    "S3-46": ("READ_ALLOWANCE", "勝手に上げない"),
    "S3-48": ("Adaptive fan-out", "次 objective"),
    "B-19": ("evidence", "queues"),
}


class ProbeError(RuntimeError):
    """A deliberately small fail-closed error surface for this probe."""


@dataclass(frozen=True)
class Sources:
    router: Path
    batons: Path
    evidence: Path
    claude: Path

    @classmethod
    def live(cls) -> "Sources":
        return cls(
            REPO_ROOT / ROUTER_REL,
            REPO_ROOT / BATONS_REL,
            REPO_ROOT / EVIDENCE_REL,
            REPO_ROOT / CLAUDE_REL,
        )


@dataclass(frozen=True)
class Item:
    item_id: str
    body: str
    stub: str
    owner: str
    item_class: str
    tags: tuple[str, ...]


@dataclass(frozen=True)
class Fixture:
    name: str
    objective: str
    lane: str
    expected_route: str


def read_text(path: Path) -> str:
    if not path.is_file():
        raise ProbeError(f"OWNER_UNREACHABLE:{path}")
    return path.read_text(encoding="utf-8")


def section(text: str, start: str, end: str | None) -> str:
    start_at = text.find(start)
    if start_at < 0:
        raise ProbeError(f"SECTION_MISSING:{start}")
    end_at = len(text) if end is None else text.find(end, start_at + len(start))
    if end_at < 0:
        raise ProbeError(f"SECTION_END_MISSING:{end}")
    return text[start_at:end_at].rstrip()


def clean_markdown(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("**", "").replace("`", "")).strip()


def parse_table_rows(text: str) -> dict[int, list[str]]:
    rows: dict[int, list[str]] = {}
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in re.split(r"(?<!\\)\|", line.strip().strip("|"))]
        if not cells:
            continue
        raw_id = cells[0].replace("**", "").strip()
        if raw_id.isdigit():
            rows[int(raw_id)] = cells
    return rows


def extract_gen(text: str, owner: str) -> str:
    match = re.search(r"GEN:\s*([^*\n]+)", text)
    if match is None:
        raise ProbeError(f"GEN_MISSING:{owner}")
    return match.group(1).strip()


def stub_from_body(body: str, limit: int = 150) -> str:
    plain = clean_markdown(body)
    if len(plain) <= limit:
        return plain
    return plain[: limit - 1].rstrip() + "…"


def classify(item_id: str) -> tuple[str, tuple[str, ...]]:
    if item_id in CORE_IDS:
        return "ALWAYS", ("CORE",)
    tags: list[str] = []
    if item_id in HARNESS_IDS:
        tags.append("HARNESS")
    if item_id in PRODUCT_ARCH_IDS:
        tags.append("PRODUCT_ARCH")
    if item_id in EVIDENCE_IDS:
        tags.append("EVIDENCE")
    if item_id in {"S3-39", "B-45"}:
        item_class = "AMBIGUOUS"
    else:
        item_class = "OBJECTIVE_SCOPED"
    if not tags:
        # All 96 items must carry metadata. The safest broad tag for residual policy
        # and provenance facts is EVIDENCE; this is an explicit probe decision.
        tags.append("EVIDENCE")
    return item_class, tuple(tags)


def load_items(sources: Sources) -> tuple[list[Item], dict[str, str], dict[str, str]]:
    router = read_text(sources.router)
    batons = read_text(sources.batons)
    evidence = read_text(sources.evidence)
    claude = read_text(sources.claude)

    gens = {
        "router": extract_gen(router, "router"),
        "batons": extract_gen(batons, "batons"),
        "evidence-map": extract_gen(evidence, "evidence-map"),
    }
    if len(set(gens.values())) != 1:
        raise ProbeError(f"GEN_MISMATCH:{json.dumps(gens, ensure_ascii=False, sort_keys=True)}")

    expected_pointers = (
        "local/handover/batons.md",
        "local/handover/evidence-map.md",
        "local/handover/16_",
    )
    missing_pointers = [pointer for pointer in expected_pointers if pointer not in claude]
    if missing_pointers:
        raise ProbeError(f"OWNER_POINTER_BROKEN:{','.join(missing_pointers)}")

    router_batons = parse_table_rows(section(router, "## §2. Batons", "## §3."))
    body_batons = parse_table_rows(section(batons, "## Baton bodies", None))
    if set(router_batons) != set(BATON_IDS):
        raise ProbeError(f"ROUTER_BATON_SET:{len(router_batons)}/48")
    if set(body_batons) != set(BATON_IDS):
        raise ProbeError(f"BODY_BATON_SET:{len(body_batons)}/48")

    ruling_lines = [
        line for line in section(router, "## §3. Settled decisions", "## §4.").splitlines()
        if line.startswith("- **")
    ]
    if len(ruling_lines) != 48:
        raise ProbeError(f"RULING_SET:{len(ruling_lines)}/48")

    items: list[Item] = []
    for number, body in enumerate(ruling_lines, start=1):
        item_id = f"S3-{number:02d}"
        item_class, tags = classify(item_id)
        items.append(Item(item_id, body, stub_from_body(body), str(ROUTER_REL), item_class, tags))
    for number in BATON_IDS:
        item_id = f"B-{number:02d}"
        item_class, tags = classify(item_id)
        body_cells = body_batons[number]
        router_cells = router_batons[number]
        body = " | ".join(body_cells[1:])
        stub = clean_markdown(router_cells[1])
        items.append(Item(item_id, body, stub, str(BATONS_REL), item_class, tags))

    if len(items) != 96 or len({item.item_id for item in items}) != 96:
        raise ProbeError(f"ITEM_POPULATION:{len(items)}/96")
    by_id = {item.item_id: item for item in items}
    for item_id, signatures in ALWAYS_SIGNATURES.items():
        body = clean_markdown(by_id[item_id].body).lower()
        missing = [signature for signature in signatures if signature.lower() not in body]
        if missing:
            raise ProbeError(f"ALWAYS_SEMANTIC_GUARD:{item_id}:{','.join(missing)}")

    source_texts = {"router": router, "batons": batons, "evidence-map": evidence, "claude": claude}
    return items, gens, source_texts


def route_objective(objective: str) -> tuple[str, str, bool]:
    lowered = objective.lower()
    harness_terms = ("harness", "context brief", "context-brief", "read architecture", "close", "orchestration")
    product_terms = ("managed environment", "device knowledge", "registry", "compiler", "editor", "desktop", "helper")
    evidence_terms = ("competitor", "donor audit", "academic", "evidence")
    matched: list[str] = []
    if any(term in lowered for term in harness_terms):
        matched.append("HARNESS")
    if any(term in lowered for term in product_terms):
        matched.append("PRODUCT_ARCH")
    if any(term in lowered for term in evidence_terms):
        matched.append("EVIDENCE")
    if len(matched) == 1:
        return matched[0], f"deterministic keyword match: {matched[0]}", False
    if len(matched) > 1:
        return "FULL_BRIEF", f"ambiguous multi-domain match: {','.join(matched)}", True
    return "FULL_BRIEF", "unresolved objective: no deterministic domain match", True


def git_identity() -> dict[str, str]:
    def run(*args: str) -> str:
        result = subprocess.run(args, cwd=REPO_ROOT, check=False, text=True, capture_output=True)
        return result.stdout.strip() if result.returncode == 0 else "NOT_OBTAINED"

    head = run("git", "rev-parse", "HEAD")
    branch = run("git", "branch", "--show-current")
    dirty = run("git", "status", "--porcelain")
    return {
        "repo": REPO_ROOT.name,
        "branch": branch,
        "head": head,
        "short_head": head[:12] if head != "NOT_OBTAINED" else head,
        "dirty": "yes" if dirty else "no",
    }


def selected_ids_for(route: str, lane: str, items: Iterable[Item]) -> set[str]:
    all_ids = {item.item_id for item in items}
    if route == "FULL_BRIEF":
        return all_ids
    selected = set(CORE_IDS)
    selected.update(item.item_id for item in items if route in item.tags)
    if lane == "FALSIFICATION":
        selected.update(FALSIFICATION_OVERLAY)
    elif lane == "VERIFICATION":
        selected.update(VERIFICATION_OVERLAY)
    elif lane == "IMPLEMENTATION":
        selected.update(IMPLEMENTATION_OVERLAY)
    return selected


def render_brief(
    fixture: Fixture,
    sources: Sources,
    *,
    force_route: str | None = None,
    force_no_owner: bool = False,
) -> tuple[str, dict[str, object]]:
    started = time.perf_counter_ns()
    items, gens, source_texts = load_items(sources)
    actual_route, reason, fallback = route_objective(fixture.objective)
    if force_route is not None:
        actual_route = force_route
        reason = f"probe fault injection: forced route {force_route}"
        fallback = False
    if force_no_owner:
        actual_route = "NO_OWNER"
        reason = "probe fault injection: owner selection suppressed"
        fallback = False

    selected = set() if actual_route == "NO_OWNER" else selected_ids_for(actual_route, fixture.lane, items)
    identity = git_identity()
    generated_at = datetime.now(timezone.utc).isoformat()
    status = "ERROR_NO_OWNER" if actual_route == "NO_OWNER" else ("FALLBACK_FULL" if fallback else "ROUTED")
    by_id = {item.item_id: item for item in items}

    purpose = section(source_texts["claude"], "## 4. Strategic axis", "## 5.")
    go_stop = section(source_texts["router"], "**GO / STOP boundary**", "**Where the rest lives**")
    owner_manifest = (
        f"- router: {ROUTER_REL}; holds current position, baton stubs, settled rulings; unconditional\n"
        f"- batons: {BATONS_REL}; holds baton bodies/grounds; trigger = selected baton\n"
        f"- evidence-map: {EVIDENCE_REL}; holds provenance/read order/loop/feedback; trigger = evidence provenance"
    )
    lines = [
        "# BRIEF v2 — MEASUREMENT-ONLY PROTOTYPE OUTPUT",
        "",
        "> This brief is derived from repository owners and is not current authority.",
        "> If it conflicts with a repository owner, the repository owner is correct.",
        "> Truth not inlined still exists; INDEX carries every item ID.",
        "",
        "## L0 CORE",
        f"BRIEF-SCHEMA: probe-v1",
        f"REPO: {identity['repo']}",
        f"BRANCH: {identity['branch']}",
        f"HEAD: {identity['head']}",
        f"SHORT_HEAD: {identity['short_head']}",
        f"DIRTY: {identity['dirty']}",
        f"GENERATED_AT_UTC: {generated_at}",
        f"GEN: {gens['router']}",
        f"GEN_ROUTER: {gens['router']}",
        f"GEN_BATONS: {gens['batons']}",
        f"GEN_EVIDENCE_MAP: {gens['evidence-map']}",
        f"STATUS: {status}",
        f"ROUTE: {actual_route}",
        f"ROUTE_REASON: {reason}",
        "",
        "### OWNER MANIFEST",
        owner_manifest,
        "",
        purpose,
        "",
        go_stop,
        "",
        "### ALWAYS ITEMS (full body)",
    ]
    for item_id in sorted(CORE_IDS):
        item = by_id[item_id]
        lines.extend((f"#### {item_id} — owner `{item.owner}`", item.body, ""))

    l1_ids = sorted(selected - CORE_IDS)
    lines.extend(("## L1 SELECTED", f"SELECTED_NON_CORE_COUNT: {len(l1_ids)}", ""))
    for item_id in l1_ids:
        item = by_id[item_id]
        lines.extend((f"### {item_id} — owner `{item.owner}`", item.body, ""))

    overlay = set()
    if fixture.lane == "FALSIFICATION":
        overlay = FALSIFICATION_OVERLAY
    elif fixture.lane == "VERIFICATION":
        overlay = VERIFICATION_OVERLAY
    elif fixture.lane == "IMPLEMENTATION":
        overlay = IMPLEMENTATION_OVERLAY
    lines.extend(("## L2 LANE_OVERLAY", f"LANE: {fixture.lane}", f"OVERLAY_IDS: {','.join(sorted(overlay)) or 'NONE'}", ""))

    lines.extend(("## L3 INDEX", "INDEX_COUNT: 96"))
    for item in sorted(items, key=lambda value: value.item_id):
        delivery = "INLINE" if item.item_id in selected else "INDEX_ONLY"
        lines.append(f"- {item.item_id} [{delivery}] {item.stub} — owner: `{item.owner}`")
    lines.append("")
    brief = "\n".join(lines)
    elapsed_ns = time.perf_counter_ns() - started
    brief_bytes = len(brief.encode("utf-8"))
    if brief_bytes > BRIEF_MAX_BYTES:
        raise ProbeError(f"BRIEF_CAP_EXCEEDED:{brief_bytes}>{BRIEF_MAX_BYTES}")

    # Every asserted item body and stub is checked against a live owner extraction.
    false_fact_ids: list[str] = []
    wrong_owner = 0
    canonical_sources = clean_markdown(source_texts["router"] + "\n" + source_texts["batons"])
    for item in items:
        if item.item_id in selected and clean_markdown(item.body) not in canonical_sources:
            false_fact_ids.append(item.item_id)
        expected_owner = str(ROUTER_REL) if item.item_id.startswith("S3-") else str(BATONS_REL)
        if item.owner != expected_owner:
            wrong_owner += 1
    metrics: dict[str, object] = {
        "fixture": fixture.name,
        "objective": fixture.objective,
        "lane": fixture.lane,
        "status": status,
        "route": actual_route,
        "route_reason": reason,
        "fallback": fallback,
        "bytes": brief_bytes,
        "estimated_tokens_bytes_div_4": brief_bytes / 4,
        "generation_ns": elapsed_ns,
        "item_count": len(items),
        "inline_ids": sorted(selected),
        "index_ids": sorted(item.item_id for item in items),
        "index_only_ids": sorted(item.item_id for item in items if item.item_id not in selected),
        "false_facts": len(false_fact_ids),
        "false_fact_ids": false_fact_ids,
        "wrong_owner": wrong_owner,
        "sha256": hashlib.sha256(brief.encode("utf-8")).hexdigest(),
    }
    return brief, metrics


def write_probe_file(path: Path, content: str) -> None:
    resolved = path.resolve()
    if PROBE_DIR not in resolved.parents:
        raise ProbeError(f"WRITE_OUTSIDE_PROBE:{resolved}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
