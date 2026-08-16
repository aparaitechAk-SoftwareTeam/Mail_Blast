import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/common/Navbar';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { CardSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { AuthContext } from '../context/AuthContext';
import { fetchDashboardStats } from '../services/reportService';
import { 
  Users, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Upload, 
  ArrowRight,
  TrendingUp,
  Activity,
  Zap,
  UserPlus,
  BarChart2,
  RefreshCw,
  Sparkles,
  History,
  Mail,
  Building2,
  Briefcase,
  Download,
  ExternalLink,
  GraduationCap,
  RotateCw,
  Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LabelList } from 'recharts';
import { formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';
import { RefreshContext } from '../context/RefreshContext';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { refreshKey, triggerManualRefresh, lastRefreshed, intervalMs, setIntervalMs } = useContext(RefreshContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('All Time');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Aparaitech | Dashboard';
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError('Unable to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const { summary, collegeDistribution = [], recentCampaigns = [] } = stats || {};

  const formattedDistribution = React.useMemo(() => {
    if (!collegeDistribution || !Array.isArray(collegeDistribution)) return [];
    return [...collegeDistribution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [collegeDistribution]);

  const CustomCollegeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="card border-0 shadow-lg p-3 rounded-3 bg-surface"
          style={{ border: '1px solid var(--border)', minWidth: '220px' }}
        >
          <div className="fw-bold text-dark fs-7 mb-1">{data.college}</div>
          <div className="d-flex align-items-center justify-content-between text-muted fs-8">
            <span>Student Candidates:</span>
            <span className="fw-bold text-primary fs-7">{data.count}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const truncateCollegeName = (name) => {
    if (!name) return '';
    if (name.length > 24) {
      return name.substring(0, 22) + '...';
    }
    return name;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleExportDistribution = () => {
    if (!collegeDistribution || collegeDistribution.length === 0) return;
    const exportData = collegeDistribution.map(item => ({
      'Institution Name': item.college,
      'Student Candidates': item.count
    }));
    exportToCSV(exportData, 'Student_Distribution_Aparaitech');
  };

  const totalProcessed = (summary?.totalEmailsSent || 0) + (summary?.totalFailedEmails || 0);

  const pieData = totalProcessed > 0 ? [
    { name: 'Sent Successfully', value: summary?.totalEmailsSent || 0 },
    { name: 'Failed', value: summary?.totalFailedEmails || 0 }
  ] : [];

  return (
    <div>
      <Navbar title="Recruitment Dashboard" />

      <div className="page-container">
        {/* Compact Operational System Status & Refresh Bar */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-3 mb-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 small fw-semibold d-inline-flex align-items-center gap-1.5">
                <span className="p-1 bg-success rounded-circle animate-pulse" />
                Live Sync
              </span>
              <span className="text-muted fs-8">
                Updated {lastRefreshed ? formatDate(lastRefreshed, 'HH:mm:ss') : 'Just now'}
              </span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button
                onClick={triggerManualRefresh}
                className={`btn btn-sm btn-ghost-custom p-1.5 rounded-2 ${loading ? 'spin' : ''}`}
                title="Refresh Data Now"
                aria-label="Refresh Data Now"
              >
                <RotateCw size={15} />
              </button>

              <select
                className="form-select form-select-sm form-select-custom w-auto fs-8 border-0 bg-transparent py-0"
                value={intervalMs}
                onChange={(e) => setIntervalMs(parseInt(e.target.value, 10))}
                title="Auto-Refresh Interval"
              >
                <option value={0}>Auto: Off</option>
                <option value={15000}>Auto: 15s</option>
                <option value={30000}>Auto: 30s</option>
                <option value={60000}>Auto: 60s</option>
                <option value={300000}>Auto: 5m</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="alert alert-danger border-0 shadow-sm rounded-4 p-4 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <h6 className="fw-bold text-danger m-0 mb-1">Unable to load dashboard data</h6>
              <span className="small text-danger opacity-75">{error}</span>
            </div>
            <Button variant="danger" size="sm" icon={RefreshCw} onClick={loadData}>
              Retry Connection
            </Button>
          </div>
        )}

        {/* Compact Enterprise Operations Welcome Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card border-0 mb-4 text-white shadow-sm overflow-hidden" 
          style={{ 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', 
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="card-body p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div style={{ maxWidth: '580px' }}>
              <span className="badge bg-primary bg-opacity-20 text-white border border-primary border-opacity-30 mb-2 px-2.5 py-1 rounded-pill small fw-semibold tracking-wider text-uppercase" style={{ fontSize: '0.675rem' }}>
                RECRUITMENT WORKSPACE
              </span>
              <h2 className="fw-bold mb-1.5 tracking-tight text-white fs-4">
                {getGreeting()}, {user?.name || 'Recruiter'}
              </h2>
              <p className="text-white-50 m-0 fs-7 mb-3.5" style={{ lineHeight: 1.5 }}>
                Manage your student database, launch targeted campaigns, and monitor recruitment outreach from one workspace.
              </p>
              {user?.role !== 'Viewer' && (
                <div className="hero-buttons d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
                  <Button variant="primary" size="sm" icon={Send} onClick={() => navigate('/composer')}>
                    Create Campaign
                  </Button>
                  <Button variant="hero-secondary" size="sm" icon={Upload} onClick={() => navigate('/bulk-upload')}>
                    Import Students
                  </Button>
                </div>
              )}
            </div>

            {/* Compact Real-Data Summary Panel */}
            <div className="d-none d-lg-block">
              <div 
                className="p-3 rounded-3 shadow-sm border border-white border-opacity-10"
                style={{ background: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(12px)', minWidth: '240px' }}
              >
                <div className="text-white-50 text-uppercase tracking-wider fw-bold mb-2 pb-1 border-bottom border-white border-opacity-10" style={{ fontSize: '0.65rem' }}>
                  STUDENT OUTREACH
                </div>
                <div className="d-flex align-items-center justify-content-between gap-3 text-white py-1">
                  <div className="text-center">
                    <div className="fw-bold fs-6">{loading ? '-' : summary?.totalStudents ?? 0}</div>
                    <div className="text-white-50 fs-8">Students</div>
                  </div>
                  <div className="vr bg-white opacity-25" style={{ height: '24px' }} />
                  <div className="text-center">
                    <div className="fw-bold fs-6">{loading ? '-' : collegeDistribution.length ?? 0}</div>
                    <div className="text-white-50 fs-8">Institutions</div>
                  </div>
                  <div className="vr bg-white opacity-25" style={{ height: '24px' }} />
                  <div className="text-center">
                    <div className="fw-bold fs-6">{loading ? '-' : summary?.totalCampaigns ?? 0}</div>
                    <div className="text-white-50 fs-8">Campaigns</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 KPI Stat Cards */}
        {loading ? (
          <CardSkeleton count={4} />
        ) : (
          <div className="row g-4 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Total Students"
                value={summary?.totalStudents !== undefined && summary?.totalStudents !== null ? summary.totalStudents : '-'}
                icon={Users}
                color="primary"
                description={summary?.totalStudents ? "Students in database" : "No student data available"}
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Total Campaigns"
                value={summary?.totalCampaigns !== undefined && summary?.totalCampaigns !== null ? summary.totalCampaigns : '-'}
                icon={Send}
                color="info"
                description={summary?.totalCampaigns ? "Campaign blasts launched" : "No campaigns created"}
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Emails Sent"
                value={summary?.totalEmailsSent !== undefined && summary?.totalEmailsSent !== null ? summary.totalEmailsSent : '-'}
                icon={CheckCircle2}
                color="success"
                description="Total emails delivered"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Success Rate"
                value={totalProcessed > 0 && summary?.successRate !== null && summary?.successRate !== undefined ? `${summary.successRate}%` : '-'}
                icon={TrendingUp}
                color="warning"
                description="Delivery success rate"
              />
            </div>
          </div>
        )}

        {/* Quick Actions Bar */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold text-dark m-0">Quick Actions</h6>
            <span className="text-muted fs-8">Direct workspace navigation</span>
          </div>

          <div className="row g-3">
            {user?.role !== 'Viewer' && (
              <>
                <div className="col-6 col-md-3">
                  <button 
                    onClick={() => navigate('/students')}
                    className="btn btn-outline-custom w-100 p-3 text-start d-flex align-items-center gap-3 transition-all rounded-3"
                  >
                    <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-7">Add Student</div>
                      <div className="text-muted fs-8">Single candidate</div>
                    </div>
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button 
                    onClick={() => navigate('/bulk-upload')}
                    className="btn btn-outline-custom w-100 p-3 text-start d-flex align-items-center gap-3 transition-all rounded-3"
                  >
                    <div className="p-2 rounded-3 bg-info-subtle text-info">
                      <Upload size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-7">Bulk Import</div>
                      <div className="text-muted fs-8">CSV upload</div>
                    </div>
                  </button>
                </div>
                <div className="col-6 col-md-3">
                  <button 
                    onClick={() => navigate('/composer')}
                    className="btn btn-outline-custom w-100 p-3 text-start d-flex align-items-center gap-3 transition-all rounded-3"
                  >
                    <div className="p-2 rounded-3 bg-success-subtle text-success">
                      <Send size={18} />
                    </div>
                    <div>
                      <div className="fw-bold text-dark fs-7">Create Campaign</div>
                      <div className="text-muted fs-8">Personalized email</div>
                    </div>
                  </button>
                </div>
              </>
            )}
            <div className="col-6 col-md-3">
              <button 
                onClick={() => navigate('/reports')}
                className="btn btn-outline-custom w-100 p-3 text-start d-flex align-items-center gap-3 transition-all rounded-3"
              >
                <div className="p-2 rounded-3 bg-warning-subtle text-warning">
                  <BarChart2 size={18} />
                </div>
                <div>
                  <div className="fw-bold text-dark fs-7">View Reports</div>
                  <div className="text-muted fs-8">Analytics breakdown</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Charts Grid */}
        <div className="row g-4 mb-4">
          {/* Student Distribution - Enterprise SaaS Quality */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 bg-surface h-100 p-4">
              {/* Header */}
              <div className="d-flex align-items-start justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="text-uppercase text-primary fw-bold tracking-wider fs-8 mb-1" style={{ letterSpacing: '0.08em' }}>
                    INSTITUTION INSIGHTS
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Building2 size={20} className="text-primary flex-shrink-0" />
                    <h6 className="fw-bold text-dark m-0 fs-6">Student Distribution</h6>
                  </div>
                  <p className="text-muted small m-0 mt-0.5">Student volume across institutions</p>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm form-select-custom w-auto fs-8 rounded-3"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    style={{ height: '36px', borderRadius: '10px' }}
                  >
                    <option value="All Time">All Time</option>
                    <option value="This Month">This Month</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>

                  {collegeDistribution.length > 0 && (
                    <Button 
                      variant="outline-custom" 
                      size="sm" 
                      icon={Download} 
                      onClick={handleExportDistribution}
                      title="Export data to CSV"
                      style={{ height: '36px', borderRadius: '10px' }}
                    >
                      <span className="d-none d-sm-inline">Export</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Compact Summary Metrics Bar */}
              <div className="row g-2 mb-3">
                <div className="col-4">
                  <div className="p-2.5 rounded-3 bg-body-tertiary border text-start">
                    <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>Institutions</div>
                    <div className="fw-bold text-dark fs-6 m-0">
                      {loading ? '-' : collegeDistribution.length || '-'}
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2.5 rounded-3 bg-body-tertiary border text-start">
                    <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>Candidates</div>
                    <div className="fw-bold text-dark fs-6 m-0">
                      {loading ? '-' : summary?.totalStudents !== undefined && summary?.totalStudents !== null ? summary.totalStudents : '-'}
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2.5 rounded-3 bg-body-tertiary border text-start text-truncate">
                    <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>Top Institution</div>
                    <div className="fw-bold text-primary fs-7 m-0 text-truncate" title={formattedDistribution[0]?.college}>
                      {loading ? '-' : formattedDistribution[0]?.college || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Body */}
              {loading ? (
                <div className="py-5 text-center text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading institution insights...
                </div>
              ) : formattedDistribution.length > 0 ? (
                <div style={{ width: '100%' }}>
                  <ResponsiveContainer width="100%" height={Math.max(240, Math.min(formattedDistribution.length * 44, 400))}>
                    <BarChart 
                      layout="vertical" 
                      data={formattedDistribution} 
                      margin={{ top: 5, right: 40, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.15)" />
                      <XAxis 
                        type="number" 
                        dataKey="count" 
                        tick={{ fontSize: 11, fill: '#64748B' }} 
                        allowDecimals={false}
                        axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="college" 
                        width={window.innerWidth <= 768 ? 130 : 180} 
                        tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }} 
                        tickFormatter={truncateCollegeName}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomCollegeTooltip />} cursor={{ fill: 'rgba(79, 70, 229, 0.04)' }} />
                      <Bar 
                        dataKey="count" 
                        fill="#4F46E5" 
                        radius={[0, 6, 6, 0]} 
                        barSize={20}
                      >
                        <LabelList 
                          dataKey="count" 
                          position="right" 
                          fill="#4F46E5" 
                          fontSize={12} 
                          fontWeight={700} 
                          offset={8} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Institutional Scope Footer Notice */}
                  {collegeDistribution.length > 8 && (
                    <div className="pt-3 mt-2 border-top d-flex align-items-center justify-content-between text-muted fs-8">
                      <span>Showing top 8 of {collegeDistribution.length} institutions</span>
                      <button 
                        onClick={() => navigate('/students')} 
                        className="btn btn-link p-0 text-primary fs-8 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                      >
                        View All in Directory <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4">
                  <EmptyState
                    title="No institution data available"
                    description="Import students to see institution-level distribution and recruitment coverage."
                    actionText={user?.role !== 'Viewer' ? "Import Students" : null}
                    onAction={() => navigate('/bulk-upload')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 bg-surface h-100 p-4">
              <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold text-dark m-0">Campaign Performance</h6>
                  <p className="text-muted small m-0 mt-0.5">Monitor email campaign activity and outcomes.</p>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm form-select-custom w-auto fs-8"
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <option value="All Time">All Time</option>
                    <option value="This Month">This Month</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                  <Zap size={18} className="text-success" />
                </div>
              </div>

              {loading ? (
                <div className="py-5 text-center text-muted">Loading performance data...</div>
              ) : totalProcessed > 0 ? (
                <>
                  <div style={{ width: '100%', height: 210 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="d-flex justify-content-center gap-4 mt-3 pt-2 border-top">
                    <div className="d-flex align-items-center gap-2">
                      <span className="rounded-circle" style={{ width: 10, height: 10, background: '#10B981' }}></span>
                      <span className="small text-muted fw-medium">Sent ({summary?.totalEmailsSent || 0})</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="rounded-circle" style={{ width: 10, height: 10, background: '#EF4444' }}></span>
                      <span className="small text-muted fw-medium">Failed ({summary?.totalFailedEmails || 0})</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <EmptyState
                    title="No campaign data available"
                    description="Create a campaign to see delivery performance here."
                    actionText={user?.role !== 'Viewer' ? "Create Campaign" : null}
                    onAction={() => navigate('/composer')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Campaigns Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-4">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <div>
              <h6 className="fw-bold text-dark m-0">Recent Campaigns</h6>
              <p className="text-muted small m-0 mt-0.5">Live execution logs and campaign delivery status</p>
            </div>
            <Link to="/campaigns" className="btn btn-sm btn-ghost-custom text-primary fw-semibold d-flex align-items-center gap-1">
              <span>View History</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Recipients</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Success Rate</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={3} cols={8} />
                ) : recentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState
                        title="No campaigns yet."
                        description="Your campaign history will appear here after you send your first campaign."
                        actionText={user?.role !== 'Viewer' ? "Create Campaign" : null}
                        onAction={() => navigate('/composer')}
                      />
                    </td>
                  </tr>
                ) : (
                  recentCampaigns.map((c) => {
                    const campaignProcessed = (c.sentCount || 0) + (c.failedCount || 0);
                    const campaignSuccessRate = campaignProcessed > 0 ? `${Math.round(((c.sentCount || 0) / campaignProcessed) * 100)}%` : '-';

                    return (
                      <tr key={c._id}>
                        <td>
                          <Link to={`/campaigns/${c._id}`} className="fw-bold text-decoration-none text-dark">
                            {c.title}
                          </Link>
                        </td>
                        <td className="fw-semibold">{c.totalRecipients}</td>
                        <td className="text-success fw-semibold">{c.sentCount || 0}</td>
                        <td className="text-danger fw-semibold">{c.failedCount || 0}</td>
                        <td className="fw-semibold">{campaignSuccessRate}</td>
                        <td>
                          <StatusBadge status={c.status} type="campaign" />
                        </td>
                        <td className="text-muted small">{formatDate(c.createdAt)}</td>
                        <td className="text-end">
                          <Link to={`/campaigns/${c._id}`} className="btn btn-sm btn-outline-custom">
                            View
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

export default Dashboard;
