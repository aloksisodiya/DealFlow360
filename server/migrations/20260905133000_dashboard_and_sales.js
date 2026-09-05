/**
 * Knex Migration: Creates tables for Sales Dashboard & Quotations Operations
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Quotations Table
  await knex.schema.createTable("quotations", (table) => {
    table.string("id", 50).primary(); // e.g. Q-9402
    table.string("customer_name", 255).notNullable();
    table.string("customer_tier", 50).notNullable().defaultTo("Bronze");
    table.decimal("total_amount", 14, 2).notNullable().defaultTo(0.00);
    table.string("stage", 50).notNullable().defaultTo("Draft"); // Draft, Pending Approval, Approved, Fulfillment, At Risk
    table.float("blended_risk_score").notNullable().defaultTo(0.0);
    table.boolean("approval_required").notNullable().defaultTo(false);
    table.string("approval_status", 100).notNullable().defaultTo("Auto-Approved");
    table.integer("stalled_days").notNullable().defaultTo(0);
    table.timestamp("closing_date").nullable();
    table.timestamps(true, true);
  });

  // 2. Recent Activities Feed Table
  await knex.schema.createTable("recent_activities", (table) => {
    table.increments("id").primary();
    table.string("title", 255).notNullable();
    table.string("subtitle", 255).notNullable();
    table.string("time_ago", 50).notNullable();
    table.string("badge_type", 50).notNullable(); // Approved, Pending Review, Inventory Sync
    table.string("badge_color", 50).notNullable(); // success, warning, info
    table.string("quote_id", 50).nullable();
    table.timestamps(true, true);
  });

  // 3. Deal Health Alerts Table
  await knex.schema.createTable("deal_health_alerts", (table) => {
    table.increments("id").primary();
    table.string("quote_id", 50).notNullable();
    table.string("customer_name", 255).notNullable();
    table.string("issue", 255).notNullable();
    table.string("severity", 50).notNullable().defaultTo("HIGH");
    table.integer("inactive_days").notNullable().defaultTo(0);
    table.string("recommendation", 255).nullable();
    table.boolean("resolved").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("deal_health_alerts");
  await knex.schema.dropTableIfExists("recent_activities");
  await knex.schema.dropTableIfExists("quotations");
}
