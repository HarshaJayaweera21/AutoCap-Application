import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

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

    // Password validation rules state
    const [passwordRules, setPasswordRules] = useState<PasswordRules>({
        minLength: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false,
    });
    const [passwordTouched, setPasswordTouched] = useState(false);

    // Availability check state
    const [emailExists, setEmailExists] = useState<boolean | null>(null);
    const [usernameExists, setUsernameExists] = useState<boolean | null>(null);

    // Debounce refs
    const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-dismiss toast after 4 seconds
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(''), 4000);
        return () => clearTimeout(timer);
    }, [toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'password') {
            setPasswordTouched(true);
            setPasswordRules(validatePassword(value));
        }

        if (name === 'email') {
            setEmailExists(null);
            if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current);
            if (value.trim() === '') return;
            emailDebounceRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(
                        `http://localhost:8080/api/auth/check-email?email=${encodeURIComponent(value)}`
                    );
                    const exists: boolean = await res.json();
                    setEmailExists(exists);
                } catch {
                    setEmailExists(null);
                }
            }, 500);
        }

        if (name === 'username') {
            setUsernameExists(null);
            if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
            if (value.trim() === '') return;
            usernameDebounceRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(
                        `http://localhost:8080/api/auth/check-username?username=${encodeURIComponent(value)}`
                    );
                    const exists: boolean = await res.json();
                    setUsernameExists(exists);
                } catch {
                    setUsernameExists(null);
                }
            }, 500);
        }
    };

    const isPasswordValid = PASSWORD_REGEX.test(formData.password);
    const isFormBlocked = emailExists === true || usernameExists === true || !isPasswordValid;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setToast('');

        if (formData.password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (!isPasswordValid) {
            setError('Password does not meet requirements.');
            return;
        }

        if (emailExists) {
            setError('Email already exists.');
            return;
        }

        if (usernameExists) {
            setError('Username already taken, please choose another.');
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
                // Try to parse JSON error from global handler
                try {
                    const jsonErr = JSON.parse(message);
                    throw new Error(jsonErr.message || 'Registration failed');
                } catch {
                    throw new Error(message || 'Registration failed');
                }
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
            setPasswordRules({ minLength: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false });
            setPasswordTouched(false);
            setEmailExists(null);
            setUsernameExists(null);
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

    const ReqItem = ({ passed, label }: { passed: boolean; label: string }) => (
        <div className={`req-item ${passed ? 'req-pass' : 'req-fail'}`}>
            <span className="material-symbols-outlined">
                {passed ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            {label}
        </div>
    );

    return (
        <>
            {/* Top-center toast */}
            {toast && (
                <div className="register-toast">
                    <span className="register-toast-icon">✉️</span>
                    {toast}
                </div>
            )}

            <div className="register-page">
                {/* ---- Left: Brand Panel ---- */}
                <section className="register-brand-panel">
                    <div className="register-brand-content">
                        <div className="register-brand-logo">AutoCap</div>

                        <h1 className="register-brand-title">
                            Create your AutoCap account
                        </h1>
                        <p className="register-brand-description">
                            Join thousands of creators using AI to generated automated captions in seconds.
                        </p>

                        <div className="register-features">
                            <div className="register-feature">
                                <div className="register-feature-icon">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <div>
                                    <h3>AI-Powered Precision</h3>
                                    <p>99% accuracy</p>
                                </div>
                            </div>
                            <div className="register-feature">
                                <div className="register-feature-icon">
                                    <span className="material-symbols-outlined">speed</span>
                                </div>
                                <div>
                                    <h3>Instant Turnaround</h3>
                                    <p>Get your captions in less than 30 seconds.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Background Image */}
                    <div className="register-brand-bg">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6d4hh8gkDGRJafwNGrHT3tFnjCWTZNkpSrZ9uF2xUUvDjny1TMzLnkLVb0NglatQ7HZNIbj8XDuhvW5ZTsFeQp5Y0Rz0iksaJZpzKde-hdk5Hr8cXTRLHeCOiaG5lYlm3wwIxvTtzpeJ05Fm_YvtGu63eTzr7pO3i2PXtGOJ2VPPEIO5_9sgNl2XWVnLd46JNizQuj61nWPvG-SPOKJaWl0L546SCz4VLLvC_reM9th5E3FSj0l6k6WcQCGP6O6uDucK57DSu5C3o"
                            alt="Abstract flowing 3D ribbons"
                        />
                    </div>
                </section>

                {/* ---- Right: Form Panel ---- */}
                <section className="register-form-panel">
                    <div className="register-form-wrapper">
                        {/* Mobile branding */}
                        <div className="register-mobile-brand">
                            <span>AutoCap</span>
                        </div>

                        <div className="register-card">
                            <div className="register-card-header">
                                <h2>Get Started</h2>
                                <p>Fill in your details to create your premium workspace.</p>
                            </div>

                            {/* Error message */}
                            {error && <p className="error-message">{error}</p>}

                            <form className="register-form" onSubmit={handleSubmit}>
                                {/* First Name & Last Name */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="firstName">First Name</label>
                                        <input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            placeholder="John"
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
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Username & Date of Birth */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="username">Username</label>
                                        <div className="username-input-wrapper">
                                            <span className="username-prefix">@</span>
                                            <input
                                                id="username"
                                                name="username"
                                                type="text"
                                                placeholder="johndoe"
                                                value={formData.username}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        {usernameExists === true && (
                                            <p className="field-error">Username already taken, please choose another</p>
                                        )}
                                    </div>
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
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {emailExists === true && (
                                        <p className="field-error">Email already exists</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <div className="password-wrapper">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
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
                                            <span className="material-symbols-outlined">
                                                {showPassword ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </button>
                                    </div>
                                    {/* Password validation rules */}
                                    {passwordTouched && (
                                        <div className="password-requirements">
                                            <ReqItem passed={passwordRules.minLength} label="8+ Characters" />
                                            <ReqItem passed={passwordRules.hasUpper} label="Uppercase" />
                                            <ReqItem passed={passwordRules.hasLower} label="Lowercase" />
                                            <ReqItem passed={passwordRules.hasNumber} label="One number" />
                                            <ReqItem passed={passwordRules.hasSpecial} label="Special char" />
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <div className="password-wrapper">
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
                                    {confirmPassword && formData.password && confirmPassword !== formData.password && (
                                        <p className="password-mismatch">Passwords do not match</p>
                                    )}
                                </div>

                                {/* Terms */}
                                <div className="terms-row">
                                    <input type="checkbox" id="terms" required />
                                    <label htmlFor="terms">
                                        I agree to the{' '}
                                        <a href="#">Terms of Service</a> and{' '}
                                        <a href="#">Privacy Policy</a>.
                                    </label>
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="register-btn"
                                    disabled={loading || isFormBlocked}
                                >
                                    {loading ? 'Signing Up...' : 'Sign Up'}
                                </button>
                            </form>

                            {/* Footer */}
                            <footer className="register-footer">
                                <p>
                                    Already have an account?
                                    <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                                        Sign In
                                    </a>
                                </p>
                            </footer>
                        </div>

                        {/* Testimonial quote */}
                        <div className="register-testimonial">
                            <p>
                                "The most intuitive captioning tool I've ever used. Essential for my workflow."

                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default Register;
