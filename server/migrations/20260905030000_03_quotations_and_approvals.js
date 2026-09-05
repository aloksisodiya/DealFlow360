/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // 1. Discount Tiers
  const hasTiers = await knex.schema.hasTable("discount_tiers");
  if (!hasTiers) {
    await knex.schema.createTable("discount_tiers", (table) => {
      table.increments("id").primary();
      table.string("customer_tier", 50).notNullable();
      table.decimal("max_discount_percent", 5, 2).notNullable();
      table.timestamps(true, true);
    });
  }

  // 2. Quotations
  const hasQuotes = await knex.schema.hasTable("quotations");
  if (!hasQuotes) {
    await knex.schema.createTable("quotations", (table) => {
      table.string("id", 50).primary();
      table.string("customer_name", 255).notNullable();
      table.string("customer_tier", 50).defaultTo("Bronze");
      table.decimal("base_amount", 12, 2).defaultTo(0);
      table.decimal("discount_percent", 5, 2).defaultTo(0);
      table.decimal("total_amount", 12, 2).notNullable().defaultTo(0);
      table.decimal("margin_percent", 5, 2).defaultTo(40.0);
      table.string("stage", 50).defaultTo("Draft");
      table.float("blended_risk_score").defaultTo(0);
      table.boolean("approval_required").defaultTo(false);
      table.string("approval_status", 100).defaultTo("Auto-Approved");
      table.integer("stalled_days").defaultTo(0);
      table.timestamp("closing_date");
      table.integer("owner_id").references("id").inTable("admins").onDelete("SET NULL");
      table.string("assigned_to", 255);
      table.text("notes");
      table.jsonb("upsell_items").defaultTo("[]");
      table.text("negotiation_request");
      table.timestamp("negotiation_requested_at");
      table.timestamp("approved_at");
      table.string("approved_by", 255);
      table.timestamps(true, true);
    });
  }

  // 3. Approval Audit Logs
  const hasAudit = await knex.schema.hasTable("approval_audit_logs");
  if (!hasAudit) {
    await knex.schema.createTable("approval_audit_logs", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50).notNullable();
      table.string("reviewer_role", 50);
      table.string("reviewer_id", 255);
      table.string("action", 50).notNullable();
      table.text("reason");
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
  await knex.schema.dropTableIfExists("quotations");
  await knex.schema.dropTableIfExists("discount_tiers");
}
