import express from "express";
import adminRoutes from "./admin.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import salesRepRoutes from "./sales-rep.routes.js";
import salesManagerRoutes from "./sales-manager.routes.js";
import financeRoutes from "./finance.routes.js";
import portalRoutes from "./portal.routes.js";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/sales/rep", salesRepRoutes);
router.use("/sales/manager", salesManagerRoutes);
router.use("/finance", financeRoutes);
router.use("/portal", portalRoutes);

export default router;
