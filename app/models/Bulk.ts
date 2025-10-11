export interface BulkProcess {
  id: string;
  type: string;
  state: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  paused_at?: string;
  cancelled_at?: string;
}

export interface BulkOperation {
  id: string;
  bulk_id: string;
  type: string;
  state: 'pending' | 'running' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface BulkUserCreateRequest {
  users: Array<{
    name: string;
    surname: string;
    email: string;
    mobile?: {
      number: string;
      country_code: string;
    };
    role?: string;
    tag?: string;
  }>;
}

export interface BulkUserInviteRequest {
  invites: Array<{
    email: string;
    role?: string;
  }>;
}

export interface BulkCardBlockRequest {
  card_ids: string[];
}

export interface BulkCardUnblockRequest {
  card_ids: string[];
}

export interface BulkCardRemoveRequest {
  card_ids: string[];
}

export interface BulkSpendRulesUpdateRequest {
  card_ids: string[];
  rules: Array<{
    type: 'allow' | 'block';
    condition: {
      type: string;
      value: string | number;
      operator?: string;
    };
  }>;
}

export interface BulkTransferCreateRequest {
  transfers: Array<{
    profile_id: string;
    source: {
      type: 'managed_account' | 'managed_card';
      id: string;
    };
    destination: {
      type: 'managed_account' | 'managed_card';
      id: string;
    };
    amount: number;
    currency: string;
    description?: string;
    tag?: string;
  }>;
}

export interface BulkSendCreateRequest {
  sends: Array<{
    profile_id: string;
    source: {
      type: 'managed_account' | 'managed_card';
      id: string;
    };
    destination: {
      type: 'beneficiary';
      id: string;
    };
    amount: number;
    currency: string;
    description?: string;
    tag?: string;
  }>;
}

export interface BulkOutgoingWireTransferCreateRequest {
  transfers: Array<{
    profile_id: string;
    source: {
      type: 'managed_account';
      id: string;
    };
    destination: {
      type: 'linked_account';
      id: string;
    };
    amount: number;
    currency: string;
    description?: string;
    tag?: string;
  }>;
}