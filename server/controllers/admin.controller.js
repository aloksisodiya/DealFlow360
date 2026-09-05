import {
  createManagedAccount,
  getAdmin,
  listManagedAccounts,
  loginAdmin,
  resetAdminCredentials,
  updateManagedAccount,
} from "../services/admin.services.js";

const MANAGED_ROLES = ["sales_rep", "sales_manager", "finance", "customer"];

function validateRoleEmail(workEmail, role) {
  if (role === "admin") return null;
  const expectedFormat = new RegExp(`^[^\\s@]+@${role}\\.com$`, "i");
  if (!expectedFormat.test(workEmail)) {
    return `Work email for ${role} must use this format: name@${role}.com`;
  }
  return null;
}

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
  return res.status(403).json({
    success: false,
    message:
      "Public signup is disabled. Ask a platform admin to create your account.",
  });
}

export async function createAccount(req, res) {
  const { workEmail, password, role, profile = {} } = req.body || {};
  const validationError = validateCredentials(workEmail, password);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    if (!MANAGED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${MANAGED_ROLES.join(", ")}`,
      });
    }
    const roleEmailError = validateRoleEmail(workEmail.trim(), role);
    if (roleEmailError) {
      return res.status(400).json({ success: false, message: roleEmailError });
    }
    const admin = await createManagedAccount({
      workEmail: workEmail.trim().toLowerCase(),
      password,
      role,
      profile,
    });
    return res
      .status(201)
      .json({ success: true, message: "Account created", data: admin });
  } catch (error) {
    console.error("Managed account creation error:", error);
    return sendError(res, error);
  }
}

export async function getAccounts(req, res) {
  return res.json({ success: true, data: await listManagedAccounts() });
}

export async function updateAccount(req, res) {
  try {
    const { role, profile, password, isActive } = req.body || {};
    if (role && !MANAGED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid managed role" });
    }
    return res.json({
      success: true,
      data: await updateManagedAccount(req.params.id, {
        role,
        profile,
        password,
        isActive,
      }),
    });
  } catch (error) {
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

  const roleEmailError = validateRoleEmail(workEmail.trim(), req.auth.role);
  if (roleEmailError) {
    return res.status(400).json({ success: false, message: roleEmailError });
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
