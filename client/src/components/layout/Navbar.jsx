import React, { useState } from 'react';
import { 
  Home, 
  Globe, 
  HelpCircle, 
  LogOut, 
  Settings, 
  LayoutGrid, 
  FileText, 
  CheckSquare, 
  X,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Package,
  ShieldCheck
} from 'lucide-react';
import { hasAccess, getRoleDisplayName } from '../../utils/rbac';
import './Navbar.css';

/**
 * DealFlow360 - Unified Top Navigation Header
 * 
 * Provides unified routing tabs, active state highlighting, role preview, and user profile controls.
 */
export default function Navbar({ activePage, user, onNavigate, onLogout, onToast }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'contact' | 'support'

  const notify = (msg) => {
    if (onToast) onToast(msg);
  };

  return (
    <>
      <header className="app-nav-header">
        <div className="app-nav-inner">
          <div className="app-nav-left">
            {/* Logo and Brand Title */}
            <div 
              className="app-nav-brand" 
              onClick={() => onNavigate && onNavigate('dashboard')}
              title="Go to DealFlow360 Dashboard"
            >
              <img src="/logo.png" alt="DealFlow360 Logo" className="app-nav-logo" />
              <span className="app-nav-brand-name">
                <span className="app-nav-brand-dark">DealFlow</span>
                <span className="app-nav-brand-purple">360</span>
              </span>
            </div>

            {/* Standardized Navigation Tabs filtered by Role */}
            <nav className="app-nav-tabs" role="tablist">
              {hasAccess(user, 'dashboard') && (
                <button
                  className={`nav-tab-button ${activePage === 'dashboard' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('dashboard')}
                >
                  <Home size={15} className="tab-icon" />
                  <span>Dashboard</span>
                </button>
              )}

              {hasAccess(user, 'quotations') && (
                <button
                  className={`nav-tab-button ${activePage === 'quotations' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('quotations')}
                >
                  <span>Quotations</span>
                </button>
              )}

              {hasAccess(user, 'approvals') && (
                <button
                  className={`nav-tab-button ${activePage === 'approvals' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('approvals')}
                >
                  <span>Approvals</span>
                </button>
              )}

              {hasAccess(user, 'fulfillment') && (
                <button
                  className={`nav-tab-button ${activePage === 'fulfillment' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('fulfillment')}
                >
                  <span>Fulfillment</span>
                </button>
              )}

              {hasAccess(user, 'subscriptions') && (
                <button
                  className={`nav-tab-button ${activePage === 'subscriptions' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('subscriptions')}
                >
                  <span>Subscriptions</span>
                </button>
              )}

              {hasAccess(user, 'invoices') && (
                <button
                  className={`nav-tab-button ${activePage === 'invoices' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('invoices')}
                >
                  <span>Invoices</span>
                </button>
              )}

              {hasAccess(user, 'dealhealth') && (
                <button
                  className={`nav-tab-button ${activePage === 'dealhealth' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('dealhealth')}
                >
                  <span>Deal Health</span>
                  <span className="nav-tab-badge">3</span>
                </button>
              )}

              {hasAccess(user, 'reports') && (
                <button
                  className={`nav-tab-button ${activePage === 'reports' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('reports')}
                >
                  <span>Reports</span>
                </button>
              )}

              {hasAccess(user, 'product') && (
                <button
                  className={`nav-tab-button ${activePage === 'product' ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate('product')}
                >
                  <span>Products</span>
                </button>
              )}
            </nav>
          </div>

          {/* Header Right Actions */}
          <div className="app-nav-right">
            <button 
              className="btn-nav-link"
              onClick={() => setActiveModal('support')}
            >
              Support
            </button>
            <button 
              className="btn-nav-contact"
              onClick={() => setActiveModal('contact')}
            >
              Contact Sales
            </button>
            <button 
              className="btn-nav-icon-circle"
              title="Global Regional Settings"
              onClick={() => notify('Region: US East (N. Virginia)')}
            >
              <Globe size={16} />
            </button>

            {/* User Avatar with Name and Dropdown */}
            <div className="nav-avatar-wrapper">
              <button 
                className="nav-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Account Menu"
              >
                {user?.initials || 'AM'}
              </button>
              <span 
                className="nav-user-label" 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {user?.name || 'Alex Morgan'}
              </span>

              {userMenuOpen && (
                <div className="nav-dropdown-menu">
                  <div className="nav-dropdown-header">
                    <div className="nav-dropdown-name">{user?.name || 'Alex Morgan'}</div>
                    <div className="nav-dropdown-email">{user?.email || 'alex.morgan@firm-capital.com'}</div>
                    {user?.role && (
                      <div className="nav-dropdown-role-badge">
                        {getRoleDisplayName(user.role)}
                      </div>
                    )}
                  </div>

                  {hasAccess(user, 'dashboard') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('dashboard');
                      }}
                    >
                      <Home size={14} />
                      <span>Dashboard</span>
                    </button>
                  )}

                  {hasAccess(user, 'quotations') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('quotations');
                      }}
                    >
                      <FileText size={14} />
                      <span>Quotations</span>
                    </button>
                  )}

                  {hasAccess(user, 'approvals') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('approvals');
                      }}
                    >
                      <CheckSquare size={14} />
                      <span>Approvals</span>
                    </button>
                  )}

                  {hasAccess(user, 'fulfillment') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('fulfillment');
                      }}
                    >
                      <LayoutGrid size={14} />
                      <span>Fulfillment</span>
                    </button>
                  )}

                  {hasAccess(user, 'subscriptions') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('subscriptions');
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>Subscriptions</span>
                    </button>
                  )}

                  {hasAccess(user, 'invoices') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('invoices');
                      }}
                    >
                      <DollarSign size={14} />
                      <span>Invoices</span>
                    </button>
                  )}

                  {hasAccess(user, 'dealhealth') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('dealhealth');
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>Deal Health</span>
                    </button>
                  )}

                  {hasAccess(user, 'reports') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('reports');
                      }}
                    >
                      <BarChart3 size={14} />
                      <span>Reports</span>
                    </button>
                  )}

                  {hasAccess(user, 'product') && (
                    <button 
                      className="nav-dropdown-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('product');
                      }}
                    >
                      <Package size={14} />
                      <span>Products</span>
                    </button>
                  )}

                  {hasAccess(user, 'admin') && (
                    <button 
                      className="nav-dropdown-item admin-panel-item" 
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (onNavigate) onNavigate('admin');
                      }}
                    >
                      <ShieldCheck size={14} className="admin-dropdown-icon" />
                      <span style={{ flex: 1 }}>Admin Panel</span>
                      <span className="nav-admin-badge">ADMIN</span>
                    </button>
                  )}

                  <button 
                    className="nav-dropdown-item logout" 
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

      {/* Support & Contact Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                {activeModal === 'contact' ? 'Contact Enterprise Sales Desk' : 'DealFlow360 Priority Support'}
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            {activeModal === 'contact' ? (
              <div>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  Speak directly with our enterprise deal flow desk: sales@dealflow360.io or +1 (800) 555-DEAL.
                </p>
                <button 
                  type="button" 
                  className="btn-dash-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    notify('Sales demo requested. An advisor will contact you.');
                    setActiveModal(null);
                  }}
                >
                  Request Consultation
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                  24/7 dedicated support desk: help@dealflow360.io (SLA: &lt; 15 mins for Enterprise tier).
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
    </>
  );
}
