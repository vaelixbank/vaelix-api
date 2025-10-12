"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountQueries = void 0;
const database_1 = __importDefault(require("../utils/database"));
class AccountQueries {
    // Insert account
    static async createAccount(user_id, account_number, account_type, currency, balance, status) {
        const result = await database_1.default.query('INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id', [user_id, account_number, account_type, currency, balance, status]);
        return result.rows[0];
    }
    // Update account balance
    static async updateAccountBalance(id, amount) {
        const result = await database_1.default.query('UPDATE accounts SET balance = balance + $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, amount]);
        return result.rows[0];
    }
    // Select account by ID
    static async getAccountById(id) {
        const result = await database_1.default.query('SELECT * FROM accounts WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Select user accounts
    static async getUserAccounts(user_id) {
        const result = await database_1.default.query('SELECT * FROM accounts WHERE user_id = $1', [user_id]);
        return result.rows;
    }
    // Update account status
    static async updateAccountStatus(id, status) {
        const result = await database_1.default.query('UPDATE accounts SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, status]);
        return result.rows[0];
    }
    // Insert wallet
    static async createWallet(user_id, account_id, wallet_type, balance, currency) {
        const result = await database_1.default.query('INSERT INTO wallets (user_id, account_id, wallet_type, balance, currency, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id', [user_id, account_id, wallet_type, balance, currency]);
        return result.rows[0];
    }
    // Update wallet balance
    static async updateWalletBalance(id, amount) {
        const result = await database_1.default.query('UPDATE wallets SET balance = balance + $2 WHERE id = $1 RETURNING *', [id, amount]);
        return result.rows[0];
    }
    // Get user wallets
    static async getUserWallets(user_id) {
        const result = await database_1.default.query('SELECT * FROM wallets WHERE user_id = $1', [user_id]);
        return result.rows;
    }
    // Insert transaction
    static async createTransaction(account_id, amount, currency, type, status, description) {
        const result = await database_1.default.query('INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id', [account_id, amount, currency, type, status, description]);
        return result.rows[0];
    }
    // Update transaction status
    static async updateTransactionStatus(id, status) {
        const result = await database_1.default.query('UPDATE transactions SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, status]);
        return result.rows[0];
    }
    // Select transactions by account
    static async getAccountTransactions(account_id, limit = 50, offset = 0) {
        const result = await database_1.default.query('SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [account_id, limit, offset]);
        return result.rows;
    }
    // Get transaction by ID
    static async getTransactionById(id) {
        const result = await database_1.default.query('SELECT * FROM transactions WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Insert transaction audit
    static async createTransactionAudit(transaction_id, action, performed_by) {
        await database_1.default.query('INSERT INTO transaction_audit (transaction_id, action, performed_by, timestamp) VALUES ($1, $2, $3, NOW())', [transaction_id, action, performed_by]);
    }
    // Check transaction limits
    static async getTransactionLimits(account_id) {
        const result = await database_1.default.query('SELECT daily_limit, monthly_limit FROM transaction_limits WHERE account_id = $1', [account_id]);
        return result.rows[0];
    }
    // Insert FX rate
    static async upsertFxRate(from_currency, to_currency, rate) {
        await database_1.default.query('INSERT INTO fx_rates (from_currency, to_currency, rate, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = $3, updated_at = NOW()', [from_currency, to_currency, rate]);
    }
    // Get FX rate
    static async getFxRate(from_currency, to_currency) {
        const result = await database_1.default.query('SELECT rate FROM fx_rates WHERE from_currency = $1 AND to_currency = $2', [from_currency, to_currency]);
        return result.rows[0];
    }
    // Insert interbank transfer
    static async createInterbankTransfer(from_account, to_account_number, amount, currency, status) {
        const result = await database_1.default.query('INSERT INTO interbank_transfers (from_account, to_account_number, amount, currency, status, initiated_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id', [from_account, to_account_number, amount, currency, status]);
        return result.rows[0];
    }
    // Update transfer status
    static async updateTransferStatus(id, status) {
        const result = await database_1.default.query('UPDATE interbank_transfers SET status = $2, completed_at = CASE WHEN $2 = \'completed\' THEN NOW() ELSE NULL END WHERE id = $1 RETURNING *', [id, status]);
        return result.rows[0];
    }
    // Insert payment request
    static async createPaymentRequest(account_id, amount, currency, status) {
        const result = await database_1.default.query('INSERT INTO payment_requests (account_id, amount, currency, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id', [account_id, amount, currency, status]);
        return result.rows[0];
    }
    // Get payment requests by account
    static async getAccountPaymentRequests(account_id) {
        const result = await database_1.default.query('SELECT * FROM payment_requests WHERE account_id = $1 ORDER BY created_at DESC', [account_id]);
        return result.rows;
    }
    // Insert investment
    static async createInvestment(user_id, type, amount, currency) {
        const result = await database_1.default.query('INSERT INTO investments (user_id, type, amount, currency, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id', [user_id, type, amount, currency]);
        return result.rows[0];
    }
    // Insert loan
    static async createLoan(user_id, principal, interest_rate, term_months, status) {
        const result = await database_1.default.query('INSERT INTO loans (user_id, principal, interest_rate, term_months, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id', [user_id, principal, interest_rate, term_months, status]);
        return result.rows[0];
    }
    // Update loan status
    static async updateLoanStatus(id, status) {
        const result = await database_1.default.query('UPDATE loans SET status = $2 WHERE id = $1 RETURNING *', [id, status]);
        return result.rows[0];
    }
    // Insert saving
    static async createSaving(user_id, balance, interest_rate, currency) {
        const result = await database_1.default.query('INSERT INTO savings (user_id, balance, interest_rate, currency, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id', [user_id, balance, interest_rate, currency]);
        return result.rows[0];
    }
    // Update saving balance
    static async updateSavingBalance(id, amount) {
        const result = await database_1.default.query('UPDATE savings SET balance = balance + $2 WHERE id = $1 RETURNING *', [id, amount]);
        return result.rows[0];
    }
    // Insert wealth portfolio
    static async createWealthPortfolio(user_id, portfolio_name, total_value) {
        const result = await database_1.default.query('INSERT INTO wealth_portfolios (user_id, portfolio_name, total_value, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id', [user_id, portfolio_name, total_value]);
        return result.rows[0];
    }
    // Update wealth portfolio
    static async updateWealthPortfolioValue(id, total_value) {
        const result = await database_1.default.query('UPDATE wealth_portfolios SET total_value = $2 WHERE id = $1 RETURNING *', [id, total_value]);
        return result.rows[0];
    }
    // =========================================
    // WEAVR SYNCHRONIZATION METHODS
    // =========================================
    // Update account with Weavr data
    static async updateAccountWithWeavrData(id, weavrData) {
        const result = await database_1.default.query(`UPDATE accounts SET
        weavr_id = $2,
        iban = $3,
        bic = $4,
        available_balance = $5,
        blocked_balance = $6,
        reserved_balance = $7,
        last_weavr_sync = $8,
        sync_status = $9,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`, [
            id,
            weavrData.weavr_id || null,
            weavrData.iban || null,
            weavrData.bic || null,
            weavrData.available_balance || 0,
            weavrData.blocked_balance || 0,
            weavrData.reserved_balance || 0,
            weavrData.last_weavr_sync || new Date(),
            weavrData.sync_status || 'synced'
        ]);
        return result.rows[0];
    }
    // Update account sync status
    static async updateAccountSyncStatus(id, sync_status, error_message) {
        const result = await database_1.default.query('UPDATE accounts SET sync_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, sync_status]);
        return result.rows[0];
    }
    // Update account balance from Weavr
    static async updateAccountBalanceFromWeavr(id, balanceData) {
        const result = await database_1.default.query(`UPDATE accounts SET
        balance = $2,
        available_balance = $3,
        blocked_balance = $4,
        reserved_balance = $5,
        last_weavr_sync = $6,
        sync_status = $7,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`, [
            id,
            balanceData.balance || 0,
            balanceData.available_balance || 0,
            balanceData.blocked_balance || 0,
            balanceData.reserved_balance || 0,
            balanceData.last_weavr_sync || new Date(),
            balanceData.sync_status || 'synced'
        ]);
        return result.rows[0];
    }
    // Get account by Weavr ID
    static async getAccountByWeavrId(weavr_id) {
        const result = await database_1.default.query('SELECT * FROM accounts WHERE weavr_id = $1', [weavr_id]);
        return result.rows[0];
    }
    // Record balance change in history
    static async recordBalanceChange(account_id, changeData) {
        const result = await database_1.default.query(`INSERT INTO balance_history (
        account_id, previous_balance, new_balance, available_previous, available_new,
        blocked_previous, blocked_new, change_amount, change_type, transaction_id,
        weavr_transaction_id, description, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`, [
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
        ]);
        return result.rows[0];
    }
    // Update transaction with Weavr ID
    static async updateTransactionWeavrId(transaction_id, weavr_transaction_id) {
        const result = await database_1.default.query('UPDATE transactions SET weavr_transaction_id = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [transaction_id, weavr_transaction_id]);
        return result.rows[0];
    }
    // Get transaction by Weavr ID
    static async getTransactionByWeavrId(weavr_transaction_id) {
        const result = await database_1.default.query('SELECT * FROM transactions WHERE weavr_transaction_id = $1', [weavr_transaction_id]);
        return result.rows[0];
    }
    // Get pending sync accounts
    static async getPendingSyncAccounts() {
        const result = await database_1.default.query("SELECT * FROM accounts WHERE sync_status IN ('pending', 'failed') ORDER BY created_at ASC");
        return result.rows;
    }
    // Get account with full balance details
    static async getAccountWithBalanceDetails(id) {
        const result = await database_1.default.query(`SELECT a.*,
              COALESCE(a.available_balance, 0) as available_balance,
              COALESCE(a.blocked_balance, 0) as blocked_balance,
              COALESCE(a.reserved_balance, 0) as reserved_balance
       FROM accounts a WHERE a.id = $1`, [id]);
        return result.rows[0];
    }
    // Get all accounts (for admin/health checks)
    static async getAllAccounts(limit = 100) {
        const result = await database_1.default.query('SELECT * FROM accounts ORDER BY created_at DESC LIMIT $1', [limit]);
        return result.rows;
    }
}
exports.AccountQueries = AccountQueries;
