// ============================================
// Vaelix Bank API - Open Banking Models
// ============================================
// Berlin Group API compliant data models
// ============================================

// ============================================
// Account Information Service (AIS) Models
// ============================================

export interface OpenBankingAccount {
  resourceId: string;
  iban?: string;
  bban?: string;
  pan?: string;
  maskedPan?: string;
  msisdn?: string;
  currency: string;
  name?: string;
  displayName?: string;
  product?: string;
  cashAccountType: 'CACC' | 'CARD' | 'CASH' | 'CHAR' | 'CISH' | 'COMM' | 'CPAC' | 'LLSV' | 'LOAN' | 'MGLD' | 'MOMA' | 'NREX' | 'ODFT' | 'ONDP' | 'OTHR' | 'SACC' | 'SLRY' | 'SVGS' | 'TAXE' | 'TRAN' | 'TRAS' | 'USAL';
  status?: 'enabled' | 'deleted' | 'blocked';
  bic?: string;
  linkedAccounts?: string;
  usage?: 'PRIV' | 'ORGA';
  details?: string;
  ownerName?: string;
  _links?: OpenBankingLinks;
}

export interface OpenBankingBalance {
  balanceAmount: {
    currency: string;
    amount: string;
  };
  balanceType: 'closingBooked' | 'expected' | 'openingBooked' | 'interimAvailable' | 'forwardAvailable' | 'nonInvoiced';
  lastChangeDateTime?: string;
  referenceDate?: string;
  lastCommittedTransaction?: string;
}

export interface OpenBankingTransaction {
  transactionId: string;
  entryReference?: string;
  endToEndId?: string;
  mandateId?: string;
  checkId?: string;
  creditorId?: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: {
    currency: string;
    amount: string;
  };
  currencyExchange?: {
    sourceCurrency: string;
    exchangeRate: string;
    unitCurrency: string;
    targetCurrency: string;
    quotationDate?: string;
  };
  creditorName?: string;
  creditorAccount?: {
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
  };
  debtorName?: string;
  debtorAccount?: {
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
  };
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: {
    reference?: string;
    referenceType?: string;
    referenceIssuer?: string;
  };
  additionalInformation?: string;
  purposeCode?: string;
  bankTransactionCode?: string;
  proprietaryBankTransactionCode?: string;
  _links?: OpenBankingLinks;
}

// ============================================
// Payment Initiation Service (PIS) Models
// ============================================

export interface OpenBankingPaymentInitiation {
  paymentId: string;
  paymentType: 'single' | 'bulk' | 'periodic';
  paymentProduct: string;
  debtorAccount: {
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
  };
  creditorAccount: {
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
  };
  creditorAgent?: string;
  creditorName: string;
  creditorAddress?: OpenBankingAddress;
  amount: {
    currency: string;
    amount: string;
  };
  currencyOfTransfer?: string;
  settlementAccount?: {
    iban?: string;
    currency?: string;
  };
  chargeBearer?: 'CRED' | 'DEBT' | 'SHAR' | 'SLEV';
  endToEndIdentification?: string;
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: {
    reference?: string;
    referenceType?: string;
    referenceIssuer?: string;
  };
  requestedExecutionDate?: string;
  requestedExecutionTime?: string;
}

export interface OpenBankingPaymentStatus {
  paymentId: string;
  transactionStatus: 'ACCP' | 'ACSC' | 'ACSP' | 'ACTC' | 'ACWC' | 'ACWP' | 'PDNG' | 'RJCT' | 'CANC' | 'ACFC' | 'PART';
  fundsAvailable?: boolean;
  psuMessage?: string;
  tppMessages?: Array<{
    category: 'ERROR' | 'WARNING' | 'INFO';
    code: string;
    text: string;
  }>;
}

// ============================================
// Confirmation of Funds (PIIS) Models
// ============================================

export interface OpenBankingFundsConfirmation {
  account: {
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
  };
  instructedAmount: {
    currency: string;
    amount: string;
  };
  cardNumber?: string;
  payee?: string;
}

// ============================================
// Common Models
// ============================================

export interface OpenBankingAddress {
  streetName?: string;
  buildingNumber?: string;
  townName?: string;
  postCode?: string;
  country: string;
}

export interface OpenBankingLinks {
  self: string;
  first?: string;
  next?: string;
  prev?: string;
  last?: string;
  account?: string;
  balances?: string;
  transactions?: string;
  cardAccounts?: string;
  cards?: string;
}

export interface OpenBankingMeta {
  totalPages?: number;
  firstAvailableDate?: string;
  lastAvailableDate?: string;
}

// ============================================
// Consent Management Models
// ============================================

export interface OpenBankingConsent {
  consentId: string;
  consentStatus: 'received' | 'rejected' | 'valid' | 'revokedByPsu' | 'expired' | 'terminatedByTpp';
  consentType: 'ais' | 'pis' | 'piis';
  frequencyPerDay: number;
  recurringIndicator: boolean;
  validUntil: string;
  lastActionDate: string;
  psuId?: string;
  tppId: string;
  accounts?: Array<{
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
    resourceId: string;
  }>;
  balances?: Array<{
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
    resourceId: string;
  }>;
  transactions?: Array<{
    iban?: string;
    bban?: string;
    pan?: string;
    maskedPan?: string;
    msisdn?: string;
    currency?: string;
    resourceId: string;
  }>;
  payments?: string[];
  fundsConfirmations?: string[];
  _links?: OpenBankingLinks;
}

export interface OpenBankingConsentRequest {
  access: {
    accounts?: Array<{
      iban?: string;
      bban?: string;
      pan?: string;
      maskedPan?: string;
      msisdn?: string;
      currency?: string;
    }>;
    balances?: Array<{
      iban?: string;
      bban?: string;
      pan?: string;
      maskedPan?: string;
      msisdn?: string;
      currency?: string;
    }>;
    transactions?: Array<{
      iban?: string;
      bban?: string;
      pan?: string;
      maskedPan?: string;
      msisdn?: string;
      currency?: string;
    }>;
    payments?: string[];
    fundsConfirmations?: string[];
  };
  recurringIndicator: boolean;
  validUntil: string;
  frequencyPerDay: number;
  combinedServiceIndicator?: boolean;
}

// ============================================
// BaaS (Banking as a Service) Models
// ============================================

export interface BaaSCustomer {
  customerId: string;
  type: 'retail' | 'business';
  status: 'active' | 'suspended' | 'closed';
  profile: {
    name: string;
    email: string;
    phone?: string;
    address?: OpenBankingAddress;
    taxId?: string;
    dateOfBirth?: string;
    nationality?: string;
  };
  kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
  riskScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BaaSAccount {
  accountId: string;
  customerId: string;
  type: 'checking' | 'savings' | 'business' | 'investment';
  status: 'active' | 'frozen' | 'closed';
  currency: string;
  iban?: string;
  bic?: string;
  balance: {
    current: number;
    available: number;
  };
  limits: {
    dailyWithdrawal?: number;
    monthlyWithdrawal?: number;
    transactionLimit?: number;
  };
  features: {
    overdraft?: boolean;
    international?: boolean;
    cardEnabled?: boolean;
    apiEnabled?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BaaSCard {
  cardId: string;
  accountId: string;
  customerId: string;
  type: 'debit' | 'credit' | 'prepaid';
  status: 'active' | 'blocked' | 'expired' | 'cancelled';
  maskedPan: string;
  expiryDate: string;
  cardholderName: string;
  limits: {
    daily?: number;
    transaction?: number;
    atm?: number;
  };
  features: {
    contactless?: boolean;
    online?: boolean;
    international?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BaaSTransaction {
  transactionId: string;
  accountId: string;
  customerId: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  description: string;
  category?: string;
  merchant?: {
    name: string;
    category?: string;
    location?: {
      address?: string;
      city?: string;
      country?: string;
    };
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  processedAt?: string;
}

// ============================================
// API Response Models
// ============================================

export interface OpenBankingResponse<T> {
  data: T;
  meta?: OpenBankingMeta;
  _links?: OpenBankingLinks;
}

export interface OpenBankingError {
  type: string;
  title: string;
  detail: string;
  instance?: string;
  additionalErrors?: Array<{
    title: string;
    detail: string;
  }>;
}

// ============================================
// Webhook/Event Models
// ============================================

export interface OpenBankingWebhookEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  data: any;
  consentId?: string;
  tppId?: string;
  psuId?: string;
}

export type OpenBankingEventType =
  | 'ais.consent.revoked'
  | 'ais.consent.expired'
  | 'pis.payment.completed'
  | 'pis.payment.failed'
  | 'piis.funds.available'
  | 'piis.funds.unavailable'
  | 'baas.customer.created'
  | 'baas.customer.updated'
  | 'baas.account.created'
  | 'baas.account.updated'
  | 'baas.transaction.completed';