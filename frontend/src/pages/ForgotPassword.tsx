import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const message = await response.text();

            if (!response.ok) {
                throw new Error(message || 'Failed to process request');
            }

            // Log the reset URL to the browser console (for dev/testing)
            const tokenMatch = message.match(/token:\s*(.+)$/i);
            if (tokenMatch) {
                const token = tokenMatch[1].trim();
                const resetUrl = `${window.location.origin}/reset-password?token=${token}`;
                console.log('Password reset link:', resetUrl);
            }
            setSuccess(true);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-page">
            {/* Brand Logo */}
            <div className="forgot-brand">
                <div className="forgot-brand-icon">
                    <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <span className="forgot-brand-name">AutoCap</span>
            </div>

            {/* Card */}
            <div className="forgot-card">
                <div className="forgot-card-header">
                    <h1>Forgot Password</h1>
                    <p>Enter your email address to receive a password reset link.</p>
                </div>

                {!success ? (
                    <form className="forgot-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="forgot-input-wrapper">
                                <span className="input-icon material-symbols-outlined">mail</span>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button type="submit" className="forgot-btn" disabled={loading}>
                            <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
                            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                        </button>
                    </form>
                ) : (
                    <div className="forgot-success">
                        <div className="success-icon">✉️</div>
                        <p className="success-message">
                            Password reset link has been sent. Please check your email to reset your password.
                        </p>
                    </div>
                )}

                {/* Back to Sign In */}
                <div className="forgot-back-link">
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Sign In
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div className="forgot-footer">
                <p className="forgot-footer-label">Secured by AutoCap Org</p>
                <div className="forgot-footer-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
