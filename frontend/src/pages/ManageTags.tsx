import { useEffect, useState } from 'react';
import { getTags, adminCreateTag, adminDeleteTag } from '../services/api';

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

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Delete tag "${name}"?`)) return;
        try {
            await adminDeleteTag(id);
            setTags(tags.filter(t => t.id !== id));
        } catch {
            setError('Failed to delete tag');
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            {error && <div style={errorStyle}>{error}</div>}

            {/* Create form */}
            <form onSubmit={handleCreate} style={formStyle}>
                <input
                    style={inputStyle}
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                    placeholder="New tag name..."
                    required
                />
                <button type="submit" disabled={saving} style={btnStyle}>
                    {saving ? '...' : '+ Add Tag'}
                </button>
            </form>

            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 0.75rem' }}>{tags.length} tag(s)</p>

            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Name</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tags.map(tag => (
                        <tr key={tag.id}>
                            <td style={tdStyle}>{tag.name}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                <button onClick={() => handleDelete(tag.id, tag.name)} style={deleteBtnStyle}>Delete</button>
                            </td>
                        </tr>
                    ))}
                    {tags.length === 0 && (
                        <tr>
                            <td colSpan={2} style={{ ...tdStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                No tags found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
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
