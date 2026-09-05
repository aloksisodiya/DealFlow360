import React, { useState } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Check, 
  X, 
  Clock, 
  ArrowRight, 
  Globe, 
  HelpCircle,
  FileText,
  User,
  Filter,
  DollarSign,
  Building2,
  Calendar,
  Send,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import './Quotations.css';

export default function Quotations({ user, onNavigate, onLogout }) {
  const [viewMode, setViewMode] = useState('board'); // 'board' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial Quotations Data matching mockup exactly
  const [quotes, setQuotes] = useState([
    {
      id: 'Q-9402',
      client: 'Acme Corp',
      amount: 12400,
      stage: 'draft',
      desc: 'Enterprise Plan + 20 Add-on Seats with priority SLAs.',
      created: 'Created 2d ago',
      owner: 'Alex M.',
      ownerInitials: 'AM',
      ownerClass: 'am',
      badge: null,
      alert: null
    },
    {
      id: 'Q-9415',
      client: 'Delta LLC',
      amount: 3200,
      stage: 'draft',
      desc: 'Quarterly Tier-1 Growth Package with API Connectors.',
      created: 'Yesterday',
      owner: 'Kevin C.',
      ownerInitials: 'KC',
      ownerClass: 'kc',
      badge: null,
      alert: null
    },
    {
      id: 'Q-9388',
      client: 'Beta Industries',
      amount: 28900,
      stage: 'pending',
      desc: 'Annual enterprise multi-seat expansion agreement.',
      created: 'Submitted 4h ago',
      owner: 'Dana L.',
      ownerInitials: 'DL',
      ownerClass: 'dl',
      badge: 'Needs VP Signoff',
      alert: 'Includes 15% custom discounting for annual prepayment.'
    },
    {
      id: 'Q-9372',
      client: 'Nova Retail',
      amount: 9750,
      stage: 'approved',
      desc: 'Direct POS sync & catalog expansion module.',
      created: 'Ready to Send',
      owner: 'Ray H.',
      ownerInitials: 'RH',
      ownerClass: 'rh',
      badge: null,
      alert: 'Approved by Sarah J.'
    },
    {
      id: 'Q-9350',
      client: 'Zenith Co',
      amount: 15300,
      stage: 'negotiation',
      desc: 'Redlining Section 8 (Indemnity & retention).',
      created: 'Closing Target: End of Week',
      owner: 'Alex M.',
      ownerInitials: 'AM',
      ownerClass: 'am',
      badge: null,
      alert: 'Client viewed 2h ago'
    },
    {
      id: 'Q-9310',
      client: 'Apex Global Logistics',
      amount: 41000,
      stage: 'confirmed',
      desc: 'Full suite deployment with dedicated VPC connector.',
      created: 'Signed today',
      owner: 'Sarah J.',
      ownerInitials: 'SJ',
      ownerClass: 'rh',
      badge: null,
      alert: 'Contract executed & locked'
    }
  ]);

  // Form State for New Quotation
  const [newClient, setNewClient] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStage, setNewStage] = useState('draft');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCreateNewQuote = (e) => {
    e.preventDefault();
    if (!newClient || !newAmount) {
      showToast('Please fill in client name and estimated amount.');
      return;
    }

    const nextNumber = 9420 + quotes.length;
    const newQuoteItem = {
      id: `Q-${nextNumber}`,
      client: newClient,
      amount: parseFloat(newAmount) || 10000,
      stage: newStage,
      desc: newDesc || 'Standard Enterprise Solution License.',
      created: 'Just now',
      owner: user?.name || 'Alex M.',
      ownerInitials: user?.initials || 'AM',
      ownerClass: 'am',
      badge: null,
      alert: null
    };

    setQuotes([newQuoteItem, ...quotes]);
    setIsNewQuoteOpen(false);
    setNewClient('');
    setNewAmount('');
    setNewDesc('');
    showToast(`Quotation ${newQuoteItem.id} created for ${newClient}!`);
  };

  // Filter quotes based on search query
  const filteredQuotes = quotes.filter(q => 
    q.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const draftQuotes = filteredQuotes.filter(q => q.stage === 'draft');
  const pendingQuotes = filteredQuotes.filter(q => q.stage === 'pending');
  const approvedQuotes = filteredQuotes.filter(q => q.stage === 'approved');
  const negotiationQuotes = filteredQuotes.filter(q => q.stage === 'negotiation');

  return (
    <div className="quotations-container">
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
                className="nav-tab-item active"
                onClick={() => onNavigate('quotations')}
              >
                <span>Quotations</span>
              </button>

              <button
                className="nav-tab-item"
                onClick={() => onNavigate('approvals')}
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
            </nav>
          </div>

          {/* Header Right Actions */}
          <div className="dash-header-right">
            <button 
              className="btn-dash-link"
              onClick={() => showToast('Connecting to DealFlow360 support desk')}
            >
              Support
            </button>
            <button 
              className="btn-dash-contact"
              onClick={() => showToast('Opening enterprise sales contact')}
            >
              Contact Sales
            </button>
            <button 
              className="btn-icon-circle"
              title="Help & Info"
              onClick={() => showToast('DealFlow360 Quotations Engine v2.4.0')}
            >
              <HelpCircle size={16} />
            </button>

            {/* User Avatar with Full Name */}
            <div className="user-avatar-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="user-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                title="Account Menu"
              >
                {user?.initials || 'AM'}
              </button>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                {user?.name || 'Alex Morgan'}
              </span>

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
                    <LayoutGrid size={14} />
                    <span>Go to Dashboard</span>
                  </button>
                  <button 
                    className="dropdown-item logout" 
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Quotations Area */}
      <main className="quote-main">
        
        {/* Page Subheader & Controls Row */}
        <div className="quote-header-row">
          <div className="quote-title-group">
            <div className="quote-title-wrapper">
              <h1 className="quote-title">
                Quotations {viewMode === 'board' ? '(List)' : '(Table)'}
              </h1>
              <span className="pipeline-live-badge">
                <span className="pulse-dot"></span>
                <span>Pipeline Live</span>
              </span>
            </div>
            <p className="quote-subtitle">
              Every quotation in the system, one row per quotation, click a row to open it
            </p>
          </div>

          {/* Search, View Switcher & New Quote Button */}
          <div className="quote-controls-group">
            <div className="quote-search-wrapper">
              <Search size={15} className="quote-search-icon" />
              <input
                type="text"
                className="quote-search-input"
                placeholder="Search quotations or clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="view-switcher-group">
              <button
                className={`btn-view-toggle ${viewMode === 'board' ? 'active' : ''}`}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid size={14} />
                <span>Board</span>
              </button>
              <button
                className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List size={14} />
                <span>Switch to Table View</span>
              </button>
            </div>

            <button
              className="btn-new-quote"
              onClick={() => setIsNewQuoteOpen(true)}
            >
              <Plus size={16} />
              <span>+ New Quotation</span>
            </button>
          </div>
        </div>

        {/* 5 KPI Metric Summary Pill Cards */}
        <div className="quote-metrics-bar">
          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">Draft Total</span>
              <span className="metric-pill-value gray">$15,600</span>
            </div>
            <span className="metric-dot gray"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">Pending Value</span>
              <span className="metric-pill-value amber">$28,900</span>
            </div>
            <span className="metric-dot amber"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">Approved Value</span>
              <span className="metric-pill-value blue">$9,750</span>
            </div>
            <span className="metric-dot blue"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">In Negotiation</span>
              <span className="metric-pill-value purple">$15,300</span>
            </div>
            <span className="metric-dot purple"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">Confirmed Value</span>
              <span className="metric-pill-value green">$41,000</span>
            </div>
            <span className="metric-dot green"></span>
          </div>
        </div>

        {/* KANBAN BOARD VIEW */}
        {viewMode === 'board' && (
          <div className="kanban-board-grid">
            
            {/* Column 1: Draft */}
            <div className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-col-title">
                  <span className="col-status-dot draft"></span>
                  <span>Draft</span>
                  <span className="col-badge-count">{draftQuotes.length}</span>
                </div>
                <button 
                  className="btn-col-add" 
                  title="Add Draft"
                  onClick={() => { setNewStage('draft'); setIsNewQuoteOpen(true); }}
                >
                  +
                </button>
              </div>

              <div className="kanban-cards-list">
                {draftQuotes.map(quote => (
                  <div 
                    key={quote.id} 
                    className="kanban-deal-card"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <div className="card-top-row">
                      <span className="card-quote-code">{quote.id}</span>
                      <span className="card-amount">${quote.amount.toLocaleString()}</span>
                    </div>

                    <div className="card-company-name">{quote.client}</div>
                    <div className="card-desc">{quote.desc}</div>

                    <div className="card-bottom-row">
                      <span>● {quote.created}</span>
                      <div className="card-owner-badge">
                        <span className={`owner-avatar-mini ${quote.ownerClass}`}>{quote.ownerInitials}</span>
                        <span className="owner-name">{quote.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn-add-draft-column"
                onClick={() => { setNewStage('draft'); setIsNewQuoteOpen(true); }}
              >
                <Plus size={14} />
                <span>Add Draft</span>
              </button>
            </div>

            {/* Column 2: Pending Approval */}
            <div className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-col-title">
                  <span className="col-status-dot pending"></span>
                  <span>Pending Approval</span>
                  <span className="col-badge-count">{pendingQuotes.length}</span>
                </div>
                <button 
                  className="btn-col-add"
                  title="Add Pending Quote"
                  onClick={() => { setNewStage('pending'); setIsNewQuoteOpen(true); }}
                >
                  +
                </button>
              </div>

              <div className="kanban-cards-list">
                {pendingQuotes.map(quote => (
                  <div 
                    key={quote.id} 
                    className="kanban-deal-card pending-stripe"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <div className="card-top-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="card-quote-code">{quote.id}</span>
                        {quote.badge && <span className="card-tag-vp">{quote.badge}</span>}
                      </div>
                      <span className="card-amount">${quote.amount.toLocaleString()}</span>
                    </div>

                    <div className="card-company-name">{quote.client}</div>

                    {quote.alert && (
                      <div className="card-alert-box amber">
                        ⚠️ {quote.alert}
                      </div>
                    )}

                    <div className="card-bottom-row">
                      <span>● {quote.created}</span>
                      <div className="card-owner-badge">
                        <span className={`owner-avatar-mini ${quote.ownerClass}`}>{quote.ownerInitials}</span>
                        <span className="owner-name">{quote.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="column-drop-zone">
                Drag pending quotes here
              </div>
            </div>

            {/* Column 3: Approved */}
            <div className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-col-title">
                  <span className="col-status-dot approved"></span>
                  <span>Approved</span>
                  <span className="col-badge-count">{approvedQuotes.length}</span>
                </div>
                <button 
                  className="btn-col-add"
                  title="Add Approved Quote"
                  onClick={() => { setNewStage('approved'); setIsNewQuoteOpen(true); }}
                >
                  +
                </button>
              </div>

              <div className="kanban-cards-list">
                {approvedQuotes.map(quote => (
                  <div 
                    key={quote.id} 
                    className="kanban-deal-card approved-stripe"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <div className="card-top-row">
                      <span className="card-quote-code">{quote.id}</span>
                      <span className="card-amount">${quote.amount.toLocaleString()}</span>
                    </div>

                    <div className="card-company-name">{quote.client}</div>
                    <div className="card-desc">{quote.desc}</div>

                    {quote.alert && (
                      <div className="card-alert-box green">
                        ✓ {quote.alert}
                      </div>
                    )}

                    <div className="card-bottom-row">
                      <span>{quote.created}</span>
                      <div className="card-owner-badge">
                        <span className={`owner-avatar-mini ${quote.ownerClass}`}>{quote.ownerInitials}</span>
                        <span className="owner-name">{quote.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="column-drop-zone">
                Awaiting client transmission
              </div>
            </div>

            {/* Column 4: Negotiation */}
            <div className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-col-title">
                  <span className="col-status-dot negotiation"></span>
                  <span>Negotiation</span>
                  <span className="col-badge-count">{negotiationQuotes.length}</span>
                </div>
                <button 
                  className="btn-col-add"
                  title="Add Negotiation Quote"
                  onClick={() => { setNewStage('negotiation'); setIsNewQuoteOpen(true); }}
                >
                  +
                </button>
              </div>

              <div className="kanban-cards-list">
                {negotiationQuotes.map(quote => (
                  <div 
                    key={quote.id} 
                    className="kanban-deal-card negotiation-stripe"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <div className="card-top-row">
                      <span className="card-quote-code">{quote.id}</span>
                      <span className="card-amount">${quote.amount.toLocaleString()}</span>
                    </div>

                    <div className="card-company-name">{quote.client}</div>
                    <div className="card-desc">{quote.desc}</div>

                    {quote.alert && (
                      <div className="card-alert-box purple">
                        👁️ {quote.alert}
                      </div>
                    )}

                    <div className="card-bottom-row">
                      <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 500 }}>
                        {quote.created}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="column-drop-zone">
                Active negotiation thread
              </div>
            </div>

          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <div className="quote-table-card">
            <table className="quote-table">
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Client Name</th>
                  <th>Description</th>
                  <th>Stage</th>
                  <th>Amount</th>
                  <th>Owner</th>
                  <th>Timeline</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map(quote => (
                  <tr key={quote.id} onClick={() => setSelectedQuote(quote)}>
                    <td style={{ fontWeight: 700, color: '#714b67' }}>{quote.id}</td>
                    <td style={{ fontWeight: 700 }}>{quote.client}</td>
                    <td style={{ maxWidth: '300px', fontSize: '12.5px', color: '#64748b' }}>{quote.desc}</td>
                    <td>
                      <span className={`status-tag ${quote.stage === 'approved' ? 'approved' : quote.stage === 'pending' ? 'pending' : 'sync'}`}>
                        {quote.stage.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>${quote.amount.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`owner-avatar-mini ${quote.ownerClass}`}>{quote.ownerInitials}</span>
                        <span>{quote.owner}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#64748b' }}>{quote.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pipeline Summary Bar */}
        <div className="quote-bottom-summary-bar">
          <div className="bottom-actions-left">
            <button 
              className="btn-new-quote"
              onClick={() => setIsNewQuoteOpen(true)}
            >
              <Plus size={16} />
              <span>+ New Quotation</span>
            </button>

            <button 
              className="btn-dash-secondary"
              onClick={() => setViewMode(viewMode === 'board' ? 'table' : 'board')}
            >
              {viewMode === 'board' ? <List size={15} /> : <LayoutGrid size={15} />}
              <span>{viewMode === 'board' ? 'Switch to Table View' : 'Switch to Board View'}</span>
            </button>
          </div>

          <div className="bottom-pipeline-stat">
            Showing <strong>{filteredQuotes.length} total quotations</strong> across <strong>5 stages</strong>  •  Total Pipeline: <strong>$107,350</strong>
          </div>
        </div>

      </main>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <div className="modal-overlay" onClick={() => setSelectedQuote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#714b67' }}>{selectedQuote.id}</span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>{selectedQuote.client}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedQuote(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Total Quoted Value</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>${selectedQuote.amount.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                <strong>Scope:</strong> {selectedQuote.desc}
              </div>
            </div>

            {selectedQuote.alert && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#faf5f8', border: '1px solid #e9d5e3', color: '#54324c', fontSize: '12.5px', marginBottom: '16px', fontWeight: 500 }}>
                ℹ️ {selectedQuote.alert}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button 
                type="button" 
                className="btn-dash-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  showToast(`Quotation ${selectedQuote.id} transmitted to client email.`);
                  setSelectedQuote(null);
                }}
              >
                <Send size={15} />
                <span>Send to Client</span>
              </button>
              <button 
                type="button" 
                className="btn-dash-secondary"
                onClick={() => setSelectedQuote(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Quotation Modal */}
      {isNewQuoteOpen && (
        <div className="modal-overlay" onClick={() => setIsNewQuoteOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                Create New Quotation
              </h3>
              <button className="modal-close-btn" onClick={() => setIsNewQuoteOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewQuote}>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contract Value ($ USD)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 15,000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scope / Package Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Annual Enterprise SaaS + 20 Seats"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Stage</label>
                <select
                  className="form-input"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="negotiation">Negotiation</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-new-quote"
                style={{ width: '100%', justifyContent: 'center', height: '46px', marginTop: '10px' }}
              >
                <span>Save & Add to Pipeline</span>
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
            <span style={{ fontWeight: 700, color: '#0f172a' }}>DealFlow360</span>
            <span>© 2025 DealFlow360 Technologies, Inc. All rights reserved.</span>
          </div>

          <div className="footer-links">
            <button className="footer-link" onClick={() => showToast('Terms of Service')}>
              Terms of Service
            </button>
            <button className="footer-link" onClick={() => showToast('Privacy Policy')}>
              Privacy Policy
            </button>
            <button className="footer-link" onClick={() => showToast('Security')}>
              Security
            </button>
            <div className="status-badge">
              <span className="pulse-dot"></span>
              <span>Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
