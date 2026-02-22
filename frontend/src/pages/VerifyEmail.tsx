import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './VerifyEmail.css';

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No verification token provided.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8080/api/auth/verify?token=${encodeURIComponent(token)}`
                );
                const text = await response.text();

                if (response.ok) {
                    setStatus('success');
                    setMessage(text);
                } else {
                    setStatus('error');
                    setMessage(text || 'Verification failed.');
                }
            } catch {
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="verify-container">
            <div className="verify-card">
                {status === 'loading' && (
                    <>
                        <div className="verify-icon loading">⏳</div>
                        <h2>Verifying your email...</h2>
                        <p>Please wait while we verify your email address.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="verify-icon success">✅</div>
                        <h2>Email Verified!</h2>
                        <p>{message}</p>
                        <button className="verify-btn" onClick={() => navigate('/login')}>
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="verify-icon error">❌</div>
                        <h2>Verification Failed</h2>
                        <p>{message}</p>
                        <button className="verify-btn" onClick={() => navigate('/register')}>
                            Back to Register
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default VerifyEmail;
