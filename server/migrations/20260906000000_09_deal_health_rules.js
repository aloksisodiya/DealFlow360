/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable("deal_health_rules");
  if (!hasTable) {
    await knex.schema.createTable("deal_health_rules", (table) => {
      table.string("id", 50).primary().defaultTo("default");
      table.decimal("max_discount_threshold", 5, 2).defaultTo(15.0);
      table.integer("idle_days_threshold").defaultTo(7);
      table.integer("delivery_sla_buffer").defaultTo(3);
      table.boolean("auto_nudge_enabled").defaultTo(true);
      table.timestamps(true, true);
    });

    await knex("deal_health_rules").insert({
      id: "default",
      max_discount_threshold: 15.0,
      idle_days_threshold: 7,
      delivery_sla_buffer: 3,
      auto_nudge_enabled: true,
    }).onConflict("id").ignore();
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("deal_health_rules");
}
