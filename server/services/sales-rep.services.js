import db from "../config/db.js";

const quoteId = () => `Q-${Date.now().toString().slice(-8)}`;

const discountLimit = async (customerTier) => {
  const tier = await db("discount_tiers")
    .where({ customer_tier: customerTier })
    .first();
  return tier ? Number(tier.max_discount_percent) : 0;
};

export const createQuotation = async (ownerId, input) => {
  const discountPercent = Number(input.discountPercent || 0);
  const customerTier = input.customerTier || "Bronze";
  const approvalRequired =
    discountPercent > (await discountLimit(customerTier));
  const [quotation] = await db("quotations")
    .insert({
      id: quoteId(),
      customer_name: input.customerName,
      customer_tier: customerTier,
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
};

export const listQuotations = async (adminId, role) => {
  const query = db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .select("q.*", "a.work_email as owner_email")
    .orderBy("q.created_at", "desc");
  if (role === "sales_rep") query.where("q.owner_id", adminId);
  return query;
};

export const requestNegotiation = async (adminId, quotationId, request) => {
  const updated = await db("quotations")
    .where({ id: quotationId, owner_id: adminId })
    .update({
      negotiation_request: request,
      negotiation_requested_at: db.fn.now(),
    })
    .returning("*");
  if (!updated[0]) {
    throw new Error("Quotation not found or not owned by this sales rep");
  }
  return updated[0];
};
