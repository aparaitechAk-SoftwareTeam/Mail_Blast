import React, { useEffect, useState } from 'react';
import Navbar from '../components/common/Navbar';
import { fetchDetailedReports } from '../services/reportService';
import { exportToCSV } from '../utils/exportUtils';
import { useToast } from '../context/ToastContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Download, BarChart2, TrendingUp, CheckCircle2, AlertOctagon, Send } from 'lucide-react';
import { formatDate } from '../utils/formatters';

import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import { TableSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

import { useContext } from 'react';
import { RefreshContext } from '../context/RefreshContext';

const Reports = () => {
  const toast = useToast();
  const { refreshKey } = useContext(RefreshContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    document.title = 'Aparaitech | Analytics Reports';
    const load = async () => {
      try {
        const res = await fetchDetailedReports();
        setData(res);
      } catch (err) {
        console.error('Error fetching reports:', err);
        toast.error('Failed to fetch analytics reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const handleExportCSV = () => {
    if (!data || !data.campaigns) return;
    const exportData = data.campaigns.map(c => ({
      Title: c.title,
      TotalRecipients: c.totalRecipients,
      Sent: c.sentCount || 0,
      Failed: c.failedCount || 0,
      Status: c.status,
      CreatedDate: formatDate(c.createdAt)
    }));
    exportToCSV(exportData, `recruitment_analytics_${Date.now()}.csv`);
    toast.info('Downloading executive analytics CSV...');
  };

  const totalSent = data?.campaigns?.reduce((acc, c) => acc + (c.sentCount || 0), 0) || 0;
  const totalFailed = data?.campaigns?.reduce((acc, c) => acc + (c.failedCount || 0), 0) || 0;
  const totalRecipients = data?.campaigns?.reduce((acc, c) => acc + (c.totalRecipients || 0), 0) || 0;
  const overallSuccessRate = (totalSent + totalFailed) > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 100;

  return (
    <div>
      <Navbar title="Executive Analytics & Reports" />

      <div className="page-container">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0">Recruitment Campaign Analytics</h5>
            <p className="text-muted small m-0 mt-0.5">Comprehensive audit of applicant outreach and email delivery efficiency</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm">
              {['7d', '30d', '90d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`btn ${dateRange === r ? 'btn-primary-custom' : 'btn-outline-custom'}`}
                >
                  {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>

            <Button variant="outline" icon={Download} onClick={handleExportCSV}>
              Export Report CSV
            </Button>
          </div>
        </div>

        {/* Top Summary Cards */}
        {loading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard title="Total Targeted" value={totalRecipients} icon={Send} color="primary" />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard title="Emails Delivered" value={totalSent} icon={CheckCircle2} color="success" />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard title="Failed Deliveries" value={totalFailed} icon={AlertOctagon} color="danger" />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard title="Overall Success Rate" value={`${overallSuccessRate}%`} icon={TrendingUp} color="warning" />
            </div>
          </div>
        )}

        {/* Recharts Analytics Volume */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
          <h6 className="fw-bold text-dark mb-4">Email Dispatch Volume per Campaign</h6>
          {loading ? (
            <div className="py-5 text-center text-muted">Loading chart data...</div>
          ) : (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={data?.timelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="sent" name="Sent Successfully" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" name="Failed / Bounced" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Campaign Analytics Breakdown Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
          <h6 className="fw-bold text-dark mb-3">Campaign Performance Breakdown</h6>
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>Campaign Title</th>
                  <th>Target Recipients</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Success Rate</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={6} />
                ) : !data?.campaigns || data.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState title="No analytics data" description="No campaign blasts recorded for the selected period." />
                    </td>
                  </tr>
                ) : (
                  data.campaigns.map((c) => {
                    const sent = c.sentCount || 0;
                    const failed = c.failedCount || 0;
                    const total = sent + failed;
                    const rate = total > 0 ? Math.round((sent / total) * 100) : 100;

                    return (
                      <tr key={c._id}>
                        <td className="fw-bold text-dark">{c.title}</td>
                        <td className="fw-semibold">{c.totalRecipients}</td>
                        <td className="text-success fw-bold">{sent}</td>
                        <td className="text-danger fw-bold">{failed}</td>
                        <td>
                          <span className={`badge ${rate >= 80 ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning border-warning-subtle'} border px-2 py-1 rounded-pill fw-bold`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="text-muted small">{formatDate(c.createdAt)}</td>
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

export default Reports;
