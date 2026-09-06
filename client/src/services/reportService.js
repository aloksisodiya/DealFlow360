import { api } from './apiClient';

export async function fetchPipelineReports(params = {}) {
  const res = await api.get('/reports/pipeline', params);
  return res.data || {};
}
