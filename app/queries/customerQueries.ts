// ============================================
// Vaelix Bank API - Customer Queries
// ============================================
// Database operations for BaaS customers
// ============================================

import pool from '../utils/database';
import { BaaSCustomer } from '../models/OpenBanking';

export class CustomerQueries {
  // Create a new customer
  static async createCustomer(customer: BaaSCustomer): Promise<void> {
    await pool.query(
      `INSERT INTO baas_customers (
        customer_id, type, status, profile, kyc_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        customer.customerId,
        customer.type,
        customer.status,
        JSON.stringify(customer.profile),
        customer.kycStatus,
      ]
    );
  }

  // Get customer by ID
  static async getCustomer(customerId: string): Promise<BaaSCustomer | null> {
    const result = await pool.query(
      'SELECT * FROM baas_customers WHERE customer_id = $1',
      [customerId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      profile: JSON.parse(row.profile),
      kycStatus: row.kyc_status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  // Update customer
  static async updateCustomer(customerId: string, updates: Partial<BaaSCustomer>): Promise<BaaSCustomer | null> {
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

    if (updates.profile !== undefined) {
      fields.push(`profile = $${paramIndex}`);
      values.push(JSON.stringify(updates.profile));
      paramIndex++;
    }

    if (updates.kycStatus !== undefined) {
      fields.push(`kyc_status = $${paramIndex}`);
      values.push(updates.kycStatus);
      paramIndex++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(customerId);

    const query = `UPDATE baas_customers SET ${fields.join(', ')} WHERE customer_id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      profile: JSON.parse(row.profile),
      kycStatus: row.kyc_status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  // Update KYC status
  static async updateKycStatus(customerId: string, kycStatus: 'pending' | 'approved' | 'rejected' | 'expired'): Promise<void> {
    await pool.query(
      'UPDATE baas_customers SET kyc_status = $1, updated_at = NOW() WHERE customer_id = $2',
      [kycStatus, customerId]
    );
  }

  // Get customers by status
  static async getCustomersByStatus(status: string, limit: number = 100): Promise<BaaSCustomer[]> {
    const result = await pool.query(
      'SELECT * FROM baas_customers WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
      [status, limit]
    );

    return result.rows.map(row => ({
      customerId: row.customer_id,
      type: row.type,
      status: row.status,
      profile: JSON.parse(row.profile),
      kycStatus: row.kyc_status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));
  }

  // Delete customer
  static async deleteCustomer(customerId: string): Promise<void> {
    await pool.query('DELETE FROM baas_customers WHERE customer_id = $1', [customerId]);
  }
}