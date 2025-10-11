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

// Mobile Authentication Models
export interface MobileUser {
  id: number;
  email: string;
  phone: string;
  full_name: string;
  device_id?: string;
  is_verified: boolean;
  kyc_status: string;
  created_at: Date;
  last_login?: Date;
}

export interface MobileLoginRequest {
  email: string;
  password?: string; // Optional for passwordless auth
  device_id: string;
  device_info?: {
    platform: 'ios' | 'android';
    version: string;
    model: string;
  };
}

export interface MobileRegisterRequest {
  email: string;
  phone: string;
  full_name: string;
  password: string;
  device_id: string;
  device_info?: {
    platform: 'ios' | 'android';
    version: string;
    model: string;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: MobileUser;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface VerificationRequest {
  code: string;
  type: 'email' | 'sms';
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
}

// Session management
export interface Session {
  id: string;
  user_id: number;
  device_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: Date;
  refresh_expires_at: Date;
  is_active: boolean;
  created_at: Date;
  last_activity: Date;
}

// Weavr integration
export interface WeavrAuthResponse {
  user_id: string;
  token: string;
  refresh_token?: string;
  expires_at: string;
}

export interface MobileAuthState {
  isAuthenticated: boolean;
  user?: MobileUser;
  tokens?: AuthTokens;
  sessionId?: string;
}