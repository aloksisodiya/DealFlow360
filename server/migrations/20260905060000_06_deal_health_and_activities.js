/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Deal Health Alerts
  const hasAlerts = await knex.schema.hasTable("deal_health_alerts");
  if (!hasAlerts) {
    await knex.schema.createTable("deal_health_alerts", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50);
      table.string("customer_name", 255).notNullable();
      table.text("issue").notNullable();
      table.string("severity", 50).defaultTo("MEDIUM");
      table.integer("inactive_days").defaultTo(0);
      table.text("recommendation");
      table.boolean("resolved").defaultTo(false);
      table.timestamps(true, true);
    });
  }

  // 2. Recent Activities
  const hasActivities = await knex.schema.hasTable("recent_activities");
  if (!hasActivities) {
    await knex.schema.createTable("recent_activities", (table) => {
      table.increments("id").primary();
      table.string("title", 255).notNullable();
      table.text("subtitle");
      table.string("time_ago", 50);
      table.string("badge_type", 50);
      table.string("badge_color", 50);
      table.string("quote_id", 50);
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("recent_activities");
  await knex.schema.dropTableIfExists("deal_health_alerts");
}
