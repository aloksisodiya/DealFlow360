import express from "express";
import {
  getApprovals,
  decideApproval,
  getFulfillmentSplit,
  overrideFulfillmentSplit,
  consolidateBackorder,
  getBillingSchedule,
  calculateProration,
  issueCreditNote,
  getCreditNotes,
  getWarehouses,
  getInventory,
  allocateStock,
  transferStockAction,
  getFulfillmentOrders
} from "../controllers/finance.controller.js";

const router = express.Router();

// Warehouse & Inventory Management
router.get("/warehouses", getWarehouses);
router.get("/inventory", getInventory);
router.post("/inventory/allocate", allocateStock);
router.post("/inventory/transfer", transferStockAction);
router.get("/fulfillment/orders", getFulfillmentOrders);

// 1. Second-Level Approvals for High-Risk Discounts
router.get("/approvals", getApprovals);
router.post("/approvals/:id/decide", decideApproval);

// 2. Warehouse Fulfillment Splits & Backorders
router.get("/fulfillment/split-recommendation/:quoteId", getFulfillmentSplit);
router.post("/fulfillment/split-override", overrideFulfillmentSplit);
router.post("/fulfillment/consolidate-backorder", consolidateBackorder);

// 3. Recurring Billing Reconciliations & Credit Notes
router.get("/billing/schedule/:quoteId", getBillingSchedule);
router.post("/billing/proration", calculateProration);
router.post("/billing/credit-note", issueCreditNote);
router.get("/billing/credit-notes", getCreditNotes);

export default router;
