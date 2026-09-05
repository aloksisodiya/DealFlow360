/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable("products");
  if (!exists) {
    await knex.schema.createTable("products", (table) => {
      table.string("id", 50).primary();
      table.string("name", 255).notNullable();
      table.string("sku", 255).notNullable().unique();
      table.string("category", 255).defaultTo("Hardware");
      table.string("avatar", 255).defaultTo("PR");
      table.string("avatar_color", 255).defaultTo("purple");
      table.decimal("price", 12, 2).notNullable().defaultTo(0);
      table.string("unit", 255).defaultTo("Each");
      table.decimal("margin_percent", 5, 2).defaultTo(30.0);
      table.string("stock_status", 255).defaultTo("In Stock");
      table.jsonb("variants").defaultTo("[]");
      table.jsonb("tier_pricing").defaultTo("{}");
      table.text("description");
      table.boolean("is_active").defaultTo(true);
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("products");
}
