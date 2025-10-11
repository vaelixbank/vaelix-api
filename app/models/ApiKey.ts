export type ApiKeyType = 'client' | 'server';

export interface ApiKey {
  id: number;
  user_id: number;
  key: string;
  secret: string;
  type: ApiKeyType;
  description?: string;
  expires_at?: Date;
  created_at: Date;
}

export interface CreateApiKeyRequest {
  user_id: number;
  type: ApiKeyType;
  description?: string;
  expires_at?: Date;
}

export interface UpdateApiKeyRequest {
  description?: string;
  expires_at?: Date;
}