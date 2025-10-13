export interface ManagedCard {
  id: string;
  profile_id: string;
  name?: string;
  state: 'active' | 'blocked' | 'closed';
  type: 'virtual' | 'physical';
  brand: string;
  currency: string;
  balance: {
    available: number;
    blocked: number;
    reserved: number;
  };
  masked_pan: string;
  expiry_date: string;
  // Wallet preparation fields
  wallet_ready?: boolean;
  wallet_details?: WalletDetails;
  created_at: string;
  updated_at: string;
}

export interface WalletDetails {
  card_number?: string;
  cvv?: string;
  expiry_month?: string;
  expiry_year?: string;
  name_on_card?: string;
  last_accessed?: Date;
}

export interface CreateManagedCardRequest {
  profile_id: string;
  name?: string;
  type: 'virtual' | 'physical';
  brand: 'visa' | 'mastercard';
  currency: string;
  tag?: string;
  digitalWallets?: {
    pushProvisioningEnabled?: boolean;
    walletsEnabled?: boolean;
    artworkReference?: string;
  };
}

export interface UpdateManagedCardRequest {
  name?: string;
  tag?: string;
}

export interface SpendRules {
  id: string;
  card_id: string;
  rules: SpendRule[];
  created_at: string;
  updated_at: string;
}

export interface SpendRule {
  type: 'allow' | 'block';
  condition: {
    type: 'mcc' | 'merchant' | 'country' | 'amount' | 'currency';
    value: string | number;
    operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  };
}

export interface CreateSpendRulesRequest {
  rules: SpendRule[];
}

export interface PhysicalCardUpgradeRequest {
  product_id: string;
  carrier_type: 'standard' | 'express';
  delivery_address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
}

export interface PhysicalCardActivationRequest {
  cvv: string;
}

export interface CardReplacementRequest {
  reason: 'damaged' | 'lost' | 'stolen';
  product_id?: string;
}

export interface ManagedCardStatement {
  id: string;
  card_id: string;
  from_date: string;
  to_date: string;
  transactions: CardTransaction[];
  balance: {
    opening: number;
    closing: number;
  };
}

export interface CardTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  merchant?: {
    name: string;
    category: string;
    country: string;
  };
  created_at: string;
}

export interface CardProvisioning {
  id: number;
  card_id: string;
  wallet_type: 'apple_pay' | 'google_pay';
  status: 'pending' | 'processing' | 'success' | 'failed' | 'revoked';
  device_id?: string;
  wallet_account_id?: string;
  provisioned_at?: Date;
  last_attempt?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ApplePayProvisioningRequest {
  certificates: string[];
  nonce: string;
  nonceSignature: string;
}

export interface GooglePayProvisioningRequest {
  clientDeviceId: string;
  clientWalletAccountId: string;
}

export interface ApplePayProvisioningResponse {
  cards: Array<{
    suffix: string;
    expirationMonth: string;
    expirationYear: string;
    cardholderName: string;
    paymentData: {
      version: string;
      data: string;
      signature: string;
      header: {
        ephemeralPublicKey: string;
        transactionId: string;
        publicKeyHash: string;
      };
    };
  }>;
}

export interface GooglePayProvisioningResponse {
  paymentCard: {
    cardNumber: string;
    expirationMonth: string;
    expirationYear: string;
    cardholderName: string;
    authMethod: string;
    fpanLastFour: string;
  };
}

export interface AuthorizationEvent {
  id: string;
  card_id: string;
  transaction_id: string;
  amount: number;
  currency: string;
  merchant_name?: string;
  merchant_category?: string;
  merchant_country?: string;
  decision: 'APPROVED' | 'DECLINED';
  processed_at: string;
  response_time_ms: number;
}