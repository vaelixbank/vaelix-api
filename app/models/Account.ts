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