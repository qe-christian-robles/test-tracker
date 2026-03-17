// ═══════════════════════════════════════════
// constants.js — Enums, color maps, global state
// ═══════════════════════════════════════════

const STATUSES = [
  'Pass', 'Fail', 'Blocked', 'Todo', 'Build in Progress',
  'Ready to Test', 'Test in Progress', 'Pending Input', 'Skipped', 'Deferred'
];

const STATUS_COLORS = {
  'Pass': '#22c55e', 'Fail': '#ef4444', 'Blocked': '#f97316',
  'Todo': '#64748b', 'Build in Progress': '#06b6d4', 'Ready to Test': '#eab308',
  'Test in Progress': '#06b6d4', 'Pending Input': '#ec4899',
  'Skipped': '#8b5cf6', 'Deferred': '#8b5cf6'
};

const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

const PRIORITY_COLORS = {
  'Critical': '#ef4444', 'High': '#f97316', 'Medium': '#eab308', 'Low': '#64748b'
};

const BLOCKING_REASONS = [
  'Bug or Defect', 'Requirement Clarification', 'Development Incomplete',
  'Environment', 'Test Data Issue', 'Access or Permission Issue', 'Third-Party Dependency'
];

const BLOCKING_COLORS = {
  'Bug or Defect': '#ef4444', 'Requirement Clarification': '#eab308',
  'Development Incomplete': '#f97316', 'Environment': '#06b6d4',
  'Test Data Issue': '#8b5cf6', 'Access or Permission Issue': '#ec4899',
  'Third-Party Dependency': '#64748b'
};

const SUB_STATUSES = ['New', 'Open', 'Closed', 'Done'];
const SCRIPT_STATUSES = ['Todo', 'In Progress', 'Done'];
const RISK_STATUSES = ['New', 'Under Assessment', 'Open', 'Mitigated', 'Accepted'];
const RISK_CATS = ['Technical', 'Environment', 'Resource', 'Schedule', 'Dependency', 'Scope', 'Data'];

const RSC = {
  'New': 'risk-new', 'Under Assessment': 'risk-under-assessment',
  'Open': 'risk-open', 'Mitigated': 'risk-mitigated', 'Accepted': 'risk-accepted'
};

const DEFECT_STATUSES = ['New', 'Reported', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Deferred'];

const DSC = {
  'New': 'ds-new', 'Reported': 'ds-reported', 'In Progress': 'ds-in-progress',
  'Fixed': 'ds-fixed', 'Verified': 'ds-verified', 'Closed': 'ds-closed', 'Deferred': 'ds-deferred'
};

// Storage keys
const MK = 'att5_meta';
const DP = 'att5_d_';
const PP = 'att5_p_';

// Global state
let meta = { currentDashId: null, prefs: { theme: 'dark', font: "'DM Sans',sans-serif", fontScale: '1' } };
let dashboards = {};
let projects = {};
let charts = {};
let linkingReqIdx = -1;
