import express from "express";
import adminRoutes from "./admin.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;

