import React, { useState } from 'react';
import { 
  Clock, 
  TrendingDown, 
  Calendar, 
  AlertTriangle, 
  Search, 
  Sliders, 
  CheckCircle2, 
  X, 
  MoreVertical, 
  Send, 
  ShieldAlert, 
  Download, 
  ArrowUpRight, 
  Bell, 
  Percent, 
  Truck, 
  Check, 
  Info,
  ChevronRight
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import './DealHealth.css';

export default function DealHealth({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Anomaly Items State (Initialized matching the screenshot)
  const [anomalies, setAnomalies] = useState([
    {
      id: 'ANOM-101',
      account: 'Zenith Co',
      dealCode: 'Quote Q-1030',
      dealValue: 15300,
      issueCategory: 'stalled',
      issueTitle: 'Idle 9 days',
      issueDotColor: 'amber',
      issueSub: 'No activity since client contract viewed',
      severity: 'High Risk',
      severityClass: 'high-risk',
      flaggedDate: 'Aug 24, 2025',
      flaggedTimeAgo: '3 days ago',
      status: 'Nudge sent',
      statusDotColor: 'blue',
      statusSub: 'Yesterday at 4:15 PM',
      rep: 'S. Jenkins',
      repInitials: 'SJ',
      repColor: 'purple'
    },
    {
      id: 'ANOM-102',
      account: 'Delta LLC',
      dealCode: 'Quote Q-1024',
      dealValue: 64200,
      issueCategory: 'discount',
      issueTitle: 'Discount 22% vs avg 8%',
      issueDotColor: 'red',
      issueSub: '+14% above rep allowance threshold',
      severity: 'Critical',
      severityClass: 'critical',
      flaggedDate: 'Aug 25, 2025',
      flaggedTimeAgo: '2 days ago',
      status: 'Escalated to Manager',
      statusDotColor: 'amber',
      statusSub: 'Assigned to VP Sales',
      rep: 'R. Iyer',
      repInitials: 'RI',
      repColor: 'cyan'
    },
    {
      id: 'ANOM-103',
      account: 'Acme Corp',
      dealCode: 'Order ORD-8942',
      dealValue: 124000,
      issueCategory: 'delivery',
      issueTitle: 'Delivery Slippage: 6 days delay',
      issueDotColor: 'amber',
      issueSub: 'Warehouse customs clearance hold',
      severity: 'Medium',
      severityClass: 'medium',
      flaggedDate: 'Aug 26, 2025',
      flaggedTimeAgo: 'Yesterday',
      status: 'Logistics review requested',
      statusDotColor: 'blue',
      statusSub: 'Awaiting depot confirmation',
      rep: 'M. Shah',
      repInitials: 'MS',
      repColor: 'pink'
    },
    {
      id: 'ANOM-104',
      account: 'Nova Retail',
      dealCode: 'Quote Q-1035',
      dealValue: 32000,
      issueCategory: 'stalled',
      issueTitle: 'Idle 8 days in negotiation',
      issueDotColor: 'amber',
      issueSub: 'Contract redline unacknowledged',
      severity: 'High Risk',
      severityClass: 'high-risk',
      flaggedDate: 'Aug 26, 2025',
      flaggedTimeAgo: 'Yesterday',
      status: 'Pending Rep Follow-up',
      statusDotColor: 'amber',
      statusSub: 'Next touchpoint overdue',
      rep: 'D. Vance',
      repInitials: 'DV',
      repColor: 'green'
    }
  ]);

  // Selected Checkboxes (Pre-selected Zenith Co & Delta LLC matching screenshot)
  const [selectedIds, setSelectedIds] = useState(['ANOM-101', 'ANOM-102']);

  // Filter & Search State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'stalled' | 'discount' | 'delivery'
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals State
  const [activeModal, setActiveModal] = useState(null); // 'configureRules' | 'nudge' | 'escalate' | 'reviewDiscount' | 'expedite' | 'footerModal'
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Configure Rules Form State
  const [maxDiscountThreshold, setMaxDiscountThreshold] = useState(15);
  const [idleDaysThreshold, setIdleDaysThreshold] = useState(7);
  const [deliverySlaBuffer, setDeliverySlaBuffer] = useState(3);
  const [autoNudgeEnabled, setAutoNudgeEnabled] = useState(true);

  // Escalate Form State
  const [escalateTarget, setEscalateTarget] = useState('VP Sales (Marcus Vance)');
  const [escalateReason, setEscalateReason] = useState('Deal is exceeding discount boundaries and requires urgent executive approval.');

  // Nudge Form State
  const [nudgeChannel, setNudgeChannel] = useState('Slack & Email');
  const [nudgeMessage, setNudgeMessage] = useState('Friendly nudge: Client viewed quote proposal 3 days ago. Please log next action or schedule follow-up.');

  // Filter calculation
  const filteredAnomalies = anomalies.filter(item => {
    if (activeTab === 'stalled' && item.issueCategory !== 'stalled') return false;
    if (activeTab === 'discount' && item.issueCategory !== 'discount') return false;
    if (activeTab === 'delivery' && item.issueCategory !== 'delivery') return false;

    if (severityFilter !== 'all') {
      if (severityFilter === 'Critical' && item.severity !== 'Critical') return false;
      if (severityFilter === 'High Risk' && item.severity !== 'High Risk') return false;
      if (severityFilter === 'Medium' && item.severity !== 'Medium') return false;
      if (severityFilter === 'Low' && item.severity !== 'Low') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        item.account.toLowerCase().includes(q) ||
        item.dealCode.toLowerCase().includes(q) ||
        item.rep.toLowerCase().includes(q) ||
        item.issueTitle.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

  // Checkbox toggle handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredAnomalies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAnomalies.map(a => a.id));
    }
  };

  const handleToggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Actions
  const handleExportAudit = () => {
    const headers = ['Anomaly ID', 'Account', 'Deal Code', 'Value', 'Category', 'Issue', 'Severity', 'Flagged Date', 'Status', 'Rep'];
    const rows = anomalies.map(a => [
      a.id,
      a.account,
      a.dealCode,
      `$${a.dealValue.toLocaleString()}`,
      a.issueCategory,
      a.issueTitle,
      a.severity,
      a.flaggedDate,
      a.status,
      a.rep
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Deal_Health_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Anomaly audit log exported successfully!');
  };

  const handleOpenNudge = (item) => {
    setSelectedAnomaly(item);
    setNudgeMessage(`Hi ${item.rep.split(' ')[0]}, ${item.account} (${item.dealCode}) has been flagged for ${item.issueTitle}. Please update stage or log client response.`);
    setActiveModal('nudge');
  };

  const handleOpenEscalate = (item) => {
    setSelectedAnomaly(item);
    setEscalateReason(`Escalating ${item.account} (${item.dealCode}) for ${item.issueTitle} with severity: ${item.severity}.`);
    setActiveModal('escalate');
  };

  const handleOpenReviewDiscount = (item) => {
    setSelectedAnomaly(item);
    setActiveModal('reviewDiscount');
  };

  const handleOpenExpedite = (item) => {
    setSelectedAnomaly(item);
    setActiveModal('expedite');
  };

  const handleSaveRules = (e) => {
    e.preventDefault();
    showToast(`Governance rules updated! Max discount threshold set to ${maxDiscountThreshold}%.`);
    setActiveModal(null);
  };

  const handleSendNudgeSubmit = (e) => {
    e.preventDefault();
    showToast(`Nudge notification dispatched to ${selectedAnomaly?.rep || 'sales rep'} via ${nudgeChannel}!`);
    setActiveModal(null);
  };

  const handleSendEscalateSubmit = (e) => {
    e.preventDefault();
    showToast(`Deal escalated to ${escalateTarget}! High-priority alert triggered.`);
    setActiveModal(null);
  };

  const handleBulkEscalate = () => {
    showToast(`Bulk escalated ${selectedIds.length} flagged deals to VP Sales!`);
  };

  const handleBulkNudge = () => {
    showToast(`Sent bulk reminder nudges to ${selectedIds.length} assigned sales reps!`);
  };

  const handleBulkDismiss = () => {
    setAnomalies(prev => prev.filter(a => !selectedIds.includes(a.id)));
    setSelectedIds([]);
    showToast('Selected anomaly flags dismissed.');
  };

  return (
    <div className="dealhealth-container">
      {/* Top Universal Navbar */}
      <Navbar 
        activePage="dealhealth" 
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

      {/* Main Deal Health Dashboard Content */}
      <main className="dealhealth-main animate-fade-in">

        {/* Kicker and Title Row */}
        <div className="dealhealth-header-row">
          <div className="dealhealth-title-group">
            <div className="dealhealth-kicker">
              PIPELINE GOVERNANCE • ANOMALY ENGINE • REAL-TIME MONITORING
            </div>
            <h1 className="dealhealth-title">Deal Health and Anomaly Dashboard</h1>
            <p className="dealhealth-subtitle">
              Real-time flags for stalled deals and unusual discount patterns
            </p>
          </div>

          <div className="dealhealth-actions-group">
            <button 
              className="btn-export-audit"
              onClick={handleExportAudit}
            >
              <Download size={15} />
              <span>Export Audit Log</span>
            </button>

            <button 
              className="btn-configure-rules"
              onClick={() => setActiveModal('configureRules')}
            >
              <Sliders size={15} />
              <span>Configure Rules & Thresholds</span>
            </button>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="dealhealth-kpi-grid">
          {/* Card 1: Stalled Deals */}
          <div className="kpi-card">
            <div>
              <div className="kpi-card-header">
                <div className="kpi-title-with-badge">
                  <span className="kpi-title-label">Stalled Deals</span>
                  <span className="kpi-badge yellow">Attention Required</span>
                </div>
                <div className="kpi-icon-circle yellow">
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-metric-value">5 quotes</div>
              <div className="kpi-metric-desc">
                • Idle 7+ days without stage transition
              </div>
            </div>
            <div className="kpi-bottom-row">
              <span>Oldest: <strong>9 days idle (Zenith Co)</strong></span>
              <span className="kpi-tag-sub yellow">+2 vs last week</span>
            </div>
          </div>

          {/* Card 2: Discount Anomalies */}
          <div className="kpi-card">
            <div>
              <div className="kpi-card-header">
                <div className="kpi-title-with-badge">
                  <span className="kpi-title-label">Discount Anomalies</span>
                  <span className="kpi-badge red">Margin Breach Risk</span>
                </div>
                <div className="kpi-icon-circle red">
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className="kpi-metric-value">2 above</div>
              <div className="kpi-metric-desc">
                • Above rep historical discount average
              </div>
            </div>
            <div className="kpi-bottom-row">
              <span>Highest: <strong>22% discount (Delta LLC)</strong></span>
              <span className="kpi-tag-sub red">Max Threshold: 15%</span>
            </div>
          </div>

          {/* Card 3: Delivery Slippage */}
          <div className="kpi-card">
            <div>
              <div className="kpi-card-header">
                <div className="kpi-title-with-badge">
                  <span className="kpi-title-label">Delivery Slippage</span>
                  <span className="kpi-badge orange">Logistics Delay</span>
                </div>
                <div className="kpi-icon-circle orange">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="kpi-metric-value">3 promise</div>
              <div className="kpi-metric-desc">
                • 3 promise dates at risk of SLA miss
              </div>
            </div>
            <div className="kpi-bottom-row">
              <span>Affected Value: <strong>$186,000</strong></span>
              <span style={{ color: '#64748b' }}>Avg delay: 4.2d</span>
            </div>
          </div>
        </div>

        {/* Dark Callout Banner: Anomaly Resolution Policy */}
        <div className="dealhealth-dark-banner">
          <div className="dark-banner-left">
            <div className="dark-banner-icon">i</div>
            <div className="dark-banner-text">
              <strong>ANOMALY RESOLUTION POLICY:</strong> Real-time monitors continuously evaluate quote velocity and discount ceilings. Flags automatically clear once quotes advance to subsequent pipeline stages or receive managerial sign-off.
            </div>
          </div>
          <div className="dark-banner-shortcut">
            Shortcut: ⌘ + E to Escalate
          </div>
        </div>

        {/* Filter Bar */}
        <div className="dealhealth-filter-bar">
          <div className="dealhealth-segmented-tabs">
            <button 
              className={`btn-anomaly-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All Anomalies</span>
              <span className={`tab-badge-count ${activeTab === 'all' ? '' : 'gray'}`}>10</span>
            </button>

            <button 
              className={`btn-anomaly-tab ${activeTab === 'stalled' ? 'active' : ''}`}
              onClick={() => setActiveTab('stalled')}
            >
              <span>Stalled Deals</span>
              <span className={`tab-badge-count ${activeTab === 'stalled' ? '' : 'gray'}`}>5</span>
            </button>

            <button 
              className={`btn-anomaly-tab ${activeTab === 'discount' ? 'active' : ''}`}
              onClick={() => setActiveTab('discount')}
            >
              <span>Discount Breaches</span>
              <span className={`tab-badge-count ${activeTab === 'discount' ? '' : 'red'}`}>2</span>
            </button>

            <button 
              className={`btn-anomaly-tab ${activeTab === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivery')}
            >
              <span>Delivery Slippage</span>
              <span className={`tab-badge-count ${activeTab === 'delivery' ? '' : 'amber'}`}>3</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="dealhealth-search-box">
              <Search size={14} className="dealhealth-search-icon" />
              <input 
                type="text"
                className="dealhealth-search-input"
                placeholder="Filter by account, rep, or deal ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="dealhealth-severity-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High Risk">High Risk</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Anomaly Data Table Card */}
        <div className="dealhealth-table-card">
          <div className="table-responsive">
            <table className="dealhealth-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox"
                      className="custom-row-checkbox"
                      checked={selectedIds.length === filteredAnomalies.length && filteredAnomalies.length > 0}
                      onChange={handleToggleSelectAll}
                    />
                  </th>
                  <th>DEAL / ACCOUNT</th>
                  <th>ISSUE DETECTED</th>
                  <th>SEVERITY</th>
                  <th>FLAGGED DATE</th>
                  <th>CURRENT STATUS</th>
                  <th>ASSIGNED REP</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No anomaly flags found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredAnomalies.map(item => {
                    const isSelected = selectedIds.includes(item.id);
                    return (
                      <tr 
                        key={item.id} 
                        className={isSelected ? 'selected' : ''}
                      >
                        {/* Checkbox */}
                        <td>
                          <input 
                            type="checkbox"
                            className="custom-row-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(item.id)}
                          />
                        </td>

                        {/* Deal / Account */}
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.account}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {item.dealCode} • <strong>${item.dealValue.toLocaleString()}</strong>
                          </div>
                        </td>

                        {/* Issue Detected */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="wh-dot" style={{ 
                              width: '7px', 
                              height: '7px', 
                              backgroundColor: item.issueDotColor === 'red' ? '#e11d48' : '#f59e0b' 
                            }}></span>
                            <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.issueTitle}</strong>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            {item.issueSub}
                          </div>
                        </td>

                        {/* Severity */}
                        <td>
                          <span className={`severity-pill ${item.severityClass}`}>
                            {item.severity}
                          </span>
                        </td>

                        {/* Flagged Date */}
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.flaggedDate}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>{item.flaggedTimeAgo}</div>
                        </td>

                        {/* Current Status */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="wh-dot" style={{ 
                              width: '6px', 
                              height: '6px', 
                              backgroundColor: item.statusDotColor === 'blue' ? '#0284c7' : '#f59e0b' 
                            }}></span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.status}</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                            {item.statusSub}
                          </div>
                        </td>

                        {/* Assigned Rep */}
                        <td>
                          <div className="rep-avatar-cell">
                            <div className={`rep-avatar-circle ${item.repColor}`}>
                              {item.repInitials}
                            </div>
                            <span style={{ fontWeight: 600 }}>{item.rep}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {item.issueCategory === 'discount' ? (
                              <>
                                <button 
                                  className="btn-dh-review"
                                  onClick={() => handleOpenReviewDiscount(item)}
                                >
                                  Review Discount
                                </button>
                                <button 
                                  className="btn-dh-escalate-solid"
                                  onClick={() => handleOpenEscalate(item)}
                                >
                                  Escalate
                                </button>
                              </>
                            ) : item.issueCategory === 'delivery' ? (
                              <>
                                <button 
                                  className="btn-dh-nudge"
                                  onClick={() => handleOpenNudge(item)}
                                >
                                  Nudge Rep
                                </button>
                                <button 
                                  className="btn-dh-expedite"
                                  onClick={() => handleOpenExpedite(item)}
                                >
                                  Expedite
                                </button>
                              </>
                            ) : (
                              <>
                                <button 
                                  className="btn-dh-nudge"
                                  onClick={() => handleOpenNudge(item)}
                                >
                                  Nudge Rep
                                </button>
                                <button 
                                  className="btn-dh-escalate-outline"
                                  onClick={() => handleOpenEscalate(item)}
                                >
                                  Escalate
                                </button>
                              </>
                            )}

                            <div style={{ position: 'relative' }}>
                              <button 
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                onClick={() => setOpenActionMenuId(openActionMenuId === item.id ? null : item.id)}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {openActionMenuId === item.id && (
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
                                  minWidth: '160px'
                                }}>
                                  <button 
                                    style={{ width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', color: '#334155', cursor: 'pointer' }}
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      showToast(`Flag snooze applied for 48 hours on ${item.dealCode}`);
                                    }}
                                  >
                                    Snooze for 48 Hours
                                  </button>
                                  <button 
                                    style={{ width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', fontSize: '12px', color: '#e11d48', cursor: 'pointer' }}
                                    onClick={() => {
                                      setOpenActionMenuId(null);
                                      setAnomalies(anomalies.filter(a => a.id !== item.id));
                                      showToast(`Dismissed anomaly flag for ${item.dealCode}`);
                                    }}
                                  >
                                    Dismiss Flag
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Bulk Actions & Pagination */}
          <div className="dealhealth-table-footer">
            <div className="bulk-actions-group">
              <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>
                {selectedIds.length} items selected
              </span>

              <button 
                className="btn-bulk-escalate"
                disabled={selectedIds.length === 0}
                onClick={handleBulkEscalate}
              >
                <ArrowUpRight size={14} />
                <span>Escalate</span>
              </button>

              <button 
                className="btn-bulk-nudge"
                disabled={selectedIds.length === 0}
                onClick={handleBulkNudge}
              >
                <Bell size={14} />
                <span>Nudge Rep</span>
              </button>

              <button 
                className="btn-bulk-dismiss"
                disabled={selectedIds.length === 0}
                onClick={handleBulkDismiss}
              >
                Dismiss Flag
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#64748b' }}>
              <span>Showing <strong>1-4</strong> of <strong>10</strong> flagged items</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button className="btn-page-step" disabled>&lt;</button>
                <button className="btn-page-num active">1</button>
                <button className="btn-page-num">2</button>
                <button className="btn-page-num">3</button>
                <button className="btn-page-step">&gt;</button>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Universal Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>Systems Operational</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>•</span>
            <span>© 2025 DealFlow360 Technologies, Inc. All rights reserved.</span>
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

      {/* MODAL 1: Configure Rules & Thresholds */}
      {activeModal === 'configureRules' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Pipeline Governance & Thresholds
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRules}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Configure real-time trigger rules that automatically flag deal slippage and margin breach exceptions.
              </p>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Max Discount Allowance Ceiling (%)</label>
                <input 
                  type="number"
                  min="5"
                  max="50"
                  className="form-input"
                  value={maxDiscountThreshold}
                  onChange={(e) => setMaxDiscountThreshold(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Stalled Quote Inactivity Threshold (Days)</label>
                <input 
                  type="number"
                  min="3"
                  max="30"
                  className="form-input"
                  value={idleDaysThreshold}
                  onChange={(e) => setIdleDaysThreshold(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Delivery SLA Promise Buffer (Days)</label>
                <input 
                  type="number"
                  min="1"
                  max="14"
                  className="form-input"
                  value={deliverySlaBuffer}
                  onChange={(e) => setDeliverySlaBuffer(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input 
                  type="checkbox"
                  id="autonudge"
                  className="custom-row-checkbox"
                  checked={autoNudgeEnabled}
                  onChange={(e) => setAutoNudgeEnabled(e.target.checked)}
                />
                <label htmlFor="autonudge" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  Enable automatic Slack & Email nudges to assigned sales reps
                </label>
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
                  className="btn-configure-rules"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save Governance Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Nudge Rep */}
      {activeModal === 'nudge' && selectedAnomaly && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#0284c7" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Nudge Sales Rep — {selectedAnomaly.rep}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNudgeSubmit}>
              <div style={{ background: '#f0f9ff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1' }}>
                  Target Deal: {selectedAnomaly.account} ({selectedAnomaly.dealCode})
                </div>
                <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '2px' }}>
                  Issue: {selectedAnomaly.issueTitle}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Notification Channels</label>
                <select 
                  className="form-input"
                  value={nudgeChannel}
                  onChange={(e) => setNudgeChannel(e.target.value)}
                >
                  <option value="Slack & Email">Slack Channel + Email Direct</option>
                  <option value="Slack Only">Slack Direct Message Only</option>
                  <option value="Email Only">Email Priority High Only</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Nudge Message</label>
                <textarea 
                  className="form-input"
                  rows={4}
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
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
                  className="btn-bulk-nudge"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Dispatch Nudge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Escalate to Manager */}
      {activeModal === 'escalate' && selectedAnomaly && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#e11d48" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Escalate Deal Flag — {selectedAnomaly.account}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEscalateSubmit}>
              <div style={{ background: '#ffe4e6', padding: '12px 14px', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e11d48' }}>
                  Severity: {selectedAnomaly.severity} ({selectedAnomaly.issueTitle})
                </div>
                <div style={{ fontSize: '12px', color: '#9f1239', marginTop: '2px' }}>
                  Deal Value: ${selectedAnomaly.dealValue.toLocaleString()} • Rep: {selectedAnomaly.rep}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Escalate To</label>
                <select 
                  className="form-input"
                  value={escalateTarget}
                  onChange={(e) => setEscalateTarget(e.target.value)}
                >
                  <option value="VP Sales (Marcus Vance)">VP Sales (Marcus Vance)</option>
                  <option value="Head of Commercial Finance (Elena Rostova)">Head of Commercial Finance (Elena Rostova)</option>
                  <option value="Chief Revenue Officer (CRO Desk)">Chief Revenue Officer (CRO Desk)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Executive Brief & Rationale</label>
                <textarea 
                  className="form-input"
                  rows={4}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
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
                  className="btn-dh-escalate-solid"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Review Discount Exception */}
      {activeModal === 'reviewDiscount' && selectedAnomaly && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={20} color="#e11d48" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Review Discount Exception — {selectedAnomaly.account}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ margin: '14px 0 20px' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Requested Discount Rate:</span>
                  <strong style={{ fontSize: '15px', color: '#e11d48' }}>22.0% ($14,124.00 savings)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Standard Rep Allowance:</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>8.0%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Gross Margin Impact:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>Compressed to 34.5% (Min target: 40%)</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#475569' }}>
                Approving this exception requires Finance sign-off or an escalation to VP Sales.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-dash-secondary" 
                style={{ flex: 1 }}
                onClick={() => {
                  showToast('Discount exception rejected. Deal reverted to standard 8% rate.');
                  setActiveModal(null);
                }}
              >
                Reject Exception
              </button>
              <button 
                type="button" 
                className="btn-dh-escalate-solid"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  handleOpenEscalate(selectedAnomaly);
                }}
              >
                Escalate to VP Sales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Expedite Logistics */}
      {activeModal === 'expedite' && selectedAnomaly && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={20} color="#d97706" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Expedite Delivery — {selectedAnomaly.account}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '8px', border: '1px solid #fde68a', margin: '14px 0 20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309' }}>
                Priority Freight Dispatch Override
              </div>
              <div style={{ fontSize: '12.5px', color: '#92400e', marginTop: '4px' }}>
                Switch fulfillment routing to Next-Day Air Freight from Central Hub to clear the 6-day customs delay.
              </div>
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
                type="button" 
                className="btn-dh-expedite"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  showToast(`Priority air freight authorized for ${selectedAnomaly.dealCode}! SLA protected.`);
                  setActiveModal(null);
                }}
              >
                Authorize Air Freight
              </button>
            </div>
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
                DealFlow360 continuously inspects deal velocity, discount variance, and logistics fulfillment SLAs to prevent margin leakage.
              </p>
              <p>
                All governance thresholds, escalation approvals, and audit trail events are stored securely with tamper-proof signatures.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
