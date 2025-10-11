export interface VibanCard {
  id: number;
  user_id: number;
  viban_id: string;
  iban?: string;
  currency: string;
  status: string;
  created_at: Date;
}

export interface CreateVibanCardRequest {
  user_id: number;
  viban_id: string;
  iban?: string;
  currency?: string;
}

export interface UpdateVibanCardRequest {
  iban?: string;
  status?: string;
}