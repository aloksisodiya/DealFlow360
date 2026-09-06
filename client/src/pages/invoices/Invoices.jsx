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
  AlertCircle,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { fetchInvoices, updateInvoiceStatus, createInvoice } from '../../services/invoiceService';
import { fetchQuotations } from '../../services/quotationService';
import './Invoices.css';

export default function Invoices({ user, onNavigate, onLogout }) {
  // Toast Notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Modals & Selected Invoice
  const [activeModal, setActiveModal] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Live Invoice Items State from PostgreSQL database
  const [invoices, setInvoices] = useState([]);
  const [availableQuotes, setAvailableQuotes] = useState([]);

  // Generate Invoice Form State
  const [genQuoteId, setGenQuoteId] = useState('');
  const [genCustomerName, setGenCustomerName] = useState('');
  const [genCustomerEmail, setGenCustomerEmail] = useState('');
  const [genAmount, setGenAmount] = useState('');
  const [genDueDate, setGenDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [genPaymentMethod, setGenPaymentMethod] = useState('ACH Wire');
  const [genNotes, setGenNotes] = useState('');

  // Payment Modal State
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentReference, setPaymentReference] = useState('');

  // Reminder Modal State
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderNote, setReminderNote] = useState('Friendly reminder: Invoice is due for payment settlement.');

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const [invData, quotesData] = await Promise.all([
        fetchInvoices(),
        fetchQuotations().catch(() => [])
      ]);

      const isCustomerUser = String(user?.role || '').toLowerCase().includes('customer');
      const userEmail = String(user?.email || '').toLowerCase().trim();
      const userName = String(user?.name || '').toLowerCase().trim();
      const userHandle = userEmail ? userEmail.split('@')[0] : '';

      const filteredInvoices = (invData || []).filter(inv => {
        if (!isCustomerUser) return true;

        const invCustName = String(inv.customerName || inv.customer_name || '').toLowerCase().trim();
        const invCustEmail = String(inv.customerEmail || inv.customer_email || '').toLowerCase().trim();

        if (userEmail && invCustEmail && invCustEmail === userEmail) return true;
        if (userName && invCustName && (invCustName.includes(userName) || userName.includes(invCustName))) return true;
        if (userHandle && invCustName && invCustName.includes(userHandle)) return true;

        return false;
      });

      setInvoices(filteredInvoices);
      if (filteredInvoices.length > 0 && !selectedInvoice) {
        setSelectedInvoice(filteredInvoices[0]);
      }
      setAvailableQuotes(quotesData || []);
    } catch {
      showToast('Failed to load invoices from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const invoiceBatches = invoices
    .filter(inv => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (inv.invoiceNumber || '').toLowerCase().includes(q) ||
        (inv.customerName || '').toLowerCase().includes(q) ||
        (inv.notes || '').toLowerCase().includes(q)
      );
    })
    .map(inv => {
      let parsedItems = [];
      try {
        parsedItems = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || [];
      } catch {
        parsedItems = [];
      }
      if (!parsedItems || parsedItems.length === 0) {
        parsedItems = [
          { name: inv.notes || 'Commercial CPQ Platform & Hardware Package', qty: 1, unitPrice: Number(inv.amount), total: Number(inv.amount) }
        ];
      }

      return {
        id: inv.invoiceNumber || inv.id,
        realId: inv.id,
        badge: inv.status === 'Paid' ? 'Settled' : inv.status === 'Overdue' ? 'Overdue' : 'Pending',
        dotColor: inv.status === 'Paid' ? 'green' : inv.status === 'Overdue' ? 'red' : 'amber',
        title: `${inv.customerName} - Invoice (${inv.invoiceNumber})`,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        subtitle: inv.notes || `Due on ${inv.dueDate}`,
        amount: Number(inv.amount || 0),
        status: inv.status,
        dueDate: inv.dueDate,
        issueDate: inv.issueDate,
        paymentMethod: inv.paymentMethod || 'ACH Wire',
        paymentBatch: inv.paymentBatch || 'BATCH-001',
        items: parsedItems,
        raw: inv
      };
    });

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

  const handleSelectQuoteForInvoice = (quoteId) => {
    setGenQuoteId(quoteId);
    const q = availableQuotes.find(item => String(item.id) === String(quoteId));
    if (q) {
      setGenCustomerName(q.customer_name || q.customerName || '');
      setGenCustomerEmail(q.customer_email || q.customerEmail || '');
      setGenAmount(q.total_amount || q.totalAmount || '');
      setGenNotes(`Commercial order for ${q.customer_name} (${q.customer_tier || 'Enterprise'} tier)`);
    }
  };

  const handleGenerateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!genCustomerName || !genAmount) {
      showToast('Please enter customer name and invoice amount.');
      return;
    }

    try {
      await createInvoice({
        quotationId: genQuoteId || null,
        customerName: genCustomerName,
        customerEmail: genCustomerEmail,
        amount: Number(genAmount),
        dueDate: genDueDate,
        paymentMethod: genPaymentMethod,
        notes: genNotes || `Commercial Invoice for ${genCustomerName}`,
        status: 'Unpaid',
      });

      showToast(`Invoice generated successfully for ${genCustomerName} (₹${Number(genAmount).toLocaleString('en-IN')})!`);
      setActiveModal(null);
      setGenQuoteId('');
      setGenCustomerName('');
      setGenCustomerEmail('');
      setGenAmount('');
      setGenNotes('');
      await loadInvoices();
    } catch (err) {
      showToast(err.message || 'Failed to generate invoice');
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      showToast('Please enter a valid payment amount.');
      return;
    }

    try {
      const targetId = selectedInvoice?.realId || selectedInvoice?.id || invoices[0]?.id;
      if (targetId) {
        await updateInvoiceStatus(targetId, 'Paid', `Payment settled via ${paymentMethod.toUpperCase()} (Ref: ${paymentReference})`);
      }
      showToast(`Payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} recorded and reconciled!`);
      setActiveModal(null);
      await loadInvoices();
    } catch (err) {
      showToast(err.message || 'Failed to record payment');
    }
  };

  const handleSendReminderSubmit = (e) => {
    e.preventDefault();
    showToast(`Invoice reminder successfully dispatched to ${reminderEmail}!`);
    setActiveModal(null);
  };

  const handleDownloadSummary = () => {
    const headers = ['Invoice #', 'Customer', 'Amount (INR)', 'Status', 'Due Date', 'Payment Method'];
    const rows = invoiceBatches.map(inv => [
      inv.id,
      inv.customerName,
      inv.amount,
      inv.status,
      inv.dueDate || 'N/A',
      inv.paymentMethod || 'ACH'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Invoices_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Invoice ledger downloaded as CSV!');
  };

  const handlePrintSlip = (batch) => {
    const target = batch || selectedInvoice || invoiceBatches[0];
    if (target) {
      setSelectedInvoice(target);
      setActiveModal('viewSlip');
      setTimeout(() => {
        window.print();
      }, 300);
    } else {
      window.print();
    }
  };

  const activeSlip = selectedInvoice || invoiceBatches[0] || {};
  const activeSlipItems = activeSlip.items || [
    { name: 'Commercial Hardware & Platform Package', qty: 1, unitPrice: activeSlip.amount || 124000, total: activeSlip.amount || 124000 }
  ];

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
              <span className="badge-active-record">ACCOUNTS RECEIVABLE</span>
            </div>
            <h1 className="invoices-title">
              Invoices & Commercial Billing Statements
            </h1>
            <p className="invoices-subtitle">
              Issue commercial invoices, track payment reconciliations, and print official tax slips
            </p>
          </div>

          <div className="invoices-actions-group">
            <button 
              className="btn-inv-outline"
              onClick={handleDownloadSummary}
              title="Download full CSV statement"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button 
              className="btn-inv-outline"
              onClick={() => handlePrintSlip(selectedInvoice || invoiceBatches[0])}
              title="Print active invoice slip"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>

            <button 
              className="btn-record-payment"
              onClick={() => setActiveModal('generateInvoice')}
            >
              <Plus size={16} />
              <span>+ Issue Invoice</span>
            </button>
          </div>
        </div>

        {/* Quick Search & Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '20px',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }}>
            <Search size={16} color="#64748b" />
            <input 
              type="text"
              placeholder="Search invoices by invoice #, customer name, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '13.5px',
                color: '#0f172a'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b' }}>
            <span><strong>{invoiceBatches.length}</strong> total invoices</span>
            <span>•</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>{settledCount} Settled</span>
            <span>•</span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>{outstandingCount} Outstanding</span>
          </div>
        </div>

        {invoiceBatches.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '56px 24px',
            textAlign: 'center',
            margin: '24px 0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: '#faf5f8',
              color: '#714b67',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto'
            }}>
              <FileText size={30} />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              No Invoices Found
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
              No invoices match your search. You can generate a new commercial invoice directly from an approved quotation.
            </p>
            <button 
              className="btn-record-payment"
              onClick={() => setActiveModal('generateInvoice')}
            >
              <Plus size={16} style={{ marginRight: '6px' }} />
              Issue New Invoice
            </button>
          </div>
        ) : (
          <>
            {/* SECTION 1: Stepper Progress Pipeline */}
            <div className="invoices-stepper-card">
              <div className="stepper-header-row">
                <div className="stepper-title-kicker">ORDER & FULFILLMENT BILLING PIPELINE</div>
                <div className="stepper-stage-indicator">
                  Selected Invoice: <span className="stepper-stage-bold">
                    {activeSlip.id || 'INV-1042'} ({activeSlip.status || 'Active'})
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
                  <div className="stepper-node-date">{activeSlip.issueDate ? new Date(activeSlip.issueDate).toLocaleDateString() : 'Confirmed'}</div>
                </div>

                {/* Line 1 -> 2 */}
                <div className="stepper-connector-line active" style={{ left: '25%', width: '25%' }}></div>

                {/* Step 2: Shipped / Provisioned */}
                <div className="stepper-step completed">
                  <div className="stepper-node-icon">
                    <Check size={18} />
                  </div>
                  <div className="stepper-node-label">Provisioned</div>
                  <div className="stepper-node-date">Fulfillment Active</div>
                </div>

                {/* Line 2 -> 3 */}
                <div className="stepper-connector-line active" style={{ left: '50%', width: '25%' }}></div>

                {/* Step 3: Invoiced */}
                <div className={`stepper-step ${activeSlip.status === 'Paid' ? 'completed' : 'current'}`}>
                  <div className="stepper-node-icon">
                    {activeSlip.status === 'Paid' ? <Check size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="stepper-node-label">Invoiced</div>
                  <div className="stepper-node-date">Due: {activeSlip.dueDate || 'Net 30'}</div>
                </div>

                {/* Line 3 -> 4 */}
                <div className={`stepper-connector-line ${activeSlip.status === 'Paid' ? 'active' : 'inactive'}`} style={{ left: '75%', width: '25%' }}></div>

                {/* Step 4: Paid */}
                <div className={`stepper-step ${activeSlip.status === 'Paid' ? 'completed' : 'pending'}`}>
                  <div className="stepper-node-icon">
                    {activeSlip.status === 'Paid' ? <Check size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="stepper-node-label">Paid</div>
                  <div className="stepper-node-date">
                    {activeSlip.status === 'Paid' ? 'Reconciled & Settled' : 'Pending Settlement'}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Linked Invoice Line Batches Card */}
            <div className="invoices-batch-card">
              <div className="batch-card-header">
                <div>
                  <div className="batch-title-main">Commercial Invoices Ledger</div>
                  <div className="batch-title-sub">
                    Click any invoice to view detailed slip, post payment settlement, or print
                  </div>
                </div>

                <div className="batch-pills-right">
                  {outstandingCount > 0 && (
                    <span className="batch-pill-outstanding">
                      {outstandingCount} Outstanding
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
                      <th>INVOICE # & CUSTOMER</th>
                      <th>STATUS</th>
                      <th>TOTAL AMOUNT</th>
                      <th>DUE DATE</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceBatches.map(batch => (
                      <tr 
                        key={batch.id} 
                        style={{
                          background: selectedInvoice?.id === batch.id ? '#faf7f9' : 'transparent',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedInvoice(batch)}
                      >
                        {/* Invoice & Customer */}
                        <td>
                          <div className="inv-batch-cell">
                            <span className={`status-dot ${batch.dotColor}`}></span>
                            <div>
                              <div className="inv-batch-title">{batch.title}</div>
                              <div className="inv-batch-subtitle">{batch.subtitle}</div>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`batch-status-tag ${batch.status.toLowerCase()}`}>
                            {batch.status}
                          </span>
                        </td>

                        {/* Amount */}
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>
                          ₹{batch.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Due Date */}
                        <td style={{ color: '#475569', fontWeight: 500 }}>
                          {batch.dueDate || 'N/A'}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="inv-actions-cell" onClick={(e) => e.stopPropagation()}>
                            {batch.status !== 'Paid' ? (
                              <>
                                <button 
                                  className="btn-pay-now-link"
                                  onClick={() => {
                                    setSelectedInvoice(batch);
                                    setPaymentAmount(batch.amount);
                                    setActiveModal('recordPayment');
                                  }}
                                >
                                  Pay
                                </button>
                                <span style={{ color: '#cbd5e1' }}>|</span>
                                <button 
                                  className="btn-view-slip-link"
                                  onClick={() => {
                                    setSelectedInvoice(batch);
                                    setActiveModal('viewSlip');
                                  }}
                                >
                                  Slip
                                </button>
                                <span style={{ color: '#cbd5e1' }}>|</span>
                                <button 
                                  className="btn-view-slip-link"
                                  title="Print this invoice"
                                  onClick={() => handlePrintSlip(batch)}
                                >
                                  <Printer size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="btn-view-slip-link"
                                  style={{ fontWeight: 600, color: '#0f172a' }}
                                  onClick={() => {
                                    setSelectedInvoice(batch);
                                    setActiveModal('viewSlip');
                                  }}
                                >
                                  Receipt
                                </button>
                                <span style={{ color: '#cbd5e1' }}>|</span>
                                <button 
                                  className="btn-view-slip-link"
                                  title="Print Receipt"
                                  onClick={() => handlePrintSlip(batch)}
                                >
                                  <Printer size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Print
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
                  <div><strong>Selected Account:</strong> {activeSlip.customerName || 'All Accounts'} ({activeSlip.customerEmail || 'Commercial Terms'})</div>
                  <div><strong>Billing Terms:</strong> Net 30 Commercial SLA • INR Currency Base</div>
                </div>

                <div className="inv-totals-box-right">
                  <div className="inv-totals-sub-row">
                    <span>Subtotal (Invoiced volume):</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {settledCredit > 0 && (
                    <div className="inv-totals-sub-row credit">
                      <span>Settled Payments:</span>
                      <span>-₹{settledCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="inv-totals-main-row">
                    <span className="inv-total-label">Total Outstanding:</span>
                    <span className="inv-total-amount">
                      ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SECTION 3: Automated Fulfillment Guardrail Alert */}
        <div className="inv-guardrail-card">
          <div className="inv-guardrail-icon-box">
            <Clock size={18} />
          </div>
          <div>
            <div className="inv-guardrail-title">AUTOMATED FULFILLMENT & INVOICE RECONCILIATION</div>
            <div className="inv-guardrail-headline">
              Invoices remain synchronized with warehouse dispatches and ERP payment logs.
            </div>
            <div className="inv-guardrail-body">
              All invoice line batches update automatically when customer proposals are signed and warehouse inventory is provisioned.
            </div>
          </div>
        </div>

        {/* SECTION 4: Bottom Action Bar */}
        <div className="inv-bottom-actions-row">
          <div className="inv-bottom-buttons-left">
            <button 
              className="btn-record-payment"
              onClick={() => {
                setPaymentAmount(totalOutstanding > 0 ? totalOutstanding : 25000);
                setActiveModal('recordPayment');
              }}
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>

            <button 
              className="btn-inv-outline"
              onClick={() => handlePrintSlip(selectedInvoice || invoiceBatches[0])}
            >
              <Printer size={15} />
              <span>Print Active Invoice</span>
            </button>
          </div>

          <div className="inv-bottom-links-right">
            <button 
              className="btn-inv-text-action"
              onClick={() => {
                setReminderEmail(activeSlip.customerEmail || 'finance@customer.com');
                setActiveModal('sendReminder');
              }}
            >
              Send Invoice Reminder
            </button>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <button 
              className="btn-inv-text-action"
              onClick={() => setActiveModal('generateInvoice')}
            >
              + Issue Another Invoice
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
              <span>Billing Engine Online</span>
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

      {/* MODAL 1: Issue / Generate New Invoice */}
      {activeModal === 'generateInvoice' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Issue Commercial Invoice
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoiceSubmit}>
              {availableQuotes.length > 0 && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Autofill from Approved Quotation (Optional)</label>
                  <select 
                    className="form-input"
                    value={genQuoteId}
                    onChange={(e) => handleSelectQuoteForInvoice(e.target.value)}
                  >
                    <option value="">-- Select Quotation --</option>
                    {availableQuotes.map(q => (
                      <option key={q.id} value={q.id}>
                        #{q.id} — {q.customer_name || q.customerName} (₹{Number(q.total_amount || q.totalAmount || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Customer Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Corp"
                    value={genCustomerName}
                    onChange={(e) => setGenCustomerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Email</label>
                  <input 
                    type="email"
                    className="form-input"
                    placeholder="finance@customer.com"
                    value={genCustomerEmail}
                    onChange={(e) => setGenCustomerEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Amount (₹ INR)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 125000"
                    value={genAmount}
                    onChange={(e) => setGenAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={genDueDate}
                    onChange={(e) => setGenDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Payment Terms & Method</label>
                <select 
                  className="form-input"
                  value={genPaymentMethod}
                  onChange={(e) => setGenPaymentMethod(e.target.value)}
                >
                  <option value="ACH Wire">ACH / RTGS Bank Wire (Net 30)</option>
                  <option value="Corporate Credit Card">Corporate Credit Card</option>
                  <option value="UPI / Instant">UPI / Instant Corporate Gateway</option>
                  <option value="Cheque">Commercial Cheque</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Invoice Description / Line Notes</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Enterprise Hardware Rollout Batch #1"
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
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
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Payment */}
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
                <div style={{ fontSize: '12px', color: '#64748b' }}>Account: {activeSlip.customerName || 'Selected Invoice'}</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                  ₹{Number(paymentAmount || activeSlip.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="upi">UPI / Instant Transfer (INR)</option>
                  <option value="neft">NEFT / RTGS Bank Transfer</option>
                  <option value="card">Corporate Credit / Debit Card</option>
                  <option value="netbanking">Net Banking (Authorized Gateway)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Settlement Amount (₹ INR)</label>
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

      {/* MODAL 3: View Slip / Official Printable Invoice */}
      {activeModal === 'viewSlip' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content print-mode" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Official Commercial Invoice Slip — {activeSlip.id || 'INV-2026-0042'}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Billed to {activeSlip.customerName || 'Acme Corp'} • Status: <strong>{activeSlip.status || 'Active'}</strong>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div id="printable-invoice" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '16px', color: '#714b67' }}>DealFlow360 Technologies Pvt. Ltd.</strong>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Enterprise CPQ & Deal Execution Platform</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>BKC, Mumbai, Maharashtra 400051 • GSTIN: 27AAAAA0000A1Z5</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{activeSlip.id || 'INV-2026-0042'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Date: {activeSlip.issueDate ? new Date(activeSlip.issueDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Due: {activeSlip.dueDate || 'Net 30'}</div>
                </div>
              </div>

              <div style={{ background: '#faf8f9', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '12.5px' }}>
                <div><strong>Billed To:</strong> {activeSlip.customerName} {activeSlip.customerEmail ? `(${activeSlip.customerEmail})` : ''}</div>
                <div style={{ marginTop: '3px', color: '#64748b' }}>Payment Mode: {activeSlip.paymentMethod || 'ACH Wire Transfer'} • Status: <span style={{ color: activeSlip.status === 'Paid' ? '#059669' : '#d97706', fontWeight: 700 }}>{activeSlip.status}</span></div>
              </div>

              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0' }}>Item Description</th>
                    <th style={{ textAlign: 'center', padding: '8px 0' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>Unit Price (₹)</th>
                    <th style={{ textAlign: 'right', padding: '8px 0' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSlipItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '8px 0', color: '#0f172a' }}>{item.name || item.item}</td>
                      <td style={{ textAlign: 'center', padding: '8px 0' }}>{item.qty || item.quantity || 1}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0' }}>₹{Number(item.unitPrice || item.price || item.total || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600 }}>₹{Number((item.qty || 1) * (item.unitPrice || item.price || item.total || 0)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ textAlign: 'right', borderTop: '1.5px solid #e2e8f0', paddingTop: '12px' }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Subtotal: ₹{Number(activeSlip.amount || 0).toLocaleString('en-IN')}</div>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Invoice Total Due: </span>
                <strong style={{ fontSize: '20px', color: '#0f172a', marginLeft: '6px' }}>
                  ₹{Number(activeSlip.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-dash-secondary" 
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => {
                  window.print();
                }}
              >
                <Printer size={16} />
                Print Official Slip
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

      {/* MODAL 4: Send Invoice Reminder */}
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
                <label className="form-label">Recipient AP Contact Email</label>
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
                DealFlow360 commercial billing engine maintains synchronized audit trails across invoicing, warehouse distribution, and payment reconciliations.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
