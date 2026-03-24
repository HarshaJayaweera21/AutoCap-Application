import React from 'react';

interface CompletionCardProps {
  datasetId: number;
  datasetName: string;
  totalItems: number;
  onDownload: () => void;
  onView: () => void;
}

export const CompletionCard: React.FC<CompletionCardProps> = ({
  datasetName,
  totalItems,
  onDownload,
  onView,
}) => {
  return (
    <div
      style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-5)',
        background: 'rgba(137, 235, 121, 0.06)',
        border: '1px solid rgba(137, 235, 121, 0.2)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--success)' }}>
          Dataset created successfully!
        </span>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
        {datasetName}
      </p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
        {totalItems} image{totalItems !== 1 ? 's' : ''} processed
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button className="btn-primary" onClick={onDownload} style={{ flex: 1 }}>
          Download Dataset
        </button>
        <button className="btn-secondary" onClick={onView} style={{ flex: 1 }}>
          View Dataset
        </button>
      </div>
    </div>
  );
};
