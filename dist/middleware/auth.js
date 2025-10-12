"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['api_key'];
    const authToken = req.headers['authorization'] || req.headers['auth_token'];
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }
    if (!authToken) {
        return res.status(401).json({ error: 'Auth token required' });
    }
    req.apiKey = apiKey;
    req.authToken = authToken.replace('Bearer ', ''); // Remove Bearer prefix if present
    next();
};
exports.authenticate = authenticate;
