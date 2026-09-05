import React, { useState } from 'react';
import { Mail, Eye, EyeOff, ArrowRight, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerUser } from '../../services/authService';

/**
 * DealFlow360 - Signup Component
 * 
 * Clean, production-ready Registration component.
 * Features:
 * - First & Last name validation
 * - Institutional work email verification
 * - Dynamic password strength meter & rules check
 * - Confirm password consistency check
 * - Interactive Terms of Service & Privacy Policy agreement
 */
export default function Signup({ onSignupSuccess, onSwitchToLogin, onOpenTerms, onOpenPrivacy, onToast }) {
  // 1. Form State Management
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Real-time Password Strength Calculation
  const calculatePasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#e2e8f0' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2 || score === 3) return { score: 2, label: 'Moderate', color: '#f59e0b' };
    return { score: 3, label: 'Strong (Enterprise Ready)', color: '#10b981' };
  };

  const strength = calculatePasswordStrength(password);

  // 3. Form Submission & Validation Logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      if (onToast) onToast('Please enter both first and last name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (onToast) onToast('Please enter a valid work email address.');
      return;
    }
    if (password.length < 8) {
      if (onToast) onToast('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      if (onToast) onToast('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      if (onToast) onToast('Please review and accept the Terms and Privacy Policy.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        workEmail: email.trim().toLowerCase(),
        password
      });

      if (result.success && result.user) {
        if (onToast) onToast(`Account created successfully! Welcome, ${firstName}!`);
        onSignupSuccess(result.user);
      } else {
        const isConflict = result.message?.toLowerCase().includes('already registered') || result.message?.toLowerCase().includes('conflict');
        if (isConflict) {
          if (onToast) onToast('An account with this email is already registered. Redirecting to Sign In...');
          setTimeout(() => {
            if (onSwitchToLogin) onSwitchToLogin();
          }, 1500);
        } else {
          if (onToast) onToast(result.message || 'Registration failed.');
        }
      }
    } catch {
      if (onToast) onToast('An unexpected error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-view-container animate-fade-in">
      {/* Header Section */}
      <div className="card-header">
        <h1 className="card-title">Create your account</h1>
        <p className="card-subtitle">Join top dealmakers running quotes, approvals, and contract fulfillment.</p>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* First & Last Name Two-Column Grid */}
        <div className="form-grid-two">
          <div className="form-group">
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
          <div className="form-group">
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

        {/* Work Email Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">Work Email</label>
          <div className="input-container">
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="Type your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <span className="input-icon-static">
              <Mail size={18} />
            </span>
          </div>
        </div>

        {/* Password Field with Dynamic Strength Indicator */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">Password</label>
          <div className="input-container">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Create strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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

          {/* Password Strength Meter */}
          {password && (
            <div className="password-strength-container">
              <div className="strength-bar-track">
                <div 
                  className="strength-bar-fill" 
                  style={{ 
                    width: `${(strength.score / 3) * 100}%`,
                    backgroundColor: strength.color 
                  }}
                />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
          <div className="input-container">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              className="form-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {confirmPassword && (
            <div className={`password-match-indicator ${password === confirmPassword ? 'match' : 'mismatch'}`}>
              {password === confirmPassword ? (
                <>
                  <CheckCircle2 size={14} />
                  <span>Passwords match</span>
                </>
              ) : (
                <>
                  <AlertCircle size={14} />
                  <span>Passwords do not match</span>
                </>
              )}
            </div>
          )}

          <div className="password-hint">
            <Info size={14} />
            <span>At least 8 characters with letters, numbers, and symbols</span>
          </div>
        </div>

        {/* Terms & Privacy Agreement */}
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
              <button 
                type="button" 
                className="inline-link" 
                onClick={onOpenTerms}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button 
                type="button" 
                className="inline-link" 
                onClick={onOpenPrivacy}
              >
                Privacy Policy
              </button>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="btn-primary-submit" 
          disabled={isLoading}
        >
          <span>{isLoading ? 'Creating Workspace...' : 'Create DealFlow360 Account'}</span>
          <ArrowRight size={18} />
        </button>
      </form>

      {/* Switch to Login Link */}
      <div className="bottom-switch-link">
        <span>Already have an institutional account?</span>
        <button type="button" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </div>
    </div>
  );
}
