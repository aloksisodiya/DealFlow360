import express from "express";
import {
  getOverview,
  getActivities,
  getDealHealth,
} from "../controllers/dashboard.controller.js";
import { requireAdmin, requireRole } from "../middleware/admin-auth.js";

const router = express.Router();

router.get("/overview", requireAdmin, getOverview);
router.get("/metrics", requireAdmin, getOverview);
router.get("/activities", requireAdmin, getActivities);
router.get(
  "/deal-health",
  requireAdmin,
  requireRole("admin", "sales_manager"),
  getDealHealth,
);

export default router;
