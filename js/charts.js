// ═══════════════════════════════════════════
// charts.js — Chart creation helpers
// ═══════════════════════════════════════════

const CHART_FONT = { family: "'DM Sans',sans-serif", size: 11 };
const GRID_COLOR = 'rgba(255,255,255,.06)';

function createStatusDoughnut(canvasId, testCases) {
  const sC = {};
  STATUSES.forEach(s => sC[s] = 0);
  testCases.forEach(t => { if (sC[t.status] !== undefined) sC[t.status]++; });

  return new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: STATUSES,
      datasets: [{
        data: STATUSES.map(s => sC[s]),
        backgroundColor: STATUSES.map(s => STATUS_COLORS[s]),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: CHART_FONT, padding: 6, boxWidth: 12 } } }
    }
  });
}

function createPriorityBar(canvasId, testCases) {
  const pD = {};
  PRIORITIES.forEach(p => pD[p] = 0);
  testCases.forEach(t => { const p = t.priority || 'Medium'; if (pD[p] !== undefined) pD[p]++; });

  return new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: {
      labels: PRIORITIES,
      datasets: [{
        data: PRIORITIES.map(p => pD[p]),
        backgroundColor: PRIORITIES.map(p => PRIORITY_COLORS[p]),
        borderRadius: 4, barPercentage: 0.6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { ticks: { color: '#94a3b8', font: CHART_FONT }, grid: { display: false } },
        y: { ticks: { color: '#64748b', font: CHART_FONT, stepSize: 1 }, grid: { color: GRID_COLOR } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function createProgressDoughnut(canvasId, executed, total) {
  return new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: ['Executed', 'Remaining'],
      datasets: [{
        data: [executed, total - executed],
        backgroundColor: ['#3b82f6', '#1e3054'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: CHART_FONT, padding: 12 } } }
    }
  });
}

function createBlockingDoughnut(canvasId, blockedTCs) {
  const bC = {};
  BLOCKING_REASONS.forEach(r => bC[r] = 0);
  let unspecified = 0;

  blockedTCs.forEach(t => {
    if (t.blockingReason && bC[t.blockingReason] !== undefined) bC[t.blockingReason]++;
    else unspecified++;
  });

  const labels = [...BLOCKING_REASONS.filter(r => bC[r] > 0)];
  const data = labels.map(r => bC[r]);
  const colors = labels.map(r => BLOCKING_COLORS[r] || '#334155');

  if (unspecified > 0) {
    labels.push('Unspecified');
    data.push(unspecified);
    colors.push('#334155');
  }

  return new Chart(document.getElementById(canvasId), {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['None'],
      datasets: [{
        data: labels.length ? data : [1],
        backgroundColor: labels.length ? colors : ['#1e3054'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '55%',
      plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: CHART_FONT, padding: 6, boxWidth: 12 } } }
    }
  });
}
