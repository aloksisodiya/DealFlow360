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
  const mapped = alerts.map((a) => ({
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

  // Dynamic live anomaly detection directly from quotations
  try {
    const liveQuotes = await db("quotations")
      .where((b) => {
        b.where("discount_percent", ">", 15)
          .orWhere("stalled_days", ">", 5)
          .orWhere("stage", "like", "%Pending%");
      })
      .select("*")
      .limit(10);

    for (const q of liveQuotes) {
      // Check if already in mapped
      if (!mapped.some((m) => m.quoteId === q.id)) {
        const isCritical = Number(q.discount_percent || 0) > 20 || Number(q.stalled_days || 0) > 10;
        const isHigh = Number(q.discount_percent || 0) > 15 || Number(q.stalled_days || 0) > 5;
        const sev = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";

        if (!severity || severity === "all" || severity === "All" || severity.toUpperCase() === sev) {
          mapped.push({
            id: `q-anom-${q.id}`,
            quoteId: q.id,
            customer: q.customer_name || "Enterprise Client",
            issue: Number(q.discount_percent || 0) > 15
              ? `High discount alert (${q.discount_percent}%) on ${q.customer_tier || 'Standard'} Tier deal`
              : `Deal inactive for ${q.stalled_days || 7} days at ${q.stage} stage`,
            severity: sev,
            inactiveDays: Number(q.stalled_days || 6),
            recommendation: Number(q.discount_percent || 0) > 15
              ? "Verify margin impact & request sales manager / finance sign-off"
              : "Send 1-click automated follow-up nudge or schedule sales call",
            resolved: false,
            createdAt: q.created_at || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Could not query dynamic live quotation anomalies:", err.message);
  }

  return mapped;
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
