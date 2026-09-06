/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (hasInvoices) {
    await knex.schema.alterTable("invoices", (table) => {
      table.decimal("base_amount", 12, 2).defaultTo(0);
      table.decimal("discount_percent", 5, 2).defaultTo(0);
      table.decimal("discount_amount", 12, 2).defaultTo(0);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasInvoices = await knex.schema.hasTable("invoices");
  if (hasInvoices) {
    await knex.schema.alterTable("invoices", (table) => {
      table.dropColumn("base_amount");
      table.dropColumn("discount_percent");
      table.dropColumn("discount_amount");
    });
  }
}
