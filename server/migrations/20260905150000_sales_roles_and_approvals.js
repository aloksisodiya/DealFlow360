/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("admins", (table) => {
    table.string("role", 30).notNullable().defaultTo("sales_rep");
  });

  await knex("admins")
    .where({ work_email: "admin@dealflow360.local" })
    .update({ role: "sales_manager" });

  await knex.schema.alterTable("quotations", (table) => {
    table
      .integer("owner_id")
      .nullable()
      .references("id")
      .inTable("admins")
      .onDelete("SET NULL");
    table.decimal("discount_percent", 5, 2).notNullable().defaultTo(0);
    table.jsonb("upsell_items").notNullable().defaultTo("[]");
    table.text("negotiation_request").nullable();
    table.timestamp("negotiation_requested_at").nullable();
    table.timestamp("approved_at").nullable();
    table
      .integer("approved_by")
      .nullable()
      .references("id")
      .inTable("admins")
      .onDelete("SET NULL");
  });

  await knex.schema.createTable("discount_tiers", (table) => {
    table.increments("id").primary();
    table.string("customer_tier", 50).notNullable().unique();
    table.decimal("max_discount_percent", 5, 2).notNullable();
    table.timestamps(true, true);
  });

  await knex("discount_tiers").insert([
    { customer_tier: "Bronze", max_discount_percent: 5 },
    { customer_tier: "Silver", max_discount_percent: 10 },
    { customer_tier: "Gold", max_discount_percent: 15 },
  ]);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("discount_tiers");
  await knex.schema.alterTable("quotations", (table) => {
    table.dropColumn("owner_id");
    table.dropColumn("discount_percent");
    table.dropColumn("upsell_items");
    table.dropColumn("negotiation_request");
    table.dropColumn("negotiation_requested_at");
    table.dropColumn("approved_at");
    table.dropColumn("approved_by");
  });
  await knex.schema.alterTable("admins", (table) => table.dropColumn("role"));
}
