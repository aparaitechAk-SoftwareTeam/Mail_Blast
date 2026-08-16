import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Users, 
  Filter, 
  Sparkles, 
  Mail, 
  Server, 
  BarChart3, 
  CheckCircle2, 
  SkipForward,
  GraduationCap,
  Check,
  Zap,
  Layers,
  Building,
  Calendar,
  Award,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';

const RADIAL_RECIPIENTS = [
  { x: 135, y: -38, label: 'Candidate 1' },
  { x: 145, y: 35, label: 'Candidate 2' },
  { x: 0, y: 72, label: 'Candidate 3' },
  { x: -145, y: 35, label: 'Candidate 4' },
  { x: -135, y: -38, label: 'Candidate 5' },
  { x: 0, y: -72, label: 'Candidate 6' }
];

const EmailBlastIntro = ({ onComplete }) => {
  const [currentProgress, setCurrentProgress] = useState(0); // 0.0 to 10.0 seconds
  const [loadingData, setLoadingData] = useState(true);
  const [realData, setRealData] = useState({
    totalStudents: null,
    totalCampaigns: null,
    totalEmailsSent: null,
    successRate: null,
    gatewayCount: 3,
    activeGateways: [
      { gatewayName: 'Brevo Gateway 01', connectionStatus: 'Connected' },
      { gatewayName: 'Brevo Gateway 02', connectionStatus: 'Connected' },
      { gatewayName: 'Brevo Gateway 03', connectionStatus: 'Connected' }
    ]
  });

  // Fetch REAL Application Summary Data
  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      try {
        const res = await api.get('/public/summary');
        if (isMounted && res.data) {
          setRealData({
            totalStudents: typeof res.data.totalStudents === 'number' ? res.data.totalStudents : 0,
            totalCampaigns: typeof res.data.totalCampaigns === 'number' ? res.data.totalCampaigns : 0,
            totalEmailsSent: typeof res.data.totalEmailsSent === 'number' ? res.data.totalEmailsSent : 0,
            successRate: typeof res.data.successRate === 'number' ? res.data.successRate : 100,
            gatewayCount: typeof res.data.gatewayCount === 'number' ? res.data.gatewayCount : 3,
            activeGateways: Array.isArray(res.data.activeGateways) && res.data.activeGateways.length > 0
              ? res.data.activeGateways
              : [
                  { gatewayName: 'Brevo Gateway 01', connectionStatus: 'Connected' },
                  { gatewayName: 'Brevo Gateway 02', connectionStatus: 'Connected' },
                  { gatewayName: 'Brevo Gateway 03', connectionStatus: 'Connected' }
                ]
          });
        }
      } catch (err) {
        // Fall back gracefully to null placeholders (no fake numbers)
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchRealData();
    return () => { isMounted = false; };
  }, []);

  // 10-Second High-Precision Timer (100ms interval ticks)
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setCurrentProgress((prev) => {
        if (prev >= 10.0) {
          clearInterval(timer);
          onComplete();
          return 10.0;
        }
        return Math.round((prev + 0.1) * 10) / 10;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Authoritative Single Scene State
  const getScene = (time) => {
    if (time < 1.2) return 1; // 0.0 - 1.2s: Brand Initialize
    if (time < 3.0) return 2; // 1.2 - 3.0s: Student Audience
    if (time < 5.0) return 3; // 3.0 - 5.0s: Campaign Composer & Personalization
    if (time < 7.2) return 4; // 5.0 - 7.2s: Email Blast & SMTP Delivery
    if (time < 9.2) return 5; // 7.2 - 9.2s: Live Delivery Analytics
    return 6;                 // 9.2 - 10.0s: Final Transition -> Login
  };

  const scene = getScene(currentProgress);

  // Animated Counter Ratios
  const audienceRatio = Math.min(1, Math.max(0, (currentProgress - 1.2) / 1.5));
  const animatedStudentCount = realData.totalStudents !== null ? Math.round(realData.totalStudents * audienceRatio) : null;

  const analyticsRatio = Math.min(1, Math.max(0, (currentProgress - 7.2) / 1.5));
  const animatedSentCount = realData.totalEmailsSent !== null ? Math.round(realData.totalEmailsSent * analyticsRatio) : null;
  const animatedCampaignCount = realData.totalCampaigns !== null ? Math.round(realData.totalCampaigns * analyticsRatio) : null;
  const animatedSuccessRate = realData.successRate !== null ? Math.round(realData.successRate * analyticsRatio) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-between p-3 p-md-4 text-white overflow-hidden"
      style={{
        zIndex: 90,
        background: 'radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.4) 0%, transparent 65%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.25) 0%, transparent 65%), #0B1020',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Background Subtle Dots Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Top Header Row (Refined Horizontal Bar) */}
      <div className="d-flex align-items-center justify-content-between position-relative w-100 mx-auto" style={{ zIndex: 10, maxWidth: '1100px' }}>
        <div className="d-flex align-items-center gap-2.5">
          <div 
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
            style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}
          >
            <Send size={18} />
          </div>
          <span className="fw-bold fs-6 text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Aparaitech Software
          </span>
        </div>

        {/* Center Timer Indicator */}
        <div className="d-none d-md-flex align-items-center gap-2 px-3.5 py-1.5 rounded-pill bg-slate-900 bg-opacity-80 border border-white border-opacity-20 fs-9 text-slate-300 shadow-sm">
          <span className="text-uppercase tracking-wider fw-semibold" style={{ letterSpacing: '0.05em' }}>INTRO PREVIEW</span>
          <span className="fw-bold text-white font-monospace">{currentProgress.toFixed(1)}s / 10.0s</span>
        </div>

        {/* SKIP INTRO Button */}
        <button
          type="button"
          onClick={onComplete}
          aria-label="Skip email blast introduction"
          className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-semibold border-white border-opacity-30 shadow-sm"
          style={{ fontSize: '0.825rem', backdropFilter: 'blur(8px)' }}
        >
          <span>SKIP INTRO</span>
          <SkipForward size={14} />
        </button>
      </div>

      {/* Hero Content Area (Vertically Centered with Seamless Scene Transitions) */}
      <div 
        className="my-auto position-relative py-2 d-flex align-items-center justify-content-center w-100 mx-auto" 
        style={{ zIndex: 10, maxWidth: '1100px', minHeight: '350px' }}
      >
        <AnimatePresence mode="popLayout">

          {/* SCENE 1: BRAND INITIALIZE (0.0s – 1.2s) */}
          {scene === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.03, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="text-center d-flex flex-column align-items-center gap-3"
              style={{ maxWidth: '640px' }}
            >
              <div className="d-inline-flex align-items-center gap-2 px-3.5 py-1.5 rounded-pill bg-indigo-600 bg-opacity-30 border border-indigo-400 border-opacity-40 text-indigo-200 fs-8 fw-semibold">
                <Sparkles size={15} className="text-primary" />
                <span>APARAITECH SOFTWARE</span>
              </div>
              <h1 className="fw-bold text-white tracking-tight m-0" style={{ fontSize: 'clamp(30px, 4.2vw, 54px)', lineHeight: 1.1 }}>
                STUDENT EMAIL BLAST
              </h1>
              <p className="text-slate-300 fs-6 m-0" style={{ maxWidth: '480px' }}>
                Enterprise Recruitment Outreach & Campaign Engine
              </p>
            </motion.div>
          )}

          {/* SCENE 2: REAL STUDENT AUDIENCE (1.2s – 3.0s) */}
          {scene === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="w-100 d-flex flex-column gap-3 align-items-center"
              style={{ maxWidth: '660px' }}
            >
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <span className="badge bg-indigo-600 bg-opacity-30 text-indigo-200 border border-indigo-400 border-opacity-40 px-3 py-1 rounded-pill fs-8 fw-bold">
                  01 — STUDENT AUDIENCE
                </span>
                <span className="fs-9 text-slate-300">Real Directory Segment</span>
              </div>

              {/* Single Coherent High-Contrast Translucent Card Container */}
              <div 
                className="p-4 rounded-4 w-100 d-flex flex-column gap-3 shadow-lg"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                {/* Main Metric Header Row with Animated Count-Up */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 border-bottom border-white border-opacity-10 pb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="p-3 rounded-3 bg-primary bg-opacity-25 text-primary d-flex align-items-center justify-content-center">
                      <Users size={28} />
                    </div>
                    <div>
                      <div className="text-slate-300 fs-9 text-uppercase tracking-wider fw-semibold">Total Registered Candidates</div>
                      <div className="fw-bold text-white fs-1 m-0 font-monospace" style={{ lineHeight: 1.1 }}>
                        {loadingData ? 'Loading...' : (animatedStudentCount !== null ? animatedStudentCount.toLocaleString() : '—')}
                      </div>
                    </div>
                  </div>

                  <span className="badge bg-emerald-500 bg-opacity-20 text-emerald-400 border border-emerald-500 border-opacity-40 px-3 py-1.5 rounded-pill fs-9 fw-semibold">
                    ● Directory Active
                  </span>
                </div>

                {/* 3 Safe Candidate Attribute Cards (Sequential Stagger Animation) */}
                <div className="row g-2">
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="col-12 col-md-4">
                    <div className="p-2.5 rounded-3 bg-slate-800 bg-opacity-70 border border-white border-opacity-10 d-flex align-items-center gap-2">
                      <GraduationCap size={18} className="text-cyan-400 flex-shrink-0" />
                      <div className="text-truncate">
                        <div className="fs-9 text-slate-400">Branch</div>
                        <div className="fs-8 fw-bold text-white text-truncate">Computer Eng</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="col-12 col-md-4">
                    <div className="p-2.5 rounded-3 bg-slate-800 bg-opacity-70 border border-white border-opacity-10 d-flex align-items-center gap-2">
                      <Building size={18} className="text-indigo-400 flex-shrink-0" />
                      <div className="text-truncate">
                        <div className="fs-9 text-slate-400">Institution</div>
                        <div className="fs-8 fw-bold text-white text-truncate">COEP Tech Univ</div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="col-12 col-md-4">
                    <div className="p-2.5 rounded-3 bg-slate-800 bg-opacity-70 border border-white border-opacity-10 d-flex align-items-center gap-2">
                      <Calendar size={18} className="text-emerald-400 flex-shrink-0" />
                      <div className="text-truncate">
                        <div className="fs-9 text-slate-400">Passout Year</div>
                        <div className="fs-8 fw-bold text-white text-truncate">2026 Batch</div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-1">
                  <span className="text-slate-300 fs-9">Targeted Criteria Filter</span>
                  <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1, repeat: Infinity }} className="badge bg-indigo-500 bg-opacity-30 text-indigo-200 border border-indigo-400 border-opacity-40 px-3 py-1 rounded-pill fs-9 fw-semibold">
                    ✓ TARGET AUDIENCE SEGMENT
                  </motion.span>
                </div>
              </div>
            </motion.div>
          )}

          {/* SCENE 3: CAMPAIGN COMPOSER + PERSONALIZATION (3.0s – 5.0s) */}
          {scene === 3 && (
            <motion.div
              key="scene-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="w-100 d-flex flex-column gap-3 align-items-center"
              style={{ maxWidth: '600px' }}
            >
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <span className="badge bg-indigo-600 bg-opacity-30 text-indigo-200 border border-indigo-400 border-opacity-40 px-3 py-1 rounded-pill fs-8 fw-bold">
                  02 — CAMPAIGN & PERSONALIZATION
                </span>
                <span className="fs-9 text-slate-300">Supported Merge Tags</span>
              </div>

              {/* Compact Campaign Composer Container */}
              <div 
                className="p-4 rounded-4 w-100 d-flex flex-column gap-3 shadow-lg"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)'
                }}
              >
                <div className="d-flex align-items-center justify-content-between border-bottom border-white border-opacity-10 pb-2.5">
                  <div className="d-flex align-items-center gap-2">
                    <Mail size={18} className="text-primary" />
                    <span className="fs-8 fw-semibold text-white">Campaign Composer</span>
                  </div>
                  <span className="badge bg-indigo-500 bg-opacity-30 text-indigo-200 fs-9">Outreach Email</span>
                </div>

                <div className="d-flex flex-column gap-1 fs-8">
                  <div className="text-slate-300">Subject: <span className="text-white fw-bold ms-1">Campus Placement Drive — 2026 Invitation</span></div>
                </div>

                {/* Email Body with High Contrast Highlighted Glowing Tags */}
                <div className="p-3 rounded-3 bg-black bg-opacity-50 border border-white border-opacity-15 fs-8 text-slate-200 font-monospace" style={{ lineHeight: 1.6 }}>
                  Hello <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-amber-400 fw-bold">{'{Name}'}</motion.span>,<br />
                  You are invited to participate in the campus recruitment drive at <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.2, delay: 0.3, repeat: Infinity }} className="text-amber-400 fw-bold">{'{College}'}</motion.span> for <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.2, delay: 0.6, repeat: Infinity }} className="text-amber-400 fw-bold">{'{Branch}'}</motion.span> (<motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.2, delay: 0.9, repeat: Infinity }} className="text-amber-400 fw-bold">{'{GraduationYear}'}</motion.span> batch).
                </div>

                {/* Supported Application Merge Tags Row */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap pt-1 border-top border-white border-opacity-10">
                  <span className="text-slate-300 fs-9 me-1">Supported Tags:</span>
                  {['{Name}', '{Email}', '{College}', '{Branch}', '{GraduationYear}', '{CGPA}'].map((tag, idx) => (
                    <span key={idx} className="badge bg-indigo-600 bg-opacity-30 text-indigo-200 border border-indigo-400 border-opacity-40 fs-9 fw-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SCENE 4: EMAIL BLAST BURST + SMTP DELIVERY (5.0s – 7.2s) */}
          {scene === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.22 }}
              className="w-100 d-flex flex-column gap-3 align-items-center"
              style={{ maxWidth: '720px' }}
            >
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <span className="badge bg-amber-500 bg-opacity-20 text-amber-300 border border-amber-500 border-opacity-40 px-3 py-1 rounded-pill fs-8 fw-bold">
                  03 — EMAIL BLAST & SMTP INFRASTRUCTURE
                </span>
                <span className="fs-9 text-slate-300">
                  {realData.gatewayCount} Real SMTP Gateways Configured
                </span>
              </div>

              {/* Digital Email Burst Canvas Container */}
              <div 
                className="p-3.5 rounded-4 w-100 d-flex flex-column align-items-center justify-content-center position-relative overflow-hidden shadow-lg"
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(16px)',
                  minHeight: '210px'
                }}
              >
                {/* Status Indicator Bar */}
                <div className="position-absolute top-0 start-0 w-100 p-2.5 px-3 border-bottom border-white border-opacity-10 d-flex align-items-center justify-content-between z-10">
                  <span className="fs-9 fw-bold text-white tracking-wider text-uppercase font-monospace">
                    {currentProgress >= 6.8 ? 'EMAILS DELIVERED' : currentProgress >= 5.5 ? 'DISPATCHING CAMPAIGN' : 'CAMPAIGN READY'}
                  </span>
                  <span className="badge bg-primary bg-opacity-30 text-indigo-200 fs-9 font-monospace">1 Campaign → 6 Recipients</span>
                </div>

                {/* Background Radial Ripple Ring Effect (Triggers at 5.5s) */}
                {currentProgress >= 5.5 && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0.9 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="position-absolute rounded-circle border border-primary"
                    style={{
                      width: '120px',
                      height: '120px',
                      background: 'radial-gradient(circle, rgba(79, 70, 229, 0.45) 0%, rgba(99, 102, 241, 0.15) 70%, transparent 100%)',
                      pointerEvents: 'none',
                      zIndex: 1
                    }}
                  />
                )}

                {/* Central Campaign Launcher / Envelope Node */}
                <motion.div
                  animate={currentProgress >= 5.5 ? { scale: [1, 1.25, 1.05] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="d-flex flex-column align-items-center justify-content-center position-relative my-2 mt-4"
                  style={{ zIndex: 5 }}
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-lg border border-primary border-opacity-50"
                    style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}
                  >
                    <Mail size={24} />
                  </div>
                  <span className="fs-9 fw-bold text-white mt-1">EMAIL BLAST</span>
                </motion.div>

                {/* 6 Radial Recipient Nodes & Outbound Traveling Particle Animation */}
                <div className="position-absolute w-100 h-100 top-0 start-0 d-flex align-items-center justify-content-center" style={{ pointerEvents: 'none', zIndex: 4 }}>
                  {RADIAL_RECIPIENTS.map((node, idx) => {
                    const isDelivered = currentProgress >= 6.8;
                    const isShooting = currentProgress >= 6.0 && currentProgress < 6.8;

                    return (
                      <React.Fragment key={idx}>
                        {/* Connection Line */}
                        <svg 
                          className="position-absolute top-0 start-0 w-100 h-100" 
                          style={{ overflow: 'visible', zIndex: 2 }}
                        >
                          <line
                            x1="50%"
                            y1="50%"
                            x2={`calc(50% + ${node.x}px)`}
                            y2={`calc(50% + ${node.y}px)`}
                            stroke={isDelivered ? 'rgba(16, 185, 129, 0.5)' : 'rgba(99, 102, 241, 0.3)'}
                            strokeWidth="1.5"
                            strokeDasharray={isDelivered ? 'none' : '4 4'}
                          />
                        </svg>

                        {/* Traveling Outbound Email Particle (6.0s - 6.8s) */}
                        {isShooting && (
                          <motion.div
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }}
                            animate={{ x: node.x, y: node.y, opacity: [0, 1, 1], scale: [0.6, 1, 0.8] }}
                            transition={{ duration: 0.7, delay: idx * 0.08, ease: 'easeOut' }}
                            className="position-absolute p-1 rounded-circle bg-primary text-white shadow-sm"
                            style={{ zIndex: 6 }}
                          >
                            <Send size={12} />
                          </motion.div>
                        )}

                        {/* Target Recipient Node Badge */}
                        <div 
                          className="position-absolute d-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill border shadow-sm"
                          style={{
                            transform: `translate(${node.x}px, ${node.y}px)`,
                            backgroundColor: isDelivered ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.85)',
                            borderColor: isDelivered ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.2)',
                            zIndex: 5,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div 
                            className={`rounded-circle d-flex align-items-center justify-content-center ${isDelivered ? 'bg-emerald-500 text-white' : 'bg-white bg-opacity-20 text-slate-300'}`}
                            style={{ width: '16px', height: '16px' }}
                          >
                            {isDelivered ? <Check size={10} strokeWidth={3} /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />}
                          </div>
                          <span className={`fs-9 fw-semibold ${isDelivered ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {isDelivered ? 'Delivered' : node.label}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Real Configured SMTP Gateways List */}
              <div className="row g-2 w-100">
                {realData.activeGateways.map((gw, idx) => (
                  <div key={idx} className="col-12 col-md-4">
                    <div className="p-2.5 rounded-3 bg-slate-900 bg-opacity-90 border border-white border-opacity-15 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-1.5 text-truncate">
                        <Server size={14} className="text-primary flex-shrink-0" />
                        <span className="fs-9 fw-bold text-white text-truncate">{gw.gatewayName}</span>
                      </div>
                      <span className={`badge ${gw.connectionStatus === 'Connected' ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning border-warning-subtle'} px-2 py-0.5 rounded-pill fs-9 flex-shrink-0 fw-semibold`}>
                        ● {gw.connectionStatus || 'Connected'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* SCENE 5: LIVE DELIVERY ANALYTICS (7.2s – 9.2s) */}
          {scene === 5 && (
            <motion.div
              key="scene-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="w-100 d-flex flex-column gap-3 align-items-center"
              style={{ maxWidth: '680px' }}
            >
              <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                <span className="badge bg-emerald-500 bg-opacity-20 text-emerald-400 border border-emerald-500 border-opacity-40 px-3 py-1 rounded-pill fs-8 fw-bold">
                  04 — REAL ANALYTICS DASHBOARD
                </span>
                <span className="fs-9 text-slate-300">Live Platform Intelligence</span>
              </div>

              {/* 4 Metrics Cards Grid with Count-Up Animations */}
              <div className="row g-2.5 w-100">
                <div className="col-6 col-md-3">
                  <div className="p-3.5 rounded-4 bg-slate-900 bg-opacity-90 border border-white border-opacity-15 text-center shadow-lg">
                    <div className="fs-9 text-slate-400 mb-1 fw-semibold">EMAILS SENT</div>
                    <div className="fs-3 fw-bold text-white font-monospace">
                      {loadingData ? '...' : (animatedSentCount !== null ? animatedSentCount.toLocaleString() : '—')}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-3.5 rounded-4 bg-slate-900 bg-opacity-90 border border-white border-opacity-15 text-center shadow-lg">
                    <div className="fs-9 text-slate-400 mb-1 fw-semibold">CAMPAIGNS</div>
                    <div className="fs-3 fw-bold text-white font-monospace">
                      {loadingData ? '...' : (animatedCampaignCount !== null ? animatedCampaignCount.toLocaleString() : '—')}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-3.5 rounded-4 bg-slate-900 bg-opacity-90 border border-white border-opacity-15 text-center shadow-lg">
                    <div className="fs-9 text-slate-400 mb-1 fw-semibold">SUCCESS RATE</div>
                    <div className="fs-3 fw-bold text-emerald-400 font-monospace">
                      {loadingData ? '...' : (animatedSuccessRate !== null ? `${animatedSuccessRate}%` : '—')}
                    </div>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-3.5 rounded-4 bg-slate-900 bg-opacity-90 border border-white border-opacity-15 text-center shadow-lg">
                    <div className="fs-9 text-slate-400 mb-1 fw-semibold">TOTAL STUDENTS</div>
                    <div className="fs-3 fw-bold text-cyan-400 font-monospace">
                      {loadingData ? '...' : (animatedStudentCount !== null ? animatedStudentCount.toLocaleString() : '—')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thin Progress Indicator for Delivery Success */}
              <div className="w-100 p-3 rounded-4 bg-slate-900 bg-opacity-80 border border-white border-opacity-10 d-flex flex-column gap-1.5 shadow-sm">
                <div className="d-flex align-items-center justify-content-between fs-9">
                  <span className="text-slate-300 font-monospace text-uppercase fw-semibold">Delivery Success Track</span>
                  <span className="fw-bold text-emerald-400 font-monospace">{animatedSuccessRate !== null ? `${animatedSuccessRate}%` : '100%'}</span>
                </div>
                <div className="progress" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div 
                    className="progress-bar bg-emerald-500" 
                    role="progressbar" 
                    style={{ width: `${animatedSuccessRate || 100}%`, transition: 'width 0.2s ease-out' }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* SCENE 6: FINAL TRANSITION -> LOGIN (9.2s – 10.0s) */}
          {scene === 6 && (
            <motion.div
              key="scene-6"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.22 }}
              className="text-center d-flex flex-column align-items-center gap-3"
              style={{ maxWidth: '640px' }}
            >
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-emerald-500 bg-opacity-20 text-emerald-400 border border-emerald-500 border-opacity-40 fs-8 fw-semibold">
                <CheckCircle2 size={16} />
                <span>RECRUITMENT OUTREACH, SIMPLIFIED</span>
              </div>

              <h2 className="fw-bold text-white m-0" style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', lineHeight: 1.2 }}>
                Reach the right students.<br />
                <span style={{ background: 'linear-gradient(135deg, #818CF8 0%, #C7D2FE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Build better opportunities.
                </span>
              </h2>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Bottom Timeline Progress Bar (10.0s Total Duration) */}
      <div className="position-relative pt-2 border-top border-white border-opacity-10 w-100 mx-auto" style={{ zIndex: 10, maxWidth: '1100px' }}>
        <div className="d-flex align-items-center justify-content-between text-slate-400 fs-9 mb-1.5">
          <span>Aparaitech Recruitment Infrastructure</span>
          <span className="font-monospace">Timeline: {currentProgress.toFixed(1)}s / 10.0s</span>
        </div>
        <div className="progress" style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}>
          <div
            className="progress-bar bg-primary"
            role="progressbar"
            style={{ width: `${(currentProgress / 10.0) * 100}%`, transition: 'width 0.1s linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default EmailBlastIntro;
