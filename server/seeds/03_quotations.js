/**
 * Seed 03: Discount Policy Tiers & Quotations
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // 1. Discount Tiers
  await knex("discount_tiers").del();
  await knex("discount_tiers").insert([
    { customer_tier: "Bronze", max_discount_percent: 5.0 },
    { customer_tier: "Silver", max_discount_percent: 10.0 },
    { customer_tier: "Gold", max_discount_percent: 15.0 },
    { customer_tier: "Enterprise", max_discount_percent: 25.0 },
  ]);

  // 2. Quotations
  const quotations = [
    {
      id: "Q-9402",
      customer_name: "Acme Corp",
      customer_tier: "Enterprise",
      base_amount: 158974.35,
      discount_percent: 22.0,
      total_amount: 124000.0,
      margin_percent: 38.0,
      stage: "Approved",
      blended_risk_score: 8.4,
      approval_required: true,
      approval_status: "Approved",
      stalled_days: 2,
      closing_date: new Date(Date.now() + 10 * 86400000),
      assigned_to: "M. Shah",
      notes: "Customer committed to a 3-year upfront multi-tier enterprise contract.",
      upsell_items: JSON.stringify([{ item: "100G Optical Cables", qty: 20, price: 180 }]),
      approved_at: new Date(Date.now() - 3600000 * 4),
      approved_by: "Sales Manager",
    },
    {
      id: "Q-8841",
      customer_name: "Beta Industries",
      customer_tier: "Silver",
      base_amount: 104117.65,
      discount_percent: 15.0,
      total_amount: 88500.0,
      margin_percent: 45.0,
      stage: "Pending Approval",
      blended_risk_score: 14.8,
      approval_required: true,
      approval_status: "Pending Finance Review",
      stalled_days: 1,
      closing_date: new Date(Date.now() + 5 * 86400000),
      assigned_to: "R. Iyer",
      notes: "Annual upfront prepayment with custom SLA waiver awaiting finance review.",
      upsell_items: JSON.stringify([{ item: "Smart Power Unit", qty: 2, price: 1200 }]),
    },
    {
      id: "Q-2291",
      customer_name: "Nova Retail",
      customer_tier: "Gold",
      base_amount: 33684.21,
      discount_percent: 5.0,
      total_amount: 32000.0,
      margin_percent: 55.0,
      stage: "Fulfillment",
      blended_risk_score: 4.2,
      approval_required: false,
      approval_status: "Auto-Approved",
      stalled_days: 0,
      closing_date: new Date(Date.now() + 2 * 86400000),
      assigned_to: "- (Rule Engine)",
      notes: "Standard volume discount within automated threshold.",
      upsell_items: JSON.stringify([]),
    },
    {
      id: "Q-7001",
      customer_name: "Zenith Co",
      customer_tier: "Enterprise",
      base_amount: 298611.11,
      discount_percent: 28.0,
      total_amount: 215000.0,
      margin_percent: 32.0,
      stage: "At Risk",
      blended_risk_score: 19.5,
      approval_required: true,
      approval_status: "Returned for Revision",
      stalled_days: 16,
      closing_date: new Date(Date.now() - 2 * 86400000),
      assigned_to: "S. Jenkins",
      notes: "28% discount cuts gross margin below allowable 42% hurdle rate.",
      upsell_items: JSON.stringify([{ item: "Dedicated TAM", qty: 1, price: 4000 }]),
    }
  ];

  for (const quote of quotations) {
    await knex("quotations")
      .insert(quote)
      .onConflict("id")
      .merge();
  }

  console.log("✅ Seed 03: Discount Tiers & Quotations populated.");
}
