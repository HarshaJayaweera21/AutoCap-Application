import { useState, useEffect, useRef } from 'react';
import { getJobStatus } from '../api/jobApi';
import type { JobStatusResponse } from '../types/dashboard.types';

const POLL_INTERVAL_MS = 2500;
const TERMINAL_STATES = ['COMPLETE', 'FAILED'];

export const useJobStatus = (jobId: number | null) => {
  const [statusData, setStatusData] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatusData(data);
        if (TERMINAL_STATES.includes(data.status)) {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        setError('Failed to fetch job status');
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    poll(); // immediate first call
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return { statusData, error };
};
