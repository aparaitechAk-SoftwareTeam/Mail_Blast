import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { fetchCampaignById, launchCampaign, retryFailedEmails, fetchDeliveryStatus } from '../services/campaignService';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { Play, RefreshCw, CheckCircle2, AlertOctagon, Clock, Users, ArrowLeft, XCircle, Activity, Info } from 'lucide-react';

import { RefreshContext } from '../context/RefreshContext';

const CampaignDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const { refreshKey } = useContext(RefreshContext);
  const toast = useToast();

  const [campaign, setCampaign] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState('');
  const [launching, setLaunching] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showConfirmLaunch, setShowConfirmLaunch] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null);
  const [checkingDiagnostic, setCheckingDiagnostic] = useState(false);

  const handleCheckBrevoStatus = async (logItem) => {
    if (!logItem?.messageId && !logItem?._id) {
      toast.error('No delivery log identifier available');
      return;
    }
    setCheckingDiagnostic(true);
    try {
      const targetParam = logItem.messageId || logItem._id;
      const data = await fetchDeliveryStatus(targetParam);
      setSelectedDiagnostic(data);
    } catch (err) {
      console.error('Diagnostic error:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch Brevo delivery status');
    } finally {
      setCheckingDiagnostic(false);
    }
  };

  // Live WebSocket progress state
  const [liveProgress, setLiveProgress] = useState(null);

  const loadData = async () => {
    try {
      const data = await fetchCampaignById(id);
      setCampaign(data.campaign);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching campaign detail:', err);
      toast.error('Failed to load campaign detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Aparaitech | Campaign Tracker';
    loadData();
  }, [id, refreshKey]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:campaign', id);

    socket.on('campaign:progress', (data) => {
      setLiveProgress(data);
      setCampaign((prev) => prev ? { ...prev, sentCount: data.sentCount, failedCount: data.failedCount, status: data.status } : prev);
    });

    socket.on('campaign:email-status', (emailData) => {
      setLogs((prevLogs) => {
        return prevLogs.map(l => {
          if (String(l._id) === String(emailData.logId) || l.recipientEmail === emailData.recipientEmail) {
            return {
              ...l,
              status: emailData.status || l.status,
              deliveryStatus: emailData.deliveryStatus || l.deliveryStatus,
              messageId: emailData.messageId || l.messageId,
              smtpResponse: emailData.smtpResponse || l.smtpResponse,
              accepted: emailData.accepted !== undefined ? emailData.accepted : l.accepted,
              rejected: emailData.rejected !== undefined ? emailData.rejected : l.rejected,
              sentAt: emailData.sentAt || l.sentAt || new Date(),
              errorMessage: emailData.error || ''
            };
          }
          return l;
        });
      });
    });

    return () => {
      socket.emit('leave:campaign', id);
      socket.off('campaign:progress');
      socket.off('campaign:email-status');
    };
  }, [socket, id]);

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await launchCampaign(id);
      toast.success('Campaign launch triggered! Processing queue...');
      setShowConfirmLaunch(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error launching campaign');
    } finally {
      setLaunching(false);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      await retryFailedEmails(id);
      toast.success('Retrying failed recipient logs in background queue...');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error triggering retry');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar title="Campaign Tracker" />
        <div className="page-container text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading campaign details & connecting Socket.IO live stream...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div>
        <Navbar title="Campaign Not Found" />
        <div className="page-container text-center py-5">
          <EmptyState
            title="Campaign record not found"
            description="The requested campaign ID does not exist in our system."
            actionText="Back to Campaigns"
            onAction={() => window.location.href = '/campaigns'}
          />
        </div>
      </div>
    );
  }

  const sent = liveProgress ? liveProgress.sentCount : (campaign.sentCount || 0);
  const failed = liveProgress ? liveProgress.failedCount : (campaign.failedCount || 0);
  const total = campaign.totalRecipients || 1;
  const pending = Math.max(0, total - (sent + failed));
  const progressPct = liveProgress ? liveProgress.progressPct : Math.min(100, Math.round((sent + failed) / total * 100));

  const filteredLogs = logs.filter(l => !logFilter || l.status === logFilter);

  return (
    <div>
      <Navbar title={`Tracker: ${campaign.title}`} />

      <div className="page-container">
        {/* Header Bar */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <Link to="/campaigns" className="btn btn-icon btn-outline-custom p-2 rounded-circle">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h4 className="fw-bold text-dark m-0">{campaign.title}</h4>
              <span className="text-muted small">Created by {campaign.createdByName || 'Recruiter'} on {formatDate(campaign.createdAt)}</span>
            </div>
          </div>

          {user?.role !== 'Viewer' && (
            <div className="d-flex align-items-center gap-2">
              {campaign.status === 'Draft' || campaign.status === 'Scheduled' ? (
                <Button variant="primary" icon={Play} onClick={() => setShowConfirmLaunch(true)}>
                  Dispatch Campaign Now
                </Button>
              ) : null}

              {failed > 0 && (
                <Button variant="outline" icon={RefreshCw} onClick={handleRetryFailed} loading={retrying ? 'Retrying...' : false}>
                  Retry Failed ({failed})
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Live Progress Bar Widget */}
        <div className="card border-0 shadow-sm rounded-4 mb-4 text-white p-4 p-md-5" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)' }}>
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <StatusBadge status={campaign.status} type="campaign" />
              {liveProgress?.currentRecipient && (
                <span className="text-white-50 small">
                  Sending to: <code className="text-info">{liveProgress.currentRecipient}</code>
                </span>
              )}
            </div>
            <h2 className="fw-bold m-0">{progressPct}%</h2>
          </div>

          <div className="progress mb-3" style={{ height: '14px', borderRadius: '7px', backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <div 
              className={`progress-bar ${campaign.status === 'Sending' ? 'progress-animated' : 'bg-primary'}`} 
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Real-time Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Target Recipients"
              value={total}
              icon={Users}
              color="primary"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="SMTP Accepted"
              value={sent}
              icon={CheckCircle2}
              color="success"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Failed Deliveries"
              value={failed}
              icon={XCircle}
              color="danger"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Pending Queue"
              value={pending}
              icon={Clock}
              color="warning"
            />
          </div>
        </div>

        {/* Live Socket.IO Feed Banner */}
        <div className="alert alert-info border-0 rounded-4 p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2.5">
            <Activity className="text-info" size={20} />
            <div>
              <span className="fw-semibold text-dark">Socket.IO Live Progress Stream:</span>
              <span className="text-muted ms-2 small">
                {liveProgress ? `${liveProgress.progressPct}% Processed (${liveProgress.sentCount} sent, ${liveProgress.failedCount} failed)` : 'Connected'}
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-info-subtle text-info border border-info-subtle px-2.5 py-1 rounded-pill">
              Progress: {progressPct}%
            </span>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="alert alert-light border rounded-4 p-3 mb-4 d-flex align-items-center gap-2 fs-8 text-muted">
          <Info size={18} className="text-primary flex-shrink-0" />
          <span>
            <strong>SMTP Accepted</strong> means the email was successfully accepted by the Brevo SMTP relay server. Final inbox placement depends on the recipient's mail provider filters and domain DMARC configuration.
          </span>
        </div>

        {/* Recipient Logs Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
            <h5 className="fw-bold text-dark m-0">Recipients Delivery Details & Diagnostics</h5>
            
            <div className="d-flex align-items-center gap-2">
              <input
                className="form-control form-control-sm"
                placeholder="Filter by name or email..."
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                style={{ width: '260px' }}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Recipient Candidate</th>
                  <th>Email Address</th>
                  <th>Delivery Status</th>
                  <th>Message ID</th>
                  <th>SMTP Response / Failure Reason</th>
                  <th>Timestamp</th>
                  <th>Diagnostic</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState title="No log entries" description="No recipient logs match your filter." />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(l => (
                    <tr key={l._id}>
                      <td className="fw-bold text-dark">{l.recipientName}</td>
                      <td>{l.recipientEmail}</td>
                      <td>
                        <StatusBadge status={l.status === 'Sent' ? 'Accepted' : l.status} type="emailLog" />
                      </td>
                      <td>
                        {l.messageId ? (
                          <code className="text-dark bg-light px-1.5 py-0.5 rounded border fs-9 text-break d-inline-block" title={l.messageId} style={{ maxWidth: '240px' }}>
                            {l.messageId}
                          </code>
                        ) : l.status === 'Pending' ? (
                          <span className="text-muted fs-9 fst-italic">Pending...</span>
                        ) : (
                          <span className="text-muted fs-9">—</span>
                        )}
                      </td>
                      <td className="small text-break">
                        {l.errorMessage ? (
                          <span className="text-danger fw-semibold">{l.errorMessage}</span>
                        ) : l.smtpResponse ? (
                          <span className="text-muted font-monospace fs-9">{l.smtpResponse}</span>
                        ) : '—'}
                      </td>
                      <td className="text-muted small">{l.sentAt ? formatDate(l.sentAt) : 'Pending'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0.5 px-2 fs-9 rounded-2 d-inline-flex align-items-center gap-1"
                          onClick={() => handleCheckBrevoStatus(l)}
                        >
                          <Activity size={12} />
                          Check Brevo
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Launch Confirm Modal */}
        <ConfirmDialog
          isOpen={showConfirmLaunch}
          onClose={() => setShowConfirmLaunch(false)}
          onConfirm={handleLaunch}
          title={`Dispatch Email Blast to ${total} Candidates?`}
          description={`Are you sure you want to launch campaign "${campaign.title}"? Emails will be queued and sent immediately.`}
          confirmText="Launch Campaign Now"
          variant="primary"
          loading={launching}
        />

        {/* Diagnostic Breakdown Modal */}
        {selectedDiagnostic && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content rounded-4 border-0 shadow">
                <div className="modal-header border-bottom pb-3">
                  <div className="d-flex align-items-center gap-2">
                    <Activity className="text-primary" size={20} />
                    <h5 className="modal-title fw-bold">Brevo Transactional Diagnostic Breakdown</h5>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedDiagnostic(null)} />
                </div>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded-3 mb-3 border">
                    <div className="row g-2 small">
                      <div className="col-12 col-sm-6">
                        <span className="text-muted d-block fs-9">Recipient:</span>
                        <span className="fw-semibold text-dark">{selectedDiagnostic.recipient}</span>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted d-block fs-9">Local Status:</span>
                        <span className="fw-semibold text-dark">{selectedDiagnostic.localStatus}</span>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted d-block fs-9">Brevo Delivery Status:</span>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">{selectedDiagnostic.brevoStatus}</span>
                      </div>
                      <div className="col-12 col-sm-6">
                        <span className="text-muted d-block fs-9">Timestamp:</span>
                        <span className="text-muted">{formatDate(selectedDiagnostic.timestamp)}</span>
                      </div>
                      <div className="col-12">
                        <span className="text-muted d-block fs-9">Message ID:</span>
                        <code className="text-dark bg-white px-2 py-1 rounded border d-block text-break fs-9">
                          {selectedDiagnostic.messageId || 'None recorded'}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-primary-subtle border border-primary-subtle rounded-3 mb-3">
                    <h6 className="fw-bold text-primary m-0 mb-1">Diagnostic Explanation</h6>
                    <p className="small text-dark m-0">{selectedDiagnostic.diagnosis}</p>
                  </div>

                  {selectedDiagnostic.reason && (
                    <div className="p-3 bg-warning-subtle border border-warning-subtle rounded-3">
                      <span className="fw-bold text-dark fs-9 d-block mb-1">Provider Reason / SMTP Detail:</span>
                      <code className="text-dark bg-white p-2 rounded border d-block fs-9 text-break">{selectedDiagnostic.reason}</code>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-top pt-3">
                  <Button variant="secondary" onClick={() => setSelectedDiagnostic(null)}>
                    Close Diagnostic
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
