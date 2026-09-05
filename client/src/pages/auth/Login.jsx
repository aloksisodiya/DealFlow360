import React, { useState } from 'react';
import { Mail, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { loginUser } from '../../services/authService';

/**
 * DealFlow360 - Login Component
 * 
 * Clean, production-ready Sign In component with manual credential entry.
 * Synced directly with PostgreSQL database.
 */
export default function Login({ onLoginSuccess, onForgotPassword, onOpenTerms, onOpenPrivacy, onToast }) {
  // 1. Form State Management (Empty defaults for manual user typing)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      if (onToast) onToast('Please enter your work email.');
      return;
    }
    if (!password) {
      if (onToast) onToast('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser(email.trim().toLowerCase(), password);

      if (result.success && result.user) {
        if (onToast) onToast(`Welcome back, ${result.user.name}!`);
        onLoginSuccess(result.user);
      } else {
        if (onToast) onToast(result.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('[Login Error]', err);
      if (onToast) onToast(err?.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-view-container animate-fade-in">
      {/* Header Section */}
      <div className="card-header">
        <h1 className="card-title">Welcome back</h1>
        <p className="card-subtitle">Accelerate your deal flow, CPQ pipeline, and revenue execution.</p>
      </div>

      {/* Main Login Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Work Email Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Work Email</label>
          <div className="input-container">
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="Type your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
            <span className="input-icon-static">
              <Mail size={18} />
            </span>
          </div>
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div className="input-container">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Type your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
            <span>Remember me</span>
          </label>

          <button
            type="button"
            className="link-forgot"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn-primary-submit" 
          disabled={isLoading}
        >
          <span>{isLoading ? 'Verifying with Database...' : 'Sign in to DealFlow360'}</span>
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Security & Compliance Trust Badge */}
      <div className="security-badge-row">
        <div className="security-badge-left">
          <ShieldCheck size={16} color="#714b67" />
          <span>256-bit TLS & SOC2 Type II Certified</span>
        </div>
        <div className="security-badge-right">
          <button type="button" className="inline-link" onClick={onOpenTerms}>Terms</button>
          <span> • </span>
          <button type="button" className="inline-link" onClick={onOpenPrivacy}>Privacy</button>
        </div>
      </div>
    </div>
  );
}
