#!/usr/bin/env python3
"""
Build-time curator: extract AMD product-specifications compare tables.

AMD embeds HTML-escaped JSON in data-json="…" on:
  - https://www.amd.com/en/products/specifications/processors.html
  - https://www.amd.com/en/products/specifications/graphics.html

NOT a runtime SPA fetch. Specs identity spine only — not game FPS.

Authority: docs/phases/phase-4.1/AMD_CATALOG_AUTOMATION.md
"""

from __future__ import annotations

import argparse
import html
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path
from typing import Any

USER_AGENT = (
    "pb3-curator/0.1 (+https://github.com/cenoda/pb3; build-time AMD catalog harvest)"
)

SOURCES = {
    "processors": {
        "url": "https://www.amd.com/en/products/specifications/processors.html",
        "sourceId": "src.manufacturer-spec.amd-processors-catalog",
        "default_name": "amd-processors-desktop-ryzen.json",
    },
    "graphics": {
        "url": "https://www.amd.com/en/products/specifications/graphics.html",
        "sourceId": "src.manufacturer-spec.amd-graphics-catalog",
        "default_name": "amd-graphics.json",
    },
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as resp:
        return resp.read().decode("utf-8", errors="replace")


def extract_data_json(page_html: str) -> dict[str, Any]:
    key = 'data-json="'
    start = page_html.find(key)
    if start < 0:
        raise ValueError("data-json attribute not found on page")
    i = start + len(key)
    end = page_html.find('"', i)
    if end < 0:
        raise ValueError("unterminated data-json attribute")
    return json.loads(html.unescape(page_html[i:end]))


def flatten_item(item: dict[str, Any]) -> dict[str, Any]:
    elements = item.get("elements") or {}
    fields: dict[str, Any] = {}
    for k, v in elements.items():
        fields[k] = v.get("formatValue") if isinstance(v, dict) else v
    return {
        "title": item.get("title"),
        "fields": fields,
        "productPageEn": (item.get("productPages") or {}).get("en"),
    }


def is_desktop_ryzen(row: dict[str, Any]) -> bool:
    fields = row.get("fields") or {}
    name = str(fields.get("name") or "")
    form = fields.get("formFactor")
    form_s = " ".join(form) if isinstance(form, list) else str(form or "")
    return "Ryzen" in name and "Desktop" in form_s


def build_catalog(
    kind: str,
    payload: dict[str, Any],
    source_url: str,
    source_id: str,
    *,
    desktop_ryzen_only: bool,
) -> dict[str, Any]:
    rows = [
        flatten_item(it) for it in (payload.get("items") or []) if isinstance(it, dict)
    ]
    filt = None
    if kind == "processors" and desktop_ryzen_only:
        rows = [r for r in rows if is_desktop_ryzen(r)]
        filt = "formFactor contains Desktop AND name contains Ryzen"
    return {
        "catalogKind": kind,
        "sourceId": source_id,
        "sourceUrl": source_url,
        "accessedAt": date.today().isoformat(),
        "itemCount": len(rows),
        "filter": filt,
        "items": rows,
        "notes": (
            "Extracted from AMD product specifications compare table data-json. "
            "Product specs only — not game FPS or relative gaming charts. "
            "Build-time curator output for multi-CPU/GPU identity spine."
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--kind", choices=["processors", "graphics", "both"], default="both"
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("benchmarks/est1/vendor-catalog"),
    )
    parser.add_argument(
        "--from-file",
        type=Path,
        help="Local HTML snapshot (used for the single kind if not both)",
    )
    parser.add_argument(
        "--all-processors",
        action="store_true",
        help="Keep all 700+ processor rows (default: desktop Ryzen only)",
    )
    parser.add_argument(
        "--pretty", action="store_true", help="Indent JSON (larger files)"
    )
    args = parser.parse_args()

    kinds = ["processors", "graphics"] if args.kind == "both" else [args.kind]
    args.out_dir.mkdir(parents=True, exist_ok=True)
    dumps_kw: dict[str, Any] = {"ensure_ascii": False}
    if args.pretty:
        dumps_kw["indent"] = 2
    else:
        dumps_kw["separators"] = (",", ":")

    for kind in kinds:
        meta = SOURCES[kind]
        if args.from_file and len(kinds) == 1:
            page = args.from_file.read_text(encoding="utf-8", errors="replace")
            url = meta["url"] + "#from-file"
        else:
            print(f"fetch {meta['url']}", file=sys.stderr)
            page = fetch(meta["url"])
            url = meta["url"]

        payload = extract_data_json(page)
        catalog = build_catalog(
            kind,
            payload,
            url,
            meta["sourceId"],
            desktop_ryzen_only=(kind == "processors" and not args.all_processors),
        )
        out_path = args.out_dir / meta["default_name"]
        if kind == "processors" and args.all_processors:
            out_path = args.out_dir / "amd-processors-all.json"
        out_path.write_text(json.dumps(catalog, **dumps_kw) + "\n", encoding="utf-8")
        print(f"wrote {out_path} items={catalog['itemCount']}", file=sys.stderr)

        if kind == "processors":
            names = [
                str((r.get("fields") or {}).get("name") or "") for r in catalog["items"]
            ]
            if any(n == "AMD Ryzen™ 5 7600" for n in names):
                print("ok: AMD Ryzen™ 5 7600 present", file=sys.stderr)
            else:
                print("warning: AMD Ryzen™ 5 7600 not found", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
