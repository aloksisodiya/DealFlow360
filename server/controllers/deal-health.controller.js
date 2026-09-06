import * as dealHealthService from "../services/deal-health.services.js";

export async function getAlerts(req, res) {
  try {
    const { severity, status } = req.query;
    const alerts = await dealHealthService.listDealHealthAlerts({ severity, status });
    return res.json({ success: true, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getRules(req, res) {
  try {
    const rules = await dealHealthService.getGovernanceRules();
    return res.json({ success: true, data: rules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function updateRules(req, res) {
  try {
    const rules = await dealHealthService.updateGovernanceRules(req.body);
    return res.json({ success: true, message: "Governance rules updated", data: rules });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function resolveAlert(req, res) {
  try {
    const alertId = req.params.id || req.body?.alertId || req.body?.id;
    const alert = await dealHealthService.resolveDealHealthAlert(alertId, req.body?.notes);
    return res.json({ success: true, message: "Alert resolved", data: alert });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function sendNudge(req, res) {
  try {
    const { quoteId, channel, message } = req.body;
    if (!quoteId) return res.status(400).json({ success: false, message: "quoteId is required" });

    const result = await dealHealthService.sendDealNudge({
      quoteId,
      channel,
      message,
      actorName: req.auth?.name || req.auth?.workEmail || "Sales Governance",
    });

    return res.json({ success: true, message: "Nudge dispatched successfully", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function escalate(req, res) {
  try {
    const { quoteId, target, reason } = req.body;
    if (!quoteId) return res.status(400).json({ success: false, message: "quoteId is required" });

    const result = await dealHealthService.escalateDeal({
      quoteId,
      target,
      reason,
      actorName: req.auth?.name || req.auth?.workEmail || "Sales Manager",
    });

    return res.json({ success: true, message: "Deal escalated successfully", data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function handleBulkAction(req, res) {
  try {
    const { action, ids, data } = req.body;
    if (!action || !ids || !ids.length) {
      return res.status(400).json({ success: false, message: "action and ids array required" });
    }

    const result = await dealHealthService.bulkAction({
      action,
      ids,
      data,
      actorName: req.auth?.name || req.auth?.workEmail || "Admin",
    });

    return res.json({ success: true, message: `Bulk action '${action}' completed`, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function createAlert(req, res) {
  try {
    const alert = await dealHealthService.createDealHealthAlert(req.body);
    return res.status(201).json({ success: true, message: "Alert created", data: alert });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
