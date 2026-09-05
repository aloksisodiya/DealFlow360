import db from "../config/db.js";

/**
 * DealFlow360 — Inventory-Aware Upsell / Cross-sell Engine
 *
 * On customer confirmation, queries warehouse_inventory JOIN products to surface
 * in-stock complementary products. Scoring algorithm:
 *   +30  same category as confirmed order
 *   +20  complementary category (Hardware→Services, Software→Subscriptions, etc.)
 *   +10  margin > 40%
 *   +5   margin > 30%
 *   +5   stock_qty > 10 (well-stocked)
 *   -999 stock_qty == 0 (excluded)
 */

const COMPLEMENTARY = {
  Hardware: ["Services", "Subscriptions"],
  Software: ["Services", "Subscriptions", "Hardware"],
  Services: ["Hardware", "Software"],
  Subscriptions: ["Software", "Services"],
};

export async function getUpsellSuggestions(quoteId, limit = 3) {
  try {
    // 1. Determine the categories in the confirmed order
    const quote = await db("quotations").where({ id: quoteId }).first();
    const primaryCategory = quote?.customer_tier ? null : null; // fallback below

    // 2. Get all in-stock products from warehouse_inventory JOIN products
    const inStockItems = await db("warehouse_inventory as wi")
      .join("products as p", "p.id", "wi.product_id")
      .where("wi.stock_qty", ">", 0)
      .where("p.is_active", true)
      .select(
        "p.id",
        "p.name",
        "p.category",
        "p.price",
        "p.margin_percent",
        "p.description",
        "p.sku",
        "p.unit",
        db.raw("SUM(wi.stock_qty) as total_stock")
      )
      .groupBy("p.id", "p.name", "p.category", "p.price", "p.margin_percent", "p.description", "p.sku", "p.unit")
      .orderBy("p.margin_percent", "desc");

    if (!inStockItems || inStockItems.length === 0) {
      return getFallbackSuggestions();
    }

    // 3. Get categories already in the quotation upsell_items (if any)
    let quoteCategories = [];
    try {
      const upsellItems = typeof quote?.upsell_items === "string"
        ? JSON.parse(quote.upsell_items)
        : (quote?.upsell_items || []);
      quoteCategories = [...new Set(upsellItems.map((i) => i.category).filter(Boolean))];
    } catch {}

    // If no category info, default to Services as complementary
    if (quoteCategories.length === 0) quoteCategories = ["Hardware"];

    // 4. Score each in-stock product
    const scored = inStockItems.map((product) => {
      let score = 0;
      const cat = product.category || "";
      const margin = Number(product.margin_percent || 0);
      const stock = Number(product.total_stock || 0);

      // Already in order's primary category — upsell
      if (quoteCategories.includes(cat)) score += 30;

      // Complementary to any category in order — cross-sell
      const isComplementary = quoteCategories.some((qCat) =>
        (COMPLEMENTARY[qCat] || []).includes(cat)
      );
      if (isComplementary) score += 20;

      // Margin bonuses
      if (margin > 40) score += 10;
      else if (margin > 30) score += 5;

      // Stock availability bonus
      if (stock > 10) score += 5;

      return { ...product, score };
    });

    // 5. Sort by score desc, take top N
    const top = scored
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // If scoring didn't yield enough, pad with high-margin items
    if (top.length < limit) {
      const seen = new Set(top.map((p) => p.id));
      const extras = scored
        .filter((p) => !seen.has(p.id))
        .sort((a, b) => Number(b.margin_percent) - Number(a.margin_percent))
        .slice(0, limit - top.length);
      top.push(...extras);
    }

    return top.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      priceFormatted: `$${Number(p.price).toLocaleString()}`,
      margin: `${p.margin_percent}%`,
      sku: p.sku,
      unit: p.unit,
      description: p.description,
      stockAvailable: Number(p.total_stock),
      reason: getReason(p, quoteCategories),
    }));
  } catch (error) {
    console.error("[UpsellEngine] Error fetching suggestions:", error.message);
    return getFallbackSuggestions();
  }
}

function getReason(product, quoteCategories) {
  const cat = product.category || "";
  if (quoteCategories.includes(cat)) return `Frequently added with your ${cat} items`;
  for (const qCat of quoteCategories) {
    if ((COMPLEMENTARY[qCat] || []).includes(cat)) {
      return `Complements your ${qCat} purchase`;
    }
  }
  if (Number(product.margin_percent) > 40) return "High-value addition";
  return "Recommended by your sales team";
}

function getFallbackSuggestions() {
  return [
    {
      id: "fallback-1",
      name: "Premium Support Package",
      category: "Services",
      price: 2400,
      priceFormatted: "$2,400",
      margin: "55%",
      sku: "SVC-SUPP-PRE",
      unit: "Year",
      description: "24/7 dedicated support with 4-hour SLA response",
      stockAvailable: 99,
      reason: "Recommended by your sales team",
    },
    {
      id: "fallback-2",
      name: "Extended Warranty",
      category: "Services",
      price: 1200,
      priceFormatted: "$1,200",
      margin: "70%",
      sku: "SVC-WARR-EXT",
      unit: "Year",
      description: "2-year extended hardware warranty coverage",
      stockAvailable: 99,
      reason: "Frequently added with hardware orders",
    },
  ];
}
