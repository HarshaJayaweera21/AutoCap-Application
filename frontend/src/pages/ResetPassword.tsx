import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

interface PasswordRules {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
}

function validatePassword(pwd: string): PasswordRules {
    return {
        minLength: pwd.length >= 8,
        hasUpper: /[A-Z]/.test(pwd),
        hasLower: /[a-z]/.test(pwd),
        hasNumber: /\d/.test(pwd),
        hasSpecial: /[@$!%*?&]/.test(pwd),
    };
}

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // Real-time password validation
    const [passwordRules, setPasswordRules] = useState<PasswordRules>({
        minLength: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false,
    });
    const [passwordTouched, setPasswordTouched] = useState(false);
    const isPasswordValid = PASSWORD_REGEX.test(newPassword);

    const handlePasswordChange = (value: string) => {
        setNewPassword(value);
        setPasswordTouched(true);
        setPasswordRules(validatePassword(value));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!isPasswordValid) {
            setError('Password does not meet requirements.');
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

    // Requirement Item component for inline display
    const ReqItem = ({ passed, label }: { passed: boolean; label: string }) => (
        <div className={`req-item ${passed ? 'req-pass' : 'req-fail'}`}>
            <span className="material-symbols-outlined">
                {passed ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {label}
        </div>
    );

    if (!token) {
        return (
            <div className="reset-page">
                {/* Header */}
                <header className="reset-header">
                    <span className="reset-header-brand">AutoCap</span>
                    <div className="reset-header-links">
                        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Back to Login</a>
                    </div>
                </header>

                <main>
                    <div className="reset-card">
                        <div className="reset-invalid">
                            <div className="reset-icon-badge">
                                <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
                            </div>
                            <h1>Invalid Link</h1>
                            <p>No reset token provided.</p>
                            <button className="reset-btn" onClick={() => navigate('/forgot-password')}>
                                Go to Forgot Password
                            </button>
                        </div>
                    </div>
                </main>

                <div className="bg-orb bg-orb--top" />
                <div className="bg-orb bg-orb--bottom" />
            </div>
        );
    }

    return (
        <div className="reset-page">
            {/* Header */}
            <header className="reset-header">
                <span className="reset-header-brand">AutoCap</span>
                <div className="reset-header-links">
                    <a href="#">Support</a>
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Back to Login</a>
                </div>
            </header>

            {/* Card */}
            <main>
                <div className="reset-card">
                    {/* Icon badge */}
                    <div className="reset-icon-badge">
                        <span className="material-symbols-outlined">lock_reset</span>
                    </div>

                    <div className="reset-card-header">
                        <h1>Reset Password</h1>
                        <p>Enter your new password below.</p>
                    </div>

                    <form className="reset-form" onSubmit={handleSubmit}>
                        {/* New Password */}
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="reset-input-wrapper">
                                <span className="input-icon material-symbols-outlined">lock</span>
                                <input
                                    id="newPassword"
                                    type={showNewPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                >
                                    <span className="material-symbols-outlined">
                                        {showNewPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            {/* Password Requirements (inline chips) */}
                            {passwordTouched && (
                                <div className="password-requirements">
                                    <ReqItem passed={passwordRules.minLength} label="8+ Characters" />
                                    <ReqItem passed={passwordRules.hasUpper} label="Uppercase" />
                                    <ReqItem passed={passwordRules.hasLower} label="Lowercase" />
                                    <ReqItem passed={passwordRules.hasNumber} label="One number" />
                                    <ReqItem passed={passwordRules.hasSpecial} label="Special character" />
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="reset-input-wrapper">
                                <span className="input-icon material-symbols-outlined">verified_user</span>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    <span className="material-symbols-outlined">
                                        {showConfirmPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            {confirmPassword && newPassword && confirmPassword !== newPassword && (
                                <p className="password-mismatch">Passwords do not match</p>
                            )}
                        </div>

                        {/* Error / Success messages */}
                        {error && <p className="error-message">{error}</p>}
                        {success && (
                            <p className="success-message">
                                {success} Redirecting to login...
                            </p>
                        )}

                        {/* Submit */}
                        <button type="submit" className="reset-btn" disabled={loading || !!success || !isPasswordValid}>
                            <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                            {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                        </button>
                    </form>

                    {/* Return to sign in */}
                    <div className="reset-return-link">
                        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                            <span className="material-symbols-outlined">keyboard_backspace</span>
                            Return to sign in
                        </a>
                    </div>
                </div>

                {/* Branding */}
                <div className="reset-branding">
                    <p>Powered by AutoCap Neural Engine © 2024</p>
                </div>
            </main>

            <div className="bg-orb bg-orb--top" />
            <div className="bg-orb bg-orb--bottom" />
        </div>
    );
}

export default ResetPassword;
