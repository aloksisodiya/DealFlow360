/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const exists = await knex.schema.hasTable("admins");
  if (!exists) {
    await knex.schema.createTable("admins", (table) => {
      table.increments("id").primary();
      table.string("work_email", 255).notNullable().unique();
      table.string("password_hash", 255).notNullable();
      table.string("role", 50).notNullable().defaultTo("sales_rep");
      table.boolean("is_active").defaultTo(true);
      table.boolean("must_change_password").defaultTo(false);
      table.jsonb("profile").defaultTo("{}");
      table.timestamps(true, true);
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("admins");
}
