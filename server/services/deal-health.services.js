import db from "../config/db.js";

export async function listDealHealthAlerts({ severity, status } = {}) {
  let query = db("deal_health_alerts").orderBy("id", "desc");

  if (severity && severity !== "all" && severity !== "All") {
    query = query.where({ severity: severity.toUpperCase() });
  }

  if (status === "resolved") {
    query = query.where({ resolved: true });
  } else if (status === "active" || !status) {
    query = query.where({ resolved: false });
  }

  const alerts = await query;
  return alerts.map((a) => ({
    id: a.id,
    quoteId: a.quote_id,
    customer: a.customer_name,
    issue: a.issue,
    severity: a.severity,
    inactiveDays: a.inactive_days,
    recommendation: a.recommendation,
    resolved: a.resolved,
    createdAt: a.created_at,
  }));
}

export async function resolveDealHealthAlert(id, resolutionNotes = null) {
  const [alert] = await db("deal_health_alerts")
    .where({ id })
    .update({
      resolved: true,
    })
    .returning("*");

  if (!alert) throw new Error("Alert not found");
  return alert;
}

export async function createDealHealthAlert(data) {
  const [alert] = await db("deal_health_alerts")
    .insert({
      quote_id: data.quoteId || "Q-ALERT",
      customer_name: data.customer || "Enterprise Client",
      issue: data.issue,
      severity: data.severity || "HIGH",
      inactive_days: Number(data.inactiveDays || 0),
      recommendation: data.recommendation || "Review with account executive.",
      resolved: false,
    })
    .returning("*");

  return alert;
}
