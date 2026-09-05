import express from "express";
import {
  createQuote,
  getQuotes,
  negotiate,
} from "../controllers/sales-rep.controller.js";
import { requireAdmin, requireRole } from "../middleware/admin-auth.js";

const router = express.Router();
const salesRepAccess = [
  requireAdmin,
  requireRole("admin", "sales_rep", "sales_manager"),
];

router.get("/quotations", ...salesRepAccess, getQuotes);
router.post("/quotations", ...salesRepAccess, createQuote);
router.post("/quotations/:id/negotiation", ...salesRepAccess, negotiate);

export default router;
