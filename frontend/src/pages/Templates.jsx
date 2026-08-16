import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { fetchTemplates, createTemplate, deleteTemplate } from '../services/templateService';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FileText, Plus, Send, Trash2, Sparkles, Tag } from 'lucide-react';

import Button from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const Templates = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Placement Drive',
    subject: '',
    bodyHtml: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  // Confirm delete dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
      toast.error('Failed to load templates library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Aparaitech | Templates';
    loadTemplates();
  }, []);

  const validateTemplate = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2) {
      errs.name = 'Template name is required';
    }
    if (!formData.subject || formData.subject.trim().length < 2) {
      errs.subject = 'Default subject line is required';
    }
    if (!formData.bodyHtml || formData.bodyHtml.trim().length < 5) {
      errs.bodyHtml = 'Template HTML body content is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!validateTemplate()) return;

    setSaving(true);
    try {
      await createTemplate(formData);
      toast.success('Template saved to library!');
      setShowModal(false);
      loadTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteTemplate(deleteConfirm.id);
      toast.success('Template deleted from library');
      setDeleteConfirm({ isOpen: false, id: null });
      loadTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Navbar title="Recruitment Template Library" />

      <div className="page-container">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0">Prebuilt & Custom Recruitment Templates</h5>
            <p className="text-muted small m-0 mt-0.5">Select a template to instantly populate the email composer</p>
          </div>

          {user?.role !== 'Viewer' && (
            <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
              Create Template
            </Button>
          )}
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : templates.length === 0 ? (
          <EmptyState
            title="No templates found"
            description="Create custom email templates for campus placement drives."
            actionText={user?.role !== 'Viewer' ? "Create Template" : null}
            onAction={() => setShowModal(true)}
          />
        ) : (
          <div className="row g-4">
            {templates.map(tpl => (
              <div key={tpl._id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 bg-surface h-100 p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill small fw-semibold">
                        {tpl.category}
                      </span>
                      {tpl.isPrebuilt && (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill small fw-semibold d-inline-flex align-items-center gap-1">
                          <Sparkles size={12} /> Pre-built
                        </span>
                      )}
                    </div>

                    <h5 className="fw-bold text-dark mb-2">{tpl.name}</h5>
                    <p className="text-muted small mb-3">{tpl.description || 'Custom recruitment invitation template.'}</p>

                    <div className="bg-light p-3 rounded-3 mb-4 text-truncate small border">
                      <div className="text-muted fw-semibold">Subject:</div>
                      <div className="text-dark fw-bold text-truncate">{tpl.subject}</div>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                    {!tpl.isPrebuilt && user?.role !== 'Viewer' ? (
                      <button onClick={() => setDeleteConfirm({ isOpen: true, id: tpl._id })} className="btn btn-sm btn-ghost-custom text-danger p-1.5" title="Delete Template">
                        <Trash2 size={16} />
                      </button>
                    ) : <div />}
                    
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Send}
                      onClick={() => navigate('/composer')}
                    >
                      Use in Composer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Template Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Custom Template"
          subtitle="Save a reusable email layout with merged student tag placeholders."
          size="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateTemplate} loading={saving}>
                Save Template
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateTemplate}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <Input
                  label="Template Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                  placeholder="e.g. Off-Campus Hiring Drive Invite"
                />
              </div>
              <div className="col-12 col-md-6">
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    'Placement Drive',
                    'Internship Opportunity',
                    'Job Opportunity',
                    'Interview Invitation',
                    'Interview Shortlist',
                    'Campus Recruitment'
                  ]}
                  required
                />
              </div>
              <div className="col-12">
                <Input
                  label="Default Subject Line"
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  error={errors.subject}
                  required
                  placeholder="e.g. Invitation for Campus Drive - {Name}"
                />
              </div>
              <div className="col-12">
                <Textarea
                  label="HTML Body Content"
                  name="bodyHtml"
                  value={formData.bodyHtml}
                  onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
                  error={errors.bodyHtml}
                  rows={8}
                  required
                  placeholder="Type email body content..."
                  className="font-monospace"
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
          title="Delete Template?"
          description="Are you sure you want to delete this template from the library? This cannot be undone."
          confirmText="Delete Template"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default Templates;
