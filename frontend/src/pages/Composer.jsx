import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { createCampaign, sendTestEmail, fetchSmtpGateways } from '../services/campaignService';
import { fetchStudents } from '../services/studentService';
import { fetchTemplates } from '../services/templateService';
import { PERSONALIZATION_TAGS } from '../utils/constants';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { Send, Eye, Monitor, Smartphone, Mail, Sparkles, Filter, CheckCircle2, Users, Calendar, ShieldAlert, List, XCircle, RotateCcw, Server, Check, Copy } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const location = useLocation();
  const toast = useToast();
  const shouldReduceMotion = useReducedMotion();

  const composerPageVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 8
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.22,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const fieldStaggerVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 6
    },
    visible: (customDelay) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        delay: shouldReduceMotion ? 0 : customDelay,
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  // Campaign Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [errors, setErrors] = useState({});

  // Target Filter & Audience Mode State
  const [audienceMode, setAudienceMode] = useState('filtered'); // 'all' | 'filtered' | 'new_since_last_campaign'
  const [lastCampaignMeta, setLastCampaignMeta] = useState(null);
  const [hasPreviousCampaign, setHasPreviousCampaign] = useState(true);
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
  const [loadedTemplateBanner, setLoadedTemplateBanner] = useState('');
  const [duplicatedBanner, setDuplicatedBanner] = useState('');

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

  // Gateway Pool state
  const [availableGateways, setAvailableGateways] = useState([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState('');

  const DRAFT_KEY = 'studentEmailBlast_composer_draft';

  useEffect(() => {
    document.title = 'Aparaitech | Email Composer';
    loadGatewaysData();

    // Ensure any legacy composer draft is purged on mount so composer starts completely fresh
    localStorage.removeItem(DRAFT_KEY);

    // Read duplicated campaign passed via React Router state or sessionStorage
    let targetDuplicated = location.state?.duplicatedCampaign;
    if (!targetDuplicated) {
      try {
        const storedDup = sessionStorage.getItem('composerDuplicatedCampaign');
        if (storedDup) {
          targetDuplicated = JSON.parse(storedDup);
        }
      } catch (e) {
        console.error('Error parsing stored duplicated campaign:', e);
      }
    }

    if (targetDuplicated) {
      if (targetDuplicated.title) setTitle(targetDuplicated.title);
      if (targetDuplicated.subject) setSubject(targetDuplicated.subject);
      if (targetDuplicated.bodyHtml) setBodyHtml(targetDuplicated.bodyHtml);
      if (targetDuplicated.audienceMode) setAudienceMode(targetDuplicated.audienceMode);
      if (targetDuplicated.targetFilters) {
        setFilters({
          college: targetDuplicated.targetFilters.college || '',
          branch: targetDuplicated.targetFilters.branch || '',
          graduationYear: targetDuplicated.targetFilters.graduationYear || '',
          minCgpa: targetDuplicated.targetFilters.minCgpa || '',
          placementStatus: targetDuplicated.targetFilters.placementStatus || ''
        });
      }
      if (targetDuplicated.smtpGatewayId) {
        setSelectedGatewayId(targetDuplicated.smtpGatewayId);
      }

      const origTitle = targetDuplicated.originalTitle || targetDuplicated.title;
      setDuplicatedBanner(origTitle);

      sessionStorage.removeItem('composerDuplicatedCampaign');
    }

    // Read template passed from Templates page via React Router state or sessionStorage
    let targetTemplate = location.state?.template;
    if (!targetTemplate) {
      try {
        const stored = sessionStorage.getItem('composerSelectedTemplate');
        if (stored) {
          targetTemplate = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error parsing stored template:', e);
      }
    }

    if (targetTemplate) {
      const tId = targetTemplate.id || targetTemplate._id || '';
      const tName = targetTemplate.name || targetTemplate.title || '';
      const tSub = targetTemplate.subject || targetTemplate.defaultSubject || '';
      const tHtml = targetTemplate.htmlBody || targetTemplate.bodyContent || targetTemplate.bodyHtml || targetTemplate.body || '';

      if (tName) setTitle(tName);
      if (tSub) setSubject(tSub);
      if (tHtml) setBodyHtml(tHtml);
      if (tId) setSelectedTemplateId(tId);
      if (tName) setLoadedTemplateBanner(tName);

      toast.success(`Template loaded: ${tName}`);
      sessionStorage.removeItem('composerSelectedTemplate');
    }

    loadTemplates();
  }, [location]);

  const loadGatewaysData = async () => {
    try {
      const data = await fetchSmtpGateways();
      if (data.gateways) {
        setAvailableGateways(data.gateways);
        const activeGw = data.gateways.find(g => g.isActive !== false);
        if (activeGw) {
          setSelectedGatewayId(activeGw._id);
        }
      }
    } catch (err) {
      console.error('Error loading gateways in composer:', err);
    }
  };

  useEffect(() => {
    updateRecipientCounter();
  }, [filters, audienceMode]);

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
        audienceMode,
        limit: 1
      });
      setRecipientCount(res.total || 0);
      if (res.meta?.lastCampaign !== undefined) {
        setLastCampaignMeta(res.meta.lastCampaign);
      }
      if (res.meta?.hasPreviousCampaign !== undefined) {
        setHasPreviousCampaign(res.meta.hasPreviousCampaign);
      }
    } catch (err) {
      console.error('Error updating counter:', err);
    }
  };

  const handleSelectTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => String(t._id || t.id) === String(tplId));
    if (tpl) {
      setTitle(tpl.name || tpl.title || '');
      setSubject(tpl.subject || tpl.defaultSubject || '');
      setBodyHtml(tpl.bodyHtml || tpl.bodyContent || tpl.body || '');
      setLoadedTemplateBanner(tpl.name || tpl.title || '');
      toast.info(`Loaded template: ${tpl.name || tpl.title}`);
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
        bodyHtml,
        smtpGatewayId: selectedGatewayId || null
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
    setAudienceMode('filtered');
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
        audienceMode,
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
        audienceMode,
        scheduledAt: scheduledAt || null,
        smtpGatewayId: selectedGatewayId || null
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

      <motion.div
        initial="hidden"
        animate="visible"
        variants={composerPageVariants}
        className="page-container"
      >
        <form onSubmit={handleSubmitCampaign}>
          <div className="row g-4">
            {/* Left Column: Email Details & Content */}
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark m-0">Campaign Details & Body</h5>
                      <p className="text-muted small m-0 mt-0.5">Compose personalized recruitment emails or load prebuilt templates</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    {duplicatedBanner && (
                      <motion.span
                        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 rounded-pill fs-9 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-xs"
                      >
                        <Copy size={12} strokeWidth={2.5} /> Duplicated from: {duplicatedBanner}
                      </motion.span>
                    )}

                    {loadedTemplateBanner && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1.5 rounded-pill fs-9 fw-semibold d-inline-flex align-items-center gap-1">
                        <Check size={12} strokeWidth={3} /> Template loaded: {loadedTemplateBanner}
                      </span>
                    )}

                    {templates.length > 0 && (
                      <Select
                        name="template"
                        value={selectedTemplateId}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        options={(() => {
                          const opts = templates.map(t => ({ label: t.name, value: t._id }));
                          if (selectedTemplateId && !opts.some(o => String(o.value) === String(selectedTemplateId))) {
                            opts.unshift({ label: loadedTemplateBanner || 'Selected Template', value: selectedTemplateId });
                          }
                          return opts;
                        })()}
                        placeholder="Load Prebuilt Template..."
                        className="m-0 w-auto fs-9"
                      />
                    )}
                  </div>
                </div>

                <motion.div
                  key={`title-field-${duplicatedBanner}-${selectedTemplateId}`}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                  variants={fieldStaggerVariants}
                  className="mb-4"
                >
                  <Input
                    label="Internal Campaign Name"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={errors.title}
                    required
                    placeholder="e.g. COEP Campus Placement Drive 2026 Invitation"
                  />
                </motion.div>

                <motion.div
                  key={`subject-field-${duplicatedBanner}-${selectedTemplateId}`}
                  initial="hidden"
                  animate="visible"
                  custom={0.05}
                  variants={fieldStaggerVariants}
                  className="mb-4"
                >
                  <Input
                    label="Email Subject Line"
                    name="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    error={errors.subject}
                    required
                    placeholder="e.g. Invitation for Campus Placement Drive - {Name}"
                  />
                </motion.div>

                <motion.div
                  key={`body-field-${duplicatedBanner}-${selectedTemplateId}`}
                  initial="hidden"
                  animate="visible"
                  custom={0.10}
                  variants={fieldStaggerVariants}
                >
                  {/* Personalization Tag Toolbar */}
                  <div className="p-3 bg-light rounded-3 mb-4 border border-light-subtle">
                    <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                      <label className="form-label small fw-semibold text-dark m-0 d-flex align-items-center gap-1.5">
                        <Sparkles size={15} className="text-primary" />
                        <span>Insert Personalization Tags</span>
                      </label>
                      <span className="text-muted fs-9">Click chip to inject into body</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {PERSONALIZATION_TAGS.map((t) => (
                        <button
                          type="button"
                          key={t.tag}
                          onClick={() => insertTag(t.tag)}
                          className="btn btn-sm btn-white border shadow-2xs text-primary font-monospace fw-semibold fs-9 rounded-pill px-2.5 py-1 transition-all"
                          title={`Click to insert ${t.tag}`}
                        >
                          {t.tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2">
                    <Textarea
                      label="HTML Body Content"
                      name="bodyHtml"
                      value={bodyHtml}
                      onChange={(e) => setBodyHtml(e.target.value)}
                      error={errors.bodyHtml}
                      rows={15}
                      required
                      placeholder="Type email body content or insert HTML..."
                      className="font-monospace fs-9"
                      style={{ minHeight: '320px' }}
                    />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Column: Audience Filters & Delivery Actions */}
            <div className="col-12 col-lg-4">
              {/* Audience Counter */}
              <div className="card border-0 shadow-sm rounded-4 bg-primary text-white p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small text-white-50 fw-semibold text-uppercase tracking-wider fs-9">Targeted Candidate Pool</span>
                  <Users size={20} className="text-white-50" />
                </div>
                <h1 className="fw-bold display-5 m-0 tracking-tight">{recipientCount}</h1>
                <div className="d-flex align-items-center justify-content-between mt-3 pt-2.5 border-top border-white border-opacity-20 flex-wrap gap-2">
                  <span className="small text-white-50 fs-9">
                    {audienceMode === 'all' 
                      ? 'All subscribed candidates' 
                      : audienceMode === 'new_since_last_campaign' 
                        ? 'New candidates added since last campaign' 
                        : 'Candidates matching active filters'}
                  </span>
                  {recipientCount > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenViewRecipients}
                      className="btn btn-sm btn-light text-primary fw-bold py-1 px-3 rounded-pill fs-9 d-inline-flex align-items-center gap-1.5 shadow-sm"
                    >
                      <List size={13} /> View Recipients
                    </button>
                  )}
                </div>
              </div>

              {/* Audience Selection & Filters Form */}
              <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4" style={{ borderColor: '#e8edf3' }}>
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-1.5 rounded-2 bg-primary-subtle text-primary">
                      <Filter size={18} />
                    </div>
                    <h6 className="fw-bold text-dark m-0 fs-6">Audience & Filters</h6>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="btn btn-link p-0 text-muted fs-9 text-decoration-none d-inline-flex align-items-center gap-1 hover-primary"
                  >
                    <RotateCcw size={12} /> Clear all
                  </button>
                </div>

                {/* Audience Target Section Header */}
                <div className="mb-3">
                  <div className="mb-2">
                    <h6 className="fw-semibold text-dark m-0 fs-9">Audience target</h6>
                    <p className="text-muted fs-9 m-0 mt-0.5">Choose who should receive this campaign</p>
                  </div>

                  {/* Radio Selectable Options */}
                  <div className="d-flex flex-column gap-2 mt-2">
                    {/* Mode 1: All Subscribed Students */}
                    <label 
                      className={`d-flex align-items-start gap-2.5 p-3 rounded-3 border transition-all cursor-pointer ${
                        audienceMode === 'all' 
                          ? 'bg-primary-subtle border-primary text-primary fw-semibold' 
                          : 'bg-white border-light-subtle text-dark hover-border-primary'
                      }`}
                      style={{ padding: '11px 14px', borderRadius: '10px' }}
                    >
                      <input
                        type="radio"
                        name="audienceMode"
                        value="all"
                        checked={audienceMode === 'all'}
                        onChange={() => setAudienceMode('all')}
                        className="form-check-input m-0 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-grow-1">
                        <div className="fs-9 fw-semibold text-dark">All Subscribed Students</div>
                        <div className="text-muted fs-9 fw-normal mt-0.5">Send to all eligible subscribers</div>
                      </div>
                    </label>

                    {/* Mode 2: Filtered Students */}
                    <label 
                      className={`d-flex align-items-start gap-2.5 p-3 rounded-3 border transition-all cursor-pointer ${
                        audienceMode === 'filtered' 
                          ? 'bg-primary-subtle border-primary text-primary fw-semibold' 
                          : 'bg-white border-light-subtle text-dark hover-border-primary'
                      }`}
                      style={{ padding: '11px 14px', borderRadius: '10px' }}
                    >
                      <input
                        type="radio"
                        name="audienceMode"
                        value="filtered"
                        checked={audienceMode === 'filtered'}
                        onChange={() => setAudienceMode('filtered')}
                        className="form-check-input m-0 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-grow-1">
                        <div className="fs-9 fw-semibold text-dark">Filtered Students</div>
                        <div className="text-muted fs-9 fw-normal mt-0.5">Use custom audience parameters</div>
                      </div>
                    </label>

                    {/* Mode 3: New Students Since Last Campaign */}
                    <label 
                      className={`d-flex align-items-start gap-2.5 p-3 rounded-3 border transition-all ${
                        !hasPreviousCampaign 
                          ? 'opacity-50 cursor-not-allowed bg-light' 
                          : audienceMode === 'new_since_last_campaign' 
                            ? 'bg-primary-subtle border-primary text-primary fw-semibold cursor-pointer' 
                            : 'bg-white border-light-subtle text-dark cursor-pointer hover-border-primary'
                      }`}
                      style={{ padding: '11px 14px', borderRadius: '10px' }}
                    >
                      <input
                        type="radio"
                        name="audienceMode"
                        value="new_since_last_campaign"
                        checked={audienceMode === 'new_since_last_campaign'}
                        disabled={!hasPreviousCampaign}
                        onChange={() => hasPreviousCampaign && setAudienceMode('new_since_last_campaign')}
                        className="form-check-input m-0 mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                          <span className="fs-9 fw-semibold text-dark">New Students Since Last Campaign</span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 rounded-pill fs-9 fw-bold">
                            NEW
                          </span>
                        </div>
                        <div className="text-muted fs-9 fw-normal mt-0.5">
                          {!hasPreviousCampaign 
                            ? 'Available after your first completed campaign.'
                            : 'Added after the last completed campaign.'}
                        </div>
                        {hasPreviousCampaign && lastCampaignMeta && (
                          <div className="mt-1.5 p-2 bg-white rounded-2 border border-primary-subtle text-primary fs-9 fw-normal">
                            <strong>Baseline:</strong> {lastCampaignMeta.title} ({formatDate(lastCampaignMeta.completedAt)})
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Active Audience Summary Row */}
                <div className="p-2.5 bg-light rounded-3 border border-light-subtle mb-3 d-flex align-items-center justify-content-between">
                  <span className="text-muted fs-9 fw-semibold">Target audience</span>
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill fs-9 fw-bold">
                    {recipientCount} students
                  </span>
                </div>

                {/* Active Filter Chips Summary */}
                {audienceMode !== 'all' && (filters.college || filters.branch || filters.graduationYear || filters.minCgpa) && (
                  <div className="mb-3 p-2 bg-light rounded-3 border border-light-subtle">
                    <span className="text-muted fs-9 d-block mb-1.5 fw-semibold">Active filters:</span>
                    <div className="d-flex flex-wrap gap-1.5">
                      {filters.college && (
                        <span className="badge bg-white text-dark border shadow-2xs fs-9 fw-normal d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1">
                          {filters.college}
                          <button type="button" className="btn-close ms-1" style={{ fontSize: '0.65rem' }} onClick={() => setFilters({ ...filters, college: '' })} />
                        </span>
                      )}
                      {filters.branch && (
                        <span className="badge bg-white text-dark border shadow-2xs fs-9 fw-normal d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1">
                          {filters.branch}
                          <button type="button" className="btn-close ms-1" style={{ fontSize: '0.65rem' }} onClick={() => setFilters({ ...filters, branch: '' })} />
                        </span>
                      )}
                      {filters.graduationYear && (
                        <span className="badge bg-white text-dark border shadow-2xs fs-9 fw-normal d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1">
                          Year: {filters.graduationYear}
                          <button type="button" className="btn-close ms-1" style={{ fontSize: '0.65rem' }} onClick={() => setFilters({ ...filters, graduationYear: '' })} />
                        </span>
                      )}
                      {filters.minCgpa && (
                        <span className="badge bg-white text-dark border shadow-2xs fs-9 fw-normal d-inline-flex align-items-center gap-1 rounded-pill px-2 py-1">
                          CGPA ≥ {filters.minCgpa}
                          <button type="button" className="btn-close ms-1" style={{ fontSize: '0.65rem' }} onClick={() => setFilters({ ...filters, minCgpa: '' })} />
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Filter Criteria Inputs */}
                {audienceMode !== 'all' && (
                  <div className="pt-3 border-top mb-3">
                    <label className="form-label small fw-semibold text-secondary m-0 mb-2">Filter criteria</label>
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
                  </div>
                )}

                {/* SMTP Gateway Selection */}
                <div className="pt-3 border-top">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1.5">
                      <Server size={15} className="text-primary" />
                      <span className="fw-semibold text-dark fs-9">SMTP Gateway</span>
                    </div>
                  </div>
                  <select
                    className="form-select form-select-sm form-select-custom w-100 rounded-3"
                    value={selectedGatewayId}
                    onChange={(e) => setSelectedGatewayId(e.target.value)}
                    style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    {availableGateways.map(g => (
                      <option key={g._id} value={g._id} disabled={g.isActive === false}>
                        {g.gatewayName}{g.isActive === false ? ' [Disabled]' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted fs-9 d-block mt-1">Admin-selected gateway for campaign dispatch.</span>
                </div>

                {/* Schedule Launch Section */}
                <div className="pt-3 border-top">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1.5">
                      <Calendar size={15} className="text-primary" />
                      <span className="fw-semibold text-dark fs-9">Schedule launch</span>
                    </div>
                    <span className="text-muted fs-9">Optional</span>
                  </div>
                  <Input
                    name="scheduledAt"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                  <span className="text-muted fs-9 d-block mt-1">Leave empty to dispatch campaign immediately.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
                <div className="d-grid gap-2 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    icon={Eye}
                    onClick={() => setShowPreviewModal(true)}
                    className="w-100 py-2.5 rounded-3"
                  >
                    Live Device Preview
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    icon={Mail}
                    onClick={() => setShowTestEmailModal(true)}
                    className="w-100 py-2.5 rounded-3"
                  >
                    Send Test Email
                  </Button>
                </div>

                <div className="pt-3 border-top text-center">
                  <p className="text-muted fs-9 mb-2.5">Ready to review your campaign before dispatch?</p>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={Send}
                    disabled={submitting || recipientCount === 0}
                    loading={submitting ? 'Creating Campaign...' : false}
                    className="w-100 py-3 rounded-3 fw-bold fs-8 shadow-sm"
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
          title={audienceMode === 'new_since_last_campaign' ? `New Student Roster (${recipientCount})` : `Target Candidate Roster (${recipientCount})`}
          subtitle={audienceMode === 'new_since_last_campaign' 
            ? `Students added after the last completed campaign${lastCampaignMeta ? ` (${lastCampaignMeta.title})` : ''}.` 
            : "List of students matching active audience filters who will receive this campaign."}
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
      </motion.div>
    </div>
  );
};

export default Composer;
