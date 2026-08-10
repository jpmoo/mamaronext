#!/usr/bin/env bash
#
# Stop the service, pull the latest code, rebuild, start it again.
#
#   ./restart.sh
#
# BASE_PATH is read back out of the installed systemd unit, so the rebuild
# always matches how the service actually runs. Set BASE_PATH in the environment
# to override it for one run.

set -euo pipefail

SERVICE="${SERVICE:-mamaronext}"
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! systemctl list-unit-files "${SERVICE}.service" --no-legend | grep -q .; then
  echo "No ${SERVICE}.service installed. Run ./deploy/install-service.sh first." >&2
  exit 1
fi

# Single source of truth: whatever the unit was installed with.
if [[ -z "${BASE_PATH:-}" ]]; then
  BASE_PATH="$(systemctl show -p Environment --value "$SERVICE" 2>/dev/null \
    | tr ' ' '\n' | sed -n 's/^BASE_PATH=//p' | head -1)"
fi

echo "==> Stopping ${SERVICE}"
sudo systemctl stop "$SERVICE"

echo "==> Pulling"
git pull --ff-only

echo "==> Installing dependencies"
npm ci

echo "==> Building (base path: ${BASE_PATH:-<domain root>})"
BASE_PATH="${BASE_PATH:-}" npm run build

echo "==> Starting ${SERVICE}"
sudo systemctl start "$SERVICE"

echo
sudo systemctl status "$SERVICE" --no-pager --lines=5 || true
