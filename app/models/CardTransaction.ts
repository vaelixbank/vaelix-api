export interface CardTransaction {
  id: number;
  card_id: number;
  amount: number;
  currency: string;
  merchant?: string;
  status: string;
  created_at: Date;
}

export interface CreateCardTransactionRequest {
  card_id: number;
  amount: number;
  currency?: string;
  merchant?: string;
}

export interface UpdateCardTransactionRequest {
  status?: string;
}