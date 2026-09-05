import * as subService from "../services/subscriptions.services.js";

export async function getSubscriptions(req, res) {
  try {
    const { status, search } = req.query;
    const subs = await subService.listSubscriptions({ status, search });
    return res.json({ success: true, data: subs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createSubscription(req, res) {
  try {
    const sub = await subService.createSubscription({
      ...req.body,
      createdBy: req.auth?.workEmail || "Admin",
    });
    return res.status(201).json({ success: true, message: "Subscription created", data: sub });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const sub = await subService.updateSubscriptionStatus(
      req.params.id,
      status,
      req.auth?.workEmail || "Admin"
    );
    return res.json({ success: true, message: "Subscription status updated", data: sub });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}
