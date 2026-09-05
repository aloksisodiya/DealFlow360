import { api } from './apiClient';

/**
 * DealFlow360 - Admin Panel & Employee Governance Service
 * 
 * Provides API integrations for managing employees, provisioning IDs,
 * assigning sales leagues/tiers, updating access roles, and executing admin commands.
 */

export async function fetchEmployees() {
  try {
    const res = await api.get('/admin/accounts');
    return res.data || [];
  } catch (error) {
    console.error('Error fetching employee directory:', error);
    throw error;
  }
}

export async function createEmployee(employeeData) {
  try {
    const res = await api.post('/admin/accounts', employeeData);
    return res.data;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
}

export async function updateEmployee(id, updates) {
  try {
    const res = await api.patch(`/admin/accounts/${id}`, updates);
    return res.data;
  } catch (error) {
    console.error(`Error updating employee ${id}:`, error);
    throw error;
  }
}

export async function deleteEmployee(id) {
  try {
    const res = await api.delete(`/admin/accounts/${id}`);
    return res;
  } catch (error) {
    console.error(`Error deleting employee ${id}:`, error);
    throw error;
  }
}
