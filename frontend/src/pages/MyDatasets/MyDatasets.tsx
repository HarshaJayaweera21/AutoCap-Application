import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import api from '../../api/axiosInstance';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import { HiOutlineX } from 'react-icons/hi';
import './MyDatasets.css';

interface DatasetInfo {
    id: number;
    name: string;
    description: string | null;
    totalItems: number;
    averageSimilarity: number | null;
    isPublic: boolean;
    format: string | null;
    createdAt: string;
}

const MyDatasets: React.FC = () => {
    const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editDataset, setEditDataset] = useState<DatasetInfo | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<DatasetInfo | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDatasets = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/datasets/my');
            setDatasets(data || []);
        } catch (error) {
            console.error('Failed to fetch datasets', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDatasets();
    }, [fetchDatasets]);

    // Edit handlers
    const openEditModal = (dataset: DatasetInfo) => {
        setEditDataset(dataset);
        setEditName(dataset.name);
        setEditDescription(dataset.description || '');
        setEditIsPublic(dataset.isPublic);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditDataset(null);
    };

    const handleSaveEdit = async () => {
        if (!editDataset) return;
        setIsSaving(true);
        try {
            await api.put(`/api/datasets/${editDataset.id}`, {
                name: editName,
                description: editDescription,
                isPublic: editIsPublic
            });
            closeEditModal();
            fetchDatasets();
        } catch (error) {
            console.error('Error updating dataset:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete handlers
    const openDeleteModal = (dataset: DatasetInfo) => {
        setDeleteTarget(dataset);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteTarget(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/datasets/${deleteTarget.id}`);
            closeDeleteModal();
            fetchDatasets();
        } catch (error) {
            console.error('Error deleting dataset:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="my-datasets">
            <Header />
            <main className="my-datasets__main">
                <div className="my-datasets__header">
                    <div className="my-datasets__header-text">
                        <h2>My Datasets</h2>
                        <p>View and manage all your created datasets.</p>
                    </div>
                </div>

                <div className="my-datasets__content">
                    {loading ? (
                        <div className="my-datasets__empty">Loading datasets...</div>
                    ) : datasets.length === 0 ? (
                        <div className="my-datasets__empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                            <h3>No currently available datasets</h3>
                            <p>Upload images from your dashboard to create a new dataset.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="my-datasets__table">
                                <thead>
                                    <tr>
                                        <th>Dataset Name</th>
                                        <th>Avg. Similarity</th>
                                        <th>Total Items</th>
                                        <th>Access Level</th>
                                        <th>Created</th>
                                        <th>Format</th>
                                        <th style={{ width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datasets.map(dataset => (
                                        <tr key={dataset.id}>
                                            <td className="my-datasets__name">{dataset.name}</td>
                                            <td>
                                                {dataset.averageSimilarity !== null ? (
                                                    <span className="my-datasets__score">{dataset.averageSimilarity.toFixed(4)}</span>
                                                ) : (
                                                    <span className="my-datasets__score" style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td><span className="my-datasets__items-count">{dataset.totalItems}</span></td>
                                            <td>
                                                {dataset.isPublic ? (
                                                    <span className="my-datasets__badge public">Public</span>
                                                ) : (
                                                    <span className="my-datasets__badge private">Private</span>
                                                )}
                                            </td>
                                            <td className="my-datasets__date">{formatDate(dataset.createdAt)}</td>
                                            <td>
                                                {dataset.format ? (
                                                    <span className="my-datasets__format">{dataset.format}</span>
                                                ) : (
                                                    <span className="my-datasets__format" style={{ color: 'var(--text-muted)' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="my-datasets__actions">
                                                    <button 
                                                        className="my-datasets__action-icon edit"
                                                        onClick={() => openEditModal(dataset)}
                                                        title="Edit Dataset"
                                                    >
                                                        <HiOutlinePencilSquare />
                                                    </button>
                                                    <button 
                                                        className="my-datasets__action-icon delete"
                                                        onClick={() => openDeleteModal(dataset)}
                                                        title="Delete Dataset"
                                                    >
                                                        <HiOutlineTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Dataset Modal */}
            {editModalOpen && editDataset && (
                <div className="my-datasets__modal-overlay" onClick={closeEditModal}>
                    <div className="my-datasets__dialog" onClick={e => e.stopPropagation()}>
                        <div className="my-datasets__dialog-header">
                            <h3>Edit Dataset</h3>
                            <button className="my-datasets__modal-close" onClick={closeEditModal} aria-label="Close">
                                <HiOutlineX />
                            </button>
                        </div>
                        <div className="my-datasets__dialog-body">
                            <div className="my-datasets__form-group">
                                <label>Dataset Name</label>
                                <input 
                                    type="text"
                                    className="my-datasets__form-input"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder="Enter dataset name"
                                />
                            </div>
                            <div className="my-datasets__form-group">
                                <label>Description</label>
                                <textarea 
                                    className="my-datasets__form-textarea"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    rows={4}
                                    placeholder="Enter description"
                                />
                            </div>
                            <div className="my-datasets__form-group">
                                <label>Access Level</label>
                                <div className="my-datasets__toggle-group">
                                    <button 
                                        className={`my-datasets__toggle-btn ${!editIsPublic ? 'active' : ''}`}
                                        onClick={() => setEditIsPublic(false)}
                                    >
                                        Private
                                    </button>
                                    <button 
                                        className={`my-datasets__toggle-btn ${editIsPublic ? 'active' : ''}`}
                                        onClick={() => setEditIsPublic(true)}
                                    >
                                        Public
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="my-datasets__dialog-footer">
                            <button className="my-datasets__dialog-btn cancel" onClick={closeEditModal}>Cancel</button>
                            <button 
                                className="my-datasets__dialog-btn save" 
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && deleteTarget && (
                <div className="my-datasets__modal-overlay" onClick={closeDeleteModal}>
                    <div className="my-datasets__dialog" onClick={e => e.stopPropagation()}>
                        <div className="my-datasets__dialog-header">
                            <h3>Delete Dataset</h3>
                            <button className="my-datasets__modal-close" onClick={closeDeleteModal} aria-label="Close">
                                <HiOutlineX />
                            </button>
                        </div>
                        <div className="my-datasets__dialog-body">
                            <p className="my-datasets__delete-warning">
                                Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? All images, captions, and dataset items will be permanently removed. This action cannot be undone.
                            </p>
                        </div>
                        <div className="my-datasets__dialog-footer">
                            <button className="my-datasets__dialog-btn cancel" onClick={closeDeleteModal}>Cancel</button>
                            <button 
                                className="my-datasets__dialog-btn danger" 
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Dataset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyDatasets;
