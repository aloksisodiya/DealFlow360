import { api } from './apiClient';

export async function fetchInvoices({ status, search } = {}) {
  const res = await api.get('/invoices', { status, search });
  return res.data || [];
}

export async function createInvoice(invoiceData) {
  const res = await api.post('/invoices', invoiceData);
  return res.data;
}

export async function updateInvoiceStatus(id, status, notes = null) {
  const res = await api.patch(`/invoices/${id}/status`, { status, notes });
  return res.data;
}
