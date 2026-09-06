import {
  getPendingFinanceApprovals,
  decideFinanceApproval,
  getWarehouseFulfillmentSplit,
  manualFulfillmentOverride,
  consolidateBackorderDecision,
  getReconciledBillingSchedule,
  calculateMidCycleProration,
  createCreditNote,
  listCreditNotes,
  listWarehouses,
  listWarehouseInventory,
  adjustInventoryStock,
  transferStock,
  listFulfillmentOrders
} from "../services/finance.services.js";

// Warehouse & Inventory Endpoints
export async function getWarehouses(req, res) {
  try {
    const data = await listWarehouses();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getInventory(req, res) {
  try {
    const data = await listWarehouseInventory();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function allocateStock(req, res) {
  try {
    const result = await adjustInventoryStock(req.body || {});
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function transferStockAction(req, res) {
  try {
    const result = await transferStock(req.body || {});
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getFulfillmentOrders(req, res) {
  try {
    const data = await listFulfillmentOrders();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function dispatchOrderAction(req, res) {
  try {
    const { quoteId, splitAllocations } = req.body || {};
    if (!quoteId) {
      return res.status(400).json({ success: false, message: "quoteId is required for dispatch" });
    }
    const { dispatchFulfillmentOrder } = await import("../services/finance.services.js");
    const result = await dispatchFulfillmentOrder({ quoteId, splitAllocations });
    return res.json({ success: true, data: result, message: result?.message || `Order ${quoteId} successfully dispatched.` });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// 1. Second-Level Approvals
export async function getApprovals(req, res) {
  try {
    const approvals = await getPendingFinanceApprovals();
    return res.json({ success: true, count: approvals.length, pendingApprovals: approvals });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function decideApproval(req, res) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body || {};
    const reviewerId = req.auth?.adminId || "FinanceUser";

    const result = await decideFinanceApproval(reviewerId, id, action, reason);
    return res.json({ success: true, data: result, message: `Quotation ${id} decision recorded.` });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// 2. Warehouse Fulfillment & Backorders
export async function getFulfillmentSplit(req, res) {
  try {
    const { quoteId } = req.params;
    const result = await getWarehouseFulfillmentSplit(quoteId);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function overrideFulfillmentSplit(req, res) {
  try {
    const { quoteId, splitAllocations } = req.body || {};
    if (!quoteId || !splitAllocations) {
      return res.status(400).json({ success: false, message: "quoteId and splitAllocations are required" });
    }
    const result = await manualFulfillmentOverride(quoteId, splitAllocations);
    return res.json({ success: true, data: result, message: result?.message || "Fulfillment split saved" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function consolidateBackorder(req, res) {
  try {
    const { quoteId, warehouseId } = req.body || {};
    if (!quoteId || !warehouseId) {
      return res.status(400).json({ success: false, message: "quoteId and warehouseId are required" });
    }
    const result = await consolidateBackorderDecision(quoteId, warehouseId);
    return res.json({ success: true, data: result, message: result?.message || "Backorder consolidated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// 3. Billing Reconciliations & Credit Notes
export async function getBillingSchedule(req, res) {
  try {
    const { quoteId } = req.params;
    const schedule = await getReconciledBillingSchedule(quoteId);
    return res.json({ success: true, data: schedule });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function calculateProration(req, res) {
  try {
    const { monthlyRate, oldQty, newQty, daysRemaining } = req.body || {};
    if (monthlyRate == null || oldQty == null || newQty == null || daysRemaining == null) {
      return res.status(400).json({ success: false, message: "monthlyRate, oldQty, newQty, daysRemaining required" });
    }
    const result = await calculateMidCycleProration(monthlyRate, oldQty, newQty, daysRemaining);
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function issueCreditNote(req, res) {
  try {
    const { quoteId, customerName, amount, reason, type } = req.body || {};
    if (!quoteId || !customerName || amount == null || !reason) {
      return res.status(400).json({ success: false, message: "quoteId, customerName, amount, and reason required" });
    }
    const result = await createCreditNote(quoteId, customerName, amount, reason, type);
    return res.status(201).json({ success: true, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getCreditNotes(req, res) {
  try {
    const notes = await listCreditNotes();
    return res.json({ success: true, count: notes.length, creditNotes: notes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
