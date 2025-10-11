export interface PartnerIntegration {
  id: number;
  partner_bank_id: number;
  integration_type: string;
  created_at: Date;
}

export interface CreatePartnerIntegrationRequest {
  partner_bank_id: number;
  integration_type: string;
}