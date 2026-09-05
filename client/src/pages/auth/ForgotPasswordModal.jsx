import React, { useState } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestPasswordReset, resetPasswordWithCode } from '../../services/authService';

/**
 * DealFlow360 - Secure Password Recovery Modal (Nodemailer)
 * 
 * 3-Step Security Flow:
 * 1. Request Code: Enter registered email -> Dispatches email with 6-digit OTP
 * 2. Verify & Reset: User checks their actual inbox, types 6-digit OTP code + new secure password
 * 3. Success: Confirms credential update and redirects to login
 */
export default function ForgotPasswordModal({ isOpen, onClose, onSent }) {
  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify & Reset, 3 = Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(''); // Kept strictly empty for manual verification
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Step 1: Send Reset Code via Nodemailer
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestPasswordReset(email.trim().toLowerCase());

      if (result.success) {
        setCode(''); // Ensure code is clean and empty
        setStep(2);
        if (onSent) {
          onSent(`Password reset verification code sent to ${email}`);
        }
      } else {
        setErrorMessage(result.message || 'Failed to dispatch reset email.');
      }
    } catch {
      setErrorMessage('Server error while sending reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code and Update Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!code.trim() || code.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPasswordWithCode({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword
      });

      if (result.success) {
        setStep(3);
        if (onSent) {
          onSent('Password updated successfully! You can now log in.');
        }
      } else {
        setErrorMessage(result.message || 'Failed to update password.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content animate-slide-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="#714b67" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Enter Verification Code'}
              {step === 3 && 'Password Updated'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div style={{ 
            marginTop: '14px', 
            padding: '10px 14px', 
            background: '#fff1f2', 
            border: '1px solid #fecdd3', 
            borderRadius: '8px', 
            color: '#e11d48', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="modal-body" style={{ marginTop: '16px' }}>
          
          {/* STEP 1: Request Reset Code via Nodemailer */}
          {step === 1 && (
            <form onSubmit={handleRequestCode}>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '18px' }}>
                Enter your registered work email. We will send a secure 6-digit verification code to your email inbox.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Work Email</label>
                <div className="input-container">
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-input"
                    placeholder="Type your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="input-icon-static">
                    <Mail size={18} />
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary-submit" 
                style={{ marginTop: '18px' }}
                disabled={isLoading}
              >
                <span>{isLoading ? 'Sending verification code...' : 'Send Verification Code'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2: Enter Verification Code & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword}>
              <div style={{ background: '#faf5f8', border: '1px solid #f1e0ec', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#54324c', fontWeight: 600 }}>
                  ✉️ 6-digit verification code sent to: <strong>{email}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Please check your inbox or spam folder and enter the code below.
                </div>
              </div>

              {/* 6-Digit OTP Code */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" htmlFor="reset-code">6-Digit Verification Code</label>
                <input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  placeholder="Type 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{ letterSpacing: '4px', fontSize: '18px', fontWeight: 700, textAlign: 'center' }}
                  autoFocus
                />
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" htmlFor="new-pass">New Password</label>
                <div className="input-container">
                  <input
                    id="new-pass"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Type your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password view"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" htmlFor="confirm-pass">Confirm New Password</label>
                <input
                  id="confirm-pass"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-type your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary-submit" 
                disabled={isLoading}
              >
                <span>{isLoading ? 'Updating Password...' : 'Update Password'}</span>
                <ArrowRight size={16} />
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => {
                    setStep(1);
                    setCode('');
                  }}
                >
                  ← Resend code to different email
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div style={{ 
                width: '56px', 
                height: '56px', 
                background: '#ecfdf5', 
                color: '#10b981', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                border: '2px solid #a7f3d0'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                Password Updated Successfully!
              </h4>

              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                Your DealFlow360 platform credentials for <strong>{email}</strong> have been securely updated in the database.
              </p>

              <button 
                type="button" 
                className="btn-primary-submit" 
                onClick={handleClose}
              >
                <span>Back to Sign In</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
