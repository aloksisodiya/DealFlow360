import jwt from "jsonwebtoken";
import db from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret";

export async function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ success: false, message: "Bearer token is required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const admin = await db("admins")
      .where({ id: payload.sub, is_active: true })
      .first();
    if (!admin) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Admin account is inactive or missing",
        });
    }
    req.auth = {
      adminId: admin.id,
      role: admin.role,
      workEmail: admin.work_email,
    };
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth?.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Insufficient role permissions" });
    }
    return next();
  };
}
