import {
  createQuotation,
  listQuotations,
  requestNegotiation,
} from "../services/sales-rep.services.js";
import { generatePortalToken } from "../services/portal.services.js";
import { sendPortalInviteEmail } from "../services/email.service.js";
import { postSalesRepReply } from "./portal.controller.js";

const required = (value, message) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(message);
  }
};

export const createQuote = async (req, res) => {
  try {
    required(req.body?.customerName, "customerName is required");
    return res.status(201).json({
      success: true,
      data: await createQuotation(req.auth.adminId, req.body),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getQuotes = async (req, res) =>
  res.json({
    success: true,
    data: await listQuotations(req.auth.adminId, req.auth.role),
  });

export const negotiate = async (req, res) => {
  try {
    required(req.body?.request, "request is required");
    return res.json({
      success: true,
      data: await requestNegotiation(
        req.auth.adminId,
        req.params.id,
        req.body.request,
      ),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const sendPortalLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerEmail } = req.body || {};
    if (!customerEmail) {
      return res.status(400).json({ success: false, message: "customerEmail is required" });
    }

    const token = await generatePortalToken(id, customerEmail);
    const portalBase = process.env.PORTAL_BASE_URL || "http://localhost:5173";
    const portalUrl = `${portalBase}/portal/${token}`;

    const db = (await import("../config/db.js")).default;
    const quote = await db("quotations as q")
      .leftJoin("admins as a", "a.id", "q.owner_id")
      .where("q.id", id)
      .select("q.id", "q.customer_name", "q.total_amount", "a.full_name as owner_name")
      .first();

    if (!quote) return res.status(404).json({ success: false, message: "Quotation not found" });

    await sendPortalInviteEmail({
      toEmail: customerEmail,
      customerName: quote.customer_name,
      quoteId: quote.id,
      totalAmount: quote.total_amount,
      portalUrl,
      salesRepName: quote.owner_name || "Your Sales Representative",
    });

    return res.json({ success: true, portalUrl, token, message: `Portal link sent to ${customerEmail}` });
  } catch (error) {
    console.error("[sendPortalLink]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { postSalesRepReply } from "./portal.controller.js";
