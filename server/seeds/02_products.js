/**
 * Seed 02: Enterprise Products Catalog & Tier Pricing
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const products = [
    {
      id: "prod-1",
      name: "Enterprise Server Rack X1",
      sku: "SKU-SRV-X100",
      category: "Hardware",
      avatar: "SR",
      avatar_color: "purple",
      price: 12500.00,
      unit: "per unit",
      margin_percent: 42.50,
      stock_status: "In Stock",
      variants: JSON.stringify(["32U Standard", "42U High-Density", "48U Telco Edition"]),
      tier_pricing: JSON.stringify({ Bronze: 12500, Silver: 11800, Gold: 11200, Enterprise: 10400 }),
      description: "High-density enterprise-grade server cabinet equipped with intelligent smart PDU cooling monitoring.",
      is_active: true,
    },
    {
      id: "prod-2",
      name: "Setup & Onboarding Service",
      sku: "SKU-SRV-ONBOARD",
      category: "Services",
      avatar: "SO",
      avatar_color: "emerald",
      price: 4500.00,
      unit: "flat fee",
      margin_percent: 68.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["Express 7-Day", "White-Glove Dedicated Engineer"]),
      tier_pricing: JSON.stringify({ Bronze: 4500, Silver: 4000, Gold: 3600, Enterprise: 3000 }),
      description: "Complete technical architecture deployment, API integration, and engineering team training.",
      is_active: true,
    },
    {
      id: "prod-3",
      name: "Cloud Telemetry Hub v4",
      sku: "SKU-SFT-TEL4",
      category: "Software",
      avatar: "CT",
      avatar_color: "blue",
      price: 2400.00,
      unit: "per year",
      margin_percent: 88.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["Standard Monitoring", "AI Anomaly Detection + Real-time Alerting"]),
      tier_pricing: JSON.stringify({ Bronze: 2400, Silver: 2200, Gold: 2000, Enterprise: 1800 }),
      description: "Real-time edge compute telemetry platform with ML-driven failure prediction and health scoring.",
      is_active: true,
    },
    {
      id: "prod-4",
      name: "Smart Optical Transceiver 100G",
      sku: "SKU-NET-OPT100",
      category: "Hardware",
      avatar: "OT",
      avatar_color: "amber",
      price: 850.00,
      unit: "per transceiver",
      margin_percent: 54.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["Short Reach (SR4)", "Long Reach (LR4)"]),
      tier_pricing: JSON.stringify({ Bronze: 850, Silver: 800, Gold: 750, Enterprise: 690 }),
      description: "QSFP28 100Gbps optical networking transceiver designed for low latency datacenter backbones.",
      is_active: true,
    },
    {
      id: "prod-5",
      name: "24/7 Mission-Critical SLA Support",
      sku: "SKU-SVC-SLA24",
      category: "Services",
      avatar: "MS",
      avatar_color: "rose",
      price: 1800.00,
      unit: "per month",
      margin_percent: 75.00,
      stock_status: "In Stock",
      variants: JSON.stringify(["15-min Response SLA", "Dedicated TAM + On-site Spares Dispatch"]),
      tier_pricing: JSON.stringify({ Bronze: 1800, Silver: 1650, Gold: 1500, Enterprise: 1300 }),
      description: "Round-the-clock priority escalations, dedicated technical account manager, and guaranteed SLA.",
      is_active: true,
    }
  ];

  for (const product of products) {
    await knex("products")
      .insert(product)
      .onConflict("id")
      .merge();
  }

  console.log("✅ Seed 02: Products & Catalog populated.");
}
