import React from 'react';
import { X, ShieldCheck, Mail, Phone, Clock, ExternalLink } from 'lucide-react';

/**
 * DealFlow360 - Reusable Information & Compliance Modal
 */
export default function InfoModal({ type, onClose, onAction }) {
  if (!type) return null;

  const titles = {
    forgot: 'Reset Password',
    contact: 'Contact Institutional Sales Desk',
    support: 'DealFlow360 Client Support',
    terms: 'Enterprise Terms of Service',
    privacy: 'Privacy & Data Governance Policy',
    security: 'Security, Encryption & Compliance Matrix'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a' }}>
            {titles[type] || 'Information'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ marginTop: '14px' }}>
          {type === 'contact' && (
            <div>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                Speak directly with our Deal Execution & Capital Advisory solutions team.
              </p>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '13.5px', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Mail size={16} color="#714b67" />
                  <span><strong>Institutional Desk:</strong> sales@dealflow360.io</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Phone size={16} color="#714b67" />
                  <span><strong>Direct Line:</strong> +1 (800) 555-DEAL</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#714b67" />
                  <span><strong>Availability:</strong> 24/7 Priority Desk for Tier-1 Desks</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-primary-submit"
                onClick={() => {
                  if (onAction) onAction('Sales inquiry logged. Our team will contact you within 15 minutes.');
                  onClose();
                }}
              >
                Schedule Executive Demo
              </button>
            </div>
          )}

          {type === 'support' && (
            <div>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                Need help with workspace setup, SSO/SAML integration, or pipeline analytics?
              </p>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '13.5px', color: '#334155' }}>
                <div><strong>Help Center:</strong> docs.dealflow360.internal</div>
                <div style={{ marginTop: '8px' }}><strong>Technical Support:</strong> help@dealflow360.io</div>
                <div style={{ marginTop: '8px' }}><strong>Response SLA:</strong> &lt; 15 min for Enterprise accounts</div>
              </div>
              <button type="button" className="btn-primary-submit" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {(type === 'terms' || type === 'privacy' || type === 'security') && (
            <div style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.65, maxHeight: '320px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#714b67', fontWeight: 600 }}>
                <ShieldCheck size={18} />
                <span>Enterprise SOC2 Type II, ISO 27001 & FINRA Data Protocol</span>
              </div>
              <p style={{ marginBottom: '12px' }}>
                DealFlow360 provides institutional-grade deal flow infrastructure. All data in transit is protected using 256-bit TLS encryption, with resting databases sealed using AES-256 KMS key rotation.
              </p>
              <p style={{ marginBottom: '12px' }}>
                Role-based access control (RBAC), multi-party approval audits, and immutable transaction ledgers ensure strict organizational compliance across private equity, venture, and M&A workflows.
              </p>
              <p>
                To request custom Data Processing Agreements (DPA) or Business Associate Agreements (BAA), reach out to our legal compliance unit at legal@dealflow360.io.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
