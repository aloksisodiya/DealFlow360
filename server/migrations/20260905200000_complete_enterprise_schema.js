/**
 * Migration: Complete Enterprise Schema for DealFlow360
 * Adds products, invoices, subscriptions, and relational columns.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Products Table
  const hasProducts = await knex.schema.hasTable("products");
  if (!hasProducts) {
    await knex.schema.createTable("products", (table) => {
      table.string("id").primary();
      table.string("name").notNullable();
      table.string("sku").notNullable().unique();
      table.string("category").notNullable().defaultTo("Hardware");
      table.string("avatar").defaultTo("PR");
      table.string("avatar_color").defaultTo("purple");
      table.decimal("price", 14, 2).notNullable().defaultTo(0);
      table.string("unit").defaultTo("Each");
      table.decimal("margin_percent", 5, 2).defaultTo(30.0);
      table.string("stock_status").defaultTo("In Stock");
      table.jsonb("variants").defaultTo("[]");
      table.jsonb("tier_pricing").defaultTo("{}");
      table.text("description").nullable();
      table.boolean("is_active").defaultTo(true);
      table.timestamps(true, true);
    });
  }

  // 2. Invoices Table
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (!hasInvoices) {
    await knex.schema.createTable("invoices", (table) => {
      table.string("id").primary();
      table.string("invoice_number").notNullable().unique();
      table.string("quotation_id").nullable();
      table.string("customer_name").notNullable();
      table.string("customer_email").nullable();
      table.decimal("amount", 14, 2).notNullable().defaultTo(0);
      table.string("status").notNullable().defaultTo("Draft"); // Draft, Processing, Paid, Overdue, Cancelled
      table.date("issue_date").notNullable().defaultTo(knex.fn.now());
      table.date("due_date").notNullable();
      table.string("payment_method").defaultTo("ACH Wire");
      table.string("payment_batch").nullable();
      table.jsonb("items").defaultTo("[]");
      table.text("notes").nullable();
      table.timestamps(true, true);
    });
  }

  // 3. Subscriptions Table
  const hasSubscriptions = await knex.schema.hasTable("subscriptions");
  if (!hasSubscriptions) {
    await knex.schema.createTable("subscriptions", (table) => {
      table.string("id").primary();
      table.string("subscription_code").notNullable().unique();
      table.string("customer_name").notNullable();
      table.string("tier").defaultTo("Enterprise");
      table.string("plan_name").notNullable();
      table.decimal("amount", 14, 2).notNullable().defaultTo(0);
      table.decimal("mrr", 14, 2).notNullable().defaultTo(0);
      table.string("billing_cycle").defaultTo("Monthly"); // Monthly, Quarterly, Annual
      table.string("status").defaultTo("Active"); // Active, Trial, Paused, Cancelled
      table.date("start_date").notNullable().defaultTo(knex.fn.now());
      table.date("next_billing_date").notNullable();
      table.integer("seats").defaultTo(10);
      table.jsonb("features").defaultTo("[]");
      table.jsonb("audit_logs").defaultTo("[]");
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("subscriptions");
  await knex.schema.dropTableIfExists("invoices");
  await knex.schema.dropTableIfExists("products");
}
