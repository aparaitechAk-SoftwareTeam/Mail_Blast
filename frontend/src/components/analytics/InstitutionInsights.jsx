import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  TrendingUp, 
  Download, 
  Sparkles 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  LabelList 
} from 'recharts';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

// Helper function to wrap text at word boundaries into max 3 lines without word truncation
const wrapTextAtWordBoundaries = (text, maxCharsPerLine = 22) => {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Maximum 3 lines format to avoid excessive vertical space per tick
  if (lines.length > 3) {
    const line1 = lines[0];
    const line2 = lines[1];
    const line3 = lines.slice(2).join(' ');
    return [line1, line2, line3];
  }
  return lines;
};

// Custom Y-Axis tick renderer for Recharts that multi-lines text without truncation
const CustomYAxisTick = ({ x, y, payload, yAxisWidth = 220 }) => {
  const value = payload?.value || '';
  const maxChars = yAxisWidth >= 220 ? 24 : yAxisWidth >= 190 ? 20 : yAxisWidth >= 160 ? 16 : 12;
  const lines = wrapTextAtWordBoundaries(value, maxChars);
  const lineHeight = 13;
  const totalHeight = (lines.length - 1) * lineHeight;
  const startDy = -totalHeight / 2 + 4;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={0}
        textAnchor="end"
        fill="#475569"
        style={{ fontSize: '11px', fontWeight: 500, fontFamily: 'inherit' }}
      >
        {lines.map((line, idx) => (
          <tspan key={idx} x={-10} dy={idx === 0 ? startDy : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

// Enterprise Custom Tooltip component displaying complete institution details
const CustomCollegeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div 
        className="bg-white p-3 rounded-3 shadow-lg text-dark"
        style={{ 
          minWidth: '220px', 
          maxWidth: '380px', 
          borderRadius: '12px', 
          border: '1px solid #E2E8F0',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-muted fs-8 text-uppercase tracking-wider fw-semibold mb-1" style={{ fontSize: '0.675rem', letterSpacing: '0.05em' }}>
          Institution
        </div>
        <div className="fw-bold text-dark fs-7 mb-2 text-wrap" style={{ lineHeight: 1.35, wordBreak: 'break-word' }}>
          {data.college}
        </div>
        <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light-subtle">
          <span className="text-muted fs-8">Candidates:</span>
          <span className="fw-bold text-primary fs-6">{data.count}</span>
        </div>
      </div>
    );
  }
  return null;
};

const InstitutionInsights = ({ 
  collegeDistribution = [], 
  summary = null, 
  loading = false, 
  onExport = null 
}) => {
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute responsive Y-Axis width for chart
  const yAxisWidth = useMemo(() => {
    if (windowWidth < 480) return 130;
    if (windowWidth < 768) return 160;
    if (windowWidth < 1024) return 190;
    return 220;
  }, [windowWidth]);

  // Sort institutions by candidate count descending, then secondary alphabetical
  const sortedDistribution = useMemo(() => {
    if (!collegeDistribution || !Array.isArray(collegeDistribution)) return [];
    return [...collegeDistribution].sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (a.college || '').localeCompare(b.college || '');
    });
  }, [collegeDistribution]);

  // Calculate dynamic metrics
  const totalCandidates = useMemo(() => {
    if (summary?.totalStudents !== undefined && summary?.totalStudents !== null) {
      return summary.totalStudents;
    }
    return sortedDistribution.reduce((acc, curr) => acc + curr.count, 0);
  }, [summary, sortedDistribution]);

  const totalInstitutions = sortedDistribution.length;
  const topInstitution = sortedDistribution[0];
  const topInstitutionName = topInstitution?.college || 'N/A';
  const topInstitutionCount = topInstitution?.count || 0;

  const avgCandidatesPerInstitution = totalInstitutions > 0 
    ? (totalCandidates / totalInstitutions).toFixed(1) 
    : '0.0';

  const top3Count = useMemo(() => {
    return sortedDistribution.slice(0, 3).reduce((acc, curr) => acc + curr.count, 0);
  }, [sortedDistribution]);

  const top3Percentage = useMemo(() => {
    return totalCandidates > 0 ? ((top3Count / totalCandidates) * 100).toFixed(1) : '0.0';
  }, [top3Count, totalCandidates]);

  // Dynamic Chart Height based on institution count and label wrapping
  const chartHeight = useMemo(() => {
    if (sortedDistribution.length === 0) return 280;
    const maxChars = yAxisWidth >= 220 ? 24 : yAxisWidth >= 190 ? 20 : yAxisWidth >= 160 ? 16 : 12;
    let height = 60; // Base margins
    sortedDistribution.forEach(item => {
      const lineCount = Math.max(1, wrapTextAtWordBoundaries(item.college, maxChars).length);
      height += 34 + (lineCount - 1) * 14;
    });
    return Math.max(280, height);
  }, [sortedDistribution, yAxisWidth]);

  return (
    <div className="institution-insights-section mb-4">
      {/* 1. Section Header */}
      <div className="d-flex align-items-sm-center justify-content-between mb-4 flex-column flex-sm-row gap-3">
        <div>
          <div className="text-uppercase text-primary fw-bold tracking-wider fs-8 mb-1" style={{ letterSpacing: '0.08em' }}>
            INSTITUTION INSIGHTS
          </div>
          <h5 className="fw-bold text-dark m-0">Student Distribution</h5>
          <p className="text-muted small m-0 mt-0.5">Student volume across institutions</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap flex-sm-nowrap">
          <select
            className="form-select form-select-sm form-select-custom w-auto fs-8 rounded-3"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            aria-label="Select date range filter"
            style={{ height: '38px', borderRadius: '10px', minWidth: '130px' }}
          >
            <option value="All Time">All Time</option>
            <option value="This Month">This Month</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>

          {onExport && sortedDistribution.length > 0 && (
            <Button
              variant="outline-custom"
              size="sm"
              icon={Download}
              onClick={onExport}
              aria-label="Export student distribution data to CSV"
              style={{ height: '38px', borderRadius: '10px' }}
            >
              Export
            </Button>
          )}
        </div>
      </div>

      {/* 2. Summary KPI Cards */}
      <div className="row g-3 mb-4">
        {/* KPI 1: TOTAL INSTITUTIONS */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                <Building2 size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                  TOTAL INSTITUTIONS
                </div>
                <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                  {loading ? '-' : totalInstitutions}
                </div>
                <div className="text-muted fs-8">Unique institutions</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: TOTAL CANDIDATES */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-info-subtle text-info d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                <Users size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                  TOTAL CANDIDATES
                </div>
                <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                  {loading ? '-' : totalCandidates}
                </div>
                <div className="text-muted fs-8">Students in database</div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: TOP INSTITUTION */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                <GraduationCap size={22} />
              </div>
              <div className="min-w-0 flex-grow-1">
                <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                  TOP INSTITUTION
                </div>
                <div className="fw-bold text-dark fs-7 m-0 text-wrap" style={{ lineHeight: 1.25, wordBreak: 'break-word' }}>
                  {loading ? '-' : topInstitutionName}
                </div>
                <div className="text-muted fs-8 mt-0.5">
                  {loading ? '-' : `${topInstitutionCount} candidate${topInstitutionCount === 1 ? '' : 's'}`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: AVG. CANDIDATES / INSTITUTION */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border shadow-sm rounded-4 bg-surface h-100 p-3" style={{ borderRadius: '14px', borderColor: 'var(--border, #E2E8F0)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
                <TrendingUp size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-muted fs-8 text-uppercase tracking-wider fw-bold" style={{ fontSize: '0.675rem' }}>
                  AVG. CANDIDATES / INST.
                </div>
                <div className="fw-bold text-dark fs-3 m-0" style={{ lineHeight: 1.2 }}>
                  {loading ? '-' : avgCandidatesPerInstitution}
                </div>
                <div className="text-muted fs-8">Avg. per institution</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Institution Bar Chart Card */}
      <div className="card border shadow-sm rounded-4 bg-surface p-4" style={{ borderRadius: '16px', borderColor: 'var(--border, #E2E8F0)' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-dark m-0 fs-6">CANDIDATES BY INSTITUTION</h6>
            <p className="text-muted fs-8 m-0 mt-0.5">Total candidates per institution</p>
          </div>
        </div>

        {loading ? (
          <div className="py-5 text-center text-muted">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
            Loading institution insights...
          </div>
        ) : sortedDistribution.length > 0 ? (
          <>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <div style={{ minWidth: windowWidth < 576 ? 340 : '100%', height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={sortedDistribution}
                    margin={{ top: 10, right: 45, left: 10, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148, 163, 184, 0.18)" />
                    <XAxis
                      type="number"
                      dataKey="count"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      allowDecimals={false}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }}
                      label={{ 
                        value: 'Number of Candidates', 
                        position: 'bottom', 
                        offset: 5, 
                        fill: '#64748B', 
                        fontSize: 11, 
                        fontWeight: 500 
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="college"
                      width={yAxisWidth}
                      tick={<CustomYAxisTick yAxisWidth={yAxisWidth} />}
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
              </div>
            </div>

            {/* 4. Insights Footer Strip */}
            <div 
              className="mt-4 p-3 rounded-3 border d-flex align-items-center gap-2.5"
              style={{ 
                background: 'rgba(79, 70, 229, 0.04)', 
                borderColor: 'rgba(79, 70, 229, 0.15)',
                borderRadius: '12px'
              }}
            >
              <Sparkles size={18} className="text-primary flex-shrink-0" />
              <div className="fs-8 text-dark" style={{ lineHeight: 1.4 }}>
                <strong className="text-primary me-1">Insights:</strong>
                {sortedDistribution.length >= 3 ? (
                  `Top 3 institutions contribute ${top3Count} candidates (${top3Percentage}%) out of ${totalCandidates} candidates.`
                ) : (
                  `Top ${sortedDistribution.length} institution${sortedDistribution.length === 1 ? '' : 's'} contribute${sortedDistribution.length === 1 ? 's' : ''} ${top3Count} candidates (${top3Percentage}%) out of ${totalCandidates} candidates.`
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-4">
            <EmptyState
              title="No institution data available"
              description="Import students to see institution-level distribution and recruitment coverage."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionInsights;
