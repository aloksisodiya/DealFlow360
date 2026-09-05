import express from "express";
import {
  getPortalQuotation,
  createLineComment,
  getLineComments,
  submitCounterProposal,
  confirmTerms
} from "../controllers/portal.controller.js";

const router = express.Router();

// 1. Restricted Online Quotation Viewing
router.get("/quotations/:id", getPortalQuotation);

// 2. Line Level Comments & Questions
router.post("/quotations/:id/comments", createLineComment);
router.get("/quotations/:id/comments", getLineComments);

// 3. Counter Discount Proposals
router.post("/quotations/:id/counter-proposal", submitCounterProposal);

// 4. One-Click Terms Confirmation
router.post("/quotations/:id/confirm", confirmTerms);

export default router;
