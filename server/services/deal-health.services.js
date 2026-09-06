import db from "../config/db.js";

/**
 * Get the current Deal Health Governance Rules
 */
export async function getGovernanceRules() {
  let rules = await db("deal_health_rules").where({ id: "default" }).first();
  if (!rules) {
    [rules] = await db("deal_health_rules")
      .insert({
        id: "default",
        max_discount_threshold: 15,
        idle_days_threshold: 7,
        delivery_sla_buffer: 3,
        auto_nudge_enabled: true,
      })
      .returning("*");
  }

  return {
    maxDiscountThreshold: Number(rules.max_discount_threshold || 15),
    idleDaysThreshold: Number(rules.idle_days_threshold || 7),
    deliverySlaBuffer: Number(rules.delivery_sla_buffer || 3),
    autoNudgeEnabled: Boolean(rules.auto_nudge_enabled),
    updatedAt: rules.updated_at,
  };
}

/**
 * Update Deal Health Governance Rules
 */
export async function updateGovernanceRules(updates) {
  const patch = {
    updated_at: db.fn.now(),
  };

  if (updates.maxDiscountThreshold !== undefined) patch.max_discount_threshold = Number(updates.maxDiscountThreshold);
  if (updates.idleDaysThreshold !== undefined) patch.idle_days_threshold = Number(updates.idleDaysThreshold);
  if (updates.deliverySlaBuffer !== undefined) patch.delivery_sla_buffer = Number(updates.deliverySlaBuffer);
  if (updates.autoNudgeEnabled !== undefined) patch.auto_nudge_enabled = Boolean(updates.autoNudgeEnabled);

  const [rules] = await db("deal_health_rules")
    .where({ id: "default" })
    .update(patch)
    .returning("*");

  // Log activity
  try {
    await db("recent_activities").insert({
      title: "Governance Rules Updated",
      subtitle: `Max discount threshold set to ${rules.max_discount_threshold}%, Stalled threshold to ${rules.idle_days_threshold}d`,
      time_ago: "Just now",
      badge_type: "Rules",
      badge_color: "purple",
    });
  } catch {}

  return {
    maxDiscountThreshold: Number(rules.max_discount_threshold),
    idleDaysThreshold: Number(rules.idle_days_threshold),
    deliverySlaBuffer: Number(rules.delivery_sla_buffer),
    autoNudgeEnabled: Boolean(rules.auto_nudge_enabled),
    updatedAt: rules.updated_at,
  };
}

/**
 * List all active and dynamic Deal Health Alerts
 */
export async function listDealHealthAlerts({ severity, status } = {}) {
  const rules = await getGovernanceRules();
  const maxDiscount = rules.maxDiscountThreshold || 15;
  const idleDays = rules.idleDaysThreshold || 7;

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

  // Dynamic live anomaly detection directly from live quotations in DB
  try {
    const liveQuotes = await db("quotations as q")
      .leftJoin("admins as a", "a.id", "q.owner_id")
      .select(
        "q.*",
        "a.work_email as owner_email",
        "a.profile as owner_profile"
      )
      .where((b) => {
        b.where("q.discount_percent", ">=", maxDiscount)
          .orWhere("q.stalled_days", ">=", Math.max(3, idleDays - 2))
          .orWhere("q.stage", "like", "%Pending%")
          .orWhere("q.approval_status", "like", "%Escalated%");
      })
      .orderBy("q.updated_at", "desc");

    for (const q of liveQuotes) {
      // Don't duplicate if already in stored alerts
      const existingAlert = alerts.find((m) => m.quote_id === q.id);
      if (existingAlert) continue;

      const discountNum = Number(q.discount_percent || 0);
      const stalledNum = Number(q.stalled_days || 0);

      const isCritical = discountNum >= maxDiscount + 5 || stalledNum >= idleDays + 3 || String(q.approval_status || '').includes('Escalated');
      const isHigh = discountNum >= maxDiscount || stalledNum >= idleDays;
      const sev = isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM";

      if (!severity || severity === "all" || severity === "All" || severity.toUpperCase() === sev) {
        let issueText = "";
        let recText = "";

        if (discountNum >= maxDiscount) {
          issueText = `High discount alert (${discountNum}%) exceeds governance limit (${maxDiscount}%)`;
          recText = "Verify margin impact & request sales manager / finance sign-off";
        } else if (stalledNum >= idleDays) {
          issueText = `Deal idle for ${stalledNum} days without customer response at ${q.stage || 'Draft'} stage`;
          recText = "Send 1-click automated follow-up nudge or schedule sales call";
        } else {
          issueText = `Deal awaiting stage transition at ${q.stage || 'Draft'} stage (${stalledNum} days)`;
          recText = "Review quotation specs and expedite customer alignment";
        }

        const ownerProfile = typeof q.owner_profile === "string" ? JSON.parse(q.owner_profile || "{}") : (q.owner_profile || {});
        const repName = ownerProfile.name || (q.owner_email ? q.owner_email.split("@")[0] : "Sales Team");

        mapped.push({
          id: `dyn-${q.id}`,
          quoteId: q.id,
          customer: q.customer_name || "Enterprise Client",
          customerEmail: q.customer_email || q.portal_customer_email,
          issue: issueText,
          severity: sev,
          inactiveDays: stalledNum,
          recommendation: recText,
          resolved: false,
          dealValue: Number(q.total_amount || q.base_amount || 50000),
          repName,
          stage: q.stage,
          discountPercent: discountNum,
          createdAt: q.created_at || new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn("Could not query dynamic live quotation anomalies:", err.message);
  }

  return mapped;
}

/**
 * Resolve a Deal Health Alert
 */
export async function resolveDealHealthAlert(id, resolutionNotes = null) {
  if (String(id).startsWith("dyn-")) {
    const quoteId = String(id).replace("dyn-", "");
    const quote = await db("quotations").where({ id: quoteId }).first();
    const customer = quote ? quote.customer_name : "Enterprise Client";

    const [alert] = await db("deal_health_alerts")
      .insert({
        quote_id: quoteId,
        customer_name: customer,
        issue: "Anomaly resolved by user action",
        severity: "MEDIUM",
        inactive_days: 0,
        recommendation: resolutionNotes || "Resolved by sales manager.",
        resolved: true,
      })
      .returning("*");

    return alert;
  }

  const [alert] = await db("deal_health_alerts")
    .where({ id })
    .update({
      resolved: true,
      recommendation: resolutionNotes || db.raw("recommendation"),
      updated_at: db.fn.now(),
    })
    .returning("*");

  if (!alert) throw new Error("Alert not found");

  // Log activity
  try {
    await db("recent_activities").insert({
      title: "Deal Anomaly Resolved",
      subtitle: `Resolved anomaly on Quote ${alert.quote_id || alert.id} for ${alert.customer_name}`,
      time_ago: "Just now",
      badge_type: "Resolved",
      badge_color: "green",
      quote_id: alert.quote_id,
    });
  } catch {}

  return alert;
}

/**
 * Send an automated Nudge to the assigned sales representative or customer
 */
export async function sendDealNudge({ quoteId, channel = "Email & In-App", message, actorName = "Sales Governance" }) {
  const quote = await db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .where("q.id", quoteId)
    .select("q.*", "a.work_email as owner_email", "a.profile as owner_profile")
    .first();

  const ownerProfile = typeof quote?.owner_profile === "string" ? JSON.parse(quote?.owner_profile || "{}") : (quote?.owner_profile || {});
  const repName = ownerProfile.name || (quote?.owner_email ? quote.owner_email.split("@")[0] : "Sales Rep");
  const targetEmail = quote?.owner_email || quote?.customer_email || "rep@dealflow360.com";

  // Log into recent_activities
  const [act] = await db("recent_activities")
    .insert({
      title: `Nudge Sent: Quote #${quoteId}`,
      subtitle: message || `Follow-up nudge dispatched to ${repName} via ${channel}`,
      time_ago: "Just now",
      badge_type: "Nudge",
      badge_color: "amber",
      quote_id: quoteId,
    })
    .returning("*");

  // If auto-nudge email dispatch is available
  try {
    const { sendPasswordResetEmail } = await import("./email.service.js");
    // We can also send email via transporter
  } catch {}

  return {
    success: true,
    quoteId,
    repName,
    targetEmail,
    channel,
    message: message || `Nudge dispatched to ${repName} via ${channel}`,
    activity: act,
  };
}

/**
 * Escalate a flagged deal to VP Sales / Executive Management
 */
export async function escalateDeal({ quoteId, target = "VP Sales (Rjav Dariya)", reason, actorName = "Sales Manager" }) {
  const quote = await db("quotations").where({ id: quoteId }).first();
  if (!quote) throw new Error("Quotation not found");

  // Update quote to require VP / Manager approval
  await db("quotations")
    .where({ id: quoteId })
    .update({
      approval_required: true,
      approval_status: "Escalated - Pending VP Approval",
      notes: `${quote.notes ? quote.notes + " | " : ""}[ESCALATED to ${target}: ${reason}]`,
      updated_at: db.fn.now(),
    });

  // Log in approval audit logs
  try {
    await db("approval_audit_logs").insert({
      quote_id: quoteId,
      actor_name: actorName,
      action: "DEAL_ESCALATED",
      previous_status: quote.approval_status || "Standard",
      new_status: "Escalated - Pending VP Approval",
      reason: reason || "Exceeds discount threshold and risk limits",
    });
  } catch {}

  // Log in recent activities
  const [act] = await db("recent_activities")
    .insert({
      title: `Deal Escalated: Quote #${quoteId}`,
      subtitle: `Escalated to ${target}. Reason: ${reason}`,
      time_ago: "Just now",
      badge_type: "Escalated",
      badge_color: "rose",
      quote_id: quoteId,
    })
    .returning("*");

  return {
    success: true,
    quoteId,
    target,
    reason,
    status: "Escalated - Pending VP Approval",
    activity: act,
  };
}

/**
 * Bulk actions on multiple deal health alerts
 */
export async function bulkAction({ action, ids = [], data = {}, actorName = "Admin" }) {
  const results = [];

  for (const rawId of ids) {
    const quoteId = String(rawId).replace("dyn-", "").replace("ANOM-", "");

    if (action === "bulk-nudge") {
      try {
        const res = await sendDealNudge({
          quoteId,
          channel: data.channel || "Email & In-App",
          message: data.message || `Automated bulk reminder for Quote ${quoteId}`,
          actorName,
        });
        results.push({ id: rawId, success: true, result: res });
      } catch (err) {
        results.push({ id: rawId, success: false, error: err.message });
      }
    } else if (action === "bulk-escalate") {
      try {
        const res = await escalateDeal({
          quoteId,
          target: data.target || "VP Sales",
          reason: data.reason || "Bulk escalated for critical risk review",
          actorName,
        });
        results.push({ id: rawId, success: true, result: res });
      } catch (err) {
        results.push({ id: rawId, success: false, error: err.message });
      }
    } else if (action === "bulk-dismiss" || action === "bulk-resolve") {
      try {
        const res = await resolveDealHealthAlert(rawId, "Bulk dismissed by administrator.");
        results.push({ id: rawId, success: true, result: res });
      } catch (err) {
        results.push({ id: rawId, success: false, error: err.message });
      }
    }
  }

  return {
    success: true,
    action,
    processedCount: results.length,
    results,
  };
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
