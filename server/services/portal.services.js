import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { getUpsellSuggestions } from "./upsell.services.js";

/**
 * DealFlow360 — Token-Based Customer Portal Service
 * All functions use portal_token (UUID) so no authentication is needed on the customer side.
 */

// ──────────────────────────────────────────────────────────────────────
// 1. GENERATE & ATTACH PORTAL TOKEN TO A QUOTATION
// ──────────────────────────────────────────────────────────────────────
export async function generatePortalToken(quoteId, customerEmail) {
  const token = uuidv4();
  await db("quotations").where({ id: quoteId }).update({
    portal_token: token,
    portal_customer_email: customerEmail,
    portal_sent_at: db.fn.now(),
  });
  return token;
}

// ──────────────────────────────────────────────────────────────────────
// 2. GET QUOTATION BY TOKEN (public — no auth)
// ──────────────────────────────────────────────────────────────────────
export async function getQuotationByToken(token) {
  const quote = await db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .where("q.portal_token", token)
    .select("q.*", "a.work_email as owner_email", "a.role as owner_role", "a.profile as owner_profile")
    .first();

  if (!quote) throw new Error("Invalid or expired portal link");
  if (String(quote.stage || "").toLowerCase() === "draft") {
    throw new Error("This quotation is currently in Draft stage and has not been sent for final approval yet.");
  }

  let upsellSuggestions = [];
  if (quote.stage === "Confirmed") {
    try {
      const { getUpsellSuggestions } = await import("./upsell.services.js");
      upsellSuggestions = await getUpsellSuggestions(quote.id);
    } catch (e) {
      console.warn("[getQuotationByToken] Could not fetch upsell suggestions:", e.message);
    }
  }

  const ownerProfile = typeof quote.owner_profile === "string"
    ? JSON.parse(quote.owner_profile || "{}")
    : (quote.owner_profile || {});
  const repName = ownerProfile.name || quote.owner_email?.split("@")[0] || "Your Sales Executive";

  const rawRole = (quote.owner_role || "").toLowerCase();
  const ownerEmailStr = (quote.owner_email || "").toLowerCase();
  const repNameLower = String(repName || "").toLowerCase();
  const isManager = rawRole.includes("manager") || rawRole.includes("approver") || rawRole.includes("admin") || ownerEmailStr.includes("rjav") || ownerEmailStr.includes("arjav") || repNameLower.includes("rjav") || repNameLower.includes("arjav");
  const ownerRoleTitle = isManager ? "Sales Manager" : "Sales Representative";

  const totalAmt = Number(quote.total_amount || 0);
  const discPct = Number(quote.discount_percent || 0);
  let baseAmt = Number(quote.base_amount || 0);
  if (baseAmt <= 0 || (discPct > 0 && baseAmt === totalAmt)) {
    if (discPct > 0 && discPct < 100) {
      baseAmt = Number((totalAmt / (1 - discPct / 100)).toFixed(2));
    } else {
      baseAmt = totalAmt;
    }
  }

  // Fetch live warehouse inventory summary
  let warehouseStockTotal = 0;
  let warehouseBreakdown = [];
  try {
    const inv = await db("warehouse_inventory as wi")
      .leftJoin("warehouses as w", "wi.warehouse_id", "w.id")
      .select("wi.product_name", "wi.stock_qty", "w.name as warehouse_name");
    warehouseStockTotal = inv.reduce((sum, i) => sum + Number(i.stock_qty || 0), 0);
    warehouseBreakdown = inv;
  } catch (err) {
    console.warn("[getQuotationByToken] Could not fetch inventory:", err.message);
  }

  let lineItems = [];
  let parsedUpsell = [];
  if (typeof quote.upsell_items === "string" && quote.upsell_items) {
    try { parsedUpsell = JSON.parse(quote.upsell_items); } catch {}
  } else if (Array.isArray(quote.upsell_items)) {
    parsedUpsell = quote.upsell_items;
  }

  if (Array.isArray(quote.items) && quote.items.length > 0) {
    lineItems = quote.items;
  } else if (parsedUpsell && parsedUpsell.length > 0) {
    lineItems = parsedUpsell;
  } else {
    lineItems = [
      {
        id: "item-1",
        name: quote.notes || "Enterprise Solution Package",
        category: "Hardware & Platform",
        quantity: 1,
        unitPrice: baseAmt,
        totalPrice: totalAmt,
        inStock: true,
        warehouseAvailability: "Main Warehouse (In Stock), East Depot",
      }
    ];
  }

  return {
    id: quote.id,
    customerName: quote.customer_name,
    customerTier: quote.customer_tier,
    totalAmount: totalAmt,
    baseAmount: baseAmt,
    discountPercent: discPct,
    stage: quote.stage,
    approvalStatus: quote.approval_status,
    approvalRequired: quote.approval_required,
    canConfirm: !["Confirmed", "Cancelled"].includes(quote.stage),
    ownerName: repName,
    ownerRole: ownerRoleTitle,
    ownerEmail: quote.owner_email || "",
    notes: quote.notes || "",
    items: lineItems,
    warehouseStockTotal,
    warehouseBreakdown,
    createdAt: quote.created_at,
    upsellSuggestions,
  };
}

// ──────────────────────────────────────────────────────────────────────
// 3. PORTAL MESSAGE THREAD (Customer <-> SalesRep)
// ──────────────────────────────────────────────────────────────────────
export async function getPortalMessages(token) {
  const quote = await db("quotations").where({ portal_token: token }).select("id").first();
  if (!quote) throw new Error("Invalid portal token");

  return getPortalMessagesByQuoteId(quote.id);
}

export async function getPortalMessagesByQuoteId(quoteId) {
  const messages = await db("portal_messages")
    .where({ quote_id: quoteId })
    .orderBy("created_at", "asc");

  return messages.map((m) => ({
    id: m.id,
    sender: m.sender,
    message: m.message,
    isRead: m.is_read,
    createdAt: m.created_at,
  }));
}

export async function addPortalMessage(token, sender, message) {
  if (!message || message.trim() === "") throw new Error("Message cannot be empty");

  const quote = await db("quotations").where({ portal_token: token }).select("id").first();
  if (!quote) throw new Error("Invalid portal token");

  const senderType = sender || "Customer";

  const [msg] = await db("portal_messages").insert({
    quote_id: quote.id,
    sender: senderType,
    message: message.trim(),
  }).returning("*");

  if (senderType.toLowerCase().includes("customer")) {
    await db("quotations").where({ id: quote.id }).update({
      stage: "Under Negotiation",
      negotiation_request: message.trim(),
      negotiation_requested_at: db.fn.now(),
      updated_at: db.fn.now(),
    });
  }

  return msg;
}

// Allow sales rep to reply via internal ID
export async function addSalesRepReply(quoteId, message) {
  if (!message || message.trim() === "") throw new Error("Message cannot be empty");
  const [msg] = await db("portal_messages").insert({
    quote_id: quoteId,
    sender: "SalesRep",
    message: message.trim(),
  }).returning("*");
  return msg;
}

export async function getUnreadCount(quoteId) {
  const result = await db("portal_messages")
    .where({ quote_id: quoteId, sender: "Customer", is_read: false })
    .count("id as count")
    .first();
  return Number(result?.count || 0);
}

// ──────────────────────────────────────────────────────────────────────
// 4. COUNTER DISCOUNT PROPOSAL (customer proposes different %)
// ──────────────────────────────────────────────────────────────────────
export async function counterDiscountByToken(token, proposedDiscountPercent, note) {
  const proposed = Number(proposedDiscountPercent);
  if (isNaN(proposed) || proposed < 0 || proposed > 80) {
    throw new Error("Proposed discount must be between 0% and 80%");
  }

  const quote = await db("quotations").where({ portal_token: token }).first();
  if (!quote) throw new Error("Invalid portal token");

  const requiresApproval = proposed > 10;
  const newStage = "Under Negotiation";
  const approvalStatus = proposed > 15 ? "Pending Finance Review" : "Pending Manager Review";
  const reqText = `Customer requested ${proposed}% discount.${note ? ` Note: ${note}` : ""}`;

  await db("quotations").where({ id: quote.id }).update({
    stage: newStage,
    negotiation_request: reqText,
    negotiation_requested_at: db.fn.now(),
    approval_required: requiresApproval,
    approval_status: requiresApproval ? approvalStatus : quote.approval_status,
    updated_at: db.fn.now(),
  });

  // Log to message thread
  await db("portal_messages").insert({
    quote_id: quote.id,
    sender: "Customer",
    message: `Counter proposal: requesting ${proposed}% discount.${note ? ` Note: ${note}` : ""}`,
  });

  // Audit log
  try {
    await db("approval_audit_logs").insert({
      quote_id: quote.id,
      reviewer_role: "Customer",
      action: "COUNTER_PROPOSAL",
      reason: `Customer counter discount: ${proposed}%. Note: ${note || "none"}`,
    });
  } catch {}

  return {
    quoteId: quote.id,
    proposedDiscountPercent: proposed,
    newStage,
    requiresApproval,
    message: requiresApproval
      ? `Your ${proposed}% counter proposal has been sent for manager review.`
      : `Your counter proposal of ${proposed}% has been submitted.`,
  };
}

// ──────────────────────────────────────────────────────────────────────
// 5. ONE-CLICK CONFIRM ORDER
// ──────────────────────────────────────────────────────────────────────
export async function confirmOrderByToken(token) {
  const quote = await db("quotations").where({ portal_token: token }).first();
  if (!quote) throw new Error("Invalid portal token");

  if (quote.stage === "Confirmed") {
    return { alreadyConfirmed: true, quoteId: quote.id, upsellSuggestions: [] };
  }

  let newStage = "Confirmed";
  let autoReentry = false;

  if (Number(quote.blended_risk_score) > 12 || quote.approval_required) {
    newStage = "Pending Final Approval";
    autoReentry = true;
  }

  await db("quotations").where({ id: quote.id }).update({
    stage: newStage,
    approval_status: autoReentry ? "Pending Finance Review" : "Confirmed",
    updated_at: db.fn.now(),
  });

  // Log to message thread
  await db("portal_messages").insert({
    quote_id: quote.id,
    sender: "Customer",
    message: "I have confirmed the quotation terms. Please proceed.",
  });

  try {
    await db("approval_audit_logs").insert({
      quote_id: quote.id,
      reviewer_role: "Customer",
      action: "CONFIRM_ORDER",
      reason: autoReentry
        ? "Customer confirmed. High risk score auto-routed to Finance."
        : "Customer confirmed terms with one-click acceptance.",
    });
  } catch {}

  // Deduct warehouse stock on order confirmation
  try {
    const { deductInventoryForOrder } = await import("./products.services.js");
    await deductInventoryForOrder(quote.id);
  } catch (err) {
    console.warn("[confirmOrderByToken] Could not deduct inventory:", err.message);
  }

  // Run upsell engine
  const upsellSuggestions = await getUpsellSuggestions(quote.id);

  return {
    quoteId: quote.id,
    confirmedStage: newStage,
    autoReentry,
    upsellSuggestions,
    message: autoReentry
      ? "Thank you! Your order is confirmed and has been sent for final finance review."
      : "Thank you! Your order is confirmed and has been sent to fulfillment.",
  };
}
