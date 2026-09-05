import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Send, TrendingDown, MessageSquare, Package, Loader2, AlertCircle } from "lucide-react";
import {
  getPortalQuotation,
  getPortalMessages,
  sendPortalMessage,
  submitCounterDiscount,
  confirmPortalOrder,
} from "../../services/portalService";
import "./CustomerPortal.css";

/**
 * DealFlow360 — Customer Portal (Public Page)
 * Accessed via a unique token link. No authentication required.
 *
 * Features:
 *   - View quotation summary
 *   - Live negotiation message thread with sales rep
 *   - Counter-discount slider
 *   - One-click order confirmation
 *   - Inventory-aware upsell/cross-sell panel (post-confirm)
 */
export default function CustomerPortal({ token }) {
  const [quotation, setQuotation]       = useState(null);
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [confirmed, setConfirmed]       = useState(false);
  const [confirming, setConfirming]     = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [upsellItems, setUpsellItems]   = useState([]);
  const [msgText, setMsgText]           = useState("");
  const [sendingMsg, setSendingMsg]     = useState(false);
  const [counterPct, setCounterPct]     = useState(10);
  const [counterNote, setCounterNote]   = useState("");
  const [counterSent, setCounterSent]   = useState(false);
  const [submittingCounter, setSubmittingCounter] = useState(false);
  const [toasts, setToasts]             = useState([]);
  const [activeTab, setActiveTab]       = useState("overview"); // 'overview' | 'lines' | 'chat'
  const threadRef = useRef(null);
  const pollRef   = useRef(null);
  const quotePollRef = useRef(null);

  const quickPrompts = [
    "Can you offer an extra 5% discount if we sign this week?",
    "What is the estimated delivery timeframe across warehouses?",
    "Could we add 2-year 24/7 SLA support to this proposal?",
    "Terms look great! Ready to finalize and proceed.",
  ];

  const showToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [q, msgs] = await Promise.all([
        getPortalQuotation(token),
        getPortalMessages(token),
      ]);
      setQuotation(q);
      setMessages(msgs);
      if (q.stage === "Confirmed") {
        setConfirmed(true);
        if (q.upsellSuggestions?.length) {
          setUpsellItems(q.upsellSuggestions);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
    // Real-time live polling for messages every 3 seconds
    pollRef.current = setInterval(() => {
      getPortalMessages(token)
        .then((msgs) => setMessages(msgs))
        .catch(() => {});
    }, 3000);

    // Live quotation status poll every 6 seconds
    quotePollRef.current = setInterval(() => {
      getPortalQuotation(token)
        .then((q) => {
          setQuotation(q);
          if (q.stage === "Confirmed") {
            setConfirmed(true);
            if (q.upsellSuggestions?.length) setUpsellItems(q.upsellSuggestions);
          }
        })
        .catch(() => {});
    }, 6000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(quotePollRef.current);
    };
  }, [loadData, token]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === "string" ? textToSend : msgText).trim();
    if (!text || sendingMsg) return;
    setSendingMsg(true);
    try {
      await sendPortalMessage(token, text);
      if (typeof textToSend !== "string") setMsgText("");
      const msgs = await getPortalMessages(token);
      setMessages(msgs);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleItemInquiry = (item) => {
    const prompt = `Regarding item "${item.name}": Could you provide more details about delivery and configuration options?`;
    setMsgText(prompt);
    showToast(`Inquiry drafted in chat below!`);
  };

  const handleCounterSubmit = async () => {
    if (submittingCounter) return;
    setSubmittingCounter(true);
    try {
      const result = await submitCounterDiscount(token, counterPct, counterNote);
      setCounterSent(true);
      showToast(result?.message || `Counter proposal of ${counterPct}% submitted!`);
      // Refresh quotation stage
      const q = await getPortalQuotation(token);
      setQuotation(q);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmittingCounter(false);
    }
  };

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      const result = await confirmPortalOrder(token);
      setConfirmed(true);
      setConfirmResult(result);
      setUpsellItems(result?.upsellSuggestions || []);
      showToast(result?.message || "Order confirmed!");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setConfirming(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const stageClass = (stage = "") => {
    const s = stage.toLowerCase();
    if (s.includes("confirm")) return "stage-confirmed";
    if (s.includes("pending") || s.includes("approv")) return "stage-pending";
    if (s.includes("negoti")) return "stage-negotiation";
    return "stage-draft";
  };

  if (loading) {
    return (
      <div className="portal-root">
        <header className="portal-header">
          <div className="portal-logo">DealFlow<span>360</span></div>
        </header>
        <div className="portal-loading">
          <div className="portal-spinner" />
          <div className="portal-loading-text">Loading your quotation…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-root">
        <header className="portal-header">
          <div className="portal-logo">DealFlow<span>360</span></div>
        </header>
        <div className="portal-main">
          <div className="portal-error">
            <div className="portal-error-icon">🔗</div>
            <div className="portal-error-title">Invalid or Expired Link</div>
            <div className="portal-error-msg">{error}. Please contact your sales representative for a new link.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-root">
      {/* Toast Notifications */}
      <div className="portal-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`portal-toast ${t.type}`}>
            {t.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Universal DealFlow360 Styled Header */}
      <header className="portal-header">
        <div className="portal-header-inner">
          <div className="portal-brand">
            <span className="portal-brand-dark">DealFlow</span>
            <span className="portal-brand-purple">360</span>
          </div>
          <div className="portal-header-badge">
            <span className="pulse-dot" />
            <span>Secure Customer Portal</span>
          </div>
        </div>
      </header>

      <main className="portal-main">

        {/* ── Quotation Summary Card ── */}
        <div className="portal-quote-card">
          <div className="portal-quote-top">
            <div>
              <div className="portal-quote-id">{quotation?.id}</div>
              <div className="portal-quote-client">{quotation?.customerName}</div>
            </div>
            <div className="portal-quote-amount">
              <div className="portal-quote-amount-label">Total Quoted Value</div>
              <div className="portal-quote-amount-value">
                ${Number(quotation?.totalAmount || 0).toLocaleString()}
              </div>
              {quotation?.discountPercent > 0 && (
                <div className="portal-quote-discount">
                  {quotation.discountPercent}% discount applied
                </div>
              )}
            </div>
          </div>

          <div className="portal-quote-meta">
            <div className={`portal-meta-pill ${stageClass(quotation?.stage)}`}>
              {quotation?.stage || "Draft"}
            </div>
            {quotation?.customerTier && (
              <div className="portal-meta-pill">{quotation.customerTier} Tier</div>
            )}
            {quotation?.approvalStatus && (
              <div className="portal-meta-pill">{quotation.approvalStatus}</div>
            )}
            {quotation?.warehouseStockTotal > 0 && (
              <div className="portal-meta-pill" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
                🟢 {quotation.warehouseStockTotal} Units In Stock (Regional Warehouses)
              </div>
            )}
          </div>

          {quotation?.ownerName && (
            <div className="portal-rep-badge">
              <div className="portal-rep-avatar">
                {quotation.ownerName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="portal-rep-name">{quotation.ownerName}</div>
                <div className="portal-rep-label">Your Dedicated Sales Representative</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Itemized Line Items Breakdown ── */}
        {quotation?.items && quotation.items.length > 0 && (
          <div className="portal-section">
            <div className="portal-section-title">
              <Package size={14} />
              Quotation Line Items & Real-Time Availability
            </div>
            <div className="portal-lines-table-wrap">
              <table className="portal-lines-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>Warehouse Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{it.name}</div>
                        {it.description && <div style={{ fontSize: '11px', color: '#64748b' }}>{it.description}</div>}
                      </td>
                      <td>
                        <span className="portal-item-cat-badge">{it.category || 'Standard'}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{it.quantity || 1}</td>
                      <td>${Number(it.unitPrice || 0).toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#54324c' }}>
                        ${Number(it.totalPrice || (it.quantity || 1) * (it.unitPrice || 0)).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                          ● {it.warehouseAvailability || 'Ready in Main Depot'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="portal-ask-item-btn"
                          onClick={() => handleItemInquiry(it)}
                          title="Ask rep a question about this item"
                        >
                          <MessageSquare size={12} />
                          <span>Inquire</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Live Message & Negotiation Thread ── */}
        <div className="portal-section">
          <div className="portal-section-title">
            <MessageSquare size={14} />
            Live Rep Negotiation & Questions (Real-Time Synced)
          </div>
          <div className="portal-thread-box">
            <div className="portal-thread-messages" ref={threadRef}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontStyle: 'italic', fontSize: '12.5px' }}>
                  No messages yet. Send a question, request terms adjustment, or choose a quick prompt below!
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`portal-msg ${m.sender === "Customer" ? "customer" : "salesrep"}`}
                  >
                    <div className="portal-msg-bubble">{m.message}</div>
                    <div className="portal-msg-meta">
                      {m.sender === "Customer" ? "You" : quotation?.ownerName || "Sales Rep"} · {formatTime(m.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Negotiation Prompts */}
            <div className="portal-quick-chips">
              <span className="portal-quick-label">Quick Prompts:</span>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="portal-chip-btn"
                  onClick={() => handleSendMessage(p)}
                  disabled={sendingMsg}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="portal-msg-input-row">
              <textarea
                className="portal-msg-textarea"
                rows={2}
                placeholder="Type your message, query, or negotiation request here (Press Enter to Send)…"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                className="portal-msg-send-btn"
                onClick={() => handleSendMessage()}
                disabled={sendingMsg || !msgText.trim()}
              >
                {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send
              </button>
            </div>
          </div>
        </div>

        {/* ── Counter Discount ── */}
        {!confirmed && (
          <div className="portal-section">
            <div className="portal-section-title">
              <TrendingDown size={14} />
              Propose Counter Discount
            </div>
            <div className="portal-counter-card">
              <div className="portal-counter-label">
                <span>Requested Discount</span>
                <span>{counterPct}%</span>
              </div>
              <input
                type="range"
                className="portal-slider"
                min={1}
                max={30}
                value={counterPct}
                onChange={(e) => setCounterPct(Number(e.target.value))}
              />
              <textarea
                className="portal-counter-note"
                rows={2}
                placeholder="Optional: explain your reasoning (e.g. 'We are committing to a 2-year deal')…"
                value={counterNote}
                onChange={(e) => setCounterNote(e.target.value)}
                disabled={counterSent}
              />
              <button
                className="portal-counter-submit"
                onClick={handleCounterSubmit}
                disabled={submittingCounter || counterSent}
              >
                {submittingCounter
                  ? <><Loader2 size={15} /> Submitting…</>
                  : counterSent
                  ? <><CheckCircle size={15} /> Counter Proposal Sent</>
                  : <><TrendingDown size={15} /> Submit {counterPct}% Counter Proposal</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Confirm Order ── */}
        <div className="portal-section">
          <div className="portal-section-title">
            <CheckCircle size={14} />
            Confirm Order
          </div>

          {confirmed ? (
            <div className="portal-confirmed-banner">
              <div className="portal-confirmed-icon">🎉</div>
              <div className="portal-confirmed-title">Order Confirmed!</div>
              <div className="portal-confirmed-msg">
                {confirmResult?.message || "Your order has been confirmed and sent to our team for fulfillment."}
              </div>
            </div>
          ) : (
            <div className="portal-confirm-card">
              <div className="portal-confirm-title">Ready to proceed?</div>
              <div className="portal-confirm-desc">
                By clicking below, you confirm acceptance of the quoted terms and pricing.
                Our team will immediately move your order to fulfillment.
              </div>
              <button
                className="portal-confirm-btn"
                onClick={handleConfirm}
                disabled={confirming || !quotation?.canConfirm}
              >
                {confirming
                  ? <><Loader2 size={18} /> Processing…</>
                  : <><CheckCircle size={18} /> Confirm My Order</>
                }
              </button>
            </div>
          )}
        </div>

        {/* ── Upsell Suggestions (post-confirm) ── */}
        {confirmed && upsellItems.length > 0 && (
          <div className="portal-section">
            <div className="portal-section-title">
              <Package size={14} />
              Recommended Add-ons & Spares (Warehouse In-Stock)
            </div>
            <div className="portal-upsell-grid">
              {upsellItems.map((item) => (
                <div key={item.id} className="portal-upsell-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="portal-upsell-cat">{item.category}</div>
                    {item.stockAvailable > 0 && (
                      <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                        ● {item.stockAvailable} units in warehouse
                      </span>
                    )}
                  </div>
                  <div className="portal-upsell-name">{item.name}</div>
                  <div className="portal-upsell-desc">
                    {item.description || `${item.unit} · SKU: ${item.sku}`}
                  </div>
                  <div className="portal-upsell-footer">
                    <div>
                      <div className="portal-upsell-price">{item.priceFormatted}</div>
                      <div className="portal-upsell-reason">{item.reason}</div>
                    </div>
                    <button
                      type="button"
                      className="btn-dash-secondary"
                      onClick={async () => {
                        try {
                          await sendPortalMessage(token, `Hi, I would also like to request adding "${item.name}" (${item.priceFormatted}) to this order.`);
                          showToast(`Requested ${item.name}! Your rep has been notified.`);
                          const msgs = await getPortalMessages(token);
                          setMessages(msgs);
                        } catch (e) {
                          showToast(e.message, 'error');
                        }
                      }}
                      style={{ height: '32px', fontSize: '12px', padding: '0 10px', background: '#54324c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Request Add-on
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <footer className="portal-footer">
        DealFlow360 Technologies Inc. · Secure Quotation Portal · Your link is unique and private
      </footer>
    </div>
  );
}
