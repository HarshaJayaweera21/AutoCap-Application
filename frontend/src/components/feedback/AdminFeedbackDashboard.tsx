import React, { useEffect, useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { Feedback } from '../../types/feedback';
import { getStatusColor, formatDate } from '../../utils/feedbackHelpers';
import './feedback.css';

const AdminFeedbackDashboard: React.FC = () => {
    const { getAdminFeedback, updateFeedbackStatus, loading, error } = useFeedback();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

    const statuses = ['New', 'In Review', 'Resolved', "Won't Fix"];
    const types = ['Bug Report', 'Feature Request', 'General', 'Caption Quality'];

    const fetchFeedbacks = async () => {
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.type = typeFilter;
        if (searchQuery) params.search = searchQuery;
        const data = await getAdminFeedback(params);
        if (data) setFeedbacks(data);
    };

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchFeedbacks();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, typeFilter, searchQuery]);

    const handleStatusChange = async (id: number, newStatus: any) => {
        const updated = await updateFeedbackStatus(id, { status: newStatus });
        if (updated) {
            setFeedbacks(feedbacks.map(f => f.id === id ? updated : f));
            if (selectedFeedback?.id === id) setSelectedFeedback(updated);
        }
    };

    if (error) {
        return <div className="fb-module-container"><div className="fb-text" style={{ color: 'var(--fb-error)' }}>Error: {error}</div></div>;
    }

    return (
        <div className="fb-module-container" style={{ display: 'flex', gap: '2rem', height: '100vh', overflow: 'hidden', padding: '1rem' }}>

            {/* Left Sidebar - List */}
            <div className="fb-card" style={{ flex: '1', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 className="fb-h2" style={{ margin: 0 }}>Feedback Queue</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            className="fb-input"
                            placeholder="Search feedback..."
                            style={{ flex: '1', minWidth: '150px', padding: '0.5rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                            className="fb-select"
                            style={{ width: 'auto', padding: '0.5rem' }}
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                            className="fb-select"
                            style={{ width: 'auto', padding: '0.5rem' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                    {loading && feedbacks.length === 0 ? (
                        <div className="fb-skeleton" style={{ height: '80px', borderRadius: '8px' }} />
                    ) : feedbacks.length === 0 ? (
                        <div className="fb-subtext" style={{ textAlign: 'center', marginTop: '2rem' }}>No feedback in queue.</div>
                    ) : (
                        feedbacks.map(fb => (
                            <div
                                key={fb.id}
                                onClick={() => setSelectedFeedback(fb)}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: selectedFeedback?.id === fb.id ? 'var(--fb-bg-base)' : 'transparent',
                                    border: `1px solid ${selectedFeedback?.id === fb.id ? 'var(--fb-accent)' : 'var(--fb-border)'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    borderLeft: `4px solid ${getStatusColor(fb.status)}`
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span className="fb-text" style={{ fontWeight: 600, fontSize: '14px' }}>{fb.subject || fb.type}</span>
                                    <span className="fb-subtext" style={{ fontSize: '12px' }}>{formatDate(fb.created_at)}</span>
                                </div>
                                <div className="fb-subtext" style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fb.type} | {fb.status}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Content - Detail & Actions */}
            <div className="fb-card" style={{ flex: '2', height: '100%', overflowY: 'auto' }}>
                {selectedFeedback ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h1 className="fb-h1" style={{ marginBottom: '0.5rem' }}>{selectedFeedback.subject || selectedFeedback.type}</h1>
                                <div className="fb-subtext">
                                    Submitted: {formatDate(selectedFeedback.created_at)} | User ID: {selectedFeedback.user_id || 'Anonymous'} | Type: {selectedFeedback.type}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span className="fb-subtext">Status:</span>
                                <select
                                    className="fb-select"
                                    style={{ width: 'auto', backgroundColor: `${getStatusColor(selectedFeedback.status)}15`, borderColor: getStatusColor(selectedFeedback.status) }}
                                    value={selectedFeedback.status}
                                    onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value)}
                                >
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedFeedback.rating && (
                            <div className="fb-stars" style={{ margin: '1rem 0' }}>
                                Rating: {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} className={`fb-star ${s <= selectedFeedback.rating! ? 'active' : ''}`} style={{ fontSize: '20px' }}>★</span>
                                ))}
                            </div>
                        )}

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 className="fb-h2" style={{ fontSize: '16px' }}>Message</h3>
                            <div className="fb-text" style={{ backgroundColor: 'var(--fb-bg-base)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                                {selectedFeedback.message}
                            </div>
                        </div>

                        {selectedFeedback.screenshot_url && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 className="fb-h2" style={{ fontSize: '16px' }}>Screenshot Attachment</h3>
                                <a href={selectedFeedback.screenshot_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--fb-border)', maxWidth: '400px' }}>
                                    <img src={selectedFeedback.screenshot_url} alt="Feedback attached screenshot" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--fb-text-muted)' }}>
                        Select a feedback item from the queue to view details and update status.
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminFeedbackDashboard;
