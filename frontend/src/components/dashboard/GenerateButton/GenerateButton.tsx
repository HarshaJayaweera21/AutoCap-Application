import React from 'react';

interface GenerateButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({
  disabled,
  loading,
  onClick,
}) => {
  return (
    <button
      className="btn-primary"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: 'var(--space-4) var(--space-6)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--weight-semibold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: disabled
          ? 'var(--border-strong)'
          : 'var(--primary)',
        boxShadow: !disabled && !loading ? 'var(--shadow-glow-primary)' : 'none',
      }}
    >
      {loading && (
        <svg
          className="animate-spin"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {loading ? 'Generating...' : 'Generate Captions'}
    </button>
  );
};
