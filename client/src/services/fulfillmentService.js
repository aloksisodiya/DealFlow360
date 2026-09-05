import { api } from './apiClient';

export async function fetchWarehouses() {
  const res = await api.get('/finance/warehouses');
  return res.data || [];
}

export async function fetchInventory() {
  const res = await api.get('/finance/inventory');
  return res.data || [];
}

export async function allocateStock(data) {
  const res = await api.post('/finance/inventory/allocate', data);
  return res.data;
}

export async function transferStock(data) {
  const res = await api.post('/finance/inventory/transfer', data);
  return res.data;
}

export async function fetchFulfillmentOrders() {
  const res = await api.get('/finance/fulfillment/orders');
  return res.data || [];
}

export async function overrideFulfillmentSplit(quoteId, splitAllocations) {
  const res = await api.post('/finance/fulfillment/split-override', { quoteId, splitAllocations });
  return res.data;
}

export async function consolidateBackorder(quoteId, warehouseId) {
  const res = await api.post('/finance/fulfillment/consolidate-backorder', { quoteId, warehouseId });
  return res.data;
}

