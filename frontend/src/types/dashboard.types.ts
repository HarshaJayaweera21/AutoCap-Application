export type JobStatus =
  | 'UPLOADING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'GENERATING'
  | 'SCORING'
  | 'COMPLETE'
  | 'FAILED';

export interface BlipConfig {
  modelVariant: 'blip-base' | 'blip-large';
  temperature: number;
  maxLength: number;
  minLength: number;
  numBeams: number;
  repetitionPenalty: number;
  topP: number;
}

export const DEFAULT_BLIP_CONFIG: BlipConfig = {
  modelVariant: 'blip-base',
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
