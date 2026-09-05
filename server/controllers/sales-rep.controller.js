import {
  createQuotation,
  listQuotations,
  requestNegotiation,
} from "../services/sales-rep.services.js";

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
