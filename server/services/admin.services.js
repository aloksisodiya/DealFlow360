import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret";

function toAdminResponse(admin) {
  return {
    id: admin.id,
    workEmail: admin.work_email,
    mustChangePassword: admin.must_change_password,
    isActive: admin.is_active,
  };
}

function createToken(admin) {
  return jwt.sign({ sub: admin.id, workEmail: admin.work_email }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  });
}

export async function signupAdmin(workEmail, password) {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [admin] = await db("admins")
      .insert({
        work_email: workEmail,
        password_hash: passwordHash,
        must_change_password: false,
        is_active: true,
      })
      .returning(["id", "work_email", "must_change_password", "is_active"]);

    return toAdminResponse(admin);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Work email is already registered");
    }
    throw error;
  }
}

export async function loginAdmin(workEmail, password) {
  const admin = await db("admins").where({ work_email: workEmail }).first();

  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
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
      .returning(["id", "work_email", "must_change_password", "is_active"]);

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
