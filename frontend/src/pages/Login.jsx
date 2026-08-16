import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmailBlastIntro from '../components/common/EmailBlastIntro';
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Send, 
  Sparkles,
  Check,
  Users,
  Briefcase
} from 'lucide-react';

const FEATURES = [
  'Centralized student management',
  'Personalized bulk campaigns',
  'Real-time campaign tracking',
  'Recruitment analytics'
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showIntro, setShowIntro] = useState(() => {
    const shown = sessionStorage.getItem('emailBlastIntroShown');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !shown && !prefersReducedMotion;
  });

  useEffect(() => {
    if (showIntro) {
      sessionStorage.setItem('emailBlastIntroShown', 'true');
    }
  }, [showIntro]);

  const { login } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Aparaitech | Sign In';
  }, []);

  const validateForm = () => {
    const errs = {};
    if (!email) {
      errs.email = 'Work email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await login(email, password);
      toast.success('Signed in successfully! Redirecting...');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 w-100 d-flex flex-column flex-lg-row overflow-hidden bg-dark position-relative" style={{ backgroundColor: '#0B1020' }}>
      
      {/* =================================================== */}
      {/* LEFT SIDE: BRAND & RECRUITMENT VISUAL PANEL        */}
      {/* =================================================== */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5 text-white position-relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at 15% 20%, rgba(79, 70, 229, 0.28) 0%, transparent 50%), radial-gradient(circle at 85% 80%, rgba(99, 102, 241, 0.18) 0%, transparent 50%), #0B1020',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Animated 20-Second Email Blast Intro Overlay */}
        <AnimatePresence>
          {showIntro && (
            <EmailBlastIntro onComplete={() => setShowIntro(false)} />
          )}
        </AnimatePresence>

        {/* Subtle Dots & Grid Background Overlay */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 0)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <div className="position-relative" style={{ zIndex: 1 }}>
          {/* Top Brand Header */}
          <div className="d-flex align-items-center justify-content-between mb-5 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <div 
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)' }}
              >
                <Send size={20} />
              </div>
              <span className="fw-bold fs-5 tracking-tight text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                Aparaitech Software
              </span>
            </div>

            <span className="badge bg-primary bg-opacity-20 text-white border border-primary border-opacity-30 px-3 py-1.5 rounded-pill small fw-semibold">
              Student Email Blast
            </span>
          </div>

          {/* Headline & Narrative */}
          <div className="mb-4" style={{ maxWidth: '540px' }}>
            <h1 className="fw-bold tracking-tight mb-3 display-6 text-white" style={{ lineHeight: 1.15 }}>
              Reach the right students.<br />
              <span style={{ background: 'linear-gradient(135deg, #818CF8 0%, #C7D2FE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Build better opportunities.
              </span>
            </h1>
            <p className="text-white-50 lead fs-6 mb-4" style={{ lineHeight: 1.6 }}>
              Manage student outreach, launch personalized recruitment campaigns, and track every email from one professional workspace.
            </p>
          </div>

          {/* Feature List */}
          <div className="row g-3 mb-5" style={{ maxWidth: '520px' }}>
            {FEATURES.map((feat, idx) => (
              <div key={idx} className="col-12 col-sm-6">
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '22px', height: '22px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="small text-white-50 fw-medium">{feat}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Abstract Recruitment & Campaign Flow Graphic (No fake statistics) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-4 rounded-4 shadow-lg position-relative overflow-hidden mb-4"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
              maxWidth: '520px'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-4">
              <span className="text-white-50 fs-8 text-uppercase tracking-wider fw-semibold">
                Recruitment Outreach Workflow
              </span>
              <Sparkles size={16} className="text-primary" />
            </div>

            {/* Workflow Connected Nodes */}
            <div className="d-flex align-items-center justify-content-between position-relative py-2">
              {/* Connector line behind nodes */}
              <div 
                className="position-absolute top-50 start-0 translate-middle-y w-100"
                style={{
                  height: '2px',
                  background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.2) 0%, rgba(99, 102, 241, 0.8) 50%, rgba(16, 185, 129, 0.2) 100%)',
                  zIndex: 0
                }}
              />

              {/* Node 1: Candidate Database */}
              <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-2 shadow-sm"
                  style={{ width: '48px', height: '48px', background: '#1E293B', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <Users size={20} className="text-info" />
                </div>
                <span className="fs-8 fw-semibold text-white">Student Roster</span>
                <span className="fs-8 text-white-50">Filtered Pool</span>
              </div>

              {/* Pulse Email Send Particle */}
              <motion.div 
                animate={{ x: [0, 80, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm position-relative"
                style={{ width: '36px', height: '36px', background: '#4F46E5', zIndex: 2 }}
              >
                <Send size={16} />
              </motion.div>

              {/* Node 2: Personalized Campaign */}
              <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-2 shadow-sm"
                  style={{ width: '48px', height: '48px', background: '#4F46E5', border: '1px solid #6366F1' }}
                >
                  <Mail size={20} className="text-white" />
                </div>
                <span className="fs-8 fw-semibold text-white">Personalized Blast</span>
                <span className="fs-8 text-white-50">Merged Tags</span>
              </div>

              {/* Node 3: Placement Drive */}
              <div className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1 }}>
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center text-white mb-2 shadow-sm"
                  style={{ width: '48px', height: '48px', background: '#1E293B', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <Briefcase size={20} className="text-success" />
                </div>
                <span className="fs-8 fw-semibold text-white">Career Opportunity</span>
                <span className="fs-8 text-white-50">Campus Drives</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer info line */}
        <div className="position-relative pt-3 border-top border-white border-opacity-10 text-white-50 fs-8" style={{ zIndex: 1 }}>
          Aparaitech Software Enterprise Recruitment Platform
        </div>
      </motion.div>

      {/* =================================================== */}
      {/* RIGHT SIDE: CLEAN PROFESSIONAL LOGIN FORM PANEL     */}
      {/* =================================================== */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="col-12 col-lg-6 d-flex flex-column justify-content-between p-4 p-md-5 bg-surface text-dark position-relative"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="w-100 my-auto py-4" style={{ maxWidth: '420px', margin: '0 auto' }}>
          
          {/* Header */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-sm"
                style={{ width: '36px', height: '36px', background: '#4F46E5' }}
              >
                <Send size={18} />
              </div>
              <span className="fw-bold text-dark fs-6" style={{ fontFamily: 'var(--font-heading)' }}>
                Aparaitech Software
              </span>
            </div>

            <h2 className="fw-bold text-dark tracking-tight mb-1.5" style={{ fontSize: '1.75rem' }}>
              Welcome back
            </h2>
            <p className="text-muted small m-0">
              Sign in to continue to your recruitment workspace.
            </p>
          </div>

          {/* Global Error Alert */}
          {error && (
            <div className="alert alert-danger py-2.5 px-3 rounded-3 small mb-4 d-flex align-items-center gap-2 border-0 bg-danger-subtle text-danger">
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Work Email Field */}
            <div className="mb-3.5">
              <label className="form-label small fw-semibold text-dark mb-1.5">Work Email</label>
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted pointer-events-none d-flex align-items-center">
                  <Mail size={18} className="text-secondary" />
                </div>
                <input
                  type="email"
                  className={`form-control form-control-custom ps-5 py-2.5 ${fieldErrors.email ? 'is-invalid' : ''}`}
                  placeholder="you@aparaitech.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                  }}
                  required
                />
              </div>
              {fieldErrors.email && (
                <div className="invalid-feedback d-block small mt-1">{fieldErrors.email}</div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-dark mb-1.5">Password</label>
              <div className="position-relative">
                <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted pointer-events-none d-flex align-items-center">
                  <Lock size={18} className="text-secondary" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control form-control-custom ps-5 pe-5 py-2.5 ${fieldErrors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y pe-3 text-muted text-decoration-none border-0 shadow-none d-flex align-items-center"
                  style={{ zIndex: 5 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="invalid-feedback d-block small mt-1">{fieldErrors.password}</div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary-custom w-100 py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm mt-2 mb-2"
              style={{ fontSize: '0.95rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

        </div>

        {/* Security & Copyright Footer */}
        <div className="pt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted fs-8">
          <div className="d-flex align-items-center gap-1.5">
            <ShieldCheck size={15} className="text-primary" />
            <span>Secure recruitment workspace</span>
          </div>
          <div>
            © 2026 Aparaitech Software
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default Login;
