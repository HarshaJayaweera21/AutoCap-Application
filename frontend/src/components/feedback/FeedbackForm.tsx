import React, { useState } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { FeedbackType } from '../../types/feedback';
import './feedback.css';

interface FeedbackFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, onCancel }) => {
    const { createFeedback, loading, error } = useFeedback();

    const [type, setType] = useState<FeedbackType>('General');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);

    const types: FeedbackType[] = ['Bug Report', 'Feature Request', 'General', 'Caption Quality'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            alert("Message is required.");
            return;
        }

        const payload = {
            type,
            subject: subject.trim() || undefined,
            message,
            rating: rating > 0 ? rating : undefined
        };

        const result = await createFeedback(payload);
        if (result && onSuccess) {
            onSuccess();
        }
    };

    return (
        <div className="fb-module-container">
            <div className="fb-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 className="fb-h1">Submit Feedback</h1>

                {error && (
                    <div className="fb-text fb-subtext" style={{ color: 'var(--fb-error)', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="fb-input-group">
                        <label className="fb-label">Feedback Type</label>
                        <select
                            className="fb-select"
                            value={type}
                            onChange={e => setType(e.target.value as FeedbackType)}
                        >
                            {types.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <div className="fb-input-group">
                        <label className="fb-label">Subject</label>
                        <input
                            type="text"
                            className="fb-input"
                            placeholder="Brief summary..."
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            maxLength={120}
                        />
                    </div>

                    <div className="fb-input-group">
                        <label className="fb-label">Message <span style={{ color: 'var(--fb-error)' }}>*</span></label>
                        <textarea
                            className="fb-textarea"
                            rows={5}
                            placeholder="Please provide details..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            required
                        />
                    </div>

                    <div className="fb-input-group">
                        <label className="fb-label">Rating (Optional)</label>
                        <div className="fb-stars" style={{ gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`fb-star ${star <= rating ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    style={{ fontSize: '32px' }}
                                >
                                    ★
                                </span>
                            ))}
                            {rating > 0 && (
                                <span
                                    className="fb-subtext"
                                    style={{ cursor: 'pointer', marginLeft: '1rem', alignSelf: 'center' }}
                                    onClick={() => setRating(0)}
                                >
                                    Clear
                                </span>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="fb-btn fb-btn-secondary"
                                style={{ flex: 1 }}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="fb-btn fb-btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading || !message.trim()}
                        >
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackForm;