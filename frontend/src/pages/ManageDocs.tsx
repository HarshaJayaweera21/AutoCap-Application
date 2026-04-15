import { useEffect, useState } from 'react';
import { getDocs, getCategories, adminDeleteDoc } from '../services/api';
import type { Doc, Category } from '../types';
import DocForm from '../components/DocForm';
import './ManageDocs.css';

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

    const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

    const getCategoryName = (categoryId: string) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat ? cat.name : 'Unknown';
    };

    const openDeleteModal = (doc: Doc) => setDeleteTarget({id: doc.id, name: doc.title});
    const closeDeleteModal = () => setDeleteTarget(null);

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminDeleteDoc(deleteTarget.id);
            setDocs(docs.filter(d => d.id !== deleteTarget.id));
            closeDeleteModal();
        } catch {
            setError('Failed to delete doc');
            closeDeleteModal();
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
        <div className="mdo-page">
            <div className="mdo-header" style={{ justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button onClick={handleCreate} className="mdo-primary-btn">
                    <span className="material-symbols-outlined">add</span> Create New
                </button>
            </div>

            <div className="mdo-table-container">
                <div className="mdo-table-scroll">
                    <table className="mdo-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Slug</th>
                                <th>Category</th>
                                <th>Order</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map(doc => (
                                <tr key={doc.id}>
                                    <td className="mdo-cell-title">{doc.title}</td>
                                    <td className="mdo-cell-slug">{doc.slug}</td>
                                    <td className="mdo-cell-cat">{getCategoryName(doc.categoryId)}</td>
                                    <td>{doc.orderIndex}</td>
                                    <td>
                                        <div className="mdo-actions">
                                            <button className="mdo-btn-icon" onClick={() => handleEdit(doc)} title="Edit">
                                                <span className="material-symbols-outlined">edit</span>
                                            </button>
                                            <button className="mdo-btn-icon danger" onClick={() => openDeleteModal(doc)} title="Delete">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {docs.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', color: '#8e8fa3', padding: '2rem' }}>
                                        No documents found
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
                            <h2 className="mdo-confirm-title">Delete Document?</h2>
                            <p className="mdo-confirm-desc">
                                Are you sure you want to delete "{deleteTarget.name}"? This cannot be undone.
                            </p>
                            <div className="mdo-confirm-actions">
                                <button className="mdo-btn-confirm" onClick={confirmDelete}>
                                    Yes, delete document
                                </button>
                                <button className="mdo-btn-confirm-cancel" onClick={closeDeleteModal}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

export default ManageDocs;
