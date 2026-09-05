import db from "../config/db.js";

export async function listSubscriptions({ status, search, role, workEmail, adminId } = {}) {
  const normRole = (role || "").toLowerCase();
  const isCustomer = normRole.includes("customer") || normRole.includes("client");

  let query = db("subscriptions").orderBy("created_at", "desc");

  if (isCustomer) {
    let customerEmail = workEmail ? workEmail.trim().toLowerCase() : null;
    let customerName = null;

    if (adminId) {
      const user = await db("admins").where({ id: adminId }).select("work_email", "profile").first();
      if (user) {
        if (!customerEmail && user.work_email) customerEmail = user.work_email.trim().toLowerCase();
        try {
          const prof = typeof user.profile === "string" ? JSON.parse(user.profile || "{}") : (user.profile || {});
          customerName = prof?.name ? prof.name.trim().toLowerCase() : null;
        } catch (e) {}
      }
    }

    if (!customerEmail && !customerName) {
      return [];
    }

    query = query.where(function() {
      if (customerEmail) {
        const handle = customerEmail.split('@')[0].toLowerCase();
        this.whereRaw("LOWER(COALESCE(customer_name, '')) LIKE ?", [`%${handle}%`]);
      }
      if (customerName) {
        this.orWhereRaw("LOWER(COALESCE(customer_name, '')) LIKE ?", [`%${customerName}%`]);
      }
    });
  }

  if (status && status !== "All" && status !== "all") {
    query = query.where({ status });
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    query = query.where((builder) => {
      builder.whereRaw("LOWER(subscription_code) LIKE ?", [term])
        .orWhereRaw("LOWER(customer_name) LIKE ?", [term])
        .orWhereRaw("LOWER(plan_name) LIKE ?", [term]);
    });
  }

  const subs = await query;
  return subs.map((s) => ({
    id: s.id,
    code: s.subscription_code,
    customer: s.customer_name,
    customerEmail: s.customer_email,
    tier: s.tier,
    plan: s.plan_name,
    amount: Number(s.amount),
    mrr: Number(s.mrr),
    billingCycle: s.billing_cycle,
    status: s.status,
    startDate: s.start_date,
    nextBillingDate: s.next_billing_date,
    seats: s.seats,
    features: typeof s.features === "string" ? JSON.parse(s.features) : s.features || [],
    auditLogs: typeof s.audit_logs === "string" ? JSON.parse(s.audit_logs) : s.audit_logs || [],
    createdAt: s.created_at,
  }));
}

export async function createSubscription(data) {
  const id = data.id || `sub-${Date.now().toString().slice(-6)}`;
  const customerName = data.customer || data.customer_name || "Enterprise Client";
  const planName = data.plan || data.plan_name || "Enterprise Platform Suite";
  const code = data.code || data.subscription_code || `SUB-${customerName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-3)}`;
  const amount = Number(data.amount || 0);
  const cycle = data.billingCycle || data.billing_cycle || "Monthly";
  const mrr = cycle === "Annual" ? amount / 12 : amount;
  const nextDate = data.nextBillingDate || data.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [sub] = await db("subscriptions")
    .insert({
      id,
      subscription_code: code,
      customer_name: customerName,
      tier: data.tier || "Enterprise",
      plan_name: planName,
      amount,
      mrr,
      billing_cycle: cycle,
      status: data.status || "Active",
      start_date: data.startDate || data.start_date || db.fn.now(),
      next_billing_date: nextDate,
      seats: Number(data.seats || 10),
      features: JSON.stringify(data.features || ["Standard CPQ"]),
      audit_logs: JSON.stringify([
        { date: new Date().toISOString().split("T")[0], action: "Subscription Created", user: data.createdBy || "Admin" }
      ]),
    })
    .returning("*");

  return sub;
}

export async function updateSubscriptionStatus(id, status, actorName = "Admin") {
  const sub = await db("subscriptions").where({ id }).first();
  if (!sub) throw new Error("Subscription not found");

  let auditLogs = [];
  try {
    auditLogs = typeof sub.audit_logs === "string" ? JSON.parse(sub.audit_logs) : sub.audit_logs || [];
  } catch {}

  auditLogs.unshift({
    date: new Date().toISOString().split("T")[0],
    action: `Status changed to ${status}`,
    user: actorName,
  });

  const [updated] = await db("subscriptions")
    .where({ id })
    .update({
      status,
      audit_logs: JSON.stringify(auditLogs),
    })
    .returning("*");

  return updated;
}
