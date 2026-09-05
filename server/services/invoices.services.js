import db from "../config/db.js";

export async function listInvoices({ status, search, role, workEmail, adminId } = {}) {
  const normRole = (role || "").toLowerCase();
  const isCustomer = normRole.includes("customer") || normRole.includes("client");

  let query = db("invoices").orderBy("created_at", "desc");

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
        this.whereRaw("LOWER(COALESCE(customer_email, '')) = ?", [customerEmail])
            .orWhereRaw("LOWER(COALESCE(customer_name, '')) LIKE ?", [`%${handle}%`]);
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
      builder.whereRaw("LOWER(invoice_number) LIKE ?", [term])
        .orWhereRaw("LOWER(customer_name) LIKE ?", [term])
        .orWhereRaw("LOWER(payment_batch) LIKE ?", [term]);
    });
  }

  const invoices = await query;
  return invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    quotationId: inv.quotation_id,
    customerName: inv.customer_name,
    customerEmail: inv.customer_email,
    amount: Number(inv.amount),
    amountFormatted: `$${Number(inv.amount).toLocaleString()}`,
    status: inv.status,
    issueDate: inv.issue_date,
    dueDate: inv.due_date,
    paymentMethod: inv.payment_method,
    paymentBatch: inv.payment_batch,
    items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || [],
    notes: inv.notes,
    createdAt: inv.created_at,
  }));
}

export async function createInvoice(data) {
  const id = data.id || `inv-${Date.now().toString().slice(-6)}`;
  const invoiceNumber = data.invoiceNumber || data.invoice_number || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const customerName = data.customerName || data.customer_name || "Enterprise Customer";
  const customerEmail = data.customerEmail || data.customer_email || null;
  const dueDate = data.dueDate || data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const paymentMethod = data.paymentMethod || data.payment_method || "ACH Wire";
  
  const [invoice] = await db("invoices")
    .insert({
      id,
      invoice_number: invoiceNumber,
      quotation_id: data.quotationId || data.quotation_id || null,
      customer_name: customerName,
      customer_email: customerEmail,
      amount: Number(data.amount || 0),
      status: data.status || "Draft",
      issue_date: data.issueDate || data.issue_date || db.fn.now(),
      due_date: dueDate,
      payment_method: paymentMethod,
      payment_batch: data.paymentBatch || data.payment_batch || null,
      items: JSON.stringify(data.items || []),
      notes: data.notes || "",
    })
    .returning("*");

  return invoice;
}

export async function updateInvoiceStatus(id, status, notes = null) {
  const patch = { status };
  if (notes) patch.notes = notes;

  const [invoice] = await db("invoices").where({ id }).update(patch).returning("*");
  if (!invoice) throw new Error("Invoice not found");
  return invoice;
}
