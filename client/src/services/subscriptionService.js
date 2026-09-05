import { api } from './apiClient';

export async function fetchSubscriptions({ status, search } = {}) {
  const res = await api.get('/subscriptions', { status, search });
  return res.data || [];
}

export async function createSubscription(subscriptionData) {
  const res = await api.post('/subscriptions', subscriptionData);
  return res.data;
}

export async function updateSubscriptionStatus(id, status) {
  const res = await api.patch(`/subscriptions/${id}/status`, { status });
  return res.data;
}
