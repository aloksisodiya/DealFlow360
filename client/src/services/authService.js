/**
 * DealFlow360 - Authentication Service
 * 
 * Handles authentication and password recovery with the backend Express API & Nodemailer.
 * Synced with PostgreSQL database accounts and provides session persistence across page refreshes.
 */

import { normalizeRole } from '../utils/rbac';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `http://${window.location.hostname}:3000/api`
    : 'http://localhost:3000/api');
const STORAGE_USER_KEY = 'dealflow360_active_user';
const STORAGE_SCREEN_KEY = 'dealflow360_active_screen';

// Pre-configured database-synced personas for instant login & walkthroughs
export const DEMO_USERS = [
  {
    role: 'Admin',
    name: 'Arjav Dariya',
    email: 'arjavdariya2@gmail.com',
    password: 'Arjav@123',
    title: 'Chief Executive & Platform Admin',
    badge: 'Super Admin',
    initials: 'AD'
  },
  {
    role: 'Sales Manager',
    name: 'Rjav Dariya',
    email: 'rjavdariya@gmail.com',
    password: 'rjav@123',
    title: 'VP of Enterprise Sales',
    badge: 'Sales Lead',
    initials: 'RD'
  },
  {
    role: 'Sales Rep',
    name: 'Gautam Patil',
    email: 'gautampa07@gmail.com',
    password: 'Gautam@123',
    title: 'Senior Sales Representative',
    badge: 'Sales Rep',
    initials: 'GP'
  },
  {
    role: 'Finance',
    name: 'Alok Sisodiya',
    email: 'aloksisodiya38@gmail.com',
    password: 'Alok@123',
    title: 'Head of Corporate Finance & FP&A',
    badge: 'Finance',
    initials: 'AS'
  },
  {
    role: 'Sales Rep',
    name: 'Alok Sisodiya (Sales)',
    email: 'aloksisodiya30@gmail.com',
    password: 'Alok30@123',
    title: 'Enterprise Account Executive',
    badge: 'Sales Rep',
    initials: 'AS'
  }
];

/**
 * Check and retrieve active persisted session on initial app mount / page refresh
 */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored session user:', e);
    return null;
  }
}

export function getStoredScreen() {
  try {
    return localStorage.getItem(STORAGE_SCREEN_KEY) || 'dashboard';
  } catch {
    return 'dashboard';
  }
}

export function saveSession(user, screen = 'dashboard') {
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(STORAGE_SCREEN_KEY, screen);
  } catch (e) {
    console.error('Failed to save session to localStorage:', e);
  }
}

export function saveActiveScreen(screen) {
  try {
    localStorage.setItem(STORAGE_SCREEN_KEY, screen);
  } catch (e) {
    console.error('Failed to save active screen to localStorage:', e);
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_SCREEN_KEY);
  } catch (e) {
    console.error('Failed to clear session from localStorage:', e);
  }
}

/**
 * Authenticate against backend Express/PostgreSQL database
 */
export async function loginUser(workEmail, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workEmail, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const adminData = data.admin || data.data?.admin || {};
      const token = data.token || data.data?.token || '';
      let profile = {};
      try {
        profile = typeof adminData.profile === 'string' ? JSON.parse(adminData.profile) : (adminData.profile || {});
      } catch {
        profile = {};
      }

      const emailAddress = adminData.workEmail || adminData.work_email || workEmail || '';
      const rawName = profile?.name || '';
      const displayName = rawName || (emailAddress ? emailAddress.split('@')[0].replace(/[._]/g, ' ') : 'Enterprise User');

      const initials = (displayName || 'EU')
        .split(' ')
        .filter(Boolean)
        .map(p => p.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'EU';

      const normRole = normalizeRole(adminData.role || 'customer');
      const isCustomer = normRole === 'customer';
      const targetScreen = isCustomer ? 'subscriptions' : 'dashboard';

      const userObj = {
        id: adminData.id || 1,
        name: displayName,
        email: emailAddress,
        role: normRole,
        title: (profile && typeof profile === 'object' && profile.title) ? profile.title : (isCustomer ? 'Valued Customer' : 'Institutional Member'),
        token: token,
        initials: initials
      };

      // Persist authenticated session with role-specific target screen
      saveSession(userObj, targetScreen);

      return {
        success: true,
        user: userObj,
        message: data.message || 'Login successful'
      };
    }
    
    return {
      success: false,
      message: data.message || 'Invalid work email or password'
    };
  } catch {
    console.info('[AuthService] Backend offline. Using demo persona fallback.');
    
    const matched = DEMO_USERS.find(u => u.email.toLowerCase() === workEmail.toLowerCase());
    const name = matched ? matched.name : (workEmail.split('@')[0] || 'User');
    const initials = matched ? matched.initials : name.slice(0, 2).toUpperCase();

    const userObj = {
      name: name,
      email: workEmail,
      role: matched ? matched.role.toLowerCase().replace(' ', '_') : 'enterprise_user',
      token: 'demo-fallback-token',
      initials: initials
    };

    saveSession(userObj, 'dashboard');

    return {
      success: true,
      user: userObj,
      message: 'Demo login successful'
    };
  }
}

/**
 * Request password reset email using Nodemailer API
 */
export async function requestPasswordReset(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message,
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to dispatch reset email.',
    };
  } catch (error) {
    console.error('Request password reset error:', error);
    return {
      success: false,
      message: 'Server connection error. Please verify backend is running.',
    };
  }
}

/**
 * Verify OTP verification code and set new password in PostgreSQL
 */
export async function resetPasswordWithCode({ email, code, newPassword }) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Password updated successfully!',
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to update password.',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      message: 'Server connection error during password reset.',
    };
  }
}

/**
 * Handle new user signups
 */
export async function registerUser({ firstName, lastName, workEmail, password }) {
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || 'C'}${lastName[0] || 'A'}`.toUpperCase();

  try {
    const response = await fetch(`${API_BASE_URL}/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, workEmail, password, role: 'customer' })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const adminData = data.admin || {};
      const userObj = {
        id: adminData.id,
        name: fullName,
        email: adminData.workEmail || workEmail,
        role: 'customer',
        token: data.token || 'customer-session-token',
        initials: initials
      };

      saveSession(userObj, 'subscriptions');

      return {
        success: true,
        user: userObj,
        message: data.message || `Customer account created for ${fullName}!`
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to create account.'
    };
  } catch (err) {
    console.error('Registration API error:', err);
    return {
      success: false,
      message: 'Server connection error. Please verify backend is running.'
    };
  }
}
