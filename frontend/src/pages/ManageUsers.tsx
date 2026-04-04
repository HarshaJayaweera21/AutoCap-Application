import { useEffect, useState } from 'react';
import Header from '../components/Header';
import './ManageUsers.css';

interface UserData {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    isActive: boolean;
    isEmailVerified: boolean;
}

interface PageResponse {
    content: UserData[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
}

interface AdminStats {
    adminFirstName: string;
    adminLastName: string;
    totalUsers: number;
    activeUsers: number;
    deactiveUsers: number;
}

/* ---------- cookie helper ---------- */
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

/* ---------- Initials Helper ---------- */
const getInitials = (first: string, last: string, username: string) => {
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (username) return username.slice(0, 2).toUpperCase();
    return 'U';
};

function ManageUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState<PageResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // User stats
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Filter/Search states (visual only to adhere to 'do not change logic' instruction)
    const [searchQuery, setSearchQuery] = useState('');
    const [filterVal, setFilterVal] = useState('All Users');

    // Edit modal state
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [saving, setSaving] = useState(false);

    // Confirm toggle modal state
    const [confirmUser, setConfirmUser] = useState<UserData | null>(null);
    const [toggling, setToggling] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'info' = 'success') => {
        setToast({ message, type });
    };

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    const getToken = () => getCookie('token');

    const fetchUsers = async (pageNum: number) => {
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/admin/users?page=${pageNum}&size=10`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data: PageResponse = await res.json();
                setUsers(data.content);
                setPageInfo(data);
            }
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        const token = getToken();
        if (!token) { setStatsLoading(false); return; }
        try {
            const res = await fetch('http://localhost:8080/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setStats(await res.json());
        } catch {
            // silently ignore
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchUsers(page);
    }, [page]);

    /* ---------- Edit ---------- */
    const openEdit = (user: UserData) => {
        setEditUser(user);
        setEditFirstName(user.firstName);
        setEditLastName(user.lastName);
    };

    const closeEdit = () => {
        setEditUser(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser) return;
        const token = getToken();
        if (!token) return;
        setSaving(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/admin/users/${editUser.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        firstName: editFirstName,
                        lastName: editLastName,
                    }),
                }
            );
            if (res.ok) {
                await fetchUsers(page);
                closeEdit();
                showToast('User info updated successfully.');
            }
        } catch {
            // silently ignore
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Toggle Active with Confirmation ---------- */
    const openConfirm = (user: UserData) => {
        setConfirmUser(user);
    };

    const closeConfirm = () => {
        setConfirmUser(null);
    };

    const handleConfirmToggle = async () => {
        if (!confirmUser) return;
        const token = getToken();
        if (!token) return;
        setToggling(true);
        try {
            const res = await fetch(
                `http://localhost:8080/api/admin/users/${confirmUser.id}/toggle-active`,
                {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok) {
                await fetchUsers(page);
                await fetchStats();
                const action = confirmUser.isActive ? 'deactivated' : 'activated';
                showToast(`User ${confirmUser.firstName} ${confirmUser.lastName} has been ${action}.`);
                closeConfirm();
            }
        } catch {
            // silently ignore
        } finally {
            setToggling(false);
        }
    };

    // Calculate pagination pages array (basic max ~5 buttons logic)
    const generatePageNumbers = () => {
        if (!pageInfo) return [];
        const total = pageInfo.totalPages;
        const cur = pageInfo.number;
        
        let start = Math.max(0, cur - 2);
        let end = Math.min(total - 1, cur + 2);
        
        if (cur <= 2) end = Math.min(4, total - 1);
        if (cur >= total - 3) start = Math.max(0, total - 5);
        
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="mu-page">
            <Header />

            {/* Global toast fallback - preserving from original logic */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '5.5rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9999, padding: '0.75rem 1.5rem', borderRadius: '0.5rem',
                    background: toast.type === 'success' ? '#211e27' : '#1d1a23',
                    border: '1px solid', borderColor: toast.type === 'success' ? '#7bdc6c' : '#194bff',
                    color: toast.type === 'success' ? '#7bdc6c' : '#b9c3ff', display: 'flex', alignItems: 'center', gap: '8px', 
                    fontFamily: "'Outfit', sans-serif", fontSize: "0.875rem", boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <span className="material-symbols-outlined">{toast.type === 'success' ? 'check_circle' : 'info'}</span>
                    {toast.message}
                </div>
            )}

            <main className="mu-container">
                {/* Header section */}
                <div className="mu-header">
                    <h1 className="mu-title">User Management</h1>
                    <p className="mu-subtitle">Overview and management of the AutoCap platform user database.</p>
                </div>

                {/* Stats Grid */}
                <div className="mu-stats-grid">
                    <div className="mu-stat-card">
                        <div className="mu-stat-icon-wrap">
                            <span className="material-symbols-outlined mu-stat-icon total">group</span>
                        </div>
                        <div className="mu-stat-value">{statsLoading ? '—' : stats?.totalUsers ?? 0}</div>
                        <div className="mu-stat-label">Total Platform Users</div>
                    </div>
                    <div className="mu-stat-card">
                        <div className="mu-stat-icon-wrap">
                            <span className="material-symbols-outlined mu-stat-icon active">how_to_reg</span>
                        </div>
                        <div className="mu-stat-value">{statsLoading ? '—' : stats?.activeUsers ?? 0}</div>
                        <div className="mu-stat-label">Active Users</div>
                    </div>
                    <div className="mu-stat-card">
                        <div className="mu-stat-icon-wrap">
                            <span className="material-symbols-outlined mu-stat-icon inactive">person_off</span>
                        </div>
                        <div className="mu-stat-value">{statsLoading ? '—' : stats?.deactiveUsers ?? 0}</div>
                        <div className="mu-stat-label">Deactive Users</div>
                    </div>
                </div>

                {/* Table Controls */}
                <div className="mu-controls">
                    <div className="mu-search">
                        <span className="material-symbols-outlined mu-search-icon">search</span>
                        <input 
                            type="text" 
                            className="mu-search-input" 
                            placeholder="Search users..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <select 
                            className="mu-filter"
                            value={filterVal}
                            onChange={(e) => setFilterVal(e.target.value)}
                        >
                            <option>All Users</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </div>
                </div>

                {/* User Table */}
                <div className="mu-table-container">
                    <div className="mu-table-scroll">
                        <table className="mu-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>First Name</th>
                                    <th>Last Name</th>
                                    <th>Email</th>
                                    <th>DOB</th>
                                    <th>Active</th>
                                    <th>Verified</th>
                                    <th style={{textAlign: 'center'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={9} style={{textAlign: 'center', color: '#8e8fa3'}}>Loading users...</td>
                                    </tr>
                                ) : (() => {
                                    const filteredUsers = users.filter(user => {
                                        // 1. Dropdown Filter
                                        if (filterVal === 'Active' && !user.isActive) return false;
                                        if (filterVal === 'Inactive' && user.isActive) return false;

                                        // 2. Search Text
                                        if (searchQuery.trim() !== '') {
                                            const query = searchQuery.toLowerCase();
                                            const matches = 
                                                user.username.toLowerCase().includes(query) ||
                                                user.firstName.toLowerCase().includes(query) ||
                                                user.lastName.toLowerCase().includes(query) ||
                                                user.email.toLowerCase().includes(query);
                                            if (!matches) return false;
                                        }

                                        return true;
                                    });

                                    if (filteredUsers.length === 0) {
                                        if (users.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={9} style={{textAlign: 'center', color: '#8e8fa3'}}>No users found.</td>
                                                </tr>
                                            );
                                        }
                                        return (
                                            <tr>
                                                <td colSpan={9} style={{textAlign: 'center', color: '#8e8fa3'}}>No users match your search or filter.</td>
                                            </tr>
                                        );
                                    }

                                    return filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="mu-cell-id">#AC-{user.id.toString().padStart(4, '0')}</td>
                                            <td>
                                                <div className="mu-cell-user">
                                                    <div className="mu-avatar-sm">
                                                        {getInitials(user.firstName, user.lastName, user.username)}
                                                    </div>
                                                    <span className="mu-username">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="mu-cell-text">{user.firstName}</td>
                                            <td className="mu-cell-text">{user.lastName}</td>
                                            <td className="mu-cell-text">{user.email}</td>
                                            <td className="mu-cell-muted">{user.dateOfBirth}</td>
                                            <td>
                                                {user.isActive 
                                                    ? <span className="mu-chip yes">Yes</span>
                                                    : <span className="mu-chip no">No</span>}
                                            </td>
                                            <td>
                                                {user.isEmailVerified 
                                                    ? <span className="mu-chip yes">Yes</span>
                                                    : <span className="mu-chip no">No</span>}
                                            </td>
                                            <td>
                                                <div className="mu-actions">
                                                    <button className="mu-btn-icon" onClick={() => openEdit(user)} title="Edit">
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button 
                                                        className={`mu-btn-icon ${user.isActive ? 'danger' : ''}`} 
                                                        onClick={() => openConfirm(user)}
                                                        title={user.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <span className="material-symbols-outlined">
                                                            {user.isActive ? 'block' : 'check_circle'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pageInfo && pageInfo.totalPages > 0 && (
                        <div className="mu-pagination">
                            <div className="mu-pagination-info">
                                Showing <strong>{(pageInfo.number * pageInfo.size) + 1} - {Math.min((pageInfo.number + 1) * pageInfo.size, pageInfo.totalElements)}</strong> of <strong>{pageInfo.totalElements}</strong> users
                            </div>
                            <div className="mu-pagination-controls">
                                <button 
                                    className="mu-page-btn" 
                                    disabled={pageInfo.first} 
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                
                                {pageInfo.number > 2 && (
                                    <>
                                        <button className="mu-page-btn" onClick={() => setPage(0)}>1</button>
                                        <span className="mu-page-dots">...</span>
                                    </>
                                )}

                                {generatePageNumbers().map(pOffset => (
                                    <button 
                                        key={pOffset} 
                                        className={`mu-page-btn ${pOffset === pageInfo.number ? 'active' : ''}`}
                                        onClick={() => setPage(pOffset)}
                                    >
                                        {pOffset + 1}
                                    </button>
                                ))}

                                {pageInfo.number < pageInfo.totalPages - 3 && (
                                    <>
                                        <span className="mu-page-dots">...</span>
                                        <button className="mu-page-btn" onClick={() => setPage(pageInfo.totalPages - 1)}>{pageInfo.totalPages}</button>
                                    </>
                                )}

                                <button 
                                    className="mu-page-btn" 
                                    disabled={pageInfo.last} 
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </main>

            {/* ===== Edit Modal ===== */}
            {editUser && (
                <div className="mu-modal-overlay">
                    <div className="mu-modal-backdrop" onClick={closeEdit}></div>
                    <div className="mu-modal-content mu-modal-edit">
                        <div className="mu-modal-header">
                            <div>
                                <h2>Edit User Details</h2>
                                <p>Update user identification and profile preferences.</p>
                            </div>
                            <button className="mu-modal-close" onClick={closeEdit}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="mu-modal-body">
                            <form className="mu-grid-form" onSubmit={handleSave}>
                                {/* Readonly: ID */}
                                <div className="mu-field">
                                    <label className="mu-label readonly">User ID</label>
                                    <div className="mu-readonly-val">#AC-{editUser.id.toString().padStart(4, '0')}</div>
                                </div>
                                {/* Readonly: Username */}
                                <div className="mu-field">
                                    <label className="mu-label readonly">Username</label>
                                    <div className="mu-readonly-val">{editUser.username}</div>
                                </div>
                                
                                {/* Editable: First Name */}
                                <div className="mu-field">
                                    <label className="mu-label editable">First Name</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        className="mu-edit-input" 
                                        value={editFirstName}
                                        onChange={(e) => setEditFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Editable: Last Name */}
                                <div className="mu-field">
                                    <label className="mu-label editable">Last Name</label>
                                    <input 
                                        type="text" 
                                        className="mu-edit-input" 
                                        value={editLastName}
                                        onChange={(e) => setEditLastName(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Readonly: Email */}
                                <div className="mu-field">
                                    <label className="mu-label readonly">Email Address</label>
                                    <div className="mu-readonly-val">{editUser.email}</div>
                                </div>
                                {/* Readonly: DOB */}
                                <div className="mu-field">
                                    <label className="mu-label readonly">Date of Birth</label>
                                    <div className="mu-readonly-val">{editUser.dateOfBirth}</div>
                                </div>

                                {/* Readonly: Active Status */}
                                <div className="mu-field">
                                    <label className="mu-label readonly">Active Status</label>
                                    <div className="mu-readonly-val mu-readonly-flex">
                                        <span className={`mu-status-dot ${editUser.isActive ? 'active' : 'inactive'}`}></span>
                                        <span>{editUser.isActive ? 'Account Active' : 'Account Disabled'}</span>
                                    </div>
                                </div>
                                {/* Readonly: Verified */}
                                <div className="mu-field">
                                    <label className="mu-label readonly">Verification</label>
                                    <div className="mu-readonly-val mu-readonly-flex">
                                        <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', color: editUser.isEmailVerified ? 'var(--mu-secondary-fixed)' : 'var(--mu-error)' }}>
                                            {editUser.isEmailVerified ? 'verified' : 'cancel'}
                                        </span>
                                        <span>{editUser.isEmailVerified ? 'Verified Entity' : 'Unverified User'}</span>
                                    </div>
                                </div>

                                <button type="submit" style={{display:'none'}}>Save Hidden</button>
                            </form>
                        </div>
                        <div className="mu-modal-footer">
                            <button className="mu-btn-cancel" onClick={closeEdit}>Cancel</button>
                            <button className="mu-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Confirm Deactivate/Activate Modal ===== */}
            {confirmUser && (
                <div className="mu-modal-overlay">
                    <div className="mu-modal-backdrop" onClick={closeConfirm}></div>
                    <div className="mu-modal-content mu-modal-confirm">
                        <div className="mu-confirm-body">
                            <div className={`mu-confirm-icon-wrap ${confirmUser.isActive ? 'danger' : 'safe'}`}>
                                <span className="material-symbols-outlined">
                                    {confirmUser.isActive ? 'warning' : 'check_circle'}
                                </span>
                            </div>
                            
                            <h2 className="mu-confirm-title">
                                Confirm {confirmUser.isActive ? 'Deactivation' : 'Activation'}
                            </h2>
                            
                            <p className="mu-confirm-desc">
                                Are you sure you want to {confirmUser.isActive ? 'deactivate' : 'activate'} user <strong>{confirmUser.username}</strong>? 
                                {confirmUser.isActive 
                                    ? " The user will lose immediate access to all systems."
                                    : " The user will regain normal access to the platform."}
                            </p>

                            <div className="mu-confirm-actions">
                                <button 
                                    className={`mu-btn-confirm ${confirmUser.isActive ? 'danger' : 'safe'}`}
                                    onClick={handleConfirmToggle}
                                    disabled={toggling}
                                >
                                    {toggling 
                                        ? 'Processing...' 
                                        : confirmUser.isActive 
                                            ? 'Confirm Deactivation' 
                                            : 'Confirm Activation'}
                                </button>
                                <button className="mu-btn-confirm-cancel" onClick={closeConfirm}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                        <div className={`mu-confirm-bar ${confirmUser.isActive ? 'danger' : 'safe'}`}></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageUsers;
