import React, { useState } from 'react';
import { 
  Home, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Plus, 
  CheckSquare, 
  Zap, 
  Check, 
  Edit3, 
  Package, 
  ArrowRight, 
  Globe, 
  User, 
  LogOut, 
  Settings, 
  X
} from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ user, onNavigate, onLogout }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // New Quote Form State
  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuoteAmount, setNewQuoteAmount] = useState('');
  const [newQuoteNotes, setNewQuoteNotes] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCreateQuote = (e) => {
    e.preventDefault();
    if (!newQuoteClient || !newQuoteAmount) {
      showToast('Please enter client name and quotation value.');
      return;
    }
    showToast(`Quotation for ${newQuoteClient} ($${newQuoteAmount}) created successfully!`);
    setActiveModal(null);
    setNewQuoteClient('');
    setNewQuoteAmount('');
    setNewQuoteNotes('');
  };

  return (
    <div className="dashboard-container">
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
            <div className="dash-brand" onClick={() => onNavigate && onNavigate('dashboard')}>
              <img src="/logo.png" alt="DealFlow360 Logo" className="dash-logo" />
              <span className="dash-brand-name">
                <span className="dash-brand-dark">DealFlow</span>
                <span className="dash-brand-purple">360</span>
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="dash-nav-tabs" role="tablist">
              <button
                className="nav-tab-item active"
                onClick={() => onNavigate && onNavigate('dashboard')}
              >
                <Home size={15} className="tab-icon" />
                <span>Dashboard</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => onNavigate && onNavigate('quotations')}
              >
                <span>Quotations</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => onNavigate && onNavigate('approvals')}
              >
                <span>Approvals</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Fulfillment')}
              >
                <span>Fulfillment</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Subscriptions')}
              >
                <span>Subscriptions</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Invoices')}
              >
                <span>Invoices</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Deal Health flagged 3 at-risk deals')}
              >
                <span>Deal Health</span>
                <span className="tab-badge-count">3</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Reports')}
              >
                <span>Reports</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => showToast('Opening Products Catalog')}
              >
                <span>Product</span>
              </button>
            </nav>
          </div>

          {/* Header Right Actions */}
          <div className="dash-header-right">
            <button 
              className="btn-dash-link"
              onClick={() => setActiveModal('support')}
            >
              Support
            </button>
            <button 
              className="btn-dash-contact"
              onClick={() => setActiveModal('contact')}
            >
              Contact Sales
            </button>
            <button 
              className="btn-icon-circle"
              title="Global Regional Settings"
              onClick={() => showToast('Region: US East (N. Virginia)')}
            >
              <Globe size={16} />
            </button>

            {/* User Avatar & Dropdown */}
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
                      if (onNavigate) onNavigate('quotations');
                    }}
                  >
                    <FileText size={14} />
                    <span>View Quotations</span>
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

      {/* Main Content Dashboard */}
      <main className="dash-main">
        {/* Title and Sync Status Row */}
        <div className="dash-title-row">
          <div>
            <h1 className="dash-title">Sales Dashboard / Home</h1>
            <p className="dash-subtitle">Central hub, links out to every module below</p>
          </div>

          <div className="sync-status-pill">
            <span className="pulse-dot"></span>
            <span>Real-time pipeline sync</span>
          </div>
        </div>

        {/* 3 KPI Cards Grid */}
        <div className="kpi-grid">
          {/* Card 1: Pending Approvals */}
          <div className="kpi-card pending-approvals">
            <div className="kpi-card-body">
              <div className="kpi-header">
                <span className="kpi-category-tag">PENDING APPROVALS</span>
                <div className="kpi-icon-badge amber">
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value-text">4 quotations waiting</div>
              <div>
                <span className="kpi-sub-tag amber">Avg. response time: 3.2 hrs</span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>2 require Finance approval</span>
              <button 
                className="kpi-action-link"
                onClick={() => setActiveModal('approvals')}
              >
                <span>Review</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 2: Open Quotations */}
          <div className="kpi-card open-quotations">
            <div className="kpi-card-body">
              <div className="kpi-header">
                <span className="kpi-category-tag">OPEN QUOTATIONS</span>
                <div className="kpi-icon-badge purple">
                  <FileText size={18} />
                </div>
              </div>
              <div className="kpi-value-text">12 active deals</div>
              <div>
                <span className="kpi-sub-tag green">Pipeline Value: $482,500</span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>3 nearing closing date</span>
              <button 
                className="kpi-action-link"
                onClick={() => onNavigate && onNavigate('quotations')}
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: At-Risk Deals */}
          <div className="kpi-card at-risk-deals">
            <div className="kpi-card-body">
              <div className="kpi-header">
                <span className="kpi-category-tag">AT-RISK DEALS</span>
                <div className="kpi-icon-badge red">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value-text">3 flagged by Deal Health</div>
              <div>
                <span className="kpi-sub-tag red">Stalled &gt; 14 days</span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>Needs immediate check-in</span>
              <button 
                className="kpi-action-link"
                onClick={() => setActiveModal('atRisk')}
              >
                <span>Investigate</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="dash-actions-row">
          <button 
            className="btn-dash-primary"
            onClick={() => onNavigate ? onNavigate('quotations') : setActiveModal('newQuote')}
          >
            <Plus size={16} />
            <span>+ New Quotation</span>
          </button>

          <button 
            className="btn-dash-secondary"
            onClick={() => onNavigate ? onNavigate('approvals') : setActiveModal('approvals')}
          >
            <CheckSquare size={16} />
            <span>View Approvals</span>
          </button>
        </div>

        {/* Recent Activity Card */}
        <div className="activity-card">
          <div className="activity-card-header">
            <div className="activity-title-left">
              <Zap size={18} color="#714b67" />
              <span>Recent Activity</span>
            </div>
            <span className="activity-updated-time">Updated 3 mins ago</span>
          </div>

          <div className="activity-list">
            {/* Activity 1 */}
            <div className="activity-item">
              <div className="activity-item-left">
                <div className="activity-badge-icon green">
                  <Check size={18} />
                </div>
                <div className="activity-text-content">
                  <div className="activity-headline">
                    <strong>Acme Corp</strong> quotation approved by Finance
                  </div>
                  <div className="activity-subtext">
                    Quote #Q-9402 for $124,000 ready to send to client
                  </div>
                </div>
              </div>
              <div className="activity-item-right">
                <span className="activity-time">22 mins ago</span>
                <span className="status-tag approved">Approved</span>
              </div>
            </div>

            {/* Activity 2 */}
            <div className="activity-item">
              <div className="activity-item-left">
                <div className="activity-badge-icon purple">
                  <Edit3 size={18} />
                </div>
                <div className="activity-text-content">
                  <div className="activity-headline">
                    <strong>Beta Industries</strong> requested a discount change
                  </div>
                  <div className="activity-subtext">
                    Requested special 15% tier volume pricing on Order #8841
                  </div>
                </div>
              </div>
              <div className="activity-item-right">
                <span className="activity-time">1 hour ago</span>
                <span className="status-tag pending">Pending Review</span>
              </div>
            </div>

            {/* Activity 3 */}
            <div className="activity-item">
              <div className="activity-item-left">
                <div className="activity-badge-icon blue">
                  <Package size={18} />
                </div>
                <div className="activity-text-content">
                  <div className="activity-headline">
                    <strong>East Depot</strong> stock updated for Order #2291
                  </div>
                  <div className="activity-subtext">
                    Fulfillment allocated 500 units from warehouse sector B
                  </div>
                </div>
              </div>
              <div className="activity-item-right">
                <span className="activity-time">3 hours ago</span>
                <span className="status-tag sync">Inventory Sync</span>
              </div>
            </div>
          </div>

          <div className="activity-card-footer">
            <button 
              className="view-all-pipeline-btn"
              onClick={() => onNavigate && onNavigate('quotations')}
            >
              View all pipeline transactions →
            </button>
          </div>
        </div>
      </main>

      {/* Interactive Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {activeModal === 'newQuote' && 'Create New Quotation'}
                {activeModal === 'approvals' && 'Pending Finance Approvals'}
                {activeModal === 'atRisk' && 'Deal Health Risk Investigation'}
                {activeModal === 'contact' && 'Contact Enterprise Sales'}
                {activeModal === 'support' && 'DealFlow360 Support'}
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            {activeModal === 'approvals' && (
              <div>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  The following quotations require managerial or finance sign-off:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '13.5px' }}>
                      <span>Beta Industries (Quote #Q-8841)</span>
                      <span style={{ color: '#d97706' }}>$88,500</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                      Reason: 15% discount exceeds standard 10% threshold.
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-dash-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    showToast('Approved pending quotation.');
                    setActiveModal(null);
                  }}
                >
                  Approve Quotation
                </button>
              </div>
            )}

            {activeModal === 'atRisk' && (
              <div>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  AI deal health alerts flagged deals with no buyer interaction for over 14 days:
                </p>
                <div style={{ background: '#fff1f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '13.5px' }}>NorthStar Holdings ($180,000)</div>
                  <div style={{ fontSize: '12.5px', color: '#881337', marginTop: '4px' }}>
                    Stalled for 16 days at Proposal Review stage.
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-dash-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    showToast('Follow-up task scheduled.');
                    setActiveModal(null);
                  }}
                >
                  Schedule Follow-up Task
                </button>
              </div>
            )}

            {activeModal === 'contact' && (
              <div>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  Enterprise priority advisory desk: sales@dealflow360.io or +1 (800) 555-DEAL.
                </p>
                <button 
                  type="button" 
                  className="btn-dash-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    showToast('Demo request registered.');
                    setActiveModal(null);
                  }}
                >
                  Request Demo
                </button>
              </div>
            )}

            {activeModal === 'support' && (
              <div>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  24/7 dedicated support desk: help@dealflow360.io
                </p>
                <button 
                  type="button" 
                  className="btn-dash-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
              </div>
            )}
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
