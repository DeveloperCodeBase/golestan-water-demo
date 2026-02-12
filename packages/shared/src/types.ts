export type ApiEnvelope<T> = {
  request_id: string;
  data: T;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
};

export type OptimizationSummary = {
  overall_satisfaction: number;
  satisfaction_by_sector: Record<string, number>;
  drought_risk: number;
  flood_risk: number;
};
