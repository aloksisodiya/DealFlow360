import { loginAdmin, signupAdmin } from "../services/admin.services.js";

function validateCredentials(username, password) {
  if (typeof username !== "string" || typeof password !== "string") {
    return "Username and password are required";
  }

  if (!/^[a-zA-Z0-9_.-]{3,50}$/.test(username)) {
    return "Username must be 3-50 characters and contain only letters, numbers, _, ., or -";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  return null;
}

export async function signup(req, res) {
  const { username, password } = req.body || {};
  const validationError = validateCredentials(username, password);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const admin = await signupAdmin(username.trim(), password);
    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: admin,
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    const status =
      error.message === "Username is already registered" ? 409 : 500;
    return res.status(status).json({ success: false, message: error.message });
  }
}

export async function login(req, res) {
  const { username, password } = req.body || {};
  const validationError = validateCredentials(username, password);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const result = await loginAdmin(username.trim(), password);
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    const status = error.message === "Admin account is inactive" ? 403 : 401;
    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
}
