import React, { useState, useEffect } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { FeedbackType, Feedback, FeedbackUpdateInput } from '../../types/feedback';
import './feedback.css';

interface FeedbackFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    feedback?: Feedback;
    feedbackId?: number;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, onCancel, feedback, feedbackId }) => {
    const { createFeedback, updateFeedback, getFeedbackById, loading, error } = useFeedback();

    const [fetchedFeedback, setFetchedFeedback] = useState<Feedback | null>(null);
    const [type, setType] = useState<FeedbackType>('General');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);

    //  Validation states
    const [messageError, setMessageError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const types: FeedbackType[] = ['Bug Report', 'Feature Request', 'General', 'Caption Quality'];

    const currentFeedback = feedback || fetchedFeedback;

    useEffect(() => {
        if (feedbackId) {
            getFeedbackById(feedbackId).then(setFetchedFeedback);
        }
    }, [feedbackId, getFeedbackById]);

    useEffect(() => {
        if (currentFeedback) {
            setType(currentFeedback.type);
            setSubject(currentFeedback.subject || '');
            setMessage(currentFeedback.message);
            setRating(currentFeedback.rating || 0);
        }
    }, [currentFeedback]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        //  Validation
        if (!message.trim()) {
            setMessageError("Please fill the message field.");
            return;
        }

        if (message.length > 500) {
            setMessageError("Message cannot exceed 500 characters.");
            return;
        }

        setMessageError('');
        setSuccessMessage('');

        const payload = {
            type,
            subject: subject.trim() || undefined,
            message,
            rating: rating > 0 ? rating : undefined
        };

        let result;
        if (currentFeedback) {
            result = await updateFeedback(currentFeedback.id, payload as FeedbackUpdateInput);
        } else {
            result = await createFeedback(payload);
        }

        if (result) {
            setSuccessMessage(
                currentFeedback
                    ? "Feedback updated successfully!"
                    : "Feedback submitted successfully!"
            );

            // Reset form if new feedback
            if (!currentFeedback) {
                setSubject('');
                setMessage('');
                setRating(0);
            }

            if (onSuccess) onSuccess();
        }
    };

    return (
        <div className="fb-module-container">
            <div className="fb-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h1 className="fb-h1">
                    {currentFeedback ? 'Update Feedback' : 'Submit Feedback'}
                </h1>

                {/* Backend error */}
                {error && (
                    <div className="fb-text fb-subtext" style={{ color: 'var(--fb-error)', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                {/* Success message */}
                {successMessage && (
                    <div className="fb-text fb-subtext" style={{ color: 'lightgreen', marginBottom: '1rem' }}>
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Feedback Type */}
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

                    {/* Subject */}
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

                    {/* Message */}
                    <div className="fb-input-group">
                        <label className="fb-label">
                            Message <span style={{ color: 'var(--fb-error)' }}>*</span>
                        </label>

                        <textarea
                            className={`fb-textarea ${messageError ? 'fb-error-border' : ''}`}
                            rows={5}
                            placeholder="Please provide details..."
                            value={message}
                            onChange={e => {
                                setMessage(e.target.value);

                                // Clear error when typing
                                if (e.target.value.trim()) {
                                    setMessageError('');
                                }
                            }}
                        />

                        {/* Error message */}
                        {messageError && (
                            <div
                                className="fb-subtext"
                                style={{ color: 'var(--fb-error)', marginTop: '0.5rem' }}
                            >
                                {messageError}
                            </div>
                        )}

                        {/* Character count */}
                        <div className="fb-subtext" style={{ marginTop: '0.3rem' }}>
                            {message.length}/500 characters
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="fb-input-group">
                        <label className="fb-label">Rating (Optional)</label>
                        <div className="fb-stars" style={{ gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`fb-star ${star <= rating ? 'active' : ''}`}
                                    onClick={() => setRating(star)}
                                    style={{ fontSize: '32px', cursor: 'pointer' }}
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

                    {/* Buttons */}
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
                            disabled={loading} // allow click even if empty
                        >
                            {loading
                                ? (currentFeedback ? 'Updating...' : 'Submitting...')
                                : (currentFeedback ? 'Update Feedback' : 'Submit Feedback')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default FeedbackForm;