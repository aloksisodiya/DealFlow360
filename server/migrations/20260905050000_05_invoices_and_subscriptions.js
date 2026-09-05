/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Invoices
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (!hasInvoices) {
    await knex.schema.createTable("invoices", (table) => {
      table.string("id", 50).primary();
      table.string("invoice_number", 100).notNullable().unique();
      table.string("quotation_id", 50);
      table.string("customer_name", 255).notNullable();
      table.string("customer_email", 255);
      table.decimal("amount", 12, 2).notNullable().defaultTo(0);
      table.string("status", 50).defaultTo("Draft");
      table.timestamp("issue_date").defaultTo(knex.fn.now());
      table.string("due_date", 50);
      table.string("payment_method", 100).defaultTo("ACH Wire");
      table.string("payment_batch", 100);
      table.jsonb("items").defaultTo("[]");
      table.text("notes");
      table.timestamps(true, true);
    });
  }

  // 2. Subscriptions
  const hasSubs = await knex.schema.hasTable("subscriptions");
  if (!hasSubs) {
    await knex.schema.createTable("subscriptions", (table) => {
      table.string("id", 50).primary();
      table.string("subscription_code", 100).notNullable().unique();
      table.string("customer_name", 255).notNullable();
      table.string("tier", 50).defaultTo("Enterprise");
      table.string("plan_name", 255).notNullable();
      table.decimal("amount", 12, 2).notNullable().defaultTo(0);
      table.decimal("mrr", 12, 2).notNullable().defaultTo(0);
      table.string("billing_cycle", 50).defaultTo("Monthly");
      table.string("status", 50).defaultTo("Active");
      table.timestamp("start_date").defaultTo(knex.fn.now());
      table.string("next_billing_date", 50);
      table.integer("seats").defaultTo(10);
      table.jsonb("features").defaultTo("[]");
      table.jsonb("audit_logs").defaultTo("[]");
      table.timestamps(true, true);
    });
  }

  // 3. Credit Notes
  const hasCreditNotes = await knex.schema.hasTable("credit_notes");
  if (!hasCreditNotes) {
    await knex.schema.createTable("credit_notes", (table) => {
      table.string("id", 50).primary();
      table.string("quote_id", 50);
      table.string("customer_name", 255).notNullable();
      table.decimal("amount", 12, 2).notNullable().defaultTo(0);
      table.text("reason");
      table.string("type", 100).defaultTo("Subscription Refund");
      table.string("status", 50).defaultTo("Reconciled");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("credit_notes");
  await knex.schema.dropTableIfExists("subscriptions");
  await knex.schema.dropTableIfExists("invoices");
}
