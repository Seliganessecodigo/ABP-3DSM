#!/bin/sh
set -eu

lock_hash=$(sha256sum package-lock.json | cut -d ' ' -f 1)
marker='node_modules/.greener-package-lock.sha256'
installed_hash=$(cat "$marker" 2>/dev/null || true)

if [ ! -x node_modules/.bin/vite ] || [ "$lock_hash" != "$installed_hash" ]; then
  npm ci
  printf '%s\n' "$lock_hash" > "$marker"
fi

exec "$@"
