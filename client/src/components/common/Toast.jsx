import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

/**
 * DealFlow360 - Global Notification Toast
 * 
 * Used throughout the app to display success, error, and info alerts.
 */
export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const IconComponent = type === 'error' ? AlertCircle : type === 'info' ? Info : CheckCircle2;

  return (
    <div className="toast-container animate-slide-in">
      <div className={`toast-box toast-${type}`}>
        <IconComponent size={20} className="toast-icon" />
        <span className="toast-text">{message}</span>
        {onClose && (
          <button className="toast-close-btn" onClick={onClose} aria-label="Close notification">
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
