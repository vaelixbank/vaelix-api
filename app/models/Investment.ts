export interface Investment {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  currency: string;
  created_at: Date;
}

export interface CreateInvestmentRequest {
  user_id: number;
  type: string;
  amount: number;
  currency?: string;
}