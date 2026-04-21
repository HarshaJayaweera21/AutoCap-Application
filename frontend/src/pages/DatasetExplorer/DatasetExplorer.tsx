import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../api/axiosInstance';
import './DatasetExplorer.css';

interface DatasetItem {
    captionId: number;
    imageId: number;
    imageUrl: string | null;
    captionText: string;
    similarityScore: number | null;
    isFlagged: boolean;
    isEdited: boolean;
}

const ITEMS_PER_PAGE = 10;

export const DatasetExplorer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [items, setItems] = useState<DatasetItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editCaptionId, setEditCaptionId] = useState<number | null>(null);
    const [editCaptionText, setEditCaptionText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Delete confirmation modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null); // Stores captionId of the item being processed

    const fetchItems = useCallback(async (page = 0) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/api/datasets/${id}/items?page=${page}&size=${ITEMS_PER_PAGE}`);
            setItems(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch dataset items', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchItems(0);
    }, [fetchItems]);

    const handleBack = () => {
        if (location.state && location.state.from) {
            navigate(location.state.from);
        } else {
            navigate('/dashboard');
        }
    };

    const handleCheckboxChange = (captionId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(captionId)) {
                next.delete(captionId);
            } else {
                next.add(captionId);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedIds.size === items.length && items.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(item => item.captionId)));
        }
    };

    // Edit modal handlers
    const openEditModal = (captionId: number, currentText: string) => {
        setEditCaptionId(captionId);
        setEditCaptionText(currentText);
        setEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setEditCaptionId(null);
        setEditCaptionText('');
    };

    const handleSaveCaption = async () => {
        if (editCaptionId === null) return;
        setIsSaving(true);
        try {
            await api.put(`/api/datasets/${id}/captions`, {
                updates: [{ id: editCaptionId, newText: editCaptionText }]
            });
            closeEditModal();
            fetchItems(currentPage);
        } catch (error) {
            console.error('Error saving caption:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete handlers
    const openDeleteModal = () => {
        if (selectedIds.size === 0) return;
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/api/datasets/${id}/items`, {
                data: { captionIds: Array.from(selectedIds) }
            });
            setSelectedIds(new Set());
            closeDeleteModal();
            // If we deleted all items on current page, go back one page
            const remainingOnPage = items.length - selectedIds.size;
            if (remainingOnPage <= 0 && currentPage > 0) {
                fetchItems(currentPage - 1);
            } else {
                fetchItems(currentPage);
            }
        } catch (error) {
            console.error('Error deleting items:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleApprove = async (captionId: number) => {
        setActionLoading(captionId);
        try {
            await api.put(`/api/datasets/${id}/items/${captionId}/approve`);
            // Update local state instead of full fetch for snappier UI
            setItems(prev => prev.map(item => 
                item.captionId === captionId ? { ...item, isFlagged: false } : item
            ));
        } catch (error) {
            console.error('Error approving caption:', error);
            alert('Failed to approve caption.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRegenerate = async (captionId: number) => {
        setActionLoading(captionId);
        try {
            await api.post(`/api/datasets/${id}/items/${captionId}/regenerate`);
            // Regeneration changes text/score, so we should re-fetch the page data
            await fetchItems(currentPage);
        } catch (error) {
            console.error('Error regenerating caption:', error);
            alert('Failed to regenerate caption.');
        } finally {
            setActionLoading(null);
        }
    };

    // Pagination handlers
    const goToPage = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setSelectedIds(new Set());
        fetchItems(page);
    };

    const generatePageNumbers = () => {
        const pages = [];
        // Math to figure out bounds
        let start = Math.max(0, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);
        if (currentPage === 0) end = Math.min(2, totalPages - 1);
        if (currentPage === totalPages - 1) start = Math.max(0, totalPages - 3);
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const hasSelections = selectedIds.size > 0;

    return (
        <div className="mds-page">
            <Header />
            <main className="mds-container">
                <div className="mds-explorer-header">
                    <button className="mds-back-btn" onClick={handleBack} title="Go back to Dashboard">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back
                    </button>
                    <div>
                        <h2 className="mds-title">Dataset Explorer</h2>
                        <p className="mds-subtitle">Manage, edit, and organize items within your dataset.</p>
                    </div>
                </div>

                <div className="mds-table-wrapper">
                    {loading ? (
                        <div className="mds-empty">Loading dataset items...</div>
                    ) : items.length === 0 ? (
                        <div className="mds-empty">No items found in this dataset.</div>
                    ) : (
                        <>
                            <div className="mds-table-scroll">
                                <table className="mds-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    className="mds-checkbox"
                                                    checked={selectedIds.size === items.length && items.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th>Image</th>
                                            <th>Caption</th>
                                            <th style={{ width: '100px', textAlign: 'center' }}>Similarity</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Edit Status</th>
                                            <th style={{ width: '120px', textAlign: 'center' }}>Flag Status</th>
                                            <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => {
                                            const isSelected = selectedIds.has(item.captionId);
                                            return (
                                                <tr key={item.captionId} className={isSelected ? 'selected' : ''}>
                                                    <td>
                                                        <input 
                                                            type="checkbox" 
                                                            className="mds-checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleCheckboxChange(item.captionId)}
                                                        />
                                                    </td>
                                                    <td>
                                                        {item.imageUrl ? (
                                                            <div 
                                                                className="mds-img-wrapper"
                                                                onClick={() => setPreviewImage(item.imageUrl as string)}
                                                            >
                                                                <img 
                                                                    src={item.imageUrl} 
                                                                    alt={`Image ${item.imageId}`} 
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" fill="%2336333c"><rect width="120" height="80"/></svg>';
                                                                    }}
                                                                />
                                                                <div className="mds-img-overlay">
                                                                    <span className="material-symbols-outlined">zoom_out_map</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="mds-no-img">No Image</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <p className="mds-caption-text">{item.captionText}</p>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {item.similarityScore !== null ? (
                                                            <span className="mds-score">{item.similarityScore.toFixed(4)}</span>
                                                        ) : (
                                                            <span className="mds-score" style={{ color: 'var(--mds-outline)' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {item.isEdited ? (
                                                            <span className="mds-badge-okay">Yes</span>
                                                        ) : (
                                                            <span className="mds-badge-neutral">No</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        {item.isFlagged ? (
                                                            <span className="mds-badge-flagged">Flagged</span>
                                                        ) : (
                                                            <span className="mds-badge-okay">Not Flagged</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                            {item.isFlagged && (
                                                                <>
                                                                    <button 
                                                                        className="mds-approve-btn"
                                                                        onClick={() => handleApprove(item.captionId)}
                                                                        title="Approve Anyway"
                                                                        disabled={actionLoading === item.captionId}
                                                                    >
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--mds-success)' }}>check_circle</span>
                                                                    </button>
                                                                    <button 
                                                                        className="mds-regen-btn"
                                                                        onClick={() => handleRegenerate(item.captionId)}
                                                                        title="Regenerate Caption"
                                                                        disabled={actionLoading === item.captionId}
                                                                    >
                                                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--mds-primary)' }}>rotate_right</span>
                                                                    </button>
                                                                </>
                                                            )}
                                                            <button 
                                                                className="mds-edit-btn"
                                                                onClick={() => openEditModal(item.captionId, item.captionText)}
                                                                title="Edit Caption"
                                                                disabled={actionLoading === item.captionId}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>edit</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 0 && (
                                <div className="mds-pagination">
                                    <span className="mds-pagination-text">
                                        Showing {(currentPage * ITEMS_PER_PAGE) + 1} to {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalElements)} of {totalElements} results
                                    </span>
                                    <div className="mds-pagination-controls">
                                        <button 
                                            className="mds-page-btn" 
                                            disabled={currentPage === 0}
                                            onClick={() => goToPage(currentPage - 1)}
                                        >
                                            <span className="material-symbols-outlined">chevron_left</span>
                                        </button>

                                        {generatePageNumbers().map(p => (
                                            <button 
                                                key={p} 
                                                className={`mds-page-btn ${p === currentPage ? 'active' : ''}`}
                                                onClick={() => goToPage(p)}
                                            >
                                                {p + 1}
                                            </button>
                                        ))}

                                        {totalPages > 3 && currentPage < totalPages - 2 && (
                                            <>
                                                <span style={{ color: 'var(--mds-outline)', padding: '0 0.5rem' }}>...</span>
                                                <button className="mds-page-btn" onClick={() => goToPage(totalPages - 1)}>{totalPages}</button>
                                            </>
                                        )}

                                        <button 
                                            className="mds-page-btn" 
                                            disabled={currentPage >= totalPages - 1}
                                            onClick={() => goToPage(currentPage + 1)}
                                        >
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Floating delete button */}
            {hasSelections && (
                <div className="mds-floating-bar">
                    <span className="mds-floating-text">{selectedIds.size} items selected</span>
                    <button 
                        className="mds-floating-btn"
                        onClick={openDeleteModal}
                        disabled={isDeleting}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
                        Delete Options
                    </button>
                </div>
            )}

            {/* Image Preview Modal (isolated simple overlay) */}
            {previewImage && (
                <div className="mds-modal-overlay" onClick={() => setPreviewImage(null)} style={{ zIndex: 3000 }}>
                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button 
                            className="mds-modal-close" 
                            style={{ position: 'absolute', top: '-2.5rem', right: '0', color: '#fff' }}
                            onClick={() => setPreviewImage(null)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <img src={previewImage} alt="Fullscreen preview" className="mds-preview-img" />
                    </div>
                </div>
            )}

            {/* Edit Caption Modal */}
            {editModalOpen && (
                <div className="mds-modal-overlay">
                    <div className="mds-modal-backdrop" onClick={closeEditModal} style={{ zIndex: -1 }}></div>
                    <div className="mds-modal-content mds-modal-edit" onClick={e => e.stopPropagation()}>
                        <div className="mds-modal-header">
                            <div>
                                <h2>Edit Caption Target</h2>
                                <p>Provide manual adjustments for image tagging interpretation.</p>
                            </div>
                            <button className="mds-modal-close" onClick={closeEditModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="mds-modal-body">
                            <form className="mds-grid-form" onSubmit={e => { e.preventDefault(); handleSaveCaption(); }}>
                                <div className="mds-field">
                                    <label className="mds-label editable">Revised Prompt Metadata</label>
                                    <textarea
                                        className="mds-edit-input"
                                        value={editCaptionText}
                                        onChange={(e) => setEditCaptionText(e.target.value)}
                                        placeholder="Add relevant metadata text..."
                                    />
                                </div>
                                <button type="submit" style={{ display: 'none' }}></button>
                            </form>
                        </div>
                        <div className="mds-modal-footer">
                            <button className="mds-btn-cancel" onClick={closeEditModal}>Discard</button>
                            <button 
                                className="mds-btn-save" 
                                onClick={handleSaveCaption}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Processing...' : 'Merge Correction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="mds-modal-overlay">
                    <div className="mds-modal-backdrop" onClick={closeDeleteModal} style={{ zIndex: -1 }}></div>
                    <div className="mds-modal-content mds-modal-confirm" onClick={e => e.stopPropagation()}>
                        <div className="mds-confirm-body">
                            <div className="mds-confirm-icon-wrap">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <h2 className="mds-confirm-title">Confirm Destructive Action</h2>
                            <p className="mds-confirm-desc">
                                Are you sure you wish to delete <strong>{selectedIds.size}</strong> annotated item{selectedIds.size > 1 ? 's' : ''}? These will be purged from index buffers permanently.
                            </p>
                            <div className="mds-confirm-actions">
                                <button className="mds-btn-confirm" onClick={handleConfirmDelete} disabled={isDeleting}>
                                    {isDeleting ? 'Erasing...' : 'Confirm Destruction'}
                                </button>
                                <button className="mds-btn-confirm-cancel" onClick={closeDeleteModal}>
                                    Cancel Return
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

export default DatasetExplorer;
