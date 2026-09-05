import {
  getDashboardMetricsFromDb,
  getRecentActivitiesFromDb,
  getDealHealthAlertsFromDb,
} from "../services/dashboard.services.js";

export async function getOverview(req, res) {
  try {
    const data = await getDashboardMetricsFromDb();
    return res.status(200).json({
      success: true,
      data,
      pageTitle: "Sales Dashboard / Home",
      subtitle: "Central hub, links out to every module below",
      metrics: {
        pendingApprovals: data.pendingApprovals,
        openQuotations: data.openQuotations,
        atRiskDeals: data.atRiskDeals,
        pipelineSyncStatus: data.pipelineSyncStatus,
        lastUpdated: data.lastUpdated,
      },
      quickActions: [
        { key: "new_quotation", label: "+ New Quotation" },
        { key: "view_approvals", label: "View Approvals" },
      ],
      recentActivities: data.recentActivities,
    });
  } catch (error) {
    console.error("Error in getOverview controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard overview metrics",
      error: error.message,
    });
  }
}

export async function getActivities(req, res) {
  try {
    const activities = await getRecentActivitiesFromDb();
    return res.status(200).json({
      success: true,
      data: activities,
      activities,
    });
  } catch (error) {
    console.error("Error in getActivities controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load recent activities",
    });
  }
}

export async function getDealHealth(req, res) {
  try {
    const alerts = await getDealHealthAlertsFromDb();
    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("Error in getDealHealth controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load deal health alerts",
    });
  }
}
