import api from './axiosInstance';
import type { JobStatusResponse } from '../types/dashboard.types';

export const getJobStatus = async (
  jobId: number,
): Promise<JobStatusResponse> => {
  const { data } = await api.get<JobStatusResponse>(
    `/api/jobs/${jobId}/status`,
  );
  return data;
};
