import express from "express";
import { requireAdmin } from "../middleware/admin-auth.js";
import {
  getInvoices,
  createInvoice,
  updateStatus,
} from "../controllers/invoices.controller.js";

const router = express.Router();

router.get("/", requireAdmin, getInvoices);
router.post("/", requireAdmin, createInvoice);
router.patch("/:id/status", requireAdmin, updateStatus);

export default router;
