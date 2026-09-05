/**
 * DealFlow360 - Centralized Authenticated API Client
 * 
 * Automatically attaches JWT Bearer token from localStorage session
 * and standardizes error handling across all frontend modules.
 */

const API_BASE_URL = 'http://localhost:3000/api';

export async function request(endpoint, options = {}) {
  const user = JSON.parse(localStorage.getItem('dealflow360_active_user') || '{}');
  const token = user.token || '';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (url, params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return request(query ? `${url}?${query}` : url, { method: 'GET' });
  },
  post: (url, body = {}) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body = {}) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body = {}) => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
