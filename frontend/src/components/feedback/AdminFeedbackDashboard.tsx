import React, { useEffect, useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { Feedback, FeedbackStatsData } from '../../types/feedback';
import Header from '../Header';
import './AdminFeedbackDashboard.css';

const AdminFeedbackDashboard: React.FC = () => {
    const { getAdminFeedback, updateFeedbackStatus, deleteFeedback, getFeedbackStats, loading, error } = useFeedback();
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<FeedbackStatsData | null>(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

    const statuses = ['New', 'In Review', 'Resolved', "Won't Fix"];
    const types = ['Bug Report', 'Feature Request', 'General', 'Caption Quality'];

    const fetchData = async () => {
        // Fetch stats
        const statsData = await getFeedbackStats();
        if (statsData) setStats(statsData);

        // Fetch paginated/filtered list
        const params: any = {};
        if (statusFilter) params.status = statusFilter;
        if (typeFilter) params.type = typeFilter;
        if (searchQuery) params.search = searchQuery;
        
        const data = await getAdminFeedback(params);
        if (data) setFeedbacks(data);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, typeFilter, searchQuery]);

    const handleStatusChange = async (id: number, newStatus: any) => {
        const updated = await updateFeedbackStatus(id, { status: newStatus });
        if (updated) {
            setFeedbacks(feedbacks.map(f => f.id === id ? updated : f));
            if (selectedFeedback?.id === id) setSelectedFeedback(updated);
            
            // Refresh stats slightly delayed
            setTimeout(async () => {
                const statsData = await getFeedbackStats();
                if (statsData) setStats(statsData);
            }, 500);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                await deleteFeedback(id);
                setFeedbacks(feedbacks.filter(f => f.id !== id));
                if (selectedFeedback?.id === id) {
                    setSelectedFeedback(null);
                }
                setTimeout(async () => {
                    const statsData = await getFeedbackStats();
                    if (statsData) setStats(statsData);
                }, 500);
            } catch (err: any) {
                alert('Failed to delete feedback: ' + err.message);
            }
        }
    };

    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'Bug Report': return 'afb-badge-bug';
            case 'Feature Request': return 'afb-badge-feature';
            case 'Praise': return 'afb-badge-praise';
            case 'Caption Quality': return 'afb-badge-critical';
            default: return 'afb-badge-neutral';
        }
    };
    
    // Fallback static values if null
    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = Math.abs(now.getTime() - date.getTime());
        const diffInMins = Math.floor(diffInMs / (1000 * 60));
        
        if (diffInMins < 60) return `${diffInMins}m ago`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    // Derived stats
    const totalCount = stats?.total_count || 0;
    const newCount = stats?.status_breakdown?.['New'] || 0;
    const resolvedCount = stats?.status_breakdown?.['Resolved'] || 0;

    if (error) {
        return <div style={{ color: 'var(--error)', padding: '2rem' }}>Error: {error}</div>;
    }

    return (
        <div className="afb-page">
            <Header />
            <main className="afb-main">
                {/* Header section */}
                <div className="afb-header">
                    <h1 className="afb-h1">Feedback Management</h1>
                    <p className="afb-subtitle">Overview and management of the AutoCap platform user feedbacks</p>
                </div>
                
                {/* Stats Grid */}
                <div className="afb-stats-grid">
                    <div className="afb-stat-card">
                        <span className="afb-stat-label">Total Feedback</span>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <span className="afb-stat-value">{totalCount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="afb-stat-card">
                        <span className="afb-stat-label">New Feedback</span>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <span className="afb-stat-value highlight">{newCount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="afb-stat-card">
                        <span className="afb-stat-label">Resolved</span>
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <span className="afb-stat-value">{resolvedCount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Split View Area */}
                <div className="afb-split-view">
                    
                    {/* Left Panel: Scrollable List (40%) */}
                    <section className="afb-left-panel">
                        {/* Filter Bar */}
                        <div className="afb-filter-bar">
                            <div className="afb-search-wrapper">
                                <span className="material-symbols-outlined afb-search-icon">search</span>
                                <input 
                                    className="afb-search-input" 
                                    placeholder="Search feedback..." 
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select 
                                className="afb-select"
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                <option value="">Type: All</option>
                                {types.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select 
                                className="afb-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Status: All</option>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* List Content */}
                        <div className="afb-list-content">
                            {loading && feedbacks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--outline)' }}>Loading feedback...</div>
                            ) : feedbacks.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--outline)' }}>No feedback items found.</div>
                            ) : (
                                feedbacks.map(fb => (
                                    <div 
                                        key={fb.id} 
                                        className={`afb-list-item ${selectedFeedback?.id === fb.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedFeedback(fb)}
                                    >
                                        <div className="afb-item-header">
                                            <span className={`afb-item-user ${selectedFeedback?.id === fb.id ? 'selected' : ''}`}>
                                                @user_{fb.user_id || 'anon'}
                                            </span>
                                            <span className="afb-item-time">{timeSince(fb.created_at)}</span>
                                        </div>
                                        <p className="afb-item-msg">{fb.subject || fb.message}</p>
                                        <div className="afb-item-tags">
                                            <span className={`afb-badge ${getBadgeClass(fb.type)}`}>
                                                {fb.type}
                                            </span>
                                            <span className="afb-badge afb-badge-neutral">
                                                {fb.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Right Panel: Detail View (60%) */}
                    <section className="afb-right-panel">
                        {selectedFeedback ? (
                            <div className="afb-detail-view">
                                <div className="afb-detail-header">
                                    <div>
                                        <h2 className="afb-detail-title">{selectedFeedback.subject || selectedFeedback.type}</h2>
                                        <div className="afb-detail-meta">
                                            Submitted: {new Date(selectedFeedback.created_at).toLocaleString()} | User ID: {selectedFeedback.user_id || 'Anonymous'}
                                        </div>
                                    </div>
                                    <div className="afb-detail-actions">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="afb-detail-label">Status:</span>
                                            <select 
                                                className="afb-status-select"
                                                value={selectedFeedback.status}
                                                onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value)}
                                            >
                                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <button className="afb-btn-delete" onClick={() => handleDelete(selectedFeedback.id)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {selectedFeedback.rating && (
                                    <div>
                                        <h3 className="afb-detail-section-title">Experience Rating</h3>
                                        <div className="afb-stars">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <span key={s} className={`material-symbols-outlined afb-star ${s <= selectedFeedback.rating! ? 'active' : ''}`}>star</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="afb-detail-section-title">Detailed Message</h3>
                                    <div className="afb-detail-message">
                                        {selectedFeedback.message}
                                    </div>
                                </div>

                                {selectedFeedback.screenshot_url && (
                                    <div>
                                        <h3 className="afb-detail-section-title">Screenshot Attachment</h3>
                                        <a href={selectedFeedback.screenshot_url} target="_blank" rel="noopener noreferrer" className="afb-image-wrapper">
                                            <img src={selectedFeedback.screenshot_url} alt="Feedback attached screenshot" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="afb-empty-overlay"></div>
                                <div className="afb-empty-state">
                                    <div className="afb-empty-icon-wrap">
                                        <span className="material-symbols-outlined afb-empty-icon">mark_chat_unread</span>
                                    </div>
                                    <h3 className="afb-empty-title">No Feedback Selected</h3>
                                    <p className="afb-empty-desc">Select a feedback item to view details.</p>
                                </div>
                            </>
                        )}
                    </section>

                </div>
            </main>
        </div>
    );
};

export default AdminFeedbackDashboard;
