import {
  getCustomerPortalQuotation,
  addPortalLineComment,
  getPortalLineComments,
  submitCounterDiscountProposal,
  confirmQuotationTerms
} from "../services/portal.services.js";

// 1. Online Quotation Viewing
export async function getPortalQuotation(req, res) {
  try {
    const { id } = req.params;
    const data = await getCustomerPortalQuotation(id);
    return res.json({ success: true, quotation: data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

// 2. Line Comments & Counter Proposals
export async function createLineComment(req, res) {
  try {
    const { id } = req.params;
    const { lineItemId, commentText, senderRole } = req.body || {};

    const result = await addPortalLineComment(id, lineItemId, senderRole || "Customer", commentText);
    return res.status(201).json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getLineComments(req, res) {
  try {
    const { id } = req.params;
    const comments = await getPortalLineComments(id);
    return res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function submitCounterProposal(req, res) {
  try {
    const { id } = req.params;
    const { proposedDiscountPercent, comment } = req.body || {};

    if (proposedDiscountPercent == null) {
      return res.status(400).json({ success: false, message: "proposedDiscountPercent is required" });
    }

    const result = await submitCounterDiscountProposal(id, proposedDiscountPercent, comment);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// 3. One-Click Terms Confirmation
export async function confirmTerms(req, res) {
  try {
    const { id } = req.params;
    const result = await confirmQuotationTerms(id);
    return res.json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
