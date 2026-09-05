import {
  createApprovalRequest,
  decideQuotation,
  listDiscountTiers,
  listPendingApprovals,
  updateDiscountTier,
} from "../services/sales-manager.services.js";

export const getApprovals = async (req, res) =>
  res.json({ success: true, data: await listPendingApprovals() });

export const createApproval = async (req, res) => {
  try {
    const data = await createApprovalRequest(req.body || {});
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const decide = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: await decideQuotation(
        req.auth?.adminId || "mgr-1",
        req.params.id,
        req.body?.decision,
        req.body?.remarks || req.body?.comment
      ),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getTiers = async (req, res) =>
  res.json({ success: true, data: await listDiscountTiers() });

export const updateTier = async (req, res) => {
  try {
    if (
      req.body?.maxDiscountPercent === undefined ||
      req.body?.maxDiscountPercent === null
    ) {
      throw new Error("maxDiscountPercent is required");
    }
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
};
