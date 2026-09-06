import React, { useState, useEffect, useCallback } from 'react';
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
import Navbar from '../../components/layout/Navbar';
import { fetchPipelineReports } from '../../services/reportService';
import './Reports.css';

export default function Reports({ user, onNavigate, onLogout }) {
  // Toast notifications
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter States
  const [period, setPeriod] = useState('This Month (Sep 2026)');
  const [salesTeam, setSalesTeam] = useState('All Teams (Enterprise + MM)');
  const [approvalStatus, setApprovalStatus] = useState('All Statuses');
  const [productFilter, setProductFilter] = useState('All Products & Bundles');

  // Live Database Reports State
  const [reportsData, setReportsData] = useState(null);
  const [repsData, setRepsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = useCallback(async (currentFilters = {}) => {
    try {
      setIsLoading(true);
      const params = {
        period: currentFilters.period ?? period,
        salesTeam: currentFilters.salesTeam ?? salesTeam,
        approvalStatus: currentFilters.approvalStatus ?? approvalStatus,
        productFilter: currentFilters.productFilter ?? productFilter,
      };
      const data = await fetchPipelineReports(params);
      setReportsData(data);
      if (data.repPerformance) {
        setRepsData(data.repPerformance);
      }
    } catch {
      showToast('Failed to load dynamic reports from database');
    } finally {
      setIsLoading(false);
    }
  }, [period, salesTeam, approvalStatus, productFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleFilterChange = (filterKey, value) => {
    if (filterKey === 'period') setPeriod(value);
    if (filterKey === 'salesTeam') setSalesTeam(value);
    if (filterKey === 'approvalStatus') setApprovalStatus(value);
    if (filterKey === 'productFilter') setProductFilter(value);

    loadReports({ [filterKey]: value });
  };

  // Modals state
  const [activeModal, setActiveModal] = useState(null);
  const [selectedRep, setSelectedRep] = useState(null);
  const [footerModalType, setFooterModalType] = useState('');

  // Custom Report Form State
  const [reportTitle, setReportTitle] = useState('Executive Q3 Pipeline Velocity');
  const [reportFormat, setReportFormat] = useState('PDF');
  const [reportGrouping, setReportGrouping] = useState('Sales Team');

  // Actions
  const handleResetFilters = () => {
    const defaultPeriod = 'This Month (Sep 2026)';
    const defaultTeam = 'All Teams (Enterprise + MM)';
    const defaultStatus = 'All Statuses';
    const defaultProduct = 'All Products & Bundles';

    setPeriod(defaultPeriod);
    setSalesTeam(defaultTeam);
    setApprovalStatus(defaultStatus);
    setProductFilter(defaultProduct);

    loadReports({
      period: defaultPeriod,
      salesTeam: defaultTeam,
      approvalStatus: defaultStatus,
      productFilter: defaultProduct,
    });
    showToast('Filters reset to live default view.');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportXLS = () => {
    const headers = ['Representative', 'Team', 'Quotes Generated', 'Total Value', 'Deals Won', 'Closed Revenue', 'Avg Discount', 'Avg Cycle', 'SLA Compliance'];
    const rows = repsData.map(r => [
      r.name,
      r.team,
      r.quotesGenerated,
      `$${Number(r.totalQuotedValue || 0).toLocaleString()}`,
      r.dealsWon,
      `$${Number(r.closedRevenue || 0).toLocaleString()}`,
      r.avgDiscount,
      r.avgCycle,
      r.slaCompliance
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DealFlow360_Live_Reports_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Live XLS / CSV Report generated and downloaded!');
  };

  const handleOpenRepReport = (rep) => {
    setSelectedRep(rep);
    setActiveModal('repDrilldown');
  };

  const handleCreateReportSubmit = (e) => {
    e.preventDefault();
    showToast(`Custom executive report "${reportTitle}" created and scheduled!`);
    setActiveModal(null);
  };

  const kpi = reportsData?.kpis || {};
  const monthlyTrends = reportsData?.monthlyTrends || [
    { month: 'Apr', heightQuoted: '45px', heightWon: '30px', quotedFormatted: '$101,217', wonFormatted: '$42,964' },
    { month: 'May', heightQuoted: '60px', heightWon: '35px', quotedFormatted: '$134,955', wonFormatted: '$55,240' },
    { month: 'Jun', heightQuoted: '80px', heightWon: '45px', quotedFormatted: '$185,564', wonFormatted: '$73,653' },
    { month: 'Jul', heightQuoted: '105px', heightWon: '55px', quotedFormatted: '$236,172', wonFormatted: '$92,066' },
    { month: 'Aug', heightQuoted: '135px', heightWon: '70px', quotedFormatted: '$320,519', wonFormatted: '$122,755' },
    { month: 'Sep (Now)', heightQuoted: '150px', heightWon: '120px', quotedFormatted: '$843,471', wonFormatted: '$306,888', current: true },
  ];

  const approvalGates = reportsData?.approvalGates || [
    { name: '1. Sales Director Review (>15% Disc)', avgHours: '1.8 hrs', slaHours: '4.0h', progressWidth: '45%', statusColor: 'green' },
    { name: '2. Finance & Payment Terms Review', avgHours: '3.2 hrs', slaHours: '3.0h', progressWidth: '92%', statusColor: 'orange' },
    { name: '3. Legal Custom Terms & SLA Signoff', avgHours: '1.4 hrs', slaHours: '6.0h', progressWidth: '23%', statusColor: 'green' },
  ];

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
              Live PostgreSQL sales trends, approval gate latencies, and quota attainment across all sales representatives
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
              <span>Create Custom Report</span>
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
              <strong>LIVE REVENUE RECOGNITION & PIPELINE SYNC:</strong> Real-time metrics computed directly from active database quotations ({kpi.quotesCreated || 42} deals), warehouse dispatches, and approval audit logs.
            </div>
          </div>
          <div className="sync-banner-shortcut">
            Live Database Sync • ⌘ + P to Print
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="reports-filter-bar">
          <div className="filter-control-group">
            <label className="filter-control-label">PERIOD</label>
            <select 
              className="filter-control-select"
              value={period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
            >
              <option value="This Month (Sep 2026)">This Month (Sep 2026)</option>
              <option value="Last Month (Aug 2026)">Last Month (Aug 2026)</option>
              <option value="Q3 2026 (YTD)">Q3 2026 (YTD)</option>
              <option value="Full Year 2026">Full Year 2026</option>
            </select>
          </div>

          <div className="filter-control-group">
            <label className="filter-control-label">SALES TEAM</label>
            <select 
              className="filter-control-select"
              value={salesTeam}
              onChange={(e) => handleFilterChange('salesTeam', e.target.value)}
            >
              <option value="All Teams (Enterprise + MM)">All Teams (Enterprise + MM)</option>
              <option value="Enterprise West">Enterprise Deals (&gt; $5k)</option>
              <option value="Mid-Market Velocity">Mid-Market Velocity (&lt; $5k)</option>
            </select>
          </div>

          <div className="filter-control-group">
            <label className="filter-control-label">APPROVAL STATUS</label>
            <select 
              className="filter-control-select"
              value={approvalStatus}
              onChange={(e) => handleFilterChange('approvalStatus', e.target.value)}
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Approved">Approved / Confirmed</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Negotiation">Under Negotiation</option>
              <option value="Rejected / Returned">Returned / At Risk</option>
            </select>
          </div>

          <div className="filter-control-group">
            <label className="filter-control-label">PRODUCT</label>
            <select 
              className="filter-control-select"
              value={productFilter}
              onChange={(e) => handleFilterChange('productFilter', e.target.value)}
            >
              <option value="All Products & Bundles">All Products & Bundles</option>
              <option value="Care Plan">Extended Care Plan</option>
              <option value="Laptop">Enterprise Laptops</option>
              <option value="Optical">Optical Transceivers</option>
              <option value="Server">Server Racks</option>
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
                  <span className="rep-kpi-badge cyan">Target: {kpi.quotesTarget || 50}</span>
                </div>
                <div className="rep-kpi-icon blue">
                  <FileText size={18} />
                </div>
              </div>
              <div className="rep-kpi-metric">
                {kpi.quotesCreated || 42} <span className="rep-kpi-metric-sub">in pipeline</span>
              </div>
            </div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-trend-positive">
                <ArrowUpRight size={15} />
                <span>{kpi.quotesGrowth || '+18.4% vs last period'}</span>
              </span>
              <span>{kpi.wonActivePercent || '60% Won / Active'}</span>
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
                {kpi.avgApprovalHours || '4.8'} <span className="rep-kpi-metric-sub">hours</span>
              </div>
            </div>
            <div className="rep-kpi-footer">
              <span className="rep-kpi-trend-positive">
                <ArrowDownRight size={15} />
                <span>{kpi.avgApprovalDiff || '-2.1 hrs faster vs baseline'}</span>
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
                  <span className="rep-kpi-badge gray">Attach Rate: {kpi.topUpsoldProduct?.attachRate || '48%'}</span>
                </div>
                <div className="rep-kpi-icon purple">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="rep-kpi-metric" style={{ fontSize: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kpi.topUpsoldProduct?.name || '100G Optical Cables'}
              </div>
            </div>
            <div className="rep-kpi-footer">
              <span>{kpi.topUpsoldProduct?.attachments || 20} attachments • {kpi.topUpsoldProduct?.formattedRevenue || '$3,600'}</span>
              <span className="rep-kpi-trend-positive">{kpi.topUpsoldProduct?.growth || '+12.4% YoY'}</span>
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
                    Monthly quote pipeline vs closed revenue realization ({kpi.pipelineFormatted || '$843,471'})
                  </div>
                </div>

                <div className="analytics-legend">
                  <div>
                    <span className="legend-dot quoted"></span>
                    <span>Quoted Pipeline</span>
                  </div>
                  <div>
                    <span className="legend-dot won"></span>
                    <span>Closed Won Revenue</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="chart-bars-container">
                {monthlyTrends.map((m, idx) => (
                  <div className="chart-month-col" key={idx} title={`Quoted: ${m.quotedFormatted} | Won: ${m.wonFormatted}`}>
                    <div className="chart-bar-group">
                      <div className={`bar-quoted ${m.current ? 'current' : ''}`} style={{ height: m.heightQuoted }}></div>
                      <div className="bar-won" style={{ height: m.heightWon }}></div>
                    </div>
                    <span className={`chart-month-label ${m.current ? 'current' : ''}`}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-card-footer">
              <span>Closed Realized Revenue: <strong>{kpi.wonRevenueFormatted || '$306,888'}</strong> ({kpi.wonDealsCount || 25} won deals)</span>
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
                    Resolution latency & SLA compliance across review gates
                  </div>
                </div>
                <span className="kpi-badge yellow" style={{ border: '1px solid #fde68a' }}>
                  Finance Gate Audited
                </span>
              </div>

              {/* Latency Gates */}
              <div style={{ marginTop: '8px' }}>
                {approvalGates.map((gate, idx) => (
                  <div className="gate-row" key={idx}>
                    <div className="gate-label-row">
                      <div className="gate-name">
                        <span className={`legend-dot ${gate.statusColor === 'green' ? 'won' : ''}`} style={{ 
                          width: '6px', 
                          height: '6px', 
                          backgroundColor: gate.statusColor === 'orange' ? '#f59e0b' : '#10b981' 
                        }}></span>
                        {gate.name}
                      </div>
                      <div>
                        <span className="gate-time" style={{ color: gate.statusColor === 'orange' ? '#d97706' : '#0f172a' }}>{gate.avgHours}</span>
                        <span className="gate-sla-muted"> / SLA: {gate.slaHours}</span>
                      </div>
                    </div>
                    <div className="gate-progress-track">
                      <div className={`gate-progress-fill ${gate.statusColor}`} style={{ width: gate.progressWidth }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Metric Box */}
            <div className="efficiency-metric-box">
              <div>
                <div className="efficiency-text-main">Auto-Approval Efficiency</div>
                <div className="efficiency-text-sub">Low-discount quotes bypass manual tiers automatically</div>
              </div>
              <div className="efficiency-big-stat">{reportsData?.autoApprovalEfficiency || '54.2%'}</div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Detailed Performance Table */}
        <div className="reports-rep-table-card">
          <div className="rep-table-header">
            <div>
              <div className="rep-table-title">Detailed Performance by Sales Representative & Team</div>
              <div className="rep-table-sub">
                Live PostgreSQL quotation volume, discount compliance, and deal realization per representative
              </div>
            </div>

            <div className="rep-table-right">
              Showing <strong>{repsData.length}</strong> active sales reps
              <button 
                className="link-view-all-reps"
                onClick={() => showToast(`Showing all ${repsData.length} team members from database.`)}
              >
                Refresh View
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
                      ${Number(rep.totalQuotedValue || 0).toLocaleString()}
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
                Report will aggregate live pipeline deals from PostgreSQL database with automated 15-minute sync data.
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
          <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
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
                    {selectedRep.team} • {selectedRep.email}
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
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedRep.quotesGenerated}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>WIN RATE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{selectedRep.winRate}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CLOSED REV</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>${Number(selectedRep.closedRevenue || 0).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '13px', color: '#334155', marginBottom: '14px' }}>
                <div><strong>Pricing Compliance:</strong> {selectedRep.avgDiscount}</div>
                <div style={{ marginTop: '6px' }}><strong>Avg Turnaround Velocity:</strong> {selectedRep.avgCycle}</div>
                <div style={{ marginTop: '6px' }}><strong>SLA Adherence:</strong> {selectedRep.slaCompliance}</div>
                <div style={{ marginTop: '6px' }}><strong>Total Quoted Volume:</strong> ${Number(selectedRep.totalQuotedValue || 0).toLocaleString()}</div>
              </div>

              {/* Sample Quotes for this rep */}
              {selectedRep.quotes && selectedRep.quotes.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Active Deals in Rep Portfolio ({selectedRep.quotes.length})
                  </div>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '6px' }}>
                    {selectedRep.quotes.map((q, qIdx) => (
                      <div key={qIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f8fafc', fontSize: '12.5px' }}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>#{q.id}</strong> — {q.customer_name}
                          <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '11px' }}>({q.stage})</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#714b67' }}>
                          ${Number(q.total_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                DealFlow360 analytics reports provide real-time deal telemetry, pricing governance insights, and gate latency diagnostics backed by PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
