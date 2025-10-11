export interface FraudDetection {
  id: number;
  transaction_id: number;
  risk_level: string;
  flagged_at: Date;
}

export interface CreateFraudDetectionRequest {
  transaction_id: number;
  risk_level: string;
}