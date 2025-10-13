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

  // =========================================
  // WEAVR SYNCHRONIZATION METHODS
  // =========================================

  // Get card by Weavr ID
  static async getCardByWeavrId(weavr_id: string) {
    const result = await pool.query('SELECT * FROM vibans_cards WHERE weavr_id = $1', [weavr_id]);
    return result.rows[0];
  }

  // Update card with Weavr data
  static async updateCardWithWeavrData(id: number, weavrData: {
    weavr_id?: string;
    last_weavr_sync?: Date;
    sync_status?: string;
  }) {
    const result = await pool.query(
      `UPDATE vibans_cards SET
        weavr_id = $2,
        last_weavr_sync = $3,
        sync_status = $4
       WHERE id = $1 RETURNING *`,
      [
        id,
        weavrData.weavr_id || null,
        weavrData.last_weavr_sync || new Date(),
        weavrData.sync_status || 'synced'
      ]
    );
    return result.rows[0];
  }

  // Get pending sync cards
  static async getPendingSyncCards() {
    const result = await pool.query(
      "SELECT * FROM vibans_cards WHERE sync_status IN ('pending', 'failed') ORDER BY created_at ASC"
    );
    return result.rows;
  }
  // =========================================
  // WALLET PREPARATION METHODS
  // =========================================

  // Prepare card for wallet (store sensitive details temporarily)
  static async prepareCardForWallet(cardId: number, walletData: {
    card_number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
    name_on_card: string;
  }) {
    const result = await pool.query(
      `UPDATE vibans_cards SET
        wallet_ready = TRUE,
        wallet_card_number = $2,
        wallet_cvv = $3,
        wallet_expiry_month = $4,
        wallet_expiry_year = $5,
        wallet_name_on_card = $6,
        wallet_last_accessed = NOW()
       WHERE id = $1 RETURNING *`,
      [
        cardId,
        walletData.card_number,
        walletData.cvv,
        walletData.expiry_month,
        walletData.expiry_year,
        walletData.name_on_card
      ]
    );
    return result.rows[0];
  }

  // Get wallet details for card (one-time access, then clear sensitive data)
  static async getCardWalletDetails(cardId: number) {
    const result = await pool.query(
      `SELECT
        wallet_ready,
        wallet_card_number,
        wallet_cvv,
        wallet_expiry_month,
        wallet_expiry_year,
        wallet_name_on_card,
        wallet_last_accessed
       FROM vibans_cards WHERE id = $1`,
      [cardId]
    );

    const card = result.rows[0];
    if (!card || !card.wallet_ready) return null;

    // Clear sensitive data after access
    await pool.query(
      `UPDATE vibans_cards SET
        wallet_cvv = NULL,
        wallet_last_accessed = NOW()
       WHERE id = $1`,
      [cardId]
    );

    return {
      card_number: card.wallet_card_number,
      cvv: card.wallet_cvv, // Will be null after this call
      expiry_month: card.wallet_expiry_month,
      expiry_year: card.wallet_expiry_year,
      name_on_card: card.wallet_name_on_card,
      last_accessed: card.wallet_last_accessed
    };
  }

  // Clear wallet details (for security)
  static async clearCardWalletDetails(cardId: number) {
    await pool.query(
      `UPDATE vibans_cards SET
        wallet_ready = FALSE,
        wallet_card_number = NULL,
        wallet_cvv = NULL,
        wallet_expiry_month = NULL,
        wallet_expiry_year = NULL,
        wallet_name_on_card = NULL,
        wallet_last_accessed = NOW()
       WHERE id = $1`,
      [cardId]
    );
  }

  // =========================================
  // CARD PROVISIONING METHODS
  // =========================================

  // Create provisioning record
  static async createProvisioningRecord(cardId: string, walletType: 'apple_pay' | 'google_pay', deviceId?: string, walletAccountId?: string) {
    const result = await pool.query(
      `INSERT INTO card_provisioning (
        card_id, wallet_type, device_id, wallet_account_id
      ) VALUES ($1, $2, $3, $4) RETURNING *`,
      [cardId, walletType, deviceId, walletAccountId]
    );
    return result.rows[0];
  }

  // Update provisioning status
  static async updateProvisioningStatus(id: number, status: string, errorMessage?: string) {
    const result = await pool.query(
      `UPDATE card_provisioning SET
        status = $2,
        error_message = $3,
        last_attempt = NOW(),
        provisioned_at = CASE WHEN $2 = 'success' THEN NOW() ELSE provisioned_at END,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, status, errorMessage]
    );
    return result.rows[0];
  }

  // Get provisioning record
  static async getProvisioningRecord(cardId: string, walletType: 'apple_pay' | 'google_pay') {
    const result = await pool.query(
      'SELECT * FROM card_provisioning WHERE card_id = $1 AND wallet_type = $2',
      [cardId, walletType]
    );
    return result.rows[0];
  }

  // Get all provisioning records for card
  static async getCardProvisioningRecords(cardId: string) {
    const result = await pool.query(
      'SELECT * FROM card_provisioning WHERE card_id = $1 ORDER BY created_at DESC',
      [cardId]
    );
    return result.rows;
  }

  // Revoke provisioning
  static async revokeProvisioning(cardId: string, walletType: 'apple_pay' | 'google_pay') {
    const result = await pool.query(
      `UPDATE card_provisioning SET
        status = 'revoked',
        updated_at = NOW()
       WHERE card_id = $1 AND wallet_type = $2 RETURNING *`,
      [cardId, walletType]
    );
    return result.rows[0];
  }
}