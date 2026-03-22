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
        <div className="forgot-container">
            <div className="forgot-card">
                <h2>Forgot Password</h2>
                <p className="forgot-subtitle">
                    Enter your email address and we'll generate a password reset link.
                </p>

                {!success ? (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button type="submit" className="forgot-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="success-block">
                        <p className="success-message">
                            Password reset link has been sent. Please check your email to reset your password.
                        </p>
                    </div>
                )}

                <p className="back-link">
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                        ← Back to Login
                    </a>
                </p>
            </div>
        </div>
    );
}

export default ForgotPassword;
