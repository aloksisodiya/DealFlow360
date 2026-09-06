import { api } from './apiClient';

export async function fetchDealHealthAlerts({ severity, status } = {}) {
  const res = await api.get('/deal-health/alerts', { severity, status });
  return res.data || [];
}

export async function fetchGovernanceRules() {
  const res = await api.get('/deal-health/rules');
  return res.data || { maxDiscountThreshold: 15, idleDaysThreshold: 7, deliverySlaBuffer: 3, autoNudgeEnabled: true };
}

export async function updateGovernanceRules(rules) {
  const res = await api.post('/deal-health/rules', rules);
  return res.data;
}

export async function sendDealNudge({ quoteId, channel, message }) {
  const res = await api.post('/deal-health/nudge', { quoteId, channel, message });
  return res.data;
}

export async function escalateDeal({ quoteId, target, reason }) {
  const res = await api.post('/deal-health/escalate', { quoteId, target, reason });
  return res.data;
}

export async function performBulkAction({ action, ids, data }) {
  const res = await api.post('/deal-health/bulk-action', { action, ids, data });
  return res.data;
}

export async function resolveAlert(id, notes) {
  const res = await api.patch(`/deal-health/alerts/${id}/resolve`, { notes });
  return res.data;
}

export async function createAlert(alertData) {
  const res = await api.post('/deal-health/alerts', alertData);
  return res.data;
}
