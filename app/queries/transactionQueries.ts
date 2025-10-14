// ============================================
// Vaelix Bank API - Transaction Queries
// ============================================
// Database operations for transactions and payments
// ============================================

import crypto from 'crypto';
import pool from '../utils/database';

export interface PaymentInitiationRecord {
  paymentId: string;
  paymentProduct: string;
  paymentData: any;
  tppId: string;
  psuId?: string;
  status: string;
  fundsAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionQueries {
  // Get transactions by account ID with filters
  static async getTransactionsByAccountId(
    accountId: string,
    limit: number = 100,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    let query = `
      SELECT t.*, m.name as merchant_name
      FROM transactions t
      LEFT JOIN merchants m ON t.merchant_id = m.id
      WHERE t.account_id = $1
    `;
    const params = [accountId];
    let paramIndex = 2;

    if (dateFrom) {
      query += ` AND t.created_at >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND t.created_at <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit.toString());

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Create payment initiation record
  static async createPaymentInitiation(payment: {
    paymentId: string;
    paymentProduct: string;
    paymentData: any;
    tppId: string;
    psuId?: string;
    status: string;
  }): Promise<void> {
    await pool.query(
      `INSERT INTO payment_initiations (
        payment_id, payment_product, payment_data, tpp_id, psu_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        payment.paymentId,
        payment.paymentProduct,
        JSON.stringify(payment.paymentData),
        payment.tppId,
        payment.psuId,
        payment.status
      ]
    );
  }

  // Get payment by ID
  static async getPaymentById(paymentId: string): Promise<PaymentInitiationRecord | null> {
    const result = await pool.query(
      'SELECT * FROM payment_initiations WHERE payment_id = $1',
      [paymentId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      paymentId: row.payment_id,
      paymentProduct: row.payment_product,
      paymentData: JSON.parse(row.payment_data),
      tppId: row.tpp_id,
      psuId: row.psu_id,
      status: row.status,
      fundsAvailable: row.funds_available,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Update payment status
  static async updatePaymentStatus(
    paymentId: string,
    status: string,
    fundsAvailable?: boolean
  ): Promise<void> {
    await pool.query(
      'UPDATE payment_initiations SET status = $1, funds_available = $2, updated_at = NOW() WHERE payment_id = $3',
      [status, fundsAvailable, paymentId]
    );
  }

  // Get payments by TPP
  static async getPaymentsByTpp(tppId: string, limit: number = 100): Promise<PaymentInitiationRecord[]> {
    const result = await pool.query(
      'SELECT * FROM payment_initiations WHERE tpp_id = $1 ORDER BY created_at DESC LIMIT $2',
      [tppId, limit]
    );

    return result.rows.map(row => ({
      paymentId: row.payment_id,
      paymentProduct: row.payment_product,
      paymentData: JSON.parse(row.payment_data),
      tppId: row.tpp_id,
      psuId: row.psu_id,
      status: row.status,
      fundsAvailable: row.funds_available,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  // Create transaction
  static async createTransaction(transaction: {
    accountId: string;
    customerId: string;
    type: 'credit' | 'debit';
    amount: number;
    currency: string;
    description: string;
    category?: string;
    merchant?: any;
    reference?: string;
    metadata?: any;
  }): Promise<string> {
    const transactionId = crypto.randomUUID();

    await pool.query(
      `INSERT INTO transactions (
        id, account_id, customer_id, type, amount, currency, description,
        category, merchant_data, reference, metadata, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
      [
        transactionId,
        transaction.accountId,
        transaction.customerId,
        transaction.type,
        transaction.amount,
        transaction.currency,
        transaction.description,
        transaction.category,
        transaction.merchant ? JSON.stringify(transaction.merchant) : null,
        transaction.reference,
        transaction.metadata ? JSON.stringify(transaction.metadata) : null,
        'completed'
      ]
    );

    return transactionId;
  }

  // Get transaction by ID
  static async getTransactionById(transactionId: string): Promise<any | null> {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      accountId: row.account_id,
      customerId: row.customer_id,
      type: row.type,
      amount: row.amount,
      currency: row.currency,
      description: row.description,
      category: row.category,
      merchant: row.merchant_data ? JSON.parse(row.merchant_data) : null,
      reference: row.reference,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      status: row.status,
      createdAt: row.created_at,
      processedAt: row.processed_at
    };
  }

  // Update transaction status
  static async updateTransactionStatus(transactionId: string, status: string): Promise<void> {
    await pool.query(
      'UPDATE transactions SET status = $1, processed_at = NOW(), updated_at = NOW() WHERE id = $2',
      [status, transactionId]
    );
  }
}