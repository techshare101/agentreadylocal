#!/usr/bin/env python3
"""Check the public evidence bundle independently of the report renderer."""
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT_ID = "ARL-20260910-GR8SKIN-001"
evidence = ROOT / "public/evidence" / AUDIT_ID
manifest = json.loads((evidence / "manifest.json").read_text())
archive = ROOT / "public/downloads" / f"{AUDIT_ID}.zip"

assert manifest["audit_id"] == AUDIT_ID
assert manifest["status"] == "partial" and manifest["score"] is None
members = {"manifest.json"}
for artifact in manifest["artifacts"]:
    name = artifact["path"]
    assert Path(name).name == name, "Unsafe member path"
    content = (evidence / name).read_bytes()
    assert len(content) == artifact["size_bytes"], name
    assert hashlib.sha256(content).hexdigest() == artifact["sha256"], name
    members.add(name)
assert members == {p.name for p in evidence.iterdir() if p.is_file()}
for finding in manifest["findings"]:
    assert all(name in members for name in finding["evidence_files"])
for test in manifest["engine_tests"]:
    if test["status"] == "captured":
        assert test["query_submitted"] and test["observed_at"]
        assert test["screenshot"] in members and test["response_file"] in members
    else:
        assert test["verification_status"] == "pending"
        assert test["screenshot"] is None and test["response_file"] is None
with zipfile.ZipFile(archive) as zipped:
    assert zipped.testzip() is None
    assert set(zipped.namelist()) == {f"{AUDIT_ID}/{name}" for name in members}
    for name in members:
        assert zipped.read(f"{AUDIT_ID}/{name}") == (evidence / name).read_bytes()
assert archive.with_suffix(".zip.sha256").read_text().split()[0] == hashlib.sha256(archive.read_bytes()).hexdigest()
print(f"PASS: {len(members)} bundle members, source references, SHA-256 values, ZIP integrity, and pending-test rules.")
