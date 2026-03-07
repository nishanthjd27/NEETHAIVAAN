/*
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "./components/PageLoader"; // a simple full-screen spinner

// ── Lazy-loaded pages (each becomes its own JS chunk) ────────────
const Login            = lazy(() => import("./pages/Login"));
const Register         = lazy(() => import("./pages/Register"));
const Dashboard        = lazy(() => import("./pages/Dashboard"));
const SubmitComplaint  = lazy(() => import("./pages/SubmitComplaint"));
const MyComplaints     = lazy(() => import("./pages/MyComplaints"));
const ComplaintDetail  = lazy(() => import("./pages/ComplaintDetail"));

// Admin pages
const AdminDashboard        = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminComplaints       = lazy(() => import("./pages/admin/AdminComplaints"));
const AdminComplaintDetail  = lazy(() => import("./pages/admin/AdminComplaintDetail"));
const AdminUsers            = lazy(() => import("./pages/admin/AdminUsers"));

// ── Auth guard ────────────────────────────────────────────────────
// Replace with your actual auth hook/store
import { useAuth } from "./hooks/useAuth";

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// ── App component ─────────────────────────────────────────────────
const App: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen */}
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/submit"    element={<PrivateRoute><SubmitComplaint /></PrivateRoute>} />
        <Route path="/complaints" element={<PrivateRoute><MyComplaints /></PrivateRoute>} />
        <Route path="/complaints/:id" element={<PrivateRoute><ComplaintDetail /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin"              element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/complaints"   element={<AdminRoute><AdminComplaints /></AdminRoute>} />
        <Route path="/admin/complaints/:id" element={<AdminRoute><AdminComplaintDetail /></AdminRoute>} />
        <Route path="/admin/users"        element={<AdminRoute><AdminUsers /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;

// ── PageLoader component (create at frontend/src/components/PageLoader.tsx) ──
// import React from "react";
// const PageLoader: React.FC = () => (
//   <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
//                 height:"100dvh", background:"#f5f3ff" }}>
//     <div style={{ width:40, height:40, border:"4px solid #6366f1",
//                   borderTopColor:"transparent", borderRadius:"50%",
//                   animation:"spin 0.7s linear infinite" }} />
//     <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//   </div>
// );
// export default PageLoader;
*/
