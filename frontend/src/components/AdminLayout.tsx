import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Header from './Header';
import './AdminLayout.css';
import '../pages/ManageDocs.css';

function AdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();



    const isActive = (path: string) => location.pathname === path;
    const startsWith = (prefix: string) => location.pathname.startsWith(prefix);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', backgroundColor: '#14121a' }}>
            <Header />
            
            <div style={{ padding: '3rem 3rem 1.5rem 3rem' }}>
                <div className="mdo-title-area">
                    <h1 className="mdo-title">Documentation Management</h1>
                    <p className="mdo-subtitle">Overview and management of the AutoCap platform documentation.</p>
                </div>
            </div>

            <div className="admin-layout-container" style={{ padding: '0 3rem 3rem 3rem', gap: '2rem' }}>
                <aside className="admin-sidebar" style={{ 
                    borderRadius: '0.75rem', 
                    overflow: 'hidden', 
                    borderRight: '1px solid rgba(67, 70, 86, 0.1)',
                    width: '260px',
                    minWidth: '260px'
                }}>


                <nav className="admin-nav">
                    <button
                        className={`admin-nav-btn ${startsWith('/admin/docs') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/docs')}
                    >
                        Documentation
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/categories') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/categories')}
                    >
                        Categories
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/tags') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/tags')}
                    >
                        Tags
                    </button>

                    <button
                        className={`admin-nav-btn ${startsWith('/admin/tokenizers') ? 'active' : ''}`}
                        onClick={() => navigate('/admin/tokenizers')}
                    >
                        Tokenizers
                    </button>
                </nav>


            </aside>

            <div className="admin-main">
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
