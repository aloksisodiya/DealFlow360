import * as invoiceService from "../services/invoices.services.js";

export async function getInvoices(req, res) {
  try {
    const { status, search } = req.query;
    const invoices = await invoiceService.listInvoices({ status, search });
    return res.json({ success: true, data: invoices });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createInvoice(req, res) {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    return res.status(201).json({ success: true, message: "Invoice generated", data: invoice });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status, notes } = req.body;
    const invoice = await invoiceService.updateInvoiceStatus(req.params.id, status, notes);
    return res.json({ success: true, message: "Invoice status updated", data: invoice });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
