// path: client/src/pages/SubmitComplaint.tsx
// Form to create a new complaint.
// Calls /api/ai/classify as user types description for a live AI preview.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_BASE } from '../utils/api';

const CATEGORIES = [
  'Consumer Fraud','Labour Dispute','Tenant Rights','Corruption Report',
  'Police Complaint','Medical Negligence','Cybercrime','Property Dispute',
  'Traffic Dispute','Harassment','General Grievance',
];

const PRIORITIES = ['Low','Medium','High','Critical'];

interface AiResult {
  intent:        string;
  domain:        string;
  suggestedActs: string[];
  confidence:    number;
}

export default function SubmitComplaint() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ category: CATEGORIES[0], description: '', priority: 'Medium' });
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [loading, setLoading]  = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Debounced AI classification preview
  const classifyText = useCallback(async (text: string) => {
    if (text.length < 20) { setAiResult(null); return; }
    setAiLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/ai/classify`, { text });
      setAiResult(data.result);
    } catch { /* silent */ } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => classifyText(form.description), 600);
    return () => clearTimeout(t);
  }, [form.description, classifyText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/complaints`, form);
      toast.success(`Complaint filed! ID: ${data.complaint.complaintId}`);
      navigate(`/complaints/${data.complaint.complaintId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('newComplaint')}</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority')}</label>
            <select
              className="input-field"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
            <textarea
              required minLength={20} maxLength={5000} rows={6}
              className="input-field resize-none"
              placeholder="Describe your complaint in detail (minimum 20 characters)..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className="text-xs text-gray-400 mt-1">{form.description.length}/5000</div>
          </div>
        </div>

        {/* AI Classification Preview */}
        {(aiResult || aiLoading) && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">🤖 {t('aiClassification')}</h3>
            {aiLoading ? (
              <div className="text-blue-400 text-sm animate-pulse">Analysing...</div>
            ) : aiResult && (
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600">{t('intent')}:</span> <span className="font-medium text-blue-700">{aiResult.intent.replace(/_/g, ' ')}</span></div>
                <div><span className="text-gray-600">Domain:</span> <span className="font-medium">{aiResult.domain}</span></div>
                <div>
                  <span className="text-gray-600">{t('suggestedActs')}:</span>
                  <ul className="mt-1 space-y-1">
                    {aiResult.suggestedActs.map((act) => (
                      <li key={act} className="flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">⚖️</span>
                        <span className="text-gray-700">{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-gray-600">{t('confidence')}:</span>{' '}
                  <span className="font-medium">{(aiResult.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('loading') : t('submit')}
          </button>
          <button type="button" onClick={() => navigate('/complaints')} className="btn-secondary">
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
