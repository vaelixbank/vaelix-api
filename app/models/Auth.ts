export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface BiometricLoginRequest {
  identifier: string;
  biometric_token: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface UserIdentity {
  id: string;
  type: 'consumer' | 'corporate';
  state: string;
  root_user: {
    id: string;
    state: string;
  };
}

export interface AuthenticatedRequest {
  apiKey?: string;
  authToken?: string;
}