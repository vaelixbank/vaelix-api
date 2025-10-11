export interface OpenpaydMapping {
  id: number;
  viban_id: string;
  openpayd_account_id: string;
  created_at: Date;
}

export interface CreateOpenpaydMappingRequest {
  viban_id: string;
  openpayd_account_id: string;
}