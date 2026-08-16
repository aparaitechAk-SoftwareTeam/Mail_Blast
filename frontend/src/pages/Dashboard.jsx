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
  Upload, 
  ArrowRight,
  TrendingUp,
  Zap,
  UserPlus,
  BarChart2,
  RefreshCw,
  Sparkles,
  Mail,
  Building2,
  Download,
  ExternalLink,
  GraduationCap,
  RotateCw,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exportUtils';
import { RefreshContext } from '../context/RefreshContext';
import InstitutionInsights from '../components/analytics/InstitutionInsights';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { refreshKey, triggerManualRefresh, lastRefreshed, intervalMs, setIntervalMs } = useContext(RefreshContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('This Month');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Aparaitech | Recruitment Dashboard';
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

  const sentPercentage = totalProcessed > 0 
    ? Math.round(((summary?.totalEmailsSent || 0) / totalProcessed) * 100) 
    : 100;

  const failedPercentage = totalProcessed > 0 
    ? Math.round(((summary?.totalFailedEmails || 0) / totalProcessed) * 100) 
    : 0;

  const pieData = totalProcessed > 0 ? [
    { name: 'Sent Successfully', value: summary?.totalEmailsSent || 0 },
    { name: 'Failed Deliveries', value: summary?.totalFailedEmails || 0 }
  ] : [
    { name: 'No Campaign Data', value: 1 }
  ];

  return (
    <div>
      <Navbar title="Recruitment Dashboard" />

      <div className="page-container">
        {/* Operational System Status & Refresh Bar */}
        <div className="card border shadow-sm rounded-4 bg-surface p-3 mb-4" style={{ borderColor: 'var(--border, #E2E8F0)' }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2.5">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success rounded-pill px-2.5 py-1 small fw-semibold d-inline-flex align-items-center gap-1.5 border border-success-subtle">
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
                aria-label="Auto-Refresh Interval"
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

        {/* ROW 1: 4 TOP KPI STAT CARDS */}
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
                description="Successfully dispatched"
              />
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <StatCard
                title="Success Rate"
                value={totalProcessed > 0 && summary?.successRate !== null && summary?.successRate !== undefined ? `${summary.successRate}%` : '100%'}
                icon={TrendingUp}
                color="warning"
                description="Delivery success rate"
              />
            </div>
          </div>
        )}

        {/* ROW 2: CAMPAIGN PERFORMANCE (~42%) + DELIVERY OVERVIEW (~58%) */}
        <div className="row g-4 mb-4">
          {/* 1. Campaign Performance Donut Card */}
          <div className="col-12 col-lg-5 col-xl-5">
            <div className="card border shadow-sm rounded-4 bg-surface h-100 p-4" style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold text-dark m-0">Campaign Performance</h6>
                  <p className="text-muted small m-0 mt-0.5">Monitor campaign delivery activity and outcomes</p>
                </div>
                
                <select
                  className="form-select form-select-sm form-select-custom w-auto fs-8 rounded-3"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  aria-label="Filter campaign performance date range"
                  style={{ height: '34px', borderRadius: '8px' }}
                >
                  <option value="This Month">This Month</option>
                  <option value="All Time">All Time</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                </select>
              </div>

              {loading ? (
                <div className="py-5 text-center text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading campaign performance...
                </div>
              ) : totalProcessed > 0 ? (
                <div className="d-flex flex-column justify-content-between h-100">
                  {/* Donut Chart with Centered Total Emails Label */}
                  <div className="position-relative d-flex align-items-center justify-content-center my-auto" style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={pieData} 
                          innerRadius={62} 
                          outerRadius={82} 
                          paddingAngle={totalProcessed > 0 ? 4 : 0} 
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '10px', 
                            border: '1px solid #E2E8F0', 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' 
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Centered Donut Number */}
                    <div className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none">
                      <div className="fw-bold fs-3 text-dark leading-none" style={{ lineHeight: 1 }}>
                        {totalProcessed}
                      </div>
                      <div className="text-muted fs-9 text-uppercase tracking-wider fw-semibold mt-1" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>
                        Total Emails
                      </div>
                    </div>
                  </div>

                  {/* Compact Metrics Below Chart */}
                  <div className="row g-2 pt-3 border-top mt-2">
                    <div className="col-6">
                      <div className="p-2.5 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle bg-success flex-shrink-0" style={{ width: 10, height: 10 }} />
                          <div>
                            <div className="fw-bold text-dark fs-7 mb-0">{summary?.totalEmailsSent || 0}</div>
                            <div className="text-muted fs-8">Sent ({sentPercentage}%)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2.5 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="rounded-circle bg-danger flex-shrink-0" style={{ width: 10, height: 10 }} />
                          <div>
                            <div className="fw-bold text-dark fs-7 mb-0">{summary?.totalFailedEmails || 0}</div>
                            <div className="text-muted fs-8">Failed ({failedPercentage}%)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 my-auto">
                  <EmptyState
                    title="No campaign data available"
                    description="Create a campaign to start tracking delivery performance here."
                    actionText={user?.role !== 'Viewer' ? "Create Campaign" : null}
                    onAction={() => navigate('/composer')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Delivery Overview Analytics Card */}
          <div className="col-12 col-lg-7 col-xl-7">
            <div className="card border shadow-sm rounded-4 bg-surface h-100 p-4" style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}>
              <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold text-dark m-0">Delivery Overview</h6>
                  <p className="text-muted small m-0 mt-0.5">Key email outreach and delivery statistics</p>
                </div>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5 py-1 small fw-semibold">
                  Outreach Summary
                </span>
              </div>

              {loading ? (
                <div className="py-5 text-center text-muted">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  Loading delivery statistics...
                </div>
              ) : (
                <div className="d-flex flex-column justify-content-between h-100">
                  {/* 6 Metric Mini-Grid */}
                  <div className="row g-3 mb-4">
                    <div className="col-6 col-sm-4">
                      <div className="p-3 rounded-3 bg-body-tertiary border text-start h-100">
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-8 text-uppercase tracking-wider fw-bold mb-1" style={{ fontSize: '0.675rem' }}>
                          <Send size={13} className="text-primary" /> Total Campaigns
                        </div>
                        <div className="fw-bold text-dark fs-4 m-0">{summary?.totalCampaigns ?? 0}</div>
                        <div className="text-muted fs-8 mt-0.5">Campaigns launched</div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-4">
                      <div className="p-3 rounded-3 bg-body-tertiary border text-start h-100">
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-8 text-uppercase tracking-wider fw-bold mb-1" style={{ fontSize: '0.675rem' }}>
                          <Mail size={13} className="text-info" /> Emails Sent
                        </div>
                        <div className="fw-bold text-dark fs-4 m-0">{summary?.totalEmailsSent ?? 0}</div>
                        <div className="text-muted fs-8 mt-0.5">Total dispatched</div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-4">
                      <div className="p-3 rounded-3 bg-body-tertiary border text-start h-100">
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-8 text-uppercase tracking-wider fw-bold mb-1" style={{ fontSize: '0.675rem' }}>
                          <CheckCircle2 size={13} className="text-success" /> Successful
                        </div>
                        <div className="fw-bold text-success fs-4 m-0">{summary?.totalEmailsSent ?? 0}</div>
                        <div className="text-muted fs-8 mt-0.5">Delivered</div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-4">
                      <div className="p-3 rounded-3 bg-body-tertiary border text-start h-100">
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-8 text-uppercase tracking-wider fw-bold mb-1" style={{ fontSize: '0.675rem' }}>
                          <AlertCircle size={13} className="text-danger" /> Failed
                        </div>
                        <div className="fw-bold text-danger fs-4 m-0">{summary?.totalFailedEmails ?? 0}</div>
                        <div className="text-muted fs-8 mt-0.5">Bounced / error</div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-4">
                      <div className="p-3 rounded-3 bg-body-tertiary border text-start h-100">
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-8 text-uppercase tracking-wider fw-bold mb-1" style={{ fontSize: '0.675rem' }}>
                          <Clock size={13} className="text-warning" /> Pending
                        </div>
                        <div className="fw-bold text-dark fs-4 m-0">0</div>
                        <div className="text-muted fs-8 mt-0.5">In dispatch queue</div>
                      </div>
                    </div>

                    <div className="col-6 col-sm-4">
                      <div className="p-3 rounded-3 bg-body-tertiary border text-start h-100">
                        <div className="d-flex align-items-center gap-1.5 text-muted fs-8 text-uppercase tracking-wider fw-bold mb-1" style={{ fontSize: '0.675rem' }}>
                          <TrendingUp size={13} className="text-primary" /> Success Rate
                        </div>
                        <div className="fw-bold text-primary fs-4 m-0">
                          {totalProcessed > 0 && summary?.successRate !== null && summary?.successRate !== undefined ? `${summary.successRate}%` : '100%'}
                        </div>
                        <div className="text-muted fs-8 mt-0.5">Delivery ratio</div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Ratio Visual Progress Bar */}
                  <div className="p-3 rounded-3 border bg-body-tertiary">
                    <div className="d-flex align-items-center justify-content-between text-muted fs-8 mb-2">
                      <span className="fw-semibold text-dark">Overall Delivery Ratio</span>
                      <span className="fw-bold text-primary">
                        {totalProcessed > 0 && summary?.successRate !== null && summary?.successRate !== undefined ? `${summary.successRate}%` : '100%'}
                      </span>
                    </div>
                    <div className="progress overflow-hidden" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#E2E8F0' }}>
                      <div 
                        className="progress-bar bg-success" 
                        role="progressbar" 
                        style={{ width: `${sentPercentage}%` }} 
                        aria-valuenow={sentPercentage} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      />
                      <div 
                        className="progress-bar bg-danger" 
                        role="progressbar" 
                        style={{ width: `${failedPercentage}%` }} 
                        aria-valuenow={failedPercentage} 
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 3: INSTITUTION INSIGHTS / STUDENT DISTRIBUTION (Full Width) */}
        <InstitutionInsights 
          collegeDistribution={collegeDistribution} 
          summary={summary} 
          loading={loading} 
          onExport={handleExportDistribution} 
        />

        {/* ROW 4: QUICK ACTIONS + RECENT CAMPAIGNS TABLE */}
        <div className="card border shadow-sm rounded-4 bg-surface p-4 mb-4" style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h6 className="fw-bold text-dark m-0">Quick Actions</h6>
              <p className="text-muted fs-8 m-0 mt-0.5">Direct recruitment workspace navigation</p>
            </div>
          </div>

          <div className="row g-3">
            {user?.role !== 'Viewer' && (
              <>
                <div className="col-6 col-md-3">
                  <button 
                    onClick={() => navigate('/students')}
                    className="btn btn-outline-custom w-100 p-3 text-start d-flex align-items-center gap-3 transition-all rounded-3"
                    aria-label="Add Student"
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
                    aria-label="Bulk Import CSV"
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
                    aria-label="Create Campaign"
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
                aria-label="View Detailed Reports"
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

        {/* Recent Campaigns Table (Full Width) */}
        <div className="card border shadow-sm rounded-4 bg-surface p-4" style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}>
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h6 className="fw-bold text-dark m-0">Recent Campaigns</h6>
              <p className="text-muted small m-0 mt-0.5">Live campaign execution and delivery status</p>
            </div>
            <Link 
              to="/campaigns" 
              className="btn btn-sm btn-ghost-custom text-primary fw-semibold d-flex align-items-center gap-1"
              aria-label="View complete campaign history"
            >
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
                  <TableSkeleton rows={4} cols={8} />
                ) : recentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState
                        title="No campaign activity yet"
                        description="Create your first campaign to start tracking delivery performance."
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
                        <td style={{ whiteSpace: 'normal', minWidth: '220px', maxWidth: '340px' }}>
                          <Link 
                            to={`/campaigns/${c._id}`} 
                            className="fw-bold text-decoration-none text-dark d-block" 
                            style={{ lineHeight: 1.35, wordBreak: 'break-word' }}
                          >
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
