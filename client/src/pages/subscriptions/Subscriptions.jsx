import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Plus, 
  Search, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Calendar, 
  AlertTriangle,
  Play,
  Pause,
  Filter,
  RefreshCw,
  Clock,
  Package,
  Award,
  FileCheck,
  Printer,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Sliders,
  Check,
  Sparkles,
  Layers,
  HardDrive
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import { fetchSubscriptions, createSubscription, updateSubscriptionStatus } from '../../services/subscriptionService';
import { fetchQuotations } from '../../services/quotationService';
import { fetchProducts } from '../../services/productService';
import './Subscriptions.css';

/**
 * DealFlow360 - Product Warranty Extension Subscriptions
 * 
 * Focused on 3 specific warranty extension tiers:
 * 1. 3 Months Hardware Extended Warranty (₹2,999)
 * 2. 6 Months Extended Care Warranty (₹5,499)
 * 3. 12 Months Comprehensive Full Care Warranty (₹9,999)
 * 
 * Displays full details of all current enrolled subscribers per warranty plan.
 */
export const DEFAULT_WARRANTY_PLANS = [
  {
    id: 'plan-3m',
    tier: '3 Months',
    name: '3-Month Hardware Extended Warranty',
    shortName: '3 Months Plan',
    durationMonths: 3,
    durationLabel: '3 Months Protection',
    price: 1500,
    priceFormatted: '₹1,500',
    unitLabel: '/ product unit',
    badge: 'Quarterly Protection',
    badgeClass: 'badge-blue',
    description: 'Essential component and diagnostic coverage for fast-paced project rollouts and temporary hardware deployments.',
    features: [
      'Express 48-hour parts replacement SLA',
      'Phone & chat technical diagnostics support',
      'Free inbound & outbound return courier shipping',
      'Zero labor diagnostic and repair charges',
      'Genuine OEM spare component guarantee'
    ],
    recommendedFor: 'Short-term deployments, pilot rollouts, and accessories'
  },
  {
    id: 'plan-6m',
    tier: '6 Months',
    name: '6-Month Extended Care Warranty',
    shortName: '6 Months Plan',
    durationMonths: 6,
    durationLabel: '6 Months Protection',
    price: 3000,
    priceFormatted: '₹3,000',
    unitLabel: '/ product unit',
    badge: 'Half-Year Care',
    badgeClass: 'badge-purple',
    description: 'Extended component, motherboard, and optical transceiver protection with regional hub spare stocking.',
    features: [
      '24-hour priority dispatch from regional warehouse hubs',
      'Full motherboard, screen & optical component coverage',
      'Bi-monthly automated health check & telemetry diagnostics',
      'Free firmware flashing & recalibration services',
      'Dedicated technical account coordinator'
    ],
    recommendedFor: 'Mid-sized office servers, executive laptops, and core switches'
  },
  {
    id: 'plan-12m',
    tier: '12 Months',
    name: '12-Month Comprehensive Full Care Warranty',
    shortName: '12 Months Plan',
    durationMonths: 12,
    durationLabel: 'Full Year Care (Best Value)',
    price: 5000,
    priceFormatted: '₹5,000',
    unitLabel: '/ product unit',
    badge: '★ Best Value / Full Year',
    badgeClass: 'badge-amber',
    description: 'Bumper-to-bumper VIP warranty with same-day onsite engineer dispatch across 12 Indian metros and annual overhaul kit.',
    features: [
      'Same-day onsite technician replacement SLA (12 Metros)',
      '100% component uptime guarantee with advance hardware replacement',
      'Free annual preventive maintenance & thermal overhaul kit',
      'Direct Level-3 engineering hotline & dedicated TAM',
      'Accidental damage protection & power-surge coverage'
    ],
    recommendedFor: 'Mission-critical enterprise server racks, core infrastructure & high-value hardware'
  }
];

export function getDynamicWarrantyPlans(products = []) {
  return DEFAULT_WARRANTY_PLANS.map(plan => {
    const prod = (products || []).find(p => {
      const pSku = String(p.sku || '').toUpperCase();
      const pName = String(p.name || '').toLowerCase();
      if (plan.tier === '3 Months' && (pSku.includes('3M') || pName.includes('3-month') || pName.includes('3 month') || pName.includes('3m'))) return true;
      if (plan.tier === '6 Months' && (pSku.includes('6M') || pName.includes('6-month') || pName.includes('6 month') || pName.includes('6m'))) return true;
      if (plan.tier === '12 Months' && (pSku.includes('12M') || pName.includes('12-month') || pName.includes('12 month') || pName.includes('12m') || pName.includes('1 year'))) return true;
      return false;
    });

    if (prod && prod.price !== undefined && prod.price !== null) {
      const livePrice = Number(prod.price);
      return {
        ...plan,
        productId: prod.id,
        name: prod.name || plan.name,
        price: livePrice,
        priceFormatted: `₹${livePrice.toLocaleString('en-IN')}`,
        description: prod.description || plan.description
      };
    }
    return plan;
  });
}

export const WARRANTY_PLANS = DEFAULT_WARRANTY_PLANS;

export default function Subscriptions({ user, onNavigate, onLogout }) {
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // State
  const [subscriptions, setSubscriptions] = useState([]);
  const [customerQuotes, setCustomerQuotes] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const warrantyPlans = getDynamicWarrantyPlans(availableProducts);

  // Filters & Tabs
  const [activePlanTab, setActivePlanTab] = useState('all'); // 'all' | '3 Months' | '6 Months' | '12 Months'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Active' | 'Expiring Soon' | 'Paused'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [certificateSub, setCertificateSub] = useState(null);
  const [renewSub, setRenewSub] = useState(null);

  // Form State for Enrolling New Warranty Subscriber
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [selectedPlanTier, setSelectedPlanTier] = useState('12 Months');
  const [selectedProdId, setSelectedProdId] = useState('');
  const [newSerialNumbers, setNewSerialNumbers] = useState('');
  const [newUnitQty, setNewUnitQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomerUser = String(user?.role || '').toLowerCase().includes('customer');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subsData, quotesData, prodsData] = await Promise.all([
        fetchSubscriptions({ search: searchQuery || undefined }),
        fetchQuotations().catch(() => []),
        fetchProducts().catch(() => [])
      ]);

      const currentProds = prodsData || [];
      setAvailableProducts(currentProds);
      const livePlans = getDynamicWarrantyPlans(currentProds);

      const userEmail = String(user?.email || '').toLowerCase().trim();
      const userName = String(user?.name || '').toLowerCase().trim();
      const userHandle = userEmail ? userEmail.split('@')[0] : '';

      // Filter quotations
      const nonDraftQuotes = (quotesData || []).filter(q => {
        if (isCustomerUser) {
          const qEmail = String(q.customer_email || q.customerEmail || q.portal_customer_email || '').toLowerCase().trim();
          const qName = String(q.customer_name || q.client || q.customerName || '').toLowerCase().trim();

          const emailMatch = userEmail && (qEmail === userEmail || qEmail.includes(userEmail) || userEmail.includes(qEmail));
          const nameMatch = userName && qName && (qName.includes(userName) || userName.includes(qName));
          const handleMatch = userHandle && (qName.includes(userHandle) || qEmail.includes(userHandle));

          return emailMatch || nameMatch || handleMatch;
        }

        return true;
      });
      setCustomerQuotes(nonDraftQuotes);

      // Filter and format subscriptions
      const filteredSubs = (subsData || []).filter(s => {
        if (!isCustomerUser) return true;
        const sCustName = String(s.customer || s.customer_name || '').toLowerCase().trim();
        const sCustEmail = String(s.customerEmail || s.customer_email || '').toLowerCase().trim();

        if (userEmail && sCustEmail && (sCustEmail === userEmail || sCustEmail.includes(userEmail))) return true;
        if (userName && sCustName && (sCustName.includes(userName) || userName.includes(sCustName))) return true;
        if (userHandle && (sCustName.includes(userHandle) || sCustEmail.includes(userHandle))) return true;

        return false;
      });

      const formatted = filteredSubs.map(s => {
        let feat = {};
        if (typeof s.features === 'object' && s.features !== null && !Array.isArray(s.features)) {
          feat = s.features;
        } else if (typeof s.features === 'string') {
          try { feat = JSON.parse(s.features); } catch (e) { feat = {}; }
        }

        const tierName = s.tier || (String(s.plan || '').includes('12') ? '12 Months' : String(s.plan || '').includes('6') ? '6 Months' : '3 Months');
        const planObj = livePlans.find(p => p.tier === tierName) || livePlans[0];

        // Days remaining calculation
        let daysRemaining = 90;
        if (s.nextBillingDate) {
          const diffMs = new Date(s.nextBillingDate) - new Date();
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }

        const status = s.status === 'Active' && daysRemaining <= 20 ? 'Expiring Soon' : s.status;

        const productName = feat.productName || s.plan || 'Hardware Product';
        const productSku = feat.productSku || 'SKU-GEN-HDW';
        const warehouseHub = feat.warehouseHub || 'Mumbai Central Hub';
        const serialNumbers = Array.isArray(feat.serialNumbers) ? feat.serialNumbers : feat.serialNumbers ? [feat.serialNumbers] : [`SN-${s.code || s.id}`];

        return {
          id: s.code || s.id,
          realId: s.id,
          customer: s.customer,
          customerEmail: s.customerEmail,
          tier: tierName,
          planName: s.plan || planObj.name,
          planObj,
          amount: Number(s.amount),
          mrr: Number(s.mrr),
          billingCycle: s.billingCycle || tierName,
          status,
          rawStatus: s.status,
          startDate: s.startDate ? new Date(s.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
          expiryDate: s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 90 days',
          daysRemaining,
          seats: s.seats || 1,
          productName,
          productSku,
          warehouseHub,
          serialNumbers,
          coverageScope: feat.coverageScope || planObj.description,
          auditHistory: s.auditLogs || []
        };
      });

      setSubscriptions(formatted);
    } catch (err) {
      console.error('Failed to load warranty subscriptions:', err);
      showToast('Failed to load warranty subscriptions from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  // Calculations
  const subs3M = subscriptions.filter(s => s.tier === '3 Months');
  const subs6M = subscriptions.filter(s => s.tier === '6 Months');
  const subs12M = subscriptions.filter(s => s.tier === '12 Months');

  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const activeCount = subscriptions.filter(s => s.rawStatus === 'Active').length;
  const expiringCount = subscriptions.filter(s => s.status === 'Expiring Soon').length;
  const pausedCount = subscriptions.filter(s => s.rawStatus === 'Paused').length;

  // Filtered List for Table
  const displaySubscriptions = subscriptions.filter(sub => {
    if (activePlanTab !== 'all' && sub.tier !== activePlanTab) return false;
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    return true;
  });

  const handleToggleStatus = async (sub) => {
    const nextStatus = sub.rawStatus === 'Active' ? 'Paused' : 'Active';
    try {
      await updateSubscriptionStatus(sub.realId, nextStatus, user?.name || 'Sales Rep');
      showToast(`Warranty ${sub.id} status changed to ${nextStatus}!`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update warranty status');
    }
  };

  const handleEnrollSubscriber = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      showToast('Please enter subscriber/company name.');
      return;
    }

    const plan = warrantyPlans.find(p => p.tier === selectedPlanTier) || warrantyPlans[0];
    const prod = availableProducts.find(p => String(p.id) === String(selectedProdId));

    const prodName = prod ? prod.name : 'Enterprise Hardware';
    const prodSku = prod ? prod.sku : 'SKU-HDW-ENT';
    const qty = Number(newUnitQty) || 1;
    const totalAmount = plan.price * qty;

    const serials = newSerialNumbers
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const fallbackSerials = serials.length > 0 
      ? serials 
      : Array.from({ length: qty }, (_, i) => `SN-${prodSku.slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`);

    setIsSubmitting(true);
    try {
      const durationMs = plan.durationMonths * 30 * 24 * 60 * 60 * 1000;
      const expiryDateStr = new Date(Date.now() + durationMs).toISOString().split('T')[0];

      await createSubscription({
        customer: newCustomerName.trim(),
        customerEmail: newCustomerEmail.trim() || undefined,
        tier: plan.tier,
        plan: plan.name,
        billingCycle: plan.tier,
        amount: totalAmount,
        seats: qty,
        status: 'Active',
        nextBillingDate: expiryDateStr,
        features: {
          productName: prodName,
          productSku: prodSku,
          warrantyDuration: plan.tier,
          coverageScope: plan.description,
          warehouseHub: 'Mumbai Central Hub',
          serialNumbers: fallbackSerials
        }
      });

      showToast(`Enrolled ${newCustomerName} in ${plan.name}!`);
      setIsEnrollModalOpen(false);
      setNewCustomerName('');
      setNewCustomerEmail('');
      setSelectedProdId('');
      setNewSerialNumbers('');
      setNewUnitQty(1);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to enroll warranty subscriber');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewWarranty = async (sub) => {
    try {
      const plan = warrantyPlans.find(p => p.tier === sub.tier) || warrantyPlans[0];
      const durationMs = plan.durationMonths * 30 * 24 * 60 * 60 * 1000;
      const newExpiry = new Date(Date.now() + durationMs).toISOString().split('T')[0];

      await updateSubscriptionStatus(sub.realId, 'Active', user?.name || 'Sales Rep');
      showToast(`Warranty ${sub.id} renewed for another ${sub.tier}! New Expiry: ${newExpiry}`);
      setRenewSub(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to renew warranty');
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

      {/* Top Universal Navbar */}
      <Navbar
        activePage="subscriptions"
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onToast={showToast}
      />

      <main className="subscriptions-main animate-fade-in">
        
        {/* Page Header */}
        <div className="subscriptions-header-row">
          <div className="subscriptions-title-group">
            <div className="subscriptions-kicker">Extended Care & Hardware Protection</div>
            <h1 className="subscriptions-title">Product Warranty Subscriptions</h1>
            <p className="subscriptions-subtitle">
              Active warranty extension plans (3M, 6M & 12M) with live customer subscriber details and regional hub dispatch SLAs
            </p>
          </div>

          <div className="subscriptions-actions-group">
            <button 
              className="btn-new-plan"
              onClick={() => setIsEnrollModalOpen(true)}
            >
              <Plus size={16} />
              <span>Enroll New Warranty Subscriber</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Pill Cards */}
        <div className="warranty-metrics-bar">
          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">Total Warranty Revenue</span>
              <span className="metric-pill-value green">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <span className="metric-dot green"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">3-Month Subscribers</span>
              <span className="metric-pill-value blue">{subs3M.length} Active ({subs3M.reduce((s, i) => s + i.seats, 0)} units)</span>
            </div>
            <span className="metric-dot blue"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">6-Month Subscribers</span>
              <span className="metric-pill-value purple">{subs6M.length} Active ({subs6M.reduce((s, i) => s + i.seats, 0)} units)</span>
            </div>
            <span className="metric-dot purple"></span>
          </div>

          <div className="metric-pill-card">
            <div className="metric-pill-info">
              <span className="metric-pill-label">12-Month Subscribers</span>
              <span className="metric-pill-value amber">{subs12M.length} Active ({subs12M.reduce((s, i) => s + i.seats, 0)} units)</span>
            </div>
            <span className="metric-dot amber"></span>
          </div>
        </div>

        {/* ── 3 DEDICATED WARRANTY SUBSCRIPTION PLANS ── */}
        <div className="warranty-plans-section">
          <div className="section-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#714b67" />
              <h2 className="section-title">Available Warranty Extension Plans</h2>
            </div>
            <span className="section-tagline">3 Tiered Protection Plans Available Across All Products</span>
          </div>

          <div className="warranty-plans-grid">
            {warrantyPlans.map((plan) => {
              const enrolledList = subscriptions.filter(s => s.tier === plan.tier);
              const isTabActive = activePlanTab === plan.tier;

              return (
                <div 
                  key={plan.id} 
                  className={`warranty-plan-card ${plan.tier === '12 Months' ? 'featured-plan' : ''} ${isTabActive ? 'selected-plan-border' : ''}`}
                >
                  <div className="plan-card-header">
                    <span className={`plan-badge ${plan.badgeClass}`}>{plan.badge}</span>
                    <span className="plan-subscribers-count">
                      👥 <strong>{enrolledList.length}</strong> Current Subscribers
                    </span>
                  </div>

                  <h3 className="plan-name">{plan.name}</h3>
                  <div className="plan-price-row">
                    <span className="plan-price">{plan.priceFormatted}</span>
                    <span className="plan-unit">{plan.unitLabel}</span>
                  </div>

                  <p className="plan-desc">{plan.description}</p>

                  <div className="plan-features-list">
                    <div className="plan-features-label">Included Coverage Scope:</div>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="plan-feature-item">
                        <Check size={14} color="#16a34a" className="plan-check-icon" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="plan-recommended-box">
                    <strong>Recommended for:</strong> {plan.recommendedFor}
                  </div>

                  <div className="plan-card-footer">
                    <button
                      type="button"
                      className={`btn-plan-action ${isTabActive ? 'active' : ''}`}
                      onClick={() => {
                        setActivePlanTab(activePlanTab === plan.tier ? 'all' : plan.tier);
                      }}
                    >
                      {isTabActive ? (
                        <>
                          <Check size={14} />
                          <span>Showing Enrolled Subscribers ({enrolledList.length})</span>
                        </>
                      ) : (
                        <>
                          <span>View {plan.shortName} Subscribers ({enrolledList.length})</span>
                          <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── CUSTOMER PROPOSALS & QUOTATION NEGOTIATIONS SECTION ── */}
        {(isCustomerUser || customerQuotes.length > 0) && (
          <div className="warranty-plans-section" style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div className="section-title-wrap">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#714b67" />
                <h2 className="section-title">
                  {isCustomerUser ? "Your Active Quotations & Negotiation Proposals" : `Customer Quotation Proposals (${customerQuotes.length})`}
                </h2>
              </div>
              <span className="section-tagline">
                Review tailored proposals, chat live with your account manager, and confirm orders with one click
              </span>
            </div>

            {customerQuotes.length === 0 ? (
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '28px 20px', textAlign: 'center' }}>
                <FileCheck size={30} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#334155' }}>No Active Proposals Found</h4>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                  When your account manager creates and sends a quotation, you can review pricing, ask questions, and negotiate terms here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {customerQuotes.map(q => {
                  const portalUrl = q.portal_token ? `${window.location.origin}/portal/${q.portal_token}` : null;
                  const discountPct = Number(q.discount_percent || q.discountPercent || 0);
                  const totalAmt = Number(q.total_amount || q.totalAmount || q.amount || 0);
                  const stage = q.stage || q.status || 'Active';

                  return (
                    <div key={q.id} style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '18px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#714b67', background: '#faf5f8', padding: '3px 8px', borderRadius: '6px' }}>
                            Quote #{q.id}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: stage.toLowerCase().includes('confirm') ? '#dcfce7' : stage.toLowerCase().includes('negoti') ? '#fef3c7' : '#e0f2fe',
                            color: stage.toLowerCase().includes('confirm') ? '#166534' : stage.toLowerCase().includes('negoti') ? '#b45309' : '#0369a1'
                          }}>
                            ● {stage}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#0f172a', fontWeight: 700 }}>
                          {q.customer_name || q.client || q.customerName || 'Valued Client'}
                        </h4>
                        <p style={{ margin: '0 0 12px', fontSize: '12.5px', color: '#64748b', lineHeight: 1.4 }}>
                          {q.notes || q.desc || 'Custom Hardware & Platform Solution'}
                        </p>

                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                            <span>Quoted Net Total:</span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                              ₹{totalAmt.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {discountPct > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#16a34a' }}>
                              <span>Discount Applied:</span>
                              <strong>{discountPct}% OFF</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {portalUrl ? (
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-new-plan"
                            style={{
                              flex: 1,
                              height: '36px',
                              fontSize: '12.5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            <ExternalLink size={13} />
                            <span>Open Negotiation Portal</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn-new-plan"
                            onClick={() => {
                              if (onNavigate) onNavigate('quotations');
                            }}
                            style={{
                              flex: 1,
                              height: '36px',
                              fontSize: '12.5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <ExternalLink size={13} />
                            <span>View Proposal</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CURRENT SUBSCRIBERS TABLE SECTION ── */}
        <div className="warranty-subscribers-section">
          <div className="subscribers-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#714b67" />
                <h2 className="section-title">
                  Current Warranty Subscribers Ledger ({displaySubscriptions.length})
                </h2>
              </div>
              <p className="section-subtitle">
                Comprehensive tracking of customer product serial numbers, warranty expiry dates, and replacement status
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="subscribers-controls">
              <div className="plan-tabs-group">
                <button
                  className={`btn-plan-tab ${activePlanTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActivePlanTab('all')}
                >
                  All Plans ({subscriptions.length})
                </button>
                <button
                  className={`btn-plan-tab ${activePlanTab === '3 Months' ? 'active' : ''}`}
                  onClick={() => setActivePlanTab('3 Months')}
                >
                  3 Months ({subs3M.length})
                </button>
                <button
                  className={`btn-plan-tab ${activePlanTab === '6 Months' ? 'active' : ''}`}
                  onClick={() => setActivePlanTab('6 Months')}
                >
                  6 Months ({subs6M.length})
                </button>
                <button
                  className={`btn-plan-tab ${activePlanTab === '12 Months' ? 'active' : ''}`}
                  onClick={() => setActivePlanTab('12 Months')}
                >
                  12 Months ({subs12M.length})
                </button>
              </div>

              <div className="search-and-status-wrap">
                <div className="subs-search-box">
                  <Search size={14} className="subs-search-icon" />
                  <input
                    type="text"
                    className="subs-search-input"
                    placeholder="Search subscriber, product, serial #..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="subs-cycle-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Expiring Soon">Expiring Soon (≤20 days)</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscribers Ledger Table */}
          {displaySubscriptions.length === 0 ? (
            <div className="empty-subscribers-box">
              <ShieldCheck size={36} color="#94a3b8" />
              <h3>No warranty subscribers found</h3>
              <p>Try clearing your filters or enroll a new subscriber into a warranty plan.</p>
              <button className="btn-new-plan" onClick={() => setIsEnrollModalOpen(true)}>
                <Plus size={14} />
                <span>Enroll First Subscriber</span>
              </button>
            </div>
          ) : (
            <div className="subscribers-table-card">
              <table className="subscribers-table">
                <thead>
                  <tr>
                    <th>Warranty ID & Subscriber</th>
                    <th>Covered Product & Serials</th>
                    <th>Plan & Duration</th>
                    <th>Warehouse Logistics Hub</th>
                    <th>Validity Timeline</th>
                    <th>Fee Paid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySubscriptions.map((sub) => (
                    <tr key={sub.id}>
                      {/* Subscriber */}
                      <td>
                        <div className="subscriber-cell">
                          <div className="subscriber-avatar">
                            {sub.customer.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="subscriber-name">{sub.customer}</div>
                            <span className="subscriber-code">{sub.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Product & Serials */}
                      <td>
                        <div className="product-coverage-cell">
                          <div className="product-covered-name">{sub.productName}</div>
                          <div className="product-sku-tag">SKU: {sub.productSku} • {sub.seats} unit(s)</div>
                          <div className="serial-tags-list">
                            {sub.serialNumbers.map((sn, i) => (
                              <span key={i} className="serial-tag">
                                SN: {sn}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td>
                        <span className={`plan-tier-badge ${sub.tier === '12 Months' ? 'gold' : sub.tier === '6 Months' ? 'purple' : 'blue'}`}>
                          {sub.tier} Warranty
                        </span>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                          {sub.planName}
                        </div>
                      </td>

                      {/* Warehouse Hub */}
                      <td>
                        <div className="warehouse-hub-cell">
                          <span className="hub-dot"></span>
                          <span>{sub.warehouseHub}</span>
                        </div>
                      </td>

                      {/* Validity Timeline */}
                      <td>
                        <div className="validity-cell">
                          <div className="validity-dates">
                            <span>{sub.startDate}</span>
                            <span className="arrow">➔</span>
                            <strong>{sub.expiryDate}</strong>
                          </div>
                          <div className={`countdown-badge ${sub.daysRemaining <= 20 ? 'urgent' : 'good'}`}>
                            <Clock size={11} />
                            <span>
                              {sub.daysRemaining <= 0 ? 'Expired' : `${sub.daysRemaining} days left`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Fee Paid */}
                      <td>
                        <div className="fee-cell">
                          <strong className="fee-amount">₹{sub.amount.toLocaleString('en-IN')}</strong>
                          <span className="fee-cycle">{sub.tier} Full Coverage</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`warranty-status-tag ${sub.status === 'Active' ? 'status-active' : sub.status === 'Expiring Soon' ? 'status-expiring' : 'status-paused'}`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-cert-action"
                            onClick={() => setCertificateSub(sub)}
                            title="View Official Warranty Certificate"
                          >
                            <FileCheck size={14} />
                            <span>Certificate</span>
                          </button>

                          <button
                            type="button"
                            className="btn-toggle-status"
                            onClick={() => handleToggleStatus(sub)}
                            title={sub.rawStatus === 'Active' ? 'Pause Warranty' : 'Resume Warranty'}
                          >
                            {sub.rawStatus === 'Active' ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* ── MODAL: ENROLL NEW WARRANTY SUBSCRIBER ── */}
      {isEnrollModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEnrollModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="#714b67" />
                <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                  Enroll New Warranty Subscriber
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setIsEnrollModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollSubscriber}>
              <div className="form-group">
                <label className="form-label">Subscriber / Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp / Tata Consultancy"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Customer Email (for Warranty Certificate)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. warranty-admin@company.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
              </div>

              {/* Product Selection */}
              <div className="form-group">
                <label className="form-label">Select Covered Product *</label>
                <select
                  className="form-input"
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  required
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">-- Choose Product from Catalog ({availableProducts.length} items) --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name} — (List: ₹{Number(p.price || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warranty Plan Tier Selection */}
              <div className="form-group">
                <label className="form-label">Select Warranty Extension Plan *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  {WARRANTY_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanTier(plan.tier)}
                      style={{
                        border: selectedPlanTier === plan.tier ? '2px solid #714b67' : '1px solid #cbd5e1',
                        backgroundColor: selectedPlanTier === plan.tier ? '#faf5f8' : '#ffffff',
                        borderRadius: '8px',
                        padding: '10px 8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#714b67' }}>{plan.tier}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>{plan.priceFormatted}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>per unit</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity and Serial Numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Units Covered</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={newUnitQty}
                    onChange={(e) => setNewUnitQty(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Serial Numbers</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SN-9821, SN-9822 (Comma-separated)"
                    value={newSerialNumbers}
                    onChange={(e) => setNewSerialNumbers(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculation Summary Box */}
              {(() => {
                const plan = WARRANTY_PLANS.find(p => p.tier === selectedPlanTier) || WARRANTY_PLANS[0];
                const total = plan.price * (Number(newUnitQty) || 1);
                return (
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Plan Tier:</span>
                      <strong style={{ color: '#0f172a' }}>{plan.name} ({plan.durationLabel})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Rate Calculation:</span>
                      <span>{newUnitQty} unit(s) @ ₹{plan.price.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '6px', fontSize: '15px', fontWeight: 800 }}>
                      <span style={{ color: '#714b67' }}>Total Warranty Premium:</span>
                      <span style={{ color: '#059669' }}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                className="btn-new-plan"
                disabled={isSubmitting}
                style={{ width: '100%', height: '46px', justifyContent: 'center' }}
              >
                {isSubmitting ? 'Enrolling Subscriber...' : 'Activate Warranty Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFICIAL WARRANTY CERTIFICATE ── */}
      {certificateSub && (
        <div className="modal-overlay" onClick={() => setCertificateSub(null)}>
          <div className="modal-content certificate-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={22} color="#059669" />
                <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#059669' }}>
                  Official Product Warranty Certificate
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setCertificateSub(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Printable Certificate Frame */}
            <div className="certificate-frame">
              <div className="certificate-watermark">DEALFLOW360 PROTECT</div>

              <div className="cert-top-row">
                <div>
                  <div className="cert-brand">DealFlow<span>360</span> Protect</div>
                  <div className="cert-doc-title">Certificate of Extended Hardware Warranty</div>
                </div>
                <div className="cert-badge">
                  <ShieldCheck size={28} color="#059669" />
                  <span>AUTHENTICATED</span>
                </div>
              </div>

              <div className="cert-policy-number">
                POLICY ID: <strong>{certificateSub.id}</strong> • DURATION: <strong>{certificateSub.tier}</strong>
              </div>

              <div className="cert-body-grid">
                <div className="cert-field-group">
                  <span className="cert-field-label">CERTIFIED SUBSCRIBER:</span>
                  <span className="cert-field-value">{certificateSub.customer}</span>
                </div>

                <div className="cert-field-group">
                  <span className="cert-field-label">COVERED PRODUCT MODEL:</span>
                  <span className="cert-field-value">{certificateSub.productName}</span>
                </div>

                <div className="cert-field-group">
                  <span className="cert-field-label">PRODUCT SKU CODE:</span>
                  <span className="cert-field-value">{certificateSub.productSku}</span>
                </div>

                <div className="cert-field-group">
                  <span className="cert-field-label">WAREHOUSE LOGISTICS HUB:</span>
                  <span className="cert-field-value">{certificateSub.warehouseHub}</span>
                </div>

                <div className="cert-field-group">
                  <span className="cert-field-label">COMMENCEMENT DATE:</span>
                  <span className="cert-field-value">{certificateSub.startDate}</span>
                </div>

                <div className="cert-field-group">
                  <span className="cert-field-label">EXPIRATION DATE:</span>
                  <span className="cert-field-value highlight">{certificateSub.expiryDate}</span>
                </div>
              </div>

              {/* Covered Serial Numbers */}
              <div className="cert-serials-box">
                <span className="cert-field-label">COVERED HARDWARE SERIAL NUMBERS:</span>
                <div className="cert-serials-tags">
                  {certificateSub.serialNumbers.map((sn, i) => (
                    <span key={i} className="cert-serial-pill">
                      SN: {sn}
                    </span>
                  ))}
                </div>
              </div>

              {/* Terms and Coverage Summary */}
              <div className="cert-terms-box">
                <strong>Warranty Protection Terms:</strong> {certificateSub.coverageScope}
              </div>

              {/* Signatures */}
              <div className="cert-signatures-row">
                <div>
                  <div className="cert-sign-line">Arjav Dariya</div>
                  <span className="cert-sign-role">VP, Hardware Quality & Logistics</span>
                </div>
                <div>
                  <div className="cert-sign-line">DealFlow360 Assurance</div>
                  <span className="cert-sign-role">Enterprise Assurance seal</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-new-plan"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  window.print();
                  showToast('Preparing certificate for printing / download...');
                }}
              >
                <Printer size={15} />
                <span>Print / Save Certificate PDF</span>
              </button>
              <button
                type="button"
                className="btn-export-subs"
                onClick={() => setCertificateSub(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span style={{ fontWeight: 700, color: '#0f172a' }}>DealFlow360</span>
            <span>© 2026 DealFlow360 Technologies, Inc. All rights reserved.</span>
          </div>

          <div className="footer-links">
            <button className="footer-link" onClick={() => showToast('Terms of Service')}>
              Terms of Service
            </button>
            <button className="footer-link" onClick={() => showToast('Privacy Policy')}>
              Privacy Policy
            </button>
            <div className="status-badge">
              <span className="pulse-dot"></span>
              <span>Warranty Engine Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
