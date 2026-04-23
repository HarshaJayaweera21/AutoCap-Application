import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

/* ---------- cookie helpers ---------- */
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

/* ---------- JWT decoder (base64 payload) ---------- */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
};

/* ---------- nav definitions ---------- */
interface NavItem {
    label: string;
    to: string;
    icon: string; // Material Symbols icon name
}

const USER_NAV: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: 'grid_view' },
    { label: 'My Datasets', to: '/my-datasets', icon: 'database' },
    { label: 'Search Datasets', to: '/search-datasets', icon: 'search' },
    { label: 'Documentation', to: '/categories', icon: 'menu_book' },
    { label: 'Feedback', to: '/feedback', icon: 'chat_bubble' },
];

const ADMIN_NAV: NavItem[] = [
    { label: 'Dashboard', to: '/admin-dashboard', icon: 'grid_view' },
    { label: 'Manage Users', to: '/admin/manage-users', icon: 'group' },
    { label: 'Manage Documentation', to: '/admin/docs', icon: 'description' },
    { label: 'Manage Feedbacks', to: '/admin/feedback/dashboard', icon: 'forum' },
];

/* ---------- component ---------- */
function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const role = getCookie('role'); // "ADMIN" | "USER" | null
    const token = getCookie('token');
    const navItems = role === 'ADMIN' ? ADMIN_NAV : USER_NAV;

    // Extract user info from JWT
    const jwtPayload = token ? decodeJwtPayload(token) : null;
    const email = (jwtPayload?.sub as string) || '';
    const username = email.split('@')[0] || '';
    const initials = username
        .split(/[._-]/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() || '')
        .join('') || username.slice(0, 2).toUpperCase();

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

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
        setMenuOpen(false);
        setDropdownOpen(false);
        navigate('/login');
    };

    return (
        <>
            {/* Fixed header bar */}
            <header className="app-header dark">
                {/* Left: Brand + Nav */}
                <div className="hdr-left">
                    <Link to={role === 'ADMIN' ? '/admin-dashboard' : '/dashboard'} className="hdr-brand">
                        AutoCap
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hdr-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`hdr-nav-link ${location.pathname === item.to ? 'active' : ''}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right: Profile */}
                <div className="hdr-right">
                    {/* Profile dropdown (desktop) */}
                    <div className="hdr-dropdown-wrapper" ref={dropdownRef}>
                        <button
                            className="hdr-profile-trigger"
                            data-open={dropdownOpen}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            aria-label="Profile menu"
                        >
                            <div className="hdr-avatar">
                                <span className="hdr-avatar-initials">{initials}</span>
                            </div>
                            <span className="material-symbols-outlined hdr-expand-icon">
                                expand_more
                            </span>
                        </button>

                        {dropdownOpen && (
                            <div className="hdr-dropdown">
                                {/* User info */}
                                <div className="hdr-dropdown-user">
                                    <p className="hdr-dropdown-name">{username}</p>
                                    <p className="hdr-dropdown-email">{email}</p>
                                </div>
                                <hr className="hdr-dropdown-sep" />

                                {/* Reset Password */}
                                <div className="hdr-dropdown-menu">
                                    <Link
                                        to="/forgot-password"
                                        className="hdr-dropdown-item"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        <span className="material-symbols-outlined">lock_reset</span>
                                        Reset Password
                                    </Link>
                                </div>

                                <hr className="hdr-dropdown-sep hdr-dropdown-sep--inset" />

                                {/* Logout */}
                                <div className="hdr-dropdown-logout">
                                    <button
                                        className="hdr-dropdown-logout-btn"
                                        onClick={handleLogout}
                                    >
                                        <span className="material-symbols-outlined">logout</span>
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="hdr-mobile-btn"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </header>

            {/* Spacer */}
            <div className="header-spacer" />

            {/* Mobile overlay */}
            <div
                className={`menu-overlay ${menuOpen ? 'menu-overlay--open' : ''}`}
                onClick={() => setMenuOpen(false)}
            />

            {/* Mobile side menu */}
            <nav className={`side-menu ${menuOpen ? 'side-menu--open' : ''}`}>
                <button
                    className="side-menu__close"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <ul className="side-menu__nav">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <Link
                                to={item.to}
                                className={location.pathname === item.to ? 'active' : ''}
                                onClick={() => setMenuOpen(false)}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="side-menu__footer">
                    <button className="side-menu__logout" onClick={handleLogout}>
                        <span className="material-symbols-outlined">logout</span>
                        Logout
                    </button>
                </div>
            </nav>
        </>
    );
}

export default Header;
