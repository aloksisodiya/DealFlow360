import express from "express";
import { requireAdmin } from "../middleware/admin-auth.js";
import {
  getSubscriptions,
  createSubscription,
  updateStatus,
} from "../controllers/subscriptions.controller.js";

const router = express.Router();

router.get("/", requireAdmin, getSubscriptions);
router.post("/", requireAdmin, createSubscription);
router.patch("/:id/status", requireAdmin, updateStatus);

export default router;
