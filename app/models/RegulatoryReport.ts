export interface RegulatoryReport {
  id: number;
  report_type: string;
  content: string;
  generated_at: Date;
}

export interface CreateRegulatoryReportRequest {
  report_type: string;
  content: string;
}