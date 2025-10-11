export interface Saving {
  id: number;
  user_id: number;
  balance: number;
  interest_rate: number;
  currency: string;
  created_at: Date;
}

export interface CreateSavingRequest {
  user_id: number;
  balance?: number;
  interest_rate: number;
  currency?: string;
}

export interface UpdateSavingRequest {
  balance?: number;
  interest_rate?: number;
}