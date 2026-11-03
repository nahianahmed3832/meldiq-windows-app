#!/usr/bin/env python3
"""Run on the existing web host with the reviewed payload on stdin; publish only callback assets."""
import base64
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone

os.umask(0o077)
payload = json.load(sys.stdin)
names = {'desktop-bridge.html', 'desktop-bridge.js', 'desktop-bridge.json', 'social-auth-callback.js', 'desktop-discord-callback.html', 'desktop-discord-return.js'}
assert set(payload['files']) == names
assert re.fullmatch('[a-f0-9]{64}', payload['identity'])
assert re.fullmatch('[a-f0-9]{40}', payload['sourceCommit'])
assert payload['expectedWebRelease'] == '/opt/meldiq-web/releases/0.5.0-beta-public-status-c60e2bf'
assert re.fullmatch('sha256:[a-f0-9]{64}', payload['expectedApiImageId'])
locks = []
for name in ['/run/lock/meldiq-production-release.lock', '/opt/griip-internal-messaging/.deploy.lock']:
    handle = open(name, 'a+')
    fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    locks.append(handle)

def command(args):
    result = subprocess.run(args, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError('Command failed: ' + args[0] + '; ' + result.stderr.decode(errors='replace')[:500])
    return result.stdout

def digest(b):
    return hashlib.sha256(b).hexdigest()

web = Path('/opt/meldiq-web/current').resolve()
assert str(web) == payload['expectedWebRelease'], 'Concurrent web release; prepare again'
container = json.loads(command(['docker', 'inspect', 'griip-internal-messaging-api-1']))[0]
assert container['Image'] == payload['expectedApiImageId'], 'Concurrent API release; prepare again'
assert container['State']['Health']['Status'] == 'healthy'
assert digest((web / 'social-auth-callback.js').read_bytes()) == 'a04fc9e006a3ed1086a262313f4c4bc2d97f3da47ba74948388da17d448e985e', 'Review newer callback before overlay'
site = Path('/etc/nginx/sites-available/meldiq-web.conf')
before = site.read_bytes()
assert digest(before) == payload['expectedNginxSha256'], 'Concurrent ingress edit; prepare again'
assert b'# Meldiq desktop browser handoff overlay' not in before, 'Already configured; inspect receipt instead of redeploying'
anchor = b'  location = /config.json {'
assert before.count(anchor) == 1
directory = Path('/opt/meldiq-desktop/hosted') / ('auth-' + payload['identity'][:16])
directory.mkdir(parents=True, exist_ok=True)
os.chmod(directory.parent, 0o755)
os.chmod(directory, 0o755)
for name, asset in payload['files'].items():
    data = base64.b64decode(asset['content'], validate=True)
    assert len(data) < 100000 and digest(data) == asset['sha256']
    target = directory / name
    if target.exists():
        assert not target.is_symlink() and target.read_bytes() == data
    else:
        with target.open('xb') as out:
            out.write(data)
        target.chmod(0o644)

routes = {('/discord/callback' if n == 'desktop-discord-callback.html' else '/' + n): n for n in names}
routes['/discord/callback/'] = 'desktop-discord-callback.html'
blocks = ['  # Meldiq desktop browser handoff overlay; immutable assets, no account or API changes.']
for route, name in sorted(routes.items()):
    content_type = 'application/json' if name.endswith('.json') else 'text/javascript' if name.endswith('.js') else 'text/html'
    blocks.append(f'''  location = {route} {{
    access_log off;
    types {{ }}
    default_type {content_type};
    add_header Cache-Control "no-store" always;
    include /etc/nginx/snippets/meldiq-web-headers.conf;
    alias {directory}/{name};
  }}''')
after = before.replace(anchor, ('\n'.join(blocks) + '\n\n').encode() + anchor)
history = Path('/opt/meldiq-desktop/history')
history.mkdir(exist_ok=True)
stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup = history / ('hosted-auth-' + stamp + '.nginx.before')
backup.write_bytes(before)

def replace(data):
    fd, temporary = tempfile.mkstemp(prefix='.meldiq-auth-', dir=site.parent)
    try:
        with os.fdopen(fd, 'wb') as out:
            out.write(data)
        os.chmod(temporary, site.stat().st_mode & 0o777)
        os.replace(temporary, site)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)

try:
    replace(after)
    command(['nginx', '-t'])
    command(['systemctl', 'reload', 'nginx'])
    # systemctl reload returns before nginx's new workers necessarily accept a request.
    # Keep the exact hash assertion, allowing a bounded overlap with draining workers.
    for route, name in routes.items():
        deadline = time.monotonic() + 15
        while True:
            actual = command(['curl', '--fail', '--silent', '--show-error', '--connect-timeout', '5', '--max-time', '15', '--resolve', 'web.meldiq.app:443:127.0.0.1', 'https://web.meldiq.app' + route])
            if digest(actual) == payload['files'][name]['sha256']:
                break
            if time.monotonic() >= deadline:
                raise RuntimeError('Served callback hash mismatch: ' + route + ' actual=' + digest(actual))
            time.sleep(0.5)
    assert Path('/opt/meldiq-web/current').resolve() == web
    assert json.loads(command(['docker', 'inspect', 'griip-internal-messaging-api-1']))[0]['Image'] == container['Image']
except Exception:
    replace(before)
    command(['nginx', '-t'])
    command(['systemctl', 'reload', 'nginx'])
    raise
receipt = {'deployedAt': datetime.now(timezone.utc).isoformat(), 'sourceCommit': payload['sourceCommit'], 'identity': payload['identity'], 'webReleasePreserved': str(web), 'apiImagePreserved': container['Image'], 'databaseChanged': False, 'callbackDirectory': str(directory), 'nginxBeforeSha256': digest(before), 'nginxAfterSha256': digest(after), 'nginxBackup': str(backup), 'routes': {r: payload['files'][n]['sha256'] for r, n in routes.items()}, 'scope': 'hosted return paths only; no provider-account approval, checkout creation, public sales activation or desktop update promotion'}
(history / ('hosted-auth-' + stamp + '.json')).write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
