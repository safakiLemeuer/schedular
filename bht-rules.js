/**
 * server.js — LinkedIn Scheduler API
 * Node.js + Express | SQLite | node-cron | LinkedIn REST API
 *
 * AI guardrails enforced via ai.js:
 *   Claude: judgment / summarization / strategy / ambiguity / generation only
 *   JS: boolean checks, filtering, date math, regex, keyword matching, timing
 */
'use strict';

const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const cron    = require('node-cron');
const sqlite3 = require('better-sqlite3');
const path    = require('path');
const fs      = require('fs');
const axios   = require('axios');
const csv     = require('csv-parse/sync');
const XLSX    = require('xlsx');

// AI module — Claude called ONLY for judgment/summarization/strategy/ambiguity
const AI = require('./ai');
const { validatePostLocally, normaliseRow, isStandardDate, suggestPostTiming, getUsageStats } = AI;

// BHT compliance engine — pure JS regex, zero API calls
const BHT = require('./bht-rules');

// Auto-pipeline — auto-schedule, auto-image (DALL-E), auto-tag orchestrator
const AutoPipeline = require('./auto-pipeline');

const app  = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const DATA_DIR    = path.join(__dirname, '../data');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR,    { recursive: true });

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Database ───────────────────────────────────────────────────────────────
const db = new sqlite3(path.join(DATA_DIR, 'scheduler.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    color       TEXT DEFAULT '#31748E',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS posts (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id      INTEGER REFERENCES campaigns(id),
    title            TEXT NOT NULL,
    body             TEXT NOT NULL,
    hashtags         TEXT DEFAULT '',
    scheduled_at     DATETIME NOT NULL,
    status           TEXT DEFAULT 'scheduled',
    auto_scheduled   INTEGER DEFAULT 0,
    auto_image       INTEGER DEFAULT 0,
    auto_hashtags    INTEGER DEFAULT 0,
    linkedin_post_id TEXT,
    posted_at        DATETIME,
    error_message    TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS post_assets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id       INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    asset_type    TEXT NOT NULL,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size     INTEGER DEFAULT 0,
    dalle_prompt  TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS bht_violations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id    INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    rule_id    TEXT NOT NULL,
    description TEXT,
    auto_fixed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS linkedin_config (
    id               INTEGER PRIMARY KEY DEFAULT 1,
    access_token     TEXT,
    person_urn       TEXT,
    token_expires_at DATETIME,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS app_config (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
  INSERT OR IGNORE INTO linkedin_config (id) VALUES (1);
  INSERT OR IGNORE INTO app_config (key, value) VALUES ('auto_schedule', '1');
  INSERT OR IGNORE INTO app_config (key, value) VALUES ('auto_image',    '1');
  INSERT OR IGNORE INTO app_config (key, value) VALUES ('auto_hashtags', '1');
`);

// ── Config helpers ─────────────────────────────────────────────────────────
function getConfig(key) {
  const row = db.prepare('SELECT value FROM app_config WHERE key=?').get(key);
  return row ? row.value === '1' : false;
}
function setConfig(key, val) {
  db.prepare('INSERT OR REPLACE INTO app_config (key, value) VALUES (?,?)').run(key, String(val ? '1' : '0'));
}
function getLinkedInConfig() {
  return db.prepare('SELECT * FROM linkedin_config WHERE id=1').get();
}

// ── Multer upload ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // JS array check — not Claude
    const allowed = ['.png','.jpg','.jpeg','.gif','.mp4','.pdf','.csv','.xlsx'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

// ── Asset type detection — JS extension check, not Claude ─────────────────
function assetTypeFromExt(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.png','.jpg','.jpeg','.gif'].includes(ext)) return 'image';
  if (ext === '.pdf') return 'document';
  return 'other';
}

function saveAssets(postId, files) {
  const stmt = db.prepare(
    'INSERT INTO post_assets (post_id, asset_type, filename, original_name, file_size) VALUES (?,?,?,?,?)'
  );
  for (const f of files) {
    stmt.run(postId, assetTypeFromExt(f.originalname), f.filename, f.originalname, f.size || 0);
  }
}

// ── Auto-generation pipeline ───────────────────────────────────────────────
// Called after a post row is inserted. Runs async in background.
// Fills in: scheduled_at (if missing), hashtags (if missing), AI image (if enabled and no image yet).
async function runAutoGeneration(postId) {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(postId);
  if (!post) return;

  const autoSched    = getConfig('auto_schedule');
  const autoHashtags = getConfig('auto_hashtags');
  const autoImage    = getConfig('auto_image');

  const updates = {};

  // ── Auto-schedule: if scheduled_at is missing or past ──────────────────
  // JS autoSchedule() — pure lookup table + date math, no Claude
  if (autoSched && (!post.scheduled_at || new Date(post.scheduled_at) < new Date())) {
    const takenDates = db.prepare(
      "SELECT scheduled_at FROM posts WHERE id != ? AND status = 'scheduled'"
    ).all(postId).map(r => r.scheduled_at);

    const result = autoSchedule(post, takenDates); // JS only
    updates.scheduled_at   = result.iso;
    updates.auto_scheduled = 1;
    console.log(`[Auto] Post ${postId} scheduled to ${result.iso} (${result.contentType})`);
  }

  // ── Auto-hashtags: Claude generates if none set ─────────────────────────
  // CLAUDE — generation (requires understanding post content and target audience)
  if (autoHashtags && (!post.hashtags || post.hashtags.trim() === '')) {
    try {
      const tags = await AI.generateHashtags(post);
      if (tags) {
        updates.hashtags      = tags;
        updates.auto_hashtags = 1;
        console.log(`[Auto] Post ${postId} hashtags: ${tags}`);
      }
    } catch (err) {
      console.warn(`[Auto] Hashtag generation failed for post ${postId}:`, err.message);
    }
  }

  // Apply text updates — JS SQL, not Claude
  if (Object.keys(updates).length > 0) {
    const cols = Object.keys(updates).map(k => `${k}=?`).join(', ');
    db.prepare(`UPDATE posts SET ${cols} WHERE id=?`).run(...Object.values(updates), postId);
  }

  // ── Auto-image: DALL-E generates if no image asset exists ──────────────
  // Claude writes prompt (generation); DALL-E renders it
  if (autoImage) {
    const existingImage = db.prepare(
      "SELECT id FROM post_assets WHERE post_id=? AND asset_type='image' LIMIT 1"
    ).get(postId);

    if (!existingImage) {
      try {
        const { filename } = await AI.generatePostImage(post, UPLOADS_DIR);
        db.prepare(
          'INSERT INTO post_assets (post_id, asset_type, filename, original_name, file_size) VALUES (?,?,?,?,?)'
        ).run(postId, 'image', filename, `ai-generated-${postId}.png`, 0);
        db.prepare('UPDATE posts SET auto_image=1 WHERE id=?').run(postId);
        console.log(`[Auto] Post ${postId} image generated: ${filename}`);
      } catch (err) {
        console.warn(`[Auto] Image generation failed for post ${postId}:`, err.message);
      }
    }
  }
}

// ── LinkedIn API helpers ───────────────────────────────────────────────────
async function uploadImageToLinkedIn(filePath, token, personUrn) {
  const init = await axios.post(
    'https://api.linkedin.com/rest/images?action=initializeUpload',
    { initializeUploadRequest: { owner: personUrn } },
    { headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202401', 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' } }
  );
  const { uploadUrl, image: imageUrn } = init.data.value;
  await axios.put(uploadUrl, fs.readFileSync(filePath), { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' } });
  return imageUrn;
}

async function uploadDocumentToLinkedIn(filePath, token, personUrn) {
  const init = await axios.post(
    'https://api.linkedin.com/rest/documents?action=initializeUpload',
    { initializeUploadRequest: { owner: personUrn } },
    { headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202401', 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' } }
  );
  const { uploadUrl, document: docUrn } = init.data.value;
  await axios.put(uploadUrl, fs.readFileSync(filePath), { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' } });
  return docUrn;
}

async function publishToLinkedIn(post) {
  const cfg = getLinkedInConfig();
  if (!cfg?.access_token) throw new Error('LinkedIn not connected. Configure in Settings.');
  const { access_token: token, person_urn: personUrn } = cfg;

  const assets     = db.prepare('SELECT * FROM post_assets WHERE post_id=?').all(post.id);
  const hashtags   = post.hashtags ? '\n\n' + post.hashtags : '';
  const commentary = post.body + hashtags;

  const body = {
    author: personUrn, commentary,
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  // Asset priority: image > document — JS .find(), not Claude
  const imageAsset = assets.find(a => a.asset_type === 'image');
  const docAsset   = assets.find(a => a.asset_type === 'document');

  if (imageAsset) {
    const urn = await uploadImageToLinkedIn(path.join(UPLOADS_DIR, imageAsset.filename), token, personUrn);
    body.content = { media: { id: urn } };
  } else if (docAsset) {
    const urn = await uploadDocumentToLinkedIn(path.join(UPLOADS_DIR, docAsset.filename), token, personUrn);
    body.content = { media: { id: urn, title: post.title } };
  }

  const res = await axios.post('https://api.linkedin.com/rest/posts', body, {
    headers: { Authorization: `Bearer ${token}`, 'LinkedIn-Version': '202401', 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
  });

  return res.headers['x-restli-id'] || res.data?.id || 'posted';
}

// ── Scheduler — fires every 60 seconds ────────────────────────────────────
cron.schedule('* * * * *', async () => {
  const now = new Date().toISOString();
  // JS SQL query — status and time comparison, not Claude
  const due = db.prepare(
    "SELECT * FROM posts WHERE status='scheduled' AND scheduled_at <= ? ORDER BY scheduled_at ASC"
  ).all(now);

  for (const post of due) {
    try {
      console.log(`[Scheduler] Posting "${post.title}" (id: ${post.id})`);
      const liId = await publishToLinkedIn(post);
      db.prepare(
        "UPDATE posts SET status='posted', linkedin_post_id=?, posted_at=?, error_message=NULL WHERE id=?"
      ).run(liId, new Date().toISOString(), post.id);
      console.log(`[Scheduler] Posted: ${liId}`);
    } catch (err) {
      console.error(`[Scheduler] Failed post ${post.id}:`, err.message);
      db.prepare("UPDATE posts SET status='failed', error_message=? WHERE id=?").run(err.message, post.id);
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// ── Campaigns ──────────────────────────────────────────────────────────────
app.get('/api/campaigns', (req, res) => {
  res.json(db.prepare(`
    SELECT c.*,
      COUNT(p.id) as post_count,
      SUM(CASE WHEN p.status='posted'    THEN 1 ELSE 0 END) as posted_count,
      SUM(CASE WHEN p.status='scheduled' THEN 1 ELSE 0 END) as scheduled_count,
      SUM(CASE WHEN p.status='failed'    THEN 1 ELSE 0 END) as failed_count
    FROM campaigns c
    LEFT JOIN posts p ON p.campaign_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC
  `).all());
});

app.post('/api/campaigns', (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = db.prepare('INSERT INTO campaigns (name, description, color) VALUES (?,?,?)').run(name, description||'', color||'#31748E');
  res.json({ id: r.lastInsertRowid, name, description, color });
});

app.put('/api/campaigns/:id', (req, res) => {
  const { name, description, color } = req.body;
  db.prepare('UPDATE campaigns SET name=?, description=?, color=? WHERE id=?').run(name, description, color, req.params.id);
  res.json({ success: true });
});

app.delete('/api/campaigns/:id', (req, res) => {
  db.prepare('DELETE FROM campaigns WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ── Posts ──────────────────────────────────────────────────────────────────
app.get('/api/posts', (req, res) => {
  const { campaign_id, status } = req.query;
  let q = `
    SELECT p.*, c.name as campaign_name, c.color as campaign_color,
      (SELECT json_group_array(json_object('id',a.id,'asset_type',a.asset_type,'filename',a.filename,'original_name',a.original_name,'file_size',a.file_size))
       FROM post_assets a WHERE a.post_id = p.id) as assets
    FROM posts p LEFT JOIN campaigns c ON c.id = p.campaign_id WHERE 1=1`;
  const params = [];
  if (campaign_id) { q += ' AND p.campaign_id=?'; params.push(campaign_id); }
  if (status)      { q += ' AND p.status=?';      params.push(status); }
  q += ' ORDER BY p.scheduled_at ASC';
  res.json(db.prepare(q).all(...params).map(p => ({ ...p, assets: JSON.parse(p.assets||'[]') })));
});

app.get('/api/posts/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const assets = db.prepare('SELECT * FROM post_assets WHERE post_id=?').all(post.id);
  res.json({ ...post, assets });
});

app.post('/api/posts', upload.array('assets', 10), async (req, res) => {
  const { campaign_id, title, body, hashtags, scheduled_at, status } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

  // Use provided scheduled_at or placeholder — autoSchedule will fill it in
  const schedAt = scheduled_at ? new Date(scheduled_at).toISOString() : new Date(Date.now() + 86400000).toISOString();

  const r = db.prepare(
    'INSERT INTO posts (campaign_id, title, body, hashtags, scheduled_at, status) VALUES (?,?,?,?,?,?)'
  ).run(campaign_id||null, title, body, hashtags||'', schedAt, status||'scheduled');

  const postId = r.lastInsertRowid;
  if (req.files?.length) saveAssets(postId, req.files);

  // Run auto-generation async — don't block the response
  runAutoGeneration(postId).catch(err => console.error('[Auto] Error:', err.message));

  const post   = db.prepare('SELECT * FROM posts WHERE id=?').get(postId);
  const assets = db.prepare('SELECT * FROM post_assets WHERE post_id=?').all(postId);
  res.json({ ...post, assets });
});

app.put('/api/posts/:id', upload.array('assets', 10), (req, res) => {
  const { title, body, hashtags, scheduled_at, campaign_id, status } = req.body;
  db.prepare(
    'UPDATE posts SET title=?, body=?, hashtags=?, scheduled_at=?, campaign_id=?, status=? WHERE id=?'
  ).run(title, body, hashtags||'', scheduled_at, campaign_id||null, status||'scheduled', req.params.id);
  if (req.files?.length) saveAssets(req.params.id, req.files);
  res.json({ success: true });
});

app.delete('/api/posts/:id', (req, res) => {
  db.prepare('DELETE FROM post_assets WHERE post_id=?').run(req.params.id);
  db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

app.delete('/api/assets/:id', (req, res) => {
  const asset = db.prepare('SELECT * FROM post_assets WHERE id=?').get(req.params.id);
  if (asset) {
    const fp = path.join(UPLOADS_DIR, asset.filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    db.prepare('DELETE FROM post_assets WHERE id=?').run(req.params.id);
  }
  res.json({ success: true });
});

app.post('/api/posts/:id/publish-now', async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  try {
    const liId = await publishToLinkedIn(post);
    db.prepare("UPDATE posts SET status='posted', linkedin_post_id=?, posted_at=? WHERE id=?").run(liId, new Date().toISOString(), post.id);
    res.json({ success: true, linkedin_post_id: liId });
  } catch (err) {
    db.prepare("UPDATE posts SET status='failed', error_message=? WHERE id=?").run(err.message, post.id);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/retry', (req, res) => {
  db.prepare("UPDATE posts SET status='scheduled', error_message=NULL WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// Trigger auto-generation manually for an existing post
app.post('/api/posts/:id/auto-generate', async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  try {
    await runAutoGeneration(post.id);
    const updated = db.prepare('SELECT * FROM posts WHERE id=?').get(post.id);
    const assets  = db.prepare('SELECT * FROM post_assets WHERE post_id=?').all(post.id);
    res.json({ success: true, post: { ...updated, assets } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Schedule import (CSV / XLSX) ───────────────────────────────────────────
app.post('/api/import-schedule', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const ext = path.extname(req.file.originalname).toLowerCase();
  let rows = [];

  try {
    if (ext === '.csv') {
      rows = csv.parse(fs.readFileSync(req.file.path, 'utf8'), { columns: true, skip_empty_lines: true });
    } else if (ext === '.xlsx') {
      const wb = XLSX.readFile(req.file.path);
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    } else {
      return res.status(400).json({ error: 'Only CSV or XLSX supported' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Could not parse file: ' + e.message });
  }

  // Column normalisation — JS lookup table, not Claude
  const normRows = rows.map(normaliseRow);

  // Date routing — JS isStandardDate() filter, not Claude
  const standardRows  = normRows.filter(r => !r.scheduled_at || isStandardDate(r.scheduled_at));
  const ambiguousRows = normRows.filter(r =>  r.scheduled_at && !isStandardDate(r.scheduled_at));

  // CLAUDE — ambiguity resolution only for rows that need it
  let resolvedAmbiguous = [];
  if (ambiguousRows.length > 0) {
    try {
      resolvedAmbiguous = await AI.resolveAmbiguousDates(ambiguousRows, new Date().toISOString());
    } catch (e) {
      console.warn('[Import] Date resolution failed:', e.message);
      resolvedAmbiguous = ambiguousRows;
    }
  }

  const allRows  = [...standardRows, ...resolvedAmbiguous];
  const inserted = [], errors = [];

  for (const row of allRows) {
    const { title, body, scheduled_at: scheduledAt, hashtags, campaign: campaignName } = row;
    if (!title || !body) { errors.push({ row, reason: 'Missing title or body' }); continue; }

    // JS Date parse — not Claude
    let parsedDate = scheduledAt ? new Date(scheduledAt) : null;
    if (parsedDate && isNaN(parsedDate.getTime())) {
      errors.push({ row, reason: 'Invalid date: ' + scheduledAt }); continue;
    }

    // Auto-schedule placeholder if no date — JS sets tomorrow, autoSchedule will correct
    if (!parsedDate) parsedDate = new Date(Date.now() + 86400000);

    // Campaign lookup/create — JS SQL, not Claude
    let campaignId = null;
    if (campaignName) {
      const existing = db.prepare('SELECT id FROM campaigns WHERE name=?').get(campaignName);
      campaignId = existing
        ? existing.id
        : db.prepare('INSERT INTO campaigns (name) VALUES (?)').run(campaignName).lastInsertRowid;
    }

    const r = db.prepare(
      'INSERT INTO posts (campaign_id, title, body, hashtags, scheduled_at) VALUES (?,?,?,?,?)'
    ).run(campaignId, title, body, hashtags||'', parsedDate.toISOString());

    inserted.push(r.lastInsertRowid);
  }

  fs.unlinkSync(req.file.path);

  // Fire auto-generation for all inserted posts — async, does not block response
  Promise.all(inserted.map(id => runAutoGeneration(id).catch(e =>
    console.warn(`[Auto] Generation failed for imported post ${id}:`, e.message)
  )));

  res.json({ success: true, inserted: inserted.length, errors: errors.length, details: errors });
});

// ── LinkedIn config ────────────────────────────────────────────────────────
app.get('/api/linkedin-config', (req, res) => {
  const cfg = getLinkedInConfig();
  res.json({ connected: !!cfg?.access_token, person_urn: cfg?.person_urn, token_expires_at: cfg?.token_expires_at });
});

app.post('/api/linkedin-config', (req, res) => {
  const { access_token, person_urn, token_expires_at } = req.body;
  db.prepare('UPDATE linkedin_config SET access_token=?, person_urn=?, token_expires_at=?, updated_at=? WHERE id=1')
    .run(access_token, person_urn, token_expires_at||null, new Date().toISOString());
  res.json({ success: true });
});

app.get('/api/linkedin-config/test', async (req, res) => {
  const cfg = getLinkedInConfig();
  if (!cfg?.access_token) return res.json({ connected: false, error: 'No access token configured' });
  try {
    const r = await axios.get('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${cfg.access_token}` } });
    res.json({ connected: true, name: r.data.name, sub: r.data.sub, picture: r.data.picture });
  } catch (e) {
    res.json({ connected: false, error: e.response?.data?.message || e.message });
  }
});

// ── App config (auto-schedule / auto-image / auto-hashtags toggles) ────────
app.get('/api/app-config', (req, res) => {
  res.json({
    auto_schedule:  getConfig('auto_schedule'),
    auto_image:     getConfig('auto_image'),
    auto_hashtags:  getConfig('auto_hashtags'),
  });
});

app.post('/api/app-config', (req, res) => {
  const { auto_schedule, auto_image, auto_hashtags, openai_key } = req.body;
  if (auto_schedule  !== undefined) setConfig('auto_schedule',  auto_schedule);
  if (auto_image     !== undefined) setConfig('auto_image',     auto_image);
  if (auto_hashtags  !== undefined) setConfig('auto_hashtags',  auto_hashtags);
  // Set OpenAI key in process.env at runtime — persists until process restart
  // For permanent storage, user should set OPENAI_API_KEY in VPS environment
  if (openai_key && typeof openai_key === 'string' && openai_key.startsWith('sk-')) {
    process.env.OPENAI_API_KEY = openai_key;
    console.log('[Config] OpenAI API key updated at runtime');
  }
  res.json({ success: true });
});

// ── Stats ──────────────────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status='posted'    THEN 1 ELSE 0 END) as posted,
      SUM(CASE WHEN status='failed'    THEN 1 ELSE 0 END) as failed,
      SUM(CASE WHEN auto_image=1       THEN 1 ELSE 0 END) as auto_images,
      SUM(CASE WHEN auto_hashtags=1    THEN 1 ELSE 0 END) as auto_hashtags,
      SUM(CASE WHEN auto_scheduled=1   THEN 1 ELSE 0 END) as auto_scheduled
    FROM posts`).get();
  const upcoming = db.prepare(`SELECT p.*, c.name as campaign_name, c.color as campaign_color FROM posts p LEFT JOIN campaigns c ON c.id=p.campaign_id WHERE p.status='scheduled' ORDER BY p.scheduled_at ASC LIMIT 5`).all();
  const recent   = db.prepare(`SELECT p.*, c.name as campaign_name, c.color as campaign_color FROM posts p LEFT JOIN campaigns c ON c.id=p.campaign_id WHERE p.status IN ('posted','failed') ORDER BY p.posted_at DESC LIMIT 5`).all();
  res.json({ stats, upcoming, recent });
});

// ── AI routes — Claude only for judgment / summarization / strategy ─────────
// POST /api/posts/:id/review — CLAUDE JUDGMENT
app.post('/api/posts/:id/review', async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  try { res.json(await AI.reviewPostQuality(post)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/posts/:id/suggest-timing — JS ONLY, no Claude
app.get('/api/posts/:id/suggest-timing', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const taken = db.prepare("SELECT scheduled_at FROM posts WHERE id!=? AND status='scheduled'").all(req.params.id).map(r => r.scheduled_at);
  res.json(suggestPostTiming(post, taken));
});

// GET /api/posts/:id/summarize — CLAUDE SUMMARIZATION
app.get('/api/posts/:id/summarize', async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  try { res.json({ summary: await AI.summarizePost(post.body) }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/campaigns/:id/audit-narrative — CLAUDE STRATEGY
app.post('/api/campaigns/:id/audit-narrative', async (req, res) => {
  const posts = db.prepare("SELECT id, title, scheduled_at FROM posts WHERE campaign_id=? AND status!='failed' ORDER BY scheduled_at ASC").all(req.params.id);
  if (posts.length < 2) return res.json({ verdict: 'ok', notes: ['Need at least 2 posts to audit.'], source: 'js' });
  try { res.json(await AI.auditCampaignNarrative(posts)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/ai-usage — JS ONLY
app.get('/api/ai-usage', (req, res) => res.json(getUsageStats()));

// POST /api/posts/validate — JS ONLY
app.post('/api/posts/validate', (req, res) => res.json(validatePostLocally(req.body)));

// GET /api/guardrails — returns BHT rules for display in Settings
app.get('/api/guardrails', (req, res) => res.json({ rules: AI.BHT_GUARDRAILS }));


// ── BHT Compliance routes — pure JS, no Claude ────────────────────────────

// POST /api/posts/:id/bht-check — JS regex compliance check
app.post('/api/posts/:id/bht-check', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  const result = BHT.checkPost(post);
  res.json(result);
});

// POST /api/bht-check — check arbitrary text (used by editor live-check)
app.post('/api/bht-check', (req, res) => {
  const { text } = req.body;
  if (!text) return res.json({ pass: true, violations: [], warnings: [] });
  res.json(BHT.check(text));
});

// GET /api/bht-rules — returns full rule list for Settings display
app.get('/api/bht-rules', (req, res) => res.json({ rules: BHT.getRules() }));

// ── Auto-pipeline routes ───────────────────────────────────────────────────

// POST /api/posts/:id/auto-process
// Runs: BHT check → auto-tag → auto-image → slot assignment for a single post
app.post('/api/posts/:id/auto-process', async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });

  const existingSchedule = db.prepare("SELECT scheduled_at FROM posts WHERE id!=? AND status='scheduled'")
    .all(req.params.id).map(r => r.scheduled_at);

  try {
    const result = await AutoPipeline.processSinglePost(post, { existingSchedule, uploadsDir: UPLOADS_DIR });

    if (!result.success) {
      return res.status(422).json({ error: result.reason, violations: result.violations });
    }

    // Apply changes to DB — JS db operations, not Claude
    db.prepare('UPDATE posts SET hashtags=?, scheduled_at=?, auto_hashtags=1, auto_scheduled=1 WHERE id=?')
      .run(result.tags, result.scheduledAt, post.id);

    if (result.imageAsset) {
      db.prepare('INSERT INTO post_assets (post_id, asset_type, filename, original_name, dalle_prompt) VALUES (?,?,?,?,?)')
        .run(post.id, 'image', result.imageAsset.filename, result.imageAsset.originalName, result.imageAsset.dallePrompt || null);
      db.prepare('UPDATE posts SET auto_image=1 WHERE id=?').run(post.id);
    }

    // Apply BHT auto-fixes to post body/title if any were made
    if (result.bht_auto_fixed) {
      db.prepare('UPDATE posts SET title=?, body=? WHERE id=?')
        .run(result.fixedPost.title, result.fixedPost.body, post.id);
    }

    const updated = db.prepare('SELECT * FROM posts WHERE id=?').get(post.id);
    res.json({ success: true, post: updated, pipeline: result });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns/:id/auto-schedule
// CLAUDE STRATEGY: orders posts by narrative arc; JS assigns slots
app.post('/api/campaigns/:id/auto-schedule', async (req, res) => {
  const posts = db.prepare("SELECT * FROM posts WHERE campaign_id=? AND status='scheduled'").all(req.params.id);
  if (posts.length === 0) return res.status(400).json({ error: 'No scheduled posts in this campaign' });

  const existingSchedule = db.prepare("SELECT scheduled_at FROM posts WHERE campaign_id!=? AND status='scheduled'")
    .all(req.params.id).map(r => r.scheduled_at);

  try {
    const assignments = await AutoPipeline.autoScheduleCampaign(posts, existingSchedule);

    // Bulk update scheduled times — JS DB loop, not Claude
    const updateStmt = db.prepare('UPDATE posts SET scheduled_at=?, auto_scheduled=1 WHERE id=?');
    for (const a of assignments) {
      if (a.recommended_slot) updateStmt.run(a.recommended_slot, a.post_id);
    }

    res.json({ success: true, assignments, count: assignments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/campaigns/:id/auto-process-all
// Processes all posts in a campaign: BHT → tags → images → schedule
app.post('/api/campaigns/:id/auto-process-all', async (req, res) => {
  const posts = db.prepare('SELECT * FROM posts WHERE campaign_id=?').all(req.params.id);
  if (posts.length === 0) return res.status(400).json({ error: 'No posts in this campaign' });

  const results = [];
  const existingSchedule = db.prepare("SELECT scheduled_at FROM posts WHERE campaign_id!=? AND status='scheduled'")
    .all(req.params.id).map(r => r.scheduled_at);

  for (const post of posts) {
    try {
      const result = await AutoPipeline.processSinglePost(post, {
        existingSchedule: [
          ...existingSchedule,
          ...results.filter(r => r.scheduledAt).map(r => r.scheduledAt),
        ],
        uploadsDir: UPLOADS_DIR,
      });

      if (result.success) {
        db.prepare('UPDATE posts SET hashtags=?, scheduled_at=?, auto_hashtags=1, auto_scheduled=1 WHERE id=?')
          .run(result.tags, result.scheduledAt, post.id);

        if (result.imageAsset) {
          db.prepare('INSERT INTO post_assets (post_id, asset_type, filename, original_name, dalle_prompt) VALUES (?,?,?,?,?)')
            .run(post.id, 'image', result.imageAsset.filename, result.imageAsset.originalName, result.imageAsset.dallePrompt || null);
          db.prepare('UPDATE posts SET auto_image=1 WHERE id=?').run(post.id);
        }

        if (result.bht_auto_fixed) {
          db.prepare('UPDATE posts SET title=?, body=? WHERE id=?')
            .run(result.fixedPost.title, result.fixedPost.body, post.id);
        }
      }

      results.push({ post_id: post.id, ...result });
    } catch (e) {
      results.push({ post_id: post.id, success: false, error: e.message });
    }
  }

  // JS aggregation — not Claude
  const summary = {
    total:      results.length,
    success:    results.filter(r => r.success).length,
    failed:     results.filter(r => !r.success).length,
    imaged:     results.filter(r => r.imageAsset).length,
    bht_fixed:  results.filter(r => r.bht_auto_fixed).length,
    results,
  };

  res.json(summary);
});

// ── Frontend ───────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, () => {
  console.log(`LinkedIn Scheduler on port ${PORT}`);
  console.log(`Auto-schedule: ${getConfig('auto_schedule')} | Auto-image: ${getConfig('auto_image')} | Auto-hashtags: ${getConfig('auto_hashtags')}`);
});
