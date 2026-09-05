/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable("admins", (table) => {
    table.increments("id").primary();

    table.string("username", 50).notNullable().unique();

    table.string("password_hash", 255).notNullable();

    table.boolean("must_change_password").notNullable().defaultTo(true);

    table.boolean("is_active").notNullable().defaultTo(true);

    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("admins");
};