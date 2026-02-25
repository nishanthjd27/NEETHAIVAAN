// path: client/src/pages/AdminPanel.tsx
// Admin panel: lists all complaints with full filter/search + avg resolution time.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { getStatusColor, getPriorityColor } from '../utils/statusBadge';

interface AvgResolution { category: string; avgDays: number; totalResolved: number; }

export default function AdminPanel() {
  const { t } = useTranslation();
  const [complaints,   setComplaints]  = useState<unknown[]>([]);
  const [avgRes,       setAvgRes]      = useState<AvgResolution[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50';
        const [cRes, avgRes] = await Promise.all([
          axios.get(`${API_BASE}/complaints${params}`),
          axios.get(`${API_BASE}/admin/analytics/avg-resolution-time`),
        ]);
        setComplaints(cRes.data.complaints);
        setAvgRes(avgRes.data.data);
      } catch { /* show empty */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('adminPanel')}</h1>

      {/* Avg Resolution Time */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">⏱ Average Resolution Time (by category)</h2>
        {avgRes.length === 0 ? (
          <p className="text-gray-400 text-sm">No resolved complaints yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {avgRes.map((a) => (
              <div key={a.category} className="bg-gray-50 rounded-lg p-3">
                <div className="font-medium text-sm text-gray-700">{a.category}</div>
                <div className="text-2xl font-bold text-brand-600 mt-1">{a.avgDays}d</div>
                <div className="text-xs text-gray-400">{a.totalResolved} resolved</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complaints Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">All Complaints</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">All Statuses</option>
            {['Submitted','Under Review','In Progress','Escalated','Resolved','Closed'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 animate-pulse">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Priority</th>
                  <th className="pb-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(complaints as Array<{_id: string; complaintId: string; category: string; status: string; priority: string; createdAt: string}>).map((c) => (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 pr-4">
                      <Link to={`/complaints/${c.complaintId}`} className="text-brand-600 hover:underline font-mono text-xs">
                        {c.complaintId}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{c.category}</td>
                    <td className="py-2 pr-4"><span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span></td>
                    <td className="py-2 pr-4"><span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span></td>
                    <td className="py-2 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
