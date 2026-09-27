export interface UploadResponse {
  success: boolean;
  filename: string;
  file_size: number;
  rows: number;
  columns: number;
  column_names: string[];
  preview: Record<string, string>[];
  message: string;
  detected_columns: Record<string, string | null>;
}

export interface DataProfile {
  total_rows: number;
  total_columns: number;
  missing_values: number;
  duplicate_rows: number;
  numeric_columns: string[];
  categorical_columns: string[];
  date_columns: string[];
  data_quality_score: number;
}

export interface KPIData {
  total_revenue?: number;
  avg_revenue?: number;
  total_quantity?: number;
  top_product?: string;
  best_region?: string;
  num_customers?: number;
  growth_pct?: number;
  revenue_trend?: Array<{month: string; sales: number}>;
  sales_by_product?: Array<{product: string; sales: number}>;
  sales_by_region?: Array<{region: string; sales: number}>;
  top5_products?: Array<{product: string; sales: number}>;
}

export interface DashboardData {
  kpis: KPIData;
  profile: DataProfile;
  anomaly_count: number;
  demo_mode: boolean;
  filename: string;
  charts: {
    revenue_trend: Array<{month: string; revenue: number}>;
    sales_by_product: Array<{product: string; revenue: number}>;
    sales_by_region: Array<{region: string; revenue: number}>;
    sales_by_category: Array<{category: string; revenue: number}>;
  };
}

export interface QueryResponse {
  question: string;
  answer: string;
  evidence: Record<string, unknown>;
  calculation: string;
  source_data: Record<string, string>[];
  business_impact: string;
  recommendation: string;
  chart_data?: {
    type: 'bar' | 'line' | 'pie';
    data: Array<{name: string; value: number}>;
  };
  demo_mode: boolean;
}

export interface Anomaly {
  row_index: number;
  column: string;
  value: number;
  lower_bound: number;
  upper_bound: number;
  severity: string;
  date?: string;
  product?: string;
  region?: string;
  source_row: Record<string, string>;
}

export interface Insight {
  title: string;
  description: string;
  evidence: Record<string, unknown>;
  category: string;
  importance: string;
}

export interface DecisionResponse {
  question: string;
  analysis: string;
  key_findings: string[];
  recommendation: string;
  confidence: string;
  supporting_data: Record<string, unknown>;
}

export interface HistoryItem {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
  dataset_name: string;
  query_type: string;
}
