// path: client/src/pages/DashboardPage.tsx
// Dashboard showing summary stat cards + status pie chart + monthly line chart.
// Admins see global data; regular users see only their own stats.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, Title,
} from 'chart.js';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface StatusCount { status: string; count: number; }
interface MonthlyTrend { year: number; month: number; count: number; }

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [statusData,  setStatusData]  = useState<StatusCount[]>([]);
  const [trendData,   setTrendData]   = useState<MonthlyTrend[]>([]);
  const [myCount,     setMyCount]     = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [complRes] = await Promise.all([
          axios.get(`${API_BASE}/complaints`),
        ]);
        setMyCount(complRes.data.total);

        if (user?.role === 'admin') {
          const [statRes, trendRes] = await Promise.all([
            axios.get(`${API_BASE}/admin/analytics/status-counts`),
            axios.get(`${API_BASE}/admin/analytics/monthly-trends`),
          ]);
          setStatusData(statRes.data.data);
          setTrendData(trendRes.data.data);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const COLORS = ['#3B82F6','#F59E0B','#8B5CF6','#EF4444','#22C55E','#6B7280'];

  const pieData = {
    labels: statusData.map((s) => s.status),
    datasets: [{
      data: statusData.map((s) => s.count),
      backgroundColor: COLORS,
      borderWidth: 2,
    }],
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const lineData = {
    labels: trendData.map((t) => `${MONTHS[t.month - 1]} ${t.year}`),
    datasets: [{
      label: 'Complaints',
      data:  trendData.map((t) => t.count),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      tension: 0.4,
      fill: true,
    }],
  };

  const resolved  = statusData.find((s) => s.status === 'Resolved')?.count  || 0;
  const escalated = statusData.find((s) => s.status === 'Escalated')?.count || 0;
  const total     = statusData.reduce((a, s) => a + s.count, 0) || myCount;

  if (loading) return <div className="animate-pulse text-gray-400 text-center py-20">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('totalComplaints'), value: total,     bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '📋' },
          { label: t('resolved'),        value: resolved,  bg: 'bg-green-50',  text: 'text-green-700',  icon: '✅' },
          { label: t('escalated'),       value: escalated, bg: 'bg-red-50',    text: 'text-red-700',    icon: '🚨' },
          { label: t('pending'),         value: total - resolved - escalated, bg: 'bg-yellow-50', text: 'text-yellow-700', icon: '⏳' },
        ].map((card) => (
          <div key={card.label} className={`card ${card.bg} border-0`}>
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className={`text-3xl font-bold ${card.text}`}>{card.value}</div>
            <div className="text-sm text-gray-600 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts (admin only) */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">Complaints by Status</h2>
            <div className="h-64 flex items-center justify-center">
              {statusData.length > 0
                ? <Pie data={pieData} options={{ maintainAspectRatio: false }} />
                : <p className="text-gray-400">No data</p>}
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-gray-700 mb-4">Monthly Trends (Last 12 months)</h2>
            <div className="h-64">
              {trendData.length > 0
                ? <Line data={lineData} options={{ maintainAspectRatio: false }} />
                : <p className="text-gray-400">No data</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
