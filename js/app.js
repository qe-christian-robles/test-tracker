// ═══════════════════════════════════════════
// app.js — Init, nav, CRUD, modals, utilities
// ═══════════════════════════════════════════

// ─── Preferences ────────────────────────
function applyPrefs() {
  document.body.classList.toggle('light', meta.prefs.theme === 'light');
  document.getElementById('themeToggle').innerHTML = meta.prefs.theme === 'light' ? '🌙 Dark' : '☀ Light';
  document.documentElement.style.setProperty('--font-sans', meta.prefs.font);
  document.documentElement.style.setProperty('--font-scale', meta.prefs.fontScale);
  try {
    document.getElementById('fontSelect').value = meta.prefs.font;
    document.getElementById('fontSizeSelect').value = meta.prefs.fontScale;
  } catch (e) {}
}

function toggleTheme() { meta.prefs.theme = meta.prefs.theme === 'dark' ? 'light' : 'dark'; saveMeta(); applyPrefs(); }
function setFont(v) { meta.prefs.font = v; saveMeta(); applyPrefs(); }
function setFontScale(v) { meta.prefs.fontScale = v; saveMeta(); applyPrefs(); }

// ─── Navigation ─────────────────────────
function renderNav() {
  const ds = document.getElementById('dashSelect');
  ds.innerHTML = Object.entries(dashboards).map(([id, d]) =>
    `<option value="${id}" ${id === meta.currentDashId ? 'selected' : ''}>${esc(d.title)}</option>`
  ).join('');
  document.getElementById('delDashBtn').style.display = Object.keys(dashboards).length > 1 ? '' : 'none';

  const vs = document.getElementById('viewSelect');
  const d = curDash();
  vs.innerHTML = `<option value="cumulative">📊 Cumulative</option>` +
    (d ? d.projectIds.map(pid =>
      `<option value="${pid}" ${d.currentView === pid ? 'selected' : ''}>${esc(projects[pid]?.title || pid)}</option>`
    ).join('') : '');
  document.getElementById('delProjBtn').style.display = curView() !== 'cumulative' ? '' : 'none';
  document.getElementById('dashTitle').value = d?.title || '';
}

function switchDashboard(id) { meta.currentDashId = id; saveMeta(); curDash().currentView = 'cumulative'; saveDash(id); renderNav(); renderMain(); }
function switchView(v) { curDash().currentView = v; saveDash(meta.currentDashId); renderNav(); renderMain(); }

// ─── Dashboard CRUD ─────────────────────
function createDashboard() {
  const t = prompt('Dashboard name:');
  if (!t) return;
  const id = gid();
  dashboards[id] = { title: t, projectIds: [], logEntries: [], risks: [], currentView: 'cumulative' };
  meta.currentDashId = id; saveDash(id); saveMeta(); renderNav(); renderMain();
  showToast('Dashboard created', 'success');
}

function deleteDashboard() {
  if (Object.keys(dashboards).length <= 1) return;
  if (!confirm('Delete "' + curDash().title + '"?')) return;
  curDash().projectIds.forEach(pid => { delete projects[pid]; localStorage.removeItem(PP + pid); });
  delete dashboards[meta.currentDashId]; localStorage.removeItem(DP + meta.currentDashId);
  meta.currentDashId = Object.keys(dashboards)[0]; saveMeta(); renderNav(); renderMain();
  showToast('Deleted', 'success');
}

// ─── Project CRUD ───────────────────────
function createProject() {
  const t = prompt('Project name:');
  if (!t) return;
  const id = gid();
  projects[id] = { title: t, testCases: [], logEntries: [], risks: [], requirements: [], defects: [], goal: '' };
  curDash().projectIds.push(id);
  curDash().currentView = id;
  saveDash(meta.currentDashId); saveProj(id); renderNav(); renderMain();
  showToast('Project created', 'success');
}

function deleteProject() {
  const v = curView();
  if (v === 'cumulative') return;
  if (!confirm('Delete "' + projects[v]?.title + '"?')) return;
  curDash().projectIds = curDash().projectIds.filter(id => id !== v);
  curDash().currentView = 'cumulative';
  delete projects[v]; localStorage.removeItem(PP + v);
  saveDash(meta.currentDashId); renderNav(); renderMain();
  showToast('Deleted', 'success');
}

function resetProj() {
  if (!confirm('Clear all data?')) return;
  const p = curProj();
  p.testCases = []; p.logEntries = []; p.risks = []; p.requirements = []; p.defects = [];
  saveProj(curView()); renderMain(); showToast('Reset', 'success');
}

// ─── Test Case CRUD ─────────────────────
function openAddTcModal() {
  if (curView() === 'cumulative') { showToast('Select a project', 'error'); return; }
  document.querySelectorAll('#addTcModal input').forEach(i => i.value = '');
  document.getElementById('addTcModal').classList.add('open');
}

function confirmAddTc() {
  const p = curProj();
  if (!p) return;
  const id = document.getElementById('atc_id').value.trim();
  if (!id) { showToast('TC ID required', 'error'); return; }
  if (p.testCases.find(t => t.tc_id === id)) { showToast('ID exists', 'error'); return; }
  p.testCases.push({
    tc_id: id, validationArea: document.getElementById('atc_area').value.trim(),
    scenarioName: document.getElementById('atc_scenario').value.trim(),
    expectedResults: document.getElementById('atc_expected').value.trim(),
    typeOfTest: document.getElementById('atc_type').value,
    priority: document.getElementById('atc_priority').value,
    status: 'Todo', blockingReason: '', blockingDetails: '',
    actualResults: '', tcDetails: '', scriptStatus: 'Todo', subItems: []
  });
  saveProj(curView()); closeModal('addTcModal'); renderMain();
  showToast('TC added', 'success');
}

// ─── Defect Modal ───────────────────────
function openDefectModal(tcId) {
  document.getElementById('df_id').value = 'DEF-' + (Date.now() % 10000);
  document.getElementById('df_title').value = '';
  document.getElementById('df_desc').value = '';
  document.getElementById('df_ref').value = '';
  document.getElementById('df_tcid').value = tcId || '';
  document.getElementById('defectModal').classList.add('open');
}

function confirmAddDefect() {
  const p = curProj();
  if (!p) return;
  const id = document.getElementById('df_id').value.trim();
  const title = document.getElementById('df_title').value.trim();
  if (!id || !title) { showToast('ID and title required', 'error'); return; }
  if (!p.defects) p.defects = [];
  p.defects.push({
    id, title, severity: document.getElementById('df_sev').value,
    status: 'New', linkedTC: document.getElementById('df_tcid').value,
    externalRef: document.getElementById('df_ref').value.trim(),
    description: document.getElementById('df_desc').value.trim(),
    date: new Date().toISOString()
  });
  saveProj(curView()); closeModal('defectModal'); renderMain();
  showToast('Defect logged', 'success');
}

// ─── Utilities ──────────────────────────
function stab(t, b) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  b.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function shortLink(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || u.hostname;
  } catch (e) {
    return url.length > 30 ? url.substring(url.lastIndexOf('/') + 1) || url : url;
  }
}

function downloadFile(n, c, t) {
  const b = new Blob([c], { type: t });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = n; a.click();
  URL.revokeObjectURL(u);
}

function showToast(m, t) {
  const c = document.getElementById('toastContainer');
  const e = document.createElement('div');
  e.className = `toast ${t}`;
  e.innerHTML = `${t === 'success' ? '✓' : '✕'} ${m}`;
  c.appendChild(e);
  setTimeout(() => e.remove(), 3500);
}

// ─── Welcome Screen ─────────────────────
function showWelcome() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div style="text-align:center;padding:80px 40px;max-width:700px;margin:0 auto">
      <div style="font-size:48px;margin-bottom:16px">📋</div>
      <h1 style="font-family:var(--font-mono);font-size:28px;margin-bottom:8px">Welcome to your Test Tracker</h1>
      <p style="color:var(--text-secondary);font-size:15px;line-height:1.8;margin-bottom:32px">
        A lightweight test management tool for tracking test cases, defects, risks, requirements, and project progress.
        All data is stored locally in your browser. Use JSON backup/restore to save and share your work.
      </p>
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:40px">
        <button class="btn btn-primary" onclick="createProject()" style="font-size:15px;padding:12px 24px">+ Create Your First Project</button>
        <label class="btn" style="font-size:15px;padding:12px 24px">📂 Restore from Backup<input type="file" accept=".json" onchange="importJSON(event)" style="display:none"></label>
      </div>
      <div style="text-align:left;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px 28px">
        <h3 style="font-family:var(--font-mono);font-size:14px;margin-bottom:16px;color:var(--accent)">Quick Start Guide</h3>
        <div style="display:grid;gap:12px;font-size:13px;color:var(--text-secondary)">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:var(--accent);color:#fff;font-family:var(--font-mono);font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">1</span>
            <span><strong style="color:var(--text-primary)">Create a project</strong> — each project tracks its own test cases, defects, risks, and requirements</span>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:var(--accent);color:#fff;font-family:var(--font-mono);font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">2</span>
            <span><strong style="color:var(--text-primary)">Import or add test cases</strong> — use CSV import for bulk, or add manually one at a time</span>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:var(--accent);color:#fff;font-family:var(--font-mono);font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">3</span>
            <span><strong style="color:var(--text-primary)">Track execution</strong> — update statuses, log defects on failures, manage risks and blockers</span>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:var(--accent);color:#fff;font-family:var(--font-mono);font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">4</span>
            <span><strong style="color:var(--text-primary)">Use the cumulative view</strong> — see aggregated KPIs and charts across all projects in a dashboard</span>
          </div>
          <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="background:var(--accent);color:#fff;font-family:var(--font-mono);font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;flex-shrink:0">5</span>
            <span><strong style="color:var(--text-primary)">Export & share</strong> — use 💾 Backup to save as JSON, 📄 PDF for reports, or 📊 CSV for spreadsheets</span>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Init ───────────────────────────────
(function init() {
  loadAll();
  applyPrefs();
  renderNav();

  // Show welcome screen if no data exists yet
  if (!hasData()) {
    showWelcome();
  } else {
    renderMain();
  }
})();
