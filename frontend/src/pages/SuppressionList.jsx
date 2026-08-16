import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/common/Navbar';
import { fetchSuppressions, addSuppression, removeSuppression } from '../services/userService';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const SuppressionList = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [suppressions, setSuppressions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    reason: 'Manual Opt-Out',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchSuppressions();
      setSuppressions(data);
    } catch (err) {
      console.error('Error fetching suppressions:', err);
      toast.error('Failed to load suppression list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Aparaitech | Suppression List';
    loadData();
  }, []);

  const validateSuppression = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateSuppression()) return;

    setSaving(true);
    try {
      await addSuppression(formData);
      toast.success('Email added to suppression opt-out list');
      setShowModal(false);
      setFormData({ email: '', reason: 'Manual Opt-Out', notes: '' });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add suppression entry');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmRemove = async () => {
    setDeleting(true);
    try {
      await removeSuppression(deleteConfirm.id);
      toast.success('Suppression entry removed');
      setDeleteConfirm({ isOpen: false, id: null });
      loadData();
    } catch (err) {
      toast.error('Failed to remove suppression entry');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Navbar title="Suppression & Opt-Out List" />

      <div className="page-container">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0">Unsubscribed & Suppressed Email Addresses</h5>
            <p className="text-muted small m-0 mt-0.5">Campaign queue automatically filters out all addresses in this opt-out list</p>
          </div>

          {user?.role !== 'Viewer' && (
            <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
              Add Opt-Out Email
            </Button>
          )}
        </div>

        {/* Suppression Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>Suppressed Email</th>
                  <th>Reason</th>
                  <th>Added By</th>
                  <th>Notes</th>
                  <th>Date Added</th>
                  {user?.role === 'Admin' && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={6} />
                ) : suppressions.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title="Suppression list is empty"
                        description="No student opt-outs or bounced emails recorded."
                        actionText={user?.role !== 'Viewer' ? "Add Opt-Out Email" : null}
                        onAction={() => setShowModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  suppressions.map(s => (
                    <tr key={s._id}>
                      <td className="fw-bold text-danger">{s.email}</td>
                      <td>
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2.5 py-1 rounded-pill small fw-semibold">
                          {s.reason}
                        </span>
                      </td>
                      <td className="fw-medium">{s.addedBy || 'System'}</td>
                      <td className="text-muted small">{s.notes || '—'}</td>
                      <td className="text-muted small">{formatDate(s.createdAt)}</td>
                      {user?.role === 'Admin' && (
                        <td className="text-end">
                          <button onClick={() => setDeleteConfirm({ isOpen: true, id: s._id })} className="btn btn-sm btn-ghost-custom text-danger p-1.5" title="Remove Opt-Out">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Suppression Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Add Email to Suppression List"
          subtitle="Suppressed emails will never receive campaign broadcasts."
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAdd} loading={saving}>
                Add Suppression
              </Button>
            </>
          }
        >
          <form onSubmit={handleAdd}>
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              required
              placeholder="optout.student@example.com"
            />

            <Select
              label="Reason"
              name="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              options={['Manual Opt-Out', 'Unsubscribed', 'Bounced', 'Spam Complaint']}
              required
            />

            <Input
              label="Notes (Optional)"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Student requested no placement emails"
            />
          </form>
        </Modal>

        {/* Remove Confirmation */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
          onConfirm={handleConfirmRemove}
          title="Remove Suppression Entry?"
          description="Are you sure you want to remove this email from the opt-out list? Future campaigns will be allowed to send to this email address."
          confirmText="Remove Entry"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default SuppressionList;
