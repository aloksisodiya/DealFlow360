import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret";

function hasRoleEmailFormat(workEmail, role) {
  if (role === "admin") return true;
  return new RegExp(`^[^\\s@]+@${role}\\.com$`, "i").test(workEmail);
}

function toAdminResponse(admin) {
  return {
    id: admin.id,
    workEmail: admin.work_email,
    mustChangePassword: admin.must_change_password,
    isActive: admin.is_active,
    role: admin.role,
    profile: admin.profile || {},
  };
}

function createToken(admin) {
  return jwt.sign(
    { sub: admin.id, workEmail: admin.work_email, role: admin.role },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
  );
}

export async function createManagedAccount({
  workEmail,
  password,
  role,
  profile = {},
}) {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [admin] = await db("admins")
      .insert({
        work_email: workEmail,
        password_hash: passwordHash,
        must_change_password: true,
        is_active: true,
        role,
        profile: JSON.stringify(profile),
      })
      .returning([
        "id",
        "work_email",
        "must_change_password",
        "is_active",
        "role",
        "profile",
      ]);

    return toAdminResponse(admin);
  } catch (error) {
    if (error.code === "23505")
      throw new Error("Work email is already registered");
    throw error;
  }
}

export async function signupAdmin() {
  throw new Error(
    "Public signup is disabled. Ask a platform admin to create your account.",
  );
}

export async function loginAdmin(workEmail, password) {
  const admin = await db("admins").where({ work_email: workEmail }).first();

  if (
    !admin ||
    !hasRoleEmailFormat(workEmail, admin.role) ||
    !(await bcrypt.compare(password, admin.password_hash))
  ) {
    throw new Error("Invalid work email or password");
  }

  if (!admin.is_active) {
    throw new Error("Admin account is inactive");
  }

  return {
    admin: toAdminResponse(admin),
    token: createToken(admin),
    next: admin.must_change_password ? "reset-credentials" : "dashboard",
  };
}

export async function resetAdminCredentials(adminId, workEmail, password) {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [admin] = await db("admins")
      .where({ id: adminId })
      .update({
        work_email: workEmail,
        password_hash: passwordHash,
        must_change_password: false,
      })
      .returning([
        "id",
        "work_email",
        "must_change_password",
        "is_active",
        "role",
        "profile",
      ]);

    if (!admin) {
      throw new Error("Admin account not found");
    }

    return {
      admin: toAdminResponse(admin),
      token: createToken(admin),
      next: "dashboard",
    };
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Work email is already registered");
    }
    throw error;
  }
}

export async function getAdmin(adminId) {
  const admin = await db("admins").where({ id: adminId }).first();
  if (!admin) {
    throw new Error("Admin account not found");
  }
  return toAdminResponse(admin);
}

export async function listManagedAccounts() {
  return db("admins")
    .select(
      "id",
      "work_email",
      "role",
      "profile",
      "is_active",
      "must_change_password",
      "created_at",
    )
    .orderBy("created_at", "desc");
}

export async function updateManagedAccount(accountId, changes) {
  const update = {};
  if (changes.role) update.role = changes.role;
  if (changes.profile) update.profile = JSON.stringify(changes.profile);
  if (typeof changes.isActive === "boolean")
    update.is_active = changes.isActive;
  if (changes.password)
    update.password_hash = await bcrypt.hash(changes.password, 12);

  const [account] = await db("admins")
    .where({ id: accountId })
    .update(update)
    .returning([
      "id",
      "work_email",
      "role",
      "profile",
      "is_active",
      "must_change_password",
    ]);
  if (!account) throw new Error("Managed account not found");
  return toAdminResponse(account);
}
