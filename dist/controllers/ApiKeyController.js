"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyController = void 0;
const authQueries_1 = require("../queries/authQueries");
const crypto_1 = __importDefault(require("crypto"));
class ApiKeyController {
    static async getAllApiKeys(req, res) {
        try {
            // This would need a separate query in AuthQueries for admin access
            res.status(501).json({ error: 'Not implemented yet' });
        }
        catch (error) {
            console.error('Error fetching API keys:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getApiKeysByUser(req, res) {
        try {
            const { userId } = req.params;
            const apiKeys = await authQueries_1.AuthQueries.getUserApiKeys(parseInt(userId));
            res.json(apiKeys);
        }
        catch (error) {
            console.error('Error fetching user API keys:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createApiKey(req, res) {
        try {
            const { user_id, description } = req.body;
            // Generate unique key and secret
            const key = crypto_1.default.randomBytes(32).toString('hex');
            const secret = crypto_1.default.randomBytes(64).toString('hex');
            const apiKey = await authQueries_1.AuthQueries.createApiKey(user_id, key, secret, description);
            // Return key and secret only on creation (don't store secret in DB for security)
            res.status(201).json({
                id: apiKey.id,
                user_id: apiKey.user_id,
                key: apiKey.key,
                secret: secret, // Return the secret only once
                description: apiKey.description,
                created_at: apiKey.created_at
            });
        }
        catch (error) {
            console.error('Error creating API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateApiKey(req, res) {
        try {
            // TODO: Implement update API key in AuthQueries
            res.status(501).json({ error: 'Not implemented yet' });
        }
        catch (error) {
            console.error('Error updating API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async deleteApiKey(req, res) {
        try {
            // TODO: Implement delete API key in AuthQueries
            res.status(501).json({ error: 'Not implemented yet' });
        }
        catch (error) {
            console.error('Error deleting API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async validateApiKey(req, res) {
        try {
            const { key, secret } = req.body;
            const apiKey = await authQueries_1.AuthQueries.getApiKey(key, secret);
            if (!apiKey) {
                return res.status(401).json({ error: 'Invalid or expired API key' });
            }
            res.json({
                valid: true,
                user_id: apiKey.user_id,
                expires_at: apiKey.expires_at
            });
        }
        catch (error) {
            console.error('Error validating API key:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ApiKeyController = ApiKeyController;
