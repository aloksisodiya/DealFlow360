import {
  getAdmin,
  loginAdmin,
  resetAdminCredentials,
  signupAdmin,
} from "../services/admin.services.js";

function validateCredentials(workEmail, password, allowDummyPassword = false) {
  if (typeof workEmail !== "string" || typeof password !== "string") {
    return "Work email and password are required";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail)) {
    return "A valid work email is required";
  }
  if (password.length < 8 && !allowDummyPassword) {
    return "Password must be at least 8 characters";
  }
  return null;
}

function sendError(res, error, fallbackStatus = 500) {
  const knownStatuses = {
    "Admin account is inactive": 403,
    "Admin account not found": 404,
    "Invalid work email or password": 401,
    "Work email is already registered": 409,
  };
  return res.status(knownStatuses[error.message] || fallbackStatus).json({
    success: false,
    message: error.message,
  });
}

export async function signup(req, res) {
  const { workEmail, password } = req.body || {};
  const validationError = validateCredentials(workEmail, password);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const admin = await signupAdmin(workEmail.trim().toLowerCase(), password);
    return res
      .status(201)
      .json({ success: true, message: "Signup successful", data: admin });
  } catch (error) {
    console.error("Admin signup error:", error);
    return sendError(res, error);
  }
}

export async function login(req, res) {
  const { workEmail, password } = req.body || {};
  const isDummyLogin =
    workEmail === "admin@dealflow360.local" && password === "admin";
  const validationError = validateCredentials(
    workEmail,
    password,
    isDummyLogin,
  );
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const result = await loginAdmin(workEmail.trim().toLowerCase(), password);
    return res
      .status(200)
      .json({ success: true, message: "Login successful", data: result });
  } catch (error) {
    console.error("Admin login error:", error);
    return sendError(res, error, 401);
  }
}

export async function resetCredentials(req, res) {
  const { workEmail, password } = req.body || {};
  const validationError = validateCredentials(workEmail, password);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const result = await resetAdminCredentials(
      req.auth.adminId,
      workEmail.trim().toLowerCase(),
      password,
    );
    return res
      .status(200)
      .json({ success: true, message: "Credentials updated", data: result });
  } catch (error) {
    console.error("Admin credential reset error:", error);
    return sendError(res, error);
  }
}

export async function me(req, res) {
  try {
    return res.json({ success: true, data: await getAdmin(req.auth.adminId) });
  } catch (error) {
    return sendError(res, error);
  }
}
