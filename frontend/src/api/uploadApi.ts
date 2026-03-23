import api from './axiosInstance';
import type { BlipConfig, UploadResponse } from '../types/dashboard.types';

export const uploadImages = async (
  files: File[],
  datasetName: string,
  datasetDescription: string,
  blipConfig: BlipConfig,
): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files[]', f));
  formData.append('datasetName', datasetName);
  formData.append('datasetDescription', datasetDescription);
  // Send BLIP config as flat params (backend uses @RequestParam instead of JSON ObjectMapper)
  formData.append('modelVariant', blipConfig.modelVariant);
  formData.append('temperature', blipConfig.temperature.toString());
  formData.append('maxLength', blipConfig.maxLength.toString());
  formData.append('minLength', blipConfig.minLength.toString());
  formData.append('numBeams', blipConfig.numBeams.toString());
  formData.append('repetitionPenalty', blipConfig.repetitionPenalty.toString());
  formData.append('topP', blipConfig.topP.toString());

  const { data } = await api.post<UploadResponse>(
    '/api/images/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return data;
};
