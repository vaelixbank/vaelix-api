// ============================================
// Vaelix Bank API - Consent Queries
// ============================================
// Database operations for Open Banking consents
// ============================================

import pool from '../utils/database';
import { OpenBankingConsent } from '../models/OpenBanking';

export class ConsentQueries {
  // Create a new consent
  static async createConsent(consent: OpenBankingConsent): Promise<void> {
    await pool.query(
      `INSERT INTO open_banking_consents (
        consent_id, consent_status, consent_type, frequency_per_day,
        recurring_indicator, valid_until, last_action_date, psu_id, tpp_id,
        accounts, balances, transactions, payments, funds_confirmations,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [
        consent.consentId,
        consent.consentStatus,
        consent.consentType,
        consent.frequencyPerDay,
        consent.recurringIndicator,
        new Date(consent.validUntil),
        new Date(consent.lastActionDate),
        consent.psuId,
        consent.tppId,
        JSON.stringify(consent.accounts),
        JSON.stringify(consent.balances),
        JSON.stringify(consent.transactions),
        JSON.stringify(consent.payments),
        JSON.stringify(consent.fundsConfirmations)
      ]
    );
  }

  // Get consent by ID
  static async getConsent(consentId: string): Promise<OpenBankingConsent | null> {
    const result = await pool.query(
      'SELECT * FROM open_banking_consents WHERE consent_id = $1',
      [consentId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      consentId: row.consent_id,
      consentStatus: row.consent_status,
      consentType: row.consent_type,
      frequencyPerDay: row.frequency_per_day,
      recurringIndicator: row.recurring_indicator,
      validUntil: row.valid_until.toISOString(),
      lastActionDate: row.last_action_date.toISOString(),
      psuId: row.psu_id,
      tppId: row.tpp_id,
      accounts: row.accounts ? JSON.parse(row.accounts) : undefined,
      balances: row.balances ? JSON.parse(row.balances) : undefined,
      transactions: row.transactions ? JSON.parse(row.transactions) : undefined,
      payments: row.payments ? JSON.parse(row.payments) : undefined,
      fundsConfirmations: row.funds_confirmations ? JSON.parse(row.funds_confirmations) : undefined
    };
  }

  // Update consent status
  static async updateConsentStatus(consentId: string, status: string): Promise<void> {
    await pool.query(
      'UPDATE open_banking_consents SET consent_status = $1, last_action_date = NOW(), updated_at = NOW() WHERE consent_id = $2',
      [status, consentId]
    );
  }

  // Get consents by TPP
  static async getConsentsByTpp(tppId: string): Promise<OpenBankingConsent[]> {
    const result = await pool.query(
      'SELECT * FROM open_banking_consents WHERE tpp_id = $1 ORDER BY created_at DESC',
      [tppId]
    );

    return result.rows.map(row => ({
      consentId: row.consent_id,
      consentStatus: row.consent_status,
      consentType: row.consent_type,
      frequencyPerDay: row.frequency_per_day,
      recurringIndicator: row.recurring_indicator,
      validUntil: row.valid_until.toISOString(),
      lastActionDate: row.last_action_date.toISOString(),
      psuId: row.psu_id,
      tppId: row.tpp_id,
      accounts: row.accounts ? JSON.parse(row.accounts) : undefined,
      balances: row.balances ? JSON.parse(row.balances) : undefined,
      transactions: row.transactions ? JSON.parse(row.transactions) : undefined,
      payments: row.payments ? JSON.parse(row.payments) : undefined,
      fundsConfirmations: row.funds_confirmations ? JSON.parse(row.funds_confirmations) : undefined
    }));
  }

  // Get expired consents
  static async getExpiredConsents(): Promise<OpenBankingConsent[]> {
    const result = await pool.query(
      'SELECT * FROM open_banking_consents WHERE valid_until < NOW() AND consent_status = $1',
      ['valid']
    );

    return result.rows.map(row => ({
      consentId: row.consent_id,
      consentStatus: row.consent_status,
      consentType: row.consent_type,
      frequencyPerDay: row.frequency_per_day,
      recurringIndicator: row.recurring_indicator,
      validUntil: row.valid_until.toISOString(),
      lastActionDate: row.last_action_date.toISOString(),
      psuId: row.psu_id,
      tppId: row.tpp_id,
      accounts: row.accounts ? JSON.parse(row.accounts) : undefined,
      balances: row.balances ? JSON.parse(row.balances) : undefined,
      transactions: row.transactions ? JSON.parse(row.transactions) : undefined,
      payments: row.payments ? JSON.parse(row.payments) : undefined,
      fundsConfirmations: row.funds_confirmations ? JSON.parse(row.funds_confirmations) : undefined
    }));
  }

  // Delete consent
  static async deleteConsent(consentId: string): Promise<void> {
    await pool.query('DELETE FROM open_banking_consents WHERE consent_id = $1', [consentId]);
  }
}