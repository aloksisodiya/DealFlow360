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
router.get("/stats", requireAdmin, getOverview);       // alias for /metrics
router.get("/activities", requireAdmin, getActivities);
router.get("/deal-health", requireAdmin, getDealHealth);
router.get("/health-alerts", requireAdmin, getDealHealth); // alias for /deal-health

export default router;
