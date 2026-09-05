import { api } from './apiClient';

export async function fetchDealHealthAlerts({ severity, status } = {}) {
  const res = await api.get('/deal-health/alerts', { severity, status });
  return res.data || [];
}

export async function resolveAlert(id, notes) {
  const res = await api.patch(`/deal-health/alerts/${id}/resolve`, { notes });
  return res.data;
}

export async function createAlert(alertData) {
  const res = await api.post('/deal-health/alerts', alertData);
  return res.data;
}
