import React, { useEffect } from 'react';
import { useJobStatus } from '../../../hooks/useJobStatus';
import type { JobStatus } from '../../../types/dashboard.types';
import { CompletionCard } from '../CompletionCard/CompletionCard';
import { ErrorCard } from '../ErrorCard/ErrorCard';
import styles from './JobProgressTracker.module.css';

interface JobProgressTrackerProps {
  jobId: number;
  onComplete: () => void;
  onReset: () => void;
  navigate: (path: string) => void;
}

const STAGES: { status: JobStatus; label: string }[] = [
  { status: 'UPLOADING', label: 'Uploading' },
  { status: 'QUEUED', label: 'Queued' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'GENERATING', label: 'Generating' },
  { status: 'SCORING', label: 'Scoring' },
  { status: 'COMPLETE', label: 'Complete' },
];

const STAGE_ORDER = STAGES.map((s) => s.status);

export const JobProgressTracker: React.FC<JobProgressTrackerProps> = ({
  jobId,
  onComplete,
  onReset,
  navigate,
}) => {
  const { statusData, error } = useJobStatus(jobId);

  const currentStatus = statusData?.status ?? 'UPLOADING';
  const currentIndex = STAGE_ORDER.indexOf(currentStatus === 'FAILED' ? 'COMPLETE' : currentStatus);

  useEffect(() => {
    if (statusData?.status === 'COMPLETE') {
      onComplete();
    }
  }, [statusData?.status, onComplete]);

  if (error) {
    return <ErrorCard errorMessage={error} onReset={onReset} />;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Pipeline Progress</h2>

      {/* Stage stepper */}
      <div className={styles.stepper}>
        {STAGES.map((stage, index) => {
          const isCompleted = currentIndex > index;
          const isActive = currentIndex === index && currentStatus !== 'FAILED';
          const isFailed = currentStatus === 'FAILED' && index === currentIndex;

          return (
            <div key={stage.status} className={styles.step}>
              <div
                className={`${styles.stepDot} ${
                  isCompleted ? styles.completed : ''
                } ${isActive ? styles.active : ''} ${isFailed ? styles.failed : ''}`}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : isActive ? (
                  <div className={styles.pulsingDot} />
                ) : null}
              </div>
              {index < STAGES.length - 1 && (
                <div className={`${styles.stepLine} ${isCompleted ? styles.lineCompleted : ''}`} />
              )}
              <span className={`${styles.stepLabel} ${isActive ? styles.labelActive : ''} ${isCompleted ? styles.labelCompleted : ''}`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Per-stage detail */}
      <div className={styles.detail}>
        {currentStatus === 'UPLOADING' && (
          <div className={styles.progressInfo}>
            <div className={styles.progressBar}>
              <div className={`${styles.progressFill} ${styles.indeterminate}`} />
            </div>
            <span>Uploading images...</span>
          </div>
        )}
        {currentStatus === 'QUEUED' && (
          <div className={styles.progressInfo}>
            <div className={`${styles.pulsingIndicator} animate-pulse`} />
            <span>Waiting in queue...</span>
          </div>
        )}
        {(currentStatus === 'PROCESSING' || currentStatus === 'GENERATING') && (
          <div className={styles.progressInfo}>
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span>
              {statusData?.processedCount ?? 0} / {statusData?.totalCount ?? 0} images
            </span>
          </div>
        )}
        {currentStatus === 'SCORING' && (
          <div className={styles.progressInfo}>
            <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span>Calculating quality scores...</span>
          </div>
        )}
      </div>

      {currentStatus === 'COMPLETE' && statusData && statusData.datasetId && (
        <CompletionCard
          datasetId={statusData.datasetId}
          datasetName={statusData.datasetName || `Dataset #${statusData.datasetId}`}
          totalItems={statusData.totalCount}
          onDownload={() => {}}
          onView={() => navigate(`/datasets/${statusData.datasetId}`)}
        />
      )}

      {currentStatus === 'FAILED' && (
        <ErrorCard
          errorMessage={statusData?.errorMessage ?? 'An unknown error occurred.'}
          onReset={onReset}
        />
      )}
    </div>
  );
};
