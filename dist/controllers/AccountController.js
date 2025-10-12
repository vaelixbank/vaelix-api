"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const accountQueries_1 = require("../queries/accountQueries");
class AccountController {
    static async getAllAccounts(req, res) {
        try {
            // For admin purposes - get all accounts
            // This would need a separate query in AccountQueries
            res.status(501).json({ error: 'Not implemented yet' });
        }
        catch (error) {
            console.error('Error fetching accounts:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountById(req, res) {
        try {
            const { id } = req.params;
            const account = await accountQueries_1.AccountQueries.getAccountById(parseInt(id));
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json(account);
        }
        catch (error) {
            console.error('Error fetching account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountBalance(req, res) {
        try {
            const { id } = req.params;
            const account = await accountQueries_1.AccountQueries.getAccountById(parseInt(id));
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json({
                account_id: account.id,
                balance: account.balance,
                currency: account.currency,
                last_updated: account.updated_at
            });
        }
        catch (error) {
            console.error('Error fetching account balance:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountsByUserId(req, res) {
        try {
            const { userId } = req.params;
            const accounts = await accountQueries_1.AccountQueries.getUserAccounts(parseInt(userId));
            res.json(accounts);
        }
        catch (error) {
            console.error('Error fetching user accounts:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createAccount(req, res) {
        try {
            const { user_id, account_number, account_type, currency = 'EUR', balance = 0, status = 'active' } = req.body;
            const account = await accountQueries_1.AccountQueries.createAccount(user_id, account_number, account_type, currency, balance, status);
            res.status(201).json(account);
        }
        catch (error) {
            console.error('Error creating account:', error);
            if (error.code === '23505') {
                res.status(409).json({ error: 'Account number already exists' });
            }
            else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    static async updateAccount(req, res) {
        try {
            const { id } = req.params;
            const { account_number, account_type, balance, status } = req.body;
            const account = await accountQueries_1.AccountQueries.updateAccountStatus(parseInt(id), status || 'active');
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json(account);
        }
        catch (error) {
            console.error('Error updating account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateAccountBalance(req, res) {
        try {
            const { id } = req.params;
            const { amount } = req.body;
            if (typeof amount !== 'number') {
                return res.status(400).json({ error: 'Amount must be a number' });
            }
            const account = await accountQueries_1.AccountQueries.updateAccountBalance(parseInt(id), amount);
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json({
                account_id: account.id,
                new_balance: account.balance,
                currency: account.currency,
                updated_at: account.updated_at
            });
        }
        catch (error) {
            console.error('Error updating account balance:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async closeAccount(req, res) {
        try {
            const { id } = req.params;
            const account = await accountQueries_1.AccountQueries.updateAccountStatus(parseInt(id), 'closed');
            if (!account) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json({ message: 'Account closed successfully' });
        }
        catch (error) {
            console.error('Error closing account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountTransactions(req, res) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const transactions = await accountQueries_1.AccountQueries.getAccountTransactions(parseInt(id), limit, offset);
            res.json(transactions);
        }
        catch (error) {
            console.error('Error fetching account transactions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // =========================================
    // VIRTUAL IBAN (vIBAN) MANAGEMENT
    // =========================================
    static async upgradeAccountToIBAN(req, res) {
        try {
            const { id } = req.params;
            const accountId = parseInt(id);
            // Get API credentials from headers or environment
            const apiKey = req.headers['x-api-key'] || process.env.WEAVR_API_KEY;
            const authToken = req.headers['auth_token'];
            if (!apiKey || !authToken) {
                return res.status(400).json({ error: 'API key and auth token required' });
            }
            const { weavrSyncService } = await Promise.resolve().then(() => __importStar(require('../services/weavrSyncService')));
            const result = await weavrSyncService.upgradeAccountToIBAN(accountId, apiKey, authToken);
            if (result.success) {
                res.json({
                    message: 'IBAN upgrade initiated successfully',
                    account_id: accountId,
                    weavr_id: result.weavrId,
                    status: 'processing'
                });
            }
            else {
                res.status(400).json({
                    error: 'IBAN upgrade failed',
                    details: result.error
                });
            }
        }
        catch (error) {
            console.error('Error upgrading account to IBAN:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountIBAN(req, res) {
        try {
            const { id } = req.params;
            const accountId = parseInt(id);
            // Get API credentials from headers or environment
            const apiKey = req.headers['x-api-key'] || process.env.WEAVR_API_KEY;
            const authToken = req.headers['auth_token'];
            if (!apiKey || !authToken) {
                return res.status(400).json({ error: 'API key and auth token required' });
            }
            const { weavrSyncService } = await Promise.resolve().then(() => __importStar(require('../services/weavrSyncService')));
            const ibanData = await weavrSyncService.getAccountIBAN(accountId, apiKey, authToken);
            if (ibanData) {
                res.json({
                    account_id: accountId,
                    iban: ibanData.iban,
                    bic: ibanData.bic,
                    state: ibanData.state
                });
            }
            else {
                res.status(404).json({ error: 'IBAN not found or account not synced with Weavr' });
            }
        }
        catch (error) {
            console.error('Error fetching account IBAN:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AccountController = AccountController;
