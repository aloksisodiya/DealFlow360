import {
  createManagedAccount,
  getAdmin,
  listManagedAccounts,
  loginAdmin,
  resetAdminCredentials,
  updateManagedAccount,
  deleteManagedAccount,
  requestPasswordReset,
  verifyAndResetPassword,
} from "../services/admin.services.js";

const MANAGED_ROLES = ["admin", "sales_rep", "sales_manager", "finance", "customer"];

function validateRoleEmail(workEmail, role) {
  // Allow all standard valid email formats (including @gmail.com, enterprise domains, etc.)
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
  try {
    const { firstName, lastName, workEmail, password, role } = req.body || {};
    const validationError = validateCredentials(workEmail, password);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || workEmail.split('@')[0];
    const accountRole = role === 'sales_rep' || role === 'admin' ? role : 'customer';

    const account = await createManagedAccount({
      workEmail,
      password,
      role: accountRole,
      profile: { name: fullName, title: 'Customer Account' }
    });

    const jwt = (await import('jsonwebtoken')).default;
    const JWT_SECRET = process.env.JWT_SECRET || 'development-only-secret';
    const token = jwt.sign(
      { sub: account.id, workEmail: account.workEmail, role: account.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: `Account created successfully for ${fullName}`,
      admin: account,
      token
    });
  } catch (error) {
    return sendError(res, error, 400);
  }
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

export async function deleteAccount(req, res) {
  try {
    await deleteManagedAccount(req.params.id);
    return res.json({ success: true, message: "Employee account deleted successfully" });
  } catch (error) {
    return sendError(res, error);
  }
}

export async function login(req, res) {
  const emailVal = req.body?.workEmail || req.body?.email;
  const { password } = req.body || {};
  const isDummyLogin =
    emailVal === "admin@dealflow360.local" && password === "admin";
  const validationError = validateCredentials(
    emailVal,
    password,
    isDummyLogin,
  );
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  try {
    const data = await loginAdmin(emailVal.trim().toLowerCase(), password);
    return res.json({
      success: true,
      message: "Login successful",
      ...data,
      data: {
        admin: data.admin,
        token: data.token,
        next: data.next,
      },
    });
  } catch (error) {
    return sendError(res, error);
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

export async function forgotPassword(req, res) {
  const { email, workEmail } = req.body || {};
  const targetEmail = email || workEmail;

  if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    return res.status(400).json({
      success: false,
      message: "A valid work email address is required.",
    });
  }

  try {
    const result = await requestPasswordReset(targetEmail);
    return res.status(200).json({
      success: true,
      message: `Password reset verification code dispatched to ${result.email} via Nodemailer.`,
      data: result,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    return res.status(error.message.includes("No account") ? 404 : 500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function resetPasswordWithToken(req, res) {
  const { email, workEmail, code, newPassword } = req.body || {};
  const targetEmail = email || workEmail;

  if (!targetEmail || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Work email, verification code, and new password are required.",
    });
  }

  try {
    const result = await verifyAndResetPassword({
      workEmail: targetEmail,
      code,
      newPassword,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Reset password with token error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

