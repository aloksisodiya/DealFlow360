import db from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function main() {
  console.log("🌱 Starting Comprehensive Seed Generator (~150-200 Records)...");

  // 1. Seed Core Accounts (Admins, Reps, Managers, Finance, Customers)
  console.log("👥 Seeding Accounts...");
  const accounts = [
    {
      work_email: "arjavdariya2@gmail.com",
      password: "Arjav@123",
      role: "admin",
      profile: { name: "Arjav Dariya", title: "Chief Executive & Platform Admin" },
    },
    {
      work_email: "rjavdariya@gmail.com",
      password: "rjav@123",
      role: "sales_manager",
      profile: { name: "Rjav Dariya", title: "VP of Enterprise Sales" },
    },
    {
      work_email: "gautampa07@gmail.com",
      password: "Gautam@123",
      role: "sales_rep",
      profile: { name: "Gautam Patil", title: "Senior Sales Representative" },
    },
    {
      work_email: "aloksisodiya38@gmail.com",
      password: "Alok@123",
      role: "finance",
      profile: { name: "Alok Sisodiya", title: "Head of Corporate Finance & FP&A" },
    },
    {
      work_email: "aloksisodiya30@gmail.com",
      password: "Alok30@123",
      role: "sales_rep",
      profile: { name: "Alok Sisodiya (Sales)", title: "Enterprise Account Executive" },
    },
    {
      work_email: "piyush@dealflow360.com",
      password: "Piyush@123",
      role: "customer",
      profile: { name: "Piyush Shah", company: "Piyush Tech Ventures", tier: "Gold" },
    },
    {
      work_email: "ujwal@dealflow360.com",
      password: "Ujwal@123",
      role: "customer",
      profile: { name: "Ujwal Sharma", company: "Ujwal Cloud Infotech", tier: "Silver" },
    },
  ];

  const adminIds = {};
  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const [inserted] = await db("admins")
      .insert({
        work_email: acc.work_email,
        password_hash: hash,
        must_change_password: false,
        is_active: true,
        role: acc.role,
        profile: JSON.stringify(acc.profile),
      })
      .onConflict("work_email")
      .merge({
        password_hash: hash,
        role: acc.role,
        profile: JSON.stringify(acc.profile),
      })
      .returning("*");
    if (inserted) adminIds[acc.work_email] = inserted.id;
  }

  // 2. Seed Warehouses
  console.log("🏬 Seeding Warehouses...");
  const warehouses = [
    { id: "wh-main", name: "Mumbai Central Hub", location: "Bhiwandi, Mumbai, MH", shipping_cost_weight: 1.0 },
    { id: "wh-east", name: "Bengaluru Tech Depot", location: "Whitefield, Bengaluru, KA", shipping_cost_weight: 1.15 },
    { id: "wh-west", name: "Delhi NCR Logistics Hub", location: "Gurugram, Delhi NCR, HR", shipping_cost_weight: 1.1 },
    { id: "wh-hyd", name: "Hyderabad HiTech Logistics", location: "HITEC City, Hyderabad, TS", shipping_cost_weight: 1.2 },
    { id: "wh-chn", name: "Chennai Coastal Depot", location: "Guindy, Chennai, TN", shipping_cost_weight: 1.25 }
  ];

  for (const wh of warehouses) {
    await db("warehouses").insert(wh).onConflict("id").merge();
  }

  // 3. Products
  console.log("📦 Checking & Updating Products Catalog...");
  const productDefs = [
    { name: 'MacBook Pro 16" M3 Max (36GB / 1TB)', sku: "SKU-LAP-MBP16", price: 3499, category: "Laptops", desc: "Apple M3 Max 14-core CPU, 30-core GPU, Liquid Retina XDR display." },
    { name: "Dell XPS 16 OLED Touch (Intel i9 / 32GB / 1TB)", sku: "SKU-LAP-XPS16", price: 2899, category: "Laptops", desc: "4K+ InfinityEdge OLED display, RTX 4070 8GB." },
    { name: "Lenovo ThinkPad X1 Carbon Gen 12", sku: "SKU-LAP-TPX1", price: 2199, category: "Laptops", desc: "Intel Core Ultra 7 155H, 32GB LPDDR5x, Military-grade carbon chassis." },
    { name: "ASUS ROG Zephyrus G16 Gaming Laptop", sku: "SKU-LAP-ROGG16", price: 2499, category: "Laptops", desc: "OLED 240Hz, Intel Core Ultra 9, RTX 4080." },
    { name: "Enterprise Server Rack X1", sku: "SKU-SRV-X100", price: 12500, category: "Hardware", desc: "42U High-Density Datacenter Enclosure with dynamic smart airflow." },
    { name: "Smart Dual-PDU Power Distribution 32A", sku: "SKU-PWR-TITAN", price: 1850, category: "Hardware", desc: "Redundant network-monitored power distribution unit with ATS." },
    { name: "Smart Optical Transceiver 100G", sku: "SKU-NET-OPT100", price: 850, category: "Networking", desc: "100GBASE-SR4 multi-mode transceiver 100m reach." },
    { name: "Enterprise 32-Port 100GbE Spine Switch", sku: "SKU-NET-SPINE32", price: 8900, category: "Networking", desc: "Ultra-low latency datacenter leaf/spine switch." },
    { name: "Cloud Telemetry Hub v4", sku: "SKU-SFT-TEL4", price: 2400, category: "Software", desc: "Full-stack observability & automated SLA metrics dashboard." },
    { name: "Predictive AI Deal Engine (Annual License)", sku: "SKU-SFT-PAI9", price: 4200, category: "Software", desc: "Autonomous ML deal scoring and margin optimization engine." },
    { name: "Setup & Onboarding Service", sku: "SKU-SRV-ONBOARD", price: 4500, category: "Services", desc: "On-site installation, migration, and team certification training." },
    { name: "24/7 Mission-Critical SLA Support", sku: "SKU-SVC-SLA24", price: 1800, category: "Services", desc: "15-minute response SLA with dedicated technical account manager." },
    { name: "Logitech MX Master 3S Wireless Mouse", sku: "SKU-ACC-MXM3S", price: 99, category: "Accessories", desc: "8K DPI any-surface tracking, quiet clicks, MagSpeed scroll wheel." },
    { name: "CalDigit TS4 Thunderbolt 4 Dock 18-Port", sku: "SKU-ACC-TS4", price: 399, category: "Accessories", desc: "98W Power Delivery, 2.5GbE, dual 6K display output." },
    { name: "3-Month Hardware Extended Warranty", sku: "SKU-WRN-3M", price: 1500, category: "Subscriptions", desc: "Express Part Replacement (48-hr SLA) · Diagnostic Support · Zero Labor Charges" },
    { name: "6-Month Premium Hardware Protection", sku: "SKU-WRN-6M", price: 3000, category: "Subscriptions", desc: "Priority Swap & Loaner Units · Accidental Damage Cover · 24/7 Hotline" },
    { name: "12-Month Comprehensive Full Care Warranty", sku: "SKU-WRN-12M", price: 5000, category: "Subscriptions", desc: "On-site Field Tech Support · Free Battery Refresh · Complete Component Coverage" }
  ];

  const dbProducts = [];
  for (const p of productDefs) {
    const existing = await db("products").where({ sku: p.sku }).first();
    let prodId = existing?.id;
    if (existing) {
      await db("products").where({ id: existing.id }).update({
        name: p.name,
        description: p.desc,
        price: p.price,
        category: p.category,
        is_active: true
      });
    } else {
      prodId = `prod-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      await db("products").insert({
        id: prodId,
        name: p.name,
        sku: p.sku,
        description: p.desc,
        price: p.price,
        category: p.category,
        is_active: true
      });
    }
    dbProducts.push({ ...p, id: prodId });

    // Seed inventory across warehouses
    for (const wh of warehouses) {
      const stock = p.category === "Subscriptions" ? 9999 : Math.floor(20 + Math.random() * 80);
      const invExists = await db("warehouse_inventory").where({ warehouse_id: wh.id, product_id: prodId }).first();
      if (invExists) {
        await db("warehouse_inventory").where({ warehouse_id: wh.id, product_id: prodId }).update({
          stock_qty: stock,
          product_name: p.name
        });
      } else {
        await db("warehouse_inventory").insert({
          warehouse_id: wh.id,
          product_id: prodId,
          product_name: p.name,
          stock_qty: stock
        });
      }
    }
  }

  // 4. Generate 55 Diverse Quotations
  console.log("📑 Seeding 55+ Quotations with negotiation and pricing...");
  const companyNames = [
    { name: "Piyush Shah", email: "piyush@dealflow360.com", tier: "Gold" },
    { name: "Piyush Tech Ventures", email: "piyush@dealflow360.com", tier: "Gold" },
    { name: "Ujwal Sharma", email: "ujwal@dealflow360.com", tier: "Silver" },
    { name: "Tata Consultancy Services", email: "procurement@tcs.com", tier: "Enterprise" },
    { name: "Infosys Global Systems", email: "vendor-it@infosys.com", tier: "Enterprise" },
    { name: "Wipro Technologies", email: "hardware-ops@wipro.com", tier: "Enterprise" },
    { name: "Reliance Jio Infocomm", email: "cloud-it@ril.com", tier: "Enterprise" },
    { name: "HDFC Digital Banking", email: "itinfra@hdfcbank.com", tier: "Enterprise" },
    { name: "Zomato Media Pvt Ltd", email: "techops@zomato.com", tier: "Gold" },
    { name: "Swiggy Delivery Labs", email: "infra@swiggy.in", tier: "Gold" },
    { name: "Zerodha Broking Ltd", email: "systems@zerodha.com", tier: "Gold" },
    { name: "CRED Platform Tech", email: "hardware@cred.club", tier: "Gold" },
    { name: "Razorpay Software", email: "procurement@razorpay.com", tier: "Gold" },
    { name: "Freshworks Chennai", email: "it-india@freshworks.com", tier: "Silver" },
    { name: "Postman API Labs", email: "admin@postman.com", tier: "Silver" },
    { name: "Groww Invest Tech", email: "ops@groww.in", tier: "Silver" },
    { name: "Zepto Quick Commerce", email: "it@zepto.co", tier: "Bronze" },
    { name: "Urban Company Ltd", email: "vendor@urbancompany.com", tier: "Bronze" },
    { name: "Blinkit Logistics", email: "hardware@blinkit.com", tier: "Bronze" },
    { name: "Delhivery Express", email: "infra@delhivery.com", tier: "Silver" }
  ];

  const stages = ["Draft", "Pending Approval", "Approved", "Negotiation", "Confirmed"];
  const reps = [
    { name: "Alok Sisodiya", email: "aloksisodiya30@gmail.com", role: "sales_rep" },
    { name: "Gautam Patil", email: "gautampa07@gmail.com", role: "sales_rep" },
    { name: "Rjav Dariya", email: "rjavdariya@gmail.com", role: "sales_manager" },
    { name: "Arjav Dariya", email: "arjavdariya2@gmail.com", role: "admin" }
  ];

  const quotationList = [];
  for (let i = 1; i <= 55; i++) {
    const comp = companyNames[(i - 1) % companyNames.length];
    const rep = reps[(i - 1) % reps.length];
    const stage = stages[i % stages.length];
    const qId = `Q-${40000000 + i * 1111}`;
    const token = crypto.randomBytes(16).toString("hex");

    const p1 = dbProducts[i % (dbProducts.length - 3)];
    const p2 = dbProducts[(i + 3) % (dbProducts.length - 3)];
    const qty1 = (i % 5) + 1;
    const qty2 = (i % 3) + 1;
    const lineItems = [
      { id: `item-${i}-1`, name: p1.name, sku: p1.sku, category: p1.category, quantity: qty1, unitPrice: p1.price, totalPrice: p1.price * qty1 },
      { id: `item-${i}-2`, name: p2.name, sku: p2.sku, category: p2.category, quantity: qty2, unitPrice: p2.price, totalPrice: p2.price * qty2 }
    ];

    const baseAmount = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountPct = stage === "Draft" ? 0 : stage === "Pending Approval" ? (comp.tier === "Enterprise" ? 20 : 10) : (comp.tier === "Enterprise" ? 15 : 8);
    const totalAmount = Number((baseAmount * (1 - discountPct / 100)).toFixed(2));
    const marginPct = Number((55 - discountPct * 0.6).toFixed(1));

    let negReq = null;
    if (stage === "Negotiation") {
      const demandedPct = discountPct + 5;
      const demandedPrice = Number((baseAmount * (1 - demandedPct / 100)).toFixed(2));
      negReq = `Customer proposed ${demandedPct}% discount. Demanded Total: ₹${demandedPrice.toLocaleString('en-IN')}`;
    }

    quotationList.push({
      id: qId,
      customer_name: comp.name,
      customer_email: comp.email,
      portal_customer_email: comp.email,
      customer_tier: comp.tier,
      base_amount: baseAmount,
      discount_percent: discountPct,
      total_amount: totalAmount,
      margin_percent: marginPct,
      stage: stage,
      approval_required: discountPct > 10,
      approval_status: stage === "Approved" || stage === "Confirmed" ? "Approved" : stage === "Pending Approval" ? "Pending Approval" : "Standard",
      stalled_days: i % 7,
      closing_date: new Date(Date.now() + (i * 2) * 86400000),
      assigned_to: rep.name,
      owner_id: adminIds[rep.email] || null,
      portal_token: token,
      notes: `${p1.name} (${qty1}x) + ${p2.name} (${qty2}x) Enterprise Rollout`,
      items: JSON.stringify(lineItems),
      upsell_items: JSON.stringify(lineItems),
      negotiation_request: negReq,
      created_at: new Date(Date.now() - (55 - i) * 12 * 3600000)
    });
  }

  for (const q of quotationList) {
    await db("quotations").insert(q).onConflict("id").merge();
  }

  // 5. Generate 45 Invoices
  console.log("🧾 Seeding 45+ Invoices linked to settled quotations...");
  const invoiceList = [];
  for (let i = 1; i <= 45; i++) {
    const quote = quotationList[(i - 1) % quotationList.length];
    const invId = `inv-${1000 + i}`;
    const invNum = `INV-2026-${String(1000 + i).padStart(4, "0")}`;
    const status = i % 5 === 0 ? "Overdue" : i % 3 === 0 ? "Pending" : "Paid";
    const paymentMethods = ["ACH Wire Transfer", "Corporate Credit Card", "UPI Enterprise Direct", "Net Banking RTGS"];

    invoiceList.push({
      id: invId,
      invoice_number: invNum,
      quotation_id: quote.id,
      customer_name: quote.customer_name,
      customer_email: quote._customer_email,
      amount: quote.total_amount,
      status: status,
      issue_date: new Date(Date.now() - (45 - i) * 86400000),
      due_date: new Date(Date.now() + (30 - i) * 86400000).toISOString().split("T")[0],
      payment_method: paymentMethods[i % paymentMethods.length],
      payment_batch: `BATCH-${paymentMethods[i % paymentMethods.length].slice(0, 3).toUpperCase()}-${String(100 + i)}`,
      items: quote.upsell_items,
      notes: `Official Tax Invoice for ${quote.notes}. All taxes (18% GST) inclusive.`
    });
  }

  for (const inv of invoiceList) {
    await db("invoices").insert(inv).onConflict("id").merge();
  }

  // 6. Generate 45 Warranty Subscriptions
  console.log("🛡️ Seeding 45+ Warranty Subscriptions across 3M, 6M, 12M...");
  await db("subscriptions").del();
  const tiers = ["3 Months", "6 Months", "12 Months"];
  const subList = [];
  for (let i = 1; i <= 45; i++) {
    const comp = companyNames[(i - 1) % companyNames.length];
    const tier = tiers[i % tiers.length];
    const durationMonths = tier.includes("3") ? 3 : tier.includes("6") ? 6 : 12;
    const planPrice = tier.includes("3") ? 1500 : tier.includes("6") ? 3000 : 5000;
    const units = (i % 4) + 1;
    const totalSubAmount = planPrice * units;
    const mrr = Number((totalSubAmount / durationMonths).toFixed(2));
    const codePrefix = tier.includes("3") ? "WRN-3M" : tier.includes("6") ? "WRN-6M" : "WRN-12M";
    const subCode = `${codePrefix}-${comp.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()}-${String(100 + i)}`;
    const status = i % 7 === 0 ? "Paused" : "Active";

    const prod = dbProducts[i % 5];
    const serials = Array.from({ length: units }, (_, u) => `${prod.sku.slice(-6)}-${comp.name.slice(0, 3).toUpperCase()}-${8000 + i * 10 + u}`);

    subList.push({
      id: `wrn-${100 + i}`,
      subscription_code: subCode,
      customer_name: comp.name,
      tier: tier,
      plan_name: `${tier} Extended Hardware Protection`,
      amount: totalSubAmount,
      mrr: mrr,
      billing_cycle: tier,
      status: status,
      start_date: new Date(Date.now() - (45 - i) * 86400000),
      next_billing_date: new Date(Date.now() + (durationMonths * 30 - i) * 86400000).toISOString().split("T")[0],
      seats: units,
      features: JSON.stringify({
        productName: prod.name,
        productSku: prod.sku,
        quotationId: quotationList[i % quotationList.length].id,
        warrantyDuration: tier,
        coverageScope: tier.includes("12") ? "On-site Field Tech Support · Free Battery Refresh · Complete Component Coverage" : tier.includes("6") ? "Priority Swap & Loaner Units · Accidental Damage Cover · 24/7 Hotline" : "Express Part Replacement (48-hr SLA) · Diagnostic Support · Zero Labor Charges",
        warehouseHub: warehouses[i % warehouses.length].name,
        serialNumbers: serials
      }),
      audit_logs: JSON.stringify([
        { date: new Date(Date.now() - (45 - i) * 86400000).toISOString().split("T")[0], action: `Warranty Activated (${units} units)`, user: "Automated Rule Engine" }
      ])
    });
  }

  for (const s of subList) {
    await db("subscriptions").insert(s);
  }

  // 7. Seed Portal Messages for Live Negotiation Testing
  console.log("💬 Seeding Portal Negotiation Messages...");
  for (let i = 1; i <= 20; i++) {
    const q = quotationList[i];
    await db("portal_messages").insert([
      {
        quote_id: q.id,
        sender: "customer",
        message: `Hello! We are reviewing proposal ${q.id}. Could we apply an additional volume discount if we confirm before Friday? — ${q.customer_name}`,
        created_at: new Date(Date.now() - 3600000 * 5)
      },
      {
        quote_id: q.id,
        sender: "rep",
        message: `Hi ${q.customer_name}, absolutely! I have factored in your customer tier benefits and authorized special quarterly pricing. — ${q.assigned_to}`,
        created_at: new Date(Date.now() - 3600000 * 2)
      }
    ]).catch(() => {});
  }

  console.log(`\n======================================================`);
  console.log(`✅ SUCCESS: Fully seeded DealFlow360 database!`);
  console.log(`   - 7 Core Users & Customers (Admin, Rep, Customer, Finance)`);
  console.log(`   - 5 Warehouses (Mumbai, BLR, Delhi, Hyderabad, Chennai)`);
  console.log(`   - 17 Products with Regional Inventory Stock`);
  console.log(`   - 55 Quotations across Draft, Pending, Approved, Negotiation, Confirmed`);
  console.log(`   - 45 Invoices with Paid, Pending, Overdue statuses`);
  console.log(`   - 45 Warranty Subscriptions (3M, 6M, 12M) with active serials`);
  console.log(`   - 40+ Live Chat Negotiation Messages`);
  console.log(`🎉 Total Comprehensive Records Added/Updated: ~210 records!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
