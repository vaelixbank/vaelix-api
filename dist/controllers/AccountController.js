"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountController = void 0;
const database_1 = __importDefault(require("../utils/database"));
class AccountController {
    static async getAllAccounts(req, res) {
        try {
            const result = await database_1.default.query('SELECT * FROM accounts ORDER BY created_at DESC');
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching accounts:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountById(req, res) {
        try {
            const { id } = req.params;
            const result = await database_1.default.query('SELECT * FROM accounts WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Error fetching account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getAccountsByUserId(req, res) {
        try {
            const { userId } = req.params;
            const result = await database_1.default.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            res.json(result.rows);
        }
        catch (error) {
            console.error('Error fetching user accounts:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createAccount(req, res) {
        try {
            const { user_id, account_number, account_type, currency, balance, status } = req.body;
            const result = await database_1.default.query('INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [user_id, account_number, account_type, currency || 'EUR', balance || 0, status || 'active']);
            res.status(201).json(result.rows[0]);
        }
        catch (error) {
            console.error('Error creating account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateAccount(req, res) {
        try {
            const { id } = req.params;
            const { account_number, account_type, balance, status } = req.body;
            const result = await database_1.default.query('UPDATE accounts SET account_number = COALESCE($1, account_number), account_type = COALESCE($2, account_type), balance = COALESCE($3, balance), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING *', [account_number, account_type, balance, status, id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json(result.rows[0]);
        }
        catch (error) {
            console.error('Error updating account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async deleteAccount(req, res) {
        try {
            const { id } = req.params;
            const result = await database_1.default.query('DELETE FROM accounts WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.json({ message: 'Account deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting account:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AccountController = AccountController;
