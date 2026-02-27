#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
# deploy.sh — Push LinkedIn Scheduler v3 to Hostinger VPS
#
# Usage (from the linkedin-scheduler/ folder on your local machine):
#   bash deploy.sh <VPS_IP> [SSH_KEY_PATH]
#
# Examples:
#   bash deploy.sh 185.123.45.67
#   bash deploy.sh 185.123.45.67 ~/.ssh/hostinger_key
#
# What this does:
#   1. Rsync all source files to /var/www/linkedin-scheduler on the VPS
#   2. Runs setup.sh on the VPS (installs Node, Nginx, SSL, PM2, dependencies)
#   3. Restarts the app
#   4. Prints the live URL
#
# Prerequisites (local machine):
#   - SSH access to root@VPS_IP
#   - rsync installed (brew install rsync on Mac, apt install rsync on Linux)
# ══════════════════════════════════════════════════════════════════════════

set -e

# ── Config ────────────────────────────────────────────────────────────────
VPS_IP="${1}"
SSH_KEY="${2}"
DOMAIN="schedular.thebhtlabs.com"
APP_DIR="/var/www/linkedin-scheduler"
REMOTE="root@${VPS_IP}"

# ── Validation ────────────────────────────────────────────────────────────
if [ -z "${VPS_IP}" ]; then
  echo ""
  echo "ERROR: VPS IP address is required."
  echo "Usage: bash deploy.sh <VPS_IP> [SSH_KEY_PATH]"
  echo ""
  echo "Example: bash deploy.sh 185.123.45.67 ~/.ssh/hostinger_key"
  echo ""
  exit 1
fi

# Build SSH/rsync options
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=15"
if [ -n "${SSH_KEY}" ] && [ -f "${SSH_KEY}" ]; then
  SSH_OPTS="${SSH_OPTS} -i ${SSH_KEY}"
  echo "Using SSH key: ${SSH_KEY}"
fi

RSYNC_SSH="ssh ${SSH_OPTS}"

echo ""
echo "========================================================"
echo "  Deploying LinkedIn Scheduler v3"
echo "  Target: ${REMOTE}"
echo "  Domain: ${DOMAIN}"
echo "========================================================"
echo ""

# ── Step 1: Test SSH connection ───────────────────────────────────────────
echo "[1/4] Testing SSH connection to ${VPS_IP}..."
ssh ${SSH_OPTS} "${REMOTE}" "echo '  SSH OK — connected as $(whoami) on $(hostname)'" || {
  echo ""
  echo "ERROR: Cannot connect to ${REMOTE}"
  echo ""
  echo "Check:"
  echo "  1. VPS IP is correct: ${VPS_IP}"
  echo "  2. Root SSH is enabled on your Hostinger VPS"
  echo "  3. SSH key path is correct (if using key auth)"
  echo "  4. Try manually: ssh root@${VPS_IP}"
  echo ""
  exit 1
}

# ── Step 2: Rsync source files to VPS ────────────────────────────────────
echo "[2/4] Uploading source files to ${APP_DIR}..."

# Create target directories first
ssh ${SSH_OPTS} "${REMOTE}" "mkdir -p ${APP_DIR}/{backend,frontend,uploads,data} && chmod 777 ${APP_DIR}/uploads ${APP_DIR}/data"

# Rsync everything except node_modules, data, uploads (preserve user data)
rsync -avz --progress \
  --exclude 'node_modules/' \
  --exclude 'data/' \
  --exclude 'uploads/' \
  --exclude '.git/' \
  --exclude '*.log' \
  --exclude 'deploy.sh' \
  -e "${RSYNC_SSH}" \
  . "${REMOTE}:${APP_DIR}/"

echo "  Files uploaded."

# ── Step 3: Run setup on VPS ──────────────────────────────────────────────
echo "[3/4] Running setup on VPS (this takes 2-4 minutes)..."
echo "      Installing Node.js, Nginx, PM2, SSL, dependencies..."
echo ""

ssh ${SSH_OPTS} "${REMOTE}" "
  chmod +x ${APP_DIR}/setup.sh
  bash ${APP_DIR}/setup.sh ${DOMAIN}
"

# ── Step 4: Final health check ────────────────────────────────────────────
echo ""
echo "[4/4] Verifying deployment..."
sleep 2

# Test HTTP first (SSL may take a moment)
HTTP_STATUS=$(ssh ${SSH_OPTS} "${REMOTE}" "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/api/stats 2>/dev/null || echo '000'")

if [ "${HTTP_STATUS}" = "200" ]; then
  echo "  App health: OK (HTTP 200)"
else
  echo "  App health: HTTP ${HTTP_STATUS}"
  echo "  Check logs: ssh root@${VPS_IP} 'pm2 logs linkedin-scheduler --lines 30'"
fi

echo ""
echo "========================================================"
echo "  DEPLOYMENT COMPLETE"
echo "========================================================"
echo ""
echo "  Live URL:  https://${DOMAIN}"
echo ""
echo "  REQUIRED NEXT STEPS:"
echo ""
echo "  1. Add your API keys:"
echo "     ssh root@${VPS_IP}"
echo "     nano ${APP_DIR}/ecosystem.config.js"
echo "     -> Set ANTHROPIC_API_KEY and OPENAI_API_KEY"
echo "     pm2 restart linkedin-scheduler"
echo ""
echo "  2. Open the portal:"
echo "     https://${DOMAIN}"
echo "     -> Settings -> LinkedIn Connection"
echo "     -> Paste your LinkedIn access token + person URN"
echo "     -> Test Connection"
echo ""
echo "  3. DNS check (if site isn't loading):"
echo "     Make sure schedular.thebhtlabs.com A record"
echo "     points to ${VPS_IP}"
echo "     nslookup schedular.thebhtlabs.com"
echo ""
echo "  Useful SSH commands:"
echo "     pm2 status                          # app status"
echo "     pm2 logs linkedin-scheduler         # live logs"
echo "     pm2 restart linkedin-scheduler      # restart"
echo "     systemctl status nginx              # nginx status"
echo "========================================================"
echo ""
