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
import { DatasetTrendsChart, ModelDistributionChart, SimilarityGauge } from '../../components/dashboard/DashboardCharts';
import { uploadImages } from '../../api/uploadApi';
import { getRecentDatasets, downloadDataset, getMyDatasets, deleteDataset, renameDataset } from '../../api/datasetApi';
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

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ id: number; name: string } | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  const navigate = useNavigate();

  const hasActiveJob = state.activeJobId !== null;
  const canGenerate = state.selectedFiles.length > 0 && !hasActiveJob && !isUploading;

  const { data: recentDatasets = [], isLoading: datasetsLoading, refetch: refetchDatasets } = useQuery({
    queryKey: ['recentDatasets'],
    queryFn: () => getRecentDatasets(10),
    refetchOnWindowFocus: false,
  });

  const { data: allDatasets = [], isLoading: allDatasetsLoading, refetch: refetchAllDatasets } = useQuery({
    queryKey: ['allDatasets'],
    queryFn: getMyDatasets,
    refetchOnWindowFocus: false,
  });

  /* ── Computed stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalImages = allDatasets.reduce((acc, d) => acc + (d.totalItems ?? 0), 0);
    const withScore = allDatasets.filter((d) => d.averageSimilarity != null);
    const avgScore =
      withScore.length > 0
        ? withScore.reduce((acc, d) => acc + (d.averageSimilarity ?? 0), 0) / withScore.length
        : null;

    let scoreTrend = undefined;
    if (recentDatasets.length >= 2) {
      const latest = recentDatasets[0].averageSimilarity || 0;
      const prev = recentDatasets[1].averageSimilarity || 0;
      if (prev > 0) {
        const diff = ((latest - prev) / prev) * 100;
        const direction = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'neutral';
        scoreTrend = {
          value: Math.abs(Math.round(diff * 10) / 10),
          direction: direction as 'up'|'down'|'neutral',
          label: 'vs last'
        };
      }
    }

    return {
      totalImages,
      totalDatasets: allDatasets.length,
      avgScore,
      scoreTrend,
    };
  }, [allDatasets, recentDatasets]);

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

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const handleDeleteDataset = useCallback(async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteDataset(id);
      refetchDatasets();
      refetchAllDatasets();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete dataset');
    }
  }, [refetchDatasets, refetchAllDatasets]);

  const handleRenameDataset = useCallback((id: number, currentName: string) => {
    setModalData({ id, name: currentName });
    setNewNameInput(currentName);
    setIsRenameModalOpen(true);
  }, []);

  const submitRename = async () => {
    if (!modalData || !newNameInput.trim() || newNameInput === modalData.name) {
      setIsRenameModalOpen(false);
      return;
    }
    try {
      await renameDataset(modalData.id, newNameInput.trim());
      refetchDatasets();
      refetchAllDatasets();
      setIsRenameModalOpen(false);
    } catch (err) {
      console.error('Rename failed', err);
      alert('Failed to rename dataset');
    }
  };

  const handleCopyId = useCallback((id: number) => {
    navigator.clipboard.writeText(id.toString());
    // Could add a toast here
  }, []);

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
    refetchAllDatasets();
  }, [refetchDatasets, refetchAllDatasets]);

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

  /* ── Badge helpers for stats cards ─────────────────────────────── */
  const scoreBadge = stats.avgScore != null && stats.avgScore >= 0.85
    ? 'High Accuracy'
    : stats.avgScore != null && stats.avgScore >= 0.7
    ? 'Good'
    : undefined;

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <Header />
      <div className={`${styles.container} ${styles.fadeIn}`}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className={styles.header}>
          <h1 className={styles.title}>Generate Captions</h1>
          <p className={styles.subtitle}>
            Initiate new image captioning and validation jobs using our high-precision editorial AI models.
          </p>
        </header>

        {/* ── Stats Row ────────────────────────────────────────────── */}
        <div className={styles.statsRow}>
          <StatsCard
            icon={<ImagesIcon />}
            label="Total Images Processed"
            value={allDatasetsLoading ? '—' : stats.totalImages.toLocaleString()}
            badge={stats.totalImages > 0 ? `+${Math.min(12, Math.round(stats.totalImages / 100))}%` : undefined}
            badgeVariant="success"
            variant="primary"
          />
          <StatsCard
            icon={<DatabaseIcon />}
            label="Total Datasets Created"
            value={allDatasetsLoading ? '—' : stats.totalDatasets}
            badge="Stable"
            badgeVariant="default"
            variant="primary"
          />
          <StatsCard
            icon={<ScoreIcon />}
            label="Avg Similarity Score"
            value={
              allDatasetsLoading
                ? '—'
                : stats.avgScore != null
                ? stats.avgScore.toFixed(2)
                : 'N/A'
            }
            badge={scoreBadge}
            badgeVariant="info"
            variant="accent"
            trend={stats.scoreTrend}
            onClick={() => setFilterHighQuality(!filterHighQuality)}
            isActive={filterHighQuality}
          />
          <StatsCard
            icon={<ActivityIcon />}
            label="Active Jobs"
            value={hasActiveJob ? '1' : '0'}
            badge={hasActiveJob ? 'Running' : undefined}
            badgeVariant="success"
            variant={hasActiveJob ? 'success' : 'neutral'}
          />
        </div>

        {/* ── Middle Row: Charts + Create Form ──────────────────────── */}
        <div className={styles.middleRow}>
          {/* Left — Charts Column */}
          <div className={styles.chartArea}>
            <DatasetTrendsChart datasets={recentDatasets} />
            <div className={styles.chartSubRow}>
              <ModelDistributionChart datasets={recentDatasets} />
              <SimilarityGauge score={stats.avgScore} />
            </div>
          </div>

          {/* Right — Create New Dataset Form */}
          <div className={styles.createFormCard}>
            <div className={styles.createFormHeader}>
              <h2 className={styles.createFormTitle}>
                {hasActiveJob ? 'Job Running' : 'Create New Dataset'}
              </h2>
              {!hasActiveJob && (
                <span className={styles.createFormBadge}>
                  {state.selectedFiles.length} {state.selectedFiles.length === 1 ? 'image' : 'images'}
                </span>
              )}
            </div>

            <div className={styles.createFormBody}>
              {!hasActiveJob ? (
                <>
                  {/* Wizard stepper */}
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
                      <DatasetNameInput
                        name={state.datasetName}
                        description={state.datasetDescription}
                        onNameChange={(name) => dispatch({ type: 'SET_DATASET_NAME', payload: name })}
                        onDescriptionChange={(desc) => dispatch({ type: 'SET_DATASET_DESC', payload: desc })}
                        disabled={isUploading}
                      />

                      <UploadZone
                        selectedFiles={state.selectedFiles}
                        onFilesAdded={(files) => dispatch({ type: 'ADD_FILES', payload: files })}
                        onFileRemoved={(id) => dispatch({ type: 'REMOVE_FILE', payload: id })}
                        onClearAll={() => dispatch({ type: 'CLEAR_FILES' })}
                        disabled={isUploading}
                      />
                    </>
                  )}

                  {currentStep === 2 && (
                    <BlipConfigPanel
                      config={state.blipConfig}
                      onChange={(config) => dispatch({ type: 'SET_BLIP_CONFIG', payload: config })}
                    />
                  )}

                  {currentStep === 3 && (
                    <>
                      <div className={styles.summaryBox}>
                        <h3 className={styles.summaryTitle}>Dataset Summary</h3>
                        <div className={styles.summaryGrid}>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Name</span>
                            <span className={styles.summaryValue}>
                              {state.datasetName.trim() || `Dataset — ${new Date().toLocaleDateString()}`}
                            </span>
                          </div>
                          {state.datasetDescription && (
                            <div className={styles.summaryItem}>
                              <span className={styles.summaryLabel}>Description</span>
                              <span className={styles.summaryValue}>{state.datasetDescription}</span>
                            </div>
                          )}
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Model</span>
                            <span className={styles.summaryValue}>
                              {state.blipConfig.modelVariant === 'caption_model' ? 'Caption Model (AutoCap-V1)' : state.blipConfig.modelVariant === 'vit_model' ? 'ViT Model (AutoCap-V2.0)' : 'Baseline Model'}
                            </span>
                          </div>
                          <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Images</span>
                            <span className={styles.summaryValue}>{state.selectedFiles.length} selected</span>
                          </div>
                        </div>

                        {/* Image preview strip */}
                        {state.selectedFiles.length > 0 && (
                          <div className={styles.summaryPreview}>
                            <span className={styles.summaryLabel}>Preview</span>
                            <div className={styles.summaryImageStrip}>
                              {state.selectedFiles.slice(0, 19).map((sf) => (
                                <img
                                  key={sf.id}
                                  src={sf.previewUrl}
                                  alt={sf.file.name}
                                  className={styles.summaryThumb}
                                />
                              ))}
                              {state.selectedFiles.length > 19 && (
                                <div className={styles.summaryThumbMore}>
                                  +{state.selectedFiles.length - 19}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
                    </>
                  )}

                  {/* Shared wizard footer — always at bottom */}
                  <div className={styles.wizardFooter}>
                    {currentStep > 1 && (
                      <button
                        className="btn-secondary"
                        onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
                        disabled={isUploading}
                      >
                        Back
                      </button>
                    )}
                    {currentStep < 3 ? (
                      <button
                        className={`btn-primary ${styles.wizardNavRight}`}
                        onClick={() => setCurrentStep((currentStep + 1) as 1 | 2 | 3)}
                        disabled={currentStep === 1 && state.selectedFiles.length === 0}
                      >
                        Next Step
                      </button>
                    ) : (
                      <div className={styles.wizardNavRight}>
                        <GenerateButton
                          disabled={!canGenerate}
                          loading={isUploading}
                          onClick={handleGenerate}
                        />
                      </div>
                    )}
                  </div>
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



        {/* ── Bottom Row: Job Monitoring + Recent Datasets ──────────── */}
        <div className={styles.bottomRow}>
          {/* Left — Active Job Monitoring */}
          <div className={styles.jobMonitorCard}>
            <div className={styles.jobMonitorHeader}>
              <span className={styles.jobMonitorIcon}>📊</span>
              <h3 className={styles.jobMonitorTitle}>Active Job Monitoring</h3>
            </div>
            {hasActiveJob ? (
              <div className={styles.jobMonitorBody}>
                <div className={styles.jobItem}>
                  <span className={styles.jobItemName}>Job #{state.activeJobId}</span>
                  <div className={styles.jobProgressBar}>
                    <div className={styles.jobProgressFill} style={{ width: '64%' }} />
                  </div>
                  <span className={styles.jobProgressPct}>64%</span>
                </div>
                <div className={styles.jobStages}>
                  <div className={styles.jobStage}>
                    <span className={styles.jobStageDotComplete} />
                    <span>Preprocessing</span>
                    <span className={styles.jobStageStatus}>Complete</span>
                  </div>
                  <div className={styles.jobStage}>
                    <span className={styles.jobStageDotComplete} />
                    <span>Extraction</span>
                    <span className={styles.jobStageStatus}>Complete</span>
                  </div>
                  <div className={styles.jobStage}>
                    <span className={styles.jobStageDotActive} />
                    <span>Generation</span>
                    <span className={styles.jobStageStatusActive}>In Progress</span>
                  </div>
                  <div className={styles.jobStage}>
                    <span className={styles.jobStageDotPending} />
                    <span className={styles.jobStagePending}>Evaluation</span>
                    <span className={styles.jobStageStatusPending}>Pending</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.jobMonitorEmpty}>
                <span className={styles.jobMonitorEmptyText}>No active jobs — start a new generation above.</span>
              </div>
            )}
          </div>

          {/* Right — Recent Datasets Table */}
          <div className={styles.recentDatasetsCard}>
            <div className={styles.recentDatasetsHeader}>
              <h3 className={styles.recentDatasetsTitle}>
                {filterHighQuality ? 'High-Quality Datasets' : 'Recent Datasets'}
              </h3>
              <button className={styles.viewAllLink} onClick={() => navigate('/my-datasets')}>
                View All Datasets
              </button>
            </div>

            {/* Column headers */}
            {!datasetsLoading && displayedDatasets.length > 0 && (
              <div className={`${styles.dsTableRow} ${styles.dsTableHeader}`}>
                <span className={styles.dsColLabel}>Name</span>
                <span className={styles.dsColLabel}>Model</span>
                <span className={styles.dsColLabel}>Count</span>
                <span className={styles.dsColLabel}>Score</span>
                <span className={styles.dsColLabel}>Actions</span>
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
              <div className={styles.dsTableBody}>
                {displayedDatasets.map((ds) => {
                  const scorePercent =
                    ds.averageSimilarity != null
                      ? Math.round(ds.averageSimilarity * 100)
                      : null;
                  const scoreColor =
                    scorePercent != null
                      ? scorePercent >= 85
                        ? 'var(--success)'
                        : scorePercent >= 75
                        ? '#d8ee10'
                        : 'var(--error)'
                      : 'var(--border-strong)';
                  return (
                    <div key={ds.id} className={styles.dsTableRow}>
                      <span className={styles.dsName} title={ds.name}>{ds.name}</span>
                      <span className={styles.dsMeta}>{ds.modelName || '—'}</span>
                      <span className={styles.dsMeta}>{(ds.totalItems ?? 0).toLocaleString()}</span>
                      <div className={styles.dsScoreWrap}>
                        <div className={styles.dsScoreBar}>
                          <div
                            className={styles.dsScoreFill}
                            style={{
                              width: scorePercent != null ? `${scorePercent}%` : '0%',
                              background: scoreColor,
                            }}
                          />
                        </div>
                        {scorePercent != null ? (
                          <span className={styles.dsScoreValue} style={{ color: scoreColor }}>
                            {(ds.averageSimilarity!).toFixed(2)}
                          </span>
                        ) : (
                          <span className={styles.dsScoreValueMuted}>—</span>
                        )}
                      </div>
                      <div className={styles.dsActions}>
                        <button
                          className={styles.dsActionBtn}
                          onClick={() => handleDownload({ id: Number(ds.id), name: ds.name })}
                          disabled={downloadingId === Number(ds.id)}
                          title="Download"
                        >
                          {downloadingId === Number(ds.id) ? '...' : '↓'}
                        </button>
                        <button
                          className={styles.dsActionBtn}
                          onClick={() => navigate(`/datasets/${ds.id}`)}
                          title="View"
                        >
                          →
                        </button>
                        <div className={styles.dsMenuContainer}>
                          <button
                            className={styles.dsMoreBtn}
                            title="More actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === Number(ds.id) ? null : Number(ds.id));
                            }}
                          >
                            <MoreIcon />
                          </button>
                          {activeMenuId === Number(ds.id) && (
                            <div className={styles.dsMenu} onClick={(e) => e.stopPropagation()}>
                              <button className={styles.dsMenuItem} onClick={() => { navigate(`/datasets/${ds.id}`); setActiveMenuId(null); }}>
                                <span>→</span> View Details
                              </button>
                              <button className={styles.dsMenuItem} onClick={() => { handleRenameDataset(Number(ds.id), ds.name); setActiveMenuId(null); }}>
                                <EditIcon /> Rename
                              </button>
                              <button className={styles.dsMenuItem} onClick={() => { handleCopyId(Number(ds.id)); setActiveMenuId(null); }}>
                                <CopyIcon /> Copy ID
                              </button>
                              <div className={styles.dsMenuDivider} />
                              <button className={`${styles.dsMenuItem} ${styles.dsMenuDelete}`} onClick={() => { handleDeleteDataset(Number(ds.id), ds.name); setActiveMenuId(null); }}>
                                <TrashIcon /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Rename Modal ────────────────────────────────────────────── */}
      {isRenameModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsRenameModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Rename Dataset</h2>
            <p className={styles.modalDescription}>
              Update the identifier for this dataset. This will be reflected across all your workspaces.
            </p>
            <div className={styles.modalBody}>
              <label className={styles.modalInputLabel}>Dataset Name</label>
              <input
                autoFocus
                className={styles.modalInput}
                value={newNameInput}
                onChange={(e) => setNewNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                placeholder="Enter workspace name..."
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={() => setIsRenameModalOpen(false)}>
                Cancel
              </button>
              <button
                className={styles.modalSaveBtn}
                disabled={!newNameInput.trim() || newNameInput === modalData?.name}
                onClick={submitRename}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
