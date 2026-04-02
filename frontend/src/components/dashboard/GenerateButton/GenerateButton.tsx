import React from 'react';
import styles from './GenerateButton.module.css';

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
      className={styles.btn}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
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
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z" />
        </svg>
      )}
      <span className={styles.label}>
        {loading ? 'Generating...' : 'GENERATE CAPTIONS'}
      </span>
    </button>
  );
};
