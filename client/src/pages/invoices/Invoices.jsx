import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  X, 
  CreditCard, 
  Download, 
  Check, 
  Clock, 
  FileText, 
  ShieldCheck, 
  Send, 
  Edit3, 
  Printer, 
  DollarSign, 
  ArrowRight,
  Info,
  AlertCircle
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { fetchInvoices, updateInvoiceStatus, createInvoice } from '../../services/invoiceService';
import './Invoices.css';

export default function Invoices({ user, onNavigate, onLogout }) {
  // Toast Notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Modals
  const [activeModal, setActiveModal] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Live Invoice Items State from PostgreSQL database
  const [invoices, setInvoices] = useState([]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await fetchInvoices();
      setInvoices(data);
    } catch (err) {
      showToast('Failed to load invoices from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const invoiceBatches = invoices.map(inv => ({
    id: inv.invoiceNumber || inv.id,
    realId: inv.id,
    badge: inv.status === 'Paid' ? 'Settled' : 'Primary',
    dotColor: inv.status === 'Paid' ? 'green' : inv.status === 'Overdue' ? 'red' : 'amber',
    title: `${inv.customerName} - Invoice (${inv.invoiceNumber})`,
    subtitle: inv.notes || `Due on ${inv.dueDate}`,
    amount: Number(inv.amount || 0),
    status: inv.status,
    dueDate: inv.dueDate,
    items: inv.items && inv.items.length > 0 ? inv.items : [
      { name: 'Enterprise Platform & CPQ Services', qty: 1, unitPrice: Number(inv.amount), total: Number(inv.amount) }
    ]
  }));

  // Stepper state
  const [stepperState, setStepperState] = useState({
    orderConfirmed: true,
    shipped: true,
    invoiced: true,
    paid: false
  });

  // Payment Modal State
  const [paymentAmount, setPaymentAmount] = useState(2730.00);
  const [paymentMethod, setPaymentMethod] = useState('ach');
  const [paymentReference, setPaymentReference] = useState('TXN-ACM-98421');

  // Reminder Modal State
  const [reminderEmail, setReminderEmail] = useState('ap@acme-corp.com');
  const [reminderNote, setReminderNote] = useState('Friendly reminder: Invoice is due.');

  // Adjust Items Modal State
  const [adjustLines, setAdjustLines] = useState([
    { name: 'Enterprise CPQ Platform', qty: 1, price: 12400.00 }
  ]);

  // Computed totals
  const subtotal = invoiceBatches.reduce((acc, item) => acc + item.amount, 0);
  const settledCredit = invoiceBatches
    .filter(item => item.status === 'Paid')
    .reduce((acc, item) => acc + item.amount, 0);
  const totalOutstanding = invoiceBatches
    .filter(item => item.status !== 'Paid')
    .reduce((acc, item) => acc + item.amount, 0);

  const outstandingCount = invoiceBatches.filter(i => i.status !== 'Paid').length;
  const settledCount = invoiceBatches.filter(i => i.status === 'Paid').length;

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      showToast('Please enter a valid payment amount.');
      return;
    }

    try {
      const target = invoices[0];
      if (target) {
        await updateInvoiceStatus(target.id, 'Paid', `Payment settled via ${paymentMethod.toUpperCase()} ref: ${paymentReference}`);
      }
      showToast(`Payment of $${Number(paymentAmount).toLocaleString()} recorded in database!`);
      setActiveModal(null);
      await loadInvoices();
    } catch (err) {
      showToast(err.message || 'Failed to record payment');
    }
  };

  const handleSendReminderSubmit = (e) => {
    e.preventDefault();
    showToast(`Invoice reminder dispatched to ${reminderEmail}!`);
    setActiveModal(null);
  };

  const handleSaveAdjustedLines = (e) => {
    e.preventDefault();
    const newTotal = adjustLines.reduce((acc, l) => acc + (l.qty * l.price), 0);
    showToast(`Line items updated! New invoice total: $${newTotal.toLocaleString()}.`);
    setActiveModal(null);
  };

  const handleDownloadSummary = () => {
    const headers = ['Invoice #', 'Customer', 'Amount', 'Status', 'Due Date'];
    const rows = invoiceBatches.map(inv => [
      inv.id,
      inv.title,
      `$${inv.amount.toLocaleString()}`,
      inv.status,
      inv.dueDate || 'N/A'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Invoice summary downloaded as CSV!');
  };

  return (
    <div className="invoices-container">
      {/* Universal Top Navigation */}
      <Navbar 
        activePage="invoices" 
        user={user} 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        onToast={showToast}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={18} color="#e9d5e3" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="invoices-main animate-fade-in">

        {/* Breadcrumb & Header Row */}
        <div className="invoices-header-row">
          <div className="invoices-breadcrumb-group">
            <div className="invoices-kicker-row">
              <span>INVOICES • BILLING ENGINE •</span>
              <span className="badge-active-record">ACTIVE RECORD</span>
            </div>
            <h1 className="invoices-title">Invoice Detail: INV-1042 (Acme Corp)</h1>
            <p className="invoices-subtitle">
              Opened by clicking a row on the Invoices list
            </p>
          </div>

          <div className="invoices-actions-group">
            <button 
              className="btn-inv-outline"
              onClick={handleDownloadSummary}
            >
              <Download size={15} />
              <span>Download Summary</span>
            </button>

            <button 
              className="btn-record-payment"
              onClick={() => setActiveModal('recordPayment')}
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Stepper Progress Pipeline */}
        <div className="invoices-stepper-card">
          <div className="stepper-header-row">
            <div className="stepper-title-kicker">ORDER & FULFILLMENT PIPELINE</div>
            <div className="stepper-stage-indicator">
              Stage 3 of 4: <span className="stepper-stage-bold">
                {stepperState.paid ? 'Settled & Reconciled' : 'Awaiting Payment Settlement'}
              </span>
            </div>
          </div>

          <div className="stepper-progress-bar">
            {/* Step 1: Order Confirmed */}
            <div className="stepper-step completed">
              <div className="stepper-node-icon">
                <Check size={18} />
              </div>
              <div className="stepper-node-label">Order Confirmed</div>
              <div className="stepper-node-date">Aug 28, 2025</div>
            </div>

            {/* Line 1 -> 2 */}
            <div className="stepper-connector-line active" style={{ left: '25%', width: '25%' }}></div>

            {/* Step 2: Shipped */}
            <div className="stepper-step completed">
              <div className="stepper-node-icon">
                <Check size={18} />
              </div>
              <div className="stepper-node-label">Shipped</div>
              <div className="stepper-node-date">Sep 02, 2025</div>
            </div>

            {/* Line 2 -> 3 */}
            <div className="stepper-connector-line active" style={{ left: '50%', width: '25%' }}></div>

            {/* Step 3: Invoiced */}
            <div className={`stepper-step ${stepperState.paid ? 'completed' : 'current'}`}>
              <div className="stepper-node-icon">
                {stepperState.paid ? <Check size={18} /> : <FileText size={18} />}
              </div>
              <div className="stepper-node-label">Invoiced</div>
              <div className="stepper-node-date">Sep 03, 2025 (Current)</div>
            </div>

            {/* Line 3 -> 4 */}
            <div className={`stepper-connector-line ${stepperState.paid ? 'active' : 'inactive'}`} style={{ left: '75%', width: '25%' }}></div>

            {/* Step 4: Paid */}
            <div className={`stepper-step ${stepperState.paid ? 'completed' : 'pending'}`}>
              <div className="stepper-node-icon">
                {stepperState.paid ? <Check size={18} /> : <Clock size={18} />}
              </div>
              <div className="stepper-node-label">Paid</div>
              <div className="stepper-node-date">
                {stepperState.paid ? 'Settlement Complete' : 'Pending Settlement'}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Linked Invoice Line Batches Card */}
        <div className="invoices-batch-card">
          <div className="batch-card-header">
            <div>
              <div className="batch-title-main">Linked Invoice Line Batches</div>
              <div className="batch-title-sub">
                Invoices generated for dispatch order #ORD-8942 and associated cloud licenses
              </div>
            </div>

            <div className="batch-pills-right">
              {outstandingCount > 0 && (
                <span className="batch-pill-outstanding">
                  {outstandingCount} Outstanding Invoice
                </span>
              )}
              <span className="batch-pill-settled">
                {settledCount} Settled
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>INVOICE #</th>
                  <th>DESCRIPTION / BILLING CATEGORY</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>DUE DATE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoiceBatches.map(batch => (
                  <tr key={batch.id}>
                    {/* Invoice ID */}
                    <td>
                      <div className="inv-number-cell">
                        <span className={`inv-dot ${batch.dotColor}`}></span>
                        <span className="inv-number-bold">{batch.id}</span>
                        <span className={`inv-badge-type ${batch.badge.toLowerCase()}`}>
                          {batch.badge}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td>
                      <div className="inv-desc-main">{batch.title}</div>
                      <div className="inv-desc-sub">{batch.subtitle}</div>
                    </td>

                    {/* Amount */}
                    <td className="inv-amount-cell">
                      ${batch.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`inv-status-pill ${batch.status.toLowerCase()}`}>
                        <span className={`inv-dot ${batch.status === 'Paid' ? 'green' : 'amber'}`}></span>
                        <span>{batch.status}</span>
                      </span>
                    </td>

                    {/* Due Date */}
                    <td style={{ color: '#475569', fontWeight: 500 }}>
                      {batch.dueDate}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="inv-actions-cell">
                        {batch.status === 'Unpaid' ? (
                          <>
                            <button 
                              className="btn-pay-now-link"
                              onClick={() => {
                                setPaymentAmount(batch.amount);
                                setActiveModal('recordPayment');
                              }}
                            >
                              Pay Now
                            </button>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <button 
                              className="btn-view-slip-link"
                              onClick={() => setActiveModal('viewSlip')}
                            >
                              View Slip
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-view-slip-link"
                              style={{ fontWeight: 600, color: '#0f172a' }}
                              onClick={() => setActiveModal('viewSlip')}
                            >
                              Receipt
                            </button>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <button 
                              className="btn-view-slip-link"
                              onClick={() => setActiveModal('receiptLog')}
                            >
                              Log
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="inv-summary-footer-row">
            <div className="inv-account-details-left">
              <div><strong>Account:</strong> Acme Corp (Billing ID: #ACM-9901)</div>
              <div><strong>Tax Reg:</strong> US-EIN 94-8839210 • Net 30 Terms Apply</div>
            </div>

            <div className="inv-totals-box-right">
              <div className="inv-totals-sub-row">
                <span>Subtotal (Invoiced items):</span>
                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="inv-totals-sub-row credit">
                <span>Settled Credit (INV-1043):</span>
                <span>-${settledCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="inv-totals-main-row">
                <span className="inv-total-label">Total Outstanding:</span>
                <span className="inv-total-amount">
                  ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Automated Fulfillment Guardrail Alert */}
        <div className="inv-guardrail-card">
          <div className="inv-guardrail-icon-box">
            <Clock size={18} />
          </div>
          <div>
            <div className="inv-guardrail-title">AUTOMATED FULFILLMENT GUARDRAIL</div>
            <div className="inv-guardrail-headline">
              Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships.
            </div>
            <div className="inv-guardrail-body">
              Warehouse fulfillment node confirms dispatch before triggering automated debit slips. Second shipment batch (INV-1044) will generate once remaining inventory clears customs.
            </div>
          </div>
        </div>

        {/* SECTION 4: Bottom Action Bar */}
        <div className="inv-bottom-actions-row">
          <div className="inv-bottom-buttons-left">
            <button 
              className="btn-record-payment"
              onClick={() => setActiveModal('recordPayment')}
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>

            <button 
              className="btn-inv-outline"
              onClick={handleDownloadSummary}
            >
              <Download size={15} />
              <span>Download Summary</span>
            </button>
          </div>

          <div className="inv-bottom-links-right">
            <button 
              className="btn-inv-text-action"
              onClick={() => setActiveModal('sendReminder')}
            >
              Send Invoice Reminder
            </button>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <button 
              className="btn-inv-text-action"
              onClick={() => setActiveModal('adjustItems')}
            >
              Adjust Line Items
            </button>
          </div>
        </div>

      </main>

      {/* Universal Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span>© 2025 DealFlow360 Technologies, Inc. All rights reserved.</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            <div className="status-badge" style={{ display: 'inline-flex' }}>
              <span className="pulse-dot"></span>
              <span>Systems Operational</span>
            </div>
          </div>

          <div className="footer-links">
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('terms'); setActiveModal('footerModal'); }}
            >
              Terms of Service
            </button>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('privacy'); setActiveModal('footerModal'); }}
            >
              Privacy Policy
            </button>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('security'); setActiveModal('footerModal'); }}
            >
              Security & Compliance
            </button>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('audit'); setActiveModal('footerModal'); }}
            >
              Audit Logs
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Record Payment */}
      {activeModal === 'recordPayment' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Record Payment Settlement
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Outstanding Balance (Acme Corp)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>$2,730.00</div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="ach">ACH Electronic Direct Debit (Net 30)</option>
                  <option value="card">Corporate Credit Card (•••• 4242)</option>
                  <option value="wire">Direct Bank Wire Transfer</option>
                  <option value="check">Check / Paper Voucher</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Settlement Amount ($ USD)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Transaction Reference #</label>
                <input 
                  type="text"
                  className="form-input"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-record-payment"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Slip / Receipt */}
      {activeModal === 'viewSlip' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Invoice Slip — INV-1042
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Order #ORD-8942 • Billed to Acme Corp
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div>
                  <strong>DealFlow360 Technologies, Inc.</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>100 Enterprise Way, Suite 400</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>INV-1042</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Date: Sep 03, 2025</div>
                </div>
              </div>

              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ textAlign: 'left', padding: '6px 0' }}>Item</th>
                    <th style={{ textAlign: 'center', padding: '6px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 0' }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '6px 0' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '8px 0' }}>Edge Gateway IoT Router v3</td>
                    <td style={{ textAlign: 'center', padding: '8px 0' }}>10</td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>$240.00</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>$2,400.00</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '8px 0' }}>Mounting Hardware Rack Kits</td>
                    <td style={{ textAlign: 'center', padding: '8px 0' }}>10</td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>$33.00</td>
                    <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>$330.00</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'right', borderTop: '1.5px solid #e2e8f0', paddingTop: '10px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Invoice Total: </span>
                <strong style={{ fontSize: '18px', color: '#0f172a' }}>$2,730.00 USD</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-dash-secondary" 
                style={{ flex: 1 }}
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={15} style={{ marginRight: '6px' }} />
                Print Slip
              </button>
              <button 
                type="button" 
                className="btn-record-payment" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Send Invoice Reminder */}
      {activeModal === 'sendReminder' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Send Invoice Payment Reminder
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendReminderSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Recipient AP Contact</label>
                <input 
                  type="email"
                  className="form-input"
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Reminder Message</label>
                <textarea 
                  className="form-input"
                  rows={4}
                  value={reminderNote}
                  onChange={(e) => setReminderNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-record-payment"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Dispatch Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Adjust Line Items */}
      {activeModal === 'adjustItems' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Adjust Invoice Line Items — INV-1042
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustedLines}>
              {adjustLines.map((line, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>{line.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Quantity</label>
                      <input 
                        type="number"
                        min="1"
                        className="form-input"
                        value={line.qty}
                        onChange={(e) => {
                          const updated = [...adjustLines];
                          updated[idx].qty = Number(e.target.value);
                          setAdjustLines(updated);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>Unit Price ($)</label>
                      <input 
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={line.price}
                        onChange={(e) => {
                          const updated = [...adjustLines];
                          updated[idx].price = Number(e.target.value);
                          setAdjustLines(updated);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-record-payment"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Receipt Log */}
      {activeModal === 'receiptLog' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Settlement Receipt Log — INV-1043
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>Transaction Settled: $46.00 USD</div>
              <div style={{ fontSize: '12px', color: '#065f46', marginTop: '2px' }}>
                Settled on Sep 03, 2025 via Stripe SaaS Auto-Debit • Auth Code: #AUTH-90928
              </div>
            </div>

            <button 
              type="button" 
              className="btn-dash-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* FOOTER MODAL */}
      {activeModal === 'footerModal' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {footerModalType === 'privacy' && 'Privacy Policy'}
                {footerModalType === 'terms' && 'Terms of Service'}
                {footerModalType === 'security' && 'Security & Compliance'}
                {footerModalType === 'audit' && 'System Audit Logs'}
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65 }}>
              <p style={{ marginBottom: '12px' }}>
                DealFlow360 guarantees enterprise-grade revenue billing reconciliation, automated debit guardrails, and SOC 2 Type II compliance.
              </p>
              <p>
                All payment settlements and ledger events are immutably logged with audit timestamps.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
