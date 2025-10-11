export interface Loan {
  id: number;
  user_id: number;
  principal: number;
  interest_rate: number;
  term_months: number;
  status: string;
  created_at: Date;
}

export interface CreateLoanRequest {
  user_id: number;
  principal: number;
  interest_rate: number;
  term_months: number;
  status?: string;
}

export interface UpdateLoanRequest {
  status?: string;
}