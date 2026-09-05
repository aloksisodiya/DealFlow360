import db from "../config/db.js";

export async function listProducts({ category, search, tier = "Bronze" } = {}) {
  let query = db("products").where({ is_active: true }).orderBy("created_at", "desc");

  if (category && category !== "All") {
    query = query.where({ category });
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query = query.where((builder) => {
      builder.whereRaw("LOWER(name) LIKE ?", [term])
        .orWhereRaw("LOWER(sku) LIKE ?", [term])
        .orWhereRaw("LOWER(description) LIKE ?", [term]);
    });
  }

  const products = await query;
  return products.map((p) => {
    let tierPricing = {};
    try {
      tierPricing = typeof p.tier_pricing === "string" ? JSON.parse(p.tier_pricing) : p.tier_pricing || {};
    } catch {}

    const calculatedPrice = tierPricing[tier] ? Number(tierPricing[tier]) : Number(p.price);

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      avatar: p.avatar,
      avatarColor: p.avatar_color,
      price: calculatedPrice,
      basePrice: Number(p.price),
      priceFormatted: `$${calculatedPrice.toLocaleString()}`,
      unit: p.unit,
      margin: `${p.margin_percent}%`,
      marginNum: Number(p.margin_percent),
      stockStatus: p.stock_status,
      variants: typeof p.variants === "string" ? JSON.parse(p.variants) : p.variants || [],
      tierPricing: tierPricing,
      description: p.description,
      createdAt: p.created_at,
    };
  });
}

export async function getProductById(id) {
  const product = await db("products").where({ id }).first();
  if (!product) throw new Error("Product not found");
  return product;
}

export async function createProduct(data) {
  const id = data.id || `prod-${Date.now().toString().slice(-6)}`;
  const [product] = await db("products")
    .insert({
      id,
      name: data.name,
      sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
      category: data.category || "Hardware",
      avatar: data.avatar || (data.name ? data.name.slice(0, 2).toUpperCase() : "PR"),
      avatar_color: data.avatarColor || data.avatar_color || "purple",
      price: Number(data.price || 0),
      unit: data.unit || "Each",
      margin_percent: Number(data.marginPercent || data.margin_percent || 30),
      stock_status: data.stockStatus || data.stock_status || "In Stock",
      variants: JSON.stringify(data.variants || ["Standard"]),
      tier_pricing: JSON.stringify(data.tierPricing || data.tier_pricing || {}),
      description: data.description || "",
      is_active: true,
    })
    .returning("*");

  return product;
}

export async function updateProduct(id, updates) {
  const patch = {};
  if (updates.name) patch.name = updates.name;
  if (updates.sku) patch.sku = updates.sku;
  if (updates.category) patch.category = updates.category;
  if (updates.price !== undefined) patch.price = Number(updates.price);
  if (updates.unit) patch.unit = updates.unit;
  if (updates.marginPercent !== undefined) patch.margin_percent = Number(updates.marginPercent);
  if (updates.stockStatus) patch.stock_status = updates.stockStatus;
  if (updates.variants) patch.variants = JSON.stringify(updates.variants);
  if (updates.tierPricing) patch.tier_pricing = JSON.stringify(updates.tierPricing);
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.isActive !== undefined) patch.is_active = updates.isActive;

  const [product] = await db("products").where({ id }).update(patch).returning("*");
  if (!product) throw new Error("Product not found");
  return product;
}

export async function deleteProduct(id) {
  const deleted = await db("products").where({ id }).delete();
  if (!deleted) throw new Error("Product not found");
  return { id, success: true };
}
