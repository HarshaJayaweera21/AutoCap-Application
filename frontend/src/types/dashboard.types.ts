export type JobStatus =
  | 'UPLOADING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'GENERATING'
  | 'SCORING'
  | 'COMPLETE'
  | 'FAILED';

export interface BlipConfig {
  modelVariant: 'caption_model' | 'base_line_model' | 'vit_model';
  temperature: number;
  maxLength: number;
  minLength: number;
  numBeams: number;
  repetitionPenalty: number;
  topP: number;
}

export const DEFAULT_BLIP_CONFIG: BlipConfig = {
  modelVariant: 'vit_model',
  temperature: 1.0,
  maxLength: 50,
  minLength: 5,
  numBeams: 4,
  repetitionPenalty: 1.0,
  topP: 0.9,
};

export interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
}

export interface DashboardFormState {
  selectedFiles: SelectedFile[];
  datasetName: string;
  datasetDescription: string;
  blipConfig: BlipConfig;
  activeJobId: number | null;
  activeDatasetId: number | null;
  jobStatus: JobStatus | null;
}

export interface JobStatusResponse {
  jobId: number;
  status: JobStatus;
  processedCount: number;
  totalCount: number;
  errorMessage: string | null;
  datasetId: number | null;
  datasetName?: string;
  averageSimilarity?: number | null;
}

export interface UploadResponse {
  jobId: number;
  datasetId: number | null;
}

export interface RecentDataset {
  id: number;
  name: string;
  modelName: string;
  totalItems: number;
  averageSimilarity: number | null;
  createdAt: string;
}

export const getFormattedModelName = (modelName: string | null | undefined): string => {
  if (!modelName) return '—';
  if (modelName === 'base_line_model') return 'Baseline Model';
  if (modelName === 'caption_model') return 'Caption Model';
  if (modelName === 'vit_model') return 'ViT Model';
  return modelName;
};
