export interface Dataset {
  id?: number;
  userId?: number;
  name: string;
  description?: string;
  filePath: string;
  format?: string;
  rowCount?: number;
  columnCount?: number;
  schema?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullCount?: number;
  min?: unknown;
  max?: unknown;
}

export interface ExplorerView {
  datasetId: number;
  datasetName: string;
  totalRows: number;
  totalColumns: number;
  columns: ColumnInfo[];
  sampleRows: Record<string, unknown>[];
  statistics: Record<string, unknown>;
}
