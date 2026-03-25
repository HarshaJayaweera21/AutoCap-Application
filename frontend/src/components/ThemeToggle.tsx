import { useState, useEffect } from 'react';

function ThemeToggle() {
    const [isDark, setIsDark] = useState(() => {
        return localStorage.getItem('docs-theme') === 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('docs-theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    return (
        <button
            className="theme-toggle-btn"
            onClick={() => setIsDark(prev => !prev)}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
        >
            {isDark ? '🌙' : '☀️' }
        </button>
    );
}

export default ThemeToggle;
