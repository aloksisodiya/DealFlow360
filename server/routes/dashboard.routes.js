import express from "express";
import {
  getOverview,
  getActivities,
  getDealHealth,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/overview", getOverview);
router.get("/activities", getActivities);
router.get("/deal-health", getDealHealth);

export default router;
