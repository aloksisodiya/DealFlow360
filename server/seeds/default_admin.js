import bcrypt from "bcryptjs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const passwordHash = await bcrypt.hash("admin", 12);

  await knex("admins")
    .insert({
      work_email: "admin@dealflow360.local",
      password_hash: passwordHash,
      must_change_password: true,
      is_active: true,
    })
    .onConflict("work_email")
    .merge({
      password_hash: passwordHash,
      must_change_password: true,
      is_active: true,
    });
}
