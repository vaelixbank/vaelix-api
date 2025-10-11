export interface TransactionLimits {
  id: number;
  account_id: number;
  daily_limit: number;
  monthly_limit: number;
}

export interface CreateTransactionLimitsRequest {
  account_id: number;
  daily_limit?: number;
  monthly_limit?: number;
}

export interface UpdateTransactionLimitsRequest {
  daily_limit?: number;
  monthly_limit?: number;
}