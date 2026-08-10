#!/usr/bin/env bash
#
# Installs Mamaronext as a systemd service that starts on boot.
#
#   ./deploy/install-service.sh                     # served at the domain root
#   BASE_PATH=/mamaronext ./deploy/install-service.sh   # served under a sub-path
#
# BASE_PATH is recorded in the unit so restart.sh can read it back and build
# with the same value — the build and the running server have to agree, or the
# page loads without its stylesheet.

set -euo pipefail

SERVICE="${SERVICE:-mamaronext}"
BASE_PATH="${BASE_PATH:-}"

# Resolve the repo root from this script's location, so it works from anywhere.
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NPM="$(command -v npm)"

if [[ -z "$NPM" ]]; then
  echo "npm not found on PATH. Install Node 18.18+ first." >&2
  exit 1
fi

echo "Repo:       $REPO"
echo "User:       $USER"
echo "npm:        $NPM"
echo "Base path:  ${BASE_PATH:-<domain root>}"
echo

# Build before the first start so the service has something to serve.
( cd "$REPO" && BASE_PATH="$BASE_PATH" "$NPM" run build )

sudo tee "/etc/systemd/system/${SERVICE}.service" >/dev/null <<UNIT
[Unit]
Description=Mamaronext — 2026-2027 district and school goals
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${REPO}
Environment=NODE_ENV=production
Environment=BASE_PATH=${BASE_PATH}
ExecStart=${NPM} run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now "$SERVICE"

echo
sudo systemctl status "$SERVICE" --no-pager --lines=5 || true
echo
echo "Installed and enabled — it will come back on reboot."
echo "Update later with: ${REPO}/restart.sh"
