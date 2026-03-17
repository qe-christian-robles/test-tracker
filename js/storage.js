// ═══════════════════════════════════════════
// storage.js — Persistence & data helpers
// ═══════════════════════════════════════════

function saveMeta() {
  try { localStorage.setItem(MK, JSON.stringify(meta)); } catch (e) {}
}

function saveDash(id) {
  try { localStorage.setItem(DP + id, JSON.stringify(dashboards[id])); } catch (e) {}
}

function saveProj(id) {
  try { localStorage.setItem(PP + id, JSON.stringify(projects[id])); } catch (e) {}
}

function loadAll() {
  try {
    const m = localStorage.getItem(MK);
    if (m) meta = JSON.parse(m);
  } catch (e) {}

  if (!meta.prefs) meta.prefs = { theme: 'dark', font: "'DM Sans',sans-serif", fontScale: '1' };

  dashboards = {};
  projects = {};

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(DP)) {
      try { dashboards[k.slice(DP.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    }
    if (k.startsWith(PP)) {
      try { projects[k.slice(PP.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    }
  }

  // Ensure at least one dashboard exists
  if (!Object.keys(dashboards).length) {
    const id = gid();
    dashboards[id] = { title: 'My Dashboard', projectIds: [], logEntries: [], risks: [], currentView: 'cumulative' };
    meta.currentDashId = id;
    saveDash(id);
    saveMeta();
  }

  if (!meta.currentDashId || !dashboards[meta.currentDashId]) {
    meta.currentDashId = Object.keys(dashboards)[0];
  }
}

// Helpers
function gid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function curDash() {
  return dashboards[meta.currentDashId];
}

function curView() {
  return curDash()?.currentView || 'cumulative';
}

function curProj() {
  return curView() !== 'cumulative' ? projects[curView()] : null;
}

function allTCs() {
  const d = curDash();
  if (!d) return [];
  return d.projectIds.flatMap(pid =>
    (projects[pid]?.testCases || []).map(tc => ({ ...tc, _pid: pid, _pt: projects[pid]?.title || pid }))
  );
}

function isExec(t) {
  return ['Pass', 'Fail', 'Skipped'].includes(t.status) ||
    (['In Progress', 'Done'].includes(t.scriptStatus || 'Todo') &&
     ['Test in Progress', 'Blocked', 'Pass', 'Fail', 'Pending Input'].includes(t.status));
}

function hasData() {
  const d = curDash();
  if (!d || !d.projectIds.length) return false;
  return d.projectIds.some(pid => projects[pid]?.testCases?.length > 0);
}
