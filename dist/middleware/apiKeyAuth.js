"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClientKey = exports.requireServerKey = exports.authenticateApiKey = void 0;
const authQueries_1 = require("../queries/authQueries");
const authenticateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
        const apiSecret = req.headers['x-api-secret'] || req.headers['api_secret'];
        if (!apiKey || !apiSecret) {
            return res.status(401).json({
                error: 'API key and secret required',
                code: 'MISSING_API_CREDENTIALS'
            });
        }
        const apiKeyData = await authQueries_1.AuthQueries.getApiKey(apiKey, apiSecret);
        if (!apiKeyData) {
            return res.status(401).json({
                error: 'Invalid or expired API credentials',
                code: 'INVALID_API_CREDENTIALS'
            });
        }
        req.apiKey = {
            id: apiKeyData.id,
            user_id: apiKeyData.user_id,
            type: apiKeyData.type,
            expires_at: apiKeyData.expires_at
        };
        next();
    }
    catch (error) {
        console.error('Error authenticating API key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authenticateApiKey = authenticateApiKey;
const requireServerKey = (req, res, next) => {
    if (!req.apiKey || req.apiKey.type !== 'server') {
        return res.status(403).json({
            error: 'Server API key required',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};
exports.requireServerKey = requireServerKey;
const requireClientKey = (req, res, next) => {
    if (!req.apiKey || req.apiKey.type !== 'client') {
        return res.status(403).json({
            error: 'Client API key required',
            code: 'INSUFFICIENT_PERMISSIONS'
        });
    }
    next();
};
exports.requireClientKey = requireClientKey;
