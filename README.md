# LinkedIn Scheduler Portal
## Self-Hosted Automation on Hostinger VPS

---

## What This System Does

A private web portal running on your Hostinger VPS that:

- Lets you upload a CSV or Excel schedule document — each row becomes a scheduled post
- Attach images and PDFs to each post visually inside the portal
- Organizes posts into campaigns (one per topic or launch)
- Automatically fires posts to LinkedIn at the exact scheduled date and time
- Runs 24/7 without your computer being on
- Handles multiple campaigns simultaneously

---

## Files in This Package

```
linkedin-scheduler/
├── backend/
│   └── server.js          — Node.js API + scheduler engine
├── frontend/
│   └── index.html         — Full portal UI (single file)
├── setup.sh               — One-command VPS installer
├── package.json           — Node.js dependencies
└── README.md              — This file
```

---

## Step 1 — Get Your Hostinger VPS Ready

### Minimum VPS specs
- Ubuntu 22.04 or 24.04 LTS
- 1 vCPU, 2GB RAM (KVM 2 or higher on Hostinger)
- 20GB storage

### Point your domain to the VPS
In Hostinger hPanel or your DNS provider:
1. Create an A record: `@` pointing to your VPS IP address
2. Create an A record: `www` pointing to your VPS IP address
3. Wait 5 to 30 minutes for DNS to propagate

---

## Step 2 — Connect to Your VPS

Open a terminal (Windows: use PowerShell or Windows Terminal):

```bash
ssh root@YOUR_VPS_IP
```

---

## Step 3 — Upload the Files to Your VPS

From your local machine (not inside SSH), open a new terminal window:

```bash
# Upload all project files
scp -r /path/to/linkedin-scheduler root@YOUR_VPS_IP:/var/www/

# Or if you downloaded this as a zip, unzip first then:
scp -r linkedin-scheduler/ root@YOUR_VPS_IP:/var/www/
```

---

## Step 4 — Run the Setup Script

Back in your SSH session:

```bash
cd /var/www/linkedin-scheduler
chmod +x setup.sh
bash setup.sh yourdomain.com
```

Replace `yourdomain.com` with your actual domain. The script:
- Installs Node.js 20
- Installs Nginx as a reverse proxy
- Installs PM2 to keep the app running 24/7
- Gets a free SSL certificate via Let's Encrypt
- Starts the portal

**Total time: about 3 to 5 minutes.**

---

## Step 5 — Get Your LinkedIn Access Token

This is the only manual step. LinkedIn requires OAuth to post on your behalf.

### 5a. Create a LinkedIn App

1. Go to https://developer.linkedin.com
2. Sign in with your LinkedIn account
3. Click **Create App**
4. Fill in:
   - App name: `LinkedIn Scheduler` (or any name)
   - LinkedIn Page: Select your company page
   - App logo: Upload any image
5. Click **Create App**

### 5b. Request posting permission

1. Inside your app, click the **Products** tab
2. Find **Share on LinkedIn**
3. Click **Request Access**
4. Agree to terms
5. Wait for approval — usually instant to a few hours

### 5c. Generate your access token

1. Click the **Auth** tab in your app
2. Scroll to **OAuth 2.0 Tools** on the right side
3. Under **OAuth 2.0 Token Generator**, select scopes:
   - `openid`
   - `profile`
   - `w_member_social`
4. Click **Request access token**
5. Authorize with your LinkedIn account
6. Copy the **Access Token** shown

### 5d. Get your Person URN

With your access token, run this in any terminal or browser tool (Postman, curl):

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://api.linkedin.com/v2/userinfo
```

Look for the `sub` field in the response. Your Person URN is:
```
urn:li:person:THAT_SUB_VALUE
```

Example: if `sub` is `abc123XYZ`, your URN is `urn:li:person:abc123XYZ`

---

## Step 6 — Connect LinkedIn in the Portal

1. Open your portal at `https://yourdomain.com`
2. Click **Settings** in the left sidebar
3. Paste your **Access Token**
4. Paste your **Person URN**
5. Set the expiry date (LinkedIn tokens last 60 days)
6. Click **Save Configuration**
7. Click **Test Connection** — you should see your name appear

---

## Step 7 — Import Your Post Schedule

### Option A — Upload a CSV or Excel file

Go to **Import Schedule** in the portal sidebar.

Your spreadsheet needs these columns:

| Column | Required | Example |
|--------|----------|---------|
| `title` | Yes | Post 1 — The Problem |
| `body` | Yes | 67% of AI bots fail governance checks... |
| `scheduled_at` | Yes | 2026-03-05 08:00 |
| `hashtags` | No | #AIGovernance #EUAIAct |
| `campaign` | No | TheBHTLabs Launch |

Download the template from the Import page to get started.

### Option B — Create posts manually

Click **+ New Post** anywhere in the portal, fill in the form, attach your image or PDF, set the date and time, and save.

---

## Step 8 — Attach Images and Documents

After importing or creating posts:

1. Go to **Posts** in the sidebar
2. Click the edit icon (✏️) on any post
3. In the edit modal, drag and drop your image (PNG/JPG) or PDF
4. Save — the asset is linked to that post
5. When the post fires, it will include the image or document automatically

---

## How Scheduling Works

The system checks for due posts **every 60 seconds**. When a post's scheduled time arrives:

1. The scheduler picks it up automatically
2. If it has an image attached, it uploads the image to LinkedIn first
3. If it has a PDF attached, it uploads the document
4. It publishes the post with the text, hashtags, and asset
5. The post status changes to **Posted** in the portal
6. If anything fails, the status changes to **Failed** with the error message shown — you can retry with one click

The process runs 24/7 via PM2 regardless of whether your laptop is on.

---

## Managing Multiple Campaigns

Create a campaign for each topic:

- **TheBHTLabs Launch** — 8 posts, March 2026
- **AI Governance Insights** — ongoing weekly posts
- **Federal Market Outreach** — separate cadence

Each campaign has its own color, post count, and tracking. Filter the Posts view by campaign, or view all campaigns on the Calendar.

---

## Token Refresh (Every 60 Days)

LinkedIn access tokens expire after 60 days. Before expiry:

1. Go to your LinkedIn Developer app
2. Generate a new access token (same steps as above)
3. Go to **Settings** in the portal
4. Paste the new token and save

The portal shows the expiry date in Settings so you remember.

---

## Useful Commands (run via SSH)

```bash
# Check if the app is running
pm2 status

# Watch live logs
pm2 logs linkedin-scheduler

# Restart after updating files
pm2 restart linkedin-scheduler

# Stop the scheduler
pm2 stop linkedin-scheduler

# Update app files after editing locally
scp backend/server.js root@YOUR_VPS_IP:/var/www/linkedin-scheduler/backend/
pm2 restart linkedin-scheduler
```

---

## File Locations on the VPS

```
/var/www/linkedin-scheduler/
├── backend/server.js          — Main app (edit here to update logic)
├── frontend/index.html        — Portal UI (edit here to update UI)
├── uploads/                   — All uploaded images and PDFs
├── data/scheduler.db          — SQLite database (all posts, campaigns, config)
└── ecosystem.config.js        — PM2 process config
```

---

## Backup Your Data

Your database and uploads are all in `/var/www/linkedin-scheduler/`.
To back up:

```bash
# On your local machine
scp -r root@YOUR_VPS_IP:/var/www/linkedin-scheduler/data ./backup-data
scp -r root@YOUR_VPS_IP:/var/www/linkedin-scheduler/uploads ./backup-uploads
```

---

## Troubleshooting

**Portal not loading:**
```bash
pm2 status                          # Is the app running?
pm2 logs linkedin-scheduler --lines 50   # Check for errors
systemctl status nginx              # Is Nginx running?
```

**Posts not publishing:**
- Go to Settings, click Test Connection
- Check that your token has not expired (60-day limit)
- Check that your Person URN is formatted correctly: `urn:li:person:XXXXXXXX`
- Failed posts show the error message in the Posts view

**File upload fails:**
- Nginx allows up to 100MB by default (configured in setup.sh)
- LinkedIn image limit is 20MB per image
- LinkedIn document limit is 100MB per PDF

**SSL certificate issues:**
```bash
certbot renew --dry-run              # Test renewal
certbot renew                        # Force renewal
```

---

## Security Notes

- The portal has no login by default. For a private deployment, add HTTP Basic Auth in Nginx:
  ```bash
  apt-get install -y apache2-utils
  htpasswd -c /etc/nginx/.htpasswd yourusername
  # Then add to Nginx location block:
  # auth_basic "Restricted";
  # auth_basic_user_file /etc/nginx/.htpasswd;
  ```
- Your LinkedIn access token is stored in the SQLite database on your VPS. Keep SSH access secure.
- Never share your VPS IP, domain, or token publicly.
