/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('sales_managers', (table) => {
    table.increments('id').primary();
    table.string('username', 50).notNullable().unique();
    table.string('email').notNullable().unique();
    table.string('password_hash').notNullable();
    table.decimal('max_approval_limit', 5, 2).defaultTo(20.00); 
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('sales_managers');
}
