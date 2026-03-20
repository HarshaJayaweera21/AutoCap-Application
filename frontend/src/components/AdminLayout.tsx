import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
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
    const startsWith = (prefix: string) => location.pathname.startsWith(prefix);

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
                        className={`admin-nav-btn ${isActive('/admin') ? 'active' : ''}`}
                        onClick={() => navigate('/admin')}
                    >
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/docs') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/docs')}
                    >
                        <span className="nav-icon">📄</span>
                        Documentation
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/categories') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/categories')}
                    >
                        <span className="nav-icon">📁</span>
                        Categories
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/tags') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/tags')}
                    >
                        <span className="nav-icon">🏷️</span>
                        Tags
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/tokenizers') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/tokenizers')}
                    >
                        <span className="nav-icon">🔤</span>
                        Tokenizers
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
    if (pathname.startsWith('/admin/docs')) return 'Manage Documentation';
    if (pathname.startsWith('/admin/categories')) return 'Manage Categories';
    if (pathname.startsWith('/admin/tags')) return 'Manage Tags';
    if (pathname.startsWith('/admin/tokenizers')) return 'Manage Tokenizers';
    return 'Dashboard';
}

export default AdminLayout;
