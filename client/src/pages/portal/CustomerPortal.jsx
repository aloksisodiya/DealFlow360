import React, { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, Send, TrendingDown, MessageSquare, Package, Loader2, AlertCircle, FileText, Download, Printer, X } from "lucide-react";
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
 *   - Official Tax Invoice & Purchase Bill download/print
 */
export default function CustomerPortal({ token, onBack, onGoToInvoices, backLabel }) {
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
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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
    const content = (textToSend || msgText).trim();
    if (!content) return;
    setSendingMsg(true);
    try {
      const newMsg = await sendPortalMessage(token, content);
      setMessages((prev) => [...prev, newMsg]);
      setMsgText("");
      showToast("Message sent to sales rep!");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleItemInquiry = (item) => {
    const itemPrompt = `Regarding line item "${item.name}" (SKU: ${item.sku || 'N/A'}, Qty: ${item.quantity || 1}) — is it possible to get expedited delivery or bulk pricing for additional units?`;
    handleSendMessage(itemPrompt);
  };

  const handleCounterSubmit = async () => {
    if (submittingCounter || counterSent) return;
    setSubmittingCounter(true);
    try {
      const result = await submitCounterDiscount(token, counterPct, counterNote);
      setCounterSent(true);
      showToast(result?.message || `Counter discount of ${counterPct}% submitted!`);
      // Reload quote to get updated stage
      const q = await getPortalQuotation(token);
      setQuotation(q);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmittingCounter(false);
    }
  };

  const handleConfirm = async () => {
    if (confirming || confirmed) return;
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

  const handleConfirmOrder = handleConfirm;

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

  const handleBackToSubscriptions = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = window.location.origin;
    }
  };

  if (loading) {
    return (
      <div className="portal-root">
        <header className="portal-header">
          <div className="portal-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              className="btn-back-subscriptions"
              onClick={handleBackToSubscriptions}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#714b67',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <span>{backLabel || "← Back"}</span>
            </button>
            <div className="portal-logo">DealFlow<span>360</span></div>
          </div>
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
          <div className="portal-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              className="btn-back-subscriptions"
              onClick={handleBackToSubscriptions}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#714b67',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              <span>{backLabel || "← Back"}</span>
            </button>
            <div className="portal-logo">DealFlow<span>360</span></div>
          </div>
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
        <div className="portal-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="btn-back-subscriptions"
              onClick={handleBackToSubscriptions}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#714b67',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
              title="Return to Previous Screen"
            >
              <span>{backLabel || (onBack ? "← Back to Quotations" : "← Back to Dashboard")}</span>
            </button>
            <div className="portal-brand" onClick={handleBackToSubscriptions} style={{ cursor: 'pointer' }}>
              <span className="portal-brand-dark">DealFlow</span>
              <span className="portal-brand-purple">360</span>
            </div>
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
              <div className="portal-quote-amount-label">Net Payable Total (After Discount)</div>
              <div className="portal-quote-amount-value">
                ₹{Number(quotation?.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {Number(quotation?.discountPercent) > 0 && (() => {
                const total = Number(quotation?.totalAmount || 0);
                const discPct = Number(quotation?.discountPercent || 0);
                const base = Number(quotation?.baseAmount || (discPct < 100 ? total / (1 - discPct / 100) : total));
                const savings = Math.max(0, base - total);

                return (
                  <div className="portal-quote-discount" style={{ marginTop: '4px', fontSize: '12.5px', color: '#15803d' }}>
                    <span style={{ textDecoration: 'line-through', color: '#64748b', marginRight: '6px' }}>
                      ₹{base.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <strong>{discPct}% discount applied (-₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</strong>
                  </div>
                );
              })()}
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
                🟢 {quotation.warehouseStockTotal} Units In Stock (Indian Regional Hubs)
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
                <div className="portal-rep-label">
                  Your Dedicated {quotation.ownerRole || (String(quotation.ownerName || '').toLowerCase().includes('rjav') || String(quotation.ownerEmail || '').toLowerCase().includes('rjav') ? 'Sales Manager' : 'Sales Representative')}
                </div>
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
                      <td>₹{Number(it.unitPrice || 0).toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#54324c' }}>
                        ₹{Number(it.totalPrice || (it.quantity || 1) * (it.unitPrice || 0)).toLocaleString('en-IN')}
                      </td>
                      <td>
                        {it.isBackorder || it.inStock === false || String(it.warehouseAvailability || '').toLowerCase().includes('backorder') ? (
                          <span style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 700, background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>
                            ⚠️ Backorder (Lead time: 5-7 days)
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 600 }}>
                            ● {it.warehouseAvailability || 'Ready in Mumbai Central Hub'}
                          </span>
                        )}
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
        {!confirmed && (() => {
          const totalAmt = Number(quotation?.totalAmount || 0);
          const discPct = Number(quotation?.discountPercent || 0);
          let baseAmt = Number(quotation?.baseAmount || 0);
          if (baseAmt <= 0 || (discPct > 0 && baseAmt === totalAmt)) {
            if (discPct > 0 && discPct < 100) {
              baseAmt = Number((totalAmt / (1 - discPct / 100)).toFixed(2));
            } else {
              baseAmt = totalAmt;
            }
          }
          const demandedPrice = Number((baseAmt * (1 - counterPct / 100)).toFixed(2));
          const savings = Math.max(0, baseAmt - demandedPrice);

          return (
            <div className="portal-section">
              <div className="portal-section-title">
                <TrendingDown size={14} />
                Propose Counter Discount & Custom Price
              </div>
              <div className="portal-counter-card">
                <div className="portal-counter-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Demanded Discount Percentage:</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#714b67', background: '#faf5f8', padding: '2px 10px', borderRadius: '6px', border: '1px solid #e9d5e3' }}>
                    {counterPct}%
                  </span>
                </div>
                
                <input
                  type="range"
                  className="portal-slider"
                  min={1}
                  max={35}
                  value={counterPct}
                  onChange={(e) => setCounterPct(Number(e.target.value))}
                  style={{ marginBottom: '12px' }}
                />

                {/* Demanded Price Live Calculation Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Gross List Price:</span>
                    <strong style={{ color: '#0f172a' }}>₹{baseAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#e11d48' }}>
                    <span>Requested Discount ({counterPct}%):</span>
                    <strong>-₹{savings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '14.5px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Demanded Total Price:</span>
                    <strong style={{ color: '#059669', fontSize: '16px' }}>
                      ₹{demandedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                <textarea
                  className="portal-counter-note"
                  rows={2}
                  placeholder="Optional: explain your reasoning (e.g. 'We are committing to a 2-year deal or bulk quantity')…"
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
                    ? <><CheckCircle size={15} /> Counter Proposal Sent (₹{demandedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</>
                    : <><TrendingDown size={15} /> Propose ₹{demandedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({counterPct}% Off)</>
                  }
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Confirm Order ── */}
        <div className="portal-section">
          <div className="portal-section-title">
            <CheckCircle size={14} />
            Confirm Order & Invoice Receipt
          </div>

          {confirmed ? (
            <div className="portal-confirmed-banner">
              <div className="portal-confirmed-icon">🎉</div>
              <div className="portal-confirmed-title">Order Confirmed & Authorized!</div>
              <div className="portal-confirmed-msg">
                {confirmResult?.message || "Your order has been confirmed and routed to our regional warehouses for fulfillment."}
              </div>

              <div style={{ marginTop: '18px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  type="button"
                  className="portal-download-invoice-btn"
                  onClick={() => setShowInvoiceModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#54324c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(84, 50, 76, 0.25)'
                  }}
                >
                  <FileText size={16} />
                  <span>📄 Download / Print Official Tax Invoice</span>
                </button>

                {onGoToInvoices && (
                  <button 
                    type="button"
                    className="portal-download-invoice-btn"
                    onClick={onGoToInvoices}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#15803d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)'
                    }}
                  >
                    <span>View In Invoices ➔</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="portal-confirm-card">
              <div className="portal-confirm-title">Ready to proceed?</div>
              <div className="portal-confirm-desc">
                By clicking below, you confirm acceptance of the quoted terms and pricing.
                Our team will immediately move your order to fulfillment and generate your official tax invoice.
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

      {/* ── Official Tax Invoice Modal ── */}
      {showInvoiceModal && quotation && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal-content invoice-modal-container" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#714b67" />
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    Official Tax Invoice & Purchase Bill
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Invoice Reference: INV-{quotation.id} • Authorized Transaction
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowInvoiceModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Invoice Sheet */}
            <div id="printable-tax-invoice" style={{ padding: '20px 8px', background: '#ffffff' }}>
              
              {/* Invoice Top Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#0b1528', letterSpacing: '-0.025em' }}>
                    DealFlow<span style={{ color: '#714b67' }}>360</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    DealFlow360 Technologies India Pvt. Ltd.<br />
                    Level 8, Tower B, Bandra Kurla Complex (BKC)<br />
                    Bandra East, Mumbai, MH 400051 • India<br />
                    GSTIN: 27AABCD1234E1Z5
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                    ● CONFIRMED & PAID
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Invoice #: <strong style={{ color: '#0f172a' }}>INV-{quotation.id}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Date: <strong style={{ color: '#0f172a' }}>{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    Payment Terms: <strong style={{ color: '#0f172a' }}>Net 30 Days (INR)</strong>
                  </div>
                </div>
              </div>

              {/* Billed To / Account Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    Billed To
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    {quotation.customerName}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px' }}>
                    Account Tier: <strong>{quotation.customerTier || 'Enterprise'}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Routing: Nearest Indian Hub Preferred
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
                    Account Executive & Rep
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                    {quotation.ownerName || 'DealFlow360 Sales Manager'}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    Status: <strong>Order Confirmed for Dispatch</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>
                    ✓ 3 Indian Hubs Synced (Mumbai, BLR, Delhi)
                  </div>
                </div>
              </div>

              {/* Itemized Lines */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 700 }}>Item Description</th>
                    <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 700 }}>Category</th>
                    <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 700, textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 700, textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 700, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(quotation.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>
                        {it.name}
                        {it.sku && <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>SKU: {it.sku}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{it.category || 'Standard'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{it.quantity || 1}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#475569' }}>
                        ₹{Number(it.unitPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        ₹{Number(it.totalPrice || (it.quantity || 1) * (it.unitPrice || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation Summary */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ width: '340px', background: '#faf5f8', padding: '16px', borderRadius: '10px', border: '1px solid #f3e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    <span>Gross Subtotal:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      ₹{(Number(quotation.baseAmount || quotation.totalAmount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {Number(quotation.discountPercent) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#15803d', marginBottom: '8px' }}>
                      <span>Discount ({quotation.discountPercent}%):</span>
                      <span style={{ fontWeight: 700 }}>
                        -₹{((Number(quotation.baseAmount || quotation.totalAmount) * Number(quotation.discountPercent)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                    <span>GST (18% Included):</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      Included
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#54324c', borderTop: '2px solid #e9d5e3', paddingTop: '10px', marginTop: '4px' }}>
                    <span>Total Net Amount:</span>
                    <span>
                      ₹{Number(quotation.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div style={{ fontSize: '11.5px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                Thank you for your business! For billing or warehouse fulfillment questions, contact billing-india@dealflow360.com.
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
              <button 
                type="button" 
                className="btn-dash-secondary"
                onClick={() => setShowInvoiceModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn-new-allocation"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={16} />
                <span>Print / Save as PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      <footer className="portal-footer">
        DealFlow360 Technologies India Pvt. Ltd. · Secure Quotation Portal · All Rates in INR (₹)
      </footer>
    </div>
  );
}
