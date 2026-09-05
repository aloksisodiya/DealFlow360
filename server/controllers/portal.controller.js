import {
  getQuotationByToken,
  getPortalMessages,
  addPortalMessage,
  addSalesRepReply,
  counterDiscountByToken,
  confirmOrderByToken,
  getUnreadCount,
} from "../services/portal.services.js";

// ── GET quotation by portal token ──────────────────────────────────────
export async function getPortalQuotation(req, res) {
  try {
    const data = await getQuotationByToken(req.params.token);
    return res.json({ success: true, quotation: data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

// ── GET message thread ─────────────────────────────────────────────────
export async function getMessages(req, res) {
  try {
    const messages = await getPortalMessages(req.params.token);
    return res.json({ success: true, messages });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

// ── POST message from customer ─────────────────────────────────────────
export async function postMessage(req, res) {
  try {
    const { message, sender } = req.body || {};
    if (!message) return res.status(400).json({ success: false, message: "message is required" });
    const msg = await addPortalMessage(req.params.token, sender || "Customer", message);
    return res.status(201).json({ success: true, message: msg });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── POST sales rep reply (authenticated via sales rep routes) ──────────
export async function postSalesRepReply(req, res) {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ success: false, message: "message is required" });
    const msg = await addSalesRepReply(req.params.id, message);
    return res.status(201).json({ success: true, message: msg });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── POST counter discount ──────────────────────────────────────────────
export async function counterDiscount(req, res) {
  try {
    const { proposedDiscountPercent, note } = req.body || {};
    if (proposedDiscountPercent == null) {
      return res.status(400).json({ success: false, message: "proposedDiscountPercent is required" });
    }
    const result = await counterDiscountByToken(req.params.token, proposedDiscountPercent, note);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── POST confirm order ─────────────────────────────────────────────────
export async function confirmOrder(req, res) {
  try {
    const result = await confirmOrderByToken(req.params.token);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// ── GET unread message count (for sales rep view) ──────────────────────
export async function getUnreadMessages(req, res) {
  try {
    const count = await getUnreadCount(req.params.id);
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
