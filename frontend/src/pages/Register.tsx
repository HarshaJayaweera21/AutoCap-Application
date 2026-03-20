import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [verifyUrl, setVerifyUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setVerifyUrl('');
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

            setSuccess('Registration successful! Please verify your email using the link below:');

            // Parse the token from backend response: "User registered successfully. Verify using token: <uuid>"
            const tokenMatch = message.match(/token:\s*(.+)$/i);
            if (tokenMatch) {
                const token = tokenMatch[1].trim();
                setVerifyUrl(`${window.location.origin}/verify-email?token=${token}`);
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
        <div className="register-container">
            <div className="register-card">
                <h2>Register</h2>

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
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
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

                    {/* Success Message + Verification URL */}
                    {success && (
                        <div className="success-block">
                            <p className="success-message">{success}</p>
                            {verifyUrl && (
                                <div className="verify-url-box">
                                    <code className="verify-url-text">{verifyUrl}</code>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => navigator.clipboard.writeText(verifyUrl)}
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" className="register-btn" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="login-link">
                    Already have an account?{' '}
                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Register;
