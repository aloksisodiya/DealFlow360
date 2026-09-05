import { api } from './apiClient';

export async function fetchPipelineReports() {
  const res = await api.get('/reports/pipeline');
  return res.data || {};
}
