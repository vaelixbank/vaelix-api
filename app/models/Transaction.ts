// DB Model
export interface Transaction {
  id: number;
  account_id: number;
  amount: number;
  currency: string;
  type?: string;
  status: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionRequest {
  account_id: number;
  amount: number;
  currency?: string;
  type?: string;
  status?: string;
  description?: string;
}

export interface UpdateTransactionRequest {
  status?: string;
  description?: string;
}

// Weavr API interfaces
export interface SendTransaction {
  id: string;
  profile_id: string;
  state: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'send';
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
  created_at: string;
  completed_at?: string;
}

export interface TransferTransaction {
  id: string;
  profile_id: string;
  state: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'transfer';
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
  created_at: string;
  completed_at?: string;
}

export interface OutgoingWireTransfer {
  id: string;
  profile_id: string;
  state: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'outgoing_wire_transfer';
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
  created_at: string;
  completed_at?: string;
}

export interface CreateSendRequest {
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
}

export interface CreateTransferRequest {
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
}

export interface CreateOutgoingWireTransferRequest {
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
}

export interface BulkSendRequest {
  sends: CreateSendRequest[];
}

export interface BulkTransferRequest {
  transfers: CreateTransferRequest[];
}

export interface BulkOutgoingWireTransferRequest {
  transfers: CreateOutgoingWireTransferRequest[];
}