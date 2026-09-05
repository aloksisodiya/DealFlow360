import bcrypt from "bcryptjs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await knex("admins")
    .insert({
      username: "admin",
      password_hash: passwordHash,
      must_change_password: true,
      is_active: true,
    })
    .onConflict("username")
    .merge({
      password_hash: passwordHash,
      must_change_password: true,
      is_active: true,
    });
}
