import React, { useState, useEffect } from 'react';
import { useFeedback } from '../../hooks/useFeedback';
import { FeedbackType, Feedback, FeedbackUpdateInput } from '../../types/feedback';
import Header from '../Header';
import './FeedbackForm.css';

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

    // Auto-dismiss success overlay after 3 seconds
    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(''), 3000);
        return () => clearTimeout(timer);
    }, [successMessage]);

    return (
        <>
            <Header />

            {/* Success Overlay */}
            {successMessage && (
                <div className="fbform-success-overlay">
                    <div className="fbform-success-content">
                        <div className="fbform-success-icon-wrap">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <h2 className="fbform-success-title">Thank You</h2>
                        <p className="fbform-success-desc">{successMessage}</p>
                    </div>
                </div>
            )}

            <div className="fbform-page">
                {/* ---- Left: Brand Panel ---- */}
                <section className="fbform-brand">
                    <div className="fbform-brand-content">
                        {/* Community Voice badge */}
                        <div className="fbform-badge">
                            <span className="fbform-badge-dot" />
                            <span className="fbform-badge-text">Community Voice</span>
                        </div>

                        <h1 className="fbform-hero">
                            Give Us Your <br />
                            <span className="fbform-hero-gradient">Feedback</span>
                        </h1>

                        <p className="fbform-brand-desc">
                            Your insights drive the evolution of AutoCap's AI. Help us refine
                            the precision of our neural networks and editorial suite.
                        </p>

                        <div className="fbform-stats">
                            <div>
                                <div className="fbform-stat-value">99.4%</div>
                                <div className="fbform-stat-label">Uptime</div>
                            </div>
                            <div>
                                <div className="fbform-stat-value">2.4M</div>
                                <div className="fbform-stat-label">Captions</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---- Right: Form Panel ---- */}
                <section className="fbform-panel">
                    <div className="fbform-wrapper">
                        <div className="fbform-card">
                            <form className="fbform-form" onSubmit={handleSubmit}>

                                {/* Backend error */}
                                {error && (
                                    <div className="fbform-error-banner">{error}</div>
                                )}

                                {/* Star Rating */}
                                <div className="fbform-group">
                                    <span className="fbform-label">Overall Experience</span>
                                    <div className="fbform-stars">
                                        <div className="fbform-stars-group">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    className={`fbform-star-btn ${star <= rating ? 'active' : ''}`}
                                                    onClick={() => setRating(star)}
                                                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{
                                                            fontVariationSettings: star <= rating
                                                                ? "'FILL' 1"
                                                                : "'FILL' 1"
                                                        }}
                                                    >
                                                        star
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        <span className="fbform-stars-hint">
                                            Select your satisfaction level
                                        </span>
                                    </div>
                                    {rating > 0 && (
                                        <button
                                            type="button"
                                            className="fbform-stars-clear"
                                            onClick={() => setRating(0)}
                                        >
                                            Clear rating
                                        </button>
                                    )}
                                </div>

                                {/* Feedback Category */}
                                <div className="fbform-group">
                                    <label className="fbform-label" htmlFor="fb-category">
                                        Feedback Category
                                    </label>
                                    <select
                                        id="fb-category"
                                        value={type}
                                        onChange={e => setType(e.target.value as FeedbackType)}
                                    >
                                        {types.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subject Line */}
                                <div className="fbform-group">
                                    <label className="fbform-label" htmlFor="fb-subject">
                                        Subject Line
                                    </label>
                                    <input
                                        id="fb-subject"
                                        type="text"
                                        placeholder="Briefly describe your feedback..."
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        maxLength={120}
                                    />
                                </div>

                                {/* Detailed Message */}
                                <div className="fbform-group">
                                    <div className="fbform-label-row">
                                        <label className="fbform-label" htmlFor="fb-message">
                                            Detailed Message
                                        </label>
                                        <span className="fbform-charcount">
                                            {message.length} / 500
                                        </span>
                                    </div>
                                    <textarea
                                        id="fb-message"
                                        className={messageError ? 'fbform-error-border' : ''}
                                        placeholder="Tell us more about your experience..."
                                        rows={6}
                                        value={message}
                                        onChange={e => {
                                            setMessage(e.target.value);
                                            if (e.target.value.trim()) {
                                                setMessageError('');
                                            }
                                        }}
                                    />
                                    {messageError && (
                                        <div className="fbform-field-error">{messageError}</div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="fbform-submit-row">
                                    {onCancel && (
                                        <button
                                            type="button"
                                            className="fbform-cancel-btn"
                                            onClick={onCancel}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="fbform-submit-btn"
                                        disabled={loading}
                                    >
                                        <span className="fbform-btn-text">
                                            {loading
                                                ? (currentFeedback ? 'Updating...' : 'Submitting...')
                                                : (currentFeedback ? 'Update Feedback' : 'Submit Feedback')}
                                        </span>
                                        {!loading && (
                                            <span className="material-symbols-outlined">send</span>
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>

                        {/* Footer */}
                        <div className="fbform-footer">
                            <div className="fbform-footer-info">
                                <div className="fbform-footer-icon">
                                    <span className="material-symbols-outlined">security</span>
                                </div>
                                <span className="fbform-footer-text">
                                    All feedback is anonymized before processing by our research teams.
                                </span>
                            </div>
                            <div className="fbform-footer-links">
                                <a href="#">Privacy</a>
                                <a href="#">Terms</a>
                                <a href="#">Direct Support</a>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default FeedbackForm;