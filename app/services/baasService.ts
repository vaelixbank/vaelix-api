// ============================================
// Vaelix Bank API - BaaS (Banking as a Service) Service
// ============================================
// Business logic for Banking as a Service operations
// ============================================

import crypto from 'crypto';
import {
  BaaSCustomer,
  BaaSAccount,
  BaaSCard,
  BaaSTransaction
} from '../models/OpenBanking';
import { CustomerQueries } from '../queries/customerQueries';
import { BaaSQueries } from '../queries/baasQueries';
import { WebhookService } from './webhookService';

export class BaaSService {
  private webhookService: WebhookService;

  constructor() {
    this.webhookService = new WebhookService();
  }

  // ============================================
  // Customer Management
  // ============================================

  async createCustomer(customerData: Partial<BaaSCustomer>): Promise<BaaSCustomer> {
    const customerId = crypto.randomUUID();

    const customer: BaaSCustomer = {
      customerId,
      type: customerData.type || 'retail',
      status: 'active',
      profile: customerData.profile || {
        name: 'Unknown',
        email: 'unknown@example.com'
      },
      kycStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...customerData
    };

    await CustomerQueries.createCustomer(customer);

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'baas.customer.created',
      timestamp: new Date().toISOString(),
      data: { customerId },
      psuId: customerId
    });

    return customer;
  }

  async getCustomer(customerId: string): Promise<BaaSCustomer | null> {
    return await CustomerQueries.getCustomer(customerId);
  }

  async updateCustomer(customerId: string, updates: Partial<BaaSCustomer>): Promise<BaaSCustomer | null> {
    const customer = await CustomerQueries.updateCustomer(customerId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (customer) {
      // Send webhook event
      await this.webhookService.sendEvent({
        eventId: crypto.randomUUID(),
        eventType: 'baas.customer.updated',
        timestamp: new Date().toISOString(),
        data: { customerId },
        psuId: customerId
      });
    }

    return customer;
  }

  // ============================================
  // Account Management
  // ============================================

  async createAccount(customerId: string, accountData: Partial<BaaSAccount>): Promise<BaaSAccount> {
    // Verify customer exists
    const customer = await CustomerQueries.getCustomer(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const accountId = crypto.randomUUID();

    const account: BaaSAccount = {
      accountId,
      customerId,
      type: accountData.type || 'checking',
      status: 'active',
      currency: accountData.currency || 'EUR',
      balance: {
        current: 0,
        available: 0
      },
      limits: accountData.limits || {},
      features: accountData.features || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...accountData
    };

    await BaaSQueries.createAccount(account);

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'baas.account.created',
      timestamp: new Date().toISOString(),
      data: { accountId, customerId },
      psuId: customerId
    });

    return account;
  }

  async getAccount(accountId: string): Promise<BaaSAccount | null> {
    return await BaaSQueries.getAccount(accountId);
  }

  async updateAccount(accountId: string, updates: Partial<BaaSAccount>): Promise<BaaSAccount | null> {
    const account = await BaaSQueries.updateAccount(accountId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (account) {
      // Send webhook event
      await this.webhookService.sendEvent({
        eventId: crypto.randomUUID(),
        eventType: 'baas.account.updated',
        timestamp: new Date().toISOString(),
        data: { accountId },
        psuId: account.customerId
      });
    }

    return account;
  }

  // ============================================
  // Card Management
  // ============================================

  async createCard(accountId: string, cardData: Partial<BaaSCard>): Promise<BaaSCard> {
    // Verify account exists
    const account = await BaaSQueries.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    const cardId = crypto.randomUUID();

    const card: BaaSCard = {
      cardId,
      accountId,
      customerId: account.customerId,
      type: cardData.type || 'debit',
      status: 'active',
      maskedPan: this.generateMaskedPan(),
      expiryDate: this.generateExpiryDate(),
      cardholderName: cardData.cardholderName || account.customerId,
      limits: cardData.limits || {},
      features: cardData.features || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...cardData
    };

    await BaaSQueries.createCard(card);

    return card;
  }

  async getCard(cardId: string): Promise<BaaSCard | null> {
    return await BaaSQueries.getCard(cardId);
  }

  // ============================================
  // Transaction Processing
  // ============================================

  async createTransaction(accountId: string, transactionData: Partial<BaaSTransaction>): Promise<BaaSTransaction> {
    // Verify account exists
    const account = await BaaSQueries.getAccount(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Check balance for debit transactions
    if (transactionData.type === 'debit') {
      const currentBalance = account.balance.available;
      if (currentBalance < (transactionData.amount || 0)) {
        throw new Error('Insufficient funds');
      }
    }

    const transactionId = crypto.randomUUID();

    const transaction: BaaSTransaction = {
      transactionId,
      accountId,
      customerId: account.customerId,
      type: transactionData.type || 'credit',
      amount: transactionData.amount || 0,
      currency: transactionData.currency || account.currency,
      description: transactionData.description || '',
      category: transactionData.category,
      merchant: transactionData.merchant,
      status: 'completed',
      createdAt: new Date().toISOString(),
      ...transactionData
    };

    await BaaSQueries.createTransaction(transaction);

    // Update account balance
    const balanceChange = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
    await BaaSQueries.updateAccountBalance(accountId, balanceChange);

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'baas.transaction.completed',
      timestamp: new Date().toISOString(),
      data: { transactionId, accountId, amount: transaction.amount },
      psuId: account.customerId
    });

    return transaction;
  }

  async getTransaction(transactionId: string): Promise<BaaSTransaction | null> {
    return await BaaSQueries.getTransaction(transactionId);
  }

  async getAccountTransactions(accountId: string, limit: number = 50): Promise<BaaSTransaction[]> {
    return await BaaSQueries.getAccountTransactions(accountId, limit);
  }

  // ============================================
  // Utility Methods
  // ============================================

  private generateMaskedPan(): string {
    // Generate a masked PAN (e.g., 411111******1111)
    const prefix = '411111';
    const suffix = '1111';
    const masked = '******';
    return `${prefix}${masked}${suffix}`;
  }

  private generateExpiryDate(): string {
    // Generate expiry date (MM/YY format, 3 years from now)
    const now = new Date();
    const expiry = new Date(now.getFullYear() + 3, now.getMonth());
    return expiry.toISOString().slice(5, 7) + '/' + expiry.toISOString().slice(2, 4);
  }

  // ============================================
  // KYC and Compliance
  // ============================================

  async updateKycStatus(customerId: string, kycStatus: 'pending' | 'approved' | 'rejected' | 'expired'): Promise<void> {
    await CustomerQueries.updateKycStatus(customerId, kycStatus);

    // Send webhook event
    await this.webhookService.sendEvent({
      eventId: crypto.randomUUID(),
      eventType: 'baas.customer.updated',
      timestamp: new Date().toISOString(),
      data: { customerId, kycStatus },
      psuId: customerId
    });
  }

  // ============================================
  // Reporting and Analytics
  // ============================================

  async getCustomerAnalytics(customerId: string, period: { start: string; end: string }): Promise<{
    totalTransactions: number;
    totalVolume: number;
    averageTransaction: number;
    topCategories: Array<{ category: string; count: number; volume: number }>;
  }> {
    return await BaaSQueries.getCustomerAnalytics(customerId, period);
  }

  async getAccountAnalytics(accountId: string, period: { start: string; end: string }): Promise<{
    balance: { current: number; available: number };
    transactions: number;
    volume: { credit: number; debit: number };
    trends: Array<{ date: string; balance: number }>;
  }> {
    return await BaaSQueries.getAccountAnalytics(accountId, period);
  }
}