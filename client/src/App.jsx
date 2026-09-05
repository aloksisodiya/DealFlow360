import React, { useState, useEffect } from 'react';
import Toast from './components/common/Toast';
import Auth from './pages/auth/Auth';
import Dashboard from './pages/dashboard/Dashboard';
import Quotations from './pages/quotations/Quotations';
import Approvals from './pages/approvals/Approvals';
import Fulfillment from './pages/fulfillment/Fulfillment';
import Subscriptions from './pages/subscriptions/Subscriptions';
import Invoices from './pages/invoices/Invoices';
import DealHealth from './pages/deal-health/DealHealth';
import Reports from './pages/reports/Reports';
import ProductCatalog from './pages/products/ProductCatalog';
import { 
  getStoredUser, 
  getStoredScreen, 
  saveSession, 
  saveActiveScreen, 
  clearSession 
} from './services/authService';
import './App.css';

/**
 * DealFlow360 - Root Application Coordinator
 * 
 * Features:
 * - Persistent login session across browser refresh (via localStorage)
 * - Remembers active screen on reload (Dashboard, Quotations, Approvals, etc.)
 * - Unified navigation and toast feedback
 */
export default function App() {
  // Initialize state directly from stored session on initial mount / page reload
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [currentScreen, setCurrentScreen] = useState(() => {
    const user = getStoredUser();
    if (user) {
      return getStoredScreen() || 'dashboard';
    }
    return 'auth';
  });
  
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // When screen changes, save to localStorage if user is authenticated
  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    if (currentUser) {
      saveActiveScreen(screen);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentScreen('dashboard');
    saveSession(user, 'dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentScreen('auth');
    showToast('Signed out of DealFlow360 session.');
  };

  // Render view corresponding to current active route
  const renderScreen = () => {
    // If not authenticated, always show Auth screen
    if (!currentUser || currentScreen === 'auth') {
      return (
        <Auth
          onLoginSuccess={handleLoginSuccess}
          onToast={showToast}
        />
      );
    }

    const commonProps = {
      user: currentUser,
      onNavigate: handleNavigate,
      onLogout: handleLogout,
      onToast: showToast
    };

    switch (currentScreen) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'quotations':
        return <Quotations {...commonProps} />;
      case 'approvals':
        return <Approvals {...commonProps} />;
      case 'fulfillment':
        return <Fulfillment {...commonProps} />;
      case 'subscriptions':
        return <Subscriptions {...commonProps} />;
      case 'invoices':
        return <Invoices {...commonProps} />;
      case 'dealhealth':
        return <DealHealth {...commonProps} />;
      case 'reports':
        return <Reports {...commonProps} />;
      case 'product':
        return <ProductCatalog {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="dealflow-app-root">
      {/* Global Toast Alert Notification */}
      <Toast 
        message={toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      {/* Active Screen View */}
      {renderScreen()}
    </div>
  );
}
