import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DocumentationPage from './pages/DocumentationPage';
import AdminLayout from './components/AdminLayout';
import AdminWelcome from './pages/AdminWelcome';
import ManageDocs from './pages/ManageDocs';
import ManageCategories from './pages/ManageCategories';
import ManageTags from './pages/ManageTags';
import ManageTokenizers from './pages/ManageTokenizers';

function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public documentation routes */}
      <Route path="/categories" element={<DocumentationPage />} />
      <Route path="/categories/:id" element={<DocumentationPage />} />

      {/* Admin routes — separate layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminWelcome />} />
        <Route path="docs" element={<ManageDocs />} />
        <Route path="categories" element={<ManageCategories />} />
        <Route path="tags" element={<ManageTags />} />
        <Route path="tokenizers" element={<ManageTokenizers />} />
      </Route>

      {/* Redirect root to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
