export interface InterbankTransfer {
  id: number;
  from_account: number;
  to_account_number: string;
  amount: number;
  currency: string;
  status: string;
  initiated_at: Date;
  completed_at?: Date;
  // SEPA/SWIFT extensions
  transfer_type?: 'sepa' | 'swift';
  bic?: string;
  swift_code?: string;
  message_type?: string; // MT103, MT202, etc.
  sepa_scheme?: 'SCT' | 'SDD'; // SEPA Credit Transfer, SEPA Direct Debit
  beneficiary_name?: string;
  beneficiary_address?: string;
  remittance_info?: string;
  charge_bearer?: 'SHA' | 'OUR' | 'BEN'; // Shared, Ours, Beneficiary
  regulatory_reference?: string;
  compliance_status?: 'pending' | 'approved' | 'rejected';
}

export interface CreateInterbankTransferRequest {
  from_account: number;
  to_account_number: string;
  amount: number;
  currency?: string;
  // SEPA/SWIFT fields
  transfer_type?: 'sepa' | 'swift';
  bic?: string;
  swift_code?: string;
  message_type?: string;
  sepa_scheme?: 'SCT' | 'SDD';
  beneficiary_name?: string;
  beneficiary_address?: string;
  remittance_info?: string;
  charge_bearer?: 'SHA' | 'OUR' | 'BEN';
}

export interface UpdateInterbankTransferRequest {
  status?: string;
  completed_at?: Date;
  compliance_status?: 'pending' | 'approved' | 'rejected';
  regulatory_reference?: string;
}