import db from "../config/db.js";

function quoteId() {
  return `Q-${Date.now().toString().slice(-8)}`;
}

async function discountLimit(customerTier) {
  const tier = await db("discount_tiers")
    .where({ customer_tier: customerTier })
    .first();
  return tier ? Number(tier.max_discount_percent) : 0;
}

export async function createQuotation(ownerId, input) {
  const discountPercent = Number(input.discountPercent || 0);
  const maxDiscount = await discountLimit(input.customerTier || "Bronze");
  const approvalRequired = discountPercent > maxDiscount;
  const [quotation] = await db("quotations")
    .insert({
      id: quoteId(),
      customer_name: input.customerName,
      customer_tier: input.customerTier || "Bronze",
      total_amount: Number(input.totalAmount || 0),
      discount_percent: discountPercent,
      upsell_items: JSON.stringify(input.upsellItems || []),
      owner_id: ownerId,
      stage: approvalRequired ? "Pending Approval" : "Draft",
      approval_required: approvalRequired,
      approval_status: approvalRequired
        ? "Pending Manager Review"
        : "Auto-Approved",
    })
    .returning("*");
  return quotation;
}

export async function listQuotations(adminId, role) {
  const query = db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .select("q.*", "a.work_email as owner_email")
    .orderBy("q.created_at", "desc");
  if (role === "sales_rep") query.where("q.owner_id", adminId);
  return query;
}

export async function requestNegotiation(adminId, quotationId, request) {
  const updated = await db("quotations")
    .where({ id: quotationId, owner_id: adminId })
    .update({
      negotiation_request: request,
      negotiation_requested_at: db.fn.now(),
    })
    .returning("*");
  if (!updated[0])
    throw new Error("Quotation not found or not owned by this sales rep");
  return updated[0];
}

export async function listPendingApprovals() {
  return db("quotations")
    .where({
      approval_required: true,
      approval_status: "Pending Manager Review",
    })
    .orderBy("created_at", "asc");
}

export async function decideQuotation(managerId, quotationId, decision) {
  if (!["approve", "reject"].includes(decision))
    throw new Error("Decision must be approve or reject");
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
  if (!updated[0]) throw new Error("Quotation approval request not found");
  return updated[0];
}

export async function updateDiscountTier(tierId, maxDiscountPercent) {
  const [tier] = await db("discount_tiers")
    .where({ id: tierId })
    .update({ max_discount_percent: maxDiscountPercent })
    .returning("*");
  if (!tier) throw new Error("Discount tier not found");
  return tier;
}

export async function listDiscountTiers() {
  return db("discount_tiers")
    .select("id", "customer_tier", "max_discount_percent")
    .orderBy("id");
}
