/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  return knex.schema.createTable('customers', (table) => {
    table.increments('id').primary();
    table.string('company_name').notNullable();
    table.string('contact_name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password_hash'); 
    table.string('customer_tier', 20).defaultTo('Bronze'); 
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
}

export async function down(knex) {
  return knex.schema.dropTableIfExists('customers');
}
