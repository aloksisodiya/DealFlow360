/**
 * DealFlow360 — Customer Portal API Service (Public, No Auth Required)
 * All calls use the portal_token (UUID) from the URL
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ||
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:3000/api`;

async function portalRequest(endpoint, options = {}) {
  const url = `${API_BASE}/portal${endpoint}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
  return data;
}

export async function getPortalQuotation(token) {
  const res = await portalRequest(`/q/${token}`);
  return res.quotation;
}

export async function getPortalMessages(token) {
  const res = await portalRequest(`/q/${token}/messages`);
  return res.messages || [];
}

export async function sendPortalMessage(token, message, sender = "Customer") {
  const res = await portalRequest(`/q/${token}/messages`, {
    method: "POST",
    body: JSON.stringify({ message, sender }),
  });
  return res.message;
}

export async function submitCounterDiscount(token, proposedDiscountPercent, note = "") {
  const res = await portalRequest(`/q/${token}/counter`, {
    method: "POST",
    body: JSON.stringify({ proposedDiscountPercent, note }),
  });
  return res.result;
}

export async function confirmPortalOrder(token) {
  const res = await portalRequest(`/q/${token}/confirm`, { method: "POST" });
  return res.result;
}
