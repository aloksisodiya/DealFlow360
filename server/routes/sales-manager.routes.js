import express from "express";
import {
  createApproval,
  decide,
  getApprovals,
  getTiers,
  updateTier,
} from "../controllers/sales-manager.controller.js";
import { requireAdmin, requireRole } from "../middleware/admin-auth.js";

const router = express.Router();
const managerAccess = [requireAdmin, requireRole("admin", "sales_manager", "sales_rep")];

router.get("/approvals", ...managerAccess, getApprovals);
router.post("/approvals", ...managerAccess, createApproval);
router.patch("/approvals/:id", ...managerAccess, decide);
router.get("/discount-tiers", ...managerAccess, getTiers);
router.patch("/discount-tiers/:id", ...managerAccess, updateTier);

export default router;
