import { useState, useEffect } from 'react';
import type { JobStatus, JobStatusResponse } from '../types/dashboard.types';

export const STAGES: { status: JobStatus; label: string }[] = [
  { status: 'UPLOADING', label: 'Uploading' },
  { status: 'QUEUED', label: 'Queued' },
  { status: 'PROCESSING', label: 'Processing' },
  { status: 'GENERATING', label: 'Generating' },
  { status: 'SCORING', label: 'Scoring' },
  { status: 'COMPLETE', label: 'Complete' },
];

export const STAGE_ORDER = STAGES.map((s) => s.status);

export const useJobSimulation = (
  jobId: number | null,
  statusData: JobStatusResponse | null,
  error: string | null,
  onComplete?: () => void
) => {
  const [currentPhase, setCurrentPhase] = useState<JobStatus>('UPLOADING');
  const [simulatedProcessedCount, setSimulatedProcessedCount] = useState<number>(0);

  // Milestone simulation
  useEffect(() => {
    if (!jobId) {
      setCurrentPhase('UPLOADING');
      setSimulatedProcessedCount(0);
      return;
    }

    const t1 = setTimeout(() => setCurrentPhase('QUEUED'), 3000); 
    const t2 = setTimeout(() => setCurrentPhase('PROCESSING'), 5000);
    const t3 = setTimeout(() => setCurrentPhase('GENERATING'), 8000);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [jobId]);

  // Real-time processed count simulation during GENERATING phase
  useEffect(() => {
    if (currentPhase !== 'GENERATING' || !statusData?.totalCount) {
      if (currentPhase === 'COMPLETE') setSimulatedProcessedCount(statusData?.totalCount || 0);
      return;
    }

    const total = statusData.totalCount;
    // Aim to "complete" simulation roughly 10% before actual if long, or just a steady pace
    const interval = setInterval(() => {
      setSimulatedProcessedCount(prev => {
        if (prev >= total) return total;
        // Increment by 1 or 2 images to feel "live"
        const next = prev + Math.floor(Math.random() * 2) + 1;
        return next > total ? total : next;
      });
    }, 1500); // Progress update every 1.5s

    return () => clearInterval(interval);
  }, [currentPhase, statusData?.totalCount]);

  // Realization sync
  useEffect(() => {
    if (!jobId) return;

    if (statusData?.status === 'FAILED') {
      setCurrentPhase('FAILED');
      return;
    }

    // 1. If backend says COMPLETE but we are still in early stages, skip ahead to GENERATING
    if (statusData?.status === 'COMPLETE' && STAGE_ORDER.indexOf(currentPhase) < 3) {
      setCurrentPhase('GENERATING');
      return;
    }

    // 2. Transition from GENERATING -> SCORING
    if (currentPhase === 'GENERATING' && statusData?.status === 'COMPLETE') {
      setCurrentPhase('SCORING');
      return;
    }

    // 3. Handle the SCORING -> COMPLETE transition
    if (currentPhase === 'SCORING') {
      const t = setTimeout(() => {
        setCurrentPhase('COMPLETE');
        if (statusData?.totalCount) {
          setSimulatedProcessedCount(statusData.totalCount);
        }
        if (onComplete) onComplete();
      }, 1500); 
      return () => clearTimeout(t);
    }

    // 4. Catch-all for jobs already complete (e.g. on refresh)
    if (statusData?.status === 'COMPLETE' && currentPhase !== 'COMPLETE' && currentPhase !== 'SCORING') {
      setCurrentPhase('COMPLETE');
      if (statusData?.totalCount) {
        setSimulatedProcessedCount(statusData.totalCount);
      }
    }
  }, [jobId, currentPhase, statusData, onComplete]);

  const currentStatus = currentPhase === 'FAILED' ? 'FAILED' : (error ? 'FAILED' : currentPhase);
  const currentIndex = STAGE_ORDER.indexOf(currentStatus === 'FAILED' ? 'COMPLETE' : currentStatus);

  // Calculate overall pipeline completion (not just items processed)
  // Stages: 0, 1, 2, 3, 4, 5 (Complete)
  // Index 3 (Generating) covers the bulk of the work
  let overallPct = (currentIndex / (STAGES.length - 1)) * 100;
  
  // Refine progressPct within the GENERATING phase
  if (currentPhase === 'GENERATING' && statusData?.totalCount) {
    const itemPct = (simulatedProcessedCount / statusData.totalCount) * 100;
    // Map itemPct (0-100) into the range between GENERATING and SCORING
    // Index 3 is GENERATING, Index 4 is SCORING
    const startRange = (3 / (STAGES.length - 1)) * 100;
    const endRange = (4 / (STAGES.length - 1)) * 100;
    overallPct = startRange + (itemPct * (endRange - startRange) / 100);
  }

  return { 
    currentPhase, 
    currentStatus, 
    currentIndex,
    simulatedProcessedCount,
    progressPct: Math.round(overallPct)
  };
};
