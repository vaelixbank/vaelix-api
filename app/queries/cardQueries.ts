import pool from '../utils/database';

export class CardQueries {
  // Insert VIBAN/Card
  static async createVibanCard(user_id: number, viban_id: string, iban: string, currency: string, status: string) {
    const result = await pool.query(
      'INSERT INTO vibans_cards (user_id, viban_id, iban, currency, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [user_id, viban_id, iban, currency, status]
    );
    return result.rows[0];
  }

  // Update card status
  static async updateCardStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE vibans_cards SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Select user cards
  static async getUserCards(user_id: number) {
    const result = await pool.query('SELECT * FROM vibans_cards WHERE user_id = $1', [user_id]);
    return result.rows;
  }

  // Get card by ID
  static async getCardById(id: number) {
    const result = await pool.query('SELECT * FROM vibans_cards WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Get card by VIBAN ID
  static async getCardByVibanId(viban_id: string) {
    const result = await pool.query('SELECT * FROM vibans_cards WHERE viban_id = $1', [viban_id]);
    return result.rows[0];
  }

  // Insert card transaction
  static async createCardTransaction(card_id: number, amount: number, currency: string, merchant: string, status: string) {
    const result = await pool.query(
      'INSERT INTO card_transactions (card_id, amount, currency, merchant, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [card_id, amount, currency, merchant, status]
    );
    return result.rows[0];
  }

  // Update card transaction status
  static async updateCardTransactionStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE card_transactions SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Select card transactions
  static async getCardTransactions(card_id: number, limit: number = 50, offset: number = 0) {
    const result = await pool.query(
      'SELECT * FROM card_transactions WHERE card_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [card_id, limit, offset]
    );
    return result.rows;
  }

  // Get card transaction by ID
  static async getCardTransactionById(id: number) {
    const result = await pool.query('SELECT * FROM card_transactions WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Insert fraud detection
  static async createFraudDetection(transaction_id: number, risk_level: string) {
    await pool.query(
      'INSERT INTO fraud_detection (transaction_id, risk_level, flagged_at) VALUES ($1, $2, NOW())',
      [transaction_id, risk_level]
    );
  }

  // Get fraud detections for transaction
  static async getFraudDetections(transaction_id: number) {
    const result = await pool.query(
      'SELECT * FROM fraud_detection WHERE transaction_id = $1 ORDER BY flagged_at DESC',
      [transaction_id]
    );
    return result.rows;
  }

  // Insert insurance contract
  static async createInsuranceContract(user_id: number, policy_number: string, coverage_amount: number, status: string, start_date: string, end_date: string) {
    const result = await pool.query(
      'INSERT INTO insurance_contracts (user_id, policy_number, coverage_amount, status, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [user_id, policy_number, coverage_amount, status, start_date, end_date]
    );
    return result.rows[0];
  }

  // Get user insurance contracts
  static async getUserInsuranceContracts(user_id: number) {
    const result = await pool.query(
      'SELECT * FROM insurance_contracts WHERE user_id = $1 ORDER BY start_date DESC',
      [user_id]
    );
    return result.rows;
  }

  // Insert KYC document
  static async createKycDocument(user_id: number, document_type: string, document_url: string, status: string) {
    const result = await pool.query(
      'INSERT INTO kyc_documents (user_id, document_type, document_url, status, uploaded_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [user_id, document_type, document_url, status]
    );
    return result.rows[0];
  }

  // Update KYC document status
  static async updateKycDocumentStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE kyc_documents SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Get user KYC documents
  static async getUserKycDocuments(user_id: number) {
    const result = await pool.query(
      'SELECT * FROM kyc_documents WHERE user_id = $1 ORDER BY uploaded_at DESC',
      [user_id]
    );
    return result.rows;
  }

  // Insert ledger snapshot
  static async createLedgerSnapshot(total_balance: number) {
    const result = await pool.query(
      'INSERT INTO ledger_snapshots (snapshot_date, total_balance) VALUES (NOW(), $1) RETURNING id',
      [total_balance]
    );
    return result.rows[0];
  }

  // Get latest ledger snapshot
  static async getLatestLedgerSnapshot() {
    const result = await pool.query(
      'SELECT * FROM ledger_snapshots ORDER BY snapshot_date DESC LIMIT 1'
    );
    return result.rows[0];
  }

  // Insert merchant profile
  static async createMerchantProfile(name: string, merchant_id: string, country: string) {
    const result = await pool.query(
      'INSERT INTO merchant_profiles (name, merchant_id, country, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [name, merchant_id, country]
    );
    return result.rows[0];
  }

  // Get merchant by ID
  static async getMerchantById(merchant_id: string) {
    const result = await pool.query(
      'SELECT * FROM merchant_profiles WHERE merchant_id = $1',
      [merchant_id]
    );
    return result.rows[0];
  }

  // Insert OpenPayd mapping
  static async createOpenpaydMapping(viban_id: string, openpayd_account_id: string) {
    const result = await pool.query(
      'INSERT INTO openpayd_mappings (viban_id, openpayd_account_id, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [viban_id, openpayd_account_id]
    );
    return result.rows[0];
  }

  // Get OpenPayd mapping
  static async getOpenpaydMapping(viban_id: string) {
    const result = await pool.query(
      'SELECT * FROM openpayd_mappings WHERE viban_id = $1',
      [viban_id]
    );
    return result.rows[0];
  }

  // Insert partner bank
  static async createPartnerBank(name: string, swift_code: string, country: string) {
    const result = await pool.query(
      'INSERT INTO partner_banks (name, swift_code, country, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [name, swift_code, country]
    );
    return result.rows[0];
  }

  // Get all partner banks
  static async getAllPartnerBanks() {
    const result = await pool.query('SELECT * FROM partner_banks ORDER BY name');
    return result.rows;
  }

  // Insert partner integration
  static async createPartnerIntegration(partner_bank_id: number, integration_type: string) {
    const result = await pool.query(
      'INSERT INTO partner_integrations (partner_bank_id, integration_type, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [partner_bank_id, integration_type]
    );
    return result.rows[0];
  }

  // Get partner integrations
  static async getPartnerIntegrations(partner_bank_id: number) {
    const result = await pool.query(
      'SELECT * FROM partner_integrations WHERE partner_bank_id = $1',
      [partner_bank_id]
    );
    return result.rows;
  }
}