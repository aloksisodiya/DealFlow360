import db from "../config/db.js";

const quoteId = () => `Q-${Date.now().toString().slice(-8)}`;

const discountLimit = async (customerTier) => {
  const tier = await db("discount_tiers")
    .where({ customer_tier: customerTier })
    .first();
  return tier ? Number(tier.max_discount_percent) : 0;
};

export const createQuotation = async (ownerId, input) => {
  let discountPercent = Number(input.discountPercent ?? input.discount_percent ?? 0);
  const customerTier = input.customerTier || input.customer_tier || "Bronze";
  const newId = quoteId();

  let baseAmount = Number(input.baseAmount ?? input.base_amount ?? input.amount ?? 0);
  let totalAmount = Number(input.totalAmount ?? input.total_amount ?? 0);

  if (baseAmount > 0 && discountPercent > 0 && (totalAmount <= 0 || totalAmount === baseAmount)) {
    totalAmount = Number((baseAmount * (1 - discountPercent / 100)).toFixed(2));
  } else if (totalAmount > 0 && discountPercent > 0 && (baseAmount <= 0 || baseAmount === totalAmount)) {
    baseAmount = Number((totalAmount / (1 - discountPercent / 100)).toFixed(2));
  } else if (baseAmount > 0 && totalAmount > 0 && discountPercent <= 0 && baseAmount > totalAmount) {
    discountPercent = Number((((baseAmount - totalAmount) / baseAmount) * 100).toFixed(2));
  }

  if (baseAmount <= 0 && totalAmount > 0) baseAmount = totalAmount;
  if (totalAmount <= 0 && baseAmount > 0) totalAmount = baseAmount;

  const ownerUser = ownerId ? await db("admins").where({ id: ownerId }).select("role", "work_email").first() : null;
  const ownerRole = (ownerUser?.role || "").toLowerCase();
  const ownerEmail = (ownerUser?.work_email || "").toLowerCase();
  const isManagerOrAdmin = ownerRole.includes("manager") || ownerRole.includes("admin") || ownerRole.includes("approver") || ownerEmail.includes("rjav") || ownerEmail.includes("arjav");

  const limit = isManagerOrAdmin ? 100 : await discountLimit(customerTier);
  const approvalRequired = discountPercent > limit;

  const items = input.items || input.upsellItems || input.upsell_items || [];

  const [inserted] = await db("quotations")
    .insert({
      id: newId,
      customer_name: input.customerName || input.customer_name,
      customer_email: input.customerEmail || input.customer_email || null,
      customer_tier: customerTier,
      base_amount: baseAmount,
      total_amount: totalAmount,
      discount_percent: discountPercent,
      notes: input.notes || input.scopeDetails || input.description || null,
      items: JSON.stringify(items),
      upsell_items: JSON.stringify(input.upsellItems || input.upsell_items || []),
      owner_id: ownerId,
      stage: approvalRequired ? "Pending Approval" : (input.stage || "Draft"),
      approval_required: approvalRequired,
      approval_status: approvalRequired
        ? "Pending Manager Review"
        : "Auto-Approved",
    })
    .returning("*");

  const quotation = await db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .leftJoin("discount_tiers as dt", "dt.customer_tier", "q.customer_tier")
    .where("q.id", newId)
    .select(
      "q.*",
      "a.work_email as owner_email",
      "a.role as owner_role",
      db.raw("COALESCE(dt.max_discount_percent, 5.00) as max_allowed_discount")
    )
    .first();

  return quotation || inserted;
};

export const listQuotations = async (adminId, role) => {
  if (!adminId || !role) {
    return [];
  }

  const normRole = (role || "").toLowerCase();
  const isCustomer = normRole.includes("customer") || normRole.includes("client");
  const isSalesRep = normRole === "sales_rep" || normRole.includes("rep");
  const isManagerOrAdmin = normRole.includes("manager") || normRole.includes("admin") || normRole.includes("approver");

  const query = db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .leftJoin("discount_tiers as dt", "dt.customer_tier", "q.customer_tier")
    .select(
      "q.*",
      "a.work_email as owner_email",
      "a.role as owner_role",
      db.raw("COALESCE(dt.max_discount_percent, 5.00) as max_allowed_discount")
    )
    .orderBy("q.created_at", "desc");

  if (isCustomer) {
    const user = await db("admins").where({ id: adminId }).select("work_email", "profile").first();
    let customerEmail = user?.work_email ? user.work_email.trim().toLowerCase() : null;
    let customerName = null;
    if (user?.profile) {
      try {
        const prof = typeof user.profile === "string" ? JSON.parse(user.profile || "{}") : (user.profile || {});
        customerName = prof?.name ? prof.name.trim().toLowerCase() : null;
      } catch (e) {}
    }

    const emailHandle = customerEmail ? customerEmail.split("@")[0] : null;

    query.where(function() {
      if (customerEmail) {
        this.whereRaw("LOWER(COALESCE(q.customer_email, '')) = ?", [customerEmail])
            .orWhereRaw("LOWER(COALESCE(q.portal_customer_email, '')) = ?", [customerEmail])
            .orWhereRaw("LOWER(COALESCE(q.customer_email, '')) LIKE ?", [`%${customerEmail}%`]);
      }
      if (emailHandle && emailHandle.length > 2) {
        this.orWhereRaw("LOWER(COALESCE(q.customer_name, '')) LIKE ?", [`%${emailHandle}%`]);
      }
      if (customerName) {
        this.orWhereRaw("LOWER(COALESCE(q.customer_name, '')) LIKE ?", [`%${customerName}%`]);
      }
    });

    const results = await query;
    return results || [];
  }

  if (isSalesRep && !isManagerOrAdmin) {
    query.where(function() {
      this.where("q.owner_id", adminId)
          .orWhereNull("q.owner_id");
    });
    return query;
  }

  if (isManagerOrAdmin) {
    return query;
  }

  return [];
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

  const admin = adminId ? await db("admins").where({ id: adminId }).select("role", "work_email").first() : null;
  const adminRole = (admin?.role || "").toLowerCase();
  const adminEmail = (admin?.work_email || "").toLowerCase();
  const isManagerOrAdmin = adminRole.includes("manager") || adminRole.includes("admin") || adminRole.includes("approver") || adminEmail.includes("rjav") || adminEmail.includes("arjav");

  const maxAllowed = isManagerOrAdmin ? 80 : Number(quote.max_allowed_discount || 5);
  const requiresManagerApproval = discount > maxAllowed;

  // Compute base amount if not previously stored or zero
  let baseAmount = Number(quote.base_amount || 0);
  const currentTotal = Number(quote.total_amount || 0);
  const currentDiscount = Number(quote.discount_percent || 0);

  if (!baseAmount || baseAmount === 0 || (currentDiscount > 0 && baseAmount === currentTotal)) {
    if (currentDiscount > 0 && currentDiscount < 100) {
      baseAmount = Number((currentTotal / (1 - currentDiscount / 100)).toFixed(2));
    } else {
      baseAmount = currentTotal;
    }
  }

  const newTotal = Number((baseAmount * (1 - discount / 100)).toFixed(2));

  const newStage = requiresManagerApproval ? "Pending Approval" : quote.stage;
  const newApprovalStatus = requiresManagerApproval ? "Pending Manager Review" : "Auto-Approved";

  await db("quotations")
    .where({ id: quotationId })
    .update({
      base_amount: baseAmount,
      discount_percent: discount,
      total_amount: newTotal,
      stage: newStage,
      approval_required: requiresManagerApproval,
      approval_status: newApprovalStatus,
      updated_at: db.fn.now(),
    });

  const updatedQuote = await db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .leftJoin("discount_tiers as dt", "dt.customer_tier", "q.customer_tier")
    .where("q.id", quotationId)
    .select(
      "q.*",
      "a.work_email as owner_email",
      "a.role as owner_role",
      db.raw("COALESCE(dt.max_discount_percent, 5.00) as max_allowed_discount")
    )
    .first();

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
      ...updatedQuote,
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

export const updateQuotation = async (ownerId, quoteId, input) => {
  const quote = await db("quotations").where({ id: quoteId }).first();
  if (!quote) {
    throw new Error("Quotation not found");
  }

  let discountPercent = Number(input.discountPercent ?? input.discount_percent ?? quote.discount_percent ?? 0);
  const customerTier = input.customerTier || input.customer_tier || quote.customer_tier || "Bronze";

  let baseAmount = Number(input.baseAmount ?? input.base_amount ?? input.amount ?? quote.base_amount ?? 0);
  let totalAmount = Number(input.totalAmount ?? input.total_amount ?? quote.total_amount ?? 0);

  if (baseAmount > 0 && discountPercent > 0 && (totalAmount <= 0 || totalAmount === baseAmount)) {
    totalAmount = Number((baseAmount * (1 - discountPercent / 100)).toFixed(2));
  } else if (totalAmount > 0 && discountPercent > 0 && (baseAmount <= 0 || baseAmount === totalAmount)) {
    baseAmount = Number((totalAmount / (1 - discountPercent / 100)).toFixed(2));
  } else if (baseAmount > 0 && totalAmount > 0 && discountPercent <= 0 && baseAmount > totalAmount) {
    discountPercent = Number((((baseAmount - totalAmount) / baseAmount) * 100).toFixed(2));
  }

  if (baseAmount <= 0 && totalAmount > 0) baseAmount = totalAmount;
  if (totalAmount <= 0 && baseAmount > 0) totalAmount = baseAmount;

  const ownerUser = ownerId ? await db("admins").where({ id: ownerId }).select("role", "work_email").first() : null;
  const ownerRole = (ownerUser?.role || "").toLowerCase();
  const ownerEmail = (ownerUser?.work_email || "").toLowerCase();
  const isManagerOrAdmin = ownerRole.includes("manager") || ownerRole.includes("admin") || ownerRole.includes("approver") || ownerEmail.includes("rjav") || ownerEmail.includes("arjav");

  const limit = isManagerOrAdmin ? 100 : await discountLimit(customerTier);
  const approvalRequired = discountPercent > limit;

  const items = input.items || input.upsellItems || input.upsell_items || (quote.items ? (typeof quote.items === "string" ? JSON.parse(quote.items) : quote.items) : []);
  const upsellItems = input.upsellItems || input.upsell_items || (quote.upsell_items ? (typeof quote.upsell_items === "string" ? JSON.parse(quote.upsell_items) : quote.upsell_items) : items);

  const newStage = approvalRequired
    ? "Pending Approval"
    : (input.stage || quote.stage || "Draft");

  const newApprovalStatus = approvalRequired
    ? "Pending Manager Review"
    : (quote.approval_status || "Auto-Approved");

  await db("quotations")
    .where({ id: quoteId })
    .update({
      customer_name: input.customerName || input.customer_name || quote.customer_name,
      customer_email: input.customerEmail !== undefined ? (input.customerEmail || null) : quote.customer_email,
      customer_tier: customerTier,
      base_amount: baseAmount,
      total_amount: totalAmount,
      discount_percent: discountPercent,
      notes: input.notes !== undefined ? input.notes : (input.scopeDetails || input.description || quote.notes),
      items: JSON.stringify(items),
      upsell_items: JSON.stringify(upsellItems),
      stage: newStage,
      approval_required: approvalRequired,
      approval_status: newApprovalStatus,
      updated_at: db.fn.now(),
    });

  const updated = await db("quotations as q")
    .leftJoin("admins as a", "a.id", "q.owner_id")
    .leftJoin("discount_tiers as dt", "dt.customer_tier", "q.customer_tier")
    .where("q.id", quoteId)
    .select(
      "q.*",
      "a.work_email as owner_email",
      "a.role as owner_role",
      db.raw("COALESCE(dt.max_discount_percent, 5.00) as max_allowed_discount")
    )
    .first();

  return updated;
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
