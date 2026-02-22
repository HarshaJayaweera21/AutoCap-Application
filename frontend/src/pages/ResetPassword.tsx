import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const message = await response.text();

            if (!response.ok) {
                throw new Error(message || 'Password reset failed');
            }

            setSuccess(message);

            // Redirect to login after 2 seconds
            setTimeout(() => navigate('/login'), 2000);
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

    if (!token) {
        return (
            <div className="reset-container">
                <div className="reset-card">
                    <div className="reset-icon error">❌</div>
                    <h2>Invalid Link</h2>
                    <p>No reset token provided.</p>
                    <button className="reset-btn" onClick={() => navigate('/forgot-password')}>
                        Go to Forgot Password
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-container">
            <div className="reset-card">
                <h2>Reset Password</h2>
                <p className="reset-subtitle">Enter your new password below.</p>

                <form onSubmit={handleSubmit}>
                    {/* New Password */}
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <div className="password-wrapper">
                            <input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && <p className="error-message">{error}</p>}

                    {/* Success Message */}
                    {success && (
                        <p className="success-message">
                            {success} Redirecting to login...
                        </p>
                    )}

                    {/* Submit Button */}
                    <button type="submit" className="reset-btn" disabled={loading || !!success}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
