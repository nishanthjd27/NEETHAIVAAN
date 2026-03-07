// path: client/src/App.tsx
// Root component: sets up AuthProvider and all app routes.
// Protected routes redirect to /login if user is not authenticated.

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage        from './pages/LoginPage';
import RegisterPage     from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import ComplaintsPage   from './pages/ComplaintsPage';
import ComplaintDetail  from './pages/ComplaintDetail';
import SubmitComplaint  from './pages/SubmitComplaint';
import AdminPanel       from './pages/AdminPanel';
import AuditLogsPage    from './pages/AuditLogsPage';
import SettingsPage     from './pages/SettingsPage';

function ProtectedRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
        <Route path="/dashboard"  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/complaints" element={<ProtectedRoute><ComplaintsPage /></ProtectedRoute>} />
        <Route path="/complaints/new" element={<ProtectedRoute><SubmitComplaint /></ProtectedRoute>} />
        <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
        <Route path="/admin"      element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute adminOnly><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/settings"   element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Route>

      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
