import React from 'react';
import type { RecentDataset } from '../../../types/dashboard.types';

interface DatasetCardProps {
  dataset: RecentDataset;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({ dataset }) => {
  const formattedDate = new Date(dataset.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Name */}
      <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
        {dataset.name}
      </h3>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Model</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{dataset.modelName || '—'}</span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Images</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{dataset.totalItems ?? 0}</span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Avg Score</span>
          <span style={{ fontSize: 'var(--text-sm)', color: dataset.averageSimilarity ? 'var(--accent)' : 'var(--text-muted)' }}>
            {dataset.averageSimilarity != null ? (dataset.averageSimilarity * 100).toFixed(1) + '%' : '—'}
          </span>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Created</span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{formattedDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button className="btn-secondary" style={{ flex: 1, padding: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          Download
        </button>
        <button className="btn-secondary" style={{ flex: 1, padding: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          View
        </button>
      </div>
    </div>
  );
};
