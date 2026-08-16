import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/common/Navbar';
import { fetchUsers, createUser, deleteUser } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { 
  UserCog, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Users, 
  Shield, 
  UserCheck, 
  Eye, 
  Search, 
  Filter, 
  ChevronDown,
  RotateCcw,
  Building2,
  X
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const UsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Recruiter',
    department: 'Talent Acquisition'
  });
  const [errors, setErrors] = useState({});

  // Confirm delete dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, userName: '' });
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Aparaitech | Recruiter Team Management';
    loadData();
  }, []);

  // Compute dynamic KPI metrics from user data
  const totalMembers = users.length;
  const adminCount = useMemo(() => users.filter(u => u.role === 'Admin').length, [users]);
  const recruiterCount = useMemo(() => users.filter(u => u.role === 'Recruiter').length, [users]);
  const viewerCount = useMemo(() => users.filter(u => u.role === 'Viewer').length, [users]);

  // Frontend filter logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        (u.name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.department || '').toLowerCase().includes(query);

      const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;

      const isUserActive = u.status !== false && u.status !== 'Inactive';
      const statusStr = isUserActive ? 'Active' : 'Inactive';
      const matchesStatus = statusFilter === 'All Statuses' || statusStr === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const hasActiveFilters = searchQuery !== '' || roleFilter !== 'All Roles' || statusFilter !== 'All Statuses';

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All Roles');
    setStatusFilter('All Statuses');
  };

  const validateUserForm = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errs.name = 'Full name is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    
    // Password validation: min 6 chars, uppercase, lowercase, number
    if (!formData.password || formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    } else {
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      if (!hasUpper || !hasLower || !hasNumber) {
        errs.password = 'Password must contain uppercase, lowercase, and a number (e.g. Admin@123)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateUserForm()) return;

    setSaving(true);
    try {
      await createUser(formData);
      toast.success('New team account created successfully!');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'Recruiter', department: 'Talent Acquisition' });
      setErrors({});
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteUser(deleteConfirm.id);
      toast.success('Team member account deleted');
      setDeleteConfirm({ isOpen: false, id: null, userName: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Navbar title="Recruiter Team Management" />

      <div className="page-container">
        {/* 1. Page Header */}
        <div className="d-flex align-items-sm-center justify-content-between mb-4 flex-column flex-sm-row gap-3">
          <div>
            <div className="text-uppercase text-primary fw-bold tracking-wider fs-8 mb-1" style={{ letterSpacing: '0.08em' }}>
              TEAM & ACCESS
            </div>
            <h4 className="fw-bold text-dark m-0">Recruiter Team Management</h4>
            <p className="text-muted small m-0 mt-0.5">Manage team members, roles, departments and platform access.</p>
          </div>

          <Button 
            variant="primary" 
            icon={Plus} 
            onClick={() => setShowModal(true)}
            aria-label="Create Team Account"
            style={{ borderRadius: '10px', height: '40px' }}
          >
            Create Team Account
          </Button>
        </div>

        {/* 2. Team Summary Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="p-2.5 rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
                  <Users size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                    TOTAL MEMBERS
                  </div>
                  <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                    {loading ? '-' : totalMembers}
                  </div>
                  <div className="text-muted fs-8">Active team accounts</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="p-2.5 rounded-3 bg-indigo-subtle text-indigo d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                    ADMINS
                  </div>
                  <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                    {loading ? '-' : adminCount}
                  </div>
                  <div className="text-muted fs-8">Full control access</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="p-2.5 rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
                  <UserCheck size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                    RECRUITERS
                  </div>
                  <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                    {loading ? '-' : recruiterCount}
                  </div>
                  <div className="text-muted fs-8">Campaign managers</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-xl-3">
            <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="p-2.5 rounded-3 bg-warning-subtle text-warning d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
                  <Eye size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                    VIEWERS
                  </div>
                  <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                    {loading ? '-' : viewerCount}
                  </div>
                  <div className="text-muted fs-8">Read-only access</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Search + Filter Toolbar & Team Members Table Container */}
        <div className="card border shadow-sm rounded-4 bg-surface p-0 overflow-hidden" style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}>
          {/* Polished Enterprise SaaS Filter Toolbar */}
          <div className="p-3 border-bottom bg-body-tertiary">
            <div className="d-flex align-items-center gap-2.5 w-100 flex-wrap flex-md-nowrap">
              {/* Filter Icon Container */}
              <div 
                className={`p-2 rounded-3 border d-flex align-items-center justify-content-center flex-shrink-0 transition-colors ${
                  hasActiveFilters ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-white text-muted border-secondary-subtle'
                }`}
                style={{ width: '44px', height: '44px', borderRadius: '10px' }}
                title={hasActiveFilters ? 'Filters active' : 'Filter team members'}
              >
                <Filter size={18} />
              </div>

              {/* Search Input */}
              <div className="position-relative flex-grow-1" style={{ minWidth: '220px' }}>
                <Search size={17} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search team members by name, email, or department..."
                  aria-label="Search team members"
                  className="form-control ps-5 bg-white border text-dark shadow-none"
                  style={{ 
                    height: '44px', 
                    borderRadius: '10px', 
                    fontSize: '0.875rem',
                    borderColor: searchQuery ? 'var(--bs-primary, #4F46E5)' : '#DDE3EC'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="btn btn-sm btn-link text-muted p-1 position-absolute top-50 end-0 translate-middle-y me-2 border-0 d-flex align-items-center justify-content-center"
                    aria-label="Clear search text"
                    style={{ width: '28px', height: '28px' }}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Filter Controls Group */}
              <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap flex-shrink-0 ms-auto">
                {/* Role Select */}
                <div className="position-relative" style={{ width: '145px' }}>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    aria-label="Filter team members by role"
                    className={`form-select form-select-custom w-100 pe-4 border transition-colors ${
                      roleFilter !== 'All Roles' ? 'bg-primary-subtle text-primary border-primary fw-semibold' : 'bg-white text-dark border-secondary-subtle'
                    }`}
                    style={{ 
                      height: '44px', 
                      borderRadius: '10px', 
                      fontSize: '0.875rem',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                      paddingLeft: '12px'
                    }}
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <ChevronDown 
                    size={16} 
                    className={`position-absolute top-50 end-0 translate-middle-y me-2.5 pointer-events-none ${
                      roleFilter !== 'All Roles' ? 'text-primary' : 'text-muted'
                    }`} 
                  />
                </div>

                {/* Status Select */}
                <div className="position-relative" style={{ width: '155px' }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter team members by status"
                    className={`form-select form-select-custom w-100 pe-4 border transition-colors ${
                      statusFilter !== 'All Statuses' ? 'bg-primary-subtle text-primary border-primary fw-semibold' : 'bg-white text-dark border-secondary-subtle'
                    }`}
                    style={{ 
                      height: '44px', 
                      borderRadius: '10px', 
                      fontSize: '0.875rem',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                      paddingLeft: '12px'
                    }}
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <ChevronDown 
                    size={16} 
                    className={`position-absolute top-50 end-0 translate-middle-y me-2.5 pointer-events-none ${
                      statusFilter !== 'All Statuses' ? 'text-primary' : 'text-muted'
                    }`} 
                  />
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="btn btn-sm btn-ghost-custom text-primary fs-8 fw-semibold px-2.5 rounded-2 d-inline-flex align-items-center gap-1.5 transition-colors border-0 flex-shrink-0"
                    aria-label="Clear all applied filters"
                    style={{ height: '44px', fontSize: '0.85rem' }}
                  >
                    <RotateCcw size={15} />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>MEMBER</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>DEPARTMENT</th>
                  <th>STATUS</th>
                  <th>DATE ADDED</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={7} />
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title={hasActiveFilters ? "No matching team members" : "No user accounts yet"}
                        description={hasActiveFilters ? "Try adjusting your search query or role/status filters." : "Create user accounts for recruiters and view-only auditors."}
                        actionText={!hasActiveFilters ? "Create Account" : null}
                        onAction={() => setShowModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => {
                    const isActive = u.status !== false && u.status !== 'Inactive';
                    const initials = u.name?.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

                    return (
                      <tr 
                        key={u._id} 
                        style={{ height: '72px', transition: 'background-color 150ms ease' }}
                        className="hover-bg-light"
                      >
                        {/* Member Column: Avatar + Name + Subtitle */}
                        <td style={{ whiteSpace: 'normal', minWidth: '220px' }}>
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold fs-7 flex-shrink-0 ${
                                u.role === 'Admin' 
                                  ? 'bg-primary text-white shadow-sm' 
                                  : u.role === 'Recruiter' 
                                  ? 'bg-success-subtle text-success border border-success-subtle' 
                                  : 'bg-warning-subtle text-warning border border-warning-subtle'
                              }`} 
                              style={{ width: '42px', height: '42px', fontSize: '0.85rem' }}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="fw-bold text-dark fs-7 d-flex align-items-center gap-1.5" style={{ lineHeight: 1.3 }}>
                                {u.name}
                                {u.role === 'Admin' && (
                                  <ShieldCheck size={15} className="text-primary flex-shrink-0" title="System Administrator" />
                                )}
                              </div>
                              <div className="text-muted fs-8 mt-0.5" style={{ fontSize: '0.75rem' }}>
                                {u.role === 'Admin' ? 'System Administrator' : u.role === 'Recruiter' ? 'Campaign Manager' : 'Read-Only Auditor'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email Column: No Truncation */}
                        <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: '220px' }}>
                          <span className="fw-medium text-dark">{u.email}</span>
                        </td>

                        {/* Role Column */}
                        <td>
                          <StatusBadge status={u.role} type="role" />
                        </td>

                        {/* Department Column */}
                        <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', minWidth: '170px' }}>
                          <span className="text-secondary fw-medium fs-8 d-inline-flex align-items-center gap-1.5">
                            <Building2 size={14} className="text-muted flex-shrink-0" />
                            {u.department || 'Talent Acquisition'}
                          </span>
                        </td>

                        {/* Status Column */}
                        <td>
                          <span className={`badge rounded-pill px-2.5 py-1 fs-8 fw-semibold d-inline-flex align-items-center gap-1.5 ${
                            isActive 
                              ? 'bg-success-subtle text-success border border-success-subtle' 
                              : 'bg-secondary-subtle text-secondary border border-secondary-subtle'
                          }`}>
                            <span className={`p-1 rounded-circle ${isActive ? 'bg-success animate-pulse' : 'bg-secondary'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Date Added Column */}
                        <td className="text-muted small">{formatDate(u.createdAt)}</td>

                        {/* Actions Column */}
                        <td className="text-end">
                          <div className="d-inline-flex align-items-center gap-1">
                            <button 
                              onClick={() => setDeleteConfirm({ isOpen: true, id: u._id, userName: u.name })} 
                              className="btn btn-sm btn-outline-danger p-1.5 rounded-2 d-inline-flex align-items-center justify-content-center" 
                              title={`Delete ${u.name}'s account`}
                              aria-label={`Delete ${u.name}'s account`}
                              style={{ width: '34px', height: '34px', borderRadius: '8px' }}
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

        {/* 4. Roles & Permissions Information Banner */}
        <div 
          className="mt-4 p-3.5 rounded-4 border bg-surface d-flex align-items-sm-center justify-content-between flex-column flex-sm-row gap-3"
          style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}
        >
          <div className="d-flex align-items-start gap-3">
            <div className="p-2.5 rounded-3 bg-primary-subtle text-primary flex-shrink-0 mt-0.5" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h6 className="fw-bold text-dark m-0 fs-7">Roles & Permissions</h6>
              <p className="text-muted fs-8 m-0 mt-0.5" style={{ lineHeight: 1.4 }}>
                Admins have full control. Recruiters can create and manage campaigns. Viewers have read-only access to reports and data.
              </p>
            </div>
          </div>
          <Button 
            variant="outline-custom" 
            size="sm" 
            onClick={() => setShowPermissionsModal(true)}
            aria-label="View Role Permissions matrix"
            style={{ height: '36px', borderRadius: '8px', whiteSpace: 'nowrap' }}
          >
            View Role Permissions
          </Button>
        </div>

        {/* 5. Create Team Account Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Team Account"
          subtitle="Add a new team member and configure recruitment platform access."
          size="md"
          footer={
            <div className="d-flex align-items-center justify-content-end gap-2 w-100">
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateUser} loading={saving}>
                Create Account
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateUser} className="d-flex flex-column gap-3">
            {/* Section 1: Basic Information */}
            <div>
              <div className="text-uppercase text-muted fw-bold fs-8 mb-2 pb-1 border-bottom" style={{ fontSize: '0.675rem', letterSpacing: '0.05em' }}>
                BASIC INFORMATION
              </div>
              <div className="d-flex flex-column gap-2.5">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                  placeholder="e.g. Lead Recruiter"
                />

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                  placeholder="e.g. recruiter@aparaitech.com"
                />

                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  helpText="Min 6 characters with uppercase, lowercase, and a number (e.g. Admin@123)"
                  required
                />
              </div>
            </div>

            {/* Section 2: Access & Permissions */}
            <div>
              <div className="text-uppercase text-muted fw-bold fs-8 mb-2 pb-1 border-bottom" style={{ fontSize: '0.675rem', letterSpacing: '0.05em' }}>
                ACCESS & PERMISSIONS
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <Select
                    label="Role"
                    name="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    options={['Recruiter', 'Admin', 'Viewer']}
                    required
                  />
                </div>
                <div className="col-6">
                  <Input
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Campus Hiring"
                  />
                </div>
              </div>
            </div>
          </form>
        </Modal>

        {/* 6. Role Permissions Matrix Modal */}
        <Modal
          isOpen={showPermissionsModal}
          onClose={() => setShowPermissionsModal(false)}
          title="Roles & Access Permissions"
          subtitle="Platform access breakdown across user roles."
          size="md"
        >
          <div className="d-flex flex-column gap-3">
            <div className="p-3 rounded-3 border bg-body-tertiary">
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <span className="badge badge-custom badge-admin">Admin</span>
                <span className="fw-bold text-dark fs-7">Full System Administrator</span>
              </div>
              <p className="text-muted fs-8 m-0" style={{ lineHeight: 1.4 }}>
                Full access to manage recruiters, upload student database, execute campaigns, view audit logs, suppress email addresses, and configure system settings.
              </p>
            </div>

            <div className="p-3 rounded-3 border bg-body-tertiary">
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <span className="badge badge-custom badge-recruiter">Recruiter</span>
                <span className="fw-bold text-dark fs-7">Campaign & Outreach Manager</span>
              </div>
              <p className="text-muted fs-8 m-0" style={{ lineHeight: 1.4 }}>
                Can add student profiles, import CSV datasets, compose and dispatch email blasts, create templates, and monitor campaign delivery performance.
              </p>
            </div>

            <div className="p-3 rounded-3 border bg-body-tertiary">
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <span className="badge badge-custom badge-viewer">Viewer</span>
                <span className="fw-bold text-dark fs-7">Read-Only Placement Auditor</span>
              </div>
              <p className="text-muted fs-8 m-0" style={{ lineHeight: 1.4 }}>
                Read-only access to view student directory, campaign history, and analytics reports. Restricted from launching campaigns or modifying records.
              </p>
            </div>
          </div>
        </Modal>

        {/* 7. Confirm Delete Modal */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null, userName: '' })}
          onConfirm={handleConfirmDelete}
          title="Delete Team Account?"
          description={`Are you sure you want to delete ${deleteConfirm.userName ? `"${deleteConfirm.userName}"` : 'this account'}? They will immediately lose access to Aparaitech software.`}
          confirmText="Delete Account"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default UsersPage;
