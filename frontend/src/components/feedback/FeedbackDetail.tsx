import React, { useEffect, useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { Feedback } from '../../types/feedback';
import { getStatusColor, getStatusDisplay, formatDate } from '../../utils/feedbackHelpers';
import './feedback.css';

interface FeedbackDetailProps {
    id: number;
    onBack?: () => void;
}

const FeedbackDetail: React.FC<FeedbackDetailProps> = ({ id, onBack }) => {
    const { getFeedbackById, loading, error } = useFeedback();
    const [feedback, setFeedback] = useState<Feedback | null>(null);

    const fetchDetail = async () => {
        const data = await getFeedbackById(id);
        if (data) setFeedback(data);
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (loading && !feedback) {
        return <div className="fb-module-container"><div className="fb-card fb-skeleton" style={{ height: '400px' }} /></div>;
    }

    if (error || !feedback) {
        return (
            <div className="fb-module-container">
                <button className="fb-btn fb-btn-secondary" onClick={onBack} style={{ marginBottom: '1rem' }}>← Back</button>
                <div className="fb-text" style={{ color: 'var(--fb-error)' }}>{error || 'Feedback not found.'}</div>
            </div>
        );
    }

    return (
        <div className="fb-module-container">
            <button className="fb-btn fb-btn-secondary" onClick={onBack} style={{ marginBottom: '1rem' }}>← Back</button>

            <div className="fb-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <span className="fb-badge" style={{ backgroundColor: `${getStatusColor(feedback.status)}20`, color: getStatusColor(feedback.status), marginBottom: '0.5rem' }}>
                            {getStatusDisplay(feedback.status)}
                        </span>
                        <h1 className="fb-h1" style={{ marginBottom: '0.5rem' }}>{feedback.subject || feedback.type}</h1>
                        <div className="fb-subtext">
                            {feedback.type} • {formatDate(feedback.created_at)}
                        </div>
                    </div>
                </div>

                {feedback.rating && (
                    <div className="fb-stars" style={{ margin: '1rem 0' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={`fb-star ${s <= feedback.rating! ? 'active' : ''}`} style={{ fontSize: '20px' }}>★</span>
                        ))}
                    </div>
                )}

                <div className="fb-text" style={{ marginTop: '2rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {feedback.message}
                </div>

                {feedback.screenshot_url && (
                    <div style={{ marginTop: '2rem' }}>
                        <h2 className="fb-h2">Screenshot</h2>
                        <a href={feedback.screenshot_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--fb-border)', maxWidth: '400px' }}>
                            <img src={feedback.screenshot_url} alt="Feedback attached screenshot" style={{ width: '100%', objectFit: 'cover', display: 'block' }} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackDetail;