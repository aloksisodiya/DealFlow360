/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("admins", (table) => {
    table.jsonb("profile").notNullable().defaultTo("{}");
  });

  await knex("admins")
    .where({ work_email: "admin@dealflow360.local" })
    .update({ role: "admin" });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable("admins", (table) => {
    table.dropColumn("profile");
  });
}
