import bcrypt from "bcryptjs";

/**
 * Seed script for DealFlow360 platform roles:
 * - Admin: arjavdariya2@gmail.com / Arjav@123
 * - Sales Manager: rjavdariya@gmail.com / rjav@123
 * - Sales Rep: gautampa07@gmail.com / Gautam@123
 * - Finance: aloksisodiya38@gmail.com / Alok@123
 * - Sales Rep: aloksisodiya30@gmail.com / Alok30@123
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Remove old deprecated demo accounts
  const deprecatedEmails = [
    "admin@gmail.com",
    "salesrep@gmail.com",
    "salesmanager@gmail.com",
    "finance@gmail.com",
    "admin@dealflow360.local"
  ];
  
  await knex("admins").whereIn("work_email", deprecatedEmails).delete();

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
    }
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

  console.log("Successfully seeded DealFlow360 actual accounts and removed previous IDs.");
}
