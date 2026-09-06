/**
 * Migration 11 — Add customer_email and items to quotations table
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasCustomerEmail = await knex.schema.hasColumn("quotations", "customer_email");
  const hasItems = await knex.schema.hasColumn("quotations", "items");

  if (!hasCustomerEmail || !hasItems) {
    await knex.schema.alterTable("quotations", (table) => {
      if (!hasCustomerEmail) {
        table.string("customer_email", 255).nullable();
      }
      if (!hasItems) {
        table.jsonb("items").defaultTo("[]");
      }
    });
  }

  // Backfill existing rows so customer_email and portal_customer_email mirror each other
  await knex.raw(
    "UPDATE quotations SET customer_email = portal_customer_email WHERE customer_email IS NULL AND portal_customer_email IS NOT NULL"
  );
  await knex.raw(
    "UPDATE quotations SET portal_customer_email = customer_email WHERE portal_customer_email IS NULL AND customer_email IS NOT NULL"
  );
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasCustomerEmail = await knex.schema.hasColumn("quotations", "customer_email");
  const hasItems = await knex.schema.hasColumn("quotations", "items");

  if (hasCustomerEmail || hasItems) {
    await knex.schema.alterTable("quotations", (table) => {
      if (hasCustomerEmail) {
        table.dropColumn("customer_email");
      }
      if (hasItems) {
        table.dropColumn("items");
      }
    });
  }
}
