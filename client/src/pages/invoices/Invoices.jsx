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
  AlertTriangle,
  Plus,
  RefreshCw,
  Search
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { fetchInvoices, updateInvoiceStatus, createInvoice } from '../../services/invoiceService';
import { fetchQuotations } from '../../services/quotationService';
import './Invoices.css';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return String(dateStr);
    return dt.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

export default function Invoices({ user, onNavigate, onLogout }) {
  // Toast Notification state
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Modals & Selected Invoice
  const [activeModal, setActiveModal] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
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
  const [genBaseAmount, setGenBaseAmount] = useState('');
  const [genDiscountPercent, setGenDiscountPercent] = useState('0');
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
      if (filteredInvoices.length > 0) {
        setSelectedInvoiceId(prev => prev || filteredInvoices[0].id);
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
      const amount = Number(inv.amount || 0);
      const discountPercent = Number(inv.discountPercent ?? inv.discount_percent ?? 0);
      let baseAmount = Number(inv.baseAmount ?? inv.base_amount ?? 0);
      if (baseAmount <= 0 || (discountPercent > 0 && baseAmount === amount)) {
        if (discountPercent > 0 && discountPercent < 100) {
          baseAmount = Number((amount / (1 - discountPercent / 100)).toFixed(2));
        } else {
          baseAmount = amount;
        }
      }
      const discountAmount = Number(inv.discountAmount ?? inv.discount_amount ?? Math.max(0, baseAmount - amount));

      if (!parsedItems || parsedItems.length === 0) {
        parsedItems = [
          { name: inv.notes || `${inv.customerName} Commercial CPQ Order`, qty: 1, unitPrice: baseAmount > 0 ? baseAmount : amount, total: amount }
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
        subtitle: inv.notes || `Due on ${formatDate(inv.dueDate)}`,
        baseAmount: baseAmount,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        amount: amount,
        status: inv.status,
        dueDate: inv.dueDate,
        issueDate: inv.issueDate,
        paymentMethod: inv.paymentMethod || 'ACH Wire',
        paymentBatch: inv.paymentBatch || 'BATCH-001',
        items: parsedItems,
        raw: inv
      };
    });

  // Current Active Selected Invoice (defaults to selectedId or first batch)
  const activeSlip = invoiceBatches.find(b => b.realId === selectedInvoiceId || b.id === selectedInvoiceId) || invoiceBatches[0] || {};
  const isPaid = activeSlip.status === 'Paid';
  const isOverdue = activeSlip.status === 'Overdue';

  const activeSlipItems = activeSlip.items || [
    { name: 'Commercial Hardware & Platform Package', qty: 1, unitPrice: activeSlip.baseAmount || activeSlip.amount || 124000, total: activeSlip.amount || 124000 }
  ];

  // Computed totals across all invoices
  const totalGross = invoiceBatches.reduce((acc, item) => acc + (item.baseAmount || item.amount), 0);
  const totalDiscounts = invoiceBatches.reduce((acc, item) => acc + (item.discountAmount || 0), 0);
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
      const net = Number(q.total_amount || q.totalAmount || 0);
      const disc = Number(q.discount_percent || q.discountPercent || 0);
      let base = Number(q.base_amount || q.baseAmount || 0);
      if (base <= 0 && disc > 0 && disc < 100) {
        base = Number((net / (1 - disc / 100)).toFixed(2));
      } else if (base <= 0) {
        base = net;
      }
      setGenBaseAmount(base);
      setGenDiscountPercent(disc);
      setGenAmount(net || base);
      setGenNotes(`Commercial CPQ order for ${q.customer_name} (${q.customer_tier || 'Enterprise'} tier)`);
    }
  };

  const handleBaseOrDiscountChange = (baseVal, discVal) => {
    const b = Number(baseVal || 0);
    const d = Number(discVal || 0);
    setGenBaseAmount(baseVal);
    setGenDiscountPercent(discVal);
    if (b > 0 && d >= 0 && d <= 100) {
      const net = Number((b * (1 - d / 100)).toFixed(2));
      setGenAmount(net);
    }
  };

  const handleGenerateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!genCustomerName || !genAmount) {
      showToast('Please enter customer name and invoice amount.');
      return;
    }

    try {
      const created = await createInvoice({
        quotationId: genQuoteId || null,
        customerName: genCustomerName,
        customerEmail: genCustomerEmail,
        baseAmount: Number(genBaseAmount || genAmount),
        discountPercent: Number(genDiscountPercent || 0),
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
      setGenBaseAmount('');
      setGenDiscountPercent('0');
      setGenAmount('');
      setGenNotes('');
      if (created?.id) setSelectedInvoiceId(created.id);
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
      const targetId = activeSlip?.realId || activeSlip?.id;
      if (targetId) {
        await updateInvoiceStatus(targetId, 'Paid', `Payment settled via ${paymentMethod.toUpperCase()} (Ref: ${paymentReference || 'MANUAL-REC'})`);
      }
      showToast(`Payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} recorded & settled for ${activeSlip.customerName}!`);
      setActiveModal(null);
      await loadInvoices();
    } catch (err) {
      showToast(err.message || 'Failed to record payment');
    }
  };

  const handleSendReminderSubmit = (e) => {
    e.preventDefault();
    showToast(`Invoice payment reminder successfully dispatched to ${reminderEmail}!`);
    setActiveModal(null);
  };

  const handleDownloadSummary = () => {
    const headers = ['Invoice #', 'Customer', 'List Price (INR)', 'Discount %', 'Discount Amt (INR)', 'Net Invoiced (INR)', 'Status', 'Due Date', 'Payment Method'];
    const rows = invoiceBatches.map(inv => [
      inv.id,
      inv.customerName,
      inv.baseAmount,
      `${inv.discountPercent}%`,
      inv.discountAmount,
      inv.amount,
      inv.status,
      formatDate(inv.dueDate),
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
    const target = batch || activeSlip;
    if (!target) {
      showToast('No invoice selected to print');
      return;
    }

    // Format items
    let parsedItems = [];
    try {
      parsedItems = typeof target.items === 'string' ? JSON.parse(target.items) : target.items || [];
    } catch {
      parsedItems = [];
    }
    if (!parsedItems || parsedItems.length === 0) {
      parsedItems = [
        { name: target.notes || target.subtitle || `${target.customerName} Commercial CPQ Order`, qty: 1, unitPrice: Number(target.baseAmount || target.amount || 0), total: Number(target.amount || 0) }
      ];
    }

    const itemsHtml = parsedItems.map((item, idx) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-size: 13px; color: #1e293b;">${item.name || item.item || 'Item ' + (idx + 1)}</td>
        <td style="padding: 10px; text-align: center; font-size: 13px; color: #475569;">${item.qty || item.quantity || 1}</td>
        <td style="padding: 10px; text-align: right; font-size: 13px; color: #475569;">₹${Number(item.unitPrice || item.price || item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; text-align: right; font-size: 13px; font-weight: 600; color: #0f172a;">₹${Number((item.qty || 1) * (item.unitPrice || item.price || item.total || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const baseVal = Number(target.baseAmount || target.amount || 0);
    const discPct = Number(target.discountPercent || 0);
    const discAmt = Number(target.discountAmount || Math.max(0, baseVal - Number(target.amount || 0)));
    const netVal = Number(target.amount || 0);
    const isSettled = target.status === 'Paid';

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Tax Invoice - ${target.id || 'INV'}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              padding: 32px 40px;
              font-size: 14px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }
            .company-title {
              font-size: 22px;
              font-weight: 800;
              color: #714b67;
              letter-spacing: -0.02em;
            }
            .company-meta {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
              line-height: 1.4;
            }
            .invoice-tag {
              text-align: right;
            }
            .invoice-tag h1 {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .meta-box {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px 20px;
              margin-bottom: 24px;
            }
            .meta-box h4 {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
              margin-bottom: 6px;
            }
            .meta-box p {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              margin-top: 4px;
            }
            .badge-paid { background: #dcfce7; color: #15803d; }
            .badge-unpaid { background: #fef3c7; color: #b45309; }
            .discount-callout {
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              color: #166534;
              padding: 8px 14px;
              border-radius: 6px;
              font-size: 12.5px;
              font-weight: 600;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              background: #f1f5f9;
              color: #475569;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.04em;
              padding: 10px;
              border-top: 1px solid #e2e8f0;
              border-bottom: 1px solid #e2e8f0;
            }
            .summary-table {
              width: 360px;
              margin-left: auto;
              margin-bottom: 24px;
            }
            .summary-table td {
              padding: 6px 0;
              font-size: 13.5px;
            }
            .total-row {
              border-top: 2px solid #0f172a;
              font-weight: 800;
              font-size: 16px !important;
              color: #0f172a;
            }
            .footer-note {
              margin-top: 32px;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              font-size: 11.5px;
              color: #64748b;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { padding: 10mm 12mm; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-title">DealFlow360 Technologies Pvt. Ltd.</div>
              <div class="company-meta">Enterprise Deal Intelligence & Commercial CPQ Platform</div>
              <div class="company-meta">Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051</div>
              <div class="company-meta">GSTIN: 27AAAAA0000A1Z5 | PAN: AAACD1234F</div>
            </div>
            <div class="invoice-tag">
              <h1>TAX INVOICE</h1>
              <div style="font-size: 14px; font-weight: 700; color: #714b67; margin-top: 2px;">${target.id || target.invoiceNumber || 'INV-001'}</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: ${formatDate(target.issueDate || new Date())}</div>
              <div style="font-size: 12px; color: #64748b;">Due Date: ${formatDate(target.dueDate || new Date())}</div>
            </div>
          </div>

          <div class="meta-box">
            <div>
              <h4>Billed To:</h4>
              <p>${target.customerName || 'Valued Customer'}</p>
              ${target.customerEmail ? `<div style="font-size: 12.5px; color: #475569; margin-top: 2px;">${target.customerEmail}</div>` : ''}
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Terms: Net 30 Commercial</div>
            </div>
            <div style="text-align: right;">
              <h4>Payment Status & Method:</h4>
              <div>
                <span class="badge ${isSettled ? 'badge-paid' : 'badge-unpaid'}">
                  ${isSettled ? 'PAID / SETTLED' : 'PAYMENT DUE'}
                </span>
              </div>
              <div style="font-size: 12.5px; color: #475569; margin-top: 6px;">
                Method: <strong>${target.paymentMethod || 'ACH / Bank Wire'}</strong>
              </div>
            </div>
          </div>

          ${discPct > 0 || discAmt > 0 ? `
          <div class="discount-callout">
            <span>🏷️ Commercial Tier Discount Applied: <strong>${discPct}%</strong></span>
            <span>Total Savings: <strong>-₹${discAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
          </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Item Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 140px;">Unit Price (₹)</th>
                <th style="text-align: right; width: 140px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-table">
            <table style="margin-bottom: 0;">
              <tr>
                <td style="color: #64748b;">Gross List Price:</td>
                <td style="text-align: right; font-weight: 600;">₹${baseVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              ${discPct > 0 || discAmt > 0 ? `
              <tr style="color: #059669;">
                <td>Applied Discount (${discPct}%):</td>
                <td style="text-align: right; font-weight: 600;">-₹${discAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="color: #64748b;">GST / Taxes (Included):</td>
                <td style="text-align: right; font-weight: 600;">₹0.00</td>
              </tr>
              <tr class="total-row">
                <td style="padding-top: 8px;">Net Invoiced Total:</td>
                <td style="text-align: right; padding-top: 8px; color: #714b67;">₹${netVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR</td>
              </tr>
            </table>
          </div>

          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 12px 16px; margin-top: 16px; font-size: 12px; color: #475569;">
            <strong>Electronic Remittance Information:</strong><br/>
            Bank: HDFC Bank Ltd | A/C No: 50200012345678 | IFSC: HDFC0000123 | Branch: BKC Corporate, Mumbai<br/>
            <em>Please quote Invoice ${target.id || target.invoiceNumber} in the transaction narration.</em>
          </div>

          <div class="footer-note">
            <div>This is an official computer-generated commercial tax invoice.</div>
            <div>DealFlow360 • Finance & Revenue Engine</div>
          </div>
        </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank', 'width=880,height=920');
      if (printWindow && printWindow.document) {
        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 350);
        return;
      }
    } catch {
      // ignore and fallback
    }

    // Fallback using invisible iframe
    let iframe = document.getElementById('print-invoice-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-invoice-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
    }, 350);
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
              <span className="badge-active-record">ACCOUNTS RECEIVABLE</span>
            </div>
            <h1 className="invoices-title">
              {activeSlip.id
                ? `Invoice Detail: ${activeSlip.id} (${activeSlip.customerName})`
                : 'Invoices & Commercial Billing Statements'}
            </h1>
            <p className="invoices-subtitle">
              {activeSlip.id
                ? `Active billing lifecycle and payment settlement history for ${activeSlip.customerName}`
                : 'View and manage commercial billing history and payment statements.'}
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
              onClick={() => handlePrintSlip(activeSlip)}
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
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '400px' }}>
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
            {/* SECTION 1: Stepper Progress Pipeline (Reacts to Tapped/Selected Order) */}
            <div className="invoices-stepper-card">
              <div className="stepper-header-row">
                <div className="stepper-title-kicker">ORDER & FULFILLMENT PIPELINE</div>
                <div className="stepper-stage-indicator" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {isPaid ? (
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      Stage 4 of 4: <span className="stepper-stage-bold">Settled & Reconciled</span>
                    </span>
                  ) : isOverdue ? (
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>
                      Stage 3 of 4: <span className="stepper-stage-bold">Payment Overdue</span>
                    </span>
                  ) : (
                    <span>
                      Stage 3 of 4: <span className="stepper-stage-bold">Awaiting Payment Settlement</span>
                    </span>
                  )}
                  {(activeSlip.discountPercent > 0 || activeSlip.discountAmount > 0) && (
                    <span style={{ 
                      background: '#ecfdf5', 
                      color: '#047857', 
                      border: '1px solid #a7f3d0', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11.5px', 
                      fontWeight: 700 
                    }}>
                      🏷️ {activeSlip.discountPercent}% Discount Applied (Saved ₹{Number(activeSlip.discountAmount || 0).toLocaleString('en-IN')})
                    </span>
                  )}
                </div>
              </div>

              <div className="stepper-progress-bar">
                {/* Step 1: Order Confirmed */}
                <div className="stepper-step completed">
                  <div className="stepper-node-icon">
                    <Check size={18} />
                  </div>
                  <div className="stepper-node-label">Order Confirmed</div>
                  <div className="stepper-node-date">{formatDate(activeSlip.issueDate)}</div>
                </div>

                {/* Line 1 -> 2 */}
                <div className="stepper-connector-line active" style={{ left: '25%', width: '25%' }}></div>

                {/* Step 2: Shipped / Provisioned */}
                <div className="stepper-step completed">
                  <div className="stepper-node-icon">
                    <Check size={18} />
                  </div>
                  <div className="stepper-node-label">Provisioned</div>
                  <div className="stepper-node-date">Fulfillment Cleared</div>
                </div>

                {/* Line 2 -> 3 */}
                <div className="stepper-connector-line active" style={{ left: '50%', width: '25%' }}></div>

                {/* Step 3: Invoiced */}
                <div className={`stepper-step ${isPaid ? 'completed' : isOverdue ? 'current' : 'current'}`}>
                  <div className="stepper-node-icon">
                    {isPaid ? <Check size={18} /> : isOverdue ? <AlertTriangle size={18} color="#d97706" /> : <FileText size={18} />}
                  </div>
                  <div className="stepper-node-label">Invoiced</div>
                  <div className="stepper-node-date">Due: {formatDate(activeSlip.dueDate)}</div>
                </div>

                {/* Line 3 -> 4 */}
                <div className={`stepper-connector-line ${isPaid ? 'active' : 'inactive'}`} style={{ left: '75%', width: '25%' }}></div>

                {/* Step 4: Paid */}
                <div className={`stepper-step ${isPaid ? 'completed' : 'pending'}`}>
                  <div className="stepper-node-icon">
                    {isPaid ? <Check size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="stepper-node-label">Paid</div>
                  <div className="stepper-node-date">
                    {isPaid ? `Settled (${activeSlip.paymentMethod || 'Wire'})` : 'Pending Settlement'}
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
                    Invoices synchronized with all customer CPQ quotes, contracts, and delivery batches
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
                      <th>GROSS LIST PRICE</th>
                      <th>DISCOUNT</th>
                      <th>NET INVOICE</th>
                      <th>STATUS</th>
                      <th>DUE DATE</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceBatches.map(batch => {
                      const isRowSelected = (batch.realId === activeSlip.realId || batch.id === activeSlip.id);
                      return (
                        <tr 
                          key={batch.id} 
                          style={{
                            background: isRowSelected ? '#fbf8fa' : 'transparent',
                            outline: isRowSelected ? '2px solid #714b67' : 'none',
                            outlineOffset: '-2px',
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                          onClick={() => setSelectedInvoiceId(batch.realId || batch.id)}
                        >
                          {/* Invoice # */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`status-dot ${batch.dotColor}`}></span>
                              <div>
                                <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{batch.id}</strong>
                                <span style={{ 
                                  marginLeft: '6px', 
                                  fontSize: '11px', 
                                  fontWeight: 700, 
                                  color: batch.status === 'Paid' ? '#059669' : '#64748b' 
                                }}>
                                  {batch.badge}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td>
                            <div>
                              <div className="inv-batch-title">{batch.title}</div>
                              <div className="inv-batch-subtitle">{batch.subtitle}</div>
                            </div>
                          </td>

                          {/* Gross List Price */}
                          <td style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>
                            ₹{Number(batch.baseAmount || batch.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Discount */}
                          <td>
                            {batch.discountPercent > 0 || batch.discountAmount > 0 ? (
                              <span style={{ 
                                background: '#ecfdf5', 
                                color: '#047857', 
                                border: '1px solid #a7f3d0', 
                                padding: '2px 7px', 
                                borderRadius: '4px', 
                                fontSize: '11.5px', 
                                fontWeight: 700,
                                display: 'inline-block'
                              }}>
                                {batch.discountPercent}% (-₹{Number(batch.discountAmount || 0).toLocaleString('en-IN')})
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>0% (List)</span>
                            )}
                          </td>

                          {/* Net Amount */}
                          <td style={{ fontWeight: 700, color: '#0f172a' }}>
                            ₹{batch.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`batch-status-tag ${batch.status.toLowerCase()}`}>
                              {batch.status}
                            </span>
                          </td>

                          {/* Due Date */}
                          <td style={{ color: '#475569', fontWeight: 500 }}>
                            {formatDate(batch.dueDate)}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="inv-actions-cell" onClick={(e) => e.stopPropagation()}>
                              {batch.status !== 'Paid' ? (
                                <>
                                  <button 
                                    className="btn-pay-now-link"
                                    onClick={() => {
                                      setSelectedInvoiceId(batch.realId || batch.id);
                                      setPaymentAmount(batch.amount);
                                      setActiveModal('recordPayment');
                                    }}
                                  >
                                    Pay Now
                                  </button>
                                  <span style={{ color: '#cbd5e1' }}>|</span>
                                  <button 
                                    className="btn-view-slip-link"
                                    onClick={() => {
                                      setSelectedInvoiceId(batch.realId || batch.id);
                                      setActiveModal('viewSlip');
                                    }}
                                  >
                                    Slip
                                  </button>
                                  <span style={{ color: '#cbd5e1' }}>|</span>
                                  <button 
                                    className="btn-view-slip-link"
                                    title="Print Invoice"
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
                                      setSelectedInvoiceId(batch.realId || batch.id);
                                      setActiveModal('viewSlip');
                                    }}
                                  >
                                    Receipt
                                  </button>
                                  <span style={{ color: '#cbd5e1' }}>|</span>
                                  <button 
                                    className="btn-view-slip-link"
                                    title="Print Official Slip"
                                    onClick={() => handlePrintSlip(batch)}
                                  >
                                    <Printer size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Print
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Summary Footer */}
              <div className="inv-summary-footer-row">
                <div className="inv-account-details-left">
                  <div><strong>Active Account:</strong> {activeSlip.customerName} {activeSlip.customerEmail ? `(${activeSlip.customerEmail})` : ''}</div>
                  <div><strong>Commercial Policy:</strong> Net 30 Terms Apply (INR) • Real-time CPQ Sync</div>
                </div>

                <div className="inv-totals-box-right">
                  <div className="inv-totals-sub-row">
                    <span>Gross List Total:</span>
                    <span>₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {totalDiscounts > 0 && (
                    <div className="inv-totals-sub-row" style={{ color: '#059669', fontWeight: 600 }}>
                      <span>Discounts Provided:</span>
                      <span>-₹{totalDiscounts.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="inv-totals-sub-row">
                    <span>Net Invoiced Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {settledCredit > 0 && (
                    <div className="inv-totals-sub-row credit">
                      <span>Settled Credit:</span>
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
            <div className="inv-guardrail-title">AUTOMATED FULFILLMENT GUARDRAIL</div>
            <div className="inv-guardrail-headline">
              Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships.
            </div>
            <div className="inv-guardrail-body">
              Warehouse fulfillment node confirms dispatch before triggering automated debit slips. Subsequent shipment batches generate once remaining inventory clears customs.
            </div>
          </div>
        </div>

        {/* SECTION 4: Bottom Action Bar */}
        <div className="inv-bottom-actions-row">
          <div className="inv-bottom-buttons-left">
            <button 
              className="btn-record-payment"
              onClick={() => {
                setPaymentAmount(activeSlip.status !== 'Paid' ? activeSlip.amount : totalOutstanding);
                setActiveModal('recordPayment');
              }}
            >
              <CreditCard size={15} />
              <span>Record Payment</span>
            </button>

            <button 
              className="btn-inv-outline"
              onClick={() => handlePrintSlip(activeSlip)}
            >
              <Printer size={15} />
              <span>Print Active Slip</span>
            </button>
          </div>

          <div className="inv-bottom-links-right">
            <button 
              className="btn-inv-text-action"
              onClick={() => {
                setReminderEmail(activeSlip.customerEmail || 'finance@enterprise.com');
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

      {/* MODAL 1: Issue / Generate New Commercial Invoice */}
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
                        #{q.id} — {q.customer_name || q.customerName} ({Number(q.discount_percent || 0)}% disc • ₹{Number(q.total_amount || q.totalAmount || 0).toLocaleString('en-IN')})
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Gross List (₹)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 150000"
                    value={genBaseAmount}
                    onChange={(e) => handleBaseOrDiscountChange(e.target.value, genDiscountPercent)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount (%)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="form-input"
                    placeholder="0"
                    value={genDiscountPercent}
                    onChange={(e) => handleBaseOrDiscountChange(genBaseAmount, e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Net Total (₹ INR)</label>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
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

                <div className="form-group">
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
                <div style={{ fontSize: '12px', color: '#64748b' }}>Account: {activeSlip.customerName} ({activeSlip.id})</div>
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
                  placeholder="e.g. TXN-89412"
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

      {/* MODAL 3: Official Printable Invoice / Slip */}
      {activeModal === 'viewSlip' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content print-mode" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Official Commercial Invoice Slip — {activeSlip.id}
                </h3>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Billed to {activeSlip.customerName} • Status: <strong style={{ color: isPaid ? '#059669' : '#d97706' }}>{activeSlip.status}</strong>
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
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{activeSlip.id}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Date: {formatDate(activeSlip.issueDate)}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Due: {formatDate(activeSlip.dueDate)}</div>
                </div>
              </div>

              <div style={{ background: '#faf8f9', padding: '10px 14px', borderRadius: '6px', marginBottom: '14px', fontSize: '12.5px' }}>
                <div><strong>Billed To:</strong> {activeSlip.customerName} {activeSlip.customerEmail ? `(${activeSlip.customerEmail})` : ''}</div>
                <div style={{ marginTop: '3px', color: '#64748b' }}>Payment Mode: {activeSlip.paymentMethod || 'ACH Wire Transfer'} • Status: <span style={{ color: isPaid ? '#059669' : '#d97706', fontWeight: 700 }}>{activeSlip.status}</span></div>
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
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                  Gross List Price: ₹{Number(activeSlip.baseAmount || activeSlip.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                {(activeSlip.discountPercent > 0 || activeSlip.discountAmount > 0) && (
                  <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '4px' }}>
                    Applied Commercial Discount ({activeSlip.discountPercent || 0}%): -₹{Number(activeSlip.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <span style={{ fontSize: '14px', color: '#64748b' }}>Net Invoice Total Due: </span>
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
                onClick={() => handlePrintSlip(activeSlip)}
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
