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

  const [products, inventory] = await Promise.all([
    query,
    db("warehouse_inventory as wi")
      .leftJoin("warehouses as w", "wi.warehouse_id", "w.id")
      .select("wi.product_id", "wi.product_name", "wi.stock_qty", "wi.warehouse_id", "w.name as warehouse_name")
      .catch(() => [])
  ]);

  return products.map((p) => {
    let tierPricing = {};
    try {
      tierPricing = typeof p.tier_pricing === "string" ? JSON.parse(p.tier_pricing) : p.tier_pricing || {};
    } catch {}

    const calculatedPrice = tierPricing[tier] ? Number(tierPricing[tier]) : Number(p.price);

    // Calculate live warehouse inventory
    const pInv = inventory.filter(
      (i) => i.product_id === p.id || (i.product_name && p.name && i.product_name.toLowerCase() === p.name.toLowerCase())
    );
    const totalStock = pInv.reduce((sum, item) => sum + Number(item.stock_qty || 0), 0);
    const warehouseBreakdown = pInv.map(i => ({
      warehouseId: i.warehouse_id,
      warehouseName: i.warehouse_name || "Regional Warehouse",
      stockQty: Number(i.stock_qty || 0)
    }));

    const stockStatus = totalStock <= 0 ? "Out of Stock" : totalStock < 20 ? "Low Stock" : "In Stock";

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
      tax: "15%",
      margin: `${p.margin_percent}%`,
      marginNum: Number(p.margin_percent),
      stockStatus: stockStatus,
      status: stockStatus,
      stockQty: totalStock,
      totalStock: totalStock,
      warehouseBreakdown,
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
      stock_status: "In Stock",
      variants: JSON.stringify(data.variants || ["Standard"]),
      tier_pricing: JSON.stringify(data.tierPricing || data.tier_pricing || {}),
      description: data.description || "",
      is_active: true,
    })
    .returning("*");

  // Automatically initialize warehouse inventory for this new product
  try {
    const warehouses = await db("warehouses").select("id", "name");
    const initStock = Number(data.stockQty || data.initialStock || 100);
    const mainQty = Math.round(initStock * 0.6);
    const branchQty = Math.max(5, Math.round(initStock * 0.2));

    for (const w of warehouses) {
      const isMain = (w.name || "").toLowerCase().includes("main") || w.id === "wh-main";
      await db("warehouse_inventory").insert({
        warehouse_id: w.id,
        product_id: id,
        product_name: product.name,
        stock_qty: isMain ? mainQty : branchQty,
      });
    }
  } catch (err) {
    console.warn("[createProduct] Could not initialize warehouse inventory:", err.message);
  }

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

  // If product name updated, sync with warehouse inventory
  if (updates.name) {
    try {
      await db("warehouse_inventory").where({ product_id: id }).update({ product_name: updates.name });
    } catch {}
  }

  return product;
}

export async function deleteProduct(id) {
  // Delete associated warehouse inventory entries
  try {
    await db("warehouse_inventory").where({ product_id: id }).delete();
  } catch (err) {
    console.warn("[deleteProduct] Could not delete warehouse inventory:", err.message);
  }

  const deleted = await db("products").where({ id }).delete();
  if (!deleted) throw new Error("Product not found");
  return { id, success: true };
}

/**
 * Deduct warehouse stock when an order/quotation is purchased or confirmed
 */
export async function deductInventoryForOrder(quoteId) {
  try {
    const quote = await db("quotations").where({ id: quoteId }).first();
    if (!quote) return { success: false, message: "Quotation not found" };

    let items = [];
    if (Array.isArray(quote.items) && quote.items.length > 0) {
      items = quote.items;
    } else {
      // Default representative order item
      items = [
        { name: "Enterprise Server Rack X1", quantity: 2, category: "Hardware" }
      ];
    }

    for (const it of items) {
      const qtyToDeduct = Number(it.quantity || 1);
      if (qtyToDeduct <= 0) continue;

      // Find stock in Main Warehouse first
      const mainInv = await db("warehouse_inventory")
        .where((b) => {
          b.where("warehouse_id", "wh-main")
            .andWhere((b2) => {
              b2.where("product_name", "like", `%${it.name || "Server"}%`)
                .orWhere("product_id", it.productId || "prod-1");
            });
        })
        .first();

      if (mainInv && mainInv.stock_qty >= qtyToDeduct) {
        // Fully deduct from main warehouse
        await db("warehouse_inventory")
          .where({ id: mainInv.id })
          .update({
            stock_qty: Math.max(0, Number(mainInv.stock_qty) - qtyToDeduct),
            updated_at: db.fn.now()
          });
      } else if (mainInv) {
        // Auto-split: take all from main, rest from east/west
        const fromMain = Number(mainInv.stock_qty);
        const remainder = qtyToDeduct - fromMain;

        await db("warehouse_inventory")
          .where({ id: mainInv.id })
          .update({ stock_qty: 0, updated_at: db.fn.now() });

        const eastInv = await db("warehouse_inventory")
          .where("warehouse_id", "wh-east")
          .andWhere("product_name", "like", `%${it.name || "Server"}%`)
          .first();

        if (eastInv) {
          await db("warehouse_inventory")
            .where({ id: eastInv.id })
            .update({
              stock_qty: Math.max(0, Number(eastInv.stock_qty) - remainder),
              updated_at: db.fn.now()
            });
        }
      }
    }

    return { success: true, quoteId, message: "Warehouse inventory stock updated for confirmed order" };
  } catch (err) {
    console.warn("[deductInventoryForOrder] Error deducting inventory:", err.message);
    return { success: false, error: err.message };
  }
}
