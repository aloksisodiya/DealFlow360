/**
 * Seed 04: Warehouses, Inventory & Fulfillment Allocations
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // 1. Warehouses
  const warehouses = [
    {
      id: "wh-main",
      name: "Mumbai Central Hub",
      location: "Bhiwandi, Mumbai, MH",
      shipping_cost_weight: 1.0,
    },
    {
      id: "wh-east",
      name: "Bengaluru Tech Depot",
      location: "Whitefield, Bengaluru, KA",
      shipping_cost_weight: 1.15,
    },
    {
      id: "wh-west",
      name: "Delhi NCR Logistics Hub",
      location: "Gurugram, Delhi NCR, HR",
      shipping_cost_weight: 1.1,
    }
  ];

  for (const wh of warehouses) {
    await knex("warehouses")
      .insert(wh)
      .onConflict("id")
      .merge();
  }

  // 2. Warehouse Inventory
  await knex("warehouse_inventory").del();
  await knex("warehouse_inventory").insert([
    {
      warehouse_id: "wh-main",
      product_id: "prod-1",
      product_name: "Enterprise Server Rack X1",
      stock_qty: 150,
    },
    {
      warehouse_id: "wh-main",
      product_id: "prod-4",
      product_name: "Smart Optical Transceiver 100G",
      stock_qty: 320,
    },
    {
      warehouse_id: "wh-east",
      product_id: "prod-1",
      product_name: "Enterprise Server Rack X1",
      stock_qty: 30,
    },
    {
      warehouse_id: "wh-east",
      product_id: "prod-4",
      product_name: "Smart Optical Transceiver 100G",
      stock_qty: 85,
    },
    {
      warehouse_id: "wh-west",
      product_id: "prod-1",
      product_name: "Enterprise Server Rack X1",
      stock_qty: 90,
    },
    {
      warehouse_id: "wh-west",
      product_id: "prod-4",
      product_name: "Smart Optical Transceiver 100G",
      stock_qty: 210,
    }
  ]);

  // 3. Fulfillment Splits
  await knex("quotation_fulfillment_splits").del();
  await knex("quotation_fulfillment_splits").insert([
    {
      quote_id: "Q-9402",
      warehouse_id: "wh-main",
      product_id: "prod-1",
      allocated_qty: 10,
      backorder_qty: 0,
      status: "Allocated",
    },
    {
      quote_id: "Q-9402",
      warehouse_id: "wh-east",
      product_id: "prod-1",
      allocated_qty: 5,
      backorder_qty: 0,
      status: "Allocated",
    }
  ]);

  console.log("✅ Seed 04: Warehouses & Inventory populated.");
}
