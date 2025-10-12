// DB Model
export interface Account {
  id: number;
  user_id: number;
  account_number?: string;
  account_type?: string;
  currency: string;
  balance: number;
  available_balance: number;
  blocked_balance: number;
  reserved_balance: number;
  status: string;
  // Weavr integration fields
  weavr_id?: string;
  weavr_profile_id?: string;
  iban?: string;
  bic?: string;
  account_name?: string;
  // Sync fields
  last_weavr_sync?: Date;
  sync_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountRequest {
  user_id: number;
  account_number?: string;
  account_type?: string;
  currency?: string;
  balance?: number;
  status?: string;
}

export interface UpdateAccountRequest {
  account_number?: string;
  account_type?: string;
  balance?: number;
  status?: string;
}

// Weavr API interfaces
export interface ManagedAccount {
  id: string;
  profile_id: string;
  name?: string;
  state: 'active' | 'blocked' | 'closed';
  currency: string;
  balance: {
    available: number;
    blocked: number;
    reserved: number;
  };
  iban?: string;
  bic?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateManagedAccountRequest {
  profile_id: string;
  name?: string;
  tag?: string;
  account_type?: 'current' | 'savings' | 'business' | 'bank';
}

export interface UpdateManagedAccountRequest {
  name?: string;
  tag?: string;
}

export interface ManagedAccountStatement {
  id: string;
  account_id: string;
  from_date: string;
  to_date: string;
  transactions: Transaction[];
  balance: {
    opening: number;
    closing: number;
  };
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  created_at: string;
  card_id?: string;
  counterparty?: {
    name?: string;
    iban?: string;
    bic?: string;
  };
}

export interface IBANUpgradeRequest {
  iban_country_code: string;
  iban_holder_name: string;
}