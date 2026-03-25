import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../api/axiosInstance';
import { HiOutlineArrowsPointingOut, HiOutlinePencilSquare } from 'react-icons/hi2';
import { HiOutlineX } from 'react-icons/hi';
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
        navigate('/dashboard');
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

    // Pagination handlers
    const goToPage = (page: number) => {
        if (page < 0 || page >= totalPages) return;
        setSelectedIds(new Set());
        fetchItems(page);
    };

    const hasSelections = selectedIds.size > 0;

    return (
        <div className="dataset-explorer">
            <Header />
            <main className="dataset-explorer__main">
                <div className="dataset-explorer__header">
                    <div className="dataset-explorer__header-left">
                        <button className="dataset-explorer__back-btn" onClick={handleBack} title="Go back to Dashboard">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                        <div className="dataset-explorer__header-text">
                            <h2>Dataset Explorer</h2>
                            <p>Manage, edit, and organize items within your dataset.</p>
                        </div>
                    </div>
                </div>

                <div className="dataset-explorer__results-container">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading dataset items...</div>
                    ) : items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No items found in this dataset.</div>
                    ) : (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="dataset-explorer__table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    className="dataset-explorer__checkbox"
                                                    checked={selectedIds.size === items.length && items.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th style={{ width: '100px' }}>Image ID</th>
                                            <th>Image</th>
                                            <th>Caption</th>
                                            <th style={{ width: '100px' }}>Similarity</th>
                                            <th style={{ width: '120px' }}>Edit Status</th>
                                            <th style={{ width: '120px' }}>Flag Status</th>
                                            <th style={{ width: '80px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => {
                                            const isSelected = selectedIds.has(item.captionId);
                                            return (
                                                <tr key={item.captionId} className={isSelected ? 'selected-row' : ''}>
                                                    <td>
                                                        <input 
                                                            type="checkbox" 
                                                            className="dataset-explorer__checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleCheckboxChange(item.captionId)}
                                                        />
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>#{item.imageId}</td>
                                                    <td>
                                                        {item.imageUrl ? (
                                                            <div 
                                                                className="dataset-explorer__img-wrapper dataset-explorer__img--clickable"
                                                                onClick={() => setPreviewImage(item.imageUrl as string)}
                                                            >
                                                                <img 
                                                                    src={item.imageUrl} 
                                                                    alt={`Image ${item.imageId}`} 
                                                                    className="dataset-explorer__img"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" fill="%231b1b1b"><rect width="120" height="80"/></svg>';
                                                                    }}
                                                                />
                                                                <div className="dataset-explorer__img-overlay">
                                                                    <HiOutlineArrowsPointingOut />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="dataset-explorer__no-img">No Image</div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <p className="dataset-explorer__caption-text">{item.captionText}</p>
                                                    </td>
                                                    <td>
                                                        {item.similarityScore !== null ? (
                                                            <span className="dataset-explorer__score">
                                                                {item.similarityScore.toFixed(4)}
                                                            </span>
                                                        ) : (
                                                            <span className="dataset-explorer__score" style={{ color: 'var(--text-muted)' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.isEdited ? (
                                                            <span className="dataset-explorer__flag okay">Yes</span>
                                                        ) : (
                                                            <span className="dataset-explorer__flag neutral">No</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.isFlagged ? (
                                                            <span className="dataset-explorer__flag flagged">Flagged</span>
                                                        ) : (
                                                            <span className="dataset-explorer__flag okay">Not Flagged</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="dataset-explorer__edit-btn"
                                                            onClick={() => openEditModal(item.captionId, item.captionText)}
                                                            title="Edit Caption"
                                                        >
                                                            <HiOutlinePencilSquare />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="dataset-explorer__pagination">
                                    <button 
                                        className="dataset-explorer__page-btn"
                                        disabled={currentPage === 0}
                                        onClick={() => goToPage(currentPage - 1)}
                                    >
                                        Previous
                                    </button>
                                    <div className="dataset-explorer__page-numbers">
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                className={`dataset-explorer__page-num ${currentPage === i ? 'active' : ''}`}
                                                onClick={() => goToPage(i)}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button 
                                        className="dataset-explorer__page-btn"
                                        disabled={currentPage >= totalPages - 1}
                                        onClick={() => goToPage(currentPage + 1)}
                                    >
                                        Next
                                    </button>
                                    <span className="dataset-explorer__page-info">
                                        {totalElements} total items
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Floating delete button */}
            {hasSelections && (
                <div className="dataset-explorer__floating-actions">
                    <button 
                        className="dataset-explorer__action-btn delete"
                        onClick={openDeleteModal}
                        disabled={isDeleting}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        {`Delete Selected (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div className="dataset-explorer__modal-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="dataset-explorer__modal-content" onClick={e => e.stopPropagation()}>
                        <button 
                            className="dataset-explorer__modal-close" 
                            onClick={() => setPreviewImage(null)}
                            aria-label="Close"
                        >
                            <HiOutlineX />
                        </button>
                        <img src={previewImage} alt="Fullscreen preview" />
                    </div>
                </div>
            )}

            {/* Edit Caption Modal */}
            {editModalOpen && (
                <div className="dataset-explorer__modal-overlay" onClick={closeEditModal}>
                    <div className="dataset-explorer__dialog" onClick={e => e.stopPropagation()}>
                        <div className="dataset-explorer__dialog-header">
                            <h3>Edit Caption</h3>
                            <button className="dataset-explorer__modal-close" onClick={closeEditModal} aria-label="Close">
                                <HiOutlineX />
                            </button>
                        </div>
                        <div className="dataset-explorer__dialog-body">
                            <textarea
                                className="dataset-explorer__edit-textarea"
                                value={editCaptionText}
                                onChange={(e) => setEditCaptionText(e.target.value)}
                                rows={5}
                            />
                        </div>
                        <div className="dataset-explorer__dialog-footer">
                            <button className="dataset-explorer__dialog-btn cancel" onClick={closeEditModal}>Cancel</button>
                            <button 
                                className="dataset-explorer__dialog-btn save" 
                                onClick={handleSaveCaption}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="dataset-explorer__modal-overlay" onClick={closeDeleteModal}>
                    <div className="dataset-explorer__dialog" onClick={e => e.stopPropagation()}>
                        <div className="dataset-explorer__dialog-header">
                            <h3>Confirm Deletion</h3>
                            <button className="dataset-explorer__modal-close" onClick={closeDeleteModal} aria-label="Close">
                                <HiOutlineX />
                            </button>
                        </div>
                        <div className="dataset-explorer__dialog-body">
                            <p className="dataset-explorer__delete-warning">
                                Are you sure you want to delete <strong>{selectedIds.size}</strong> item{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
                            </p>
                        </div>
                        <div className="dataset-explorer__dialog-footer">
                            <button className="dataset-explorer__dialog-btn cancel" onClick={closeDeleteModal}>Cancel</button>
                            <button 
                                className="dataset-explorer__dialog-btn danger" 
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatasetExplorer;
