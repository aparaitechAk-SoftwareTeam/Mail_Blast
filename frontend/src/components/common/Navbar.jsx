import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Bell, Search, Sun, Moon, CheckCircle2, Menu, X } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const Navbar = ({ title }) => {
  const { user } = useContext(AuthContext);
  const [theme, setTheme] = useState(() => localStorage.getItem('aparaitech_theme') || 'light');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Platform detection for Cmd/Ctrl + K hint
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcutHint = isMac ? '⌘ K' : 'Ctrl K';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aparaitech_theme', theme);
  }, [theme]);

  // Global Ctrl/Cmd + K shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleHamburgerClick = () => {
    window.dispatchEvent(new Event('openMobileSidebar'));
  };

  return (
    <header className="top-navbar">
      <div className="d-flex align-items-center gap-2.5 overflow-hidden">
        {/* Hamburger Menu Button (Mobile Only) */}
        <button
          onClick={handleHamburgerClick}
          className="btn btn-icon btn-ghost-custom d-md-none p-2 text-dark rounded-3 flex-shrink-0"
          style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Open navigation menu"
          title="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="overflow-hidden">
          <h4 
            className="m-0 fw-bold text-dark tracking-tight text-truncate" 
            style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}
          >
            {title}
          </h4>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-sm-3 flex-shrink-0">
        {/* Global Enterprise Search Bar */}
        <div 
          className="position-relative d-none d-md-block"
          style={{ width: '350px', maxWidth: '100%' }}
        >
          <Search 
            size={17} 
            className={`position-absolute top-50 start-0 translate-middle-y ms-3 transition-colors ${
              isFocused ? 'text-primary' : 'text-muted'
            }`} 
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search students, campaigns..."
            aria-label="Search students and campaigns"
            className="form-control bg-white text-dark ps-5 pe-5 py-2 border shadow-none"
            style={{ 
              height: '42px', 
              borderRadius: '10px', 
              borderColor: isFocused ? 'var(--bs-primary, #3b82f6)' : '#DDE3EC',
              boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
              transition: 'all 180ms ease-in-out',
              fontSize: '0.875rem'
            }}
          />

          {/* Right Action: Clear Button or Keyboard Shortcut Hint */}
          <div className="position-absolute top-50 end-0 translate-middle-y me-2.5 d-flex align-items-center">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="btn btn-sm btn-link text-muted p-1 border-0 d-flex align-items-center justify-content-center text-decoration-none rounded-circle hover-bg-light"
                aria-label="Clear search text"
                title="Clear search"
                style={{ width: '24px', height: '24px' }}
              >
                <X size={14} />
              </button>
            ) : (
              <kbd 
                className="badge bg-light text-secondary border px-1.5 py-1 rounded fs-9 fw-medium text-uppercase pointer-events-none"
                style={{ fontSize: '0.7rem', letterSpacing: '0.03em', borderColor: '#E2E8F0' }}
              >
                {shortcutHint}
              </kbd>
            )}
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-icon btn-ghost-custom rounded-circle p-2 text-muted"
          style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} className="text-warning" />}
        </button>

        {/* Notifications Popover */}
        <div className="position-relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-icon btn-ghost-custom rounded-circle p-2 text-muted position-relative"
            style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle">
              <span className="visually-hidden">New alerts</span>
            </span>
          </button>

          {showNotifications && (
            <div
              className="card border-0 shadow-lg position-absolute end-0 mt-2 py-2 rounded-4 bg-surface"
              style={{ width: '290px', zIndex: 1000 }}
            >
              <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                <span className="fw-bold small">System Notifications</span>
                <span className="badge bg-primary-subtle text-primary rounded-pill small">2 New</span>
              </div>
              <div className="list-group list-group-flush small">
                <div className="list-group-item bg-transparent px-3 py-2 border-0">
                  <div className="d-flex align-items-start gap-2">
                    <CheckCircle2 size={16} className="text-success mt-1 flex-shrink-0" />
                    <div>
                      <div className="fw-semibold">System Online</div>
                      <div className="text-muted fs-8">SMTP Transporter fallback active.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="border-start ps-2 ps-sm-3">
          <div className="d-flex align-items-center gap-2">
            <div className="position-relative flex-shrink-0">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: '38px', height: '38px', fontWeight: 'bold', fontSize: '0.875rem' }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span 
                className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle"
                title="Active / Online"
                aria-label="Active / Online"
              />
            </div>
            <div className="d-none d-sm-block text-start">
              <div className="fw-semibold text-dark leading-tight" style={{ fontSize: '0.85rem' }}>
                {user?.name || 'Admin User'}
              </div>
              <StatusBadge status={user?.role || 'Admin'} type="role" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
