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
  const newId = quoteId();
  const [quotation] = await db("quotations")
    .insert({
      id: newId,
      customer_name: input.customerName,
      customer_email: input.customerEmail || null,
      customer_tier: customerTier,
      total_amount: Number(input.totalAmount || 0),
      discount_percent: discountPercent,
      upsell_items: JSON.stringify(input.upsellItems || []),
      owner_id: ownerId,
      stage: approvalRequired ? "Pending Approval" : (input.stage || "Draft"),
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
    .leftJoin("discount_tiers as dt", "dt.customer_tier", "q.customer_tier")
    .select(
      "q.*",
      "a.work_email as owner_email",
      db.raw("COALESCE(dt.max_discount_percent, 5.00) as max_allowed_discount")
    )
    .orderBy("q.created_at", "desc");
  if (role === "sales_rep") query.where("q.owner_id", adminId);
  return query;
};

export const applyQuotationDiscount = async (adminId, quotationId, discountPercent, note) => {
  const discount = Number(discountPercent);
  if (isNaN(discount) || discount < 0 || discount > 80) {
    throw new Error("Discount percentage must be between 0% and 80%");
  }

  const quote = await db("quotations as q")
    .leftJoin("discount_tiers as dt", "dt.customer_tier", "q.customer_tier")
    .where("q.id", quotationId)
    .select("q.*", db.raw("COALESCE(dt.max_discount_percent, 5.00) as max_allowed_discount"))
    .first();

  if (!quote) throw new Error("Quotation not found");

  const maxAllowed = Number(quote.max_allowed_discount || 5);
  const requiresManagerApproval = discount > maxAllowed;

  // Compute base amount if not previously stored or zero
  let baseAmount = Number(quote.base_amount || 0);
  const currentTotal = Number(quote.total_amount || 0);
  const currentDiscount = Number(quote.discount_percent || 0);

  if (!baseAmount || baseAmount === 0) {
    if (currentDiscount > 0 && currentDiscount < 100) {
      baseAmount = currentTotal / (1 - currentDiscount / 100);
    } else {
      baseAmount = currentTotal;
    }
  }

  const newTotal = Number((baseAmount * (1 - discount / 100)).toFixed(2));

  const newStage = requiresManagerApproval ? "Pending Approval" : (quote.stage === "Draft" ? "Approved" : quote.stage);
  const newApprovalStatus = requiresManagerApproval ? "Pending Manager Review" : "Auto-Approved";

  const [updated] = await db("quotations")
    .where({ id: quotationId })
    .update({
      base_amount: baseAmount,
      discount_percent: discount,
      total_amount: newTotal,
      stage: newStage,
      approval_required: requiresManagerApproval,
      approval_status: newApprovalStatus,
      updated_at: db.fn.now(),
    })
    .returning("*");

  // Log in portal_messages so customer and rep see it in chat thread
  try {
    await db("portal_messages").insert({
      quote_id: quotationId,
      sender: "SalesRep",
      message: requiresManagerApproval
        ? `Sales rep proposed a ${discount}% discount. This exceeds the ${maxAllowed}% limit and has been sent for Sales Manager approval.`
        : `Sales rep applied a ${discount}% discount (Auto-Approved). New total: $${newTotal.toLocaleString()}.`,
    });
  } catch (err) {
    console.warn("[applyDiscount] Error inserting portal message:", err.message);
  }

  // Insert into approval_audit_logs
  try {
    await db("approval_audit_logs").insert({
      quote_id: quotationId,
      reviewer_role: "sales_rep",
      reviewer_id: String(adminId),
      action: requiresManagerApproval ? "MANAGER_APPROVAL_REQUESTED" : "DISCOUNT_AUTO_APPROVED",
      reason: requiresManagerApproval
        ? `Sales rep applied ${discount}% discount exceeding authority (${maxAllowed}% max limit for ${quote.customer_tier || "Standard"}). Routed to Sales Manager.`
        : `Sales rep applied ${discount}% discount within authority (${maxAllowed}% max limit for ${quote.customer_tier || "Standard"}). Auto-approved.`,
    });
  } catch (err) {
    console.warn("[applyDiscount] Error inserting audit log:", err.message);
  }

  return {
    quote: {
      ...updated,
      max_allowed_discount: maxAllowed,
    },
    requiresManagerApproval,
    maxAllowed,
    newTotal,
    discount,
    message: requiresManagerApproval
      ? `Discount of ${discount}% exceeds your authority limit of ${maxAllowed}%. Sent to Sales Manager for approval!`
      : `Discount of ${discount}% applied and auto-approved! New total: $${newTotal.toLocaleString()}`,
  };
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
