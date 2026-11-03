#!/usr/bin/env bash
# Points meldiq.app back at an earlier release (default: the one before the live one) and reloads nginx.
#   bash deploy/rollback.sh                       # the previous release
#   bash deploy/rollback.sh placeholder-20261028T064127Z
set -euo pipefail
HOST="${MELDIQ_SITE_HOST:-root@72.60.107.88}"
ssh "$HOST" TARGET="${1:-}" bash -s <<'REMOTE'
set -euo pipefail
live="$(readlink -f /opt/meldiq-site/current)"
if [ -n "$TARGET" ]; then target="/opt/meldiq-site/releases/$TARGET"
else target="$(ls -1dt /opt/meldiq-site/releases/* | grep -vx "$live" | head -1)"; fi
[ -d "$target" ] || { echo "no such release: $target" >&2; ls -1 /opt/meldiq-site/releases >&2; exit 1; }
ln -sfn "$target" /opt/meldiq-site/current.next
mv -T /opt/meldiq-site/current.next /opt/meldiq-site/current
systemctl reload nginx
echo "live: $target (was: $live)"
REMOTE
