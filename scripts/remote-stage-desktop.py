"""Trusted operator helper. Data arrives through SSH stdin; signed URLs never appear in arguments or output."""
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

data = json.load(sys.stdin)
if data["mode"] == "download":
    target = Path(data["destination"])
    assert str(target).startswith("/opt/meldiq-desktop/") and ".." not in target.parts
    source = urlparse(data["url"])
    assert source.scheme == "https" and (source.hostname.endswith(".githubusercontent.com") or source.hostname.endswith(".blob.core.windows.net"))
    target.parent.mkdir(parents=True, exist_ok=True)

    def digest(filename):
        value = hashlib.sha256()
        with filename.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1048576), b""):
                value.update(chunk)
        return value.hexdigest()

    if not target.exists():
        temporary = target.with_name(target.name + ".partial")
        with urllib.request.urlopen(data["url"], timeout=120) as response, temporary.open("wb") as out:
            for chunk in iter(lambda: response.read(1048576), b""):
                out.write(chunk)
        assert temporary.stat().st_size == data["size"] and digest(temporary) == data["sha256"]
        temporary.chmod(0o644)
        os.replace(temporary, target)
    assert target.stat().st_size == data["size"] and digest(target) == data["sha256"]
    print(json.dumps({"file": str(target), "bytes": data["size"], "sha256": data["sha256"]}))
elif data["mode"] == "fixtures":
    run = data["run"]
    assert run.isdigit()
    for item in data["files"]:
        assert item["scenario"] in ["upgrade", "bad-hash", "bad-signature"]
        target = Path("/opt/meldiq-desktop/updates/qualification") / run / item["scenario"] / "windows/canary/release.json"
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = target.with_name("release.next")
        temporary.write_text(item["envelope"])
        temporary.chmod(0o644)
        os.replace(temporary, target)
    target = Path(data["corruptPath"])
    assert str(target).startswith("/opt/meldiq-desktop/downloads/windows/") and ".." not in target.parts
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(b"Deliberately corrupt qualification artifact")
    target.chmod(0o644)
    print("Qualification feeds staged; stable feed unchanged")
else:
    raise ValueError("Unsupported desktop staging operation")
