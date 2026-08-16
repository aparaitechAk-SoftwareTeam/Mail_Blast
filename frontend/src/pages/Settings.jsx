import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { useToast } from '../context/ToastContext';
import { Server, Shield, Mail, CheckCircle2, Cpu, Database, Activity, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';

const Settings = () => {
  const toast = useToast();
  const [smtpConfig, setSmtpConfig] = useState({
    provider: 'Brevo SMTP Relay',
    host: 'smtp-relay.brevo.com',
    port: 587,
    securityLabel: 'STARTTLS',
    fromName: 'Aparaitech Software',
    fromEmail: '',
    batchSize: 5,
    delayMs: 200,
    connectionStatus: 'Connected',
    domainStatus: 'Checking...'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);

  // Send test email modal / form state
  const [testRecipient, setTestRecipient] = useState('nileshrajpure037@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testDiagnosticResult, setTestDiagnosticResult] = useState(null);

  useEffect(() => {
    document.title = 'Aparaitech | Settings';
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings/smtp');
      setSmtpConfig(res.data);
    } catch (err) {
      console.error('Error loading SMTP settings:', err);
      toast.error('Failed to load active SMTP configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/settings/smtp', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        fromName: smtpConfig.fromName,
        fromEmail: smtpConfig.fromEmail,
        batchSize: smtpConfig.batchSize,
        delayMs: smtpConfig.delayMs
      });
      toast.success(res.data.message || 'SMTP settings updated successfully!');
      loadSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await api.post('/settings/smtp/test');
      setConnectionTestResult(res.data);
      if (res.data.success) {
        toast.success('SMTP Transport connected successfully!');
      } else {
        toast.error(res.data.message || 'SMTP connection failed');
      }
    } catch (err) {
      setConnectionTestResult({
        success: false,
        message: err.response?.data?.message || 'SMTP connection handshake failed'
      });
      toast.error('SMTP connection handshake failed');
    } finally {
      setTestingConnection(false);
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
      const res = await api.post('/settings/smtp/send-test', { targetEmail: testRecipient });
      setTestDiagnosticResult(res.data);
      toast.success('SMTP accepted test email!');
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
          <p className="mt-2 text-muted">Loading real SMTP configuration from backend...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="System & Delivery Settings" />

      <div className="page-container">
        <div className="row g-4">
          {/* Main SMTP Form & Diagnostic Tools */}
          <div className="col-12 col-lg-8">
            {/* Active Gateway Card */}
            <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
              {/* Header with Provider Badge */}
              <div className="d-flex align-items-center justify-content-between pb-3 border-bottom flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                    <Server size={20} />
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark m-0">SMTP / Mail Transporter Setup</h5>
                    <p className="text-muted small m-0 mt-0.5">Outbound recruitment email gateway parameters</p>
                  </div>
                </div>

                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill fs-9">
                  Brevo Production Relay
                </span>
              </div>

              {/* Dedicated Action Area: Test Connection */}
              <div className="p-3 bg-light rounded-3 mb-4 d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <Activity size={16} className="text-primary flex-shrink-0" />
                  <span className="text-muted fs-8">Verify active SMTP relay connection before dispatching email blasts.</span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={handleTestConnection}
                  loading={testingConnection ? 'Testing...' : false}
                  className="flex-shrink-0"
                >
                  Test Connection
                </Button>
              </div>

              {connectionTestResult && (
                <div className={`alert border-0 rounded-3 mb-4 p-3 d-flex align-items-center gap-2 fs-8 ${connectionTestResult.success ? 'alert-success' : 'alert-danger'}`}>
                  {connectionTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{connectionTestResult.message}</span>
                </div>
              )}

              <form onSubmit={handleSave}>
                <div className="row g-3">
                  <div className="col-12 col-md-8">
                    <Input
                      label="SMTP Host Server"
                      name="host"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      placeholder="smtp-relay.brevo.com"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <Input
                      label="Port"
                      name="port"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                      placeholder="587"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Sender Display Name"
                      name="fromName"
                      value={smtpConfig.fromName}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                      placeholder="Aparaitech Software"
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Sender Email Address"
                      name="fromEmail"
                      type="email"
                      value={smtpConfig.fromEmail}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                      placeholder="krushnarathod.aparaitech@gmail.com"
                      required
                    />
                  </div>
                </div>

                <h6 className="fw-bold text-dark mt-4 mb-3 pt-3 border-top">Queue & Rate Limiting Controls</h6>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <Input
                      label="Batch Size (Emails / Cycle)"
                      name="batchSize"
                      type="number"
                      value={smtpConfig.batchSize}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, batchSize: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <Input
                      label="Delay Between Emails (ms)"
                      name="delayMs"
                      type="number"
                      value={smtpConfig.delayMs}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, delayMs: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" variant="primary" loading={saving ? 'Saving Config...' : false}>
                  Save Configuration
                </Button>
              </form>
            </div>

            {/* Send Real Test Email Diagnostic Card */}
            <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
              <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2.5 rounded-3 bg-primary-subtle text-primary">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h5 className="fw-bold text-dark m-0">Send Test Email Diagnostic</h5>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 rounded-pill fs-9">
                        Verify SMTP Delivery
                      </span>
                    </div>
                    <p className="text-muted small m-0 mt-0.5">
                      Dispatch a minimal test email through the active Brevo transporter to verify real SMTP relay delivery.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSendTestEmail} className="mb-3">
                <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-end gap-3">
                  <div className="flex-grow-1">
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
                  <div className="flex-shrink-0">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      icon={Send} 
                      className="w-100 py-2.5 px-4 rounded-3" 
                      style={{ minWidth: '170px' }}
                      loading={sendingTest ? 'Sending...' : false}
                    >
                      Send Test Email
                    </Button>
                  </div>
                </div>
              </form>

              {testDiagnosticResult && (
                <div className="p-3.5 bg-success-subtle border border-success-subtle rounded-3 text-dark fs-8">
                  <div className="d-flex align-items-center gap-1.5 text-success fw-bold mb-2.5">
                    <CheckCircle2 size={16} />
                    <span>SMTP Accepted the Test Email</span>
                  </div>
                  <div className="row g-2 mb-2.5">
                    <div className="col-12 col-sm-6">
                      <span className="text-muted d-block fs-9">Recipient:</span>
                      <span className="fw-semibold text-break">{testDiagnosticResult.recipient}</span>
                    </div>
                    <div className="col-12 col-sm-6">
                      <span className="text-muted d-block fs-9">Sender:</span>
                      <span className="fw-semibold text-break">{testDiagnosticResult.sender}</span>
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
                  <div className="p-2.5 bg-white rounded-3 border text-muted fs-9">
                    <strong>Important:</strong> SMTP accepted the email. Final inbox placement depends on recipient mail provider filters.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Active Gateway Status */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Shield size={20} className="text-primary" />
                <h6 className="fw-bold text-dark m-0">Active Gateway Overview</h6>
              </div>
              <p className="text-muted small mb-4">
                Real-time active SMTP transporter and cluster status parameters.
              </p>

              <div className="space-y-3 small">
                <div className="p-3 bg-light rounded-3 mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span className="text-muted">SMTP Provider:</span>
                  <span className="fw-semibold text-dark text-break">{smtpConfig.provider || 'Brevo SMTP Relay'}</span>
                </div>

                <div className="p-3 bg-light rounded-3 mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span className="text-muted">Host Server:</span>
                  <code className="text-dark bg-white px-1.5 py-0.5 rounded border fs-9 text-break">{smtpConfig.host}</code>
                </div>

                <div className="p-3 bg-light rounded-3 mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span className="text-muted">Port & Protocol:</span>
                  <span className="badge bg-primary-subtle text-primary fw-bold text-wrap">{smtpConfig.port} ({smtpConfig.securityLabel || 'STARTTLS'})</span>
                </div>

                <div className="p-3 bg-light rounded-3 mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span className="text-muted">Sender Display:</span>
                  <span className="fw-semibold text-dark text-break">{smtpConfig.fromName}</span>
                </div>

                <div className="p-3 bg-light rounded-3 mb-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <span className="text-muted">Sender Email:</span>
                  <code className="text-dark bg-white px-1.5 py-0.5 rounded border fs-9 text-break" style={{ wordBreak: 'break-all' }}>{smtpConfig.fromEmail}</code>
                </div>

                <div className="p-3 bg-light rounded-3 mb-2 d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2">
                  <span className="text-muted flex-shrink-0">Domain Auth Status:</span>
                  <span 
                    className={`badge px-2.5 py-1.5 rounded-2 text-wrap text-start ${smtpConfig.isCustomDomainAuthenticated ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}
                    style={{ whiteSpace: 'normal', lineHeight: '1.45', maxWidth: '100%', wordBreak: 'break-word' }}
                  >
                    {smtpConfig.domainStatus || 'Checking...'}
                  </span>
                </div>

                <div className="p-3 bg-light rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Activity size={16} className="text-success" />
                    <span className="fw-semibold text-dark">Connection Status</span>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 rounded-pill">
                    Connected
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
