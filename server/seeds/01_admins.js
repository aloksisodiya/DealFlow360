import bcrypt from "bcryptjs";

/**
 * Seed 01: Core Team Accounts & Roles
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  const usersToSeed = [
    {
      work_email: "arjavdariya2@gmail.com",
      password: "Arjav@123",
      role: "admin",
      profile: { name: "Arjav Dariya", title: "Chief Executive & Platform Admin" },
    },
    {
      work_email: "rjavdariya@gmail.com",
      password: "rjav@123",
      role: "sales_manager",
      profile: { name: "Rjav Dariya", title: "VP of Enterprise Sales" },
    },
    {
      work_email: "gautampa07@gmail.com",
      password: "Gautam@123",
      role: "sales_rep",
      profile: { name: "Gautam Patil", title: "Senior Sales Representative" },
    },
    {
      work_email: "aloksisodiya38@gmail.com",
      password: "Alok@123",
      role: "finance",
      profile: { name: "Alok Sisodiya", title: "Head of Corporate Finance & FP&A" },
    },
    {
      work_email: "aloksisodiya30@gmail.com",
      password: "Alok30@123",
      role: "sales_rep",
      profile: { name: "Alok Sisodiya (Sales)", title: "Enterprise Account Executive" },
    },
  ];

  for (const user of usersToSeed) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await knex("admins")
      .insert({
        work_email: user.work_email,
        password_hash: passwordHash,
        must_change_password: false,
        is_active: true,
        role: user.role,
        profile: JSON.stringify(user.profile),
      })
      .onConflict("work_email")
      .merge({
        password_hash: passwordHash,
        must_change_password: false,
        is_active: true,
        role: user.role,
        profile: JSON.stringify(user.profile),
      });
  }

  console.log("✅ Seed 01: Core Admins & Team Accounts populated.");
}
