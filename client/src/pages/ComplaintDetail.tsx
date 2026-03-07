// path: client/src/pages/ComplaintDetail.tsx
// Full detail view of one complaint. Admins/lawyers can update status.
// "Download Draft PDF" uses jsPDF to export the autoDraft.

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { exportDraftAsPdf } from '../utils/pdfExport';
import { getStatusColor, getPriorityColor } from '../utils/statusBadge';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Submitted','Under Review','In Progress','Escalated','Resolved','Closed'];

interface TimelineEntry { status: string; remark: string; at: string; }
interface Complaint {
  _id: string; complaintId: string; category: string; description: string;
  autoDraft: string; status: string; priority: string;
  timeline: TimelineEntry[]; adminRemarks: string;
  detectedIntent?: string; suggestedActs?: string[];
  createdAt: string; updatedAt: string;
  userId: { name: string; email: string };
}

export default function ComplaintDetail() {
  const { id }       = useParams<{ id: string }>();
  const { t }        = useTranslation();
  const { user }     = useAuth();
  const navigate     = useNavigate();
  const [complaint,  setComplaint]  = useState<Complaint | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [newStatus,  setNewStatus]  = useState('');
  const [remark,     setRemark]     = useState('');
  const [updating,   setUpdating]   = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/complaints/${id}`)
      .then(({ data }) => { setComplaint(data.complaint); setNewStatus(data.complaint.status); })
      .catch(() => toast.error('Complaint not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!complaint || newStatus === complaint.status) return;
    setUpdating(true);
    try {
      const { data } = await axios.patch(`${API_BASE}/complaints/${id}/status`, { status: newStatus, remark });
      setComplaint(data.complaint);
      toast.success('Status updated');
      setRemark('');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadDraft = async () => {
    if (!complaint) return;
    try {
      const { data } = await axios.get(`${API_BASE}/complaints/${id}/draft`);
      exportDraftAsPdf(data.draft, complaint.complaintId);
    } catch {
      toast.error('Could not load draft');
    }
  };

  if (loading) return <div className="animate-pulse text-center py-20 text-gray-400">Loading...</div>;
  if (!complaint) return <div className="text-center py-20 text-red-400">Complaint not found.</div>;

  const canEdit = ['admin','lawyer'].includes(user?.role || '');

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">← Back</button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">{complaint.complaintId}</h1>
        <span className={`badge ${getStatusColor(complaint.status)} text-sm`}>{complaint.status}</span>
        <span className={`badge ${getPriorityColor(complaint.priority)} text-sm`}>{complaint.priority}</span>
      </div>

      {/* Complaint Info */}
      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">{t('category')}:</span> <span className="font-medium">{complaint.category}</span></div>
          <div><span className="text-gray-500">Filed by:</span> <span className="font-medium">{complaint.userId?.name}</span></div>
          <div><span className="text-gray-500">{t('createdAt')}:</span> <span className="font-medium">{new Date(complaint.createdAt).toLocaleString()}</span></div>
          <div><span className="text-gray-500">Last updated:</span> <span className="font-medium">{new Date(complaint.updatedAt).toLocaleString()}</span></div>
        </div>
        <div>
          <div className="text-gray-500 text-sm mb-1">{t('description')}:</div>
          <p className="text-gray-800 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">{complaint.description}</p>
        </div>
      </div>

      {/* AI Classification */}
      {complaint.detectedIntent && (
        <div className="card bg-blue-50 border-blue-200 space-y-2 text-sm">
          <h3 className="font-semibold text-blue-800">🤖 {t('aiClassification')}</h3>
          <div><span className="text-gray-600">{t('intent')}:</span> <span className="font-medium">{complaint.detectedIntent?.replace(/_/g, ' ')}</span></div>
          {(complaint.suggestedActs?.length ?? 0) > 0 && (
            <div>
              <span className="text-gray-600">{t('suggestedActs')}:</span>
              <ul className="mt-1 space-y-0.5">
                {complaint.suggestedActs?.map((act) => <li key={act} className="flex gap-1.5"><span>⚖️</span>{act}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Admin Status Update */}
      {canEdit && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-700">{t('updateStatus')}</h3>
          <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-field">
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input
            type="text" placeholder="Add a remark (optional)" value={remark}
            onChange={(e) => setRemark(e.target.value)} className="input-field"
          />
          <button onClick={handleStatusUpdate} disabled={updating || newStatus === complaint.status} className="btn-primary">
            {updating ? 'Updating...' : t('updateStatus')}
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Timeline</h3>
        <div className="space-y-3">
          {complaint.timeline.map((entry, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-ashoka mt-0.5 flex-shrink-0"></div>
                {i < complaint.timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1"></div>}
              </div>
              <div className="pb-3">
                <span className={`badge ${getStatusColor(entry.status)} mr-2`}>{entry.status}</span>
                {entry.remark && <span className="text-gray-600">{entry.remark}</span>}
                <div className="text-xs text-gray-400 mt-0.5">{new Date(entry.at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleDownloadDraft} className="btn-secondary text-sm">
          📄 {t('downloadDraft')}
        </button>
      </div>
    </div>
  );
}
