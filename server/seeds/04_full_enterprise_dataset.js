/**
 * DealFlow360 - Comprehensive Enterprise Dataset Seeder
 * Populates products, quotations, invoices, subscriptions, warehouse inventory,
 * and deal health alerts for live, real database operations.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // 1. Seed Products
  const products = [
    {
      id: "prod-1",
      name: "Laptop Pro 14",
      sku: "HW-LP14-M3",
      category: "Hardware",
      avatar: "LP",
      avatar_color: "purple",
      price: 1200.00,
      unit: "Each",
      margin_percent: 32.50,
      stock_status: "In Stock",
      variants: JSON.stringify(["16GB / 512GB", "32GB / 1TB", "64GB / 2TB"]),
      tier_pricing: JSON.stringify({ Bronze: 1200, Silver: 1140, Gold: 1080, Platinum: 1020 }),
      description: "High-performance enterprise workstation laptop with M3 chipset.",
      is_active: true
    },
    {
      id: "prod-2",
      name: "Cloud Storage Tier 1",
      sku: "SV-CS-T1",
      category: "Services",
      avatar: "CS",
      avatar_color: "indigo",
      price: 50.00,
      unit: "User/Mo",
      margin_percent: 78.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["100GB", "500GB", "1TB"]),
      tier_pricing: JSON.stringify({ Bronze: 50, Silver: 47.50, Gold: 45, Platinum: 40 }),
      description: "Encrypted enterprise cloud backup and sync pipeline with 99.99% SLA.",
      is_active: true
    },
    {
      id: "prod-3",
      name: "DealFlow Platform License",
      sku: "SUB-DF360-ENT",
      category: "Subscription",
      avatar: "DF",
      avatar_color: "plum",
      price: 2400.00,
      unit: "Annual",
      margin_percent: 85.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["10-User Seat", "25-User Seat", "Unlimited Enterprise"]),
      tier_pricing: JSON.stringify({ Bronze: 2400, Silver: 2280, Gold: 2160, Platinum: 1999 }),
      description: "Annual DealFlow360 platform subscription with advanced CPQ automation.",
      is_active: true
    },
    {
      id: "prod-4",
      name: "Enterprise Starter Bundle",
      sku: "BD-ENT-ST",
      category: "Bundles",
      avatar: "ES",
      avatar_color: "teal",
      price: 4999.00,
      unit: "Bundle",
      margin_percent: 45.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["Standard Bundle", "Premium SLA Bundle"]),
      tier_pricing: JSON.stringify({ Bronze: 4999, Silver: 4749, Gold: 4499, Platinum: 4199 }),
      description: "Complete turnkey deployment: 3 Laptops + Platform License + 1-Yr Support.",
      is_active: true
    },
    {
      id: "prod-5",
      name: "27-inch 4K Monitor",
      sku: "HW-MON-4K27",
      category: "Hardware",
      avatar: "MO",
      avatar_color: "purple",
      price: 450.00,
      unit: "Each",
      margin_percent: 28.00,
      stock_status: "Low Stock",
      variants: JSON.stringify(["Standard Stand", "Ergonomic Arm Mount"]),
      tier_pricing: JSON.stringify({ Bronze: 450, Silver: 427.50, Gold: 405, Platinum: 382.50 }),
      description: "Ultra-HD IPS display with USB-C power delivery and color calibration.",
      is_active: true
    },
    {
      id: "prod-6",
      name: "24/7 Dedicated Support",
      sku: "SV-SUP-247",
      category: "Services",
      avatar: "DS",
      avatar_color: "amber",
      price: 300.00,
      unit: "Monthly",
      margin_percent: 65.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["Tier-1 Support", "Executive Priority Escalation"]),
      tier_pricing: JSON.stringify({ Bronze: 300, Silver: 285, Gold: 270, Platinum: 250 }),
      description: "Round-the-clock priority incident escalation with 15-minute response SLA.",
      is_active: true
    },
    {
      id: "prod-7",
      name: "Analytics AI Add-on",
      sku: "SUB-AI-ANLY",
      category: "Subscription",
      avatar: "AI",
      avatar_color: "emerald",
      price: 150.00,
      unit: "Monthly",
      margin_percent: 90.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["Basic Analytics", "Predictive Deal Intelligence"]),
      tier_pricing: JSON.stringify({ Bronze: 150, Silver: 142.50, Gold: 135, Platinum: 120 }),
      description: "AI-driven deal probability modeling and discounting risk governance.",
      is_active: true
    }
  ];

  for (const p of products) {
    await knex("products").insert(p).onConflict("id").merge();
  }

  // 2. Seed Invoices
  const invoices = [
    {
      id: "inv-101",
      invoice_number: "INV-2026-0891",
      quotation_id: "Q-9402",
      customer_name: "Acme Corp",
      customer_email: "billing@acmecorp.com",
      amount: 12400.00,
      status: "Paid",
      issue_date: "2026-08-15",
      due_date: "2026-09-15",
      payment_method: "ACH Wire",
      payment_batch: "BATCH-AUG-W3",
      items: JSON.stringify([
        { sku: "HW-LP14-M3", name: "Laptop Pro 14", qty: 8, unitPrice: 1200, total: 9600 },
        { sku: "SUB-DF360-ENT", name: "DealFlow Platform License", qty: 1, unitPrice: 2800, total: 2800 }
      ]),
      notes: "Paid in full via corporate wire transfer."
    },
    {
      id: "inv-102",
      invoice_number: "INV-2026-0892",
      quotation_id: "Q-9415",
      customer_name: "Delta LLC",
      customer_email: "finance@deltallc.io",
      amount: 3200.00,
      status: "Processing",
      issue_date: "2026-08-28",
      due_date: "2026-09-28",
      payment_method: "Credit Card",
      payment_batch: "BATCH-SEP-W1",
      items: JSON.stringify([
        { sku: "SV-CS-T1", name: "Cloud Storage Tier 1", qty: 20, unitPrice: 50, total: 1000 },
        { sku: "SV-SUP-247", name: "Dedicated Support SLA", qty: 1, unitPrice: 2200, total: 2200 }
      ]),
      notes: "Card payment authorized, pending bank settlement."
    },
    {
      id: "inv-103",
      invoice_number: "INV-2026-0893",
      quotation_id: "Q-9388",
      customer_name: "Beta Industries",
      customer_email: "ap@betaindustries.com",
      amount: 28900.00,
      status: "Overdue",
      issue_date: "2026-07-20",
      due_date: "2026-08-20",
      payment_method: "ACH Wire",
      payment_batch: "BATCH-JUL-W4",
      items: JSON.stringify([
        { sku: "BD-ENT-ST", name: "Enterprise Starter Bundle", qty: 5, unitPrice: 4999, total: 24995 },
        { sku: "SUB-AI-ANLY", name: "Analytics AI Add-on", qty: 12, unitPrice: 325.41, total: 3905 }
      ]),
      notes: "First follow-up reminder sent to Accounts Payable."
    },
    {
      id: "inv-104",
      invoice_number: "INV-2026-0894",
      quotation_id: "Q-9420",
      customer_name: "Global Dynamics",
      customer_email: "treasury@globaldynamics.org",
      amount: 45000.00,
      status: "Draft",
      issue_date: "2026-09-02",
      due_date: "2026-10-02",
      payment_method: "ACH Wire",
      payment_batch: null,
      items: JSON.stringify([
        { sku: "HW-LP14-M3", name: "Laptop Pro 14", qty: 30, unitPrice: 1140, total: 34200 },
        { sku: "HW-MON-4K27", name: "27-inch 4K Monitor", qty: 25, unitPrice: 432, total: 10800 }
      ]),
      notes: "Draft invoice generated pending executive quote signoff."
    }
  ];

  for (const inv of invoices) {
    await knex("invoices").insert(inv).onConflict("id").merge();
  }

  // 3. Seed Subscriptions
  const subscriptions = [
    {
      id: "sub-101",
      subscription_code: "SUB-ACM-001",
      customer_name: "Acme Corp",
      tier: "Platinum",
      plan_name: "Enterprise Platform Suite",
      amount: 14500.00,
      mrr: 1208.33,
      billing_cycle: "Annual",
      status: "Active",
      start_date: "2026-01-15",
      next_billing_date: "2027-01-15",
      seats: 50,
      features: JSON.stringify(["Unlimited CPQ Quotes", "24/7 Priority SLA", "Custom Integrations", "Dedicated CSM"]),
      audit_logs: JSON.stringify([
        { date: "2026-01-15", action: "Subscription Initialized", user: "Arjav Dariya" },
        { date: "2026-06-01", action: "Upgraded +15 seats", user: "Alex Morgan" }
      ])
    },
    {
      id: "sub-102",
      subscription_code: "SUB-DLT-002",
      customer_name: "Delta LLC",
      tier: "Gold",
      plan_name: "Growth Tier License",
      amount: 450.00,
      mrr: 450.00,
      billing_cycle: "Monthly",
      status: "Active",
      start_date: "2026-04-01",
      next_billing_date: "2026-10-01",
      seats: 15,
      features: JSON.stringify(["CPQ Automation", "Standard Support", "Audit Logs"]),
      audit_logs: JSON.stringify([
        { date: "2026-04-01", action: "Subscription Initialized", user: "Gautam Patil" }
      ])
    },
    {
      id: "sub-103",
      subscription_code: "SUB-BET-003",
      customer_name: "Beta Industries",
      tier: "Silver",
      plan_name: "Pro Core Edition",
      amount: 850.00,
      mrr: 850.00,
      billing_cycle: "Monthly",
      status: "Trial",
      start_date: "2026-08-20",
      next_billing_date: "2026-09-20",
      seats: 10,
      features: JSON.stringify(["Core Quotations", "Approval Workflow"]),
      audit_logs: JSON.stringify([
        { date: "2026-08-20", action: "14-Day Free Trial Started", user: "Alok Sisodiya" }
      ])
    },
    {
      id: "sub-104",
      subscription_code: "SUB-GLB-004",
      customer_name: "Global Dynamics",
      tier: "Platinum",
      plan_name: "Global Multi-Tenant Hub",
      amount: 36000.00,
      mrr: 3000.00,
      billing_cycle: "Annual",
      status: "Active",
      start_date: "2026-02-10",
      next_billing_date: "2027-02-10",
      seats: 150,
      features: JSON.stringify(["Multi-Currency CPQ", "ERP Two-Way Sync", "Custom Risk Policies"]),
      audit_logs: JSON.stringify([
        { date: "2026-02-10", action: "Enterprise Agreement Signed", user: "Rjav Dariya" }
      ])
    }
  ];

  for (const s of subscriptions) {
    await knex("subscriptions").insert(s).onConflict("id").merge();
  }

  // 4. Seed Deal Health Alerts
  const alerts = [
    {
      quote_id: "Q-9388",
      customer_name: "Beta Industries",
      issue: "Discount Exceeds Threshold (28.5% requested, 20% cap)",
      severity: "HIGH",
      inactive_days: 4,
      recommendation: "Review margin impact with Finance before approval.",
      resolved: false
    },
    {
      quote_id: "Q-9402",
      customer_name: "Acme Corp",
      issue: "Payment Terms Variance (Net 60 requested on >$100k deal)",
      severity: "MEDIUM",
      inactive_days: 2,
      recommendation: "Request 50% upfront payment or bank guarantee.",
      resolved: false
    },
    {
      quote_id: "Q-9415",
      customer_name: "Delta LLC",
      issue: "Margin Compression (Hardware margin 18%, 2% below SLA)",
      severity: "LOW",
      inactive_days: 1,
      recommendation: "Attach higher-margin cloud storage add-on.",
      resolved: false
    }
  ];

  await knex("deal_health_alerts").delete();
  for (const a of alerts) {
    await knex("deal_health_alerts").insert(a);
  }

  // 5. Seed Activities
  const activities = [
    {
      title: "Quotation Q-9402 Approved",
      subtitle: "Rjav Dariya approved 12% discount for Acme Corp",
      time_ago: "10 mins ago",
      badge_type: "Approved",
      badge_color: "success",
      quote_id: "Q-9402"
    },
    {
      title: "Invoice INV-2026-0891 Paid",
      subtitle: "$12,400.00 settled via ACH wire transfer",
      time_ago: "1 hour ago",
      badge_type: "Settled",
      badge_color: "info",
      quote_id: "Q-9402"
    },
    {
      title: "New Quote Q-9420 Created",
      subtitle: "Gautam Patil generated quote for Global Dynamics ($45,000)",
      time_ago: "3 hours ago",
      badge_type: "Pending Review",
      badge_color: "warning",
      quote_id: "Q-9420"
    }
  ];

  await knex("recent_activities").delete();
  for (const act of activities) {
    await knex("recent_activities").insert(act);
  }

  console.log("Successfully seeded full enterprise dataset for DealFlow360 database.");
}
