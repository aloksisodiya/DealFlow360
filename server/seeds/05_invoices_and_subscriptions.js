/**
 * Seed 05: Invoices, Subscriptions & Credit Notes
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // 1. Invoices
  const invoices = [
    {
      id: "inv-1042",
      invoice_number: "INV-2026-0042",
      quotation_id: "Q-9402",
      customer_name: "Acme Corp",
      customer_email: "ap@acme-corp.com",
      amount: 124000.00,
      status: "Paid",
      issue_date: new Date(Date.now() - 14 * 86400000),
      due_date: new Date(Date.now() + 16 * 86400000).toISOString().split("T")[0],
      payment_method: "ACH Wire",
      payment_batch: "BATCH-ACH-0901",
      items: JSON.stringify([
        { name: "Enterprise Server Rack X1 (10 units)", qty: 10, unitPrice: 10400, total: 104000 },
        { name: "Setup & Onboarding Service", qty: 1, unitPrice: 20000, total: 20000 },
      ]),
      notes: "Settled via Wire Transfer. Primary hardware rollout batch #1.",
    },
    {
      id: "inv-1039",
      invoice_number: "INV-2026-0039",
      quotation_id: "Q-8841",
      customer_name: "Beta Industries",
      customer_email: "finance@betaind.com",
      amount: 88500.00,
      status: "Pending",
      issue_date: new Date(Date.now() - 3 * 86400000),
      due_date: new Date(Date.now() + 27 * 86400000).toISOString().split("T")[0],
      payment_method: "Corporate Credit Card",
      payment_batch: "BATCH-CC-0903",
      items: JSON.stringify([
        { name: "Hardware Server Rack Package", qty: 7, unitPrice: 11800, total: 82600 },
        { name: "Dedicated TAM Support SLA", qty: 1, unitPrice: 5900, total: 5900 },
      ]),
      notes: "Payment authorization pending quarterly budget release.",
    },
    {
      id: "inv-1025",
      invoice_number: "INV-2026-0025",
      quotation_id: "Q-7001",
      customer_name: "Zenith Co",
      customer_email: "billing@zenith.com",
      amount: 215000.00,
      status: "Overdue",
      issue_date: new Date(Date.now() - 45 * 86400000),
      due_date: new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0],
      payment_method: "ACH Wire",
      payment_batch: "BATCH-ACH-0815",
      items: JSON.stringify([
        { name: "Enterprise Platform Deployment Full Stack", qty: 1, unitPrice: 215000, total: 215000 }
      ]),
      notes: "Overdue by 15 days. Reminder notice dispatched to finance controller.",
    }
  ];

  for (const inv of invoices) {
    await knex("invoices")
      .insert(inv)
      .onConflict("id")
      .merge();
  }

  // 2. Subscriptions
  const subscriptions = [
    {
      id: "sub-1001",
      subscription_code: "SUB-ACM-094",
      customer_name: "Acme Corp",
      tier: "Enterprise",
      plan_name: "Enterprise Cloud Suite Plus",
      amount: 4000.00,
      mrr: 4000.00,
      billing_cycle: "Monthly",
      status: "Active",
      start_date: new Date(Date.now() - 90 * 86400000),
      next_billing_date: new Date(Date.now() + 20 * 86400000).toISOString().split("T")[0],
      seats: 50,
      features: JSON.stringify(["Unlimited CPQ Quotes", "AI Deal Health", "Dedicated TAM", "Custom SLA"]),
      audit_logs: JSON.stringify([
        { date: "2026-06-01", action: "Subscription Initialized", user: "Sales Manager" },
        { date: "2026-08-01", action: "Seat Count Upgraded (+15 seats)", user: "Arjav Dariya" },
      ]),
    },
    {
      id: "sub-1002",
      subscription_code: "SUB-BET-088",
      customer_name: "Beta Industries",
      tier: "Silver",
      plan_name: "Telemetry Growth Tier",
      amount: 1800.00,
      mrr: 1800.00,
      billing_cycle: "Monthly",
      status: "Active",
      start_date: new Date(Date.now() - 40 * 86400000),
      next_billing_date: new Date(Date.now() + 18 * 86400000).toISOString().split("T")[0],
      seats: 20,
      features: JSON.stringify(["Standard CPQ", "Warehouse Multi-split", "Email Notifications"]),
      audit_logs: JSON.stringify([
        { date: "2026-07-20", action: "Subscription Provisioned", user: "Rjav Dariya" },
      ]),
    }
  ];

  for (const sub of subscriptions) {
    await knex("subscriptions")
      .insert(sub)
      .onConflict("id")
      .merge();
  }

  // 3. Credit Notes
  await knex("credit_notes").del();
  await knex("credit_notes").insert([
    {
      id: "CN-1001",
      quote_id: "Q-9402",
      customer_name: "Acme Corp",
      amount: 450.00,
      reason: "Mid-cycle subscription downgrade proration credit",
      type: "Proration Partial Refund",
      status: "Reconciled",
    }
  ]);

  console.log("✅ Seed 05: Invoices & Subscriptions populated.");
}
