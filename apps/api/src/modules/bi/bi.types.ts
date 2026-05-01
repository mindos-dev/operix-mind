export type BiDataSourceType =
  | 'file_excel'
  | 'file_csv'
  | 'file_json'
  | 'file_pdf'
  | 'file_xml'
  | 'file_txt'
  | 'postgres'
  | 'mysql'
  | 'sqlserver'
  | 'rest_api'
  | 'internal_mindia_metrics'
  | 'powerbi_embedded_future';

export type BiDataSourceStatus = 'active' | 'error' | 'disabled' | 'not_configured';
export type BiDatasetStatus = 'ready' | 'profiling' | 'transforming' | 'error';
export type BiAggregation = 'sum' | 'avg' | 'count' | 'count_distinct' | 'min' | 'max' | 'growth' | 'ratio' | 'rank';

export interface BiDataSourceRecord {
  id: string;
  userId: string;
  tenantId: string;
  name: string;
  type: BiDataSourceType;
  status: BiDataSourceStatus;
  configEncryptedJson?: unknown;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BiDatasetRecord {
  id: string;
  userId: string;
  tenantId: string;
  dataSourceId?: string;
  name: string;
  description: string;
  status: BiDatasetStatus;
  rowCount: number;
  columnCount: number;
  storagePath: string;
  schemaJson?: BiSchemaSummary;
  profileJson?: BiDatasetProfile;
  modelJson?: BiDatasetModel;
  createdAt: string;
  updatedAt: string;
}

export interface BiColumnSummary {
  name: string;
  detectedType: 'string' | 'number' | 'date' | 'boolean' | 'unknown';
  nullCount: number;
  uniqueCount: number;
  sampleValues: Array<string | number | boolean | null>;
  min?: number | string;
  max?: number | string;
  average?: number;
  median?: number;
  role?: 'dimension' | 'measure' | 'date' | 'key';
}

export interface BiDatasetProfile {
  rowCount: number;
  columnCount: number;
  columns: BiColumnSummary[];
  issues: string[];
  dimensionColumns: string[];
  measureColumns: string[];
  dateColumns: string[];
  possibleKeys: string[];
  suggestedTitle?: string;
}

export interface BiSchemaSummary {
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
  }>;
}

export interface BiDatasetModel {
  factTable: string;
  dimensions: string[];
  measures: string[];
  dateField?: string;
  relationships: Array<{
    from: string;
    to: string;
    type: 'many-to-one' | 'one-to-many' | 'one-to-one';
  }>;
  hierarchies: Array<{
    name: string;
    fields: string[];
  }>;
  calendarGenerated: boolean;
}

export interface BiTransformationStep {
  id: string;
  datasetId: string;
  userId: string;
  stepOrder: number;
  type: string;
  configJson?: Record<string, unknown>;
  createdAt: string;
}

export interface BiMetricRecord {
  id: string;
  datasetId: string;
  userId: string;
  name: string;
  description: string;
  expressionJson?: Record<string, unknown>;
  aggregation: BiAggregation;
  field: string;
  format: string;
  createdAt: string;
}

export interface BiDashboardWidget {
  id: string;
  type: 'kpi_card' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'table' | 'area_chart' | 'scatter_plot';
  title: string;
  metricId?: string;
  x?: string;
  y?: string;
  configJson?: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

export interface BiDashboardRecord {
  id: string;
  userId: string;
  tenantId: string;
  datasetId: string;
  title: string;
  description: string;
  layoutJson: { title: string; widgets: BiDashboardWidget[] };
  filtersJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface BiReportRecord {
  id: string;
  userId: string;
  dashboardId: string;
  title: string;
  summary: string;
  exportPath: string;
  createdAt: string;
}

export interface BiQueryRecord {
  id: string;
  userId: string;
  datasetId: string;
  question: string;
  answer: string;
  queryJson?: Record<string, unknown>;
  createdAt: string;
}

export interface BiCreateDataSourceInput {
  name: string;
  type: BiDataSourceType;
  config?: Record<string, unknown>;
}

export interface BiUploadDatasetResult {
  dataSource: BiDataSourceRecord;
  dataset: BiDatasetRecord;
  profile: BiDatasetProfile;
  model: BiDatasetModel;
  metrics: BiMetricRecord[];
  dashboard: BiDashboardRecord;
}
