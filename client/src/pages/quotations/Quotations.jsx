import React, { useState, useEffect } from 'react';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Plus, 
  Check, 
  X, 
  ArrowRight, 
  Send,
  Mail,
  ExternalLink,
  Loader2,
  Copy,
  MessageSquare,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { 
  fetchQuotations, 
  createQuotation, 
  requestNegotiation, 
  sendPortalLink,
  fetchQuoteMessages,
  sendSalesRepReply,
  applyQuotationDiscount
} from '../../services/quotationService';
import './Quotations.css';

/**
 * DealFlow360 - Quotations Management & CPQ
 * 
 * Multi-stage quotation tracker with Kanban Board, Table View, and New Quote generation
 * synced in real-time with PostgreSQL database.
 */
export default function Quotations({ user, onNavigate, onLogout }) {
  const [viewMode, setViewMode] = useState('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Live Quotations Data from PostgreSQL database
  const [quotes, setQuotes] = useState([]);

  // Form State for New Quotation
  const [newClient, setNewClient] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTier, setNewTier] = useState('Bronze');
  const [newDiscount, setNewDiscount] = useState(0);
  const [newStage, setNewStage] = useState('draft');
  const [sendImmediateEmail, setSendImmediateEmail] = useState(true);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  // Portal send state for selected quote
  const [portalEmail, setPortalEmail] = useState('');
  const [sendingPortal, setSendingPortal] = useState(false);
  const [portalSent, setPortalSent] = useState(null); // { url, email }
  const [copiedLink, setCopiedLink] = useState(false);

  // Discount management & authority state for selected quote
  const [repDiscountPct, setRepDiscountPct] = useState(0);
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Negotiation messages state
  const [quoteMessages, setQuoteMessages] = useState([]);
  const [repReplyText, setRepReplyText] = useState('');
  const [sendingRepReply, setSendingRepReply] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCopyLink = (url) => {
    if (!url) return;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Portal link copied to clipboard!');
  };

  const handleApplyDiscount = async () => {
    if (!selectedQuote || applyingDiscount) return;
    setApplyingDiscount(true);
    try {
      const res = await applyQuotationDiscount(selectedQuote.id, repDiscountPct);
      showToast(res.message || `Discount of ${repDiscountPct}% submitted!`);
      setSelectedQuote(prev => ({
        ...prev,
        discountPercent: repDiscountPct,
        amount: res.newTotal || prev.amount,
        stage: res.requiresManagerApproval ? 'pending' : (prev.stage === 'draft' ? 'approved' : prev.stage),
        alert: res.requiresManagerApproval ? 'Status: Pending Manager Review' : 'Status: Auto-Approved',
      }));
      await loadQuotations();
      const msgs = await fetchQuoteMessages(selectedQuote.id);
      setQuoteMessages(msgs);
    } catch (err) {
      showToast(err.message || 'Failed to apply discount');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleSendPortal = async () => {
    if (!portalEmail || !selectedQuote || sendingPortal) return;
    setSendingPortal(true);
    try {
      const result = await sendPortalLink(selectedQuote.id, portalEmail.trim());
      const pUrl = result.portalUrl || `${window.location.origin}/portal/${result.token}`;
      setPortalSent({ url: pUrl, email: portalEmail.trim() });
      showToast(result.message || `Portal link sent to ${portalEmail}!`);
      await loadQuotations();
    } catch (err) {
      showToast(err.message || 'Failed to send portal link');
    } finally {
      setSendingPortal(false);
    }
  };

  const handleSendReply = async () => {
    if (!repReplyText.trim() || !selectedQuote || sendingRepReply) return;
    setSendingRepReply(true);
    try {
      await sendSalesRepReply(selectedQuote.id, repReplyText.trim());
      setRepReplyText('');
      const msgs = await fetchQuoteMessages(selectedQuote.id);
      setQuoteMessages(msgs);
      showToast('Reply sent to customer portal!');
    } catch (err) {
      showToast(err.message || 'Failed to send reply');
    } finally {
      setSendingRepReply(false);
    }
  };

  const loadQuotations = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await fetchQuotations();
      const mapped = data.map(q => {
        let stageName = 'draft';
        const st = (q.stage || '').toLowerCase();
        if (st.includes('pending')) stageName = 'pending';
        else if (st.includes('approved')) stageName = 'approved';
        else if (st.includes('negotiation')) stageName = 'negotiation';
        else if (st.includes('confirmed') || st.includes('closed')) stageName = 'confirmed';

        const cEmail = q.customer_email || q.portal_customer_email || '';
        const pUrl = q.portal_token ? `${window.location.origin}/portal/${q.portal_token}` : null;
        const discPct = Number(q.discount_percent || 0);
        const curAmount = Number(q.total_amount || 0);
        const maxLimit = Number(q.max_allowed_discount || (q.customer_tier === 'Gold' ? 15 : q.customer_tier === 'Silver' ? 10 : q.customer_tier === 'Enterprise' ? 25 : 5));
        const baseAmt = Number(q.base_amount || 0) || (discPct > 0 && discPct < 100 ? curAmount / (1 - discPct / 100) : curAmount);

        return {
          id: q.id,
          client: q.customer_name || 'Enterprise Client',
          customerEmail: cEmail,
          portalToken: q.portal_token || null,
          portalUrl: pUrl,
          amount: curAmount,
          baseAmount: baseAmt,
          stage: stageName,
          rawStage: q.stage,
          customerTier: q.customer_tier || 'Bronze',
          discountPercent: discPct,
          maxAllowedDiscount: maxLimit,
          desc: q.negotiation_request || `${q.customer_tier || 'Bronze'} Tier deal with ${discPct}% discount.`,
          created: 'Active in DB',
          owner: q.owner_email ? q.owner_email.split('@')[0] : (user?.name || 'Sales Rep'),
          ownerInitials: q.owner_email ? q.owner_email.slice(0, 2).toUpperCase() : 'SR',
          ownerClass: 'am',
          badge: q.approval_required ? 'Approval Required' : null,
          alert: q.approval_status ? `Status: ${q.approval_status}` : null
        };
      });
      setQuotes(mapped);
    } catch {
      if (showLoading) showToast('Failed to load quotations from database');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations(true);
    // Real-time live sync for quotation stages across browser tabs
    const interval = setInterval(() => {
      loadQuotations(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedQuote) {
      setPortalEmail(selectedQuote.customerEmail || '');
      setRepDiscountPct(selectedQuote.discountPercent || 0);
      if (selectedQuote.portalUrl) {
        setPortalSent({ url: selectedQuote.portalUrl, email: selectedQuote.customerEmail || 'Customer' });
      } else {
        setPortalSent(null);
      }
      fetchQuoteMessages(selectedQuote.id)
        .then(msgs => setQuoteMessages(msgs))
        .catch(() => setQuoteMessages([]));

      // Live 3s polling for customer messages when viewing this quotation
      const msgInterval = setInterval(() => {
        fetchQuoteMessages(selectedQuote.id)
          .then(msgs => setQuoteMessages(msgs))
          .catch(() => {});
      }, 3000);

      return () => clearInterval(msgInterval);
    } else {
      setQuoteMessages([]);
      setPortalSent(null);
      setPortalEmail('');
      setRepReplyText('');
      setRepDiscountPct(0);
    }
  }, [selectedQuote]);

  const handleCreateNewQuote = async (e) => {
    e.preventDefault();
    if (!newClient || !newAmount) {
      showToast('Please fill in client name and estimated amount.');
      return;
    }

    setIsCreatingQuote(true);
    try {
      const res = await createQuotation({
        customerName: newClient.trim(),
        customerEmail: newEmail.trim() || undefined,
        sendPortalEmail: sendImmediateEmail && !!newEmail.trim(),
        customerTier: newTier,
        totalAmount: parseFloat(newAmount) || 10000,
        discountPercent: Number(newDiscount) || 0,
        stage: newStage,
      });

      if (res.emailSent) {
        showToast(`Quotation created and portal link emailed to ${newEmail}!`);
      } else if (res.portalUrl) {
        showToast(`Quotation created with portal link generated!`);
      } else {
        showToast(`Quotation created for ${newClient} in PostgreSQL!`);
      }

      setIsNewQuoteOpen(false);
      setNewClient('');
      setNewEmail('');
      setNewAmount('');
      setNewDesc('');
      setNewDiscount(0);
      setNewStage('draft');
      await loadQuotations();
    } catch (err) {
      showToast(err.message || 'Failed to create quotation');
    } finally {
      setIsCreatingQuote(false);
    }
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

  const selectedBasePrice = selectedQuote
    ? Number(selectedQuote.baseAmount || (selectedQuote.discountPercent > 0 ? selectedQuote.amount / (1 - selectedQuote.discountPercent / 100) : selectedQuote.amount) || 0)
    : 0;
  const selectedDiscountDollar = Math.round(selectedBasePrice * (repDiscountPct / 100));
  const selectedNewTotal = Math.round(selectedBasePrice * (1 - repDiscountPct / 100));
  const selectedMaxAllowed = selectedQuote
    ? Number(selectedQuote.maxAllowedDiscount || (selectedQuote.customerTier === 'Gold' ? 15 : selectedQuote.customerTier === 'Silver' ? 10 : selectedQuote.customerTier === 'Enterprise' ? 25 : 5))
    : 5;
  const exceedsAuthority = repDiscountPct > selectedMaxAllowed;

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

      {/* Unified Navigation Header */}
      <Navbar 
        activePage="quotations" 
        user={user} 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        onToast={showToast}
      />

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
              <span>New Quotation</span>
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
              <span>New Quotation</span>
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
        <div className="modal-overlay" onClick={() => { setSelectedQuote(null); setPortalEmail(''); setPortalSent(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#714b67' }}>{selectedQuote.id}</span>
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>{selectedQuote.client}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => { setSelectedQuote(null); setPortalEmail(''); setPortalSent(null); }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Total Quoted Value</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>${selectedQuote.amount.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569' }}>
                <strong>Scope:</strong> {selectedQuote.desc}
              </div>
              {selectedQuote.customerTier && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Tier: <strong>{selectedQuote.customerTier}</strong> • Discount: <strong>{selectedQuote.discountPercent}%</strong>
                </div>
              )}
            </div>

            {selectedQuote.alert && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#faf5f8', border: '1px solid #e9d5e3', color: '#54324c', fontSize: '12.5px', marginBottom: '14px', fontWeight: 500 }}>
                ℹ️ {selectedQuote.alert}
              </div>
            )}

            {/* Discount Percent Counter & Approval Authority Section */}
            <div style={{
              background: '#ffffff',
              border: exceedsAuthority ? '1.5px solid #fed7aa' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '14px',
              boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <TrendingDown size={15} color="#714b67" />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Discount Counter & Authority</span>
                </div>
                <span style={{
                  fontSize: '11px',
                  background: exceedsAuthority ? '#fff7ed' : '#f0fdf4',
                  color: exceedsAuthority ? '#c2410c' : '#166534',
                  border: exceedsAuthority ? '1px solid #ffedd5' : '1px solid #bbf7d0',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  Max Self-Approval: {selectedMaxAllowed}% ({selectedQuote.customerTier || 'Bronze'})
                </span>
              </div>

              {/* Counter Row: Stepper Controls + Value + Quick Presets */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-dash-secondary"
                    onClick={() => setRepDiscountPct(prev => Math.max(0, prev - 1))}
                    style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}
                  >
                    -
                  </button>
                  <div style={{
                    minWidth: '64px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '16px',
                    color: exceedsAuthority ? '#ea580c' : '#714b67'
                  }}>
                    {repDiscountPct}%
                  </div>
                  <button
                    type="button"
                    className="btn-dash-secondary"
                    onClick={() => setRepDiscountPct(prev => Math.min(80, prev + 1))}
                    style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700 }}
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[0, 5, 10, 15, 20].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRepDiscountPct(p)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: repDiscountPct === p ? '1.5px solid #714b67' : '1px solid #e2e8f0',
                        background: repDiscountPct === p ? '#faf5f8' : '#ffffff',
                        color: repDiscountPct === p ? '#714b67' : '#64748b'
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <span style={{ color: '#64748b' }}>Base: </span>
                  <strong>${Math.round(selectedBasePrice).toLocaleString()}</strong>
                  <span style={{ margin: '0 6px', color: '#cbd5e1' }}>•</span>
                  <span style={{ color: '#c2410c' }}>Disc ({repDiscountPct}%): -${selectedDiscountDollar.toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>New Total: </span>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>${selectedNewTotal.toLocaleString()}</strong>
                </div>
              </div>

              {/* Authority Notice & Action Button */}
              {exceedsAuthority ? (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #ffedd5',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#c2410c', marginBottom: '4px' }}>
                    <AlertTriangle size={13} />
                    <span>Permission Required from Sales Manager</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#9a3412', lineHeight: 1.4 }}>
                    Your self-approval limit for {selectedQuote.customerTier || 'Bronze'} Tier is {selectedMaxAllowed}%.
                    A discount of <strong>{repDiscountPct}%</strong> will automatically flag this deal as <strong>Pending Manager Review</strong> and send it to the Sales Manager for approval.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  fontSize: '11.5px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={13} color="#16a34a" />
                  <span>Within your self-approval authority ({selectedMaxAllowed}% max limit). Will be auto-approved instantly.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleApplyDiscount}
                disabled={applyingDiscount}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: 'none',
                  background: exceedsAuthority
                    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                    : 'linear-gradient(135deg, #714b67 0%, #54324c 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: exceedsAuthority ? '0 2px 8px rgba(234, 88, 12, 0.25)' : '0 2px 8px rgba(113, 75, 103, 0.25)'
                }}
              >
                {applyingDiscount ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : exceedsAuthority ? (
                  <>
                    <ArrowUpRight size={14} />
                    <span>Request Sales Manager Approval for {repDiscountPct}%</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Apply & Confirm {repDiscountPct}% Discount (Auto-Approved)</span>
                  </>
                )}
              </button>
            </div>

            {/* Send Portal Link Section */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Mail size={15} color="#0284c7" />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0284c7' }}>Direct Customer Quotation Link</span>
                </div>
                {portalSent && (
                  <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    Active Portal Link
                  </span>
                )}
              </div>

              {portalSent ? (
                <div>
                  <div style={{ fontSize: '12.5px', color: '#059669', fontWeight: 600, marginBottom: '8px' }}>
                    ✓ Ready for customer: {portalSent.email || selectedQuote.customerEmail || 'Customer'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <input
                      type="text"
                      readOnly
                      value={portalSent.url}
                      className="form-input"
                      style={{ fontSize: '12px', color: '#0369a1', background: '#fff', height: '36px' }}
                    />
                    <button
                      type="button"
                      className="btn-dash-secondary"
                      onClick={() => handleCopyLink(portalSent.url)}
                      title="Copy link"
                      style={{ height: '36px', padding: '0 12px', gap: '4px' }}
                    >
                      {copiedLink ? <CheckCircle2 size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={portalSent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-new-quote"
                      style={{ height: '36px', padding: '0 12px', gap: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                    >
                      <ExternalLink size={13} />
                      <span>Open</span>
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Resend to another email..."
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      style={{ flex: 1, height: '34px', fontSize: '12px' }}
                    />
                    <button
                      type="button"
                      className="btn-dash-secondary"
                      onClick={handleSendPortal}
                      disabled={sendingPortal || !portalEmail}
                      style={{ height: '34px', padding: '0 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    >
                      {sendingPortal ? <Loader2 size={12} /> : <Send size={12} />}
                      <span>Resend Email</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 8px' }}>
                    Enter customer's Gmail or company email to mail them their personalized negotiation & one-click confirmation link:
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="customer@gmail.com"
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendPortal()}
                      style={{ flex: 1, height: '38px' }}
                    />
                    <button
                      type="button"
                      className="btn-new-quote"
                      onClick={handleSendPortal}
                      disabled={sendingPortal || !portalEmail}
                      style={{ height: '38px', padding: '0 14px', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      {sendingPortal ? <Loader2 size={13} /> : <Send size={13} />}
                      <span>{sendingPortal ? 'Sending…' : 'Send to Customer'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Negotiation & Questions Thread */}
            <div style={{ background: '#faf5f8', border: '1px solid #e9d5e3', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <MessageSquare size={14} color="#714b67" />
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#54324c' }}>Customer Negotiation & Chat</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>({quoteMessages.length} messages)</span>
              </div>

              <div style={{ maxHeight: '140px', overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                {quoteMessages.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
                    No customer messages yet. Questions and counter proposals from the customer portal will appear here.
                  </p>
                ) : (
                  quoteMessages.map((m) => (
                    <div key={m.id} style={{
                      marginBottom: '8px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: m.sender === 'Customer' ? '#f0fdf4' : '#faf5f8',
                      borderLeft: m.sender === 'Customer' ? '3px solid #22c55e' : '3px solid #714b67',
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 700, color: m.sender === 'Customer' ? '#166534' : '#54324c', fontSize: '11px', marginBottom: '2px' }}>
                        {m.sender === 'Customer' ? 'Customer' : 'Sales Representative (You)'}
                      </div>
                      <div style={{ color: '#334155' }}>{m.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Rep Replies */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                {[
                  "Thank you! I have updated the pricing as requested.",
                  "We have units in stock ready for immediate dispatch.",
                  "I've submitted this counter discount for expedited manager signoff.",
                  "Looking forward to partnering with you! Please proceed with confirmation."
                ].map((quickText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRepReplyText(quickText)}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: 500
                    }}
                  >
                    {quickText}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Reply to customer's inquiry or negotiation (Press Enter)..."
                  value={repReplyText}
                  onChange={(e) => setRepReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  style={{ flex: 1, height: '34px', fontSize: '12px' }}
                />
                <button
                  type="button"
                  className="btn-dash-secondary"
                  onClick={handleSendReply}
                  disabled={sendingRepReply || !repReplyText.trim()}
                  style={{ height: '34px', padding: '0 12px', fontSize: '12px', whiteSpace: 'nowrap', gap: '4px' }}
                >
                  {sendingRepReply ? <Loader2 size={12} /> : <Send size={12} />}
                  <span>Reply</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-dash-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setSelectedQuote(null); setPortalEmail(''); setPortalSent(null); }}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
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
                <label className="form-label">Client / Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp / Sarah Connor"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Email (for Direct Quotation Link)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. customer@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Contract Value ($ USD) *</label>
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
                  <label className="form-label">Discount % (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    className="form-input"
                    placeholder="e.g. 10"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Customer Tier</label>
                  <select
                    className="form-input"
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="Bronze">Bronze (Standard)</option>
                    <option value="Silver">Silver (5% tier max)</option>
                    <option value="Gold">Gold (15% tier max)</option>
                    <option value="Platinum">Platinum (25% tier max)</option>
                  </select>
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

              {/* Instant Email Checkbox */}
              {newEmail.trim() && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <input
                    type="checkbox"
                    id="sendPortalCheck"
                    checked={sendImmediateEmail}
                    onChange={(e) => setSendImmediateEmail(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="sendPortalCheck" style={{ fontSize: '13px', color: '#0369a1', cursor: 'pointer', fontWeight: 600 }}>
                    ✉️ Mail directly openable quotation link to {newEmail} immediately
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-new-quote"
                disabled={isCreatingQuote}
                style={{ width: '100%', justifyContent: 'center', height: '46px', marginTop: '6px' }}
              >
                {isCreatingQuote ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating & Dispatching...</span>
                  </>
                ) : (
                  <>
                    <span>Save & Add to Pipeline</span>
                    <ArrowRight size={16} />
                  </>
                )}
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
