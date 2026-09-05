import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret";

export function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ success: false, message: "Bearer token is required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = { adminId: payload.sub };
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}
