/**
 * Knex Migration: Database Schema for Finance/Operations User & Customer Portal User Roles
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Warehouses Table
  const hasWarehouses = await knex.schema.hasTable("warehouses");
  if (!hasWarehouses) {
    await knex.schema.createTable("warehouses", (table) => {
      table.string("id", 50).primary(); // wh-main, wh-east
      table.string("name", 255).notNullable();
      table.string("location", 255).notNullable();
      table.float("shipping_cost_weight").notNullable().defaultTo(1.0);
      table.timestamps(true, true);
    });
  }

  // 2. Warehouse Inventory Table
  const hasInventory = await knex.schema.hasTable("warehouse_inventory");
  if (!hasInventory) {
    await knex.schema.createTable("warehouse_inventory", (table) => {
      table.increments("id").primary();
      table.string("warehouse_id", 50).notNullable();
      table.string("product_id", 50).notNullable();
      table.string("product_name", 255).notNullable();
      table.integer("stock_qty").notNullable().defaultTo(0);
      table.timestamps(true, true);
    });
  }

  // 3. Quotation Fulfillment Splits Table
  const hasSplits = await knex.schema.hasTable("quotation_fulfillment_splits");
  if (!hasSplits) {
    await knex.schema.createTable("quotation_fulfillment_splits", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50).notNullable();
      table.string("warehouse_id", 50).notNullable();
      table.string("product_id", 50).notNullable();
      table.integer("allocated_qty").notNullable().defaultTo(0);
      table.integer("backorder_qty").notNullable().defaultTo(0);
      table.string("status", 50).notNullable().defaultTo("Allocated");
      table.timestamps(true, true);
    });
  }

  // 4. Credit Notes & Billing Reconciliations Table
  const hasCreditNotes = await knex.schema.hasTable("credit_notes");
  if (!hasCreditNotes) {
    await knex.schema.createTable("credit_notes", (table) => {
      table.string("id", 50).primary(); // CN-1001
      table.string("quote_id", 50).notNullable();
      table.string("customer_name", 255).notNullable();
      table.decimal("amount", 14, 2).notNullable().defaultTo(0.00);
      table.string("reason", 255).notNullable();
      table.string("type", 100).notNullable().defaultTo("Subscription Refund");
      table.string("status", 50).notNullable().defaultTo("Reconciled");
      table.timestamps(true, true);
    });
  }

  // 5. Customer Portal Line Comments & Questions Table
  const hasComments = await knex.schema.hasTable("portal_line_comments");
  if (!hasComments) {
    await knex.schema.createTable("portal_line_comments", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50).notNullable();
      table.string("line_item_id", 50).nullable();
      table.string("sender_role", 50).notNullable().defaultTo("Customer"); // Customer, Sales Rep, Finance
      table.text("comment_text").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }

  // 6. Approval Audit Logs Table
  const hasAuditLogs = await knex.schema.hasTable("approval_audit_logs");
  if (!hasAuditLogs) {
    await knex.schema.createTable("approval_audit_logs", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50).notNullable();
      table.string("reviewer_role", 50).notNullable(); // Sales Manager, Finance, Customer
      table.string("reviewer_id", 100).nullable();
      table.string("action", 50).notNullable(); // APPROVE, REJECT, RETURN_FOR_REVISION, COUNTER_PROPOSAL
      table.text("reason").nullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("approval_audit_logs");
  await knex.schema.dropTableIfExists("portal_line_comments");
  await knex.schema.dropTableIfExists("credit_notes");
  await knex.schema.dropTableIfExists("quotation_fulfillment_splits");
  await knex.schema.dropTableIfExists("warehouse_inventory");
  await knex.schema.dropTableIfExists("warehouses");
}
