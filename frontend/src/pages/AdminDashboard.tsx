import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
    const navigate = useNavigate();

    // Helper to get a cookie value
    const getCookie = (name: string): string | null => {
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? decodeURIComponent(match[2]) : null;
    };

    // Helper to delete a cookie
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

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <main className="admin-content">
                <p>Welcome, Admin! This page is under development.</p>
            </main>
        </div>
    );
}

export default AdminDashboard;
