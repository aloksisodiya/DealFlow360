import express from "express";
import {
  login,
  me,
  resetCredentials,
  signup,
  createAccount,
  getAccounts,
  updateAccount,
  forgotPassword,
  resetPasswordWithToken,
} from "../controllers/admin.controller.js";
import { requireAdmin, requireRole } from "../middleware/admin-auth.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithToken);
router.patch("/reset-credentials", requireAdmin, resetCredentials);
router.get("/me", requireAdmin, me);
router.post("/accounts", requireAdmin, requireRole("admin"), createAccount);
router.get("/accounts", requireAdmin, requireRole("admin"), getAccounts);
router.patch(
  "/accounts/:id",
  requireAdmin,
  requireRole("admin"),
  updateAccount,
);

// Dashboard routes for Admin role
router.use("/dashboard", dashboardRoutes);

export default router;
