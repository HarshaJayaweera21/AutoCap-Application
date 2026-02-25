import { useEffect, useState } from 'react';
import Header from '../components/Header';
import {
    HiOutlinePencilSquare,
    HiOutlineNoSymbol,
    HiOutlineCheckCircle,
    HiOutlineXMark,
} from 'react-icons/hi2';
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

/* ---------- cookie helper ---------- */
const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
};

function ManageUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [page, setPage] = useState(0);
    const [pageInfo, setPageInfo] = useState<PageResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit modal state
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [saving, setSaving] = useState(false);

    const token = getCookie('token');

    const fetchUsers = async (pageNum: number) => {
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

    const handleSave = async () => {
        if (!editUser) return;
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
            }
        } catch {
            // silently ignore
        } finally {
            setSaving(false);
        }
    };

    /* ---------- Toggle Active ---------- */
    const handleToggleActive = async (userId: number) => {
        try {
            const res = await fetch(
                `http://localhost:8080/api/admin/users/${userId}/toggle-active`,
                {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok) {
                await fetchUsers(page);
            }
        } catch {
            // silently ignore
        }
    };

    return (
        <div className="manage-users-container">
            <Header />

            <div className="manage-users-content">
                <h2 className="manage-users-title">Manage Users</h2>

                {loading ? (
                    <div className="manage-users-loading">Loading...</div>
                ) : (
                    <>
                        <div className="table-wrapper">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th>DOB</th>
                                        <th>Active</th>
                                        <th>Email Verified</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="no-data">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id}>
                                                <td>{user.id}</td>
                                                <td>{user.username}</td>
                                                <td>{user.email}</td>
                                                <td>{user.firstName}</td>
                                                <td>{user.lastName}</td>
                                                <td>{user.dateOfBirth}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${user.isActive ? 'badge--active' : 'badge--inactive'}`}
                                                    >
                                                        {user.isActive ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${user.isEmailVerified ? 'badge--active' : 'badge--inactive'}`}
                                                    >
                                                        {user.isEmailVerified ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="action-btn action-btn--edit"
                                                        onClick={() => openEdit(user)}
                                                        title="Edit"
                                                    >
                                                        <HiOutlinePencilSquare />
                                                    </button>
                                                    <button
                                                        className={`action-btn ${user.isActive ? 'action-btn--deactivate' : 'action-btn--activate'}`}
                                                        onClick={() => handleToggleActive(user.id)}
                                                        title={user.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {user.isActive ? (
                                                            <HiOutlineNoSymbol />
                                                        ) : (
                                                            <HiOutlineCheckCircle />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pageInfo && pageInfo.totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="pagination__btn"
                                    disabled={pageInfo.first}
                                    onClick={() => setPage((p) => p - 1)}
                                >
                                    ← Previous
                                </button>
                                <span className="pagination__info">
                                    Page {pageInfo.number + 1} of {pageInfo.totalPages}
                                </span>
                                <button
                                    className="pagination__btn"
                                    disabled={pageInfo.last}
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== Edit Modal ===== */}
            {editUser && (
                <>
                    <div className="modal-overlay" onClick={closeEdit} />
                    <div className="modal">
                        <div className="modal__header">
                            <h3>Edit User</h3>
                            <button className="modal__close" onClick={closeEdit}>
                                <HiOutlineXMark />
                            </button>
                        </div>

                        <div className="modal__body">
                            <div className="modal-field">
                                <label>User ID</label>
                                <span>{editUser.id}</span>
                            </div>
                            <div className="modal-field">
                                <label>Username</label>
                                <span>{editUser.username}</span>
                            </div>
                            <div className="modal-field">
                                <label>Email</label>
                                <span>{editUser.email}</span>
                            </div>
                            <div className="modal-field">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    value={editFirstName}
                                    onChange={(e) => setEditFirstName(e.target.value)}
                                />
                            </div>
                            <div className="modal-field">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    value={editLastName}
                                    onChange={(e) => setEditLastName(e.target.value)}
                                />
                            </div>
                            <div className="modal-field">
                                <label>Date of Birth</label>
                                <span>{editUser.dateOfBirth}</span>
                            </div>
                            <div className="modal-field">
                                <label>Active</label>
                                <span
                                    className={`badge ${editUser.isActive ? 'badge--active' : 'badge--inactive'}`}
                                >
                                    {editUser.isActive ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="modal-field">
                                <label>Email Verified</label>
                                <span
                                    className={`badge ${editUser.isEmailVerified ? 'badge--active' : 'badge--inactive'}`}
                                >
                                    {editUser.isEmailVerified ? 'Yes' : 'No'}
                                </span>
                            </div>
                        </div>

                        <div className="modal__footer">
                            <button
                                className="modal__btn modal__btn--cancel"
                                onClick={closeEdit}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal__btn modal__btn--save"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ManageUsers;
