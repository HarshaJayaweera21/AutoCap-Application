import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    HiOutlineMenu,
    HiOutlineX,
    HiOutlineLogout,
} from 'react-icons/hi';
import {
    HiOutlineSquares2X2,
    HiOutlineCircleStack,
    HiOutlineMagnifyingGlass,
    HiOutlineBookOpen,
    HiOutlineChatBubbleLeftEllipsis,
    HiOutlineUserGroup,
    HiOutlineDocumentText,
    HiOutlineChatBubbleBottomCenterText,
} from 'react-icons/hi2';
import './Header.css';

/* ---------- cookie helpers ---------- */
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

const deleteCookie = (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
};

/* ---------- nav definitions ---------- */
interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
}

const USER_NAV: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: <HiOutlineSquares2X2 className="nav-icon" /> },
    { label: 'My Datasets', to: '/my-datasets', icon: <HiOutlineCircleStack className="nav-icon" /> },
    { label: 'Search Datasets', to: '/search-datasets', icon: <HiOutlineMagnifyingGlass className="nav-icon" /> },
    { label: 'Documentation', to: '/categories', icon: <HiOutlineBookOpen className="nav-icon" /> },
    { label: 'Feedback', to: '/feedback', icon: <HiOutlineChatBubbleLeftEllipsis className="nav-icon" /> },
];

const ADMIN_NAV: NavItem[] = [
    { label: 'Dashboard', to: '/admin-dashboard', icon: <HiOutlineSquares2X2 className="nav-icon" /> },
    { label: 'Manage Users', to: '/admin/manage-users', icon: <HiOutlineUserGroup className="nav-icon" /> },
    { label: 'Manage Documentation', to: '/admin/docs', icon: <HiOutlineDocumentText className="nav-icon" /> },
    { label: 'Manage Feedbacks', to: '/admin/manage-feedbacks', icon: <HiOutlineChatBubbleBottomCenterText className="nav-icon" /> },
];

/* ---------- component ---------- */
function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const role = getCookie('role'); // "ADMIN" | "USER" | null
    const navItems = role === 'ADMIN' ? ADMIN_NAV : USER_NAV;

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
        navigate('/login');
    };

    return (
        <>
            {/* Fixed header bar */}
            <header className="app-header">
                <span className="app-header__brand">AutoCap</span>

                <button
                    className="app-header__hamburger"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Open menu"
                >
                    <HiOutlineMenu />
                </button>
            </header>

            {/* Spacer so page content isn't hidden behind the fixed header */}
            <div className="header-spacer" />

            {/* Overlay */}
            <div
                className={`menu-overlay ${menuOpen ? 'menu-overlay--open' : ''}`}
                onClick={() => setMenuOpen(false)}
            />

            {/* Side menu */}
            <nav className={`side-menu ${menuOpen ? 'side-menu--open' : ''}`}>
                <button
                    className="side-menu__close"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                >
                    <HiOutlineX />
                </button>

                <ul className="side-menu__nav">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <Link
                                to={item.to}
                                className={location.pathname === item.to ? 'active' : ''}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="side-menu__footer">
                    <button className="side-menu__logout" onClick={handleLogout}>
                        <HiOutlineLogout />
                        Logout
                    </button>
                </div>
            </nav>
        </>
    );
}

export default Header;
