import express from "express";
import { requireAdmin } from "../middleware/admin-auth.js";
import { getPipelineReports } from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/pipeline", requireAdmin, getPipelineReports);

export default router;
