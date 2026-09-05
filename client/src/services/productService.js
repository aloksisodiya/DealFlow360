import { api } from './apiClient';

export async function fetchProducts({ category, search, tier } = {}) {
  const res = await api.get('/products', { category, search, tier });
  return res.data || [];
}

export async function createProduct(productData) {
  const res = await api.post('/products', productData);
  return res.data;
}

export async function updateProduct(id, updates) {
  const res = await api.put(`/products/${id}`, updates);
  return res.data;
}

export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}
