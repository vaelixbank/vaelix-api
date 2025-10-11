export interface PartnerBank {
  id: number;
  name: string;
  swift_code: string;
  country: string;
  created_at: Date;
}

export interface CreatePartnerBankRequest {
  name: string;
  swift_code: string;
  country: string;
}