/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Warehouses
  const hasWh = await knex.schema.hasTable("warehouses");
  if (!hasWh) {
    await knex.schema.createTable("warehouses", (table) => {
      table.string("id", 50).primary();
      table.string("name", 255).notNullable();
      table.string("location", 255).notNullable();
      table.decimal("shipping_cost_weight", 4, 2).defaultTo(1.0);
      table.timestamps(true, true);
    });
  }

  // 2. Warehouse Inventory
  const hasInv = await knex.schema.hasTable("warehouse_inventory");
  if (!hasInv) {
    await knex.schema.createTable("warehouse_inventory", (table) => {
      table.increments("id").primary();
      table.string("warehouse_id", 50).references("id").inTable("warehouses").onDelete("CASCADE");
      table.string("product_id", 50);
      table.string("product_name", 255).notNullable();
      table.integer("stock_qty").notNullable().defaultTo(0);
      table.timestamps(true, true);
    });
  }

  // 3. Quotation Fulfillment Splits
  const hasSplits = await knex.schema.hasTable("quotation_fulfillment_splits");
  if (!hasSplits) {
    await knex.schema.createTable("quotation_fulfillment_splits", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50).notNullable();
      table.string("warehouse_id", 50).references("id").inTable("warehouses").onDelete("CASCADE");
      table.string("product_id", 50);
      table.integer("allocated_qty").defaultTo(0);
      table.integer("backorder_qty").defaultTo(0);
      table.string("status", 50).defaultTo("Allocated");
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("quotation_fulfillment_splits");
  await knex.schema.dropTableIfExists("warehouse_inventory");
  await knex.schema.dropTableIfExists("warehouses");
}
