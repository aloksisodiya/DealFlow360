import express from "express";
import { requireAdmin } from "../middleware/admin-auth.js";
import {
  getAlerts,
  getRules,
  updateRules,
  resolveAlert,
  sendNudge,
  escalate,
  handleBulkAction,
  createAlert,
} from "../controllers/deal-health.controller.js";

const router = express.Router();

router.get("/alerts", requireAdmin, getAlerts);
router.get("/rules", requireAdmin, getRules);
router.post("/rules", requireAdmin, updateRules);
router.post("/nudge", requireAdmin, sendNudge);
router.post("/escalate", requireAdmin, escalate);
router.post("/bulk-action", requireAdmin, handleBulkAction);
router.post("/resolve", requireAdmin, resolveAlert);
router.patch("/alerts/:id/resolve", requireAdmin, resolveAlert);
router.post("/alerts", requireAdmin, createAlert);

export default router;
