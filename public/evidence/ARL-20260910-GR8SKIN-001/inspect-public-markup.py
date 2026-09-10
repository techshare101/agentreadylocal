#!/usr/bin/env python3
"""Inventory fetched markup without treating missing markup as a validation pass.

Usage: python3 scripts/inspect-public-markup.py source-snapshots.json output.json
Input contains url, received_at, and rawHtml from a live public-page fetch.
This is a local syntax/inventory check, not Schema.org semantic validation.
"""
import hashlib
import json
import sys
from html.parser import HTMLParser
from pathlib import Path


class MarkupInventory(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.jsonld = []
        self.current = None
        self.itemtypes = []
        self.rdfa_types = []
        self.meta = {}
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self.current = []
        if "itemtype" in attrs:
            self.itemtypes.append(attrs["itemtype"])
        if "typeof" in attrs:
            self.rdfa_types.append(attrs["typeof"])
        if tag == "meta":
            key = attrs.get("name") or attrs.get("property")
            if key in ("description", "og:description", "twitter:description"):
                self.meta[key] = attrs.get("content", "")
        if tag == "a" and "href" in attrs:
            href = attrs["href"]
            if "maps.google.com" in href or "salontranscripts.com" in href:
                self.links.append(href)

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self.current is not None:
            self.jsonld.append("".join(self.current))
            self.current = None


def inspect(snapshot):
    html = snapshot["rawHtml"]
    parser = MarkupInventory()
    parser.feed(html)
    blocks = []
    for i, raw in enumerate(parser.jsonld):
        try:
            parsed = json.loads(raw)
            blocks.append({"index": i, "syntax": "valid_json", "data": parsed, "raw": raw})
        except json.JSONDecodeError as exc:
            blocks.append({"index": i, "syntax": "invalid_json", "error": str(exc), "raw": raw})
    return {
        "source_url": snapshot["url"],
        "observed_at": snapshot["received_at"],
        "http_status": snapshot["metadata"]["statusCode"],
        "source_html_sha256": hashlib.sha256(html.encode()).hexdigest(),
        "jsonld_block_count": len(blocks),
        "jsonld_syntax_status": "not_applicable_no_blocks" if not blocks else (
            "errors_found" if any(b["syntax"] == "invalid_json" for b in blocks) else "valid_json_only"
        ),
        "jsonld_blocks": blocks,
        "microdata_itemtypes": parser.itemtypes,
        "rdfa_types": parser.rdfa_types,
        "relevant_metadata": parser.meta,
        "relevant_links": list(dict.fromkeys(parser.links)),
    }


if __name__ == "__main__":
    snapshots = json.loads(Path(sys.argv[1]).read_text())
    output = {
        "check": "local_public_markup_inventory_v1",
        "scope": "Fetched HTML for the three listed URLs; not a full-site crawl.",
        "semantic_validation": "not_run",
        "limitation": "Does not certify Schema.org validity, Google eligibility, engine ingestion, or ranking. Zero JSON-LD blocks is not a validation pass.",
        "pages": [inspect(s) for s in snapshots],
    }
    Path(sys.argv[2]).write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps([{k: p[k] for k in ("source_url", "jsonld_block_count", "jsonld_syntax_status", "microdata_itemtypes", "rdfa_types")} for p in output["pages"]], indent=2))
