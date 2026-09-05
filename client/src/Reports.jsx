import React, { useState } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Plus, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Clock, 
  Check, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  BarChart3, 
  Layers, 
  Sliders,
  Download
} from 'lucide-react';
import Navbar from './Navbar';
import './Reports.css';

export default function Reports({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter States
  const [period, setPeriod] = useState('This Month (Aug 2025)');
  const [salesTeam, setSalesTeam] = useState('All Teams (Enterprise + MM)');
  const [approvalStatus, setApprovalStatus] = useState('All Statuses');
  const [productFilter, setProductFilter] = useState('All Products & Bundles');

  // Reps Data
  const [repsData, setRepsData] = useState([
    {
      id: 'rep-1',
      name: 'Marcus Shah',
      team: 'Enterprise West',
      avatar: 'MS',
      avatarColor: 'pink',
      quotesGenerated: 42,
      totalQuotedValue: 1420500,
      avgDiscount: '9.2% (Healthy)',
      avgDiscountClass: 'healthy',
      avgCycle: '4.8 hours',
      slaCompliance: '98% in SLA',
      slaComplianceClass: 'green',
      winRate: '68%',
      closedRevenue: 965000
    },
    {
      id: 'rep-2',
      name: 'Rohan Iyer',
      team: 'Strategic Global',
      avatar: 'RI',
      avatarColor: 'cyan',
      quotesGenerated: 38,
      totalQuotedValue: 2190000,
      avgDiscount: '18.4% (Elevated)',
      avgDiscountClass: 'elevated',
      avgCycle: '8.2 hours',
      slaCompliance: '82% in SLA',
      slaComplianceClass: 'amber',
      winRate: '74%',
      closedRevenue: 1620000
    },
    {
      id: 'rep-3',
      name: 'Sarah Jenkins',
      team: 'Enterprise East & EMEA',
      avatar: 'SJ',
      avatarColor: 'purple',
      quotesGenerated: 36,
      totalQuotedValue: 980400,
      avgDiscount: '7.5% (Healthy)',
      avgDiscountClass: 'healthy',
      avgCycle: '5.1 hours',
      slaCompliance: '95% in SLA',
      slaComplianceClass: 'green',
      winRate: '62%',
      closedRevenue: 610000
    },
    {
      id: 'rep-4',
      name: 'David Vance',
      team: 'Mid-Market Velocity',
      avatar: 'DV',
      avatarColor: 'green',
      quotesGenerated: 32,
      totalQuotedValue: 645000,
      avgDiscount: '6.1% (Low)',
      avgDiscountClass: 'low',
      avgCycle: '3.9 hours',
      slaCompliance: '100% in SLA',
      slaComplianceClass: 'green',
      winRate: '81%',
      closedRevenue: 522000
    }
  ]);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'customReport' | 'repDrilldown' | 'footerModal'
  const [selectedRep, setSelectedRep] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');

  // Custom Report Form State
  const [reportTitle, setReportTitle] = useState('Executive Q3 Pipeline Velocity');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [reportGrouping, setReportGrouping] = useState('Sales Team');

  // Actions
  const handleResetFilters = () => {
    setPeriod('This Month (Aug 2025)');
    setSalesTeam('All Teams (Enterprise + MM)');
    setApprovalStatus('All Statuses');
    setProductFilter('All Products & Bundles');
    showToast('Filters reset to default view.');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportXLS = () => {
    const headers = ['Representative', 'Team', 'Quotes Generated', 'Total Value', 'Avg Discount', 'Avg Cycle', 'SLA Compliance'];
    const rows = repsData.map(r => [
      r.name,
      r.team,
      r.quotesGenerated,
      `$${r.totalQuotedValue.toLocaleString()}`,
      r.avgDiscount,
      r.avgCycle,
      r.slaCompliance
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Admin_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('XLS / CSV Report generated and downloaded!');
  };

  const handleOpenRepReport = (rep) => {
    setSelectedRep(rep);
    setActiveModal('repDrilldown');
  };

  const handleCreateReportSubmit = (e) => {
    e.preventDefault();
    showToast(`Custom report "${reportTitle}" created and scheduled!`);
    setActiveModal(null);
  };

  return (
    <div className="reports-container">
      {/* Top Universal Navbar */}
      <Navbar 
        activePage="reports" 
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

      {/* Main Reporting Dashboard Content */}
      <main className="reports-main animate-fade-in">

        {/* Kicker & Title Header */}
        <div className="reports-header-row">
          <div className="reports-title-group">
            <div className="reports-kicker">
              ADMIN INTELLIGENCE • REVENUE ANALYTICS • REAL-TIME REPORTING
            </div>
            <h1 className="reports-title">Admin / Reporting Dashboard</h1>
            <p className="reports-subtitle">
              Sales trends, approval bottlenecks, and platform usage metrics across all accounts and teams
            </p>
          </div>

          <div className="reports-actions-group">
            <button 
              className="btn-export-pdf"
              onClick={handleExportPDF}
              title="Print or export as PDF"
            >
              <FileText size={15} />
              <span>Export PDF</span>
            </button>

            <button 
              className="btn-export-xls"
              onClick={handleExportXLS}
              title="Export report as Excel XLS"
            >
              <FileSpreadsheet size={15} />
              <span>Export XLS</span>
            </button>

            <button 
              className="btn-create-report"
              onClick={() => setActiveModal('customReport')}
            >
              <Plus size={16} />
              <span>+ Create Custom Report</span>
            </button>
          </div>
        </div>

        {/* Sync Alert Callout Banner */}
        <div className="reports-sync-banner">
          <div className="sync-banner-left">
            <div className="sync-banner-icon">
              <Clock size={14} />
            </div>
            <div className="sync-banner-text">
              <strong>REPORTING SYNC & REVENUE RECOGNITION:</strong> Aggregated metrics refresh every 15 minutes from warehouse dispatches, ERP invoice feeds, and approval audit logs. Scheduled exports are delivered every Monday at 08:00 UTC.
            </div>
          </div>
          <div className="sync-banner-shortcut">
            Shortcut: ⌘ + P to Quick Print
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="reports-filter-bar">
          <div className="filter-control-group">
            <label className="filter-control-label">PERIOD</label>
            <select 
              className="filter-control-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="This Month (Aug 2025)">This Month (Aug 2025)</option>
              <option value="Last Month (Jul 2025)">Last Month (Jul 2025)</option>
              <option value="Q3 2025 (YTD)">Q3 2025 (YTD)</option>
              <option value="Full Year 2025">Full Year 2025</option>
            </select>
          </div>

          <div className="filter-control-group">
            <label className="filter-control-label">SALES TEAM</label>
            <select 
              className="filter-control-select"
              value={salesTeam}
              onChange={(e) => setSalesTeam(e.target.value)}
            >
              <option value="All Teams (Enterprise + MM)">All Teams (Enterprise + MM)</option>
              <option value="Enterprise West">Enterprise West</option>
              <option value="Strategic Global">Strategic Global</option>
              <option value="Enterprise East & EMEA">Enterprise East & EMEA</option>
              <option value="Mid-Market Velocity">Mid-Market Velocity</option>
            </select>
          </div>

          <div className="filter-control-group">
            <label className="filter-control-label">APPROVAL STATUS</label>
            <select 
              className="filter-control-select"
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Rejected / Returned">Rejected / Returned</option>
            </select>
          </div>

          <div className="filter-control-group">
            <label className="filter-control-label">PRODUCT</label>
            <select 
              className="filter-control-select"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="All Products & Bundles">All Products & Bundles</option>
              <option value="Care Plan 2yr">Care Plan 2yr</option>
              <option value="POS Enterprise Cloud">POS Enterprise Cloud</option>
              <option value="Edge Gateway Hub">Edge Gateway Hub</option>
            </select>
          </div>

          <button 
            className="btn-reset-filters"
            onClick={handleResetFilters}
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* 3 Top KPI Cards */}
        <div className="reports-kpi-grid">
          {/* KPI 1 */}
          <div className="rep-kpi-card">
            <div>
              <div className="rep-kpi-header">
                <div className="rep-kpi-title-wrap">
                  <span className="rep-kpi-title">QUOTES CREATED</span>
                  <span className="rep-kpi-badge cyan">Target: 120</span>
                </div>
                <div className="rep-kpi-icon blue">
                  <FileText size={18} />
                </div>
              </div>
              <div className="rep-kpi-metric">
                148 <span className="rep-kpi-metric-sub">this month</span>
              </div>
            </div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-trend-positive">
                <ArrowUpRight size={15} />
                <span>+18.4% vs last month</span>
              </span>
              <span>88% Won / Active</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="rep-kpi-card">
            <div>
              <div className="rep-kpi-header">
                <div className="rep-kpi-title-wrap">
                  <span className="rep-kpi-title">AVG APPROVAL TIME</span>
                  <span className="rep-kpi-badge green">SLA Met (&lt; 8h)</span>
                </div>
                <div className="rep-kpi-icon yellow">
                  <Clock size={18} />
                </div>
              </div>
              <div className="rep-kpi-metric">
                6.4 <span className="rep-kpi-metric-sub">hours</span>
              </div>
            </div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-trend-positive">
                <ArrowDownRight size={15} />
                <span>-2.1 hrs faster vs baseline</span>
              </span>
              <span>Audit: 3-tier rules</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="rep-kpi-card">
            <div>
              <div className="rep-kpi-header">
                <div className="rep-kpi-title-wrap">
                  <span className="rep-kpi-title">TOP UPSOLD PRODUCT</span>
                  <span className="rep-kpi-badge gray">Attach Rate: 34%</span>
                </div>
                <div className="rep-kpi-icon purple">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="rep-kpi-metric" style={{ fontSize: '24px' }}>
                Care Plan 2yr
              </div>
            </div>
            <div className="rep-kpi-footer">
              <span>42 attachments • $176,400 arr</span>
              <span className="rep-kpi-trend-positive">+8.5% YoY</span>
            </div>
          </div>
        </div>

        {/* Middle Section: 2 Analytics Cards Grid */}
        <div className="reports-middle-grid">
          {/* Card 1: Sales Trends & Quote Velocity */}
          <div className="analytics-card">
            <div>
              <div className="analytics-card-header">
                <div>
                  <div className="analytics-title">Sales Trends & Quote Velocity</div>
                  <div className="analytics-subtitle">
                    Monthly quote creations vs realized invoiced volume (2025)
                  </div>
                </div>

                <div className="analytics-legend">
                  <div>
                    <span className="legend-dot quoted"></span>
                    <span>Quoted Volume</span>
                  </div>
                  <div>
                    <span className="legend-dot won"></span>
                    <span>Closed Won ($ARR)</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="chart-bars-container">
                {/* Mar */}
                <div className="chart-month-col">
                  <div className="chart-bar-group">
                    <div className="bar-quoted" style={{ height: '60px' }}></div>
                    <div className="bar-won" style={{ height: '45px' }}></div>
                  </div>
                  <span className="chart-month-label">Mar</span>
                </div>

                {/* Apr */}
                <div className="chart-month-col">
                  <div className="chart-bar-group">
                    <div className="bar-quoted" style={{ height: '75px' }}></div>
                    <div className="bar-won" style={{ height: '60px' }}></div>
                  </div>
                  <span className="chart-month-label">Apr</span>
                </div>

                {/* May */}
                <div className="chart-month-col">
                  <div className="chart-bar-group">
                    <div className="bar-quoted" style={{ height: '90px' }}></div>
                    <div className="bar-won" style={{ height: '70px' }}></div>
                  </div>
                  <span className="chart-month-label">May</span>
                </div>

                {/* Jun */}
                <div className="chart-month-col">
                  <div className="chart-bar-group">
                    <div className="bar-quoted" style={{ height: '110px' }}></div>
                    <div className="bar-won" style={{ height: '95px' }}></div>
                  </div>
                  <span className="chart-month-label">Jun</span>
                </div>

                {/* Jul */}
                <div className="chart-month-col">
                  <div className="chart-bar-group">
                    <div className="bar-quoted" style={{ height: '130px' }}></div>
                    <div className="bar-won" style={{ height: '115px' }}></div>
                  </div>
                  <span className="chart-month-label">Jul</span>
                </div>

                {/* Aug (Now) */}
                <div className="chart-month-col">
                  <div className="chart-bar-group">
                    <div className="bar-quoted current" style={{ height: '150px' }}></div>
                    <div className="bar-won" style={{ height: '135px' }}></div>
                  </div>
                  <span className="chart-month-label current">Aug (Now)</span>
                </div>
              </div>
            </div>

            <div className="analytics-card-footer">
              <span>Target realization pace: <strong>108.2% of Q3 Quota</strong></span>
              <button 
                className="analytics-drilldown-link"
                onClick={() => onNavigate && onNavigate('quotations')}
              >
                Drill into full pipeline →
              </button>
            </div>
          </div>

          {/* Card 2: Approval Bottlenecks & Turnaround */}
          <div className="analytics-card">
            <div>
              <div className="analytics-card-header">
                <div>
                  <div className="analytics-title">Approval Bottlenecks & Turnaround</div>
                  <div className="analytics-subtitle">
                    Average resolution latency across approval gates
                  </div>
                </div>
                <span className="kpi-badge yellow" style={{ border: '1px solid #fde68a' }}>
                  Finance Gate Lagging
                </span>
              </div>

              {/* Latency Gates */}
              <div style={{ marginTop: '8px' }}>
                {/* Gate 1 */}
                <div className="gate-row">
                  <div className="gate-label-row">
                    <div className="gate-name">
                      <span className="legend-dot won" style={{ width: '6px', height: '6px' }}></span>
                      1. Sales Director Review (&gt;15% Disc)
                    </div>
                    <div>
                      <span className="gate-time">1.8 hrs</span>
                      <span className="gate-sla-muted"> / SLA: 4.0h</span>
                    </div>
                  </div>
                  <div className="gate-progress-track">
                    <div className="gate-progress-fill green" style={{ width: '45%' }}></div>
                  </div>
                </div>

                {/* Gate 2 */}
                <div className="gate-row">
                  <div className="gate-label-row">
                    <div className="gate-name">
                      <span className="legend-dot" style={{ width: '6px', height: '6px', backgroundColor: '#f59e0b' }}></span>
                      2. Finance & Payment Terms Review
                    </div>
                    <div>
                      <span className="gate-time" style={{ color: '#d97706' }}>3.2 hrs</span>
                      <span className="gate-sla-muted"> / SLA: 3.0h</span>
                    </div>
                  </div>
                  <div className="gate-progress-track">
                    <div className="gate-progress-fill orange" style={{ width: '92%' }}></div>
                  </div>
                </div>

                {/* Gate 3 */}
                <div className="gate-row">
                  <div className="gate-label-row">
                    <div className="gate-name">
                      <span className="legend-dot won" style={{ width: '6px', height: '6px' }}></span>
                      3. Legal Custom Terms & SLA Signoff
                    </div>
                    <div>
                      <span className="gate-time">1.4 hrs</span>
                      <span className="gate-sla-muted"> / SLA: 6.0h</span>
                    </div>
                  </div>
                  <div className="gate-progress-track">
                    <div className="gate-progress-fill green" style={{ width: '23%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Efficiency Metric Box */}
            <div className="efficiency-metric-box">
              <div>
                <div className="efficiency-text-main">Auto-Approval Efficiency</div>
                <div className="efficiency-text-sub">Quotes &lt; $50K bypass manual tiers cleanly</div>
              </div>
              <div className="efficiency-big-stat">54.2%</div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Detailed Performance Table */}
        <div className="reports-rep-table-card">
          <div className="rep-table-header">
            <div>
              <div className="rep-table-title">Detailed Performance by Sales Representative & Team</div>
              <div className="rep-table-sub">
                Breakdown of quotation outputs, pricing compliance, and turnaround cycles
              </div>
            </div>

            <div className="rep-table-right">
              Showing <strong>4</strong> of <strong>24</strong> reps
              <button 
                className="link-view-all-reps"
                onClick={() => showToast('Displaying top 4 reps for current filter view.')}
              >
                View All Representatives
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="rep-performance-table">
              <thead>
                <tr>
                  <th>SALES REP / TEAM</th>
                  <th>QUOTES GENERATED</th>
                  <th>TOTAL QUOTED VALUE</th>
                  <th>AVG DISCOUNT</th>
                  <th>AVG CYCLE</th>
                  <th>SLA COMPLIANCE</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {repsData.map(rep => (
                  <tr key={rep.id}>
                    {/* Rep / Team */}
                    <td>
                      <div className="rep-user-cell">
                        <div className={`rep-user-avatar ${rep.avatarColor}`}>
                          {rep.avatar}
                        </div>
                        <div>
                          <div className="rep-user-name">{rep.name}</div>
                          <div className="rep-user-team">{rep.team}</div>
                        </div>
                      </div>
                    </td>

                    {/* Quotes Generated */}
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>
                      {rep.quotesGenerated} quotes
                    </td>

                    {/* Total Value */}
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ${rep.totalQuotedValue.toLocaleString()}
                    </td>

                    {/* Avg Discount */}
                    <td>
                      <span className={`rep-discount-pill ${rep.avgDiscountClass}`}>
                        {rep.avgDiscount}
                      </span>
                    </td>

                    {/* Avg Cycle */}
                    <td style={{ color: '#475569', fontWeight: 600 }}>
                      {rep.avgCycle}
                    </td>

                    {/* SLA Compliance */}
                    <td>
                      <span className={`rep-sla-pill ${rep.slaComplianceClass}`}>
                        <span className="wh-dot" style={{ 
                          width: '6px', 
                          height: '6px', 
                          backgroundColor: rep.slaComplianceClass === 'green' ? '#10b981' : '#f59e0b' 
                        }}></span>
                        {rep.slaCompliance}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-view-report-link"
                        onClick={() => handleOpenRepReport(rep)}
                      >
                        <span>View Report</span>
                        <span>→</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Universal Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>All Systems Operational</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            <span>DealFlow360 v4.12 Enterprise</span>
          </div>

          <div className="footer-links">
            <span>© 2025 DealFlow360 Technologies, Inc. All rights reserved.</span>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('privacy'); setActiveModal('footerModal'); }}
            >
              Privacy Policy
            </button>
            <button 
              className="footer-link"
              onClick={() => { setFooterModalType('terms'); setActiveModal('footerModal'); }}
            >
              Terms of Service
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

      {/* MODAL 1: Create Custom Report */}
      {activeModal === 'customReport' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={20} color="#714b67" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Create Custom Executive Report
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReportSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label">Report Title</label>
                <input 
                  type="text"
                  className="form-input"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Primary Metric Grouping</label>
                  <select 
                    className="form-input"
                    value={reportGrouping}
                    onChange={(e) => setReportGrouping(e.target.value)}
                  >
                    <option value="Sales Team">By Sales Team</option>
                    <option value="Product Line">By Product Line & Attach Rate</option>
                    <option value="Approval Gate Latency">By Approval Gate Latency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Export Format</label>
                  <select 
                    className="form-input"
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                  >
                    <option value="PDF">Executive Presentation (PDF)</option>
                    <option value="XLS">Raw Ledger Data (XLS/CSV)</option>
                  </select>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', color: '#64748b' }}>
                Report will aggregate deals from the current billing period with automated 15-minute sync data.
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
                  className="btn-create-report"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Representative Drilldown */}
      {selectedRep && activeModal === 'repDrilldown' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`rep-user-avatar ${selectedRep.avatarColor}`}>
                  {selectedRep.avatar}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedRep.name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {selectedRep.team}
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ margin: '14px 0 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>QUOTES</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedRep.quotesGenerated}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WIN RATE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{selectedRep.winRate}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CLOSED REV</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>${(selectedRep.closedRevenue / 1000).toFixed(0)}k</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '13px', color: '#334155' }}>
                <div><strong>Pricing Compliance:</strong> {selectedRep.avgDiscount}</div>
                <div style={{ marginTop: '6px' }}><strong>Avg Turnaround Velocity:</strong> {selectedRep.avgCycle}</div>
                <div style={{ marginTop: '6px' }}><strong>SLA Adherence:</strong> {selectedRep.slaCompliance}</div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-create-report"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActiveModal(null)}
            >
              Done
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
                DealFlow360 analytics reports provide real-time deal telemetry, pricing governance insights, and gate latency diagnostics.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
