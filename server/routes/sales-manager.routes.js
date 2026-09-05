import express from "express";
import {
  decide,
  getApprovals,
  getTiers,
  updateTier,
} from "../controllers/sales-manager.controller.js";
import { requireAdmin, requireRole } from "../middleware/admin-auth.js";

const router = express.Router();
const managerAccess = [requireAdmin, requireRole("admin", "sales_manager")];

router.get("/approvals", ...managerAccess, getApprovals);
router.patch("/approvals/:id", ...managerAccess, decide);
router.get("/discount-tiers", ...managerAccess, getTiers);
router.patch("/discount-tiers/:id", ...managerAccess, updateTier);

export default router;
