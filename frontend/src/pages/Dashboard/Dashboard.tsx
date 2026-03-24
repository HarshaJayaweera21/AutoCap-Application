import React, { useReducer, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DEFAULT_BLIP_CONFIG } from '../../types/dashboard.types';
import type { DashboardFormState } from '../../types/dashboard.types';
import { dashboardReducer } from './dashboardReducer';
import Header from '../../components/Header';
import { UploadZone } from '../../components/dashboard/UploadZone/UploadZone';
import { BlipConfigPanel } from '../../components/dashboard/BlipConfigPanel/BlipConfigPanel';
import { DatasetNameInput } from '../../components/dashboard/DatasetNameInput/DatasetNameInput';
import { GenerateButton } from '../../components/dashboard/GenerateButton/GenerateButton';
import { JobProgressTracker } from '../../components/dashboard/JobProgressTracker/JobProgressTracker';
import { StatsCard } from '../../components/dashboard/StatsCard/StatsCard';
import { uploadImages } from '../../api/uploadApi';
import { getRecentDatasets, downloadDataset } from '../../api/datasetApi';
import styles from './Dashboard.module.css';

const initialState: DashboardFormState = {
  selectedFiles: [],
  datasetName: '',
  datasetDescription: '',
  blipConfig: DEFAULT_BLIP_CONFIG,
  activeJobId: null,
  activeDatasetId: null,
  jobStatus: null,
};

/* ─── SVG icon helpers ─────────────────────────────────────────── */
const ImagesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const ScoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);


const FolderIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

/* ─── Main Component ─────────────────────────────────────────────── */
export const Dashboard: React.FC = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [filterHighQuality, setFilterHighQuality] = useState(false);
  const navigate = useNavigate();

  const hasActiveJob = state.activeJobId !== null;
  const canGenerate = state.selectedFiles.length > 0 && !hasActiveJob && !isUploading;

  const { data: recentDatasets = [], isLoading: datasetsLoading, refetch: refetchDatasets } = useQuery({
    queryKey: ['recentDatasets'],
    queryFn: () => getRecentDatasets(10),
    refetchOnWindowFocus: false,
  });

  /* ── Computed stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalImages = recentDatasets.reduce((acc, d) => acc + (d.totalItems ?? 0), 0);
    const withScore = recentDatasets.filter((d) => d.averageSimilarity != null);
    const avgScore =
      withScore.length > 0
        ? withScore.reduce((acc, d) => acc + (d.averageSimilarity ?? 0), 0) / withScore.length
        : null;

    // Sparklines and Trends
    const reversed = [...recentDatasets].reverse();
    const imagesSparkline = reversed.map(d => d.totalItems || 0);
    const scoreSparkline = reversed.map(d => d.averageSimilarity || 0);

    let scoreTrend = undefined;
    if (recentDatasets.length >= 2) {
      const latest = recentDatasets[0].averageSimilarity || 0;
      const prev = recentDatasets[1].averageSimilarity || 0;
      if (prev > 0) {
        const diff = ((latest - prev) / prev) * 100;
        const direction = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'neutral';
        scoreTrend = {
          value: Math.abs(Math.round(diff * 10) / 10), // one decimal round
          direction: direction as 'up'|'down'|'neutral',
          label: 'vs last'
        };
      }
    }

    return {
      totalImages,
      totalDatasets: recentDatasets.length,
      avgScore,
      imagesSparkline,
      scoreSparkline,
      scoreTrend,
    };
  }, [recentDatasets]);

  const displayedDatasets = useMemo(() => {
    return filterHighQuality 
      ? recentDatasets.filter(ds => ds.averageSimilarity && ds.averageSimilarity >= 0.8)
      : recentDatasets;
  }, [recentDatasets, filterHighQuality]);

  /* ── Before-unload guard ─────────────────────────────────────────── */
  useEffect(() => {
    if (!hasActiveJob) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasActiveJob]);

  const handleGenerate = useCallback(async () => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const name = state.datasetName.trim() || `Dataset — ${new Date().toLocaleString()}`;
      const response = await uploadImages(
        state.selectedFiles.map((f) => f.file),
        name,
        state.datasetDescription,
        state.blipConfig,
      );
      dispatch({ type: 'SET_ACTIVE_JOB', payload: { jobId: response.jobId, datasetId: response.datasetId } });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [state.selectedFiles, state.datasetName, state.datasetDescription, state.blipConfig]);

  const handleJobComplete = useCallback(() => {
    refetchDatasets();
  }, [refetchDatasets]);

  const handleDownload = useCallback(async (ds: { id: number; name: string }) => {
    setDownloadingId(ds.id);
    try {
      await downloadDataset(ds.id, ds.name);
    } catch (err: any) {
      console.error('Download failed', err);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setUploadError(null);
    setCurrentStep(1);
  }, []);

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <Header />
      <div className={`${styles.container} ${styles.fadeIn}`}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>

            <h1 className={styles.title}>Generate Captions</h1>
            <p className={styles.subtitle}>
              Upload images, configure BLIP model parameters, and generate high-quality captions for your dataset.
            </p>
          </div>
        </header>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          <StatsCard
            icon={<ImagesIcon />}
            label="Total Images"
            value={datasetsLoading ? '—' : stats.totalImages.toLocaleString()}
            hint="Across all datasets"
            variant="primary"
            sparklineData={stats.imagesSparkline}
          />
          <StatsCard
            icon={<DatabaseIcon />}
            label="Datasets"
            value={datasetsLoading ? '—' : stats.totalDatasets}
            hint="Recent history"
            variant="primary"
          />
          <StatsCard
            icon={<ScoreIcon />}
            label="Avg Similarity"
            value={
              datasetsLoading
                ? '—'
                : stats.avgScore != null
                ? `${(stats.avgScore * 100).toFixed(1)}%`
                : 'N/A'
            }
            hint={filterHighQuality ? "Filtering: High Quality (>80%)" : "Click to filter high-quality datasets"}
            variant="accent"
            trend={stats.scoreTrend}
            sparklineData={stats.scoreSparkline}
            onClick={() => setFilterHighQuality(!filterHighQuality)}
            isActive={filterHighQuality}
          />
          <StatsCard
            icon={<ActivityIcon />}
            label="Active Jobs"
            value={hasActiveJob ? '1' : '0'}
            hint={hasActiveJob ? 'Processing now' : 'Idle'}
            variant={hasActiveJob ? 'success' : 'neutral'}
          />
        </div>

        {/* ── Main Two-Column Grid ──────────────────────────────────── */}
        <div className={styles.mainGrid}>

          {/* LEFT — Quick Generate Form (main focus) */}
          <div className={styles.leftPanel}>
            <div className={styles.sidebarPanel}>
              <div className={styles.sidebarPanelHeader}>
                <span className={styles.sidebarPanelTitle}>
                  {hasActiveJob ? 'Job Running' : 'Quick Generate'}
                </span>
                <span className={styles.sidebarBadge}>
                  {state.selectedFiles.length} {state.selectedFiles.length === 1 ? 'image' : 'images'}
                </span>
              </div>

              <div className={styles.sidebarBody}>
                {!hasActiveJob ? (
                  <>
                    <div className={styles.wizardStepper}>
                      <div className={`${styles.wizardStep} ${currentStep >= 1 ? styles.wizardStepCompleted : ''} ${currentStep === 1 ? styles.wizardStepActive : ''}`}>
                        <div className={styles.wizardStepIcon}>{currentStep > 1 ? '✓' : '1'}</div>
                        <span>Upload</span>
                      </div>
                      <div className={`${styles.wizardStepLine} ${currentStep >= 2 ? styles.wizardStepLineActive : ''}`} />
                      <div className={`${styles.wizardStep} ${currentStep >= 2 ? styles.wizardStepCompleted : ''} ${currentStep === 2 ? styles.wizardStepActive : ''}`}>
                        <div className={styles.wizardStepIcon}>{currentStep > 2 ? '✓' : '2'}</div>
                        <span>Configure</span>
                      </div>
                      <div className={`${styles.wizardStepLine} ${currentStep >= 3 ? styles.wizardStepLineActive : ''}`} />
                      <div className={`${styles.wizardStep} ${currentStep >= 3 ? styles.wizardStepCompleted : ''} ${currentStep === 3 ? styles.wizardStepActive : ''}`}>
                        <div className={styles.wizardStepIcon}>3</div>
                        <span>Generate</span>
                      </div>
                    </div>

                    {currentStep === 1 && (
                      <>
                        <UploadZone
                          selectedFiles={state.selectedFiles}
                          onFilesAdded={(files) => dispatch({ type: 'ADD_FILES', payload: files })}
                          onFileRemoved={(id) => dispatch({ type: 'REMOVE_FILE', payload: id })}
                          onClearAll={() => dispatch({ type: 'CLEAR_FILES' })}
                          disabled={isUploading}
                        />
                        <div className={styles.wizardNav}>
                          <button 
                            className={`btn-primary ${styles.wizardNavRight}`} 
                            onClick={() => setCurrentStep(2)}
                            disabled={state.selectedFiles.length === 0}
                          >
                            Next Step
                          </button>
                        </div>
                      </>
                    )}

                    {currentStep === 2 && (
                      <>
                        <DatasetNameInput
                          name={state.datasetName}
                          description={state.datasetDescription}
                          onNameChange={(name) => dispatch({ type: 'SET_DATASET_NAME', payload: name })}
                          onDescriptionChange={(desc) => dispatch({ type: 'SET_DATASET_DESC', payload: desc })}
                          disabled={isUploading}
                        />

                        <BlipConfigPanel
                          config={state.blipConfig}
                          onChange={(config) => dispatch({ type: 'SET_BLIP_CONFIG', payload: config })}
                        />

                        <div className={styles.wizardNav}>
                          <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
                            Back
                          </button>
                          <button className={`btn-primary ${styles.wizardNavRight}`} onClick={() => setCurrentStep(3)}>
                            Next Step
                          </button>
                        </div>
                      </>
                    )}

                    {currentStep === 3 && (
                      <>
                        <div className={styles.summaryBox}>
                          <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>Ready to Generate</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                            You are about to upload <strong>{state.selectedFiles.length}</strong> images to create the dataset <strong>"{state.datasetName.trim() || `Dataset — ${new Date().toLocaleDateString()}`}"</strong>.
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                            BLIP Model: {state.blipConfig.modelVariant === 'blip-base' ? 'Base' : 'Large'}
                          </p>
                        </div>

                        {uploadError && (
                          <div className={styles.uploadError}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {uploadError}
                          </div>
                        )}

                        <div className={styles.wizardNav}>
                          <button className="btn-secondary" onClick={() => setCurrentStep(2)} disabled={isUploading}>
                            Back
                          </button>
                          <div className={styles.wizardNavRight} style={{ flex: 1, marginLeft: 'var(--space-4)' }}>
                            <GenerateButton
                              disabled={!canGenerate}
                              loading={isUploading}
                              onClick={handleGenerate}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <JobProgressTracker
                    jobId={state.activeJobId!}
                    onComplete={handleJobComplete}
                    onReset={handleReset}
                    navigate={navigate}
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Recent Datasets */}
          <aside className={styles.sidebar}>
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>
                  {filterHighQuality ? 'High-Quality Datasets' : 'Recent Datasets'}
                </span>
                {!datasetsLoading && (
                  <span className={styles.panelCount}>
                    {displayedDatasets.length} {displayedDatasets.length === 1 ? 'dataset' : 'datasets'}
                  </span>
                )}
              </div>

              {/* Column headers */}
              {!datasetsLoading && displayedDatasets.length > 0 && (
                <div className={`${styles.datasetRow} ${styles.datasetRowHeader}`}>
                  <span className={styles.colLabel}>Name</span>
                  <span className={styles.colLabel}>Model</span>
                  <span className={styles.colLabel}>Images</span>
                  <span className={styles.colLabel}>Avg Score</span>
                  <span className={styles.colLabel}></span>
                </div>
              )}

              {/* Loading skeletons */}
              {datasetsLoading && (
                <div className={styles.skeletonList}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className={styles.skeletonRow} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!datasetsLoading && displayedDatasets.length === 0 && (
                <div className={styles.emptyState}>
                  <FolderIcon />
                  <p>{filterHighQuality ? 'No datasets currently match the high-quality filter.' : 'No datasets yet — upload some images to get started!'}</p>
                </div>
              )}

              {/* Dataset rows */}
              {!datasetsLoading && displayedDatasets.length > 0 && (
                <div className={styles.datasetList}>
                  {displayedDatasets.map((ds) => {
                    const scorePercent =
                      ds.averageSimilarity != null
                        ? Math.round(ds.averageSimilarity * 100)
                        : null;
                    return (
                      <div key={ds.id} className={styles.datasetRow}>
                        <span className={styles.datasetName} title={ds.name}>{ds.name}</span>
                        <span className={styles.datasetMeta}>{ds.modelName || '—'}</span>
                        <span className={styles.datasetMeta}>{ds.totalItems ?? 0}</span>
                        <div className={styles.scoreWrap}>
                          <div className={styles.scoreBar}>
                            <div
                              className={styles.scoreFill}
                              style={{ width: scorePercent != null ? `${scorePercent}%` : '0%' }}
                            />
                          </div>
                          {scorePercent != null ? (
                            <span className={styles.scoreLabel}>{scorePercent}%</span>
                          ) : (
                            <span className={styles.scoreLabelMuted}>—</span>
                          )}
                        </div>
                        <div className={styles.datasetActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleDownload({ id: Number(ds.id), name: ds.name })}
                            disabled={downloadingId === Number(ds.id)}
                          >
                            {downloadingId === Number(ds.id) ? 'Downloading…' : 'Download'}
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => navigate(`/datasets/${ds.id}`)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
