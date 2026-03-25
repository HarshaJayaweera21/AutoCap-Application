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

// Feedback module imports
import FeedbackForm from './components/feedback/FeedbackForm';
import FeedbackList from './components/feedback/FeedbackList';
import FeedbackDetail from './components/feedback/FeedbackDetail';
import FeedbackStats from './components/feedback/FeedbackStats';
import AdminFeedbackDashboard from './components/feedback/AdminFeedbackDashboard';

// Wrapper for feedback detail route (needs URL params)
import { useParams } from 'react-router-dom';

function FeedbackDetailWrapper() {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Invalid ID</div>;
    return <FeedbackDetail id={parseInt(id, 10)} onBack={() => window.history.back()} />;
}

function FeedbackEditWrapper() {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Invalid ID</div>;
    return <FeedbackForm feedbackId={parseInt(id, 10)} onSuccess={() => window.history.back()} onCancel={() => window.history.back()} />;
}

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

            {/* Admin feedback management routes */}
            <Route path="/admin/feedback" element={<ProtectedRoute requiredRole="ADMIN"><FeedbackList onNewFeedbackClick={() => {}} onEditFeedbackClick={() => {}} onDeleteFeedbackClick={() => {}} /></ProtectedRoute>} />
            <Route path="/admin/feedback/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminFeedbackDashboard /></ProtectedRoute>} />
            <Route path="/admin/feedback/stats" element={<ProtectedRoute requiredRole="ADMIN"><FeedbackStats /></ProtectedRoute>} />
            <Route path="/admin/feedback/edit/:id" element={<ProtectedRoute requiredRole="ADMIN"><FeedbackEditWrapper /></ProtectedRoute>} />
            <Route path="/admin/feedback/:id" element={<ProtectedRoute requiredRole="ADMIN"><FeedbackDetailWrapper /></ProtectedRoute>} />

            {/* Normal user routes */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="USER"><Dashboard /></ProtectedRoute>} />
            <Route path="/search-datasets" element={<ProtectedRoute requiredRole="USER"><SearchDatasets /></ProtectedRoute>} />
            <Route path="/my-datasets" element={<ProtectedRoute requiredRole="USER"><MyDatasets /></ProtectedRoute>} />
            <Route path="/datasets/:id" element={<ProtectedRoute requiredRole="USER"><DatasetExplorer /></ProtectedRoute>} />

            {/* User feedback routes */}
            <Route path="/feedback" element={<ProtectedRoute requiredRole="USER"><FeedbackForm /></ProtectedRoute>} />
            <Route path="/feedback/list" element={<ProtectedRoute requiredRole="USER"><FeedbackList /></ProtectedRoute>} />
            <Route path="/feedback/:id" element={<ProtectedRoute requiredRole="USER"><FeedbackDetailWrapper /></ProtectedRoute>} />

            {/* Redirect root to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default App;