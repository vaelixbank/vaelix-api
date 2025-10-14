// ============================================
// Vaelix Bank API - BaaS Queries
// ============================================
// Database operations for BaaS accounts, cards, and transactions
// ============================================

import pool from '../utils/database';
import { BaaSAccount, BaaSCard, BaaSTransaction } from '../models/OpenBanking';

export class BaaSQueries {
  // ============================================
  // Account Operations
  // ============================================

  // Create BaaS account
  static async createAccount(account: BaaSAccount): Promise<void> {
    await pool.query(
      `INSERT INTO baas_accounts (
        account_id, customer_id, type, status, currency, balance_current, balance_available,
        limits, features, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        account.accountId,
        account.customerId,
        account.type,
        account.status,
        account.currency,
        JSON.stringify(account.balance.current),
        JSON.stringify(account.balance.available),
        JSON.stringify(account.limits || {}),
        JSON.stringify(account.features || {}),
      ]
    );
  }

  // Get account by ID
  static async getAccount(accountId: string): Promise<BaaSAccount | null> {
    const result = await pool.query(
      'SELECT * FROM baas_accounts WHERE account_id = $1',
      [accountId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      currency: row.currency,
      balance: {
        current: JSON.parse(row.balance_current),
        available: JSON.parse(row.balance_available),
      },
      limits: JSON.parse(row.limits || '{}'),
      features: JSON.parse(row.features || '{}'),
      iban: row.iban,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  // Update account
  static async updateAccount(accountId: string, updates: Partial<BaaSAccount>): Promise<BaaSAccount | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.type !== undefined) {
      fields.push(`type = $${paramIndex}`);
      values.push(updates.type);
      paramIndex++;
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }

    if (updates.balance !== undefined) {
      fields.push(`balance_current = $${paramIndex}`);
      values.push(JSON.stringify(updates.balance.current));
      paramIndex++;
      fields.push(`balance_available = $${paramIndex}`);
      values.push(JSON.stringify(updates.balance.available));
      paramIndex++;
    }

    if (updates.limits !== undefined) {
      fields.push(`limits = $${paramIndex}`);
      values.push(JSON.stringify(updates.limits));
      paramIndex++;
    }

    if (updates.features !== undefined) {
      fields.push(`features = $${paramIndex}`);
      values.push(JSON.stringify(updates.features));
      paramIndex++;
    }

    if (updates.iban !== undefined) {
      fields.push(`iban = $${paramIndex}`);
      values.push(updates.iban);
      paramIndex++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(accountId);

    const query = `UPDATE baas_accounts SET ${fields.join(', ')} WHERE account_id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      currency: row.currency,
      balance: {
        current: JSON.parse(row.balance_current),
        available: JSON.parse(row.balance_available),
      },
      limits: JSON.parse(row.limits || '{}'),
      features: JSON.parse(row.features || '{}'),
      iban: row.iban,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  // Update account balance
  static async updateAccountBalance(accountId: string, amountChange: number): Promise<void> {
    await pool.query(
      `UPDATE baas_accounts
       SET balance_current = balance_current + $1,
           balance_available = balance_available + $1,
           updated_at = NOW()
       WHERE account_id = $2`,
      [amountChange, accountId]
    );
  }

  // Get accounts by customer
  static async getAccountsByCustomer(customerId: string): Promise<BaaSAccount[]> {
    const result = await pool.query(
      'SELECT * FROM baas_accounts WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    return result.rows.map(row => ({
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      currency: row.currency,
      balance: {
        current: JSON.parse(row.balance_current),
        available: JSON.parse(row.balance_available),
      },
      limits: JSON.parse(row.limits || '{}'),
      features: JSON.parse(row.features || '{}'),
      iban: row.iban,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  }

  // ============================================
  // Card Operations
  // ============================================

  // Create card
  static async createCard(card: BaaSCard): Promise<void> {
    await pool.query(
      `INSERT INTO baas_cards (
        card_id, account_id, customer_id, type, status, masked_pan, expiry_date,
        cardholder_name, limits, features, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
      [
        card.cardId,
        card.accountId,
        card.customerId,
        card.type,
        card.status,
        card.maskedPan,
        card.expiryDate,
        card.cardholderName,
        JSON.stringify(card.limits || {}),
        JSON.stringify(card.features || {}),
      ]
    );
  }

  // Get card by ID
  static async getCard(cardId: string): Promise<BaaSCard | null> {
    const result = await pool.query(
      'SELECT * FROM baas_cards WHERE card_id = $1',
      [cardId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      cardId: row.card_id,
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      maskedPan: row.masked_pan,
      expiryDate: row.expiry_date,
      cardholderName: row.cardholder_name,
      limits: JSON.parse(row.limits || '{}'),
      features: JSON.parse(row.features || '{}'),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  // Get cards by account
  static async getCardsByAccount(accountId: string): Promise<BaaSCard[]> {
    const result = await pool.query(
      'SELECT * FROM baas_cards WHERE account_id = $1 ORDER BY created_at DESC',
      [accountId]
    );

    return result.rows.map(row => ({
      cardId: row.card_id,
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      maskedPan: row.masked_pan,
      expiryDate: row.expiry_date,
      cardholderName: row.cardholder_name,
      limits: JSON.parse(row.limits || '{}'),
      features: JSON.parse(row.features || '{}'),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  }

  // ============================================
  // Transaction Operations
  // ============================================

  // Create transaction
  static async createTransaction(transaction: BaaSTransaction): Promise<void> {
    await pool.query(
      `INSERT INTO baas_transactions (
        transaction_id, account_id, customer_id, type, amount, currency, description,
        category, merchant, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        transaction.transactionId,
        transaction.accountId,
        transaction.customerId,
        transaction.type,
        transaction.amount,
        transaction.currency,
        transaction.description,
        transaction.category,
        transaction.merchant ? JSON.stringify(transaction.merchant) : null,
        transaction.status,
      ]
    );
  }

  // Get transaction by ID
  static async getTransaction(transactionId: string): Promise<BaaSTransaction | null> {
    const result = await pool.query(
      'SELECT * FROM baas_transactions WHERE transaction_id = $1',
      [transactionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      transactionId: row.transaction_id,
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      description: row.description,
      category: row.category,
      merchant: row.merchant ? JSON.parse(row.merchant) : undefined,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    };
  }

  // Get transactions by account
  static async getAccountTransactions(accountId: string, limit: number = 50): Promise<BaaSTransaction[]> {
    const result = await pool.query(
      'SELECT * FROM baas_transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2',
      [accountId, limit]
    );

    return result.rows.map(row => ({
      transactionId: row.transaction_id,
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      description: row.description,
      category: row.category,
      merchant: row.merchant ? JSON.parse(row.merchant) : undefined,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  }

  // ============================================
  // Analytics Operations
  // ============================================

  // Get customer analytics
  static async getCustomerAnalytics(customerId: string, period: { start: string; end: string }): Promise<{
    totalTransactions: number;
    totalVolume: number;
    averageTransaction: number;
    topCategories: Array<{ category: string; count: number; volume: number }>;
  }> {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) as total_volume,
        COALESCE(AVG(ABS(amount)), 0) as average_transaction
       FROM baas_transactions
       WHERE customer_id = $1 AND created_at BETWEEN $2 AND $3`,
      [customerId, period.start, period.end]
    );

    const categoryResult = await pool.query(
      `SELECT
        category,
        COUNT(*) as count,
        SUM(ABS(amount)) as volume
       FROM baas_transactions
       WHERE customer_id = $1 AND created_at BETWEEN $2 AND $3 AND category IS NOT NULL
       GROUP BY category
       ORDER BY volume DESC
       LIMIT 10`,
      [customerId, period.start, period.end]
    );

    const stats = result.rows[0];
    return {
      totalTransactions: parseInt(stats.total_transactions),
      totalVolume: parseFloat(stats.total_volume),
      averageTransaction: parseFloat(stats.average_transaction),
      topCategories: categoryResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count),
        volume: parseFloat(row.volume),
      })),
    };
  }

  // Get account analytics
  static async getAccountAnalytics(accountId: string, period: { start: string; end: string }): Promise<{
    balance: { current: number; available: number };
    transactions: number;
    volume: { credit: number; debit: number };
    trends: Array<{ date: string; balance: number }>;
  }> {
    // Get current balance
    const accountResult = await pool.query(
      'SELECT balance_current, balance_available FROM baas_accounts WHERE account_id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const account = accountResult.rows[0];

    // Get transaction stats
    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as credit_volume,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as debit_volume
       FROM baas_transactions
       WHERE account_id = $1 AND created_at BETWEEN $2 AND $3`,
      [accountId, period.start, period.end]
    );

    // Get balance trends (simplified - would need more complex logic for real trends)
    const trendsResult = await pool.query(
      `SELECT
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) as balance_change
       FROM baas_transactions
       WHERE account_id = $1 AND created_at BETWEEN $2 AND $3
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [accountId, period.start, period.end]
    );

    const stats = statsResult.rows[0];
    return {
      balance: {
        current: JSON.parse(account.balance_current),
        available: JSON.parse(account.balance_available),
      },
      transactions: parseInt(stats.total_transactions),
      volume: {
        credit: parseFloat(stats.credit_volume),
        debit: parseFloat(stats.debit_volume),
      },
      trends: trendsResult.rows.map(row => ({
        date: row.date,
        balance: parseFloat(row.balance_change),
      })),
    };
  }
}