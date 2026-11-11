"""Submit the dated website controller through the existing authenticated AWS CLI."""
import argparse
import hashlib
import json
import pathlib
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[2]
INSTANCE = "i-05aee65dfc8a5adb9"


def aws(arguments):
    process = subprocess.run(
        ["aws", "--profile", "griipbuddy", "--region", "eu-central-1", "--no-cli-pager",
         *arguments, "--output", "json"],
        capture_output=True, text=True, timeout=90,
    )
    if process.returncode:
        raise RuntimeError(process.stderr.strip())
    return json.loads(process.stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["prepare", "activate", "rollback"])
    action = parser.parse_args().action
    if aws(["sts", "get-caller-identity"])["Account"] != "914016532802":
        raise RuntimeError("Unexpected AWS account")
    host = aws(["ec2", "describe-instances", "--instance-ids", INSTANCE])["Reservations"][0]["Instances"][0]
    if host["State"]["Name"] != "running" or host["PublicIpAddress"] != "63.186.9.183":
        raise RuntimeError("The reviewed Frankfurt target has changed")
    source = pathlib.Path(__file__).with_name("release.py").read_text()
    script = "python3 - " + action + " <<'MELDIQ_RELEASE_PY'\n" + source + "\nMELDIQ_RELEASE_PY\n"
    command = aws([
        "ssm", "send-command", "--instance-ids", INSTANCE,
        "--document-name", "AWS-RunShellScript",
        "--comment", "Meldiq website " + action + " 5c3661a",
        "--parameters", json.dumps({"commands": [script], "executionTimeout": ["180"]}),
        "--timeout-seconds", "120",
    ])
    command_id = command["Command"]["CommandId"]
    output = ROOT / "reports/public-pages-20261112/deployment"
    output.mkdir(parents=True, exist_ok=True)
    prefix = output / (action + "-" + command_id)
    prefix.with_suffix(".command.json").write_text(json.dumps({
        "commandId": command_id, "action": action,
        "controllerSha256": hashlib.sha256(source.encode()).hexdigest(),
    }, indent=2) + "\n")
    print(command_id, flush=True)
    for _ in range(100):
        time.sleep(2)
        try:
            result = aws(["ssm", "get-command-invocation", "--command-id", command_id, "--instance-id", INSTANCE])
        except RuntimeError as error:
            if "InvocationDoesNotExist" in str(error):
                continue
            raise
        if result["Status"] in {"Pending", "InProgress", "Delayed"}:
            continue
        prefix.with_suffix(".result.json").write_text(json.dumps(result, indent=2) + "\n")
        print(result["Status"])
        print(result.get("StandardOutputContent", ""))
        print(result.get("StandardErrorContent", ""))
        return 0 if result["Status"] == "Success" else 1
    raise RuntimeError("No terminal SSM result; inspect this command before retrying")


if __name__ == "__main__":
    raise SystemExit(main())
