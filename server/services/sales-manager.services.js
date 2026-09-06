import db from "../config/db.js";

export const listPendingApprovals = async () => {
  const quotes = await db("quotations")
    .where("approval_required", true)
    .orWhereIn("approval_status", [
      "Pending Manager Review",
      "Approved",
      "Rejected",
      "Returned for Revision",
    ])
    .orWhereIn("stage", [
      "Pending Approval",
      "Under Review",
      "At Risk",
      "Approved",
      "Draft",
      "Returned",
    ])
    .orderBy("created_at", "desc");

  return quotes.map((q) => {
    const disc = Number(q.discount_percent || 0);
    const risk = disc > 20 ? "HIGH" : disc > 10 ? "MEDIUM" : "LOW";
    const status = (q.approval_status || "").toLowerCase().includes("approved") || q.stage === "Approved"
      ? "approved"
      : (q.approval_status || "").toLowerCase().includes("reject") || (q.approval_status || "").toLowerCase().includes("returned") || q.stage === "Returned"
      ? "returned"
      : "pending";

    const initials = (q.customer_name || "CU").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    return {
      id: q.id,
      customer: q.customer_name,
      avatar: initials,
      status,
      amount: Number(q.total_amount || q.base_amount || 0),
      discount: `${disc}% requested discount`,
      discountNum: disc,
      risk,
      stage: q.approval_status || q.stage || "Sales Manager",
      stageClass: status === "approved" ? "auto-appr" : disc > 20 ? "vp-review" : disc > 10 ? "finance" : "sales-mgr",
      assignedTo: q.assigned_to || "M. Shah",
      assignedAvatar: (q.assigned_to || "MS").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      assignedClass: "ms",
      notes: q.notes || `Quotation ${q.id} discount approval request under review.`
    };
  });
};

export const decideQuotation = async (managerId, quotationId, decision, remarks) => {
  const approved = decision === "approve";
  const status = approved ? "Approved" : "Returned for Revision";
  const stage = approved ? "Approved" : "Returned";

  let [updated] = await db("quotations")
    .where({ id: quotationId })
    .update({
      approval_status: status,
      approval_required: false,
      stage,
      approved_at: approved ? db.fn.now() : null,
      approved_by: approved ? managerId : null,
      notes: remarks || (approved ? "Approved by Manager — Ready for Fulfillment" : "Returned with feedback for revision"),
      updated_at: db.fn.now()
    })
    .returning("*");

  if (!updated) {
    // If quote doesn't exist by exact ID, try inserting a record
    const [inserted] = await db("quotations")
      .insert({
        id: quotationId,
        customer_name: "Customer",
        total_amount: 50000,
        stage,
        approval_status: status,
        approval_required: false,
        notes: remarks || "Approval updated"
      })
      .returning("*");
    updated = inserted;
  }

  // Audit Log
  try {
    await db("approval_audit_logs").insert({
      quote_id: quotationId,
      reviewer_role: "Sales Manager",
      reviewer_id: String(managerId || "mgr-1"),
      action: approved ? "APPROVE" : "REJECT",
      reason: remarks || (approved ? "Approved by Manager — Order routed to Fulfillment" : "Returned for revision")
    });
  } catch (e) {}

  // Sync invoices
  if (approved) {
    try {
      const { syncQuotationInvoices } = await import("./invoices.services.js");
      await syncQuotationInvoices();
    } catch (e) {}
  }

  return updated;
};

export const createApprovalRequest = async (data) => {
  const nextId = data.id || `Q-${Math.floor(1000 + Math.random() * 9000)}`;
  const disc = Number(data.discountNum || data.discount || 10);
  const total = Number(data.amount || 50000);

  const [created] = await db("quotations")
    .insert({
      id: nextId,
      customer_name: data.customer || data.customer_name || "Enterprise Client",
      customer_tier: data.tier || "Enterprise",
      total_amount: total,
      discount_percent: disc,
      blended_risk_score: disc > 20 ? 18.5 : disc > 10 ? 12.0 : 5.0,
      stage: "Pending Approval",
      approval_required: true,
      approval_status: data.stage || "Pending Manager Review",
    })
    .returning("*");

  return created;
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

