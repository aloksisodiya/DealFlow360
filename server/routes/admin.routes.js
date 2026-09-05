import express from "express";
import {
  login,
  me,
  resetCredentials,
  signup,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/admin-auth.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.patch("/reset-credentials", requireAdmin, resetCredentials);
router.get("/me", requireAdmin, me);

// Dashboard routes for Admin role
router.use("/dashboard", dashboardRoutes);

export default router;

