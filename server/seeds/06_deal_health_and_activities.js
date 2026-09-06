/**
 * Seed 06: Deal Health Risk Alerts & Recent Audit Activities
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // 0. Deal Health Rules
  const existingRules = await knex("deal_health_rules").where({ id: "default" }).first();
  if (!existingRules) {
    await knex("deal_health_rules").insert({
      id: "default",
      max_discount_threshold: 15.0,
      idle_days_threshold: 7,
      delivery_sla_buffer: 3,
      auto_nudge_enabled: true,
    });
  }

  // 1. Deal Health Alerts
  await knex("deal_health_alerts").del();
  await knex("deal_health_alerts").insert([
    {
      quote_id: "Q-7001",
      customer_name: "Zenith Co",
      issue: "Inactive for 16 days at Proposal Review stage with high discount request (28%)",
      severity: "CRITICAL",
      inactive_days: 16,
      recommendation: "Needs immediate executive sponsor check-in / margin guardrail override",
      resolved: false,
    },
    {
      quote_id: "Q-8841",
      customer_name: "Beta Industries",
      issue: "Custom SLA waiver requested exceeding standard finance risk threshold",
      severity: "HIGH",
      inactive_days: 4,
      recommendation: "Schedule legal review call or counter-offer with standard SLA",
      resolved: false,
    },
    {
      quote_id: "Q-1024",
      customer_name: "Delta LLC",
      issue: "Quarterly quote expiry approaching in 48 hours without signature",
      severity: "MEDIUM",
      inactive_days: 7,
      recommendation: "Send automated follow-up reminder with pricing hold incentive",
      resolved: false,
    }
  ]);

  // 2. Recent Activities
  await knex("recent_activities").del();
  await knex("recent_activities").insert([
    {
      title: "Acme Corp quotation approved by Finance",
      subtitle: "Quote #Q-9402 for $124,000 ready to send to client",
      time_ago: "22 mins ago",
      badge_type: "Approved",
      badge_color: "success",
      quote_id: "Q-9402",
    },
    {
      title: "Beta Industries requested a discount change",
      subtitle: "Requested special 15% tier volume pricing on Order #8841",
      time_ago: "1 hour ago",
      badge_type: "Pending Review",
      badge_color: "warning",
      quote_id: "Q-8841",
    },
    {
      title: "East Depot stock updated for Order #2291",
      subtitle: "Fulfillment allocated 500 units from warehouse sector B",
      time_ago: "3 hours ago",
      badge_type: "Inventory Sync",
      badge_color: "info",
      quote_id: "Q-2291",
    }
  ]);

  console.log("✅ Seed 06: Deal Health Alerts & Recent Activities populated.");
}
