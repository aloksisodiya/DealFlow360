import express from "express";
import {
  getPortalQuotation,
  getMessages,
  postMessage,
  counterDiscount,
  confirmOrder,
} from "../controllers/portal.controller.js";

const router = express.Router();

// All routes are PUBLIC (no auth middleware) — accessed via unique portal_token
// Token is in the URL path: /api/portal/q/:token

router.get("/q/:token",                  getPortalQuotation);
router.get("/q/:token/messages",         getMessages);
router.post("/q/:token/messages",        postMessage);
router.post("/q/:token/counter",         counterDiscount);
router.post("/q/:token/confirm",         confirmOrder);

export default router;
