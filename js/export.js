// ═══════════════════════════════════════════
// export.js — PDF, CSV, JSON backup/restore
// ═══════════════════════════════════════════

// CSV
function handleCSVImport(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (curView() === 'cumulative') { showToast('Select a project first', 'error'); e.target.value = ''; return; }
  const p = curProj();
  Papa.parse(f, {
    header: true, skipEmptyLines: true,
    complete: r => {
      const mapped = r.data.map(row => {
        const k = Object.keys(row).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        const v = Object.values(row);
        const o = {};
        k.forEach((k, i) => o[k] = (v[i] || '').trim());
        return o;
      }).filter(r => r.tc_id);
      if (!mapped.length) { showToast('No valid rows', 'error'); return; }
      const ex = {};
      p.testCases.forEach(t => ex[t.tc_id] = t);
      mapped.forEach(row => {
        if (!ex[row.tc_id]) {
          ex[row.tc_id] = {
            tc_id: row.tc_id, validationArea: row.validation_area || '',
            scenarioName: row.scenario_name || '', expectedResults: row.expected_results || '',
            typeOfTest: row.type_of_test || '',
            priority: (row.priority && PRIORITIES.includes(row.priority)) ? row.priority : 'Medium',
            status: 'Todo', blockingReason: '', blockingDetails: '', actualResults: '',
            tcDetails: '', scriptStatus: 'Todo', subItems: []
          };
        }
      });
      p.testCases = Object.values(ex);
      saveProj(curView());
      renderMain();
      showToast(`Imported ${mapped.length} TCs`, 'success');
    },
    error: () => showToast('Parse failed', 'error')
  });
  e.target.value = '';
}

function downloadTemplate() {
  downloadFile('template.csv',
    'TC_ID,Validation Area,Scenario Name,Expected Results,Type of Test,Priority\n' +
    'TC-001,Happy Path,Valid login,Returns 200,Smoke,Critical',
    'text/csv');
}

function exportProjCSV() {
  const p = curProj();
  if (!p) return;
  const h = ['TC_ID', 'Area', 'Scenario', 'Expected', 'Type', 'Priority', 'Status', 'Script'];
  const rows = p.testCases.map(tc => [
    tc.tc_id, tc.validationArea, tc.scenarioName, tc.expectedResults,
    tc.typeOfTest, tc.priority || 'Medium', tc.status, tc.scriptStatus || 'Todo'
  ]);
  downloadFile(`${p.title}.csv`, Papa.unparse({ fields: h, data: rows }), 'text/csv');
  showToast('Exported', 'success');
}

function exportDashCSV() {
  const d = curDash();
  let csv = '';
  d.projectIds.forEach(pid => {
    const p = projects[pid];
    if (!p) return;
    csv += `\n=== ${p.title} ===\nTC_ID,Area,Scenario,Expected,Type,Priority,Status,Script\n`;
    p.testCases.forEach(tc => {
      csv += `${tc.tc_id},${tc.validationArea},${tc.scenarioName},${tc.expectedResults},${tc.typeOfTest},${tc.priority || 'Medium'},${tc.status},${tc.scriptStatus || 'Todo'}\n`;
    });
  });
  downloadFile(`${d.title}_all.csv`, csv, 'text/csv');
  showToast('Exported', 'success');
}

// JSON Backup/Restore
function openBackupModal() {
  document.getElementById('backupProjBtn').style.display = curView() !== 'cumulative' ? '' : 'none';
  document.getElementById('backupModal').classList.add('open');
}

function exportDashJSON() {
  const d = curDash();
  const payload = { _type: 'dashboard', dashboard: { ...d }, projects: {} };
  d.projectIds.forEach(pid => { payload.projects[pid] = projects[pid]; });
  downloadFile(`${d.title}_dashboard.json`, JSON.stringify(payload, null, 2), 'application/json');
  showToast('Dashboard exported', 'success');
}

function exportProjJSON() {
  const p = curProj();
  if (!p) return;
  downloadFile(`${p.title}_project.json`, JSON.stringify({ _type: 'project', project: { ...p } }, null, 2), 'application/json');
  showToast('Project exported', 'success');
}

function importJSON(e) {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (data._type === 'dashboard' || data.dashboard) {
        const id = gid(), db = { ...data.dashboard, projectIds: [] };
        Object.entries(data.projects || {}).forEach(([, proj]) => {
          const np = gid(); projects[np] = proj; saveProj(np); db.projectIds.push(np);
        });
        db.currentView = 'cumulative';
        dashboards[id] = db; meta.currentDashId = id;
        saveDash(id); saveMeta(); renderNav(); renderMain();
        showToast('Dashboard restored', 'success');
      } else if (data._type === 'project' || data.project) {
        const proj = data.project || data;
        const pid = gid(); projects[pid] = proj; saveProj(pid);
        curDash().projectIds.push(pid); curDash().currentView = pid;
        saveDash(meta.currentDashId); renderNav(); renderMain();
        showToast('Project restored', 'success');
      } else {
        showToast('Unknown format', 'error');
      }
    } catch (err) { showToast('Parse failed', 'error'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

// PDF Export
async function exportPDF() {
  showToast('Generating PDF...', 'success');

  const chartSnaps = {};
  document.querySelectorAll('#mainContent canvas').forEach(c => {
    try { chartSnaps[c.id] = c.toDataURL('image/png'); } catch (e) {}
  });

  let clone = document.getElementById('mainContent').cloneNode(true);
  clone.id = 'pdfClone';
  clone.querySelectorAll('canvas').forEach(c => {
    const src = chartSnaps[c.id];
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.style.cssText = 'width:100%;height:auto;display:block';
      c.parentNode.replaceChild(img, c);
    }
  });
  clone.querySelectorAll('.tab-content').forEach(c => c.style.display = 'block');
  document.body.appendChild(clone);
  await new Promise(r => setTimeout(r, 500));

  try {
    const fullCanvas = await html2canvas(clone, {
      scale: 1.5, useCORS: true, backgroundColor: '#ffffff',
      logging: false, width: 1100, windowWidth: 1100
    });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth() - 16;
    const ph = pdf.internal.pageSize.getHeight() - 16;
    const imgW = pw;
    const imgH = fullCanvas.height * imgW / fullCanvas.width;
    const totalPages = Math.ceil(imgH / ph);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      const srcY = p * (fullCanvas.height / totalPages);
      const srcH = fullCanvas.height / totalPages;
      const tmp = document.createElement('canvas');
      tmp.width = fullCanvas.width;
      tmp.height = srcH;
      tmp.getContext('2d').drawImage(fullCanvas, 0, srcY, fullCanvas.width, srcH, 0, 0, fullCanvas.width, srcH);
      pdf.addImage(tmp.toDataURL('image/jpeg', .92), 'JPEG', 8, 8, imgW, Math.min(imgH / totalPages, ph));
    }

    pdf.save(`${curDash().title}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('PDF exported!', 'success');
  } catch (e) {
    console.error(e);
    showToast('PDF failed', 'error');
  }
  clone.remove();
}
