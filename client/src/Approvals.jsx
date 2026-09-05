import React, { useState } from 'react';
import { 
  Search, 
  Upload, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  MoreVertical, 
  ArrowRight, 
  Info, 
  Check, 
  X, 
  FileText, 
  User, 
  LogOut, 
  Settings, 
  Globe, 
  HelpCircle,
  Download,
  RotateCcw,
  ShieldCheck,
  Send,
  MessageSquare
} from 'lucide-react';
import './Approvals.css';

export default function Approvals({ user, onNavigate, onLogout }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeStatusFilter, setActiveStatusFilter] = useState('all'); // 'all' | 'pending' | 'returned' | 'approved'
  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'HIGH' | 'MEDIUM' | 'LOW'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [reviewingItem, setReviewingItem] = useState(null);
  const [auditItem, setAuditItem] = useState(null);
  const [remarksItem, setRemarksItem] = useState(null);
  const [isNewApprovalOpen, setIsNewApprovalOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  // Form state for new approval
  const [newQuoteId, setNewQuoteId] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newStage, setNewStage] = useState('Sales Manager');

  // Approval Records
  const [records, setRecords] = useState([
    {
      id: 'Q-1042',
      customer: 'Acme Corp',
      avatar: 'AC',
      status: 'pending',
      amount: 124000,
      discount: '22% requested discount',
      discountNum: 22,
      risk: 'HIGH',
      stage: 'Sales Manager',
      stageClass: 'sales-mgr',
      assignedTo: 'M. Shah',
      assignedAvatar: 'MS',
      assignedClass: 'ms',
      notes: 'Customer requested 22% discount for a 3-year upfront multi-tier commitment. Exceeds standard 15% manager authorization.'
    },
    {
      id: 'Q-1039',
      customer: 'Beta Industries',
      avatar: 'BI',
      status: 'pending',
      amount: 88500,
      discount: '15% requested discount',
      discountNum: 15,
      risk: 'MEDIUM',
      stage: 'Finance',
      stageClass: 'finance',
      assignedTo: 'R. Iyer',
      assignedAvatar: 'RI',
      assignedClass: 'ri',
      notes: 'Annual upfront prepayment requested with custom SLA waiver.'
    },
    {
      id: 'Q-1035',
      customer: 'Nova Retail',
      avatar: 'NR',
      status: 'approved',
      amount: 32000,
      discount: '5% tier discount',
      discountNum: 5,
      risk: 'LOW',
      stage: 'Auto-Approved',
      stageClass: 'auto-appr',
      assignedTo: '- (Rule #4 Engine)',
      assignedAvatar: null,
      notes: 'Standard Tier-1 volume discount within automated policy bounds.'
    },
    {
      id: 'Q-1029',
      customer: 'Zenith Co',
      avatar: 'ZC',
      status: 'returned',
      amount: 215000,
      discount: '28% requested discount',
      discountNum: 28,
      risk: 'HIGH',
      stage: 'VP Sales Review',
      stageClass: 'vp-review',
      assignedTo: 'S. Jenkins',
      assignedAvatar: 'SJ',
      assignedClass: 'sj',
      remarks: 'Returned by VP Sales: 28% discount cuts gross margin below allowable 42% hurdle rate. Counter-offer with max 18% + extended support credits.'
    },
    {
      id: 'Q-1024',
      customer: 'Delta LLC',
      avatar: 'DL',
      status: 'pending',
      amount: 64200,
      discount: '12% requested discount',
      discountNum: 12,
      risk: 'MEDIUM',
      stage: 'Finance',
      stageClass: 'finance',
      assignedTo: 'R. Iyer',
      assignedAvatar: 'RI',
      assignedClass: 'ri',
      notes: 'Mid-market package discount awaiting quarterly finance ledger confirmation.'
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['Quotation ID,Customer,Amount,Discount,Risk Level,Stage,Assigned To,Status\n'];
    const rows = records.map(r => 
      `"${r.id}","${r.customer}","$${r.amount}","${r.discount}","${r.risk}","${r.stage}","${r.assignedTo}","${r.status}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DealFlow360_Approvals_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported approvals dataset to CSV.');
  };

  // Handle Approval Decisions
  const handleApprove = (recordId) => {
    setRecords(records.map(r => r.id === recordId ? { ...r, status: 'approved', stage: 'Approved', stageClass: 'auto-appr' } : r));
    setReviewingItem(null);
    setReviewComment('');
    showToast(`Quotation ${recordId} approved!`);
  };

  const handleReturn = (recordId) => {
    if (!reviewComment) {
      showToast('Please provide return remarks for the sales team.');
      return;
    }
    setRecords(records.map(r => r.id === recordId ? { 
      ...r, 
      status: 'returned', 
      stage: 'Returned with Feedback', 
      stageClass: 'vp-review',
      remarks: reviewComment 
    } : r));
    setReviewingItem(null);
    setReviewComment('');
    showToast(`Quotation ${recordId} returned with remarks.`);
  };

  const handleCreateNewApproval = (e) => {
    e.preventDefault();
    if (!newCustomer || !newAmount) {
      showToast('Please enter customer name and contract value.');
      return;
    }

    const nextId = newQuoteId || `Q-${1050 + records.length}`;
    const discVal = parseFloat(newDiscount) || 10;
    const riskLevel = discVal > 20 ? 'HIGH' : discVal > 10 ? 'MEDIUM' : 'LOW';

    const newRecord = {
      id: nextId,
      customer: newCustomer,
      avatar: newCustomer.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase(),
      status: 'pending',
      amount: parseFloat(newAmount) || 50000,
      discount: `${discVal}% requested discount`,
      discountNum: discVal,
      risk: riskLevel,
      stage: newStage,
      stageClass: newStage === 'Finance' ? 'finance' : 'sales-mgr',
      assignedTo: user?.name || 'M. Shah',
      assignedAvatar: user?.initials || 'MS',
      assignedClass: 'ms',
      notes: 'New discount approval request submitted via DealFlow360.'
    };

    setRecords([newRecord, ...records]);
    setIsNewApprovalOpen(false);
    setNewCustomer('');
    setNewAmount('');
    setNewDiscount('');
    showToast(`Approval request ${nextId} created for ${newCustomer}!`);
  };

  // Filter records
  const filteredRecords = records.filter(r => {
    const matchesStatus = activeStatusFilter === 'all' || r.status === activeStatusFilter;
    const matchesRisk = riskFilter === 'all' || r.risk === riskFilter;
    const matchesSearch = r.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.stage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesRisk && matchesSearch;
  });

  const pendingCount = records.filter(r => r.status === 'pending').length;
  const returnedCount = records.filter(r => r.status === 'returned').length;
  const approvedCount = records.filter(r => r.status === 'approved').length;

  return (
    <div className="approvals-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <Check size={20} color="#e9d5e3" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-header-left">
            {/* Logo and Brand Title */}
            <div className="dash-brand" onClick={() => onNavigate('dashboard')}>
              <img src="/logo.png" alt="DealFlow360 Logo" className="dash-logo" />
              <span className="dash-brand-name">
                <span className="dash-brand-dark">DealFlow</span>
                <span className="dash-brand-purple">360</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="dash-nav-tabs" role="tablist">
              <button
                className="nav-tab-item"
                onClick={() => onNavigate('dashboard')}
              >
                <span>Dashboard</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => onNavigate('quotations')}
              >
                <span>Quotations</span>
              </button>

              <button
                className="nav-tab-item active"
                onClick={() => onNavigate('approvals')}
              >
                <span>Approvals</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Fulfillment module')}
              >
                <span>Fulfillment</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Subscriptions module')}
              >
                <span>Subscriptions</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Invoices module')}
              >
                <span>Invoices</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Deal Health check: 3 flagged deals')}
              >
                <span>Deal Health</span>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', marginLeft: '4px' }}></span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Reports')}
              >
                <span>Reports</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Product Catalog')}
              >
                <span>Product</span>
              </button>
            </nav>
          </div>

          {/* Header Right Actions */}
          <div className="dash-header-right">
            <button 
              className="btn-dash-link"
              onClick={() => showToast('DealFlow360 Priority Support Desk')}
            >
              Support
            </button>
            <button 
              className="btn-dash-contact"
              onClick={() => showToast('Opening enterprise sales desk')}
            >
              Contact Sales
            </button>
            <button 
              className="btn-icon-circle"
              title="Regional Settings"
              onClick={() => showToast('Global Region: US-East')}
            >
              <Globe size={16} />
            </button>

            {/* User Avatar */}
            <div className="user-avatar-wrapper">
              <button 
                className="user-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Account Menu"
              >
                {user?.initials || 'AM'}
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user?.name || 'Alex Morgan'}</div>
                    <div className="user-dropdown-email">{user?.email || 'alex.morgan@firm-capital.com'}</div>
                  </div>
                  <button 
                    className="dropdown-item" 
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('dashboard');
                    }}
                  >
                    <span>Dashboard</span>
                  </button>
                  <button 
                    className="dropdown-item logout" 
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Approvals Area */}
      <main className="approvals-main">
        {/* Page Subheader */}
        <div className="approvals-header-row">
          <div className="approvals-title-group">
            <h1 className="approvals-title">Approvals (List)</h1>
            <p className="approvals-subtitle">
              Every quotation that needed, needs, or is going through discount approval
            </p>
          </div>

          <div className="approvals-actions-group">
            <button className="btn-export-csv" onClick={handleExportCSV}>
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button className="btn-new-approval" onClick={() => setIsNewApprovalOpen(true)}>
              <Plus size={16} />
              <span>+ New Approval Request</span>
            </button>
          </div>
        </div>

        {/* Status Filters & Search Bar */}
        <div className="approvals-filter-bar">
          <div className="filter-pills-left">
            <button
              className={`status-filter-pill pending ${activeStatusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'pending' ? 'all' : 'pending')}
            >
              <span>● {pendingCount} Pending</span>
            </button>

            <button
              className={`status-filter-pill returned ${activeStatusFilter === 'returned' ? 'active' : ''}`}
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'returned' ? 'all' : 'returned')}
            >
              <span>● {returnedCount} Returned</span>
            </button>

            <button
              className={`status-filter-pill approved ${activeStatusFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'approved' ? 'all' : 'approved')}
            >
              <span>● {approvedCount} Approved</span>
            </button>

            <button
              className={`status-filter-pill ${activeStatusFilter === 'pending' ? 'outline-active' : ''}`}
              onClick={() => setActiveStatusFilter(activeStatusFilter === 'pending' ? 'all' : 'pending')}
              style={{ border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569' }}
            >
              <Filter size={13} />
              <span>Filter: Pending Only</span>
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }}></span>
            </button>
          </div>

          <div className="filter-controls-right">
            <div className="approvals-search-wrapper">
              <Search size={15} className="approvals-search-icon" />
              <input
                type="text"
                className="approvals-search-input"
                placeholder="Search customer or quote..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="risk-filter-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="all">All Risk Levels</option>
              <option value="HIGH">HIGH Risk</option>
              <option value="MEDIUM">MEDIUM Risk</option>
              <option value="LOW">LOW Risk</option>
            </select>
          </div>
        </div>

        {/* Approvals Main Table */}
        <div className="approvals-table-card">
          <table className="approvals-table">
            <thead>
              <tr>
                <th>QUOTATION</th>
                <th>CUSTOMER</th>
                <th>DEAL VALUE & DISCOUNT</th>
                <th>BLENDED RISK</th>
                <th>STAGE</th>
                <th>ASSIGNED TO</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(item => (
                <tr key={item.id}>
                  {/* QUOTATION */}
                  <td>
                    <div className="quote-code-cell">
                      <span className="quote-code-num">{item.id}</span>
                      <span className={`status-badge-inline ${item.status}`}>
                        {item.status === 'pending' ? 'Pending' : item.status === 'approved' ? 'Approved' : 'Returned'}
                      </span>
                    </div>
                  </td>

                  {/* CUSTOMER */}
                  <td>
                    <div className="customer-cell">
                      <span className="customer-avatar-badge">{item.avatar}</span>
                      <span className="customer-name">{item.customer}</span>
                    </div>
                  </td>

                  {/* DEAL VALUE & DISCOUNT */}
                  <td>
                    <div className="deal-value-cell">
                      <span className="deal-value-amount">${item.amount.toLocaleString()}</span>
                      <span className={`discount-subtext ${item.discountNum >= 20 ? 'red' : item.discountNum >= 10 ? 'amber' : 'green'}`}>
                        {item.discount}
                      </span>
                    </div>
                  </td>

                  {/* BLENDED RISK */}
                  <td>
                    <span className={`risk-pill ${item.risk.toLowerCase()}`}>
                      ● {item.risk}
                    </span>
                  </td>

                  {/* STAGE */}
                  <td>
                    <span className={`stage-pill ${item.stageClass}`}>
                      {item.stage}
                    </span>
                  </td>

                  {/* ASSIGNED TO */}
                  <td>
                    <div className="assigned-cell">
                      {item.assignedAvatar && (
                        <span className={`assignee-avatar ${item.assignedClass}`}>
                          {item.assignedAvatar}
                        </span>
                      )}
                      <span>{item.assignedTo}</span>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <div className="actions-cell">
                      {item.status === 'pending' && (
                        <button 
                          className="btn-table-review"
                          onClick={() => setReviewingItem(item)}
                        >
                          <span>Review Approval</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      {item.status === 'approved' && (
                        <button 
                          className="btn-table-outlined"
                          onClick={() => setAuditItem(item)}
                        >
                          <span>View Audit</span>
                        </button>
                      )}

                      {item.status === 'returned' && (
                        <button 
                          className="btn-table-outlined"
                          onClick={() => setRemarksItem(item)}
                        >
                          <span>View Remarks</span>
                        </button>
                      )}

                      <button 
                        className="btn-table-more"
                        title="More Options"
                        onClick={() => setReviewingItem(item)}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Footer with Pagination */}
          <div className="table-pagination-footer">
            <div>
              Showing <strong>1</strong> to <strong>{filteredRecords.length}</strong> of <strong>16</strong> approval records
            </div>

            <div className="pagination-controls">
              <button 
                className="btn-page-nav" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <button className="btn-page-number active">1</button>
              <button className="btn-page-number" onClick={() => showToast('Viewing Page 2')}>2</button>
              <button className="btn-page-number" onClick={() => showToast('Viewing Page 3')}>3</button>
              <button 
                className="btn-page-nav"
                onClick={() => showToast('Viewing next page records')}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Info Tip Banner at Bottom */}
        <div className="approvals-info-banner">
          <div className="info-banner-left">
            <div className="info-banner-icon">i</div>
            <div>
              <div className="info-banner-text-title">
                Click any row to open its full approval detail, risk breakdown, and audit trail.
              </div>
              <div className="info-banner-text-desc">
                You will be able to review margin implications, prior deal history, escalations, and write reviewer comments.
              </div>
            </div>
          </div>

          <div className="shortcut-badge">
            Shortcut: Enter ↵
          </div>
        </div>

      </main>

      {/* Review Approval Modal */}
      {reviewingItem && (
        <div className="modal-overlay" onClick={() => setReviewingItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#714b67' }}>{reviewingItem.id}</span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                  Review Approval: {reviewingItem.customer}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setReviewingItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="review-modal-section">
              <div className="review-metric-row">
                <span style={{ color: '#64748b' }}>Quoted Contract Value</span>
                <strong style={{ fontSize: '16px' }}>${reviewingItem.amount.toLocaleString()}</strong>
              </div>
              <div className="review-metric-row">
                <span style={{ color: '#64748b' }}>Requested Discount</span>
                <strong style={{ color: '#e11d48' }}>{reviewingItem.discount}</strong>
              </div>
              <div className="review-metric-row">
                <span style={{ color: '#64748b' }}>Blended Deal Risk</span>
                <span className={`risk-pill ${reviewingItem.risk.toLowerCase()}`}>● {reviewingItem.risk}</span>
              </div>
              <div className="review-metric-row" style={{ marginTop: '6px' }}>
                <span style={{ color: '#64748b' }}>Estimated Gross Margin</span>
                <strong style={{ color: '#059669' }}>52.4% (Standard Benchmark: 48%)</strong>
              </div>
            </div>

            {reviewingItem.notes && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#faf5f8', border: '1px solid #e9d5e3', color: '#54324c', fontSize: '12.5px', marginBottom: '16px' }}>
                <strong>Deal Notes:</strong> {reviewingItem.notes}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Reviewer Comments / Terms Adjustment</label>
              <textarea
                className="review-comment-textarea"
                placeholder="Add optional internal sign-off notes or explain return reasons..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-dash-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => handleApprove(reviewingItem.id)}
              >
                <Check size={16} />
                <span>Approve Quotation</span>
              </button>

              <button
                type="button"
                className="btn-dash-secondary"
                style={{ flex: 1, justifyContent: 'center', borderColor: '#fecdd3', color: '#e11d48' }}
                onClick={() => handleReturn(reviewingItem.id)}
              >
                <RotateCcw size={15} />
                <span>Return with Remarks</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {auditItem && (
        <div className="modal-overlay" onClick={() => setAuditItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>{auditItem.id} (Auto-Approved)</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Audit Trail: {auditItem.customer}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setAuditItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <strong>Trigger:</strong> Rule #4 Engine (Under 10% Discount Threshold)
              </div>
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <strong>Execution Timestamp:</strong> Today at 10:42 AM (Automated)
              </div>
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <strong>Contract Signature Ready:</strong> Yes (Certificate #DF360-9372-SEC)
              </div>
            </div>

            <button 
              type="button" 
              className="btn-dash-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
              onClick={() => setAuditItem(null)}
            >
              Close Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {remarksItem && (
        <div className="modal-overlay" onClick={() => setRemarksItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#e11d48' }}>{remarksItem.id} (Returned)</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Remarks: {remarksItem.customer}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setRemarksItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#fff1f2', padding: '14px', borderRadius: '10px', border: '1px solid #fecdd3', color: '#9f1239', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
              <strong>VP Sales Review Feedback:</strong>
              <div style={{ marginTop: '6px' }}>
                {remarksItem.remarks || 'Discount exceeds margin tolerance. Revise payment schedules or reduce seat count before re-submitting.'}
              </div>
            </div>

            <button 
              type="button" 
              className="btn-dash-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                showToast(`Opened revision editor for ${remarksItem.id}`);
                setRemarksItem(null);
                if (onNavigate) onNavigate('quotations');
              }}
            >
              <span>Edit Quotation & Re-submit</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* New Approval Request Modal */}
      {isNewApprovalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewApprovalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                New Discount Approval Request
              </h3>
              <button className="modal-close-btn" onClick={() => setIsNewApprovalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewApproval}>
              <div className="form-group">
                <label className="form-label">Quotation ID (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q-1055"
                  value={newQuoteId}
                  onChange={(e) => setNewQuoteId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer / Client Organization</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Horizon Fintech Group"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-two">
                <div>
                  <label className="form-label">Contract Value ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="95,000"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Requested Discount (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="18"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Approval Routing Stage</label>
                <select
                  className="form-input"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                >
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Finance">Finance Department</option>
                  <option value="VP Sales Review">VP Sales Review</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-new-approval"
                style={{ width: '100%', justifyContent: 'center', height: '46px', marginTop: '10px' }}
              >
                <span>Submit for Discount Approval</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>© 2025 DealFlow360 Inc. All rights reserved. Enterprise-grade deal intelligence.</span>
          </div>

          <div className="footer-links">
            <button className="footer-link" onClick={() => showToast('Privacy Policy')}>
              Privacy Policy
            </button>
            <button className="footer-link" onClick={() => showToast('Terms of Service')}>
              Terms of Service
            </button>
            <button className="footer-link" onClick={() => showToast('Security & Compliance')}>
              Security & Compliance
            </button>
            <div className="status-badge">
              <span className="pulse-dot"></span>
              <span>System Status</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
