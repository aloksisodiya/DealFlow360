import express from "express";
import adminRoutes from "./admin.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import salesRoutes from "./sales.routes.js";
import financeRoutes from "./finance.routes.js";
import portalRoutes from "./portal.routes.js";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/sales", salesRoutes);
router.use("/finance", financeRoutes);
router.use("/portal", portalRoutes);

export default router;

