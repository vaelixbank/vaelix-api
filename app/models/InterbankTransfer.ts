export interface InterbankTransfer {
  id: number;
  from_account: number;
  to_account_number: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: Date;
  completed_at?: Date;
}

export interface CreateInterbankTransferRequest {
  from_account: number;
  to_account_number: string;
  amount: number;
  currency?: string;
}

export interface UpdateInterbankTransferRequest {
  status?: string;
  completed_at?: Date;
}