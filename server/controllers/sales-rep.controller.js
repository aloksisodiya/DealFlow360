import {
  createQuotation,
  listQuotations,
  requestNegotiation,
} from "../services/sales-rep.services.js";
import { generatePortalToken, getPortalMessagesByQuoteId } from "../services/portal.services.js";
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
    const quotation = await createQuotation(req.auth.adminId, req.body);
    let portalUrl = null;
    let portalToken = null;

    const customerEmail = req.body?.customerEmail?.trim();
    if (customerEmail) {
      try {
        portalToken = await generatePortalToken(quotation.id, customerEmail);
        const portalBase = process.env.PORTAL_BASE_URL || "http://localhost:5173";
        portalUrl = `${portalBase}/portal/${portalToken}`;
      } catch (err) {
        console.warn("[createQuote] Token generation warning:", err.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: quotation,
      portalUrl,
      portalToken,
      emailSent: false,
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

    const token = await generatePortalToken(id, customerEmail.trim());
    const portalBase = process.env.PORTAL_BASE_URL || "http://localhost:5173";
    const portalUrl = `${portalBase}/portal/${token}`;

    const db = (await import("../config/db.js")).default;
    const quote = await db("quotations as q")
      .leftJoin("admins as a", "a.id", "q.owner_id")
      .where("q.id", id)
      .select("q.id", "q.customer_name", "q.total_amount", "a.work_email as owner_email", "a.profile as owner_profile")
      .first();

    if (!quote) return res.status(404).json({ success: false, message: "Quotation not found" });

    const ownerProfile = typeof quote.owner_profile === "string"
      ? JSON.parse(quote.owner_profile || "{}")
      : (quote.owner_profile || {});
    const repName = ownerProfile.name || quote.owner_email?.split("@")[0] || "Your Sales Representative";

    let emailError = null;
    try {
      await sendPortalInviteEmail({
        toEmail: customerEmail.trim(),
        customerName: quote.customer_name,
        quoteId: quote.id,
        totalAmount: quote.total_amount,
        portalUrl,
        salesRepName: repName,
      });
    } catch (err) {
      console.error("[sendPortalLink] Email dispatch warning:", err.message);
      emailError = err.message;
    }

    return res.json({
      success: true,
      portalUrl,
      token,
      emailSent: !emailError,
      message: emailError
        ? `Portal link ready: ${portalUrl} (Email warning: ${emailError})`
        : `Portal link sent successfully to ${customerEmail}`,
    });
  } catch (error) {
    console.error("[sendPortalLink]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const applyDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountPercent, note } = req.body || {};
    if (discountPercent === undefined || discountPercent === null) {
      return res.status(400).json({ success: false, message: "discountPercent is required" });
    }

    const { applyQuotationDiscount } = await import("../services/sales-rep.services.js");
    const result = await applyQuotationDiscount(req.auth.adminId, id, discountPercent, note);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("[applyDiscount]", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getQuoteMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await getPortalMessagesByQuoteId(id);
    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export { postSalesRepReply } from "./portal.controller.js";
