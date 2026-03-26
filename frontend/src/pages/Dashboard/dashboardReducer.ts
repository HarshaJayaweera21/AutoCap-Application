import type { DashboardFormState, BlipConfig, SelectedFile, JobStatus } from '../../types/dashboard.types';

export type DashboardAction =
  | { type: 'ADD_FILES'; payload: SelectedFile[] }
  | { type: 'REMOVE_FILE'; payload: string }
  | { type: 'CLEAR_FILES' }
  | { type: 'SET_BLIP_CONFIG'; payload: BlipConfig }
  | { type: 'SET_DATASET_NAME'; payload: string }
  | { type: 'SET_DATASET_DESC'; payload: string }
  | { type: 'SET_ACTIVE_JOB'; payload: { jobId: number; datasetId: number | null } }
  | { type: 'SET_JOB_STATUS'; payload: JobStatus }
  | { type: 'RESET' };

export const dashboardReducer = (
  state: DashboardFormState,
  action: DashboardAction
): DashboardFormState => {
  switch (action.type) {
    case 'ADD_FILES':
      return {
        ...state,
        selectedFiles: [...state.selectedFiles, ...action.payload],
      };
    case 'REMOVE_FILE': {
      const file = state.selectedFiles.find((f) => f.id === action.payload);
      if (file) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return {
        ...state,
        selectedFiles: state.selectedFiles.filter((f) => f.id !== action.payload),
      };
    }
    case 'CLEAR_FILES':
      state.selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return {
        ...state,
        selectedFiles: [],
      };
    case 'SET_BLIP_CONFIG':
      return { ...state, blipConfig: action.payload };
    case 'SET_DATASET_NAME':
      return { ...state, datasetName: action.payload };
    case 'SET_DATASET_DESC':
      return { ...state, datasetDescription: action.payload };
    case 'SET_ACTIVE_JOB':
      return {
        ...state,
        activeJobId: action.payload.jobId,
        activeDatasetId: action.payload.datasetId,
        jobStatus: 'UPLOADING',
      };
    case 'SET_JOB_STATUS':
      return { ...state, jobStatus: action.payload };
    case 'RESET':
      // Revoke all preview URLs
      state.selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return {
        selectedFiles: [],
        datasetName: '',
        datasetDescription: '',
        blipConfig: state.blipConfig,
        activeJobId: null,
        activeDatasetId: null,
        jobStatus: null,
      };
    default:
      return state;
  }
};
