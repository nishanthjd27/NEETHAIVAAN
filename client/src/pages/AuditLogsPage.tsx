// path: client/src/pages/AuditLogsPage.tsx
// Paginated audit log viewer for admins.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE } from '../utils/api';

interface LogEntry {
  _id: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ip?: string;
  createdAt: string;
  userId?: { name: string; email: string };
}

const ACTION_COLOR: Record<string, string> = {
  login:            'bg-blue-100 text-blue-700',
  complaint_create: 'bg-green-100 text-green-700',
  status_update:    'bg-yellow-100 text-yellow-700',
  auto_escalate:    'bg-red-100 text-red-700',
};

export default function AuditLogsPage() {
  const { t }   = useTranslation();
  const [logs,   setLogs]   = useState<LogEntry[]>([]);
  const [total,  setTotal]  = useState(0);
  const [page,   setPage]   = useState(1);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/admin/audit-logs?page=${page}&limit=50`)
      .then(({ data }) => { setLogs(data.logs); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">{t('auditLogs')} <span className="text-sm text-gray-400 font-normal">({total})</span></h1>

      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-400 animate-pulse">Loading audit logs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4">Timestamp</th>
                  <th className="pb-2 pr-4">Action</th>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Entity</th>
                  <th className="pb-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <span className={`badge ${ACTION_COLOR[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {log.userId ? (
                        <div>
                          <div className="font-medium">{log.userId.name}</div>
                          <div className="text-xs text-gray-400">{log.userId.email}</div>
                        </div>
                      ) : <span className="text-gray-400">System</span>}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-600">
                      {log.entityType && `${log.entityType}: `}{log.entityId}
                    </td>
                    <td className="py-2 text-xs text-gray-400">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-3 py-1">← Prev</button>
          <span className="text-sm text-gray-500 py-1">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= total} className="btn-secondary text-sm px-3 py-1">Next →</button>
        </div>
      )}
    </div>
  );
}
