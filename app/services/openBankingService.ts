// ============================================
// Vaelix Bank API - Open Banking Service
// ============================================
// Berlin Group API compliant business logic
// ============================================

import {
  OpenBankingAccount,
  OpenBankingBalance,
  OpenBankingTransaction,
  OpenBankingConsent,
  OpenBankingConsentRequest,
  OpenBankingPaymentInitiation,
  OpenBankingPaymentStatus,
  OpenBankingFundsConfirmation,
  OpenBankingEventType,
  OpenBankingWebhookEvent
} from '../models/OpenBanking';
import { AccountQueries } from '../queries/accountQueries';
import { TransactionQueries } from '../queries/transactionQueries';
import { ConsentQueries } from '../queries/consentQueries';
import { WebhookService } from './webhookService';
import crypto from 'crypto';

export class OpenBankingService {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  // ============================================
  // Account Information Service (AIS)
  // ============================================

  async getAccounts(consentId: string, withBalance: boolean = false): Promise<OpenBankingAccount[]> {
    // Validate consent
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.consentStatus !== 'valid') {
      throw new Error('Invalid or expired consent');
    }

    // Get accounts from consent
    const accountIds = consent.accounts?.map(acc => acc.resourceId) || [];

    const accounts: OpenBankingAccount[] = [];
    for (const accountId of accountIds) {
      const account = await AccountQueries.getAccountById(parseInt(accountId));
      if (account) {
        const obAccount = this.transformToOpenBankingAccount(account);
        accounts.push(obAccount);
      }
    }

    return accounts;
  }

  async getAccount(accountId: string, consentId: string, withBalance: boolean = false): Promise<OpenBankingAccount | null> {
    // Validate consent
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.consentStatus !== 'valid') {
      throw new Error('Invalid or expired consent');
    }

    // Check if account is in consent
    const hasAccess = consent.accounts?.some((acc: any) => acc.resourceId === accountId);
    if (!hasAccess) {
      throw new Error('Account not accessible with this consent');
    }

    const account = await AccountQueries.getAccountById(parseInt(accountId));
    if (!account) return null;

    const obAccount = this.transformToOpenBankingAccount(account);

    return obAccount;
  }

  async getBalances(accountId: string, consentId: string): Promise<OpenBankingBalance[]> {
    // Validate consent
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.consentStatus !== 'valid') {
      throw new Error('Invalid or expired consent');
    }

    // Check if balances are accessible
    const hasAccess = consent.balances?.some((acc: any) => acc.resourceId === accountId);
    if (!hasAccess) {
      throw new Error('Balances not accessible with this consent');
    }

    const account = await AccountQueries.getAccountById(parseInt(accountId));
    if (!account) return [];

    return [{
      balanceAmount: {
        currency: account.currency,
        amount: account.balance.toString()
      },
      balanceType: 'closingBooked',
      lastChangeDateTime: account.updated_at?.toISOString()
    }];
  }

  async getTransactions(
    accountId: string,
    consentId: string,
    filters: { dateFrom?: string; dateTo?: string; limit?: number }
  ): Promise<OpenBankingTransaction[]> {
    // Validate consent
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.consentStatus !== 'valid') {
      throw new Error('Invalid or expired consent');
    }

    // Check if transactions are accessible
    const hasAccess = consent.transactions?.some((acc: any) => acc.resourceId === accountId);
    if (!hasAccess) {
      throw new Error('Transactions not accessible with this consent');
    }

    const transactions = await TransactionQueries.getTransactionsByAccountId(
      accountId,
      filters.limit || 100,
      filters.dateFrom,
      filters.dateTo
    );

    return transactions.map(tx => this.transformToOpenBankingTransaction(tx));
  }

  // ============================================
  // Payment Initiation Service (PIS)
  // ============================================

  async initiatePayment(
    paymentProduct: string,
    paymentData: OpenBankingPaymentInitiation,
    tppId: string,
    psuId?: string
  ): Promise<OpenBankingPaymentStatus> {
    const paymentId = crypto.randomUUID();

    // Create payment record
    await TransactionQueries.createPaymentInitiation({
      paymentId,
      paymentProduct,
      paymentData,
      tppId,
      psuId,
      status: 'PDNG'
    });

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'pis.payment.initiated',
      timestamp: new Date().toISOString(),
      data: { paymentId, paymentProduct },
      tppId,
      psuId
    });

    return {
      paymentId,
      transactionStatus: 'PDNG'
    };
  }

  async getPayment(paymentId: string, tppId: string): Promise<OpenBankingPaymentInitiation | null> {
    const payment = await TransactionQueries.getPaymentById(paymentId);
    if (!payment || payment.tppId !== tppId) return null;

    return payment.paymentData;
  }

  async getPaymentStatus(paymentId: string, tppId: string): Promise<OpenBankingPaymentStatus | null> {
    const payment = await TransactionQueries.getPaymentById(paymentId);
    if (!payment || payment.tppId !== tppId) return null;

    return {
      paymentId: payment.paymentId,
      transactionStatus: payment.status as any,
      fundsAvailable: payment.fundsAvailable
    };
  }

  // ============================================
  // Confirmation of Funds (PIIS)
  // ============================================

  async checkFunds(
    fundsRequest: OpenBankingFundsConfirmation,
    consentId: string
  ): Promise<{ fundsAvailable: boolean }> {
    // Validate consent
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.consentStatus !== 'valid') {
      throw new Error('Invalid or expired consent');
    }

    // Check if funds confirmations are accessible
    const hasAccess = consent.fundsConfirmations?.includes(fundsRequest.account.iban || '');
    if (!hasAccess) {
      throw new Error('Funds confirmation not accessible with this consent');
    }

    // Get account balance
    const account = await AccountQueries.getAccountByIban(fundsRequest.account.iban!);
    if (!account) {
      return { fundsAvailable: false };
    }

    const availableFunds = account.balance >= parseFloat(fundsRequest.instructedAmount.amount);
    return { fundsAvailable: availableFunds };
  }

  // ============================================
  // Consent Management
  // ============================================

  async createConsent(
    consentRequest: OpenBankingConsentRequest,
    tppId: string,
    psuId?: string
  ): Promise<OpenBankingConsent> {
    const consentId = crypto.randomUUID();

    const consent: OpenBankingConsent = {
      consentId,
      consentStatus: 'received',
      consentType: 'ais', // Default to AIS, could be determined from request
      frequencyPerDay: consentRequest.frequencyPerDay,
      recurringIndicator: consentRequest.recurringIndicator,
      validUntil: consentRequest.validUntil,
      lastActionDate: new Date().toISOString(),
      psuId,
      tppId,
      accounts: consentRequest.access.accounts?.map(acc => ({ ...acc, resourceId: crypto.randomUUID() })),
      balances: consentRequest.access.balances?.map(acc => ({ ...acc, resourceId: crypto.randomUUID() })),
      transactions: consentRequest.access.transactions?.map(acc => ({ ...acc, resourceId: crypto.randomUUID() })),
      payments: consentRequest.access.payments,
      fundsConfirmations: consentRequest.access.fundsConfirmations
    };

    await ConsentQueries.createConsent(consent);

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'ais.consent.created',
      timestamp: new Date().toISOString(),
      data: { consentId },
      tppId,
      psuId
    });

    return consent;
  }

  async getConsent(consentId: string, tppId: string): Promise<OpenBankingConsent | null> {
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.tppId !== tppId) return null;
    return consent;
  }

  async revokeConsent(consentId: string, tppId: string): Promise<void> {
    const consent = await ConsentQueries.getConsent(consentId);
    if (!consent || consent.tppId !== tppId) {
      throw new Error('Consent not found or not accessible');
    }

    await ConsentQueries.updateConsentStatus(consentId, 'revokedByPsu');

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'ais.consent.revoked',
      timestamp: new Date().toISOString(),
      data: { consentId },
      tppId: consent.tppId,
      psuId: consent.psuId
    });
  }

  // ============================================
  // Utility Methods
  // ============================================

  private transformToOpenBankingAccount(account: any): OpenBankingAccount {
    return {
      resourceId: account.id.toString(),
      iban: account.iban,
      currency: account.currency,
      cashAccountType: this.mapAccountType(account.type),
      name: account.name,
      displayName: account.name,
      status: account.status,
      bic: account.bic,
      _links: {
        self: `/accounts/${account.id}`,
        balances: `/accounts/${account.id}/balances`,
        transactions: `/accounts/${account.id}/transactions`
      }
    };
  }

  private transformToOpenBankingTransaction(transaction: any): OpenBankingTransaction {
    return {
      transactionId: transaction.id.toString(),
      bookingDate: transaction.created_at.toISOString().split('T')[0],
      valueDate: transaction.processed_at?.toISOString().split('T')[0],
      transactionAmount: {
        currency: transaction.currency,
        amount: transaction.amount.toString()
      },
      creditorName: transaction.merchant_name,
      debtorName: transaction.description,
      remittanceInformationUnstructured: transaction.description,
      _links: {
        self: `/transactions/${transaction.id}`
      }
    };
  }

  private mapAccountType(type: string): OpenBankingAccount['cashAccountType'] {
    const typeMap: Record<string, OpenBankingAccount['cashAccountType']> = {
      'checking': 'CACC',
      'savings': 'SVGS',
      'business': 'CACC',
      'investment': 'CASH'
    };
    return typeMap[type] || 'CACC';
  }
}