import React from 'react';

interface ErrorCardProps {
  errorMessage: string;
  onReset: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ errorMessage, onReset }) => {
  return (
    <div
      style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-5)',
        background: 'rgba(232, 74, 52, 0.06)',
        border: '1px solid rgba(232, 74, 52, 0.2)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--error)' }}>
          Generation failed
        </span>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        {errorMessage}
      </p>
      <button className="btn-secondary" onClick={onReset}>
        Try Again
      </button>
    </div>
  );
};
