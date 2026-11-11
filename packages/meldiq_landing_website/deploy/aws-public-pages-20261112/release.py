"""Dated, guarded website-only release on the verified Frankfurt host, through SSM.

Uses the established release locks, directory layout and atomic current symlink.
No configuration, native artifact, service, credential or account-data changes.
Run with Python 3 on the origin: prepare, activate, or rollback.
"""
import datetime
import fcntl
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tarfile
import tempfile

BASE = pathlib.Path("/opt/meldiq-site")
EXPECTED_ROOT = pathlib.Path("/opt/meldiq-phase6/staged/source/opt/meldiq-site")
PREVIOUS = "releases/site-20261108T131835Z-73277418b2"
PREVIOUS_HOME = "c4a9cc287c5151f74641092494f2e0b67b42c0af4e79057b7c98db852d5b6be6"
RELEASE = "site-20261112-public-pages-6a4cbee84f"
TARGET = "releases/" + RELEASE
COMMIT = "5c3661aa74a2a55bf0cd68cb0631aaf9814af782"
ARCHIVE_SHA = "14ba6f55c54a787e95f0de99cf573322eb2d3a469019068e61bd5b874b585f5c"
MANIFEST_SHA = "c9e8cf940ce1235952a43fda5fe1a23aa35c56617f10dbff3969bff5b782c28c"
S3_PREFIX = "s3://meldiq-phase2-frankfurt-test-914016532802-artifacts/inputs/public-website/20261112/" + RELEASE
RECEIPT = BASE / "release-receipts" / (RELEASE + ".json")
MANIFEST = BASE / "release-receipts" / (RELEASE + ".manifest.json")


def run(args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()


def sha(path):
    digest = hashlib.sha256()
    with pathlib.Path(path).open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def save(receipt):
    temporary = RECEIPT.with_suffix(".next")
    temporary.write_text(json.dumps(receipt, indent=2) + "\n")
    os.chmod(temporary, 0o600)
    os.replace(temporary, RECEIPT)


def current_is(expected):
    if os.readlink(BASE / "current") != expected:
        raise RuntimeError("Current website changed since review; refusing to replace it")


def switch(target):
    temporary = BASE / ("current." + RELEASE + ".next")
    # Relative targets remain valid in both the host and the Docker bind mount.
    os.symlink(target, temporary)
    os.replace(temporary, BASE / "current")


def verify_files(destination, manifest):
    for item in manifest["files"]:
        path = destination / item["path"]
        if path.stat().st_size != item["bytes"] or sha(path) != item["sha256"]:
            raise RuntimeError("Candidate file mismatch: " + item["path"])


def protected_state():
    ids = run(["docker", "ps", "-q"]).splitlines()
    # Query only identities and start times, never environment variables or credentials.
    template = '{"name":{{json .Name}},"id":{{json .Id}},"image":{{json .Image}},"startedAt":{{json .State.StartedAt}}}'
    identity = sorted([json.loads(line) for line in run(["docker", "inspect", "--format", template, *ids]).splitlines()], key=lambda c: c["name"])
    native = pathlib.Path("/opt/meldiq-desktop/downloads/windows/0.3.3/fbfd5d377a17f296")
    protected = [
        pathlib.Path("/opt/meldiq-web/current/index.html"),
        pathlib.Path("/opt/meldiq-admin/current/dist/index.html"),
        native / "Meldiq-Setup-0.3.3-x64.exe",
        native / "release.json",
        native / "checksums.sha256",
    ]
    protected += sorted(pathlib.Path("/opt/meldiq-phase6/runtime/nginx").rglob("*.conf"))
    return {"containers": identity, "files": {str(p): sha(p) for p in protected}}


def prepare():
    current_is(PREVIOUS)
    assert sha(BASE / PREVIOUS / "index.html") == PREVIOUS_HOME
    assert shutil.disk_usage(BASE).free > 100 * 1024 * 1024
    destination = BASE / TARGET
    if destination.exists() or RECEIPT.exists():
        raise RuntimeError("This release already exists; inspect its receipt instead of overwriting it")
    before = protected_state()
    assert before["files"]["/opt/meldiq-desktop/downloads/windows/0.3.3/fbfd5d377a17f296/Meldiq-Setup-0.3.3-x64.exe"] == "fbfd5d377a17f2961322292f104fdce14083ce8a7677170a098b007e5a4f5243"
    nginx = run(["docker", "exec", "meldiq-prod-edge", "nginx", "-t"])
    with tempfile.TemporaryDirectory(prefix=RELEASE + "-") as temporary:
        staging = pathlib.Path(temporary)
        archive, manifest_path = staging / "site.tgz", staging / "manifest.json"
        for suffix, path in [(".tgz", archive), (".manifest.json", manifest_path)]:
            run(["aws", "s3", "cp", S3_PREFIX + suffix, str(path), "--region", "eu-central-1", "--only-show-errors"])
        assert sha(archive) == ARCHIVE_SHA and sha(manifest_path) == MANIFEST_SHA
        manifest = json.loads(manifest_path.read_text())
        assert manifest["releaseId"] == RELEASE and manifest["archiveSha256"] == ARCHIVE_SHA
        expected = {item["path"] for item in manifest["files"]}
        with tarfile.open(archive, "r:gz") as source:
            members = source.getmembers()
            assert len(members) == len(expected) and {m.name for m in members} == expected
            assert all(m.isfile() and not pathlib.PurePosixPath(m.name).is_absolute() and ".." not in pathlib.PurePosixPath(m.name).parts for m in members)
            destination.mkdir(mode=0o755)
            for member in members:
                target = destination / member.name
                target.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                with source.extractfile(member) as source_file, target.open("wb") as output:
                    shutil.copyfileobj(source_file, output)
                os.chmod(target, 0o644)
        verify_files(destination, manifest)
        inherited = 0
        previous_static = BASE / PREVIOUS / "_next/static"
        for old in previous_static.rglob("*"):
            if not old.is_file():
                continue
            target = destination / "_next/static" / old.relative_to(previous_static)
            if not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                shutil.copyfile(old, target)
                os.chmod(target, 0o644)
                inherited += 1
        verify_files(destination, manifest)
        RECEIPT.parent.mkdir(mode=0o700, exist_ok=True)
        shutil.copyfile(manifest_path, MANIFEST)
        os.chmod(MANIFEST, 0o600)
    current_is(PREVIOUS)
    assert protected_state() == before
    receipt = {"status": "prepared", "preparedAt": now(), "releaseId": RELEASE, "sourceCommit": COMMIT,
               "previous": PREVIOUS, "previousHomepageSha256": PREVIOUS_HOME, "target": TARGET,
               "archiveSha256": ARCHIVE_SHA, "manifestSha256": MANIFEST_SHA,
               "nextBuildId": manifest["nextBuildId"], "verifiedFiles": len(expected),
               "inheritedImmutableFiles": inherited, "protectedBefore": before, "nginxValidation": nginx,
               "rollbackPerformed": False}
    save(receipt)
    print(json.dumps({k: v for k, v in receipt.items() if k != "protectedBefore"}, indent=2))


def activate():
    current_is(PREVIOUS)
    receipt = json.loads(RECEIPT.read_text())
    assert receipt["status"] == "prepared" and sha(MANIFEST) == MANIFEST_SHA
    verify_files(BASE / TARGET, json.loads(MANIFEST.read_text()))
    assert sha(BASE / PREVIOUS / "index.html") == PREVIOUS_HOME
    assert protected_state() == receipt["protectedBefore"]
    run(["docker", "exec", "meldiq-prod-edge", "nginx", "-t"])
    switch(TARGET)
    try:
        current_is(TARGET)
        container_sha = run(["docker", "exec", "meldiq-prod-edge", "sha256sum", "/opt/meldiq-site/current/index.html"]).split()[0]
        assert container_sha == sha(BASE / TARGET / "index.html")
        assert protected_state() == receipt["protectedBefore"]
    except Exception:
        current_is(TARGET)
        switch(PREVIOUS)
        receipt.update(status="automatically-rolled-back", rollbackPerformed=True, rollbackAt=now())
        save(receipt)
        raise
    receipt.update(status="activated", activatedAt=now(), homepageSha256=container_sha, protectedStateUnchanged=True)
    save(receipt)
    print(json.dumps({k: v for k, v in receipt.items() if k != "protectedBefore"}, indent=2))


def rollback():
    current_is(TARGET)
    receipt = json.loads(RECEIPT.read_text())
    assert sha(BASE / PREVIOUS / "index.html") == PREVIOUS_HOME
    run(["docker", "exec", "meldiq-prod-edge", "nginx", "-t"])
    switch(PREVIOUS)
    restored = run(["docker", "exec", "meldiq-prod-edge", "sha256sum", "/opt/meldiq-site/current/index.html"]).split()[0]
    assert restored == PREVIOUS_HOME
    receipt.update(status="rolled-back", rollbackPerformed=True, rollbackAt=now())
    save(receipt)
    print(json.dumps({"status": receipt["status"], "current": PREVIOUS, "homepageSha256": restored}, indent=2))


if __name__ == "__main__":
    assert BASE.resolve() == EXPECTED_ROOT
    if len(sys.argv) != 2 or sys.argv[1] not in {"prepare", "activate", "rollback"}:
        raise SystemExit("Expected prepare, activate or rollback")
    with open("/run/lock/meldiq-production-release.lock", "a") as global_lock, open(BASE / ".deploy.lock", "a") as site_lock:
        fcntl.flock(global_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        fcntl.flock(site_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        {"prepare": prepare, "activate": activate, "rollback": rollback}[sys.argv[1]]()
