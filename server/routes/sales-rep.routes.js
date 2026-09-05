import express from "express";
import {
  createQuote,
  getQuotes,
  negotiate,
  sendPortalLink,
  postSalesRepReply,
  getQuoteMessages,
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

// Portal link generation (sales rep sends invite to customer)
router.post("/quotations/:id/send-portal", ...salesRepAccess, sendPortalLink);

// Sales rep view & reply to customer messages (authenticated)
router.get("/quotations/:id/messages", ...salesRepAccess, getQuoteMessages);
router.post("/quotations/:id/reply", ...salesRepAccess, postSalesRepReply);

export default router;
