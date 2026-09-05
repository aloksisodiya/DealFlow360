import db from "../config/db.js";

/**
 * Fallback seed data used if local database connection or tables are not initialized
 */
const DEFAULT_FALLBACK_DATA = {
  pendingApprovals: {
    totalWaiting: 4,
    avgResponseTimeHours: 3.2,
    requireFinanceApprovalCount: 2,
    badgeText: "2 require Finance approval"
  },
  openQuotations: {
    activeDealsCount: 12,
    totalPipelineValue: 482500,
    nearingClosingDateCount: 3,
    badgeText: "3 nearing closing date"
  },
  atRiskDeals: {
    flaggedByDealHealth: 3,
    stalledDaysThreshold: 14,
    stalledCount: 3,
    needsImmediateCheckinCount: 3,
    badgeText: "Stalled > 14 days"
  },
  pipelineSyncStatus: "Real-time pipeline sync",
  lastUpdated: "3 mins ago",
  recentActivities: [
    {
      id: 1,
      title: "Acme Corp quotation approved by Finance",
      subtitle: "Quote #Q-9402 for $124,000 ready to send to client",
      time_ago: "22 mins ago",
      badge_type: "Approved",
      badge_color: "success",
      quote_id: "Q-9402"
    },
    {
      id: 2,
      title: "Beta Industries requested a discount change",
      subtitle: "Requested special 15% tier volume pricing on Order #8841",
      time_ago: "1 hour ago",
      badge_type: "Pending Review",
      badge_color: "warning",
      quote_id: "Q-8841"
    },
    {
      id: 3,
      title: "East Depot stock updated for Order #2291",
      subtitle: "Fulfillment allocated 500 units from warehouse sector B",
      time_ago: "3 hours ago",
      badge_type: "Inventory Sync",
      badge_color: "info",
      quote_id: "Q-2291"
    }
  ]
};

/**
 * Service to fetch Sales Dashboard statistics & metrics from local database or fallback
 */
export async function getDashboardMetricsFromDb() {
  try {
    const quotations = await db("quotations").select("*").orderBy("updated_at", "desc");
    const portalMessages = await db("portal_messages as pm")
      .leftJoin("quotations as q", "q.id", "pm.quote_id")
      .select("pm.*", "q.customer_name", "q.total_amount")
      .orderBy("pm.created_at", "desc")
      .limit(10);
    const alerts = await db("deal_health_alerts").where({ resolved: false });

    if (!quotations || quotations.length === 0) {
      return DEFAULT_FALLBACK_DATA;
    }

    const pendingApprovalsList = quotations.filter((q) => {
      const st = (q.stage || "").toLowerCase();
      return (
        q.stage === "Pending Approval" ||
        st.includes("pending") ||
        st.includes("re-approval") ||
        st.includes("negoti") ||
        q.approval_required ||
        (q.approval_status && q.approval_status.includes("Pending"))
      );
    });

    const requireFinanceCount = quotations.filter(
      (q) => q.approval_status && q.approval_status.includes("Finance")
    ).length;

    const totalPipelineValue = quotations.reduce((sum, q) => sum + Number(q.total_amount || 0), 0);
    const stalledDealsCount = quotations.filter((q) => (q.stalled_days && q.stalled_days >= 14) || q.stage === "At Risk").length;

    // Filter customer-approved and customer-negotiated deals
    const customerApprovedDeals = quotations.filter((q) => {
      const st = (q.stage || "").toLowerCase();
      return st.includes("confirm") || st.includes("approved");
    });

    const customerNegotiatedDeals = quotations.filter((q) => {
      const st = (q.stage || "").toLowerCase();
      return st.includes("negoti") || st.includes("re-approval") || st.includes("counter");
    });

    // Build real-time recent activity stream incorporating customer actions
    const activities = [];

    for (const q of quotations) {
      const st = (q.stage || "").toLowerCase();
      if (st.includes("confirm")) {
        activities.push({
          id: `act-confirm-${q.id}`,
          title: `${q.customer_name} confirmed quotation`,
          subtitle: `Quote #${q.id} for $${Number(q.total_amount || 0).toLocaleString()} approved & confirmed via Customer Portal`,
          time_ago: "Recently",
          badge_type: "Customer Approved",
          badge_color: "success",
          quote_id: q.id
        });
      } else if (st.includes("negoti") || st.includes("re-approval") || st.includes("counter")) {
        activities.push({
          id: `act-neg-${q.id}`,
          title: `${q.customer_name} requested counter negotiation`,
          subtitle: `Quote #${q.id} ($${Number(q.total_amount || 0).toLocaleString()}) — ${q.discount_percent || 0}% discount requested`,
          time_ago: "Recently",
          badge_type: "Customer Negotiating",
          badge_color: "warning",
          quote_id: q.id
        });
      }
    }

    for (const msg of portalMessages) {
      if (msg.sender === "Customer") {
        activities.push({
          id: `act-msg-${msg.id}`,
          title: `Message from ${msg.customer_name || "Customer"}`,
          subtitle: `Quote #${msg.quote_id}: "${msg.message.length > 55 ? msg.message.slice(0, 55) + "..." : msg.message}"`,
          time_ago: "Recently",
          badge_type: "Portal Message",
          badge_color: "info",
          quote_id: msg.quote_id
        });
      }
    }

    // Fallback default activities if no customer events recorded yet
    if (activities.length === 0) {
      activities.push(...DEFAULT_FALLBACK_DATA.recentActivities);
    }

    return {
      pipelineValue: totalPipelineValue,
      pipelineFormatted: `$${totalPipelineValue.toLocaleString()}`,
      customerApprovedCount: customerApprovedDeals.length,
      customerNegotiatedCount: customerNegotiatedDeals.length,
      pendingApprovals: {
        totalWaiting: pendingApprovalsList.length,
        avgResponseTimeHours: 3.2,
        requireFinanceApprovalCount: requireFinanceCount,
        badgeText: `${requireFinanceCount} require Finance approval`
      },
      openQuotations: {
        activeDealsCount: quotations.length,
        totalPipelineValue: totalPipelineValue,
        nearingClosingDateCount: customerNegotiatedDeals.length,
        badgeText: `${customerNegotiatedDeals.length} under customer negotiation`
      },
      atRiskDeals: {
        flaggedByDealHealth: alerts.length,
        stalledDaysThreshold: 14,
        stalledCount: stalledDealsCount,
        needsImmediateCheckinCount: stalledDealsCount,
        badgeText: "Stalled > 14 days"
      },
      pipelineSyncStatus: "Real-time customer portal sync",
      lastUpdated: "Just now",
      recentActivities: activities.slice(0, 10)
    };
  } catch (error) {
    console.warn("Database query failed, returning local default dataset:", error.message);
    return DEFAULT_FALLBACK_DATA;
  }
}

export async function getRecentActivitiesFromDb() {
  const metrics = await getDashboardMetricsFromDb();
  return metrics.recentActivities;
}

/**
 * Service to fetch deal health alerts from local database or fallback
 */
export async function getDealHealthAlertsFromDb() {
  try {
    const alerts = await db("deal_health_alerts").select("*").where({ resolved: false });
    if (alerts && alerts.length > 0) return alerts;
  } catch (error) {
    console.warn("Database query for deal health failed:", error.message);
  }
  return [
    {
      id: 1,
      quote_id: "Q-7001",
      customer_name: "Global Dynamics",
      issue: "Inactive for 16 days at Proposal Review stage",
      severity: "CRITICAL",
      inactive_days: 16,
      recommendation: "Needs immediate check-in / manager nudge",
      resolved: false
    }
  ];
}
