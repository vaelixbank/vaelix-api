export interface AmlFlag {
  id: number;
  user_id: number;
  transaction_id: number;
  reason: string;
  flagged_at: Date;
}

export interface CreateAmlFlagRequest {
  user_id: number;
  transaction_id: number;
  reason: string;
}