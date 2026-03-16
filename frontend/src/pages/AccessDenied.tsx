import { useNavigate } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi2';
import './AccessDenied.css';

function AccessDenied() {
    const navigate = useNavigate();

    const handleLogin = () => {
        // Clear cookies before redirecting
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        navigate('/login');
    };

    return (
        <div className="access-denied-container">
            <div className="access-denied-card">
                <div className="access-denied-icon-wrapper">
                    <HiOutlineLockClosed className="access-denied-icon" />
                </div>
                <h1 className="access-denied-title">Access Blocked</h1>
                <p className="access-denied-message">
                    You don't have permission to view this page. Please log in with an
                    authorized account to continue.
                </p>
                <button className="access-denied-btn" onClick={handleLogin}>
                    Go to Login
                </button>
            </div>
        </div>
    );
}

export default AccessDenied;
