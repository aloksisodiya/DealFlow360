import {
  createQuotation,
  decideQuotation,
  listPendingApprovals,
  listDiscountTiers,
  listQuotations,
  requestNegotiation,
  updateDiscountTier,
} from "../services/sales.services.js";

function required(value, message) {
  if (value === undefined || value === null || value === "")
    throw new Error(message);
}

export async function createQuote(req, res) {
  try {
    required(req.body?.customerName, "customerName is required");
    return res
      .status(201)
      .json({
        success: true,
        data: await createQuotation(req.auth.adminId, req.body),
      });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function getQuotes(req, res) {
  return res.json({
    success: true,
    data: await listQuotations(req.auth.adminId, req.auth.role),
  });
}

export async function negotiate(req, res) {
  try {
    required(req.body?.request, "request is required");
    return res.json({
      success: true,
      data: await requestNegotiation(
        req.auth.adminId,
        req.params.id,
        req.body.request,
      ),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function approvals(req, res) {
  return res.json({ success: true, data: await listPendingApprovals() });
}

export async function decide(req, res) {
  try {
    return res.json({
      success: true,
      data: await decideQuotation(
        req.auth.adminId,
        req.params.id,
        req.body?.decision,
      ),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateTier(req, res) {
  try {
    required(req.body?.maxDiscountPercent, "maxDiscountPercent is required");
    return res.json({
      success: true,
      data: await updateDiscountTier(
        req.params.id,
        Number(req.body.maxDiscountPercent),
      ),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function getTiers(req, res) {
  return res.json({ success: true, data: await listDiscountTiers() });
}
