/**
 * Knex Seed: Populates initial dashboard metrics, quotations, activities, and deal health alerts
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing entries
  await knex("deal_health_alerts").del();
  await knex("recent_activities").del();
  await knex("quotations").del();

  // Insert initial quotations matching screenshot metrics ($482,500 total pipeline value)
  await knex("quotations").insert([
    {
      id: "Q-9402",
      customer_name: "Acme Corp",
      customer_tier: "Gold",
      total_amount: 124000.00,
      stage: "Approved",
      blended_risk_score: 4.2,
      approval_required: true,
      approval_status: "Approved",
      stalled_days: 0,
      closing_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: "Q-8841",
      customer_name: "Beta Industries",
      customer_tier: "Silver",
      total_amount: 88500.00,
      stage: "Pending Approval",
      blended_risk_score: 14.8,
      approval_required: true,
      approval_status: "Pending Finance Review",
      stalled_days: 1,
      closing_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "Q-2291",
      customer_name: "East Depot Logistics",
      customer_tier: "Gold",
      total_amount: 225000.00,
      stage: "Fulfillment",
      blended_risk_score: 2.1,
      approval_required: false,
      approval_status: "Approved",
      stalled_days: 0,
      closing_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    },
    {
      id: "Q-7001",
      customer_name: "Global Dynamics",
      customer_tier: "Bronze",
      total_amount: 45000.00,
      stage: "At Risk",
      blended_risk_score: 18.5,
      approval_required: true,
      approval_status: "Stalled Inactive",
      stalled_days: 16,
      closing_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ]);

  // Insert recent activities feed matching screenshot
  await knex("recent_activities").insert([
    {
      title: "Acme Corp quotation approved by Finance",
      subtitle: "Quote #Q-9402 for $124,000 ready to send to client",
      time_ago: "22 mins ago",
      badge_type: "Approved",
      badge_color: "success",
      quote_id: "Q-9402"
    },
    {
      title: "Beta Industries requested a discount change",
      subtitle: "Requested special 15% tier volume pricing on Order #8841",
      time_ago: "1 hour ago",
      badge_type: "Pending Review",
      badge_color: "warning",
      quote_id: "Q-8841"
    },
    {
      title: "East Depot stock updated for Order #2291",
      subtitle: "Fulfillment allocated 500 units from warehouse sector B",
      time_ago: "3 hours ago",
      badge_type: "Inventory Sync",
      badge_color: "info",
      quote_id: "Q-2291"
    }
  ]);

  // Insert deal health alerts
  await knex("deal_health_alerts").insert([
    {
      quote_id: "Q-7001",
      customer_name: "Global Dynamics",
      issue: "Inactive for 16 days at Proposal Review stage",
      severity: "CRITICAL",
      inactive_days: 16,
      recommendation: "Needs immediate check-in / manager nudge",
      resolved: false
    },
    {
      quote_id: "Q-8841",
      customer_name: "Beta Industries",
      issue: "Discount 15% exceeds standard Silver tier threshold",
      severity: "HIGH",
      inactive_days: 1,
      recommendation: "Requires Finance sign-off",
      resolved: false
    }
  ]);
}
