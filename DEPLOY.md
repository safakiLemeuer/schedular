# Deploying to schedular.thebhtlabs.com

## What you need before starting

| Item | Where to find it |
|------|-----------------|
| VPS IP address | Hostinger hPanel → VPS → your server → Overview |
| Root password or SSH key | hPanel → VPS → Access → Root password or SSH Keys |
| Anthropic API key | console.anthropic.com → API Keys |
| OpenAI API key | platform.openai.com → API Keys |
| LinkedIn access token | developer.linkedin.com → your app → Auth → Generate token |
| LinkedIn person URN | `curl -H "Authorization: Bearer TOKEN" https://api.linkedin.com/v2/userinfo` → `sub` field → format as `urn:li:person:SUB` |

---

## Step 1 — Point DNS to your VPS

In **Hostinger hPanel → Domains → DNS Zone** (or wherever thebhtlabs.com DNS is managed):

Add an **A record**:
```
Type:  A
Name:  schedular
Value: YOUR_VPS_IP
TTL:   300
```

DNS propagation takes 5-30 minutes. You can proceed with deployment while it propagates.

---

## Step 2 — Deploy from your local machine

Open a terminal in the `linkedin-scheduler/` folder (where `deploy.sh` lives):

### Option A — Password authentication
```bash
bash deploy.sh YOUR_VPS_IP
```
You'll be prompted for the root password once.

### Option B — SSH key authentication
```bash
bash deploy.sh YOUR_VPS_IP ~/.ssh/your_hostinger_key
```

That's the only command needed. It will:
- Upload all source files via rsync
- Install Node.js 20, Nginx, PM2, Certbot on the VPS
- Install all npm dependencies (including @anthropic-ai/sdk, openai)
- Configure Nginx reverse proxy for schedular.thebhtlabs.com
- Obtain a Let's Encrypt SSL certificate
- Start the app with PM2 (auto-restarts on crash, survives reboots)

Takes about 3-5 minutes.

---

## Step 3 — Add API keys

SSH into the VPS:
```bash
ssh root@YOUR_VPS_IP
```

Edit the PM2 config:
```bash
nano /var/www/linkedin-scheduler/ecosystem.config.js
```

Find these two lines and fill in your keys:
```javascript
ANTHROPIC_API_KEY: 'YOUR_ANTHROPIC_KEY_HERE',   // <- paste sk-ant-...
OPENAI_API_KEY:    'YOUR_OPENAI_KEY_HERE'        // <- paste sk-...
```

Save (`Ctrl+O`, `Enter`, `Ctrl+X`), then restart:
```bash
pm2 restart linkedin-scheduler
pm2 status   # should show "online"
```

---

## Step 4 — Connect LinkedIn

Open **https://schedular.thebhtlabs.com** in your browser.

Go to **Settings → LinkedIn Connection**:

1. Paste your LinkedIn **Access Token** (from developer.linkedin.com → your app → Auth tab → Generate token with `w_member_social` scope)
2. Paste your **Person URN** — get it with:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.linkedin.com/v2/userinfo
   ```
   Take the `sub` field and format it as: `urn:li:person:SUB_VALUE`
3. Click **Save**, then **Test Connection** — you should see your LinkedIn name confirmed
4. Enable **Auto-Schedule**, **Auto-Hashtags**, and **Auto-Image** toggles

---

## Verify it's working

```bash
# On the VPS — check app is running
pm2 status

# Check it's responding
curl -s http://127.0.0.1:3001/api/stats | python3 -m json.tool

# Check SSL is working
curl -I https://schedular.thebhtlabs.com

# Watch live logs
pm2 logs linkedin-scheduler
```

---

## Redeploying after code changes

From your local `linkedin-scheduler/` folder:
```bash
bash deploy.sh YOUR_VPS_IP
```

The script preserves your API keys, uploaded images, and database on redeploy.

---

## Useful VPS commands

```bash
# App management
pm2 status                               # running processes
pm2 logs linkedin-scheduler             # live log stream
pm2 logs linkedin-scheduler --lines 50  # last 50 log lines
pm2 restart linkedin-scheduler          # restart app
pm2 stop linkedin-scheduler             # stop app

# Nginx
systemctl status nginx                  # nginx status
nginx -t                                # test config
systemctl reload nginx                  # reload config

# SSL renewal (auto, but manual if needed)
certbot renew --dry-run
certbot renew

# Database backup
cp /var/www/linkedin-scheduler/data/scheduler.db ~/scheduler-backup-$(date +%Y%m%d).db

# Uploads backup
tar -czf ~/uploads-backup-$(date +%Y%m%d).tar.gz /var/www/linkedin-scheduler/uploads/
```

---

## If something goes wrong

**Site not loading:**
```bash
pm2 status
pm2 logs linkedin-scheduler --lines 30
systemctl status nginx
curl http://127.0.0.1:3001/api/stats
```

**SSL cert failed:**
```bash
# Run after DNS has propagated (check: nslookup schedular.thebhtlabs.com)
certbot --nginx -d schedular.thebhtlabs.com --agree-tos --register-unsafely-without-email
```

**Posts not publishing to LinkedIn:**
- Settings → Test Connection → confirm it shows your name
- Check token isn't expired (60-day lifetime)
- `pm2 logs linkedin-scheduler` — look for `[Scheduler]` lines

**Auto-image not generating:**
- Confirm `OPENAI_API_KEY` is set in ecosystem.config.js
- `pm2 restart linkedin-scheduler` after adding the key
- Check OpenAI account has credits

**BHT violations blocking a post:**
- Portal → Posts → open the post → the violation ID and hint are shown
- Fix the flagged content and save
- Or use the ⚡ Auto-Fill button — it applies auto-fixes where possible
