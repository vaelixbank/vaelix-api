// DB Model
export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  kyc_status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  phone?: string;
  kyc_status?: string;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  phone?: string;
  kyc_status?: string;
}

// Weavr API interfaces
export interface AuthorisedUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  mobile?: {
    number: string;
    country_code: string;
  };
  state: 'active' | 'inactive' | 'pending';
  role: string;
  invited_by?: string;
  invited_at?: string;
  activated_at?: string;
  deactivated_at?: string;
  kyc?: KycStatus;
  created_at: string;
  updated_at: string;
}

export interface KycStatus {
  state: 'pending' | 'approved' | 'rejected' | 'incomplete';
  outcome?: string;
  reasons?: string[];
  started_at?: string;
  completed_at?: string;
}

export interface CreateUserRequest {
  name: string;
  surname: string;
  email: string;
  mobile?: {
    number: string;
    country_code: string;
  };
  role?: string;
  tag?: string;
}

export interface UpdateUserRequest {
  name?: string;
  surname?: string;
  email?: string;
  mobile?: {
    number: string;
    country_code: string;
  };
  role?: string;
  tag?: string;
}

export interface UserInviteRequest {
  email: string;
  role?: string;
}

export interface UserInvite {
  id: string;
  email: string;
  role: string;
  state: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  invited_by: string;
  created_at: string;
}

export interface BulkUserCreateRequest {
  users: CreateUserRequest[];
}

export interface BulkUserInviteRequest {
  invites: UserInviteRequest[];
}