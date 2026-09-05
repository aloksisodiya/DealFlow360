/**
 * Migration 07 — Portal Tokens & Customer Message Thread
 */
export async function up(knex) {
  const hasPortalToken = await knex.schema.hasColumn("quotations", "portal_token");
  if (!hasPortalToken) {
    await knex.schema.table("quotations", (table) => {
      table.uuid("portal_token").unique().nullable();
      table.string("portal_customer_email", 255).nullable();
      table.timestamp("portal_sent_at").nullable();
    });
  }

  const hasMessages = await knex.schema.hasTable("portal_messages");
  if (!hasMessages) {
    await knex.schema.createTable("portal_messages", (table) => {
      table.increments("id").primary();
      table.string("quote_id", 50).notNullable();
      table.string("sender", 50).notNullable();
      table.text("message").notNullable();
      table.boolean("is_read").defaultTo(false);
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("portal_messages");
  const hasPortalToken = await knex.schema.hasColumn("quotations", "portal_token");
  if (hasPortalToken) {
    await knex.schema.table("quotations", (table) => {
      table.dropColumn("portal_token");
      table.dropColumn("portal_customer_email");
      table.dropColumn("portal_sent_at");
    });
  }
}
