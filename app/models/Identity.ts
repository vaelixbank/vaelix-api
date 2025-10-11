export interface Consumer {
  id: string;
  type: 'consumer';
  state: string;
  root_user: RootUser;
  kyc?: KycStatus;
  created_at: string;
  updated_at: string;
}

export interface Corporate {
  id: string;
  type: 'corporate';
  state: string;
  root_user: RootUser;
  kyb?: KybStatus;
  created_at: string;
  updated_at: string;
}

export interface RootUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  state: string;
  verified: boolean;
}

export interface KycStatus {
  state: 'pending' | 'approved' | 'rejected' | 'incomplete';
  outcome?: string;
  reasons?: string[];
  started_at?: string;
  completed_at?: string;
}

export interface KybStatus {
  state: 'pending' | 'approved' | 'rejected' | 'incomplete';
  outcome?: string;
  reasons?: string[];
  started_at?: string;
  completed_at?: string;
}

export interface CreateConsumerRequest {
  root_user: {
    name: string;
    surname: string;
    email: string;
    mobile?: {
      number: string;
      country_code: string;
    };
  };
  tag?: string;
}

export interface CreateCorporateRequest {
  root_user: {
    name: string;
    surname: string;
    email: string;
    mobile?: {
      number: string;
      country_code: string;
    };
  };
  company: {
    name: string;
    registration_number?: string;
    registration_country?: string;
  };
  tag?: string;
}

export interface UpdateConsumerRequest {
  tag?: string;
}

export interface UpdateCorporateRequest {
  tag?: string;
  company?: {
    name?: string;
    registration_number?: string;
    registration_country?: string;
  };
}