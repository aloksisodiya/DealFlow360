import express from "express";
import adminRoutes from "./admin.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import salesRepRoutes from "./sales-rep.routes.js";
import salesManagerRoutes from "./sales-manager.routes.js";
import productsRoutes from "./products.routes.js";
import invoicesRoutes from "./invoices.routes.js";
import subscriptionsRoutes from "./subscriptions.routes.js";
import dealHealthRoutes from "./deal-health.routes.js";
import reportsRoutes from "./reports.routes.js";
import financeRoutes from "./finance.routes.js";
import portalRoutes from "./portal.routes.js";

const router = express.Router();

router.use("/admin", adminRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/sales/rep", salesRepRoutes);
router.use("/sales/manager", salesManagerRoutes);
router.use("/sales", salesRepRoutes);
router.use("/products", productsRoutes);
router.use("/invoices", invoicesRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/deal-health", dealHealthRoutes);
router.use("/reports", reportsRoutes);
router.use("/finance", financeRoutes);
router.use("/portal", portalRoutes);

export default router;
