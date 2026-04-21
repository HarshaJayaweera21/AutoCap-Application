import { useEffect, useState } from 'react';
import { getTags, adminCreateTag, adminDeleteTag } from '../services/api';
import './ManageDocs.css';

interface Tag {
    id: string;
    name: string;
}

function ManageTags() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchTags = async () => {
        try {
            setLoading(true);
            const data = await getTags();
            setTags(data);
            setError('');
        } catch {
            setError('Failed to fetch tags');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTags(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;
        if (newTagName.length > 100) {
            setError('Tag name cannot exceed 100 characters.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await adminCreateTag({ name: newTagName.trim() });
            setNewTagName('');
            fetchTags();
        } catch {
            setError('Failed to create tag');
        } finally {
            setSaving(false);
        }
    };

    const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

    const openDeleteModal = (id: string, name: string) => setDeleteTarget({id, name});
    const closeDeleteModal = () => setDeleteTarget(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminDeleteTag(deleteTarget.id);
            setTags(tags.filter(t => t.id !== deleteTarget.id));
            closeDeleteModal();
        } catch {
            setError('Failed to delete tag');
            closeDeleteModal();
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="mdo-page">
            {error && <div style={errorStyle}>{error}</div>}

            {/* Create form */}
            <form onSubmit={handleCreate} style={formStyle}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        style={{
                            ...inputStyle,
                            ...(newTagName.length > 100 ? { borderColor: '#ff6b6b' } : {}),
                        }}
                        value={newTagName}
                        onChange={e => { setNewTagName(e.target.value); setError(''); }}
                        placeholder="New tag name..."
                        maxLength={100}
                        required
                    />
                    <span style={charCountStyle}>{newTagName.length}/100</span>
                </div>
                <button type="submit" disabled={saving} className="mdo-primary-btn">
                    {saving ? '...' : <><span className="material-symbols-outlined">add</span> Add Tag</>}
                </button>
            </form>

            <div className="mdo-header" style={{ justifyContent: 'flex-start', marginBottom: '0.75rem' }}>
                <p className="mdo-subtitle">{tags.length} tag(s)</p>
            </div>

            <div className="mdo-table-container">
                <div className="mdo-table-scroll">
                    <table className="mdo-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tags.map(tag => (
                                <tr key={tag.id}>
                                    <td className="mdo-cell-title">{tag.name}</td>
                                    <td>
                                        <div className="mdo-actions">
                                            <button className="mdo-btn-icon danger" onClick={() => openDeleteModal(tag.id, tag.name)} title="Delete">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tags.length === 0 && (
                                <tr>
                                    <td colSpan={2} style={{ textAlign: 'center', color: '#8e8fa3', padding: '2rem' }}>
                                        No tags found
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
                            <h2 className="mdo-confirm-title">Delete Tag?</h2>
                            <p className="mdo-confirm-desc">
                                Are you sure you want to delete the tag "{deleteTarget.name}"?
                            </p>
                            <div className="mdo-confirm-actions">
                                <button className="mdo-btn-confirm" onClick={confirmDelete}>
                                    Yes, delete tag
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
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
};

const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#e0e0ff',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
};

const charCountStyle: React.CSSProperties = {
    position: 'absolute' as const,
    right: '8px',
    bottom: '-16px',
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.35)',
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
    whiteSpace: 'nowrap',
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

const deleteBtnStyle: React.CSSProperties = {
    background: 'rgba(255,80,80,0.1)',
    color: '#ff6b6b',
    border: '1px solid rgba(255,80,80,0.2)',
    padding: '0.3rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
};

export default ManageTags;
