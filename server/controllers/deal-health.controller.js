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

export async function resolveAlert(req, res) {
  try {
    const alertId = req.params.id || req.body?.alertId || req.body?.id;
    const alert = await dealHealthService.resolveDealHealthAlert(alertId, req.body?.notes);
    return res.json({ success: true, message: "Alert resolved", data: alert });
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
