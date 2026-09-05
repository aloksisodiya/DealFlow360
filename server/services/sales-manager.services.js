import db from "../config/db.js";

export const listPendingApprovals = async () =>
  db("quotations")
    .where({
      approval_required: true,
      approval_status: "Pending Manager Review",
    })
    .orderBy("created_at", "asc");

export const decideQuotation = async (managerId, quotationId, decision) => {
  if (!["approve", "reject"].includes(decision)) {
    throw new Error("Decision must be approve or reject");
  }

  const approved = decision === "approve";
  const updated = await db("quotations")
    .where({ id: quotationId, approval_required: true })
    .update({
      approval_status: approved ? "Approved" : "Rejected",
      stage: approved ? "Approved" : "Draft",
      approved_at: approved ? db.fn.now() : null,
      approved_by: approved ? managerId : null,
    })
    .returning("*");

  if (!updated[0]) {
    throw new Error("Quotation approval request not found");
  }
  return updated[0];
};

export const updateDiscountTier = async (tierId, maxDiscountPercent) => {
  const [tier] = await db("discount_tiers")
    .where({ id: tierId })
    .update({ max_discount_percent: maxDiscountPercent })
    .returning("*");
  if (!tier) throw new Error("Discount tier not found");
  return tier;
};

export const listDiscountTiers = async () =>
  db("discount_tiers")
    .select("id", "customer_tier", "max_discount_percent")
    .orderBy("id");
