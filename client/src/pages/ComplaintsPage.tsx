// path: client/src/pages/ComplaintsPage.tsx
// Paginated, filterable list of complaints.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { getStatusColor, getPriorityColor } from '../utils/statusBadge';

interface Complaint {
  _id: string; complaintId: string; category: string;
  status: string; priority: string; createdAt: string;
  description: string;
}

const STATUSES = ['','Submitted','Under Review','In Progress','Escalated','Resolved','Closed'];

export default function ComplaintsPage() {
  const { t }  = useTranslation();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '15' });
        if (status) params.set('status', status);
        const { data } = await axios.get(`${API_BASE}/complaints?${params}`);
        setComplaints(data.complaints);
        setTotal(data.total);
      } catch { /* show empty */ } finally {
        setLoading(false);
      }
    };
    load();
  }, [page, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('complaints')} <span className="text-sm text-gray-400 font-normal">({total})</span></h1>
        <Link to="/complaints/new" className="btn-primary text-sm">+ {t('newComplaint')}</Link>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              status === s ? 'bg-ashoka text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-ashoka'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse text-center py-16 text-gray-400">Loading...</div>
      ) : complaints.length === 0 ? (
        <div className="card text-center text-gray-400 py-16">{t('noComplaints')}</div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Link key={c._id} to={`/complaints/${c.complaintId}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">{c.complaintId}</span>
                    <span className={`badge ${getStatusColor(c.status)}`}>{c.status}</span>
                    <span className={`badge ${getPriorityColor(c.priority)}`}>{c.priority}</span>
                  </div>
                  <div className="font-medium text-gray-800">{c.category}</div>
                  <div className="text-sm text-gray-500 truncate mt-0.5">{c.description}</div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 15 && (
        <div className="flex justify-center gap-2 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-3 py-1">← Prev</button>
          <span className="px-3 py-1 text-sm text-gray-500">Page {page} of {Math.ceil(total / 15)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 15 >= total} className="btn-secondary text-sm px-3 py-1">Next →</button>
        </div>
      )}
    </div>
  );
}
