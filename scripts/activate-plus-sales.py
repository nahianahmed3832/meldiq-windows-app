#!/usr/bin/env python3
"""Activate the verified monthly offer through the current API's own operator socket.

No image/schema change, direct database writes, old-plan repricing or buyer charge.
The caller must hold current test evidence and explicitly select activation.
"""
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import urllib.request

os.umask(0o077)
p = json.load(sys.stdin)
assert p['activate'] is True and p['providerTestsPassed'] >= 149
base = Path('/opt/griip-internal-messaging')
locks = []
for name in ['/run/lock/meldiq-production-release.lock', str(base / '.deploy.lock')]:
    handle = open(name, 'a+')
    fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    locks.append(handle)

def run(args, data=None, timeout=180):
    r = subprocess.run(args, input=data, capture_output=True, cwd=base, timeout=timeout)
    if r.returncode:
        raise RuntimeError('Command failed: ' + args[0] + '; ' + r.stderr.decode(errors='replace')[:600])
    return r.stdout

def inspect():
    return json.loads(run(['docker', 'inspect', 'griip-internal-messaging-api-1']))[0]

def response(route):
    with urllib.request.urlopen('http://127.0.0.1:18080' + route, timeout=10) as r:
        return json.load(r)

def digest(b):
    return hashlib.sha256(b).hexdigest()

before = inspect()
assert before['Image'] == 'sha256:9bb580a8be7a5f2823cd0b9a1ad95bed65291389321658d29124feebe321ba5c'
assert before['State']['Health']['Status'] == 'healthy'
assert digest((base / 'compose.yaml').read_bytes()) == '0b0c748bf408dc380933dd7f86a7df1bf06af95654bfd3af4230a0f2fe585e68'
assert response('/healthz')['databaseMode'] == 'supabase'
prepared = json.loads(Path('/opt/meldiq-desktop/history/paypal-plus-499-monthly-prepared.json').read_text())
plan = prepared['preparedPlan']['id']
assert plan == 'P-49S40199EV0769032NLVBAQI' and prepared['legacyPricingPreserved']
assert prepared['preparedPlan']['amountMinor'] == 499
assert prepared['webhook']['requiredEventsConfigured']
backup = Path(p['backupDirectory'])
assert backup.parent == Path('/var/backups/meldiq') and backup.is_dir()
manifest = json.loads((backup / 'manifest.json').read_text())
assert p['backupVerified'] is True
for key in ['complete', 'encrypted', 'allPayloadDecryptionVerified', 'consistentReadOnlySnapshot', 'fullDumpParsingVerified']:
    assert manifest.get(key) is True, 'Backup verification missing: ' + key
assert manifest['apiImageId'] == before['Image'] and manifest['rehearsal'] is False
for asset in manifest['files']:
    file = backup / asset['name']
    assert file.parent == backup and file.is_file() and not file.is_symlink()
    assert file.stat().st_size == asset['bytes']
    with file.open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == asset['sha256']
assert time.time() - backup.stat().st_mtime < 3600, 'A fresh verified encrypted backup is required'
assert list(backup.glob('*.age')), 'Encrypted backup payload missing'
existing = response('/v2/mojo/catalog')
assert existing['onSale']['plus'] is None, 'Inspect the already-active offer instead of repeating activation'
env = base / '.env'
original = env.read_bytes()
old = b'PAYPAL_PLUS_PLAN_ID=P-86K28769KY221561YNLTPK6I'
assert original.splitlines().count(old) == 1
replacement = original.replace(old, ('PAYPAL_PLUS_PLAN_ID=' + plan).encode())
assert len(original.splitlines()) == len(replacement.splitlines())
assert original.splitlines() == [old if line.startswith(b'PAYPAL_PLUS_PLAN_ID=') else line for line in replacement.splitlines()]
verify = '''import{loadConfig}from'./dist/app/config.js';
import{PayPalProvider}from'./dist/modules/billing/providers/paypal.js';
const c=loadConfig();const q=new PayPalProvider({...c.billing.provider.options,plusPlanId:'P-49S40199EV0769032NLVBAQI'});
await q.verifyPlusPlan('monthly');console.log(JSON.stringify({remoteMonthlyPlanVerified:true,amountMinor:499,currency:'USD'}));'''
verification = json.loads(run(['docker', 'exec', '-i', 'griip-internal-messaging-api-1', 'node', '--input-type=module'], verify.encode()))
assert verification['remoteMonthlyPlanVerified'] is True

def replace(data):
    fd, temporary = tempfile.mkstemp(prefix='.plus-env-', dir=base)
    try:
        with os.fdopen(fd, 'wb') as out:
            out.write(data)
        os.chmod(temporary, env.stat().st_mode & 0o777)
        os.replace(temporary, env)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

def recreate():
    run(['docker', 'compose', '-p', 'griip-internal-messaging', '-f', 'compose.yaml', 'up', '-d', '--no-deps', '--no-build', '--pull', 'never', 'api'])

def healthy():
    until = time.monotonic() + 150
    while time.monotonic() < until:
        try:
            h = response('/healthz')
            if inspect()['State']['Health']['Status'] == 'healthy' and h['ok'] and h['redis'] and h['postgres'] and h['databaseMode'] == 'supabase':
                return h
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError('Current API health deadline exceeded')

published = False
try:
    replace(replacement)
    run(['docker', 'compose', '-p', 'griip-internal-messaging', '-f', 'compose.yaml', 'config', '-q'])
    recreate()
    health = healthy()
    after = inspect()
    assert after['Image'] == before['Image']
    entries = lambda i: sorted(v for v in i['Config']['Env'] if not v.startswith('PAYPAL_PLUS_PLAN_ID='))
    assert entries(before) == entries(after), 'An unrelated environment setting changed'
    assert ('PAYPAL_PLUS_PLAN_ID=' + plan) in after['Config']['Env']
    mounts = lambda i: sorted(i['Mounts'], key=lambda mount: mount['Destination'])
    assert mounts(before) == mounts(after), 'Application data mount changed'
    for key in ['Memory', 'MemorySwap', 'NanoCpus', 'CpuQuota', 'CpuPeriod', 'PortBindings', 'ReadonlyRootfs']:
        assert before['HostConfig'][key] == after['HostConfig'][key], 'Runtime setting changed: ' + key
    # From this point customers may acquire the new agreement. Never revert to a configuration
    # that cannot reconcile it; failed publication requires inspection/repair forward.
    published = True
    cli = run(['docker', 'exec', 'griip-internal-messaging-api-1', 'node', 'dist/admin.js', 'billing-paypal-plus', '--term=monthly', '--publish']).decode()
    catalog = response('/v2/mojo/catalog')
    assert catalog['onSale']['plus'] == {'currency': 'USD', 'amountMinor': 499}
    assert next(t for t in catalog['plusTerms'] if t['key'] == 'monthly')['available'] is True
    assert catalog['onSale']['spark'] == existing['onSale']['spark'] and catalog['onSale']['botsPlus'] == existing['onSale']['botsPlus']
    assert all(not t['available'] for t in catalog['plusTerms'] if t['key'] != 'monthly')
    result = {'activatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'sourceCommit': p['sourceCommit'], 'providerRegressionPassed': p['providerTestsPassed'], 'apiImage': after['Config']['Image'], 'apiImageId': after['Image'], 'databaseMode': health['databaseMode'], 'backupDirectory': str(backup), 'envBeforeSha256': digest(original), 'envAfterSha256': digest(replacement), 'monthlyPlanId': plan, 'operatorResult': cli.strip(), 'onSale': catalog['onSale'], 'plusTerms': catalog['plusTerms'], 'scope': 'shared web/Windows monthly purchase availability enabled; no buyer approval, charge, successful signed webhook or entitlement activation claimed', 'legacyProviderPlanChanged': False, 'schemaChanged': False, 'otherRuntimeSettingsPreserved': True, 'otherProductsPreserved': True}
    path = Path('/opt/meldiq-desktop/history') / ('plus-sales-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '.json')
    path.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))
except Exception:
    if not published:
        replace(original)
        recreate()
        healthy()
    raise
