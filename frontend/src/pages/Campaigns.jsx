import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { fetchCampaigns } from '../services/campaignService';
import { formatDate } from '../utils/formatters';
import { Eye, RefreshCw, Send, AlertTriangle } from 'lucide-react';

import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

import { useContext } from 'react';
import { RefreshContext } from '../context/RefreshContext';

const Campaigns = () => {
  const { refreshKey } = useContext(RefreshContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchCampaigns({ status: statusFilter });
      setCampaigns(res.campaigns || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Aparaitech | Campaigns';
    loadData();
  }, [statusFilter, refreshKey]);

  return (
    <div>
      <Navbar title="Campaign History & Progress Tracker" />

      <div className="page-container">
        {/* Controls & Status Filter Bar */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              {['', 'Sending', 'Completed', 'Scheduled', 'Draft', 'Failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`btn btn-sm ${statusFilter === st ? 'btn-primary-custom' : 'btn-outline-custom'}`}
                >
                  {st === '' ? 'All Statuses' : st}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
              Refresh Tracker
            </Button>
          </div>
        </div>

        {/* Campaign Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>Campaign Title</th>
                  <th>Created By</th>
                  <th>Total Targeted</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Dispatch Progress</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={8} />
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState
                        title="No campaigns found"
                        description="No email campaigns match your current status filter."
                      />
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => {
                    const total = c.totalRecipients || 1;
                    const progressPct = Math.min(100, Math.round(((c.sentCount || 0) + (c.failedCount || 0)) / total * 100));

                    return (
                      <tr key={c._id}>
                        <td>
                          <Link to={`/campaigns/${c._id}`} className="fw-bold text-dark text-decoration-none">
                            {c.title}
                          </Link>
                          <div className="small text-muted">{formatDate(c.createdAt)}</div>
                        </td>
                        <td className="fw-medium">{c.createdByName || 'Recruiter'}</td>
                        <td className="fw-semibold">{c.totalRecipients}</td>
                        <td className="text-success fw-bold">{c.sentCount || 0}</td>
                        <td className="text-danger fw-bold">{c.failedCount || 0}</td>
                        <td style={{ minWidth: '160px' }}>
                          <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--border)' }}>
                            <div 
                              className={`progress-bar ${c.status === 'Sending' ? 'progress-animated' : 'bg-primary'}`} 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="small text-muted mt-1 fs-8">{progressPct}% completed</div>
                        </td>
                        <td>
                          <StatusBadge status={c.status} type="campaign" />
                        </td>
                        <td className="text-end">
                          <Link to={`/campaigns/${c._id}`} className="btn btn-sm btn-outline-custom">
                            <Eye size={14} className="me-1" />
                            View Tracker
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
