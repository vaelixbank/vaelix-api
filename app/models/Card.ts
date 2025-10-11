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
  created_at: string;
  updated_at: string;
}

export interface CreateManagedCardRequest {
  profile_id: string;
  name?: string;
  type: 'virtual' | 'physical';
  brand: 'visa' | 'mastercard';
  currency: string;
  tag?: string;
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