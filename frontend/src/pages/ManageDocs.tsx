import { useEffect, useState } from 'react';
import { getDocs, getCategories, adminDeleteDoc } from '../services/api';
import type { Doc, Category } from '../types';
import DocForm from '../components/DocForm';

function ManageDocs() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingDoc, setEditingDoc] = useState<Doc | undefined>(undefined);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docsData, catsData] = await Promise.all([getDocs(), getCategories()]);
            setDocs(docsData);
            setCategories(catsData);
            setError('');
        } catch {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getCategoryName = (categoryId: string) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat ? cat.name : 'Unknown';
    };

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await adminDeleteDoc(id);
            setDocs(docs.filter(d => d.id !== id));
        } catch {
            setError('Failed to delete doc');
        }
    };

    const handleCreate = () => {
        setEditingDoc(undefined);
        setShowForm(true);
    };

    const handleEdit = (doc: Doc) => {
        setEditingDoc(doc);
        setShowForm(true);
    };

    const handleFormSaved = () => {
        setShowForm(false);
        setEditingDoc(undefined);
        fetchData(); // refresh the table
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingDoc(undefined);
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: '#ff6b6b' }}>{error}</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>{docs.length} document(s)</p>
                <button onClick={handleCreate} style={btnStyle}>
                    + Create New
                </button>
            </div>

            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Title</th>
                        <th style={thStyle}>Slug</th>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Order</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {docs.map(doc => (
                        <tr key={doc.id}>
                            <td style={tdStyle}>{doc.title}</td>
                            <td style={{ ...tdStyle, color: 'rgba(255,255,255,0.5)' }}>{doc.slug}</td>
                            <td style={tdStyle}>{getCategoryName(doc.categoryId)}</td>
                            <td style={tdStyle}>{doc.orderIndex}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                <button onClick={() => handleEdit(doc)} style={editBtnStyle}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(doc.id, doc.title)} style={deleteBtnStyle}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    {docs.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                No documents found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {showForm && (
                <DocForm
                    doc={editingDoc}
                    existingDocs={docs}
                    onSaved={handleFormSaved}
                    onCancel={handleFormCancel}
                />
            )}
        </div>
    );
}

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

export default ManageDocs;
