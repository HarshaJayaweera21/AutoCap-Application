import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../api/axiosInstance';
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
    const navigate = useNavigate();
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

    // Local filter and sort states
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('Newest');

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

    // Derived statistics
    const totalDatasets = datasets.length;
    const publicDatasets = datasets.filter(d => d.isPublic).length;
    const privateDatasets = datasets.filter(d => !d.isPublic).length;

    // Filter and Sort execution
    const filteredAndSortedDatasets = [...datasets]
        .filter(d => {
            if (searchQuery.trim() !== '') {
                const q = searchQuery.toLowerCase();
                return d.name.toLowerCase().includes(q) || (d.description && d.description.toLowerCase().includes(q));
            }
            return true;
        })
        .sort((a, b) => {
            const tA = new Date(a.createdAt).getTime();
            const tB = new Date(b.createdAt).getTime();
            return sortOrder === 'Newest' ? tB - tA : tA - tB;
        });

    // Dummy pagination constants (since current backend gives all rows without page info)
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredAndSortedDatasets.length / itemsPerPage) || 1;
    const paginatedDatasets = filteredAndSortedDatasets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset pagination if search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortOrder]);

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

    const generatePageNumbers = () => {
        const pages = [];
        let start = Math.max(1, currentPage - 1);
        let end = Math.min(totalPages, currentPage + 1);
        if (currentPage === 1) end = Math.min(3, totalPages);
        if (currentPage === totalPages) start = Math.max(1, totalPages - 2);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="mds-page">
            <Header />

            <main className="mds-container">
                {/* Header section */}
                <div className="mds-header">
                    <h1 className="mds-title">My Datasets</h1>
                    <p className="mds-subtitle">Management Portal</p>
                </div>

                {/* Statistics Section */}
                <div className="mds-stats-grid">
                    <div className="mds-stat-card">
                        <div className="mds-stat-icon-wrap total">
                            <span className="material-symbols-outlined mds-stat-icon total">database</span>
                        </div>
                        <div>
                            <div className="mds-stat-value total">{loading ? '—' : totalDatasets}</div>
                            <div className="mds-stat-label">Total Datasets</div>
                        </div>
                    </div>
                    <div className="mds-stat-card">
                        <div className="mds-stat-icon-wrap public">
                            <span className="material-symbols-outlined mds-stat-icon public">public</span>
                        </div>
                        <div>
                            <div className="mds-stat-value public">{loading ? '—' : publicDatasets}</div>
                            <div className="mds-stat-label">Public Datasets</div>
                        </div>
                    </div>
                    <div className="mds-stat-card">
                        <div className="mds-stat-icon-wrap private">
                            <span className="material-symbols-outlined mds-stat-icon private">lock</span>
                        </div>
                        <div>
                            <div className="mds-stat-value private">{loading ? '—' : privateDatasets}</div>
                            <div className="mds-stat-label">Private Datasets</div>
                        </div>
                    </div>
                </div>

                {/* Table Controls */}
                <div className="mds-controls">
                    <div className="mds-search">
                        <span className="material-symbols-outlined mds-search-icon">search</span>
                        <input 
                            type="text" 
                            className="mds-search-input" 
                            placeholder="Search datasets by name..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="mds-filter-group">
                        <span className="mds-filter-label">Sort by:</span>
                        <div className="mds-filter-wrap">
                            <select 
                                className="mds-filter"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                            >
                                <option>Newest</option>
                                <option>Oldest</option>
                            </select>
                            <span className="material-symbols-outlined mds-filter-arrow">expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Main Table Section */}
                <div className="mds-table-wrapper">
                    <div className="mds-table-scroll">
                        <table className="mds-table">
                            <thead>
                                <tr>
                                    <th>Dataset Name</th>
                                    <th>Avg Similarity</th>
                                    <th>Total Items</th>
                                    <th style={{ textAlign: 'center' }}>Access</th>
                                    <th style={{ textAlign: 'center' }}>Format</th>
                                    <th>Created</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="mds-empty">Loading datasets...</td></tr>
                                ) : paginatedDatasets.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="mds-empty">
                                            {datasets.length === 0 
                                                ? "You haven't created any datasets yet." 
                                                : "No datasets match your search."}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedDatasets.map(dataset => (
                                        <tr key={dataset.id}>
                                            <td>
                                                <div className="mds-cell-name">
                                                    <span className="material-symbols-outlined">folder</span>
                                                    <span className="mds-dataset-name">{dataset.name}</span>
                                                </div>
                                            </td>
                                            <td className="mds-cell-mono">
                                                {dataset.averageSimilarity !== null ? dataset.averageSimilarity.toFixed(3) : '—'}
                                            </td>
                                            <td className="mds-cell-variant">
                                                {dataset.totalItems.toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {dataset.isPublic 
                                                    ? <span className="mds-badge-public">Public</span> 
                                                    : <span className="mds-badge-private">Private</span>}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {dataset.format ? (
                                                    <span className="mds-badge-format">{dataset.format}</span>
                                                ) : (
                                                    <span className="mds-cell-muted">—</span>
                                                )}
                                            </td>
                                            <td className="mds-cell-muted">
                                                {formatDate(dataset.createdAt)}
                                            </td>
                                            <td>
                                                <div className="mds-actions">
                                                    <button className="mds-btn-action" onClick={() => navigate(`/datasets/${dataset.id}`, { state: { from: '/my-datasets' } })}>View</button>
                                                    <button className="mds-btn-action" onClick={() => openEditModal(dataset)}>Edit</button>
                                                    <button className="mds-btn-action danger" onClick={() => openDeleteModal(dataset)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredAndSortedDatasets.length > 0 && (
                        <div className="mds-pagination">
                            <span className="mds-pagination-text">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedDatasets.length)} of {filteredAndSortedDatasets.length} results
                            </span>
                            <div className="mds-pagination-controls">
                                <button 
                                    className="mds-page-btn" 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>

                                {generatePageNumbers().map(p => (
                                    <button 
                                        key={p} 
                                        className={`mds-page-btn ${p === currentPage ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(p)}
                                    >
                                        {p}
                                    </button>
                                ))}

                                {totalPages > 3 && currentPage < totalPages - 1 && (
                                    <>
                                        <span style={{ color: 'var(--mds-outline)' }}>...</span>
                                        <button className="mds-page-btn" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                                    </>
                                )}

                                <button 
                                    className="mds-page-btn" 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Dataset Modal */}
            {editModalOpen && editDataset && (
                <div className="mds-modal-overlay">
                    <div className="mds-modal-backdrop" onClick={closeEditModal}></div>
                    <div className="mds-modal-content mds-modal-edit">
                        <div className="mds-modal-header">
                            <div>
                                <h2>Edit Dataset</h2>
                                <p>Update dataset metadata and access levels.</p>
                            </div>
                            <button className="mds-modal-close" onClick={closeEditModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="mds-modal-body">
                            <form className="mds-grid-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }}>
                                <div className="mds-field">
                                    <label className="mds-label editable">Dataset Name</label>
                                    <input 
                                        type="text"
                                        className="mds-edit-input"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        placeholder="Enter dataset name"
                                    />
                                </div>
                                <div className="mds-field">
                                    <label className="mds-label editable">Description</label>
                                    <textarea 
                                        className="mds-edit-input"
                                        value={editDescription}
                                        onChange={e => setEditDescription(e.target.value)}
                                        placeholder="Enter description"
                                    />
                                </div>
                                <div className="mds-field">
                                    <label className="mds-label editable">Access Level</label>
                                    <div className="mds-toggle-group">
                                        <button type="button"
                                            className={`mds-toggle-btn ${!editIsPublic ? 'active' : ''}`}
                                            onClick={() => setEditIsPublic(false)}
                                        >Private</button>
                                        <button type="button"
                                            className={`mds-toggle-btn ${editIsPublic ? 'active' : ''}`}
                                            onClick={() => setEditIsPublic(true)}
                                        >Public</button>
                                    </div>
                                </div>
                                <button type="submit" style={{display:'none'}}></button>
                            </form>
                        </div>
                        <div className="mds-modal-footer">
                            <button className="mds-btn-cancel" onClick={closeEditModal}>Cancel</button>
                            <button className="mds-btn-save" onClick={handleSaveEdit} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && deleteTarget && (
                <div className="mds-modal-overlay">
                    <div className="mds-modal-backdrop" onClick={closeDeleteModal}></div>
                    <div className="mds-modal-content mds-modal-confirm">
                        <div className="mds-confirm-body">
                            <div className="mds-confirm-icon-wrap">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            
                            <h2 className="mds-confirm-title">Delete Dataset</h2>
                            
                            <p className="mds-confirm-desc">
                                Are you sure you want to delete dataset <strong>{deleteTarget.name}</strong>? 
                                All images, captions, and related items will be permanently removed.
                            </p>

                            <div className="mds-confirm-actions">
                                <button className="mds-btn-confirm" onClick={handleConfirmDelete} disabled={isDeleting}>
                                    {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                                </button>
                                <button className="mds-btn-confirm-cancel" onClick={closeDeleteModal}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                        <div className="mds-confirm-bar"></div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MyDatasets;
