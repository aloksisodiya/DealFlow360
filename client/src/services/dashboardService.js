import { api } from './apiClient';

export async function fetchDashboardMetrics() {
  const res = await api.get('/dashboard/stats');
  return res.data || {};
}

export async function fetchRecentActivities() {
  const res = await api.get('/dashboard/activities');
  return res.data || [];
}

export async function fetchDashboardAlerts() {
  const res = await api.get('/dashboard/health-alerts');
  return res.data || [];
}
