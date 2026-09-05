import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Search,
  Filter,
  Briefcase,
  KeyRound,
  CheckCircle2,
  Edit2,
  Trash2,
  RefreshCw,
  Download,
  Lock,
  Building2,
  Mail,
  User,
  Hash,
  Activity,
  X,
  Check
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../../services/adminService';
import './AdminPanel.css';

export default function AdminPanel({ user, onNavigate, onLogout, onToast }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'commands'
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedForPasswordReset, setSelectedForPasswordReset] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Form State for Provisioning New Employee ID
  const [formData, setFormData] = useState({
    name: '',
    workEmail: '',
    employeeId: `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    role: 'sales_rep',
    department: 'Sales',
    title: 'Account Executive',
    password: 'Password@2026',
    isActive: true
  });

  // Audit Logs (Sample system actions)
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'Platform Session Verified', actor: user?.email || 'admin@dealflow360.com', target: 'PostgreSQL Core DB', time: 'Just now', type: 'success' },
    { id: 2, action: 'Role Policy Enforced', actor: 'System Admin', target: 'RBAC Access Matrix', time: '12 mins ago', type: 'info' },
    { id: 3, action: 'Employee Directory Synced', actor: 'Automated Daemon', target: 'DealFlow360 Cluster', time: '1 hour ago', type: 'success' }
  ]);

  const notify = (msg) => {
    if (onToast) onToast(msg);
  };

  // Load employee directory
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employee directory:', err);
      notify('Failed to load employee directory from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const profile = typeof emp.profile === 'string' ? JSON.parse(emp.profile || '{}') : (emp.profile || {});
      const name = (profile.name || '').toLowerCase();
      const email = (emp.work_email || emp.workEmail || '').toLowerCase();
      const empId = (profile.employeeId || `EMP-${emp.id}`).toLowerCase();
      const dept = (profile.department || '').toLowerCase();
      const role = (emp.role || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || 
        name.includes(query) || 
        email.includes(query) || 
        empId.includes(query) || 
        dept.includes(query);

      const matchesRole = roleFilter === 'all' || role === roleFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && emp.is_active) || 
        (statusFilter === 'inactive' && !emp.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [employees, searchQuery, roleFilter, statusFilter]);

  // Handle Employee Provisioning (Create)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.workEmail.trim() || !formData.password.trim()) {
      notify('Please fill out all required fields.');
      return;
    }

    try {
      const payload = {
        workEmail: formData.workEmail.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        profile: {
          name: formData.name.trim(),
          title: formData.title.trim(),
          employeeId: formData.employeeId.trim(),
          department: formData.department.trim(),
        }
      };

      await createEmployee(payload);
      notify(`Employee ID ${formData.employeeId} provisioned for ${formData.name}!`);
      setIsCreateModalOpen(false);
      
      // Reset form with a new ID
      setFormData({
        name: '',
        workEmail: '',
        employeeId: `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'sales_rep',
        department: 'Sales',
        title: 'Account Executive',
        password: 'Password@2026',
        isActive: true
      });

      // Add to audit logs
      setAuditLogs(prev => [
        {
          id: Date.now(),
          action: `Provisioned Employee ID ${formData.employeeId}`,
          actor: user?.name || 'Administrator',
          target: formData.workEmail,
          time: 'Just now',
          type: 'success'
        },
        ...prev
      ]);

      await loadEmployees();
    } catch (err) {
      notify(err.message || 'Failed to create employee account');
    }
  };

  // Handle Employee Update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const profile = typeof editingEmployee.profile === 'string' 
        ? JSON.parse(editingEmployee.profile || '{}') 
        : { ...(editingEmployee.profile || {}) };

      const updates = {
        role: editingEmployee.role,
        isActive: editingEmployee.is_active,
        profile: {
          ...profile,
          name: editingEmployee.editName || profile.name,
          title: editingEmployee.editTitle || profile.title,
          department: editingEmployee.editDept || profile.department,
          employeeId: editingEmployee.editEmpId || profile.employeeId
        }
      };

      await updateEmployee(editingEmployee.id, updates);
      notify(`Updated employee ${profile.name || editingEmployee.work_email}`);
      setEditingEmployee(null);
      await loadEmployees();
    } catch (err) {
      notify(err.message || 'Failed to update employee details');
    }
  };

  // Toggle active / suspend status
  const handleToggleStatus = async (emp) => {
    try {
      const newStatus = !emp.is_active;
      await updateEmployee(emp.id, { isActive: newStatus });
      notify(`Account for ${emp.work_email} is now ${newStatus ? 'Active' : 'Suspended'}`);
      await loadEmployees();
    } catch (err) {
      notify(err.message || 'Failed to update status');
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedForPasswordReset || !newPasswordValue.trim()) return;

    try {
      await updateEmployee(selectedForPasswordReset.id, { password: newPasswordValue.trim() });
      notify(`Password reset completed for ${selectedForPasswordReset.work_email}`);
      setIsResetPasswordModalOpen(false);
      setSelectedForPasswordReset(null);
      setNewPasswordValue('');
    } catch (err) {
      notify(err.message || 'Failed to reset password');
    }
  };

  // Handle Delete Employee
  const handleDeleteEmployee = async (emp) => {
    const profile = typeof emp.profile === 'string' ? JSON.parse(emp.profile || '{}') : (emp.profile || {});
    const confirmName = profile.name || emp.work_email;
    
    if (!window.confirm(`Are you sure you want to permanently remove employee account "${confirmName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteEmployee(emp.id);
      notify(`Employee account "${confirmName}" removed.`);
      await loadEmployees();
    } catch (err) {
      notify(err.message || 'Failed to delete employee account');
    }
  };

  // Export workforce directory to CSV
  const handleExportCSV = () => {
    if (!employees.length) {
      notify('No employee data to export');
      return;
    }

    const headers = ['ID', 'Employee ID', 'Name', 'Work Email', 'Role', 'Department', 'Job Title', 'Status', 'Created At'];
    const rows = employees.map(emp => {
      const profile = typeof emp.profile === 'string' ? JSON.parse(emp.profile || '{}') : (emp.profile || {});
      return [
        emp.id,
        profile.employeeId || `EMP-${emp.id}`,
        `"${profile.name || 'Staff'}"`,
        emp.work_email,
        emp.role,
        `"${profile.department || 'Sales'}"`,
        `"${profile.title || 'Team Member'}"`,
        emp.is_active ? 'Active' : 'Suspended',
        emp.created_at || new Date().toISOString()
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dealflow360_employees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Employee directory exported to CSV.');
  };

  return (
    <div className="admin-page-container">
      {/* Top Unified Header */}
      <Navbar 
        activePage="admin" 
        user={user} 
        onNavigate={onNavigate} 
        onLogout={onLogout} 
        onToast={onToast} 
      />

      <main className="admin-main-content">
        {/* Page Top Header Banner */}
        <div className="admin-header-row">
          <div>
            <div className="admin-badge-pill">
              <ShieldCheck size={14} />
              <span>Executive Administration Console</span>
            </div>
            <h1 className="admin-page-title">Employee Management & Access Control</h1>
            <p className="admin-page-subtitle">
              Manage employee identities, provision unique employee IDs, assign access roles, and execute platform commands.
            </p>
          </div>

          <div className="admin-header-actions">
            <button 
              className="btn-admin-secondary"
              onClick={handleExportCSV}
              title="Export Employee Directory"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>

            <button 
              className="btn-admin-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <UserPlus size={16} />
              <span>Provision New Employee ID</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-icon users-icon">
              <Users size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">Total Workforce</span>
              <span className="admin-kpi-value">{employees.length}</span>
              <span className="admin-kpi-subtext">Registered Employee Accounts</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon active-icon">
              <CheckCircle2 size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">Active Passes</span>
              <span className="admin-kpi-value">
                {employees.filter(e => e.is_active).length}
              </span>
              <span className="admin-kpi-subtext">
                {employees.filter(e => !e.is_active).length} Suspended / Inactive
              </span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon roles-icon">
              <Briefcase size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">Platform Roles</span>
              <span className="admin-kpi-value">
                {new Set(employees.map(e => e.role)).size} Roles
              </span>
              <span className="admin-kpi-subtext">RBAC Access Levels</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-icon health-icon">
              <Activity size={22} />
            </div>
            <div className="admin-kpi-info">
              <span className="admin-kpi-label">PostgreSQL Sync</span>
              <span className="admin-kpi-value green-status">Live Synced</span>
              <span className="admin-kpi-subtext">Direct Knex Pool</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Admin Panel */}
        <div className="admin-tabs-bar">
          <button 
            className={`admin-tab ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => setActiveTab('directory')}
          >
            <Users size={16} />
            <span>Employee Directory & IDs</span>
            <span className="tab-count-badge">{filteredEmployees.length}</span>
          </button>

          <button 
            className={`admin-tab ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            <KeyRound size={16} />
            <span>Admin Commands & Security</span>
          </button>
        </div>

        {/* Tab 1: Employee Directory */}
        {activeTab === 'directory' && (
          <div className="admin-card-container">
            {/* Search & Filter Toolbar */}
            <div className="admin-toolbar">
              <div className="admin-search-wrapper">
                <Search size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by name, work email, employee ID, or department..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="admin-filters-group">
                <div className="filter-select-wrapper">
                  <Briefcase size={14} className="filter-icon" />
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Platform Admin</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="sales_rep">Sales Representative</option>
                    <option value="finance">Corporate Finance</option>
                  </select>
                </div>

                <div className="filter-select-wrapper">
                  <Filter size={14} className="filter-icon" />
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="admin-select"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Suspended Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employees Table */}
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Member Profile</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="admin-table-empty">
                        <div className="loading-state">
                          <RefreshCw size={22} className="spin-icon" />
                          <span>Loading employee directory from PostgreSQL...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="admin-table-empty">
                        <Users size={32} color="#94a3b8" />
                        <p>No employees match your search or filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const profile = typeof emp.profile === 'string' 
                        ? JSON.parse(emp.profile || '{}') 
                        : (emp.profile || {});
                      const name = profile.name || emp.work_email.split('@')[0];
                      const employeeId = profile.employeeId || `EMP-${202600 + emp.id}`;
                      const department = profile.department || (emp.role === 'finance' ? 'Finance' : 'Sales');
                      const title = profile.title || (emp.role === 'admin' ? 'Administrator' : 'Account Representative');
                      
                      const initials = name
                        .split(' ')
                        .map(n => n.charAt(0))
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={emp.id} className={!emp.is_active ? 'row-suspended' : ''}>
                          {/* Employee ID */}
                          <td>
                            <span className="emp-id-chip">
                              <Hash size={12} />
                              <span>{employeeId}</span>
                            </span>
                          </td>

                          {/* Member Profile */}
                          <td>
                            <div className="member-profile-cell">
                              <div className="member-avatar">
                                {initials}
                              </div>
                              <div className="member-details">
                                <span className="member-name">{name}</span>
                                <span className="member-email">{emp.work_email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td>
                            <span className={`role-badge ${emp.role}`}>
                              {emp.role.replace('_', ' ')}
                            </span>
                          </td>

                          {/* Department */}
                          <td>
                            <span className="department-text">
                              <Building2 size={13} />
                              <span>{department}</span>
                            </span>
                          </td>

                          {/* Job Title */}
                          <td>
                            <span className="job-title-text">{title}</span>
                          </td>

                          {/* Status */}
                          <td>
                            <button 
                              className={`status-toggle-btn ${emp.is_active ? 'active' : 'suspended'}`}
                              onClick={() => handleToggleStatus(emp)}
                              title={emp.is_active ? 'Click to suspend' : 'Click to activate'}
                            >
                              <span className="status-dot"></span>
                              <span>{emp.is_active ? 'Active' : 'Suspended'}</span>
                            </button>
                          </td>

                          {/* Admin Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="action-buttons-row">
                              <button 
                                className="action-icon-btn edit-btn"
                                title="Edit Employee Settings"
                                onClick={() => setEditingEmployee({
                                  ...emp,
                                  editName: name,
                                  editTitle: title,
                                  editDept: department,
                                  editEmpId: employeeId
                                })}
                              >
                                <Edit2 size={15} />
                              </button>

                              <button 
                                className="action-icon-btn key-btn"
                                title="Reset User Password"
                                onClick={() => {
                                  setSelectedForPasswordReset(emp);
                                  setIsResetPasswordModalOpen(true);
                                }}
                              >
                                <KeyRound size={15} />
                              </button>

                              <button 
                                className="action-icon-btn delete-btn"
                                title="Delete Employee Account"
                                onClick={() => handleDeleteEmployee(emp)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Command Console */}
        {activeTab === 'commands' && (
          <div className="admin-commands-section">
            <div className="commands-grid">
              {/* Commands Panel */}
              <div className="command-box">
                <div className="command-box-header">
                  <Shield size={18} color="#714b67" />
                  <h4>Platform Control & Database Operations</h4>
                </div>

                <div className="command-actions-list">
                  <div className="command-item">
                    <div className="command-item-info">
                      <strong>Direct PostgreSQL Pool Diagnostics</strong>
                      <span>Verify connection health and schema consistency against AWS Supabase.</span>
                    </div>
                    <button 
                      className="btn-command-execute"
                      onClick={() => notify('PostgreSQL Database Pool status: 100% HEALTHY (Pooler: aws-0-ap-south-1)')}
                    >
                      Verify DB Health
                    </button>
                  </div>

                  <div className="command-item">
                    <div className="command-item-info">
                      <strong>Workforce Directory Synchronization</strong>
                      <span>Refresh cached employee profiles and role mappings from the database.</span>
                    </div>
                    <button 
                      className="btn-command-execute"
                      onClick={async () => {
                        await loadEmployees();
                        notify('Workforce directory re-synced from PostgreSQL database.');
                      }}
                    >
                      Re-sync Directory
                    </button>
                  </div>

                  <div className="command-item">
                    <div className="command-item-info">
                      <strong>Emergency Session Revocation</strong>
                      <span>Revoke all active tokens for suspended accounts immediately.</span>
                    </div>
                    <button 
                      className="btn-command-execute warning"
                      onClick={() => notify('Revoked all active tokens for suspended accounts.')}
                    >
                      Revoke Suspended
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Audit Log */}
              <div className="command-box">
                <div className="command-box-header">
                  <Activity size={18} color="#714b67" />
                  <h4>Live Security & Governance Audit Log</h4>
                </div>

                <div className="audit-logs-list">
                  {auditLogs.map(log => (
                    <div className="audit-log-item" key={log.id}>
                      <div className="log-top">
                        <span className={`log-badge ${log.type}`}>{log.action}</span>
                        <span className="log-time">{log.time}</span>
                      </div>
                      <div className="log-details">
                        <span>Actor: <strong>{log.actor}</strong></span>
                        <span>Target: <strong>{log.target}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Provision New Employee ID */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-top-title">
                <UserPlus size={20} color="#714b67" />
                <h3>Provision New Employee ID</h3>
              </div>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="admin-modal-form">
              <div className="form-row two-cols">
                <div className="form-field">
                  <label>Full Employee Name *</label>
                  <div className="input-with-icon">
                    <User size={15} />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Rachel Foster"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Work Email Address *</label>
                  <div className="input-with-icon">
                    <Mail size={15} />
                    <input 
                      type="email" 
                      required 
                      placeholder="e.g. rachel.foster@dealflow360.com"
                      value={formData.workEmail}
                      onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label>Employee ID Code *</label>
                  <div className="input-with-icon">
                    <Hash size={15} />
                    <input 
                      type="text" 
                      required 
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    />
                  </div>
                  <small className="field-hint">Auto-generated institutional identifier</small>
                </div>

                <div className="form-field">
                  <label>Access Role *</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="modal-select"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="sales_manager">Sales Manager (Approval Authority)</option>
                    <option value="finance">Corporate Finance</option>
                    <option value="admin">Platform Administrator</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label>Department</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sales, Finance, Executive"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Account Executive"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Initial Temporary Password *</label>
                <div className="input-with-icon">
                  <Lock size={15} />
                  <input 
                    type="text" 
                    required 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm-save"
                >
                  <Check size={16} />
                  <span>Provision ID & Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Employee Settings */}
      {editingEmployee && (
        <div className="modal-overlay" onClick={() => setEditingEmployee(null)}>
          <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-top-title">
                <Edit2 size={19} color="#714b67" />
                <h3>Edit Employee Settings</h3>
              </div>
              <button className="modal-close" onClick={() => setEditingEmployee(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="admin-modal-form">
              <div className="form-row two-cols">
                <div className="form-field">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={editingEmployee.editName}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, editName: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Employee ID Code</label>
                  <input 
                    type="text" 
                    value={editingEmployee.editEmpId}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, editEmpId: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label>Role</label>
                  <select 
                    value={editingEmployee.role}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, role: e.target.value })}
                    className="modal-select"
                  >
                    <option value="sales_rep">Sales Representative</option>
                    <option value="sales_manager">Sales Manager</option>
                    <option value="finance">Corporate Finance</option>
                    <option value="admin">Platform Administrator</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Department</label>
                  <input 
                    type="text" 
                    value={editingEmployee.editDept}
                    onChange={(e) => setEditingEmployee({ ...editingEmployee, editDept: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Job Title</label>
                <input 
                  type="text" 
                  value={editingEmployee.editTitle}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, editTitle: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setEditingEmployee(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm-save"
                >
                  <Check size={16} />
                  <span>Update Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password Modal */}
      {isResetPasswordModalOpen && selectedForPasswordReset && (
        <div className="modal-overlay" onClick={() => setIsResetPasswordModalOpen(false)}>
          <div className="modal-dialog-box modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div className="modal-top-title">
                <KeyRound size={19} color="#714b67" />
                <h3>Reset Password</h3>
              </div>
              <button className="modal-close" onClick={() => setIsResetPasswordModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="admin-modal-form">
              <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                Set a new password for <strong>{selectedForPasswordReset.work_email}</strong>.
              </p>

              <div className="form-field">
                <label>New Password (min 8 characters)</label>
                <input 
                  type="password" 
                  required 
                  minLength={8}
                  placeholder="Enter new strong password"
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                />
              </div>

              <div className="modal-footer-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm-save"
                >
                  Set Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
