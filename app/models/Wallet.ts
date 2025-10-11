export interface Wallet {
  id: number;
  user_id: number;
  account_id: number;
  wallet_type: string;
  balance: number;
  currency: string;
  created_at: Date;
}

export interface CreateWalletRequest {
  user_id: number;
  account_id: number;
  wallet_type: string;
  currency?: string;
}

export interface UpdateWalletRequest {
  wallet_type?: string;
  balance?: number;
}