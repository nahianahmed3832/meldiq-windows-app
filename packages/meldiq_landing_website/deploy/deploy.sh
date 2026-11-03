#!/usr/bin/env bash
# Publishes the built site (out/) to meldiq.app on the Meldiq VPS (docs/DEPLOYMENT.md). Run from the project folder
# after `npm run build` and the tests. It touches only /opt/meldiq-site and, with --nginx, the meldiq-apex nginx site:
# nothing of the API, Meldiq Web or any other site on the server.
#
#   bash deploy/deploy.sh             # upload a release, switch to it, reload nginx
#   bash deploy/deploy.sh --nginx     # also install deploy/nginx/meldiq-apex.conf (the old one is kept as .bak-<time>)
#
# A release is /opt/meldiq-site/releases/site-<UTC time>-<content hash>; /opt/meldiq-site/current points at the live
# one, so switching is one atomic rename. The newest 5 releases (and the placeholder) are kept: deploy/rollback.sh.
set -euo pipefail
HOST="${MELDIQ_SITE_HOST:-root@72.60.107.88}"
EXPECTED_CURRENT="${MELDIQ_EXPECTED_SITE_CURRENT:-}"
cd "$(dirname "$0")/.."
[ -f out/index.html ] || { echo "out/index.html is missing: run npm run build first" >&2; exit 1; }
if grep -rlq "To be confirmed: Android" out; then echo "out/ still has the Android placeholder" >&2; exit 1; fi
# The CSP allows no inline script: refuse a build that has one.
if grep -rhoE '<script[^>]*>' out --include='*.html' | grep -v 'src=' | grep -vq 'application/json'; then echo "out/ has an inline script" >&2; exit 1; fi

hash="$(find out -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -c1-10)"
release="site-$(date -u +%Y%m%dT%H%M%SZ)-${hash}"
tarball="$(mktemp -t meldiq-site).tgz"
COPYFILE_DISABLE=1 tar --no-xattrs -C out -czf "$tarball" .
echo "Uploading $release ($(du -h "$tarball" | cut -f1))"
scp -q "$tarball" "$HOST:/tmp/$release.tgz"
rm -f "$tarball"
if [ "${1:-}" = "--nginx" ]; then
  scp -q deploy/nginx/meldiq-apex.conf "$HOST:/tmp/meldiq-apex.conf.new"
fi

ssh "$HOST" RELEASE="$release" INSTALL_NGINX="${1:-}" EXPECTED_CURRENT="$EXPECTED_CURRENT" bash -s <<'REMOTE'
set -euo pipefail
exec 9>/run/lock/meldiq-production-release.lock
flock -n 9 || { echo 'Another production release is active' >&2; exit 1; }
exec 8>/opt/meldiq-site/.deploy.lock
flock -n 8 || { echo 'Another website deployment is active' >&2; exit 1; }
previous="$(readlink -f /opt/meldiq-site/current)"
if [ -n "$EXPECTED_CURRENT" ] && [ "$previous" != "$EXPECTED_CURRENT" ]; then
  echo 'The website changed since review; refusing to overwrite it' >&2
  exit 1
fi
dir="/opt/meldiq-site/releases/$RELEASE"
mkdir -p "$dir"
tar -C "$dir" -xzf "/tmp/$RELEASE.tgz"
rm -f "/tmp/$RELEASE.tgz"
chown -R root:root "$dir"
find "$dir" -type d -exec chmod 755 {} +
find "$dir" -type f -exec chmod 644 {} +
# Open tabs can still request the previous build's immutable chunks after the switch.
if [ -d "$previous/_next/static" ]; then
  cp -an "$previous/_next/static/." "$dir/_next/static/"
fi
conf=/etc/nginx/sites-available/meldiq-apex.conf
if [ "$INSTALL_NGINX" = "--nginx" ]; then
  backup="$conf.bak-$(date -u +%Y%m%dT%H%M%SZ)"
  cp -p "$conf" "$backup"
  install -m 644 /tmp/meldiq-apex.conf.new "$conf"
  rm -f /tmp/meldiq-apex.conf.new
  if ! nginx -t 2>/tmp/meldiq-site-nginx-test.log; then
    cp -p "$backup" "$conf"
    cat /tmp/meldiq-site-nginx-test.log >&2
    echo "nginx refused the new site config: the previous one is back, nothing switched" >&2
    exit 1
  fi
  echo "nginx config installed (previous: $backup)"
fi
ln -sfn "$dir" /opt/meldiq-site/current.next
mv -T /opt/meldiq-site/current.next /opt/meldiq-site/current
if ! nginx -t 2>/dev/null || ! systemctl reload nginx; then
  ln -sfn "$previous" /opt/meldiq-site/current.next
  mv -T /opt/meldiq-site/current.next /opt/meldiq-site/current
  if [ -n "${backup:-}" ]; then cp -p "$backup" "$conf"; fi
  nginx -t && systemctl reload nginx
  echo 'Website activation failed; previous release restored' >&2
  exit 1
fi
echo "live: $dir (previous: $previous)"
# Keep the newest 5 site releases; the placeholder stays.
ls -1dt /opt/meldiq-site/releases/site-* | tail -n +6 | xargs -r rm -rf
REMOTE
