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

  // 2. Subscriptions: Product Warranty Extension Plans (3 Months, 6 Months, 12 Months)
  await knex("subscriptions").del();
  const subscriptions = [
    // 3 Months Warranty Subscribers (Real Customers from Deals)
    {
      id: "wrn-3m-ujwal",
      subscription_code: "WRN-3M-UJW01",
      customer_name: "ujwal",
      customer_email: "ujwal@gmail.com",
      tier: "3 Months",
      plan_name: "3-Month Hardware Extended Warranty",
      amount: 2999.00,
      mrr: 999.67,
      billing_cycle: "3 Months",
      status: "Active",
      start_date: new Date(Date.now() - 25 * 86400000),
      next_billing_date: new Date(Date.now() + 65 * 86400000).toISOString().split("T")[0],
      seats: 1,
      features: JSON.stringify({
        productName: 'MacBook Pro 16" M3 Max (36GB / 1TB)',
        productSku: "SKU-LAP-MBP16",
        quotationId: "Q-49189166",
        warrantyDuration: "3 Months",
        coverageScope: "Express Part Replacement (48-hr SLA) · Diagnostic Support · Zero Labor Charges",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["MBP16-UJW-9821"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-12", action: "Warranty Initialized from Deal Q-49189166", user: "Sales Rep" },
        { date: "2026-08-28", action: "Quality Diagnostic Check Passed", user: "Field Engineer" }
      ]),
    },

    // 6 Months Warranty Subscribers (Real Customers from Deals)
    {
      id: "wrn-6m-piyush",
      subscription_code: "WRN-6M-PIY01",
      customer_name: "piyush shah",
      customer_email: "piyush@gmail.com",
      tier: "6 Months",
      plan_name: "6-Month Extended Care Warranty",
      amount: 5499.00,
      mrr: 916.50,
      billing_cycle: "6 Months",
      status: "Active",
      start_date: new Date(Date.now() - 45 * 86400000),
      next_billing_date: new Date(Date.now() + 135 * 86400000).toISOString().split("T")[0],
      seats: 1,
      features: JSON.stringify({
        productName: "ASUS ROG Zephyrus G16 Gaming Laptop",
        productSku: "SKU-LAP-ROG16",
        quotationId: "Q-53527875",
        warrantyDuration: "6 Months",
        coverageScope: "24-hour priority dispatch from Mumbai Hub · GPU & Panel Protection · Bi-monthly Health Diagnostics",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["ROG16-PIY-7712"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-07-23", action: "6-Month Extended Care Activated for Q-53527875", user: "Sales Manager" },
        { date: "2026-08-19", action: "Thermal Cooling System Verified", user: "Tech Support" }
      ]),
    },

    // 12 Months Warranty Subscribers (Real Customers from Deals)
    {
      id: "wrn-12m-akash",
      subscription_code: "WRN-12M-AKA01",
      customer_name: "akash patel",
      customer_email: "akash@gmail.com",
      tier: "12 Months",
      plan_name: "12-Month Comprehensive Full Care Warranty",
      amount: 9999.00,
      mrr: 833.25,
      billing_cycle: "12 Months",
      status: "Active",
      start_date: new Date(Date.now() - 30 * 86400000),
      next_billing_date: new Date(Date.now() + 335 * 86400000).toISOString().split("T")[0],
      seats: 1,
      features: JSON.stringify({
        productName: 'MacBook Pro 16" M3 Max (36GB / 1TB)',
        productSku: "SKU-LAP-MBP16",
        quotationId: "Q-50655909",
        warrantyDuration: "12 Months",
        coverageScope: "Bumper-to-Bumper Full Guarantee · Same-Day Onsite Technician SLA · Free Annual Overhaul Kit",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["MBP16-AKA-5011"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-07", action: "Annual Warranty Care Registered for Confirmed Order Q-50655909", user: "Sales Manager" },
        { date: "2026-08-10", action: "Hardware Seal Authenticated", user: "Warehouse Dispatch" }
      ]),
    },
    {
      id: "wrn-12m-piyush-srv",
      subscription_code: "WRN-12M-PIY02",
      customer_name: "piyush shah",
      customer_email: "piyush@gmail.com",
      tier: "12 Months",
      plan_name: "12-Month Comprehensive Full Care Warranty",
      amount: 9999.00,
      mrr: 833.25,
      billing_cycle: "12 Months",
      status: "Active",
      start_date: new Date(Date.now() - 35 * 86400000),
      next_billing_date: new Date(Date.now() + 330 * 86400000).toISOString().split("T")[0],
      seats: 1,
      features: JSON.stringify({
        productName: "Enterprise Server Rack X1",
        productSku: "SKU-SRV-X100",
        quotationId: "Q-49720396",
        warrantyDuration: "12 Months",
        coverageScope: "24/7 Priority Emergency Dispatch · 100% Component Uptime Guarantee · Dedicated TAM",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["SRV-PIY-1002"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-02", action: "Mission-Critical 12M Warranty Activated for Q-49720396", user: "Arjav Dariya" }
      ]),
    },
    {
      id: "wrn-12m-apex",
      subscription_code: "WRN-12M-APX01",
      customer_name: "Apex Tech Labs (John Doe)",
      customer_email: "customer.laptop@test.com",
      tier: "12 Months",
      plan_name: "12-Month Comprehensive Full Care Warranty",
      amount: 39996.00,
      mrr: 3333.00,
      billing_cycle: "12 Months",
      status: "Active",
      start_date: new Date(Date.now() - 40 * 86400000),
      next_billing_date: new Date(Date.now() + 325 * 86400000).toISOString().split("T")[0],
      seats: 4,
      features: JSON.stringify({
        productName: 'MacBook Pro 16" M3 Max (36GB / 1TB)',
        productSku: "SKU-LAP-MBP16",
        quotationId: "QUOTE-LAPTOP-101",
        warrantyDuration: "12 Months",
        coverageScope: "Enterprise Fleet Protection (4 units) · Level-3 VIP Hotline · Advance Hardware Replacement",
        warehouseHub: "Bengaluru South Logistics Hub",
        serialNumbers: ["MBP16-APX-01", "MBP16-APX-02", "MBP16-APX-03", "MBP16-APX-04"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-07-28", action: "Fleet Warranty Contract Enrolled for QUOTE-LAPTOP-101", user: "Sales Executive" }
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
