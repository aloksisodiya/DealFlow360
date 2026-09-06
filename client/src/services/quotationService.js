import { api } from './apiClient';

export async function fetchQuotations() {
  const res = await api.get('/sales/rep/quotations');
  return res.data || [];
}

export async function createQuotation(data) {
  const res = await api.post('/sales/rep/quotations', data);
  return res.data;
}

export async function updateQuotation(id, data) {
  const res = await api.put(`/sales/rep/quotations/${id}`, data);
  return res.data;
}

export async function requestNegotiation(id, requestNotes) {
  const res = await api.post(`/sales/rep/quotations/${id}/negotiation`, { request: requestNotes });
  return res.data;
}

export async function sendPortalLink(quoteId, customerEmail) {
  const res = await api.post(`/sales/rep/quotations/${quoteId}/send-portal`, { customerEmail });
  return res;
}

export async function fetchQuoteMessages(quoteId) {
  const res = await api.get(`/sales/rep/quotations/${quoteId}/messages`);
  return res.messages || [];
}

export async function applyQuotationDiscount(quoteId, discountPercent, note) {
  const res = await api.patch(`/sales/rep/quotations/${quoteId}/discount`, { discountPercent, note });
  return res;
}

export async function sendSalesRepReply(quoteId, message) {
  const res = await api.post(`/sales/rep/quotations/${quoteId}/reply`, { message });
  return res;
}
