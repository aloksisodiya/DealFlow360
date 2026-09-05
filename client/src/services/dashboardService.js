import { api } from './apiClient';

export async function fetchDashboardMetrics() {
  const res = await api.get('/dashboard/metrics');
  // Backend returns { success, data, metrics, ... } — return the nested data object
  return res.data?.data || res.data || {};
}

export async function fetchRecentActivities() {
  const res = await api.get('/dashboard/activities');
  // Backend returns { success, data, activities } — return the activities array
  return res.data?.activities || res.data?.data || res.data || [];
}

export async function fetchDashboardAlerts() {
  const res = await api.get('/dashboard/deal-health');
  // Backend returns { success, alerts } — return alerts array
  return res.data?.alerts || res.data?.data || res.data || [];
}
