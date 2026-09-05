import React, { useState } from 'react';
import { 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  X, 
  HelpCircle,
  Lock
} from 'lucide-react';
import './App.css';
import Dashboard from './Dashboard';
import Quotations from './Quotations';
import Approvals from './Approvals';
import Fulfillment from './Fulfillment';
import Subscriptions from './Subscriptions';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth' | 'dashboard' | 'quotations' | 'approvals' | 'fulfillment' | 'subscriptions'
  const [currentUser, setCurrentUser] = useState({
    name: 'Alex Morgan',
    email: 'alex.morgan@firm-capital.com',
    initials: 'AM'
  });

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign up form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Modals & Toast State
  const [activeModal, setActiveModal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginEmail) {
      showToast('Please enter your work email.');
      return;
    }
    if (!loginPassword) {
      showToast('Please enter your password.');
      return;
    }

    const emailName = loginEmail.split('@')[0];
    const formattedName = emailName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Alex Morgan';

    const initials = formattedName
      .split(' ')
      .map(p => p.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AM';

    setCurrentUser({
      name: formattedName,
      email: loginEmail,
      initials: initials
    });

    setCurrentScreen('dashboard');
    showToast(`Welcome back, ${formattedName}!`);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      showToast('Please enter your first and last name.');
      return;
    }
    if (!signupEmail) {
      showToast('Please enter your work email.');
      return;
    }
    if (signupPassword.length < 8) {
      showToast('Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      showToast('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

    setCurrentUser({
      name: fullName,
      email: signupEmail,
      initials: initials
    });

    setCurrentScreen('dashboard');
    showToast(`Account created! Welcome to DealFlow360, ${firstName}!`);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email to reset password.');
      return;
    }
    showToast(`Password reset link sent to ${forgotEmail}`);
    setActiveModal(null);
    setForgotEmail('');
  };

  const handleLogout = () => {
    setCurrentScreen('auth');
    showToast('Signed out successfully.');
  };

  // Route Views
  if (currentScreen === 'dashboard') {
    return (
      <Dashboard 
        user={currentUser} 
        onNavigate={(screen) => setCurrentScreen(screen)}
        onLogout={handleLogout} 
      />
    );
  }

  if (currentScreen === 'quotations') {
    return (
      <Quotations 
        user={currentUser} 
        onNavigate={(screen) => setCurrentScreen(screen)}
        onLogout={handleLogout} 
      />
    );
  }

  if (currentScreen === 'approvals') {
    return (
      <Approvals 
        user={currentUser} 
        onNavigate={(screen) => setCurrentScreen(screen)}
        onLogout={handleLogout} 
      />
    );
  }

  if (currentScreen === 'fulfillment') {
    return (
      <Fulfillment 
        user={currentUser} 
        onNavigate={(screen) => setCurrentScreen(screen)}
        onLogout={handleLogout} 
      />
    );
  }

  if (currentScreen === 'subscriptions') {
    return (
      <Subscriptions 
        user={currentUser} 
        onNavigate={(screen) => setCurrentScreen(screen)}
        onLogout={handleLogout} 
      />
    );
  }

  // Auth Screen
  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={20} color="#e9d5e3" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

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
              title="Help & Info"
              onClick={() => setActiveModal('support')}
            >
              ?
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="auth-card-wrapper animate-fade-in">
          <div className="auth-card">
            
            {/* Segmented Tab Switcher */}
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

            {/* SIGN IN VIEW */}
            {activeTab === 'signin' && (
              <div className="animate-fade-in">
                <div className="card-header">
                  <h1 className="card-title">Welcome back</h1>
                  <p className="card-subtitle">Accelerate your deal flow and pipeline execution.</p>
                </div>

                <form onSubmit={handleLoginSubmit}>
                  {/* Work Email */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-email">Work Email</label>
                    <div className="input-container">
                      <input
                        id="login-email"
                        type="email"
                        className="form-input"
                        placeholder="name@firm-capital.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <span className="input-icon-static">
                        <Mail size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <div className="input-container">
                      <input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="input-icon-btn"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Options Row: Remember Me & Forgot Password */}
                  <div className="form-options-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me for 30 days</span>
                    </label>

                    <button
                      type="button"
                      className="link-forgot"
                      onClick={() => setActiveModal('forgot')}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="btn-primary-submit">
                    <span>Sign in to DealFlow360</span>
                    <ArrowRight size={18} />
                  </button>
                </form>

                {/* Security Trust Badge */}
                <div className="security-badge-row">
                  <div className="security-badge-left">
                    <ShieldCheck size={16} color="#714b67" />
                    <span>256-bit TLS & SOC2 Type II Certified</span>
                  </div>
                  <div className="security-badge-right">
                    <a href="#terms" onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}>Terms</a>
                    <span> • </span>
                    <a href="#privacy" onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}>Privacy</a>
                  </div>
                </div>
              </div>
            )}

            {/* CREATE ACCOUNT VIEW */}
            {activeTab === 'signup' && (
              <div className="animate-fade-in">
                <div className="card-header">
                  <h1 className="card-title">Create your account</h1>
                  <p className="card-subtitle">Accelerate your deal flow and pipeline execution.</p>
                </div>

                <form onSubmit={handleSignupSubmit}>
                  {/* Two-column Name */}
                  <div className="form-grid-two">
                    <div>
                      <label className="form-label" htmlFor="first-name">First Name</label>
                      <input
                        id="first-name"
                        type="text"
                        className="form-input"
                        placeholder="Alex"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="last-name">Last Name</label>
                      <input
                        id="last-name"
                        type="text"
                        className="form-input"
                        placeholder="Morgan"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  {/* Work Email */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-email">Work Email</label>
                    <div className="input-container">
                      <input
                        id="signup-email"
                        type="email"
                        className="form-input"
                        placeholder="name@firm-capital.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                      <span className="input-icon-static">
                        <Mail size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-password">Password</label>
                    <div className="input-container">
                      <input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="Create strong password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="input-icon-btn"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      >
                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                    <div className="input-container">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="form-input"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="input-icon-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="password-hint">
                      <Info size={15} />
                      <span>At least 8 characters with a number or symbol</span>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="terms-agreement-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        required
                      />
                      <span>
                        I agree to the{' '}
                        <a 
                          href="#terms" 
                          className="terms-link"
                          onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }}
                        >
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a 
                          href="#privacy" 
                          className="terms-link"
                          onClick={(e) => { e.preventDefault(); setActiveModal('privacy'); }}
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="btn-primary-submit">
                    <span>Create DealFlow360 Account</span>
                    <ArrowRight size={18} />
                  </button>
                </form>

                {/* Bottom link back to Sign In */}
                <div className="bottom-switch-link">
                  Already have an account?
                  <button type="button" onClick={() => setActiveTab('signin')}>
                    Sign in
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                {activeModal === 'forgot' && 'Reset Password'}
                {activeModal === 'contact' && 'Contact Enterprise Sales'}
                {activeModal === 'support' && 'DealFlow360 Support'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'security' && 'Security & Compliance'}
              </h3>
              <button 
                className="modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <X size={20} />
              </button>
            </div>

            {activeModal === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit}>
                <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '18px' }}>
                  Enter your registered work email address and we will send you a link to reset your credentials.
                </p>
                <div className="form-group">
                  <label className="form-label">Work Email</label>
                  <div className="input-container">
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@firm-capital.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                    <span className="input-icon-static">
                      <Mail size={18} />
                    </span>
                  </div>
                </div>
                <button type="submit" className="btn-primary-submit" style={{ marginTop: '12px' }}>
                  <span>Send Reset Link</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {activeModal === 'contact' && (
              <div>
                <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '18px' }}>
                  Speak directly with our investment banking and venture capital solutions team.
                </p>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '14px', color: '#334155' }}>
                  <div><strong>Email:</strong> sales@dealflow360.io</div>
                  <div style={{ marginTop: '8px' }}><strong>Direct:</strong> +1 (800) 555-DEAL</div>
                  <div style={{ marginTop: '8px' }}><strong>Hours:</strong> 24/7 Priority Desk for Institutional Clients</div>
                </div>
                <button 
                  type="button" 
                  className="btn-primary-submit"
                  onClick={() => {
                    showToast('Sales team notified! An advisor will reach out shortly.');
                    setActiveModal(null);
                  }}
                >
                  Request a Personalized Demo
                </button>
              </div>
            )}

            {activeModal === 'support' && (
              <div>
                <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '18px' }}>
                  Need assistance with your DealFlow360 account, workspace configuration, or SSO integration?
                </p>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '18px', fontSize: '14px', color: '#334155' }}>
                  <div><strong>Help Center:</strong> support.dealflow360.io</div>
                  <div style={{ marginTop: '8px' }}><strong>Email:</strong> help@dealflow360.io</div>
                  <div style={{ marginTop: '8px' }}><strong>SLA:</strong> &lt; 15 min response time for enterprise tier</div>
                </div>
                <button 
                  type="button" 
                  className="btn-primary-submit"
                  onClick={() => setActiveModal(null)}
                >
                  Close
                </button>
              </div>
            )}

            {(activeModal === 'terms' || activeModal === 'privacy' || activeModal === 'security') && (
              <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.65, maxHeight: '300px', overflowY: 'auto' }}>
                <p style={{ marginBottom: '12px' }}>
                  DealFlow360 adheres to enterprise-grade compliance standards including SOC 2 Type II, GDPR, ISO 27001, and FINRA data protection guidelines.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  All data in transit is encrypted using 256-bit TLS encryption, and data at rest is encrypted with customer-managed or enterprise KMS keys.
                </p>
                <p>
                  For full audit logs, DPA (Data Processing Agreements), and BAA agreements, please contact your account representative.
                </p>
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
