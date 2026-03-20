import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccessDenied from './pages/AccessDenied';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Admin-only routes */}
      <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/manage-users" element={<ProtectedRoute requiredRole="ADMIN"><ManageUsers /></ProtectedRoute>} />

      {/* Normal user routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="USER"><Dashboard /></ProtectedRoute>} />

      {/* Redirect root to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
