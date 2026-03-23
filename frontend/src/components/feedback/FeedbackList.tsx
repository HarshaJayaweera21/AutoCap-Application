import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from '../../hooks/useFeedback';
import { Feedback } from '../../types/feedback';
import { getStatusColor, getStatusDisplay, formatDate } from '../../utils/feedbackHelpers';
import './feedback.css';

interface FeedbackListProps {
    onFeedbackClick?: (id: number) => void;
    onNewFeedbackClick?: () => void;
    onEditFeedbackClick?: (id: number) => void;
    onDeleteFeedbackClick?: (id: number) => void;
}

const FeedbackList: React.FC<FeedbackListProps> = ({ onFeedbackClick, onNewFeedbackClick, onEditFeedbackClick, onDeleteFeedbackClick }) => {
    const { getAllFeedback, loading, error, deleteFeedback } = useFeedback();
    const navigate = useNavigate();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    const types = ['Bug Report', 'Feature Request', 'General', 'Caption Quality'];
    const statuses = ['New', 'In Review', 'Resolved', "Won't Fix"];

    const currentUserId = parseInt(localStorage.getItem('user_id') || '2', 10);

    const fetchFeedbacks = async () => {
        const params: any = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.type = typeFilter;

        const data = await getAllFeedback(params);
        if (data) setFeedbacks(data);
    };

    useEffect(() => {
        fetchFeedbacks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, typeFilter]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFeedbacks();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            await deleteFeedback(id);
            fetchFeedbacks(); // Refresh list
        }
    };

    if (error) {
        return <div className="fb-module-container"><div className="fb-text" style={{ color: 'var(--fb-error)' }}>Error: {error}</div></div>;
    }

    return (
        <div className="fb-module-container">
            <div className="fb-header-actions">
                <div>
                    <h1 className="fb-h1">Feedback & Suggestions</h1>
                    <p className="fb-subtext">Help us improve AutoCap Data Engine</p>
                </div>

                {onNewFeedbackClick && (
                    <button className="fb-btn fb-btn-primary" onClick={onNewFeedbackClick}>
                        + Submit Feedback
                    </button>
                )}
            </div>

            <div className="fb-header-actions" style={{ backgroundColor: 'var(--fb-surface)', padding: '1rem', borderRadius: '12px', borderColor: 'var(--fb-border)', borderWidth: '1px', borderStyle: 'solid' }}>
                <form className="fb-search-bar" onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        className="fb-input"
                        placeholder="Search feedback..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <div className="fb-filters">
                    <select
                        className="fb-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        className="fb-select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {loading && feedbacks.length === 0 ? (
                <div className="fb-grid">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="fb-card fb-skeleton" style={{ height: '200px' }} />
                    ))}
                </div>
            ) : (
                <div className="fb-grid">
                    {feedbacks.length === 0 ? (
                        <div className="fb-text fb-subtext" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                            No feedback found matching your criteria.
                        </div>
                    ) : (
                        feedbacks.map(fb => (
                            <div key={fb.id} className="fb-card" onClick={() => onFeedbackClick && onFeedbackClick(fb.id)} style={{ cursor: onFeedbackClick ? 'pointer' : 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="fb-badge" style={{ backgroundColor: `${getStatusColor(fb.status)}20`, color: getStatusColor(fb.status) }}>
                                        {getStatusDisplay(fb.status)}
                                    </span>
                                    <span className="fb-subtext">{formatDate(fb.created_at)}</span>
                                </div>
                                <h2 className="fb-h2" style={{ margin: '0.5rem 0' }}>{fb.subject || fb.type}</h2>
                                <p className="fb-text fb-subtext" style={{ flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                    {fb.message}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--fb-border)', paddingTop: '1rem' }}>
                                    {fb.rating && (
                                        <div className="fb-stars">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`fb-star ${s <= (fb.rating || 0) ? 'active' : ''}`} style={{ fontSize: '16px' }}>★</span>
                                            ))}
                                        </div>
                                    )}
                                    {fb.user_id === currentUserId && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {onEditFeedbackClick && (
                                                <button
                                                    className="fb-btn fb-btn-secondary"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/feedback/edit/${fb.id}`); }}
                                                    style={{ fontSize: '12px', padding: '0.25rem 0.5rem' }}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            {onDeleteFeedbackClick ? (
                                                <button
                                                    className="fb-btn fb-btn-danger"
                                                    onClick={(e) => { e.stopPropagation(); onDeleteFeedbackClick(fb.id); }}
                                                    style={{ fontSize: '12px', padding: '0.25rem 0.5rem' }}
                                                >
                                                    Delete
                                                </button>
                                            ) : (
                                                <button
                                                    className="fb-btn fb-btn-danger"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(fb.id); }}
                                                    style={{ fontSize: '12px', padding: '0.25rem 0.5rem' }}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default FeedbackList;