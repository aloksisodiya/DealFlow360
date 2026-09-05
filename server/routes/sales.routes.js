import express from "express";
import {
  approvals,
  createQuote,
  decide,
  getQuotes,
  getTiers,
  negotiate,
  updateTier,
} from "../controllers/sales.controller.js";
import { requireAdmin, requireRole } from "../middleware/admin-auth.js";

const router = express.Router();
const authenticated = [requireAdmin];
const salesRep = [
  requireAdmin,
  requireRole("admin", "sales_rep", "sales_manager"),
];
const manager = [requireAdmin, requireRole("admin", "sales_manager")];

router.get("/quotations", ...authenticated, getQuotes);
router.post("/quotations", ...salesRep, createQuote);
router.post("/quotations/:id/negotiation", ...salesRep, negotiate);
router.get("/approvals", ...manager, approvals);
router.get("/discount-tiers", ...manager, getTiers);
router.patch("/approvals/:id", ...manager, decide);
router.patch("/discount-tiers/:id", ...manager, updateTier);

export default router;
