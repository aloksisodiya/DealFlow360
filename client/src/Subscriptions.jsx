import React, { useState } from 'react';
import { 
  Upload, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  FileText, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  Play,
  Pause,
  Filter,
  RefreshCw,
  Sliders,
  ChevronDown
} from 'lucide-react';
import Navbar from './Navbar';
import './Subscriptions.css';

export default function Subscriptions({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Subscriptions List State (Initialized matching screenshot)
  const [subscriptions, setSubscriptions] = useState([
    {
      id: 'SUB-89021',
      customer: 'Acme Corp',
      avatar: 'AC',
      avatarColor: 'gray',
      plan: 'Care Plan 2yr',
      planSub: 'Tier 2 SLA • 24 Seats',
      cycle: 'Monthly',
      nextBill: 'Sep 15, 2025',
      nextBillSub: 'Auto-debit active',
      status: 'Active',
      amount: 4200,
      unit: '/ mo',
      seats: 24,
      churnProbability: 'Low (1.2%)',
      paymentMethod: 'Stripe Auto-Debit (•••• 4242)',
      createdDate: '2023-09-15',
      prorationPolicy: 'Pro-rata on mid-month changes',
      auditHistory: [
        { date: '2025-08-15', action: 'Auto-debit invoice #INV-8901 processed successfully ($4,200.00)' },
        { date: '2025-06-01', action: 'Seat upgrade added 4 seats (+ $700.00/mo)' },
        { date: '2023-09-15', action: 'Subscription contract initiated by Sales Rep (Quote #Q-1042)' }
      ]
    },
    {
      id: 'SUB-77412',
      customer: 'Beta Industries',
      avatar: 'BI',
      avatarColor: 'gray',
      plan: 'Support SLA',
      planSub: '24/7 Priority Support',
      cycle: 'Quarterly',
      nextBill: 'Nov 1, 2025',
      nextBillSub: 'Invoice Net-30',
      status: 'Active',
      amount: 12500,
      unit: '/ qtr',
      seats: 50,
      churnProbability: 'Medium (6.5%)',
      paymentMethod: 'Wire Transfer / Net-30 Terms',
      createdDate: '2024-02-01',
      prorationPolicy: 'Quarterly rollover',
      auditHistory: [
        { date: '2025-08-01', action: 'Quarterly SLA billing cycle renewed ($12,500.00)' },
        { date: '2024-02-01', action: 'Support SLA initiated under master terms' }
      ]
    },
    {
      id: 'SUB-52190',
      customer: 'Delta LLC',
      avatar: 'DL',
      avatarColor: 'amber',
      plan: 'Care Plan 1yr',
      planSub: 'Temporary seasonal hold',
      cycle: 'Monthly',
      nextBill: 'Billing Paused',
      nextBillSub: 'Billing Paused',
      status: 'Paused',
      amount: 1850,
      unit: '/ mo',
      seats: 10,
      churnProbability: 'Attention Required (14.0%)',
      paymentMethod: 'ACH Direct Debit (•••• 9012)',
      createdDate: '2024-05-10',
      prorationPolicy: 'Billing paused until resumed by admin',
      auditHistory: [
        { date: '2025-07-20', action: 'Subscription paused by customer request (Temporary seasonal hold)' },
        { date: '2024-05-10', action: 'Care Plan 1yr activated' }
      ]
    },
    {
      id: 'SUB-99304',
      customer: 'Nova Retail',
      avatar: 'NR',
      avatarColor: 'gray',
      plan: 'POS Enterprise Cloud',
      planSub: 'Dedicated instance + Add-ons',
      cycle: 'Annual',
      nextBill: 'Jan 10, 2026',
      nextBillSub: 'Renewal scheduled',
      status: 'Active',
      amount: 36000,
      unit: '/ yr',
      seats: 120,
      churnProbability: 'Low (0.8%)',
      paymentMethod: 'Corporate Purchasing Card (•••• 1122)',
      createdDate: '2023-01-10',
      prorationPolicy: 'Annual prepayment lock-in',
      auditHistory: [
        { date: '2025-01-10', action: 'Annual contract renewal successfully captured ($36,000.00)' },
        { date: '2024-01-10', action: 'Dedicated instance SLA upgraded to 99.99% uptime guarantee' }
      ]
    },
    {
      id: 'SUB-44018',
      customer: 'Zenith Co',
      avatar: 'ZC',
      avatarColor: 'red',
      plan: 'Custom API Tier',
      planSub: 'Legacy contract expired',
      cycle: 'Monthly',
      nextBill: 'Aug 28, 2025',
      nextBillSub: 'Terminated',
      status: 'Cancelled',
      amount: 2400,
      unit: '/ mo',
      seats: 5,
      churnProbability: 'Churned (100%)',
      paymentMethod: 'Expired Credit Card',
      createdDate: '2022-08-28',
      prorationPolicy: 'Contract closed; no further billing cycles',
      auditHistory: [
        { date: '2025-08-28', action: 'Contract expired without renewal; plan transitioned to Cancelled' },
        { date: '2025-07-28', action: 'Notice of non-renewal sent to customer representative' }
      ]
    }
  ]);

  // Filters & Search State
  const [activeFilterPill, setActiveFilterPill] = useState('all'); // 'all' | 'Active' | 'Paused' | 'Cancelled'
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('all'); // 'all' | 'Monthly' | 'Quarterly' | 'Annual'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Active item state
  const [activeModal, setActiveModal] = useState(null); // 'manage' | 'audit' | 'newPlan' | 'footerModal'
  const [selectedSub, setSelectedSub] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // New Plan Blueprint Form State
  const [newCustomer, setNewCustomer] = useState('');
  const [newPlanName, setNewPlanName] = useState('Enterprise Tier Pro');
  const [newPlanCycle, setNewPlanCycle] = useState('Monthly');
  const [newPlanAmount, setNewPlanAmount] = useState(3500);
  const [newPlanSeats, setNewPlanSeats] = useState(20);

  // Edit Subscription in Manage Modal
  const [editSeats, setEditSeats] = useState(24);
  const [editAmount, setEditAmount] = useState(4200);

  // Filter calculation
  const filteredSubscriptions = subscriptions.filter(sub => {
    // Pill filter
    if (activeFilterPill !== 'all' && sub.status !== activeFilterPill) return false;
    // Active only toggle
    if (filterActiveOnly && sub.status !== 'Active') return false;
    // Cycle filter
    if (selectedCycle !== 'all' && sub.cycle !== selectedCycle) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        sub.customer.toLowerCase().includes(q) ||
        sub.id.toLowerCase().includes(q) ||
        sub.plan.toLowerCase().includes(q) ||
        sub.planSub.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Count stats
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const pausedCount = subscriptions.filter(s => s.status === 'Paused').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'Cancelled').length;

  // Actions
  const handleExportCSV = () => {
    const headers = ['Subscription ID', 'Customer', 'Plan', 'Sub Details', 'Billing Cycle', 'Next Bill', 'Status', 'Recurring Value'];
    const rows = subscriptions.map(s => [
      s.id,
      s.customer,
      s.plan,
      s.planSub,
      s.cycle,
      s.nextBill,
      s.status,
      `$${s.amount.toLocaleString()} ${s.unit}`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscriptions list exported as CSV!');
  };

  const handleOpenManage = (sub) => {
    setSelectedSub(sub);
    setEditSeats(sub.seats);
    setEditAmount(sub.amount);
    setActiveModal('manage');
  };

  const handleOpenAudit = (sub) => {
    setSelectedSub(sub);
    setActiveModal('audit');
  };

  const handleResumeSubscription = (sub) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === sub.id) {
        return {
          ...s,
          status: 'Active',
          nextBill: 'Sep 15, 2025',
          nextBillSub: 'Auto-debit active',
          avatarColor: 'gray',
          auditHistory: [
            { date: new Date().toISOString().split('T')[0], action: 'Subscription resumed from seasonal pause by admin' },
            ...s.auditHistory
          ]
        };
      }
      return s;
    }));
    showToast(`Subscription ${sub.id} for ${sub.customer} has been resumed!`);
  };

  const handlePauseSubscription = (sub) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === sub.id) {
        return {
          ...s,
          status: 'Paused',
          nextBill: 'Billing Paused',
          nextBillSub: 'Billing Paused',
          avatarColor: 'amber',
          auditHistory: [
            { date: new Date().toISOString().split('T')[0], action: 'Subscription placed on administrative hold' },
            ...s.auditHistory
          ]
        };
      }
      return s;
    }));
    showToast(`Subscription ${sub.id} paused.`);
    setActiveModal(null);
  };

  const handleSaveManageChanges = (e) => {
    e.preventDefault();
    setSubscriptions(prev => prev.map(s => {
      if (s.id === selectedSub.id) {
        return {
          ...s,
          seats: Number(editSeats),
          amount: Number(editAmount),
          planSub: `Tier 2 SLA • ${editSeats} Seats`,
          auditHistory: [
            { 
              date: new Date().toISOString().split('T')[0], 
              action: `Seats updated to ${editSeats} ($${Number(editAmount).toLocaleString()}${s.unit})` 
            },
            ...s.auditHistory
          ]
        };
      }
      return s;
    }));
    showToast(`Updated subscription ${selectedSub.id}!`);
    setActiveModal(null);
  };

  const handleCreateBlueprintPlan = (e) => {
    e.preventDefault();
    if (!newCustomer.trim()) {
      showToast('Please enter customer name.');
      return;
    }

    const initials = newCustomer.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'CX';
    const newId = `SUB-${Math.floor(10000 + Math.random() * 90000)}`;

    const unitStr = newPlanCycle === 'Monthly' ? '/ mo' : newPlanCycle === 'Quarterly' ? '/ qtr' : '/ yr';

    const newSubItem = {
      id: newId,
      customer: newCustomer,
      avatar: initials,
      avatarColor: 'gray',
      plan: newPlanName,
      planSub: `Enterprise SLA • ${newPlanSeats} Seats`,
      cycle: newPlanCycle,
      nextBill: 'Oct 1, 2025',
      nextBillSub: 'Auto-debit active',
      status: 'Active',
      amount: Number(newPlanAmount),
      unit: unitStr,
      seats: Number(newPlanSeats),
      churnProbability: 'Low (< 1%)',
      paymentMethod: 'Corporate Payment Sync',
      createdDate: new Date().toISOString().split('T')[0],
      prorationPolicy: 'Standard automated calendar proration',
      auditHistory: [
        { date: new Date().toISOString().split('T')[0], action: `New blueprint plan created by ${user?.name || 'Admin'}` }
      ]
    };

    setSubscriptions([newSubItem, ...subscriptions]);
    showToast(`New blueprint plan ${newId} created for ${newCustomer}!`);
    setActiveModal(null);
    setNewCustomer('');
  };

  return (
    <div className="subscriptions-container">
      {/* Top Universal Navbar */}
      <Navbar 
        activePage="subscriptions" 
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

      {/* Main Subscriptions Page Content */}
      <main className="subscriptions-main animate-fade-in">

        {/* Category kicker & Title Row */}
        <div className="subscriptions-header-row">
          <div className="subscriptions-title-group">
            <div className="subscriptions-kicker">Recurring Revenue • Contracts Engine</div>
            <h1 className="subscriptions-title">Subscriptions (List)</h1>
            <p className="subscriptions-subtitle">
              Every recurring plan across every customer, regardless of which order it came from
            </p>
          </div>

          <div className="subscriptions-actions-group">
            <button 
              className="btn-export-subs"
              onClick={handleExportCSV}
              title="Download subscriptions list as CSV"
            >
              <Upload size={15} style={{ transform: 'rotate(180deg)' }} />
              <span>Export CSV</span>
            </button>

            <button 
              className="btn-new-plan"
              onClick={() => setActiveModal('newPlan')}
            >
              <Plus size={16} />
              <span>New Plan (Admin)</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="subs-filter-bar">
          {/* Left Pill Stats */}
          <div className="subs-filter-pills-left">
            <button 
              className={`pill-stat active-pill ${activeFilterPill === 'Active' ? 'selected' : ''}`}
              onClick={() => setActiveFilterPill(activeFilterPill === 'Active' ? 'all' : 'Active')}
            >
              <span className="subs-status-dot active"></span>
              <span>18 Active</span>
            </button>

            <button 
              className={`pill-stat paused-pill ${activeFilterPill === 'Paused' ? 'selected' : ''}`}
              onClick={() => setActiveFilterPill(activeFilterPill === 'Paused' ? 'all' : 'Paused')}
            >
              <span className="subs-status-dot paused"></span>
              <span>2 Paused</span>
            </button>

            <button 
              className={`pill-stat cancelled-pill ${activeFilterPill === 'Cancelled' ? 'selected' : ''}`}
              onClick={() => setActiveFilterPill(activeFilterPill === 'Cancelled' ? 'all' : 'Cancelled')}
            >
              <span className="subs-status-dot cancelled"></span>
              <span>3 Cancelled</span>
            </button>

            <div className="subs-pill-divider"></div>

            <button 
              className={`btn-filter-toggle ${filterActiveOnly ? 'active' : ''}`}
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            >
              <Filter size={13} />
              <span>Filter: Active Only</span>
            </button>
          </div>

          {/* Right Search & Cycle Dropdown */}
          <div className="subs-filter-controls-right">
            <div className="subs-search-box">
              <Search size={14} className="subs-search-icon" />
              <input 
                type="text" 
                className="subs-search-input"
                placeholder="Search customer or plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="subs-cycle-select"
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
            >
              <option value="all">All Billing Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table Card */}
        <div className="subs-table-card">
          <div className="table-responsive">
            <table className="subs-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Cycle</th>
                  <th>Next Bill</th>
                  <th>Status</th>
                  <th>Recurring Value</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No subscriptions match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map(sub => (
                    <tr 
                      key={sub.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenManage(sub)}
                    >
                      {/* Customer */}
                      <td>
                        <div className="subs-customer-cell">
                          <div className={`subs-customer-avatar ${sub.avatarColor}`}>
                            {sub.avatar}
                          </div>
                          <div>
                            <div className="subs-customer-name">{sub.customer}</div>
                            <div className="subs-customer-id">ID: {sub.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        <div className="subs-plan-title">{sub.plan}</div>
                        <div className="subs-plan-sub">{sub.planSub}</div>
                      </td>

                      {/* Cycle */}
                      <td>
                        <span className="subs-cycle-badge">{sub.cycle}</span>
                      </td>

                      {/* Next Bill */}
                      <td>
                        {sub.status === 'Paused' ? (
                          <div className="subs-next-bill-sub paused" style={{ textDecoration: 'underline' }}>
                            Billing Paused
                          </div>
                        ) : sub.status === 'Cancelled' ? (
                          <div>
                            <div className="subs-next-bill-main" style={{ color: '#94a3b8' }}>{sub.nextBill}</div>
                            <div className="subs-next-bill-sub terminated">Terminated</div>
                          </div>
                        ) : (
                          <div>
                            <div className="subs-next-bill-main">{sub.nextBill}</div>
                            <div className="subs-next-bill-sub">{sub.nextBillSub}</div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`subs-status-pill ${sub.status.toLowerCase()}`}>
                          <span className={`subs-status-dot ${sub.status.toLowerCase()}`}></span>
                          <span>{sub.status}</span>
                        </span>
                      </td>

                      {/* Recurring Value */}
                      <td>
                        {sub.status === 'Cancelled' ? (
                          <span className="subs-value-cancelled">
                            ${sub.amount.toLocaleString()} {sub.unit}
                          </span>
                        ) : (
                          <span className="subs-value-cell">
                            ${sub.amount.toLocaleString()} <span className="subs-value-muted">{sub.unit}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {sub.status === 'Active' && (
                            <button 
                              className="btn-subs-manage"
                              onClick={() => handleOpenManage(sub)}
                            >
                              Manage
                            </button>
                          )}

                          {sub.status === 'Paused' && (
                            <button 
                              className="btn-subs-resume"
                              onClick={() => handleResumeSubscription(sub)}
                            >
                              Resume
                            </button>
                          )}

                          {sub.status === 'Cancelled' && (
                            <button 
                              className="btn-subs-audit"
                              onClick={() => handleOpenAudit(sub)}
                            >
                              Audit Log
                            </button>
                          )}

                          {/* Context Menu */}
                          <div style={{ position: 'relative' }}>
                            <button 
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#94a3b8', 
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              onClick={() => setOpenActionMenuId(openActionMenuId === sub.id ? null : sub.id)}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {openActionMenuId === sub.id && (
                              <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                padding: '4px 0',
                                zIndex: 10,
                                minWidth: '180px'
                              }}>
                                <button 
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleOpenAudit(sub);
                                  }}
                                >
                                  View Audit Timeline
                                </button>
                                <button 
                                  style={{
                                    width: '100%',
                                    padding: '8px 14px',
                                    textAlign: 'left',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '12.5px',
                                    color: '#334155',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    showToast(`Synced payment gateway token for ${sub.id}`);
                                  }}
                                >
                                  Sync Gateway Token
                                </button>
                                {sub.status === 'Active' && (
                                  <button 
                                    style={{
                                      width: '100%',
                                      padding: '8px 14px',
                                      textAlign: 'left',
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '12.5px',
                                      color: '#d97706',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      handlePauseSubscription(sub);
                                    }}
                                  >
                                    Pause Subscription
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="subs-pagination-row">
            <div>
              Showing <strong style={{ color: '#0f172a' }}>1</strong> to <strong style={{ color: '#0f172a' }}>{filteredSubscriptions.length}</strong> of <strong style={{ color: '#0f172a' }}>23</strong> subscriptions
            </div>

            <div className="subs-pagination-btns">
              <button className="btn-page-step" disabled>Previous</button>
              <button className={`btn-page-num ${currentPage === 1 ? 'active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
              <button className={`btn-page-num ${currentPage === 2 ? 'active' : ''}`} onClick={() => setCurrentPage(2)}>2</button>
              <button className={`btn-page-num ${currentPage === 3 ? 'active' : ''}`} onClick={() => setCurrentPage(3)}>3</button>
              <button className="btn-page-step" disabled={currentPage === 3} onClick={() => setCurrentPage(2)}>Next</button>
            </div>
          </div>
        </div>

        {/* Informational Callout Tip Banner */}
        <div className="subs-tip-card">
          <div className="subs-tip-left">
            <div className="subs-tip-icon">i</div>
            <div>
              <div className="subs-tip-text-title">
                Click a subscription row to open its billing detail and proration history.
              </div>
              <div className="subs-tip-text-sub">
                View churn probability, gateway payment sync, and upgrade pathways.
              </div>
            </div>
          </div>

          <div className="subs-tip-badge">
            Shortcut: Enter ↵
          </div>
        </div>

        {/* Custom Subscription Blueprint Card */}
        <div className="subs-blueprint-card">
          <div className="subs-blueprint-left">
            <div className="subs-blueprint-icon-box">
              <Layers size={22} />
            </div>
            <div>
              <div className="subs-blueprint-title">Custom Subscription Blueprint</div>
              <div className="subs-blueprint-desc">
                Create bespoke billing cadences, trial periods, and proration schedules
              </div>
            </div>
          </div>

          <button 
            className="btn-blueprint-new"
            onClick={() => setActiveModal('newPlan')}
          >
            <Plus size={15} />
            <span>New Plan (Admin)</span>
          </button>
        </div>

      </main>

      {/* Universal Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>DealFlow360 • © 2025 DealFlow360 Technologies, Inc. All rights reserved.</span>
          </div>

          <div className="footer-links">
            <div className="status-badge" style={{ marginRight: '8px' }}>
              <span className="pulse-dot"></span>
              <span>Systems Operational</span>
            </div>
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

      {/* MODAL 1: Manage Subscription */}
      {activeModal === 'manage' && selectedSub && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Manage Subscription — {selectedSub.id}
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedSub.customer} • {selectedSub.plan}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManageChanges}>
              {/* Overview Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>STATUS</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>{selectedSub.status}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CHURN RISK</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedSub.churnProbability}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CYCLE</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{selectedSub.cycle}</div>
                </div>
              </div>

              {/* Adjust Seats & Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Licensed Seats</label>
                  <input 
                    type="number"
                    min="1"
                    className="form-input"
                    value={editSeats}
                    onChange={(e) => setEditSeats(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Recurring Rate ($)</label>
                  <input 
                    type="number"
                    min="1"
                    className="form-input"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '12.5px', color: '#475569' }}>
                <div><strong>Payment Gateway:</strong> {selectedSub.paymentMethod}</div>
                <div style={{ marginTop: '4px' }}><strong>Proration:</strong> {selectedSub.prorationPolicy}</div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-dash-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handlePauseSubscription(selectedSub)}
                >
                  Pause Plan
                </button>
                <button 
                  type="submit" 
                  className="btn-new-allocation"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Subscription Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Audit Log */}
      {activeModal === 'audit' && selectedSub && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Subscription Audit History
                </h3>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  {selectedSub.id} — {selectedSub.customer}
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ margin: '12px 0 20px' }}>
              {selectedSub.auditHistory.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '12px 0', 
                  borderBottom: idx < selectedSub.auditHistory.length - 1 ? '1px solid #f1f5f9' : 'none' 
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#714b67', 
                    marginTop: '6px',
                    flexShrink: 0 
                  }}></div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{item.date}</div>
                    <div style={{ fontSize: '13px', color: '#1e293b', marginTop: '2px' }}>{item.action}</div>
                  </div>
                </div>
              ))}
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

      {/* MODAL 3: New Plan Blueprint (Admin) */}
      {activeModal === 'newPlan' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Create Custom Subscription Blueprint
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBlueprintPlan}>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
                Design a custom recurring contract schedule with specialized seats and billing frequency.
              </p>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Customer Company Name</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Global Logistics"
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Plan Blueprint Name</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="e.g. Enterprise Cloud SLA Tier 3"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Billing Cycle</label>
                  <select 
                    className="form-input"
                    value={newPlanCycle}
                    onChange={(e) => setNewPlanCycle(e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Licensed Seats</label>
                  <input 
                    type="number"
                    min="1"
                    className="form-input"
                    value={newPlanSeats}
                    onChange={(e) => setNewPlanSeats(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Recurring Amount ($ USD)</label>
                <input 
                  type="number"
                  min="100"
                  step="50"
                  className="form-input"
                  value={newPlanAmount}
                  onChange={(e) => setNewPlanAmount(e.target.value)}
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
                  className="btn-new-allocation"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Launch Blueprint Plan
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
                DealFlow360 guarantees SOC 2 Type II compliance, continuous revenue reconciliation, automated seat proration, and multi-gateway card tokenization.
              </p>
              <p>
                All contract events, renewal notices, and payment webhook syncs are cryptographically logged with tamper-evident audit trails.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
