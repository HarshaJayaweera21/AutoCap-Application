import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import './AdminLayout.css';

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();



    const isActive = (path: string) => location.pathname === path;
    const startsWith = (prefix: string) => location.pathname.startsWith(prefix);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%' }}>
            <Header />
            <div className="admin-layout-container">
                <aside className="admin-sidebar">


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
