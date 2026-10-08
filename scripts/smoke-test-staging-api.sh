#!/usr/bin/env bash
set -euo pipefail

api_base_url="${STAGING_API_BASE_URL:?STAGING_API_BASE_URL must be set}"
api_base_url="${api_base_url%/}"
startup_attempts="${STARTUP_ATTEMPTS:-30}"
retry_delay_seconds="${RETRY_DELAY_SECONDS:-5}"

if [[ ! "$startup_attempts" =~ ^[1-9][0-9]*$ ]]; then
  echo "STARTUP_ATTEMPTS must be a positive integer" >&2
  exit 2
fi

if [[ ! "$retry_delay_seconds" =~ ^[0-9]+$ ]]; then
  echo "RETRY_DELAY_SECONDS must be a non-negative integer" >&2
  exit 2
fi

for ((attempt = 1; attempt <= startup_attempts; attempt++)); do
  if health_response=$(curl --fail --silent --connect-timeout 3 --max-time 5 "$api_base_url/health") \
    && catalog_response=$(curl --fail --silent --connect-timeout 3 --max-time 5 "$api_base_url/applications") \
    && printf '%s' "$health_response" | python3 -c 'import json, sys; sys.exit(0 if json.load(sys.stdin).get("status") == "ok" else 1)' \
    && printf '%s' "$catalog_response" | python3 -c 'import json, sys; sys.exit(0 if isinstance(json.load(sys.stdin), list) else 1)'; then
    echo "API smoke check passed on attempt $attempt"
    exit 0
  fi

  if ((attempt < startup_attempts)); then
    sleep "$retry_delay_seconds"
  fi
done

echo "API smoke check failed after $startup_attempts attempts" >&2
exit 1
