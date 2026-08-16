import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../components/common/Navbar';
import { useToast } from '../context/ToastContext';
import { SocketContext } from '../context/SocketContext';
import { 
  Server, 
  Shield, 
  Mail, 
  CheckCircle2, 
  Activity, 
  RefreshCw, 
  Send, 
  AlertTriangle, 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  Lock, 
  Layers,
  Zap,
  Globe,
  User,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import api from '../services/api';
import { 
  fetchSmtpGateways, 
  createSmtpGateway, 
  updateSmtpGateway, 
  deleteSmtpGateway, 
  testSmtpGatewayConnection 
} from '../services/campaignService';
import { formatDate } from '../utils/formatters';

const Settings = () => {
  const toast = useToast();
  const socket = useContext(SocketContext);
  const [loading, setLoading] = useState(true);

  // Gateway Pool State
  const [gatewaysData, setGatewaysData] = useState({ totalCount: 0, maxAllowed: 3, canAddMore: true, gateways: [] });
  const [testingGatewayId, setTestingGatewayId] = useState(null);

  // Modal State
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [savingGateway, setSavingGateway] = useState(false);
  const [gatewayForm, setGatewayForm] = useState({
    gatewayName: '',
    provider: 'Brevo SMTP Relay',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: '',
    fromName: 'Aparaitech Software',
    fromEmail: 'krushnarathod.aparaitech@gmail.com',
    dailyQuota: 300
  });

  const [showPassword, setShowPassword] = useState(false);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Send test email state
  const [selectedTestGatewayId, setSelectedTestGatewayId] = useState('');
  const [testRecipient, setTestRecipient] = useState('nileshrajpure037@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testDiagnosticResult, setTestDiagnosticResult] = useState(null);

  useEffect(() => {
    document.title = 'Aparaitech | System & Gateway Settings';
    loadGateways();

    const interval = setInterval(() => {
      loadGateways();
    }, 30000);

    if (socket) {
      const handleLiveUpdate = () => {
        loadGateways();
      };
      socket.on('campaign:progress', handleLiveUpdate);
      socket.on('campaign:email-status', handleLiveUpdate);

      return () => {
        clearInterval(interval);
        socket.off('campaign:progress', handleLiveUpdate);
        socket.off('campaign:email-status', handleLiveUpdate);
      };
    }

    return () => clearInterval(interval);
  }, [socket]);

  const loadGateways = async () => {
    try {
      const data = await fetchSmtpGateways();
      setGatewaysData(data);
      if (data.gateways && data.gateways.length > 0 && !selectedTestGatewayId) {
        setSelectedTestGatewayId(data.gateways[0]._id);
      }
    } catch (err) {
      console.error('Error loading SMTP gateways:', err);
      toast.error('Failed to load SMTP gateway pool');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingGateway(null);
    setGatewayForm({
      gatewayName: `Brevo Gateway 0${(gatewaysData?.gateways?.length || 0) + 1}`,
      provider: 'Brevo SMTP Relay',
      smtpHost: 'smtp-relay.brevo.com',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPass: '',
      fromName: 'Aparaitech Software',
      fromEmail: 'nileshrajpure5888@gmail.com',
      dailyQuota: 300
    });
    setShowGatewayModal(true);
  };

  const handleOpenEditModal = (gw) => {
    setEditingGateway(gw);
    setGatewayForm({
      gatewayName: gw.gatewayName || '',
      provider: gw.provider || 'Brevo SMTP Relay',
      smtpHost: gw.smtpHost || 'smtp-relay.brevo.com',
      smtpPort: gw.smtpPort || 587,
      smtpSecure: !!gw.smtpSecure,
      smtpUser: gw.smtpUser || '',
      smtpPass: '••••••••',
      fromName: gw.fromName || 'Aparaitech Software',
      fromEmail: gw.fromEmail || '',
      dailyQuota: gw.dailyQuota || 300
    });
    setShowGatewayModal(true);
  };

  const handleSaveGateway = async (e) => {
    e.preventDefault();
    if (!gatewayForm.gatewayName || !gatewayForm.fromEmail) {
      toast.error('Gateway name and sender email address are required');
      return;
    }

    setSavingGateway(true);
    try {
      if (editingGateway) {
        await updateSmtpGateway(editingGateway._id, gatewayForm);
        toast.success(`SMTP Gateway "${gatewayForm.gatewayName}" updated successfully!`);
      } else {
        await createSmtpGateway(gatewayForm);
        toast.success(`SMTP Gateway "${gatewayForm.gatewayName}" created successfully!`);
      }
      setShowGatewayModal(false);
      loadGateways();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save gateway configuration');
    } finally {
      setSavingGateway(false);
    }
  };

  const handleToggleGatewayStatus = async (gw) => {
    try {
      const updatedStatus = !gw.isActive;
      await updateSmtpGateway(gw._id, { isActive: updatedStatus });
      toast.success(`Gateway "${gw.gatewayName}" ${updatedStatus ? 'enabled' : 'disabled'}`);
      loadGateways();
    } catch (err) {
      toast.error('Failed to toggle gateway status');
    }
  };

  const handleDeleteGateway = async () => {
    if (!deleteConfirm.id) return;
    setDeletingGateway(true);
    try {
      await deleteSmtpGateway(deleteConfirm.id);
      toast.success(`SMTP Gateway "${deleteConfirm.name}" deleted`);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
      loadGateways();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete SMTP gateway');
    } finally {
      setDeletingGateway(false);
    }
  };

  const handleTestGatewayConnection = async (gwId) => {
    setTestingGatewayId(gwId);
    try {
      const res = await testSmtpGatewayConnection(gwId);
      if (res.success) {
        toast.success(res.message || 'SMTP Gateway connected successfully!');
      } else {
        toast.error(res.message || 'Gateway connection test failed');
      }
      loadGateways();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Connection test failed');
    } finally {
      setTestingGatewayId(null);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testRecipient || !testRecipient.includes('@')) {
      toast.error('Valid recipient test email address is required');
      return;
    }
    setSendingTest(true);
    setTestDiagnosticResult(null);

    try {
      const res = await api.post('/settings/smtp/send-test', {
        targetEmail: testRecipient,
        gatewayId: selectedTestGatewayId || null
      });
      setTestDiagnosticResult(res.data);
      toast.success('SMTP accepted the test email!');
      loadGateways();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar title="System & Delivery Settings" />
        <div className="page-container text-center py-5">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2 text-muted">Loading SMTP Gateway pool from backend...</p>
        </div>
      </div>
    );
  }

  const { gateways = [] } = gatewaysData;

  return (
    <div>
      <Navbar title="System & Delivery Settings" />

      <div className="page-container">
        {/* 1. Header & Gateway Pool Counter */}
        <div className="d-flex align-items-sm-center justify-content-between mb-4 flex-column flex-sm-row gap-3">
          <div>
            <div className="text-uppercase text-primary fw-bold tracking-wider fs-9 mb-1" style={{ letterSpacing: '0.08em' }}>
              SMTP INFRASTRUCTURE
            </div>
            <h4 className="fw-bold text-dark m-0">SMTP Gateway Pool</h4>
            <p className="text-muted small m-0 mt-0.5">Manage authorized Brevo SMTP delivery gateways and monitor daily capacity.</p>
          </div>

          <div className="d-flex align-items-center gap-2.5">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fs-8 fw-bold">
              {gateways.length} / 3 SMTP Gateways
            </span>
            {gateways.length < 3 ? (
              <Button 
                variant="primary" 
                icon={Plus} 
                onClick={handleOpenAddModal}
                style={{ borderRadius: '10px', height: '40px' }}
                aria-label="Add Gateway"
              >
                Add Gateway
              </Button>
            ) : (
              <button 
                disabled 
                className="btn btn-outline-secondary rounded-pill px-3 py-2 fs-8 fw-semibold" 
                style={{ height: '40px', opacity: 0.7 }}
              >
                3 / 3 Limit Reached
              </button>
            )}
          </div>
        </div>

        {/* 2. SMTP Gateway Cards Grid (Equal Heights & Premium Simple Admin Layout) */}
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 mb-4">
          {gateways.map((gw) => {
            const hasUsageData = typeof gw.dailyUsage === 'number' && typeof gw.dailyQuota === 'number' && typeof gw.remainingCapacity === 'number';
            const usagePct = hasUsageData 
              ? (typeof gw.usagePercentage === 'number' ? gw.usagePercentage : Math.min(100, Math.round((gw.dailyUsage / gw.dailyQuota) * 100))) 
              : 0;

            const isTesting = testingGatewayId === gw._id;
            const statusClass = 
              gw.connectionStatus === 'Connected' ? 'bg-success-subtle text-success border-success-subtle' :
              gw.connectionStatus === 'Quota Reached' ? 'bg-warning-subtle text-warning-emphasis border-warning-subtle' :
              gw.connectionStatus === 'Inactive' ? 'bg-secondary-subtle text-secondary border-secondary-subtle' :
              'bg-danger-subtle text-danger border-danger-subtle';

            return (
              <div key={gw._id} className="col d-flex">
                <div 
                  className="card border shadow-sm bg-white p-4 w-100 d-flex flex-column h-100" 
                  style={{ borderRadius: '16px', borderColor: '#E5E7EB' }}
                >
                  
                  {/* Card Header (Gateway Name, Provider, Status Pill) */}
                  <div className="d-flex align-items-start justify-content-between mb-3 pb-3 border-bottom gap-2">
                    <div className="d-flex align-items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-3 bg-primary-subtle text-primary flex-shrink-0" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Server size={20} />
                      </div>
                      <div className="min-w-0">
                        <h6 className="fw-semibold text-dark m-0 fs-6" style={{ whiteSpace: 'nowrap' }}>{gw.gatewayName}</h6>
                        <span className="text-muted fs-8 d-block" style={{ whiteSpace: 'nowrap' }}>{gw.provider || 'Brevo SMTP Relay'}</span>
                      </div>
                    </div>

                    <span className={`badge px-2.5 py-1 rounded-pill fs-9 fw-semibold border ${statusClass} flex-shrink-0`}>
                      ● {gw.connectionStatus || 'Connected'}
                    </span>
                  </div>

                  {/* Clean 3-Row Information Block (No Nested Cards, Two Columns) */}
                  <div className="d-flex flex-column gap-2 mb-3.5 fs-8">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="text-muted fs-9 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>SMTP Host</span>
                      <span className="fw-semibold text-dark fs-9 font-monospace text-end" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {gw.smtpHost}:{gw.smtpPort}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="text-muted fs-9 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>Sender</span>
                      <span className="fw-semibold text-dark fs-9 text-end" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {gw.fromName}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="text-muted fs-9 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>From</span>
                      <span className="fw-semibold text-dark fs-9 text-end font-monospace" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {gw.fromEmail}
                      </span>
                    </div>
                  </div>

                  {/* Today's Usage Breakdown (Visual Focus) */}
                  <div className="p-3 rounded-3 bg-light border mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <span className="text-muted fs-9 fw-semibold text-uppercase" style={{ letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>TODAY'S USAGE</span>
                      <span className="fw-bold text-dark fs-5 font-monospace">
                        {hasUsageData ? `${gw.dailyUsage} / ${gw.dailyQuota} emails` : 'Usage unavailable'}
                      </span>
                    </div>

                    <div className="progress mb-1.5" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#E2E8F0' }}>
                      <div 
                        className={`progress-bar ${usagePct >= 90 ? 'bg-danger' : usagePct >= 75 ? 'bg-warning' : 'bg-primary'}`} 
                        role="progressbar" 
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>

                    <div className="text-muted fs-9 mb-2.5 text-end fw-semibold text-dark">
                      {hasUsageData ? `${usagePct}% used` : 'N/A'}
                    </div>

                    <div className="pt-2 border-top row text-center g-1 align-items-center fs-9">
                      <div className="col-4">
                        <span className="text-muted d-block fs-9" style={{ whiteSpace: 'nowrap' }}>REMAINING</span>
                        <span className="fw-bold text-dark d-block fs-6">{hasUsageData ? `${gw.remainingCapacity}` : '—'}</span>
                        <span className="text-muted fs-9">emails</span>
                      </div>
                      <div className="col-4 border-start border-end">
                        <span className="text-muted d-block fs-9" style={{ whiteSpace: 'nowrap' }}>USED</span>
                        <span className="fw-bold text-primary d-block fs-6">{hasUsageData ? `${gw.dailyUsage}` : '—'}</span>
                        <span className="text-muted fs-9">emails</span>
                      </div>
                      <div className="col-4">
                        <span className="text-muted d-block fs-9" style={{ whiteSpace: 'nowrap' }}>DAILY LIMIT</span>
                        <span className="fw-bold text-dark d-block fs-6">{hasUsageData ? `${gw.dailyQuota}` : '—'}</span>
                        <span className="text-muted fs-9">emails</span>
                      </div>
                    </div>
                  </div>

                  {/* Compact Last Activity Section */}
                  <div className="d-flex flex-column gap-1.5 text-muted fs-9 mb-3.5 px-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Last sent</span>
                      <span className="fw-semibold text-dark">{gw.lastSuccessfulSend ? formatDate(gw.lastSuccessfulSend) : 'Never'}</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Last tested</span>
                      <span className="fw-semibold text-dark">{gw.lastConnectionTest ? formatDate(gw.lastConnectionTest) : 'Never'}</span>
                    </div>
                  </div>

                  {/* Action Bar (Pinned to Bottom) */}
                  <div className="mt-auto pt-3 border-top d-flex align-items-center justify-content-between gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={RefreshCw}
                      onClick={() => handleTestGatewayConnection(gw._id)}
                      loading={isTesting ? 'Testing...' : false}
                      className="flex-grow-1"
                      style={{ borderRadius: '8px', height: '38px', fontSize: '0.85rem' }}
                    >
                      Test Connection
                    </Button>

                    <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(gw)}
                        className="btn btn-sm btn-outline-secondary p-0 d-inline-flex align-items-center justify-content-center"
                        title="Edit gateway"
                        aria-label={`Edit ${gw.gatewayName}`}
                        style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() => handleToggleGatewayStatus(gw)}
                        className={`btn btn-sm ${gw.isActive ? 'btn-outline-success' : 'btn-outline-secondary'} p-0 d-inline-flex align-items-center justify-content-center`}
                        title={gw.isActive ? 'Disable gateway' : 'Enable gateway'}
                        aria-label={`${gw.isActive ? 'Disable' : 'Enable'} ${gw.gatewayName}`}
                        style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                      >
                        <Power size={16} />
                      </button>

                      {gateways.length > 1 && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: gw._id, name: gw.gatewayName })}
                          className="btn btn-sm btn-outline-danger p-0 d-inline-flex align-items-center justify-content-center"
                          title="Delete gateway"
                          aria-label={`Delete ${gw.gatewayName}`}
                          style={{ width: '38px', height: '38px', borderRadius: '8px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Send Test Email Diagnostic with Gateway Selector */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary" style={{ width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} />
              </div>
              <div>
                <h5 className="fw-bold text-dark m-0">Send Test Email Diagnostic</h5>
                <p className="text-muted small m-0 mt-0.5">
                  Dispatch a real test email through any authorized SMTP Gateway to verify deliverability.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendTestEmail} className="mb-3">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-5">
                <Select
                  label="SMTP Gateway"
                  name="selectedTestGatewayId"
                  value={selectedTestGatewayId}
                  onChange={(e) => setSelectedTestGatewayId(e.target.value)}
                  options={gateways.map(g => ({
                    value: g._id,
                    label: `${g.gatewayName} (${g.remainingCapacity} / ${g.dailyQuota} remaining)`
                  }))}
                />
              </div>

              <div className="col-12 col-md-5">
                <Input
                  label="Test Recipient Mailbox"
                  name="testRecipient"
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="nileshrajpure037@gmail.com"
                  className="m-0"
                  required
                />
              </div>

              <div className="col-12 col-md-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={Send} 
                  className="w-100 py-2.5 rounded-3" 
                  style={{ height: '42px' }}
                  loading={sendingTest ? 'Sending...' : false}
                >
                  Send Test
                </Button>
              </div>
            </div>
          </form>

          {testDiagnosticResult && (
            <div className="p-3.5 bg-success-subtle border border-success-subtle rounded-3 text-dark fs-8 mt-3">
              <div className="d-flex align-items-center gap-1.5 text-success fw-bold mb-2.5">
                <CheckCircle2 size={16} />
                <span>SMTP Accepted the Test Email via {testDiagnosticResult.gatewayName || 'Selected Gateway'}</span>
              </div>
              <div className="row g-2 mb-2.5">
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-9">Gateway:</span>
                  <span className="fw-semibold text-dark">{testDiagnosticResult.gatewayName || 'Primary Gateway'}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-9">Recipient:</span>
                  <span className="fw-semibold text-break">{testDiagnosticResult.recipient}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-9">Sender:</span>
                  <span className="fw-semibold text-break">{testDiagnosticResult.sender}</span>
                </div>
                <div className="col-12 col-sm-6">
                  <span className="text-muted d-block fs-9">Accepted:</span>
                  <span className="fw-semibold text-success">{testDiagnosticResult.accepted ? 'Yes' : 'No'}</span>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block fs-9">Message ID:</span>
                  <code className="text-dark bg-white px-2 py-1 rounded border d-block text-break fs-9">{testDiagnosticResult.messageId}</code>
                </div>
                <div className="col-12">
                  <span className="text-muted d-block fs-9">SMTP Server Response:</span>
                  <code className="text-muted bg-white px-2 py-1 rounded border d-block text-break fs-9">{testDiagnosticResult.smtpResponse}</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Add / Edit Gateway Modal */}
        <Modal
          isOpen={showGatewayModal}
          onClose={() => setShowGatewayModal(false)}
          title={editingGateway ? "Edit SMTP Gateway" : "Add SMTP Gateway"}
          subtitle="Configure outbound SMTP credentials and daily sending quota."
          size="md"
          footer={
            <div className="d-flex align-items-center justify-content-end gap-2 w-100">
              <Button variant="ghost" onClick={() => setShowGatewayModal(false)} disabled={savingGateway}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveGateway} loading={savingGateway}>
                {editingGateway ? "Save Gateway" : "Create Gateway"}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveGateway} className="d-flex flex-column gap-3">
            <Input
              label="Gateway Name"
              name="gatewayName"
              value={gatewayForm.gatewayName}
              onChange={(e) => setGatewayForm({ ...gatewayForm, gatewayName: e.target.value })}
              placeholder="e.g. Brevo Gateway 02"
              required
            />

            <div className="row g-3">
              <div className="col-8">
                <Input
                  label="SMTP Host Server"
                  name="smtpHost"
                  value={gatewayForm.smtpHost}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, smtpHost: e.target.value })}
                  placeholder="smtp-relay.brevo.com"
                  required
                />
              </div>
              <div className="col-4">
                <Input
                  label="Port"
                  name="smtpPort"
                  value={gatewayForm.smtpPort}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, smtpPort: e.target.value })}
                  placeholder="587"
                  required
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <Input
                  label="Sender Display Name"
                  name="fromName"
                  value={gatewayForm.fromName}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, fromName: e.target.value })}
                  placeholder="Aparaitech Software"
                  required
                />
              </div>
              <div className="col-6">
                <Input
                  label="Sender Email Address"
                  name="fromEmail"
                  type="email"
                  value={gatewayForm.fromEmail}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, fromEmail: e.target.value })}
                  placeholder="krushnarathod.aparaitech@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-6">
                <Input
                  label="SMTP Username"
                  name="smtpUser"
                  value={gatewayForm.smtpUser}
                  onChange={(e) => setGatewayForm({ ...gatewayForm, smtpUser: e.target.value })}
                  placeholder="Brevo login or SMTP user"
                />
              </div>
              <div className="col-6">
                <label className="form-label fs-8 fw-semibold text-dark mb-1">SMTP Password / Key</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-custom"
                    name="smtpPass"
                    value={gatewayForm.smtpPass}
                    onChange={(e) => setGatewayForm({ ...gatewayForm, smtpPass: e.target.value })}
                    placeholder={editingGateway ? "•••••••• (Leave blank to keep unchanged)" : "Brevo SMTP Key"}
                    style={{ height: '42px', borderRadius: '10px 0 0 10px', fontSize: '0.875rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ height: '42px', borderRadius: '0 10px 10px 0', width: '42px' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-muted fs-9 mt-1 d-block">
                  {editingGateway ? 'Leave blank to keep existing credential unchanged.' : 'Configured specifically for this gateway.'}
                </span>
              </div>
            </div>

            <Input
              label="Daily Quota (Emails / Day)"
              name="dailyQuota"
              type="number"
              value={gatewayForm.dailyQuota}
              onChange={(e) => setGatewayForm({ ...gatewayForm, dailyQuota: e.target.value })}
              placeholder="300"
              required
            />
          </form>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
          onConfirm={handleDeleteGateway}
          title="Delete SMTP Gateway?"
          description={`Are you sure you want to remove "${deleteConfirm.name}" from the gateway pool? This action cannot be undone.`}
          confirmText="Delete Gateway"
          variant="danger"
          loading={deleting}
        />
      </div>
    </div>
  );
};

export default Settings;
