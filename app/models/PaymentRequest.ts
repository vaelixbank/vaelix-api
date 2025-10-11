export interface PaymentRequest {
  id: number;
  account_id: number;
  amount: number;
  currency: string;
  status: string;
  created_at: Date;
}

export interface CreatePaymentRequest {
  account_id: number;
  amount: number;
  currency?: string;
}

export interface UpdatePaymentRequest {
  status?: string;
}