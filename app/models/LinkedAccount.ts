export interface LinkedAccount {
  id: string;
  profile_id: string;
  name: string;
  state: 'active' | 'blocked' | 'closed';
  type: 'checking' | 'savings' | 'business';
  currency: string;
  balance?: {
    available: number;
    current: number;
  };
  account_identifiers: AccountIdentifier[];
  bank_details: BankDetails;
  created_at: string;
  updated_at: string;
}

export interface AccountIdentifier {
  type: 'iban' | 'bban' | 'account_number' | 'sort_code';
  identification: string;
}

export interface BankDetails {
  name: string;
  bic?: string;
  country_code: string;
}

export interface CreateLinkedAccountRequest {
  name: string;
  type: 'checking' | 'savings' | 'business';
  currency: string;
  account_identifiers: AccountIdentifier[];
  bank_details: BankDetails;
  tag?: string;
}

export interface UpdateLinkedAccountRequest {
  name?: string;
  tag?: string;
}

export interface LinkedAccountVerification {
  id: string;
  linked_account_id: string;
  type: 'micro_deposit' | 'ownership_verification';
  state: 'pending' | 'completed' | 'failed';
  details?: any;
  created_at: string;
  completed_at?: string;
}