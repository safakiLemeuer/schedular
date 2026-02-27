<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LinkedIn Scheduler Portal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  --teal:       #31748E;
  --teal-d:     #22587E;
  --teal-bg:    #E8F4F8;
  --teal-card:  #d4eaf4;
  --navy:       #12284C;
  --navy-mid:   #2D4B76;
  --red:        #D53232;
  --red-bg:     #FFF0F0;
  --gold:       #C88E00;
  --gold-bg:    #FFF8E1;
  --green:      #1A7F4E;
  --green-bg:   #E6F7EF;
  --white:      #FFFFFF;
  --gray-page:  #F4F7FA;
  --gray-card:  #EEF2F7;
  --gray-line:  #D5E0EC;
  --gray-txt:   #64788A;
  --body-txt:   #1C2A3A;
  --shadow:     0 2px 12px rgba(18,40,76,0.08);
  --shadow-lg:  0 8px 32px rgba(18,40,76,0.14);
  --radius:     12px;
  --radius-sm:  8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'DM Sans', sans-serif;
  background: var(--gray-page);
  color: var(--body-txt);
  min-height: 100vh;
  overflow-x: hidden;
}

/* ── Layout ─────────────────────────────────────────────────── */
.app { display: flex; min-height: 100vh; }

.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--navy);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  transition: transform 0.3s;
}

.sidebar-logo {
  padding: 28px 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.sidebar-logo .logo-mark {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
}
.sidebar-logo .logo-mark span { color: #5BB8D4; }
.sidebar-logo .logo-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  margin-top: 3px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.sidebar-nav { padding: 16px 12px; flex: 1; overflow-y: auto; }

.nav-section-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.35);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 12px 12px 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255,255,255,0.65);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
  margin-bottom: 2px;
  user-select: none;
}
.nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
.nav-item.active { background: var(--teal); color: #fff; }
.nav-item .nav-icon { font-size: 18px; width: 22px; text-align: center; }
.nav-badge {
  margin-left: auto;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.nav-badge.green { background: var(--green); }

.sidebar-bottom {
  padding: 16px 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.linkedin-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  cursor: pointer;
  transition: background 0.15s;
}
.linkedin-status:hover { background: rgba(255,255,255,0.1); }
.linkedin-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--red);
  flex-shrink: 0;
}
.linkedin-dot.connected { background: #22c55e; }
.linkedin-status-text { font-size: 13px; color: rgba(255,255,255,0.7); }
.linkedin-status-sub { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }

.main {
  margin-left: 260px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.topbar {
  background: var(--white);
  border-bottom: 1px solid var(--gray-line);
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-title { font-size: 18px; font-weight: 600; color: var(--navy); }
.topbar-actions { display: flex; gap: 10px; align-items: center; }

.page-content { padding: 32px; flex: 1; }

/* ── Buttons ─────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
.btn-primary { background: var(--teal); color: #fff; }
.btn-primary:hover { background: var(--teal-d); }
.btn-secondary { background: var(--gray-card); color: var(--navy); border: 1px solid var(--gray-line); }
.btn-secondary:hover { background: var(--gray-line); }
.btn-danger { background: var(--red-bg); color: var(--red); }
.btn-danger:hover { background: #ffd5d5; }
.btn-success { background: var(--green-bg); color: var(--green); }
.btn-success:hover { background: #c8f0dd; }
.btn-ghost { background: transparent; color: var(--gray-txt); }
.btn-ghost:hover { background: var(--gray-card); color: var(--navy); }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.btn-icon { padding: 8px; border-radius: 6px; }

/* ── Cards & Stats ───────────────────────────────────────────── */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px 22px;
  box-shadow: var(--shadow);
  border-top: 3px solid transparent;
}
.stat-card.teal { border-top-color: var(--teal); }
.stat-card.green { border-top-color: var(--green); }
.stat-card.gold { border-top-color: var(--gold); }
.stat-card.red { border-top-color: var(--red); }
.stat-num { font-size: 36px; font-weight: 700; color: var(--navy); line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 13px; color: var(--gray-txt); font-weight: 500; }

/* ── Sections ────────────────────────────────────────────────── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.section-title { font-size: 16px; font-weight: 700; color: var(--navy); }

/* ── Campaign cards ──────────────────────────────────────────── */
.campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.campaign-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.15s;
  border-left: 4px solid var(--teal);
  position: relative;
}
.campaign-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-1px); }
.campaign-card-color { position: absolute; top: 0; left: 0; bottom: 0; width: 4px; border-radius: 12px 0 0 12px; }
.campaign-name { font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 5px; }
.campaign-desc { font-size: 13px; color: var(--gray-txt); margin-bottom: 14px; }
.campaign-counts { display: flex; gap: 12px; }
.c-count {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}
.c-count.sched { background: var(--teal-bg); color: var(--teal); }
.c-count.posted { background: var(--green-bg); color: var(--green); }
.c-count.failed { background: var(--red-bg); color: var(--red); }
.campaign-card-actions {
  position: absolute;
  top: 14px; right: 14px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.campaign-card:hover .campaign-card-actions { opacity: 1; }

/* ── Post list ───────────────────────────────────────────────── */
.posts-list { display: flex; flex-direction: column; gap: 12px; }
.post-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow);
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 16px;
  align-items: start;
  transition: box-shadow 0.15s;
}
.post-card:hover { box-shadow: var(--shadow-lg); }

.post-status-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.post-status-dot.scheduled { background: var(--teal); }
.post-status-dot.posted { background: var(--green); }
.post-status-dot.failed { background: var(--red); }
.post-status-dot.draft { background: var(--gray-txt); }

.post-title { font-size: 15px; font-weight: 600; color: var(--navy); margin-bottom: 4px; }
.post-preview { font-size: 13px; color: var(--gray-txt); line-height: 1.5; margin-bottom: 8px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.post-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.post-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.post-tag.scheduled { background: var(--teal-bg); color: var(--teal); }
.post-tag.posted { background: var(--green-bg); color: var(--green); }
.post-tag.failed { background: var(--red-bg); color: var(--red); }
.post-tag.draft { background: var(--gray-card); color: var(--gray-txt); }

.post-date { font-size: 12px; color: var(--gray-txt); font-family: 'DM Mono', monospace; }
.post-campaign-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  color: #fff;
}

.post-assets-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.asset-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 3px 8px;
  background: var(--gray-card);
  border-radius: 6px;
  color: var(--gray-txt);
  max-width: 160px;
}
.asset-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.post-actions { display: flex; gap: 6px; flex-shrink: 0; }

/* ── Forms & Modals ──────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(12, 26, 58, 0.55);
  backdrop-filter: blur(3px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: var(--white);
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease;
}
.modal-lg { max-width: 860px; }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--gray-line);
  position: sticky;
  top: 0;
  background: var(--white);
  z-index: 2;
}
.modal-title { font-size: 18px; font-weight: 700; color: var(--navy); }
.modal-body { padding: 24px; }
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--gray-line);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  background: var(--gray-page);
  border-radius: 0 0 16px 16px;
}

.form-group { margin-bottom: 18px; }
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--navy-mid);
  margin-bottom: 6px;
}
.form-label .req { color: var(--red); margin-left: 2px; }
.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 13px;
  border: 1.5px solid var(--gray-line);
  border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  color: var(--body-txt);
  background: var(--white);
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
}
.form-input:focus, .form-select:focus, .form-textarea:focus {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(49,116,142,0.12);
}
.form-textarea { resize: vertical; min-height: 120px; }
.form-textarea.tall { min-height: 180px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ── Drop zone ───────────────────────────────────────────────── */
.drop-zone {
  border: 2px dashed var(--gray-line);
  border-radius: var(--radius);
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--gray-page);
}
.drop-zone:hover, .drop-zone.dragover {
  border-color: var(--teal);
  background: var(--teal-bg);
}
.drop-zone-icon { font-size: 36px; margin-bottom: 8px; }
.drop-zone-text { font-size: 14px; color: var(--gray-txt); }
.drop-zone-text strong { color: var(--teal); }
.drop-zone-sub { font-size: 12px; color: var(--gray-txt); margin-top: 4px; }

.uploaded-files { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--gray-card);
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.file-row .file-icon { font-size: 18px; }
.file-row .file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--navy); }
.file-row .file-size { color: var(--gray-txt); font-size: 11px; font-family: 'DM Mono', monospace; }
.file-row .file-remove { cursor: pointer; color: var(--gray-txt); font-size: 16px; transition: color 0.1s; }
.file-row .file-remove:hover { color: var(--red); }

/* ── Calendar view ───────────────────────────────────────────── */
.calendar-wrapper { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--gray-line);
}
.cal-title { font-size: 16px; font-weight: 700; color: var(--navy); }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.cal-day-label {
  padding: 10px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--gray-txt);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border-bottom: 1px solid var(--gray-line);
  background: var(--gray-page);
}
.cal-day {
  min-height: 90px;
  padding: 8px;
  border-right: 1px solid var(--gray-line);
  border-bottom: 1px solid var(--gray-line);
  background: var(--white);
  vertical-align: top;
}
.cal-day:nth-child(7n) { border-right: none; }
.cal-day.other-month { background: var(--gray-page); }
.cal-day.today { background: var(--teal-bg); }
.cal-day-num { font-size: 12px; font-weight: 600; color: var(--gray-txt); margin-bottom: 4px; }
.cal-day.today .cal-day-num { color: var(--teal); font-weight: 700; }
.cal-post-pill {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.1s;
}
.cal-post-pill:hover { opacity: 0.8; }

/* ── Settings panel ──────────────────────────────────────────── */
.settings-section {
  background: var(--white);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  margin-bottom: 20px;
}
.settings-section-title { font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
.settings-section-sub { font-size: 13px; color: var(--gray-txt); margin-bottom: 18px; }

.connection-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--gray-line);
  margin-bottom: 16px;
}
.connection-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--teal-bg); display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; }
.connection-avatar img { width: 100%; height: 100%; object-fit: cover; }
.connection-info { flex: 1; }
.connection-name { font-size: 15px; font-weight: 600; color: var(--navy); }
.connection-sub { font-size: 13px; color: var(--gray-txt); }
.connection-status { font-size: 12px; font-weight: 600; }
.connection-status.ok { color: var(--green); }
.connection-status.err { color: var(--red); }

/* ── Import section ──────────────────────────────────────────── */
.import-instructions {
  background: var(--teal-bg);
  border: 1px solid var(--teal-card);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--navy-mid);
}
.import-instructions code {
  font-family: 'DM Mono', monospace;
  background: rgba(49,116,142,0.12);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--teal);
}
.import-result {
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-top: 12px;
}
.import-result.success { background: var(--green-bg); color: var(--green); }
.import-result.warning { background: var(--gold-bg); color: var(--gold); }

/* ── Tabs ────────────────────────────────────────────────────── */
.tabs { display: flex; gap: 4px; margin-bottom: 22px; background: var(--gray-card); padding: 4px; border-radius: var(--radius-sm); width: fit-content; }
.tab {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: var(--gray-txt);
  transition: all 0.15s;
}
.tab.active { background: var(--white); color: var(--navy); box-shadow: var(--shadow); }
.tab:hover:not(.active) { color: var(--navy); }

/* ── Filters ─────────────────────────────────────────────────── */
.filters-row { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
.filter-chip {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--gray-line);
  background: var(--white);
  color: var(--gray-txt);
  transition: all 0.15s;
}
.filter-chip.active { border-color: var(--teal); background: var(--teal-bg); color: var(--teal); }
.filter-search {
  flex: 1;
  max-width: 280px;
  padding: 7px 13px;
  border: 1.5px solid var(--gray-line);
  border-radius: 20px;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s;
}
.filter-search:focus { border-color: var(--teal); }

/* ── Toast ───────────────────────────────────────────────────── */
.toasts { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
.toast {
  padding: 12px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  animation: toastIn 0.2s ease;
  max-width: 340px;
}
@keyframes toastIn { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.toast.success { background: var(--green-bg); color: var(--green); border-left: 3px solid var(--green); }
.toast.error { background: var(--red-bg); color: var(--red); border-left: 3px solid var(--red); }
.toast.info { background: var(--teal-bg); color: var(--teal); border-left: 3px solid var(--teal); }

/* ── Empty state ─────────────────────────────────────────────── */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-state-icon { font-size: 52px; margin-bottom: 14px; }
.empty-state-title { font-size: 18px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
.empty-state-sub { font-size: 14px; color: var(--gray-txt); margin-bottom: 20px; }

/* ── Upcoming list ───────────────────────────────────────────── */
.upcoming-list { display: flex; flex-direction: column; gap: 8px; }
.upcoming-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  background: var(--white);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
}
.upcoming-time { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--gray-txt); width: 120px; flex-shrink: 0; }
.upcoming-title { flex: 1; font-size: 13px; font-weight: 600; color: var(--navy); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.upcoming-campaign { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; color: #fff; flex-shrink: 0; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 900px) {
  .sidebar { transform: translateX(-260px); }
  .sidebar.open { transform: translateX(0); }
  .main { margin-left: 0; }
  .stats-row { grid-template-columns: repeat(2,1fr); }
  .form-row { grid-template-columns: 1fr; }
  .post-card { grid-template-columns: auto 1fr; }
  .post-actions { grid-column: 2; }
}

.color-picker-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.color-swatch {
  width: 28px; height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.1s, border-color 0.1s;
}
.color-swatch.selected { border-color: var(--navy); transform: scale(1.15); }

.char-count { font-size: 11px; color: var(--gray-txt); text-align: right; margin-top: 4px; }
.char-count.warn { color: var(--gold); }
.char-count.over { color: var(--red); font-weight: 700; }

.loading { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.divider { height: 1px; background: var(--gray-line); margin: 20px 0; }

.help-text { font-size: 12px; color: var(--gray-txt); margin-top: 5px; }

/* ── Toggle switch ────────────────────────────────────────────── */
.toggle-switch { position:relative; display:inline-block; width:44px; height:24px; flex-shrink:0; }
.toggle-switch input { opacity:0; width:0; height:0; }
.toggle-slider {
  position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0;
  background:var(--gray-line); border-radius:24px; transition:.2s;
}
.toggle-slider:before {
  position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px;
  background:white; border-radius:50%; transition:.2s;
}
input:checked + .toggle-slider { background:var(--teal); }
input:checked + .toggle-slider:before { transform:translateX(20px); }

/* ── Auto badge ───────────────────────────────────────────────── */
.auto-badge {
  display:inline-block; font-size:10px; font-weight:700; letter-spacing:.8px;
  text-transform:uppercase; padding:2px 7px; border-radius:20px;
  background:var(--teal-bg); color:var(--teal); margin-left:6px; vertical-align:middle;
}

</style>
</head>
<body>

<div class="app">

<!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">
    <div class="logo-mark">LinkedIn <span>Scheduler</span></div>
    <div class="logo-sub">Content Automation Portal</div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section-label">Overview</div>
    <div class="nav-item active" onclick="showPage('dashboard')" id="nav-dashboard">
      <span class="nav-icon">📊</span> Dashboard
    </div>
    <div class="nav-section-label">Content</div>
    <div class="nav-item" onclick="showPage('campaigns')" id="nav-campaigns">
      <span class="nav-icon">📁</span> Campaigns
    </div>
    <div class="nav-item" onclick="showPage('posts')" id="nav-posts">
      <span class="nav-icon">📝</span> Posts
      <span class="nav-badge" id="badge-scheduled" style="display:none">0</span>
    </div>
    <div class="nav-item" onclick="showPage('calendar')" id="nav-calendar">
      <span class="nav-icon">📅</span> Calendar
    </div>
    <div class="nav-section-label">Import</div>
    <div class="nav-item" onclick="showPage('import')" id="nav-import">
      <span class="nav-icon">⬆️</span> Import Schedule
    </div>
    <div class="nav-section-label">System</div>
    <div class="nav-item" onclick="showPage('settings')" id="nav-settings">
      <span class="nav-icon">⚙️</span> Settings
    </div>
    <div class="nav-item" onclick="showPage('ai-usage')" id="nav-ai-usage">
      <span class="nav-icon">🤖</span> AI Usage
    </div>
  </nav>
  <div class="sidebar-bottom">
    <div class="linkedin-status" onclick="showPage('settings')">
      <div class="linkedin-dot" id="li-dot"></div>
      <div>
        <div class="linkedin-status-text" id="li-status-text">Not connected</div>
        <div class="linkedin-status-sub" id="li-status-sub">Click to configure</div>
      </div>
    </div>
  </div>
</aside>

<!-- ── Main ───────────────────────────────────────────────────────────── -->
<main class="main">
  <header class="topbar">
    <div class="topbar-title" id="topbar-title">Dashboard</div>
    <div class="topbar-actions" id="topbar-actions">
      <button class="btn btn-primary" onclick="openNewPostModal()">+ New Post</button>
    </div>
  </header>

  <div class="page-content">

    <!-- DASHBOARD PAGE ─────────────────────────────────────────────────── -->
    <div id="page-dashboard">
      <div class="stats-row">
        <div class="stat-card teal">
          <div class="stat-num" id="stat-scheduled">0</div>
          <div class="stat-label">Scheduled</div>
        </div>
        <div class="stat-card green">
          <div class="stat-num" id="stat-posted">0</div>
          <div class="stat-label">Posted</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-num" id="stat-total">0</div>
          <div class="stat-label">Total Posts</div>
        </div>
        <div class="stat-card red">
          <div class="stat-num" id="stat-failed">0</div>
          <div class="stat-label">Failed</div>
        </div>
      </div>
      <!-- Auto-generation stats row -->
      <div class="stats-row" style="margin-top:12px">
        <div class="stat-card" style="border-top-color:var(--teal)">
          <div class="stat-num" style="font-size:26px" id="stat-auto-scheduled">0</div>
          <div class="stat-label">Auto-Scheduled <span class="auto-badge">JS</span></div>
        </div>
        <div class="stat-card" style="border-top-color:var(--teal)">
          <div class="stat-num" style="font-size:26px" id="stat-auto-images">0</div>
          <div class="stat-label">AI Images <span class="auto-badge">DALL-E 3</span></div>
        </div>
        <div class="stat-card" style="border-top-color:var(--teal)">
          <div class="stat-num" style="font-size:26px" id="stat-auto-hashtags">0</div>
          <div class="stat-label">Auto-Hashtags <span class="auto-badge">Claude</span></div>
        </div>
        <div class="stat-card" style="border-top-color:var(--gray-line)">
          <div style="font-size:11px;color:var(--gray-txt);line-height:1.6;padding-top:4px">
            All automation runs in the background after each post is created or imported.
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div class="section-header">
            <div class="section-title">Coming Up Next</div>
            <button class="btn btn-ghost btn-sm" onclick="showPage('posts')">View all →</button>
          </div>
          <div class="upcoming-list" id="upcoming-list">
            <div class="empty-state" style="padding:30px">
              <div class="empty-state-icon">📅</div>
              <div class="empty-state-sub">No scheduled posts yet</div>
            </div>
          </div>
        </div>
        <div>
          <div class="section-header">
            <div class="section-title">Recent Activity</div>
          </div>
          <div class="upcoming-list" id="recent-list">
            <div class="empty-state" style="padding:30px">
              <div class="empty-state-icon">🕐</div>
              <div class="empty-state-sub">No activity yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CAMPAIGNS PAGE ─────────────────────────────────────────────────── -->
    <div id="page-campaigns" style="display:none">
      <div class="section-header">
        <div class="section-title">All Campaigns</div>
        <button class="btn btn-primary btn-sm" onclick="openNewCampaignModal()">+ New Campaign</button>
      </div>
      <div class="campaigns-grid" id="campaigns-grid">
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">No campaigns yet</div>
          <div class="empty-state-sub">Create a campaign to organize your posts by topic</div>
          <button class="btn btn-primary" onclick="openNewCampaignModal()">Create campaign</button>
        </div>
      </div>
    </div>

    <!-- POSTS PAGE ─────────────────────────────────────────────────────── -->
    <div id="page-posts" style="display:none">
      <div class="filters-row">
        <input type="text" class="filter-search" placeholder="Search posts..." id="post-search" oninput="filterPosts()">
        <div class="filter-chip active" data-filter="all" onclick="setStatusFilter('all',this)">All</div>
        <div class="filter-chip" data-filter="scheduled" onclick="setStatusFilter('scheduled',this)">Scheduled</div>
        <div class="filter-chip" data-filter="posted" onclick="setStatusFilter('posted',this)">Posted</div>
        <div class="filter-chip" data-filter="failed" onclick="setStatusFilter('failed',this)">Failed</div>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="openNewPostModal()">+ New Post</button>
      </div>
      <div class="posts-list" id="posts-list">
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">No posts yet</div>
          <div class="empty-state-sub">Create a post or import a schedule to get started</div>
          <button class="btn btn-primary" onclick="openNewPostModal()">Create first post</button>
        </div>
      </div>
    </div>

    <!-- CALENDAR PAGE ──────────────────────────────────────────────────── -->
    <div id="page-calendar" style="display:none">
      <div class="calendar-wrapper">
        <div class="cal-header">
          <button class="btn btn-ghost btn-icon" onclick="calPrev()">←</button>
          <div class="cal-title" id="cal-month-label"></div>
          <button class="btn btn-ghost btn-icon" onclick="calNext()">→</button>
        </div>
        <div class="cal-grid" id="cal-grid"></div>
      </div>
    </div>

    <!-- IMPORT PAGE ────────────────────────────────────────────────────── -->
    <div id="page-import" style="display:none">
      <div class="settings-section">
        <div class="settings-section-title">Import Schedule from CSV or Excel</div>
        <div class="settings-section-sub">Upload a spreadsheet with your post schedule. Each row becomes a scheduled post.</div>

        <div class="import-instructions">
          <strong>Required columns:</strong><br><br>
          <code>title</code> — Post headline (used internally)<br>
          <code>body</code> — The full post text<br>
          <code>scheduled_at</code> — Date and time, e.g. <code>2026-03-05 08:00</code><br><br>
          <strong>Optional columns:</strong><br><br>
          <code>hashtags</code> — e.g. <code>#AIGovernance #EUAIAct</code><br>
          <code>campaign</code> — Campaign name (auto-created if new)
        </div>

        <div class="drop-zone" id="import-drop-zone" onclick="document.getElementById('import-file-input').click()">
          <div class="drop-zone-icon">📋</div>
          <div class="drop-zone-text"><strong>Click to upload</strong> or drag and drop</div>
          <div class="drop-zone-sub">CSV or XLSX files only</div>
        </div>
        <input type="file" id="import-file-input" accept=".csv,.xlsx" style="display:none" onchange="importSchedule(this.files[0])">

        <div id="import-result" style="display:none"></div>

        <div class="divider"></div>
        <div class="settings-section-title" style="margin-bottom:6px">Download Template</div>
        <p style="font-size:13px;color:var(--gray-txt);margin-bottom:12px">
          Download a pre-formatted template to fill in your schedule.
        </p>
        <button class="btn btn-secondary btn-sm" onclick="downloadTemplate()">⬇ Download CSV Template</button>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Bulk Assign Assets</div>
        <div class="settings-section-sub">
          After importing your schedule, go to each post in the Posts view to attach images or PDFs. You can also upload assets when creating individual posts.
        </div>
      </div>
    </div>

    <!-- SETTINGS PAGE -->
    <div id="page-settings" style="display:none">

      <!-- Automation -->
      <div class="settings-section">
        <div class="settings-section-title">Automation</div>
        <div class="settings-section-sub">Controls what runs automatically when a post is created or imported. All three work together: the scheduler fires posts at the right time once image and hashtags are ready.</div>
        <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px">

          <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px;border:1.5px solid var(--gray-line);border-radius:var(--radius-sm);gap:16px">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--navy);display:flex;align-items:center">
                Auto-Schedule <span class="auto-badge">JS only</span>
              </div>
              <div style="font-size:12px;color:var(--gray-txt);margin-top:4px;line-height:1.6">
                Picks the optimal posting time based on content type using a static lookup table. No API call.
                Thought leadership goes Tue-Thu 8am. Product launches go Mon-Wed 8am. Vision posts go Fri 8am.
                Skips dates already occupied by another scheduled post.
              </div>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="toggle-auto-schedule" onchange="saveAutoConfig()"><span class="toggle-slider"></span></label>
          </div>

          <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px;border:1.5px solid var(--gray-line);border-radius:var(--radius-sm);gap:16px">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--navy);display:flex;align-items:center">
                Auto-Generate Hashtags <span class="auto-badge">Claude</span>
              </div>
              <div style="font-size:12px;color:var(--gray-txt);margin-top:4px;line-height:1.6">
                Claude reads the post title and first 300 characters and selects 4-6 specific hashtags for the
                federal technology and AI governance audience. Skipped entirely if hashtags are already set.
                Requires <code>ANTHROPIC_API_KEY</code>.
              </div>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="toggle-auto-hashtags" onchange="saveAutoConfig()"><span class="toggle-slider"></span></label>
          </div>

          <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:16px;border:1.5px solid var(--gray-line);border-radius:var(--radius-sm);gap:16px">
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--navy);display:flex;align-items:center">
                Auto-Generate Images <span class="auto-badge">Claude + DALL-E 3</span>
              </div>
              <div style="font-size:12px;color:var(--gray-txt);margin-top:4px;line-height:1.6">
                Claude writes a visual concept prompt specific to the post. DALL-E 3 renders a 1024x1024
                professional image in TheBHTLabs teal and navy brand palette. No text in the image.
                Skipped if an image is already attached. Requires both <code>ANTHROPIC_API_KEY</code>
                and <code>OPENAI_API_KEY</code>.
              </div>
            </div>
            <label class="toggle-switch"><input type="checkbox" id="toggle-auto-image" onchange="saveAutoConfig()"><span class="toggle-slider"></span></label>
          </div>

        </div>
      </div>

      <!-- LinkedIn -->
      <div class="settings-section">
        <div class="settings-section-title">LinkedIn Connection</div>
        <div class="settings-section-sub">Connect your LinkedIn account to enable automated posting.</div>
        <div class="connection-card" id="connection-card">
          <div class="connection-avatar" id="li-avatar">&#128279;</div>
          <div class="connection-info">
            <div class="connection-name" id="li-name">Not connected</div>
            <div class="connection-sub" id="li-sub">Add your LinkedIn access token below</div>
          </div>
          <div class="connection-status" id="li-conn-status"></div>
        </div>
        <div class="form-group">
          <label class="form-label">Access Token <span class="req">*</span></label>
          <input type="password" class="form-input" id="li-token-input" placeholder="LinkedIn OAuth 2.0 access token">
          <div class="help-text">Get from the LinkedIn Developer Portal. Expires every 60 days.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Person URN <span class="req">*</span></label>
          <input type="text" class="form-input" id="li-urn-input" placeholder="urn:li:person:XXXXXXXXXX">
          <div class="help-text">From GET /v2/userinfo. The <code>sub</code> field. Format: urn:li:person:{sub}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Token Expiry</label>
          <input type="datetime-local" class="form-input" id="li-expiry-input">
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="saveLinkedInConfig()">Save</button>
          <button class="btn btn-secondary" onclick="testLinkedInConnection()">Test Connection</button>
        </div>
        <div id="test-result" style="margin-top:12px;display:none"></div>
      </div>

      <!-- BHT Content Guardrails -->
      <div class="settings-section">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:22px">&#128737;&#65039;</span>
          <div class="settings-section-title" style="margin-bottom:0">BHT Content Guardrails</div>
        </div>
        <div class="settings-section-sub" style="margin-bottom:14px">
          Hard-coded into every Claude system prompt. Cannot be disabled at runtime. Any output that violates these rules is rejected before it reaches the post.
        </div>
        <div style="background:var(--navy);border-radius:var(--radius-sm);padding:20px 22px">
          <div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px">WHAT NEVER APPEARS IN ANY BHT OUTPUT</div>
          <div id="guardrail-list" style="display:flex;flex-direction:column;gap:9px">
            <!-- populated by loadGuardrails() -->
          </div>
        </div>
      </div>

      <!-- Environment variables -->
      <div class="settings-section">
        <div class="settings-section-title">Environment Variables</div>
        <div class="settings-section-sub">Set on your Hostinger VPS. Restart app after any change.</div>
        <div style="background:var(--gray-page);border-radius:var(--radius-sm);padding:16px;font-family:'DM Mono',monospace;font-size:12px;color:var(--navy-mid);line-height:2.4">
          <div><span style="color:var(--teal)">ANTHROPIC_API_KEY</span>=sk-ant-...&nbsp;&nbsp;<span style="color:var(--gray-txt)"># hashtags, quality review, narrative audit, image prompts</span></div>
          <div><span style="color:var(--teal)">OPENAI_API_KEY</span>=sk-...&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--gray-txt)"># DALL-E 3 image rendering</span></div>
          <div><span style="color:var(--teal)">PORT</span>=3001&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:var(--gray-txt)"># optional, default 3001</span></div>
        </div>
        <div class="help-text" style="margin-top:8px">Add to <code>/etc/environment</code> or the <code>env</code> block in your PM2 ecosystem.config.js.</div>
      </div>

      <!-- Scheduler status -->
      <div class="settings-section">
        <div class="settings-section-title">Scheduler Status</div>
        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:var(--green-bg);border-radius:var(--radius-sm)">
          <div style="width:10px;height:10px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
          <div style="font-size:13px;color:var(--green);font-weight:600">Running: checks for due posts every 60 seconds</div>
        </div>
      </div>

    </div>

    <!-- AI USAGE PAGE ──────────────────────────────────────────────────── -->
    <div id="page-ai-usage" style="display:none">

      <!-- Guardrail reminder banner -->
      <div style="background:var(--navy);color:#fff;border-radius:var(--radius);padding:18px 22px;margin-bottom:24px;display:flex;gap:16px;align-items:flex-start">
        <div style="font-size:28px;flex-shrink:0">🛡️</div>
        <div>
          <div style="font-weight:700;font-size:15px;margin-bottom:6px">API Guardrails Active</div>
          <div style="font-size:13px;opacity:0.8;line-height:1.7">
            Claude is called <strong>only</strong> for:
            <strong>Judgment</strong> (post quality review) ·
            <strong>Summarization</strong> (post previews) ·
            <strong>Strategy</strong> (narrative audit) ·
            <strong>Ambiguity</strong> (unparseable date strings).<br>
            Boolean checks · Formatting · Filtering · Regex · JSON transforms · Date math · Keyword matching → <strong>pure JS</strong>.
          </div>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="stats-row" style="margin-bottom:24px" id="ai-stats-row">
        <div class="stat-card teal">
          <div class="stat-num" id="ai-calls-24h">—</div>
          <div class="stat-label">Claude calls (24h)</div>
        </div>
        <div class="stat-card green">
          <div class="stat-num" id="ai-cache-24h">—</div>
          <div class="stat-label">Cache hits (24h)</div>
        </div>
        <div class="stat-card gold">
          <div class="stat-num" id="ai-tokens-24h">—</div>
          <div class="stat-label">Tokens (24h)</div>
        </div>
        <div class="stat-card" style="border-top-color:var(--navy-mid)">
          <div class="stat-num" id="ai-cache-size">—</div>
          <div class="stat-label">Cached results</div>
        </div>
      </div>

      <!-- Per-function breakdown -->
      <div class="settings-section">
        <div class="settings-section-title">Calls by Function</div>
        <div class="settings-section-sub">Shows what Claude was actually called for. JS-only operations (timing, validation, filtering) never appear here.</div>
        <div id="ai-breakdown-table" style="margin-top:8px">
          <div style="text-align:center;padding:30px;color:var(--gray-txt);font-size:13px">No Claude calls recorded yet.</div>
        </div>
      </div>

      <!-- Guardrail decision log -->
      <div class="settings-section">
        <div class="settings-section-title">Decision Rules Reference</div>
        <div class="settings-section-sub">How each task is routed — Claude vs pure JS.</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:var(--gray-page)">
              <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Task</th>
              <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Handled by</th>
              <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Reason</th>
            </tr>
          </thead>
          <tbody id="guardrail-table-body"></tbody>
        </table>
      </div>

    </div>

  </div><!-- /page-content -->
</main>
</div><!-- /app -->

<!-- ── Toast container ─────────────────────────────────────────────────── -->
<div class="toasts" id="toasts"></div>

<!-- ── New Campaign Modal ─────────────────────────────────────────────── -->
<div class="modal-overlay" id="campaign-modal" style="display:none" onclick="if(event.target===this)closeCampaignModal()">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="campaign-modal-title">New Campaign</div>
      <button class="btn btn-ghost btn-icon" onclick="closeCampaignModal()">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="campaign-id-input">
      <div class="form-group">
        <label class="form-label">Campaign Name <span class="req">*</span></label>
        <input type="text" class="form-input" id="campaign-name-input" placeholder="e.g. TheBHTLabs Launch, Q2 Thought Leadership">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="campaign-desc-input" placeholder="Brief description of this campaign's focus">
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <div class="color-picker-row" id="color-picker">
          <!-- Swatches injected by JS -->
        </div>
        <input type="hidden" id="campaign-color-input" value="#31748E">
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeCampaignModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCampaign()">Save Campaign</button>
    </div>
  </div>
</div>

<!-- ── New Post Modal ─────────────────────────────────────────────────── -->
<div class="modal-overlay" id="post-modal" style="display:none" onclick="if(event.target===this)closePostModal()">
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title" id="post-modal-title">New Post</div>
      <button class="btn btn-ghost btn-icon" onclick="closePostModal()">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="post-id-input">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Post Title <span class="req">*</span></label>
          <input type="text" class="form-input" id="post-title-input" placeholder="Internal title for this post">
        </div>
        <div class="form-group">
          <label class="form-label">Campaign</label>
          <select class="form-select" id="post-campaign-input">
            <option value="">None</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Post Body <span class="req">*</span></label>
        <textarea class="form-textarea tall" id="post-body-input" placeholder="Write your LinkedIn post here..." oninput="updateCharCount();liveBhtCheck(this.value)"></textarea>
        <div class="char-count" id="char-count">0 / 3000</div>
        <div id="bht-inline-result"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Hashtags</label>
        <input type="text" class="form-input" id="post-hashtags-input" placeholder="#AIGovernance #EUAIAct #NIST">
        <div class="help-text">Space-separated. These are added at the end of your post body.</div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Scheduled Date & Time <span class="req">*</span></label>
          <input type="datetime-local" class="form-input" id="post-date-input">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="post-status-input">
            <option value="scheduled">Scheduled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Attach Assets (Images, PDFs)</label>
        <div class="drop-zone" id="post-drop-zone" onclick="document.getElementById('post-file-input').click()">
          <div class="drop-zone-icon">🖼️</div>
          <div class="drop-zone-text"><strong>Click to attach</strong> or drag and drop</div>
          <div class="drop-zone-sub">PNG, JPG, GIF, PDF — up to 50MB each</div>
        </div>
        <input type="file" id="post-file-input" multiple accept=".png,.jpg,.jpeg,.gif,.pdf" style="display:none" onchange="handlePostFiles(this.files)">
        <div class="uploaded-files" id="post-uploaded-files"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closePostModal()">Cancel</button>
      <button class="btn btn-ghost" id="post-auto-btn" onclick="autoFillPost()" title="Auto-generate hashtags, image, and schedule slot using AI">⚡ Auto-Fill</button>
      <button class="btn btn-primary" id="post-save-btn" onclick="savePost()">Save Post</button>
    </div>
  </div>
</div>

<!-- ── Post Detail Modal ──────────────────────────────────────────────── -->
<div class="modal-overlay" id="post-detail-modal" style="display:none" onclick="if(event.target===this)closePostDetailModal()">
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title" id="detail-title"></div>
      <button class="btn btn-ghost btn-icon" onclick="closePostDetailModal()">✕</button>
    </div>
    <div class="modal-body" id="detail-body"></div>
    <div class="modal-footer" id="detail-footer"></div>
  </div>
</div>

<script>
// ══════════════════════════════════════════════════════════════════════════
// State
// ══════════════════════════════════════════════════════════════════════════
const API = '/api';
let allPosts = [];
let allCampaigns = [];
let statusFilter = 'all';
let calYear, calMonth;
let pendingPostFiles = [];
let selectedColor = '#31748E';
let linkedInConnected = false;

const PALETTE = ['#31748E','#D53232','#C88E00','#1A7F4E','#7C3AED','#E05C2A','#0F7490','#9D174D','#1D4ED8','#374151'];

// ══════════════════════════════════════════════════════════════════════════
// Toast
// ══════════════════════════════════════════════════════════════════════════
function toast(msg, type = 'info', duration = 3500) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ══════════════════════════════════════════════════════════════════════════
// Navigation
// ══════════════════════════════════════════════════════════════════════════
const PAGE_TITLES = {
  dashboard:   'Dashboard',
  campaigns:   'Campaigns',
  posts:       'Posts',
  calendar:    'Calendar',
  import:      'Import Schedule',
  settings:    'Settings',
  'ai-usage':  'AI Usage & Guardrails',
};

function showPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${page}`).style.display = '';
  document.getElementById(`nav-${page}`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page] || page;

  if (page === 'dashboard') loadDashboard();
  if (page === 'campaigns') loadCampaigns();
  if (page === 'posts')     loadPosts();
  if (page === 'calendar')  renderCalendar();
  if (page === 'settings')  loadSettings();
  if (page === 'ai-usage')  loadAiUsage();
}

// ══════════════════════════════════════════════════════════════════════════
// API helpers
// ══════════════════════════════════════════════════════════════════════════
async function api(path, opts = {}) {
  const res = await fetch(API + path, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json;
}

// ══════════════════════════════════════════════════════════════════════════
// Dashboard
// ══════════════════════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const { stats, upcoming, recent } = await api('/stats');
    document.getElementById('stat-scheduled').textContent = stats.scheduled || 0;
    document.getElementById('stat-posted').textContent = stats.posted || 0;
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-failed').textContent = stats.failed || 0;
    // Auto-generation counters — JS DOM writes, not Claude
    document.getElementById('stat-auto-scheduled').textContent  = stats.auto_scheduled  || 0;
    document.getElementById('stat-auto-images').textContent     = stats.auto_images     || 0;
    document.getElementById('stat-auto-hashtags').textContent   = stats.auto_hashtags   || 0;

    const badge = document.getElementById('badge-scheduled');
    if (stats.scheduled > 0) {
      badge.textContent = stats.scheduled;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }

    renderUpcoming(upcoming);
    renderRecent(recent);
  } catch (e) {
    toast('Could not load dashboard: ' + e.message, 'error');
  }
}

function renderUpcoming(posts) {
  const el = document.getElementById('upcoming-list');
  if (!posts.length) {
    el.innerHTML = `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📅</div><div class="empty-state-sub">No scheduled posts</div></div>`;
    return;
  }
  el.innerHTML = posts.map(p => `
    <div class="upcoming-item" onclick="openPostDetail(${p.id})" style="cursor:pointer">
      <div class="upcoming-time">${formatDT(p.scheduled_at)}</div>
      <div class="upcoming-title">${esc(p.title)}</div>
      ${p.campaign_name ? `<div class="upcoming-campaign" style="background:${p.campaign_color||'#31748E'}">${esc(p.campaign_name)}</div>` : ''}
    </div>
  `).join('');
}

function renderRecent(posts) {
  const el = document.getElementById('recent-list');
  if (!posts.length) {
    el.innerHTML = `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">🕐</div><div class="empty-state-sub">No activity yet</div></div>`;
    return;
  }
  el.innerHTML = posts.map(p => `
    <div class="upcoming-item" onclick="openPostDetail(${p.id})" style="cursor:pointer">
      <div class="upcoming-time">${formatDT(p.posted_at || p.scheduled_at)}</div>
      <div class="upcoming-title">${esc(p.title)}</div>
      <span class="post-tag ${p.status}">${p.status}</span>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════════════
// Campaigns
// ══════════════════════════════════════════════════════════════════════════
async function loadCampaigns() {
  try {
    allCampaigns = await api('/campaigns');
    renderCampaigns();
  } catch(e) { toast(e.message,'error'); }
}

function renderCampaigns() {
  const el = document.getElementById('campaigns-grid');
  if (!allCampaigns.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📁</div>
      <div class="empty-state-title">No campaigns yet</div>
      <div class="empty-state-sub">Create a campaign to organize posts by topic</div>
      <button class="btn btn-primary" onclick="openNewCampaignModal()">Create campaign</button>
    </div>`;
    return;
  }
  el.innerHTML = allCampaigns.map(c => `
    <div class="campaign-card" onclick="filterByCampaign(${c.id})" style="border-left-color:${c.color}">
      <div class="campaign-name">${esc(c.name)}</div>
      <div class="campaign-desc">${esc(c.description||'')}</div>
      <div class="campaign-counts">
        <span class="c-count sched">📅 ${c.scheduled_count||0} scheduled</span>
        <span class="c-count posted">✅ ${c.posted_count||0} posted</span>
        ${c.failed_count>0?`<span class="c-count failed">❌ ${c.failed_count}</span>`:''}
      </div>
      <div class="campaign-card-actions">
        <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 10px" onclick="event.stopPropagation();runCampaignPipeline(${c.id},'${esc(c.name)}')" title="Auto-schedule + generate images + tags for all posts">⚡ Auto</button>
        <button class="btn btn-ghost btn-sm btn-icon" onclick="event.stopPropagation();editCampaign(${c.id})">✏️</button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="event.stopPropagation();deleteCampaign(${c.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function filterByCampaign(id) {
  showPage('posts');
  setTimeout(() => {
    document.getElementById('post-campaign-filter') ?.value = id;
    loadPosts(id);
  }, 50);
}

function openNewCampaignModal(id) {
  document.getElementById('campaign-modal-title').textContent = id ? 'Edit Campaign' : 'New Campaign';
  document.getElementById('campaign-id-input').value = id || '';
  document.getElementById('campaign-name-input').value = '';
  document.getElementById('campaign-desc-input').value = '';
  selectedColor = '#31748E';

  if (id) {
    const c = allCampaigns.find(x => x.id === id);
    if (c) {
      document.getElementById('campaign-name-input').value = c.name;
      document.getElementById('campaign-desc-input').value = c.description||'';
      selectedColor = c.color;
    }
  }

  renderColorPicker();
  document.getElementById('campaign-modal').style.display = 'flex';
}

function editCampaign(id) { openNewCampaignModal(id); }

function renderColorPicker() {
  const el = document.getElementById('color-picker');
  el.innerHTML = PALETTE.map(c => `
    <div class="color-swatch ${c===selectedColor?'selected':''}"
      style="background:${c}"
      onclick="selectColor('${c}')"
      title="${c}"></div>
  `).join('');
}

function selectColor(c) {
  selectedColor = c;
  document.getElementById('campaign-color-input').value = c;
  renderColorPicker();
}

function closeCampaignModal() { document.getElementById('campaign-modal').style.display = 'none'; }

async function saveCampaign() {
  const id = document.getElementById('campaign-id-input').value;
  const name = document.getElementById('campaign-name-input').value.trim();
  const description = document.getElementById('campaign-desc-input').value.trim();
  const color = selectedColor;
  if (!name) { toast('Campaign name is required','error'); return; }
  try {
    if (id) {
      await api(`/campaigns/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,description,color}) });
      toast('Campaign updated','success');
    } else {
      await api('/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,description,color}) });
      toast('Campaign created','success');
    }
    closeCampaignModal();
    loadCampaigns();
    // Refresh campaign dropdowns
    loadCampaignDropdowns();
  } catch(e) { toast(e.message,'error'); }
}

async function deleteCampaign(id) {
  if (!confirm('Delete this campaign? Posts will not be deleted.')) return;
  try {
    await api(`/campaigns/${id}`, { method:'DELETE' });
    toast('Campaign deleted','success');
    loadCampaigns();
  } catch(e) { toast(e.message,'error'); }
}

// ══════════════════════════════════════════════════════════════════════════
// Posts
// ══════════════════════════════════════════════════════════════════════════
async function loadPosts(campaignId) {
  try {
    let url = '/posts';
    if (campaignId) url += `?campaign_id=${campaignId}`;
    allPosts = await api(url);
    filterPosts();
  } catch(e) { toast(e.message,'error'); }
}

function setStatusFilter(f, el) {
  statusFilter = f;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterPosts();
}

function filterPosts() {
  const search = document.getElementById('post-search').value.toLowerCase();
  let posts = allPosts;
  if (statusFilter !== 'all') posts = posts.filter(p => p.status === statusFilter);
  if (search) posts = posts.filter(p =>
    p.title.toLowerCase().includes(search) ||
    p.body.toLowerCase().includes(search)
  );
  renderPosts(posts);
}

function renderPosts(posts) {
  const el = document.getElementById('posts-list');
  if (!posts.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-title">No posts found</div>
      <div class="empty-state-sub">Try a different filter or create a new post</div>
      <button class="btn btn-primary" onclick="openNewPostModal()">+ New Post</button>
    </div>`;
    return;
  }
  el.innerHTML = posts.map(p => {
    const assets = typeof p.assets === 'string' ? JSON.parse(p.assets) : (p.assets || []);
    return `
    <div class="post-card">
      <div class="post-status-dot ${p.status}"></div>
      <div>
        <div class="post-title">${esc(p.title)}</div>
        <div class="post-preview">${esc(p.body)}</div>
        <div class="post-meta">
          <span class="post-tag ${p.status}">${p.status}</span>
          <span class="post-date">${formatDT(p.scheduled_at)}</span>
          ${p.campaign_name ? `<span class="post-campaign-tag" style="background:${p.campaign_color||'#31748E'}">${esc(p.campaign_name)}</span>` : ''}
        </div>
        ${assets.length ? `<div class="post-assets-row">${assets.map(a => `
          <div class="asset-chip">
            <span>${assetIcon(a.asset_type)}</span>
            <span title="${esc(a.original_name)}">${esc(a.original_name)}</span>
          </div>`).join('')}</div>` : ''}
        ${p.error_message ? `<div style="font-size:12px;color:var(--red);margin-top:6px">Error: ${esc(p.error_message)}</div>` : ''}
      </div>
      <div class="post-actions">
        <button class="btn btn-ghost btn-icon btn-sm" title="View" onclick="openPostDetail(${p.id})">👁️</button>
        <button class="btn btn-ghost btn-icon btn-sm" title="Edit" onclick="openEditPostModal(${p.id})">✏️</button>
        ${p.status !== 'posted' ? `<button class="btn btn-ghost btn-icon btn-sm" title="Re-run auto-generation (hashtags + image)" onclick="event.stopPropagation();autoGenerate(${p.id})">✨</button>` : ''}
        ${p.status==='failed' ? `<button class="btn btn-success btn-icon btn-sm" title="Retry" onclick="retryPost(${p.id})">🔄</button>` : ''}
        <button class="btn btn-danger btn-icon btn-sm" title="Delete" onclick="deletePost(${p.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function assetIcon(type) {
  if (type === 'image') return '🖼️';
  if (type === 'document') return '📄';
  return '📎';
}

async function openPostDetail(id) {
  try {
    const p = await api(`/posts/${id}`);
    document.getElementById('detail-title').textContent = p.title;
    const dt = formatDT(p.scheduled_at);

    document.getElementById('detail-body').innerHTML = `
      <div style="margin-bottom:16px">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap">
          <span class="post-tag ${p.status}">${p.status}</span>
          <span class="post-date">${dt}</span>
          ${p.campaign_name?`<span class="post-campaign-tag" style="background:${p.campaign_color||'#31748E'}">${esc(p.campaign_name)}</span>`:''}
        </div>
        <div style="background:var(--gray-page);border-radius:8px;padding:16px;font-size:14px;line-height:1.7;white-space:pre-wrap;color:var(--body-txt)">${esc(p.body)}</div>
        ${p.hashtags ? `<div style="margin-top:8px;font-size:13px;color:var(--teal)">${esc(p.hashtags)}</div>` : ''}
      </div>
      ${p.assets?.length ? `
        <div style="margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;color:var(--navy-mid);margin-bottom:8px">Attached Assets</div>
          <div class="post-assets-row">
            ${p.assets.map(a => `
              <div class="asset-chip" style="max-width:none">
                ${assetIcon(a.asset_type)}
                <a href="/uploads/${a.filename}" target="_blank" style="color:var(--teal);text-decoration:none;font-weight:500">${esc(a.original_name)}</a>
                <span style="color:var(--gray-txt)">${formatBytes(a.file_size)}</span>
                <span class="file-remove" onclick="deleteAsset(${a.id},${p.id})">✕</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
      ${p.linkedin_post_id ? `<div style="font-size:12px;color:var(--green)">LinkedIn Post ID: ${p.linkedin_post_id}</div>` : ''}
      ${p.error_message ? `<div style="background:var(--red-bg);padding:10px 14px;border-radius:8px;font-size:13px;color:var(--red);margin-top:10px">Error: ${esc(p.error_message)}</div>` : ''}
    `;

    document.getElementById('detail-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="closePostDetailModal()">Close</button>
      <button class="btn btn-secondary" onclick="closePostDetailModal();openEditPostModal(${p.id})">Edit</button>
      ${p.status !== 'posted' ? `<button class="btn btn-primary" onclick="publishNow(${p.id})">Publish Now</button>` : ''}
    `;

    document.getElementById('post-detail-modal').style.display = 'flex';
  } catch(e) { toast(e.message,'error'); }
}

function closePostDetailModal() { document.getElementById('post-detail-modal').style.display = 'none'; }

async function deleteAsset(assetId, postId) {
  if (!confirm('Remove this asset?')) return;
  try {
    await api(`/assets/${assetId}`, { method:'DELETE' });
    toast('Asset removed','success');
    openPostDetail(postId);
    loadPosts();
  } catch(e) { toast(e.message,'error'); }
}

async function publishNow(id) {
  if (!confirm('Publish this post to LinkedIn right now?')) return;
  try {
    toast('Publishing...','info');
    await api(`/posts/${id}/publish-now`, { method:'POST' });
    toast('Posted to LinkedIn!','success');
    closePostDetailModal();
    loadDashboard();
    loadPosts();
  } catch(e) { toast('Publish failed: ' + e.message, 'error'); }
}

async function retryPost(id) {
  try {
    await api(`/posts/${id}/retry`, { method:'POST' });
    toast('Post re-queued for next scheduled check','success');
    loadPosts();
  } catch(e) { toast(e.message,'error'); }
}
async function autoGenerate(id) {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = '⏳';
  try {
    toast('Running auto-generation (hashtags + image)...', 'info');
    await api(`/posts/${id}/auto-generate`, { method: 'POST' });
    toast('Auto-generation complete', 'success');
    loadPosts();
  } catch(e) {
    toast('Auto-generate error: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = '✨';
  }
}


async function deletePost(id) {
  if (!confirm('Delete this post permanently?')) return;
  try {
    await api(`/posts/${id}`, { method:'DELETE' });
    toast('Post deleted','success');
    allPosts = allPosts.filter(p => p.id !== id);
    filterPosts();
    loadDashboard();
  } catch(e) { toast(e.message,'error'); }
}

// ══════════════════════════════════════════════════════════════════════════
// Post Modal
// ══════════════════════════════════════════════════════════════════════════
async function loadCampaignDropdowns() {
  try {
    if (!allCampaigns.length) allCampaigns = await api('/campaigns');
    const sel = document.getElementById('post-campaign-input');
    sel.innerHTML = '<option value="">None</option>' +
      allCampaigns.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
  } catch(e) {}
}

function openNewPostModal() {
  document.getElementById('post-modal-title').textContent = 'New Post';
  document.getElementById('post-id-input').value = '';
  document.getElementById('post-title-input').value = '';
  document.getElementById('post-body-input').value = '';
  document.getElementById('post-hashtags-input').value = '';
  document.getElementById('post-date-input').value = '';
  document.getElementById('post-status-input').value = 'scheduled';
  document.getElementById('post-uploaded-files').innerHTML = '';
  pendingPostFiles = [];
  updateCharCount();
  loadCampaignDropdowns();
  document.getElementById('post-modal').style.display = 'flex';
  setupPostDropZone();
}

async function openEditPostModal(id) {
  try {
    const p = await api(`/posts/${id}`);
    document.getElementById('post-modal-title').textContent = 'Edit Post';
    document.getElementById('post-id-input').value = p.id;
    document.getElementById('post-title-input').value = p.title;
    document.getElementById('post-body-input').value = p.body;
    document.getElementById('post-hashtags-input').value = p.hashtags || '';
    document.getElementById('post-date-input').value = p.scheduled_at.slice(0,16);
    document.getElementById('post-status-input').value = p.status;
    pendingPostFiles = [];
    updateCharCount();

    // Show existing assets
    const filesEl = document.getElementById('post-uploaded-files');
    if (p.assets?.length) {
      filesEl.innerHTML = p.assets.map(a => `
        <div class="file-row">
          <span class="file-icon">${assetIcon(a.asset_type)}</span>
          <span class="file-name">${esc(a.original_name)}</span>
          <span class="file-size">Saved</span>
          <span class="file-remove" onclick="deleteAsset(${a.id},${p.id});this.parentElement.remove()">✕</span>
        </div>`).join('');
    } else {
      filesEl.innerHTML = '';
    }

    loadCampaignDropdowns().then(() => {
      document.getElementById('post-campaign-input').value = p.campaign_id || '';
    });

    document.getElementById('post-modal').style.display = 'flex';
    setupPostDropZone();
  } catch(e) { toast(e.message,'error'); }
}

function closePostModal() {
  document.getElementById('post-modal').style.display = 'none';
  pendingPostFiles = [];
}

function updateCharCount() {
  const val = document.getElementById('post-body-input').value;
  const len = val.length;
  const el = document.getElementById('char-count');
  el.textContent = `${len} / 3000`;
  el.className = 'char-count' + (len > 2800 ? ' warn' : '') + (len > 3000 ? ' over' : '');
}

function setupPostDropZone() {
  const dz = document.getElementById('post-drop-zone');
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('dragover'); };
  dz.ondragleave = () => dz.classList.remove('dragover');
  dz.ondrop = e => {
    e.preventDefault();
    dz.classList.remove('dragover');
    handlePostFiles(e.dataTransfer.files);
  };
}

function handlePostFiles(files) {
  for (const file of files) {
    pendingPostFiles.push(file);
  }
  renderPendingFiles();
}

function renderPendingFiles() {
  const el = document.getElementById('post-uploaded-files');
  const existing = el.querySelectorAll('.file-row[data-existing]');
  const newRows = pendingPostFiles.map((f, i) => `
    <div class="file-row">
      <span class="file-icon">${fileIcon(f.name)}</span>
      <span class="file-name">${esc(f.name)}</span>
      <span class="file-size">${formatBytes(f.size)}</span>
      <span class="file-remove" onclick="removePendingFile(${i})">✕</span>
    </div>`).join('');

  // Keep existing asset rows, add new ones
  el.querySelectorAll('.file-row:not([data-existing])').forEach(r => r.remove());
  el.insertAdjacentHTML('beforeend', newRows);
}

function removePendingFile(i) {
  pendingPostFiles.splice(i, 1);
  renderPendingFiles();
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['png','jpg','jpeg','gif'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📄';
  return '📎';
}

async function savePost() {
  const id = document.getElementById('post-id-input').value;
  const title = document.getElementById('post-title-input').value.trim();
  const body = document.getElementById('post-body-input').value.trim();
  const hashtags = document.getElementById('post-hashtags-input').value.trim();
  const scheduled_at = document.getElementById('post-date-input').value;
  const campaign_id = document.getElementById('post-campaign-input').value;
  const status = document.getElementById('post-status-input').value;

  if (!title) { toast('Post title is required','error'); return; }
  if (!body) { toast('Post body is required','error'); return; }
  if (!scheduled_at && status === 'scheduled') { toast('Schedule date is required','error'); return; }

  const btn = document.getElementById('post-save-btn');
  btn.innerHTML = '<span class="loading"></span> Saving...';
  btn.disabled = true;

  const fd = new FormData();
  fd.append('title', title);
  fd.append('body', body);
  fd.append('hashtags', hashtags);
  fd.append('scheduled_at', new Date(scheduled_at).toISOString());
  fd.append('campaign_id', campaign_id);
  fd.append('status', status);
  for (const f of pendingPostFiles) fd.append('assets', f);

  try {
    if (id) {
      await fetch(`${API}/posts/${id}`, { method:'PUT', body:fd });
      toast('Post updated','success');
    } else {
      await fetch(`${API}/posts`, { method:'POST', body:fd });
      toast('Post scheduled','success');
    }
    closePostModal();
    loadPosts();
    loadDashboard();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  } finally {
    btn.innerHTML = 'Save Post';
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Calendar
// ══════════════════════════════════════════════════════════════════════════
function renderCalendar() {
  const now = new Date();
  if (!calYear) { calYear = now.getFullYear(); calMonth = now.getMonth(); }
  const label = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', {month:'long',year:'numeric'});
  document.getElementById('cal-month-label').textContent = label;

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
    `<div class="cal-day-label">${d}</div>`).join('');

  // Fetch posts for this month
  const monthStart = new Date(calYear, calMonth, 1).toISOString();
  const monthEnd = new Date(calYear, calMonth+1, 0).toISOString();
  const monthPosts = allPosts.filter(p => {
    const d = new Date(p.scheduled_at);
    return d >= new Date(calYear, calMonth, 1) && d <= new Date(calYear, calMonth+1, 0);
  });

  let cells = '';
  // Prev month filler
  for (let i = 0; i < firstDay; i++) {
    cells += `<div class="cal-day other-month"><div class="cal-day-num">${daysInPrev - firstDay + i + 1}</div></div>`;
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    const dayPosts = monthPosts.filter(p => new Date(p.scheduled_at).getDate() === d);
    const pillsHtml = dayPosts.slice(0,3).map(p => {
      const col = p.campaign_color || '#31748E';
      return `<div class="cal-post-pill" style="background:${col};color:#fff" onclick="openPostDetail(${p.id})" title="${esc(p.title)}">${esc(p.title.slice(0,20))}</div>`;
    }).join('') + (dayPosts.length > 3 ? `<div style="font-size:10px;color:var(--gray-txt)">+${dayPosts.length-3} more</div>` : '');
    cells += `<div class="cal-day${isToday?' today':''}"><div class="cal-day-num">${d}</div>${pillsHtml}</div>`;
  }
  // Next month filler
  const total = firstDay + daysInMonth;
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= rem; i++) {
    cells += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  }
  grid.insertAdjacentHTML('beforeend', cells);
}

function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// ══════════════════════════════════════════════════════════════════════════
// Import
// ══════════════════════════════════════════════════════════════════════════
const importDZ = document.getElementById('import-drop-zone');
importDZ.ondragover = e => { e.preventDefault(); importDZ.classList.add('dragover'); };
importDZ.ondragleave = () => importDZ.classList.remove('dragover');
importDZ.ondrop = e => {
  e.preventDefault();
  importDZ.classList.remove('dragover');
  importSchedule(e.dataTransfer.files[0]);
};

async function importSchedule(file) {
  if (!file) return;
  const resultEl = document.getElementById('import-result');
  resultEl.style.display = '';
  resultEl.className = 'import-result';
  resultEl.textContent = 'Importing...';

  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch(`${API}/import-schedule`, { method:'POST', body:fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    resultEl.className = `import-result ${data.errors > 0 ? 'warning' : 'success'}`;
    resultEl.innerHTML = `
      ✅ Imported ${data.inserted} posts successfully.
      ${data.errors > 0 ? `<br>⚠️ ${data.errors} rows skipped (missing required columns or invalid date).` : ''}
    `;
    toast(`Imported ${data.inserted} posts`, 'success');
    loadPosts();
    loadDashboard();
  } catch(e) {
    resultEl.className = 'import-result';
    resultEl.style.background = 'var(--red-bg)';
    resultEl.style.color = 'var(--red)';
    resultEl.textContent = 'Error: ' + e.message;
    toast(e.message, 'error');
  }
}

function downloadTemplate() {
  const csv = [
    'title,body,scheduled_at,hashtags,campaign',
    '"Post 1 Title","Your LinkedIn post body goes here. Write the full text of the post.","2026-03-05 08:00","#AIGovernance #EUAIAct","Campaign Name"',
    '"Post 2 Title","Second post body text.","2026-03-06 09:00","#Compliance #NIST","Campaign Name"',
  ].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'linkedin_schedule_template.csv';
  a.click();
}

// ══════════════════════════════════════════════════════════════════════════
// Settings / LinkedIn
// ══════════════════════════════════════════════════════════════════════════
async function loadSettings() {
  // LinkedIn status
  try {
    const config = await api('/linkedin-config');
    if (config.connected) {
      document.getElementById('li-dot').classList.add('connected');
      document.getElementById('li-status-text').textContent = 'Connected';
      document.getElementById('li-status-sub').textContent = config.person_urn || '';
      linkedInConnected = true;
    } else {
      document.getElementById('li-dot').classList.remove('connected');
      document.getElementById('li-status-text').textContent = 'Not connected';
      linkedInConnected = false;
    }
    if (config.person_urn)      document.getElementById('li-urn-input').value    = config.person_urn;
    if (config.token_expires_at) document.getElementById('li-expiry-input').value = config.token_expires_at.slice(0,16);
  } catch(e) {}
  // Automation toggles and guardrails
  loadAutoConfig();
  loadGuardrails();
}

// ── Automation config ──────────────────────────────────────────────────────
async function loadAutoConfig() {
  try {
    const cfg = await api('/app-config');
    document.getElementById('toggle-auto-schedule').checked  = !!cfg.auto_schedule;
    document.getElementById('toggle-auto-hashtags').checked  = !!cfg.auto_hashtags;
    document.getElementById('toggle-auto-image').checked     = !!cfg.auto_image;
  } catch(e) {
    console.warn('Could not load auto-config:', e.message);
  }
}

async function saveAutoConfig() {
  // Read toggle states — JS DOM, not Claude
  const auto_schedule  = document.getElementById('toggle-auto-schedule').checked;
  const auto_hashtags  = document.getElementById('toggle-auto-hashtags').checked;
  const auto_image     = document.getElementById('toggle-auto-image').checked;
  try {
    await api('/app-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_schedule, auto_hashtags, auto_image }),
    });
    toast('Automation settings saved', 'success');
  } catch(e) {
    toast('Could not save: ' + e.message, 'error');
  }
}

// ── BHT guardrails display — renders from static BHT_CONTENT_RULES array.
// No API call. The rules are compiled into this file at build time.
// If the rules change, update BHT_CONTENT_RULES above AND ai.js BHT_GUARDRAILS.
function loadGuardrails() {
  const el = document.getElementById('guardrail-list');
  if (!el) return;
  // JS .map() builds the list — not Claude
  el.innerHTML = BHT_CONTENT_RULES.map(r => `
    <div style="display:flex;align-items:flex-start;gap:10px">
      <div style="color:var(--red);font-size:15px;flex-shrink:0;line-height:1.5">&#10007;</div>
      <div>
        <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.9);margin-bottom:2px">${esc(r.rule)}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.6">${esc(r.detail)}</div>
      </div>
    </div>`).join('');
}

async function saveLinkedInConfig() {
  const access_token = document.getElementById('li-token-input').value.trim();
  const person_urn = document.getElementById('li-urn-input').value.trim();
  const expiry = document.getElementById('li-expiry-input').value;

  if (!access_token || !person_urn) {
    toast('Both access token and person URN are required','error');
    return;
  }
  try {
    await api('/linkedin-config', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ access_token, person_urn, token_expires_at: expiry||null })
    });
    toast('LinkedIn configuration saved','success');
    loadSettings();
    document.getElementById('li-token-input').value = '';
  } catch(e) { toast(e.message,'error'); }
}

async function testLinkedInConnection() {
  const resultEl = document.getElementById('test-result');
  resultEl.style.display = '';
  resultEl.textContent = 'Testing connection...';
  resultEl.style.cssText = 'margin-top:12px;padding:10px 14px;border-radius:8px;font-size:13px;background:var(--teal-bg);color:var(--teal)';
  try {
    const res = await api('/linkedin-config/test');
    if (res.connected) {
      resultEl.style.background = 'var(--green-bg)';
      resultEl.style.color = 'var(--green)';
      resultEl.innerHTML = `✅ Connected as <strong>${res.name}</strong>`;
      document.getElementById('li-avatar').innerHTML = res.picture
        ? `<img src="${res.picture}" alt="">`
        : '👤';
      document.getElementById('li-name').textContent = res.name;
      document.getElementById('li-sub').textContent = 'Connection verified';
      document.getElementById('li-conn-status').textContent = '✅ Active';
      document.getElementById('li-conn-status').className = 'connection-status ok';
      document.getElementById('li-dot').classList.add('connected');
      document.getElementById('li-status-text').textContent = 'Connected';
    } else {
      throw new Error(res.error || 'Connection failed');
    }
  } catch(e) {
    resultEl.style.background = 'var(--red-bg)';
    resultEl.style.color = 'var(--red)';
    resultEl.textContent = '❌ ' + e.message;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Utils
// ══════════════════════════════════════════════════════════════════════════
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function formatDT(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-US', {
    month:'short', day:'numeric', year:'numeric',
    hour:'numeric', minute:'2-digit', hour12:true
  });
}

function formatBytes(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/(1024*1024)).toFixed(1) + ' MB';
}

// ══════════════════════════════════════════════════════════════════════════
// AI Usage page
// All arithmetic here is JS. No Claude calls made from this function.
// ══════════════════════════════════════════════════════════════════════════

// Guardrail reference table — static data, JS array, not Claude.
// Describes every task in the system and which layer handles it.
const GUARDRAIL_RULES = [
  // ── CLAUDE tasks ─────────────────────────────────────────────────────
  { task: 'Post quality review',        layer: 'Claude',  reason: 'Judgment: coherence, tone, reputational risk require reading comprehension' },
  { task: 'Summarize post preview',     layer: 'Claude',  reason: 'Summarization: extracting the core claim from 300+ words needs language understanding' },
  { task: 'Campaign narrative audit',   layer: 'Claude',  reason: 'Strategy: detecting arc problems across a post sequence requires editorial judgment' },
  { task: 'Resolve ambiguous dates',    layer: 'Claude',  reason: 'Ambiguity: "next Thursday after launch" cannot be parsed by regex or Date.parse()' },
  { task: 'Generate hashtags',          layer: 'Claude',  reason: 'Generation: selecting hashtags relevant to post content + BHT audience requires context' },
  { task: 'Write DALL-E image prompt',  layer: 'Claude',  reason: 'Generation: translating post meaning into a visual scene description requires interpretation' },
  // ── JS tasks (Claude never called) ───────────────────────────────────
  { task: 'Validate post structure',    layer: 'JS',      reason: 'Boolean check: length, presence, date parse — all deterministic' },
  { task: 'Detect content type',        layer: 'JS',      reason: 'Keyword matching: ordered regex lookup table with fixed categories' },
  { task: 'Auto-schedule timing',       layer: 'JS',      reason: 'Lookup table: day-of-week rules by content type — explicit, not judgment' },
  { task: 'Parse standard dates',       layer: 'JS',      reason: 'Date math: ISO, MM/DD/YYYY etc. handled by Date.parse() reliably' },
  { task: 'Normalise CSV columns',      layer: 'JS',      reason: 'JSON transform: fixed alias mapping — object key lookup' },
  { task: 'Filter posts by status',     layer: 'JS',      reason: 'Filtering: Array.filter() on a string field' },
  { task: 'Count hashtags',             layer: 'JS',      reason: 'Regex: /#\\w+/g match count — one line' },
  { task: 'Detect URL in body',         layer: 'JS',      reason: 'Regex: /https?:\\/\\// test — boolean result' },
  { task: 'Sort posts by date',         layer: 'JS',      reason: 'Date math: Array.sort() with Date subtraction' },
  { task: 'Format date labels',         layer: 'JS',      reason: 'Simple formatting: toLocaleDateString() template' },
  { task: 'Aggregate usage stats',      layer: 'JS',      reason: 'JSON transform: .filter() + .reduce() on usage log array' },
  { task: 'Detect asset type',          layer: 'JS',      reason: 'Boolean check: path.extname() vs fixed extension list' },
  { task: 'Extract hashtags from response',layer: 'JS',   reason: 'Regex: /#\\w+/g on Claude text output — no re-asking needed' },
  { task: 'LinkedIn post construction', layer: 'JS',      reason: 'JSON transform: template literal to build LinkedIn REST payload' },
  { task: 'Scheduler tick (due check)', layer: 'JS',      reason: 'Date math: scheduled_at <= now in SQLite WHERE clause' },
];

// BHT Content Rules — mirrored from ai.js for display in Settings page.
// These are injected into every Claude system prompt. Static array — no API call.
const BHT_CONTENT_RULES = [
  { rule: 'No em dash',            detail: 'Not the Unicode em dash (—) and not double-hyphen (--) used as one. Use a comma, colon, or rewrite.' },
  { rule: 'No 60% reduction claim',detail: '"60% processing time reduction" is unverified. Permanently excluded from all BHT content.' },
  { rule: 'SEC: subcontractor only',detail: 'Never describe SEC as a direct client. Subcontractor engagement only. Do not imply otherwise.' },
  { rule: 'DOJ: name the prime',   detail: 'Subcontractor engagements only. If DOJ is mentioned, the prime contractor must be named.' },
  { rule: 'DHS: HHREF 2004-2010',  detail: 'BHT was subcontractor to HHREF from 2004 to 2010. That is the only correct characterization.' },
  { rule: 'GSA MAS: in pursuit',   detail: 'GSA MAS is not a current vehicle. In pursuit, not awarded. Never imply BHT holds it.' },
  { rule: 'BHT Insight: concept',  detail: 'BHT Insight is at concept stage only. Not deployed, not available, not shipping.' },
  { rule: 'No unverifiable citations',detail: 'No budget figure or policy citation that cannot be confirmed from public record.' },
  { rule: 'No future as present',  detail: 'No forward-looking capability stated as if it exists today.' },
  { rule: 'No "solution" noun',    detail: 'Replace "solution" as a marketing noun with specific nouns: framework, process, platform, approach.' },
  { rule: 'No template sentences', detail: 'No "in today\'s rapidly evolving landscape," "at the forefront of," or "committed to excellence." Write specifically.' },
];

async function loadAiUsage() {
  // Render guardrail table immediately from static data — no API call needed
  renderGuardrailTable();

  // Fetch live usage stats from server — pure JS aggregation on server side
  try {
    const stats = await api('/ai-usage');
    renderAiStats(stats);
    renderAiBreakdown(stats.by_function || []);
  } catch (e) {
    // AI key not configured — show zeroes, not an error
    renderAiStats({ last_24h: {}, last_7d: {}, all_time: {}, cache_entries: 0 });
    document.getElementById('ai-breakdown-table').innerHTML =
      '<div style="text-align:center;padding:24px;color:var(--gray-txt);font-size:13px">No Claude calls recorded yet — or ANTHROPIC_API_KEY not set.</div>';
  }
}

// Populate the 4 stat cards — JS string interpolation, no Claude.
function renderAiStats(s) {
  const h24 = s.last_24h || {};
  document.getElementById('ai-calls-24h').textContent  = h24.calls        ?? 0;
  document.getElementById('ai-cache-24h').textContent  = h24.cached_hits  ?? 0;
  // Total tokens = in + out — JS addition, not Claude
  document.getElementById('ai-tokens-24h').textContent = ((h24.tokens_in || 0) + (h24.tokens_out || 0)).toLocaleString();
  document.getElementById('ai-cache-size').textContent  = s.cache_entries  ?? 0;
}

// Build per-function breakdown table — JS .map(), not Claude.
function renderAiBreakdown(rows) {
  const el = document.getElementById('ai-breakdown-table');
  if (!rows.length) {
    el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--gray-txt);font-size:13px">No Claude calls recorded yet.</div>';
    return;
  }
  // Sort by call count descending — JS .sort(), not Claude
  const sorted = [...rows].sort((a, b) => b.calls - a.calls);
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:var(--gray-page)">
          <th style="text-align:left;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Function</th>
          <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">API Calls</th>
          <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Cache Hits</th>
          <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Tokens In</th>
          <th style="text-align:right;padding:10px 12px;border-bottom:1px solid var(--gray-line);color:var(--navy);font-weight:700">Tokens Out</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(r => `
          <tr style="border-bottom:1px solid var(--gray-line)">
            <td style="padding:10px 12px;font-weight:500;color:var(--navy);font-family:'DM Mono',monospace;font-size:12px">${esc(r.fn)}</td>
            <td style="padding:10px 12px;text-align:right;color:var(--teal);font-weight:700">${r.calls}</td>
            <td style="padding:10px 12px;text-align:right;color:var(--green)">${r.cached || 0}</td>
            <td style="padding:10px 12px;text-align:right;color:var(--gray-txt);font-family:'DM Mono',monospace;font-size:12px">${(r.tokens_in || 0).toLocaleString()}</td>
            <td style="padding:10px 12px;text-align:right;color:var(--gray-txt);font-family:'DM Mono',monospace;font-size:12px">${(r.tokens_out || 0).toLocaleString()}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// Build guardrail reference table from static GUARDRAIL_RULES — JS .map(), not Claude.
function renderGuardrailTable() {
  const tbody = document.getElementById('guardrail-table-body');
  if (!tbody) return;
  tbody.innerHTML = GUARDRAIL_RULES.map(r => {
    // Layer badge colour — JS ternary, not Claude
    const isClaude = r.layer === 'Claude';
    const bg    = isClaude ? 'var(--teal-bg)'  : 'var(--green-bg)';
    const color = isClaude ? 'var(--teal)'     : 'var(--green)';
    return `
      <tr style="border-bottom:1px solid var(--gray-line)">
        <td style="padding:9px 12px;color:var(--navy);font-size:13px">${esc(r.task)}</td>
        <td style="padding:9px 12px">
          <span style="background:${bg};color:${color};font-size:11px;font-weight:700;padding:3px 9px;border-radius:12px">${esc(r.layer)}</span>
        </td>
        <td style="padding:9px 12px;color:var(--gray-txt);font-size:12px">${esc(r.reason)}</td>
      </tr>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════════════════
// Auto-Pipeline — client-side orchestration
// All the heavy lifting happens server-side. These functions just trigger
// the endpoints and show progress feedback to the user.
// ══════════════════════════════════════════════════════════════════════════

/**
 * Auto-fills hashtags and schedule slot for the post currently open in the editor.
 * If no post ID (new post), shows advisory. For existing posts, calls auto-process.
 * JS handles: reading form values, updating inputs, button state.
 * Server handles: Claude tag selection, DALL-E prompt, slot assignment.
 */
async function autoFillPost() {
  const id = document.getElementById('post-id-input')?.value;
  const btn = document.getElementById('post-auto-btn');

  if (!id) {
    // New post — save first, then run pipeline
    toast('Save the post first, then use ⚡ Auto-Fill', 'info', 4000);
    return;
  }

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating...'; }

  try {
    const result = await api(`/posts/${id}/auto-process`, { method: 'POST' });

    if (!result.success) {
      const msg = (result.violations||[]).map(v => v.description).join('; ');
      toast(`BHT issue: ${msg}`, 'error', 8000);
      return;
    }

    // Update form fields — JS DOM, not Claude
    if (result.pipeline?.tags) {
      document.getElementById('post-hashtags-input').value = result.pipeline.tags;
    }
    if (result.pipeline?.scheduledAt) {
      // Convert ISO to datetime-local format — JS string ops
      const dt = result.pipeline.scheduledAt.slice(0, 16);
      document.getElementById('post-date-input').value = dt;
    }

    const notes = [];
    if (result.pipeline?.tags)       notes.push('tags generated');
    if (result.pipeline?.imageAsset) notes.push('image generated');
    if (result.pipeline?.scheduledAt) notes.push('slot assigned');
    if (result.pipeline?.bht_auto_fixed) notes.push('BHT fixes applied');

    toast(`⚡ ${notes.join(' · ')}`, 'success', 5000);

    // Refresh post list in background — JS, not Claude
    allPosts = await api('/posts');
    renderPosts();

  } catch (err) {
    toast('Auto-fill error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡ Auto-Fill'; }
  }
}

/**
 * Run full auto-pipeline for a single post.
 * BHT check → tags → DALL-E image → schedule slot
 * JS handles: button state, progress toast, result display
 * Server handles: Claude calls (tag selection, image prompt), DALL-E, date math
 */
async function runPostPipeline(postId) {
  const btn = document.querySelector(`[data-auto-btn="${postId}"]`);
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }

  toast('Running auto-pipeline for this post...', 'info', 3000);

  try {
    const result = await api(`/posts/${postId}/auto-process`, { method: 'POST' });

    if (!result.success) {
      const violations = (result.violations || []).map(v => v.description).join('; ');
      toast(`BHT violation: ${violations}`, 'error', 8000);
      return;
    }

    // Build result summary — JS string template, not Claude
    const parts = [];
    if (result.pipeline?.scheduledAt) parts.push(`Scheduled: ${formatDT(result.pipeline.scheduledAt)}`);
    if (result.pipeline?.tags)        parts.push(`Tags set`);
    if (result.pipeline?.imageAsset)  parts.push(`Image generated`);
    if (result.pipeline?.bht_auto_fixed) parts.push(`BHT auto-fixed`);

    toast(`✅ ${parts.join(' · ')}`, 'success', 5000);

    // Refresh the post in our local array — JS .findIndex(), not Claude
    const idx = allPosts.findIndex(p => p.id === postId);
    if (idx >= 0) allPosts[idx] = result.post;
    renderPosts();

  } catch (err) {
    toast('Pipeline error: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⚡'; }
  }
}

/**
 * Run full auto-pipeline for all posts in a campaign.
 * Shows progress per post. Uses POST /api/campaigns/:id/auto-process-all
 */
async function runCampaignPipeline(campaignId, campaignName) {
  if (!confirm(`Run auto-pipeline for all posts in "${campaignName}"?

This will:
• Check all posts against BHT rules
• Generate hashtags (Claude)
• Generate images (DALL-E 3)
• Auto-schedule posting times

This may take 1-2 minutes.`)) return;

  toast(`⚡ Running pipeline for "${campaignName}"...`, 'info', 60000);

  try {
    const result = await api(`/campaigns/${campaignId}/auto-process-all`, { method: 'POST' });

    // JS aggregation of results — not Claude
    const lines = [
      `${result.success}/${result.total} posts processed`,
      result.imaged  ? `${result.imaged} images generated` : null,
      result.bht_fixed ? `${result.bht_fixed} BHT auto-fixes applied` : null,
      result.failed  ? `${result.failed} failed (check posts)` : null,
    ].filter(Boolean);

    toast(`✅ ${lines.join(' · ')}`, 'success', 8000);

    // Refresh data — JS API calls, not Claude
    allPosts = await api('/posts');
    allCampaigns = await api('/campaigns');
    renderCampaigns();
    renderPosts();

  } catch (err) {
    toast('Pipeline error: ' + err.message, 'error');
  }
}

/**
 * Run BHT compliance check on current post editor content.
 * Pure JS display of server-side regex results.
 * Called on every significant keystroke (debounced).
 */
let _bhtDebounce = null;
function liveBhtCheck(text) {
  clearTimeout(_bhtDebounce);
  _bhtDebounce = setTimeout(async () => {
    try {
      const el = document.getElementById('bht-inline-result');
      if (!el) return;
      if (!text || text.trim().length < 20) { el.innerHTML = ''; return; }

      const result = await api('/bht-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      // JS renders the result — not Claude
      if (!result.pass) {
        el.innerHTML = result.violations.map(v => `
          <div style="display:flex;gap:8px;align-items:flex-start;padding:6px 10px;background:var(--red-bg);border-radius:6px;margin-top:4px">
            <span style="color:var(--red);font-size:13px;flex-shrink:0">✗</span>
            <div>
              <div style="font-size:11px;font-weight:700;color:var(--red)">${esc(v.id)}</div>
              <div style="font-size:11px;color:var(--body-txt)">${esc(v.description)}</div>
              ${v.hint ? `<div style="font-size:11px;color:var(--gray-txt);margin-top:2px">${esc(v.hint)}</div>` : ''}
            </div>
          </div>`).join('');
      } else if (result.warnings.length > 0) {
        el.innerHTML = result.warnings.map(w => `
          <div style="display:flex;gap:8px;align-items:flex-start;padding:6px 10px;background:var(--gold-bg);border-radius:6px;margin-top:4px">
            <span style="color:var(--gold);font-size:13px;flex-shrink:0">⚠</span>
            <div style="font-size:11px;color:var(--body-txt)">${esc(w.description)}</div>
          </div>`).join('');
      } else {
        el.innerHTML = '<div style="font-size:11px;color:var(--green);padding:4px 0">✓ BHT compliant</div>';
      }
    } catch (e) { /* silent fail on live check */ }
  }, 600); // 600ms debounce — JS setTimeout, not Claude
}

// ══════════════════════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════════════════════
async function init() {
  // Load campaigns into memory
  try { allCampaigns = await api('/campaigns'); } catch(e) {}
  try { allPosts = await api('/posts'); } catch(e) {}
  loadDashboard();

  // Check LinkedIn status quietly
  try {
    const config = await api('/linkedin-config');
    if (config.connected) {
      document.getElementById('li-dot').classList.add('connected');
      document.getElementById('li-status-text').textContent = 'Connected';
      document.getElementById('li-status-sub').textContent = config.person_urn || '';
      linkedInConnected = true;
    }
  } catch(e) {}
}

init();
</script>
</body>
</html>
