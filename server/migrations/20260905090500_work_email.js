/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable("admins", (table) => {
    table.renameColumn("username", "work_email");
  });

  await knex("admins")
    .where({ work_email: "admin" })
    .update({ work_email: "admin@dealflow360.local" });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex("admins")
    .where({ work_email: "admin@dealflow360.local" })
    .update({ work_email: "admin" });

  await knex.schema.alterTable("admins", (table) => {
    table.renameColumn("work_email", "username");
  });
}
