import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();

    const getCookie = (name: string): string | null => {
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? decodeURIComponent(match[2]) : null;
    };

    const deleteCookie = (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
    };

    const handleLogout = async () => {
        const token = getCookie('token');
        try {
            await fetch('http://localhost:8080/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // ignore network errors on logout
        }
        deleteCookie('token');
        deleteCookie('role');
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="admin-sidebar-brand">
                    <h2>AutoCap</h2>
                    <span className="admin-badge">Admin</span>
                </div>

                <nav className="admin-nav">
                    <p className="admin-nav-label">Management</p>

                    <button
                        className={`admin-nav-btn ${isActive('/admin-dashboard') ? 'active' : ''}`}
                        onClick={() => navigate('/admin-dashboard')}
                    >
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </button>

                    <button
                        className={`admin-nav-btn ${location.pathname.startsWith('/admin-dashboard/docs') ? 'active' : ''}`}
                        onClick={() => navigate('/admin-dashboard/docs')}
                    >
                        <span className="nav-icon">📄</span>
                        Documentation
                    </button>

                    <button
                        className={`admin-nav-btn ${location.pathname.startsWith('/admin-dashboard/categories') ? 'active' : ''}`}
                        onClick={() => navigate('/admin-dashboard/categories')}
                    >
                        <span className="nav-icon">📁</span>
                        Categories
                    </button>

                    <button
                        className={`admin-nav-btn ${location.pathname.startsWith('/admin-dashboard/tags') ? 'active' : ''}`}
                        onClick={() => navigate('/admin-dashboard/tags')}
                    >
                        <span className="nav-icon">🏷️</span>
                        Tags
                    </button>
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        Logout
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-header">
                    <h1>{getPageTitle(location.pathname)}</h1>
                </header>

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function getPageTitle(pathname: string): string {
    if (pathname.startsWith('/admin-dashboard/docs')) return 'Manage Documentation';
    if (pathname.startsWith('/admin-dashboard/categories')) return 'Manage Categories';
    if (pathname.startsWith('/admin-dashboard/tags')) return 'Manage Tags';
    return 'Dashboard';
}

export default AdminDashboard;
