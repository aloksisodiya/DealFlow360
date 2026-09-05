import express from "express";
import { requireAdmin } from "../middleware/admin-auth.js";
import {
  getAlerts,
  resolveAlert,
  createAlert,
} from "../controllers/deal-health.controller.js";

const router = express.Router();

router.get("/alerts", requireAdmin, getAlerts);
router.post("/resolve", requireAdmin, resolveAlert);
router.patch("/alerts/:id/resolve", requireAdmin, resolveAlert);
router.post("/alerts", requireAdmin, createAlert);

export default router;
