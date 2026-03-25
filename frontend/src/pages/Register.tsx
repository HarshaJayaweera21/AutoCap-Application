import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
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

    const RuleItem = ({ passed, label }: { passed: boolean; label: string }) => (
        <li className={passed ? 'rule-pass' : 'rule-fail'}>
            <span className="rule-icon">{passed ? '✓' : '✗'}</span> {label}
        </li>
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
            <div className="register-container">
                <div className="register-card">
                    <h2>Sign Up to AutoCap</h2>

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
                            {usernameExists === true && (
                                <p className="field-error">Username already taken, please choose another</p>
                            )}
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
                            {emailExists === true && (
                                <p className="field-error">Email already exists</p>
                            )}
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
                            {/* Real-time password rules */}
                            {passwordTouched && (
                                <ul className="password-rules">
                                    <RuleItem passed={passwordRules.minLength} label="At least 8 characters" />
                                    <RuleItem passed={passwordRules.hasUpper} label="At least 1 uppercase letter" />
                                    <RuleItem passed={passwordRules.hasLower} label="At least 1 lowercase letter" />
                                    <RuleItem passed={passwordRules.hasNumber} label="At least 1 number" />
                                    <RuleItem passed={passwordRules.hasSpecial} label="At least 1 special character (@$!%*?&)" />
                                </ul>
                            )}
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
                        <button
                            type="submit"
                            className="register-btn"
                            disabled={loading || isFormBlocked}
                        >
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
