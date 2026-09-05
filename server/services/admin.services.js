import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret";

function toAdminResponse(admin) {
  return {
    id: admin.id,
    username: admin.username,
    mustChangePassword: admin.must_change_password,
    isActive: admin.is_active,
  };
}

export async function signupAdmin(username, password) {
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [admin] = await db("admins")
      .insert({
        username,
        password_hash: passwordHash,
        must_change_password: false,
        is_active: true,
      })
      .returning(["id", "username", "must_change_password", "is_active"]);

    return toAdminResponse(admin);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Username is already registered");
    }

    throw error;
  }
}

export async function loginAdmin(username, password) {
  const admin = await db("admins").where({ username }).first();

  if (!admin) {
    throw new Error("Invalid username or password");
  }

  if (!admin.is_active) {
    throw new Error("Admin account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

  if (!isPasswordValid) {
    throw new Error("Invalid username or password");
  }

  const token = jwt.sign(
    { sub: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
  );

  return {
    admin: toAdminResponse(admin),
    token,
  };
}
