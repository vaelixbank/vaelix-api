export interface MerchantProfile {
  id: number;
  name: string;
  merchant_id: string;
  country: string;
  created_at: Date;
}

export interface CreateMerchantProfileRequest {
  name: string;
  merchant_id: string;
  country: string;
}