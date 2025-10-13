import pool from '../utils/database';

export class AccountQueries {
  // Insert account
  static async createAccount(user_id: number, account_number: string, account_type: string, currency: string, balance: number, status: string) {
    const result = await pool.query(
      'INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
      [user_id, account_number, account_type, currency, balance, status]
    );
    return result.rows[0];
  }

  // Update account balance
  static async updateAccountBalance(id: number, amount: number) {
    const result = await pool.query(
      'UPDATE accounts SET balance = balance + $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, amount]
    );
    return result.rows[0];
  }

  // Select account by ID
  static async getAccountById(id: number) {
    const result = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Select user accounts
  static async getUserAccounts(user_id: number) {
    const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [user_id]);
    return result.rows;
  }

  // Update account status
  static async updateAccountStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE accounts SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Insert wallet
  static async createWallet(user_id: number, account_id: number, wallet_type: string, balance: number, currency: string) {
    const result = await pool.query(
      'INSERT INTO wallets (user_id, account_id, wallet_type, balance, currency, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [user_id, account_id, wallet_type, balance, currency]
    );
    return result.rows[0];
  }

  // Update wallet balance
  static async updateWalletBalance(id: number, amount: number) {
    const result = await pool.query(
      'UPDATE wallets SET balance = balance + $2 WHERE id = $1 RETURNING *',
      [id, amount]
    );
    return result.rows[0];
  }

  // Get user wallets
  static async getUserWallets(user_id: number) {
    const result = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [user_id]);
    return result.rows;
  }

  // Insert transaction
  static async createTransaction(account_id: number, amount: number, currency: string, type: string, status: string, description?: string) {
    const result = await pool.query(
      'INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
      [account_id, amount, currency, type, status, description]
    );
    return result.rows[0];
  }

  // Update transaction status
  static async updateTransactionStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE transactions SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Select transactions by account
  static async getAccountTransactions(account_id: number, limit: number = 50, offset: number = 0) {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [account_id, limit, offset]
    );
    return result.rows;
  }

  // Get transaction by ID
  static async getTransactionById(id: number) {
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Insert transaction audit
  static async createTransactionAudit(transaction_id: number, action: string, performed_by: number) {
    await pool.query(
      'INSERT INTO transaction_audit (transaction_id, action, performed_by, timestamp) VALUES ($1, $2, $3, NOW())',
      [transaction_id, action, performed_by]
    );
  }

  // Check transaction limits
  static async getTransactionLimits(account_id: number) {
    const result = await pool.query(
      'SELECT daily_limit, monthly_limit FROM transaction_limits WHERE account_id = $1',
      [account_id]
    );
    return result.rows[0];
  }

  // Insert FX rate
  static async upsertFxRate(from_currency: string, to_currency: string, rate: number) {
    await pool.query(
      'INSERT INTO fx_rates (from_currency, to_currency, rate, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = $3, updated_at = NOW()',
      [from_currency, to_currency, rate]
    );
  }

  // Get FX rate
  static async getFxRate(from_currency: string, to_currency: string) {
    const result = await pool.query(
      'SELECT rate FROM fx_rates WHERE from_currency = $1 AND to_currency = $2',
      [from_currency, to_currency]
    );
    return result.rows[0];
  }

  // Insert interbank transfer
  static async createInterbankTransfer(from_account: number, to_account_number: string, amount: number, currency: string, status: string) {
    const result = await pool.query(
      'INSERT INTO interbank_transfers (from_account, to_account_number, amount, currency, status, initiated_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [from_account, to_account_number, amount, currency, status]
    );
    return result.rows[0];
  }

  // Update transfer status
  static async updateTransferStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE interbank_transfers SET status = $2, completed_at = CASE WHEN $2 = \'completed\' THEN NOW() ELSE NULL END WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Insert payment request
  static async createPaymentRequest(account_id: number, amount: number, currency: string, status: string) {
    const result = await pool.query(
      'INSERT INTO payment_requests (account_id, amount, currency, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [account_id, amount, currency, status]
    );
    return result.rows[0];
  }

  // Get payment requests by account
  static async getAccountPaymentRequests(account_id: number) {
    const result = await pool.query(
      'SELECT * FROM payment_requests WHERE account_id = $1 ORDER BY created_at DESC',
      [account_id]
    );
    return result.rows;
  }

  // Insert investment
  static async createInvestment(user_id: number, type: string, amount: number, currency: string) {
    const result = await pool.query(
      'INSERT INTO investments (user_id, type, amount, currency, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [user_id, type, amount, currency]
    );
    return result.rows[0];
  }

  // Insert loan
  static async createLoan(user_id: number, principal: number, interest_rate: number, term_months: number, status: string) {
    const result = await pool.query(
      'INSERT INTO loans (user_id, principal, interest_rate, term_months, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
      [user_id, principal, interest_rate, term_months, status]
    );
    return result.rows[0];
  }

  // Update loan status
  static async updateLoanStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE loans SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Insert saving
  static async createSaving(user_id: number, balance: number, interest_rate: number, currency: string) {
    const result = await pool.query(
      'INSERT INTO savings (user_id, balance, interest_rate, currency, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [user_id, balance, interest_rate, currency]
    );
    return result.rows[0];
  }

  // Update saving balance
  static async updateSavingBalance(id: number, amount: number) {
    const result = await pool.query(
      'UPDATE savings SET balance = balance + $2 WHERE id = $1 RETURNING *',
      [id, amount]
    );
    return result.rows[0];
  }

  // Insert wealth portfolio
  static async createWealthPortfolio(user_id: number, portfolio_name: string, total_value: number) {
    const result = await pool.query(
      'INSERT INTO wealth_portfolios (user_id, portfolio_name, total_value, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [user_id, portfolio_name, total_value]
    );
    return result.rows[0];
  }

  // Update wealth portfolio
  static async updateWealthPortfolioValue(id: number, total_value: number) {
    const result = await pool.query(
      'UPDATE wealth_portfolios SET total_value = $2 WHERE id = $1 RETURNING *',
      [id, total_value]
    );
    return result.rows[0];
  }

  // =========================================
  // WEAVR SYNCHRONIZATION METHODS
  // =========================================

  // Update account with Weavr data
  static async updateAccountWithWeavrData(id: number, weavrData: {
    weavr_id?: string;
    iban?: string;
    bic?: string;
    available_balance?: number;
    blocked_balance?: number;
    reserved_balance?: number;
    last_weavr_sync?: Date;
    sync_status?: string;
  }) {
    const result = await pool.query(
      `UPDATE accounts SET
        weavr_id = $2,
        iban = $3,
        bic = $4,
        available_balance = $5,
        blocked_balance = $6,
        reserved_balance = $7,
        last_weavr_sync = $8,
        sync_status = $9,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        id,
        weavrData.weavr_id || null,
        weavrData.iban || null,
        weavrData.bic || null,
        weavrData.available_balance || 0,
        weavrData.blocked_balance || 0,
        weavrData.reserved_balance || 0,
        weavrData.last_weavr_sync || new Date(),
        weavrData.sync_status || 'synced'
      ]
    );
    return result.rows[0];
  }

  // Update account sync status
  static async updateAccountSyncStatus(id: number, sync_status: string, error_message?: string) {
    const result = await pool.query(
      'UPDATE accounts SET sync_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, sync_status]
    );
    return result.rows[0];
  }

  // Update account balance from Weavr
  static async updateAccountBalanceFromWeavr(id: number, balanceData: {
    balance?: number;
    available_balance?: number;
    blocked_balance?: number;
    reserved_balance?: number;
    last_weavr_sync?: Date;
    sync_status?: string;
  }) {
    const result = await pool.query(
      `UPDATE accounts SET
        balance = $2,
        available_balance = $3,
        blocked_balance = $4,
        reserved_balance = $5,
        last_weavr_sync = $6,
        sync_status = $7,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [
        id,
        balanceData.balance || 0,
        balanceData.available_balance || 0,
        balanceData.blocked_balance || 0,
        balanceData.reserved_balance || 0,
        balanceData.last_weavr_sync || new Date(),
        balanceData.sync_status || 'synced'
      ]
    );
    return result.rows[0];
  }

  // Get account by Weavr ID
  static async getAccountByWeavrId(weavr_id: string) {
    const result = await pool.query('SELECT * FROM accounts WHERE weavr_id = $1', [weavr_id]);
    return result.rows[0];
  }

  // Record balance change in history
  static async recordBalanceChange(account_id: number, changeData: {
    change_type: string;
    previous_balance?: number;
    new_balance?: number;
    available_previous?: number;
    available_new?: number;
    blocked_previous?: number;
    blocked_new?: number;
    change_amount?: number;
    transaction_id?: number;
    weavr_transaction_id?: string;
    description?: string;
  }) {
    const result = await pool.query(
      `INSERT INTO balance_history (
        account_id, previous_balance, new_balance, available_previous, available_new,
        blocked_previous, blocked_new, change_amount, change_type, transaction_id,
        weavr_transaction_id, description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        account_id,
        changeData.previous_balance,
        changeData.new_balance,
        changeData.available_previous,
        changeData.available_new,
        changeData.blocked_previous,
        changeData.blocked_new,
        changeData.change_amount,
        changeData.change_type,
        changeData.transaction_id,
        changeData.weavr_transaction_id,
        changeData.description
      ]
    );
    return result.rows[0];
  }

  // Update transaction with Weavr ID
  static async updateTransactionWeavrId(transaction_id: number, weavr_transaction_id: string) {
    const result = await pool.query(
      'UPDATE transactions SET weavr_transaction_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [transaction_id, weavr_transaction_id]
    );
    return result.rows[0];
  }

  // Get transaction by Weavr ID
  static async getTransactionByWeavrId(weavr_transaction_id: string) {
    const result = await pool.query('SELECT * FROM transactions WHERE weavr_transaction_id = $1', [weavr_transaction_id]);
    return result.rows[0];
  }

  // Get pending sync accounts
  static async getPendingSyncAccounts() {
    const result = await pool.query(
      "SELECT * FROM accounts WHERE sync_status IN ('pending', 'failed') ORDER BY created_at ASC"
    );
    return result.rows;
  }

  // Get account with full balance details
  static async getAccountWithBalanceDetails(id: number) {
    const result = await pool.query(
      `SELECT a.*,
              COALESCE(a.available_balance, 0) as available_balance,
              COALESCE(a.blocked_balance, 0) as blocked_balance,
              COALESCE(a.reserved_balance, 0) as reserved_balance
       FROM accounts a WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Update parent master account ID
  static async updateParentMasterAccount(accountId: number, parentMasterAccountId: number) {
    const result = await pool.query(
      'UPDATE accounts SET parent_master_account_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [accountId, parentMasterAccountId]
    );
    return result.rows[0];
  }

  // Get all accounts (for admin/health checks)
  static async getAllAccounts(limit: number = 100) {
    const result = await pool.query(
      'SELECT * FROM accounts ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  // =========================================
  // MIRRORED ACCOUNTS METHODS
  // =========================================

  // Create a mirrored account
  static async createMirroredAccount(masterAccountId: number, userId: number, accountData: {
    account_number?: string;
    account_type?: string;
    currency?: string;
    mirror_type?: 'full' | 'partial';
    proportion?: number;
  }) {
    // First create the account
    const accountResult = await pool.query(
      `INSERT INTO accounts (
        user_id, account_number, account_type, currency, balance, status,
        parent_master_account_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
      [
        userId,
        accountData.account_number || null,
        accountData.account_type || 'individual',
        accountData.currency || 'EUR',
        0, // initial balance 0
        'active',
        masterAccountId
      ]
    );

    const mirroredAccountId = accountResult.rows[0].id;

    // Create mirror relationship
    await pool.query(
      `INSERT INTO account_mirrors (
        master_account_id, mirrored_account_id, mirror_type, proportion
      ) VALUES ($1, $2, $3, $4)`,
      [
        masterAccountId,
        mirroredAccountId,
        accountData.mirror_type || 'full',
        accountData.proportion || 1.0
      ]
    );

    return mirroredAccountId;
  }

  // Get mirrored accounts for a master account
  static async getMirroredAccounts(masterAccountId: number) {
    const result = await pool.query(
      `SELECT a.*, am.mirror_type, am.proportion, am.sync_enabled
       FROM accounts a
       JOIN account_mirrors am ON a.id = am.mirrored_account_id
       WHERE am.master_account_id = $1`,
      [masterAccountId]
    );
    return result.rows;
  }

  // Sync balance from master to mirrored account
  static async syncMirrorBalance(masterAccountId: number, mirroredAccountId: number) {
    // Get master balance
    const master = await this.getAccountById(masterAccountId);
    if (!master) throw new Error('Master account not found');

    // Get mirror config
    const mirrorResult = await pool.query(
      'SELECT * FROM account_mirrors WHERE master_account_id = $1 AND mirrored_account_id = $2',
      [masterAccountId, mirroredAccountId]
    );
    const mirror = mirrorResult.rows[0];
    if (!mirror || !mirror.sync_enabled) return;

    // Calculate mirrored balance
    const mirroredBalance = mirror.mirror_type === 'full'
      ? master.balance
      : master.balance * mirror.proportion;

    const mirroredAvailable = mirror.mirror_type === 'full'
      ? master.available_balance
      : master.available_balance * mirror.proportion;

    // Update mirrored account
    await pool.query(
      `UPDATE accounts SET
        balance = $2,
        available_balance = $3,
        blocked_balance = $4,
        reserved_balance = $5,
        updated_at = NOW()
       WHERE id = $1`,
      [
        mirroredAccountId,
        mirroredBalance,
        mirroredAvailable,
        mirror.mirror_type === 'full' ? master.blocked_balance : master.blocked_balance * mirror.proportion,
        mirror.mirror_type === 'full' ? master.reserved_balance : master.reserved_balance * mirror.proportion
      ]
    );

    // Record in balance history
    await this.recordBalanceChange(mirroredAccountId, {
      change_type: 'mirror_sync',
      new_balance: mirroredBalance,
      available_new: mirroredAvailable,
      description: `Synced from master account ${masterAccountId}`
    });
  }

  // Enable/disable mirror sync
  static async setMirrorSync(mirroredAccountId: number, enabled: boolean) {
    await pool.query(
      'UPDATE account_mirrors SET sync_enabled = $2, updated_at = NOW() WHERE mirrored_account_id = $1',
      [mirroredAccountId, enabled]
    );
  }
}