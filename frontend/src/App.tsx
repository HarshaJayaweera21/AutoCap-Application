import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import { Dashboard } from './pages/Dashboard/Dashboard';
import ManageUsers from './pages/ManageUsers';
import AccessDenied from './pages/AccessDenied';
import ProtectedRoute from './components/ProtectedRoute';
import DocumentationPage from './pages/DocumentationPage';
import AdminLayout from './components/AdminLayout';
import ManageDocs from './pages/ManageDocs';
import ManageCategories from './pages/ManageCategories';
import ManageTags from './pages/ManageTags';
import ManageTokenizers from './pages/ManageTokenizers';
import SearchDatasets from './pages/SearchDatasets';
import DatasetExplorer from './pages/DatasetExplorer/DatasetExplorer';
import MyDatasets from './pages/MyDatasets/MyDatasets';

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

            {/* Public documentation routes */}
            <Route path="/categories" element={<DocumentationPage />} />
            <Route path="/categories/:id" element={<DocumentationPage />} />

            {/* Admin-only routes */}
            <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/manage-users" element={<ProtectedRoute requiredRole="ADMIN"><ManageUsers /></ProtectedRoute>} />

            {/* Admin layout routes for documentation management */}
            <Route path="/admin" element={<AdminLayout />}>
                <Route path="docs" element={<ManageDocs />} />
                <Route path="categories" element={<ManageCategories />} />
                <Route path="tags" element={<ManageTags />} />
                <Route path="tokenizers" element={<ManageTokenizers />} />
            </Route>

            {/* Normal user routes */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="USER"><Dashboard /></ProtectedRoute>} />
            <Route path="/search-datasets" element={<ProtectedRoute requiredRole="USER"><SearchDatasets /></ProtectedRoute>} />
            <Route path="/my-datasets" element={<ProtectedRoute requiredRole="USER"><MyDatasets /></ProtectedRoute>} />
            <Route path="/datasets/:id" element={<ProtectedRoute requiredRole="USER"><DatasetExplorer /></ProtectedRoute>} />

            {/* Redirect root to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;