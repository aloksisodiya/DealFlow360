import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPasswordModal from './ForgotPasswordModal';
import InfoModal from '../../components/common/InfoModal';
import './Auth.css';

/**
 * DealFlow360 - Master Authentication Page
 * 
 * Houses the enterprise branded container, Segmented Tab Switcher (Sign In / Sign Up),
 * modal orchestration, and system compliance footer.
 */
export default function Auth({ onLoginSuccess, onToast }) {
  // Tab state: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState('signin');
  
  // Modal state: null | 'forgot' | 'contact' | 'support' | 'terms' | 'privacy' | 'security'
  const [activeModal, setActiveModal] = useState(null);

  return (
    <div className="auth-page-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-container" onClick={() => setActiveTab('signin')}>
            <img src="/logo.png" alt="DealFlow360 Logo" className="brand-logo" />
            <span className="brand-name">
              <span className="brand-text-dark">DealFlow</span>
              <span className="brand-text-purple">360</span>
            </span>
          </div>

          <div className="header-actions">
            <button 
              className="nav-link" 
              onClick={() => setActiveModal('support')}
            >
              Support
            </button>
            <button 
              className="btn-contact-sales"
              onClick={() => setActiveModal('contact')}
            >
              Contact Sales
            </button>
            <button 
              className="btn-help-circle"
              title="Help & Platform Info"
              onClick={() => setActiveModal('support')}
            >
              ?
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Content Card */}
      <main className="main-content">
        <div className="auth-card-wrapper animate-fade-in">
          <div className="auth-card">
            
            {/* Segmented Tab Switcher (Sign In vs Create Account) */}
            <div className="tab-switcher-wrapper">
              <div className="tab-switcher" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signin'}
                  className={`tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('signin')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signup'}
                  className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                  onClick={() => setActiveTab('signup')}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Render Login or Signup Subcomponent */}
            {activeTab === 'signin' ? (
              <Login
                onLoginSuccess={onLoginSuccess}
                onForgotPassword={() => setActiveModal('forgot')}
                onOpenTerms={() => setActiveModal('terms')}
                onOpenPrivacy={() => setActiveModal('privacy')}
                onToast={onToast}
              />
            ) : (
              <Signup
                onSignupSuccess={onLoginSuccess}
                onSwitchToLogin={() => setActiveTab('signin')}
                onOpenTerms={() => setActiveModal('terms')}
                onOpenPrivacy={() => setActiveModal('privacy')}
                onToast={onToast}
              />
            )}

          </div>
        </div>
      </main>

      {/* Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={activeModal === 'forgot'}
        onClose={() => setActiveModal(null)}
        onSent={(msg) => {
          if (onToast) onToast(msg);
        }}
      />

      {/* Information & Compliance Modals (Support, Contact Sales, Terms, Privacy, Security) */}
      {activeModal && activeModal !== 'forgot' && (
        <InfoModal
          type={activeModal}
          onClose={() => setActiveModal(null)}
          onAction={(msg) => {
            if (onToast) onToast(msg);
          }}
        />
      )}

      {/* Institutional Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className="pulse-dot"></span>
            <span>© 2025 DealFlow360 Inc. Enterprise-grade deal flow and CPQ pipeline intelligence.</span>
          </div>

          <div className="footer-links">
            <button 
              className="footer-link"
              onClick={() => setActiveModal('privacy')}
            >
              Privacy Policy
            </button>
            <button 
              className="footer-link"
              onClick={() => setActiveModal('terms')}
            >
              Terms of Service
            </button>
            <button 
              className="footer-link"
              onClick={() => setActiveModal('security')}
            >
              Security & Compliance
            </button>
            <div className="status-badge" title="All systems operational (99.99% uptime)">
              <span className="pulse-dot"></span>
              <span>System Status: Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
