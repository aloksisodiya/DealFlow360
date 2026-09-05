/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('finance_users', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.boolean('can_issue_credit_notes').defaultTo(true); // Specific permission for accounting reconciliation
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('finance_users');
}
