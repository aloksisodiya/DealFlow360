import db from "../config/db.js";

/**
 * Synchronize settled / approved / confirmed quotations into the invoices ledger
 */
export async function syncQuotationInvoices() {
  try {
    const quotes = await db("quotations").select("*");
    const existingInvoices = await db("invoices").select("id", "quotation_id", "invoice_number");
    const invoiceByQuoteId = new Map();
    const invoiceById = new Set();
    
    for (const inv of existingInvoices) {
      if (inv.quotation_id) invoiceByQuoteId.set(inv.quotation_id, inv);
      invoiceById.add(inv.id);
    }

    for (const quote of quotes) {
      if (!quote.customer_name) continue;

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
      const discAmt = Math.max(0, Number((baseAmt - totalAmt).toFixed(2)));

      let items = [];
      try {
        if (quote.items) items = typeof quote.items === "string" ? JSON.parse(quote.items) : quote.items;
      } catch {}
      if (!items || items.length === 0) {
        try {
          if (quote.upsell_items) items = typeof quote.upsell_items === "string" ? JSON.parse(quote.upsell_items) : quote.upsell_items;
        } catch {}
      }
      if (!items || items.length === 0) {
        items = [{
          name: quote.notes || `${quote.customer_name} Commercial Hardware & Platform Order`,
          qty: 1,
          unitPrice: baseAmt > 0 ? baseAmt : totalAmt,
          total: totalAmt
        }];
      }

      const stageLower = String(quote.stage || "").toLowerCase();
      let status = "Unpaid";
      if (stageLower === "dispatched" || stageLower === "settled" || stageLower === "won") {
        status = "Paid";
      } else if (stageLower === "confirmed" || stageLower === "approved" || stageLower === "fulfillment") {
        status = "Pending";
      } else if (stageLower === "at risk") {
        status = "Overdue";
      }

      const existing = invoiceByQuoteId.get(quote.id);
      if (existing) {
        // Update discount and amounts if out of sync
        await db("invoices")
          .where({ id: existing.id })
          .update({
            base_amount: baseAmt,
            discount_percent: discPct,
            discount_amount: discAmt,
            customer_email: quote.customer_email || quote.portal_customer_email || undefined,
            updated_at: db.fn.now()
          });
      } else {
        // Insert new invoice for quotation
        const rawNum = quote.id.replace(/^Q-|^QUOTE-/, "");
        const invoiceNumber = `INV-${new Date().getFullYear()}-${rawNum}`;
        const newId = `inv-${quote.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        
        if (!invoiceById.has(newId)) {
          const issueDate = quote.approved_at || quote.created_at || new Date();
          const dueDate = new Date(new Date(issueDate).getTime() + 30 * 86400000).toISOString().split("T")[0];

          await db("invoices").insert({
            id: newId,
            invoice_number: invoiceNumber,
            quotation_id: quote.id,
            customer_name: quote.customer_name,
            customer_email: quote.customer_email || quote.portal_customer_email || null,
            base_amount: baseAmt,
            discount_percent: discPct,
            discount_amount: discAmt,
            amount: totalAmt,
            status: status,
            issue_date: issueDate,
            due_date: dueDate,
            payment_method: "ACH Wire",
            payment_batch: `BATCH-${rawNum.slice(-4) || "001"}`,
            items: JSON.stringify(items),
            notes: quote.notes || `Generated from Quotation #${quote.id} (${quote.customer_tier || "Commercial"} Tier)`,
          });
          invoiceById.add(newId);
          invoiceByQuoteId.set(quote.id, { id: newId, quotation_id: quote.id });
        }
      }
    }
  } catch (err) {
    console.warn("[syncQuotationInvoices] Sync warning:", err.message);
  }
}

export async function listInvoices({ status, search, role, workEmail, adminId } = {}) {
  // Always auto-sync quotations into invoices ledger
  await syncQuotationInvoices();

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
  return invoices.map((inv) => {
    const amt = Number(inv.amount || 0);
    const discPct = Number(inv.discount_percent || 0);
    let baseAmt = Number(inv.base_amount || 0);
    if (baseAmt <= 0 || (discPct > 0 && baseAmt === amt)) {
      if (discPct > 0 && discPct < 100) {
        baseAmt = Number((amt / (1 - discPct / 100)).toFixed(2));
      } else {
        baseAmt = amt;
      }
    }
    const discAmt = Number(inv.discount_amount) > 0 
      ? Number(inv.discount_amount) 
      : Math.max(0, Number((baseAmt - amt).toFixed(2)));

    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      quotationId: inv.quotation_id,
      customerName: inv.customer_name,
      customerEmail: inv.customer_email,
      baseAmount: baseAmt,
      discountPercent: discPct,
      discountAmount: discAmt,
      amount: amt,
      amountFormatted: `₹${amt.toLocaleString("en-IN")}`,
      status: inv.status,
      issueDate: inv.issue_date,
      dueDate: inv.due_date,
      paymentMethod: inv.payment_method,
      paymentBatch: inv.payment_batch,
      items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || [],
      notes: inv.notes,
      createdAt: inv.created_at,
    };
  });
}

export async function createInvoice(data) {
  const id = data.id || `inv-${Date.now().toString().slice(-6)}`;
  const invoiceNumber = data.invoiceNumber || data.invoice_number || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  
  let customerName = data.customerName || data.customer_name || "Enterprise Customer";
  let customerEmail = data.customerEmail || data.customer_email || null;
  let baseAmount = Number(data.baseAmount || data.base_amount || 0);
  let discountPercent = Number(data.discountPercent || data.discount_percent || 0);
  let amount = Number(data.amount || 0);
  let items = data.items || [];
  let notes = data.notes || "";

  // If quotationId is passed, pull quotation details from DB
  if (data.quotationId || data.quotation_id) {
    const qId = data.quotationId || data.quotation_id;
    const quote = await db("quotations").where({ id: qId }).first();
    if (quote) {
      if (!customerName || customerName === "Enterprise Customer") customerName = quote.customer_name;
      if (!customerEmail) customerEmail = quote.customer_email || quote.portal_customer_email;
      if (!amount) amount = Number(quote.total_amount || 0);
      if (!discountPercent) discountPercent = Number(quote.discount_percent || 0);
      if (!baseAmount) baseAmount = Number(quote.base_amount || 0);
      if (items.length === 0) {
        try {
          const parsed = typeof quote.items === "string" ? JSON.parse(quote.items) : quote.items || [];
          items = parsed.length > 0 ? parsed : [
            { name: quote.notes || `${quote.customer_name} Commercial Hardware & Platform Order`, qty: 1, unitPrice: baseAmount > 0 ? baseAmount : amount, total: amount }
          ];
        } catch {
          items = [{ name: quote.notes || `${quote.customer_name} Commercial Hardware & Platform Order`, qty: 1, unitPrice: baseAmount > 0 ? baseAmount : amount, total: amount }];
        }
      }
      if (!notes) notes = `Generated from Quotation #${quote.id} (${quote.customer_tier || 'Commercial'} Tier)`;
    }
  }

  if (baseAmount > 0 && discountPercent > 0 && (amount <= 0 || amount === baseAmount)) {
    amount = Number((baseAmount * (1 - discountPercent / 100)).toFixed(2));
  } else if (amount > 0 && discountPercent > 0 && (baseAmount <= 0 || baseAmount === amount)) {
    baseAmount = Number((amount / (1 - discountPercent / 100)).toFixed(2));
  }
  if (baseAmount <= 0 && amount > 0) baseAmount = amount;
  if (amount <= 0 && baseAmount > 0) amount = baseAmount;

  const discountAmount = Math.max(0, Number((baseAmount - amount).toFixed(2)));

  if (items.length === 0 && amount > 0) {
    items = [{ name: "Commercial Hardware & Services Package", qty: 1, unitPrice: baseAmount, total: amount }];
  }

  const dueDate = data.dueDate || data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const paymentMethod = data.paymentMethod || data.payment_method || "ACH Wire";
  
  const [invoice] = await db("invoices")
    .insert({
      id,
      invoice_number: invoiceNumber,
      quotation_id: data.quotationId || data.quotation_id || null,
      customer_name: customerName,
      customer_email: customerEmail,
      base_amount: baseAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      amount: amount,
      status: data.status || "Unpaid",
      issue_date: data.issueDate || data.issue_date || db.fn.now(),
      due_date: dueDate,
      payment_method: paymentMethod,
      payment_batch: data.paymentBatch || data.payment_batch || `BATCH-${Date.now().toString().slice(-4)}`,
      items: JSON.stringify(items),
      notes: notes,
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

