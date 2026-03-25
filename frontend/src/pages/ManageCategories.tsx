import { useEffect, useState } from 'react';
import { getCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../services/api';
import type { Category } from '../types';

function ManageCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
    };

    const openEdit = (cat: Category) => {
        setEditingCat(cat);
        setFormName(cat.name);
        setFormOrder(cat.orderIndex);
        setShowForm(true);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
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

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete category "${name}"? Documents in this category may be affected.`)) return;
        try {
            await adminDeleteCategory(id);
            setCategories(categories.filter(c => c.id !== id));
        } catch {
            setError('Failed to delete category. It may still have documents assigned.');
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            {error && <div style={errorStyle}>{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>{categories.length} category(ies)</p>
                <button onClick={openCreate} style={btnStyle}>+ Create New</button>
            </div>

            {/* Inline form */}
            {showForm && (
                <form onSubmit={handleSubmit} style={formStyle}>
                    <h3 style={{ margin: 0, color: '#e0e0ff', fontSize: '1rem' }}>
                        {editingCat ? 'Edit Category' : 'Create Category'}
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Name *</label>
                            <input
                                style={inputStyle}
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Category name"
                                required
                            />
                        </div>
                        <div style={{ width: '100px' }}>
                            <label style={labelStyle}>Order</label>
                            <input
                                style={inputStyle}
                                type="number"
                                value={formOrder}
                                onChange={e => setFormOrder(parseInt(e.target.value) || 0)}
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

            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Name</th>
                        <th style={thStyle}>Order</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td style={tdStyle}>{cat.name}</td>
                            <td style={tdStyle}>{cat.orderIndex}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                <button onClick={() => openEdit(cat)} style={editBtnStyle}>Edit</button>
                                <button onClick={() => handleDelete(cat.id, cat.name)} style={deleteBtnStyle}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    {categories.length === 0 && (
                        <tr>
                            <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                No categories found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
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
