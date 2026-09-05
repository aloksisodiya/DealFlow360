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
    .select("q.*", "a.work_email as owner_email", "a.full_name as owner_name")
    .first();

  if (!quote) throw new Error("Invalid or expired portal link");

  return {
    id: quote.id,
    customerName: quote.customer_name,
    customerTier: quote.customer_tier,
    totalAmount: Number(quote.total_amount),
    discountPercent: Number(quote.discount_percent || 0),
    stage: quote.stage,
    approvalStatus: quote.approval_status,
    approvalRequired: quote.approval_required,
    canConfirm: !["Confirmed", "Cancelled"].includes(quote.stage),
    ownerName: quote.owner_name || "Your Sales Representative",
    ownerEmail: quote.owner_email || "",
    notes: quote.notes || "",
    createdAt: quote.created_at,
  };
}

// ──────────────────────────────────────────────────────────────────────
// 3. PORTAL MESSAGE THREAD (Customer <-> SalesRep)
// ──────────────────────────────────────────────────────────────────────
export async function getPortalMessages(token) {
  const quote = await db("quotations").where({ portal_token: token }).select("id").first();
  if (!quote) throw new Error("Invalid portal token");

  const messages = await db("portal_messages")
    .where({ quote_id: quote.id })
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

  const [msg] = await db("portal_messages").insert({
    quote_id: quote.id,
    sender: sender || "Customer",
    message: message.trim(),
  }).returning("*");

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
  const newStage = requiresApproval ? "Pending Re-Approval" : "Under Negotiation";
  const approvalStatus = proposed > 15 ? "Pending Finance Review" : "Pending Manager Review";

  await db("quotations").where({ id: quote.id }).update({
    stage: newStage,
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
