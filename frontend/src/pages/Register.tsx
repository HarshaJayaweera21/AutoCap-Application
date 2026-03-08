import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import './Register.css';

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        dateOfBirth: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-dismiss toast after 4 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(''), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setToast('');

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const message = await response.text();

            if (!response.ok) {
                throw new Error(message || 'Registration failed');
            }

            setToast('Email verification link has been sent. Please verify your email to continue.');

            // Log the verification URL to the browser console (for dev/testing)
            const tokenMatch = message.match(/token:\s*(.+)$/i);
            if (tokenMatch) {
                const token = tokenMatch[1].trim();
                const verifyUrl = `${window.location.origin}/verify-email?token=${token}`;
                console.log('Email verification link:', verifyUrl);
            }

            // Clear form after successful registration
            setFormData({
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                password: '',
                dateOfBirth: '',
            });
            setConfirmPassword('');
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
        <>
            {/* Top-center toast */}
            {toast && (
                <div className="register-toast">
                    <span className="register-toast-icon">✉️</span>
                    {toast}
                </div>
            )}
            <div className="register-container">
                <div className="register-card">
                    <h2>Sign Up</h2>

                    <form onSubmit={handleSubmit}>
                        {/* First Name & Last Name side by side */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Password with Visibility Toggle */}
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <HiOutlineEye /> : <HiOutlineEyeSlash />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className="password-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
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
                                    {showConfirmPassword ? <HiOutlineEye /> : <HiOutlineEyeSlash />}
                                </button>
                            </div>
                            {/* Inline mismatch hint */}
                            {confirmPassword && formData.password && confirmPassword !== formData.password && (
                                <p className="password-mismatch">Passwords do not match</p>
                            )}
                        </div>

                        {/* Date of Birth */}
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth</label>
                            <input
                                id="dateOfBirth"
                                name="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Error Message */}
                        {error && <p className="error-message">{error}</p>}

                        {/* Submit Button */}
                        <button type="submit" className="register-btn" disabled={loading}>
                            {loading ? 'Signing Up...' : 'Sign Up'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="login-link">
                        Already have an account?{' '}
                        <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                            Sign In
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}

export default Register;
