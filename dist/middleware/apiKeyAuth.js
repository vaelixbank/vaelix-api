"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClientKey = exports.requireServerKey = exports.authenticateApiKey = void 0;
const database_1 = __importDefault(require("../utils/database"));
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
        const result = await database_1.default.query('SELECT id, user_id, type, expires_at FROM api_keys WHERE key = $1 AND secret = $2 AND (expires_at IS NULL OR expires_at > NOW())', [apiKey, apiSecret]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid or expired API credentials',
                code: 'INVALID_API_CREDENTIALS'
            });
        }
        req.apiKey = result.rows[0];
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
