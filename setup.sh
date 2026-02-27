#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
# LinkedIn Scheduler v3 — Hostinger VPS Setup
# Run as root on Ubuntu 22.04 / 24.04
# Usage: bash setup.sh schedular.thebhtlabs.com
# ══════════════════════════════════════════════════════════════════════════

set -e

DOMAIN=${1:-"schedular.thebhtlabs.com"}
APP_DIR="/var/www/linkedin-scheduler"
NODE_VERSION="20"
LOG_DIR="/var/log/linkedin-scheduler"

echo ""
echo "========================================================"
echo "  LinkedIn Scheduler v3 — BHT Labs"
echo "  Deploying to: ${DOMAIN}"
echo "========================================================"
echo ""

# 1. System update
echo "[1/9] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# 2. Node.js 20
echo "[2/9] Installing Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs -qq
fi
echo "  Node: $(node -v) | npm: $(npm -v)"

# 3. System tools
echo "[3/9] Installing Nginx, PM2, Certbot, build tools..."
apt-get install -y nginx certbot python3-certbot-nginx build-essential python3 -qq
npm install -g pm2 --quiet
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "^sudo" | bash || true

# 4. App directories
echo "[4/9] Creating app directories..."
mkdir -p "${APP_DIR}"/{backend,frontend,uploads,data}
mkdir -p "${LOG_DIR}"
chmod 755 "${APP_DIR}"
chmod 777 "${APP_DIR}/uploads"
chmod 777 "${APP_DIR}/data"
chmod 755 "${LOG_DIR}"

# 5. package.json with all v3 dependencies
echo "[5/9] Writing package.json and installing dependencies..."
cat > "${APP_DIR}/package.json" << 'PKGJSON'
{
  "name": "linkedin-scheduler",
  "version": "3.0.0",
  "description": "BHT Labs LinkedIn Scheduler",
  "main": "backend/server.js",
  "scripts": { "start": "node backend/server.js" },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "axios": "^1.6.0",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "csv-parse": "^5.5.3",
    "express": "^4.18.2",
    "form-data": "^4.0.0",
    "multer": "^1.4.5-lts.1",
    "node-cron": "^3.0.3",
    "openai": "^4.52.0",
    "xlsx": "^0.18.5"
  },
  "engines": { "node": ">=18.0.0" }
}
PKGJSON

cd "${APP_DIR}"
npm install --production 2>&1 | tail -3
echo "  Dependencies installed."

# 6. PM2 ecosystem config
echo "[6/9] Writing PM2 ecosystem config..."

# Preserve existing API keys if redeploying
EXISTING_ANTHROPIC=""
EXISTING_OPENAI=""
if [ -f "${APP_DIR}/ecosystem.config.js" ]; then
  EXISTING_ANTHROPIC=$(grep -o "ANTHROPIC_API_KEY: '[^']*'" "${APP_DIR}/ecosystem.config.js" 2>/dev/null | cut -d"'" -f2 || true)
  EXISTING_OPENAI=$(grep -o "OPENAI_API_KEY: '[^']*'" "${APP_DIR}/ecosystem.config.js" 2>/dev/null | cut -d"'" -f2 || true)
fi

ANTHRO_VAL="${EXISTING_ANTHROPIC:-YOUR_ANTHROPIC_KEY_HERE}"
OPENAI_VAL="${EXISTING_OPENAI:-YOUR_OPENAI_KEY_HERE}"

cat > "${APP_DIR}/ecosystem.config.js" << ECOSYSTEM
module.exports = {
  apps: [{
    name: 'linkedin-scheduler',
    script: 'backend/server.js',
    cwd: '${APP_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      ANTHROPIC_API_KEY: '${ANTHRO_VAL}',
      OPENAI_API_KEY:    '${OPENAI_VAL}'
    },
    error_file: '${LOG_DIR}/err.log',
    out_file:   '${LOG_DIR}/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
ECOSYSTEM

# 7. Nginx config
echo "[7/9] Configuring Nginx for ${DOMAIN}..."
cat > /etc/nginx/sites-available/linkedin-scheduler << NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        proxy_send_timeout 300s;
    }

    location /uploads/ {
        alias ${APP_DIR}/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/linkedin-scheduler /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
echo "  Nginx configured."

# 8. SSL certificate
echo "[8/9] Obtaining SSL certificate for ${DOMAIN}..."
if [ "${DOMAIN}" != "localhost" ]; then
  certbot --nginx \
    -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --redirect \
    2>&1 | tail -5 || {
      echo "  WARNING: SSL cert failed. DNS may not be pointed yet."
      echo "  Run after DNS propagates:"
      echo "  certbot --nginx -d ${DOMAIN} --agree-tos --register-unsafely-without-email"
  }
else
  echo "  Skipping SSL for localhost."
fi

# 9. Start app
echo "[9/9] Starting app with PM2..."
cd "${APP_DIR}"
pm2 delete linkedin-scheduler 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo "  PM2 started."

# Firewall
ufw allow 22/tcp   2>/dev/null || true
ufw allow 80/tcp   2>/dev/null || true
ufw allow 443/tcp  2>/dev/null || true
ufw --force enable 2>/dev/null || true

# Health check
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/stats 2>/dev/null || echo "000")
if [ "${HTTP_CODE}" = "200" ]; then
  APP_STATUS="HEALTHY — app responding on port 3001"
else
  APP_STATUS="WARNING — HTTP ${HTTP_CODE} — check: pm2 logs linkedin-scheduler"
fi

echo ""
echo "========================================================"
echo "  LinkedIn Scheduler v3 Deployed"
echo "========================================================"
echo "  URL:      https://${DOMAIN}"
echo "  App dir:  ${APP_DIR}"
echo "  Logs:     pm2 logs linkedin-scheduler"
echo "  Restart:  pm2 restart linkedin-scheduler"
echo "  Health:   ${APP_STATUS}"
echo ""
echo "  NEXT STEPS:"
echo "  1. Add API keys to ${APP_DIR}/ecosystem.config.js"
echo "  2. pm2 restart linkedin-scheduler"
echo "  3. Open portal > Settings > LinkedIn Connection"
echo "========================================================"
echo ""
