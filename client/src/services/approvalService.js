import { api } from './apiClient';

export async function fetchPendingApprovals() {
  const res = await api.get('/sales/manager/approvals');
  return res.data || [];
}

export async function createApproval(data) {
  const res = await api.post('/sales/manager/approvals', data);
  return res.data;
}

export async function decideApproval(id, decision, remarks = '') {
  const res = await api.patch(`/sales/manager/approvals/${id}`, { decision, remarks });
  return res.data;
}

export async function fetchDiscountTiers() {
  const res = await api.get('/sales/manager/discount-tiers');
  return res.data || [];
}

export async function updateDiscountTier(id, maxDiscountPercent) {
  const res = await api.patch(`/sales/manager/discount-tiers/${id}`, { maxDiscountPercent });
  return res.data;
}

