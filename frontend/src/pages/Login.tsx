import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Helper to set a cookie with an expiry (days)
    const setCookie = (name: string, value: string, days: number) => {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error((data && data.message) ? data.message : 'Login failed');
            }

            const data = await response.json();

            // Store token and role as cookies (expires in 7 days)
            setCookie('token', data.token, 7);
            setCookie('role', data.role, 7);

            // Redirect based on role
            if (data.role === 'ADMIN') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
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
        <div className="login-page">
            {/* ---- Left: Brand Panel ---- */}
            <section className="login-brand-panel">
                <div className="brand-content">
                    <div className="brand-logo">AutoCap</div>

                    <div>
                        <h1 className="brand-hero-title">Welcome to AutoCap</h1>
                        <p className="brand-subtitle">
                            A Domain-Specific Image Captioning and Validation System
                        </p>
                        <p className="brand-description">
                            Generate and validate image captions using advanced AI
                            models in a structured and scalable environment.
                        </p>
                    </div>

                    {/* Social proof accent */}
                    <div className="brand-social-proof">
                        <div className="avatar-stack">
                            <div className="avatar">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>person</span>
                            </div>
                            <div className="avatar">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>person</span>
                            </div>
                            <div className="avatar avatar-count">+12k</div>
                        </div>
                        <span className="social-proof-label">Trusted by AI researchers</span>
                    </div>
                </div>
            </section>

            {/* ---- Right: Form Panel ---- */}
            <section className="login-form-panel">
                <div className="login-form-wrapper">
                    {/* Form card */}
                    <div className="login-card">
                        <div className="login-card-header">
                            <h2>Sign In</h2>
                            <p>Enter your credentials to access your workspace</p>
                        </div>

                        {/* Error message */}
                        {error && <p className="error-message">{error}</p>}

                        <form className="login-form" onSubmit={handleSubmit}>
                            {/* Email */}
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-icon-wrapper">
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

                            {/* Password */}
                            <div className="form-group">
                                <div className="label-row">
                                    <label htmlFor="password">Password</label>
                                    <a
                                        href="/forgot-password"
                                        className="forgot-inline-link"
                                        onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
                                    >
                                        Forgot Password?
                                    </a>
                                </div>
                                <div className="input-icon-wrapper">
                                    <span className="input-icon material-symbols-outlined">lock</span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="has-toggle"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <span className="material-symbols-outlined">
                                            {showPassword ? 'visibility' : 'visibility_off'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" className="login-btn" disabled={loading}>
                                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                            </button>
                        </form>
                    </div>

                    {/* Footer: Sign Up */}
                    <div className="login-footer">
                        <p>
                            Don't have an account?
                            <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
                                Sign Up
                            </a>
                        </p>
                    </div>

                    {/* Auxiliary links */}
                    <div className="login-aux-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                        <a href="#">Support</a>
                    </div>
                </div>
            </section>

            {/* Floating background orbs for depth */}
            <div className="bg-orb bg-orb--top-right" />
            <div className="bg-orb bg-orb--bottom-left" />
        </div>
    );
}

export default Login;
