import React, { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { fetchAuditLogs } from '../services/userService';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { ClipboardList, Shield, Search } from 'lucide-react';

import StatusBadge from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

const AuditLogs = () => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Aparaitech | Audit Logs';
    const load = async () => {
      try {
        const data = await fetchAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Error loading audit logs:', err);
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredLogs = logs.filter(l => 
    !search || 
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar title="System Audit Trail" />

      <div className="page-container">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0">Recruitment Activity Audit Trail</h5>
            <p className="text-muted small m-0 mt-0.5">Immutable system log history tracking imports, logins, campaign launches, and admin changes</p>
          </div>

          <div style={{ maxWidth: '300px' }}>
            <Input
              name="searchLogs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action or email..."
              icon={Search}
              className="m-0"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="card border-0 shadow-sm rounded-4 bg-surface p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table custom-table align-middle m-0">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User Email</th>
                  <th>Role</th>
                  <th>Activity Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      <EmptyState title="No audit entries" description="No system activity matches your query." />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr key={log._id || i}>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 rounded-pill small fw-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="fw-bold text-dark">{log.userEmail}</td>
                      <td>
                        <StatusBadge status={log.userRole || 'Recruiter'} type="role" />
                      </td>
                      <td className="small text-secondary">{log.details}</td>
                      <td className="text-muted small">{formatDate(log.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
