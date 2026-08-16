import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Upload, 
  Send, 
  FileText, 
  History, 
  BarChart3, 
  ShieldAlert, 
  ClipboardList, 
  UserCog, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenMobile = () => setMobileOpen(true);
    window.addEventListener('openMobileSidebar', handleOpenMobile);
    return () => window.removeEventListener('openMobileSidebar', handleOpenMobile);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const toggleCollapse = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    setShowProfileMenu(false);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      if (nextState) {
        mainContent.classList.add('sidebar-collapsed');
      } else {
        mainContent.classList.remove('sidebar-collapsed');
      }
    }
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'AU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeStyle = (role) => {
    if (role === 'Admin') {
      return {
        bg: 'rgba(79, 70, 229, 0.2)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        color: '#A5B4FC'
      };
    }
    if (role === 'Recruiter') {
      return {
        bg: 'rgba(34, 197, 94, 0.2)',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        color: '#86EFAC'
      };
    }
    return {
      bg: 'rgba(148, 163, 184, 0.2)',
      border: '1px solid rgba(148, 163, 184, 0.4)',
      color: '#CBD5E1'
    };
  };

  const roleStyle = getRoleBadgeStyle(user?.role || 'Admin');

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="d-md-none position-fixed inset-0 bg-dark bg-opacity-60"
          style={{ zIndex: 1040, top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={closeMobile}
        />
      )}

      <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="sidebar-brand-icon"
              data-tooltip={collapsed ? "Aparaitech Software" : undefined}
            >
              <Send size={20} />
            </div>
            {!collapsed && (
              <div className="d-flex flex-column justify-content-center">
                <div 
                  className="fw-bold text-white leading-tight fs-6" 
                  style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}
                >
                  Aparaitech Software
                </div>
                <div 
                  className="small" 
                  style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.2px', whiteSpace: 'nowrap' }}
                >
                  Student Email Blast
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button (Desktop) */}
          <button 
            onClick={toggleCollapse} 
            className="btn btn-sm btn-ghost-custom d-none d-md-flex align-items-center justify-content-center p-1.5 rounded-circle"
            style={{ color: '#94A3B8', width: '32px', height: '32px' }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          {/* Close Button (Mobile) */}
          <button 
            onClick={closeMobile} 
            className="btn btn-sm btn-ghost-custom d-md-none text-white-50 p-2 d-flex align-items-center justify-content-center"
            style={{ width: '44px', height: '44px' }}
            title="Close navigation"
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav aria-label="Primary navigation" className="sidebar-menu">
          {/* WORKSPACE GROUP */}
          {!collapsed && <div className="nav-label">WORKSPACE</div>}
          <NavLink 
            to="/dashboard" 
            onClick={closeMobile}
            data-tooltip="Dashboard"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={19} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          <NavLink 
            to="/students" 
            onClick={closeMobile}
            data-tooltip="Students"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <Users size={19} />
            {!collapsed && <span>Students</span>}
          </NavLink>
          {user?.role !== 'Viewer' && (
            <NavLink 
              to="/bulk-upload" 
              onClick={closeMobile}
              data-tooltip="Bulk Upload"
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
            >
              <Upload size={19} />
              {!collapsed && <span>Bulk Upload</span>}
            </NavLink>
          )}

          {/* CAMPAIGNS GROUP */}
          {!collapsed && <div className="nav-label">CAMPAIGNS</div>}
          {user?.role !== 'Viewer' && (
            <NavLink 
              to="/composer" 
              onClick={closeMobile}
              data-tooltip="Email Composer"
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
            >
              <Send size={19} />
              {!collapsed && <span>Email Composer</span>}
            </NavLink>
          )}
          <NavLink 
            to="/templates" 
            onClick={closeMobile}
            data-tooltip="Templates"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <FileText size={19} />
            {!collapsed && <span>Templates</span>}
          </NavLink>
          <NavLink 
            to="/campaigns" 
            onClick={closeMobile}
            data-tooltip="Campaign History"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <History size={19} />
            {!collapsed && <span>Campaign History</span>}
          </NavLink>

          {/* ANALYTICS GROUP */}
          {!collapsed && <div className="nav-label">ANALYTICS</div>}
          <NavLink 
            to="/reports" 
            onClick={closeMobile}
            data-tooltip="Reports"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={19} />
            {!collapsed && <span>Reports</span>}
          </NavLink>

          {/* MANAGEMENT GROUP */}
          {!collapsed && <div className="nav-label">MANAGEMENT</div>}
          <NavLink 
            to="/suppressions" 
            onClick={closeMobile}
            data-tooltip="Suppression List"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <ShieldAlert size={19} />
            {!collapsed && <span>Suppression List</span>}
          </NavLink>

          {user?.role === 'Admin' && (
            <>
              <NavLink 
                to="/audit-logs" 
                onClick={closeMobile}
                data-tooltip="Audit Logs"
                className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              >
                <ClipboardList size={19} />
                {!collapsed && <span>Audit Logs</span>}
              </NavLink>
              <NavLink 
                to="/users" 
                onClick={closeMobile}
                data-tooltip="Users"
                className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
              >
                <UserCog size={19} />
                {!collapsed && <span>Users</span>}
              </NavLink>
            </>
          )}

          <NavLink 
            to="/settings" 
            onClick={closeMobile}
            data-tooltip="Settings"
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <Settings size={19} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        </nav>

        {/* User Profile Footer */}
        <div className="sidebar-footer position-relative">
          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div 
              className="position-absolute start-0 end-0 mb-2 p-2 rounded-3 shadow-lg"
              style={{ 
                bottom: '100%', 
                background: '#1E293B', 
                border: '1px solid rgba(255,255,255,0.12)',
                zIndex: 1050 
              }}
            >
              <div className="px-3 py-2 border-bottom border-white border-opacity-10 mb-1">
                <div className="fw-bold text-white small">{user?.name || 'Admin User'}</div>
                <div className="small text-truncate" style={{ color: '#94A3B8', fontSize: '0.725rem' }}>
                  {user?.email || 'admin@aparaitech.com'}
                </div>
              </div>

              <button
                onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                className="btn btn-sm w-100 text-start text-white-50 hover-text-white d-flex align-items-center gap-2 py-1.5 px-3 rounded-2"
                style={{ background: 'transparent', border: 'none' }}
              >
                <Settings size={16} />
                <span className="small">Settings</span>
              </button>

              <button
                onClick={() => { setShowProfileMenu(false); logout(); }}
                className="btn btn-sm w-100 text-start text-danger d-flex align-items-center gap-2 py-1.5 px-3 rounded-2 mt-1"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none' }}
              >
                <LogOut size={16} />
                <span className="small fw-semibold">Sign out</span>
              </button>
            </div>
          )}

          {/* Profile Card / Controls */}
          {collapsed ? (
            <div className="d-flex justify-content-center">
              <div className="position-relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm border-0 cursor-pointer position-relative"
                  style={{ 
                    width: '44px', 
                    height: '44px', 
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    fontSize: '0.9rem',
                    boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.15)'
                  }}
                  data-tooltip={`${user?.name || 'Admin User'} (${user?.role || 'Admin'})`}
                  title={user?.name || 'Admin User'}
                >
                  {getInitials(user?.name)}
                </button>
                {/* Active Online Indicator */}
                <span 
                  className="position-absolute bottom-0 end-0 p-1 bg-success rounded-circle"
                  style={{ width: '10px', height: '10px', border: '2px solid #0B1220' }}
                  title="Active Session"
                />
              </div>
            </div>
          ) : (
            <div>
              <div 
                className="p-3 rounded-3 cursor-pointer user-select-none transition-all"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.04)', 
                  border: '1px solid rgba(255, 255, 255, 0.09)', 
                  borderRadius: '14px' 
                }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
                }}
              >
                <div className="d-flex align-items-center justify-content-between gap-2.5">
                  {/* Left: Avatar with Active Dot */}
                  <div className="position-relative flex-shrink-0">
                    <div 
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                      style={{ 
                        width: '46px', 
                        height: '46px', 
                        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                        fontSize: '0.9rem',
                        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      {getInitials(user?.name)}
                    </div>
                    {/* Active Online Indicator */}
                    <span 
                      className="position-absolute bottom-0 end-0 p-1 bg-success rounded-circle"
                      style={{ width: '10px', height: '10px', border: '2px solid #0B1220' }}
                      title="Active Session"
                    />
                  </div>

                  {/* Center: Identity Information */}
                  <div className="flex-grow-1 overflow-hidden">
                    <div className="d-flex align-items-center justify-content-between gap-1 mb-0.5">
                      <span className="text-white fw-bold text-truncate" style={{ fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                        {user?.name || 'Admin User'}
                      </span>
                      <span 
                        className="badge rounded-pill px-2 py-0.5 flex-shrink-0"
                        style={{ 
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          background: roleStyle.bg,
                          border: roleStyle.border,
                          color: roleStyle.color
                        }}
                      >
                        {user?.role || 'Admin'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between gap-1">
                      <span className="text-truncate" style={{ color: '#94A3B8', fontSize: '0.775rem' }}>
                        {user?.email || 'admin@aparaitech.com'}
                      </span>
                      <ChevronUp size={13} className="flex-shrink-0 transition-transform" style={{ color: '#94A3B8', transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Sign Out Button */}
              <button 
                onClick={logout} 
                className="btn-signout-custom w-100 mt-2 d-flex align-items-center justify-content-center gap-2 py-1.5 px-3 rounded-2" 
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={15} />
                <span className="fw-semibold small">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
