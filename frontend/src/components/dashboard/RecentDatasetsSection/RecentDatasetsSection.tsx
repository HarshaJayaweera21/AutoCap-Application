import React from 'react';
import type { RecentDataset } from '../../../types/dashboard.types';
import { DatasetCard } from './DatasetCard';
import styles from './RecentDatasetsSection.module.css';

interface RecentDatasetsSectionProps {
  datasets: RecentDataset[];
  isLoading: boolean;
}

export const RecentDatasetsSection: React.FC<RecentDatasetsSectionProps> = ({
  datasets,
  isLoading,
}) => {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Datasets</h2>
      </div>

      {isLoading && (
        <div className={styles.loading}>
          <div className={`${styles.skeleton}`} />
          <div className={`${styles.skeleton}`} />
          <div className={`${styles.skeleton}`} />
        </div>
      )}

      {!isLoading && datasets.length === 0 && (
        <div className={styles.empty}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p>No datasets yet. Upload some images to get started!</p>
        </div>
      )}

      {!isLoading && datasets.length > 0 && (
        <div className={styles.grid}>
          {datasets.map((ds) => (
            <DatasetCard key={ds.id} dataset={ds} />
          ))}
        </div>
      )}
    </section>
  );
};
