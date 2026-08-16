import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import { RefreshProvider, RefreshContext } from './context/RefreshContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Sidebar from './components/common/Sidebar';
import { WifiOff } from 'lucide-react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import BulkUpload from './pages/BulkUpload';
import Composer from './pages/Composer';
import Templates from './pages/Templates';
import Campaigns from './pages/Campaigns';
import CampaignDetail from './pages/CampaignDetail';
import Reports from './pages/Reports';
import SuppressionList from './pages/SuppressionList';
import AuditLogs from './pages/AuditLogs';
import UsersPage from './pages/Users';
import Settings from './pages/Settings';

const OfflineBanner = () => {
  const { isOffline } = useContext(RefreshContext);
  if (!isOffline) return null;

  return (
    <div 
      className="bg-danger text-white py-1.5 px-3 text-center small fw-semibold d-flex align-items-center justify-content-center gap-2"
      style={{ position: 'sticky', top: 0, zIndex: 9999 }}
    >
      <WifiOff size={16} />
      <span>You are offline. Some real-time features may be unavailable.</span>
    </div>
  );
};

const ProtectedLayout = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="p-5 text-center text-muted">Loading authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <OfflineBanner />
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/students" element={<ProtectedLayout><Students /></ProtectedLayout>} />
      <Route path="/bulk-upload" element={<ProtectedLayout allowedRoles={['Admin', 'Recruiter']}><BulkUpload /></ProtectedLayout>} />
      <Route path="/composer" element={<ProtectedLayout allowedRoles={['Admin', 'Recruiter']}><Composer /></ProtectedLayout>} />
      <Route path="/templates" element={<ProtectedLayout><Templates /></ProtectedLayout>} />
      <Route path="/campaigns" element={<ProtectedLayout><Campaigns /></ProtectedLayout>} />
      <Route path="/campaigns/:id" element={<ProtectedLayout><CampaignDetail /></ProtectedLayout>} />
      <Route path="/reports" element={<ProtectedLayout><Reports /></ProtectedLayout>} />
      <Route path="/suppressions" element={<ProtectedLayout><SuppressionList /></ProtectedLayout>} />
      <Route path="/audit-logs" element={<ProtectedLayout allowedRoles={['Admin']}><AuditLogs /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout allowedRoles={['Admin']}><UsersPage /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <RefreshProvider>
              <Router>
                <AppRoutes />
              </Router>
            </RefreshProvider>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
