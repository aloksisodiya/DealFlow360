/**
 * DealFlow360 - Role-Based Access Control (RBAC) Governance Matrix
 * 
 * Defines authorized screens, tool capabilities, and permissions for each platform role:
 * - Sales Rep
 * - Sales Manager / Approver
 * - Finance / Operations User
 * - Admin (Full Unrestricted Access)
 */

export function normalizeRole(role) {
  if (!role) return 'sales_rep';
  const r = role.toLowerCase().replace(/[\s_-]+/g, '');
  if (r.includes('customer') || r.includes('client') || r.includes('consumer')) return 'customer';
  if (r.includes('admin') || r.includes('superadmin')) return 'admin';
  if (r.includes('manager') || r.includes('approver') || r.includes('lead')) return 'sales_manager';
  if (r.includes('finance') || r.includes('operations') || r.includes('billing')) return 'finance';
  return 'sales_rep';
}

export const ROLE_PERMISSIONS = {
  // Customer:
  // - Direct access to active proposals & quotations, subscriptions, recurring billing details, and customer portal
  customer: [
    'quotations',
    'subscriptions',
    'invoices'
  ],

  // Sales Rep:
  // - Builds quotations, applies discounts, adds upsell items
  // - Tracks approval status and fulfillment progress
  // - Responds to customer negotiation requests
  sales_rep: [
    'dashboard',
    'quotations',
    'approvals',
    'fulfillment',
    'product'
  ],

  // Sales Manager / Approver:
  // - Reviews and approves or rejects quotations that exceed discount thresholds
  // - Configures discount tiers and approval chains
  // - Monitors deal health dashboard for at risk deals
  sales_manager: [
    'dashboard',
    'quotations',
    'approvals',
    'dealhealth',
    'product'
  ],

  // Finance / Operations User:
  // - Handles second level approvals for high risk discounts
  // - Manages warehouse fulfillment splits and backorder decisions
  // - Reconciles recurring billing and credit notes
  finance: [
    'dashboard',
    'approvals',
    'fulfillment',
    'subscriptions',
    'invoices',
    'product'
  ],

  // Admin:
  // - Manages backend setup: products, price lists, discount tiers, warehouses, subscription plans
  // - Views platform wide analytics and reporting
  // - Full access to all tools and modules
  admin: [
    'dashboard',
    'quotations',
    'approvals',
    'fulfillment',
    'subscriptions',
    'invoices',
    'dealhealth',
    'reports',
    'product',
    'admin'
  ]
};

/**
 * Check if the user is authorized to access a given screen
 */
export function hasAccess(user, screenKey) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  const allowedScreens = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.sales_rep;
  return allowedScreens.includes(screenKey);
}

/**
 * Check if user has quotation decision authority (Approve / Reject)
 */
export function canApproveQuotes(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'sales_manager' || role === 'finance' || role === 'admin';
}

/**
 * Check if user can manage warehouse fulfillment splits and stock overrides
 */
export function canManageFulfillment(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'finance' || role === 'admin';
}

/**
 * Check if user can manage billing, credit notes, and subscriptions
 */
export function canManageBilling(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'finance' || role === 'admin';
}

/**
 * Check if user can manage products, price lists, and system backend setup
 */
export function canSetupBackend(user) {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return role === 'admin';
}

/**
 * Human-readable display name for user role
 */
export function getRoleDisplayName(role) {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return 'Platform Admin';
    case 'sales_manager':
      return 'Sales Manager / Approver';
    case 'finance':
      return 'Finance & Operations';
    case 'customer':
      return 'Valued Customer Account';
    case 'sales_rep':
    default:
      return 'Sales Representative';
  }
}
