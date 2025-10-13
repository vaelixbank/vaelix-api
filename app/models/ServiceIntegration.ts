export interface ServiceIntegration {
  id: number;
  service_name: string; // e.g., 'weavr'
  api_key: string;
  auth_token: string;
  base_url?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateServiceIntegrationRequest {
  service_name: string;
  api_key: string;
  auth_token: string;
  base_url?: string;
}

export interface UpdateServiceIntegrationRequest {
  api_key?: string;
  auth_token?: string;
  base_url?: string;
  is_active?: boolean;
}