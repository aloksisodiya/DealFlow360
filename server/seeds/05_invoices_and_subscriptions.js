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
    // 3 Months Warranty Subscribers
    {
      id: "wrn-3m-1001",
      subscription_code: "WRN-3M-001",
      customer_name: "Acme Corp",
      tier: "3 Months",
      plan_name: "3-Month Hardware Extended Warranty",
      amount: 2999.00,
      mrr: 999.67,
      billing_cycle: "3 Months",
      status: "Active",
      start_date: new Date(Date.now() - 30 * 86400000),
      next_billing_date: new Date(Date.now() + 60 * 86400000).toISOString().split("T")[0],
      seats: 2,
      features: JSON.stringify({
        productName: 'MacBook Pro 16" M3 Max (36GB / 1TB)',
        productSku: "SKU-LAP-MBP16",
        warrantyDuration: "3 Months",
        coverageScope: "Express Part Replacement (48-hr SLA) · Diagnostic Support · Zero Labor Charges",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["MBP16-IN-98211", "MBP16-IN-98212"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-05", action: "Warranty Initialized (3 Months)", user: "Sales Executive" },
        { date: "2026-08-20", action: "Mid-Term Diagnostic Passed (0 faults)", user: "Quality Engineer" }
      ]),
    },
    {
      id: "wrn-3m-1002",
      subscription_code: "WRN-3M-002",
      customer_name: "Infosys Technologies",
      tier: "3 Months",
      plan_name: "3-Month Hardware Extended Warranty",
      amount: 5998.00,
      mrr: 1999.33,
      billing_cycle: "3 Months",
      status: "Expiring Soon",
      start_date: new Date(Date.now() - 75 * 86400000),
      next_billing_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      seats: 4,
      features: JSON.stringify({
        productName: 'Dell XPS 16 OLED Touch (Intel i9 / 32GB / 1TB)',
        productSku: "SKU-LAP-XPS16",
        warrantyDuration: "3 Months",
        coverageScope: "Express Screen & Motherboard Replacement · Free Return Shipping",
        warehouseHub: "Bengaluru South Logistics Hub",
        serialNumbers: ["XPS16-BLR-011", "XPS16-BLR-012", "XPS16-BLR-013", "XPS16-BLR-014"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-06-20", action: "3-Month Warranty Pack Activated", user: "Sales Rep" },
        { date: "2026-08-30", action: "Expiry Notice Dispatched (15 days remaining)", user: "System Automations" }
      ]),
    },
    {
      id: "wrn-3m-1003",
      subscription_code: "WRN-3M-003",
      customer_name: "Tata Consultancy Services",
      tier: "3 Months",
      plan_name: "3-Month Hardware Extended Warranty",
      amount: 2999.00,
      mrr: 999.67,
      billing_cycle: "3 Months",
      status: "Active",
      start_date: new Date(Date.now() - 15 * 86400000),
      next_billing_date: new Date(Date.now() + 75 * 86400000).toISOString().split("T")[0],
      seats: 1,
      features: JSON.stringify({
        productName: "Smart Optical Transceiver 100G",
        productSku: "SKU-NET-OPT100",
        warrantyDuration: "3 Months",
        coverageScope: "100% Optical Laser Replacement Guarantee · Free Firmware Updates",
        warehouseHub: "Delhi NCR Depot",
        serialNumbers: ["OPT100-DEL-5541"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-22", action: "3-Month Optical Warranty Enrolled", user: "Arjav Dariya" }
      ]),
    },

    // 6 Months Warranty Subscribers
    {
      id: "wrn-6m-2001",
      subscription_code: "WRN-6M-101",
      customer_name: "Reliance Digital Systems",
      tier: "6 Months",
      plan_name: "6-Month Extended Care Warranty",
      amount: 10998.00,
      mrr: 1833.00,
      billing_cycle: "6 Months",
      status: "Active",
      start_date: new Date(Date.now() - 45 * 86400000),
      next_billing_date: new Date(Date.now() + 135 * 86400000).toISOString().split("T")[0],
      seats: 2,
      features: JSON.stringify({
        productName: "Enterprise Server Rack X1",
        productSku: "SKU-SRV-X100",
        warrantyDuration: "6 Months",
        coverageScope: "24-hr Dedicated Technician Dispatch · Zero Deductible Parts · Bi-monthly Health Checks",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["SRV-MUM-8801", "SRV-MUM-8802"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-07-20", action: "6-Month Extended Care Registered", user: "Sales Manager" },
        { date: "2026-08-15", action: "Routine Power Diagnostics Completed", user: "Tech Support" }
      ]),
    },
    {
      id: "wrn-6m-2002",
      subscription_code: "WRN-6M-102",
      customer_name: "Wipro Cloud Infrastructure",
      tier: "6 Months",
      plan_name: "6-Month Extended Care Warranty",
      amount: 5499.00,
      mrr: 916.50,
      billing_cycle: "6 Months",
      status: "Active",
      start_date: new Date(Date.now() - 60 * 86400000),
      next_billing_date: new Date(Date.now() + 120 * 86400000).toISOString().split("T")[0],
      seats: 1,
      features: JSON.stringify({
        productName: "Cloud Telemetry Hub v4",
        productSku: "SKU-SFT-TEL4",
        warrantyDuration: "6 Months",
        coverageScope: "Telemetry Hardware & Antenna Replacement · Free Cloud Gateway Upgrades",
        warehouseHub: "Bengaluru South Logistics Hub",
        serialNumbers: ["TEL4-BLR-901"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-07-05", action: "Telemetry Warranty Activated", user: "Rjav Dariya" }
      ]),
    },
    {
      id: "wrn-6m-2003",
      subscription_code: "WRN-6M-103",
      customer_name: "HCL Technologies",
      tier: "6 Months",
      plan_name: "6-Month Extended Care Warranty",
      amount: 16497.00,
      mrr: 2749.50,
      billing_cycle: "6 Months",
      status: "Paused",
      start_date: new Date(Date.now() - 90 * 86400000),
      next_billing_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      seats: 3,
      features: JSON.stringify({
        productName: "Lenovo ThinkPad X1 Carbon Gen 12",
        productSku: "SKU-LAP-TPX1",
        warrantyDuration: "6 Months",
        coverageScope: "Full Keyboard, Battery & Motherboard Protection · Onsite Courier Pickup",
        warehouseHub: "Delhi NCR Depot",
        serialNumbers: ["TPX1-DEL-331", "TPX1-DEL-332", "TPX1-DEL-333"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-06-05", action: "Warranty Contract Provisioned", user: "Sales Rep" },
        { date: "2026-08-25", action: "Temporary Coverage Paused per Client Request", user: "Admin" }
      ]),
    },

    // 12 Months Warranty Subscribers
    {
      id: "wrn-12m-3001",
      subscription_code: "WRN-12M-201",
      customer_name: "Mahindra Logistics Tech",
      tier: "12 Months",
      plan_name: "12-Month Comprehensive Full Care Warranty",
      amount: 49995.00,
      mrr: 4166.25,
      billing_cycle: "12 Months",
      status: "Active",
      start_date: new Date(Date.now() - 30 * 86400000),
      next_billing_date: new Date(Date.now() + 335 * 86400000).toISOString().split("T")[0],
      seats: 5,
      features: JSON.stringify({
        productName: "Enterprise Server Rack X1",
        productSku: "SKU-SRV-X100",
        warrantyDuration: "12 Months",
        coverageScope: "Bumper-to-Bumper Full Guarantee · Same-Day Onsite Replacement SLA · Free Annual Overhaul",
        warehouseHub: "Mumbai Central Hub",
        serialNumbers: ["SRV-MUM-701", "SRV-MUM-702", "SRV-MUM-703", "SRV-MUM-704", "SRV-MUM-705"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-05", action: "Annual Comprehensive Warranty Policy Created", user: "Sales Manager" },
        { date: "2026-08-10", action: "Onsite Serial Audit & Tagging Completed", user: "Field Engineer" }
      ]),
    },
    {
      id: "wrn-12m-3002",
      subscription_code: "WRN-12M-202",
      customer_name: "Zomato Enterprise Operations",
      tier: "12 Months",
      plan_name: "12-Month Comprehensive Full Care Warranty",
      amount: 29997.00,
      mrr: 2499.75,
      billing_cycle: "12 Months",
      status: "Active",
      start_date: new Date(Date.now() - 40 * 86400000),
      next_billing_date: new Date(Date.now() + 325 * 86400000).toISOString().split("T")[0],
      seats: 3,
      features: JSON.stringify({
        productName: 'MacBook Pro 16" M3 Max (36GB / 1TB)',
        productSku: "SKU-LAP-MBP16",
        warrantyDuration: "12 Months",
        coverageScope: "Accidental Damage Protection · Unlimited Logic Board Claims · Level 3 Tech VIP Hotline",
        warehouseHub: "Bengaluru South Logistics Hub",
        serialNumbers: ["MBP16-ZOM-11", "MBP16-ZOM-12", "MBP16-ZOM-13"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-07-25", action: "12-Month Mac VIP Care Enrolled", user: "Arjav Dariya" }
      ]),
    },
    {
      id: "wrn-12m-3003",
      subscription_code: "WRN-12M-203",
      customer_name: "Paytm Payments Infrastructure",
      tier: "12 Months",
      plan_name: "12-Month Comprehensive Full Care Warranty",
      amount: 19998.00,
      mrr: 1666.50,
      billing_cycle: "12 Months",
      status: "Active",
      start_date: new Date(Date.now() - 10 * 86400000),
      next_billing_date: new Date(Date.now() + 355 * 86400000).toISOString().split("T")[0],
      seats: 2,
      features: JSON.stringify({
        productName: "24/7 Mission-Critical SLA Support + Server Rack",
        productSku: "SKU-SVC-SLA24",
        warrantyDuration: "12 Months",
        coverageScope: "24/7 Priority Emergency Dispatch · 100% Component Uptime Guarantee · Free Spares Stocking",
        warehouseHub: "Delhi NCR Depot",
        serialNumbers: ["SLA24-PAY-01", "SLA24-PAY-02"]
      }),
      audit_logs: JSON.stringify([
        { date: "2026-08-27", action: "Mission-Critical 12M Warranty Activated", user: "Sales Rep" }
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
