import { useEffect, useState } from 'react';
import { getCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../services/api';
import type { Category } from '../types';
import './ManageDocs.css';

function ManageCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingCat, setEditingCat] = useState<Category | null>(null);
    const [formName, setFormName] = useState('');
    const [formOrder, setFormOrder] = useState<number>(0);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
            setError('');
        } catch {
            setError('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditingCat(null);
        setFormName('');
        setFormOrder(0);
        setShowForm(true);
        setError('');
        setFormError('');
    };

    const openEdit = (cat: Category) => {
        setEditingCat(cat);
        setFormName(cat.name);
        setFormOrder(cat.orderIndex);
        setShowForm(true);
        setError('');
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setError('');

        // Validate name length
        if (formName.trim().length === 0) {
            setFormError('Category name is required.');
            return;
        }
        if (formName.length > 100) {
            setFormError('Category name cannot exceed 100 characters.');
            return;
        }

        // Validate order range (0-99)
        if (formOrder < 0 || formOrder >= 100) {
            setFormError('Order must be between 0 and 99.');
            return;
        }

        // Check for duplicate order index
        const duplicateOrder = categories.find(
            c => c.orderIndex === formOrder && (!editingCat || c.id !== editingCat.id)
        );
        if (duplicateOrder) {
            setFormError(`Order ${formOrder} is already used by category "${duplicateOrder.name}". Please choose a different order.`);
            return;
        }

        setSaving(true);
        try {
            if (editingCat) {
                await adminUpdateCategory(editingCat.id, { name: formName, orderIndex: formOrder });
            } else {
                await adminCreateCategory({ name: formName, orderIndex: formOrder });
            }
            setShowForm(false);
            setEditingCat(null);
            fetchData();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const resp = (err as { response: { data?: { message?: string } } }).response;
                setError(resp?.data?.message || 'Failed to save category');
            } else {
                setError('Failed to save category');
            }
        } finally {
            setSaving(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

    const openDeleteModal = (cat: Category) => setDeleteTarget({id: cat.id, name: cat.name});
    const closeDeleteModal = () => setDeleteTarget(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminDeleteCategory(deleteTarget.id);
            setCategories(categories.filter(c => c.id !== deleteTarget.id));
            closeDeleteModal();
        } catch {
            setError('Failed to delete category. It may still have documents assigned.');
            closeDeleteModal();
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="mdo-page">
            {error && <div style={errorStyle}>{error}</div>}

            <div className="mdo-header" style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button onClick={openCreate} className="mdo-primary-btn">
                    <span className="material-symbols-outlined">add</span> Create New
                </button>
            </div>

            {/* Inline form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={formStyle}>
                    <h3 style={{ margin: 0, color: '#e0e0ff', fontSize: '1rem' }}>
                        {editingCat ? 'Edit Category' : 'Create Category'}
                    </h3>
                    {formError && <div style={formErrorStyle}>{formError}</div>}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Name * <span style={charCountStyle}>({formName.length}/100)</span></label>
                            <input
                                style={{
                                    ...inputStyle,
                                    ...(formName.length > 100 ? { borderColor: '#ff6b6b' } : {}),
                                }}
                                value={formName}
                                onChange={e => { setFormName(e.target.value); setFormError(''); }}
                                placeholder="Category name"
                                maxLength={100}
                                required
                            />
                        </div>
                        <div style={{ width: '100px' }}>
                            <label style={labelStyle}>Order</label>
                            <input
                                style={{
                                    ...inputStyle,
                                    ...(formOrder < 0 || formOrder >= 100 ? { borderColor: '#ff6b6b' } : {}),
                                }}
                                type="number"
                                min={0}
                                max={99}
                                value={formOrder}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    setFormOrder(isNaN(val) ? 0 : val);
                                    setFormError('');
                                }}
                            />
                        </div>
                        <button type="submit" disabled={saving} style={submitBtnStyle}>
                            {saving ? '...' : editingCat ? 'Update' : 'Create'}
                        </button>
                        <button type="button" onClick={() => setShowForm(false)} style={cancelBtnStyle}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="mdo-table-container">
                <div className="mdo-table-scroll">
                    <table className="mdo-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Order</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id}>
                                    <td className="mdo-cell-title">{cat.name}</td>
                                    <td>{cat.orderIndex}</td>
                                    <td>
                                        <div className="mdo-actions">
                                            <button className="mdo-btn-icon" onClick={() => openEdit(cat)} title="Edit">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button className="mdo-btn-icon danger" onClick={() => openDeleteModal(cat)} title="Delete">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center', color: '#8e8fa3', padding: '2rem' }}>
                                        No categories found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {deleteTarget && (
                <div className="mdo-modal-overlay">
                    <div className="mdo-modal-backdrop" onClick={closeDeleteModal}></div>
                    <div className="mdo-modal-content mdo-modal-confirm">
                        <div className="mdo-confirm-bar"></div>
                        <div className="mdo-confirm-body">
                            <div className="mdo-confirm-icon-wrap">
                                <span className="material-symbols-outlined">delete_forever</span>
                            </div>
                            <h2 className="mdo-confirm-title">Delete Category?</h2>
                            <p className="mdo-confirm-desc">
                                Are you sure you want to delete the category "{deleteTarget.name}"? Documents in this category may be affected.
                            </p>
                            <div className="mdo-confirm-actions">
                                <button className="mdo-btn-confirm" onClick={confirmDelete}>
                                    Yes, delete category
                                </button>
                                <button className="mdo-btn-confirm-cancel" onClick={closeDeleteModal}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Styles ====================

const errorStyle: React.CSSProperties = {
    background: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.3)',
    color: '#ff6b6b',
    padding: '0.6rem 0.8rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '1rem',
};

const formErrorStyle: React.CSSProperties = {
    background: 'rgba(255,80,80,0.1)',
    border: '1px solid rgba(255,80,80,0.3)',
    color: '#ff6b6b',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.82rem',
};

const charCountStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'none',
    letterSpacing: 'normal',
};

const formStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.25rem',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#e0e0ff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    overflow: 'hidden',
};

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '0.9rem',
};

const btnStyle: React.CSSProperties = {
    background: '#6c63ff',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
};

const submitBtnStyle: React.CSSProperties = {
    background: '#6c63ff',
    border: 'none',
    color: '#fff',
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
};

const cancelBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    whiteSpace: 'nowrap',
};

const editBtnStyle: React.CSSProperties = {
    background: 'rgba(108,99,255,0.15)',
    color: '#a5a0ff',
    border: '1px solid rgba(108,99,255,0.3)',
    padding: '0.3rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    marginRight: '0.5rem',
};

const deleteBtnStyle: React.CSSProperties = {
    background: 'rgba(255,80,80,0.1)',
    color: '#ff6b6b',
    border: '1px solid rgba(255,80,80,0.2)',
    padding: '0.3rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
};

export default ManageCategories;
