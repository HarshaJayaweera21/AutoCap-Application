import api from './axiosInstance';
import type { RecentDataset } from '../types/dashboard.types';

export const getRecentDatasets = async (
  limit = 10,
): Promise<RecentDataset[]> => {
  const { data } = await api.get<RecentDataset[]>('/api/datasets/recent', {
    params: { limit },
  });
  return data;
};

export const downloadDataset = async (
  datasetId: number,
  datasetName: string,
): Promise<void> => {
  const response = await api.get(`/api/datasets/${datasetId}/download`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `dataset-${datasetName.replace(/\s+/g, '_')}-${datasetId}.zip`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
