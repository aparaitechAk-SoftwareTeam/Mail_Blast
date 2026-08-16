import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { fetchUsers, createUser, deleteUser } from '../services/userService';
import { useToast } from '../context/ToastContext';
import { UserCog, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';
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

  // Modal State
  const [showModal, setShowModal] = useState(false);
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
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
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
    document.title = 'Aparaitech | User Accounts';
    loadData();
  }, []);

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
      toast.success('New user account created successfully!');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'Recruiter', department: 'Talent Acquisition' });
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
      toast.success('User account deleted');
      setDeleteConfirm({ isOpen: false, id: null });
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
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0">Recruitment Accounts & Permissions</h5>
            <p className="text-muted small m-0 mt-0.5">Admin controls to manage Recruiter and Viewer access to Aparaitech Software</p>
          </div>

          <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
            Create Team Account
          </Button>
        </div>

        {/* User Directory Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Date Added</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={6} />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title="No user accounts"
                        description="Create user accounts for recruiters and viewers."
                        actionText="Create Account"
                        onAction={() => setShowModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold fs-7" style={{ width: '36px', height: '36px' }}>
                            {u.name?.charAt(0) || 'U'}
                          </div>
                          <span className="fw-bold text-dark">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <StatusBadge status={u.role} type="role" />
                      </td>
                      <td>{u.department || 'Talent Acquisition'}</td>
                      <td className="text-muted small">{formatDate(u.createdAt)}</td>
                      <td className="text-end">
                        <button onClick={() => setDeleteConfirm({ isOpen: true, id: u._id })} className="btn btn-sm btn-ghost-custom text-danger p-1.5" title="Delete User">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Team Member Account"
          subtitle="Grant permissions for recruiters or view-only placement auditors."
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateUser} loading={saving}>
                Create Account
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateUser}>
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
              helpText="Min 6 characters with uppercase, lowercase, and a number"
              required
            />

            <div className="row g-2">
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
                  placeholder="Campus Hiring"
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete Modal */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          onConfirm={handleConfirmDelete}
          title="Delete User Account?"
          description="Are you sure you want to delete this user account? They will lose access to Aparaitech software."
          confirmText="Delete Account"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default UsersPage;
