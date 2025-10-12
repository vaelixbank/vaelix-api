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
}