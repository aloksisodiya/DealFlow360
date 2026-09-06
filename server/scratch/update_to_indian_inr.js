import db from "../config/db.js";

async function run() {
  console.log("Updating Warehouses to Indian Hubs...");

  const indianWarehouses = [
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

  for (const wh of indianWarehouses) {
    await db("warehouses")
      .insert(wh)
      .onConflict("id")
      .merge();
  }

  // Update warehouse inventory names
  await db("warehouse_inventory")
    .where("warehouse_id", "wh-main")
    .update({ updated_at: db.fn.now() });

  console.log("✅ Warehouses successfully updated to Indian hubs!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error updating warehouses:", err);
  process.exit(1);
});
