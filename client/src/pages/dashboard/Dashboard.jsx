import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  AlertTriangle, 
  Plus, 
  CheckSquare, 
  Check, 
  ArrowRight, 
  X,
  MessageSquare
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { fetchDashboardMetrics } from '../../services/dashboardService';
import { createQuotation } from '../../services/quotationService';
import './Dashboard.css';

/**
 * DealFlow360 - Executive Dashboard
 * 
 * Pipeline summary, approval alerts, open quotation metrics, and recent activity logs
 * backed by live PostgreSQL database queries.
 */
export default function Dashboard({ user, onNavigate, onLogout }) {
  const [activeModal, setActiveModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch {
      showToast('Failed to load dashboard metrics from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!newQuoteClient || !newQuoteAmount) {
      showToast('Please enter client name and quotation value.');
      return;
    }

    try {
      await createQuotation({
        customerName: newQuoteClient,
        totalAmount: Number(newQuoteAmount),
        customerTier: 'Bronze',
        discountPercent: 0,
      });
      showToast(`Quotation for ${newQuoteClient} ($${Number(newQuoteAmount).toLocaleString()}) saved to database!`);
      setActiveModal(null);
      setNewQuoteClient('');
      setNewQuoteAmount('');
      setNewQuoteNotes('');
      await loadMetrics();
    } catch (err) {
      showToast(err.message || 'Failed to create quotation');
    }
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

      {/* Unified Navigation Header */}
      <Navbar 
        activePage="dashboard" 
        user={user} 
        onNavigate={onNavigate} 
        onLogout={onLogout}
        onToast={showToast}
      />

      {/* Main Content Dashboard */}
      <main className="dash-main">
        {/* Title and Sync Status Row */}
        <div className="dash-title-row">
          <div>
            <h1 className="dash-title">Sales Dashboard / Home</h1>
            <p className="dash-subtitle">Central deal flow hub, links out to every module below</p>
          </div>

          <div className="sync-status-pill">
            <span className="pulse-dot"></span>
            <span>Real-time pipeline sync</span>
          </div>
        </div>

        {/* 4 KPI Cards Grid */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {/* Card 1: Pending Approvals */}
          <div className="kpi-card pending-approvals">
            <div className="kpi-card-body">
              <div className="kpi-header">
                <span className="kpi-category-tag">PENDING APPROVALS</span>
                <div className="kpi-icon-badge amber">
                  <Clock size={18} />
                </div>
              </div>
              <div className="kpi-value-text">{metrics?.pendingApprovals?.totalWaiting ?? 0} quotations waiting</div>
              <div>
                <span className="kpi-sub-tag amber">Live DB sync</span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>{metrics?.pendingApprovals?.requireFinanceApprovalCount ?? 0} require Finance review</span>
              <button 
                className="kpi-action-link"
                onClick={() => onNavigate ? onNavigate('approvals') : setActiveModal('approvals')}
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
              <div className="kpi-value-text">{metrics?.openQuotations?.activeDealsCount ?? 0} active deals</div>
              <div>
                <span className="kpi-sub-tag green">Pipeline Value: ${Number(metrics?.openQuotations?.totalPipelineValue ?? 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>Live database sync</span>
              <button 
                className="kpi-action-link"
                onClick={() => onNavigate && onNavigate('quotations')}
              >
                <span>View all</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 3: Customer Portal Negotiations & Approvals */}
          <div className="kpi-card" style={{ borderColor: '#e2e8f0' }}>
            <div className="kpi-card-body">
              <div className="kpi-header">
                <span className="kpi-category-tag" style={{ color: '#714b67' }}>CUSTOMER PORTAL ACTIVITY</span>
                <div className="kpi-icon-badge" style={{ backgroundColor: '#fdf4ff', color: '#a21caf' }}>
                  <MessageSquare size={18} />
                </div>
              </div>
              <div className="kpi-value-text" style={{ fontSize: '18px' }}>
                {metrics?.customerApprovedCount ?? 0} Approved • {metrics?.customerNegotiatedCount ?? 0} Negotiating
              </div>
              <div>
                <span className="kpi-sub-tag" style={{ backgroundColor: '#fdf4ff', color: '#a21caf' }}>
                  Customer Counter Proposals & Confirmed Orders
                </span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>Real-time portal stream</span>
              <button 
                className="kpi-action-link"
                onClick={() => onNavigate && onNavigate('quotations')}
              >
                <span>Manage</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Card 4: At-Risk Deals */}
          <div className="kpi-card at-risk-deals">
            <div className="kpi-card-body">
              <div className="kpi-header">
                <span className="kpi-category-tag">AT-RISK DEALS</span>
                <div className="kpi-icon-badge red">
                  <AlertTriangle size={18} />
                </div>
              </div>
              <div className="kpi-value-text">{metrics?.atRiskDeals?.flaggedByDealHealth ?? 0} flagged anomalies</div>
              <div>
                <span className="kpi-sub-tag red">Active risk policies</span>
              </div>
            </div>
            <div className="kpi-card-footer">
              <span>Immediate action needed</span>
              <button 
                className="kpi-action-link"
                onClick={() => onNavigate ? onNavigate('dealhealth') : setActiveModal('atRisk')}
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
            <span>New Quotation</span>
          </button>

          <button 
            className="btn-dash-secondary"
            onClick={() => onNavigate ? onNavigate('approvals') : setActiveModal('approvals')}
          >
            <CheckSquare size={16} />
            <span>View Approvals</span>
          </button>
        </div>

        {/* Customer Portal Activity & Recent Timeline Card */}
        {metrics?.recentActivities && metrics.recentActivities.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            padding: '20px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Live Customer Negotiations & Portal Stream
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  Customer-approved quotations, counter discount proposals, and negotiation messages
                </p>
              </div>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#714b67',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => onNavigate && onNavigate('quotations')}
              >
                <span>View All Quotations</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {metrics.recentActivities.map((act, idx) => (
                <div key={act.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{act.title}</span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: act.badge_color === 'success' ? '#dcfce7' : act.badge_color === 'warning' ? '#fef3c7' : '#e0e7ff',
                        color: act.badge_color === 'success' ? '#15803d' : act.badge_color === 'warning' ? '#b45309' : '#3730a3'
                      }}>
                        {act.badge_type}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>{act.subtitle}</div>
                  </div>

                  <button 
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                    onClick={() => onNavigate && onNavigate('quotations')}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}


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
              </h3>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

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
