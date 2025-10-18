export type ApiKeyType = 'client' | 'server' | 'database';

export interface ApiKey {
  id: number;
  user_id: number;
  key: string;
  secret: string;
  type: ApiKeyType;
  name?: string;
  description?: string;
  expires_at?: Date;
  created_at: Date;
  // Certificate-based authentication fields
  certificate_fingerprint?: string;
  certificate_subject?: string;
  certificate_issuer?: string;
  certificate_serial?: string;
  certificate_pem?: string;
}

export interface CreateApiKeyRequest {
  user_id: number;
  type: ApiKeyType;
  name?: string;
  description?: string;
  expires_at?: Date;
  // Certificate-based authentication fields
  certificate_pem?: string;
}

export interface UpdateApiKeyRequest {
  description?: string;
  expires_at?: Date;
}