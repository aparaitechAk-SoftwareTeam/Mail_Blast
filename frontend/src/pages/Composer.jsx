import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { createCampaign, sendTestEmail } from '../services/campaignService';
import { fetchStudents } from '../services/studentService';
import { fetchTemplates } from '../services/templateService';
import { PERSONALIZATION_TAGS } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { Send, Eye, Monitor, Smartphone, Mail, Sparkles, Filter, CheckCircle2, Users, Calendar, ShieldAlert, List, XCircle, RotateCcw } from 'lucide-react';

import Button from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';

const SAMPLE_STUDENTS = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@coep.edu.in', college: 'COEP Technological University', branch: 'Computer Engineering', graduationYear: 2026, cgpa: 8.9, phone: '+91 9876543210', placementStatus: 'Unplaced' },
  { name: 'Priya Patel', email: 'priya.patel@vjti.ac.in', college: 'VJTI Mumbai', branch: 'Information Technology', graduationYear: 2026, cgpa: 9.2, phone: '+91 9876543211', placementStatus: 'Unplaced' },
  { name: 'Aarav Gupta', email: 'aarav.g@pict.edu', college: 'Pune Institute of Computer Technology', branch: 'Computer Engineering', graduationYear: 2026, cgpa: 8.4, phone: '+91 9876543212', placementStatus: 'Unplaced' }
];

const Composer = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Campaign Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [errors, setErrors] = useState({});

  // Target Filter State
  const [filters, setFilters] = useState({
    college: '',
    branch: '',
    graduationYear: '',
    minCgpa: '',
    placementStatus: ''
  });

  const [recipientCount, setRecipientCount] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Modals state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile
  const [sampleStudentIdx, setSampleStudentIdx] = useState(0);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [matchingStudentsList, setMatchingStudentsList] = useState([]);
  const [loadingRecipientsList, setLoadingRecipientsList] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('recruiter@aparaitech.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const DRAFT_KEY = 'studentEmailBlast_composer_draft';

  useEffect(() => {
    document.title = 'Aparaitech | Email Composer';
    loadTemplates();

    // Check for saved local draft
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.subject) setSubject(parsed.subject);
        if (parsed.bodyHtml) setBodyHtml(parsed.bodyHtml);
      } catch (e) {
        console.error('Failed to parse saved draft:', e);
      }
    }
  }, []);

  // Auto-Save Draft on Form Change
  useEffect(() => {
    if (title || subject || bodyHtml) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, subject, bodyHtml }));
    }
  }, [title, subject, bodyHtml]);

  // Unsaved Changes BeforeUnload Listener
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (title || subject || bodyHtml) {
        e.preventDefault();
        e.returnValue = 'You have unsaved campaign changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, subject, bodyHtml]);

  useEffect(() => {
    updateRecipientCounter();
  }, [filters]);

  const loadTemplates = async () => {
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const updateRecipientCounter = async () => {
    try {
      const res = await fetchStudents({
        ...filters,
        limit: 1000
      });
      setRecipientCount(res.total || 0);
    } catch (err) {
      console.error('Error updating counter:', err);
    }
  };

  const handleSelectTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => String(t._id) === String(tplId));
    if (tpl) {
      setTitle(tpl.name);
      setSubject(tpl.subject);
      setBodyHtml(tpl.bodyHtml);
      toast.info(`Loaded template: ${tpl.name}`);
    }
  };

  const insertTag = (tag) => {
    setBodyHtml((prev) => prev + ` ${tag} `);
    toast.info(`Inserted ${tag}`);
  };

  const validateComposer = () => {
    const errs = {};
    if (!title || title.trim().length < 2) {
      errs.title = 'Internal campaign title is required';
    }
    if (!subject || subject.trim().length < 2) {
      errs.subject = 'Subject line is required';
    }
    if (!bodyHtml || bodyHtml.trim().length < 5) {
      errs.bodyHtml = 'Email HTML body content is required';
    }
    if (recipientCount === 0) {
      errs.recipient = 'No target candidates match current filter selection';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [testResult, setTestResult] = useState(null);

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      toast.error('Enter a valid test email recipient address');
      return;
    }
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestEmail({
        targetEmail: testEmailAddress,
        subject,
        bodyHtml
      });
      setTestResult(res);
      toast.success(res.message || 'SMTP accepted test email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch test email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      college: '',
      branch: '',
      graduationYear: '',
      minCgpa: '',
      placementStatus: ''
    });
    toast.info('Audience filters reset');
  };

  const handleOpenViewRecipients = async () => {
    setShowRecipientsModal(true);
    setLoadingRecipientsList(true);
    try {
      const res = await fetchStudents({
        ...filters,
        limit: 100
      });
      setMatchingStudentsList(res.students || []);
    } catch (err) {
      console.error('Error fetching recipient list:', err);
      toast.error('Failed to load recipient candidate list');
    } finally {
      setLoadingRecipientsList(false);
    }
  };

  const handleSubmitCampaign = (e) => {
    e.preventDefault();
    if (!validateComposer()) {
      toast.error('Please fix validation errors before reviewing your campaign');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalLaunch = async () => {
    setSubmitting(true);
    try {
      const campaign = await createCampaign({
        title,
        subject,
        bodyHtml,
        templateId: selectedTemplateId || null,
        targetFilters: filters,
        scheduledAt: scheduledAt || null
      });

      localStorage.removeItem(DRAFT_KEY);
      setShowConfirmModal(false);
      toast.success('Campaign launched successfully! Redirecting to live progress tracker...');
      navigate(`/campaigns/${campaign._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const sampleStudent = SAMPLE_STUDENTS[sampleStudentIdx] || SAMPLE_STUDENTS[0];

  const replaceSampleVars = (content) => {
    if (!content) return '';
    return content
      .replace(/\{Name\}/g, sampleStudent.name)
      .replace(/\{Email\}/g, sampleStudent.email)
      .replace(/\{College\}/g, sampleStudent.college)
      .replace(/\{Branch\}/g, sampleStudent.branch)
      .replace(/\{GraduationYear\}/g, String(sampleStudent.graduationYear))
      .replace(/\{CGPA\}/g, String(sampleStudent.cgpa))
      .replace(/\{Phone\}/g, sampleStudent.phone)
      .replace(/\{PlacementStatus\}/g, sampleStudent.placementStatus);
  };

  return (
    <div>
      <Navbar title="Campaign Email Composer" />

      <div className="page-container">
        <form onSubmit={handleSubmitCampaign}>
          <div className="row g-4">
            {/* Left Column: Email Details & Content */}
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark m-0">Campaign Details & Body</h5>
                    <p className="text-muted small m-0 mt-0.5">Compose personalized recruitment emails or load prebuilt templates</p>
                  </div>

                  {templates.length > 0 && (
                    <Select
                      name="template"
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      options={templates.map(t => ({ label: t.name, value: t._id }))}
                      placeholder="Load Prebuilt Template..."
                      className="m-0 w-auto"
                    />
                  )}
                </div>

                <Input
                  label="Internal Campaign Name"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  error={errors.title}
                  required
                  placeholder="e.g. COEP Campus Placement Drive 2026 Invitation"
                />

                <Input
                  label="Email Subject Line"
                  name="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  error={errors.subject}
                  required
                  placeholder="e.g. Invitation for Campus Placement Drive - {Name}"
                />

                {/* Tag Toolbar */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary d-flex align-items-center gap-1">
                    <Sparkles size={14} className="text-primary" />
                    <span>Insert Personalization Tags (Click to add):</span>
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {PERSONALIZATION_TAGS.map((t) => (
                      <span
                        key={t.tag}
                        onClick={() => insertTag(t.tag)}
                        className="tag-chip"
                      >
                        {t.tag}
                      </span>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="HTML Body Content"
                  name="bodyHtml"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  error={errors.bodyHtml}
                  rows={14}
                  required
                  placeholder="Type email body content or insert HTML..."
                  className="font-monospace"
                />
              </div>
            </div>

            {/* Right Column: Audience Filters & Delivery Actions */}
            <div className="col-12 col-lg-4">
              {/* Audience Counter */}
              <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-white-50 fw-semibold text-uppercase tracking-wider">Targeted Candidate Pool</span>
                  <Users size={20} />
                </div>
                <h1 className="fw-bold m-0 tracking-tight">{recipientCount}</h1>
                <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-white border-opacity-20">
                  <span className="small text-white-50">Candidates matching filters</span>
                  {recipientCount > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenViewRecipients}
                      className="btn btn-sm btn-light text-primary fw-bold py-1 px-2.5 rounded-pill fs-8 d-inline-flex align-items-center gap-1"
                    >
                      <List size={13} /> View Recipients
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Form */}
              <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-dark m-0">Audience Filters</h6>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn btn-link p-0 text-muted fs-8 text-decoration-none d-inline-flex align-items-center gap-1"
                  >
                    <RotateCcw size={12} /> Clear Filters
                  </button>
                </div>

                <Input
                  label="College / University"
                  name="collegeFilter"
                  value={filters.college}
                  onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                  placeholder="All Colleges"
                />

                <Input
                  label="Branch / Stream"
                  name="branchFilter"
                  value={filters.branch}
                  onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                  placeholder="All Branches"
                />

                <div className="row g-2">
                  <div className="col-6">
                    <Input
                      label="Passout Year"
                      name="gradYearFilter"
                      type="number"
                      value={filters.graduationYear}
                      onChange={(e) => setFilters({ ...filters, graduationYear: e.target.value })}
                      placeholder="2026"
                    />
                  </div>
                  <div className="col-6">
                    <Input
                      label="Min CGPA"
                      name="cgpaFilter"
                      type="number"
                      step="0.1"
                      value={filters.minCgpa}
                      onChange={(e) => setFilters({ ...filters, minCgpa: e.target.value })}
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <Input
                  label="Schedule Launch (Optional)"
                  name="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
                <div className="d-grid gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    icon={Eye}
                    onClick={() => setShowPreviewModal(true)}
                  >
                    Live Device Preview
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    icon={Mail}
                    onClick={() => setShowTestEmailModal(true)}
                  >
                    Send Test Email
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    icon={Send}
                    disabled={submitting || recipientCount === 0}
                    loading={submitting ? 'Creating Campaign...' : false}
                  >
                    Review & Launch Campaign
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Live Device Preview Modal */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Live Email Responsive Preview"
          subtitle="Test merged personalization variables across Desktop and Mobile viewports."
          size="lg"
        >
          <div className="p-1">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="small text-muted fw-semibold">Preview as candidate:</span>
                <select
                  className="form-select form-select-sm form-select-custom w-auto"
                  value={sampleStudentIdx}
                  onChange={(e) => setSampleStudentIdx(Number(e.target.value))}
                >
                  {SAMPLE_STUDENTS.map((st, idx) => (
                    <option key={idx} value={idx}>{st.name} ({st.college})</option>
                  ))}
                </select>
              </div>

              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`btn ${previewDevice === 'desktop' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  <Monitor size={14} className="me-1" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`btn ${previewDevice === 'mobile' ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  <Smartphone size={14} className="me-1" /> Mobile
                </button>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 mb-3 border">
              <div className="small text-dark fw-bold mb-1">Subject: {replaceSampleVars(subject) || '(No subject typed)'}</div>
              <div className="small text-muted">To: {sampleStudent.name} &lt;{sampleStudent.email}&gt;</div>
            </div>

            <div className="device-preview-container">
              <div className={previewDevice === 'desktop' ? 'device-desktop' : 'device-mobile'}>
                <div
                  className="p-4"
                  dangerouslySetInnerHTML={{ __html: replaceSampleVars(bodyHtml) || '<p className="text-muted p-4 text-center">No HTML content typed yet...</p>' }}
                />
              </div>
            </div>
          </div>
        </Modal>

        {/* Send Test Email Modal */}
        <Modal
          isOpen={showTestEmailModal}
          onClose={() => { setShowTestEmailModal(false); setTestResult(null); }}
          title="Send Test Email Preview"
          subtitle="Deliver a real sample email with merged tags directly to your inbox."
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => { setShowTestEmailModal(false); setTestResult(null); }} disabled={sendingTest}>
                Close
              </Button>
              <Button variant="primary" onClick={handleSendTestEmail} loading={sendingTest}>
                Send Test Email
              </Button>
            </>
          }
        >
          <form onSubmit={handleSendTestEmail}>
            <Input
              label="Recipient Test Inbox"
              name="testEmailAddress"
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              required
              placeholder="recruiter@aparaitech.com"
            />
          </form>

          {testResult && (
            <div className="mt-3 p-3 bg-success-subtle border border-success-subtle rounded-3 text-dark fs-8">
              <div className="d-flex align-items-center gap-1.5 text-success fw-bold mb-2">
                <CheckCircle2 size={16} />
                <span>SMTP Accepted the Message</span>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-9">Recipient:</span>
                  <span className="fw-semibold text-break">{testResult.recipient}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-9">Sender:</span>
                  <span className="fw-semibold text-break">{testResult.sender}</span>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block fs-9">Message ID:</span>
                  <code className="text-dark bg-white px-1.5 py-0.5 rounded border d-block text-break">{testResult.messageId}</code>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block fs-9">SMTP Server Response:</span>
                  <code className="text-muted bg-white px-1.5 py-0.5 rounded border d-block text-break">{testResult.smtpResponse}</code>
                </div>
              </div>
              <div className="p-2 bg-white rounded border text-muted fs-9">
                <strong>Important:</strong> SMTP accepted the email. Final inbox placement may depend on the recipient mail provider.
              </div>
            </div>
          )}
        </Modal>

        {/* View Matching Recipients Modal */}
        <Modal
          isOpen={showRecipientsModal}
          onClose={() => setShowRecipientsModal(false)}
          title={`Target Candidate Roster (${recipientCount})`}
          subtitle="List of students matching active audience filters who will receive this campaign."
          size="lg"
        >
          {loadingRecipientsList ? (
            <div className="py-4 text-center text-muted">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              Loading matching candidate roster...
            </div>
          ) : matchingStudentsList.length > 0 ? (
            <div className="table-responsive">
              <table className="table custom-table table-hover m-0">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Email Address</th>
                    <th>College / University</th>
                    <th>Branch</th>
                    <th>CGPA</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {matchingStudentsList.map((s) => (
                    <tr key={s._id}>
                      <td className="fw-semibold text-dark">{s.name}</td>
                      <td className="text-muted">{s.email}</td>
                      <td>{s.college}</td>
                      <td>{s.branch}</td>
                      <td><span className="badge bg-primary-subtle text-primary fw-bold">{s.cgpa || '-'}</span></td>
                      <td>{s.graduationYear || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-4 text-center text-muted">No candidates match current active filters.</div>
          )}
        </Modal>

        {/* Campaign Launch Confirmation Modal */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          title="Confirm Campaign Dispatch"
          subtitle="Please review your campaign launch configuration before queueing."
          size="md"
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                Back to Editing
              </Button>
              <Button variant="primary" icon={Send} onClick={handleFinalLaunch} loading={submitting}>
                {scheduledAt ? 'Confirm & Schedule' : 'Confirm & Launch Campaign'}
              </Button>
            </>
          }
        >
          <div className="p-1">
            <div className="alert alert-primary border-0 rounded-3 p-3 mb-3 d-flex align-items-center gap-3">
              <Send size={24} className="text-primary flex-shrink-0" />
              <div>
                <div className="fw-bold">Ready for Dispatch</div>
                <div className="small">You are about to launch a recruitment campaign blast to eligible candidates.</div>
              </div>
            </div>

            <div className="list-group list-group-flush border rounded-3 mb-2 small">
              <div className="list-group-item d-flex justify-content-between py-2.5">
                <span className="text-muted">Campaign Title:</span>
                <span className="fw-semibold text-dark">{title}</span>
              </div>
              <div className="list-group-item d-flex justify-content-between py-2.5">
                <span className="text-muted">Subject Line:</span>
                <span className="fw-semibold text-dark">{subject}</span>
              </div>
              <div className="list-group-item d-flex justify-content-between py-2.5">
                <span className="text-muted">Target Audience:</span>
                <span className="badge bg-primary rounded-pill px-2.5">{recipientCount} Students</span>
              </div>
              <div className="list-group-item d-flex justify-content-between py-2.5">
                <span className="text-muted">Launch Mode:</span>
                <span className="fw-semibold text-success">
                  {scheduledAt ? `Scheduled for ${formatDate(scheduledAt)}` : 'Immediate Delivery'}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Composer;
