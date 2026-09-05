import React, { useState, useEffect } from 'react';
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
import Navbar from '../../components/layout/Navbar';
import { fetchSubscriptions, createSubscription, updateSubscriptionStatus } from '../../services/subscriptionService';
import './Subscriptions.css';

export default function Subscriptions({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Subscriptions List State from PostgreSQL database
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search State
  const [activeFilterPill, setActiveFilterPill] = useState('all');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Active item state
  const [activeModal, setActiveModal] = useState(null);
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

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSubscriptions({
        status: activeFilterPill === 'all' ? undefined : activeFilterPill,
        search: searchQuery || undefined
      });

      const formatted = data.map(s => ({
        id: s.code || s.id,
        realId: s.id,
        customer: s.customer,
        avatar: s.customer.slice(0, 2).toUpperCase(),
        avatarColor: s.status === 'Active' ? 'gray' : s.status === 'Paused' ? 'amber' : 'red',
        plan: s.plan,
        planSub: `${s.tier} Tier • ${s.seats} Seats`,
        cycle: s.billingCycle,
        nextBill: s.status === 'Paused' ? 'Billing Paused' : s.nextBillingDate,
        nextBillSub: s.status === 'Active' ? 'Auto-debit active' : s.status,
        status: s.status,
        amount: Number(s.amount),
        unit: s.billingCycle === 'Annual' ? '/ yr' : '/ mo',
        seats: s.seats,
        churnProbability: s.status === 'Active' ? 'Low (1.2%)' : 'Attention Required',
        paymentMethod: 'Corporate Direct Billing',
        createdDate: s.startDate || s.createdAt,
        prorationPolicy: 'Pro-rata on mid-month changes',
        auditHistory: s.auditLogs && s.auditLogs.length > 0 ? s.auditLogs : [
          { date: s.startDate || '2026-01-01', action: 'Subscription Initialized' }
        ]
      }));

      setSubscriptions(formatted);
    } catch (err) {
      showToast('Failed to load subscriptions from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [activeFilterPill, searchQuery]);

  // Filter calculation
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (activeFilterPill !== 'all' && sub.status !== activeFilterPill) return false;
    if (filterActiveOnly && sub.status !== 'Active') return false;
    if (selectedCycle !== 'all' && sub.cycle !== selectedCycle) return false;
    return true;
  });

  // Count stats
  const activeCount = subscriptions.filter(s => s.status === 'Active').length;
  const pausedCount = subscriptions.filter(s => s.status === 'Paused').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'Cancelled').length;

  const handleResumeSubscription = async (sub) => {
    try {
      await updateSubscriptionStatus(sub.realId || sub.id, 'Active');
      showToast(`Subscription ${sub.id} resumed in database!`);
      await loadSubscriptions();
    } catch (err) {
      showToast(err.message || 'Failed to resume subscription');
    }
  };

  const handlePauseSubscription = async (sub) => {
    try {
      await updateSubscriptionStatus(sub.realId || sub.id, 'Paused');
      showToast(`Subscription ${sub.id} paused in database!`);
      await loadSubscriptions();
    } catch (err) {
      showToast(err.message || 'Failed to pause subscription');
    }
  };

  const handleCreateNewBlueprint = async (e) => {
    e.preventDefault();
    if (!newCustomer.trim()) {
      showToast('Please enter customer name.');
      return;
    }

    try {
      await createSubscription({
        customer: newCustomer.trim(),
        plan: newPlanName,
        billingCycle: newPlanCycle,
        amount: Number(newPlanAmount),
        seats: Number(newPlanSeats) || 10
      });
      setIsNewBlueprintOpen(false);
      setNewCustomer('');
      showToast('New subscription contract created in database!');
      await loadSubscriptions();
    } catch (err) {
      showToast(err.message || 'Failed to create subscription');
    }
  };

  return (
    <div className="subscriptions-container">
      {/* Toast Notification */}
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
              <span>{activeCount} Active</span>
            </button>

            <button 
              className={`pill-stat paused-pill ${activeFilterPill === 'Paused' ? 'selected' : ''}`}
              onClick={() => setActiveFilterPill(activeFilterPill === 'Paused' ? 'all' : 'Paused')}
            >
              <span className="subs-status-dot paused"></span>
              <span>{pausedCount} Paused</span>
            </button>

            <button 
              className={`pill-stat cancelled-pill ${activeFilterPill === 'Cancelled' ? 'selected' : ''}`}
              onClick={() => setActiveFilterPill(activeFilterPill === 'Cancelled' ? 'all' : 'Cancelled')}
            >
              <span className="subs-status-dot cancelled"></span>
              <span>{cancelledCount} Cancelled</span>
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
